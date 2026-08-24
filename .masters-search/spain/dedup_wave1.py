#!/usr/bin/env python3
"""Merge every wave-1 discovery JSONL and deduplicate on (institution, programme_name).

Discovery is deliberately noisy: agents were told false positives are cheap and misses are
not. This collapses the duplicates the two discovery axes (by-field and by-institution) are
expected to produce, and keeps the richest record of each duplicate group rather than the
first one seen.
"""
import json, sys, re, unicodedata
from pathlib import Path
from collections import defaultdict

W1 = Path("output/wave1")

def norm(s):
    """Fold case, accents and punctuation so 'Màster en Tecnologies' == 'master en tecnologias'."""
    s = (s or "").strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", " ", s)
    # university-name noise that varies between agents
    s = re.sub(r"\b(universitat|universidad|universidade|university|univ)\b", "u", s)
    s = re.sub(r"\b(master|masters|msc|ma|mu)\b", "master", s)
    return re.sub(r"\s+", " ", s).strip()

def key(rec):
    return (norm(rec.get("institution"))[:60], norm(rec.get("programme_name"))[:60])

def richness(rec):
    """Prefer the record that carries more real content, and a real URL over none."""
    score = sum(1 for v in rec.values() if isinstance(v, str) and v.strip() and v.strip().upper() != "NOT FOUND")
    if (rec.get("url") or "").startswith("http"):
        score += 3
    if rec.get("ruct_code"):
        score += 5
    return score

def main():
    groups = defaultdict(list)
    bad = 0
    files = sorted(W1.glob("*.jsonl"))
    if not files:
        sys.exit("no wave-1 files yet")
    for f in files:
        for lineno, line in enumerate(f.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                bad += 1
                continue
            if not isinstance(rec, dict) or not rec.get("programme_name"):
                bad += 1
                continue
            rec["_slice"] = f.stem
            groups[key(rec)].append(rec)

    merged = []
    for k, recs in groups.items():
        best = max(recs, key=richness)
        # keep every path_code any agent assigned, and every slice that found it:
        # a programme found by two independent axes is a stronger candidate.
        codes, slices, urls = set(), set(), set()
        for r in recs:
            for c in re.split(r"[+,/ ]+", str(r.get("path_code") or "")):
                if c.strip():
                    codes.add(c.strip())
            slices.add(r.get("_slice"))
            if (r.get("url") or "").startswith("http"):
                urls.add(r["url"])
        best["path_codes"] = sorted(codes)
        best["found_by_slices"] = sorted(slices)
        best["all_urls"] = sorted(urls)
        best["duplicate_count"] = len(recs)
        merged.append(best)

    merged.sort(key=lambda r: (r.get("institution") or "", r.get("programme_name") or ""))
    out = Path("output/raw_candidates.jsonl")
    with out.open("w", encoding="utf-8") as fh:
        for r in merged:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"files            : {len(files)}")
    print(f"raw lines kept   : {sum(len(v) for v in groups.values())}")
    print(f"unparseable      : {bad}")
    print(f"unique candidates: {len(merged)}")
    print(f"found by 2+ axes : {sum(1 for r in merged if len(r['found_by_slices']) > 1)}")
    print(f"-> {out}")
    per = defaultdict(int)
    for r in merged:
        for c in r["path_codes"] or ["?"]:
            per[c] += 1
    print("per path_code    :", dict(sorted(per.items())))

if __name__ == "__main__":
    main()
