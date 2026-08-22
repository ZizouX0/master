#!/usr/bin/env python3
"""Merge the Wave-1 path CSVs into one dataset: validate the schema, dedupe
programs found by more than one path agent, and report what is missing.

Dedupe key is (normalised institution, normalised program name). When two path
agents find the same program, the row with the most filled-in fields wins and
the path letters are unioned into `path_letter`, comma-separated — which is
exactly what the mission asks for and what makes the shortlist honest about a
program serving two paths at once.
"""
import csv, glob, os, re, sys, unicodedata
from collections import defaultdict

SCHEMA = ["id","path_letter","program_name","degree_awarded","institution","institution_type",
"city","country","mobility","language_of_instruction","english_level_required",
"duration_months","ects","tuition_non_eu_eur_per_year","tuition_notes",
"intake_2027_confirmed","application_opens","application_deadline",
"deadline_source_cycle","entry_requirements_summary","accepts_engineering_bachelor",
"portfolio_or_audition_required","scholarship_available","scholarship_names",
"scholarship_coverage_level","tunisia_eligible","program_url","admissions_url",
"funding_url","source_urls","verification_status","verifier_agent","verified_date",
"red_flags","fit_notes"]

EMPTY = {"", "tbc", "TBC", "n/a", "na", "none", "-", "—", "unknown"}

def norm(s):
    s = unicodedata.normalize("NFKD", (s or "")).encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"\b(msc|ma|msc\.|m\.sc\.|m\.a\.|master(?:s)?(?: of| in| en| de)?|maestria|máster|mestrado|programme|program|degree|official|universitario)\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())

def filled(row):
    return sum(1 for k, v in row.items() if k in SCHEMA and str(v).strip() not in EMPTY)

def load(pattern):
    rows, problems = [], []
    for path in sorted(glob.glob(pattern)):
        with open(path, newline="", encoding="utf-8-sig") as fh:
            rdr = csv.DictReader(fh)
            hdr = rdr.fieldnames or []
            missing = [c for c in SCHEMA if c not in hdr]
            extra = [c for c in hdr if c not in SCHEMA]
            if missing: problems.append(f"{os.path.basename(path)}: MISSING columns {missing}")
            if extra:   problems.append(f"{os.path.basename(path)}: EXTRA columns {extra}")
            n = 0
            for r in rdr:
                r = {k: (v or "").strip() for k, v in r.items() if k}
                for c in SCHEMA: r.setdefault(c, "")
                r["_src"] = os.path.basename(path)
                rows.append(r); n += 1
            problems.append(f"{os.path.basename(path)}: {n} rows")
    return rows, problems

def merge(rows):
    buckets = defaultdict(list)
    for r in rows:
        buckets[(norm(r["institution"]), norm(r["program_name"]))].append(r)
    out = []
    for key, group in buckets.items():
        group.sort(key=filled, reverse=True)
        best = dict(group[0])
        letters, srcs = [], []
        for r in group:
            for L in re.split(r"[,\s|]+", r["path_letter"]):
                if L and L not in letters: letters.append(L)
            for u in re.split(r"\s*\|\s*", r["source_urls"]):
                if u and u not in srcs: srcs.append(u)
            # a merged row should be as complete as the union of its parts
            for c in SCHEMA:
                if str(best.get(c, "")).strip() in EMPTY and str(r.get(c, "")).strip() not in EMPTY:
                    best[c] = r[c]
        best["path_letter"] = ",".join(sorted(letters, key=lambda x: (len(x), x)))
        best["source_urls"] = "|".join(srcs)
        best["_dupes"] = len(group)
        out.append(best)
    return out

def main():
    pattern = sys.argv[1] if len(sys.argv) > 1 else "research/wave1/path_*.csv"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "research/merged_programs.csv"
    rows, problems = load(pattern)
    print("\n".join(problems))
    if not rows:
        print("no rows found for", pattern); return 1
    merged = merge(rows)
    merged.sort(key=lambda r: (r["path_letter"], r["country"], r["institution"]))
    for i, r in enumerate(merged, 1):
        r["id"] = f"{r['path_letter'].split(',')[0]}-{i:03d}"
    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=SCHEMA, extrasaction="ignore")
        w.writeheader(); w.writerows(merged)
    print(f"\n{len(rows)} raw -> {len(merged)} unique -> {out_path}")
    multi = [r for r in merged if "," in r["path_letter"]]
    print(f"{len(multi)} programs serve more than one path")
    by_country = defaultdict(int); by_status = defaultdict(int); by_path = defaultdict(int)
    for r in merged:
        by_country[r["country"] or "?"] += 1
        by_status[r["verification_status"] or "?"] += 1
        for L in r["path_letter"].split(","): by_path[L] += 1
    print("by country:", dict(sorted(by_country.items(), key=lambda x: -x[1])))
    print("by path:", dict(sorted(by_path.items())))
    print("by status:", dict(sorted(by_status.items())))
    thin = [c for c in SCHEMA if sum(1 for r in merged if str(r.get(c,"")).strip() not in EMPTY) < len(merged)*0.5]
    print("columns filled in <50% of rows:", thin)
    return 0

if __name__ == "__main__":
    sys.exit(main())
