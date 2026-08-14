# Design critique — before you build the second app

**Scope: Door 3 only.** Music production and studio craft. 398 records, 120 funding schemes.

Written from the data, not the brief. Sources read: `app/public/data/programmes.json` (398 records,
41 fields), `app/public/data/funding.json` (120 schemes, 20 fields), `app/public/data/meta.json`,
`results/console.html` (the rejected app), `results/DOOR3.xlsx` (19 tabs), `results/DOOR3.md`,
`results/ACTION-TIMELINE.md`, `results/COULD-NOT-VERIFY.md`.

Today is **14 August 2026**. Target intake **September 2027**. The real application windows open
**Oct 2026 – Feb 2027** — about seven weeks from now.

---

## 0. The narrowing makes the case for an app worse, not better. Say it out loud.

You asked me to say so if it were true. It is true, and it is worse than you framed it.

Cutting 1,839 → 398 removed most of what a program could have done that a document could not.

| | All doors | Door 3 only |
|---|---:|---:|
| Records | 1,839 | **398** |
| Duplicate-URL groups | 249 groups / 624 records | **25 groups / 63 records** |
| Distinct programmes after URL dedup | 1,464 | **360** |
| Records that are `WORTH IT` | 21 | **8** |
| Distinct programmes behind those | ~12 | **5** |
| Verified | 316 (17%) | **127 (32%)** |
| Unverified | 1,523 | **271** |

Deduplication was my strongest "only code can do this" argument at 1,839 records. At 398 it shrinks
to 25 groups covering 63 records — **a person could resolve that by hand in an hour**, and half of
it is already resolved in prose: **30 of the 127 corrections literally begin `DUPLICATE of
index N — merge`.** The work is done; it just needs applying.

And the verified answer is now small enough to say in one sentence. Here are all eight `WORTH IT`
records:

| id | Where | Programme | Cost | Language |
|---|---|---|---|---|
| 72, 73, 74 | UK | ICMP — MA Creative Music Production | Over €15k/yr | English |
| 75 | UK | Leeds Beckett — MA Music Production | Over €15k/yr | English |
| 82, 83 | UK | Huddersfield — MA Creative Music Production | Over €15k/yr | English |
| 85 | UK | Westminster — Audio Production MA | Over €15k/yr | English |
| 105 | DE | HfMT Köln — Production (M.Mus.) | **Free** | **German** |

**Eight records. Five distinct programmes. Five URLs.** Seven are expensive UK degrees; the eighth
is free and taught in German. That is the entire verified answer to the question this project was
started to ask. Nobody needs a faceted browser to hold five things.

**One correction to your framing, because it is the only thing that could still rescue a browse
tool.** 398 records is *not* an evening's read at the record level. `programmes.json` is **1.42
million characters**, ~3,570 per record, **72% of it free prose** — roughly 240,000 words, about
**20 hours** at reading speed. `funding.json` adds 200,000 more characters. What *is* an evening's
read is `DOOR3.md` (18 KB), which is why he reads it.

So the honest shape of the problem is:

> **The corpus is 20 hours. The verified answer is 5 programmes. The decision-relevant middle —
> the 19 records that survive his own hard constraints — is 45 minutes.**
>
> **An app's only possible job is to be the bridge between those three numbers. Everything else it
> does is decoration.**

---

## 1. Post-mortem: what `console.html` was, and why it lost

### What it did

Three tabs, **1,091 records**, 3.5 MB, one file.

- **Picks** — hero, a hand-written "three things to do this month" list, then card grids: 18
  `WORTH IT` records split Rated A / Rated B, then 12 records matching
  `chance === 'Strong' && cost ∈ {Free, <1.5k, 1.5k–5k}`.
- **Explore** — nine-facet filter rail (chance, cost, language, public/private, funding, verdict,
  region, country, subject) with cross-filtered live counts, six quick views (`Best bets`,
  `Verified worth it`, `Fully funded`, `English or French`, `Free or near-free`, `The avoid list`),
  four sorts, 50-at-a-time pagination, URL state.
