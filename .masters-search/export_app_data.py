#!/usr/bin/env python3
"""Export the whole dataset as one JSON file for the browser app.

The workbooks are the deliverable for Excel; this is the same data shaped for code —
one flat record per programme, every field a string or a small enum, nothing nested
that a table cannot render. Derived fields the app would otherwise recompute on every
render (door, gate, whether the language is one he reads) are baked in here instead.
"""
import json, re, sys
from collections import Counter
sys.path.insert(0, ".masters-search")
import build_master as M
import build_artist_workbook as A

OUT = "app/public/data/programmes.json"
OUT_META = "app/public/data/meta.json"


def g(rec, *keys, n=4000):
    for k in keys:
        v = M.txt(rec.get(k), n)
        if v:
            return v
    return ""


def main():
    verdicts = A.load_verdicts()
    rows = []
    for i, r in enumerate(M.main()):
        rec = r["_rec"]
        d = A.door(r)
        v = verdicts.get((A.norm(r["Institution"]), A.norm(r["Programme / scheme"]))) or {}
        rows.append({
            "id": i,
            "country": r["Country"],
            "region": r["Region"],
            "city": r["City"],
            "institution": r["Institution"],
            "programme": r["Programme / scheme"],
            "door": ("Door 1 — electronic music & sound art" if (d or "").startswith("Door 1")
                     else "Door 3 — music production & studio" if (d or "").startswith("Door 3")
                     else "Other track"),
            "track": r["Track"],
            "subtype": A.subtype(r) if d else "",
            "level": r["Qualification level"],
            "chance": r["Chance for you"],
            "whyChance": r["Why that chance"],
            "costBand": r["Cost band (you)"],
            "language": r["Taught in"],
            "languageOk": bool(M.language_ok(r["Taught in"])),
            "publicPrivate": r["Public/Private"],
            "funding": r["Funding"],
            "scholarship": r["Scholarship"],
            "gate": A.gate(r) if d else "",
            "verdict": v.get("verdict", ""),
            "verdictWhy": M.txt(v.get("verdictWhy"), 2000),
            "correction": M.txt(v.get("correction"), 2000),
            # the long-form detail, shown on the record page rather than in the table
            "qualification": g(rec, "qualification", "degree"),
            "accreditation": g(rec, "accreditationStatus"),
            "tuition": g(rec, "tuitionNonEU", "tuitionIntl", "tuitionTotal", "tuitionPerYear"),
            "otherFees": g(rec, "otherFees"),
            "totalCost": g(rec, "totalCostEstimate"),
            "scholarshipDetail": g(rec, "scholarships", "scholarship", "stipendCoverage"),
            "entry": g(rec, "entryRequirements"),
            "acceptsNonMusic": g(rec, "acceptsNonMusic"),
            "portfolio": g(rec, "portfolioSpec", "portfolioReq"),
            "audition": g(rec, "auditionSpec"),
            "deadline": g(rec, "deadline"),
            "opens": g(rec, "applicationOpens"),
            "duration": g(rec, "durationEcts"),
            "languageReq": g(rec, "languageRequirement"),
            "englishTest": g(rec, "englishTest"),
            "study": g(rec, "whatYouStudy", "focus"),
            "recommendation": g(rec, "recommendation", "fitNotes"),
            "url": rec.get("sourceUrl") or "",
            "foundBy": rec.get("_origin") or rec.get("_source") or "",
        })

    import os
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(rows, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    def counts(field):
        return dict(Counter(r[field] for r in rows if r[field]).most_common())

    meta = {
        "total": len(rows),
        "generated": "2026-08",
        "facets": {k: counts(k) for k in
                   ("country", "region", "door", "track", "subtype", "level", "chance",
                    "costBand", "language", "publicPrivate", "funding", "gate", "verdict")},
        "counts": {
            "degrees": sum(1 for r in rows if r["level"] == "Master's degree"),
            "verified": sum(1 for r in rows if r["verdict"]),
            "worthIt": sum(1 for r in rows if r["verdict"] == "WORTH IT"),
            "countries": len({r["country"] for r in rows}),
            "withUrl": sum(1 for r in rows if r["url"].startswith("http")),
        },
    }
    json.dump(meta, open(OUT_META, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"wrote {OUT} — {len(rows)} records, "
          f"{os.path.getsize(OUT)/1e6:.1f} MB")
    print(f"wrote {OUT_META}")
    print("  degrees:", meta["counts"]["degrees"], "· verified:", meta["counts"]["verified"],
          "· countries:", meta["counts"]["countries"], "· with a source link:", meta["counts"]["withUrl"])
    print("  doors  :", meta["facets"]["door"])
    print("  gates  :", meta["facets"]["gate"])


if __name__ == "__main__":
    main()
