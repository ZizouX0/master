# Research spec — Spanish official bachelor's (grado) starting Jan/Feb 2027

Today is 2026-10-04. Applicant: non-EU student, needs a Spanish student visa. Already HOLDS a foreign
bachelor's degree (Business Computing). Wants a SECOND bachelor's (grado oficial) in Spain starting
January or February 2027. Can study in English or Spanish (language level unknown — record the requirement).
Fields: computer science / IT / business first, but record ANY field that has a Feb start.
The admission letter is needed by about early December 2026 (visa lead time).

## What counts as a "program" (goes in `programs`)
An OFFICIAL Spanish grado (listed in RUCT), taught in person (or hybrid with in-person attendance),
that admits NEW full-degree students (first-year or transfer) with a start in January/February 2027.

## What goes in `rejected` (with the reason)
Exchange/Erasmus/visiting-only February entry; online-only/distance degrees; non-official degrees
(títulos propios, foreign-university degrees taught in Spain, "BBA" that is not a grado oficial);
universities/programs you checked that only start in September (reason: "September start only").
Rejected entries must still carry a source URL proving the reason.

## Hard rules
- PRIMARY SOURCE = the official university / government page. Aggregators (blogs, agencies, educaweb,
  unihabit, etc.) are leads only; verify on the official site before recording a fact.
- NEVER guess a number. If not found, write "NOT FOUND" and say in the matching *_text field which
  page(s) you checked.
- Every fact needs a source URL (field_sources). Record the page's "last updated" date if shown.
- If the figure is for 2025-26 or earlier, say so in the text and set data_year accordingly
  ("2025-26 — POSSIBLY OUTDATED").
- Search in Spanish/Catalan AND English: "grado inicio febrero", "admisión segundo semestre",
  "inici al febrer", "preinscripció de febrer", "reserva de plaza", "carta de admisión visado",
  "acceso por cambio de estudios", "titulados universitarios cupo", "reconocimiento de 30 créditos",
  "February intake bachelor", "January intake", "deposit refund visa denied".
- Tools: WebSearch and WebFetch. You may also use `curl -sSL` via Bash (an HTTPS proxy is preconfigured;
  never disable TLS checks) to download PDFs (fee decrees, normativas, price lists) and read them with
  `pdftotext` if available or python. Save any downloads under the scratchpad research folder.
- Be efficient: when a university clearly has no Feb intake for new students, one solid source is enough
  to reject it. Spend effort on the ones that DO have a Feb start.

## Output: write ONE JSON file (UTF-8, valid JSON) at the path given in your task, shaped:
{
  "group": "<your group name>",
  "programs": [
    {
      "university": "", "city": "", "type": "Public | Private | Affiliated centre of <public university>",
      "degree": "Grado en ...", "field": "CS/IT | Business | Business+IT | Other",
      "language": "English | Spanish | Catalan/Spanish | Bilingual ...",
      "feb_start_confirmed": "YES | UNCLEAR",
      "feb_start_evidence": "short quote/paraphrase from the official page",
      "application_deadline": "e.g. 2026-11-30, or 'Rolling until places filled', or NOT FOUND",
      "application_fee_eur": number or "NOT FOUND" or 0,
      "application_fee_text": "",
      "deposit_before_letter_eur": number or "NOT FOUND" or 0,
      "deposit_text": "what must be paid before the admission letter / reservation of place is issued",
      "deposit_deducted_from_tuition": "Yes | No | NOT FOUND",
      "refund_if_visa_refused": "Yes | Partial | No | NOT FOUND",
      "refund_text": "exact conditions (documents needed, deadlines, retained admin fee)",
      "annual_tuition_non_eu_eur": number or "NOT FOUND",
      "tuition_text": "basis: per-credit price x 60, academic year of the figure, non-EU surcharge, etc.",
      "foreign_graduate_eligible": "Yes | Conditional | No | NOT FOUND",
      "graduate_route": "graduate quota / credit recognition (30+ ECTS) / direct admission / UNEDasiss / homologación ...",
      "language_requirement": "level + accepted certificates, or NOT FOUND",
      "official_ruct": "Yes (RUCT code ...) | Yes (per university page) | No | Unverified",
      "data_year": "2026-27 | 2025-26 — POSSIBLY OUTDATED | ...",
      "page_last_updated": "date shown on page or 'not shown'",
      "visa_timing_note": "can a letter realistically be issued by early Dec 2026?",
      "risks": "anything that makes this option shaky",
      "field_sources": {
        "feb_start": ["url"], "deadline": ["url"], "fees_deposit": ["url"], "refund": ["url"],
        "tuition": ["url"], "graduate_route": ["url"], "language": ["url"], "ruct": ["url"]
      }
    }
  ],
  "rejected": [
    {"university": "", "city": "", "type": "", "degree": "", "reason": "", "source_urls": ["url"]}
  ],
  "sources": [
    {"url": "", "title": "", "official": true, "last_updated": "", "used_for": ""}
  ],
  "notes": "cross-cutting findings, rules, contacts (admissions emails) worth knowing"
}
