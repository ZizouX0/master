# WORKFLOW — what he does with this for fifteen months

**Scope:** the workflow, not the visuals. Another agent owns type, colour and spacing.
**Today in this document is 14 August 2026.** Target intake September 2027. 56 weeks.

**How this was tested.** `npm run build`, `dist/` served over HTTP at the app's real base path
(`/master/` — serving `dist/` at root 404s every asset, worth knowing), driven with
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome` headless through CDP with
`Emulation.setDeviceMetricsOverride` at 390×844 (`--window-size` is clamped to 500px on this box).
Every tap count and pixel height below was measured, not estimated. Scripts under
`app/verify/cdp.mjs`.

Measured page heights at 390px, in phone screens of scroll:

| Screen | height | screens |
|---|---:|---:|
| Start (`#/`) | 1,988px | 2.4 |
| Programmes, unfiltered (`#/list`) | 11,234px | 13.3 |
| One record (`#/p/105`) | 5,643px | 6.7 |
| **Money (`#/money`)** | **26,437px** | **31.3** |
| Not a degree (`#/rejects`) | 1,751px | 2.1 |
| My list, empty (`#/me`) | 986px | 1.2 |

---

## Part 1 — the five journeys, walked

### J1. "I have twenty minutes. What should I do this week?"

**Possible: no. Taps to an answer: unbounded — there is no path.**

Tap 0, the app opens on Start. I searched the rendered text of that screen for every word that
could carry time:

```
week:false  deadline:false  October:false  December:false
closes:false  next:false   2026:true (only in the snapshot stamp)
```

Start is a seven-row funnel from 355 records to 14, three verdict counters, and three links. It is
an argument about **data quality** — *"everything verified is expensive, everything affordable was
unverified"* — which is true, which was worth making once in March, and which he has now read. It
answers *what exists*. He is asking *what do I do*.

**And the data contains the correct answer to this exact question, today.** Funding scheme
*Swiss Government Excellence Scholarship — ARTS (ESKAS)* carries, in its `notes` field:

> `*** URGENT: applications open 20 AUGUST 2026 and country deadlines can be as early as
> September–November 2026 […] Email sgs@sbfi.admin.ch and the Swiss Embassy in Tunis THIS WEEK to
> ask whether Tunisia is on the 2027-28 ARTS list. *** CHF 2,450/month is the highest monthly
> stipend on this entire list.`

That is **six days from today**, it is the highest-value single action in the corpus, and the
research already wrote the instruction. To reach it: Money tab (1 tap) → **card 35 of 120** down a
**31-screen scroll** with no date, no sort and no urgency marker → tap the card (2 taps) → scroll
its detail to `notes`. The string `20 August` does not appear anywhere on the Money list screen.
He gets there only if he was already going to read all 120 schemes this week.

**Breaks at:** tap 0. The home screen has no concept of *now*.

---

### J2. "It's 3 January. What closes in the next six weeks, and what do I still owe each one?"

**Possible: no.**

There is no date-ordered view anywhere in the app. The list's sort control offers exactly three
options — `Verdict`, `Cheapest`, `Country`. The filter panel has facets for cost band, funding,
gate, region, country, language, verdict and chance. **None for time.** No "closing soon", no
calendar, no month grouping.

The nearest thing is My list, which renders a deadline badge per tracked record. Three problems:

1. It only shows programmes he already starred, so it answers "what did I star" not "what closes".
2. It groups by **status** and sorts by **last edited**, never by date.
3. The badges are wrong on exactly the records that matter — see §Answer 3.

Six weeks from 3 January 2027 spans **Türkiye Bursları arts (10 Jan – 20 Feb)**, **Campus France
masters (~15 Jan)** and **FHNW Basel's close (15 Feb)**. I ran the app's own `parseDeadline` over
all 398 programme records and all 120 funding schemes. It yields **12 dated deadlines in total**,
and **not one of them is any of those three**:

```
PROGRAMMES  prior-cycle 196 · unverified 133 · none 29 · rolling 13 · not-applicable 12 · dated 9 · recurring 5
FUNDING     prior-cycle 62 · unverified 52 · rolling 2 · none 1 · dated 3
```

