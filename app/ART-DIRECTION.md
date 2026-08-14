# ART DIRECTION — Door 3

**The Desk** · a reading document mounted in a channel strip
Written for the builder. Everything here is a decision, not a suggestion.

Supersedes the visual sections of `DESIGN-UX.md` §7. The information architecture in the
rest of that document stands unchanged.

---

## 1. The thesis

**The app is a mixing desk, and every programme is a channel on it.** Not a plugin skin —
no brushed metal, no screw heads, no rendered knobs. What is borrowed from his world is the
*structure and the nomenclature*: a console is a column of identical channels, each one
carrying a strip of small hard marks down its left edge that tell you, at a glance and
without reading a word, whether signal is passing, how hot it is, whether it has been muted,
and whether it was ever patched in at all. That strip is the whole design. Every record —
in the list, on its own page, in the shortlist — carries a **24px channel strip** in the left
gutter, and three orthogonal truths are legible on it at scroll speed: *was this ever read*
(line style), *what came back* (meter), *how tall is the climb* (gate ladder). The body of the
record is then left completely alone: no chips, no boxes, no colour, just a reading face at
16.5px and a great deal of air. The console carries the state; the document carries the words.
Two other studio objects appear, once each and only where they are literally true: the landing
funnel is a **fader travel scale** (355 at the top of its throw, 14 at the bottom), and a
disputed value is struck in **china-marker red**, the way an engineer corrects a tape box.

**The risk:** the strip costs 24px of a 390px screen and roughly four characters per line of
prose, on a device where characters are the scarcest thing there is, and it asks him to learn
a small graphic language before it pays. It is justified because that language is the only way
to make *never checked* — 249 of 398 records, the majority state — read as **structurally
absent** rather than as a fourth colour, and because the space it takes is repaid twice over
by abolishing the five stacked chips per card that the current build spends two full lines on.

---

## 2. Colour

Six named tokens. The meter is one system with three stops; everything else is a
neutral. **No token outside the meter carries saturation above ~25%.**

| token | light | dark | what it is, and why |
|---|---|---|---|
| `--console` | `#DCDFD6` | `#1D2327` | **The frame.** The page ground. Light is the painted grey-green of acoustic panel fabric and old equipment enamel — cool, green-shifted, and deliberately *not* cream: cream is warm, decorative and taken. Dark is the blue-slate of a painted steel rack at night, not near-black; `#0D1214` (what exists now) makes a serif buzz and forces you to reach for a bright accent to survive it. A mid-dark slate needs no accent to feel alive. |
| `--console-recess` | `#CBCFC5` | `#151A1D` | **What is set *into* the desk.** Sticky bars, the filter sheet, search fields, the well behind a block quote. In light it is darker than the ground, in dark it is darker still — a recess is a recess in both. This is the app's only elevation, and it is a *negative* one: nothing ever floats. |
| `--legend` | `#161A17` | `#E3E7E3` | **The silkscreened text on a console panel.** All body copy, all titles. Near-black with a green cast in light; a slightly green off-white in dark, so it never reads as clinical white-on-black. 12.2:1 / 12.4:1 against `--console`. |
| `--strip` | `#566058` | `#8E9A93` | **The channel strip itself,** and everything of its rank: the rail, all 1px rules, metadata, provenance, the `chance` heuristic, and — critically — **the never-checked state, which has no colour of its own and borrows this one.** 4.9:1 / 5.2:1 as text, comfortably over 3:1 as a line. |
| `--cap` | `#2C5B6B` | `#84B4C6` | **The coloured plastic cap on a fader or a knob — the only thing on a desk you are meant to touch.** Therefore, in this app, the only thing coloured `--cap` is a thing you can touch: links, the focus ring, the active tab's marker, the pressed state of a switch. Marconi blue-grey, desaturated hard so it sits *below* the meter in loudness. Nothing decorative is ever this colour. |
| `--meter-*` | see below | see below | **The peak meter scale.** The verdict system, and nothing else in the app, ever. |

### The meter — the only loud colour in the product