- **Shortlist** — star anything → `localStorage` → an 8-column comparison table.
- A right-hand drawer with ~25 fields grouped *The verdict / Money / Getting in / Language / The
  qualification*, prev-next stepping, link to the official page.

The craft is not the problem. Faceting is correct, counts recompute excluding the facet being drawn,
keyboard nav works, dark mode works.

### Where it failed — concretely

**a) It deleted the single most valuable field in the dataset.**
The exported record has 37 keys. `correction` is not one of them — I searched the blob:
`[k for k in keys if 'cor' in k]` → `[]`. `DOOR3.xlsx` carries it as **column G, "Correction
found"**, third from the left where it cannot be missed.

In the Door 3 set, **75 of 127 verified records (59%) carry a correction stating that one of their
own structured fields is wrong, or that the record is a duplicate.** 41 are about money. **61 are
about the admission gate** — the axis that decides whether he can apply at all. The console showed
the gate label and threw away the note saying the gate label was wrong.

**b) The chips it did show are provably wrong, and it is worst exactly where it looks best.**
Record 120, Edinburgh. `costBand` = `"Under EUR 1.5k/yr"`. Its own `correction`:

> *"COST BAND BADLY WRONG… The overseas rate is approximately GBP 29,900 per year — around twenty
> times the recorded band."*

Never repaired in the structured field. So it renders with a green cheap chip, appears under
*"Free or near-free"*, and floats to the top of *"Cheapest first"*. Record 4 (IAD Brussels): chip
says `Under EUR 1.5k/yr`, correction says €5,369/yr for a Tunisian. Record 5 (KASK Gent): chip says
`Under EUR 1.5k/yr`, correction says *"WRONG BY A FACTOR OF SIX"* — €8,800/yr. Record 115
(Barcelona): recorded cheap, actually ≈€4,920.

**In total, 20 records sitting in the three cheap bands carry a correction saying the price or the
gate is wrong.**

**c) The audition flag — the most decision-critical field — is wrong on 13 records, all in the
free bucket.**
`needsAudition` is a clean boolean: 16 true, 382 false, perfectly consistent with `gate`. It looks
trustworthy. It is not.

**13 records marked `needsAudition: false` carry a correction describing a live audition or an
ear-training test.** Eight of them are `costBand: Free`:

| id | Institution | recorded gate | what the correction says |
|---|---|---|---|
| 258–260 | Filmuniversität Babelsberg | Exam/interview only | *"the first component is a live music test with piano performance, which is functionally an audition"* |
| 103 | Filmuniversität Babelsberg | Portfolio + exam/interview | *"includes an EAR-TRAINING TEST ('identification of intervals, rhythms, and chords') and a LIVE INSTRUMENTAL AUDITION"* |
| 253, 254, 174 | FAMU Prague | Exam/interview only · Portfolio only | *"the exam contains a LIVE PERFORMANCE AUDITION and an EAR-TRAINING TEST"* |
| 261, 263, 331 | HfM Detmold | Portfolio + exam/interview | ear test / audition |
| 270 | mdw Vienna | Portfolio only | *"mdw runs a formal Zulassungsprüfung…"* |
| 220, 291 | Novi Sad | None found in the text | audition present |

Filter `needsAudition = false` + `costBand = Free` and the console hands him a card grid of
free German and Czech Tonmeister degrees he cannot enter. All 13 are already `AVOID`. **The
verification caught them; the boolean did not.**

**d) It never showed that copies of the same row disagree.**
25 duplicate-URL groups; of those, **16 disagree on funding, 11 on gate, 8 on cost band, 8 on
chance, 2 on level, 1 on `isDegree`, 1 on verdict.** Detmold is **six records under one URL** with
three different cost bands (`Free`, `Not published`, `Under EUR 1.5k/yr`). DBS Institute is three
records under one URL, simultaneously `AVOID` and `CONDITIONAL`, with three different gates.
Conservatoire de Paris is two records under one URL where **one says it is a degree and one says it
is not.**

**e) It answered "what exists?" when his question is "what do I do next?"**
Every affordance is a browse affordance. The only forward-looking content in the entire 3.5 MB file
is **hard-coded HTML** — three bullets telling him to email TU Ilmenau, ask SMU for a
medium-of-instruction letter, and start the portfolio. That was the most useful thing on the page
and it was not generated from the data at all.

