# DESIGN-UX — the master's decision app

**For:** one person. A Tunisian software-engineering graduate, ~24, applying for a
September 2027 intake, aiming to become an electronic music producer. No music degree,
no conservatoire, no portfolio yet. Arabic native, French fluent, English working, no
German. Needs a student visa everywhere. Can pay a little, not a lot. **On a phone.**

**Against:** `app/public/data/programmes.json` — 1,839 records, 7.1 MB, one flat object each,
plus `app/public/data/meta.json` (facets + counts).

**Precedent to beat:** an interactive console was built for this data and rejected —
*"i didn't like the artifact, I'll go back to the documents."* He then asked for spreadsheets
and written reports and used those happily. The rejected console was three tabs
(Picks / Explore / Shortlist), a search box and a filter drawer. It was a **browser**. He
did not want a browser. He wanted an **answer with reasons attached**, which is what the
Markdown reports gave him.

This spec is written to be implemented. It is not a mood board. Where I am unsure I say so
and still give a recommendation.

---

## 0. What the data actually is (read this before designing anything)

I read all 1,839 records. These facts drive every decision below; a design that ignores
them will be wrong.

**The corpus is mostly noise, and the noise is structured.**

| | count | design consequence |
|---|---|---|
| total records | 1,839 | never the headline number |
| real master's degrees | 1,433 | 406 records are certificates / funding schemes / unclear — must be visibly *disqualified*, not just filtered away |
| `level: "Not a degree"` | 186 | needs its own loud treatment on the record page |
| `level: "Funding scheme"` | 148 | these are **not programmes**. They are money. They must not share a card design with a degree |
| in Door 1 or Door 3 | 1,090 | the other 749 are "Other track" — music business, adjacent media |
| **`gate` is empty for all 749 "Other track" records** | 749 | the gate facet only exists inside Doors 1 & 3. A gate filter applied globally silently deletes 749 rows. This is a trap |
| performance audition demanded | 57 (54 of them degrees in his doors) | small, but it is the one hard "no" in his life. It must be a first-class, always-visible flag |
| re-verified with a verdict | **316** (21 WORTH IT, 87 CONDITIONAL, 208 AVOID) | 17% of the corpus |
| **no verdict at all** | **1,523** | must never look verified. Not a lighter green — a *different kind of thing* |
| records containing the literal string `UNVERIFIED` somewhere | **1,510** | `UNVERIFIED` is mostly **inline inside prose**, not a whole-field sentinel. It cannot be handled by cell styling alone |

**The long-form fields are the entire reason this app exists.** Mean length of the
non-empty value:

| field | mean chars | max | non-empty |
|---|---|---|---|
| `recommendation` | 590 | 3,216 | 1,091 |
| `study` | 468 | 2,653 | 1,169 |
| `correction` | 425 | 869 | 316 |
| `verdictWhy` | 404 | 942 | 316 |
| `entry` | 322 | 2,064 | 1,668 |
| `acceptsNonMusic` | 315 | 1,202 | 1,137 |
| `scholarshipDetail` | 258 | 4,000 | 1,617 |
| `audition` | 210 | 2,521 | 1,120 |
| `portfolio` | 193 | 1,860 | 1,644 |
| `tuition` | 190 | 3,124 | 1,672 |
| `deadline` | 174 | 993 | 1,787 |

1,391 records have an `entry` field over 120 characters. 899 have an `acceptsNonMusic`
over 120. 777 have a `portfolio` brief over 120. **These are paragraphs, often containing
a verbatim quotation from the official admissions page.** In Excel they are a truncated
smear in a 200px cell that he must click and read in the formula bar, one at a time. That
is the gap. Everything else in this spec serves it.

**`deadline` is prose, not a date.** Classified:

| shape | count |
|---|---|
| contains `PRIOR CYCLE - confirm new date` | 791 |
| starts `UNVERIFIED` | 406 |
| contains a real year 2026–2029 | 367 |
| free prose (rounds, "rolling", conditions) | 121 + 74 rolling |
| `NOT PUBLISHED` | 28 |
| empty | 52 |

Example values, verbatim:

- `"Upload rounds 24 Nov, 12 Jan, 16 Feb, 13 Apr (confirmed on page; verify these correspond to the 2027-2028 cycle); non-EE…"`
- `"PRIOR CYCLE - confirm new date: WS 2026/27 application window was Mar 1 - Jun 15, 2026 (PASSED); annual cycle, expect Ma…"`

**There is no sortable date in this dataset and there will not be one.** Any calendar,
countdown, or "sort by deadline" is a lie. See §6 and §8.

**`chance` is unreliable and `verdict` contradicts it.** Cross-tabulated:

| chance | AVOID | CONDITIONAL | WORTH IT |
|---|---|---|---|
| Strong | **76** | 56 | 17 |
| Possible | 57 | 24 | 4 |
| Weak | 75 | 7 | 0 |

76 records rated **Strong** were, on re-verification, judged **AVOID**. `chance` is a
heuristic applied to a scraped blurb; `verdict` is a human reading the official page.
**Design rule: where a verdict exists, it wins, visually and in sort order. `chance` is
demoted to provenance.** This single rule is the most important content decision in the
app and the console got it wrong by giving both equal chips.

**Other shape facts:**

- `costBand` is `"Not published"` for **726** records — the largest single honest gap.
- `languageOk` is a precomputed boolean, true for 1,085. It is the cheapest high-value filter he has.
- `scholarship` is the em-dash `"—"` for 970 records. **That em-dash means "none", not "unknown"** — the unknown is `scholarshipDetail: "UNVERIFIED"` (251 records). These must render differently.
- **511 records pack more than one URL into the `url` field.** Parse on whitespace/`;`, render as a list.
- **57 near-duplicate groups covering 120 records.** DIGICREA appears 4×, Sonology 3×, ICMP MA Creative Music Production 3×, Huddersfield 2×. They came from different discovery agents with different field coverage. Showing him "your top 6" where 4 rows are the same consortium is the fastest way to lose his trust. See §4.6.
- 7.1 MB of JSON is **not** a phone payload on Tunisian mobile data. See §9.

**The realistic funnel, computed:**

```
1,839  everything the search found
1,433  award a real master's degree
  852  are in Door 1 (electronic music & sound art) or Door 3 (music production & studio)
  798  do not demand a performance audition
  493  are taught in English or French
  370  have not been ruled out on the official page
  289  where his background gives him a Strong or Possible chance
  108  he could plausibly pay for  (cost ≤ €5k/yr or free, OR fully funded)
        └─ 11 WORTH IT · 37 CONDITIONAL · 60 never verified
```

108 → the six. That chain is the spine of the product.

---

## 1. The one-screen answer

### The landing view is **Where you stand**. It is a single scrolling column of prose and numbers. It is not a table, not a grid of cards, not a chart, and not a search box.

