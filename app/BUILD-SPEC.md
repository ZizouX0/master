# Build spec — the Door 3 app

Merged from `DESIGN-UX.md`, `DESIGN-ARCHITECTURE.md` and `DESIGN-CRITIQUE.md`.
Where they disagreed, this file decides. Coding agents implement **this**; the other three
are reference.

---

## What it is

A decision tool over **Door 3 — music production and studio craft**: 398 programme records and
120 funding schemes, mirroring `results/DOOR3.xlsx` record for record.

**For one person**: Tunisian, software-engineering BSc, no music degree, no portfolio yet,
French fluent / English working / no German, needs a visa, September 2027 intake, limited money.
**Usually on a phone.**

## The critique's verdict, accepted

> The browsing features are decoration. **The tracker is the product.**

So the build order is: make the *decision* legible first, the *tracker* second, and browsing last.
A filterable table already exists in Excel and he likes it. This must do what a spreadsheet cannot:
show the long prose, keep his own state, and never let an unchecked record look checked.

---

## The spine: two sets in tension

The landing screen states the finding that organises everything:

> **Everything verified is expensive. Everything affordable was unverified — until now.**

Then the funnel, computed live from the data, each step clickable:

| | |
|---|---:|
| All records | 398 |
| Real master's degrees | 261 |
| No **confirmed** audition | 227 |
| English or French | — |
| Not ruled out | — |
| A real chance | — |
| **Affordable (≤ €5k/yr)** | **15** |

and under it, that final set broken by verdict — **1 worth it · 10 conditional · 4 unchecked**.

Never render that final set as a uniform list. The verdict split must be visible on the same screen.

---

## Views

1. **Start** — the tension sentence, the funnel, the shortlist counts, and three entry buttons:
   *The 15 I could actually do* · *Money* · *My list*.
2. **Programmes** — filtered list. Card shows: institution, programme, country, **verdict chip**,
   **gate chip**, cost band, language, and a **"not verified" marker when `verdict` is empty**.
3. **Record** — the full detail. Field order and rules in §Record page below.
4. **Money** — the 120 funding schemes, ordered by what disqualifies fastest.
5. **Not a degree** — the 130, grouped by pattern (*título propio*, RNCP-5 *Mastère*,
   *pós-graduação*, UK validation chain, dBs online-only = no visa).
6. **My list** — the tracker. Starred, status, notes, next action, export.

---

## Record page — field order and rules

1. Institution · programme · country/city
2. **Verdict block** — verdict, `verdictWhy`, and **`correction` in full**.
   *Column G is mandatory. Omitting it is the defect that killed the previous console.*
3. **Disputes** — `costDisputed` / `auditionDisputed` / `existenceDisputed`, each with the phrase
   that triggered it, and labelled **confirmed** (from verified prose) or **suspected** (from the
   unchecked field).
4. **Can I get in** — `gate`, `audition`, `portfolio`, `acceptsNonMusic`, `entry`
5. **What it costs** — `costBand`, `tuition`, `otherFees`, `totalCost`, funding, `scholarshipDetail`
6. **When** — `deadline`, `opens`
7. **What it is** — `level`, `qualification`, `accreditation`, `duration`, `study`, language fields
8. Source link, `foundBy`, and the recorded `chance` + `whyChance` **last** — a verdict outranks it.

**Three renderings that must differ visibly:**
- a value
- **`UNVERIFIED`** — "nobody published this", styled as an explicit gap
- **empty** — not collected

---

## Non-negotiable correctness rules

1. **An empty `verdict` is never styled like a verdict.** 249 of 398 are unchecked.
2. **`isDegree: false` is visible without clicking**, at the same visual weight as the title.
   57 of the 130 have "Master"/"Máster"/"Mastère" in their name.
3. **Never dereference `"DUPLICATE of index N"` in `correction`.** Those pointers are stale — all 65
   cross a country boundary. Display the sentence, follow nothing.
4. **Never print a bare date for a deadline containing `PRIOR CYCLE`** (190 records). Show the
   string and mark it as a previous cycle.
5. **A cost-disputed record may not appear in any "cheap" or "free" selection** without its
   correction shown alongside.
6. **`id` is positional and changes on re-export.** Personal state keys on
   `hash(institution + programme + url)`, never on `id`.
7. **Dedup**: two-tier URL/institution key, **no transitivity** (union-find merged 27 unrelated SAE
   records through a shared fees page). Show one entry per group, or all with the disagreement
   stated. The WORTH IT count must read **distinct programmes**, not rows.

---

## Stack — decided, not to be revisited

- **Preact 10** + **preact-iso** (routing) + **zustand** (state) — 5.2 KB gzip vs React's 58.7
- **Vite 7** + **vite-plugin-singlefile** — two outputs: a normal static site, and one
  self-contained `.html` that works offline
- **TypeScript 5.9**, **Vitest** for the correctness rules above
- **No search library.** A hand-rolled weighted scan measured as fast as MiniSearch and costs 0 KB
  against its 195 KB index. Searchable: institution, programme, and the prose fields
  (`portfolio`, `entry`, `acceptsNonMusic`, `verdictWhy`, `correction`, `study`).
- **No backend. No analytics. No fonts from a CDN.**

## Data

Build step runs `.masters-search/export_door3_app.py`, then splits:
- `index.json` — card fields only, ~37 KB gzip, blocks first paint
- `detail.json` — the nine prose fields (59% of bytes, on no card), fetched after
- `funding.json`, `meta.json`

## Personal state

```ts
type Status = "none" | "shortlist" | "emailed" | "applying" | "applied" | "rejected" | "ruled-out";
interface Entry { key: string; status: Status; note: string; nextAction: string; updated: string; }
```
localStorage, versioned, with **export to JSON and to Markdown**, and import back. He must be able
to get his work out of the browser in one click.

---

## Definition of done — the kill test

From `DESIGN-CRITIQUE.md §6`, all nine must pass. The load-bearing ones:

- Records **253, 254, 258, 259, 260** must show a live performance / ear test and must not appear in
  any "no audition" or "free and reachable" list.
- **Edinburgh (120)** must read ≈£29,900 and **KASK (5)** ≈€8,800, each marked as a correction, and
  neither may appear in a cheap selection.
- The **WORTH IT count must be distinct programmes** — ICMP's three rows are one programme.
- **Parity**: five records from the workbook's VERIFIED WORTH IT tab — every non-empty cell in
  columns E, F, **G**, H, K, S findable in the app.
- The app must be able to state that **249 of 398 were never verified**.

A verification agent runs this against the built app in headless Chromium at 390 × 844 before
anything ships.