**f) It became a second source of truth on contact.**
Console = 1,091 records / 18 `WORTH IT` / an `rt` A–B–C rating field that exists nowhere else.
`DOOR3.md` = 398 / 8. Today's `programmes.json` = 398 / 8 / no `rt`. Three artefacts, three
vocabularies.

**The honest summary of the rejection:** he opened a beautiful thing, and it told him less than the
spreadsheet did, with more confidence. *"I'll go back to the documents"* is a correct technical
judgement, not a taste preference.

---

## 2. The case for building nothing — at full strength

I am going to make this as hard as I can, because I think it is close to right.

**The workbook already is the app, with better ergonomics.**
`DOOR3.xlsx` ships **19 tabs**. Twelve are exactly the saved views a filter UI would make him
reconstruct every session: `✅ VERIFIED WORTH IT`, `⚠️ VERIFIED CONDITIONAL`, `★ BEST BETS`,
`No audition`, `Free or cheap`, `Fully funded`, `Has a scholarship`, `All degrees`,
`NOT a degree — avoid`, `Award unclear — ask`, `⛔ VERIFIED AVOID`, `Everything`, plus six regional
cuts. **The console's six quick views are a strict subset of the tab bar he already has.** He does
not need to build the query. Someone already ran it and named the tab.

**And the workbook keeps the column the app dropped.** Column G, `Correction found`, sits between
`Why that verdict` and `Admission gate` — physically adjacent to the fields it corrects. Excel got
the information architecture right by accident of column order. The app got it wrong on purpose.

**Excel does the one interaction that actually matters, and does it better.**
He can type in it. Add a column called "emailed them 3 Sep". Colour a row. Sort by his own
judgement. It is still there tomorrow, and it is a file he owns, backed up, openable on his phone,
survivable across a laptop replacement. The console's shortlist was `localStorage` — invisible,
un-backupable, un-syncable, silently destroyed by clearing browser data — and it stored **stars
only, no notes.** For a decision that runs 13 months, that is not a feature, it is a liability.

**The reasoning lives in prose, and the prose is not tabular.**
72% of `programmes.json` is free text. `DOOR3.md` contains the single most decision-changing
sentence in the project:

> ***"A practical production test is not an audition."***

That reframe moves the reachable set from *fourteen are closed* to **247 of 261 reachable**. It also
overturns the German Tonmeister exclusion (Detmold's master gate is three of your own productions
plus a 30-minute colloquium; the ear test lives on the *bachelor* entrance — what actually closes it
is a prerequisite *Diplom-Tonmeister* degree, which is *sometimes negotiable by equivalence*), and
flags that Novi Sad's *аудиограм* and mdw's *Nachweis der einwandfreien Gehörfähigkeit* are
**medical hearing certificates, not auditions**.

**No filter produces any of that.** It is synthesis across records plus outside knowledge, written
in sentences. `DOOR3.xlsx`'s `START HERE` tab carries the settled money facts as plain text —
Wallonia €5,369/yr flat and *Tunisia is not exempt*; KASK 8,800 / LUCA 9,824 / KC Brussel 17,501 /
KC Antwerpen 25,000; France €3,941 differentiated unless a Ministry of Culture school; Norway now
charges non-EEA everywhere; Czech-taught study at Czech public universities is free to every
nationality; **Chevening is closed to you for 2027**. None of those are fields in
`programmes.json`. **An app driven by that JSON structurally cannot display them.**

**The maintenance argument is not hypothetical.** From October 2026 the 2027 dates start publishing.
**190 of 369 programme deadlines and 56 of 119 funding deadlines currently say `PRIOR CYCLE`. Only
17 and 3 respectively say `CONFIRMED`.** Every date that lands has to be entered somewhere. Into the
workbook only → the app is stale and lying. Into the JSON only → the reports are stale. Into both →
thirteen months of double entry on the single most time-critical field in the project. He has
already discarded one app; a second that drifts from the workbooks will be discarded faster and with
less patience.

