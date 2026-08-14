# The foundation — The Desk

The identity layer of the rebuild: the faces, the six tokens, the channel strip, the fader
throw. Everything here is measured, and every number below was produced by a script or by
Chromium, not asserted.

The brief was one sentence — **"it is obvious that it's made by AI"** — and the app it describes
had all three of the documented defaults at once: a near-black ground, a single bright teal
accent, and a `--serif` that resolved to Iowan on iOS, Georgia on Windows and DejaVu on Android,
which meant the app's entire argument was set in a typeface nobody chose. All three are gone.

**Canvas: a laptop, 1280–1600px.** The scale, the rail width and the reading measure are tuned
for that. Narrow still works and is verified at 390px, but it is a fallback, not the target.

---

## 1 · The faces

Self-hosted, subset and axis-clipped from the upstream variable sources by
`scripts/build-fonts.mjs`. All three are OFL. No CDN, no Google Fonts request, no `local()` on a
real face.

| Face | Role | Axes shipped | Upstream | Shipped | Saving |
|---|---|---|---|---:|---:|
| **Literata** | body, and the one large line | `opsz` 14 pinned · `wght` 400–700 | 955,132 B | **31,348 B** | 96.7% |
| **Literata Italic** | their voice: block quotes, card sentences | `opsz` 14, `wght` 400, both pinned | 902,728 B | **18,000 B** | 98.0% |
| **Archivo** | panel legends, caps, institution names, UI | `wght` 400–700 · `wdth` 100–125 | 658,596 B | **47,944 B** | 92.7% |
| **Spline Sans Mono** | raw strings, data, costs, deadlines | `wght` 400–500 | 118,744 B | **16,040 B** | 86.5% |
| | | | | **113,332 B = 110.7 KB** | budget 120 KB |

Subset against **235 codepoints derived from `public/data/*.json`**, not guessed. 102 Greek and
Cyrillic characters are deliberately dropped to the system stack: every one occurs inside a
quoted raw string, which is set in the mono face, and a Greek-capable subset of three families
costs more than those records are worth. Two glyphs the mono lacks — `→` and `₺` — fall through
per-glyph to `ui-monospace`.

**Axis clipping is worth more than glyph subsetting**, as the spec predicted. Archivo with the
condensed half of its width axis is 65,096 B; clipped at `wdth` 100 it is 47,944 B — 17 KB for
widths no rule in `styles.css` asks for. Literata's italic went 33,008 → 18,000 B by pinning the
weight axis the type scale never varies.

Only the body face is preloaded (`index.html`). The other three are metric-matched, so they cost
nothing while they load.

### Measured layout shift: **0.00 px**

`font-display: swap` with a metric-matched fallback `@font-face` per family. The overrides are
computed, not copied: 40,000 characters of the app's own prose (`verdictWhy`, `acceptsNonMusic`,
`portfolio`, `recommendation`, `entry`, `study`, `correction` …) are **shaped with HarfBuzz** —
the shaper Chromium itself uses, so kerning is included — in the real face and in the fallback,
and the ratio of the two mean advances is the `size-adjust`.

| Face | mean advance | `size-adjust` | `ascent-override` | `descent-override` |
|---|---:|---:|---:|---:|
| Literata | 0.4823 em | **106.2%** | 110.8% | 29.0% |
| Literata Italic | 0.4537 em | **99.9%** | 117.8% | 30.8% |
| Archivo | 0.4483 em | **98.7%** | 89.0% | 21.3% |
| Spline Sans Mono | 0.6000 em | 100.0% (no fallback face needed) | — | — |

Computed against Arial's metrics (0.4542 em), because the canvas is a laptop and Arial or
Helvetica is what paints the first frame. The Android figures against Roboto (0.4501 em) are
107.2 / 100.8 / 99.6% and are recorded in `public/fonts/metrics.json`.

**Verification, in Chromium 141 at 1440px:**

- Predicted Literata ÷ Liberation Sans = 1.0620. Laid out by the browser over 12,000 characters
  of real prose: **1.0620**. Four decimal places.
- Residual error after `size-adjust`, fallback ÷ real face: **0.9998** Literata · **1.0013**
  Archivo · **0.9996** Literata Italic.
- Ten real blocks (statement, prose ×2, title, institution, sentence, legend, micro, mono
  deadline, UI label) rendered twice, once in fallback-only and once with the webfonts:
  **539.90 px both ways. Every block delta 0.00. Total shift 0.00 px.**

> Two corrections to `TECH-DECISION.md §3.5` came out of this, both load-bearing:
> its table prints the ratio **inverted** (92.0% for Literata, which would shrink an already
> narrower fallback — Literata is *wider* than Arial, so the fallback must grow), and a mean
> advance summed from `hmtx` is ~1.1% wide for Literata because it ignores kerning. Both were
> caught by measuring in the browser rather than trusting the table.