The nine dated programme deadlines are Lucerne, Iceland, Babelsberg ×2, Detmold ×2, Düsseldorf ×2,
SKH Stockholm — plus one that is not a deadline at all (`2027-09-21`, scraped out of a **start**
date). The three dated funding deadlines are DAAD, NL Scholarship, Swedish Institute.

**Breaks at:** the premise. The date machinery is well built and pointed at a field that does not
contain the campaign's dates.

---

### J3. "I have two finished tracks. Which programmes does that unlock, and what must I submit to each?"

**Possible: partially. ~4 taps per programme, no comparison, no unlock logic.**

Portfolio specs are prose in `detail.json` and reachable only inside a record, roughly 60% down a
6.7-screen page under **WHAT YOU MUST SUBMIT (PORTFOLIO)**. The prose is excellent:

- **HfMT Köln** — *"TWO AUDIO FILES (WAV, AIFF or MP3) PRODUCED WITHIN THE LAST TWO YEARS, plus
  DOCUMENTATION OF WORKING METHODS via photos, videos, software screenshots or sheet music."*
- **FHNW Basel** — *"Es ist ein Soundfile einer selbständig produzierten Aufnahme/Mischung …
  mit einer kurzen Erläuterung der Produktionsweise (PDF) einzureichen."* One file plus a method PDF.
- **İTÜ MIAM** — *"Three mixes of recordings made by the candidate are required. **Each mix must
  include at least one track from an acoustic source, recorded with a microphone.**"*

Three different asks. Nothing in the app puts them side by side, and nothing turns "I have two
tracks" into a set. Search over prose works — `two audio files` → 7 results, `acoustic source` → 11
— but that is him guessing the institution's phrasing, and it returns records, not requirements.

Measured: to compare those three specs is 3 × (type a query, tap the result, scroll ~4 screens,
tap back) = **12 taps plus ~14 scroll flicks**, and the comparison happens in his memory.

Across the whole corpus **42 of 355 primary records name a countable artefact** (one/two/three
tracks, mixes, works). That is more than enough to build a real artefact spine — the structure is
in the data, it is simply never used as structure.

**Breaks at:** there is no object called "a track". Requirements are trapped inside programmes, so
they cannot be de-duplicated across programmes, which is the entire point of the question.

---

### J4. "Can I afford Basel, all in, with a scholarship I could actually win?"

**Possible: barely. ~5 taps and ~25 scroll flicks, and he does the join himself.**

This one has a worse problem than the join. **Searching `Basel` does not return the Basel
programme.**

The default filter state is `audition: ['suspected', 'none-found']` — records flagged as needing a
live audition are hidden. FHNW Basel *MA Musikalische Performance — Studienrichtung Producing*
(id 15) carries `needsAudition: true`. So:

```
#/list?q=Basel  →  "7 programmes"   (Brussels, Lyon, a Spanish certificate, …)
                →  "7 shown. 348 more match and are hidden because they need a live audition.
                    Show them →"
```

`DOOR3.md` calls this programme **"the strongest single target"** and says of it: *"No ear training,
no compulsory audition, round two online on request."* Its own `audition` field in the app says
*"TWO ROUNDS, AND THE DECISIVE PART IS A PORTFOLIO HEARING, NOT AN AUDITION."* The default filter
hides it, and the caption blames a barrier the record itself denies. (The count is also wrong: 348
is the corpus-wide audition count, not the number of hidden *Basel* matches.)

Past that, the money question. The record gives the cost honestly and precisely — *CHF 1,250/semester
for a Tunisian = CHF 2,500/yr*, plus *CHF 200 application fee*, plus *living CHF 20,000–24,000/yr*,
*"two-year total including living: roughly CHF 45,000–53,000."* Then it says:

> `FUNDING FOR THIS PROGRAMME: UNVERIFIED.`

and offers one link: *"Money you bring with you is in the 120 funding schemes."* That link goes to
the top of a 31-screen alphabetical list with **no country filter**. Five schemes have
`country: "Switzerland"`; two of those five are internal funds at *other* schools (HKB Bern, ZHdK
Zurich) and cannot pay for Basel. The one that matters is ESKAS — CHF 2,450/month, and its own text
says **"TUNISIA'S INCLUSION IN THE ARTS LIST IS UNVERIFIED — the 2027-28 country-specific list is
published from August 2026."**

