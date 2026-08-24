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
**upf.edu**, **unir.net**, **il3.ub.edu**, **pointblankmusicschool.com**, **imep.es**.
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

WebSearch is capped per agent (~200 calls) and multiple discovery agents hit the ceiling
**mid-slice**, losing their last planned sweeps. Spend the budget deliberately:

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