**Steelmanned conclusion, which I hold:** *for looking things up, comparing options, and reading the
reasoning, `DOOR3.xlsx` + `DOOR3.md` are complete, and a browse app is a downgrade in a nicer
typeface.*

That case breaks on exactly two things — and one of them is not a browsing feature at all.

---

## 3. What a document and a spreadsheet genuinely cannot do

At 1,839 records I had three. At 398 I honestly have **two, and one of them is not about browsing.**
I am not going to pad it back to three.

### 3.1 Show a field and its own correction as one thing

Excel can display column G. It cannot render *"this value is wrong, here is the real one"* as a
**state of the cell**. Right now the repair happens in his head, per row, every time: read K
(`Cost band`), remember to go read G, discount K. Across 127 verified records with 75 contradictions
he will not do that reliably at 11pm in month nine.

Code can strike the wrong value, show the corrected one inline, and mark it corrected — and,
separately, distinguish **three states that the spreadsheet renders identically**:

- *checked, and the record held* (52 records)
- *checked, and the record was wrong* (75 records)
- *never checked* (**271 records — 68% of the file**)

That third state is the whole ballgame, and §4 is about it.

This is a **rendering** capability, not a browsing one. It could in principle be baked into a
regenerated spreadsheet. It is genuinely easier and more reliable in code, which is why I still
count it.

### 3.2 Hold thirteen months of his own state against a moving deadline

This is the one that cannot be faked, and it is the one thing neither the report nor the workbook
does well.

The decision is not "which programme is best." It is a **thirteen-month operation** with a critical
path already written down in `ACTION-TIMELINE.md`: IELTS booked and sat by September 2026; portfolio
v1 by November 2026; then a wall of deadlines Jan–Feb 2027. Against that he must track, per
programme: emailed / replied / portfolio submitted / applied / offer / declined — plus what he was
told when he emailed, which is a paragraph, not a cell.

Excel can hold this. But **190 of 369 deadlines are `PRIOR CYCLE` prose** —
`"PRIOR CYCLE - confirm new date (2026 call closed 12 March 2026; 2027/28 call expected to open ~Jan
2027)"`, median 141 characters, 312 distinct strings across 369 records. **There is no Excel sort
that puts those in time order, and no filter for "what needs re-checking in the next 60 days."**
That is the only question that changes what he does in a given week, and from October 2026 it
changes continuously.

Code can parse a probable date out of that prose, mark the ones it cannot parse as **unknown rather
than absent**, sort by it, and remember that he already re-checked HKU on 3 September. Nothing else
in the project does this.

### 3.3 The one I wanted to claim and cannot — yet

The obvious third is **joining 120 funding schemes to 261 degrees**: which schemes a Tunisian can
use, at which institutions, with which prerequisites. Genuinely many-to-many, genuinely beyond a
grid.

**The data will not support it today.** Only **23 of the 65 country strings in `funding.json` match
a programme country exactly** — the rest are things like `"Belgium (Flanders)"`,
`"EU-wide (host country varies)"`, `"Germany / Tunisia"`,
`"Austria-based multilateral; funds study at any accredited university worldwide"`. And the join
keys are broken:

- `requiresAdmissionFirst`: `No` (25), `UNVERIFIED` (12), `Yes` (7), `''` (7), `YES` (4),
  `NO` (2), `"No — combined with admission."` (4), plus prose.
- `requiresWorkExperience`: **60% empty**, values `''` / `No` / `NO` / long prose.

The proof that this is not pedantry: **on the Chevening record, `requiresWorkExperience` is an empty
string** — while `whoCanApply` two fields over says *"You must have at least 2800 hours of work
experience"* and `notes` says *"He CANNOT use it… realistically the 2029/2030 cycle."* The single
field that would let the app filter out schemes he is ineligible for is **blank on the most famous
scheme in the file**, and the disqualifying fact is sitting in prose beside it.

**This is the highest-value feature in the whole project and it is a data task, not a UI task.**
Normalise those two booleans and the country scope, and it becomes buildable. Ship it on today's
data and it will confidently tell him he qualifies for Chevening.