| stop | light | dark | verdict |
|---|---|---|---|
| `--meter-nominal` | `#3C6A2C` | `#7FB56A` | WORTH IT — signal, sitting where it should |
| `--meter-over` | `#7E5206` | `#D2A24E` | CONDITIONAL — above nominal; it works, watch it |
| `--meter-clip` | `#A03328` | `#E58274` | AVOID — clipped. Also the china-marker strike on a corrected value, because both mean the identical thing: *this reading is bad, do not trust it.* |

Green/amber/red is a default, and it is here on purpose — the workbook already trained him
on it and re-teaching him a private code would be arrogance. What is **not** default is the
sourcing and the weight. These are not traffic lights, they are the zones of a peak meter,
which is why the fourth verdict state comes free: a meter with no signal shows *nothing*, and
that is exactly what *never checked* deserves. And the three stops are tuned to sit within
0.03 relative luminance of each other — **they are almost identical in greyscale, deliberately**,
so that the geometry in §7 is doing all of the work and the hue is only confirming it.

### Rules that are not negotiable

- Hue is never the sole carrier of anything. Every meter state is also a difference in
  **density, hatch, strike or absence** (§7), and always sits next to its word.
- `costBand` gets **no colour at all** — it is mono type. A green "Free" beside a green
  "WORTH IT" would imply a correlation this dataset flatly contradicts (§0.2 of `DESIGN-UX`).
- `chance` gets no colour. It renders in `--strip`, in the provenance line, at 12px.
- `gate` gets no colour except a red *stroke* on the broken rung and the prerequisite bar.
  Verdict red is a **fill or a bar**; gate red is a **stroke**. Never the reverse.
- **Never-checked can never be green, and can never be a fill.** It is the absence of a mark.

### Theme mechanics

Full light palette on bare `:root`. Redefine only the tokens under
`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and again under
`:root[data-theme="dark"]`, so the manual toggle wins in both directions. `body` gets an
explicit `background: var(--console)` — never transparent. `color-scheme` set in both.

---

## 3. Type

Three faces. All **SIL Open Font License**, all self-hosted as subset woff2, no CDN, no
Google Fonts request. He is on mobile data in Tunisia.

### Display / legend — **Archivo** (variable, `wdth` 75–125, `wght` 400–700)

A grotesque drawn by Omnibus-Type for legibility at small sizes, with a real width axis. It
is used almost exclusively **small, uppercase, and widely tracked**, which is precisely how a
console panel is silkscreened and how a rack unit is labelled: `LINE IN`, `INSERT`, `SOLO`.
The width axis is the reason this family and not another — I can set the section legends at
`wdth 115` the way faceplate legends are set wide, and the dense UI chrome at `wdth 90` in the
same family, so the panel and its labels are visibly the same object at two densities. It is
not Inter, it is not Space Grotesk, and it does not appear in the current build.

### Body / reading — **Literata** (variable, `wght` 300–700, italic)

Drawn by TypeTogether for reading long text on screens, and specifically on phones. Low
contrast, slightly slabbed serifs, a large x-height and open counters — everything a
high-contrast display serif is not, which is the point: this app has no hero and no display
line. The one big line on the landing screen is set in the *reading* face at 25px, so the app
never stops looking like a document. The product thesis is that he rejected a console and went
back to Markdown reports; the body face must therefore be the best long-reading face available,
not the most fashionable one. `verdictWhy`, `acceptsNonMusic`, `portfolio` and `recommendation`
average 361, 302, 228 and 755 characters — this face exists for exactly those four fields.

### Data / utility — **Spline Sans Mono** (variable, `wght` 300–700)

Squarish, technical, quiet. Every monospaced glyph in this app means one specific thing:
**this string is raw and I have not touched it.** Deadlines (`"PRIOR CYCLE - confirm new date:
WS 2026/27 window was Mar 1 - Jun 15, 2026 (PASSED)"`), costs, counts, row numbers, the
`UNVERIFIED` token. Its squared counters rhyme with the meter segments. Under-used relative to
JetBrains Mono or Plex Mono, and every figure is tabular by construction.

### Loading

- Subset to `latin` + `latin-ext` for Archivo and Literata. **The mono carries no subsetting
  beyond latin-ext**; Cyrillic (`аудиограм`) and Greek fall through to the system stack, which
  is correct — they appear inside quoted foreign strings and only ever in mono.
