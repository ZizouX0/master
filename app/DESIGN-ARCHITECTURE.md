# Door 3 decision tool — data model, application logic, architecture

**Scope.** Everything the project collected under **Door 3 — music production and studio craft**,
and nothing else. The app must mirror `results/DOOR3.xlsx` record for record, including the 130
records that are *not* degrees. Hiding the rejects would make the app less useful than the
spreadsheet, not more.

**Audience.** One person. A Tunisian software-engineering graduate applying for a **September 2027**
master's. Usually on a phone, often on a slow connection.

**Status of this document.** It is a specification. No application code exists yet. Every number
below was measured against the files in `app/public/data/` as of **2026-08-14 02:13**, not
estimated. The measurement commands are given in §0 so they can be re-run when the data changes.

> **The data moved twice while this was being written** (1,839 records → 398 Door-3 records → 398
> records plus a structured dispute channel from `.masters-search/corrections.py`). The current
> record carries **45 fields**, including `auditionDisputed`, `costDisputed`, `existenceDisputed`
> and `hasDispute`. Everything below is against that shape. §8.1's schema validation exists because
> this will happen again.

---

## 0. The measurements everything else rests on

Machine: the build container (x64, Node v22.22.2, Python 3.11). Phone figures are the container
figure multiplied by 5, the conventional mid-range-Android single-thread penalty; they are labelled
as derived, not measured.

### 0.1 Payload

| File | Records | Raw | gzip -9 | brotli -11 |
|---|---:|---:|---:|---:|
| `programmes.json` | 398 (45 fields) | 1,671.0 KB | **494.0 KB** | 355.5 KB |
| `funding.json` | 120 (20 fields) | 234.3 KB | **72.9 KB** | 57.9 KB |
| `meta.json` | — | 3.4 KB | **1.3 KB** | 1.1 KB |
| **Total shipped today** | | **1,908.7 KB** | **568.2 KB** | 414.5 KB |

### 0.2 Where the bytes are, inside `programmes.json`

Values only (1,410 KB of the 1,671 KB file; the rest is keys and punctuation).

| Field | Bytes | % of values | Avg/record | Max | Non-empty |
|---|---:|---:|---:|---:|---:|
| `study` | 149,322 | 10.3% | 375 | 2,497 | 311 |
| `recommendation` | 132,460 | 9.2% | 333 | 2,501 | 174 |
| `entry` | 107,303 | 7.4% | 270 | 2,088 | 333 |
| `acceptsNonMusic` | 90,861 | 6.3% | 228 | 1,208 | 298 |
| `accreditation` | 78,709 | 5.5% | 198 | 1,652 | 256 |
| `portfolio` | 73,300 | 5.1% | 184 | 1,628 | 319 |
| `tuition` | 72,177 | 5.0% | 181 | 1,339 | 347 |
| `scholarshipDetail` | 71,487 | 5.0% | 180 | 2,771 | 330 |
| `audition` | 68,130 | 4.7% | 171 | 2,549 | 295 |
| `correction` | 62,437 | 4.3% | 157 | 879 | 127 |
| `deadline` | 61,107 | 4.2% | 154 | 857 | 369 |
| `url` | 55,939 | 3.9% | 141 | 1,376 | 397 |
| `qualification` | 52,963 | 3.7% | 133 | 1,144 | 316 |
| `verdictWhy` | 46,118 | 3.2% | 116 | 705 | 127 |
| `duration` | 33,863 | 2.3% | 85 | 734 | 298 |
| `otherFees` | 33,571 | 2.3% | 84 | 1,281 | 247 |
| `totalCost` | 31,330 | 2.2% | 79 | 695 | 226 |
| `programme` | 30,207 | 2.1% | 76 | 185 | 398 |
| `whyChance` | 26,997 | 1.9% | 68 | 110 | 398 |
| `institution` | 24,802 | 1.7% | 62 | 200 | 359 |
| `opens` | 22,440 | 1.6% | 56 | 514 | 364 |
| `englishTest` | 17,589 | 1.2% | 44 | 758 | 214 |
| `languageReq` | 16,996 | 1.2% | 43 | 1,066 | 221 |
| `scholarship` | 11,750 | 0.8% | 30 | 128 | 398 |
| remaining 21 fields (ids, enums, booleans, dispute phrases) | 72,054 | 5.0% | 181 | — | — |

**The shape of the problem: nine long prose fields hold 59% of the bytes and none of them appear on
a list card.** That single fact drives §1.

### 0.3 CPU

| Operation | Container | Phone (×5, derived) |
|---|---:|---:|
| `JSON.parse` of the 1.67 MB `programmes.json` | 9.0 ms | ~45 ms |
| `JSON.parse` of `funding.json` | 0.7 ms | ~4 ms |
| Build the normalised in-memory search corpus (0.95 MB of lowercased strings) | 10 ms | ~50 ms |
| Weighted linear-scan query, worst measured (`"production test portfolio"`) | 2.19 ms | ~11 ms |
| Weighted linear-scan query, typical (`"mastering"`) | 1.01 ms | ~5 ms |
| MiniSearch 7.2.0 `loadJSON` of a prebuilt index | 85 ms | ~425 ms |
| MiniSearch query (`prefix`, `fuzzy 0.2`) | 1.10 ms | ~5.5 ms |

### 0.4 Bundle weight, measured with esbuild `--bundle --minify`

| Bundle | Minified | gzip -9 | brotli -11 |
|---|---:|---:|---:|
| `preact` + `preact/hooks` | 12.5 KB | **5.2 KB** | 4.7 KB |
| `react` 19.2.8 + `react-dom/client` | 188.7 KB | **58.7 KB** | 50.6 KB |
| `minisearch` 7.2.0 | 17.2 KB | 5.7 KB | 5.2 KB |

### 0.5 Host capability — measured, not assumed

```
curl -D - -H "Accept-Encoding: gzip, deflate, br, zstd" https://pages.github.com/
  → content-encoding: gzip
```

**GitHub Pages negotiates gzip only. It does not serve brotli even when brotli is offered.** The
brotli columns above are therefore *unavailable* on the primary deploy target. They apply only if
the site is later moved to Netlify or Cloudflare Pages, which do brotli automatically. Every budget
in this document uses the gzip column.

Reproduce all of the above:

```bash
python3 app/tools/measure.py          # §0.1, §0.2  (to be written per §8.4)
node app/tools/bench.mjs              # §0.3, §0.4
```

---

## 1. Payload strategy

### Decision

**Split into a light index plus a deferred detail file, plus a lazily-fetched funding file.**
Four build outputs, all under `app/public/data/`:

| Output | Contents | Raw | gzip | When fetched |
|---|---|---:|---:|---|
| `meta.json` | facet vocabularies, counts, `generated` stamp, `schemaVersion` | 3.4 KB | **1.3 KB** | blocking, first paint |
| `index.json` | one compact row per record: identity, every facet field, `whyChance`, the three dispute fields, plus the build-time derivations (`fit`, `deadline`, `gateKind`, `dupGroup`) | 268.0 KB | **36.8 KB** | blocking, first paint |
| `detail.json` | the 22 prose fields that never appear on a card, keyed by `id`, empty strings omitted | 1,361.8 KB | **452.0 KB** | deferred: `requestIdleCallback` after first paint, or immediately on the first record open, whichever comes first |
| `funding.json` | all 120 schemes, unchanged shape plus derived eligibility flags | 234.3 KB | **72.9 KB** | lazily, on first navigation to `/funding` |

**First-paint payload: 1.3 + 36.8 KB of data + ~15 KB gzip of app = ~53 KB gzip.**
Shipping the monolith instead would be **568.2 KB gzip — 10.7× more** before anything renders.

On a 400 kbit/s connection (a realistic Tunisian mobile floor), that is **~1.1 s to interactive
versus ~11.4 s**. On the 1.6 Mbit/s that a decent 4G session gives, **0.27 s versus 2.8 s**.

The dispute fields go in the **index**, not the detail file, and that is deliberate: they change
what a card *says* (a struck-through cost chip, an audition warning) and what filter #17 and #20
select. They cost 34 KB raw and 1.6 KB gzip. A dispute discovered only after `detail.json` lands
would mean the list briefly shows a programme as free and audition-free when verification says
otherwise — the exact failure `corrections.py` was written to prevent.

### Reasoning

The coordinator asked whether the split still earns its complexity at 1.68 MB. It does, and the
reason is §0.2, not the total: **nine prose fields that never appear on a list card hold 60% of the
bytes.** Removing them from the critical path is not an optimisation, it is the difference between a
list that appears while he is still looking at the screen and one that does not. The ratio is 10.9×;
no amount of "simpler is better" buys that back.

The complexity being bought is genuinely small — and smaller than it was at 1,839 records:

- **No chunking.** Earlier sizing at 1,839 records pointed at 15–64 detail shards. At 398 records
  the detail file is a single 454 KB gzip fetch, so there is exactly **one** extra request, no
  chunk-index, no request coalescing, no cache-eviction policy. The store holds one nullable
  `detail` map and one `detailStatus` enum.
- **No blocking on it.** The record page renders every index field immediately and shows skeletons
  for the prose. If `detail.json` has not landed, the page is still useful: name, institution,
  country, cost band, chance, verdict, gate, language, deadline urgency and the `whyChance` line are
  all in the index.
- **Search still works before detail lands** (see §2.3).

`index.json` uses two-character keys (`pr`, `in`, `cb`, …). This is not micro-optimisation: at 398
rows the key text is 29.5 KB of the 234 KB raw file, and the raw size matters because it is what
`JSON.parse` walks and what the single-file build inlines. Verbose keys cost 1.7 KB gzip and ~50 KB
raw. The mapping lives in one place, `src/data/indexCodec.ts`, and is generated by the same build
step that writes the file, so it cannot drift.

### Rejected alternatives

**Ship `programmes.json` as-is and let gzip handle it.** 494.0 KB gzip blocking first paint. This is
the option the coordinator asked me to check honestly, and the honest answer is no: it is 10.7× the
index and it delivers 850 KB of prose that the list view cannot display. Rejected on the ratio.

**Brotli-precompressed `.br` files.** Would cut the detail file from 452 KB to 332 KB. Rejected
twice over: GitHub Pages will not content-negotiate it (§0.5), and `DecompressionStream` has no
brotli mode, so client-side decompression is not available either. If the site ever moves to
Cloudflare Pages this comes back for free with no code change.

**Gzip in the build and decompress with `DecompressionStream('gzip')`.** Would replace the host's
gzip -6 with gzip -9, worth perhaps 6% on the detail file. Rejected: it costs a `Content-Type`
workaround, breaks the browser's own cache revalidation semantics, and buys ~27 KB.

**Split by facet (one file per country, per cost band).** Rejected: filters combine freely, so any
facet split forces multi-file fetches for ordinary queries, and the facet counts in §3 need the
whole set in memory anyway.

**A prebuilt column store / binary format.** Rejected: at 398 rows `JSON.parse` costs 9 ms (§0.3).
There is nothing to win and a decoder to maintain.

---

## 2. Search

### Decision

**A hand-written weighted linear scan over a normalised in-memory corpus. No search library.**

Implementation, in `src/search/scan.ts`:

1. At load, build `corpus: string[][]` — for each record, one NFKD-folded, diacritic-stripped,
   lowercased string per searchable field. Measured: **10 ms, 0.95 MB in memory**.
2. A query is split on whitespace into tokens. A record matches only if **every** token is found in
   **at least one** field (token-AND, field-OR).
3. Each token scores the **maximum** field weight in which it occurs, ×1.5 if the occurrence is at a
   word boundary. Record score is the sum over tokens.
4. Results sort by score descending, then by `fit` (§4.1) descending, then by `id`.
5. Input is debounced 120 ms.

### Field weights

