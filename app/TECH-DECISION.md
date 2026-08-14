# Tech decisions for the craft rebuild

**Question asked:** what stack raises the ceiling on visual and interaction craft here, and is the
migration cost worth it?

**Short answer:** the stack is not what is holding the design back. Nothing in Preact, Vite,
zustand or plain CSS prevents a beautiful app. What is missing is a typeface, a motion system, a
real modal primitive and three rendering fixes — none of which require changing a single
dependency in `package.json` except adding font files. Every framework migration on the table
costs the 53-test verified suite and buys nothing visible.

Everything below was measured on this box today, not estimated. The numbers are reproducible;
each section says how.

---

## Summary

| # | Layer | Decision | Reason | Rejected | Migration cost |
|---|---|---|---|---|---|
| 1 | Framework | **Stay on Preact 10 + Vite 7** | React 19 measured at 60.0 KB gzip vs Preact 5.4 KB. Framework is not the bottleneck; the app's measured lag is app-level (see §6). A move burns 53 passing tests to gain nothing visible. | React 19 (+54.6 KB gzip), Astro (needs a server or a second routing model, breaks the `file://` single-file build), SvelteKit (rewrite everything), Next.js (wants a server) | **0 h** |
| 2 | Styling | **Keep one hand-written `styles.css`.** Add a token layer at the top and split into 6 `@import`ed partials | The existing file already *is* a design system — non-hue-dependent state encoding, dark-first tokens, `light-dark` toggle. It is the most distinctive thing in the repo. A utility framework would flatten it. | Tailwind v4 (real templating risk here — see §2), CSS Modules (scoping solves a problem this app doesn't have), vanilla-extract/Panda (build-time weight for 15 components), Style Dictionary (a pipeline with one consumer) | **2 h** to reorganise |
| 3 | Typography | **Self-host 3 subset variable woff2: Literata, Instrument Sans, JetBrains Mono.** Optional 4th: Fraunces for display | Highest craft-per-byte item in the document. Current `--serif` resolves to Iowan on iOS / Georgia on Windows / DejaVu on Android — three different designs, which is *exactly* what "AI-generated" looks like. Measured cost: 71 KB for all three. | Google Fonts CDN (3rd-party origin, no subsetting control, breaks the offline build), Inter (explicitly excluded; also everywhere), system stack (the status quo) | **6–8 h** incl. subsetting script + CI budget |
| 4 | Motion | **CSS transitions + `@starting-style` + same-document View Transitions API. No library.** `motion/mini` (3.1 KB) held in reserve | Chromium 141 verified to support `startViewTransition`, `@starting-style`, `transition-behavior: allow-discrete`, `interpolate-size`. Hash routing is *same-document*, so the VT API applies directly. Current `* { transition-duration: 100ms }` transitions `all` on every element — that is a bug, not a motion system. | `motion` full (22.7 KB gzip), `motion/react` (43.8 KB), GSAP (licence + weight), WAAPI-only (verbose for state transitions CSS does natively) | **5–7 h** |
| 5 | Components | **Native `<dialog>` + ~80 lines of own code.** No headless library | Measured: the filter sheet has 4 real a11y bugs (focus never enters it, background not inert, Escape doesn't close, no focus return). `dialog.showModal()` fixes all four in one element. Radix costs 17.8 KB gzip *and* drags `preact/compat` in to fix bugs the platform already fixes. | Radix (17.8 KB), Ark/Zag (24.9 KB), Base UI (React-only), Melt (Svelte-only), hand-rolling *without* `<dialog>` (which is how the current bugs happened) | **4–5 h** |
| 6 | Data & rendering | **No virtualisation. Keep the index/detail split. Three fixes: defer `funding.json`, cache the query match set across facet passes, memoise `Card`** | Measured: 326 cards force-relayout in 0.3 ms — virtualisation solves nothing. But a search keystroke costs 65–235 ms at 4× throttle, and `funding.json` puts 74.6 KB on the critical path for one number. | `@tanstack/virtual` (breaks Ctrl-F and scroll restore, solves a problem starting ~5,000 rows), `content-visibility: auto` (**measured to make it slightly worse** — 0.3 ms → 0.7 ms; contradicts DESIGN-ARCHITECTURE §6) | **4–6 h** |
| 7 | Deploy | **The site is already live.** Flip Pages source to "GitHub Actions" (one click) — or, for zero clicks, push `dist/` to `gh-pages` from CI | Pages *is* enabled. `configure-pages` now succeeds; the **deploy** job fails because the Pages source is still "Deploy from a branch". Two working paths, one needs a click, one doesn't. | Cloudflare Pages / Netlify (both give brotli — 355 KB instead of 478 KB for `detail.json` — but cost a new account + a repo authorisation; worth it *later*, not as the unblocking move) | **0.5 h** (click) or **1 h** (CI push) |
| 8 | Quality gates | **Add exactly two: a byte budget and an axe pass over the 6 routes.** Reuse the existing CDP harness | Both are ~40 lines, deterministic, and fail loudly on the two things that will actually regress: font/JS weight and modal a11y. | Lighthouse CI (flaky in a container, scores nobody reads), visual regression (pure noise while the design is changing daily), bundle *analysis* dashboards (nothing enforces anything) | **3 h** |

**Total: ~26–33 hours. Framework migration cost: 0.**

---

## Baseline: what is actually there right now

All figures measured on 2026-08-14 in this container. Reproduce with `npm run build`, then the
probe scripts described in each section.

### Shipped bytes (`npm run build`, `gzip -9`)

| Asset | Raw | gzip | On the critical path? |
|---|---:|---:|---|
| `assets/index-*.js` (preact, preact-iso, zustand, store, data layer) | 46,044 | **18,241** | yes |
| `assets/App-*.js` (shell, Start, Programmes, Filters, chips) | 29,884 | **9,825** | yes |
| `assets/App-*.css` | 16,316 | **3,877** | yes |
| `index.html` | 470 | 304 | yes |
| **First-paint JS + CSS** | **92,714** | **32,247** | |
| `assets/Record-*.js` | 19,964 | 6,688 | lazy |
| `assets/Money-*.js` | 14,241 | 5,041 | lazy |
| `assets/NotDegree-*.js` | 8,805 | 3,830 | lazy |
| `assets/MyList-*.js` | 7,331 | 3,007 | lazy |
| `data/index.json` | 321,614 | 41,000 (42,533 on the wire) | yes |
| `data/funding.json` | 239,971 | 72,800 (**74,602 on the wire**) | yes — **and it should not be** |
| `data/meta.json` | 3,437 | 1,385 | yes |
| `data/detail.json` | 1,461,490 | 466,600 (478,458 on the wire) | stage 2, after paint |

The single-file offline build (`dist-single/door3.html`) is unaffected by anything in this
document except §3 — fonts must be inlined as `data:` URIs there, which is why they are
subset (see §3.6).

### Dependency weight (esbuild `--bundle --minify --define:process.env.NODE_ENV='"production"'`, gzip -9)

| Package | minified | gzip |
|---|---:|---:|
| `preact` + `preact/hooks`, named imports | 13,046 | **5,406** |
| `preact/compat` (what `zustand` pulls in) | 25,265 | 9,716 |
| `preact-iso` — only `lazy` + `ErrorBoundary` + `LocationProvider` | — | **+2,218** over bare preact |
| `react@19.2.8` + `react-dom@19.2.8/client` | 193,246 | **60,021** |
| `motion` (`animate`) | 63,370 | 22,694 |
| `motion/mini` (`animate` + spring) | 7,832 | **3,114** |
| `motion/react` (`<motion.div>`) | 132,970 | 43,847 |
| `@radix-ui/react-dialog@1.1.23` | 53,174 | 17,794 |
| `@zag-js/dialog` + `@zag-js/preact` | 71,326 | 24,911 |
| `@floating-ui/dom` | 13,250 | 5,409 |

### Runtime, Chromium 141, 390×844, **4× CPU throttle** (Lighthouse's mobile default)

```
FCP                                 332 ms
DOMContentLoaded                    193 ms
load                                230 ms
search keystroke (7 in a row)       235, 69, 84, 68, 65, 67, 166 ms
"show 40 more" click                64–233 ms each; 8 clicks to 326 cards; 1,028 ms total
forced relayout @ 326 cards         0.3 ms
   …same, with content-visibility   0.7 ms   ← measurably worse
document height @ 326 cards         82,819 px
```

### Pure filter/search cost (Node 22, container; ×5 = conventional mid-range-Android factor)

```
buildCorpus (once, at load)                     17.8 ms   (~89 ms phone)
runPipeline, no filters                          0.26 ms
allFacetCounts, no query                         1.16 ms
runPipeline, q="mastering"                       0.88 ms
allFacetCounts, q="mastering"                    8.22 ms  ← the hot spot
FULL recompute with a query                      8.99 ms  (~45 ms phone)
```

`allFacetCounts` is 7× more expensive with a query than without, because it re-runs the text
search once per facet (11 facets, leave-one-out). That single fact drives §6.

### Platform support, verified in Chromium 141 (all `true`)

`document.startViewTransition` · `view-transition-name` · `dialog.showModal` · `popover` ·
`inert` · `text-wrap: balance` · `text-wrap: pretty` · `:has()` · `interpolate-size` ·
`transition-behavior: allow-discrete` · `@starting-style` · `animation-timeline: scroll()` ·
`anchor-name` · `field-sizing` · `Element.animate` · `font-variation-settings`

`preact/compat` verified to export `flushSync`, `memo`, `startTransition`, `useDeferredValue`,
`useSyncExternalStore`, `useTransition`, `useId` — and it is already in the bundle because
`zustand` imports it. Everything §4 and §6 need is already paid for.

### Deployment reality

- **The site is live**: `https://zizoux0.github.io/master/` returns 200, serving the build from
  2026-08-14T04:52:34Z off the `gh-pages` branch.
- GitHub Pages negotiates **gzip only** — verified by offering `br, zstd` and getting
  `content-encoding: gzip` back. `cache-control: max-age=600`.
- Workflow run 1 (04:50) failed at `actions/configure-pages@v5`:
  `Create Pages site failed. Error: Resource not accessible by integration`.
- Workflow run 2 (14:34) — after Pages became enabled — has a **green build job** including
  `configure-pages` and `upload-pages-artifact`, and a **deploy job that fails in 1 second with
  no step logs**. That signature means the Pages *source* is still "Deploy from a branch", so the
  `github-pages` environment refuses an Actions deployment.

---

## 1. Framework — stay on Preact

**Decision: stay.** Preact 10 + `preact/hooks` + Vite 7 + TypeScript, unchanged.

**Reason.** Three tests, all of which the incumbent passes:

1. *Bundle cost on a mid-range phone.* Preact is 5,406 B gzip; React 19 + react-dom/client is
   60,021 B. The delta (54.6 KB) is larger than the entire first-paint JS+CSS payload today
   (32.2 KB) and larger than `index.json` on the wire (42.5 KB). On a 400 kbit/s link that is
   ~1.1 s of first paint spent on a runtime whose distinguishing features — Suspense for data,
   concurrent rendering, server components — this app has no use for.
2. *Ecosystem access to good animation and interaction libraries.* This is the strongest
   pro-React argument and it does not survive contact with the measurements. The React-bound
   libraries you'd move for are `motion/react` (43.8 KB gzip) and Radix (17.8 KB). §4 and §5
   conclude that **neither should be used even if they were free**, because the platform now does
   both jobs better: View Transitions + `@starting-style` for motion, `<dialog>` for modality.
   You would migrate to gain access to libraries you have decided not to install.
   What *is* worth having is `motion/mini` at 3,114 B — and it is framework-agnostic, works with
   Preact today, and needs no migration.
3. *A working, tested app already exists.* 53 tests, all green, covering the correctness rules
   that gate the deploy (a cost-disputed record must never reach a "cheap" list; a confirmed live
   audition must never reach a "no audition" list). Those tests are the most valuable artefact in
   the repo. They test `src/data/*`, which is framework-free — so strictly speaking a migration
   would not delete them. But it would rewrite all 6 views, `store.ts`, `Filters.tsx`,
   `Layout.tsx` and `chips.tsx` — ~2,400 lines — with zero verification behind the rewrite, in
   service of a visual goal that none of it touches.

**Rejected, with reasons:**

- **React 19.** +54,615 B gzip. Would let you use `<motion.div>`, `useOptimistic`, and Radix —
  none of which appear in the design brief. Rejected on measured weight against zero visible gain.
- **Astro.** Genuinely good for content sites. Wrong here for two structural reasons: the app is
  an interactive single-page tool (six routes, shared filter state in a store, hash routing), so
  every island would need hydration and the shared store anyway; and Astro's routing assumes real
  URLs, which kills the `file://` single-file build that is a stated requirement
  (`vite-plugin-singlefile`, `dist-single/door3.html`, "runs off a USB stick").
- **SvelteKit.** Smallest runtime of the credible options and a genuinely nicer authoring model
  for transitions (`svelte/transition` is ~1 KB and excellent). Rejected because it is a total
  rewrite of every view for a delta that CSS + the VT API closes for free, and because the
  agent-maintainability constraint in DESIGN-ARCHITECTURE §6 still holds: Preact's API is React's,
  and a one-pass agent gets it right more often.
- **Next.js.** Wants a server or a static-export dance, adds a router that conflicts with hash
  routing, and its smallest possible client runtime is larger than this entire app.

**One free saving while you're here.** `preact-iso` costs +2,218 B gzip and the app uses three
things from it: `lazy`, `ErrorBoundary`, `LocationProvider`. `LocationProvider` is dead weight —
routing is done by `store.route` + a `hashchange` listener (`main.tsx:97`), and preact-iso's own
`Router` is explicitly not used because it can't do hash routing (`views/App.tsx:4`). `lazy` and
`ErrorBoundary` are ~30 lines each. **Dropping `preact-iso` saves 2.2 KB gzip for ~1 h of work.**
Optional; do it only if §8's byte budget is tight after fonts land.

**Migration cost: 0 hours.**

---

## 2. Styling — keep the hand-written CSS, reorganise it

**Decision: keep one hand-written CSS system.** Split `src/styles.css` (1,252 lines) into six
`@import`ed partials under `src/styles/` — `tokens.css`, `base.css`, `type.css`, `chrome.css`,
`chips.css`, `views.css` — and put a real token layer at the top. No preprocessor, no framework,
no build step beyond what Vite already does.

**Reason.** Read `src/styles.css` before deciding this and the conclusion is forced. It is not
generic CSS; it is a specified design system with a thesis:

- Dark is the *default* palette, light is the override, because the user reads this in bed
  (`styles.css:22–106`).
- One traffic light, and it belongs only to `verdict`. Cost uses a separate cool ramp, the gate
  uses a separate mono/square language. Colour meanings never collide.
- **Nothing relies on hue.** Every state also differs in fill density, border style and glyph, so
  the four verdict states survive greyscale: solid fill ✔ / tinted + left bar ! / outline ✕ /
  dashed outline ?. The `.notdegree` banner even carries a hatched `repeating-linear-gradient`
  edge so it reads as disqualified while scrolling.

That is a *point of view*. It is the opposite of AI-generated. The thing that reads as generic is
not the CSS architecture — it is the type (system stack, §3), the absence of motion (§4), and
uniform spacing rhythm. Replace the styling layer and you throw away the one asset that is already
distinctive.

**What to actually change inside it (this is craft work, not a stack change):**

1. `* { transition-duration: 100ms }` (line 127–129) is a bug. `transition-property` defaults to
   `all`, so every element transitions every property including layout ones. Delete it; see §4.
2. There is no spacing scale. Values are `4 6 8 10 12 14 16 20 28 32 40` px, ad hoc. Introduce
   `--s-1 … --s-8` on a 4px base with a modular jump, and use it everywhere. This one change is
   the single biggest "why does this look unconsidered" fix after type.
3. There is no type scale — sizes are `11 12 13 14 15 16 17 23 26` px, chosen individually.
   Replace with 6 named steps (`--t-micro` … `--t-display`) locked to a ratio, and `clamp()` the
   top two.
4. `--rule` is one hairline value used for 14 different jobs. Split into `--rule-hair`,
   `--rule-section`, `--rule-emphasis`.
5. Adopt `light-dark()` for the token block. Chromium 141 supports it; it collapses the three
   duplicated palette blocks (lines 22–106) into one.

**Rejected, with reasons:**

- **Tailwind v4. The templating risk is real here, and I want to be specific about why rather
  than hand-wave.** Tailwind does not *cause* generic design — plenty of distinctive sites use
  it. But it changes what is cheap and what is expensive, and this app's identity lives entirely
  in the expensive column. Three concrete conflicts:
  - The verdict system is *stateful, multi-signal, greyscale-safe* styling: `.vchip--cond` is
    `background: var(--amber-bg); border-color: var(--amber); border-left-width: 4px;
    border-radius: 3px 999px 999px 3px`. In Tailwind that is
    `bg-amber-50 border-amber-600 border-l-4 rounded-l-[3px] rounded-r-full` repeated at every
    call site, and the *semantic* fact ("conditional looks like this and nothing else may") stops
    being expressible in one place. You'd immediately reach for `@apply`, which is Tailwind
    telling you to write CSS.
  - Tailwind's defaults are opinionated defaults, and opinionated defaults with a large gravity
    well are exactly how a design converges on the median. The `rounded-lg / shadow-md /
    bg-gray-50 / text-sm` combination is a look, and it is *the* look the user is complaining
    about. Fighting a framework's defaults to avoid its house style is a worse position than not
    having a house style to fight.
  - It adds a build-time dependency and a class vocabulary for an app with ~15 components and one
    author, to solve a scaling problem (CSS growing unboundedly across a large team) that does
    not exist.
- **CSS Modules.** Solves name collisions. There are no name collisions — the BEM-ish naming
  (`.card__sentence--guess`) is already unambiguous, and a single global stylesheet is *easier*
  to keep coherent than 15 scoped ones when coherence is the goal. Would also break the
  single-file build's simplicity for no benefit.
- **vanilla-extract / Panda.** Both are excellent and both are type-safe. Both add a build step,
  a `.css.ts` authoring layer, and a bundle-time dependency to an app whose entire stylesheet is
  16 KB raw. The type safety would catch typos in token names — a problem you can also solve with
  `@property` declarations and a lint rule.
- **Style Dictionary.** A token pipeline is for shipping the same tokens to iOS, Android, Figma
  and web. Here there is one consumer. `:root { --x: … }` *is* the token pipeline.

**Migration cost: 2 hours** to split the file and introduce the scales. Zero risk — no behaviour
change, no test touched.

---

## 3. Typography — the highest-value item in this document

This matters more than everything above it combined. It is also where the app is currently
weakest, and the weakness is structural rather than a matter of taste.

### 3.1 What is wrong today

```css
--sans:  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--serif: "Iowan Old Style", Charter, Georgia, "Times New Roman", serif;
--mono:  ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
```

The app has a *serif voice* — `.thesis`, `.standfirst`, `.prose`, `.card__title`,
`.card__sentence`, `.empty` are all serif, and the serif carries the app's argument. That serif
resolves to **Iowan Old Style on iOS, Georgia on Windows, DejaVu Serif or Noto Serif on Android,
Times on old browsers.** Four different typefaces with different x-heights, different colour on
the page, different italics. The one voice the design leans on is undefined.

Same for mono, which carries every number in the product (`.funnel__n`, `.split__n`, `.num`,
`.cchip`, `.gchip`, `.footnote`): SF Mono / Consolas / Roboto Mono / DejaVu Sans Mono.

You cannot art-direct a typeface you do not control. This is the root of "it looks AI-generated"
far more than any layout decision.

### 3.2 Recommended typefaces — all open licence, none is Inter

Measured by subsetting the upstream variable source to **189 codepoints derived from the app's own
`index.json` + `meta.json`** (223 distinct characters found, of which 140 non-ASCII; Latin +
Latin-Extended kept, Greek and Cyrillic institution names deliberately left to the fallback),
`--layout-features=kern,liga,calt,tnum`, `--no-hinting`, `--flavor=woff2`.

| Face | Licence | Axes shipped | Subset woff2 | Where it belongs | Why this one |
|---|---|---|---:|---|---|
| **Literata** (TypeTogether) | OFL | `wght 400–700`, `opsz` pinned 14 | **28,148 B** | `.prose`, `.card__sentence`, `.standfirst`, `.empty`, verified prose on Record | Commissioned for Google Books; built for long screen reading. Sturdy, slightly slab-ish serifs with real warmth, x-height 0.507 em. Holds up at 14–17 px where Georgia gets watery and Times falls apart. This is the app's *reading* voice — the sentence of human reasoning on every card. |
| **Instrument Sans** (Instrument) | OFL | `wght 400–700`, `wdth` pinned 100 | **25,396 B** | chips, tab bar, buttons, `.field__label`, `.kicker`, UI chrome | Slightly condensed with high x-height (0.510) and tall caps (0.720) — space-efficient at 390 px, which matters when a chip row has five chips. Has genuine tension in the letterforms (the `a`, `g`, `t`) without being a novelty face. Ships `tnum`, `case`, and `ss01–ss12`. Not a Helvetica derivative, not a Grotesk clone, not Inter. |
| **JetBrains Mono** (JetBrains) | OFL | `wght` pinned 500 | **17,528 B** | every number: `.num`, `.funnel__n`, `.split__n`, `.cchip`, `.gchip`, `.footnote` | The numbers *are* the product — 398, 130, 249, €5k. JetBrains Mono has a taller x-height than any other free mono (0.550), which makes small tabular numerals legible at 11 px, and ships `zero` (slashed zero) plus `cv01–cv20` alternates. Its 0.600 em advance matches SF Mono and Roboto Mono almost exactly, which makes it the **lowest-risk swap in the set** (§3.5). |
| **Fraunces** (Undercase Type) — *optional 4th* | OFL | `wght 700`, `opsz` pinned 144, `SOFT`/`WONK` pinned | **14,548 B** static | `.thesis` only, and the three `.split__n` display numbers | This is where you spend character. Fraunces has an actual `WONK` axis that swaps in deliberately odd forms, and at display sizes it is unmistakable — nobody's default. Use it at ≥20 px only; it is mush below that. Ship it as a **single pinned weight**, `font-display: optional`, so it is a bonus and never a blocker. |

**Alternatives if the art direction lands elsewhere**, all measured the same way:

| Face | Subset | Character note |
|---|---:|---|
| Space Grotesk `wght 400–700` | 15,776 B | Cheapest with real personality. Quirky `g`/`a`/`t`; suits a "console / instrument" brief. Gets noisy in long label runs. |
| Public Sans `wght 350–800` | 18,200 B | USWDS. Plain but *not* Helvetica-derived, and honest about it. Good if the sans should recede entirely. |
| Newsreader `opsz` | 18,132 B | Alternative reading serif; more editorial, more contrast than Literata. Thinner strokes lose on dark backgrounds — a real problem given this app is dark-first. |
| Source Serif 4 | 19,396 B | Safe, warm, slightly anonymous. The "correct" choice if Literata reads too characterful. |
| Bricolage Grotesque | 35,796 B | Very high character, `opsz`+`wdth`+`wght`. Too much for body; a display-only candidate against Fraunces. |

**Recommended set and its cost:**

```
Literata          28,148 B   preload
Instrument Sans   25,396 B   preload
JetBrains Mono    17,528 B   no preload, swap
                  ────────
                  71,072 B   (+14,548 B if Fraunces display is taken → 85,620 B)
```

Set the byte budget in §8 at **90 KB total font**, which leaves headroom for an italic (see 3.7).

### 3.3 Formats — woff2 only, no fallbacks

Ship **woff2 and nothing else**. woff2 has been supported in every browser since 2016; a woff or
ttf fallback doubles the number of files, doubles the CI budget surface, and serves a population
that does not exist for this app (one user, a modern Android phone, plus a desktop). `@font-face`
with a single `src: url(...) format('woff2')` and no `local()` — `local()` is a
fingerprinting-adjacent footgun that can pick up a stale or wrong-metric locally-installed
version of the same family name.

### 3.4 Subsetting — build it as a script, not a one-off

The 189-codepoint number above is *derived from the data*, and the data will change. Make it a
build step, not a manual export.

`app/scripts/build-fonts.mjs` (run before `vite build`, output committed to `public/fonts/`):

```js
// 1. Union the character sets the app can actually render.
const sources = ['public/data/index.json', 'public/data/meta.json', 'public/data/detail.json'];
const chars = new Set(sources.flatMap((f) => [...readFileSync(f, 'utf8')]));

// 2. Keep Latin + Latin-Extended + the UI glyph set. Greek and Cyrillic institution names
//    (measured: they exist — 'ΑΒΔΕΚΜΠΣΤ', 'АВДЗИКМНОПСТФ') fall back to the system font
//    behind a unicode-range, which is correct: they are 9 records out of 398 and a
//    Greek-capable subset costs more than they are worth.
const UI_GLYPHS = '€£$—–…‘’“”·×→←↑↓≤≥±°%§†‡•¶✓✕▾▸◉≡⊘★';
const keep = [...chars].filter((c) => c.codePointAt(0) < 0x370).concat([...UI_GLYPHS]);

// 3. Clip the variable axes to what the CSS actually uses, THEN subset.
//    Measured: this is where the bytes are. Literata unclipped = 101,568 B;
//    with opsz pinned at 14 and wght clipped to 400–700 = 28,148 B. A 72% saving.
//    fonttools varLib.instancer <src> wght=400:700 opsz=14 -o clipped.ttf
//    pyftsubset clipped.ttf --unicodes-file=… --flavor=woff2 \
//      --layout-features=kern,liga,calt,tnum --no-hinting --drop-tables+=DSIG
```

Two things that will surprise whoever writes this:

- **Axis clipping is worth more than glyph subsetting.** Literata with all axes and 189
  codepoints is 101,568 B. Pin `opsz` and clip `wght` and it is 28,148 B. Fraunces goes
  107,348 → 29,112 B; Bricolage 126,592 → 35,796 B. Always instance first.
- **The feature list costs real bytes.** `onum`, `frac`, `ss01–ss03`, `zero`, `case` pull in
  alternate glyph sets. Literata is 28,148 B with `kern,liga,calt,tnum` and 33,372 B with the
  rich set — an 18% tax for features the design does not currently use. Start lean; add a feature
  only when a rule in `styles.css` actually turns it on.

### 3.5 Zero layout shift — the metric-override table

`font-display: swap` gives FOUT, which is correct: text is readable immediately and the shift is
the only cost. The shift is then eliminated by declaring a **metric-matched fallback `@font-face`**
so the fallback occupies the same space as the real font.

I computed the overrides by measuring the mean advance width over a representative string from
this app's own content — `"Master's in Music Production, Berlin — €4,500/yr · not verified ·
398 programmes"` — in each candidate and in the two fallbacks that actually get used
(Roboto = Android default, Arimo = Arial metrics = the desktop/iOS case).

Reference: Roboto avg advance 0.4446 em, asc 0.928, desc −0.244, x-height 0.528.
Arimo avg advance 0.4477 em, x-height 0.528.

| Webfont | avg adv | x-height | cap | `size-adjust` vs Roboto | vs Arial | `ascent-override` | `descent-override` |
|---|---:|---:|---:|---:|---:|---:|---:|
| Literata | 0.4832 | 0.507 | 0.700 | **92.0%** | 92.6% | 127.9% | 33.5% |
| Fraunces | 0.5264 | 0.482 | 0.700 | **84.5%** | 85.0% | 115.8% | 30.2% |
| Instrument Sans | 0.4577 | 0.510 | 0.720 | **97.1%** | 97.8% | 99.9% | 25.7% |
| Public Sans | 0.4562 | 0.517 | 0.723 | 97.4% | 98.1% | 97.5% | 23.1% |
| Space Grotesk | 0.4819 | 0.486 | 0.700 | 92.3% | 92.9% | 106.7% | 31.7% |
| JetBrains Mono | 0.6000 | 0.550 | 0.730 | **74.1%** | 74.6% | 137.7% | 40.5% |

Note the shape of these numbers: **Instrument Sans is within 3% of Roboto** — the sans swap will
be almost invisible even without overrides. **Literata is 8% off** — noticeable, worth overriding.
**JetBrains Mono looks alarming at 74%**, but that is comparing a monospace against a proportional
fallback; against `ui-monospace` (SF Mono / Roboto Mono, both 0.600 em advance) it is a 1:1 match,
which is why mono is the safe one to leave on plain `swap`.

### 3.6 The loading code pattern

`src/styles/fonts.css`, imported first:

```css
/* ── Real faces ─────────────────────────────────────────────────────────── */

@font-face {
  font-family: 'Literata';
  src: url('/master/fonts/literata-400-700.woff2') format('woff2');
  font-weight: 400 700;          /* variable range, matching the axis clip */
  font-style: normal;
  font-display: swap;            /* FOUT, not FOIT — text is readable at 0 ms */
  unicode-range: U+0000-024F, U+0259, U+1E00-1EFF, U+2000-206F, U+20A0-20BF, U+2190-2193, U+2713, U+2715;
}

@font-face {
  font-family: 'Instrument Sans';
  src: url('/master/fonts/instrument-sans-400-700.woff2') format('woff2');
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-024F, U+0259, U+1E00-1EFF, U+2000-206F, U+20A0-20BF, U+2190-2193, U+2713, U+2715;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/master/fonts/jetbrains-mono-500.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-024F, U+2000-206F, U+20A0-20BF;
}

/* Display face is a bonus, never a blocker: if it is not there in ~100 ms, don't use it at all. */
@font-face {
  font-family: 'Fraunces';
  src: url('/master/fonts/fraunces-700-display.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: optional;
  unicode-range: U+0000-024F, U+2000-206F, U+20A0-20BF;
}

/* ── Metric-matched fallbacks: this is what removes the layout shift ─────── */

@font-face {
  font-family: 'Literata Fallback';
  src: local('Roboto'), local('Arial'), local('Helvetica Neue');
  size-adjust: 92.0%;
  ascent-override: 127.9%;
  descent-override: 33.5%;
  line-gap-override: 0%;
}

@font-face {
  font-family: 'Instrument Fallback';
  src: local('Roboto'), local('Arial'), local('Helvetica Neue');
  size-adjust: 97.1%;
  ascent-override: 99.9%;
  descent-override: 25.7%;
  line-gap-override: 0%;
}

/* ── Tokens ─────────────────────────────────────────────────────────────── */

:root {
  --sans:    'Instrument Sans', 'Instrument Fallback', system-ui, sans-serif;
  --serif:   'Literata', 'Literata Fallback', Georgia, serif;
  --mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --display: 'Fraunces', 'Literata', 'Literata Fallback', Georgia, serif;

  /* Never synthesise. A faux-bold serif is the single most "unconsidered" thing a page can do,
     and the variable range covers 400–700 for real. */
  font-synthesis: none;
}
```

`index.html` — preload **only** the two faces that set the page's texture, with `crossorigin`
(required even same-origin for fonts, or the preload is discarded and fetched twice):

```html
<link rel="preload" as="font" type="font/woff2" crossorigin
      href="/master/fonts/instrument-sans-400-700.woff2" />
<link rel="preload" as="font" type="font/woff2" crossorigin
      href="/master/fonts/literata-400-700.woff2" />
```

Do **not** preload the mono (it is below the fold on Start and metric-safe) and do **not**
preload Fraunces (`font-display: optional` means a preload would be wasted bandwidth on a slow
connection, which is exactly the connection you are optimising for).

**For the single-file `door3.html` build**, add a Vite plugin alongside the existing
`inlineData()` in `vite.config.ts` that rewrites each `src: url(...)` to a `data:font/woff2;base64,…`
URI. Base64 costs +33%, so the recommended 71 KB set becomes ~95 KB inside the HTML file — against
a file that is already 2.05 MB by design. Drop Fraunces from the offline build if the budget bites.

### 3.7 FOUT vs FOIT, stated plainly

- `font-display: block` (FOIT) hides text for up to 3 s. On the slow connection this app is
  designed for, that is a blank screen showing nothing — strictly worse than the wrong font.
  **Never use it.**
- `font-display: swap` (FOUT) shows fallback text immediately and swaps. The only cost is the
  reflow, and §3.5 removes the reflow. **Use this for the three working faces.**
- `font-display: optional` gives the font ~100 ms; if it misses, the fallback is used for the
  whole page load and there is *never* a swap. Perfect for a display face where a late swap on a
  40 px headline is the most jarring possible flash. **Use this for Fraunces.**
- `font-display: auto` is `block` in every engine. Never leave it unset.

**One italic caveat.** `.card__sentence`, `.field--unverified .field__value` and `.empty em` are
italic serif. Literata's italic is a **separate file** (variable fonts do not interpolate to
italic). Either budget a second ~26 KB face, or — better for craft *and* bytes — restyle those
two cases to use weight, colour and a rule instead of italic. The unverified field already carries
a dotted amber underline; the italic is redundant emphasis. Recommend dropping serif italic
entirely and putting the ~26 KB into Fraunces instead.

**Migration cost: 6–8 hours** — build-fonts script (2 h), the `@font-face` layer and token
rewiring (2 h), the single-file inlining plugin (1–2 h), CI budget wiring (1 h), visual pass over
every view to re-tune sizes for the new metrics (1–2 h). This is the highest craft-per-hour work
in the document.

---

## 4. Motion — the platform, not a library

**Decision: CSS transitions and keyframes for state, the same-document View Transitions API for
route changes, WAAPI (`Element.animate`) only for the one gesture that needs it (sheet drag). No
animation library. `motion/mini` (3,114 B gzip) is the escape hatch if a spring is genuinely
wanted and CSS `linear()` easing proves insufficient.**

**Reason.** Every platform feature this needs is verified present in Chromium 141:
`document.startViewTransition`, `@starting-style`, `transition-behavior: allow-discrete`,
`interpolate-size: allow-keywords`, `animation-timeline: scroll()`, `Element.animate`. A library
would be paying 22.7 KB (`motion`) or 43.8 KB (`motion/react`) to reimplement what ships in the
browser.

### 4.1 Delete the blanket transition first

```css
/* styles.css:126–129 — this is a bug, not a motion system */
* { transition-duration: 100ms; }
```

`transition-property` defaults to `all`. This transitions *every* property on *every* element,
including `width`, `height`, `top` and `padding` — layout properties that force reflow on every
frame. It is also why nothing in the app feels intentional: everything moves the same amount, in
the same time, with the same (linear-ish) curve, which reads as "no one chose this".

Replace with an explicit motion vocabulary in `tokens.css`:

```css
:root {
  /* Three durations, and they mean things. */
  --dur-tap:   90ms;   /* a control acknowledging a press */
  --dur-move:  180ms;  /* something changing place or state */
  --dur-enter: 260ms;  /* something arriving that was not there */

  /* Two curves. Ease-out for arrivals, a slight overshoot for the sheet only. */
  --ease-out:  cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-snap: linear(0, 0.32 8%, 0.72 20%, 0.98 35%, 1.05 50%, 1.01 70%, 1);
}

/* Then, per component, only the properties that should move: */
.opt        { transition: background-color var(--dur-tap) var(--ease-out),
                          border-color     var(--dur-tap) var(--ease-out); }
.card       { transition: background-color var(--dur-tap) var(--ease-out); }
.bigbtn     { transition: border-color var(--dur-move) var(--ease-out),
                          transform    var(--dur-tap)  var(--ease-out); }
.bigbtn:active { transform: scale(0.985); }
```

### 4.2 The sheet, in CSS only

`@starting-style` + `transition-behavior: allow-discrete` animate an element in and out of
`display: none` with no JavaScript at all — which is what makes §5's `<dialog>` recommendation
free:

```css
dialog.sheet {
  transform: translateY(0);
  opacity: 1;
  transition: transform var(--dur-enter) var(--ease-snap),
              opacity   var(--dur-move)  var(--ease-out),
              overlay   var(--dur-enter) allow-discrete,
              display   var(--dur-enter) allow-discrete;
}
dialog.sheet:not([open])          { transform: translateY(100%); opacity: 0; }
@starting-style { dialog.sheet[open] { transform: translateY(100%); opacity: 0; } }

dialog.sheet::backdrop {
  background: rgb(0 0 0 / 0.55);
  transition: opacity var(--dur-move) var(--ease-out),
              overlay var(--dur-move) allow-discrete,
              display var(--dur-move) allow-discrete;
}
dialog.sheet:not([open])::backdrop     { opacity: 0; }
@starting-style { dialog.sheet[open]::backdrop { opacity: 0; } }
```

On the 700 px breakpoint the sheet becomes a right-hand rail — change the transform to
`translateX(100%)` inside the existing media query and the same rules apply.

### 4.3 View Transitions with hash routing — yes, usable

The distinction that matters: the **cross-document** form (`@view-transition { navigation: auto }`)
requires a real document navigation and does **not** apply to hash routing. The **same-document**
form — `document.startViewTransition(callback)` — has nothing to do with navigation type. It
snapshots the DOM, runs your callback, snapshots again, and cross-fades. Hash routing is a
same-document DOM swap, so it is exactly the intended use.

One Preact-specific wrinkle: the callback must update the DOM **synchronously**, and Preact
batches state updates. `preact/compat` exports `flushSync` (verified present, and compat is
already in the bundle because `zustand` imports it).

In `store.ts`, wrap `navigate`:

```ts
import { flushSync } from 'preact/compat';

const reduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function withViewTransition(update: () => void): void {
  // Fallback is the plain update — never a polyfill, never a shim.
  if (typeof document === 'undefined' || !document.startViewTransition || reduced()) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

navigate(to, replace = false) {
  const hash = to.startsWith('#') ? to : '#' + (to.startsWith('/') ? to : '/' + to);
  withViewTransition(() => {
    if (replace) history.replaceState(null, '', location.pathname + location.search + hash);
    else location.hash = hash;
    set({ route: parseHash(hash) });
  });
}
```

**Important:** `Programmes.tsx` calls `navigate(..., true)` on **every search keystroke**
(`views/Programmes.tsx:193`). Do **not** run a view transition on that path — it would snapshot
the page 7 times while typing. Gate it: only transition when `parseHash(hash).path` differs from
the current `route.path`. Filter changes within `/list` should not transition; list → record
should.

The payoff is the one motion that actually communicates something in this app: give
`.card__title` a `view-transition-name` derived from the record key, and the card title
physically travels into the record page's heading. That is a real spatial relationship between
two screens, not decoration.

```css
/* set inline per card: style="view-transition-name: t-<key>" — names must be unique per snapshot */
::view-transition-old(root), ::view-transition-new(root) { animation-duration: var(--dur-enter); }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
    animation: none !important;
  }
}
```

**Fallback for non-supporting browsers:** the feature detect above. There is no polyfill and none
should be added — the app is fully usable without any transition, which is the definition of
progressive enhancement done right.

### 4.4 `prefers-reduced-motion`

The current blanket override (`styles.css:1247–1252`) is directionally right but too blunt now
that there will be real motion. Replace with:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

`1ms` rather than `0ms` because `transitionend` listeners still fire — a `0ms` transition silently
breaks any code waiting on completion. Plus the JS gate in `withViewTransition`, plus honour it in
any `Element.animate` call.

**Rejected, with reasons:**

- **`motion` (full)** — 22,694 B gzip for `animate()`. That is 70% of the entire current
  first-paint JS payload, for a handful of transitions CSS does natively.
- **`motion/react`** — 43,847 B, and requires `preact/compat` for `<motion.div>`. Absurd here.
- **`motion/mini`** — 3,114 B, genuinely reasonable. Still rejected as a *default* because
  everything it offers (spring physics) is now approximable with CSS `linear()` easing, which is
  what `--ease-snap` above is. Keep it as a named fallback: if the sheet's drag-to-dismiss ends up
  needing real velocity-aware springs, 3.1 KB is a fair price and it does not require a framework
  change. Do not install it speculatively.
- **GSAP** — licensing complexity and ~30 KB+ for a six-screen app.
- **WAAPI for everything** — `Element.animate` is the right tool for imperative,
  interruption-aware, velocity-driven motion (the sheet drag). It is verbose and stateful for
  declarative state changes, which CSS does better. Use both, each where it wins.

**Migration cost: 5–7 hours** — deleting the blanket rule and writing the motion tokens (1 h),
sheet enter/exit (1 h), view transitions plumbing incl. the keystroke gate (2–3 h), reduced-motion
audit (1 h), the card-title → record-title shared element (1 h).

---

## 5. Components — native `<dialog>`, hand-rolled, no headless library

**Decision: build the primitives by hand, on top of `<dialog>` and `<details>`. No Radix, no Ark,
no Base UI, no Melt.**

**Reason.** I measured the current filter sheet's accessibility in a real browser rather than
reading the markup. Results:

| Check | Result |
|---|---|
| Sheet is a native `<dialog>` | **No** — a `<div role="dialog" aria-modal="true">` |
| Focus moves into the sheet on open | **No** — `document.activeElement` stays `BODY` |
| Background is `inert` | **No** |
| Escape closes it | **No** |
| Background scroll is locked | **No** — `body` overflow is `hidden auto` |

Plus, from reading `components/Filters.tsx`: the scrim is a bare `<button class="sheet__scrim">`
with no content (a screen-reader-focusable empty button that precedes the dialog in DOM order);
`Section`'s `aria-expanded` has no `aria-controls`; and `Programmes.tsx:226` puts
`aria-live="polite"` on the result count, which re-announces "95 programmes" on **every
keystroke** — measured 7 announcements while typing "mastering".

These are exactly the bugs the "just hand-roll it" approach ships. So the argument for Radix looks
strong — until you notice that **every one of them is fixed by using the right element.**

`<dialog>.showModal()` provides, natively, in Chromium 141 (all verified present):

- promotion to the **top layer** — no `z-index: 51` arms race with the sticky `.topbar`,
  `.listbar` and `.tabs`
- `::backdrop` — replaces the fake `.sheet__scrim` button entirely
- **initial focus** into the dialog, and **focus return** to the invoker on close
- **focus containment** — Tab cannot escape into the page behind
- the rest of the document made **inert** — screen readers cannot reach it either
- **Escape to close**, firing `cancel` then `close`
- and, with §4.2's `@starting-style` rules, animated enter *and* exit with no JS

The remaining work is genuinely small:

```tsx
// components/Sheet.tsx — the whole primitive, ~50 lines
export function Sheet(p: { open: boolean; onClose: () => void; label: string; children: any }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p.open && !d.open) d.showModal();
    if (!p.open && d.open) d.close();
  }, [p.open]);
  return (
    <dialog
      ref={ref}
      class="sheet"
      aria-label={p.label}
      onClose={p.onClose}                                     // Escape + close() both land here
      onClick={(e) => { if (e.target === ref.current) p.onClose(); }}  // backdrop click
    >
      {p.children}
    </dialog>
  );
}
```

Body scroll lock is the one thing `<dialog>` does not do. Two lines:
`document.body.style.overflow = open ? 'hidden' : ''` — or, better and shift-free,
`overflow: clip` on `:root:has(dialog[open])`, which needs no JS at all and cannot leak state
(`:has()` verified supported).

For the disclosure sections inside the sheet, use `<details>` / `<summary>` rather than the
current `<button aria-expanded>` + conditional render. It gives correct semantics for free, works
without JS, is find-in-page-able, and with `interpolate-size: allow-keywords` (verified supported)
it can animate `height: 0 → auto` in pure CSS — something the current implementation cannot do at
all because it unmounts the children.

**Rejected, with reasons and measured costs:**

- **Radix (`@radix-ui/react-dialog`, 17,794 B gzip).** Real cost is higher: it is React-only, so
  it forces `preact/compat` (9,716 B, currently pulled in only by zustand) onto the critical
  path with full weight rather than tree-shaken. Roughly **+20 KB gzip on a 32 KB payload** to
  reimplement, in JavaScript, focus trapping and inertness that `showModal()` does in C++.
  Radix is the right answer when you must support a design that the native element cannot express
  (non-modal popovers with complex positioning, comboboxes, multi-level menus). This app has one
  dialog and one disclosure.
- **Ark / Zag (`@zag-js/dialog` + `@zag-js/preact`, 24,911 B gzip).** Framework-agnostic, which
  is philosophically the right shape, but it is the most expensive option measured and the state
  machine's value grows with component complexity this app does not have.
- **Base UI.** React-only, and its dialog is a similar-weight reimplementation of `<dialog>`.
- **Melt.** Svelte-only. Not available without §1's rejected migration.
- **Hand-rolling *without* `<dialog>`.** This is the current state and it is measurably broken in
  four ways. The lesson is not "don't hand-roll", it is "hand-rolling means using the platform's
  primitive, not reimplementing it in a `div`".

**One thing worth adding: `@floating-ui/dom` (5,409 B gzip)** — but only if the redesign
introduces a tooltip or an anchored popover that CSS anchor positioning cannot handle.
`anchor-name` is verified supported in Chromium 141, so try CSS first and install Floating UI only
if a real positioning bug appears.

**Also fix while here** (each is minutes, all are real bugs):
- Move `aria-live="polite"` off the result count and onto a visually-hidden region updated on a
  400 ms debounce, so typing announces once, not seven times.
- Delete `.sheet__scrim`; `::backdrop` replaces it.
- Add `aria-controls` to `Section`'s trigger, or replace it with `<details>` and drop the ARIA.
- `ThemeButton` (`Layout.tsx:52`) forces a re-render with `useStore.setState({})` — a state write
  used as a repaint hack. Put `theme` in the store properly.

**Migration cost: 4–5 hours.**

---

## 6. Data and rendering — no virtualisation, three concrete speed fixes

**Decision: no virtualisation. Keep the index/detail split exactly as it is. Do three specific
things that will visibly change how fast the app feels.**

### 6.1 Virtualisation: measured, not needed

Rendering all 326 deduplicated cards produces an 82,819 px document. Forced relayout of that
document: **0.3 ms**. Virtualisation would break in-page find, scroll restoration and the
`Show N more` count, to optimise something already three orders of magnitude below the frame
budget. **Do not add it.** The DESIGN-ARCHITECTURE §6 rejection of `@tanstack/react-virtual`
holds and is confirmed.

**However** — DESIGN-ARCHITECTURE §6 also *recommends* `content-visibility: auto` +
`contain-intrinsic-size` as the zero-cost alternative. I measured that too: applying it to all
326 cards moved forced relayout from **0.3 ms → 0.7 ms**. It is not a win here; the cards are
cheap enough that the containment bookkeeping costs more than the skipped layout. It also
interacts badly with the View Transitions in §4 (an off-screen card with skipped rendering has no
snapshot). **Do not add it either.** It is also, notably, not currently in `styles.css` — so the
architecture document describes an optimisation that was never implemented and would not have
helped.

### 6.2 Fix 1 — take `funding.json` off the critical path (biggest single win, ~1 h)

`loadFirst()` (`src/data/load.ts:58`) fetches `index.json`, `funding.json` and `meta.json` in
parallel and does not resolve until all three land. `funding.json` is **74,602 B on the wire** —
**more than twice the entire JS+CSS payload** — and it blocks `status: 'ready'`, i.e. it blocks
the app rendering anything but "Loading 398 programmes…".

Who uses it? `views/Money.tsx` (a lazy route), and `views/Start.tsx:216` for the single number
`funding.length`.

The fix: put `fundingCount` into `meta.json` (it is generated by `scripts/build-data.mjs`
anyway), have `Start` read that, and move `funding.json` into a third load stage triggered by the
Money route — or prefetched idly after `detail.json` lands. **74.6 KB off first render for one
line of build-script change.**

### 6.3 Fix 2 — cache the query match set across facet passes (~2 h)

Measured: `allFacetCounts` costs **1.16 ms with no query and 8.22 ms with one** — a 7× jump,
because the leave-one-out algorithm re-runs the full-text scan once per facet, 11 times, over the
same query and the same corpus.

The full recompute on a keystroke is 8.99 ms in the container ≈ **45 ms on a mid-range phone**,
and it runs synchronously inside the input handler on every character.

The fix is not a stack change; it is one cache. Compute the text-match set (and scores) **once per
query string** in `recompute()`, and pass it into both `runPipeline` and all 11 facet passes so
the scan never repeats. Expected: 8.99 ms → ~1.5 ms, i.e. ~45 ms → ~8 ms per keystroke on the
phone. This is the difference between a search box that lags and one that does not.

Guard it with a test: the existing `src/data/__tests__/search.test.ts` and `filters.test.ts`
already assert the counts, so a cache that changes a number fails CI. This is why the 53 tests are
worth more than any framework.

### 6.4 Fix 3 — memoise `Card` and stop writing the URL on every keystroke (~1–2 h)

Measured: a `Show 40 more` click costs **64–233 ms at 4× throttle**, and that click touches no
store state at all (`setShown` is local). All of that is Preact re-diffing every card in the list,
because `page.map(...)` produces new elements for all 326 on each render.

Two fixes:

- Wrap `Card` in `memo` from `preact/compat` (already in the bundle) keyed on `row.key` and the
  sentence. Unchanged rows then skip diffing entirely.
- `Programmes.tsx:187–194` calls `setFilters` **and** `navigate(..., true)` on every keystroke.
  Keep the filter update immediate (the count must track typing) but debounce the
  `history.replaceState` by ~300 ms. Writing history 9 times while typing "mastering" is both
  wasted work and a polluted back stack.
- Consider `useDeferredValue` (verified present in `preact/compat`) on the query passed to the
  card list, so the input and the count stay at 60 fps while the list catches up.

### 6.5 Is the index/detail split still right?

Yes, and it is the best decision in the architecture document. `detail.json` is 478,458 B on the
wire and holds nine prose fields that account for 59% of the data and appear on zero list cards.
Deferring it is what makes FCP 332 ms. Keep it exactly as is.

Two smaller notes:
- `buildCorpus` costs 17.8 ms container ≈ 89 ms phone and runs **twice** (once on `loadFirst`,
  again when `detail.json` lands — `store.ts:260` and `:285`). The second run is necessary; the
  first is over a corpus without prose. Skip the first build entirely and let full-text search be
  unavailable for the ~1 s until detail lands; the UI already models `detailStatus`.
- Nothing here needs IndexedDB, a service worker, or a Web Worker. The one CPU-bound operation is
  now ~8 ms.

**Migration cost: 4–6 hours total for all three fixes.** Highest perceived-speed return per hour
in the document, and none of it touches the framework.

---

## 7. Deployment — you already have a real URL; one setting is wrong

**The premise in the brief is out of date.** Pages *is* enabled, and the app is live right now:

```
$ curl -sI https://zizoux0.github.io/master/
HTTP/2 200
last-modified: Fri, 14 Aug 2026 04:52:34 GMT
cache-control: max-age=600
```

It is serving the build that a previous agent pushed to a **`gh-pages` branch** at 04:52, and the
legacy `pages build and deployment` workflow deployed it successfully. What is broken is
different from what the brief says:

- Run 1 (04:50) failed exactly as described: `actions/configure-pages@v5` →
  `Create Pages site failed. Error: Resource not accessible by integration`. The workflow's
  `GITHUB_TOKEN` is not permitted to *create* a Pages site, no matter what `permissions:` says.
  That is a repository-settings action, not a token action.
- Run 2 (14:34, after Pages existed) has a **fully green build job** — `configure-pages` now
  succeeds, `upload-pages-artifact` succeeds — and a **deploy job that fails in 1 second with no
  step logs at all**. That signature is the `github-pages` environment refusing the deployment
  because the Pages **source** is still *Deploy from a branch (`gh-pages`)*, not *GitHub Actions*.

### Recommended: option A — flip one setting (0.5 h, one click)

**What the user must click, exactly:**

1. Go to `https://github.com/ZizouX0/master/settings/pages`
2. Under **Build and deployment → Source**, change **Deploy from a branch** to **GitHub Actions**.
3. That is the only click. Then re-run the workflow (or push).

Then, in the repo:
- Delete `enablement: true` from `.github/workflows/deploy-app.yml` — it is what made run 1 fail
  and it is now useless. Better still, delete the `actions/configure-pages` step entirely; it only
  exists to *set* `base_path`, and `vite.config.ts` already hardcodes `base: '/master/'`.
- Delete the stale `gh-pages` branch, so there is one source of truth.

This is the most robust path *because it is the one the repo is already 95% configured for*: the
build job is green, the artifact uploads, the tests gate the deploy. One setting stands between it
and working.

### Fallback: option B — zero clicks (1 h)

If the user cannot or will not touch settings, keep branch-based deployment, which is **proven to
work on this repo right now**. Replace the `configure-pages`/`upload-pages-artifact`/`deploy-pages`
trio with a push to `gh-pages`:

```yaml
      - name: Publish to gh-pages
        run: |
          cd dist
          git init -q && git checkout -qb gh-pages
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -A && git commit -qm "Deploy ${GITHUB_SHA::7}"
          git push -f "https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}.git" gh-pages
```

`permissions: contents: write` (drop `pages`/`id-token`). No environment, no deploy job, no
settings dependency. Slightly less elegant, entirely reliable, and it is what is producing the
live site today.

**Take option A. Fall back to B if the click doesn't happen within a day.**

### Alternatives, with honest setup friction

| Host | Setup friction | What you gain | Verdict |
|---|---|---|---|
| **GitHub Pages** (current) | Zero new accounts. One settings click, or zero with option B. | Already live. Tests gate the deploy. | **Keep as primary.** |
| **Cloudflare Pages** | Create a Cloudflare account, authorise the GitHub app against the repo, pick build command `cd app && npm ci && npm run build` and output `app/dist`. ~15 min, and it needs the user's hands (OAuth cannot be scripted). | **Brotli.** `detail.json` goes from 478 KB to ~355 KB — a 26% cut on the largest payload — plus better edge caching and a `_headers` file for real cache-control (Pages is stuck at `max-age=600`). Free tier is generous. | **Worth doing later**, once the design work lands. Not the unblocking move today. |
| **Netlify** | Same shape: account, GitHub authorisation, build settings. ~15 min. Also needs a `netlify.toml` and a base-path change (`base: '/'` instead of `'/master/'`), which touches `vite.config.ts` and the fetch paths in `load.ts`. | Brotli, `_headers`, deploy previews per branch. | Slightly more friction than Cloudflare for identical benefit. Pick Cloudflare if moving. |

The brotli saving is real but it is a *loading* improvement, and `detail.json` already loads after
first paint. The craft problem is not that `detail.json` takes 1.2 s in the background. Don't spend
the user's attention on a host migration before §3 and §6 are done.

**One more thing to fix in the workflow regardless:** the artifact deploys `app/dist` but the
release-tag job promised in DESIGN-ARCHITECTURE §8.5 (attaching `dist-single/door3.html` to a
GitHub Release) does not exist. The offline USB build is a stated requirement with no delivery
path. Add it — `npm run build:single` on tag push, `softprops/action-gh-release` with
`app/dist-single/door3.html`. ~30 min.

**Migration cost: 0.5 h (option A) or 1 h (option B), plus 0.5 h for the release job.**

---

## 8. Quality gates — add exactly two

The rule is "recommend only what will actually be maintained". A gate that fails for reasons
nobody understands gets `continue-on-error: true` within two weeks and is then worse than nothing.

### Keep (already working, already gating the deploy)

```yaml
- run: npm test        # 53 tests, 1.24 s — these encode the correctness rules
- run: npm run typecheck
```

These are good and they already block deployment. Leave them exactly as they are.

### Add 1 — a hard byte budget (~1 h, will never rot)

The single most likely regression after §3 is font and bundle weight creeping. No dashboard, no
`size-limit` dependency, no config file — a script that reads the build output and exits non-zero:

```js
// app/scripts/check-budget.mjs — run after `npm run build`
const BUDGET = {
  'first-paint JS+CSS (gzip)':      34_000,  // measured today: 32,247
  'total fonts (raw woff2)':        90_000,  // §3 recommends 71,072
  'largest lazy route (gzip)':       9_000,  // measured today: 6,688 (Record)
  'critical-path JSON (gzip)':      45_000,  // after §6.2 removes funding.json: ~42,400
};
```

Fails loudly, names the number that moved, needs no maintenance. Add it as a workflow step after
`npm run build`.

### Add 2 — axe over the six routes, reusing the CDP harness (~2 h)

`app/verify/cdp.mjs` already exists and already drives headless Chromium at 390×844. Adding
accessibility checking is ~40 lines: add `axe-core` as a devDependency, `Runtime.evaluate` its
source into the page, run `axe.run()` on each of `/`, `/list`, `/p/1`, `/money`, `/rejects`,
`/me`, plus one run with the filter sheet open, and fail on any `serious` or `critical` violation.

This is worth doing specifically because §5 documents four measured a11y failures in one
component. Without a gate, the next hand-rolled control ships the same four. With it, the
`<dialog>` rewrite is verified rather than asserted.

Also add the four checks I ran by hand as explicit assertions, since axe cannot see them:
focus enters the sheet on open, focus returns on close, Escape closes it, background is inert.

### Rejected, with reasons

- **Lighthouse CI with budgets.** Tempting, and the LHCI budget format is nice. Rejected on
  maintenance: it needs a Chrome install pinned in CI, a config file, and a server to run against;
  its performance score is noisy on shared runners (±8 points run to run is normal), so the budget
  must be set loose enough to be meaningless or tight enough to flake. The two things Lighthouse
  would catch that matter here — bundle weight and CLS from font swapping — are caught
  deterministically by the byte budget and by the metric overrides in §3.5. If you want the CLS
  number, assert it directly over CDP with a `PerformanceObserver` for `layout-shift`; that is 10
  lines and it does not flake.
- **Visual regression (Percy / Chromatic / screenshot diffing).** Actively harmful right now. The
  entire point of the next two weeks is that every screen changes. A tool whose output is
  "1,847 pixels changed" on every commit trains everyone to approve without looking, which is
  worse than no tool. Revisit in two months, once the design has stabilised and a diff means
  something. Note that `verify/shots.mjs` already captures screenshots — keep those as *artefacts
  for human review*, not as a pass/fail gate.
- **ESLint + a11y plugin.** `eslint-plugin-jsx-a11y` would have caught none of the four measured
  bugs (they are all runtime focus-management behaviour, not static markup). Adding ESLint means
  adding a config, a preact preset, and a round of rule bikeshedding for near-zero marginal
  catch over `tsc --noEmit` on a codebase this consistent. Skip.
- **Bundle-analysis dashboards** (`rollup-plugin-visualizer` etc.). Useful for a human once,
  during §1's `preact-iso` question. Not a gate. Run it ad hoc; do not wire it into CI.

**Migration cost: 3 hours.**

---

## Build order for the rebuild agents

Sequenced so that each stage is independently shippable and nothing blocks on a decision that has
not been made yet. The token and type work comes first because every subsequent visual decision
depends on it.

### Stage 0 — unblock and baseline (1 h, do this first, one agent)
1. Flip Pages source to **GitHub Actions** (§7 option A) or land the `gh-pages` push (option B).
2. Remove `enablement: true` / the `configure-pages` step; delete the stale `gh-pages` branch if
   taking option A.
3. Land `scripts/check-budget.mjs` with **today's** numbers as the baseline (§8). Everything
   after this is measured against a committed number rather than a memory.

### Stage 1 — the foundation (8–10 h, one agent, must complete before Stage 3)
4. Split `styles.css` into `src/styles/{tokens,base,type,chrome,chips,views}.css` (§2). No visual
   change; commit separately so the diff is reviewable.
5. Add the spacing scale, the type scale, the split rule tokens, and the motion tokens (§2, §4.1).
   **Delete `* { transition-duration: 100ms }`.**
6. Write `scripts/build-fonts.mjs` (§3.4): derive the codepoint set from the data, instance the
   axes, subset, emit woff2 to `public/fonts/`. Commit the outputs.
7. Land `src/styles/fonts.css` with the `@font-face` blocks, the metric-matched fallbacks from the
   §3.5 table, and the preloads in `index.html`. Add `font-synthesis: none`.
8. Add the data-URI inlining plugin to `vite.config.ts` for the single-file build (§3.6).
9. Re-tune every size in `type.css` against the new metrics. Drop serif italic (§3.7).

### Stage 2 — speed, in parallel with Stage 1 (4–6 h, a second agent, touches only `src/data/` and `store.ts`)
10. Add `fundingCount` to `meta.json` in `scripts/build-data.mjs`; move `funding.json` out of
    `loadFirst()` into a Money-route stage (§6.2). **74.6 KB off first render.**
11. Cache the query match set once per query and share it across `runPipeline` and all 11 facet
    passes (§6.3). The existing 53 tests are the safety net — they must stay green.
12. Skip the pre-detail `buildCorpus` (§6.5).
13. Debounce the `history.replaceState` in `Programmes.tsx`; leave the filter update immediate.
14. Wrap `Card` in `memo` (§6.4).

*Stages 1 and 2 do not overlap in any file. Run them concurrently.*

### Stage 3 — components and motion (9–12 h, one agent, after Stages 1 and 2 land)
15. Build `components/Sheet.tsx` on native `<dialog>` (§5). Delete `.sheet__scrim`. Move the
    scroll lock to `:root:has(dialog[open]) { overflow: clip }`.
16. Convert the sheet's `Section` to `<details>`/`<summary>`; animate with
    `interpolate-size: allow-keywords`.
17. Fix the `aria-live` announcement storm; put `theme` in the store instead of
    `useStore.setState({})`.
18. Sheet enter/exit with `@starting-style` + `allow-discrete` (§4.2).
19. Per-component transitions using the motion tokens. No `all`, ever.
20. `withViewTransition` in `store.navigate`, **gated so filter keystrokes never transition**
    (§4.3). Shared element on card title → record title.
21. Update the `prefers-reduced-motion` block to the `1ms` form and add the JS gate (§4.4).

### Stage 4 — verification (3 h, one agent, last)
22. `verify/a11y.mjs`: axe-core over the six routes plus the sheet open; assert focus-in,
    focus-return, Escape, and inert explicitly (§8).
23. Wire the budget check and the a11y check into `.github/workflows/deploy-app.yml`, after
    `npm run build`, before the deploy job.
24. Add the tag-triggered release job for `dist-single/door3.html` (§7).
25. Re-measure everything in "Baseline" above and update the numbers in this file. If first-paint
    JS+CSS moved, say why in the commit.

### Explicitly not in scope, and why
- No framework migration. See §1.
- No CSS framework, no CSS-in-JS, no token pipeline. See §2.
- No animation library. If a spring becomes genuinely necessary, `motion/mini` is 3,114 B — reopen
  then, not before.
- No headless component library. See §5.
- No virtualisation and no `content-visibility`. Both measured; neither helps. See §6.1.
- No host migration yet. Cloudflare Pages is worth ~120 KB on a payload that loads after first
  paint; revisit once the design is done. See §7.
- No Lighthouse CI, no visual regression, no ESLint. See §8.

---

*Every number in this document was measured on 2026-08-14 in this container: `npm run build` for
bundle sizes; `esbuild --bundle --minify` for per-dependency weight; Chromium 141 over CDP at
390×844 with 4× CPU throttling for runtime; Node 22 against the real `index.json`/`detail.json`
for the filter pipeline; `fonttools varLib.instancer` + `pyftsubset` against upstream variable
sources for the font tables; and live `curl` + the GitHub Actions API for the deployment state.*