- `font-display: swap`, and the fallback `@font-face` blocks carry `size-adjust`,
  `ascent-override` and `descent-override` tuned to Literata and Archivo so the swap causes
  **zero reflow**. A layout shift on a 16.5px prose column is unacceptable.
- Total font budget: **≤ 120 KB woff2**, three variable files, roman + one italic (Literata).
- If any font fails: `--serif: Literata, Charter, Georgia, serif` /
  `--sans: Archivo, "Helvetica Neue", Arial, sans-serif` /
  `--mono: "Spline Sans Mono", ui-monospace, SFMono-Regular, Menlo, monospace`.

### The scale

Phone-first at 390px. Nothing below 11px anywhere. `em`-based tracking throughout.

| role | face | size / line-height | weight | tracking | notes |
|---|---|---|---|---|---|
| **Statement** (landing) | Literata | 25 / 1.28 | 450 | −0.015em | The one large thing in the app. Never bold. |
| **Programme title** (record) | Literata | 21 / 1.25 | 500 | −0.01em | Never clamped, never truncated. |
| **Card title** (list) | Literata | 17 / 1.30 | 500 | −0.005em | 2-line clamp. |
| **Prose — load-bearing** | Literata | 16.5 / 1.60 | 400 | 0 | The four fields. Never clamped. |
| **Prose — secondary** | Literata | 15 / 1.55 | 400 | 0 | `study`, `entry`, `scholarshipDetail`. |
| **Block quote** (their voice) | Literata italic | 16.5 / 1.55 | 400 | 0 | 2px `--strip` left rule, 12px indent, sits on `--console-recess`. |
| **Card sentence** | Literata italic | 14.5 / 1.50 | 400 | 0 | 3-line clamp. Guess-fallback renders roman, in `--strip`. |
| **Institution / metadata** | Archivo `wdth 100` | 14 / 1.40 | 400 | 0 | Full, never truncated (mean 67 chars). |
| **Section legend** | Archivo `wdth 115` | 11 / 1.0 | 600 | **0.14em** | UPPERCASE. `--strip`. |
| **Verdict word** (record) | Archivo `wdth 125` | 15 / 1.0 | 700 | **0.18em** | UPPERCASE. The widest thing in the app; a panel legend. |
| **Verdict word** (card) | Archivo `wdth 115` | 11 / 1.0 | 700 | 0.14em | UPPERCASE. |
| **UI control** | Archivo `wdth 100` | 14 / 1.20 | 500 | 0.01em | Buttons, switches, sheet rows. |
| **Tab label** | Archivo `wdth 110` | 10.5 / 1.0 | 600 | 0.08em | UPPERCASE. |
| **Data / mono** | Spline Sans Mono | 13 / 1.45 | 400 | 0.01em | Costs, deadlines, counts, row numbers. |
| **Funnel number** | Spline Sans Mono | 20 / 1.0 | 400 | 0 | Tabular, right-aligned. |
| **Micro / provenance** | Archivo `wdth 100` | 12 / 1.45 | 400 | 0.01em | `--strip`. `chance` lives here. |
| **Inline `UNVERIFIED`** | Spline Sans Mono | 0.78em / 1 | 500 | 0.06em | Small caps chip, `--meter-over`, inline in prose. |

**Rule:** programme titles are Literata, institution names are Archivo. The two never blur,
and the distinction is doing work — one is the thing, the other is who runs it.

---

## 4. Layout

### The concept

One column, always, at every width. On a phone it is 390px; on a desktop it is the same
column at `max-width: 36rem`, left-aligned inside the viewport, **not centred in a sea of
grey** — a document sits at the left of the desk, it does not float in the middle of it.
There is no grid in the multi-column sense and there never will be; the workbook is the grid.

What replaces a grid is the **rail**: a fixed 24px channel at the left of every content
block, running its full height. All content aligns to `rail-end + 12px`. **All 1px rules
start at the rail's x-position, not at the page edge** — the rules belong to the channel,
not to the page, and that single detail is what stops the hairlines reading as broadsheet.

```
 0      14        38   50                                376  390
 │←pad→ │←─rail──→│←g→ │←──────── content 326px ─────────→│←p→│
```

