# Verification — Door 3 app

**Verified:** 14 August 2026
**Method:** headless Chromium 141.0.7390.37 (`/opt/pw-browsers/chromium-1194`) driven over raw CDP
(Playwright is not installed on this machine; the driver is `app/verify/cdp.mjs`, Node 22 global
`WebSocket`). Viewport **390 × 844, mobile, DSF 1**, set through
`Emulation.setDeviceMetricsOverride` — the `--window-size` flag is clamped to 500 px on this box.
**Both artefacts were tested:** `dist/` over HTTP, and `dist-single/door3.html` from a `file://` URL.

> **Serving note.** `dist/index.html` is built with `base: "/master/"` (GitHub Pages, per
> `vite.config.ts`). Served from a server root it 404s its own bundle and renders a blank page. It
> must be served at `/master/` — that is how it was tested here, and how it must be deployed.

Test scripts: `app/verify/*.mjs`. Screenshots: `app/verification-shots/`.
Ground truth was recomputed independently from `public/data/programmes.json` and read from
`results/DOOR3.xlsx` with `openpyxl` — never taken from the app's own claims.

---

## Verdict table

| # | Kill-test item | Result |
|---|---|---|
| 1 | Non-degree test (the money test) | **PASS** |
| 2 | Unverified-gap test | **PASS** |
| 3 | Nineteen-survivors test | **PASS** |
| 4 | Audition test (253, 254, 258, 259, 260) | **PASS** |
| 5 | Edinburgh / KASK cost-correction test | **PASS** |
| 6 | Dedup test (Detmold, ICMP) | **PASS** — with a documented caveat, see below |
| 7 | Deadline-honesty test (`PRIOR CYCLE`) | **PASS** |
| 8 | Funding-eligibility test (Chevening) | **PASS** |
| 9 | Parity test (columns E, F, **G**, H, K, S) | **PASS** |

**Data note.** The critique's §6 numbers describe an earlier export (398 records / 271 unverified /
8 `WORTH IT`). The shipped data is 398 records / **249 unverified** / **9 `WORTH IT` rows across 6
distinct programmes**, which is what `BUILD-SPEC.md` states ("249 of 398") and what
`results/DOOR3.xlsx` contains (9 rows on the `✅ VERIFIED WORTH IT` tab). Items 2, 3 and 6 were
judged against the shipped data and the workbook, and the app's numbers match both exactly.

---

## Item 1 — Non-degree test — PASS

Searched both named records. In each case a red hatched banner sits **above the title, at greater
visual weight than the title**, without clicking:

> *"This is not a master's degree — It awards a certificate, not a master's. No student visa route."*

- **id 44** `Mastère Réalisation et Production Sonore` (ESIS) — banner present. `01-notdegree-search-44.png`
- **id 37** `Máster en Producción Musical Discográfica` (CICE) — banner present. `01-notdegree-search-37.png`

**The optimistic-filter half was checked exhaustively, not sampled.** Enumerating every card in the
`cheap=1` list (85 programmes, pagination exhausted) and cross-referencing `index.json`:

| | |
|---|---:|
| non-degrees (`isDegree: false`) in the cheap list | 21 |
| of those, carrying the not-a-degree banner | **21** |
| unmarked non-degrees | **0** |
| false positives (a real degree wrongly banded) | **0** |

The 14-programme survivor set contains zero non-degrees. A dedicated `Not a degree` view
(`#/rejects`) groups all 137 by pattern. `02-not-degree-view.png`

## Item 2 — Unverified-gap test — PASS

At list level every card carries one of four chips — `✔ WORTH IT`, `! CONDITIONAL`, `✕ AVOID`,
`? NOT VERIFIED` — so a checked and an unchecked record are never interchangeable.
`02-list-verified-vs-unverified.png`, `06d-list-default-top.png`

Counts the app states in its own words:

- Start screen: *"249 of 398 records have never been checked against an official page"* — matches the data exactly.
- Start screen: *"Nothing in this app is verified unless it says so. Where a record carries no verdict it gets no colour — absence of colour means absence of checking."*
- `Not a degree` view: *"137 of 398 are sold as a master's and are not one… 135 of them carry no verdict"* — matches (137 non-degrees, 135 unverified).
- Every screen footer: *"Snapshot 2026-08 · mirrors results/DOOR3.xlsx · nothing here is verified unless it says so"*.

## Item 3 — Nineteen-survivors test — PASS

