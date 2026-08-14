# DESIGN-UX — Door 3

**Scope:** Door 3 only — **music production and studio craft, Europe.** Making records:
production, studio practice, mixing, mastering, Tonmeister, sound direction, popular-music
production, beat-making, DJ and electronic production. Not electroacoustic composition,
not sound art, not sonology — those are Door 1 and live elsewhere.

**For:** one person. A Tunisian software-engineering graduate, ~24, applying for a
September 2027 intake, aiming to become an electronic music producer. No music degree, no
conservatoire, no portfolio yet. Arabic native, French fluent, English working, no German.
Needs a student visa everywhere. Can pay a little, not a lot. **He is on a phone.**

**Data.** Three files, all under `app/public/data/`:

| file | size | contents |
|---|---|---|
| `programmes.json` | 1.68 MB | **398** records, one flat object each, 41 fields |
| `funding.json` | 240 KB | **120** funding schemes, 20 fields |
| `meta.json` | 3.4 KB | every facet and its counts |

**Companion documents.** `results/DOOR3.md` is the written reasoning behind this data and
`results/DOOR3.xlsx` is the same 398 records in 19 tabs. **The app must mirror the workbook
record for record.** Where the app and the workbook disagree, the app is broken.

**Precedent to beat.** An interactive console was built over an earlier snapshot of this
data and rejected — *"i didn't like the artifact, I'll go back to the documents."* He then
asked for spreadsheets and written reports and used those happily. The rejected console
was three tabs (Picks / Explore / Shortlist), a search box and a filter drawer. It was a
**browser**. He did not want a browser. He wanted an **answer with its reasons attached**,
which is what the Markdown reports gave him.

This spec is written to be implemented. Where I am unsure I say so and give a
recommendation anyway.

---

## 0. What this data actually is

I read all 398 programme records, all 120 funding schemes, and `results/DOOR3.md`. These
facts drive every decision below. A design that ignores them will be wrong.

### 0.1 The shape

| | count |
|---|---|
| records | **398** |
| award a real master's degree (`isDegree: true`) | **261** |
| **do not award a degree** | **130** — 75 "Not a degree", 40 funding schemes, 9 aggregate entries, 4 *Master di I livello*, 2 bachelor-level |
| award unclear | **7** |
| re-verified on the official page | **127** — 8 WORTH IT · 33 CONDITIONAL · 86 AVOID |
| **carry no verdict** | **271** |
| reachable without a performance audition | **247 of 261 degrees** |
| demand a performance audition | **14 degrees** (16 records) |
| countries | 41 |

The record now carries three explicit booleans — `isDegree`, `needsAudition`, `languageOk`
— so the derived logic that used to need computing is given. Use them; do not re-derive.

`gate` is populated for **all 398** records. There is no facet that silently deletes rows.

### 0.2 The finding that should determine the whole design

**What has been verified is not what he can afford.**

All eight WORTH IT verdicts, listed:

| programme | where | cost band |
|---|---|---|
| MA Creative Music Production — ICMP | London | **over €15k/yr** |
| MA Creative Music Production — ICMP *(dup)* | London | over €15k/yr |
| MA Creative Music Production — ICMP *(dup)* | London | over €15k/yr |
| MA Music Production — Leeds Beckett | Leeds | over €15k/yr |
| Creative Music Production MA — Huddersfield | Huddersfield | over €15k/yr |
| MA Creative Music Production — Huddersfield *(dup)* | Huddersfield | over €15k/yr |
| Audio Production MA — Westminster | London | over €15k/yr |
| **Production (M.Mus.) — HfMT Köln** | **Cologne** | **Free** |

Two things follow, and both are load-bearing.

1. **Those eight records are five programmes.** ICMP appears three times, Huddersfield
   twice. Duplicates are not a tidiness problem here — they are the difference between
   telling him "eight verified winners" and the truth, "five, and four of them are in
   England at over €15,000 a year." §4.6.
2. **Verified ≠ affordable, and affordable ≠ verified.** Exactly **one** WORTH IT
   programme is one he could pay for. Meanwhile `results/DOOR3.md` names **29** that are a
   strong chance, cheap and audition-free — FHNW Basel, HfMT Köln, İTÜ MIAM, FH Joanneum
   Graz, Masaryk Brno, Coimbra, UBO Brest, Saint Louis Rome, HSLU Lucerne, HfM Karlsruhe,
   DkIT, and the rest — and most of them **have never been re-verified.**

The funnel, computed on the real data:

```
398  everything collected in Door 3
261  award a real master's degree
247  do not demand a performance audition
134  are taught in English or French
 96  have not been ruled out on the official page
 77  where his background gives him a Strong or Possible chance
 37  he could plausibly pay for  (≤ €5k/yr or free, or fully funded)
      └─  1 WORTH IT  ·  8 CONDITIONAL  ·  28 never checked
```

A ranked list cannot express that. **A single "best" list is the wrong information
architecture for this dataset**, and it is exactly what the rejected console produced.
The landing screen therefore shows **two sets in tension** (§1) and names the tension in
a sentence. That sentence is the app's whole reason to exist over the workbook.

### 0.3 The gate is a ladder, not a switch

From `results/DOOR3.md`, and this is the single most important thing he must understand
about Door 3:

> **A practical production test is not an audition.**

| rung | what it is | can he pass it? |
|---|---|---|
| **Portfolio** | submit 2–4 finished tracks | **yes** — a twelve-month build |
| **Production test** | *"here is raw material, make a production"* | **yes — this is the job, not a barrier** |
| **Ear training / performance audition** | play an instrument, identify intervals, sight-read | **no** — needs conservatoire training |

Only **14 of 261** degrees demand rung three.

And there is a **fourth thing that closes doors and is not a gate at all: a prerequisite
degree.** Verification overturned the project's own earlier claim here. Detmold's master
aptitude test is *three of your own productions on CD/DVD plus a 30-minute colloquium* —
**no ear test.** The Royal Danish Academy runs **no live entrance exam at all**. What
closes them is that Detmold demands a *"Bachelor of Music Musikübertragung bzw.
Diplom-Tonmeister"* and Copenhagen a *"Bachelor of Music as tonemeister"*. The ear tests
live on the **bachelor** entrance. Only FAMU Prague and Robert Schumann Düsseldorf
genuinely gate on musicianship.

That distinction is actionable: **a closed prerequisite degree is sometimes negotiable by
equivalence; a trained ear is not something you acquire in a year.**

And two false alarms that look like ear tests and are not: Novi Sad's *аудиограм* and mdw
Vienna's *"Nachweis der einwandfreien Gehörfähigkeit"* are **medical hearing
certificates.**

**None of this is in the JSON.** `gate` has six values and `needsAudition` is a boolean;
the rung-two-versus-rung-three distinction lives only in the `audition` prose field (mean
229 chars, max 2,521) and in `DOOR3.md`. Of the 135 degrees with an exam gate, 48 mention
a production test or a mix and 38 mention ear training or an instrument. **The design must
surface this distinction explicitly rather than assume he remembers it** — see the Gate
Explainer, §3.6.

### 0.4 The long-form fields are why this app exists

| field | non-empty | mean chars | max |
|---|---|---|---|
| `recommendation` | 174 | **755** | 2,470 |
| `correction` | 127 | **487** | 869 |
| `study` | 311 | 474 | 2,473 |
| `verdictWhy` | 127 | 361 | 697 |
| `entry` | 333 | 319 | 2,064 |
| `accreditation` | 256 | 304 | 1,642 |
| `acceptsNonMusic` | 298 | 302 | 1,202 |
| `audition` | 295 | 229 | 2,521 |
| `portfolio` | 319 | 228 | 1,617 |
| `scholarshipDetail` | 330 | 215 | 2,738 |
| `tuition` | 347 | 203 | 1,305 |
| `deadline` | 369 | 164 | 849 |

And in `funding.json`: `notes` mean 371, `whoCanApply` mean 242 (max 720), `coverage`
mean 157 (max 710).

**These are paragraphs, often containing a verbatim quotation from the official page.**
In Excel they are a truncated smear in a 200px cell that must be clicked and read in the
formula bar, one at a time. That is the gap this app fills. Everything below serves it.

### 0.5 The verification grammar

The prose carries a markup language the pipeline invented, and it must be parsed, not
printed raw.

- `VERBATIM:` / `CONFIRMED, verbatim: "…"` — a quotation from the institution.
- `UNVERIFIED` — appears in **330 of 398 records**, and it is mostly **inline inside a
  sentence**, not a whole-field sentinel. It cannot be handled by cell styling.
