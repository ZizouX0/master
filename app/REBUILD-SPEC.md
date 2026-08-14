# Rebuild spec

Merged from `ART-DIRECTION.md` (the look), `WORKFLOW.md` (the shape), `TECH-DECISION.md`
(the means). Where they disagreed, this decides. Build agents implement **this**.

The brief in one line: **"it is obvious that it's made by AI."** Everything below serves that.

---

## 1. Keep the stack. Spend the budget on craft.

Preact 10 + Vite 7 + zustand + one hand-written CSS file. Measured: React 19 is 60.0 KB gzip
against Preact's 5.4 KB, and the two React-bound libraries you would migrate *for* —
`motion/react` and Radix — are ones we are deliberately not installing, because Chromium 141
ships `startViewTransition`, `@starting-style`, `transition-behavior: allow-discrete`,
`<dialog>`, `inert` and `:has()` natively.

**Not doing:** Tailwind (its templating pull is the exact risk this rebuild exists to avoid),
any framework move, any animation library, virtualisation (326 cards relayout in 0.3 ms),
`content-visibility: auto` (measured *worse*, 0.3 → 0.7 ms).

---

## 2. The direction: **The Desk**

Every programme is a channel on a mixing console. Borrowed as **structure and nomenclature,
never as texture** — no brushed metal, no rendered knobs, no skeuomorphism.

### The signature — the channel strip
A 24px strip in the left gutter of every record, encoding three orthogonal truths at scroll
speed, so the card body needs no chips at all:

| Element | Encodes | Rendering |
|---|---|---|
| **Rail** line style | Was this ever read by a human? | solid = verified · dashed = not · hatched = disputed |
| **Meter block** | What came back | filled = worth it · hatched = conditional · struck = avoid · **absent = never checked** |
| **Gate ladder** height | How tall the climb is | rungs; **broken top rung** = audition · **crossbar across the rail** = prerequisite-degree wall |

Never-checked is **the empty slot** — it has no colour of its own. That is the point: 249 of
398 records were never read, and absence is the honest rendering of that.

The strip reappears once, at the landing, as **the funnel drawn as a fader throw** — 355 at the
top of travel, 14 at the bottom.

### Colour
Six tokens, named for what they mean here, not `primary`/`secondary`:
`--console` (frame) · `--console-recess` · `--legend` · `--strip` (the rail, and the
never-checked state, which borrows it) · `--cap` (marconi blue — **only things you can touch**)
· `--meter-nominal` / `--meter-over` / `--meter-clip`.

The traffic light survives but is **re-sourced as a peak-meter scale and tuned to within 0.03
relative luminance**, so in greyscale the three are nearly identical and the geometry carries
the meaning. Hue is never the only signal.

### Type — self-host, subset, no system fallback
The single highest-value change in the whole rebuild. `--serif` currently resolves to Iowan on
iOS, Georgia on Windows, DejaVu on Android — the app's whole argument is currently set in a
typeface nobody chose.

Subset against the app's own 189 codepoints, axis-clipped (that matters more than glyph
subsetting: Literata 101.6 → 28.1 KB):

| Face | Role | Size |
|---|---|---|
| **Literata** | body, and the one large line | 28.1 KB |
| **Archivo** (width axis) | panel legends, caps at 0.14–0.18em tracking | ~25 KB |
| **Spline Sans Mono** | raw strings, data, quoted source text | 17.5 KB |

All OFL. Ship a computed `size-adjust` / `ascent-override` table so `font-display: swap` costs
**zero layout shift**. Preload the body face only.

### Motion — one animation
**Mute, not removal**: 120 ms in-place dim, then re-sort. Everything else is 0 ms.
`prefers-reduced-motion` collapses it to an instant state change. Use `startViewTransition`
where it is free; never ship a library for it.

---

## 3. The shape: a campaign console, not a browser

Today is **August 2026**. The first gate is **1 October**. This is a campaign run against a
dozen dated deadlines, not a catalogue.

### `calendar.json` — build this first
The app's date parser currently yields **12 dated results across 518 records, and not one of
them is a date the campaign actually runs on.** FHNW Basel's field reads *"the window is 15
December 2026 – 15 February 2027"* and the app badges it **"PRIOR CYCLE — CONFIRM THE 2027
DATE."** Köln reads "no confirmed date" while its own correction names 2 March.