The funnel's final step returns **14 programmes — 19 or fewer**, and the set is not uniform.
`03-survivors.png`, `01-start.png`

The Start screen prints the funnel live (355 → 233 → 206 → 114 → 75 → 56 → **14**) and immediately
under it, **"AND THOSE 14 ARE NOT EQUIVALENT — 1 read and judged worth it · 10 conditional · 3 never
checked"**, with *"Those 3 came from a search listing, not from the institution. Treat every line on
them as a lead, not a fact."* The entry button repeats the split. On the list screen itself each of
the 14 cards carries its own verdict chip.

## Item 4 — Audition test — PASS

All five records carry `auditionSource: "confirmed"` in the data. The app does **not** trust the
`gate` string — it renders a red **`▲ LIVE AUDITION`** chip in the header block, above the fold,
next to `AVOID` and `Free`:

| id | Institution | `gate` as recorded | chip shown above the fold | phrase shown |
|---|---|---|---|---|
| 253 | FAMU Prague | `Exam/interview only` | `▲ LIVE AUDITION` | "LIVE PERFORMANCE AUDITION" |
| 254 | FAMU Prague | `Portfolio only` | `▲ LIVE AUDITION` | "live performance audition" |
| 258 | Filmuniversität Babelsberg | `Exam/interview only` | `▲ LIVE AUDITION` | "music test with piano" |
| 259 | Filmuniversität Babelsberg | `Exam/interview only` | `▲ LIVE AUDITION` | "music test with piano" |
| 260 | Filmuniversität Babelsberg | `Exam/interview only` | `▲ LIVE AUDITION` | "music test with piano" |

Each record page also carries a `CONTRADICTIONS FOUND IN THIS RECORD` block:
*"**CONFIRMED** — A LIVE AUDITION OR EAR TEST MAY BE PART OF THE ENTRANCE EXAM … Treat it as real: a
performance audition is the one gate a twelve-month portfolio build cannot open"*, plus the
triggering phrase and the full `correction` text.

Shots: `fold-253-audition.png`, `fold-258-audition.png`, `04-audition-253/254/258/259/260.png`.

**Absence from reachable lists — every list enumerated in full with pagination exhausted:**

| list | size | contains 253/254/258/259/260 |
|---|---:|---|
| default `#/list` | 326 | **none** |
| `aud=none-found` ("no audition") | 282 | **none** |
| `cost=Free` | 10 | **none** |
| `cheap=1` (affordable ≤ €5k/yr) | 85 | **none** |
| the 14 survivors | 14 | **none** |

`04b-free-list.png`, `04b-no-audition-list.png`

The mechanism is correct at source: `hasConfirmedAudition()` keys on `auditionSource === 'confirmed'`
(set from verified prose) rather than on the exported `needsAudition` boolean or the `gate` label —
which is exactly the defect §1c describes.

## Item 5 — Edinburgh / KASK — PASS

**Edinburgh (id 120)** — the recorded band is rendered **struck through in red** with the correction
flag inline, above the fold: `~~Under €1.5k/yr~~ · WRONG — see correction`. `fold-120-edinburgh.png`
The verdict text reads *"the fee is around GBP 29,900"*, and the `CORRECTION (WORKBOOK COLUMN G)`
block carries the full sentence *"COST BAND BADLY WRONG… approximately GBP 29,900 per year — around
twenty times the recorded band."* `05-record-120.png`

**KASK (id 5)** — same treatment. Verdict text: *"a non-EEA student pays EUR 8,800.20 per year
against an input that claimed under EUR 1,500"*; correction block carries *"WRONG BY A FACTOR OF
SIX"*. `05-record-5.png`

The correction marker travels with the **card**, not just the record page — searching `Edinburgh`
shows `Under €1.5k/yr · WRONG — see correction` in the list. `05-search-edinburgh.png`, `05-search-kask.png`

**Cheap selections:**

| selection | size | Edinburgh (120) | KASK (5) |
|---|---:|---|---|
| `cheap=1` — "Affordable ≤ €5k/yr" | 85 | absent | absent |
| `cost=Free` | 10 | absent | absent |
| "Cheapest" sort applied | 85 | absent | absent |

`isCheap()` returns `false` whenever `costDisputed` is non-empty, whatever the band says. The filter
sheet states this in plain English: *"Affordable — ≤ €5k/yr · Cost-disputed records are excluded
whatever their band says: Edinburgh's ≈£29,900 still sits in a cheap band."* `05b-cheapest-sort.png`