So the true answer is *"yes, CHF 2,500/yr tuition is affordable, and the one scholarship that would
cover living costs opens in six days and we don't yet know if you're eligible — send that email."*
Every fragment of that sentence is in the app. The app never assembles it.

**Breaks at:** two datasets that never reference each other, joined by a country string with 65
distinct spellings.

---

### J5. "I emailed Köln three weeks ago and heard nothing. What now?"

**Possible: no.**

I drove it: open record 105 → set status **Emailed them** → type a next action → open My list.
What renders:

```
EMAILED THEM — 1
Waiting on a reply. This is the status with a clock on it.
  Production (Master of Music) …  HfMT Köln · Cologne · Germany
  ✔ WORTH IT   Free
  DEADLINE — NO CONFIRMED DATE
  NEXT ACTION [               ]   MY NOTE [        ]
  edited 14 August 2026
```

*"the status with a clock on it"* — and there is no clock. The `Entry` type is
`{ key, status, note, nextAction, updated }`. `updated` is the timestamp of the **last edit to
anything**, so fixing a typo in the note on day 20 resets it. Nothing records **when he sent the
email**, nothing computes elapsed time, nothing surfaces a chase date, nothing sorts the waiting
bucket by age. The screen contains the word "clock" and none of the mechanism.

And the deadline line is wrong in the most costly direction. Köln renders **NO CONFIRMED DATE**
while its own `correction` field, three paragraphs down the same record, reads:

> *"The record gives no deadline; the operative one for a Tunisian is the **non-EU deadline of
> 2 March** for winter-semester entry."*

and its `verdictWhy` says *"treat the 2 March non-EU deadline as the real date."* A screen that
says "no confirmed date" about a programme whose date the research confirmed is worse than silence.

**Breaks at:** the tracker records a *state* but not a *time*, so it can never tell him anything
is overdue — which is the only reason to keep a tracker for fifteen months.

---

### Journey scorecard

| | Possible? | Taps to answer | Breaks at |
|---|---|---:|---|
| J1 what this week | **No** | ∞ | Home screen has no concept of *now* |
| J2 what closes in six weeks | **No** | ∞ | No time sort/filter; 12 parsed dates, none of the 12 real ones |
| J3 two tracks → which gates | Partial | 12 + 14 flicks | No artefact object; specs trapped per-programme |
| J4 afford Basel | Barely | 5 + 25 flicks | Default filter hides the target; money never joins |
| J5 chasing an email | **No** | ∞ | No sent-date; `updated` is last-edit |

**Worst: J2.** Not because it is hardest, but because from 1 October 2026 it is the *only* question,
and the app answers it with 196 records reading "prior cycle — confirm the 2027 date."

---

## Part 2 — the seven answers

### 1. What is the app's actual job?

> **It is a campaign console for one applicant against roughly a dozen dated gates — it tells him
> what he owes, to whom, by when; the 398-record corpus is a lookup table it consults, not a
> catalogue it presents.**

`DESIGN-CRITIQUE.md` said *"the browsing features are decoration, the tracker is the product."* That
was right and it did not go far enough: what got built is a **browser with a tracker attached** —
four of the five bottom tabs are corpus views, and the tracker is a passive ledger with no time in
it. It should be a **campaign console with a corpus attached**, where the corpus is reachable by
search and by drill-down from a commitment he has already made, and never by browsing.

The test: **if a screen's content is the same on 14 August 2026 and on 3 January 2027, it is not a
campaign screen.** Today four of five tabs pass that test — meaning they fail this one. Only My
list changes, and only because he changed it.

### 2. The workflow model

The current model is a flat 7-value enum on a select: `none / shortlist / emailed / applying /
applied / rejected / ruled-out`. It has no transitions, no time, no obligations, and it conflates
*what he decided* with *what the calendar is doing*. Replace it with **two orthogonal axes**, because
they move for different reasons and one of them is not his to move.

**Axis A — his commitment** (he moves this):

```
   lead ──────► candidate ──────► committed ──────► submitted ──────► resolved
    │              │                  │                 │              (offer /
    │              │                  │                 │           rejected / declined)
    └──► ruled out ◄──────────────────┴─────────────────┘
              (always with a written reason; never deleted)
```