Top to bottom on a 390px phone:

```
┌────────────────────────────────────┐
│ Where you stand          ◐  ⋯      │   40px bar, no logo, no brand
├────────────────────────────────────┤
│                                    │
│  Sept 2027 intake.                 │   ← 13px mono, muted
│  You have 6 on your list           │
│  and 2 need an email this month.   │   ← 20px serif. THE line.
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ▸ Postdigital Lutherie       │  │   ← his shortlist, status-ordered
│  │   Kunstuni Linz · Austria    │  │
│  │   ● emailed 3 Aug — no reply │  │
│  │   Portfolio spec unpublished │  │
│  ├──────────────────────────────┤  │
│  │ ▸ Sonology                   │  │
│  │   KC Den Haag · Netherlands  │  │
│  │   ○ not started              │  │
│  │   IELTS 6.0 · portfolio only │  │
│  └──────────────────────────────┘  │
│  Open your list  →                 │
│                                    │
│  ──────────────────────────────    │
│                                    │
│  HOW 1,839 BECOMES 6               │   ← the funnel. Tappable rows.
│                                    │
│  1,839  everything found           │
│  1,433  award a real degree        │
│    852  in your two doors          │
│    798  no audition                │
│    493  in English or French       │
│    370  not ruled out              │
│    289  you have a real chance     │
│    108  you could pay for          │
│         ↳ 11 checked & worth it    │
│                                    │
│  Walk it with me  →                │   ← §2.2 Five Questions
│                                    │
│  ──────────────────────────────    │
│                                    │
│  21 have been opened, read and     │
│  judged worth it. 11 of those      │
│  survive your money and your        │
│  language. Here they are. →        │
│                                    │
│  1,523 of the 1,839 have never     │
│  been checked against an official  │
│  page. Nothing here is verified    │
│  unless it says so.                │   ← honesty, above the fold-ish
└────────────────────────────────────┘
```

Nothing else. No search box on this screen (search lives one tap away, §4.3). No filter
chips. No map. No chart.

### Why this and not the spreadsheet

The spreadsheet already wins at: filtering a column, sorting, seeing 40 rows at once,
and being offline on a laptop. **Do not compete there.** This screen does four things
`MASTER-all-opportunities.xlsx` cannot:

1. **It knows the order to filter in.** A spreadsheet has 37 columns and no opinion about
   which to touch first. Opening it, his first move is undefined — and the wrong first
   move (filter Country) leaves him with 177 UK rows and no idea that 120 of them cost
   over €15k and 30 are not degrees. The funnel encodes the *correct* order — degree,
   door, audition, language, verdict, chance, money — as a readable sentence stack. Each
   row states what it costs him. That is editorial judgement, and a grid cannot hold it.
2. **It remembers him.** Column AK of a spreadsheet cannot say "you emailed Linz on 3
   August and they have not replied in 11 days." His own state (§5) is the top block on
   the landing screen, above the corpus, because after week one the corpus is not what
   changes — *he* is.
3. **It says out loud what is not known.** The "1,523 never checked" line is a design
   feature. In Excel, an empty cell and a cell reading `UNVERIFIED` look equally like
   nothing. Here the not-knowing is a number on the front page.
4. **It is legible held in one hand on the bus.** The spreadsheet is not.

If he is ever on a laptop and wants to sort 1,433 rows by cost band, the correct answer
is: *open the spreadsheet.* The app should say so — in the overflow menu, a permanent
link labelled "The workbooks (better on a laptop)" pointing at `results/`. Conceding the
grid is what buys the right to not build one.

**If his shortlist is empty** (first run), the top block is replaced by:

> **Start here.** 21 programmes were opened, read and judged worth it. Eleven of them are
> ones you could afford and follow. Read those eleven, keep the ones that feel like your
> life, and the rest of this app exists to check them.
> **[ Read the eleven → ]**

Then the funnel. Never an empty dashboard.

---

## 2. Named views

Seven. Each is a URL. Each has one job. A view that cannot state its job in one sentence
gets cut.

### 2.1 `Where you stand` — `/`

Described above. Job: **tell him what to do next, in a sentence, before he decides
anything.** Mobile layout: single 100% column, 20px side padding, max-width 34rem on
desktop and *left-aligned within it*, not centred — it reads as a document, not a landing
page. The funnel rows are 44px tap targets, number right-aligned in tabular mono, label
left in sans. Tapping a funnel row opens **The List** with exactly the filters of that
row *and every row above it* applied — the URL is the proof (`/list?deg=1&door=13&aud=0`).

### 2.2 `Walk it with me` — `/walk`

Job: **get someone with no plan from 1,839 to a working set in six taps, teaching the
data's shape on the way.** This replaces the rejected console's filter drawer. It is the
answer to "he doesn't know which column to filter first."

Six full-screen steps, one question each, phrased in his language, not the data's. Each
step shows the live remaining count and — the important part — **what the answer throws
away**:

| step | question | choices | mechanism |
|---|---|---|---|
| 1 | Does it have to be a real master's degree? | Yes / Show me certificates too | `level` |
| 2 | What are you actually going to do there? | Make electronic music & sound art (678) · Produce & engineer records (412) · Both (1,090) · The business side too (1,839) | `door` |
| 3 | Could you pass a live performance audition? | No — hide those (removes 54) / I'd try | `gate` |
| 4 | What can you follow? | English or French (`languageOk`) · English only · Any, I'll deal with it | `language` |
| 5 | What can you pay per year? | Nothing · Under €1,500 · Under €5,000 · Whatever, if it's funded · Show me everything including the 726 with no published price | `costBand` + `funding` |
| 6 | Show me the ones that have been checked? | Only checked (316) · Checked first, then the rest · Everything | `verdict` sort/filter |

Bottom of every step, persistent: `1,839 → 108` with the current count animating only by
number swap, no bar chart. Back is always available and non-destructive. Step 3 shows,
under the choice: *"Only 54 programmes in your doors demand one. This is a small door,
not a wall."* Step 5 shows: *"726 institutions publish no price at all. Excluding them
hides 40% of the real degrees — I'd keep them and ask."*

At the end: **"108 left. Here they are."** → The List, filters in the URL, plus a
one-tap "save this search" that names it (`My search · 108`) and pins it to the landing
screen.

Mobile: one question per screen, choices as full-width 56px rows with counts right-aligned.
Thumb-reachable. No horizontal scrolling ever.

### 2.3 `The List` — `/list?…`

Job: **let him read the results, not scan them.** This is the closest thing to a table and
it is deliberately *not* one.

Each result is a **card, three to five lines, that includes one sentence of prose**:

```
┌────────────────────────────────────┐
│ ✔ WORTH IT              Free       │  ← verdict chip left, cost right
│ Master Programme Postdigital       │  ← 17px serif, 2-line clamp
│ Lutherie                           │
│ Kunstuni Linz · Linz, Austria      │  ← 13px muted
│                                    │
│ "…you need a valid bachelor (or    │  ← THE SENTENCE. 14px serif,
│ equivalent) degree" — no field     │     italic, 3-line clamp
│ restriction, no German.            │
│                                    │
│ Portfolio + interview · English    │  ← gate · language, 12px
│ ☆                                  │
└────────────────────────────────────┘
```

**The sentence is what a spreadsheet row cannot carry.** Which field it comes from is
chosen by a fixed precedence, so it is always the most decision-relevant thing known:

1. `verdictWhy` (first sentence) — if a verdict exists
2. else `acceptsNonMusic` (first sentence) — if it is substantive (>60 chars)
3. else `entry` (the quoted portion, if `CONFIRMED, verbatim:` is present)
4. else `whyChance` — the weak fallback, and it renders in muted grey to signal it is a
   guess, not a reading
5. else nothing — the card is four lines and visibly thinner. That thinness is
   information: *nobody looked at this one.*

Sort order, default and only sensible one: **verdict rank (WORTH IT → CONDITIONAL →
unverified → AVOID), then chance, then cost band.** AVOID records sort last and render
at 60% opacity with the red chip. They are *not* hidden by default when a verdict filter
is not set — he needs to see that the thing he was excited about was checked and killed,
with the reason one tap away. That is the single most valuable thing the verified 316 do.

Alternative sorts offered: A–Z by country, by cost band. **No "sort by deadline"** (§6).

Mobile layout: single column, cards separated by a 1px hairline rather than gaps and
shadows — a list of entries in a document, not a Pinterest board. Sticky 44px bar at top
showing `108 results · filters ▾` — tapping opens the filter sheet (§4.2). Infinite
scroll is wrong here; use a **"Show 40 more"** button so his scroll position survives and
his data plan survives. Count is always visible.

Desktop: same single column, max-width 40rem. **I am deliberately not building a
multi-column grid or a dense table on desktop.** The spreadsheet is the dense table.

### 2.4 `The Page` — `/p/:id`

The record page. Full spec in §3. Job: **be the document he would have gotten in
Markdown, for one programme, complete, with nothing truncated.**

### 2.5 `My list` — `/me`

Job: **hold his decisions and his sentences.** Three sections, in this order:

1. **Doing** — status `applying` or `emailed`, sorted by staleness ("emailed 11 days ago")
2. **Deciding** — status `shortlist`, with his note shown inline in full, not truncated
3. **Ruled out** — status `no`, collapsed to a count; expanding shows programme + his
   own reason ("no, needs 3 yrs studio work"). **His rejection reasons are kept forever
   and shown**, because in month seven he will re-find a programme and need to know why
   he already said no. A spreadsheet row he deleted cannot do that.

Also on this screen: **Export** (§5.3) and **Compare** — select 2–4 from Doing/Deciding
and get a field-by-field stack (§2.7).

Mobile: cards identical to The List plus a status pill and his note. Swipe is not used
for destructive actions; status is changed by a tap that opens a 5-option sheet.

### 2.6 `What I have to make` — `/portfolio`

**This is the view that justifies the whole app and it has no spreadsheet equivalent.**

Job: **answer "what do I actually have to build?" across everything he is applying to,
as one brief.**

It takes every programme in `My list` with status `shortlist`/`emailed`/`applying`, pulls
their `portfolio`, `audition`, `entry`, `englishTest`, `languageReq` and `deadline`
fields, and renders **one merged brief**:

```
WHAT YOU HAVE TO MAKE
for the 6 on your list

THE COMMON CORE
  Every one of the six asks for recorded work.
  Four say "a portfolio"; two give a spec:
    · Sonology — [exact quoted spec, in full]
    · ReSound   — [exact quoted spec, in full]
  Longest requirement across all six: 20 minutes.
  Build to the longest. It covers the rest.

NOBODY TOLD YOU (2 of 6)
  Linz  — "a portfolio of your works" is the ENTIRE
          published spec. No count, no duration, no
          format. → email martin.kaltenbrunner@…
  ITU   — not published.
  These two are emails you can send today.

TESTS
  IELTS 6.0 — Sonology
  IELTS 6.5 — KAIST
  → one sitting covers both. Book it.

LIVE THINGS YOU MUST DO
  Linz — interview around the portfolio, one fixed
         day (29 June for the 26/27 round), likely
         on-site. No musical performance.
  (0 of your 6 require a performance audition.)
```

The email addresses in the source prose are extracted and rendered as `mailto:` links.
The "nobody told you" block is generated from `portfolio` containing `UNVERIFIED` or
`NOT PUBLISHED`.

This is a **generated document**, and it exports as Markdown (§5.3) — which is exactly
the artefact he responded well to before. The app's job here is to keep it in sync with
his shortlist automatically. Excel cannot do this because the source is six paragraphs,
not six cells.

Mobile: one column, headings in small caps, quoted specs in a serif block quote with a
left rule. Copy-to-clipboard on each block.

### 2.7 `Compare` — `/compare?ids=0,412,88`

Job: **put two to four record pages side by side without a horizontal scroll.**

Not a table with columns. **A stack of field groups**, each group showing 2–4 rows —
one per programme — with the programme name as a small left label. He scrolls vertically
through *Money*, then *Getting in*, then *Language*. Within each group, the differing
values are what he sees; identical values collapse to one line reading "all four: English."

Max 4. Above 4 it becomes unreadable on a phone and he should use the spreadsheet.

### 2.8 `Money` — `/money`

Job: **the 148 funding schemes are not programmes and need their own room.**

`level: "Funding scheme"` records (148, plus 31 "Aggregate entry") are excluded from The
List by default and live here, listed by whether he is eligible — nationality and timing
are the two killers, and the reports already document which schemes are closed to
Tunisians. Renders `scholarshipDetail` (mean 258 chars, max 4,000) in full. Cross-links:
a programme page shows any scheme whose `scholarship` string matches.

I am unsure whether he will use this view much — the reports suggest funding is mostly
decided per-programme. **Recommendation: build it, but reachable only from the overflow
menu and from programme pages, not from the main nav.** If the analytics-free version of
that judgement is "he never opens it", it costs one route.

### Navigation chrome

**Bottom tab bar, 4 items, always visible on mobile:**
`Where you stand` · `Search` · `My list (6)` · `What I have to make`

Not five, not a hamburger. `Walk it with me`, `Money`, `Compare` and `The workbooks` live
in an overflow `⋯` in the top bar. The badge on `My list` is the only number in the chrome.

---

## 3. The record page — `/p/:id`

The most important screen. It is a **document**, top-aligned, one column, 34rem max, and
it can be read end to end without tapping anything. Every collapse below is a
*progressive disclosure of secondary material*, never of a decision-relevant field.