- `PRIOR CYCLE - confirm new date` — 177 deadlines.
- `NOT PUBLISHED` — a checked absence, different from an unchecked field.
- `INPUT SAID '…' — WRONG` — inside `correction`, present on all 127 verified records.
- `scholarship: "—"` (232 records) means **none**, not unknown.
- `url` holds more than one URL in **143** records.

### 0.6 Cost bands lie, in known ways

`costBand` is `"Not published"` for **182 of 398** — the largest single gap. And where it
does have a value it can be actively wrong. Three documented cases, all from verification:

- **Sibelius Academy Music Technology** (record 0) shows `costBand: "Free"`. The truth in
  `tuition`: *"EUR 0 IF STUDYING IN FINNISH OR SWEDISH. EUR 28,000 per academic year if
  studying in English."* Free is real but reachable only through a language loophole.
- **IAD and every Wallonian institution charge €5,369/yr**, not the cheap band they sit
  in. Tunisia is not on the ARES exemption list.
- **KASK Gent €8,800/yr · LUCA €9,824 · KC Brussel €17,501 · KC Antwerpen €25,000.**
  Flanders removed non-EEA students from basic financing.

**Rule: where `correction` exists, the corrected figure is the one displayed, and the
original is shown struck through.** §3.4.

### 0.7 Deadlines are prose, not dates

| shape | count |
|---|---|
| `PRIOR CYCLE - confirm new date` | 177 |
| `UNVERIFIED` | 82 |
| free prose (rounds, conditions, rolling) | 57 |
| contains a real 2026–2029 year | 48 |
| empty | 29 |
| `NOT PUBLISHED` | 5 |

Example, verbatim: `"PRIOR CYCLE - confirm new date: WS 2026/27 application window was
Mar 1 - Jun 15, 2026 (PASSED); annual cycle, expect Ma…"`

There is **no sortable date field**. But — and this changed with the scope cut —
`DOOR3.md` already carries about a dozen hand-confirmed 2027 dates. At 398 records that
is now a tractable curation job, so a small honest calendar becomes possible where it was
not at 1,839. §6.3.

### 0.8 `chance` is unreliable and `verdict` overrules it

Cross-tabulated on the 127 verified records: **28 records rated `Strong` were judged
`AVOID`** on reading the official page. `chance` is a heuristic over a scraped blurb;
`verdict` is a human reading the source.

> **Design rule: where a verdict exists it wins — visually, and in sort order. `chance` is
> demoted to provenance and never gets a colour.**

The rejected console gave both equal chips. That was wrong.

### 0.9 Payload

1.68 MB + 240 KB, roughly **420 KB gzipped for everything**. The scope cut removes the
payload problem entirely. Concretely this buys three things the 1,839-record design could
not have:

1. **One fetch, no sharding, no index/detail split.**
2. **Full-text search over every prose field is free and on by default** — no "this
   downloads 7 MB" warning, no second gear. Searching *"raw material"*, *"affine
   subject"*, *"no German"*, *"Informática"* becomes a first-class way in. This is a
   genuinely new capability, and it is the thing a spreadsheet is worst at.
2. **The whole app works offline after first load**, cached by a service worker.

---

## 1. The one-screen answer

### The landing view is **Where you stand**. A single scrolling column of prose and numbers. Not a table, not a card grid, not a chart, and no search box.

```
┌────────────────────────────────────┐
│ Where you stand          ◐   ⋯     │
├────────────────────────────────────┤
│  Door 3 · production and studio    │  13px mono, muted
│  September 2027 intake             │
│                                    │
│  You have 6 on your list.          │  20px serif — THE line.
│  2 are waiting on an email you     │
│  sent. 1 closes in 11 weeks.       │
│                                    │
│  [ your list — 2 cards, status ]   │  §5
│  Open your list  →                 │
│                                    │
│  ──────────────────────────────    │
│                                    │
│  THE PROBLEM WITH THIS DOOR        │  11px caps, letterspaced
│                                    │
│  Eight programmes have been        │  16px serif. The editorial
│  opened, read and judged worth     │  paragraph. This is the app's
│  it. Seven of them are in England  │  reason to exist.
│  at over €15,000 a year. The       │
│  eighth — Cologne — is free.       │
│                                    │
│  The 29 that are cheap, strong     │
│  and need no audition are mostly   │
│  ones nobody has checked yet.      │
│                                    │
│  ┌──────────────┬───────────────┐  │  two lists, side by side,
│  │ CHECKED      │ CHEAP         │  │  stacked on a narrow phone
│  │ 8 verified   │ 29 best bets  │  │
│  │ worth it     │ mostly        │  │
│  │ 7 unaffordable│ unverified    │  │
│  │ Read them →  │ Read them →   │  │
│  └──────────────┴───────────────┘  │
│                                    │
│  They overlap in exactly one       │
│  place: HfMT Köln. Start there.  → │
│                                    │
│  ──────────────────────────────    │
│                                    │
│  HOW 398 BECOMES 37                │  the funnel. Tappable rows.
│                                    │
│  398  collected in this door       │
│  261  award a real degree          │
│  247  no performance audition      │
│  134  in English or French         │
│   96  not ruled out                │
│   77  you have a real chance       │
│   37  you could pay for            │
│                                    │
│  Walk it with me  →                │
│                                    │
│  ──────────────────────────────    │
│                                    │
│  130 of the 398 are sold as a      │  the rejects, promoted.
│  master's and are not one.         │
│  That is the highest proportion    │
│  of any field this project         │
│  searched. See them →              │
│                                    │
│  120 funding schemes. Nationality  │
│  was rarely the bar — subject      │
│  was. See the money →              │
│                                    │
│  271 of 398 have never been        │
│  checked against an official       │
│  page. Nothing here is verified    │
│  unless it says so.                │
│                                    │
│  Snapshot 2026-08 · mirrors        │
│  results/DOOR3.xlsx                │  12px muted, every view
└────────────────────────────────────┘
```

### Why this and not the spreadsheet

`DOOR3.xlsx` has 19 tabs, real Excel tables with filter buttons, and he likes it. **Do not
compete with it.** It wins at: 40 rows at once, sorting a column, being offline on a
laptop. This screen does five things it cannot:

1. **It states the tension.** The workbook has a `✅ VERIFIED WORTH IT` tab (8 rows) and a
   `★ BEST BETS` tab (29 rows) and **nothing anywhere tells him those two lists barely
   intersect.** That is the single most decision-relevant fact in the dataset and it is
   invisible in a grid, because it is a relationship between two tabs. A sentence can hold
   it. A column cannot.
2. **It knows the order to filter in.** A spreadsheet has 37 columns and no opinion about
   which to touch first. The wrong first move — filter Country — leaves him with 52 UK
   rows, 5 of which are not degrees. The funnel encodes the correct order as a readable
   sentence stack: degree, audition, language, verdict, chance, money.
3. **It remembers him.** No column can say "you emailed Cologne on 3 August and they have
   not replied in eleven days." After week one the corpus is not what changes — he is.
4. **It carries the reasoning.** The four fields that decide everything — `verdictWhy`,
   `acceptsNonMusic`, `portfolio`, `recommendation` — average 361, 302, 228 and **755**
   characters. They are the whole payload and they are unreadable in a cell.
5. **It is legible held in one hand on a bus.** The workbook is not.

In the overflow menu, permanently: **"The workbook (better on a laptop)"** → `results/DOOR3.xlsx`,
and **"The written report"** → `results/DOOR3.md`. Conceding the grid is what buys the
right not to build one.

**Empty shortlist (first run):** the top block is replaced by

> **Start here.** Five distinct programmes have been opened, read and judged worth it —
> and only one of them, HfMT Köln, is one you could pay for. Read those five first, then
> read the twenty-nine cheap ones nobody has checked. **[ The five → ]**

Then the tension paragraph. Never an empty dashboard.

---

## 2. Named views

Six, plus two record pages. Each is a URL. Each has one job.

### 2.1 `Where you stand` — `/`

Job: **tell him what to do next, in a sentence, before he decides anything.**

Mobile: one 100% column, 20px gutters, max 34rem on desktop, **left-aligned within it** —
it reads as a document, not a landing page. Funnel rows are 44px tap targets, number
right-aligned in tabular mono. Tapping a funnel row opens `Programmes` with that row's
filters **and every row above it** applied; the URL is the proof
(`/list?deg=1&aud=0&lang=ok`). The two tension cards stack vertically under 380px.