**Axis B — the gate's own state** (the calendar moves this, he cannot):

```
   unknown ──► dated ──► opens-in-N ──► OPEN NOW ──► closed
      ▲                                                │
      └──── "confirm this date" is an action he owns ──┘
```

**Axis C — what is blocking**, a small set attached to a candidate, each with an owner:

| blocker | owner | carries |
|---|---|---|
| `question-out` | **them** | sent date, address, the question, chase-by date |
| `artefact` | him | which artefacts, and their state (see §4) |
| `document` | him | IELTS, transcript, legalised translation, ISEE |
| `money` | either | which scheme, and its own gate state |
| `date-unknown` | him | one email settles it |

`emailed` today is a *status*, which is why it dead-ends. It is a **blocker with an owner and a
clock**, and a programme can carry several at once.

**What must happen when a record moves:**

| transition | the app must |
|---|---|
| lead → candidate | pull the gate's date into the calendar; if the date is unknown, **create a `date-unknown` blocker**; explode the portfolio spec into artefact requirements and match them against artefacts he already has |
| candidate → committed | lock the full submission checklist; compute the **latest safe start date** for every artefact still missing, working backwards from the close; warn if any is already in the past |
| any → `question-out` | store the **send date** (not last-edited), set a chase date at +14 days, and put the chase on the week view |
| reply received | close the blocker, capture the answer verbatim, and if the answer contains a date, **offer** to confirm the gate date — never write it silently |
| gate → OPEN NOW | promote to the top of the week view with the outstanding checklist, every day it stays open |
| gate → closed with nothing submitted | mark it **missed**, keep it, and state which blocker was open when it closed — that is the postmortem that stops the second miss |
| any → ruled out | require a reason; keep it searchable so he does not re-find it in month nine |

### 3. Time as a first-class dimension, without fabricating one

Two rules, and they are absolute:

> **R1. A date is only a date if a human confirmed it for the 2027 cycle. Everything else is a
> question, not a date.**
> **R2. A question is a first-class object with an owner and a due date. It is never a blank cell.**

**The 190 `PRIOR CYCLE` records** (measured: 196 programmes + 62 funding = **258 records**) must
never be parsed, sorted, counted or displayed as dates. The current `parseDeadline` already refuses
this correctly and should keep doing so. But refusing is only half the job. A prior-cycle string is
**evidence about when the window is likely to fall** — *"2026 call closed 12 March 2026; 2027/28 call
expected ~Jan 2027"* — so render it as:

```
  ⟳  Expected around January 2027  ·  last cycle closed 12 March 2026
     NOT A DATE — one email confirms it       [ Ask them ]  [ Remind me 1 Nov ]
```

It sorts in a separate **"expected"** band below all confirmed dates, never interleaved. It counts
in a separate total. It is never rendered in the same visual channel as a confirmed date.

**Where the ~12 real dates come from — and this is the crux.** They are *not* in `deadline`. I ran
the shipped parser across the whole corpus: 12 dated results, none of them the campaign's dates.
FHNW Basel's `deadline` field says, verbatim, **"NOT a prior cycle — the page already advertises the
start date 13.9.2027, so … the window is 15 December 2026 – 15 February 2027"** — and the app renders
it **"PRIOR CYCLE — CONFIRM THE 2027 DATE"**, because the first `D-Month-Year` in the string is
"15 December 2026" and 2026 < 2027. The app contradicts its own source on the single most important
window in the campaign.

The fix is not a better parser. **Twelve dates is a hand-written file**, `calendar.json`, one entry
per gate, each carrying its own provenance, and it is the only place in the product a confirmed
date may originate:

```json
{ "id": "campus-france-tn-open",
  "label": "Campus France Tunisie opens",
  "date": "2026-10-01",
  "precision": "day",
  "confirmedBy": "human", "confirmedOn": "2026-08-13",
  "source": "results/DOOR3.md · Campus France Tunisie",
  "gates": ["fr:*"],
  "note": "Binding for every French option — 28 programmes." }
```