### 3.1 Field order

Ordered by his five questions, not by JSON key order. `[ ]` = conditional block.

```
── IDENTITY ─────────────────────────────────────────
   programme                    22px serif, full, no clamp
   institution                  15px, full — do not truncate,
                                mean 65 chars, max 110
   city · country · region      13px muted
   [level chip]                 only when NOT "Master's degree" — see §3.4
   door · track · subtype       12px chips, muted, no colour

── [ THE VERDICT ] ──────────────────────────────────  only 316 records
   verdict                      the word, large
   verdictWhy                   16px serif, FULL, never clamped
                                (mean 404 chars — this is ~4 lines. Show it.)

── [ CORRECTION ] ───────────────────────────────────  only 316 records
   correction                   full. Placed ABOVE money because it usually
                                invalidates the money. See §3.3.

── 1. CAN YOU GET IN? ───────────────────────────────
   gate                         chip + plain-language restatement
   acceptsNonMusic              FULL, 16px serif — this is the field that
                                decides his life. Never collapsed.
   entry                        FULL, with the verbatim quote pulled into
                                a block quote (§3.3)
   portfolio                    FULL, 16px serif, in a bordered block
                                labelled "What you must submit"
   audition                     FULL
   [chance + whyChance]         DEMOTED — a single 13px muted line at the
                                bottom of this group, prefixed "Unverified
                                guess from the listing text:". If a verdict
                                exists and disagrees, it reads: "An earlier
                                automatic rating said Strong. The page was
                                then read by hand and judged AVOID. Trust
                                the second one."

── 2. CAN YOU AFFORD IT? ────────────────────────────
   costBand                     the chip
   tuition                      FULL (mean 190, max 3,124)
   otherFees                    full
   totalCost                    full
   funding                      chip
   scholarship                  one line
   scholarshipDetail            FULL (mean 258, max 4,000) — collapsed to
                                6 lines with "Read all" ONLY when >600 chars
   [linked funding schemes]     from /money

── 3. CAN YOU FOLLOW THE TEACHING? ──────────────────
   language                     chip; if languageOk is false, a red-bordered
                                line: "Taught in German. You do not have it."
   languageReq                  full
   englishTest                  full

── 4. IS IT A REAL DEGREE? ──────────────────────────
   level                        the answer, stated as a sentence
   qualification                full
   accreditation                full (mean 222, max 1,642)

── 5. WHAT DO YOU DO, AND BY WHEN? ──────────────────
   deadline                     FULL, in mono, with the confidence banner
                                (§6.3). Never reformatted into a date.
   opens                        full
   duration                     full

── WHAT YOU'D ACTUALLY STUDY ────────────────────────
   study                        full (mean 468) — collapsed to 5 lines
                                with "Read all" when >600 chars
   recommendation               FULL, 16px serif, never collapsed. Mean 590
                                chars. This is the written report, per record.

── YOUR NOTES ───────────────────────────────────────
   status selector · note field · date stamps      (§5)

── SOURCE ───────────────────────────────────────────
   url(s)                       parsed into a list — 511 records hold >1
   foundBy                      13px muted: "Found by: sound design deep dive"
   verification line            "Checked against the official page on
                                <date>." or "Never checked. Everything above
                                came from a listing, not from them."

── NOT PUBLISHED ────────────────────────────────────
   A collapsed row: "7 things nobody published: accreditation, other fees,
   total cost, language requirement, English test, duration, subtype."
   Expanding lists the field labels only, with no value area. See §3.4.
```

### 3.2 What is emphasised

Exactly **four** fields get 16–17px serif, full width, never clamped, with breathing room:
`verdictWhy`, `acceptsNonMusic`, `portfolio`, `recommendation`. Plus `entry`'s quoted
sentence. Everything else is 15px sans or 13px muted.

Rationale: those four answer *can I get in*, *why should I believe you*, *what must I
make*, and *what would you tell a friend*. They are also the four that are physically
unreadable in a spreadsheet cell. If the page has a thesis, it is "read these four."

### 3.3 Rendering the verification grammar

The prose carries a markup language the pipeline invented. Parse it; do not print it raw.

| pattern in the data | occurrences | rendering |
|---|---|---|
| `CONFIRMED, verbatim: "…"` | 316 in `tuition`, 226 in `entry`, others | The prefix becomes a small ✔ **CONFIRMED** badge above the block. The quoted sentence renders as a **serif block quote with a left rule**, in the institution's own voice. The rest of the value follows as body text. This is the highest-trust unit in the app and should look like it — it is a quotation from the source. |
| `VERIFIED …` (939 in `scholarshipDetail`, 919 in `opens`, 862 in `tuition`) | ~ | ✔ badge, body text, no quote styling |
| whole value `= "UNVERIFIED"` | 462 `opens`, 251 `scholarshipDetail`, 226 `otherFees`, 205 `totalCost`, 137 `portfolio`, 137 `deadline` | The field label renders normally and the value area shows, in muted italic with a **dotted** underline: *"Not checked — nobody has confirmed this."* The label being present is the point: we know this field should have an answer. |
| `UNVERIFIED` **inline inside a sentence** | present in 1,510 records | Wrap the token in a small-caps amber chip inline: `…ECTS not published on either page ᴜɴᴠᴇʀɪꜰɪᴇᴅ (Austrian masters are normally 120).` Do not strip it, do not let it read as normal prose. The surrounding sentence is real information; the token qualifies it. |
| `PRIOR CYCLE - confirm new date` | 791 `deadline`, 234 `opens` | Becomes an amber banner *above* the deadline value: **"This is last year's date."** The remaining prose renders below it. |
| `NOT PUBLISHED` | 91 `tuition`, 87 `portfolio`, 68 `deadline` | Red-tinted italic: "They publish nothing about this." Distinct from UNVERIFIED — this is a checked absence, not an unchecked field. |
| `INPUT SAID '…' — WRONG` | 95 of the 316 `correction`s | The **Correction block**: red left rule, heading "This was wrong in the earlier data", the corrected number pulled out large. Placed above the money section so he cannot read the wrong figure first. |
| `scholarship: "—"` | 970 | Renders as the sentence **"No scholarship attached."** Never as a dash. |
| an email address inside any prose field | many | Linkified `mailto:`, and harvested into `/portfolio`'s email list |
| `url` containing several URLs | 511 | Split, rendered as a list with the host name as the label |

### 3.4 `UNVERIFIED` vs empty vs "free" — the three-way distinction

This is the correctness requirement in the brief and it deserves its own rule set.

- **A value exists** → render it. `costBand: "Free"` renders as a green chip reading
  **Free**, and *only* when `tuition` corroborates. Where `correction` contradicts it
  (record 0: `INPUT SAID 'Free' — WRONG … €726.72/semester`), the **chip renders the
  corrected figure, not "Free"**, with a strikethrough of the original in the correction
  block. A wrong "Free" is worse than no number.