### Spacing scale

4px base. Only these values exist: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64**.

- Page padding: 14px left / 16px right. (Asymmetric: the rail lives in the left pad.)
- Rail 24px, gap 12px → prose column 326px ≈ 42 characters at 16.5px Literata.
- Line-level 8, field-level 16, group-level 24, section-level **32 + rule**.
- Tap targets ≥ 44px. Primary actions in the bottom third.
- **Radius: 2px on everything.** Equipment has small chamfers. Not 0 (broadsheet), not 8–12
  (the pill-soup default). Meter segments get 1px. **Nothing in this app is a circle.**
- **No shadows anywhere except the filter sheet's top edge** (`0 -1px 0 --strip`, a hairline,
  not a blur). No card has a border, a background or a shadow. Cards are separated by a rule.

### Landing — `/`

```
┌───────────────────────────────────────────────┐ 390
│ WHERE YOU STAND                          ◐  ⋯ │ topbar 44, --console-recess
├───────────────────────────────────────────────┤
│                                               │ 24
│   DOOR 3 · PRODUCTION AND STUDIO CRAFT        │ legend 11/0.14em --strip
│   SEPTEMBER 2027 INTAKE                       │
│                                               │ 16
│   Everything that was checked is              │ Literata 25/1.28
│   expensive. Everything you could             │ --legend
│   afford, nobody checked.                     │
│                                               │ 16
│   355 programmes. 106 were opened and         │ Literata 16.5/1.6
│   read. Nine came back worth it — two of      │
│   those you could pay for. The other 249      │
│   were never checked at all, and that is      │
│   where nearly everything cheap lives.        │
│                                               │ 32
│  ┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │ rule from rail x
│                                               │ 24
│   THE THROW                                   │ legend
│                                               │ 12
│   ┃                                           │ ← the fader track: 2px
│  355 ┫ collected in this door             ›  │   --strip, full height.
│   ┃                                           │   Ticks at positions
│   ┃                                           │   proportional to the
│  233 ┫ award a real master's degree       ›  │   count that survives.
│   ┃    −122 certificates, título propio       │   The number is printed,
│   ┃                                           │   so position is never
│  206 ┫ no confirmed live audition         ›  │   the only carrier.
│   ┃    −27 a production test is the job       │
│   ┃                                           │
│  114 ┫ taught in English or French        ›  │
│   ┃    −92 you have no German                 │
│   ┃                                           │
│   75 ┫ not ruled out on the official page ›  │
│   56 ┫ your background gives a real chance ›  │
│   14 ┣━━━━━━━━━━━━━━ you could pay for   ›  │ ← the cap: a 14px --cap
│   ┃                                           │   fader cap sits at the
│                                               │   bottom of the throw.
│  ┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│                                               │
│   Of those 14, one is both checked and        │ Literata 16.5
│   affordable: HfMT Köln, in Cologne, free.    │
│   Start there.                            →   │
│                                               │
│  ┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│                                               │
│   130 of the 398 are sold as a master's       │
│   and are not one. See them →                 │
│                                               │
│   120 funding schemes. Nationality was        │
│   rarely the bar — subject was. →             │
│                                               │
│   SNAPSHOT 2026-08 · MIRRORS DOOR3.XLSX       │ mono 12 --strip
├───────────────────────────────────────────────┤
│  NOW  PROGRAMMES  MONEY  NOT A DEGREE  MINE   │ tabs 56, --console-recess
└───────────────────────────────────────────────┘
```

Each tick row is a 44px tap target and drills into `/list` with that row's filters **and
every row above it** applied. The `−122` deltas are mono, 12px, `--strip`.

### List — `/list`