`precision` is `day | week | month | window`, and the UI renders each differently:
`1 December 2026` · `mid-January 2027` · `January 2027` · `15 Dec – 15 Feb`. Nothing may be promoted
to `precision: day` without `confirmedBy: human`. A parsed date from `deadline` may **suggest** a
calendar entry for him to confirm; it may never create one. And an entry can be marked
`supersedes: "deadline-field"` so that when the 2027 dates start publishing from October, the
confirmed date visibly overrides the corpus rather than fighting it.

Twelve to maybe forty rows, hand-maintained, versus 258 strings that cannot be trusted. That
asymmetry is the whole design.

### 4. The portfolio as the spine

**Yes — invert.** Every gate in this campaign reduces to *make a thing, then send it somewhere by a
date*. Programmes are the **consumers** of artefacts; artefacts are the scarce resource, and they are
scarce because they take months and he has none. Organising by programme means the same track is
invisible in six places; organising by artefact means one act of work visibly unlocks six gates.

The corpus supports this: **42 of 355 primary records name a countable artefact**, and 6 explicitly
require an acoustically-miked source.

```
         ARTEFACTS  (what he makes — the scarce things)
    ┌──────────────────────────────────────────────────────────────┐
    │ ▣ TRACK 1  "in the box"           done       Jun 2026        │
    │ ▤ TRACK 2  "in the box"           mixing     due 30 Sep      │
    │ ▢ TRACK 3  ★ MIKED ACOUSTIC SRC   not started  START BY 1 NOV│
    │ ▢ METHOD PDF (how track 1 was made)                          │
    │ ▢ WORKING-METHOD DOC  photos / screenshots / stems           │
    │ ▢ IELTS certificate               not booked  BOOK BY 30 SEP │
    │ ▢ MASTER PROJECT PLAN (Basel only)                           │
    │ ▢ Bachelor transcript, legalised + translated                │
    └───────────┬──────────┬─────────────┬──────────────┬──────────┘
                │          │             │              │
      ┌─────────┘          │             │              └──────────┐
      ▼                    ▼             ▼                         ▼
 ┌──────────┐      ┌──────────────┐  ┌──────────────┐     ┌──────────────┐
 │ HfMT Köln│      │ FHNW Basel   │  │ İTÜ MIAM     │     │ RDAM         │
 │ 2 Mar 27 │      │ 15 Dec–15 Feb│  │ 10 Jan–20 Feb│     │ 1 Dec 26     │
 │ needs:   │      │ needs:       │  │ needs:       │     │ needs:       │
 │ T1 T2    │      │ T1 + method  │  │ T1 T2 T3★    │     │ 2 × 7-min    │
 │ + wk-doc │      │ + proj plan  │  │ ALL miked    │     │ prods, 1 pop │
 │ German A2│      │ no German    │  │ +TB scholar. │     │ 1 classical  │
 │ ✅2/3    │      │ ⚠ 1/3        │  │ ❌ 0/3       │     │ ❌ blocked:  │
 │          │      │              │  │              │     │ prereq degree│
 └──────────┘      └──────────────┘  └──────────────┘     └──────────────┘
```

Three things fall out of the inversion that no programme-first view can produce:

1. **The critical-path artefact is visible.** Track 3 with a miked acoustic source is the only
   artefact that requires him to leave the box and book a room. It gates İTÜ, ZHdK, EAMT, IADT and
   mdw. `DOOR3.md` already says *"That single constraint should shape what you build over the next
   year"* — the app should be the thing that says it, every week, until it is done.
2. **Latest-safe-start dates, computed backwards.** İTÜ closes 20 Feb 2027 and needs three miked
   mixes; if a mix takes six weeks, Track 3 must start by early November 2026. That is a date the app
   can derive and he cannot hold in his head.
3. **Cheapest marginal gate.** With Tracks 1 and 2 done he is 2/2 for Köln and 1/1 for Basel — two
   of his three best targets are fully unlocked by the same two tracks. That is the single most
   motivating fact available and it is currently invisible.

### 5. Joining money to programmes

They meet in exactly one place: **inside a programme, answering one question — "what does this
actually cost me, and what could pay for it."** Not a joined browse table; a per-programme money
answer. The Money screen as a 120-row list should not survive.