- **The value is `UNVERIFIED`** → the field row is **rendered**, label and all, with the
  dotted-underline muted italic treatment. Presence of the row means "this question
  matters and has no answer yet." It is also a to-do: each `UNVERIFIED` row on a
  shortlisted record gets a small **"ask them"** affordance that drops a line into his
  note and, where an address exists, opens a pre-filled email.
- **The value is empty (`""`)** → the field row is **not rendered in the flow at all.**
  It joins the collapsed "Not published" list at the bottom, as a bare label. No dash, no
  "N/A", no grey box. An empty field means the pipeline never had a value; that is a
  weaker statement than `UNVERIFIED` and gets a weaker presentation.
- **`costBand: "Not published"`** (726 records) → the cost chip reads **"No price
  published"** in neutral grey, never green, and is never treated as cheap in sorting.
  A programme with no published price sorts *after* every priced band, not with "Free".

Summary of the visual hierarchy of certainty, strongest to weakest:

```
CONFIRMED, verbatim  →  block quote + ✔      (they said it, we read it)
VERIFIED             →  ✔ badge              (we read it)
plain value          →  normal text          (from a listing)
UNVERIFIED           →  dotted, italic, muted (we looked, nobody said)
NOT PUBLISHED        →  red italic           (we looked, they refuse to say)
empty                →  absent from flow     (we never had it)
```

### 3.5 Presenting a verdict

The verdict block sits directly under the identity block and above everything else,
because for 316 records it is the answer.

```
┌──────────────────────────────────────┐
│ ✔  WORTH IT                          │   green rule left, green word,
│                                      │   16px, letterspaced
│ This is the single best structural    │   verdictWhy, 16px serif,
│ fit in this slice: an English-taught  │   FULL TEXT, never clamped
│ MA that only asks for "a valid        │
│ bachelor (or equivalent) degree",     │
│ has no live audition, no German…      │
│                                      │
│ Read on the official page.           │   13px muted
└──────────────────────────────────────┘
```

`CONDITIONAL` uses amber and the heading reads **"CONDITIONAL — worth it if…"**, because
the word alone tells him nothing and the reason always names a specific unresolved thing.
`AVOID` uses red and the page is *not* dimmed — he opened it deliberately, and the reason
is the payload. The rest of the page renders in full underneath. An AVOID with a reason
he disagrees with (e.g. "no funding" when he has family support) is a legitimate keep,
and he can shortlist it anyway with a note. **The app never blocks him.**

**For the 1,523 without a verdict**, the block is replaced by a visually different,
low-contrast strip — no colour, no icon, thin rules:

> **Not checked.** Nobody has opened this institution's official page and read it. What
> follows came from a search listing and may be out of date, wrong, or describe a
> different programme with a similar name. Treat every line below as a lead, not a fact.
> **[ Open their page → ]**

It must not be possible to mistake this for a fourth verdict colour. It is greyscale, it
is a strip not a card, and it says the word "not checked" in the first two words.

---

## 4. Navigation, filtering, search

### 4.1 The three concepts, defined

- **Facet** — a precomputed enumeration with counts, straight out of `meta.json`. There
  are 13: `country` (88 values), `region` (10), `door` (3), `track` (6), `subtype` (11),
  `level` (7), `chance` (3), `costBand` (6), `language` (51), `publicPrivate` (3),
  `funding` (4), `gate` (6), `verdict` (3). A facet is a *closed vocabulary he can be
  shown in full with counts*. Options with zero results under the current filters are
  shown greyed with `0`, never removed — disappearing options are how people lose their
  bearings.
- **Filter** — an active constraint. Facet filters are multi-select OR within a facet,
  AND across facets. Plus **five derived boolean filters** that are not facets, because
  they are questions rather than vocabularies, and they are the ones that matter most:
  `isDegree` (`level == "Master's degree"`), `noAudition` (`gate != "AUDITION…"`),
  `languageOk` (precomputed), `hasVerdict` (`verdict != ""`), `notRuledOut`
  (`verdict != "AVOID"`). These get their own section at the top of the filter sheet,
  as five switches with plain-English labels.
- **Search** — free text. **Two gears, and the gear is explicit:**
  - *Gear 1 (default)*: matches `institution`, `programme`, `city`, `country` only. Fast,
    runs on the ~500KB index (§9), matches what he means when he types "sonology" or
    "Vienna". Diacritic- and case-insensitive.
  - *Gear 2*: a checkbox under the search field, **"also search inside the long text"**.
    Matches the prose fields. It is opt-in because (a) it needs the full 7.1MB payload,
    which on his connection is a decision, and (b) results become confusing — searching
    "free" would otherwise hit 800 records where the word appears inside a sentence about
    fees not being free. When on, results show the **matched sentence** with the term
    highlighted, and that sentence replaces the card's usual quoted sentence. This is
    genuinely powerful: "portfolio 20 minutes", "no GRE", "waiver Africa" are queries no
    spreadsheet filter can answer.

**The gate trap.** Because `gate` is empty for all 749 "Other track" records, applying a
gate filter globally deletes them silently. Rule: **any gate filter is automatically
scoped to Door 1 + Door 3**, and the filter sheet says so under the control: *"Gate is
only recorded for your two doors."* If he has "Other track" selected and picks a gate,
the UI states the conflict rather than returning 0.

### 4.2 The filter sheet

Reached from the sticky bar on The List. A bottom sheet covering ~85% of the screen,
scrollable, with a persistent footer showing `Show 108 results` and `Clear all`. Order,
top to bottom — most decisive first:

1. The five switches (degree / no audition / language you read / not ruled out / checked only)
2. Money — `costBand` chips + `funding`
3. What it is — `door`, then `track`, then `subtype`
4. Where — `region` first (10 values, fits on a screen), `country` behind a search field
   (88 values, must not be a wall of checkboxes)
5. Language — top 6 by count, then "more"
6. Gate, `publicPrivate`, `chance` — collapsed under "More filters", because `chance` is
   unreliable (§0) and should not be an inviting control

Active filters render as removable chips in the sticky bar, horizontally scrollable, with
the count. **Never more than one row of chips**; overflow becomes `+3`.

### 4.3 Search entry

Tab 2 of the bottom bar. Opening it puts the cursor in the field with the keyboard up,
shows recent searches and the eight saved searches, and nothing else. Not a filter panel
with a search box wedged in.

### 4.4 Filter state lives in the URL

Every view is addressable and every filter is in the query string. Short keys, comma
lists, `!` for negation:

```
/list?q=sonology&door=1&cost=free,u15&lang=ok&deg=1&aud=0&v=!avoid&sort=verdict&n=40
/p/0
/me
/portfolio
/compare?ids=0,743,1288
/walk?step=3&door=13
```

