# Spring-intake enrichment — location, fees, public/private, European recognition

Read `/home/user/master/output/AGENT-BRIEF.md` first for the candidate profile, the
primary-source and NOT FOUND rules, the RUCT tooling and the blocked-domain list.

Your input file lists spring-intake programmes already confirmed to start Jan–Jun.
For each one, fill four things from PRIMARY SOURCES.

## 1. Where it is
`city` and `autonomous_community` — the campus where teaching actually happens, not the
university's registered address. A university headquartered in Madrid may teach the
programme in Barcelona; UPC alone spans Barcelona, Castelldefels, Terrassa and Manresa.
For an online programme write `city: ONLINE` and give the awarding university's seat.

## 2. Who awards it
`university_awarding` — the institution whose name goes on the degree. This is NOT always
the school you apply to: EAE's Madrid events master is awarded by UNIE; SAE's are awarded
via UDIMA; Big Data International Campus awards a UCAM título propio; IL3 is UB's
continuing-education arm. Where a school is not a university, name the university behind
it, or write `NONE — no university awards this` if there isn't one.

## 3. What it costs
`tuition_eu_eur`, `tuition_non_eu_eur`, `tuition_year_of_rates`, `fees_extra_eur`.
Give the **full programme** total, not per credit — if the page gives €/ECTS, multiply and
show the arithmetic in `notes`. Non-EU is the figure that matters for this candidate: it is
confirmed to roughly double at many public universities (UPC 19.37→45.00 €/credit, UMH
literally doubles, UAM 2,736→5,079). **Page silence is `NOT FOUND`, never "no surcharge".**
Private universities usually charge one flat rate — if so, say so explicitly, because that
is a genuine finding for a non-EU applicant.

## 4. `institution_type`
`public university` · `private university` · `private school (not a university)` ·
`public conservatory (enseñanzas artísticas)`. Note UOC is a public-law university that
charges private-style fees — record both facts.

## 5. Is it recognised across Europe? — THE FIELD THAT NEEDS CARE
Do not answer this from the programme's marketing. Answer it from what the qualification
legally is. There are three distinct cases and they have genuinely different answers:

**(a) `Máster Universitario`** — official, ANECA-verified, in RUCT. It sits at **MECES level
3 = EQF/EHEA level 7**, is inside the **European Higher Education Area (Bologna)**, carries
an automatic **Diploma Supplement**, and grants **access to doctoral study**. This is the
category that travels: other EHEA countries recognise it academically as a second-cycle
degree. Record `europe_recognition: EHEA level 7 (Bologna) — academic recognition across
the EHEA` plus the RUCT code and MECES level as evidence.

**(b) `Máster en Enseñanzas Artísticas`** — ALSO official and ALSO MECES 3 / EQF 7, but it
sits in a separate register that RUCT does not contain, evidenced by a **BOE homologation
order** rather than a RUCT row. Absence from RUCT is expected and is NOT evidence against
it. Record the BOE order as the evidence.

**(c) `Título propio` / `Máster de Formación Permanente`** — the university's OWN
certificate. It is **not in MECES, not in the EHEA framework, carries no Diploma Supplement
as of right, and grants no doctoral access**. It may be respected by employers and may
carry ECTS, but there is **no automatic academic recognition in another European country** —
recognition is at the discretion of the receiving institution or employer. Say that plainly.
Do not soften it, and do not repeat a school's claim that it is "recognised in Europe"
without saying what the legal basis is.

⚠️ **Two things nobody should overstate.** Academic recognition inside the EHEA is not the
same as **professional** recognition for a regulated profession, which runs through
Directive 2005/36/EC and a separate national process. And a Spanish official master's
recognition abroad still requires the receiving country's own procedure — the EHEA makes it
routine, not automatic. Note both where relevant rather than implying a degree is a passport.

## Output — append AS YOU GO, one JSON per line, to the file named in your prompt
{"institution":"","programme_name":"","city":"","autonomous_community":"","campus":"",
 "university_awarding":"","institution_type":"","official_status":"","ruct_code":"","boe_order":"",
 "meces_level":"","eqf_level":"","europe_recognition":"","diploma_supplement":"YES|NO|NOT FOUND",
 "phd_access":"YES|NO|NOT FOUND","tuition_eu_eur":"","tuition_non_eu_eur":"",
 "tuition_year_of_rates":"","fees_extra_eur":"","modality":"","language_of_instruction":"",
 "start_month":"","notes":"","sources":[{"field":"","url":"","accessed":"YYYY-MM-DD"}]}

`NOT FOUND` is correct and useful. An invented fee or an overstated recognition claim is a
failed task — this candidate will act on both.