```
┌───────────────────────────────────────────────┐
│ ← PROGRAMMES                             ◐  ⋯ │ topbar
├───────────────────────────────────────────────┤
│  Search names and all prose                   │ --console-recess, 44
├───────────────────────────────────────────────┤
│  326 PROGRAMMES        VERDICT ▾    FILTERS ▾ │ sticky bar 44, recess
├───────────────────────────────────────────────┤
│                                               │ 16
│ ▊▊  MSc in Music and Acoustic Engineering     │ ▊▊ = solid rail + FILLED
│ ┃   Politecnico di Milano                     │      meter block. Verdict
│ ┃   Milano · Italy                            │      word sits inline with
│ ┃   WORTH IT                                  │      the title block.
│ ┃                                             │ 8
│ ┃   "Computer engineering is named first in   │ Literata italic 14.5
│ ┃   the entry requirements, there is no       │ 3-line clamp
│ ┃   portfolio and no entrance exam."          │
│ ├─  €1.5–5k/yr · ENGLISH · PORTFOLIO ONLY     │ mono 13. ├─ = one rung.
│ ┃                                             │ 16
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │ rule from rail x
│                                               │
│ ╎    Production (M.Mus.) — contemporary       │ ╎ = DASHED rail: nobody
│ ╎    popular music                            │     opened this page.
│ ╎    HfMT Köln                                │     NO meter block at all.
│ ╎    Cologne · Germany                        │
│ ╎    NOT CHECKED                              │ legend 11, --strip
│ ╎                                             │
│ ╎    Nothing here was confirmed by them.      │ Literata roman --strip
│ ├●─  FREE · GERMAN A2 · PRODUCTION TEST       │ ├●─ = rung 2, the dot
│ ├─                                            │      is the raw material
│ ╎                                             │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│                                               │
│ ▊✕  MA Music Production                       │ ▊✕ = solid rail, meter
│ ┃   SAE Institute Glasgow                     │      block STRUCK
│ ┃   Glasgow · United Kingdom                  │      (checked, and killed)
│ ┃   AVOID                                     │ card at 60% opacity
│ ┃   "Awarded by the University of             │
│ ┃   Hertfordshire, not by SAE."               │
│ ├╌  £15k+/yr · ENGLISH · ASK THEM             │
│ ╎                                             │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│                                               │
│ ╱╱   Mastère Production Musicale              │ ╱╱ = HATCHED rail:
│ ╱╱   NOT A MASTER'S DEGREE                    │      not a degree. No
│ ╱╱   ESIS Paris · France                      │      meter slot exists.
│ ╱╱   RNCP level 6 — bachelor level or below   │
│ ╱╱   €15k/yr · FRENCH                         │
│                                               │
│              SHOW 40 MORE                     │
└───────────────────────────────────────────────┘
```

**No chips.** The metadata line is mono text separated by `·`. This is the single biggest
departure from the current build, which spends two lines per card on five bordered pills.

### Record — `/p/:id`

```
┌───────────────────────────────────────────────┐
│ ← MSc IN MUSIC AND ACOUSTIC ENGINEERING  ◐  ⋯ │
├───────────────────────────────────────────────┤
│                                               │ 24
│ ▊▊  MSc in Music and Acoustic                 │ Literata 21/1.25
│ ┃   Engineering                               │
│ ┃   Politecnico di Milano                     │ Archivo 14
│ ┃   Milano · Italy · Southern Europe          │ Archivo 12 --strip
│ ┃   ROW 30 IN DOOR3.XLSX                      │ mono 12 --strip
│ ┃                                             │ 32
│ ┃   WORTH IT                                  │ Archivo wdth125 15/0.18em
│ ┃                          --meter-nominal    │
│ ┃   This is the one target in the whole       │ Literata 16.5/1.6, FULL,
│ ┃   batch that fits him on every axis at      │ never clamped
│ ┃   once: computer engineering is named       │
│ ┃   first in the entry requirements…          │
│ ┃   Read on the official page.                │ Archivo 12 --strip
│ ┃                                             │ 32
│ ┃ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│ ┃   THIS WAS WRONG IN THE EARLIER DATA        │ legend, --meter-clip
│ ┃   ┃ Cost band said  ~~EUR 1.5k-5k/yr~~      │ struck in china-marker
│ ┃   ┃ It is €3,900/yr for a non-EU student.   │ red; corrected value in
│ ┃   ┃ INPUT SAID 'Free' — WRONG               │ mono at full weight
│ ┃                                             │ 32
│ ┃ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│ ┃   1 · CAN YOU GET IN?                       │ legend
│ ┃                                             │
│ ├─  PORTFOLIO ONLY                            │ ← the ladder, in place,
│ ┃   Twelve months of work and you're          │   at the section it
│ ┃   through.                                  │   belongs to. One rung
│ ┃                                             │   = a stub. Tall ladders
│ ┃   WHAT YOU MUST SUBMIT                      │   are the hard ones.
│ ┃   Two audio files from the last two         │
│ ┃   years plus documentation of your          │ Literata 16.5 FULL
│ ┃   working method.                           │
│ ┃                                             │
│ ┃   DO THEY TAKE NON-MUSIC DEGREES?           │
│ ┃   ┃ "A bachelor's degree is sufficient      │ block quote, Literata
│ ┃   ┃ — regardless of the degree              │ italic, 2px --strip
│ ┃   ┃ programme."          ✔ CONFIRMED        │ rule, on --console-recess
│ ┃                                             │
│ ┃   Unverified guess from the listing text:   │ Archivo 12 --strip
│ ┃   chance rated Strong.                      │
│ ┃                                             │ 32
│ ┃ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │
│ ┃   2 · CAN YOU AFFORD IT?         …          │
│ ┃   5 · WHAT DO YOU DO, AND BY WHEN?          │
│ ┃   WHAT YOU'D ACTUALLY STUDY      …          │
│ ┃   YOUR NOTES                     …          │ ← moved to the FOOT of
│ ┃   SOURCE                         …          │   the page, not the head
│ ┃   NOT PUBLISHED (6)              …          │
│ ┃                                             │
└───────────────────────────────────────────────┘
```