**Also flag:** `programmes.json` contains **40 records with `level: "Funding scheme"`, and 35 of
them share a URL with an entry in `funding.json`.** The app ships the same schemes twice, in two
files, with two incompatible schemas. That is a second source of truth *inside the app itself*,
before it has been opened once.

---

## 4. Failure modes — where this app will quietly mislead him

Ranked by cost of the mistake.

**F1 — The 271 unverified records reading as checked.**
127 verified, **271 not — 68%**. `DOOR3.xlsx`'s START HERE tab says it in one line:
*"Blank means not yet re-checked — a lead, not a finding."* An app that does not repeat that on
every screen is worse than the workbook it replaces.

This is not abstract. **Apply his own hard constraints to the data and the result is devastating:**

| filter | records left |
|---|---:|
| all Door 3 | 398 |
| + is a real degree | 261 |
| + taught in English or French | 139 |
| + no flagged audition | 134 |
| + `acceptsNonMusic` starts "Yes" | 51 |
| + cost band ≤ €5k/yr | **19** |

Of those **19 survivors: 16 have never been verified. The 3 that were came back AVOID, AVOID,
CONDITIONAL. Zero `WORTH IT`.** A browse app renders those 19 as one uniform list of green results.
The truth is *"here are sixteen leads nobody has checked and three that failed."*

**F2 — The 130 non-degrees.** 137 records are not real degrees (75 `Not a degree`, 40
`Funding scheme`, 9 `Aggregate entry`, 7 `Unclear`, 4 `Master di I livello`, 2 bachelor). And:

- **57 of the 137 have "master" / MA / MSc / Máster / Mastère in the programme name** —
  `"Mastère Réalisation et Production Sonore"`, `"Máster en Producción Musical Discográfica"`,
  `"Music Production & Sound Engineering Master Diploma"`.
- **135 of the 137 have no verdict.** Nobody re-checked them, so there is no `AVOID` to lean on.
- 23 are `chance: Strong`. **8 are Strong *and* cheap** — i.e. they land in the most attractive
  bucket the app can produce.
- The only thing separating them from a real degree is the `isDegree` boolean and the `level`
  string. If either is absent from a card, a €12,000 private diploma is indistinguishable from an
  accredited master's.

This is the highest-consequence failure in the file: it is the one that costs money and a year, and
it is the one thing the research did best. **`DOOR3.xlsx` gives it its own tab (`NOT a degree —
avoid`, 133 rows). An app must be at least as loud.**

**F3 — Absence rendered as a value.** `costBand: "Not published"` on **182 records (46%)** means
*nobody published a figure*. A six-checkbox cost filter makes it a sixth price tier; the console's
`COST_RANK` gave it rank 5 and sorted it last, i.e. treated *unknown* as *most expensive*. Same trap
on `funding: "Not stated"` (266), `gate: "None found in the text"` (**119 — that is *the text did
not say*, not *there is no gate***) and `"Not published — ask them"` (39), `language: "Not stated"`
(50), `verdict: ""` (271).

And it silently eats results: in the funnel above, the step 134 → 51 discarded **13 records for an
empty `acceptsNonMusic`** and **51 more whose prose does not begin "Yes" or "No"** — *more records
thrown away for unparseable text than kept.*

**F4 — Correction-blind facets.** §1b and §1c. Any facet built on `costBand`, `gate`,
`needsAudition`, `chance` or `funding` **without applying `correction` first is a defect**, not a
simplification. Concretely: `needsAudition = false` is wrong on 13 records, 8 of them free;
20 cheap-band records have a price or gate correction against them.

**F5 — `chance` presented as probability.** Values are `Strong / Possible / Weak`. Where verification
exists it overturns `Strong` regularly, and in the Door 3 set the `Strong` bucket (102 records) is
mostly unverified. Either rename it to what it is — *"the published entry rules mention a background
like yours"* — or subordinate it to `verdict` wherever both exist.

**F6 — `PRIOR CYCLE` dates rendered as scheduling.** 190 records. The console's `dls` chip rendered
`⏱ 12 March` from exactly this kind of string, inventing a 2027 deadline out of a 2026 fact. From
October 2026 these become wrong in a *new* way — superseded by real published dates the JSON does
not have.