Key map: `q` search · `fq=1` full-text gear · `c` country · `r` region · `door` (1|3|o) ·
`t` track · `st` subtype · `lv` level · `ch` chance · `cost` · `lang` · `pp` · `fund` ·
`g` gate · `v` verdict · `deg`/`aud`/`langok`/`chk`/`ruled` booleans · `sort` · `n` page size.

Rules:
- The URL is **written on every filter change** via `history.replaceState`, so back does
  not walk through 30 filter states; a **new** history entry is pushed only on view
  change and on opening a record. Back from a record returns to the list *at the same
  scroll position*.
- The URL is the share format. He will WhatsApp himself a link. `Copy link` is in the
  overflow of every view and copies the full URL with filters.
- Unknown or stale params are ignored, not errored.
- His personal state is **not** in the URL (§5) — a shared link must never leak his notes.

### 4.5 How someone with no plan narrows down

The intended path, end to end, with the real numbers:

1. Opens the app. Reads one sentence and a funnel. Learns, in ten seconds, that 1,839 is
   not the number that matters and 406 of them aren't even degrees.
2. Taps **Walk it with me**. Six questions, phrased as his life. Ends at **108**.
3. Reads The List. Cards are ordered so the 11 WORTH IT are first, each with one sentence
   of a human's reasoning. He stars four in about two minutes.
4. Taps one. Reads the record page — the verdict, the verbatim entry sentence, the
   portfolio brief. Sets status `shortlist` and types "instrument building, is this
   actually music?" into the note.
5. Two of the 11 are the same consortium (§4.6); the app has already merged them, so he
   is not comparing DIGICREA with DIGICREA.
6. Goes back, drops the `notRuledOut` switch to see what was killed and why — this is
   where the 208 AVOID reasons pay for themselves; he learns the shape of the traps
   (needs a music bachelor / audition / no funding for non-EU / not a real degree).
7. Ends the session with 6 in `My list`.
8. Opens **What I have to make**. Gets one brief covering all six, two emails to send this
   week, one IELTS booking, one longest-portfolio target.
9. Exports it as Markdown, which is the format he already reads.

Steps 8 and 9 are the ones the spreadsheet cannot reach. Steps 1–2 are the ones it
cannot start.

### 4.6 Duplicates

57 near-duplicate groups covering 120 records. Cluster at build time on
`normalise(institution) + normalise(programme)[:25]`, plus a manual override list for the
known consortia (DIGICREA, ReSound, Sonology, ICMP). In The List, a cluster renders as
**one card** with a footer: *"4 records for this programme, from different searches —
the fullest is shown."* On the record page, a section **"Other records for this
programme"** lists the siblings with a diff of which fields each one uniquely holds, so
nothing is lost. Shortlisting affects the cluster, not the record.

I am not fully confident the string-normalisation clustering is precise enough — it will
over-merge some genuinely distinct programmes at the same institution. **Recommendation:
merge only when institution *and* the first 25 characters of programme match, review the
57 groups by hand once (it is 57), and hard-code the result as a `clusters.json`.** One
hour of human review beats a clever heuristic here.

---

## 5. Personal state

### 5.1 The model

Per programme (keyed by cluster id, not record id):

```
status : none | shortlist | emailed | applying | applied | no
note   : free text, unlimited, his words
events : [{ type, date, text }]   e.g. emailed / replied / deadline-confirmed
starred: bool  (a lightweight pre-status, one tap from a card)
```

Plus global state: saved searches (name + query string), last view, theme.

Five statuses, not ten. `emailed` exists as its own status because the brief names it and
because it is the state with a *clock* — the landing screen surfaces "emailed 11 days ago,
no reply" without him asking. That is the app doing work while he is not looking, which a
spreadsheet cannot.

### 5.2 Where it lives

**`localStorage`, under one key, as one JSON object.** No account, no backend, no login.

Reasons: he is one person on one phone; a backend means a signup form, a password he'll
lose, a privacy question about his applications, and a server that outlives the project's
funding. localStorage on iOS Safari is evicted after ~7 days of no use, and that is the
real risk — so:

- **Auto-export nag.** If the state has changed since the last export and the last export
  was over 7 days ago, the landing screen shows a single amber line: *"You have 6 saved
  and 4 notes, only on this phone. Back them up →"*. Not a modal. Not every session.
- **Every write also mirrors to `IndexedDB`**, which iOS evicts less aggressively. On
  load, take whichever store is newer.
- The state object carries a `version` and a `savedAt`, and imports are merged by
  `savedAt` per programme, never wholesale-replaced. He will end up with the app open on
  a laptop and a phone; last-write-wins per record is correct and predictable.

### 5.3 Export — three formats, because he already told us what he likes

Reached from `My list` and from the overflow menu.

1. **`my-shortlist.md`** — a written report. Programme, institution, his status, his note,
   the verdict and its reason in full, the portfolio brief in full, the deadline with its
   confidence caveat, the URL. Ordered by status. **This is the primary export**, because
   Markdown reports are the artefact he actually used. It should read like
   `results/SHORTLIST.md` and slot into the same folder.
2. **`my-shortlist.csv`** — one row per programme, his columns (status, note, dates) plus
   the identity and decision columns. So it lands in Excel next to the workbooks he
   already has.
3. **`state.json`** — the exact state object, for re-import. The import control accepts a
   dropped file or pasted JSON.

All three generate client-side. If the app is ever published as an Artifact, note that a
sandboxed viewer blocks `<a download>` — so every export must **also** render into a
selectable, copyable `<textarea>` with a "Copy" button as the primary path, with the
download as a convenience. Copy-paste is the mechanism that always works on a phone.

**Nothing about his state goes into the URL** — shared links carry filters only.

---

## 6. Empty and edge states

Written as copy, because copy is the design here.

### 6.1 No results

Never a shrug. Always name the constraint that is doing the killing and offer to drop it:

> **Nothing matches all seven of those.**
> The one doing the damage is **cost under €1,500** — dropping it gives you 39.
> Dropping **"checked only"** instead gives you 24.
> **[ Drop the cost limit ]  [ Drop "checked only" ]  [ Start over ]**

Computed by re-running the query with each active filter removed in turn and showing the
two that recover the most. Cheap on 1,839 records, and it is the difference between a
dead end and a decision.

### 6.2 No verdict (1,523 records — the common case)

Covered in §3.5. The rule that matters: **greyscale, thin, and the words "Not checked"
come first.** It must be structurally impossible to read it as a fourth verdict.

The List reinforces it: unverified cards are thinner (no quoted sentence when there is no
good field) and carry no coloured chip at all. Absence of colour means absence of
checking. The eye learns this in about twenty cards.

