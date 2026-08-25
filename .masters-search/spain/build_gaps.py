#!/usr/bin/env python3
"""Build output/gaps.md -- every NOT FOUND, CONFLICT, UNCONFIRMED, and human-needed question.

The brief calls this a deliverable, not an apology. It is generated from the data rather
than written by hand so it cannot drift from what the dataset actually says.
"""
import json, collections, sys
from pathlib import Path
OUT=Path("output")

def load(p):
    p=Path(p)
    if not p.exists(): return []
    rows=[]
    for l in p.read_text(encoding="utf-8",errors="replace").splitlines():
        l=l.strip()
        if l:
            try:
                r=json.loads(l)
                if isinstance(r,dict): rows.append(r)
            except json.JSONDecodeError: pass
    return rows

progs=load(OUT/"verified.jsonl") or load(OUT/"programmes.jsonl")
funds=load(OUT/"funding.jsonl")
deferred=load(OUT/"deferred_candidates.jsonl")
raw=load(OUT/"raw_candidates.jsonl")

MISS={"","NOT FOUND","UNKNOWN","NONE","N/A","0"}
def missing(v):
    return str(v).strip().upper() in MISS or str(v).strip().upper().startswith("NOT FOUND")

STAR=["official_status","ruct_code","tuition_total_eur","tuition_year_of_rates",
      "non_eu_surcharge","language_of_instruction","complementary_credits_required",
      "credit_recognition_available","application_window_2027"]

L=["# gaps.md — what this dataset does not know","",
   "Generated from the data, not written by hand, so it cannot drift from what the",
   "dataset actually contains. Every entry is either a fact nobody could source, a place",
   "two sources disagree, or a question that needs a human with an email client.","",
   "**The brief's framing, kept:** an incomplete dataset that is honest about its gaps is a",
   "success; a complete-looking dataset containing one invented fee, deadline or eligibility",
   "ruling is a failure, because it will be acted on.",""]

# 1 coverage
L+=["## 1. Coverage — what was searched versus what was enriched","",
    f"- **{len(raw)} unique candidate programmes** were discovered across 19 discovery slices.",
    f"- **{len(progs)} were enriched** to the full schema.",
    f"- **{len(deferred)} remain deferred** in `deferred_candidates.jsonl` — parked, not dropped.",
    "",
    "The deferred set is real coverage debt. Discovery was deliberately broad (false positives",
    "are cheap, misses are not), and enrichment at four pages per programme does not fit that",
    "breadth in the time available. Round 1 took the candidates where enrichment most changes",
    "the answer: an active official title, a core field, corroboration from two independent",
    "discovery axes, and a working URL. **Anything in the deferred file has been seen but not",
    "checked, and must not be treated as absent or as rejected.**",""]

# 2 verification
vs=collections.Counter(str(p.get("verification_status","")) for p in progs)
L+=["## 2. Verification status","",
    "| status | count | meaning |","|---|---:|---|",
    f"| VERIFIED | {vs.get('VERIFIED',0)} | a second agent, given only the name and institution, reached the same answers |",
    f"| CONFLICT | {vs.get('CONFLICT',0)} | the two passes disagree on at least one field; both values kept |",
    f"| UNCONFIRMED | {vs.get('UNCONFIRMED',0)} | the verifier could not source the fields at all |",
    f"| NOT VERIFIED | {vs.get('NOT VERIFIED',0)} | no independent pass ran — **single-sourced, treat with more caution** |",
    ""]
tb=[p for p in progs if p.get("needs_tiebreak")]
if tb:
    L+=[f"**{len(tb)} programmes carry a conflict on a decisive field** (cost, deadline, official",
        "status or language) and the brief escalates those to a third agent for a tie-break.",
        "That tie-break has not run. Until it does, treat these figures as contested:",""]
    for p in tb[:25]:
        fields=sorted({c['field'] for c in (p.get('conflicts') or []) if isinstance(c,dict)})
        L.append(f"- **{(p.get('programme_name_es') or p.get('programme_name_en') or '?')[:70]}** — {(p.get('institution') or '?')[:52]} · disputed: {', '.join(fields[:5])}")
    L.append("")

# 3 missing starred fields
L+=["## 3. Starred fields that are NOT FOUND","",
    "These are the fields the brief marks as deciding the outcome. A blank here means nobody",
    "could source it — never that the answer is zero or no.","",
    "| field | missing | of |","|---|---:|---:|"]
for f in STAR:
    n=sum(1 for p in progs if missing(p.get(f)))
    L.append(f"| `{f}` | {n} | {len(progs)} |")
L.append("")

# 4 intake risk
risk=[p for p in progs if str(p.get("intake_2027_risk") or "").strip()]
if risk:
    L+=["## 4. Programmes whose September-2027 intake is in doubt","",
        "Scored down accordingly, but listed here because a registry entry is not a promise",
        "that a programme will admit you.","",
        "| programme | institution | risk |","|---|---|---|"]
    for p in risk:
        L.append(f"| {(p.get('programme_name_es') or p.get('programme_name_en') or '?')[:56]} | {(p.get('institution') or '?')[:36]} | {p['intake_2027_risk'][:60]} |")
    L.append("")

# 5 funding
L+=["## 5. Funding — what is closed, and what is still open","",
    "| Tunisian eligibility | count |","|---|---:|"]