### 2.2 `Walk it with me` — `/walk`

Job: **get someone with no plan from 398 to a working set in six taps, teaching the
data's shape on the way.** This replaces the rejected console's filter drawer.

Six full-screen steps, one question each, in his language. Each shows the live remaining
count and — the important part — **what the answer throws away**:

| # | question | choices | field |
|---|---|---|---|
| 1 | Does it have to be a real master's degree? | Yes (261) · Show me the 130 that aren't too | `isDegree` |
| 2 | Could you pass a live performance audition? | No — hide those (removes 14) · I'd try | `needsAudition` |
| 3 | What can you follow? | English or French (134) · English only · Any, I'll deal with it | `languageOk` / `language` |
| 4 | What can you pay a year? | Nothing · under €1,500 · under €5,000 · anything, if it's funded · everything, including the 182 with no published price | `costBand` + `funding` |
| 5 | Show the ones that have been checked? | Checked only (127) · Checked first, then the rest · Everything | `verdict` |
| 6 | Where won't you go? | *(region multi-select, all on by default)* | `region` |

Persistent footer: `398 → 37`, number swap only, no animated bar.

The teaching copy under each choice is the point. Verbatim:

- **Step 2** — *"Only 14 of 261 demand one. And a practical production test is not an
  audition — 'here is raw material, make a production' is the job, not a barrier.
  [What the gates actually are →]"*
- **Step 4** — *"182 institutions publish no price at all. Excluding them hides 46% of
  the degrees. I'd keep them and send an email."*
- **Step 5** — *"271 have never been checked. Hiding them leaves you 127 records, 86 of
  which are 'avoid'. Checked does not mean good."*

Ends at **"37 left. Here they are."** → `Programmes`, filters in the URL, plus a one-tap
**save this search** that names it and pins it to the landing screen.

Mobile: one question per screen, choices as full-width 56px rows with counts
right-aligned, thumb-reachable, back always non-destructive. No horizontal scroll ever.

### 2.3 `Programmes` — `/list?…`

Job: **let him read the results, not scan them.** The closest thing to a table, and
deliberately not one.

Each result is a **card of three to five lines that includes one sentence of prose**:

```
┌────────────────────────────────────┐
│ ✔ WORTH IT                  Free   │  verdict left, cost right
│ Production (Master of Music) —     │  17px serif, 2-line clamp
│ contemporary popular music         │
│ HfMT Köln · Cologne, Germany       │  13px muted
│                                    │
│ "You prepare a production from     │  THE SENTENCE. 14px serif
│ the (raw) material you receive     │  italic, 3-line clamp
│ from us." German A2.               │
│                                    │
│ ⚙ Production test · German  ☆      │  gate · language, 12px
└────────────────────────────────────┘
```

**The sentence is what a spreadsheet row cannot carry.** Which field it comes from follows
a fixed precedence, so it is always the most decision-relevant known thing:

1. `verdictWhy`, first sentence — if a verdict exists
2. else `acceptsNonMusic`, first sentence — if substantive (>60 chars)
3. else the quoted portion of `entry`, where `VERBATIM:` is present
4. else `whyChance` — the weak fallback, rendered **muted grey** to mark it as a guess
5. else nothing — the card is four lines and visibly thinner. That thinness is
   information: *nobody looked at this one.*

**Default sort: verdict rank (WORTH IT → CONDITIONAL → unchecked → AVOID), then chance,
then cost band.** AVOID records sort last at 60% opacity with a red chip and are **not
hidden by default** — he needs to see that the thing he was excited about was checked and
killed, with the reason one tap away. The 86 avoids are, in the report's own words, *"the
point of the exercise — each is an application you now don't have to make."*

Alternative sorts: cost band, country A–Z. **No sort by deadline** (§6.3).

Non-degrees appear inline in results, visually unmistakable (§6.4), unless the `isDegree`
switch is on — and it is **on by default**.

Mobile: single column, cards separated by a 1px hairline, not by gaps and shadows — a list
of entries in a document, not a Pinterest board. Sticky 44px bar showing
`37 results · filters ▾`. **"Show 40 more"** rather than infinite scroll, so scroll
position survives. Count always visible.

Desktop: same single column at max 40rem. **No multi-column grid, no dense table.** The
workbook is the dense table.

### 2.4 `The Page` — `/p/:id`

The programme record page. Full spec in §3.

### 2.5 `Money` — `/money`, `/f/:id`

**Promoted to the main navigation.** Money is half his decision, `funding.json` is 120
schemes averaging 371 characters of notes each, and `DOOR3.md`'s central finding about
funding is a pattern no column can express:

> **Nationality was rarely the bar. Subject was.** Eiffel excludes the arts, NAWA Banach
> is STEM-only (Tunisia *is* listed), the Islamic Development Bank funds science and
> engineering, the OPEC Fund funds development. **His software-engineering BSc fits all
> four — the master's subject is what fails them.**

`/money` opens on that sentence, then three sections:

1. **The eight worth pursuing** — hand-curated from `DOOR3.md`: the Tunisian
   *bourse d'études à l'étranger*, Italian MAECI AFAM, AESEF (with the Dolby and
   L-Acoustics awards on the same form), ICMP Andrew Scheps, Romanian MFA, UAL
   International PG, Huddersfield PG Merit, Estonian bilateral + EAMT waiver. Each with
   its one-line reason.
2. **Closed, and why** — collapsed by default, expanding to the full list with the
   killer named. Three kill classes, each its own colour-free label:
   - **Nationality** — Latvia and Czechia exclude Tunisia; Abbey Road requires a UK
     passport; Chevening/GREAT/Commonwealth closed.
   - **Subject** — Eiffel, NAWA, IsDB, OPEC.
   - **Hidden work-experience bar** — Popakademie (6 months + C1 German), CNM (French tax
     residence), PRS (UK base, 18-month track record), Help Musicians (3 years in the UK,
     excludes music technology), ICMP's own PG scholarship (3 years UK/EEA residency),
     Fundación SGAE (membership). **`requiresWorkExperience` is non-empty on only 48 of
     120 records, so this section is partly hand-curated from the report. Say so.**
   - **Structurally impossible** — Erasmus+ ICM caps mobility at 12 months and requires
     continuing enrolment in Tunisia. *"It does not belong in your plan."*
3. **All 120** — filterable list.

**The funding record page — `/f/:id` — field order**, ordered by what disqualifies fastest:

```
name · provider · country
── CAN YOU APPLY? ───────────────────────────
   whoCanApply            FULL, 16px serif. mean 242, max 720.
                          The first thing, always.
   ageLimit               (he is 24 at application, ~25 at entry — the app
                          knows this and annotates: "Age cap 28. You clear it.")
   subjectScope           FULL — the field that actually kills most of these
   requiresWorkExperience if non-empty and not "No": RED chip "Work experience
                          required" at the top of the page
   requiresAdmissionFirst chip: "Needs an offer first" / "Apply before you're
                          admitted" — this changes the ORDER of his year and
                          belongs next to the deadline
   languageRequirement
── WHAT DOES IT PAY? ────────────────────────
   coverage               FULL, mean 157, max 710
   duration · numberOfAwards · competitiveness
── WHEN? ────────────────────────────────────
   deadline · opens · howToApply
── ───────────────────────────────────────────
   notes                  FULL, 16px serif, mean 371, max 2,000. Never clamped.
   url · foundBy · your note and status
```

`competitiveness` is `UNVERIFIED` or empty on **61 of 120** and `requiresAdmissionFirst`
on 19. Render both per §3.4 — the row stays, the value says nobody confirmed it.

**Cross-linking both ways.** A programme page lists any scheme whose country or
institution matches, under the money section. A scheme page lists the programmes it could
fund. The pair *Estonian bilateral + EAMT waiver* is only viable together — model it as an
explicit **"only works with"** link, hand-curated.

### 2.6 `Not a degree` — `/rejects`

**The 130 are in scope on purpose. They get their own room, not a filter.**

Job: **stop him paying €15,000 for something that is not a degree and will not get him a
visa.** A third of everything sold as a master's in this door is not one — the highest
proportion of any field the project searched. Door 3 is where the private audio-school
market lives.

Opens on that sentence, then **grouped by the pattern, not by country**, because the
pattern is what he needs to recognise on a website he finds himself next month:

- **The Dutch and Spanish private-academy belt** (29 Spain, 15 Netherlands) — Abbey Road
  Institute, SAE, Microfusa, CEV, CICE, Point Blank Ibiza, Herman Brood, and the *título
  propio* programmes at TAI, UCAM and Francisco de Vitoria.
- **The French *Mastère*** — ESIS, EICAR, CinéCréatis, MJM, ATLA, 3iS. All **RNCP level 5
  or 6**, bachelor level or below; 3iS at €15,000/yr for two years.
- **The Italian *Master di I livello*** (4 records) and IULM.
- **The Portuguese *pós-graduação*** — ETIC, Restart, DJEM, EMMA.
- **The UK validation chain** — this one gets its own explainer card, because it is the
  subtlest and the report traced it: **ICMP awards its own degrees** (full degree-awarding
  powers since November 2021, so it is *not* a validated provider) — but **SAE Glasgow's
  identically-named MA is awarded by the University of Hertfordshire.** dBs → Falmouth ·
  Thinkspace → AUB · Leeds Conservatoire → Hull · ACM → Middlesex. **Point Blank has no
  postgraduate provision at all.** And **dBs accepts international students on its online
  programmes only — which means no student visa.**

**None of the 75 `Not a degree` records carries a verdict.** The disqualification lives in
`level`, `qualification`, `accreditation` (non-empty on 62 of 75) and `recommendation` (57
of 75). The record page must therefore lead with `level` and `qualification` and must not
show an empty verdict slot. §6.4.

Also here: **the 7 `Unclear`**, under a separate heading — *"Nobody could confirm whether
these award a degree. One email each."*

### 2.7 `What I have to make` — `/portfolio`

**The view that justifies the app, and the one with no spreadsheet equivalent.**

Job: **answer "what do I actually have to build?" across everything he is applying to, as
one brief.** It reads `portfolio`, `audition`, `entry`, `englishTest`, `languageReq` and
`deadline` from every shortlisted programme and merges them:

```
WHAT YOU HAVE TO MAKE
for the 6 on your list

THE COMMON CORE
  Every one asks for recorded work.
  The exact specs, quoted:
   · HfMT Köln — two audio files from the last two
     years, plus documentation of your working method
   · FHNW Basel — ONE self-produced mix + a method PDF
   · İTÜ MIAM — three mixes, each containing an
     acoustically miked source
   · Saint Louis Rome — a portfolio, nothing else
  Build to the widest: 3–4 finished tracks.
  ⚠ İTÜ's rule is the one that shapes the year:
    you must RECORD something real, not only
    produce in the box.

NOBODY TOLD YOU (2 of 6)
  TU Ilmenau — English route stated, no CEFR level
    or certificate list published.
  Łódź — no non-EU fee published for Polish-taught
    study. It could be near-free.
  → both are emails you can send today

THE LIVE THINGS
  0 of your 6 need a performance audition.
  2 involve a production test — which is the job:
   · HfMT Köln: "candidates receive raw material
     and must create a production"
   · Conservatorium van Amsterdam: "create in 10
     minutes an on-the-spot stereo mix of a
     pre-recorded 24-track session in Pro Tools"

TESTS AND LANGUAGES
  IELTS 5.0 — FH Joanneum Graz
  German A2 — HfMT Köln, HSLU Lucerne
  No German at all — FHNW Basel
  → one IELTS sitting covers everything on this list

DATES
  FHNW Basel   15 Dec 2026 – 15 Feb 2027  (confirmed)
  HfMT Köln    2 March                    (confirmed)
  4 others     last year's date only      (confirm)
```

Email addresses inside the prose are extracted and linkified. The *"nobody told you"*
block is generated from `portfolio`/`languageReq` containing `UNVERIFIED` or
`NOT PUBLISHED`. The production-test block is generated from `gate` + `audition` keyword
match, hand-checked once.

**This is a generated document, and it exports as Markdown** (§5.3) — exactly the artefact
he responded well to. The app's job is keeping it in sync with his shortlist
automatically.

Mobile: one column, headings in small caps, quoted specs in a serif block quote with a
left rule, copy-to-clipboard per block.

### 2.8 `My list` — `/me`

Job: **hold his decisions and his sentences.** Three sections:

1. **Doing** — status `applying` or `emailed`, sorted by staleness ("emailed 11 days ago,
   no reply").
2. **Deciding** — status `shortlist`, his note shown **inline in full**, never truncated.
3. **Ruled out** — status `no`, collapsed to a count; expanding shows the programme and
   **his own reason** ("no — needs a Tonmeister bachelor"). Kept forever, because in month
   seven he will re-find a programme and need to know why he already said no. A deleted
   spreadsheet row cannot do that.

Also here: **Export** (§5.3) and **Compare** — pick 2–4, get a field-by-field stack (§2.9).
Funding schemes he has starred appear as a fourth section, `Money I'm chasing`.

### 2.9 `Compare` — `/compare?ids=105,72,31`

Two to four, **as a vertical stack of field groups**, not a table with columns. He scrolls
through *Money*, then *Getting in*, then *Language*, each showing 2–4 labelled rows.
Identical values collapse to one line — "all three: portfolio + interview". Max 4; above
that, use the workbook.

### Navigation chrome

**Bottom tab bar, five items, always visible on mobile:**

`Now` · `Programmes` · `Money` · `To make` · `Mine (6)`

Five is the iOS maximum and every one of them earns its slot: the money half is now a
first-class dataset, and `To make` is the feature the app exists for. `Walk it with me`,
`Not a degree`, `Compare`, `The gates explained`, `The workbook` and `The written report`
live under `⋯` in the top bar.

**Search is not a tab.** At 420 KB gzipped it is cheap and always on: a search field at
the top of `Programmes` and `Money`, searching identity fields *and all prose by default*
(§4.3).

---

## 3. The programme record page — `/p/:id`

A **document**: top-aligned, one column, 34rem max, readable end to end without tapping
anything. Every collapse below is progressive disclosure of secondary material, never of a
decision-relevant field.

### 3.1 Field order

Ordered by his five questions, not by JSON key order. `[ ]` = conditional block.

```
── [ NOT A DEGREE BANNER ] ──────────────────────────  130 records, §6.4
   Above the title. Red. "This is not a master's degree."

── IDENTITY ─────────────────────────────────────────
   programme                22px serif, full, no clamp
   institution              15px, FULL — mean 67 chars, never truncated
   city · country · region  13px muted
   subtype                  12px chip, no colour
   "Row 143 in DOOR3.xlsx"  12px muted — workbook parity, §9

── [ THE VERDICT ] ──────────────────────────────────  127 records
   verdict                  the word, large, with icon
   verdictWhy               16px serif, FULL, never clamped (mean 361)

── [ CORRECTION ] ───────────────────────────────────  127 records
   correction               FULL, mean 487 — the longest verified field after
                            recommendation. Placed ABOVE money because it
                            usually invalidates the money. §3.4

── 1. CAN YOU GET IN? ───────────────────────────────
   gate                     chip + the Gate Explainer line (§3.6)
   needsAudition            if true: red block "Live performance audition."
                            if false and gate mentions an exam: green-neutral
                            block "There is a test, but it is a production
                            test, not an audition."
   acceptsNonMusic          FULL, 16px serif. The field that decides his life.
                            Never collapsed.
   entry                    FULL, with VERBATIM quotes pulled into block quotes
   [ prerequisite-degree flag ]  §3.6 — the Tonmeister wall
   portfolio                FULL, 16px serif, bordered, labelled
                            "What you must submit"
   audition                 FULL — this is where the production-test vs
                            ear-test distinction actually lives
   [ chance + whyChance ]   DEMOTED to a 13px muted line at the bottom of the
                            group, prefixed "Unverified guess from the listing
                            text:". Where a verdict disagrees: "An automatic
                            rating said Strong. The page was then read by hand
                            and judged AVOID. Trust the second one."

── 2. CAN YOU AFFORD IT? ────────────────────────────
   costBand                 the chip — CORRECTED where correction exists
   tuition                  FULL (mean 203, max 1,305)
   otherFees · totalCost    full
   funding · scholarship    chip; "—" renders as "No scholarship attached."
   scholarshipDetail        FULL (mean 215, max 2,738); clamp at 600 chars
   [ funding schemes ]      cross-linked from funding.json, §2.5

── 3. CAN YOU FOLLOW THE TEACHING? ──────────────────
   language                 chip; if languageOk is false: red line
                            "Taught in German. You do not have it."
   languageReq · englishTest  full

── 4. IS IT A REAL DEGREE? ──────────────────────────
   level                    stated as a sentence, not a chip
   qualification            full (mean 165, max 1,138)
   accreditation            full (mean 304, max 1,642) — for the 130 this is
                            the evidence, and it is promoted above section 1

── 5. WHAT DO YOU DO, AND BY WHEN? ──────────────────
   deadline                 FULL, mono, with the confidence banner (§6.3).
                            Never reformatted into a date.
   opens · duration         full

── WHAT YOU'D ACTUALLY STUDY ────────────────────────
   study                    full (mean 474); clamp at 600 with "Read all"
   recommendation           FULL, 16px serif, NEVER collapsed. Mean 755 chars
                            — the longest field in the dataset. This is the
                            written report, per record.

── YOUR NOTES ───────────────────────────────────────
   status · note · date stamps                              §5

── SOURCE ───────────────────────────────────────────
   url(s)                   parsed into a list — 143 records hold >1
   foundBy                  13px muted
   verification line        "Checked against the official page." or "Never
                            checked. Everything above came from a listing,
                            not from them."

── NOT PUBLISHED ────────────────────────────────────
   Collapsed row: "6 things nobody published: other fees, total cost,
   language requirement, English test, duration, city." Labels only. §3.4
```

For the 130 non-degrees, **section 4 moves to the top**, directly under the banner. The
question "is this real" is the only one that matters and the rest of the page is
context.

### 3.2 What is emphasised

Exactly **four** fields get 16–17px serif, full width, never clamped, with air:
`verdictWhy`, `acceptsNonMusic`, `portfolio`, `recommendation`. Plus `entry`'s quoted
sentences and, on the 130, `qualification`.

They answer: *why should I believe you*, *can I get in*, *what must I make*, *what would
you tell a friend*. They are also the four that are physically unreadable in a spreadsheet
cell. If the page has a thesis, it is "read these four."

### 3.3 Rendering the verification grammar

| pattern | occurrences | rendering |
|---|---|---|
| `VERBATIM:` / `CONFIRMED, verbatim: "…"` | throughout `entry`, `tuition`, `scholarshipDetail` | The prefix becomes a small ✔ **CONFIRMED** badge. The quoted sentence renders as a **serif block quote with a left rule** — the institution's own voice. The rest follows as body text. This is the highest-trust unit in the app and should look like it. |
| `VERIFIED …` | many | ✔ badge, body text, no quote styling |
| whole value `= "UNVERIFIED"` | `opens`, `scholarshipDetail`, `otherFees`, `totalCost`, `portfolio`, `deadline`; in funding, `competitiveness` (50) and `ageLimit` (29) | The label renders normally; the value area shows in muted italic with a **dotted** underline: *"Not checked — nobody has confirmed this."* The label's presence is the point: we know this question needs an answer. |
| `UNVERIFIED` **inline** | in **330 of 398** records | Wrap the token in a small-caps amber chip inline: `…approx. EUR 800/month, ᴜɴᴠᴇʀɪꜰɪᴇᴅ 2027 figure`. Never strip it, never let it read as plain prose. |
| `PRIOR CYCLE - confirm new date` | 177 `deadline` | Amber banner *above* the value: **"This is last year's date."** |
| `NOT PUBLISHED` | 5 `deadline`, and in `tuition`/`portfolio` | Red italic: "They publish nothing about this." Distinct from UNVERIFIED — a **checked absence**, not an unchecked field. |
| `INPUT SAID '…' — WRONG` | inside `correction`, all 127 verified | The **Correction block**: red left rule, heading "This was wrong in the earlier data", corrected number pulled out large. Above the money section so the wrong figure is never read first. |
| ALL-CAPS emphasis in prose (`THIS IS THE FINNISH-LANGUAGE LOOPHOLE…`, `YES — CONDITIONALLY`) | frequent | Do **not** render as shouting. Detect a run of ≥3 capitalised words at a sentence start and render it as bold small-caps lead-in. The pipeline used caps as emphasis; honour the intent, not the bytes. |
| email address in any prose | many | linkified `mailto:`, and harvested into `/portfolio` |
| `url` with several URLs | 143 | split, list, host name as label |

### 3.4 `UNVERIFIED` vs empty vs "free" — the three-way distinction

- **A value exists** → render it. `costBand: "Free"` renders as a green chip **only when
  `tuition` corroborates**. Where `correction` contradicts it, the chip shows the
  **corrected** figure and the original appears struck through inside the correction
  block. Record 0 is the canonical case: `costBand: "Free"`, and `tuition` says *"EUR 0 IF
  STUDYING IN FINNISH OR SWEDISH. EUR 28,000 per academic year if studying in English."*
  The chip must read **"Free only in Finnish"**, not "Free". A wrong "Free" is worse than
  no number.
- **The value is `UNVERIFIED`** → the row **is rendered**, label and all, dotted-underline
  muted italic. It is also a to-do: on a shortlisted record every `UNVERIFIED` row gets a
  small **"ask them"** affordance that drops a line into his note and, where an address
  exists, opens a pre-filled email.
- **The value is empty** → the row is **not rendered in the flow at all.** It joins the
  collapsed "Not published" list at the bottom as a bare label. No dash, no "N/A", no grey
  box. Empty means the pipeline never had a value — a weaker statement than `UNVERIFIED`,
  and it gets a weaker presentation.
- **`costBand: "Not published"`** (182 records) → the chip reads **"No price published"**
  in neutral grey, never green, and **sorts after every priced band**, never with "Free".

Certainty hierarchy, strongest to weakest:

```
CONFIRMED, verbatim  →  block quote + ✔      (they said it, we read it)
VERIFIED             →  ✔ badge              (we read it)
plain value          →  normal text          (from a listing)
UNVERIFIED           →  dotted, italic, muted (we looked, nobody said)
NOT PUBLISHED        →  red italic           (we looked, they refuse to say)
empty                →  absent from the flow (we never had it)
```

### 3.5 Presenting a verdict

Directly under identity, above everything, because for those 127 records it is the answer.

```
┌──────────────────────────────────────┐
│ ✔  WORTH IT                          │  green rule left, green word,
│                                      │  16px, letterspaced
│ [ verdictWhy — 16px serif, FULL,     │
│   never clamped, mean 361 chars ]    │
│                                      │
│ Read on the official page.           │  13px muted
└──────────────────────────────────────┘
```

`CONDITIONAL` is amber and headed **"CONDITIONAL — worth it if…"**, because the word alone
tells him nothing and the reason always names a specific unresolved thing. `AVOID` is red
and the page is **not** dimmed — he opened it deliberately and the reason is the payload.
An AVOID he disagrees with is a legitimate keep; he can shortlist it with a note. **The
app never blocks him.**

For the **271 without a verdict**, a visually different low-contrast strip — no colour, no
icon, thin rules:

> **Not checked.** Nobody has opened this institution's official page and read it. What
> follows came from a search listing and may be out of date, wrong, or describe a
> different programme with a similar name. Treat every line below as a lead, not a fact.
> **[ Open their page → ]**

It must be structurally impossible to mistake for a fourth verdict colour: greyscale, a
strip not a card, and the words "not checked" first.

### 3.6 The Gate Explainer — a named component

Because the gate ladder (§0.3) is the thing he will get wrong, and it is not in the data.

**On every record**, under the `gate` chip, one generated line naming the rung:

| condition | line |
|---|---|
| `needsAudition: true` | **"Live performance audition — the one gate you cannot pass."** red |
| gate has an exam **and** `audition` matches production/mix/raw-material terms | **"There is a test. It is a production test — the job, not a barrier."** neutral |
| gate has an exam **and** `audition` matches ear-training/instrument terms | **"The exam includes ear training. Read the detail."** amber |
| gate has an exam, `audition` empty or ambiguous (13 records) | **"There is an exam. Nobody said what kind. Ask them."** dotted |
| `gate: "Portfolio only"` | **"Portfolio only. Twelve months of work and you're through."** |
| `gate: "None found in the text"` | **"No gate found in the text — which is not the same as no gate."** dotted |

Plus a **prerequisite-degree flag**, hand-curated for the Tonmeister cluster (Detmold ×4,
Copenhagen, Düsseldorf, Babelsberg, CNSMD Paris, FAMU):

> ⛔ **Closed by a prerequisite degree, not by your ear.** Detmold demands a *"Bachelor of
> Music Musikübertragung bzw. Diplom-Tonmeister"*. Its actual entrance test is three of
> your own productions plus a colloquium — no ear test at all. **A closed prerequisite is
> sometimes negotiable by equivalence. A trained ear is not.**

And the false-alarm flag for Novi Sad and mdw Vienna:

> ℹ️ **That is a medical hearing certificate, not an ear test.**

Behind `⋯ → The gates explained` sits the full three-rung table from §0.3, one screen, and
every gate line links to it. **This is the single highest-value piece of editorial in the
app** — it is the difference between him believing 14 doors are closed and believing 135
are.

---

## 4. Navigation, filtering, search

### 4.1 The three concepts

- **Facet** — a precomputed enumeration with counts, from `meta.json`. Eleven for
  programmes: `country` (41), `region` (7), `subtype` (11), `level` (7), `chance` (3),
  `costBand` (6), `language` (39), `publicPrivate` (3), `funding` (4), `gate` (6),
  `verdict` (3). A closed vocabulary shown **in full with counts**; zero-count options
  greyed with `0`, never removed — disappearing options are how people lose their bearings.
- **Filter** — an active constraint. Multi-select OR within a facet, AND across facets.
  Plus **five boolean switches**, three of them straight from the data, which are the ones
  that matter most and get their own block at the top of the sheet:
  `isDegree` · `!needsAudition` · `languageOk` · `hasVerdict` · `verdict != AVOID`.
- **Search** — free text, **over identity fields and all prose, by default.** The payload
  is 420 KB gzipped; there is no reason to withhold it. Matching a prose field shows the
  **matched sentence with the term highlighted**, replacing the card's usual quoted
  sentence. This is the capability a spreadsheet is worst at, and in this dataset it is
  how he finds things no facet encodes: *"raw material"*, *"affine subject"*, *"regardless
  of the degree programme"*, *"Informática"*, *"no German"*, *"RNCP"*, *"título propio"*.
  A `Aa` toggle limits it to names only when prose matches get noisy.
  **Search covers programmes and funding in one field, results in two labelled groups.**

### 4.2 The filter sheet

From the sticky bar on `Programmes`. A bottom sheet at ~85% height, scrollable, persistent
footer showing `Show 37 results` and `Clear all`. Order — most decisive first:

1. The five switches
2. Money — `costBand` chips + `funding`
3. The gate — `gate` chips, with the ladder explainer inline
4. Where — `region` (7 values, fits on one screen), then `country` behind a small search
   field (41 values)
5. Language — top six by count, then "more"
6. `subtype`, `publicPrivate`, `chance` under **"More filters"** — `chance` is unreliable
   (§0.8) and should not be an inviting control

Active filters render as removable chips in the sticky bar, one row, horizontally
scrollable, overflow as `+3`.

### 4.3 Filter state lives in the URL

```
/list?q=raw+material&deg=1&aud=0&lang=ok&cost=free,u15&v=!avoid&sort=verdict&n=40
/p/105          /f/23           /me            /portfolio
/rejects?pattern=uk-validation  /compare?ids=105,72,31   /walk?step=2
```

Key map: `q` · `c` country · `r` region · `st` subtype · `lv` level · `ch` chance ·
`cost` · `lang` · `pp` · `fund` · `g` gate · `v` verdict · `deg`/`aud`/`langok`/`chk`
booleans · `sort` · `n`.

Rules:

- Written on every filter change via `history.replaceState`, so Back does not walk
  through thirty filter states. A **new** history entry is pushed only on view change and
  on opening a record. Back from a record restores **scroll position**.
- The URL is the share format — he will WhatsApp himself a link. `Copy link` in the
  overflow of every view.
- Unknown or stale params are ignored, never an error.
- **His personal state is never in the URL.** A shared link must not leak his notes.

### 4.4 How someone with no plan narrows down

1. Opens the app. Reads one paragraph and a funnel. Learns in fifteen seconds that the
   verified list and the affordable list barely intersect — which is the fact that would
   otherwise take him three weeks and one wasted application to discover.
2. Taps **Walk it with me**. Six questions in his language. Ends at **37**.
3. At step 2 he taps *"What the gates actually are"* and learns that a production test is
   not an audition. That one screen re-opens ~120 programmes he would have skipped.
4. Reads `Programmes`. Cards are ordered so verified-first, each with one sentence of a
   human's reasoning. He stars four in two minutes.
5. Opens one. Reads the verdict, the verbatim entry sentence, the portfolio brief. Sets
   status `shortlist` and types *"can a BSc count as an affine subject?"* into the note.
6. Drops the `verdict != AVOID` switch to see what was killed and why — the 86 avoids
   teach him the shape of the traps: needs a Tonmeister bachelor, not a real degree, no
   funding for non-EU, RNCP level 6.
7. Opens **Money**, reads *"nationality was rarely the bar — subject was"*, stars the
   Tunisian *bourse*, MAECI, AESEF and the WBI bursary.
8. Ends with six programmes and four schemes saved.
9. Opens **What I have to make**. One brief: build 3–4 tracks, record one real acoustic
   source (İTÜ's rule), one IELTS sitting, three emails to send this month, two confirmed
   dates and four to confirm.
10. Exports it as Markdown — the format he already reads.

Steps 3, 7, 9 and 10 are unreachable from a spreadsheet. Steps 1–2 are ones it cannot
start.

### 4.5 Duplicates

**20 near-duplicate groups covering 49 records.** Saint Louis Rome appears 6×, Abbey Road
London 4×, Abbey Road Amsterdam 3×, ICMP 3×, ITU 2×, ReSound 4× across two spellings.
They came from different discovery sweeps with different field coverage.

**And string normalisation is not sufficient.** The three ICMP records normalise to
`icmptheinstituteofcontem`, `icmpinstituteofcontempor` and `instituteofcontemporarym` —
they diverge at character 4. Any automatic clustering either misses them or over-merges
elsewhere.

**Recommendation: hand-review the 20 groups once — it is twenty — and freeze the result as
`clusters.json`.** One hour of human review beats a clever heuristic. Then:

- In `Programmes`, a cluster renders as **one card** footed *"4 records for this
  programme, from different searches — the fullest is shown."*
- On the record page, a section **"Other records for this programme"** lists siblings with
  a diff of the fields each one uniquely holds. Nothing is lost.
- Shortlisting affects the cluster, not the record.
- **Counts are always stated both ways where it matters** — the landing screen says
  *"eight verdicts across five programmes"*, never one number alone.
- **The workbook still has 398 rows.** Clustering is a display layer; the record ids and
  the total never change, so parity with `DOOR3.xlsx` holds (§9).

---

## 5. Personal state

### 5.1 The model

Per programme (keyed by **cluster id**) and per funding scheme:

```
status : none | shortlist | emailed | applying | applied | no
note   : free text, unlimited, his words
events : [{ type, date, text }]   emailed / replied / deadline-confirmed
starred: bool
```

Plus global: saved searches (name + query string), last view, theme.

Five statuses, not ten. `emailed` is its own status because it has a **clock** — the
landing screen surfaces "emailed 11 days ago, no reply" without him asking. That is the
app working while he is not looking, which a spreadsheet cannot.

### 5.2 Where it lives

**`localStorage`, one key, one JSON object. No account, no backend, no login.** One person,
one phone; a backend means a signup form, a lost password, a privacy question about his
applications and a server that outlives the project.

The real risk is iOS Safari evicting localStorage after ~7 days of disuse. So:

- **Mirror every write to `IndexedDB`**, which is evicted less aggressively. On load take
  whichever store is newer.
- **Auto-export nag** — if state has changed and the last export is over 7 days old, one
  amber line on the landing screen: *"You have 6 saved and 4 notes, only on this phone.
  Back them up →"*. Not a modal, not every session.
- The state object carries `version` and `savedAt`; imports merge **per record by
  `savedAt`**, never wholesale. He will end up with the app open on a laptop and a phone,
  and last-write-wins per record is correct and predictable.

### 5.3 Export — three formats, because he already told us what he likes

1. **`my-shortlist.md`** — a written report. Per programme: institution, his status, his
   note, the verdict and reason in full, the portfolio brief in full, the gate rung, the
   deadline with its confidence caveat, the URL. Then the funding schemes he is chasing.
   **This is the primary export**, because Markdown reports are the artefact he actually
   used. It should read like `results/DOOR3.md` and drop into the same folder.
2. **`my-shortlist.csv`** — one row per programme, his columns (status, note, dates) plus
   identity and decision columns, **including the `DOOR3.xlsx` row number**, so it pastes
   next to the workbook he already has.
3. **`state.json`** — the exact state object, for re-import. Import accepts a dropped file
   or pasted JSON.

All three generate client-side. If this is ever published as a sandboxed Artifact,
`<a download>` is inert — so **every export must also render into a selectable, copyable
`<textarea>` with a Copy button as the primary path**, download as a convenience.
Copy-paste always works on a phone.

---

## 6. Empty and edge states

### 6.1 No results

Never a shrug. Name the constraint doing the killing and offer to drop it:

> **Nothing matches all six of those.**
> The one doing the damage is **cost under €1,500** — dropping it gives you 19.
> Dropping **"checked only"** instead gives you 24.
> **[ Drop the cost limit ]  [ Drop "checked only" ]  [ Start over ]**

Computed by re-running the query with each active filter removed in turn and offering the
two that recover most. Trivial on 398 records, and it is the difference between a dead end
and a decision.

### 6.2 No verdict — 271 records, the common case

§3.5. The rule: **greyscale, thin, and the words "Not checked" come first.**
In `Programmes`, unverified cards are thinner and carry **no coloured chip at all**.
Absence of colour means absence of checking; the eye learns it in about twenty cards.

### 6.3 Deadlines

Four states, each with a banner above the verbatim value:

| condition | banner | colour |
|---|---|---|
| `PRIOR CYCLE` (177) | **"This is last year's date. The 2027 round is not published yet."** | amber |
| `UNVERIFIED` (82) | **"Not checked. Open their page."** | grey, dotted |
| `NOT PUBLISHED` (5) | **"They publish no deadline."** | red |
| empty (29) | row absent; appears in "Not published" | — |
| contains a year (48) | ✔ **"Published date"** | green |

**The value is always shown verbatim, in mono, never reformatted.** The prose carries
conditions — *"Upload rounds 24 Nov, 12 Jan, 16 Feb, 13 Apr"*, *"non-EEA applicants
earlier"* — that a parsed date would destroy.

**Revised for this scope: build a small hand-curated calendar.** At 1,839 records this was
impossible; at 398 it is a curation job of about a dozen entries, and `DOOR3.md` has
already done it:

```
1 Dec 2026     Royal Danish Academy closes — for autumn 2027
15 Dec–15 Feb  FHNW Basel window (start date already published: 13 Sep 2027)
8 Jan          Eiffel · Prince Claus
10 Jan–20 Feb  Türkiye Bursları, arts window
~15 Jan 2027   Campus France Tunisie closes
31 Jan         Islamic Development Bank
2 Mar          HfMT Köln
26 Mar         Italian MAECI AFAM
31 Mar         Romanian MFA
early May      NAWA (country quotas can close it weeks early)
15 May         AESEF
15 Jun         HfM Karlsruhe
autumn 2026    Watch: the Tunisian circulaire · UAL 2027/28 opening
```

It lives in a separate `dates.json` with a `source: "hand-confirmed"` field and renders in
a **visually distinct section** from the 350 parsed-prose deadlines, labelled
**"Confirmed by hand — everything else on this page is prose from a listing."** Never merge
the two sets. No countdown timers; the dates render as a plain dated list, past entries
struck through.

### 6.4 A record that is not a degree — 130 records, in scope by design

`level` is one of: `Not a degree` (75) · `Funding scheme` (40) · `Aggregate entry` (9) ·
`Unclear` (7) · `Master di I livello (60 CFU)` (4) · `Bachelor / first cycle` (2).

**All 75 `Not a degree` records carry an empty `verdict`.** The judgement lives in `level`,
`qualification` (68 of 75), `accreditation` (62 of 75) and `recommendation` (57 of 75).
So the record page must **not** show an empty verdict slot for them, and must not imply
they were "not checked" in the §3.5 sense — they *were* judged, by a different mechanism.
The strip for these reads:

> **Judged on its accreditation, not on a page reading.** What it awards is below.

Per level:

- **Not a degree** — a red banner **above the programme name**: *"This is not a master's
  degree."* Then `qualification` and `accreditation` immediately. He is applying for a
  visa; a certificate is not a route. The card in `Programmes` carries the same banner as
  its first line, and the card is rendered with a **hatched left edge** so it is
  distinguishable at a glance while scrolling, without relying on colour alone.
- **Funding scheme** (40) — a different card shape entirely (no gate, no portfolio, no
  duration), banner *"This is money, not a course"*, and a link into `/money`. Excluded
  from `Programmes` by the `isDegree` switch, which is **on by default**.
- **Unclear** (7) — amber: *"Nobody could confirm whether this awards a degree. Check the
  national register before you spend a day on it."* Own section in `/rejects`.
- **Master di I livello** (4) — amber, with the specific Italian explanation.
- **Bachelor / first cycle** (2) — red: *"This is bachelor level. It is below the degree
  you already have."*

And the pattern explainers from `DOOR3.md` — *título propio*, *Mastère* at RNCP 5–6,
*pós-graduação*, the UK validation chain, dBs online-only meaning **no student visa** —
render as cards inside `/rejects` (§2.6) and as a one-line callout on any record matching
that pattern.

### 6.5 Other edges

- **No URL** (1 record) — *"No official page was found. Treat it as a lead."*
- **Multiple URLs** (143) — list them, host as label.
- **Missing institution** (39 records have none) — show the programme and country, with
  *"Institution not recorded"* in muted italic rather than a blank line.
- **Empty shortlist** — §1.
- **Offline** — everything works after first load; the service worker caches all three
  data files. Show a small "offline, snapshot 2026-08" marker rather than errors.
- **State import conflict** — merged per record by `savedAt`, with a summary: *"12
  programmes merged, 2 notes kept from this device."*
- **A field over 2,000 chars** (`scholarshipDetail` max 2,738, `audition` max 2,521) —
  clamp to six lines with "Read all". Never truncate with an ellipsis and no way back.

---

## 7. Visual direction

**The thesis: a document with controls, not a dashboard.** He rejected a console and went
back to documents. So the app should look like the documents worked, with small plain
instruments attached.

### Typography

- **Prose: a serif.** Every long field — `verdictWhy`, `acceptsNonMusic`, `portfolio`,
  `recommendation`, `correction`, `entry` quotes, `whoCanApply`, `notes` — at 16px/1.55,
  measure capped at ~34rem. This is the strongest single signal that the app is for
  reading. Excel is 11px sans; the moment the important text is 16px serif, the app is
  visibly doing a different job.
  *Recommendation: a system serif stack — `Iowan Old Style, Charter, Georgia, 'Times New
  Roman', serif`. No webfonts. He is on mobile data.*
- **Chrome and metadata: system sans**, 13–15px.
- **Numbers, dates, counts, deadlines: tabular mono.** Deadlines especially — mono says
  *"this is a raw string I have not touched"*, which is exactly true.
- Programme titles serif; institution names sans, so the two never blur.
- Nothing below 12px. All-caps only for section labels, 11px at 0.08em letterspacing.

### Spacing

- 8px base. Section gaps 32px, field gaps 20px, line-level 8px.
- **20px page gutters on mobile.** Not 12. Prose needs air more than three extra
  characters per line.
- Sections separated by a 1px hairline at 12% ink — **one elevation level in the entire
  app** (the bottom sheet). Everything else sits flat on the page ground. Shadows are what
  made the rejected console feel like a demo.

### Colour semantics

The workbooks already trained him: **green / amber / red = worth it / conditional /
avoid.** Keep it exactly. Then the hard rule:

> **Only one traffic-light system may appear on any surface, and it belongs to `verdict`.**

Because `gate` also carries a green/amber/red logic in the workbooks, and two green things
meaning different things is how a colour system dies. Resolution:

- **`verdict` owns green / amber / red**, as a chip with an icon (✔ / ! / ✕) so it
  survives colour-blindness and greyscale.
- **`gate` is neutral by default** — a labelled chip in ink-2 with a small glyph. It goes
  red for exactly one value, `AUDITION — hardest for you` (16 records), as a red outline
  chip reading **"Live audition"**. That is the only borrowed use of red in the gate
  system and it earns it. The production-test line (§3.6) is **deliberately not green** —
  it is neutral with a ⚙ glyph, because green already means "verified worth it" and a
  production test is not a verdict.
- **`level: "Not a degree"`** — red banner plus a **hatched left edge**, so it reads as
  disqualified in greyscale and at a glance while scrolling. This is the second earned use
  of red, and it means the same thing as AVOID (do not spend time here), so it does not
  dilute.
- **`costBand`** — a **cool neutral ramp**, not the traffic light. Free and under €1.5k get
  a faint teal tint; over €15k gets no tint and mono text. Money is a scale, not a verdict.
  And given §0.2, a green "Free" next to a green "WORTH IT" would imply a correlation the
  data flatly contradicts.
- **`chance`** — **no colour at all.** 28 "Strong" records are AVOID. It renders as small
  muted text in the provenance section only.
- **`UNVERIFIED`** — amber, dotted, **always accompanied by a word.** Never colour alone.
- **Accent** — one deep teal, for links, the active tab and the primary button. Nothing
  else is coloured.

Six colours total: ink, muted, teal accent, green, amber, red. A seventh is a design
failure.

### Dark mode

Follows the system, with a manual override in the top bar (system / light / dark,
persisted). Define the full light palette on bare `:root`; redefine tokens under both
`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and
`:root[data-theme="dark"]`, so the toggle wins in both directions. `body` gets an explicit
token background — never transparent.

Dark values: ground `#0D1214` (not `#000`, which makes serif text buzz), surface `#151C1E`,
ink `#E8EFF0`. Verdict colours desaturate and lighten: green `#63C48B`, amber `#D9A550`,
red `#E77A72`, each on a ~10% tinted ground. Contrast ≥ 4.5:1 body, ≥ 3:1 chips.

He will read this in bed. Dark mode is not a nice-to-have.

### What makes it a tool and not a dashboard demo

Concretely forbidden:

- **No charts of any kind.** The funnel is numbers in a column. The rejected console's
  failure mode was looking impressive.
- **No hero, no gradient, no illustration, no logo, no product name in the UI.** The top
  bar shows the current view's name.
- **No skeleton shimmer.** 420 KB loads fast; below that threshold show nothing rather
  than a fake page.
- **No transition over 120ms**, and none at all on filter application. Results change
  instantly, like a spreadsheet's autofilter. Perceived speed *is* the feeling of "tool".
- **No modals** except the filter sheet and the export sheet. No onboarding carousel, no
  coach marks, no "🎉 you saved your first programme".
- **No emoji in the UI.**
- **The count is always visible.** He should never be unsure how many things he is looking
  at.
- **Every number on screen drills into its set.** If the app says 37, one tap shows the 37.
  Numbers that cannot be drilled into are decoration.
- **Text is selectable everywhere.** He will paste an entry requirement into an email.
- Tap targets ≥ 44px; primary actions in the bottom third for one-handed reach.

---

## 8. Explicit non-goals

1. **A sortable multi-column data table.** `DOOR3.xlsx` exists, has 19 tabs and filter
   buttons, and he likes it. Rebuilding it in a webview on a 390px screen is strictly
   worse. **The app links to the workbook instead.**
2. **Door 1, Door 2, or the other 1,441 records.** This app is Door 3. Mixing in
   electroacoustic composition and sound art would break parity with `DOOR3.xlsx`, which
   is the one guarantee that makes the app trustworthy. If he wants Door 1, that is a
   second instance over `ARTIST-ROUTE`'s data with the same design.
3. **A map.** 41 countries, and geography is his *last* constraint — visa, money, language
   and the gate decide long before "where is it nice". Most expensive screen to build,
   least used.
4. **Charts, dashboards, "insights", a stats page.** No decision improves from a pie chart
   of programmes per country.
5. **Countdown timers and reminders.** The hand-curated dates (§6.3) render as a plain
   dated list. A countdown on a `PRIOR CYCLE` date would manufacture false precision about
   the one thing where being wrong is fatal.
6. **An account, a login, or any server.** State lives on the device and exports to files.
   One user, one phone, no privacy surface, nothing to keep paying for.
7. **A ranking score or "match %".** Any composite would be built on `chance`, which is
   wrong on 28 of the 127 records where it can be checked. The honest ranking is *verdict
   first, then everything else*, with the reasons written out.
8. **An AI chat over the data.** He can already ask Claude with the whole repository. An
   in-app chatbox would be a worse copy that hallucinates deadlines.
9. **Editing or adding records.** The data comes from a reproducible pipeline. A
   hand-edited record in localStorage would silently diverge from the workbook and the
   report. **His notes are editable; the facts are not.**
10. **Arabic/French UI localisation and RTL at v1.** He reads English and French fluently
    and **the data is entirely English** — a French shell around English paragraphs is
    worse than an English shell. *If anything, translate the six `Walk it with me`
    questions into French. That is the whole localisation budget.* I am genuinely unsure;
    if he asks for French, do the chrome only and leave the data alone.
11. **Comparing more than four programmes.** Unreadable on a phone. Use the workbook.
12. **Any claim of freshness.** Never "updated daily", never a live timestamp. The data is
    a snapshot dated `2026-08`, that date is in the footer of every view, and every record
    links to the official page as the authority.
13. **Re-verifying anything in-app.** The app displays the verification state; it never
    changes it. If he confirms a deadline by email, that goes in **his note**, visibly his,
    never merged into the record's own fields.

---

## 9. Implementation constraints the IA depends on

- **One fetch.** `programmes.json` (1.68 MB) + `funding.json` (240 KB) + `meta.json`,
  gzipped to ~420 KB total, loaded once and cached by a service worker. No sharding, no
  index/detail split, no lazy loading. The scope cut paid for this, and it is what makes
  full-text search default-on and offline use complete.
- **Everything client-side, static hosting.** No build-time server.
- **`clusters.json`** — the twenty hand-reviewed duplicate groups (§4.5).
- **`dates.json`** — the dozen hand-confirmed deadlines (§6.3), each with a `source` field.
- **`gates.json`** — the hand-curated prerequisite-degree and false-alarm flags (§3.6).

  These three curated files are small, they are the app's editorial layer, and they are
  where the reasoning in `DOOR3.md` enters the product. They must be checked into the repo
  next to the data, not embedded in code.
- **Workbook parity is a test, not an aspiration.** A build-time assertion: 398 records,
  ids 0–397, `meta.json` counts reconcile to the record set, and every record carries its
  `DOOR3.xlsx` row number for display (§3.1). If the JSON is regenerated and a count
  moves, the build fails rather than shipping an app that disagrees with the workbook.
- **`meta.json` supplies facet counts** at rest; counts *under active filters* are
  computed client-side, which is instant on 398 records and is what makes the "dropping
  this gives you 19" copy in §6.1 possible.
- Accessibility: real `<button>`/`<a>`, visible focus, `aria-live` on the result count,
  every colour paired with a word or glyph.

---

## 10. Where I am unsure

1. **Whether `Walk it with me` gets used more than once.** It is a first-session tool.
   *Recommendation: build it, feature it on the landing screen while the shortlist is
   empty, demote it to the overflow once he has saved three.*
2. **Whether five bottom tabs is one too many.** *Recommendation: ship five. `Money` and
   `To make` are both load-bearing here in a way they would not be in a generic browser.
   If one has to go, it is `Money` — moved into the overflow with a cross-link from every
   record.*
3. **Whether the serif reads as old-fashioned to a 24-year-old on a phone.**
   *Recommendation: ship serif. The content is long-form reasoning and the product thesis
   is "read this". If it feels wrong in his hands the change is one token.*
4. **The production-test keyword classifier (§3.6).** Matching `audition` prose for
   production/mix/raw-material terms against ear-training/instrument terms will misfire on
   some of the 135 exam-gated degrees. *Recommendation: run it once, hand-check the 135,
   freeze the result into `gates.json`. Never ship the live regex — a wrong "this is only
   a production test" is exactly the error that costs him an application.*
5. **Whether `AVOID` should be hidden by default.** Hiding is cleaner; showing is how he
   learns the traps, and the report calls the 86 avoids "the point of the exercise".
   *Recommendation: show them, sorted last, 60% opacity, with one switch to hide.
   Default off.*
6. **French UI.** *Recommendation: English shell; French only for the six walk questions,
   and only if he asks.*
7. **Whether the `/rejects` view should be grouped by pattern or by country.** I chose
   pattern, because the pattern is transferable to a school he finds himself.
   *If he disagrees, country is a one-line change — the grouping key is a facet either way.*

---

*Scope: Door 3 — music production and studio craft, Europe · snapshot `2026-08` ·
398 programmes · 120 funding schemes · 127 verified · mirrors `results/DOOR3.xlsx`
and `results/DOOR3.md`.*