The rail is **one continuous line down the entire document**, from the meter at the top to
the last rule. It is the channel. Note what moved: the current build parks a "Add to my
list / Status / Next action / My note" form directly under the title, above the verdict.
**His notes go at the foot.** The record's job is to be read; his job comes after.

---

## 5. The signature

**The channel strip.** A 24px rail in the left gutter of every record, in the list and on
the record page, carrying three independent facts in three different *kinds* of mark:

| what it encodes | how | why it is true |
|---|---|---|
| **Was this ever read?** | The rail's **line style**. Solid = a human opened the official page. **Dashed** = never checked. **Hatched** (`╱╱`) = not a degree, judged on its accreditation. | 249 of 398 are dashed. The majority of this dataset is unpatched. At scroll speed the eye counts dashes, and that count *is* the editorial finding. |
| **What came back?** | The **meter block** at the rail's top — filled / hatched / struck / **absent**. | A meter shows level. A channel nothing was ever sent through shows nothing. Never-checked is the empty slot; AVOID is the crossed-out slot. Structurally different, before colour. |
| **How tall is the climb?** | The **gate ladder**, drawn beside the entry section: 1–3 rungs, 10px apart. The rung that stops him is drawn **broken**. | The ladder's *height* is the difficulty. A portfolio-only programme is a stub; an audition programme is tall with a severed top rung. You can see the climb. |

And one crossbar that is not a rung: where a **prerequisite degree** closes the door
(Detmold, Copenhagen, CNSMD Paris), a 2px `--meter-clip` bar is drawn **across the whole
rail** — the channel is barred, but the ladder above it is intact. That is the Door 3
finding rendered exactly: *closed by a prerequisite, not by your ear. A prerequisite is
sometimes negotiable by equivalence. A trained ear is not.*

The signature appears in one other place and nowhere else: the landing funnel is the same
rail turned into a **fader throw** — 355 at the top, 14 at the bottom, a `--cap` fader cap
resting at the end of the travel. One idea, two placements. Everything else in the app is
type on a ground.

**Because the strip carries all the state, the body carries none.** No chips, no badges,
no coloured backgrounds, no boxes. That trade is the whole design.

---

## 6. Motion

**Rule: if a motion does not model a physical behaviour of the object it is attached to, it
does not ship.** There is exactly one animation in this application.

**Mute, not removal.** When a record is ruled out — by him setting status `no`, or by an
AVOID row sorting to the bottom — the rail's meter block acquires its strike and the row
drops to 55% opacity **in place, over 120ms**, and only then re-sorts. Nothing slides,
nothing fades out, nothing collapses. This is what a mute button does: the channel is still
on the desk, still patched, still visible, and you can hear it again by pressing the button
again. It is also literally the product's argument about the 100 AVOID records — *"each is
an application you now don't have to make"* — they are muted, not deleted.

