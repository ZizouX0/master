# SHARED AGENT BRIEF — Spain Master's Sweep
Read this fully before your first search. Your slice instruction is in your own prompt.

## Candidate
Tunisian citizen (**non-EU**, no prior Spanish residency). Software Engineering degree,
SMU MedTech Tunisia, **300 ECTS**, 5-year, completed Aug 2026. Arabic native, French fluent,
English fluent, **Spanish A0/A1 now** (B1-B2 possible by Sept 2027). Also a working music
producer/DJ. **Target intake: September 2027.** Funding availability is a primary ranking
factor, not a footnote.

Two consequences you must internalise:
1. 300 ECTS **exceeds** the usual 240-ECTS entry bar. For every programme, check for
   advanced standing, `reconocimiento de creditos`, or exemption from `complementos de
   formacion`. This is a ranked field, never skip it.
2. Language of instruction is a **filter**. Spanish-only programmes are in scope but flagged.
   Never infer English from an English version of the webpage.

## The nine fields (path codes)
- `A`  Sound & Music Computing / Audio Technology
- `B`  Music Information Retrieval / AI for Music (often a TRACK inside a bigger master - record tracks too)
- `C`  Audio Signal Processing & DSP (usually a track inside telecommunications engineering masters)
- `AA` Artificial Intelligence / Machine Learning
- `AB` Data Science
- `AC` Cloud / DevOps / SRE / Distributed Systems (rarely standalone - check software eng,
       computer eng, cybersecurity masters for cloud/infra tracks, and cert+master hybrids)
- `X`  Business Analytics
- `P`  Music Industry / Label & Publishing Management
- `S`  Events, Festival & Live Entertainment Management

## NON-NEGOTIABLE RULES
1. **Primary sources only.** The programme's own page on the university's own domain.
   Aggregators (Masterstudies, Studyportals, Educaedu, Emagister, FindAMasters, mastermania,
   quecursar) may be used **to DISCOVER**, never to state a fact. Discovery via aggregator
   MUST be followed by verification on the university site.
2. **Every factual field carries a source URL and an access date.** No URL, no field.
3. **If a fact cannot be found write `NOT FOUND`.** Never estimate, never infer, never carry
   a figure over from a similar programme. `NOT FOUND` is a useful result. A plausible
   invention is a corrupted dataset and a failed task.
4. **Fee figures must state the year they apply to**: `EUR X,XXX (2026-27 rates)`.
   Spanish public fees are set annually per autonomous community and change.
5. **Non-EU surcharge must be checked explicitly.** Several communities charge non-EU /
   non-resident students differently. Do not assume the headline price applies.
6. **`master universitario` vs `titulo propio` - the single most consequential distinction.**
   - `Master universitario` (OFFICIAL): ANECA-verified, appears in RUCT, grants PhD access,
     EU-recognised, eligible for public scholarships.
   - `Titulo propio` / `master propio`: the university's own certificate. NOT ANECA-verified,
     **NO PhD access**, weaker recognition, usually ineligible for public funding, and
     frequently marketed identically to the official kind.
   - Verify against RUCT: https://www.educacion.gob.es/ruct/  If it is not in RUCT it is
     not official, whatever the marketing says. RUCT is a form-based app that is hard to
     deep-link; practical route: (a) most official programme pages state their own
     `codigo RUCT` / `codigo del titulo` - capture it; (b) google
     `site:educacion.gob.es/ruct <programme>`; (c) an official master's page virtually always
     carries the words `Master Universitario` plus a BOE publication reference and an ANECA
     /`verificacion` link. Absence of all of these = treat as `titulo propio` and say so.
7. **Never trust a translated page for language of instruction.** Find the explicit statement
   (`idioma de imparticion` / `llengua de docencia`). If the English page says English but the
   official plan says `castellano`, **the official plan wins**.
8. **Record contradictions, do not resolve them silently.** Two pages disagree -> log both
   values with both URLs and flag `CONFLICT`.

