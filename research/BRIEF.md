# SHARED BRIEF — Master's Sweep: 10 paths × Spain / Netherlands / Berlin

## Client
- **Zizz** — final-year Software Engineering student, SMU MedTech, Tunisia. **Tunisian national (non-EU).**
- **Credential: 5-year engineering diploma, 300 ECTS.** This EXCEEDS the 180/240-ECTS entry bar of
  virtually every European master's. Judge `accepts_engineering_bachelor` against THIS credential.
  Flag any program where 300 ECTS grants advanced standing, credit exemption, or post-experience eligibility.
- Languages: Arabic, French, English (no English test taken yet).
  **NEVER exclude a program for its language of instruction.** ES / NL / EN / FR all fine.
  **German is DISPREFERRED but IN SCOPE** — log German-taught programs fully, tag the language, they take a
  ranking penalty in Wave 4, never exclusion.
- **Goal:** master's in Europe starting **September 2027**, advancing a dual career:
  software engineer + electronic music producer/DJ.
- **Strategy: FUNDING-FIRST.** A fully funded program at a good university beats an unfunded one at a great one.
- Strengths: engineering degree, programming, maths. Gaps: no music degree; music portfolio in progress
  (so portfolio-gated programs are FLAGGED, never excluded).

## Today's date: 2026-08-22. Target intake: September 2027.
The 2027 admission cycle is the LIVE one right now — many pages will already show 2027 dates.
Where only 2026-cycle dates exist, record them and write "2026 cycle — 2027 TBC".
**Never present a past cycle's deadline as the 2027 deadline.**

## Geographic scope
| Priority | Scope |
|---|---|
| 1 | **Spain — entire country.** Barcelona highest, then Madrid, Valencia, elsewhere |
| 1 | **Netherlands — entire country.** Amsterdam region highest; also Utrecht, The Hague, Rotterdam, Eindhoven, Groningen, Tilburg, Enschede, Hilversum |
| 1 | **Berlin (city only).** Germany outside Berlin is OUT — EXCEPT an exceptional funded program that precisely fits a path: log it with `in_scope = flagged_exception` in `fit_notes`. Never silently include or exclude. |
| Special | **Erasmus Mundus Joint Masters** — in scope for every path IF ≥1 consortium partner is in Spain, NL, or Berlin, OR the program is an outstanding fit. Set `mobility = rotating`. |

## Institution coverage rule
ALL institution types count: public universities, private universities, universities of applied sciences
(HBO / hogescholen / Hochschulen / FH), conservatories, art schools, film schools, business schools, and
private academies (SAE, Abbey Road Institute, BIMM, Catalyst Berlin, dBs, ESCAC, Microfusa, Tracks, HTL, IMB, …).
**Missing a legitimate program is a worse failure than logging a mediocre one.**
For private academies, ALSO record in `red_flags` whether the award is a real accredited master's degree
(ES: *título oficial* vs *título propio*; NL: NVAO-accredited vs not; DE: staatlich anerkannt) — this matters
enormously for both funding and the Tunisian student visa.

## Sourcing rules (hard)
1. **Official institution / scholarship / government pages are the only source of truth.**
   Mastersportal, StudyPortals, Bachelorsportal, Keystone, FindAMasters = LEAD GENERATORS ONLY.
   Every lead must be confirmed on the institution's own domain before it is logged as fact.
2. **No fact goes in without a URL you actually opened this session.** Do not recall tuition or deadlines
   from memory. Do not average, interpolate, or "round" figures.
3. Pages in Spanish / Dutch / German: **read them.** Do not skip and guess.
4. Unknown = `TBC`. Never a guess. A `TBC` is a success; a fabricated number is a failure.
5. Log in English; keep the original-language program name in `program_name`, with an English translation in
   parentheses.

## CSV SCHEMA — exact column order, no deviations
```
id, path_letter, program_name, degree_awarded, institution, institution_type,
city, country, mobility, language_of_instruction, english_level_required,
duration_months, ects, tuition_non_eu_eur_per_year, tuition_notes,
intake_2027_confirmed, application_opens, application_deadline,
deadline_source_cycle, entry_requirements_summary, accepts_engineering_bachelor,
portfolio_or_audition_required, scholarship_available, scholarship_names,
scholarship_coverage_level, tunisia_eligible, program_url, admissions_url,
funding_url, source_urls, verification_status, verifier_agent, verified_date,
red_flags, fit_notes
```
Field rules:
- `id` — `<PATHLETTER>-<3-digit>` e.g. `A-001`, `AC-007`.
- `mobility` ∈ {single_site, rotating}
- `scholarship_coverage_level` ∈ {full+stipend, full_tuition, partial, none_found}
- `verification_status` ∈ {VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED, CONFLICT, DEAD_LINK}
- `accepts_engineering_bachelor` ∈ {yes_explicit, likely, unclear, no} — from official admission text ONLY.
  Where a program demands 240 ECTS or a 4-year degree, the client QUALIFIES (300 ECTS) — say so in `fit_notes`.
- `tunisia_eligible` refers to the SCHOLARSHIP's nationality rules, not the program.
- `source_urls` — pipe-separated (`|`), no commas.
- **Quote every field containing a comma.** Write with a real CSV writer (python `csv` module), not by hand.

## Leads from a prior sweep (use, but re-verify everything)
`research/leads/leads_spain.csv`, `leads_netherlands.csv`, `leads_germany.csv` — 437 rows harvested from an
earlier, broader search. They are UNVERIFIED leads: grep them for your path's keywords, then confirm on the
official site. They are a floor, not a ceiling — most of your value is in what they missed.

## Tooling
`WebSearch` and `WebFetch` are deferred — load them first with:
`ToolSearch(query="select:WebSearch,WebFetch", max_results=5)`
Search in ES / NL / DE as well as English. Budget ~20–30 searches. Depth over speed.