| Field | Weight | In index? |
|---|---:|---|
| `programme` | 10 | yes |
| `institution` | 6 | yes |
| `city` | 4 | yes |
| `country` | 4 | yes |
| `subtype` | 3 | yes |
| `gate` | 2 | yes |
| `whyChance` | 2 | yes |
| `language`, `level` | 1 | yes |
| `study` | 2 | detail |
| `recommendation` | 2 | detail |
| `verdictWhy` | 2 | detail |
| `correction` | 2 | detail |
| `entry` | 1 | detail |
| `portfolio`, `audition` | 1 | detail |
| `qualification`, `tuition`, `scholarshipDetail`, `deadline` | 1 | detail |

`url`, `foundBy`, `id`, `opens`, `otherFees`, `totalCost`, `englishTest`, `languageReq`, `duration`
are **not** searchable. They are either identifiers, provenance, or numbers a person does not type
into a search box.

### 2.3 Two-stage corpus

The corpus is built from the index at load (10 fields, ~0.28 MB) and **rebuilt once** when
`detail.json` arrives (adding 13 fields, reaching 0.95 MB). The search box is live from first paint,
searching names and places; it silently deepens to full text a moment later. The UI shows a one-line
note — *"searching titles and places; full text loading"* — only while `detailStatus === 'loading'`
and the box is non-empty.

### Reasoning — bundle size and phone CPU, measured

| | MiniSearch 7.2.0 | This scan |
|---|---:|---:|
| Library, gzip | 5.7 KB | **0 KB** |
| Prebuilt index shipped | 862.2 KB raw / **195.3 KB gzip** | **0 KB** |
| Startup cost | `loadJSON` **85 ms** (~425 ms on phone) | **10 ms** (~50 ms on phone) |
| Query, typical | 1.10 ms | **1.01 ms** |
| Query, worst measured | — | 2.19 ms (~11 ms on phone) |

MiniSearch's prebuilt index is **195 KB gzip — 5.5× the entire `index.json`** — and after paying it,
queries are *not faster* than the naive scan at this corpus size. An inverted index amortises its
build cost over a corpus large enough that a linear pass is unaffordable. 398 records × ~2,500 chars
is not that corpus. 1,839 records would not have been either; 50,000 would.

Worst-case 2.19 ms on the container, ~11 ms derived for a mid-range phone, is inside a single 60 fps
frame, and the 120 ms debounce means the scan runs at most ~8 times per second of typing.

### Rejected alternatives

**MiniSearch / FlexSearch / Lunr.** Rejected on the table above. FlexSearch and Lunr are larger than
MiniSearch, so they lose by more.

**Plain `String.includes` on one concatenated blob per record.** Measured at 0.25 ms/query — the
fastest option, and rejected anyway: it cannot rank. A search for `mastering` returns 129 of 398
records; without field weighting, a programme *called* "MA Mastering" sorts no higher than one whose
`recommendation` paragraph happens to use the word. Ranking is the product here. The 4× cost buys it.

**Build-time inverted index of our own.** Rejected: it reintroduces the payload cost that killed
MiniSearch, to solve a problem the linear scan does not have.

**Fuzzy / typo tolerance.** Deliberately omitted. It costs an edit-distance pass over every token
and the corpus is full of near-miss institution names in six languages, where fuzzy matching
produces confident wrong answers. Prefix matching (`indexOf` at a word boundary) covers the real
case — typing `köl` and wanting Köln — and diacritic folding covers typing `koln`.

---

## 3. Filtering and faceting

### 3.1 The filters

All source fields are on the index row, so every filter evaluates without `detail.json`.

| # | Filter | Type | Source | Values |
|---|---|---|---|---|
| 1 | Search | text | §2 | free text |
| 2 | Country | multi (OR) | `country` | 41 values, from `meta.facets.country` |
| 3 | Region | multi (OR) | `region` | Southern Europe · France & Benelux · Central & Eastern · UK & Ireland · German-speaking · Nordics & Baltics · Other |
| 4 | Subtype | multi (OR) | `subtype` | 11 values |
| 5 | Award level | multi (OR) | `level` | 7 values |
| 6 | Real degree only | boolean | `isDegree` | on ⇒ `isDegree === true` (261 of 398) |
| 7 | Chance | multi (OR) | `chance` | Strong · Possible · Weak |
| 8 | Verified verdict | multi (OR) | `verdict` | WORTH IT · CONDITIONAL · AVOID · *(not yet verified)* — the last matches `verdict === ''` (271 records) |
| 9 | Cost band | multi (OR) | `costBand` | Free · Under EUR 1.5k/yr · EUR 1.5k-5k/yr · EUR 5k-15k/yr · Over EUR 15k/yr · Not published |
| 10 | Gate | multi (OR) | `gateKind` (derived, §4.5) | Portfolio · Production test · Performance audition · Interview/exam · Nothing published |
| 11 | Audition | tri-state | `auditionCertainty` (derived, §4.5) | **Confirmed** (36) · **Suspected** (46) · **None found** (316). Default: exclude Confirmed only |
| 12 | Language | multi (OR) | `language` | 38 values |
| 13 | Language he can study in | boolean | `languageOk` | on ⇒ `languageOk === true` (176 of 398) |
| 14 | Public / private | multi (OR) | `publicPrivate` | Public · Private · Not stated |
| 15 | Funding attached | multi (OR) | `funding` | Full · Partial · None · Not stated |
| 16 | Deadline status | multi (OR) | `deadline.kind` (derived, §4.2) | Dated · Recurring · Prior cycle · Rolling · Unverified · No 2027 intake · Not applicable · None recorded |
| 17 | Has a verified correction | boolean | `hasCorrection` | on ⇒ record carries a `correction` (127 records) |
| 18 | Contradicted field | multi (OR) | `auditionDisputed` · `costDisputed` · `existenceDisputed` | Audition disputed (74) · Cost disputed (32) · Existence disputed (6). §4.4 |
| 19 | Fit score | range | `fit` (derived, §4.1) | slider, 0–100, default 0 |
| 20 | Hide duplicates | boolean, **default ON** | `dupGroup` (derived, §4.6) | on ⇒ keep only `isGroupPrimary` (398 → **356 rows**) |

Funding view filters are in §4.6.

### 3.2 Evaluation order

Fixed, and it matters for both correctness and speed:

```
1. dedupe        (#20)  — collapse groups first, so all counts below describe options, not rows
2. predicates    (#2–#19) — cheap enum/boolean tests, in the order listed, short-circuiting
3. search        (#1)   — the only expensive step, so it runs on the smallest possible set
4. sort          — fit desc | chance | cost | deadline | country | name, user-selectable
```

Dedupe first is a real decision with a visible consequence: **"Germany · Tonmeister" reads 6 records
but 1 option.** Counting rows would tell him Detmold is six chances when it is one application. If
he switches #20 off, the pipeline re-runs from step 1 and every count changes accordingly — that is
correct, not a bug, and the UI labels the toggle *"Show every source row (356 options / 398 rows)"*.

Search runs last because it is ~1–2 ms against 398 records and proportionally less against a
filtered subset, whereas the predicates are sub-microsecond each. Running search first would waste
the whole scan on records a single country checkbox was about to drop.

### 3.3 How counts are recomputed

**Facet counts are "leave-one-out": each facet's counts reflect every other active filter, but not
its own.**

For facet *F*, the count shown next to value *v* is the size of the result set produced by running
the full pipeline (§3.2) with *F*'s own selection replaced by `{v}` and every other filter left as
the user set it.

Concretely, for each facet *F*:

1. Compute `base(F)` = the record set surviving steps 1–3 with **all filters except F** applied.
   This is the expensive part and it is memoised per facet.
2. For every value *v* in `meta.facets[F]`, `count(F, v) = |{ r ∈ base(F) : r[F] === v }|`.

Cost: 20 facets × one pass over ≤398 records = under 8,000 predicate evaluations, ~1 ms. It runs
synchronously inside the same `useMemo` as the result set. No web worker, no incremental structures.

Consequences, all intended:

- Selecting *Germany* does not zero out the other countries' counts. Country counts continue to show
  what each would yield **if he switched to it** — which is the question he is actually asking.
- Selecting *Germany* **does** change the cost-band counts, because cost band is a different facet
  and Germany is active for it.
- A value whose leave-one-out count is 0 renders greyed and disabled, not hidden. Hiding values
  makes a filter panel feel broken and hides the information that a combination is empty.
