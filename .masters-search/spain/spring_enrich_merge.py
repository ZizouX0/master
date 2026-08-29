#!/usr/bin/env python3
"""Merge the spring-intake enrichment batches onto the spring-intake dataset.

Identity is the programme's own URL, not its name.

Names were tried first and they do not work here. The same degree reaches this
script under a Catalan name, a Spanish name, an English name, and any of those
with a parenthetical the agent added; meanwhile three different universities
each run a "Master Universitario en Ciberseguridad", so a name that matches is
not evidence of the same programme and a name that differs is not evidence of a
different one. Every fuzzy threshold that rescued one case broke another: the
last of them attached MASTEAM's fees to MET and dropped MET's own record.

A URL is a fact rather than a rendering. 101 of the 102 enrichment records cite
the page their spring row came from, the 13 URLs covering more than one name
each cover exactly one degree under its variants, and nothing has to be tuned.
"""
import csv, glob, json, os, re, sys, unicodedata

ROOT   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPRING = os.path.join(ROOT, "output", "spring-intakes.csv")
ENRICH = os.path.join(ROOT, "output", "spring", "enrich")
OUT    = os.path.join(ROOT, "output", "spring-intakes-enriched.csv")

NEW_COLS = ["city", "autonomous_community", "campus", "university_awarding",
            "institution_type", "meces_level", "eqf_level", "europe_recognition",
            "diploma_supplement", "phd_access", "tuition_eu_eur",
            "tuition_non_eu_eur", "tuition_year_of_rates", "fees_extra_eur",
            "boe_order", "ruct_url", "enriched_official_status", "enrichment_sources"]

# Rows describing an institution's calendar rather than a named degree. They
# earned their place in the sweep -- they are how the February windows were
# found -- but there is no single degree to locate or price, so they are
# reported apart instead of being silently dropped.
CALENDAR = ("institution-wide", "preinscripci")

# A news item or an administrative-procedures page is not a programme page, even
# when the row names a degree: UPC's February window was evidenced from
# 'etseib.upc.edu/ca/curs-actual/tramits/preinscripcio-masters-febrer' and a FIB
# news post. The degrees themselves are in the dataset under their own pages.
NON_PROGRAMME_PATH = ("/tramits/", "/noticies/", "/noticias/", "/news/",
                      "preinscripcio-masters", "preinscripcion-master")