## ⛔ WRITE AS YOU GO — THE SINGLE MOST IMPORTANT RULE IN THIS FILE

**Append each record to your output file the moment you finish it. Never batch your writes
to the end of the task.**

This is not style advice. Session limits have twice killed a dozen agents at once, and the
ones that died on the line *"now I'll write the records"* produced **nothing at all** —
hours of correct, sourced research lost, because it existed only in their heads. The agents
that had been appending as they went lost only their current record.

Concretely:
- finish programme 1 → append line 1 → finish programme 2 → append line 2 → …
- never hold more than ONE finished record unwritten;
- if you are cut off, everything already appended survives and the orchestrator can see
  exactly where you stopped.

An agent that returns a beautiful summary and an empty file has failed the task completely.
An agent that writes 9 of 15 records and dies has done 60% of a job. Be the second one.

## Output discipline
- Write your results **to the JSONL file named in your prompt**, one JSON object per line.
- Return to the orchestrator only a SHORT summary: counts, the file you wrote, and anything
  that blocked you. Do not paste your dataset back.
- Be economical with fetches: search first, fetch the pages that matter. Do not fetch a page
  twice. Prefer the university's own domain.

## Final instruction
An incomplete dataset that is honest about its gaps is a SUCCESS.
A complete-looking dataset containing one invented fee, deadline, or eligibility ruling is a
FAILURE, because it will be acted on.

---

## RUCT IS MACHINE-QUERYABLE — use the script, do not guess

`.masters-search/spain/ruct.py` drives the RUCT form directly. Use it instead of guessing
official status or trying to fetch the form by URL.

```bash
python3 .masters-search/spain/ruct.py "inteligencia artificial" "ciencia de datos"
python3 .masters-search/spain/ruct.py --universidad "Pompeu Fabra"
python3 .masters-search/spain/ruct.py --json "sonido"      # machine-readable
```
Columns: RUCT code · title · university · estado (BOE state).

**Three traps this script already handles, which will silently corrupt your results if you
write your own query instead:**
1. **An accented term returns ZERO ROWS, not an error.** `musica` finds 41 titles; `música`
   finds none. That looks exactly like "no such programme is registered" — the most
   dangerous wrong answer available here. The script strips accents for you.
2. **The form keeps the previous query in server-side session state.** Reusing one HTTP
   session makes every term after the first return the FIRST term's results, which looks
   like a successful query. The script opens a fresh session per term.
3. **RUCT matches substrings, so SHORT terms win.** `tecnologias del sonido` → 2 rows;
   `sonido` → 3; `musica` → 41. Query short and broad, then filter yourself.

**Reading `estado` matters as much as presence.** `TITULACIÓN A EXTINGUIR` / `EXTINGUIDA`
means the title is being wound down and **may not accept a September 2027 intake at all** —
record that, because a programme's mere presence in the register is not the same as it being
open to you. `Publicado en B.O.E.` is the healthy state.

**Citable source for a fee/status claim:** RUCT has no deep links, so cite the programme
page's own stated `código RUCT` / BOE reference as the primary source, and use this script
as the cross-check. Put the RUCT code in `ruct_code` either way.

**A pre-built backbone of every registered master in the nine fields is at
`output/ruct-backbone.jsonl`** (fields: ruct_code, title, university, estado, active,
path_codes, query_terms). Check it before running your own query — it may already answer you.

---

## Domains that block automated fetching — what to do

Some institution sites sit behind a Cloudflare JS challenge and return **HTTP 403 to every
automated fetch** (WebFetch, curl, and a real headless browser alike). Confirmed blocked:
**www.upf.edu**, **unir.net**, **il3.ub.edu**, **pointblankmusicschool.com**, **imep.es**,
**ucjc.edu** (returns HTTP 202 with a 221-byte shell for HTML *and* PDFs — looks like a
response, carries nothing), **www.uclm.es**, **fundacionsgae.org**.