The one place record 120 still appears is the **raw `costBand` facet** `Under EUR 1.5k/yr` (33
results) — a facet that honestly reports "records whose *recorded* band is X". It appears there with
the struck-through value and the `WRONG — see correction` marker on the card, which is what
`BUILD-SPEC` rule 5 requires ("may not appear … **without its correction shown alongside**").

## Item 6 — Dedup test — PASS (with caveat)

**ICMP — PASS.** The app's headline count reads **distinct programmes, not rows**:

> *"**6 distinct programmes (9 rows)** have been opened, read and judged worth it."*

`#/list?v=WORTH+IT` returns **6 programmes** against 9 source rows. The ICMP card states
*"3 records for this programme, from different searches — the fullest is shown."*
Ground truth: 9 `WORTH IT` rows = PoliMi, ICMP ×3, Leeds Beckett, Huddersfield ×2, Westminster,
HfMT Köln = **6 distinct**. Exact match. `06-search-icmp.png`

**Detmold — PASS.** Six records (261, 262, 263, 264, 274, 331) share one URL with three cost bands
(`Free`, `Under EUR 1.5k/yr`, `Not published`). The app collapses them to **one programme** and
states the disagreement rather than picking a winner. Record 331 renders:

> **OTHER RECORDS FOR THIS PROGRAMME**
> *6 source rows describe this same programme. They came from different discovery sweeps with
> different field coverage, so the app counts them once and shows the fullest — **but it does not
> quietly average them**.*
>
> **THESE ROWS DISAGREE WITH EACH OTHER**
> Cost band: Free · Under EUR 1.5k/yr · Not published
> Gate: Portfolio + exam/interview · Exam/interview only
>
> *Nothing here resolves that. Take the correction and the official page as the authority, not the
> row with the friendliest number.*

…followed by all six rows itemised (`row 261 · Free · AVOID` … `row 331 · Not published · AVOID ·
you are reading this one`). This is the requirement met in full. `06-record-331.png`, `06-detmold-all.png`