Reproduce: `node scripts/build-fonts.mjs` (needs `pip install fonttools brotli uharfbuzz`).
`node scripts/build-fonts.mjs --check` re-verifies that `styles.css` still carries the computed
table and **fails the build if it has drifted.**

---

## 2 · The six tokens

Named for what they mean in this product, not for a rank in an abstract scale. Light is the bare
`:root`; dark is redefined twice, once under `prefers-color-scheme` and once under
`[data-theme]`, so the manual toggle wins in both directions.

| token | light | dark | what it is |
|---|---|---|---|
| `--console` | `#DCDFD6` | `#1D2327` | the frame — the page ground. Painted acoustic-panel grey-green; painted-steel slate at night. Never near-black, so nothing has to be bright to survive it. |
| `--console-recess` | `#CBCFC5` | `#151A1D` | what is set *into* the desk. The app's only elevation, and it is negative. Nothing floats. |
| `--legend` | `#161A17` | `#E3E7E3` | the silkscreen — all body copy, all titles. 13.0 : 1 / 12.7 : 1 on the ground. |
| `--strip` | `#566058` | `#8E9A93` | the channel strip and everything of its rank: rails, rules, metadata, provenance — and the never-checked state, which has no colour of its own and borrows this. 4.9 : 1 / 5.4 : 1. |
| `--cap` | `#2C5B6B` | `#84B4C6` | the coloured cap on a fader. **Only things you can touch.** Links, focus ring, active tab, pressed switch. Nothing decorative is ever this colour. 5.5 : 1 / 7.1 : 1. |

### The meter — the only loud colour in the product

| stop | light | dark | verdict |
|---|---|---|---|
| `--meter-nominal` | `#3A672A` | `#7EB469` | WORTH IT |
| `--meter-over` | `#7F5306` | `#CD9E4C` | CONDITIONAL |
| `--meter-clip` | `#A5352A` | `#F1897A` | AVOID, and the china-marker strike on a corrected value |

**Luminance spread — the 0.03 requirement, computed:**

```
light   nominal L=0.1077   over L=0.1071   clip L=0.1071     spread 0.0006
dark    nominal L=0.3810   over L=0.3795   clip L=0.3800     spread 0.0014
```

Both are inside 0.03 by more than an order of magnitude: in greyscale the three verdicts are the
*same grey*, and the geometry in `ChannelStrip.tsx` is doing all of the work. Contrast against
`--console` stays 4.94 / 4.95 / 4.95 in light and 6.52 / 6.50 / 6.51 in dark, so nothing was
bought by making them equal.

These are the `ART-DIRECTION` hues pulled onto a common luminance by scaling in **linear light**,
which moves lightness without touching hue: `#3C6A2C→#3A672A`, `#7E5206→#7F5306`,
`#A03328→#A5352A`, `#7FB56A→#7EB469`, `#D2A24E→#CD9E4C`, `#E58274→#F1897A`.

Greyscale evidence: `foundation-shots/states-light-grey.png`, `states-dark-grey.png`,
`cards-light-grey.png`, `cards-dark-grey.png`, and a 35% desaturation in
`states-light-desat.png`. All four meter states remain distinguishable with no hue at all:
**solid block · hatched half-block with a reference tick · empty box with a strike · a single
hairline dash · nothing at all.**

---

## 3 · The channel strip — the state table

`src/components/ChannelStrip.tsx`. 32px, left gutter, inline SVG, no images, no ids, no
`<defs>`. Three orthogonal truths in three different *kinds* of mark.

Every row below is in `foundation-shots/states-light.png` and `states-dark.png` (numbered in the
same order), in greyscale in `states-light-grey.png` / `states-dark-grey.png`, and side by side
in `both-states.png`.

| # | props | rail | meter | ladder | reads as |
|---|---|---|---|---|---|
| 1 | `verdict: 'WORTH IT'`, `gate: 'Portfolio only'` | solid | solid fill + cap bar | 1 rung | read, worth it, one step |
| 2 | `verdict: 'WORTH IT'`, `gate: 'Portfolio + exam/interview'` | solid | solid fill + cap bar | 2 rungs, dot on rung 2 | read, worth it, a test as well |
| 3 | `verdict: 'CONDITIONAL'`, `gate: 'Exam/interview only'` | solid | outline, 45° hatch to 70%, reference tick | 2 rungs | above nominal — it works, watch it |
| 4 | `verdict: 'CONDITIONAL'`, `needsAudition`, `auditionSource: 'confirmed'` | solid | hatched | 3 rungs, **top rung broken**, stile terminates | the climb stops at a live audition |
| 5 | `verdict: 'AVOID'` | solid | empty box, **struck** | 2 rungs | read, and killed |
| 6 | `verdict: ''`, `gate: 'None found in the text'` | **dashed** | **absent** — one hairline dash | hollow circle | never checked, and no gate in the text |
| 7 | `verdict: ''`, `auditionSource: 'suspected'` | dashed | absent | 3 rungs, top rung **dotted** | an audition phrase fired over unchecked text |
| 8 | `verdict: ''`, `gate: 'Not published — ask them'` | dashed | absent | 1 dotted rung | never checked, and they never published the gate |
| 9 | `verdict: 'AVOID'`, `costDisputed: '…'` | **hatched** | struck | 1 rung | a verified correction contradicts the record |
| 10 | `verdict: 'CONDITIONAL'`, `hasVerifiedDispute` | hatched | hatched | 2 rungs | same, on a conditional |
| 11 | `isDegree: false` | hatched | **no slot at all** | 1 rung | never given a verdict — judged on its accreditation |
| 12 | as 4, `prerequisiteWall` | solid | hatched | broken rung + **bar across the whole channel** | closed by a prerequisite, not by your ear |