⚠️ **Two UPF specifics, verified — do not over- or under-apply the block.**
`mtg.upf.edu` looks like a way round it but **302-redirects into `www.upf.edu`** and hits
the same wall, so the Music Technology Group's own pages are genuinely unreachable.
But **`bsm.upf.edu` is NOT blocked** — UPF Barcelona School of Management is a separate
site serving both WebFetch and curl normally. Do not skip it because of the upf.edu
warning: its Data Analytics for Business master is official (RUCT 4318274) and its next
intake is **27 September 2027**, this candidate's exact target intake.

⚠️ **`fundacionindra.org` and `fundacionaccenture.org` fail with a 502 at the network
gateway** — that is an environment block, NOT evidence that no scheme exists. Never write
those up as a negative finding.
`guiadocent.upf.edu` and `estudiospropios.unizar.es` are additionally refused by the network
gateway. Chromium/Playwright does NOT get through — do not spend time on it. The Wayback
Machine is rate-limited here and is not a reliable fallback either.

**UPF is the single most important institution in this sweep, so this matters.** The route
that does work:
1. **WebSearch still surfaces the page content** from the search index even when the page
   cannot be fetched. Use it, and quote what it gives you.
2. **RUCT gives you official status and the RUCT code** regardless of the site being blocked.
3. **Public fees do not come from the university page anyway** — they come from the
   autonomous community's annual `decreto de precios públicos`, which is fetchable. Use it.

**Then be honest about provenance.** Any fact obtained from a search index rather than the
page itself must be recorded with `"source_access": "search index — page returns 403,
not directly fetched"` alongside the URL, and the programme must be listed in `gaps.md` as
**needing a human to open it in a normal browser**. Do NOT present indexed content as if you
had read the primary page, and do NOT let a blocked domain become an invented fact.

---

## Budget your searches — several wave-1 agents ran out

WebSearch is capped **per agent** (~200 calls) and multiple agents hit the ceiling
**mid-slice**, losing their last planned sweeps. The exhaustion message reads as though the
limit were session-wide and already drained by others — it is not, and it has been verified
that search keeps working elsewhere after an agent reports this. **Do not treat it as a
reason to stop early or to skip searching at the start of your slice.** It is your own
budget; spend it deliberately:

1. **Check `output/ruct-backbone.jsonl` FIRST.** It already holds every RUCT-registered
   Spanish master across all nine fields (1,056 titles, 561 currently active) with code,
   title, university and `estado`. Grepping it costs nothing and answers most
   official-status questions outright — do not spend a search or a RUCT query on something
   already sitting in that file.
2. Search to **locate** a page; fetch to **read** it. Do not search for facts a page you
   already have will tell you.
3. Never fetch the same URL twice — note what you learned the first time.
4. If you are running low, **write what you have to your JSONL before continuing**. A file
   with 20 solid records beats an agent that dies holding 40 in its head.

---

## CORRECTION TO RULE 6 — "not in RUCT" does NOT always mean "not official"

Rule 6 says: *if it is not in RUCT it is not official.* That is true for **university** titles
and false for one whole category, and applying it naively misclassifies real official
programmes as `título propio`.

**`Máster en Enseñanzas Artísticas` is a separate official register that RUCT does not
contain.** This was confirmed empirically during wave 1: querying RUCT for the conservatory
sector returns zero master records, while those same programmes are ANECA-evaluated and
homologated by BOE order (e.g. Orden EFP/673/2023 for the Valencia *Sonología Aplicada y
Creación Sonora*). Conservatories — **ESMUC, Musikene, Conservatori del Liceu**, and the
superior conservatories of music generally — award in this register.

So there are **three** categories, not two:
| Category | In RUCT? | PhD access | Public funding |
|---|---|---|---|
| `Máster Universitario` | yes | yes | yes |
| `Máster en Enseñanzas Artísticas` | **no — and still official** | check per case | check per case |
| `Título propio` / `Máster de Formación Permanente` | no | **no** | usually no |