**Caveat — the Detmold group is behind a default filter.** Its group primary (331) carries a
confirmed audition, and the Programmes list ships with **"Hide confirmed live auditions" ON**, which
suppresses 29 of 355 programmes (18 AVOID, 10 unchecked, 1 CONDITIONAL — every one with a confirmed
live-performance or ear test). So searching `Detmold` in the default state returns 2 programmes and
not the six-record group. It is reachable in two taps — `Filters ▾` → `Hide confirmed live auditions`
— and the control is clearly labelled and explained in the sheet (*"A production test is not an
audition. Only a confirmed live performance test is hidden here"*), after which the list reads
**355 programmes** with an `incl. live auditions` chip. `06-detmold-default.png`, `06d-drawer-after-click.png`,
`x-list-auditions-included.png`

I score this **PASS** — the dedup behaviour the item demands is present, correct and reachable, and
the default that hides it exists to satisfy item 4 — but see finding **F1** below, which I do
consider worth fixing before this goes in front of him.

## Item 7 — Deadline-honesty test — PASS

12 records sampled. **No bare date is printed anywhere.** Every record whose `deadline` contains
`PRIOR CYCLE` renders:

> **DEADLINE — PRIOR CYCLE — CONFIRM THE 2027 DATE**
> *This is a previous cycle. The 2027 date has not been published — confirm it with them.*
> **AS RECORDED, VERBATIM** — *`<the original string>`*

The verbatim string is always shown, never parsed into a date. The banner also rides along into the
tracker: My List shows *"DEADLINE — PRIOR CYCLE — CONFIRM THE 2027 DATE · Previous cycle. The 2027
date is not published — confirming it is an email you can send today."*

**Nothing sorts, groups or counts these as 2027 dates** — the only sort control on the list is a
three-option select: `Verdict / Cheapest / Country`. There is no deadline sort in the app.
`07-prior-cycle-30.png`

## Item 8 — Funding-eligibility test — PASS

Chevening is present and is **not** presented as available. Its card reads:

> **THE PROSE SAYS HE CANNOT USE THIS ONE BAR** · **WORK EXPERIENCE BAR**

It is ordered to the **very bottom** of all 120 schemes (character 39,301 of 39,989 of the page), and
it is **excluded** from the `No work-experience bar` filter (40 schemes) despite its
`requiresWorkExperience` cell being empty. `08-chevening-card.png`, `08-money-filtered.png`

The normalisation is done and disclosed on the page itself:

> *"Normalised before filtering: 72 schemes have an empty `requiresWorkExperience` cell, so the prose
> is read instead; 21 have a `requiresAdmissionFirst` value that no reading settles. Neither is shown
> as a 'no'."*

Source confirms `workExperienceBar()` falls back to reading `whoCanApply`/`notes` prose when the
field is silent, `admissionFirst()` normalises the seven spellings plus `UNVERIFIED`, and `ageCap()`
parses a cap out of prose and reports `unknown` rather than guessing. The four eligibility filters
were exercised and return distinct, sensible sets (119 / 49 / 40 / 118 of 120).

## Item 9 — Parity test — PASS

Five records taken from the `✅ VERIFIED WORTH IT` tab of `results/DOOR3.xlsx` (read with openpyxl;
header row 3, columns E `Verified verdict`, F `Why that verdict`, **G `Correction found`**,
H `Admission gate`, K `Cost band (you)`, S `Deadline`).

| xlsx row | app id | E | F | **G** | H | K | S |
|---|---|---|---|---|---|---|---|
| Politecnico di Milano | 30 | ✅ | ✅ | **✅** | ✅ | ✅ | ✅ |
| ICMP — MA Creative Music Production | 72 | ✅ | ✅ | **✅** | ✅ | ✅ | ✅ |
| Leeds Beckett — MA Music Production | 75 | ✅ | ✅ | **✅** | ✅ | ✅ | ✅ |
| Huddersfield — Creative Music Production MA | 82 | ✅ | ✅ | **✅** | ✅ | ✅ | ✅ |
| HfMT Köln — Production (M.Mus.) | 105 | ✅ | ✅ | **✅** | ✅ | ✅ | ✅ |

**30 of 30 non-empty cells findable. Column G present on all five.**

Column G is not merely present — it is a titled block on the record page,
`CORRECTION FOUND — WHAT WAS WRONG IN THE EARLIER DATA` / `CORRECTION (WORKBOOK COLUMN G)`, placed
directly under the verdict, exactly where `BUILD-SPEC` §Record page requires it.

**The app carries more than the workbook does.** The workbook truncates column G at 400 characters;
the app holds the full text (id 30: 400 → 432 chars; id 72: 400 → 802; id 105: 400 → 710). The
"98% prefix" matches in the test log are the workbook's own ellipsis, not app truncation — verified
by direct comparison against `programmes.json`.

Shots: `09-parity-30/72/75/82/105.png`.

---

## Extra checks

### Horizontal overflow at 390 px — PASS

`document.documentElement.scrollWidth === 390` on every screen, measured **twice per screen** (at the
top and after scrolling to the bottom, so sticky bars are caught), on **both builds**:

| screen | HTTP build | offline build |
|---|---|---|
| Start | 390 | 390 |
| Programmes list | 390 | 390 |
| Programmes list, 8 filters active | 390 | — |
| Record (30, 331, 258, 120) | 390 | 390 |
| Money | 390 | 390 |
| Not a degree | 390 | 390 |
| My list | 390 | 390 |
| Filter sheet open | 390 | — |

The filter-chip row reports elements extending past 390 px, but it is an intentional
`overflow-x` scroller — the page body itself never scrolls horizontally.

### Offline single file from `file://` — PASS

`file:///home/user/master/app/dist-single/door3.html` (2.07 MB), no server, no network:

- Renders the full Start screen with the live funnel (355 → 14) and the same 249/398 statement.
- Navigates to records — id 258 shows the `▲ LIVE AUDITION` chip and the column-G correction block.
- Corrections intact offline — id 120 shows `29,900` and the `WRONG — see correction` marker.
- Filters work — `cheap=1` returns 85 programmes, with Edinburgh and KASK correctly absent.
- Search works — typing `Detmold` filters live.
- Tracker works — starring writes to `localStorage` under `file://` and My List reflects it.
- **Zero console output of any kind** on a clean offline-only session.

Shots: `off-01-start.png` … `off-07-final.png`.

### Tracker survives a reload, and export is real — PASS

On record 30: starred it, set status, typed a next action and a note, then navigated away and back.

```
localStorage["door3.personal.v1"] =
{"schemaVersion":1,"entries":{"c7c5fd6b0ed8":{"key":"c7c5fd6b0ed8","status":"emailed",
"note":"NOTE-ALPHA-771: emailed admissions 14 Aug, awaiting reply",
"nextAction":"ASK-POLIMI-2027-DATES","updated":"2026-08-14T04:00:03.252Z"}},...}
```

After reload: note ✅, next action ✅, status `emailed` ✅, star reads `★ On my list` ✅, and My List
regroups the entry under **EMAILED THEM — 1** with *"Waiting on a reply. This is the status with a
clock on it."* `x-tracker-record-after-reload.png`, `x-status-emailed.png`, `x-my-list-after-reload.png`

**Export produces real output**, written into a selectable textarea (the deliberate primary path — a
page-initiated download is inert in a sandboxed frame):

- **Markdown** — 412 chars, grouped by status, with the note and next action as bullets.
- **JSON** — 690 chars, parses cleanly, `format: "door3-personal"`, version-stamped, both entries with note and next action intact.

Entries are keyed on a durable hash (`c7c5fd6b0ed8`), **not on `id`** — `BUILD-SPEC` rule 6 satisfied.
Import (merge / replace) controls are present. My List warns: *"This list lives in this browser's
storage on this device… There is no account and no server — export is the backup."*
`x-export-output.png`

### JavaScript console errors

**Zero JavaScript errors. Zero uncaught exceptions.** Across every run
(`Runtime.consoleAPICalled`, `Runtime.exceptionThrown` and `Log.entryAdded` were all captured):

| entry | severity |
|---|---|
| `GET /favicon.ico → 404` (HTTP build only) | cosmetic |

That is the browser's automatic favicon probe — `dist/index.html` declares no `<link rel="icon">`.
It is not app code and does not occur on the offline build. Nothing else was logged.

### Supporting checks

- `npm test` — **53 tests, 5 files, all pass** (dedup, filters, search, format, personal state).
- `npm run typecheck` — clean.

---

## Findings

**F1 — A search can silently return fewer results than exist, while asserting completeness.**
*Severity: moderate. Not a kill-test failure; worth fixing before he uses it.*
With the default "Hide confirmed live auditions" on, searching `Detmold`, `Musikregie` or
`Babelsberg` returns results that do not include the named institution, and the list ends with the
sentence **"That is all 2."** — a completeness claim that is false. The list header shows
`Filters ▾` with no active-filter chip, so nothing on that surface signals the suppression.
The whole point of this app is not to sound more confident than the data supports, and "That is all
N" is exactly that. **Suggested fix:** show a persistent chip for the default audition filter, and
append *"N more match your search but are hidden by 'Hide confirmed live auditions'"* whenever a
filter suppresses matches. Two lines of copy; no logic change.
Evidence: `06-detmold-default.png`, `06b-search-babelsberg-default.png`, `06c-zero-result.png`.

**F2 — Deployment path is load-bearing.** `dist/` must be served at `/master/`. Served from a
server root, `index.html` requests `/master/assets/index-*.js`, gets a 404, and renders a blank
page with no error message to the user. This is by design (`base: '/master/'` for GitHub Pages) but
it is a silent, total failure if the deploy path is ever wrong. The offline build is unaffected —
it uses relative paths.

**F3 — Minor a11y nit.** The filter sheet's six primary toggles are `<button aria-pressed>` rather
than `role="checkbox"` / `aria-checked`. They are keyboard-reachable and state is announced, so this
is a preference, not a defect.

---

## Verdict

# SHIP

All nine kill-test items pass against the running app at 390 × 844, in both the hosted and the
offline build, with zero JavaScript errors and no horizontal overflow on any screen.

The defect that killed the previous console — **column G, `Correction found`, deleted** — is not
merely fixed but inverted: the correction is a titled block under the verdict on every record, the
app carries the *full* text where the workbook truncates at 400 characters, and a corrected value is
rendered as a **state of the cell** (`~~Under €1.5k/yr~~ · WRONG — see correction`, struck through in
red, above the fold) rather than as a footnote. The two facets most likely to mislead are built on
the correction rather than the raw field: `isCheap()` drops any cost-disputed record whatever its
band says, and `hasConfirmedAudition()` keys on verified prose rather than the `needsAudition`
boolean or the `gate` label — so Edinburgh and KASK stay out of every cheap selection, and all five
audition records stay out of every "no audition" and "free" list while showing a red
`▲ LIVE AUDITION` chip on their own pages.

**Ship with F1 fixed if there is time for one change.** It is a two-line copy fix, it does not block,
and nothing behind it is wrong — but "That is all 2." is the app claiming completeness it does not
have, and that overconfidence is the specific thing this project was rebuilt to avoid.