The join must be **graded and labelled**, never a boolean:

| tier | rule | shown as |
|---|---|---|
| **Named** | the scheme names this institution or programme | *"For this programme specifically."* ICMP Andrew Scheps → ICMP MSc. |
| **Scoped** | scheme's country/region contains the programme's country **AND** its subject scope does not exclude the arts **AND** no eligibility bar he fails is stated | *"Open to this country and this subject, on the published rules."* ESKAS → any Swiss arts master. |
| **Silent** | scheme states no country scope at all (36 of 120) | *"Doesn't say who can apply. Not a yes."* Listed, never counted. |
| **Barred** | a bar he fails is stated anywhere in the record's prose | *"Ruled out for you: needs 2,800 hours' work experience."* Chevening. Shown, so he never re-checks it. |

**The honest sentence** is a shape, not a claim. Never *"this scholarship could cover this
programme."* Always:

> **CHF 2,450/month against a CHF 2,500/yr fee and CHF 20–24k living — if Tunisia is on the arts
> list.**
> *Unknown: Tunisia's inclusion in the 2027-28 ARTS country list. The list publishes from August
> 2026.*
> **One email settles it → sgs@sbfi.admin.ch** · [ Log this question ] · [ Opens 20 Aug — 6 days ]

Three parts, always: **the number**, **the one unconfirmed thing**, **the action that resolves it.**
The unknown is not a caveat in grey text at the bottom — it is the middle of the sentence, and it is
clickable, because turning an unknown into a question with an owner and a date is the whole workflow.

Two data repairs must land before any of this ships, both already named in the critique and both
still true in today's files: normalise `requiresWorkExperience` (72 of 120 empty) and
`requiresAdmissionFirst` (21 unsettleable), and normalise country scope (65 distinct strings for
~40 countries). Until then the *Barred* tier must be driven by prose matching, not by those fields —
Chevening's `requiresWorkExperience` is blank while its own `whoCanApply` states the 2,800-hour bar.

### 6. What to cut

Named, and I mean deleted, not hidden behind a menu.

| Cut | Why |
|---|---|
| **The `Not a degree` bottom tab** (137 records, 11 pattern groups, 2.1 screens) | It is genuinely good work and it is a **read-once** artefact — it teaches a recognition pattern he keeps in his head afterwards. It has earned a permanent tab as much as a fire-safety briefing has. Demote to one linked page; keep the not-a-degree badge loud wherever a record appears. |
| **The 7-step funnel on Start** | An essay about the corpus's provenance. Correct, already read, identical every day for fifteen months. Move to an "about this data" page; the home screen must be about this week. |
| **The `Programmes` tab as a browsable list** (13.3 screens, 9 facets, 3 sorts) | He is choosing among ~14 targets, not 326. Facets over fields that are 59%-corrected and 68%-unchecked manufacture confidence the data cannot support. Keep **search**; delete the facet rail and the browse entry point. |
| **The `Verdict / Cheapest / Country` sorts** | Three sorts, none of them time. Replace with one: **by date**. |
| **`Money` as a 120-scheme scroll** (31.3 screens — the longest screen in the app by 3×) | Nobody reads 120 schemes on a phone. Becomes (a) the per-programme money answer of §5 and (b) a worklist of the **8 schemes worth pursuing** that `DOOR3.md` already names, each as a dated gate with its own blockers. |
| **The four "filter by what disqualifies fastest" toggles on Money** | They filter 120 to 120 in the default state, and the screen tells him so. A filter that removes nothing is furniture. |
| **The `chance` field as a facet** | `Strong / Possible / Weak` is an unverified guess from listing text; a verdict overturns it routinely. Keep it inside a record, labelled as a guess. Never a filter. |
| **The 249 unverified records as browsable objects** | Keep them **findable by search** and **flagged**. Remove them from every default list. A lead you cannot act on this week is not content, it is inventory. |
| **The `audition` default filter** | It hides the campaign's single strongest target (FHNW Basel, `needsAudition: true`) from a search for its own city, under a caption that contradicts the record's own text. Either fix the flag on the 13 known-wrong records and show everything, or drop the filter. Do not ship a default that hides the answer. |