### 6.3 No deadline, or a deadline that is prose

`deadline` is prose in 100% of cases and stale in 791 of them. Four states, each with its
own banner above the value:

| condition | banner | colour |
|---|---|---|
| contains `PRIOR CYCLE` (791) | **"This is last year's date. The 2027 round is not published yet."** | amber |
| starts `UNVERIFIED` (406) | **"Not checked. Open their page."** | grey, dotted |
| `NOT PUBLISHED` (28) | **"They publish no deadline."** | red |
| empty (52) | field absent; appears in "Not published" list | — |
| contains a year (367) | ✔ **"Published date"** + the year extracted for grouping | green |

The value itself is **always shown verbatim, in mono, never reformatted.** The prose
carries conditions ("upload rounds 24 Nov, 12 Jan…", "non-EEA applicants earlier") that a
parsed date would destroy.

**There is no calendar view and no countdown.** With 367 of 1,839 carrying a real year,
a calendar would be 80% empty and would imply the empty slots have no deadline. What
exists instead is a group-by on `My list`: *Published date · Last year's date · Not
checked · No deadline published*. That is honest and it is enough. **If he later asks for
a calendar, the right answer is to hand-confirm the ~15 dates on his shortlist and build
the calendar from those** — a small human step, not a parser.

### 6.4 A record that is not a degree (406 records)

`level` is one of `Not a degree` (186), `Funding scheme` (148), `Aggregate entry` (31),
`Unclear` (28), `Master di I livello (60 CFU)` (11), `Bachelor / first cycle` (2).

- **Not a degree** — a red banner at the very top of the record page, above the
  programme name: **"This is not a master's degree."** Then, when `qualification` or
  `accreditation` explains what it actually is, that text immediately below. He is
  applying for a visa; a certificate is not a route. Card in The List gets the same
  banner as its first line.
- **Funding scheme** — a different card shape entirely (no gate, no portfolio, no
  duration), a banner **"This is money, not a course"**, and a link into `/money`.
  Excluded from The List by default via the `isDegree` switch, which is **on by default**.
- **Unclear** (28) — amber: **"Nobody could confirm whether this awards a degree.
  Check the national register before you spend a day on it."**
- **Master di I livello** — amber, with the specific explanation, since it is the exact
  Italian trap the reports document.

### 6.5 Other edges

- **No URL** (3 records) — "No official page was found for this. Treat it as a lead."
- **Multiple URLs** (511) — list them, host as label.
- **Empty shortlist** — §1.
- **Offline** — the index is cached by a service worker; the list, `My list` and
  `What I have to make` work offline. Record detail shards are cached as visited, and a
  record he has shortlisted is prefetched. Offline record he hasn't opened: "Not
  downloaded. You're offline."
- **State import conflict** — merged per record by `savedAt`, with a summary: "12
  programmes merged, 2 notes kept from this device."
- **A field longer than 2,000 chars** (`scholarshipDetail` max 4,000) — clamp to 6 lines
  with "Read all"; never truncate with an ellipsis and no way back.

---

## 7. Visual direction

**The thesis: this is a document with controls, not a dashboard.** He rejected a console
and went back to documents. So the app should look like the documents worked — and the
interactive parts should look like small, plain, unfussy instruments attached to a
document.

### Typography

- **Prose: a serif.** All the long fields — `verdictWhy`, `acceptsNonMusic`, `portfolio`,
  `entry` quotes, `recommendation`, `study` — set in a serif at 16px/1.55, measure capped
  at ~34rem. This is the single strongest signal that the app is for reading. Excel is
  sans-serif and 11px; the moment the important text is serif and 16px, the app is
  visibly doing a different job.
  *Recommendation: a system serif stack — `Iowan Old Style, Charter, Georgia, 'Times New
  Roman', serif`. No webfonts. He is on mobile data, and a 300KB font before first
  paint is a worse decision than a slightly less distinctive page.*
- **Chrome and metadata: system sans.** `-apple-system, Segoe UI, Roboto, sans-serif` at
  13–15px.
- **Numbers, dates, counts, deadlines: tabular mono.** Deadlines especially — mono says
  "this is a raw string I have not touched", which is exactly true.
- Programme titles: serif, 17px in lists, 22px on the record page. Institution names in
  sans so the two never blur.
- Nothing below 12px. Nothing in all-caps except section labels, and those get
  0.08em letterspacing at 11px.

### Spacing

- 8px base. Section gaps 32px, field gaps 20px, line-level 8px.
- **20px page gutters on mobile.** Not 12. Prose needs air more than it needs three extra
  characters per line.
- Sections separated by a 1px hairline at 12% ink, not by cards and shadows. **One
  elevation level in the whole app** (the bottom sheet). Everything else is flat on the
  page ground. Shadows are what made the rejected console feel like a demo.
- Vertical rhythm consistent enough that the record page can be read at speed by thumb.

### Colour semantics

The workbooks already trained him: **green/amber/red = worth it / conditional / avoid.**
Keep that exactly. And then the hard rule:

> **Only one traffic-light system may appear on any surface, and it belongs to `verdict`.**

Because `gate` also has a green/amber/red logic in the workbooks, and putting both on a
card produces two green things meaning different things — which is how a colour system
dies. Resolution:

- `verdict` — **owns green / amber / red.** Chip with an icon (✔ / ! / ✕) so it survives
  colour-blindness and greyscale printing.
- `gate` — **neutral by default**, rendered as a labelled chip in ink-2 with a small
  glyph. It goes red for exactly one value: `AUDITION — hardest for you`, which gets a
  red outline chip reading **"Live audition"**. 57 records. That is the only borrowed use
  of red and it earns it.
- `costBand` — a **cool neutral ramp**, not the traffic light. Free/Under €1.5k get a
  faint teal tint; over €15k gets no tint and mono text. Money is a scale, not a verdict.
- `chance` — **no colour at all.** 76 "Strong" records are AVOID. Giving Strong a green
  chip would be actively misleading. It renders as small muted text in the provenance
  section only.
- `level: "Not a degree"` — red banner. This is the second earned use of red, and it is
  the same meaning as AVOID (do not spend time here), so it does not dilute.
- `UNVERIFIED` — **amber, dotted, and always accompanied by a word.** Never colour alone.
- Accent: one, a deep teal, used for links, the active tab, and the primary button. Nothing
  else is coloured.

Six colours total: ink, muted, teal accent, green, amber, red. Anything needing a seventh
is a design failure.

### Dark mode

Follows the system, with a manual override in the top bar (three states: system / light /
dark, persisted). Define the full light palette on `:root`; redefine tokens under both
`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and
`:root[data-theme="dark"]`, so the toggle wins in both directions. `body` gets an explicit
token background — never transparent.

Dark values: near-black ground `#0D1214` (not `#000`, which makes serif text buzz),
surface `#151C1E`, ink `#E8EFF0`. Verdict colours desaturate and lighten: green `#63C48B`,
amber `#D9A550`, red `#E77A72`, each on a ~10% tinted background. Contrast ≥ 4.5:1 for
body, ≥ 3:1 for chips.

