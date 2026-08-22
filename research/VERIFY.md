# WAVE 3 — VERIFICATION BRIEF (the wave that matters most)

Read `/home/user/master/research/BRIEF.md` first for the client profile and the 35-column schema.
This file tells you how to verify. Today is **2026-08-22**; the target intake is **September 2027**.

## Your slice
You own ONE file: `research/wave3/slice_<N>.csv`. It is already sorted so the **most important rows come
first** — client-priority paths (A, C, N) ahead of the rest, and unverified rows ahead of verified ones.
**Work strictly top to bottom.** If you run out of budget you must have finished the rows that matter.

## Write incrementally — this is mandatory
Earlier agents in this project were killed mid-task by an API session limit and lost everything.
After **every 5 rows**, rewrite your output file with all rows processed so far (unprocessed rows copied
through unchanged). Re-running the same Python heredoc and overwriting is fine. Never hold results in
memory to the end.

Output: `research/wave3/verified_<N>.csv` — same 35 columns, same row order, every row present.

## Per row, do this
1. **Open `program_url`.** If it 404s or redirects to a listing, hunt for the real page on the same
   domain (site search, the programme index). Found → replace the URL. Not found → `verification_status
   = DEAD_LINK` and say in `red_flags` where you looked.
   - Many official sites block automated fetches. When WebFetch returns 403/503, retry with
     `curl -sSL --max-time 40 -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"`
     and strip tags in Python. If BOTH fail, record `UNVERIFIED` and name the block in `red_flags` —
     never quietly leave a Wave-1 guess wearing a VERIFIED badge.
2. **Confirm, from the page you actually opened:**
   - the programme still exists and admits for **2027** (or record the latest cycle it does admit for);
   - `language_of_instruction`, `duration_months`, `ects`;
   - `tuition_non_eu_eur_per_year` — **the non-EU/international rate**, per year, from the official fees
     page. Spanish publics quote €/credit: multiply and show your arithmetic in `tuition_notes`;
   - `application_opens` / `application_deadline`, **and which cycle they belong to**. If only 2026-intake
     dates exist, record them and write "2026 cycle — 2027 TBC" in `deadline_source_cycle`.
     **Never present a past cycle's deadline as the 2027 deadline.**
   - `english_level_required` — the exact IELTS/TOEFL score (the client has not sat a test yet);
   - scholarship existence, coverage level, and **nationality eligibility for a Tunisian**.
3. **`accepts_engineering_bachelor` — the single most important field.** Judge it from the actual
   admission text against the client's real credential: a **5-year software-engineering diploma, 300 ECTS**.
   - A 180/240-ECTS or 3/4-year requirement is **satisfied** — say so in `fit_notes`.
   - A demand for N credits **in a named subject** (musicology, marketing, media studies) is NOT satisfied
     by engineering credits. Mark `no` and name the subject and credit count in `entry_requirements_summary`.
   - Where a **pre-master / bridging route** is offered for wrong-subject applicants, record it in
     `fit_notes` with its length — it converts a `no` into a longer plan rather than a rejection.
   - Where the programme sets a **210 or 240-ECTS bar that shortens the degree** for those who clear it,
     say so explicitly — that is a direct saving for this client.
4. **Conflicts.** Where the official page contradicts the Wave-1 value, **the official page wins**:
   correct the field, and append to `red_flags`: `CONFLICT: <field> was "<old>", official page says
   "<new>" (<url>)`. Set `verification_status = CONFLICT` only where you could not resolve which is true.
5. **Stamp the row:** `verification_status` = VERIFIED (key facts proved by a URL you opened this session)
   / PARTIALLY_VERIFIED (some proved, some not) / UNVERIFIED / CONFLICT / DEAD_LINK.
   `verifier_agent` = `W3-<N>`, `verified_date` = `2026-08-22`. Add every URL you opened to `source_urls`
   (pipe-separated). Preserve existing `red_flags` content — append, never overwrite.

## Anti-hallucination rules (hard)
- **No fact enters VERIFIED without a URL you actually opened this session.**
- Do not "remember" a tuition figure or a deadline. Do not average, interpolate, or round.
- If a page is in Spanish, Dutch, Catalan or German, **read it**. Do not skip and guess.
- `TBC` is a correct answer. A plausible invented number is a failure that will be acted on.
- Downgrading a row from VERIFIED to UNVERIFIED because you could not reach the page is a SUCCESS,
  not a regression. Report how many rows you downgraded.

## Final message
Report: rows processed, counts by final verification_status, how many you **downgraded** and how many
**upgraded**, the CONFLICTs you found with both values, any DEAD_LINK you could not resolve, and the
three most decision-relevant corrections you made.