- The dedupe toggle (#20) is not a facet and gets no count; it is a mode.

### Rejected alternatives

**Global counts (facet counts always describe the full 398).** Simpler and useless: after two
filters every number on screen is a lie about the current view.

**Fully conjunctive counts (each facet's counts also reflect its own selection).** Rejected: the
count next to every unselected value in an active multi-select becomes 0, which is technically true
and practically makes multi-select unusable — he can never see that adding *Austria* to *Germany*
would bring 7 more.

**A bitset index over facet values.** The textbook answer for fast faceting, and unnecessary here: at
398 records the naive recomputation is ~1 ms. Rejected as complexity with no measurable payoff.

**Debouncing the facet recomputation.** Rejected for the same reason — it is already inside a frame.

---

## 4. Derived logic

Everything in this section is computed **at build time** by `app/tools/derive.mjs` and written into
`index.json`, except where marked runtime. Build-time is right because the inputs never change
between data regenerations, the logic is where a reviewer can read it, and the phone does none of it.

### 4.1 Fit score

A 0–100 integer, `fit`, plus a `fitWhy: string[]` of the clauses that fired, so the number is never
shown without its reasons.

**Hard gates — any of these forces `fit = 0` and tags the record `blocked`:**

| Gate | Test | Records hit |
|---|---|---:|
| Not a degree | `isDegree === false` | 137 |
| Verified as a bad bet | `verdict === 'AVOID'` | 86 |
| Verification says it does not exist / is not a degree / has no intake | `existenceDisputed !== ''` | 6 |
| **Confirmed** performance audition | `auditionCertainty === 'confirmed'` (§4.5) | 36 |
| Taught in a language he does not read | `languageOk === false` | 222 |

`languageOk === false` is a gate rather than a penalty because a two-year master's taught in
Bulgarian is not a 30%-worse option than one in English; it is not an option.

**The audition gate uses `auditionCertainty`, not the exported `needsAudition`.** This is the single
most consequential decision in this section, and §4.5 gives the measurement behind it: the exported
`needsAudition` is true for **82** records, but only **36** of those rest on the gate enum or on
verified prose. The other **46** come from a regex over the raw, unverified `audition` field.
Hard-gating all 82 would zero out 46 programmes on a heuristic — the same over-confidence this
document objects to everywhere else. Suspected auditions take a **−20 penalty and a visible warning**
instead of a gate.

**Weighted score for everything that survives, out of 100:**

| Component | Weight | Mapping |
|---|---:|---|
| Verified verdict | **30** | `WORTH IT` 30 · `CONDITIONAL` 15 · *(no verdict)* 8 · `AVOID` gated out above |
| Chance of acceptance | **25** | `Strong` 25 · `Possible` 12 · `Weak` 0 |
| Cost to him | **20** | `Free` 20 · `Under EUR 1.5k/yr` 17 · `EUR 1.5k-5k/yr` 12 · `EUR 5k-15k/yr` 5 · `Over EUR 15k/yr` 0 · `Not published` 6 |
| Gate reachability | **15** | `gateKind`: `portfolio` 15 · `production-test` 15 · `interview-exam` 11 · `none-found` 7 · `ask-them` 5 · `performance-audition` gated or penalised above |
| Funding attached | **10** | `Full` 10 · `Partial` 6 · `Not stated` 3 · `None` 0 |

Three adjustments applied after the sum, all clamped to [0, 100]:

- **−20 if `auditionCertainty === 'suspected'`** (46 records). Not a gate, because the evidence is a
  regex over unverified prose, but a large penalty, because the cost of walking into an ear test
  unprepared is high. The card shows *"possible audition — read the entry text"* with the matched
  phrase.
- **−15 if `costDisputed !== ''`** (32 records). Verification has explicitly contradicted the
  `costBand` this record was scored on, so its cost component is not merely uncertain but known
  wrong in a known direction — every measured instance is *more* expensive than recorded. This
  replaces the regex-over-`correction` heuristic an earlier draft of this document proposed; the
  export now supplies the flag, and **7 of the 32 still sit in a cheap cost band**, which is exactly
  the set a "free and cheap" filter would otherwise hand him.
- **+5 if `verdict === 'WORTH IT'` and `deadline.kind === 'dated'`** — a good option with a date he
  can act on outranks an equally good one he cannot yet diarise.

**Why `verdict` outweighs `chance`:** measured, 23 records are `chance = Strong` *and*
`verdict = AVOID`. `chance` is a heuristic assigned during collection; `verdict` is the outcome of
re-opening the institution's own page. Where they disagree, verification wins.

**Validation — and why it is the proof that `auditionCertainty` is right.**

`results/DOOR3.md` states, independently of this app, that **29** options are *"a strong chance,
cheap, and need no audition"*. Applying `isDegree && chance === 'Strong' && costBand ≤ EUR 1.5k-5k`:

| Audition rule used | Count |
|---|---:|
| exclude `auditionCertainty === 'confirmed'` only | **29** ← matches `DOOR3.md` |
| exclude all `needsAudition === true` (82 records) | 26 |
| additionally exclude `costDisputed` | 24 |

Splitting confirmed from suspected **restores the published figure exactly**; gating on the raw
`needsAudition` loses three real options. That is the strongest available external check on the
model, and `app/tools/derive.test.mjs` asserts all three numbers so a future change to
`corrections.py` cannot silently move them.

Note that `DOOR3.md`'s other headline, *"reachable without a performance audition — 247 of 261"*, is
now stale against this data: with the dispute channel folded in, degrees with no audition at all
number **186**, and degrees with no *confirmed* audition number **227**. The app should show 227 and
say which rule it used. Flagged in §11.

**What the fit score cannot know.**

- **Whether he will actually get in.** `chance` is one researcher's judgement, and 271 of 398
  records were never re-verified at all.
- **Whether a Tunisian passport clears the visa.** Nothing in the record models consular risk, and
  `DOOR3.md` documents that visa and accreditation are two separate tests.
- **Whether his BSc Software Engineering counts as an "affine subject".** `DOOR3.md` names this as
  the open question that decides his single best free option (HfMT Köln), and says it can only be
  settled by email. No score can settle it.
- **Cost, for 182 records.** `costBand` is `Not published`. The 6-point neutral score is a guess
  dressed as a number.
- **Anything about the 40 Italian conservatoires that could not be read.** Absence in this dataset is
  not evidence of absence in the world.
- **Whether he wants it.** Nothing here models musical taste, city, or who teaches there.

The UI must therefore never present `fit` as a verdict. It renders as a small bar with the
`fitWhy` clauses under it, headed *"how this was scored"*, and a permanent line: *"271 of 398
records were never re-verified. A high score on an unverified record means the collected fields
looked good, not that anyone checked."*

### 4.2 Deadline urgency

**No date is ever invented. The parser only ever narrows; when it cannot, it says so and shows the
raw string.**

The corpus already carries an explicit provenance vocabulary. Measured across the 398 `deadline`
strings:

| Marker | Records |
|---|---:|
| `PRIOR CYCLE` | 186 |
| `UNVERIFIED` | 139 |
| some 4-digit year | 217 |
| mentions 2027 | 196 |
| mentions 2026 | 142 |
| a `D Month YYYY` pattern | 129 |
| a `D Month` pattern with no year | 159 |
| `rolling` | 35 |
| `annual` / `annually` | 18 |
| `no deadline` / `not stated` / `not published` | 42 |
| `EXPECTED` | 11 |
| `Not applicable` | 12 |
| `NO INTAKE` | 1 |
| empty | 29 |

Parsing runs as an **ordered cascade — first rule that matches wins**, so the disqualifying markers
are checked before any date extraction:

| Order | Rule | `kind` | Carries a date? |
|---|---|---|---|
| 1 | `/NO INTAKE/` | `no-intake` | no |
| 2 | `/^\s*Not applicable/i` | `not-applicable` | no |
| 3 | empty / whitespace | `none` | no |
| 4 | `/PRIOR CYCLE/` | `prior-cycle` | **no** — see below |
| 5 | `/UNVERIFIED/` | `unverified` | no |
| 6 | `/\brolling\b/i` or `/no (published )?deadline/i` | `rolling` | no |
| 7 | a `D Month YYYY` or `YYYY-MM-DD` match **whose year is ≥ 2027** | `dated` | **yes**, ISO `YYYY-MM-DD` |
| 8 | a `D Month YYYY` match whose year is ≤ 2026 | `prior-cycle` | no |
| 9 | `D Month` with no year, plus `/annual/i` | `recurring` | **month + day only**, no year |
| 10 | `D Month` with no year, no `annual` | `unverified` | no |
| 11 | anything else | `unverified` | no |

**Rule 4 is the important one.** 186 records say `PRIOR CYCLE`, and many of them also contain a
perfectly parseable date — *"15 January 2026 — PRIOR CYCLE (this is the 2026 intake)"*. That date is
real and it is **wrong for him**. Extracting it and rendering a countdown would be inventing a
2027 deadline out of a 2026 fact. The record is classified `prior-cycle`, carries **no date**, and
the card reads *"last cycle's date only — confirm the 2027 date"* with the raw string beneath.

**Rule 9** produces a `{month, day}` with **no year**. `"15 February annually"` becomes
`{kind:'recurring', month:2, day:15}`. The UI renders *"around 15 February each year"* — never
"15 February 2027". Distance-to-deadline is computed against the next occurrence **only for
sorting**, and never displayed as a date.

Rule 7 requires year ≥ 2027 because the target intake is September 2027; a 2026 date in a corpus
generated in 2026-08 is by definition a prior cycle regardless of whether the string says so.

**Urgency badge**, runtime, computed from `kind` and today's date:

| Condition | Badge |
|---|---|
| `dated`, ≤ 30 days away | red — *"closes in N days"* |
| `dated`, 31–120 days | amber — *"closes DD Month YYYY"* |
| `dated`, > 120 days | grey — *"DD Month YYYY"* |
| `dated`, in the past | grey struck-through — *"date has passed — confirm"* |
| `recurring` | blue — *"around DD Month each year"* |
| `prior-cycle` | amber outline — *"prior cycle — confirm the 2027 date"* |
| `rolling` | grey — *"rolling / no published deadline"* |
| `unverified`, `none` | grey outline — *"no confirmed date"* |
| `not-applicable` | none |
| `no-intake` | red outline — *"no 2027 intake"* |

Every badge is a button; tapping it reveals the **verbatim** `deadline` string. The prose is the
source of truth and the badge is a summary of it, so the prose must always be one tap away.

`funding.json` deadlines run through the same parser (55 of 120 say `PRIOR CYCLE`, 49 say
`UNVERIFIED`, 16 say `EXPECTED`).

### Rejected alternatives

**A date library (`chrono-node`, `date-fns` parsing).** Rejected on the central risk: a general
natural-language date parser is *designed* to produce a date from ambiguous text, which is the exact
failure mode to avoid. `chrono` given *"PRIOR CYCLE - confirm new date; 2026-2027 entry:
registration 12 Jan - 13 Apr 2026"* returns 12 January — confidently, wrongly. The cascade above
refuses.

**Normalising every deadline to a single sortable date with a confidence field.** Rejected: a
confidence field gets ignored by the next piece of code that touches it, and then a guess is a date.
Records without a date sort last, in a labelled group.

### 4.3 Cost normalisation

**Decision: `costBand` is the only comparable cost field. `tuition` is displayed, never computed on.**

Measured across the 398 `tuition` strings:

| Currency signature | Records |
|---|---:|
| EUR only | 148 |
| **no currency symbol at all** | 127 |
| GBP only | 35 |
| CHF only | 7 |
| CZK only | 5 |
| EUR + a second currency (SEK, PLN, BGN, CZK, DKK, TRY, HUF, NOK, RSD, CHF) | 17 |
| NOK only | 3 |
| USD, TRY, ISK only | 4 |
| *(347 non-empty; 233 contain a digit)* | |

So **114 of 347 non-empty tuition strings contain no digit at all**, and 127 contain no currency
marker. The field is prose: *"€363.36 per semester tuition + €26.20 ÖH fee … Applicants without
EU/EEA/Swiss citizenship must additionally pay a TUITION…"*. There is no arithmetic to do on it that
would survive contact with the corpus.

**What is safely comparable:**

- `costBand` — a 6-value ordinal enum, already normalised to EUR per year by the export. It sorts,
  filters, and scores. It is the *only* thing that does.
- **Direction of a correction.** When `correction` says a band is wrong, we can say *"verification
  found this costs more than the band shows"* without knowing how much.

**What is not comparable, and must never be silently converted:**

- Any figure in `tuition`, `otherFees`, `totalCost`. Displayed verbatim, in the source currency, with
  no conversion. **No FX rates ship with this app.** A 2026-vintage EUR/TRY rate applied to a 2027
  fee produces a number that is wrong in a way the reader cannot see.
- Per-semester versus per-year. Filmakademie's record is exactly this trap: *"the €1,500 is PER
  SEMESTER, not a one-off"*. Nothing parses the period reliably.
- EEA versus non-EEA rate. `DOOR3.md` documents that Wallonia's €1,194 minerval is the EEA rate and
  a Tunisian pays €5,369; KASK's €1,181 is the EEA rate against a real €8,800. The published number
  is frequently the wrong number *for him*.

**Consequence for the UI.** The cost cell on a card shows the `costBand` chip. If `costDisputed` is
non-empty (§4.4, **32 records, all of them verified**), the chip renders **struck through with a
warning triangle** and the matched phrase is its tooltip. **7 of those 32 currently sit in a cheap
cost band** — Free, Under EUR 1.5k/yr, or EUR 1.5k-5k/yr — so a "cheap options" filter returns them
unless the strike-through is honoured visually. The record page shows both, stacked and labelled:

```
Cost band (as collected)    Under EUR 1.5k/yr      ⚠ contradicted
Verified correction          "…'Under EUR 1.5k/yr' is WRONG BY A FACTOR OF SIX.
                              A non-EEA student pays EUR 8,800.20 for a 60-credit year…"
```

The stale value is never deleted and never silently replaced — he needs to see that the spreadsheet
and the verification disagree, because that is itself the finding.

### Rejected alternatives

**Parse a numeric range out of `tuition` and convert to EUR.** Rejected: 114 of 347 have no digit,
the period is unreliable, and the published rate is often the EEA rate rather than his. A number
that is wrong by a factor of six is worse than no number, because it sorts.

**Ship a static FX table.** Rejected: it dates instantly, and it would make the previous mistake
look authoritative.

**Let the correction overwrite `costBand`.** Rejected, and `corrections.py` reaches the same
conclusion in its own docstring — *"It does not attempt to parse the corrected number out of prose —
that would invent precision. It marks the field as disputed and hands the reader the sentence."*
Show both.

### 4.4 The correction channel — verified overrides

**127 records carry a `correction`, and all 127 also carry a `verdict`.** The two are perfectly
correlated: a correction exists exactly when a human re-opened the source page.

The pipeline now ships this as **structured data**, via `.masters-search/corrections.py`, which the
app must consume rather than re-derive. Three fields, each holding **the matched phrase** (empty
string = not disputed), plus a rollup boolean:

| Field | Meaning | Records | Source fields scanned |
|---|---|---:|---|
| `auditionDisputed` | prose names a live performance or ear test | **74** | `correction`, `verdictWhy`, **`audition`** |
| `costDisputed` | prose says the recorded cost band is wrong | **32** | `correction` only |
| `existenceDisputed` | prose says it is discontinued, suspended, not a degree, or has no intake | **6** (ids 29, 43, 55, 164, 169, 332) | `correction` only |
| `hasDispute` | any of the above | **104** | — |

`corrections.py` is a better instrument than the regexes an earlier draft of this document proposed:
it carries a **negation window** (a match inside 60 characters of "no audition", "there is no live
admission", "selection is entirely document-based" is discarded), it covers German, Czech and French
vocabulary the corpus actually uses (`Vorspiel`, `Eignungsprüfung`, `zkoušku paměti`, `solfège`), and
it deliberately **refuses to parse the corrected number out of the prose** — the module's own
docstring says *"that would invent precision"*. The app adopts that principle unchanged.

> ### ⚠ `hasDispute` is not the same as "verified"
>
> Measured: **104 records carry a dispute, but only 59 of them have a `verdict`.** The 45 without one
> come entirely from `auditionDisputed`, because `analyse()` also scans the raw `audition` field,
> which was never re-verified. Breaking `auditionDisputed`'s 74 down by which field fired:
>
> | Source | Records | Verified? |
> |---|---:|---|
> | `correction` | 20 | yes |
> | `verdictWhy` | 3 | yes |
> | **`audition` (raw, collected, unverified)** | **51** | **no** |
>
> `costDisputed` and `existenceDisputed` fire only from `correction`, so **all 38 of those are
> verified**. The app must therefore treat `auditionDisputed` as two different things depending on
> provenance, which is what §4.5's `auditionCertainty` does. **Do not present a raw-field regex hit
> as "verification found this wrong."**
>
> `derive.mjs` recovers the provenance by re-running `analyse()` twice per record — once with the
> `audition` field blanked, once with only it — and stores `auditionDisputedSource`. **Recommend to
> the pipeline: emit this directly**, so the app stops inferring it.

Three further flags the export does not provide are derived by regex over `correction`, for display
and filtering only:

| Flag | Pattern | Records |
|---|---|---:|
| `duplicate` | `/DUPLICATE/i` | 30 |
| `language` | `/\bLANGUAGE\b\|[ABC][12]\b/` | 28 |
| `funding` | `/\bFUNDING\b\|scholarship/i` | 12 |

**Rule: a verified correction outranks the field it contradicts, and both are shown.** The record
page renders the correction in a bordered block above the fields, headed *"Verification found this
record wrong"*, with each disputed field marked `⚠ contradicted` inline and the **matched phrase**
quoted next to it — that is what the dispute fields hold, and quoting it is cheaper and more
trustworthy than paraphrasing. A dispute chip row appears on the list card so a contradicted record
is visible without opening it. Filters #17 and #18 select them.

> ### ⚠ Trap, measured — do not resolve the index references in `correction`
>
> 30 corrections say things like `"DUPLICATE of index 8"`, `"DUPLICATE of indices 7 and 22"`.
> **These are not `id` values.** They are row indices from the source workbook's id-space. Checked
> against the exported data: **every single one of the 65 references points at a record in a
> different country.** `[3] Austria → "index 8"`, which is a French film school. `[16] Turkey →
> "indices 7 and 22"`, both French.
>
> A coding agent that treats them as `id` pointers will merge Austrian and French programmes and the
> bug will look like a data problem. **Use the presence of `/DUPLICATE/i` as a signal that the
> record is a duplicate of *something*. Never dereference the number.** Grouping is §4.5.
>
> The correction text is still shown verbatim to the reader, index numbers and all — it is a human
> note, and he can see it is talking about a spreadsheet.

### 4.5 The three-way gate

`DOOR3.md` states the distinction the raw `gate` enum does not carry: **a practical production test
is not an audition.** The `gate` enum has 6 values and marks only 16 records as auditions; that
collapses "submit two finished tracks", "here is raw material, make a production" and "sit an
ear-training exam" into the same bucket for the other 382.

**Two derived fields, because the gate has two independent axes: what kind it is, and how sure we
are that it is an audition.**

**`auditionCertainty`** — the audition axis. Do not re-derive `auditionDisputed`; `corrections.py`
already does it better (§4.4). Derive only the provenance:

| Value | Rule | Records |
|---|---|---:|
| `confirmed` | `gate` contains `AUDITION`, **or** `auditionDisputed` fired from `correction` / `verdictWhy` | **36** |
| `suspected` | `auditionDisputed` fired **only** from the raw `audition` field | **46** |
| `none-found` | `auditionDisputed === ''` and the gate enum does not say audition | **316** |

`confirmed` is a hard gate in §4.1. `suspected` is a −20 penalty and a labelled warning that quotes
the matched phrase. The **hard filter #11 excludes `confirmed` by default and keeps `suspected`
visible**, because a suspected audition he can check by reading two sentences is worth more to him
than a silently removed option.

**`gateKind`** — the kind axis. An ordered cascade; the harder gate wins when a record matches
several, because a false "reachable" is the expensive error:

| Order | Rule | `gateKind` |
|---|---|---|
| 1 | `auditionCertainty === 'confirmed'` | `performance-audition` |
| 2 | `auditionCertainty === 'suspected'` | `performance-audition` *(marked inferred)* |
| 3 | `audition + portfolio + entry` matches `/production test\|raw material\|on-the-spot\|mixing test\|(make\|create) a production\|practical task\|self-produced\|stems/i` | `production-test` |
| 4 | `gate` starts `Portfolio` | `portfolio` |
| 5 | `gate` starts `Exam/interview` | `interview-exam` |
| 6 | `gate` is `Not published — ask them` | `ask-them` |
| 7 | otherwise | `none-found` |

Rule 3's vocabulary matches **59 records** and is the only regex this app owns for gates; everything
about auditions is delegated. The `gateKind` chip carries a dotted underline whenever it came from
rule 2 or 3 rather than the `gate` enum, and tapping it shows the matched phrase.

Two exceptions `DOOR3.md` names explicitly are hard-coded as an exclusion list in `derive.mjs`, with
a comment citing the document: **Novi Sad's *аудиограм* and mdw Vienna's *"Nachweis der
einwandfreien Gehörfähigkeit"* are medical hearing certificates, not ear tests.** These are checked
after `corrections.py` has run, because its negation window does not know about them.

Two further facts from `DOOR3.md` are encoded rather than re-derived, as a build-time
`blockers: string[]` on the index row:

- `prerequisite-degree` — Detmold requires a *"Bachelor of Music Musikübertragung bzw.
  Diplom-Tonmeister"*, Copenhagen a *"Bachelor of Music as tonemeister"*. This, not the ear, is what
  closes them. The UI says so, because "closed by a prerequisite degree" is sometimes negotiable by
  equivalence and "closed by a trained ear" is not.
- `genuine-ear-gate` — FAMU and Robert Schumann Düsseldorf.

### 4.6 Duplicate detection

**Rule — a two-tier deterministic key, no transitive closure.**

```
Tier 1 (canonical URL).
  Extract every http(s) URL from `url` (511 of 1,839 in the earlier corpus held more than one;
  the field is a citation list, not a single link).
  Normalise: lowercase, drop scheme, drop leading "www.", drop query and fragment,
  strip trailing slash.
  Discard any URL matching the GENERIC pattern:
    /(fee|tuition|scholarship|beca|financial-aid|faq|entry-requirement|admission|admisiones
      |\/apply|application|visa|accreditation|standards|contact|\/courses\/?$|\/corsi\/?$
      |\/study\/?$|\/en\/?$|default\.asp|index\.)/
  Discard any URL with no path segment (bare host).
  If any URL survives, the group key is ("U", first survivor).

Tier 2 (fallback, when no specific URL survives).
  Key is ("K", country, instKey, progKey) where
    instKey = institution, NFKD-folded, lowercased, parentheticals removed,
              truncated at the first " — " / " – " / " - " / " + " / " with " /
              " awarded " / " validated " / " consortium ",
              tokenised to [a-z0-9]{3,}, stopwords dropped, deduped, sorted, first 4 joined
    progKey = programme, same folding, tokenised to [a-z0-9]{4,}, stopwords dropped,
              deduped, sorted, first 4 joined

No union-find. No transitive merging. A record belongs to exactly one group, determined by
its own fields.
```

**Measured result: 398 records → 356 groups.** 328 records keyed by Tier 1, 70 by Tier 2. Size
distribution: 327 singletons, 21 pairs, 5 triples, 2 quads, **1 group of six (Detmold)**. 71 records
sit inside a multi-record group. 17 of the 30 self-declared duplicates land in a group of ≥2; the
other 13 are corrections describing duplicates that live in the *other* doors and are legitimately
alone here.

Sample of the groups it produces, all verified correct by hand:

| n | Key | Records |
|---:|---|---|
| 6 | `hfm-detmold.de/…/tonmeister-music-directing` | 261, 262, 263, 264, 274, 331 |
| 4 | `taiarts.com/estudios/master-produccion-musical` | 157, 234, 235, 382 |
| 4 | `sae.edu/esp/courses/produccion-de-audio` | 230, 231, 232, 233 |
| 3 | `schoolofartsgent.be/…/music-production` | 5, 143, 279 (KASK Gent) |
| 3 | `dbsinstitute.ac.uk/…/ma-music-production` | 59, 61, 62 |
| 3 | `icmp.ac.uk/course/ma-creative-music-production` | 72, 73, 74 |
| 3 | `leedsconservatoire.ac.uk/…/ma-music-production` | 77, 163, 164 |

**Why the GENERIC filter and the no-transitivity rule exist — both are measured failures of the
obvious approach.** Union-find over *all* shared URLs merged **27 unrelated SAE records** across
Amsterdam, Madrid, Barcelona and London into one group, because they all cite
`sae.edu/nld/course-fees-2026-2027`. And without the GENERIC filter, five *different* Berklee
Valencia scholarships collapsed into one group because they share a
`valencia.berklee.edu/scholarships-financial-aid/…` page. A shared fees page is not a shared
programme. Transitivity turns one bad edge into one bad component.

**Group primary.** Within a group, the primary record — the one the list shows — is chosen by, in
order: (1) has a `verdict`; (2) `verdict` rank `WORTH IT` > `CONDITIONAL` > `AVOID`; (3) has a
`correction`; (4) most non-empty fields; (5) lowest `id`. So the row that was actually verified
represents the group.

**How the UI presents a group.**

- The list shows **one card per group**. If the group has more than one member, a small badge reads
  **"4 source rows"**, tappable.
- Where members **disagree**, the card shows the primary's value with a **`⚠ rows disagree`** marker.
  Measured across the 29 multi-record groups, disagreement is common rather than exceptional:
  `funding` in **16** groups, `gate` in **13**, `chance` in **11**, `costBand` in **10**,
  `needsAudition` in **3**, `level` in **2**. Saint Louis is the live example — two rows carrying
  `EUR 1.5k-5k/yr` and `EUR 5k-15k/yr` for the same biennio. The disagreement is information;
  averaging it away would destroy the only signal that the underlying data is uncertain. A group
  where members disagree on `needsAudition` is escalated to `auditionCertainty = 'suspected'` for
  the whole group if any member says audition.
- The record page opens on the primary and carries a **"Source rows (4)"** section: a compact table,
  one line per member, with every field on which it differs from the primary highlighted, each
  linking to its own `url` and its own `foundBy`.
- Filter #20 (**default on**) hides non-primaries. Turning it off restores all 398 rows and every
  count in §3.3 recomputes.
- **Shortlisting is per record, not per group** (§5) — but the shortlist view groups by `dupGroup`
  and warns if two shortlisted records are the same option. He should never prepare two applications
  for Detmold.

### Rejected alternatives

**Fuzzy string similarity on institution names (Levenshtein / Jaccard over the whole name).**
Rejected: *"Hochschule für Musik Detmold"* and *"Hochschule für Musik Detmold – Erich-Thienhaus-
Institut (ETI)"* are similar; *"SAE Institute Spain – Madrid"* and *"SAE Institute Spain –
Barcelona"* are more similar still and are different campuses. Any threshold that catches the first
catches the second. The URL path does not have this problem.

**Union-find over all shared URLs.** Rejected on the measured 27-record SAE over-merge above.

**Trusting `correction`'s `"DUPLICATE of index N"` references.** Rejected on the measurement in
§4.4 — all 65 references cross a country boundary. Stale id-space.

**Merging group members into one synthetic record.** Rejected: it would have to pick a `costBand`
where members disagree, which is the one thing the data is telling us not to do.

### 4.7 Funding model and its relationship to programmes

**120 schemes. Their eligibility fields are prose with a consistent vocabulary, so every derived
flag is tri-state — `yes` / `no` / `unknown` — and `unknown` is the honest default.**

Measured field shapes:

- `requiresAdmissionFirst`: 25 `"No"`, 12 `"UNVERIFIED"`, 7 `"Yes"`, 7 empty, 4 `"YES"`, plus prose
  variants (`"No — combined with admission."`, `"YES - an offer must be held…"`).
- `requiresWorkExperience`: 72 empty, 38 some form of `"No"`, and a handful of prose that means yes
  (`"EFFECTIVELY YES - 'activité professionnelle régulière'…"`).
- `ageLimit`: 97 non-empty, of which ~30 are literally `"UNVERIFIED"`; the rest range from
  `"None found"` to `"18-25 - note he will be roughly 24-26 at entry, so even the age band is
  marginal"`. Many end with the phrase **`"He clears it."`** — the researcher's own judgement,
  already in the data.
- `competitiveness`: 50 `"UNVERIFIED"`, 11 empty, 6 `"High"`, 4 `"Moderate"`, 2 `"Very high"`.
- 93 of 120 mention Tunisia somewhere in `whoCanApply` or `notes`.

Derived, build-time, each with the matched sentence retained for display:

| Derived | Type | Rule |
|---|---|---|
| `tunisianEligible` | `'yes' \| 'no' \| 'unknown'` | `no` if `/not eligible\|excludes Tunisia\|closed to Tunisia\|requires.*UK passport\|must be (a )?(UK\|EEA)/i`; `yes` if Tunisia named positively (`/Tunisia is (an? )?(eligible\|listed\|explicit\|priority)/i` or `"no nationality bar"`); else `unknown` |
| `ageCap` | `number \| null` | only from an explicit numeric cap (`/\b(?:under\|maximum(?: age)?(?: is)?\|up to)\s+(\d{2})\b/`); `null` otherwise. **`"He clears it."` sets `ageOk = 'yes'` but never a number.** |
| `ageOk` | tri-state | `yes` if `/He clears it\.|no age (limit\|cap\|restriction)/i`; `no` if a numeric cap < 24; `unknown` otherwise |
| `needsAdmissionFirst` | tri-state | `yes` on `/^\s*YES/i`; `no` on `/^\s*NO\b/i`; `unknown` on `UNVERIFIED`, empty, or prose that leads with a qualifier |
| `needsWorkExperience` | tri-state | `yes` on `/^\s*(YES\|EFFECTIVELY YES)/i` or `/\b(\d+) (months\|years)('| of)? (industry\|professional)/i`; `no` on `/^\s*NO\b/i`; `unknown` otherwise |
| `deadline` | as §4.2 | same cascade, same refusal to invent |

**Funding filters:** Can a Tunisian apply (`tunisianEligible`) · Age cap clears him (`ageOk`) ·
Needs admission first · Needs work experience · Country · Coverage keyword search · Deadline status.
Each renders as a **three-state chip** (yes / no / unknown), never a two-state checkbox — a
two-state checkbox would quietly file 50 `UNVERIFIED` competitiveness ratings under "no".

**Relationship to programmes.** Measured: **63 of 119 schemes have a URL host matching a programme
URL host** (`valencia.berklee.edu` ×5, `icmp.ac.uk` ×2, `popakademie.de`, `codarts.nl`,
`hud.ac.uk`, …). So most schemes are national or international, and a minority are
institution-tied.

The link is therefore **derived, weak, and labelled as such**:

| Link kind | Rule | Displayed as |
|---|---|---|
| `institution` | funding URL host === programme URL host | *"Offered by this institution"* — shown on the record page |
| `country` | `funding.country` contains `programme.country` | *"National schemes for {country}"* — a count with a link to a pre-filtered funding view |
| `open` | neither | listed only in the funding view |

No join table is stored. The two datasets keep independent `id` spaces (`p{n}` and `f{n}` in URLs,
§7) and the relationship is recomputed at load in ~1 ms.

`DOOR3.md`'s hard-won findings — Chevening closed (needs two years' post-degree work), Eiffel
excludes the arts, NAWA is STEM-only, Erasmus+ ICM cannot fund a full master's, Popakademie needs
six months' industry experience plus C1 German — are already present in the `notes` and
`whoCanApply` prose. They are surfaced by the tri-state flags rather than re-encoded, with one
exception: schemes whose `notes` contain `/DOES NOT BELONG\|CANNOT fund\|cannot fund a full/i` get a
`structurallyIneligible: true` flag and sort to the bottom behind a collapsed *"checked and closed
(N)"* header. That is 1 record today (Erasmus+ ICM) and the pattern will catch its successors.

---

## 5. Personal state

### Decision

**`localStorage`, one key, one JSON document, versioned, with a manual export/import and an
automatic nightly reminder to export.**

Key: `door3.personal.v1`. Payload is `PersonalStateV1` (§10.2).

### Why localStorage rather than IndexedDB

Measured ceiling: shortlist entries are ~400 bytes each with a generous note. 398 records fully
annotated at 2 KB each is **~800 KB**, inside every browser's 5 MB `localStorage` quota with room to
spare. Realistically he will shortlist 20–40 programmes: **~30 KB**.

`localStorage` is synchronous, which for a document this size is the right trade: the store hydrates
before first render with no loading state, no async race between "shortlist loaded" and "list
rendered", and no transaction handling. IndexedDB would buy asynchronous writes he will never
notice and cost a wrapper, a migration runner and an entire class of "did the write land" bugs.

**Rejected:** IndexedDB (`idb-keyval`) — 1.1 KB gzip and a real async surface, for a document that
fits in a synchronous string. Revisit only if per-record file attachments are ever added.
**Rejected:** cookies (4 KB), the URL (§7 covers filter state; personal state is not shareable),
and any backend (non-negotiable constraint).

### Writes

Debounced 400 ms, then `JSON.stringify` the whole document and write. At 30 KB this is
sub-millisecond. A `QuotaExceededError` is caught and surfaces a blocking dialog offering export —
it must never fail silently.

### Versioning and migration

The document carries `schemaVersion: 1`. On load, `src/state/migrate.ts` runs an ordered array of
pure migration functions `(doc) => doc`, each from version *n* to *n+1*, applied until the document
reaches `CURRENT_SCHEMA_VERSION`. Rules:

- A migration never deletes data it does not understand. Unknown keys are carried through untouched.
- Before running any migration, the pre-migration document is copied to
  `door3.personal.backup.v{n}` and left there permanently. It costs 30 KB and it is the difference
  between a bad migration being an annoyance and being a loss.
- If a migration throws, the store loads empty, keeps the raw string in memory, and shows a
  persistent banner offering to download the unmigrated JSON.
- **A migration must also be tolerant of `programmeId` values that no longer exist.** Regenerating
  the data reassigns `id` — the export script numbers records by enumeration order (`for i, r in
  enumerate(...)`). This is a real hazard, addressed below.

### The `id` stability problem, and the fix

`id` is a positional index assigned at export. **Re-running the export after adding a record
renumbers everything after it, and a shortlist keyed on `id` would silently point at different
programmes.**

The shortlist therefore stores **three** identifiers per entry:

- `programmeId` — the current `id`, fast path.
- `stableKey` — the §4.6 group key (`"U:hfm-detmold.de/…"` or `"K:Germany|…|…"`). Stable across
  regenerations as long as the source URL is stable.
- `label` — `institution — programme`, frozen at the moment of shortlisting.

On load, each entry resolves in that order: `id` if `stableKey` still matches; else `stableKey`;
else fuzzy-match `label` and mark the entry `needsReview: true`, rendering it amber in the shortlist
with *"this record moved — check it is still the right one"*. **An entry is never dropped.**

`meta.json` carries `generated`; when it changes and any entry fails `id` resolution, the app shows
a one-time *"the data was updated — N shortlist entries were re-matched"* notice.

### Export / import

- **Export** — a button in Settings and in the shortlist header. Serialises the document plus
  `{exportedAt, appVersion, dataGenerated}` and triggers a download of
  `door3-shortlist-YYYY-MM-DD.json`. In the normal static build this is an `<a download>` with a
  blob URL. **In the single-file offline build it is also a `<textarea>` showing the raw JSON with a
  "select all" button**, because a file:// page and some embedded viewers block programmatic
  downloads. He must always be able to get his data out by selecting text.
- **Import** — a file picker *and* a paste box. Validates `schemaVersion`, runs the migration chain,
  then offers **merge** (union by `stableKey`; on conflict keep the entry with the later
  `updatedAt`, and keep both notes joined by `\n\n---\n\n`) or **replace**. Merge is the default.
- **Nudge** — if `lastExportedAt` is more than 14 days old and the shortlist is non-empty, a
  dismissible bar appears once per session: *"You have N shortlisted programmes and haven't exported
  since {date}."* This is the only defence against a cleared browser and it costs nothing.

### What is stored

Per record: `status` (one of `new` · `interested` · `shortlisted` · `applying` · `applied` ·
`rejected` · `accepted` · `ruled-out`), a free-text `note`, a `rating` 0–5, arbitrary `tags`,
per-record `tasks` (a checklist with optional due dates — the portfolio, the language certificate,
the email to HfMT Köln), and `createdAt` / `updatedAt`. Plus global: saved filter presets, the
active sort, dismissed banners, and `lastExportedAt`.

Funding schemes get the same treatment under a separate `funding` map, keyed by `f{id}` with the
same three-identifier resolution (`stableKey` for a scheme is its normalised URL, falling back to
its `name`).

---

## 6. Stack

### Decision

| Layer | Choice | Version |
|---|---|---|
| Language | TypeScript | `5.9.3` |
| UI runtime | Preact + hooks | `10.29.8` |
| Router | `preact-iso` (hash mode, see §7) | `2.12.2` |
| Build | Vite | `7.1.9` |
| Preact/Vite glue | `@preact/preset-vite` | `2.10.6` |
| Single-file build | `vite-plugin-singlefile` | `2.3.3` |
| State | `zustand` (with `preact/compat` alias) | `5.0.15` |
| Long-list rendering | none — CSS `content-visibility` | — |
| Search | none — `src/search/scan.ts` | — |
| Dates | none — `src/derive/deadline.ts` | — |
| Styling | plain CSS with custom properties, one `app.css` | — |
| Tests | Vitest | `3.2.4` |
| Data derivation | Node script, no deps | — |

**Pinned versions, not ranges.** The constraint is "maintainable by an agent in one pass"; a
`package-lock.json` plus exact `dependencies` means the agent that opens this repo in six months
builds the same thing. Note the deliberate choices *against* latest: TypeScript is pinned to `5.9.3`
rather than the `7.0.2` currently on npm, and Vite to `7.1.9` rather than `8.2.1`, because
`@preact/preset-vite@2.10.6` and `vite-plugin-singlefile@2.3.3` are known-good against those majors.
A one-pass agent cannot debug a peer-dependency mismatch across three plugins. Upgrade later,
deliberately, with the tests green.

```jsonc
// app/package.json — exact list
{
  "dependencies": {
    "preact": "10.29.8",
    "preact-iso": "2.12.2",
    "zustand": "5.0.15"
  },
  "devDependencies": {
    "@preact/preset-vite": "2.10.6",
    "@types/node": "22.18.1",
    "typescript": "5.9.3",
    "vite": "7.1.9",
    "vite-plugin-singlefile": "2.3.3",
    "vitest": "3.2.4"
  }
}
```

**Six runtime-adjacent packages. Total measured runtime bundle: ~7 KB gzip** (Preact 5.2 KB +
preact-iso ~1.2 KB + zustand ~0.9 KB), plus application code.

### Justification, choice by choice

**Preact over React.** Measured (§0.4): **5.2 KB gzip versus 58.7 KB**. On a 400 kbit/s link that is
1.1 s of first paint recovered — larger than the entire `index.json` transfer. The app uses hooks, a
router and a store; nothing here needs React's concurrent features, Suspense, or the server
components story. `preact/compat` is aliased so `zustand` works unmodified. *Rejected: React 19* —
53.5 KB gzip for features this app does not use, against a constraint that explicitly names a
mid-range phone. *Rejected: Svelte / SolidJS* — comparable or better runtime size, but a smaller
chance that a maintaining agent has the idioms right in one pass; Preact's API is React's.

**Vite over anything else.** It is the only build tool where the static build and the
single-file build are the *same* config with one plugin toggled by mode. *Rejected: esbuild alone* —
no dev server, no HTML entry handling, no plugin for inlining. *Rejected: Parcel* — fewer people and
fewer agents know its escape hatches. *Rejected: Next.js/Astro* — both want a server or a framework's
routing conventions; the constraint is static files and one HTML file.

**`vite-plugin-singlefile` for the offline build.** It inlines every JS and CSS asset into one HTML
file. The **data** is inlined by our own build step (§8.3) rather than by the plugin, because the
plugin inlines emitted assets and `public/data/*.json` are fetched at runtime, not imported.
Measured budget: raw JSON inlined gives a **2.05 MB** single file; gzip+base64 inlined with a
`DecompressionStream('gzip')` decode gives **0.92 MB**. **Take the 2.05 MB.** It runs from a USB
stick where there is no network and no transfer cost, `DecompressionStream` adds a startup dependency
and an async boot path that the online build does not have, and a file that opens with zero moving
parts is worth more than 1.1 MB of disk. *Rejected: two separate codebases* — the whole point is one
source, two outputs.

**Zustand over Context / Redux / signals.** 0.9 KB gzip, one store, no provider, and selector-based
subscription so the filter panel re-rendering does not re-render 356 cards. *Rejected: Context +
`useReducer`* — every consumer re-renders on every filter keystroke, which is exactly the thing that
makes a list feel bad on a phone. *Rejected: Redux Toolkit* — 12 KB gzip and ceremony for a
single-user app. *Rejected: `@preact/signals`* — genuinely good and slightly smaller, but zustand's
store-with-selectors shape is more likely to be got right by an agent in one pass.

**No virtualisation library.** 356 cards is not a virtualisation problem. `content-visibility: auto`
plus `contain-intrinsic-size: 0 132px` on the card gives the browser permission to skip layout and
paint for off-screen cards at zero JS cost and zero bundle cost, and it keeps Ctrl-F, scroll
restoration and accessibility intact — all of which virtualisation breaks. *Rejected:
`@tanstack/react-virtual`* — 3.9 KB gzip, a `preact/compat` dependency, broken in-page find, and it
solves a problem that starts around 5,000 rows.

**No date library.** §4.2 explains why a parser that *wants* to produce a date is the wrong tool.
Formatting uses `Intl.DateTimeFormat`, which is built in. *Rejected: `date-fns` (4.4.0)* — 
would only be used for `format` and `differenceInDays`, both three lines.

**Plain CSS.** One file, custom properties for the palette, `prefers-color-scheme` for dark mode,
`@media` for the phone-first layout. *Rejected: Tailwind* — a build-time dependency and a class
vocabulary, for an app with about fifteen components. *Rejected: CSS-in-JS* — runtime cost on the
device that has the least of it.

---

## 7. Routing and URL state

### Decision

**Hash routing. Path segment identifies the view; the query string after the hash carries filter
state.**

```
#/                                    the list, no filters
#/?c=DE,AT&cb=free,u15&deg=1&au=0     filtered list
#/?q=tonmeister&sort=fit              searched list
#/p/261                               programme record 261
#/p/261?c=DE                          record 261, with the list's filters preserved for "back"
#/g/U:hfm-detmold.de%2F...            a duplicate group, all members
#/funding                             the funding view
#/funding?te=yes&adm=no               filtered funding
#/f/12                                funding scheme 12
#/shortlist                           personal state view
#/compare/261,72,5                    side-by-side, up to 4
#/settings
```

**Hash routing, not history routing**, for one non-negotiable reason: the single-file build runs
from `file://` off a USB stick, where the History API cannot change the path and a server rewrite
does not exist. Hash routing is the only scheme where **the same URLs work identically** in the
hosted build and the offline file. It also removes the need for a GitHub Pages `404.html` SPA
rewrite hack.

### Parameter table

Short keys, because the URL is meant to be pasted into a phone message.

| Key | Filter | Encoding |
|---|---|---|
| `q` | search | `encodeURIComponent`, spaces as `+` |
| `c` | country | comma-joined ISO-ish short codes from a build-generated table in `meta.json` |
| `rg` | region | comma-joined slugs (`s-eu`, `fr-bnl`, `c-e`, `uk-ie`, `de-sp`, `nord`, `oth`) |
| `st` | subtype | comma-joined slugs |
| `lv` | level | comma-joined slugs |
| `deg` | real degree only | `1` |
| `ch` | chance | `s`,`p`,`w` |
| `vd` | verdict | `w`,`c`,`a`,`none` |
| `cb` | cost band | `free`,`u15`,`15-5k`,`5-15k`,`o15k`,`np` |
| `gk` | gate kind | `pf`,`pt`,`pa`,`ie`,`at`,`nf` |
| `au` | audition certainty | comma-joined from `conf`,`susp`,`none`; absent = the default (exclude `conf` only) |
| `dsp` | contradicted field | comma-joined from `aud`,`cost`,`exist` |
| `la` | language | comma-joined slugs |
| `lok` | language he reads | `1` |
| `pp` | public/private | `pub`,`priv`,`ns` |
| `fu` | funding attached | `full`,`part`,`none`,`ns` |
| `dl` | deadline status | `dated`,`rec`,`prior`,`roll`,`unv`,`noint`,`na`,`none` |
| `cx` | has a correction | `1` |
| `fit` | minimum fit | integer |
| `dup` | show duplicate rows | `1` (default off = deduped) |
| `sort` | sort key | `fit`,`chance`,`cost`,`deadline`,`country`,`name` |

### Rules

- **Only non-default values appear.** The empty state is exactly `#/`. A URL never carries
  `dup=0&fit=0&sort=fit` because those are defaults — this keeps shareable URLs short and makes them
  survive default changes.
- **Unknown keys and unknown values are ignored, never fatal.** An old link with a facet value that
  no longer exists loads the rest of the filters and shows a dismissible *"part of this link no
  longer matches the data"* note.
- **The URL is the single source of truth for filter state.** The store derives from it; changing a
  filter calls `history.replaceState` (not `pushState`) so the back button leaves the list rather
  than stepping back through twelve checkbox clicks. Opening a record uses `pushState`, so back
  returns to the list with its filters intact.
- **Every record is addressable by two URLs**: `#/p/{id}` (fast, positional) and
  `#/g/{stableKey}` (durable across regeneration). The record page canonicalises to `#/p/{id}` and
  the share button offers the `#/g/` form, labelled *"link that survives a data update"*.
- **Personal state is never in the URL.** It is his, it is large, and a shared link must not carry
  his notes.

### Rejected alternatives

**History/path routing with a `404.html` rewrite.** Rejected: works on GitHub Pages, breaks on
`file://`, and would mean two routing modes to keep in sync.

**Base64 or LZ-compressed filter blob in one parameter.** Rejected: shorter, and unreadable and
unhandeditable. He should be able to see `c=DE,AT` in a URL and understand it.

**Storing filter state only in the store, with a "copy link" button.** Rejected: the requirement is
that *every* filter combination is a shareable URL, which means the address bar must always be
correct, not correct on demand.

---

## 8. Build and deploy

Repo: `github.com/ZizouX0/master`. The app lives in `app/`; the research pipeline stays where it is.

### 8.1 The data seam

**The contract between the research pipeline and the app is exactly three files in
`app/public/data/`, and their shapes.** `.masters-search/export_door3_app.py` writes them. The app
never imports Python, never reads `.masters-search/`, and never hard-codes a facet value that is not
read from `meta.json`.

```
.masters-search/export_door3_app.py          (research side — owns the shape)
        │  writes
        ▼
app/public/data/{programmes,funding,meta}.json     ← the seam
        │  read by
        ▼
app/tools/derive.mjs                          (app side — owns the derivations)
        │  writes
        ▼
app/public/data/{index,detail}.json + meta.json (augmented)
        │  fetched by
        ▼
app/src/**                                    (never touches raw programmes.json)
```

Regenerating the research data means running the Python export and then `npm run data`. **No
application source file changes.** That is the requirement, and it is enforced by:

- `app/tools/schema.json` — a JSON Schema for the three input files. `npm run data` validates
  against it **first** and fails loudly with the offending record's `id` if the shape drifted.
  Adding a field is a warning; removing or retyping one is an error.
- `meta.json` supplying every facet vocabulary, so a new country or language appears in the UI with
  no code change.
- `app/tools/derive.test.mjs` asserting the invariants that would otherwise fail silently:

  | Invariant | Expected |
  |---|---:|
  | records | 398 |
  | dedupe groups (§4.6) | 356 |
  | tier-U / tier-K split | 328 / 70 |
  | `verdict` and `correction` co-occur | 127 / 127 |
  | `auditionCertainty` confirmed / suspected / none | 36 / 46 / 316 |
  | `auditionCertainty` sums to the exported `needsAudition` | 82 |
  | `costDisputed` / `existenceDisputed` (all verified) | 32 / 6 |
  | strong + cheap + degree, excluding **confirmed** auditions — matches `DOOR3.md`'s 29 | **29** |
  | same, excluding all `needsAudition` | 26 |
  | `deadline.kind === 'dated'` entries with an ISO year below 2027 | **0** |
  | `deadline` entries carrying a year when `kind !== 'dated'` | **0** |

  The last two are the ones that matter most: they are the machine check on "never invent a date".

### 8.2 Commands

```bash
cd app

npm ci                 # exact install from package-lock.json

npm run data           # node tools/derive.mjs
                       #   validate  public/data/{programmes,funding,meta}.json against schema.json
                       #   derive    fit, deadline, gateKind, auditionCertainty, dupGroup,
                       #             correctionFlags, blockers, funding eligibility tri-states
                       #   emit      public/data/index.json      (~268 KB raw / 37 KB gzip)
                       #             public/data/detail.json     (~1,362 KB raw / 452 KB gzip)
                       #             public/data/funding.json    (rewritten, + derived flags)
                       #             public/data/meta.json       (+ slug tables, schemaVersion)
                       #   print     a size report identical in format to §0.1

npm run typecheck      # tsc --noEmit
npm test               # vitest run   (derivation invariants + parser unit tests)

npm run build          # npm run data && vite build              → app/dist/
npm run build:single   # npm run data && vite build --mode single → app/dist-single/door3.html

npm run build:all      # both, plus the size report
npm run dev            # vite dev server on :5173
npm run preview        # serve app/dist/ locally
```

`npm run build` runs `npm run data` first, so the derived files can never be stale relative to the
source data. `derive.mjs` is idempotent and takes ~1 s.

### 8.3 Output paths

| Target | Path | Contents |
|---|---|---|
| Static site | `app/dist/` | `index.html`, `assets/*.js`, `assets/*.css`, `data/{index,detail,funding,meta}.json` |
| Offline file | `app/dist-single/door3.html` | one file, ~2.1 MB, all JS + CSS + all four JSON payloads inlined |

Neither is committed. `.gitignore` already has `app/dist/`; add `app/dist-single/`.

The single-file build sets `import.meta.env.MODE === 'single'`; `src/data/load.ts` branches on it:
in `single` mode it reads from `window.__DOOR3_DATA__` (written by a Vite plugin in `vite.config.ts`
that reads `public/data/*.json` at build time and emits a `<script>` block) instead of `fetch`. That
branch is **four lines** and is the only mode-aware code in the app.

### 8.4 Also to be written

- `app/tools/measure.py` — regenerates §0.1 and §0.2 so the numbers in this document can be
  re-verified rather than trusted. It is the script used to produce them.
- `app/tools/bench.mjs` — regenerates §0.3 and §0.4.

### 8.5 Deploy

GitHub Actions, `.github/workflows/pages.yml`, triggered on push to `main` when
`app/**` or `.masters-search/export_door3_app.py` changes:

```
actions/checkout → actions/setup-node@v4 (node 22, cache npm)
  → npm ci
  → npm run typecheck && npm test
  → npm run build
  → actions/upload-pages-artifact  (path: app/dist)
  → actions/deploy-pages
```

Plus a second job on tags that runs `npm run build:single` and attaches
`app/dist-single/door3.html` to a GitHub Release — the USB-stick copy, downloadable without cloning.

`vite.config.ts` sets `base: './'` so both builds use relative asset paths. That makes the hosted
site work under the `/master/` project-pages prefix **and** makes the `dist/` folder work when copied
to a USB stick as a folder, in addition to the single file.

Caching: `index.json`, `detail.json` and `funding.json` are emitted with a content hash in the
filename and a manifest in `meta.json`; `meta.json` itself is served with
`Cache-Control: no-cache` semantics (GitHub Pages will not honour a custom header, so the app
appends `?v={buildId}` to the `meta.json` fetch, where `buildId` is injected at build time). This is
the minimum needed so a data regeneration is actually seen by a phone that has the old files cached.

### Rejected alternatives

**Running the Python export inside CI.** Rejected: it depends on the whole `.masters-search`
research pipeline including cached scrape results. The JSON files are committed and are the seam.
CI consumes them; a human or an agent regenerates them deliberately.

**Netlify or Cloudflare Pages.** Both would give brotli automatically — 354 KB instead of 454 KB for
the detail file. Rejected as the *primary* target only because the repo is already on GitHub and the
constraint is "no backend, static files", which Pages satisfies with zero new accounts. Noted in §11
as the cheapest available improvement if the loading ever feels slow.

**Committing `dist/`.** Rejected: it makes every data regeneration a large binary diff.

---

## 9. File and folder layout

```
app/
├── DESIGN-ARCHITECTURE.md          this document
├── package.json                    exact versions, §6
├── package-lock.json
├── tsconfig.json                   strict: true, noUncheckedIndexedAccess: true
├── vite.config.ts                  base './', preact preset, singlefile plugin under mode 'single',
│                                   inline-data plugin under mode 'single'
├── index.html
├── public/
│   └── data/
│       ├── programmes.json         INPUT  — written by export_door3_app.py, 398 records
│       ├── funding.json            INPUT/OUTPUT — rewritten in place with derived flags
│       ├── meta.json               INPUT/OUTPUT — augmented with slug tables + schemaVersion
│       ├── index.json              OUTPUT — derive.mjs
│       └── detail.json             OUTPUT — derive.mjs
├── tools/
│   ├── derive.mjs                  the whole build-time derivation, no dependencies
│   ├── schema.json                 JSON Schema for the three input files
│   ├── derive.test.mjs             invariant assertions, §8.1
│   ├── measure.py                  regenerates §0.1 and §0.2
│   └── bench.mjs                   regenerates §0.3 and §0.4
└── src/
    ├── main.tsx
    ├── app.css
    ├── types.ts                    §10 — the only place the record shape is declared
    ├── data/
    │   ├── load.ts                 fetch or inline (mode branch), 4 lines of mode awareness
    │   ├── indexCodec.ts           short-key ↔ long-key mapping, generated by derive.mjs
    │   └── join.ts                 programme ↔ funding link derivation, §4.7
    ├── derive/                     ★ shared with tools/derive.mjs — imported by both,
    │   │                             so the app and the build can never disagree
    │   ├── deadline.ts             §4.2 cascade
    │   ├── fit.ts                  §4.1 scoring
    │   ├── gate.ts                 §4.5 gateKind
    │   ├── dedupe.ts               §4.6 group key
    │   ├── correction.ts           §4.4 flags
    │   ├── funding.ts              §4.7 tri-states
    │   └── *.test.ts
    ├── search/
    │   ├── scan.ts                 §2 weighted linear scan
    │   ├── normalise.ts            NFKD fold, diacritic strip, lowercase
    │   └── scan.test.ts
    ├── filter/
    │   ├── pipeline.ts             §3.2 evaluation order
    │   ├── facets.ts               §3.3 leave-one-out counts
    │   ├── definitions.ts          the 19 filters as data, driving both UI and URL codec
    │   └── *.test.ts
    ├── state/
    │   ├── store.ts                zustand: data, filters, ui
    │   ├── personal.ts             §5 — localStorage, debounced writes
    │   ├── migrate.ts              §5 — ordered migration chain
    │   ├── resolve.ts              §5 — id / stableKey / label resolution
    │   └── *.test.ts
    ├── router/
    │   ├── routes.tsx
    │   └── urlState.ts             §7 — parse and serialise, driven by filter/definitions.ts
    └── components/
        ├── ListView.tsx            content-visibility card list
        ├── ProgrammeCard.tsx
        ├── RecordPage.tsx
        ├── GroupPanel.tsx          §4.6 "source rows (N)" with disagreement highlighting
        ├── CorrectionBlock.tsx     §4.4 the verified-override banner
        ├── DisputeChips.tsx        §4.4 audition/cost/existence chips, each quoting its phrase
        ├── AuditionBadge.tsx       §4.5 confirmed vs suspected, with provenance
        ├── DeadlineBadge.tsx       §4.2 badge + verbatim reveal
        ├── FitBar.tsx              §4.1 score + fitWhy + the honesty line
        ├── CostCell.tsx            §4.3 band, struck through when contradicted
        ├── FilterPanel.tsx         §3 with leave-one-out counts
        ├── FundingView.tsx         §4.7 tri-state chips
        ├── ShortlistView.tsx       §5, grouped by dupGroup with the duplicate warning
        ├── ComparePage.tsx
        └── SettingsPage.tsx        export / import / nudge
```

**The `src/derive/` directory is imported by `tools/derive.mjs`.** The build script is written as ESM
TypeScript compiled on the fly (`node --experimental-strip-types`, available in Node 22), so the fit
formula, the deadline cascade and the dedupe key exist exactly once. If they were duplicated, the
badge on a card and the score in the file would drift and nobody would notice for months.

---

## 10. TypeScript interfaces

`src/types.ts`, verbatim.

### 10.1 The record

```ts
/** Schema version of the data contract. Bump when the seam (§8.1) changes shape. */
export const DATA_SCHEMA_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Enums — every value is present in meta.json; never hard-code a list in a component.
// ─────────────────────────────────────────────────────────────────────────────

export type Chance   = 'Strong' | 'Possible' | 'Weak';
export type Verdict  = 'WORTH IT' | 'CONDITIONAL' | 'AVOID' | '';
export type CostBand =
  | 'Free' | 'Under EUR 1.5k/yr' | 'EUR 1.5k-5k/yr'
  | 'EUR 5k-15k/yr' | 'Over EUR 15k/yr' | 'Not published';
export type FundingLevel = 'Full' | 'Partial' | 'None' | 'Not stated';
export type PublicPrivate = 'Public' | 'Private' | 'Not stated';
export type Region =
  | 'Southern Europe' | 'France & Benelux' | 'Central & Eastern'
  | 'UK & Ireland' | 'German-speaking' | 'Nordics & Baltics' | 'Other';

/** Raw six-value enum as exported. Kept for display; `GateKind` is what the app filters on. */
export type RawGate =
  | 'Portfolio + exam/interview' | 'None found in the text' | 'Portfolio only'
  | 'Exam/interview only' | 'Not published — ask them' | 'AUDITION — hardest for you';

/** §4.5 — the three-way distinction DOOR3.md insists on, plus the residual cases. */
export type GateKind =
  | 'portfolio'             // submit finished tracks — a twelve-month build
  | 'production-test'       // "here is raw material, make a production" — the job, not a barrier
  | 'performance-audition'  // play an instrument, ear training — NOT reachable
  | 'interview-exam'
  | 'ask-them'
  | 'none-found';

/** §4.2 — never carries a year unless the source stated one for 2027 or later. */
export type DeadlineKind =
  | 'dated'          // an explicit date, year >= 2027                    → has `iso`
  | 'recurring'      // "15 February annually" — month and day, NO year   → has `month` + `day`
  | 'prior-cycle'    // the source states a previous intake's date        → NO date, ever
  | 'rolling'        // rolling admissions / no published deadline
  | 'unverified'     // the source says UNVERIFIED, or a bare unyeared date
  | 'no-intake'      // "NO INTAKE IN 2027"
  | 'not-applicable'
  | 'none';          // the field was empty

export interface ParsedDeadline {
  kind: DeadlineKind;
  /** ISO YYYY-MM-DD. Present ONLY when kind === 'dated'. Never inferred. */
  iso?: string;
  /** 1–12. Present ONLY when kind === 'recurring'. */
  month?: number;
  /** 1–31. Present ONLY when kind === 'recurring'. */
  day?: number;
  /** The unmodified source string. Always present. The badge is a summary of this. */
  raw: string;
}

/** Flags this app derives itself. The three DISPUTE fields come from corrections.py — see below. */
export type CorrectionFlag = 'duplicate' | 'language' | 'funding';

/**
 * §4.5 — how sure we are that a live performance/ear test is required.
 * `confirmed` is a hard gate in the fit score; `suspected` is a −20 penalty and a warning.
 * NEVER collapse these back into the exported `needsAudition` boolean: 46 of its 82 trues
 * rest on a regex over the unverified `audition` field.
 */
export type AuditionCertainty = 'confirmed' | 'suspected' | 'none-found';

/** §4.5 — facts encoded from DOOR3.md rather than re-derived from the record. */
export type Blocker = 'prerequisite-degree' | 'genuine-ear-gate';

// ─────────────────────────────────────────────────────────────────────────────
// The index row — what index.json holds, after decoding short keys.
// Everything the list, the filters, the facet counts and the sort need.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgrammeIndex {
  /** Positional, reassigned on every data export. NOT durable — see `stableKey`. */
  id: number;
  /** §4.6 group key, e.g. "U:hfm-detmold.de/en/..." or "K:Germany|detmold hochschule|...". */
  stableKey: string;
  /** §4.6 — records sharing a stableKey. `dupGroupSize` is 1 for a singleton. */
  dupGroupSize: number;
  /** True for the one member of the group the list shows. §4.6 primary selection. */
  isGroupPrimary: boolean;
  /** Fields on which members of this group disagree. Empty for singletons. */
  groupDisagreements: Array<'costBand' | 'chance' | 'funding' | 'gate' | 'level'>;

  country: string;
  region: Region;
  city: string;
  institution: string;
  programme: string;
  subtype: string;
  level: string;
  isDegree: boolean;

  gate: RawGate;
  gateKind: GateKind;
  /** True when gateKind came from prose (rule 2/3 of §4.5) rather than the enum.
   *  The UI must show the matched phrase when this is true. */
  gateKindInferred: boolean;
  /** As exported by the pipeline: 82 of 398. Kept for fidelity with DOOR3.xlsx.
   *  Do NOT use this to gate the fit score — use `auditionCertainty`. */
  needsAudition: boolean;
  auditionCertainty: AuditionCertainty;
  blockers: Blocker[];

  // ── Dispute channel, from .masters-search/corrections.py (§4.4). ──────────
  // Each holds THE MATCHED PHRASE, or '' when not disputed. Quote it; do not paraphrase.
  /** 74 records. Provenance varies — see `auditionDisputedSource`. */
  auditionDisputed: string;
  /** Which field the audition match came from. 'audition' means UNVERIFIED prose. */
  auditionDisputedSource: 'correction' | 'verdictWhy' | 'audition' | '';
  /** 32 records, all from `correction`, therefore all verified. */
  costDisputed: string;
  /** 6 records, all from `correction`, therefore all verified. Hard gate in §4.1. */
  existenceDisputed: string;
  /** Rollup of the three above: 104 records. NOT a synonym for "verified" — 45 have no verdict. */
  hasDispute: boolean;

  chance: Chance;
  /** One-line justification for `chance`. Short (max 110 bytes), so it rides in the index. */
  whyChance: string;
  verdict: Verdict;

  costBand: CostBand;
  language: string;
  languageOk: boolean;
  publicPrivate: PublicPrivate;
  funding: FundingLevel;

  deadline: ParsedDeadline;

  /** True when a `correction` exists (127 of 398) — i.e. a human re-opened the source page. */
  hasCorrection: boolean;
  correctionFlags: CorrectionFlag[];

  /** §4.1 — 0–100. 0 means a hard gate fired; check `blocked`. */
  fit: number;
  blocked: boolean;
  /** Human-readable clauses that produced `fit`. Never show the number without these. */
  fitWhy: string[];

  /** Host only, for the "official page" affordance and the funding join. Full URL is in detail. */
  urlHost: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// The detail record — what detail.json holds. Every field is free prose.
// Empty strings are omitted at build time, so every field is optional.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgrammeDetail {
  id: number;
  verdictWhy?: string;
  /** §4.4 — a verified override, in prose. NEVER parse its "index N" references (§4.4 trap). */
  correction?: string;
  qualification?: string;
  accreditation?: string;
  /** §4.3 — free text, six currencies, sometimes per-semester, often the EEA rate. Display only. */
  tuition?: string;
  otherFees?: string;
  totalCost?: string;
  scholarshipDetail?: string;
  scholarship?: string;
  entry?: string;
  acceptsNonMusic?: string;
  portfolio?: string;
  audition?: string;
  /** The verbatim source of `ProgrammeIndex.deadline.raw`. */
  deadline?: string;
  opens?: string;
  duration?: string;
  languageReq?: string;
  englishTest?: string;
  study?: string;
  recommendation?: string;
  /** May contain several URLs separated by " ; " and parenthetical annotations. */
  url?: string;
  foundBy?: string;
}

/** The shape a component receives once detail has loaded. */
export type Programme = ProgrammeIndex & { detail?: ProgrammeDetail };

// ─────────────────────────────────────────────────────────────────────────────
// Funding — §4.7. Every derived eligibility is tri-state; `unknown` is honest.
// ─────────────────────────────────────────────────────────────────────────────

export type Tri = 'yes' | 'no' | 'unknown';

export interface FundingScheme {
  id: number;
  stableKey: string;              // normalised URL, falling back to a slug of `name`
  name: string;
  provider: string;
  country: string;

  whoCanApply: string;
  ageLimit: string;
  subjectScope: string;
  coverage: string;
  duration: string;
  numberOfAwards: string;
  howToApply: string;
  requiresAdmissionFirst: string;
  requiresWorkExperience: string;
  languageRequirement: string;
  competitiveness: string;
  notes: string;
  url: string;
  foundBy: string;

  // derived, build-time
  deadline: ParsedDeadline;
  opensParsed: ParsedDeadline;
  tunisianEligible: Tri;
  /** Explicit numeric cap only. null when the source only says "he clears it". */
  ageCap: number | null;
  ageOk: Tri;
  needsAdmissionFirst: Tri;
  needsWorkExperience: Tri;
  /** The scheme structurally cannot fund a full master's (e.g. Erasmus+ ICM's 12-month cap). */
  structurallyIneligible: boolean;
  /** The sentence each tri-state was derived from, for display next to the chip. */
  evidence: Partial<Record<
    'tunisianEligible' | 'ageOk' | 'needsAdmissionFirst' | 'needsWorkExperience', string
  >>;
}

/** §4.7 — recomputed at load, not stored. */
export interface FundingLink {
  fundingId: number;
  programmeId: number;
  kind: 'institution' | 'country';
}

// ─────────────────────────────────────────────────────────────────────────────
// meta.json
// ─────────────────────────────────────────────────────────────────────────────

export interface Meta {
  schemaVersion: number;
  scope: string;
  generated: string;              // "2026-08"
  buildId: string;                // injected at build time, used for cache-busting
  total: number;
  funding: number;
  counts: Record<string, number>;
  facets: Record<string, Record<string, number>>;
  /** Slug ↔ value tables for §7's URL codec, generated so the UI never hard-codes one. */
  slugs: Record<string, Record<string, string>>;
}
```

### 10.2 Personal state

```ts
export const CURRENT_SCHEMA_VERSION = 1;
export const PERSONAL_STORAGE_KEY = 'door3.personal.v1';

export type ItemStatus =
  | 'new' | 'interested' | 'shortlisted' | 'applying'
  | 'applied' | 'rejected' | 'accepted' | 'ruled-out';

export interface Task {
  id: string;                     // crypto.randomUUID()
  text: string;
  done: boolean;
  /** ISO YYYY-MM-DD. His own date, freely chosen — unrelated to §4.2's refusal to invent. */
  due?: string;
  createdAt: string;              // ISO 8601
}

/**
 * One annotated item. Three identifiers because `id` is positional and moves
 * when the data is regenerated (§5). Resolution order: id → stableKey → label.
 */
export interface PersonalEntry {
  /** 'p' for a programme, 'f' for a funding scheme. */
  kind: 'p' | 'f';
  /** The id at the time of writing. Fast path; may be stale. */
  refId: number;
  /** §4.6 group key (programmes) or normalised URL (funding). Durable. */
  stableKey: string;
  /** "Institution — Programme", frozen when the entry was created. Last-resort match. */
  label: string;

  status: ItemStatus;
  /** 0 = unrated. */
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  note: string;
  tags: string[];
  tasks: Task[];

  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601

  /** Set at load when refId did not resolve and stableKey/label was used. Never persisted true
   *  across a successful re-resolution. Renders amber: "this record moved — check it". */
  needsReview?: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  /** The §7 query string, without the leading '?'. Stored as text so it survives filter changes. */
  query: string;
  createdAt: string;
}

export interface PersonalStateV1 {
  schemaVersion: 1;
  /** Keyed "p{id}" / "f{id}" at write time, but resolution always goes through PersonalEntry. */
  entries: Record<string, PersonalEntry>;
  presets: FilterPreset[];
  ui: {
    sort: string;
    dismissedBanners: string[];
    lastSeenDataGenerated: string;   // meta.generated at last load; drives the "data updated" notice
  };
  /** ISO 8601, or null if never. Drives the 14-day export nudge (§5). */
  lastExportedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalExport {
  format: 'door3-personal';
  exportedAt: string;
  appVersion: string;
  dataGenerated: string;
  state: PersonalStateV1;
}

/** Migration chain (§5). One pure function per version step, applied in order. */
export type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;
export const MIGRATIONS: Migration[] = [ /* v1 is the first version; empty today */ ];
```

---

## 11. Risks, flagged

1. **`id` is positional and moves.** `export_door3_app.py` numbers records by `enumerate()`. Adding
   one record renumbers everything after it. §5's three-identifier resolution handles it, but the
   real fix is for the export to emit a stable key of its own. **Recommend: add a `key` field to the
   export**, derived once from the source URL, and let the app stop guessing.

2. **`correction`'s `"DUPLICATE of index N"` references are stale — all 65 of them cross a country
   boundary.** Measured in §4.4. This is the single most likely way a coding agent silently corrupts
   the app. The spec forbids dereferencing them; a lint rule or a test should enforce it.

3. **`verdict` covers 127 of 398 records. 271 were never re-verified.** The fit score gives an
   unverified record 8 of 30 on the verdict component, which is a guess. Every surface that shows
   `fit` must carry the caveat; if it does not, the app will read as more confident than the
   research is.

4. **`hasDispute` reads like "verified" and is not.** 104 records carry a dispute; **only 59 have a
   verdict**. The 45 difference is entirely `auditionDisputed` firing from the raw, unverified
   `audition` field — 51 of its 74 hits come from there. Any UI that labels a dispute chip
   *"verification found this wrong"* without checking provenance will make 51 unverified regex hits
   look like human findings. §4.5's `auditionCertainty` is the mitigation; §4.4 recommends the
   pipeline emit the provenance directly so the app stops inferring it.

5. **The exported `needsAudition` grew from 16 to 82 and silently moved a published headline.**
   `DOOR3.md` says *"reachable without a performance audition — 247 of 261"*. Against the current
   data the figure is **186** on the raw boolean and **227** on `auditionCertainty`. Likewise the
   *"29 strong, cheap and audition-free"* headline is 26 on the raw boolean and 29 on
   `auditionCertainty`. The app must state which rule produced any number it shows, and
   `DOOR3.md` should be reconciled or annotated.

6. **`costBand` is wrong on records the corrections identify, and the app cannot compute the right
   value.** 32 records carry `costDisputed`, and **7 of them still sit in a cheap cost band**;
   `DOOR3.md` gives two factor-of-six examples (KASK Gent €8,800, Wallonia €5,369) and the module
   docstring names Edinburgh at ~£29,900 against a recorded "Under EUR 1.5k/yr". The app shows both
   values, strikes the chip through and refuses to pick — which means **a filter on "Free or under
   €1,500" still returns records that actually cost €8,800**, marked. There is no fix without
   someone re-banding those records by hand in the source data. **Highest-value manual follow-up
   available.**

7. **`gateKind` rule 3 and the medical-certificate exceptions are heuristics over prose.** The
   production-test vocabulary matches 59 records; the Novi Sad *аудиограм* and mdw Vienna
   *"Nachweis der einwandfreien Gehörfähigkeit"* exclusions are hard-coded from `DOOR3.md` and
   there may be others nobody has found. A false `performance-audition` makes a reachable programme
   look closed; the cascade deliberately biases toward that safer error and labels it.

8. **Three agents are writing to this repo concurrently.** During this analysis
   `app/public/data/*.json` was rewritten underneath me twice — from 1,839 records to 398, then
   again to add the dispute channel — and `funding.json` and `.masters-search/corrections.py`
   appeared. All numbers here are against the files as of **2026-08-14 02:13**, 45 fields per
   record. **§8.1's schema validation and §8.1's invariant table exist precisely because this will
   happen again**, and the invariants are written to fail loudly rather than drift.

9. **Mid-range-phone figures in §0.3 are derived (container × 5), not measured on a device.** The
   margins are large enough that the conclusions hold under a ×10 penalty — the worst search query
   would be 22 ms — but the numbers are not measurements and are labelled as such.

10. **GitHub Pages gives no brotli** (§0.5, measured). Moving to Cloudflare Pages would cut the
    detail file from 452 KB to 332 KB gzip-equivalent for zero code change. Cheapest available win
    if loading ever feels slow.

11. **The single-file build is 2.05 MB.** Fine from a USB stick, and it will feel slow if anyone
    ever emails it. The 0.92 MB gzip+base64 variant exists as a documented fallback in §6 if that
    becomes a real use case.

12. **`funding.json` has not been re-derived since the dispute channel landed.** It still carries no
    equivalent of `costDisputed` / `existenceDisputed`, and its eligibility prose (`"He clears it."`,
    50 `UNVERIFIED` competitiveness ratings) is classified only by this app's tri-state regexes in
    §4.7. Running `corrections.py`-style analysis over `notes` and `whoCanApply` would be the
    natural next step on the pipeline side.