For an Enseñanzas Artísticas programme, evidence of officiality is **the BOE homologation
order**, not a RUCT row. Record the BOE reference in `ruct_code` prefixed `BOE:` and say in
`notes` that RUCT absence is expected here and is not evidence against it.

⚠️ **The real filter is the admission test, not the degree bar — and the degree bar is
GENEROUS.** An earlier version of this brief said these programmes typically require a
`Título Superior de Música`. That was too pessimistic and is now corrected from source:
**art. 15 RD 1614/2009 admits the holder of ANY official Grado**, not only a music title.
The real gate is **art. 16, the centre-set `prueba de acceso`** — an audition or portfolio
that each centre defines for itself.

So never ask "does it demand a Título Superior de Música?" Ask **"what is the prueba de
acceso, and can a producer's portfolio satisfy it?"** The distinction decides real cases:
one register programme (Musikene's *Mediación, Gestión y Difusión Musical*) selects on
merit with **no audition at all** and states it is aimed at graduates from other
disciplines; others ask for recent work samples with **no scores required**, which a
producer can plausibly meet; only some demand `partitura + audio` or a live audition,
which genuinely closes them.

Note also the evaluation chain: the community proposes, **ANECA *or* a regional agency**
evaluates (Aragón's went through ACPUA), the Ministry homologates by BOE order. So
"no ANECA report" is **not** evidence against officiality here either.

Note also: **`Máster de Formación Permanente` / `Formación Continua` is the post-RD 822/2021
legal name for a `título propio`.** It reads official. It is not.

Because of all this, `output/ruct-backbone.jsonl` covers the university register only and
**does not list conservatory-sector masters** — absence from the backbone is not a verdict.

---

## RUCT detail pages ARE deep-linkable — this fixes rule 2 for official status

The RUCT *search* has no deep links, but the *detail* page does, and it is citable:

```
https://www.educacion.gob.es/ruct/estudio.action?codigoCiclo=SC&codigoTipo=M&CodigoEstudio=<CODE>&actual=estudios
```

So **every official-status claim can and must carry a real URL** — use this one, with the
programme's RUCT code. Put it in `ruct_url`.

That page also answers several ★ schema fields authoritatively, straight from the register:

| RUCT detail field | Schema field it answers |
|---|---|
| `Nº Créditos Complementos Formativos` | **`complementary_credits_required`** — the 300-ECTS question. `0` means no bridging credits are built into the title. |
| `Créditos Totales` + the obligatorios/optativos/prácticas/TFM breakdown | `ects` |
| `Nivel MECES`, `Nivel académico` (RD 822/2021 etc.) | `official_status` |
| `Fecha de verificación`, BOE publication dates, accreditation renewals | official-status evidence with a citable date |
| `Centros en los que se imparte` | which campus actually teaches it |

**`output/ruct-detail.jsonl` already holds all of this** for every active registered title in
the nine fields. Read it before fetching anything — it is the cheapest source of truth you have.

⚠️ **`complementos formativos = 0` in RUCT is not the whole answer.** It means the *title*
carries no compulsory bridging credits; a university can still impose `complementos` on an
individual applicant at admission based on their background. Record the RUCT figure as
evidence, then check the programme's own `acceso y admisión` page for applicant-level rules,
and say which of the two you are quoting.

---

## `ruct_candidate_code` is a HINT, not a fact — challenge it

Batch inputs carry a `ruct_candidate_code` attached by a fuzzy title-and-university matcher.
It has already been wrong in a way that would have corrupted a record: it attached
Universidad Europea de **Madrid**'s Big Data master to RUCT 3500344, which is Universidad
Europea de **Valencia**'s separate title of the same Spanish name. The real code, printed on
UEM's own page, is 4315398.

Spanish universities run near-identical titles at sibling campuses and under bilingual
double names, so title overlap alone cannot identify a title. **Confirm the code from the
programme's own page (`Código RUCT:`) or from the RUCT detail page, and say in `notes` how
you confirmed it.** If it does not match the hint, record the correct one and flag the
mismatch — do not quietly accept the hint.

## The full record schema (wave 2 fills this)

## 6. Data schema

Every programme record. Fields marked ★ are the ones that decide the outcome — never leave them unsourced.

```jsonc
{
  "id": "slug",
  "path_codes": ["A"],              // may match multiple fields
  "programme_name_es": "",
  "programme_name_en": "",
  "institution": "",
  "institution_type": "",           // public | private | specialist school | conservatory
  "city": "",
  "autonomous_community": "",

  "official_status": "",            // ★ máster universitario | título propio | UNKNOWN
  "ruct_code": "",                  // ★ empty means NOT official
  "ruct_url": "",

  "ects": 0,                        // 60 | 90 | 120
  "duration_years": 0,
  "modality": "",                   // presencial | semipresencial | online
  "language_of_instruction": "",    // ★ verbatim from official plan
  "language_source_url": "",
  "language_requirement": "",       // e.g. B2 English certificate required?

  "tuition_total_eur": 0,           // ★ full programme, not per credit
  "tuition_per_ects_eur": 0,
  "tuition_year_of_rates": "",      // ★ e.g. "2026-27"
  "non_eu_surcharge": "",           // ★ yes/no + detail
  "additional_fees_eur": 0,         // enrolment, insurance, admin
  "tuition_source_url": "",

  "entry_requirements": "",
  "accepts_engineering_background": "",     // ★ explicit or inferred? say which
  "complementary_credits_required": "",     // ★ complementos de formación
  "credit_recognition_available": "",       // ★ the 300 ECTS question
  "credit_recognition_source_url": "",

  "application_window_2027": "",     // ★ open and close dates
  "application_rounds": [],
  "non_eu_early_round_advised": "",
  "admissions_contact_email": "",
  "deadline_source_url": "",

  "curriculum_summary": "",
  "notable_faculty_or_lab": "",
  "industry_links": "",
  "thesis_or_internship": "",

  "scholarships_internal": [],       // university's own, with URLs
  "scholarship_ids_external": [],    // FK into funding.jsonl

  "verification_status": "",         // VERIFIED | CONFLICT | UNCONFIRMED
  "conflicts": [],
  "sources": [ {"field": "", "url": "", "accessed": "YYYY-MM-DD"} ]
}
```

---


### Notes on filling it
- `complementary_credits_required`: RUCT publishes this per title. **`null` in
  `output/ruct-detail.jsonl` means the register does not publish the row at all — that is
  NOT the same as `0`.** Write `NOT PUBLISHED IN RUCT` for null, `0 (RUCT)` for zero, and
  add whatever the programme's own admission page says on top, labelled as such.
- `tuition_total_eur`: the FULL programme, not per credit. If the page gives €/ECTS,
  multiply and show your arithmetic in `notes` (e.g. "82 EUR/ECTS x 60 = 4,920").
- `non_eu_surcharge`: check explicitly. **Confirmed real at UAM, UPC, UC3M, UB, UVic, UAH
  and URJC** (URJC publishes a distinct `Estudiantes extracomunitarios, no residentes` row
  at 84.07 EUR/credit vs 45.02 first enrolment). If the page is silent, that is `NOT FOUND`,
  not `no`.
  **The decisive legal point, confirmed from Catalonia's Decret 96/2026 art. 1.5:** a Spanish
  long-stay study authorisation does **not** confer resident status —
  *"l'autoritzacio d'estada de llarga durada per estudis ... no equival a la condicio de
  residents"*. So this candidate is legally non-resident for fee purposes and cannot escape
  the surcharge by enrolling and living there. Several decrees (Catalonia, Asturias) do not
  fix the non-EU price at all — they authorise each university to set it up to 100% of cost,
  so the real figure must be read off **that university's own tariff**, never the decree.
- `application_window_2027`: the Sept-2027 intake. If only the 2026-27 calendar is
  published, record THAT with its year clearly marked and say the 2027-28 dates are not
  yet out — do not shift dates forward by a year yourself.
- `verification_status`: leave as `PENDING`; wave 4 sets it.