Not cut, and strengthened: the **correction overlay** (`~~Under €1.5k~~ → ≈£29,900/yr`), the
**verified / corrected / never-checked** three-state stamp, and the **not-a-degree badge**. Those are
the honesty machinery. Nothing here weakens them; the campaign console just needs them attached to
commitments rather than to browse results.

### 7. The screen he opens most — `This week`

He opens the app on a phone, in gaps, for two to five minutes. He opens it to be told what to do.
**`This week` replaces Start and becomes the only default destination.** Everything else is reached
from something on it.

Five bands, in this fixed order, because it is the order of regret: *closing* → *opening* → *owed by
others* → *owed by me* → *the making*. Bands are omitted entirely when empty. Nothing renders a date
that a human has not confirmed.

Real content, computed for **14 August 2026** from `calendar.json` + his state. 390px ≈ 46 monospace
columns:

```
┌────────────────────────────────────────────┐
│ Fri 14 Aug 2026        56 weeks to Sept 27 │
│ ─────────────────────────────────────────  │
│                                            │
│  THIS WEEK                              1  │  ← only band that is ever
│ ┌────────────────────────────────────────┐ │    non-empty at week 0
│ │ ⚡ 6 DAYS    Thu 20 Aug                │ │
│ │ Swiss ESKAS arts scholarship OPENS     │ │
│ │ CHF 2,450/month — the largest stipend  │ │
│ │ in the whole corpus.                   │ │
│ │                                        │ │
│ │ ❓ Is Tunisia on the 2027-28 ARTS      │ │
│ │    country list? Unknown. The list      │ │
│ │    publishes from August 2026.          │ │
│ │                                        │ │
│ │ [ Email sgs@sbfi.admin.ch  ▸ ]         │ │
│ │ [ Email Swiss Embassy Tunis ▸ ]        │ │
│ │ Confirmed 13 Aug · results/DOOR3.md    │ │
│ └────────────────────────────────────────┘ │
│                                            │
│  OPENS NEXT                             2  │
│ ┌────────────────────────────────────────┐ │
│ │ 48 days  1 Oct   Campus France Tunisie │ │
│ │          opens — binds all 28 FR options│ │
│ │ 123 days 15 Dec  FHNW Basel window opens│ │
│ │          closes 15 Feb · CHF 2,500/yr   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│  CLOSES NEXT                            1  │
│ ┌────────────────────────────────────────┐ │
│ │ 109 days  Tue 1 Dec 2026               │ │
│ │ Royal Danish Academy — Tonmeister      │ │
│ │ ⛔ BLOCKED: prerequisite "Bachelor of   │ │
│ │    Music as tonemeister". Ask about     │ │
│ │    equivalence, or drop it.             │ │
│ │ [ Ask about equivalence ] [ Rule out ]  │ │
│ └────────────────────────────────────────┘ │
│                                            │
│  WAITING ON THEM                        0  │
│ ┌────────────────────────────────────────┐ │
│ │ Nothing sent yet. Three questions are   │ │
│ │ blocking three targets:                 │ │
│ │  → HfMT Köln — does a BSc Software      │ │
│ │    Engineering count as "affine"?       │ │
│ │    jonathan.podmore@hfmt-koeln.de       │ │
│ │    Decides your only free option.       │ │
│ │  → TU Ilmenau — which English cert?     │ │
│ │  → Łódź — non-EU fee, Polish-taught?    │ │
│ │ [ Send all three ▸ ]                    │ │
│ └────────────────────────────────────────┘ │
│                                            │
│  THE MAKING                          0 / 3 │
│ ┌────────────────────────────────────────┐ │
│ │ ▢ TRACK 1  in the box                   │ │
│ │   unlocks Köln 1/2 · Basel 1/1          │ │
│ │ ▢ TRACK 2  in the box                   │ │
│ │   unlocks Köln 2/2 — then Köln is DONE  │ │
│ │ ▢ TRACK 3  ★ MIKED ACOUSTIC SOURCE      │ │
│ │   İTÜ needs 3, all miked · closes 20 Feb│ │
│ │   ⚠ START BY 1 NOV or İTÜ is unreachable│ │
│ │ ▢ IELTS — not booked                    │ │
│ │   ⚠ BOOK BY 30 SEP (results take 13 d)  │ │
│ └────────────────────────────────────────┘ │
│                                            │
│  ─────────────────────────────────────────  │
│  🔎 Search 355 programmes, 120 schemes      │
│  12 confirmed dates · 258 records say       │
│  "prior cycle" and are not counted here     │
└────────────────────────────────────────────┘
        [ This week ]  [ My campaign ]  [ 🔎 ]
```