He will read this in bed. Dark mode is not a nice-to-have.

### What makes it feel like a tool and not a dashboard demo

Concretely, the things I am forbidding:

- **No animated counters, no bars, no donuts, no charts of any kind.** The funnel is
  numbers in a column. The rejected console's failure mode was looking impressive.
- **No hero section, no gradient, no illustration, no logo, no product name in the UI.**
  The top bar says the name of the current view.
- **No skeleton shimmer.** Index loads in under 300ms from cache; below that, show
  nothing rather than a fake page.
- **No transitions over 120ms**, and none at all on filter application — results change
  instantly, like a spreadsheet's autofilter. Perceived speed is the entire feeling of
  "tool".
- **No modals** except the filter sheet and the export sheet. No onboarding carousel, no
  tooltips-with-dots tour, no "🎉 you saved your first programme".
- **No emoji anywhere in the UI.**
- **The count is always visible.** He should never be unsure how many things he is
  looking at.
- **Every number on screen is clickable to its underlying set.** If the app says 108, one
  tap shows the 108. Numbers that cannot be drilled into are decoration.
- **Text is selectable everywhere.** He will copy an entry requirement into an email.
- Tap targets ≥ 44px. One-handed reachability: primary actions in the bottom third.

---

## 8. Explicit non-goals

Things I am deliberately not building, and why.

1. **A sortable, multi-column data table.** `MASTER-all-opportunities.xlsx` exists, has 20
   tabs and filter buttons, and he likes it. Rebuilding it in a webview on a 390px screen
   produces something strictly worse. **The app links to the workbooks instead.**
2. **A map.** 88 countries, and geography is his *last* constraint — visa, money and
   language decide long before "where is it pretty". A map would be the most expensive
   screen to build and the least used.
3. **Charts, dashboards, "insights", a stats page.** No decision in his list is improved
   by a pie chart of programmes per country.
4. **A deadline calendar, countdown timers, or reminders.** The data cannot support it
   honestly (§6.3): 791 dates are last year's and 406 are unverified. A calendar would
   manufacture false precision about the one thing where being wrong is fatal. *If he
   wants this, hand-confirm the ~15 dates on his shortlist first.*
5. **An account, a login, or any server.** State lives on the device and exports to files
   (§5.2). One user, one phone, no privacy surface, no thing to keep paying for.
6. **A ranking score / "match %".** Any composite number would be built on `chance`, which
   is wrong 76 times out of 149 on the records where we can check it. The honest ranking
   is *verdict first, then everything else*, and the reasons are written out.
7. **An AI chat over the data.** He can already ask Claude, with the whole repository, in
   the place he already does it. An in-app chatbox would be a worse copy that hallucinates
   deadlines.
8. **Editing or adding records in the app.** The data comes from a reproducible pipeline
   (`.masters-search/export_app_data.py`). A hand-edited record in localStorage would
   silently diverge from the workbooks and the reports. His *notes* are editable; the
   *facts* are not.
9. **Arabic/French UI localisation and RTL at v1.** He reads English and French fluently
   and **the data itself is entirely English** — a French shell around English paragraphs
   is worse than an English shell. *If anything, translate the six question prompts in
   `Walk it with me` to French. That is the whole localisation budget.* I am genuinely
   unsure here; if he asks for French, do the chrome only and leave the data alone.
10. **Comparison of more than four programmes.** Unreadable on a phone. Use the workbook.
11. **Any claim of freshness.** The app must never say "updated daily" or show a live
    timestamp. The data is a snapshot dated `2026-08`, that date is in the footer of every
    view, and every record links to the official page as the authority.
12. **Notifications / push / email digests.** Requires a server, and the only recurring
    event worth a nudge — "you emailed them 11 days ago" — is already on the landing
    screen where he will see it.

---

## 9. Implementation constraints the IA depends on

Not application code, but these decisions are load-bearing on the design above and should
be settled before build.

- **Split the payload.** 7.1 MB on Tunisian mobile data is not acceptable for a landing
  screen. Generate, from the same pipeline:
  - `index.json` — 1,839 × ~16 short fields (`id, cluster, country, region, city,
    institution, programme, door, track, subtype, level, chance, costBand, language,
    languageOk, funding, gate, verdict`) + the one card sentence, pre-truncated to 220
    chars. Estimated ~450–600 KB, ~150 KB gzipped. **This alone powers the landing
    screen, the walk, the list, the filters and gear-1 search.**
  - `detail/NNN.json` shards (~200 records each, ~800 KB raw) fetched on demand for the
    record page, and prefetched for anything shortlisted.
  - `fulltext.json` fetched only when he turns on gear-2 search, behind an explicit
    "this downloads 7 MB" note.
  - `clusters.json` — the hand-reviewed duplicate groups (§4.6).
- **Everything client-side, static hosting.** No build-time server.
- **Service worker** caching index + visited shards + shortlisted shards, so the app works
  on a train.
- **`meta.json` is the source of facet counts**, but counts *under active filters* are
  computed client-side from the index — which is fast on 1,839 records and is what makes
  the "dropping this gives you 39" copy in §6.1 possible.
- Accessibility: real `<button>`/`<a>`, focus visible, `aria-live` on the result count,
  every colour paired with a word or glyph.

---

## 10. Where I am unsure

Stated plainly, with a recommendation anyway.

1. **Whether he will use `Walk it with me` more than once.** It is a first-session tool.
   *Recommendation: build it, put it on the landing screen for as long as his shortlist is
   empty, and demote it to the overflow menu once he has three saved.*
2. **Whether `Money` (`/money`) earns a route.** *Recommendation: build it, keep it out of
   the main nav, link it from programme pages.*
3. **Whether the serif is right for a 24-year-old on a phone.** It might read as
   old-fashioned. *Recommendation: ship serif. The content is long-form reasoning and the
   entire product thesis is "read this". If it feels wrong in his hands, the change is one
   token.*
4. **Duplicate clustering precision.** *Recommendation: hand-review the 57 groups once and
   freeze the result (§4.6). Do not ship a live heuristic.*
5. **Whether `AVOID` records should be hidden by default in The List.** Hiding them makes
   the list cleaner; showing them is how he learns the traps. *Recommendation: show them,
   sorted last, at 60% opacity. Add one switch to hide them. Default off.*
6. **French UI.** *Recommendation: English shell, French only for the six walk questions,
   and only if he asks.*

---

*Data snapshot: `2026-08` · 1,839 records · 316 verified · Written against
`app/public/data/programmes.json` and `app/public/data/meta.json`.*
