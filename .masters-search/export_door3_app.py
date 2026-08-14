#!/usr/bin/env python3
"""Export Door 3 — and only Door 3 — for the web app.

Scoped to exactly what DOOR3.xlsx contains, so the app and the workbook agree
record for record. That includes the rejects: the 130 things sold as a master's
that are not one are part of what was collected, and hiding them would make the
app less useful than the spreadsheet, not more.

Two files, because Door 3 is two kinds of thing:
  programmes.json  every programme record, all long-form fields at full length
  funding.json     every funding scheme found for this door
"""
import glob, json, os, re, sys
from collections import Counter
sys.path.insert(0, ".masters-search")
import build_master as M
import build_artist_workbook as A
import build_door3 as D
import corrections as C

OUT_DIR = "app/public/data"


def g(rec, *keys, n=6000):
    for k in keys:
        v = M.txt(rec.get(k), n)
        if v:
            return v
    return ""


def programmes():
    rows = []
    for i, r in enumerate(D.collect()):
        rec = r["_rec"]
        disp = C.analyse({
            "correction": r["_correction"], "verdictWhy": r["_verdictWhy"],
            "audition": g(rec, "auditionSpec"),
        })
        # a verified correction beats the derived flag. Babelsberg and FAMU read
        # "no audition, free" until you read the prose, and a filter would have
        # handed him five programmes he cannot get into.
        # only a CONFIRMED audition (named in verified prose) overrides the gate.
        # A suspicion from the unverified auditionSpec field is surfaced, not enforced.
        needs_audition = ("AUDITION" in r["_gate"]
                          or disp["auditionSource"] == "confirmed")
        rows.append({
            "id": i,
            "country": r["Country"], "region": r["_reg"], "city": r["City"],
            "institution": r["Institution"], "programme": r["Programme / scheme"],
            "subtype": r["_sub"],
            "level": r["Qualification level"],
            "isDegree": r["Qualification level"] == "Master's degree",
            "gate": r["_gate"],
            "needsAudition": needs_audition,
            # what a verified correction contradicts, and the phrase that says so
            "auditionDisputed": disp["auditionDisputed"],
            "auditionSource": disp["auditionSource"],
            "auditionSuspected": disp["auditionSource"] == "suspected",
            "costDisputed": disp["costDisputed"],
            "existenceDisputed": disp["existenceDisputed"],
            # a dispute is only "verified" when it came from verified prose
            "hasVerifiedDispute": bool(disp["costDisputed"] or disp["existenceDisputed"]
                                       or disp["auditionSource"] == "confirmed"),
            "chance": r["Chance for you"], "whyChance": r["Why that chance"],
            "costBand": r["Cost band (you)"],
            "language": r["Taught in"], "languageOk": bool(M.language_ok(r["Taught in"])),
            "publicPrivate": r["Public/Private"],
            "funding": r["Funding"], "scholarship": r["Scholarship"],
            "verdict": r["_verdict"],
            "verdictWhy": M.txt(r["_verdictWhy"], 4000),
            "correction": M.txt(r["_correction"], 4000),
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
    return rows


def funding():
    """Every scheme the Door-3 funding sweeps found, plus the schemes attached to
    programmes elsewhere in the project that a Door-3 applicant could still use."""
    out, seen = [], set()
    for f in sorted(glob.glob(".masters-search/results/artist-sweep/*scholarship*.json")):
        for s in json.load(open(f, encoding="utf-8")):
            name = M.txt(s.get("scholarshipName"), 200)
            if not name or name.lower() in seen:
                continue
            seen.add(name.lower())
            out.append({
                "id": len(out), "name": name,
                "provider": M.txt(s.get("provider"), 200),
                "country": M.txt(s.get("country"), 80),
                "whoCanApply": M.txt(s.get("whoCanApply"), 3000),
                "ageLimit": M.txt(s.get("ageLimit"), 400),
                "subjectScope": M.txt(s.get("subjectScope"), 1000),
                "coverage": M.txt(s.get("coverage"), 2000),
                "duration": M.txt(s.get("duration"), 300),
                "numberOfAwards": M.txt(s.get("numberOfAwards"), 300),
                "deadline": M.txt(s.get("deadline"), 800),
                "opens": M.txt(s.get("applicationOpens"), 400),
                "howToApply": M.txt(s.get("howToApply"), 1500),
                "requiresAdmissionFirst": M.txt(s.get("requiresAdmissionFirst"), 300),
                "requiresWorkExperience": M.txt(s.get("requiresWorkExperience"), 400),
                "languageRequirement": M.txt(s.get("languageRequirement"), 400),
                "competitiveness": M.txt(s.get("competitiveness"), 600),
                "notes": M.txt(s.get("notes"), 2000),
                "url": s.get("sourceUrl") or "",
                "foundBy": s.get("_source") or "",
            })
    return out


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    progs, funds = programmes(), funding()

    for name, data in (("programmes", progs), ("funding", funds)):
        p = f"{OUT_DIR}/{name}.json"
        json.dump(data, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(f"wrote {p} — {len(data)} records, {os.path.getsize(p)/1e6:.2f} MB")

    def counts(field):
        return dict(Counter(r[field] for r in progs if r.get(field)).most_common())

    meta = {
        "scope": "Door 3 — music production and studio craft, Europe",
        "generated": "2026-08",
        "total": len(progs),
        "funding": len(funds),
        "counts": {
            "degrees": sum(1 for r in progs if r["isDegree"]),
            "notDegrees": sum(1 for r in progs if r["level"] not in ("Master's degree", "Unclear")),
            "unclear": sum(1 for r in progs if r["level"] == "Unclear"),
            "verified": sum(1 for r in progs if r["verdict"]),
            "worthIt": sum(1 for r in progs if r["verdict"] == "WORTH IT"),
            "conditional": sum(1 for r in progs if r["verdict"] == "CONDITIONAL"),
            "avoid": sum(1 for r in progs if r["verdict"] == "AVOID"),
            "noAudition": sum(1 for r in progs if r["isDegree"] and not r["needsAudition"]),
            "needsAudition": sum(1 for r in progs if r["isDegree"] and r["needsAudition"]),
            "countries": len({r["country"] for r in progs}),
            "withUrl": sum(1 for r in progs if r["url"].startswith("http")),
        },
        "facets": {k: counts(k) for k in
                   ("country", "region", "subtype", "level", "chance", "costBand",
                    "language", "publicPrivate", "funding", "gate", "verdict")},
    }
    json.dump(meta, open(f"{OUT_DIR}/meta.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"wrote {OUT_DIR}/meta.json")
    print("  ", meta["counts"])


if __name__ == "__main__":
    main()