**F7 — meta.json already contradicts its own facets.** `meta.counts.needsAudition` = **14**;
`meta.facets.gate["AUDITION — hardest for you"]` = **16**. Both are correct (14 degrees, 16 records)
and both will be printed by an app that trusts meta.json. Two numbers for one fact, on day zero.

**F8 — Duplicate inflation of headline numbers.** "8 worth it" is 5 programmes. "102 strong" and
"23 free" are inflated by the 63 duplicate-URL records. If the app prints a count, it must print a
deduplicated count, or it is lying in the largest type on the page.

**F9 — Country as a proxy for anything.** 41 values including `"EU-wide"`, `"Multi-country"`,
`"Monaco"` (1), `"Armenia"` (1). Minor here, but a dropdown built from raw values inherits it.

---

## 5. If I could ship exactly one thing

Not a filter. Not a map. Not a comparison table.

> ### A verification overlay: every fact carries its provenance, and every corrected fact shows the correction in place.

For each record, render three states on every fact, and never let them share a visual channel:

- **verified & held** — plain
- **verified & corrected** — the recorded value struck through, the corrected value in its place,
  the reason on one line:
  *~~Under €1.5k/yr~~ → **≈£29,900/yr** — "wrong by roughly twenty times", verified*
  *~~No audition~~ → **live piano test + ear training** — "functionally an audition", verified*
- **never checked** — visibly greyed, labelled *not checked — a lead, not a finding*

Plus, at record level: **`isDegree = false` is not a badge, it is the loudest thing on the card**,
and where duplicate rows disagree, say so instead of picking one:
*"3 of your records call this Portfolio only, 2 call it Portfolio + interview. Unresolved — the
official page is the tiebreak →"*

Why this one:

1. **It is the exact thing the last app deleted.** Shipping `correction` as a first-class visual
   state is the most direct possible answer to *"it told me less than the spreadsheet."*
2. **It changes a decision rather than presenting one.** He already knows what exists — he has 19
   tabs of it. What he cannot see is which facts in front of him have already been disproven.
3. **It is the only thing that makes the 271 unverified records safe to display at all.** Without
   it, showing them is worse than not shipping.
4. **It fails safe.** An unverified record renders as a plain grey card saying *not checked*. Honest,
   and still useful as a lead.

Everything else — search, facets, region tabs — is scaffolding. If the budget is one screen, make it
this screen and reach it by search box alone.

---

## 6. Kill test

Objectively checkable by anyone opening the finished app. **Any failure = do not ship.**

1. **Non-degree test (the money test).** Apply the most optimistic filter the app offers — best
   chance, cheapest, no audition. **No result may be one of the 137 records with `isDegree: false`**
   unless it is labelled as not-a-degree in the same visual weight as its title. Specifically:
   search `Mastère Réalisation et Production Sonore` (id 44) and `Máster en Producción Musical
   Discográfica` (id 37). If either presents as a master's degree without a not-a-degree marker
   visible **without clicking**, it fails.

2. **Unverified-gap test.** From any list view, **without clicking anything**, it must be possible
   to tell which of the visible items were re-checked against an official page and which were not.
   Check the count: the app must be able to state that **271 of 398 records were never verified**,
   and **135 of the 137 non-degrees were never verified**. If a verified and an unverified record
   are visually interchangeable at list level, it fails.

3. **Nineteen-survivors test.** Filter to: real degree + English or French + no audition + accepts a
   non-music bachelor + cost ≤ €5k/yr. The result must be **19 or fewer**, and it must be visible on
   that screen that **16 of them are unchecked and the 3 that were checked came back AVOID / AVOID /
   CONDITIONAL.** A screen that shows 19 uniform green results fails.

4. **Audition test.** Open records **258, 259, 260** (Filmuniversität Babelsberg) and **253, 254**
   (FAMU). All are `needsAudition: false` and `costBand: Free`. Each must show that a **live
   performance / ear-training test** is part of the entrance exam. If any of them appears inside a
   "no audition" filter or a "free and reachable" list without that warning, it fails.

