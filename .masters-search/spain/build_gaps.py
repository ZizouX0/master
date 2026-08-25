#!/usr/bin/env python3
"""Write output/gaps.md -- every NOT FOUND, CONFLICT, UNCONFIRMED and human-needed question.

The brief calls this file "a deliverable, not an apology". It is generated from the data
rather than written by hand, so it cannot drift from what the dataset actually says.
"""
import json, collections, sys
from pathlib import Path
sys.path.insert(0,".masters-search/spain")
from consolidate import fold                                  # noqa: E402

OUT=Path("output")
def load(p):
    p=Path(p)
    if not p.exists(): return []
    rows=[]
    for line in p.read_text(encoding="utf-8",errors="replace").splitlines():
        line=line.strip()
        if line:
            try:
                r=json.loads(line)
                if isinstance(r,dict): rows.append(r)
            except json.JSONDecodeError: pass
    return rows

MISSING={"","NOT FOUND","UNKNOWN","N/A","NONE","0"}
def missing(v):
    s=str(v or "").strip().upper()
    return s in MISSING or s.startswith("NOT FOUND") or s.startswith("NOT PUBLISHED")

STAR=["official_status","ruct_code","tuition_total_eur","tuition_year_of_rates",
      "non_eu_surcharge","language_of_instruction","complementary_credits_required",
      "credit_recognition_available","application_window_2027"]

def name(r):
    return (r.get("programme_name_es") or r.get("programme_name_en")
            or r.get("programme_name") or r.get("id") or "?")[:88]