**Never-checked is the empty slot.** 249 of 398 records were never read; the meter shows nothing,
because a channel nothing was ever sent through shows nothing. It cannot read as green: it has
no fill and no hue at all. It cannot read as AVOID: AVOID is a box that has been crossed out,
and this is no box.

**Verdict red is a bar; gate red is a stroke**, and a gate mark is never a fill — which is what
keeps a broken rung from ever being read as a verdict.

**Accessible name.** Every strip carries `role="img"` and an `aria-label` built by
`describeStrip()`, exported from the same file. A screen-reader user gets a sentence:

> *"Never checked — nobody opened this institution's page. No verdict, because nothing was ever
> checked. The way in may be a live audition — the phrase was found in unchecked text, so the top
> rung is drawn provisionally."*

The audition rule is **imported from `data/filters.ts`**, not restated. Records 253, 254, 258,
259 and 260 carry an ordinary `gate` string while a verified correction found a live piano test;
a second, looser copy of that rule is exactly what puts a live-performance programme into a "no
audition" list.

---

## 4 · What the view agents need to know

### Structure

```html
<article class="channel channel--card">        <!-- drop channel--card outside a list -->
  <div class="channel__strip">
    <ChannelStrip verdict={r.verdict} gate={r.gate} needsAudition={r.needsAudition}
                  auditionSource={r.auditionSource} hasVerifiedDispute={r.hasVerifiedDispute}
                  costDisputed={r.costDisputed} isDegree={r.isDegree} />
  </div>
  <div class="channel__body"> … </div>
</article>
```

- **There is no rule between cards.** A hairline between records, at zero radius, under a serif,
  is the broadsheet — and it demotes the signature to an ornament sitting beside the thing that
  is actually doing the separating. The strip separates the channels: every card's rail begins
  *below* its meter lane, so a 34px break opens at the top of each record and the meter block is
  what fills it. `channel--card` spends the air inside the body column so two strips meet without
  a seam. `.card:has(.strip)` drops the legacy hairline automatically.
- The SVG is absolutely positioned inside `.channel__strip` and takes the row's full height
  without contributing to it — **do not give it a height**, and do not put `display: block` on
  the same element as `.channel` (that is what `.card` did; it breaks the grid).
- A rail longer than the marks — the whole record page — is CSS, not SVG: put `rail`,
  `rail rail--dashed` or `rail rail--hatched` on any element and it paints the correct line style
  at any height.
- `ladderBase` (px from the top, default 84) moves the ladder down beside the entry section on
  the record page. `ladder={false}` drops it where the page draws it separately.
- `prerequisiteWall` has no field behind it yet. It is a prop the data layer must supply
  (Detmold, Copenhagen, CNSMD Paris).

### Type

Use the classes, never raw sizes: `t-statement · t-title · t-cardtitle · t-prose · t-prose-2 ·
t-quote · t-sentence (+ --guess) · t-inst · t-legend · t-verdict (+ --sm, --nominal/--over/
--clip/--none) · t-ui · t-tab · t-data · t-num · t-micro · t-unverified · t-struck · t-strip`.

**The reading measure is on the token, not on your view.** `t-prose`, `t-prose-2`, `t-quote`,
`t-sentence` and `t-statement` cap at `--measure-prose` (38rem ≈ 70 characters); titles and
`channel__body` blocks cap at `--measure-body` (46rem). Do not add your own `max-width`, and do
not remove theirs — at 1600px, `correction` runs to 150 characters a line without it.

Every size is a variable in `:root` (`--t-prose`, `--t-card`, …) with a narrow override under
`@media (max-width: 720px)`. Tune the scale there, once, not in a view.

### Chips