def fold(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def norm_url(u):
    u = re.sub(r"^https?://(www\.)?", "", (u or "").strip())
    return u.rstrip("/").lower().split("?")[0].split("#")[0]


def urls_in(text):
    return {norm_url(u) for u in re.findall(r"https?://[^\s|,)<>\"']+", text or "")}


def flat(v):
    """Agents returned `sources` as a bare string, a list of strings, and a list
    of {label,url} dicts. Take all three; a URL that vanishes is evidence lost."""
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return " ".join(str(x) for x in v.values() if x)
    if isinstance(v, list):
        return " | ".join(flat(x) for x in v if x)
    return "" if v is None else str(v)


def yes(v):
    """A spring verdict counts when it OPENS with yes. 'YES, but only for the
    online track' is a yes; 'NO -- the January date is an application deadline'
    opens with no and must not be swept in by a bare substring test."""
    return fold(v).startswith("yes")


def is_calendar(row):
    n = (row.get("programme_name") or "").lower()
    u = norm_url(row.get("url"))
    return any(k in n for k in CALENDAR) or any(k in u for k in NON_PROGRAMME_PATH)


def tri(s):
    s = " " + fold(s) + " "
    return {s[i:i + 3] for i in range(max(len(s) - 2, 1))}


def similar(a, b):
    x, y = tri(a), tri(b)
    return len(x & y) / max(len(x | y), 1)


def site(u):
    """Registrable-ish domain: the last two labels of the host."""
    return ".".join(u.split("/")[0].split(".")[-2:])


def slug(u):
    """The programme's own path segment, with the words a site puts around it
    stripped. UPC publishes each master twice -- once centrally as
    'upc.edu/en/masters/electronic-engineering-mee' and once on the school's
    microsite as 'telecos.upc.edu/ca/estudis/masters/masters-degree-in-
    electronic-engineering-mee' -- so host and path differ while the degree does
    not."""
    parts = [x for x in u.split("/")[1:] if x]
    tail = parts[-1] if parts else ""
    tail = re.sub(r"^(masters?-degree-in-|master-|masters-|el-|the-)", "", tail)
    return fold(tail)


def load_enrichment():
    """Every enrichment record, with the set of URLs it cites."""
    out = []
    paths = [p for p in glob.glob(os.path.join(ENRICH, "*.jsonl"))
             if not p.endswith("-input.jsonl")]
    for path in sorted(paths):
        for n, line in enumerate(open(path, encoding="utf-8"), 1):
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError as e:
                print("  ! unparseable %s:%d  %s" % (os.path.basename(path), n, e))
                continue
            r["_urls"] = urls_in(" ".join(flat(r.get(k, "")) for k in
                                          ("sources", "ruct_url", "url", "notes")))
            r["_src"] = os.path.basename(path)
            out.append(r)
    return out


def input_urls():
    """programme name -> the URL the batch handed the agent, for the records
    whose own `sources` did not happen to echo it back."""
    by_name = {}
    for path in glob.glob(os.path.join(ENRICH, "*-input.jsonl")):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line:
                d = json.loads(line)
                u = norm_url(d.get("url"))
                if u:
                    by_name.setdefault(fold(d.get("programme_name")), set()).add(u)
    return by_name


def main():
    with open(SPRING, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    header = list(rows[0].keys())

    groups, calendar, skipped = {}, [], 0
    for row in rows:
        if not yes(row.get("spring_intake", "")):
            skipped += 1
            continue
        if is_calendar(row):
            calendar.append(row)
            continue
        groups.setdefault(norm_url(row.get("url")), []).append(row)
    print("spring rows: %d   not a spring intake: %d   calendar records: %d"
          % (len(rows), skipped, len(calendar)))
    print("spring-intake programmes (distinct URLs): %d from %d rows"
          % (len(groups), sum(len(v) for v in groups.values())))

    # UPC publishes each master twice: once in the central catalogue and once on
    # the school's own microsite, at a different host and a different path. Two
    # URLs, one degree -- so the two groups have to be one group, or the half the
    # enrichment did not happen to cite is reported as never researched.
    # Same registrable domain and a slug that is plainly the same programme;
    # never across institutions.
    merged, seen = [], set()
    keys = sorted(groups)
    for i, a in enumerate(keys):
        if a in seen:
            continue
        same = [a]
        for bkey in keys[i + 1:]:
            if bkey in seen or site(bkey) != site(a):
                continue
            sa, sb = slug(a), slug(bkey)
            if not sa or not sb:
                continue
            # A path prefix is the same programme one level up: IE files its
            # spring dates at '.../master-business-analytics-data-science/
            # admissions', which is a subpage of the programme the agent read.
            prefix = a.startswith(bkey + "/") or bkey.startswith(a + "/")
            # Programme NAME is deliberately not a merge signal, even within one
            # site. Measured on the real pairs it inverts: ISEMCO's two pages for
            # one master score 0.61, while SAE's Audio and Urban Music
            # Production -- different degrees -- score 0.76, and UPC's Industrial
            # Engineering at Barcelona and at Terrassa score 1.00. Merging on
            # that would collapse two real masters and hide a campus, which is
            # one of the things this dataset exists to record.
            if prefix or sa == sb or (len(sa) > 12 and sa in sb) \
               or (len(sb) > 12 and sb in sa) or similar(sa, sb) >= 0.8:
                same.append(bkey)
                seen.add(bkey)
        merged.append(same)
        seen.add(a)
    collapsed = {}
    for same in merged:
        if len(same) > 1:
            print("  merged %d pages into one programme: %s"
                  % (len(same), " + ".join(u[:52] for u in same)))
        rows_ = [r for u in same for r in groups[u]]
        for u in same:
            collapsed[u] = same[0]
        groups[same[0]] = rows_
    for u in list(groups):
        if collapsed.get(u) != u:
            del groups[u]
    # an enrichment record citing any page of a merged programme lands on it
    alias = collapsed
    print("after merging duplicate pages: %d programmes" % len(groups))

    enr = load_enrichment()
    fallback = input_urls()
    attached, orphans = {}, []
    for r in enr:
        cands = [alias[u] for u in r["_urls"] if u in alias]
        if not cands:
            cands = [alias[u] for u in fallback.get(fold(r.get("programme_name")), ())
                     if u in alias]
        if not cands:
            # Same degree, different page on the same site: the school microsite
            # rather than the central catalogue. Require the same domain AND a
            # slug that is plainly the same programme, so this can never reach
            # across institutions.
            for cited in r["_urls"]:
                cs, cg = site(cited), slug(cited)
                if not cg:
                    continue
                for u in groups:
                    if site(u) == cs and (cg == slug(u) or cg in slug(u)
                                          or slug(u) in cg or similar(cg, slug(u)) >= 0.7):
                        cands.append(u)
        if not cands:
            orphans.append(r)
            continue
        # A record may cite a sibling programme's page -- several agents were
        # told to reuse a duplicate's verified figures and cited it while doing
        # so. Where more than one programme is named, the closest name wins.
        best = max(cands, key=lambda u: max(
            similar(r.get("programme_name"), g["programme_name"]) for g in groups[u]))
        attached.setdefault(best, []).append(r)

    print("enrichment records: %d   attached: %d   unattachable: %d"
          % (len(enr), sum(len(v) for v in attached.values()), len(orphans)))
    for r in orphans:
        print("  ! no spring programme cited: %s / %s [%s]"
              % (r.get("institution", "")[:38], r.get("programme_name", "")[:48], r["_src"]))

    out, filled, missing = [], 0, []
    for url, group in sorted(groups.items()):
        base = max(group, key=lambda r: sum(len(v or "") for v in r.values()))
        rec = dict(base)
        recs = attached.get(url, [])
        if recs:
            filled += 1
            # Where two agents covered one programme, prefer the fuller record
            # but let a later one fill a field the first left empty.
            recs.sort(key=lambda r: sum(len(flat(v)) for v in r.values()), reverse=True)
            for c in NEW_COLS:
                src = {"enriched_official_status": "official_status",
                       "enrichment_sources": "sources"}.get(c, c)
                rec[c] = next((flat(r.get(src)) for r in recs if flat(r.get(src)).strip()), "")
            if not (base.get("ruct_code") or "").strip():
                rec["ruct_code"] = next(
                    (flat(r.get("ruct_code")) for r in recs if flat(r.get("ruct_code")).strip()), "")
        else:
            for c in NEW_COLS:
                rec[c] = ""
            missing.append((base["institution"][:40], base["programme_name"][:55]))
        rec["_rows_merged"] = str(len(group))
        rec["_enrichment_records"] = str(len(recs))
        out.append(rec)

    print("programmes enriched: %d   not enriched: %d" % (filled, len(missing)))
    for mrow in missing:
        print("      - %s / %s" % mrow)

    cols = header + NEW_COLS + ["_rows_merged", "_enrichment_records"]
    with open(OUT, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in out:
            w.writerow({c: r.get(c, "") for c in cols})
    print("wrote %s  (%d programmes, %d columns)" % (OUT, len(out), len(cols)))
    return 0 if not orphans else 0


if __name__ == "__main__":
    sys.exit(main())