So: a hand-written `app/public/data/calendar.json`, one entry per **human-confirmed** date,
each carrying `{ date, label, programmeKey?, source, confidence, quote }`. Nothing enters it
without a quote from the record. **190 records carry `PRIOR CYCLE` strings — those never
become dates, never sort, never count.**

Confirmed dates (from `results/DOOR3.md` and the verification passes):

| Date | What |
|---|---|
| 1 Oct 2026 | Campus France Tunisie opens — gates every French option |
| 1 Dec 2026 | Royal Danish Academy closes |
| 15 Dec 2026 – 15 Feb 2027 | FHNW Basel window |
| 10 Jan – 20 Feb 2027 | Türkiye Bursları arts scholarship, its own window |
| ~15 Jan 2027 | Campus France masters close |
| 3 Feb 2027 | RMC Copenhagen |
| 2 Mar 2027 | HfMT Köln |
| 1 Mar – 1 May 2027 | KUG Graz |
| 26 Mar 2027 | Italian MAECI |
| 31 Mar 2027 | Romanian MFA |
| 15 May 2027 | AESEF |
| 15 Jun 2027 | HfM Karlsruhe |
| ~1 Oct – 1 Dec 2026 | Politecnico di Milano first call (€50 fee, rises to €150) |

### Screens — five become three
- **`This week`** (home) — what he owes, to whom, by when, built on `calendar.json`. Replaces the
  seven-step funnel, which was an essay about provenance that reads identically for 56 weeks.
- **`Shortlist`** — the tracker. The critique's verdict stands: *the browsing features are
  decoration, the tracker is the product.*
- **`Find`** — search plus the filters that survive. Not a browse list with nine facets.

**Cut:** the Not-a-degree tab (read-once, not weekly — fold into search results and the record
page), the standalone funnel, the three non-time sorts, Money-as-a-120-row-scroll (fold into
the record page and a filter, keep the eligibility normalisers).

### Join money to programmes
The datasets are separate today, so *"can I afford Basel with a scholarship I could win?"* is
unanswerable. Join on country plus subject scope, and state eligibility honestly — most schemes
never say. **Never present an unknown as a yes.**

---

## 4. Two app-level performance fixes

Both measured, both real, neither about the framework:
- `funding.json` puts **74.6 KB on the critical path for one number.** Defer it.
- `allFacetCounts` costs **8.22 ms with a query vs 1.16 ms without**, because it re-runs the text
  scan 11 times — about **45 ms per keystroke on a phone.** One cache fixes it; the existing 53
  tests already guard the behaviour.

---

## 5. Accessibility — use the platform

Native `<dialog>` + `showModal()` for the filter sheet. Four real bugs measured today: focus
never enters the sheet, the background is not `inert`, Escape does nothing, no scroll lock.
Radix would cost ~20 KB gzip to reimplement what the browser already does.

Visible keyboard focus everywhere. `prefers-reduced-motion` honoured. 44px targets.

---

## 6. What must not regress

The nine-item kill test in `DESIGN-CRITIQUE.md §6` still governs, and the 53 tests must pass.
Specifically:
1. `isDegree === false` visible **without clicking**, at title weight.
2. Never-checked can never read as green — it is the empty meter slot.
3. Records **253, 254, 258, 259, 260** show their live performance / ear test and stay out of
   every "no audition" and "free and reachable" list.
4. **Edinburgh ≈ £29,900** and **KASK ≈ €8,800** render as corrections and never reach a cheap
   selection.
5. `correction` — column G — appears **in full** on the record page. Its absence is what killed
   the first attempt.
6. No bare date for any `PRIOR CYCLE` deadline.
7. `document.scrollWidth === 390` at 390px, every screen.
8. Personal state keys on the durable hash, never on `id`.

---

## 7. Build order

1. **Fonts + tokens + the channel strip** — the identity. Nothing else lands until this reads.
2. **`calendar.json` + `This week`** — the spine.
3. **Record page** on the new tokens, with money joined in.
4. **Find** — search, surviving filters, native `<dialog>`.
5. **Shortlist** on the new tokens.
6. Perf fixes, then the kill test in a real browser at 390 × 844.

Deploy: the site is **already live at https://zizoux0.github.io/master/** from a `gh-pages`
branch. Keep pushing there; the Actions workflow takes over once the Pages source is switched
to "GitHub Actions" in repo settings.