`chips.tsx` now exports **`VerdictWord`**, **`Meta`** / **`MetaSeg`**, **`LevelChip`**, plus
`bandLabel()` and `gateLabel()`. `VerdictChip` / `GateChip` / `CostChip` / `LangChip` survive as
deprecated adapters that render no pill and no border — delete each call site as you rebuild its
view, then delete the adapter.

`LevelChip` with `isDegree === false` is **not** provisional: it is kill-test rule 1, it renders
at title weight with a hatched edge, and it must stay visible without clicking. 57 of those 137
records have "Master", "Máster" or "Mastère" in the programme name, so the title itself misleads.

### The fader throw

`.throw` is one rail (`::before`, full height) with a `--cap` cap resting at the end of the
travel. Each row's height is its share of the throw: **`--travel` is the fall *below* that stop,
`(this − next) ÷ total`**, so a stop that cuts 122 of 355 takes a third of the travel and the eye
reads the collapse as distance fallen. The last row takes `throw__row--cap` and no `--travel`.
Minimum row height is a 44px tap target; where the two disagree the floor wins and the printed
number carries the difference — every number is printed, so position is never the only carrier.

### Motion

One animation in the whole application: `.is-muting` (`transition: opacity 120ms linear`) plus
`.is-muted` (0.55). Dim **in place**, then re-sort — nothing slides, nothing collapses. There is
no blanket `* { transition-duration }` in the stylesheet and adding one would be a regression.
`prefers-reduced-motion: reduce` forces every duration to 0ms globally.

### Focus

`:focus-visible` is a 2px `--cap` outline at 2px offset, on everything, never removed
(`foundation-shots/focus-visible.png`).

---

## 5 · Verification

| check | result |
|---|---|
| Font payload | 113,332 B = **110.7 KB** ≤ 120 KB |
| Layout shift on font swap | **0.00 px** across 10 real blocks; total block height 539.90 px both ways |
| `size-adjust` accuracy vs Chromium | 0.9998 / 1.0013 / 0.9996 (want 1.0000) |
| Meter luminance spread | **0.0006** light · **0.0014** dark (limit 0.03) |
| `document.scrollWidth` | 390 at 390 · 1280 at 1280 · 1440 at 1440 · 1600 at 1600 — no horizontal scroll at any width |
| Greyscale | four meter states and three rail styles all still distinguishable |
| Tests | `npm test` — **99 passed** (7 files) |
| Types | `tsc --noEmit` clean for every file in this deliverable |

### Screenshots — `app/foundation-shots/`

| file | what |
|---|---|
| `states-light.png` · `states-dark.png` | the twelve strip states, 1440px |
| `states-light-grey.png` · `states-dark-grey.png` | the same, desaturated to greyscale |
| `states-light-desat.png` | 35% saturation — the halfway case |
| `cards-light.png` · `cards-dark.png` | four real records in a list, no rules |
| `cards-light-grey.png` · `cards-dark-grey.png` | the list in greyscale |
| `type-light.png` · `type-dark.png` | the scale, specimen |
| `throw-light.png` · `throw-dark.png` | the fader throw |
| `controls-light.png` · `controls-dark.png` | buttons, switch, and the muted card |
| `focus-visible.png` | the focus ring after a Tab press |
| `both-states.png` · `both-type.png` · `both-cards.png` · `both-throw.png` | light and dark side by side, 1600px |
| `narrow-cards.png` · `narrow-type.png` · `narrow-throw.png` | the 390px fallback |
| `font-swap-proof.png` | the fallback face and the real face, same metrics, different letterforms |

---

## 6 · Known gaps, honestly

- **`npm run build` currently fails in `src/views/kit.tsx`**, which belongs to the view agent and
  was mid-edit while this landed (written 15:41, three minutes before the build ran). Nothing in
  this deliverable contributes an error: `tsc --noEmit` reports no diagnostics outside
  `src/views/`, and `npm test` passes 99/99. The cause, for whoever owns that file: the CSS
  comment above `.v-today` on line 61 wraps `` `.v-today` `` **in backticks**, which terminates
  the template literal that the stylesheet string lives in — everything after it is parsed as
  code, which is where all three diagnostics come from. Left untouched deliberately rather than
  edited underneath a live agent.
- **The single-file build (`door3.html`) will not carry the fonts.** It sets `publicDir: false`,
  so `/master/fonts/*.woff2` is absent and the offline artefact renders in the metric-matched
  fallback — which is graceful, and identical in layout, but not the real face. Inlining them as
  `data:` URIs needs a plugin in `vite.config.ts`, which this deliverable does not own.
- **`→` and `₺` are missing from Spline Sans Mono** upstream; both fall through per-glyph to
  `ui-monospace`. `₺` appears in Turkish cost strings, so it is worth knowing.
- **Archivo `wdth` below 100 is not shipped.** `ART-DIRECTION` mentions dense chrome at `wdth 90`;
  the type scale never uses it, and the condensed half of the axis costs 17 KB.