Everything else is **0ms**:

- Filters apply instantly. No transition on the result set, ever. Perceived speed *is* the
  feeling of "tool", and 398 records is nothing.
- No page transitions, no route fades, no skeleton shimmer (420 KB gzipped; show nothing
  rather than a fake page), no scroll-triggered anything, no count-up numbers, no parallax.
- Focus rings appear instantly, always.
- Hover states change colour only, with no transition.

`@media (prefers-reduced-motion: reduce)` sets `transition-duration: 0ms !important` and
`animation: none !important` globally; the mute renders as an instant state change to its
final appearance. Nothing is lost, because the animation was never carrying information.

---

## 7. The four verdict states and the three gate rungs

### The meter — four states, distinguished before colour

Drawn at the rail's top: a 10px × 22px block, 1px stroke, 1px radius.

| state | geometry | colour | greyscale reading | word |
|---|---|---|---|---|
| **WORTH IT** | **Solid fill**, plus a 2px cap bar across the top edge. The densest mark on the page. | `--meter-nominal` | A solid black block. Unmistakable at 20cm. | `WORTH IT` |
| **CONDITIONAL** | 1px outline, filled to 70% height with a **45° hatch**, and a 4px **tick protruding to the right** at the fill line — the reference mark on a meter scale. | `--meter-over` | A half-full hatched block with a tick. | `CONDITIONAL — WORTH IT IF…` |
| **AVOID** | 1px outline, **empty**, with a 2px **bar struck horizontally across it**, overhanging 2px on both sides. The mute bar. | `--meter-clip` | An empty box with a line through it. | `AVOID` |
| **NEVER CHECKED** | **No block at all.** The slot is empty. The rail is dashed for its whole height. A single `—` in `--strip` mono sits where the block would be. | none, ever | Nothing. Absence. | `NOT CHECKED` |

Never-checked is not a fourth colour, a fourth chip or a grey variant of the other three.
**It is the absence of the mark**, on a rail that is visibly broken into dashes. It cannot
read as green because it has no fill and no hue at all; it cannot read as AVOID because
AVOID is a box that has been crossed out and this is no box.

The 130 non-degrees have **no meter slot** — the rail is hatched and the space where the
meter would sit is simply not drawn, because they were never given a verdict; they were
judged on accreditation. Their strip line reads `JUDGED ON ITS ACCREDITATION, NOT ON A PAGE
READING` in legend caps.

### The ladder — three rungs, drawn from the rail

Rungs are 14px horizontal strokes at 1.5px, spaced 10px, built bottom-up. The stile is the
rail itself.

| rung | mark | colour | greyscale reading |
|---|---|---|---|
| **1 · PORTFOLIO** | `├─` a plain solid rung | none (`--strip`) | a clean step |
| **2 · PRODUCTION TEST** | `├●─` a solid rung with a 3px **filled dot at the outer end** — the raw material you are handed | none (`--strip`) | a step with a weight on it. **Deliberately not green**: it is passable, but it is not a verdict. |
| **3 · EAR TRAINING / AUDITION** | `├╌ ╌` a rung with a **5px gap at its centre**, and the stile **terminates 4px above it** | `--meter-clip` stroke only | a broken step above which the ladder stops |
| *no gate found in the text* | a **hollow 4px circle** at the ladder position, no rungs | none | an open hole — unknown, not absent |
| *not published — ask them* | a single **dotted** rung + `ASK` in mono | none | a provisional step |

**How the two systems stay apart.** The verdict lives at the **top** of the rail and is the
only thing in the app that is ever a *filled shape with hue*. The gate lives **lower down,
beside the entry section**, and is only ever *open strokes*. Different position, different
mark type, different weight. Red appears in both, meaning the identical thing both times —
you cannot proceed — but verdict red is a **bar** and gate red is a **stroke**, and neither
is ever a fill. A gate mark can never be mistaken for a verdict because a gate mark is
never solid.

Each mark is always accompanied by its word, in Archivo caps. Colour never travels alone.

---

## 8. What I am deliberately not doing