5. **Edinburgh / KASK test.** Search `Edinburgh` (id 120) and `KASK` (id 5). Both are banded
   `Under EUR 1.5k/yr`. Edinburgh must read as **≈£29,900/yr**, KASK as **≈€8,800/yr**, each
   visibly marked as a correction to a recorded value. Neither may appear in any "cheap" or "free"
   selection.

6. **Dedup test.** Search `Detmold` — **six records share one URL with three different cost bands**;
   the app must show one programme, or show all six *with the disagreement stated*. Search `ICMP` —
   three of the eight `WORTH IT` records are the same programme; the app's own `WORTH IT` count must
   read **5, not 8**.

7. **Deadline-honesty test.** Open any of the **190 records whose `deadline` contains `PRIOR
   CYCLE`**. No bare date may be displayed. It must be visible that this is a previous cycle's date
   and the 2027 date is unpublished. If any element sorts, groups or counts these as 2027 deadlines,
   it fails.

8. **Funding-eligibility test.** Find the **Chevening** entry. Its `requiresWorkExperience` field is
   empty; its prose says he needs 2,800 post-bachelor hours and cannot use it before ~2029. The app
   must not present it as available to him. If any eligibility filter is built on
   `requiresWorkExperience` (60% empty) or `requiresAdmissionFirst` (7 distinct spellings of yes/no
   plus `UNVERIFIED` plus blanks) without normalising them first, it fails.

9. **Parity test.** Take 5 records at random from the `✅ VERIFIED WORTH IT` tab of `DOOR3.xlsx`.
   Every non-empty cell in columns E, F, **G**, H, K, S must be findable in the app. **If column G
   (`Correction found`) is missing for even one of them, it fails** — that is the exact defect that
   killed the console.

---

## 7. Verdict, and what I would build instead

**Yes — at 398 records the browsing features are decoration, and the tracker is the product.** You
asked me to say it plainly if that was the conclusion. It is.

The reasoning is arithmetic, not taste. The verified answer is **5 programmes**. The
constraint-filtered answer is **19 records, 16 of them unchecked**. `DOOR3.md` already names the top
~14 with their gates, costs and deadlines in an 18 KB document he reads. `DOOR3.xlsx` already ships
the twelve saved views a facet rail would let him rebuild. **There is no browsing job left.** A
facet UI over these fields is a confidence machine sitting on top of data that is 59%-corrected
where checked and 68%-unchecked overall — every filter click makes a claim the data cannot support,
and he can feel that even without naming it. That is what *"I'll go back to the documents"* means.

What I would build is small, and it is not a catalogue:

> **A verified worklist. One page. Three blocks.**
>
> 1. **The answer.** The 5 verified programmes and the 19 constraint-survivors, deduplicated, each
>    with its **corrected** cost, its **corrected** gate, and its one open question. Each stamped
>    verified / corrected / never checked. That is a page, not a database.
> 2. **What changes this month.** Every programme and every funding scheme whose window plausibly
>    opens or closes in the next 90 days, with the `PRIOR CYCLE` caveat stamped on each and a
>    one-click "re-check the official page" link. **From October 2026 this is the only block that
>    matters,** and it is the only thing here that neither the report nor the workbook can do.
> 3. **His state.** Per programme: emailed / replied / portfolio sent / applied / offer / declined,
>    plus a free-text note. Persisted to a file he owns and can back up — **not `localStorage`,
>    which is what the last shortlist was and why it was worthless.** This is the block that earns
>    the app's existence; blocks 1 and 2 are what make it trustworthy enough to keep open.
>
> No facet rail. No 398-row table. Search box only. Generated from the same source that generates
> the workbooks, stamped with its snapshot date, so it can never become a second truth.

Two things to fix in the data before any of it, because they are cheap and they are load-bearing:
**apply the 30 `DUPLICATE — merge` corrections**, and **normalise `requiresWorkExperience` /
`requiresAdmissionFirst` / funding country scope** so the eligibility join stops lying about
Chevening.

**Build the verification overlay and the tracker. Do not build the browser again.**