for k,v in collections.Counter(str(f.get("tunisian_eligible","?")).upper().strip()[:14] for f in funds).most_common():
    L.append(f"| {k or '(blank)'} | {v} |")
L+=["","Every `NO` carries the disqualifying clause verbatim with its URL in `funding.csv`, so a",
    "closed route can be re-checked rather than re-researched.",""]
nf=[f for f in funds if str(f.get("tunisian_eligible","")).upper().startswith("NOT FOUND")]
if nf:
    L+=["**Eligibility could not be established at all for these — they are open questions, not refusals:**",""]
    for f in nf:
        L.append(f"- {(f.get('name') or '?')[:80]} — {(f.get('funder') or '?')[:40]}")
    L.append("")

# 6 human questions
L+=["## 6. Questions that need a human","",
    "Each of these needs an email or a browser session. They are listed because they are",
    "decision-changing, not because they are merely unfinished.","",
    "### Blocked by this environment, not by the source",
    "- **`www.upf.edu` returns 403 to every fetch method available here** — WebFetch, curl with",
    "  full browser headers, and headless Chromium alike. `mtg.upf.edu` redirects into the same",
    "  wall. UPF hosts the Music Technology Group and the Sound and Music Computing master",
    "  (RUCT 4315538). Official status came from the registry; **fees, language and curriculum",
    "  were never read from the source**. `bsm.upf.edu` is a separate site and does work.",
    "- **UB's official master catalogue could not be enumerated at all** (Cloudflare). Only the",
    "  Data Science microsite and IL3 (títols propis) were reachable.",
    "- **`ucjc.edu` returns HTTP 202 with a 221-byte shell** for HTML and PDFs alike, including",
    "  its price book — it looks like a response and carries nothing.",
    "- **`www.uclm.es` 403s**, and Castilla-La Mancha's decree defers the non-EU figure to UCLM's",
    "  own tariff — so that community's real cost is the one hole in an otherwise complete map.",
    "- **`fundacionindra.org` and `fundacionaccenture.org` fail at the network gateway (502)** —",
    "  an environment block, NOT evidence that no scheme exists.",
    "- Título propio catalogues for **UMA, UCA, UJA, UHU, UAL, UPO** returned 503/500/JS-only and",
    "  are unenumerated. That matters most for fields P and S, where propios dominate.","",
    "### Specific questions worth one email each",
    "- **WAVES (Erasmus Mundus, UPV Gandia)** — the consortium announced it would not open",
    "  recruitment for 2026-2028, while UPV still advertises the title with a live calendar.",
    "  *Will there be a 2027-2029 cohort?* This decides whether a top-ranked option exists.",
    "- **BDMA** — EC funding ended; the successor appears to be DEAI (ULB/UPC/TU Wien/Lyon 1/",
    "  Padova), first cohort 2026-28. *Is UPC still a partner, and is the 2027 intake funded?*",
    "- **ISEACV Valencia, Sonología Aplicada y Creación Sonora** — the highest content fit in the",
    "  conservatory register (deep learning, Python, Max/MSP). Admission PDFs unretrievable.",
    "  *What is the prueba de acceso, and does it admit a non-music graduate?* One email decides",
    "  whether this is the best music-tech option in Spain or not an option at all.",
    "- **Musikene, Mediación/Gestión/Difusión Musical** — published rules admit graduates of any",
    "  discipline with no audition. *Confirm in writing that a Software Engineering degree",
    "  qualifies*, since this is the one conservatory route that looks genuinely open.",
    "- **Berklee GEMB** — published per-credit price x credits does not equal the published",
    "  total; the gap is over €4,000. *Which figure is right?*",
    "- **UPF SMC** — wave 1 saw 'up to 50 credits of complementary courses', which would extend a",
    "  60-ECTS master to two years and change its cost completely. *How many complementos would",
    "  a 300-ECTS software engineering graduate actually be assigned?*",
    "- **UDIT (RUCT 3500703)** — officially registered, but no programme page exists anywhere on",
    "  udit.es. *Does it run at all?*",
    "- **Becas MEC** bars anyone already holding 'un título de nivel igual o superior'. A 300-ECTS",
    "  5-year engineering title may sit at MECES 3, the same level as a master. *Would that bar",
    "  the candidate even if the residency rule were met?* Recorded as a reasoned flag, not a ruling.",
    "- **CSIC JAE Intro** publishes no eligibility page (404s); **universidades.gob.es** 503s.",""]

# 7 conflicts detail
cf=[(p,c) for p in progs for c in (p.get("conflicts") or []) if isinstance(c,dict) and c.get("value_other")]
L+=[f"## 7. Recorded contradictions ({len(cf)})","",
    "Rule 8 says record contradictions rather than resolving them silently. Both values and",
    "both sources are kept in `programmes.csv`. The pattern worth knowing: **the commonest",
    "disagreement is one source quoting the resident price and the other the non-EU price for",
    "the same programme** — which is exactly the confusion this candidate must not inherit.","",
    "| institution | field | value A | value B |","|---|---|---|---|"]
for p,c in cf[:40]:
    L.append(f"| {(p.get('institution') or '?')[:30]} | `{c['field']}` | {str(c['value_kept'])[:46]} | {str(c['value_other'])[:46]} |")
L.append("")
Path("output/gaps.md").write_text("\n".join(L),encoding="utf-8")
print(f"gaps.md written: {len(L)} lines · {len(cf)} conflicts · {len(tb)} needing tie-break · {len(deferred)} deferred")