- **No skeuomorphism.** No brushed metal, no bevels, no rendered knobs, no fader gradients,
  no screw heads, no noise texture, no rack-ear chrome. The console is borrowed as
  *structure and vocabulary* only. The moment it becomes texture it becomes a plugin skin,
  and a plugin skin is a costume.
- **No waveform, no spectrum, no VU needle, no album art, no vinyl, no headphones icon.**
  Every one of those is what a non-musician thinks music looks like.
- **No cream ground, no high-contrast display serif, no terracotta.** Not our brief.
- **No near-black ground with one bright accent.** That is what exists now and it is why we
  are here. The dark ground is a painted-steel slate and the only saturated colour is a
  meter reading.
- **No hairline-and-zero-radius broadsheet.** Rules exist, but they start at the rail, and
  every corner is 2px.
- **No pills, no badge soup, no bordered chips.** The rail carries state; text carries text.
- **No charts, no dashboards, no map, no "insights", no match score.** The funnel is a scale
  with every number printed on it; position is redundant with the number, so nothing has to
  be decoded.
- **No hero, no logo, no wordmark, no product name in the UI, no gradient, no illustration,
  no emoji, no glassmorphism, no blur.** The top bar shows the current view's name.
- **No Inter.** Not for anything.
- **No dark-only design.** He reads in bed and he reads on a bus. Both are first-class.
- **No countdown timers.** False precision on `PRIOR CYCLE` dates is the one error that
  costs him an application.

---

## 9. Critique of my own plan

**What still reads like a default, and what I did about it.**

1. **Green / amber / red.** It is the most default thing in this document. I kept it — the
   workbook trained him on it, and inventing a private code would be vanity dressed as
   originality. What I changed: I re-sourced it as a **peak meter** rather than a traffic
   light, which is native to his world and which *generates the fourth state for free*
   (a meter with no signal shows nothing); and I tuned all three stops to within 0.03
   relative luminance of each other so they are **near-identical in greyscale**. If the
   geometry in §7 did not work, the palette would fail — which is the correct dependency.

2. **A serif for prose is a default in "editorial" AI design.** Kept, because the product's
   entire thesis is that he abandoned a console and went back to Markdown reports. What I
   changed: the *choice*. Not Georgia, not a system stack, and explicitly not a
   high-contrast display serif — **Literata**, drawn for reading on phones, low contrast,
   slabbed, and used for the large landing line as well, so the app never acquires a hero.

3. **The dark ground.** My first pass kept something near `#12181A`, which is one step from
   the near-black default. Changed to `#1D2327`, a painted-steel slate that is light enough
   not to need a bright accent to survive — and the accent went from teal to a desaturated
   marconi blue that appears **only on things you can touch**.

4. **The meter had four segments.** I drafted it as a 4-segment LED ladder showing "how far
   verification went". That is fake precision: verification in this dataset is **binary** —
   a human opened the page or did not. Selling a gradient where the data has a boolean is
   the exact sin this product exists to fight. Revised to a single block with four
   *categorical* treatments.

**The thing I am removing.** I had a second motion: the gate ladder **drawing itself**
bottom-to-top over 240ms on the record page, stopping at the broken rung. It was the one
place I let myself be charming, and it does not earn its place — the still ladder already
says everything the animated one says, and paying 240ms before the most important page in
the app is fully readable, on a phone, on Tunisian mobile data, to make a point the static
drawing has already made, is a bad trade. **Cut.** The app now contains exactly one
animation, and it is a mute.

**What I remain unsure about.** The 24px rail costs roughly four characters per line of
prose. If, in his hands, the four load-bearing fields feel cramped, the correct retreat is
to narrow the rail to 16px and reduce the gap to 8px — recovering 12px — **and never to
delete the rail**, because deleting it returns the state to the card body and the chip soup
comes straight back with it.

---

*Constraints held: readable at 390px · `document.scrollWidth` stays 390 (the only
`overflow-x: auto` container in the app is the active-filter chip row, and it is clipped to
the viewport) · `:focus-visible` renders a 2px `--cap` outline at 2px offset on every
interactive element, never removed · `prefers-reduced-motion` reduces the one animation to
an instant state change · never-checked has no hue at all and therefore cannot read as
green · every colour in the app is accompanied by a word or a geometric difference.*