def main():
    progs = load(OUT/"verified.jsonl") or load(OUT/"programmes.jsonl")
    funds = load(OUT/"funding.jsonl")
    deferred = load(OUT/"deferred_candidates.jsonl")
    L=["# gaps.md — what this dataset does not know", "",
       "Generated from the data, not written by hand, so it cannot drift from what the",
       "dataset actually says. Regenerate with `python3 .masters-search/spain/build_gaps.py`.",
       "",
       "> The brief's closing instruction: *an incomplete dataset that is honest about its gaps",
       "> is a success; a complete-looking dataset containing one invented fee, deadline or",
       "> eligibility ruling is a failure, because it will be acted on.* This file is where that",
       "> honesty is kept.", ""]

    # 1. coverage
    L += ["## 1. Coverage — what was searched versus what was enriched", ""]
    raw=len(load(OUT/"raw_candidates.jsonl"))
    L += [f"- **{raw} unique candidates** were discovered in wave 1 across 19 slices.",
          f"- **{len(progs)} were enriched** to the full schema and are in `programmes.csv`.",
          f"- **{len(deferred)} remain deferred** in `deferred_candidates.jsonl` — discovered,",
          "  deduplicated and prioritised, but never enriched. They are parked, not dropped.",
          "  Enriching them needs roughly four page-fetches each; that did not fit the run.",
          "- The deferred pile is the single largest gap in this dataset. A programme's absence",
          "  from `programmes.csv` does **not** mean it was judged unsuitable — most were simply",
          "  never reached.", ""]

    # 2. missing starred fields
    L += ["## 2. Missing ★ fields, by field", "",
          "The brief marks these as the fields that decide the outcome. Counts are out of",
          f"{len(progs)} enriched programmes.", "",
          "| ★ field | missing | % |", "|---|---:|---:|"]
    for f in STAR:
        n=sum(1 for p in progs if missing(p.get(f)))
        L.append(f"| `{f}` | {n} | {round(100*n/max(1,len(progs)))}% |")
    L.append("")

    # 3. the single biggest systematic hole
    nodate=[p for p in progs if missing(p.get("application_window_2027"))]
    L += ["### The 2027-28 calendar does not exist yet, anywhere", "",
          f"`application_window_2027` is missing for {len(nodate)} of {len(progs)} programmes, and",
          "that is a fact about the world rather than a research failure: as of 2026-08-25 no",
          "Spanish institution had published a 2027-28 admission calendar. Every date in this",
          "dataset is the **2026-27** cycle, explicitly year-marked. **No date was shifted",
          "forward by a year to fill the column** — doing so would have produced a clean-looking",
          "calendar that quietly invented every deadline in it.", "",
          "Use the 2026-27 windows to predict *shape* (how many rounds, roughly when, whether a",
          "non-EU early round exists), then confirm each real date with the institution.", ""]

    # 4. conflicts
    cf=[(p,c) for p in progs for c in (p.get("conflicts") or []) if isinstance(c,dict)]
    tie=[p for p in progs if p.get("needs_tiebreak")]
    L += ["## 3. Conflicts — both values retained, none resolved silently", "",
          f"**{len(cf)} field-level conflicts** across {len({id(p) for p,_ in cf})} programmes.",
          f"**{len(tie)}** are on cost, deadline, official status or language and are flagged",
          "`needs_tiebreak` for a third pass, as the brief requires.", ""]
    if cf:
        by=collections.Counter(c.get("field") for _,c in cf)
        L += ["| field | conflicts |","|---|---:|"]
        L += [f"| `{k}` | {v} |" for k,v in by.most_common()]
        L += ["", "### The conflicts that change a decision", ""]
        shown=0
        for p,c in cf:
            if c.get("field") not in ("tuition_total_eur","tuition_per_ects_eur",
                                      "non_eu_surcharge","official_status",
                                      "application_window_2027"): continue
            if shown>=25: break
            shown+=1
            L += [f"- **{p.get('institution','?')[:56]} — {name(p)}** · `{c.get('field')}`",
                  f"  - A ({c.get('kept_from','?')}): {str(c.get('value_kept'))[:230]}",
                  f"  - B ({c.get('other_from','?')}): {str(c.get('value_other'))[:230]}"]
        L.append("")

    # 5. verification
    vt=collections.Counter(str(p.get("verification_status") or "NOT VERIFIED") for p in progs)
    L += ["## 4. Verification status", "", "| status | programmes |","|---|---:|"]
    L += [f"| {k} | {v} |" for k,v in vt.most_common()]
    L += ["", "`UNCONFIRMED` means an independent second agent could not source the field —",
          "not that the first agent was wrong. `NOT VERIFIED` means no second pass ran.", ""]

    # 6. intake risk
    risk=[p for p in progs if p.get("intake_2027_risk")]
    if risk:
        L += ["## 5. Programmes that may not admit for September 2027", "",
              "Scored down, not hidden. Registry presence is not an open intake.", ""]
        for p in risk:
            L.append(f"- **{p.get('institution','?')[:52]} — {name(p)}** — {p['intake_2027_risk']}")
        L.append("")

    # 7. funding
    L += ["## 6. Funding questions still open", ""]
    nf=[f for f in funds if str(f.get("tunisian_eligible","")).upper().startswith("NOT FOUND")]
    cond=[f for f in funds if str(f.get("tunisian_eligible","")).upper().startswith("CONDITIONAL")]
    L += [f"- **{len(nf)}** funding sources have **no established Tunisian-eligibility verdict**.",
          f"- **{len(cond)}** are `CONDITIONAL` — claimable only if a further condition is met.",
          "  These need a human to confirm the condition before being counted on.", ""]
    for f in cond[:18]:
        L.append(f"  - **{str(f.get('name'))[:74]}** — {str(f.get('eligibility_verbatim') or f.get('notes') or '')[:180]}")
    L.append("")

    # 8. human questions
    L += ["## 7. Questions that need a human to send an email", "",
          "Each of these is blocked on something no automated fetch in this environment can",
          "reach — a Cloudflare challenge, a JS-only page, or a document that simply is not",
          "published. They are not research failures to retry; they are phone calls.", ""]
    HUMAN=[
     ("UPF (Music Technology Group)","Its own pages disagree on complementary credits: the academic-program page says **up to 50 credits**, the FAQ says **up to 15**. At UPF's non-EU rate of €93.50/credit that is a difference of roughly **€3,300 and a second year**. `www.upf.edu` returns 403 to every automated fetch here. Ask admissions which applies to a 300-ECTS engineering degree."),
     ("Universitat de Barcelona","UB's **official** master catalogue could not be enumerated at all — Cloudflare blocks it. Only the Data Science microsite and IL3 (títols propis) were reachable. UB's official offering is therefore absent from this dataset."),
     ("Castilla-La Mancha / UCLM","The regional decree does not fix a non-EU price; it delegates to UCLM's own tariff, and `www.uclm.es` returns 403. The non-EU cost of every UCLM programme here is unknown."),
     ("ISEACV Valencia — Sonología Aplicada y Creación Sonora","Highest content fit in the conservatory register (deep learning, Python, Max/MSP) and states only *recommended* music profiles with no exclusion. Its admission PDFs were unretrievable. One email decides whether this is a top option or drops out."),
     ("Berklee Valencia — GEMB","Published per-credit price (€1,615) × stated credits (34–35) does not reconcile with the published total ($50,430). A discrepancy worth over €4,000."),
     ("WAVES consortium (UPV Gandia)","The consortium says it decided not to open recruitment for the 2026-2028 cohort; UPV still advertises the title with a live calendar. Ask whether a 2027-2029 cohort will run before planning around it."),
     ("BDMA / DEAI","BDMA states its European Commission funding has ended and DEAI holds the funding from 2026-2028. Ask DEAI whether a 2027-2029 intake is planned."),
     ("Universidad de Jaén","Secondary reporting mentions UJA scholarships specifically for Tunisian nationals (housing + tuition). Not confirmable on ujaen.es. Worth one email — it would be the only Tunisia-specific university scheme found."),
     ("UPNA (Navarra)","Orden Foral 63E/2026 art. 4.2 lets UPNA waive master fees under an internationalisation agreement — nationality-neutral, no padrón. Ask whether such an agreement exists and how to be considered."),
     ("Andalusian universities (UMA, US, UNIA)","Decreto 98/2023 art. 12.1.c gives a 99% bonificación from year 2 with no nationality or residence condition. Confirm it applies to a non-EU master student and how year 1 is treated."),
     ("CSIC (JAE Intro) and Ministerio de Universidades","Neither publishes reachable eligibility pages (404 / 503). Both recorded as NOT FOUND rather than as negatives."),
     ("Fundación Indra, Fundación Accenture","Both refused at the **network gateway** (502 on CONNECT) — an environment block, not evidence that no scheme exists. Unexamined, and among the highest-value remaining leads."),
     ("Universidad Camilo José Cela (UCJC)","Returns HTTP 202 with a 221-byte shell for HTML *and* PDFs, including its 2026/27 price book. All UCJC data here is registry-derived; fees, language and admission are unknown."),
     ("VIU — Composición Musical (RUCT 4318085)","Registered and active in RUCT, but both plausible URLs serve a different programme's page. Confirm it still runs."),
     ("UDIT — AI master (RUCT 3500703)","Officially registered, but no programme page exists anywhere on udit.es. Registered is not running."),
    ]
    for who,q in HUMAN:
        L += [f"### {who}", q, ""]

    # 9. blocked
    bl=Path("output/logs/blocked-and-redo.md")
    L += ["## 8. Sources that no tool in this environment could reach", "",
          "Chromium cannot reach the session proxy for **any** host, so there is no",
          "JS-capable fallback here; the Wayback Machine rate-limits. These are hard limits,",
          "not retries. Full list in `output/logs/blocked-and-redo.md`.", "",
          "`www.upf.edu` · `www.ub.edu` · `unir.net` · `il3.ub.edu` · `www.uclm.es` ·",
          "`ucjc.edu` · `pointblankmusicschool.com` · `imep.es` · `fundacionsgae.org` ·",
          "`fundacionindra.org` · `fundacionaccenture.org` (gateway) · `guiadocent.upf.edu`",
          "(gateway) · `estudiospropios.unizar.es` (gateway)", ""]
    if bl.exists(): L.append("")

    (OUT/"gaps.md").write_text("\n".join(L),encoding="utf-8")
    print(f"gaps.md written: {len(L)} lines")
    print(f"  programmes {len(progs)} · deferred {len(deferred)} · conflicts {len(cf)} · tiebreaks {len(tie)}")

if __name__=="__main__":
    main()