Notes on what that wireframe is asserting:

- **Every date on it is human-confirmed.** No parsed date reaches this screen. The footer states how
  many records were *excluded* for being unconfirmed — the honesty stamp moves from decorating a
  browse list to explaining an omission, which is where it belongs.
- **Day counts, not dates alone.** "6 days" is actionable; "20 August" is trivia in August.
- **Every band item carries the action, not the fact.** The ESKAS card's payload is two mailto
  buttons, not a stipend figure.
- **`WAITING ON THEM: 0` is shown, not hidden**, because zero is the alarming number in August 2026 —
  and it is populated from the three emails `DOOR3.md` already drafted. On 3 January it will read
  `WAITING ON THEM: 3`, sorted by age, with a chase button on anything past 14 days. That is J5,
  answered structurally.
- **THE MAKING is always last and always present**, because it is the band that is true for all 56
  weeks and the one he will otherwise defer. Its "unlocks" lines are the artefact→programme edges
  from §4 read backwards.
- Two tabs plus search, not five.

---

## Part 3 — revised screen inventory

| Screen | Fate | One line |
|---|---|---|
| **`This week`** | **NEW** — replaces `Start` | The default and near-only destination; five time-ordered bands, human-confirmed dates only. |
| **`My campaign`** | **NEW** — absorbs `My list` | One row per committed programme: gate state, blockers with owners and clocks, submission checklist, his note in full. |
| **`The making`** | **NEW** — artefact spine | Artefacts as first-class objects with states and latest-safe-start dates; each shows which gates it unlocks. Surfaces as a band on `This week`, opens full. |
| **Programme record** | **STAYS**, restructured | Best thing in the app. Reorder to *what it costs me / what I must make / when / what I must ask*, with the money answer of §5 inlined and the correction overlay kept exactly as is. |
| **Search** | **STAYS**, promoted | Already searches prose across 22 fields. Becomes the only route into the 355, replacing the browse list. |
| **`Money` (120-row list)** | **DIES** | 31 screens of scroll nobody reads; replaced by the per-programme money answer plus the 8 schemes worth pursuing, held as dated gates. |
| **`Programmes` list + facet rail** | **DIES** | Faceting fields that are 59%-corrected and 68%-unchecked manufactures confidence; he is choosing among ~14, not 326. |
| **`Not a degree`** | **MERGES** into one linked page | A read-once recognition pattern, not a weekly destination; the badge stays loud on every record. |
| **The 7-step funnel** | **MERGES** into "about this data" | An argument about provenance, correct and already absorbed; it is the same every day for 56 weeks. |
| **`calendar.json`** | **NEW** — data, not a screen | ~12–40 hand-confirmed gates with provenance; the only origin of a displayed date in the whole product. |
| **Export / import** | **STAYS**, strengthened | Fifteen months in `localStorage` is a liability; add an export-overdue nag to `This week` after 30 days. |

---

## The single highest-value change

> **Add `calendar.json` — the twelve human-confirmed dates, with provenance — and rebuild the home
> screen as `This week` on top of it.**

Everything else in this document is downstream of that one file. The date machinery is already
built and already correct: `parseDeadline` refuses to invent a date from a `PRIOR CYCLE` string, and
that refusal is right. But it is pointed at a field that contains **258 prior-cycle strings and zero
of the twelve dates his campaign runs on** — and it currently renders FHNW Basel's confirmed
15 Dec – 15 Feb window as *"prior cycle — confirm the 2027 date"* while the record's own text says
*"NOT a prior cycle."*

Twelve hand-written rows fix J1 and J2 outright, give J5 something to count against, and give the
artefact spine in J3 the deadlines it needs to compute a latest-safe-start. It is perhaps two hours
of typing against fifteen months of use, and without it every other improvement is decoration on a
tool that cannot say what day it is.
