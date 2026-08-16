# Every file, and what it is

Everything produced across the whole search, from the first sweep to the live site.
Written 16 August 2026.

**If you only open four things:**

| | |
|---|---|
| 🌐 **https://zizoux0.github.io/master/** | The app. Door 3, all 398 records, with your deadlines and your own notes. |
| 📗 `results/DOOR3.xlsx` | The same data as a filterable workbook, 19 tabs. |
| 📄 `results/DOOR3.md` | The written version — read this if you want the argument, not the table. |
| 📗 `results/MASTER-all-opportunities.xlsx` | Everything ever collected: 1,839 rows, 88 countries, all three doors. |

---

## 1. The live app

Built from `app/`. Deployed from the `gh-pages` branch.

| File | What it is |
|---|---|
| **https://zizoux0.github.io/master/** | The site. Three screens: **This week** (what you owe and by when), **Find** (search, with the record opening beside the list), **Shortlist** (your tracker — starred, status, next action, notes, exportable). |
| **https://zizoux0.github.io/master/door3.html** | The same app as one 2.4 MB file. Save it and it works with no internet and no server — fonts included. |
| `app/dist/` | The built site as deployed. Regenerate with `npm run build`. |
| `app/dist-single/door3.html` | The offline copy, before upload. |

---

## 2. Door 3 — the final research (music production & studio craft, Europe)

This is the door you chose: making records, producing, mixing, studio craft.
**398 records · 261 real master's degrees · 130 not degrees · 41 countries · 149 verified by a second agent · 30 best bets.**

| File | What it is |
|---|---|
| `results/DOOR3.md` | The combined Door-3 document. Everything collected plus everything the deep sweep added, in one argument. |
| `results/DOOR3.xlsx` | 19 tabs, all filterable: by country, cost band, language, gate, verdict, degree-or-not, audition-or-not. |
| `results/pdf/DOOR3.pdf` | The same document, printable. |

**The decisive finding is in there:** filtering by your own hard constraints — real degree, no live audition, English or French, affordable — left 24 programmes, 21 of which had never been verified. Verifying exactly those 21 returned **1 worth it, 7 conditional, 13 avoid**. The one is **Politecnico di Milano** (computer engineering named first in the entry requirements, no portfolio, no entrance exam, English, €3,883/yr, with DSU Lombardia paying €5,800–6,700 in cash).

---

## 3. The earlier research — still valid, wider scope

These came before you narrowed to Door 3. Nothing in them is wrong; they simply cover more ground than you ended up wanting.

| File | What it is |
|---|---|
| `results/MASTER-all-opportunities.xlsx` | **The complete dataset** — 1,839 opportunities, 88 countries, 1,433 real degrees, 530 verified. Every sweep merged. |
| `results/THE-COMPLETE-GUIDE.md` | The long written guide to the whole search — how to read a fit score, what a portfolio means, what the cost columns mean. |
| `results/PATHS-DEEP-DIVE.md` | The three doors explained in depth: **1** sound/music/tech, **2** music business, **3** sound design & production. Written when you were deciding. |
| `results/ARTIST-ROUTE.md` + `.xlsx` | Doors 1 and 3 together, built when you asked to focus on those two as an artist. |
| `results/DEGREE-CHECK.md` | **The certificate audit.** Which "Master" titles are not master's degrees — *título propio*, RNCP-5 *Mastère*, *pós-graduação*, UK validation chains. This is what "I want masters not a certificate" produced. |
| `results/SHORTLIST.md` | The early shortlist, with each entry's location. |
| `results/SOUND-DESIGN-EUROPE.md` + `sound-design-europe.xlsx` | The first deep Europe sweep of sound design & production. |
| `results/SOUND-and-SCHOLARSHIPS.xlsx` | Sound design/production programmes joined with the scholarships that could fund them. |
| `results/PRIVATE-SCHOOLS.md` + `private-schools-es-pt-nl-it.xlsx` | Private institutions in Spain, Portugal, Netherlands, Italy. |
| `results/EUROPE-GAPFILL.md` + `europe-gapfill.xlsx` | The pass that covered European universities the earlier sweeps had missed. |
| `results/opportunities.xlsx` | Phase-1 raw opportunities workbook. |
| `results/ACTION-TIMELINE.md` | What to do when — written before the app's calendar existed. **The app's `This week` supersedes this.** |
| `results/COULD-NOT-VERIFY.md` | Honest list of what could not be confirmed from any published source. |
| `results/README.md`, `results/FILE-INDEX.md` | Earlier index files. **This file supersedes them.** |
| `results/pdf/*.pdf` | Printable versions of all the markdown documents above. |

### Superseded — don't start here

| File | Why |
|---|---|
| `results/console.html` | The first artifact. You said you didn't like it and went back to documents. |
| `results/door3-app.html` | The single-file HTML app. You said you wanted a real website, not HTML. Replaced by the live site and `door3.html`. |

---

## 4. The app's source

`app/` — Preact 10 + Vite 7 + zustand + TypeScript. No CSS framework, no component library, no search library, no backend, no analytics.

### Screens and components

| File | What it is |
|---|---|
| `src/views/ThisWeek.tsx` | The home screen. Five groups in the order of regret: already late → closing → open now → opening → the making. |
| `src/views/Find.tsx` | Search + filters + the list, with the record in a pane beside it. |
| `src/views/Record.tsx` | One programme in full — verdict, the **correction in full**, disputes, gates, money, dates, sources. |
| `src/views/Shortlist.tsx` | Your tracker. Status, next action, notes, export/import. |
| `src/views/Throw.tsx` | The funnel drawn as a fader: how 355 becomes 14, and what each stop costs you. |
| `src/components/ChannelStrip.tsx` | **The signature.** Rail texture = was this ever read by a human; meter block = what came back (**absent when nobody checked**); ladder = how tall the climb is. |
| `src/components/chips.tsx` | Verdict word, level, gate, cost band, language — the small honest labels. |
| `src/styles.css` | The whole design system in one file: six semantic tokens, the channel geometry, the type scale, one animation. |
| `src/views/kit.tsx`, `App.tsx`, `Layout.tsx`, `Field.tsx`, `Filters.tsx` | Shared shell and form pieces. |

### Data layer

| File | What it is |
|---|---|
| `src/data/calendar.ts` | The time layer. Never reads the clock itself — `now` is always passed in, so dates are testable. |
| `src/data/money.ts` | Scholarship eligibility. **Silence never counts as yes.** |
| `src/data/filters.ts`, `search.ts`, `dedup.ts` | The pipeline: facets, the hand-written weighted search, and duplicate grouping. |
| `src/data/patterns.ts` | Recognises the not-a-degree patterns (*título propio*, RNCP-5, *pós-graduação*, validation chains). |
| `src/data/load.ts`, `store.ts` | Loading and your saved state. |
| `src/lib/format.ts` | Rendering rules — including never printing a bare date for a `PRIOR CYCLE` deadline. |
| `public/data/programmes.json`, `index.json`, `detail.json`, `funding.json`, `meta.json` | The data the app ships. |
| **`public/data/calendar.json`** | **36 hand-curated dates** — 14 a human confirmed, 22 published annual rules, held apart. The only place a date may come from. Every entry carries a quote and a source. |

### Tests and checks — 106 unit + 44 browser + 13 offline

| File | What it is |
|---|---|
| `src/data/__tests__/*.test.ts` | 106 tests over the real data, not fixtures. |
| `verify/t-rebuild.mjs` | The 44-assertion kill test in a real browser against the built site. |
| `verify/t-offline.mjs` | 13 assertions run from `file://` — including that the fonts actually load. |
| `verify/t-widths.mjs` | No horizontal scroll at nine widths. |
| `scripts/build-calendar.mjs` | **Re-checks every calendar quote verbatim against its source and exits 1 if one doesn't match.** Runs before every build. |
| `scripts/build-fonts.mjs` | Subsets the four fonts and computes the metric overrides. `--check` fails on drift. |
| `scripts/build-data.mjs` | Splits the exported data into the files the app loads. |

### Design documents

| File | What it is |
|---|---|
| `app/REBUILD-SPEC.md` | **The governing document** for the rebuild — merges the art direction, the tech decision and the workflow. |
| `app/ART-DIRECTION.md` | "The Desk" — every programme as a channel on a mixing console. |
| `app/WORKFLOW.md` | What you actually do with this for fifteen months. Argues the tracker is the product and browsing is decoration. |
| `app/TECH-DECISION.md` | What stack, and what to refuse. Rejects Tailwind, React, animation libraries. |
| `app/DESIGN-CRITIQUE.md` | The critique that set the correctness rules — the nine-item kill test lives here. |
| `app/DESIGN-UX.md`, `DESIGN-ARCHITECTURE.md` | The first UX and data-model designs. |
| `app/FOUNDATION.md` | The type, tokens and channel strip as built, with the measurements. |
| `app/BUILD-SPEC.md`, `VERIFICATION.md` | The build brief and the verification record. |

---

## 5. How the research was actually made

`.masters-search/` — the toolchain. You don't need to open these unless you want to re-run or extend the search.

| File | What it is |
|---|---|
| `workflow.mjs` … `workflow5-europe-gapfill.mjs` | The five agent sweeps, in order. Each wrote results incrementally so nothing was lost when a session hit its limit. |
| **`qual_level.py`** | **Separates real master's degrees from certificates.** Handles negation, so "a genuine second-cycle degree, *not* a Lehrgang" is read correctly. |
| **`corrections.py`** | **Lets a verifier's correction override a stale field.** 75 of 127 verified records say a machine field is wrong; this finds them. Catches the Babelsberg and FAMU piano auditions hiding behind "Exam/interview only". |
| `cost_model.py` | What you would actually pay, per country. |
| `build_door3.py` | Builds `DOOR3.xlsx`. |
| `build_master.py`, `build_artist_workbook.py`, and the other `build_*.py` | Build the other workbooks. |
| `export_door3_app.py` | Exports the app's data from the research files. |
| `md2html.py`, `polish_workbooks.py` | Markdown → PDF, and workbook formatting/filters. |
| `results/*.json` | **The raw agent output** — every record as the search agents wrote it, before any processing. `artist-sweep/` holds 51 files from the Door-1 and Door-3 sweeps. |
| `covered_institutions.json` | The skip list, so relaunched agents never re-searched what was already covered. |
| `STATE.md`, `checkpoints/` | Where each sweep stopped, so work resumed in the right place after every usage limit. |

---

## 6. Repository

| File | What it is |
|---|---|
| `README.md` | Repo front page with the totals. |
| `SKILLS.md`, `skills-lock.json` | The skills installed at the start of this project. |
| `.github/workflows/deploy-app.yml` | CI: tests → typecheck → build → deploy. Needs Pages source set to "GitHub Actions" in repo settings to run the deploy step. |

---

## Two things worth knowing about the data

**"Never checked" is not "fine".** 249 of the 398 Door-3 records were never read by a second agent. In the app that state has no colour of its own — it is an empty meter slot — precisely so it can never be mistaken for good news.

**A correction outranks a field.** Where a verifier's prose contradicts a structured value, the prose wins and the app shows you the sentence. Edinburgh's recorded band says *under €1.5k/yr*; the real figure is **≈£29,900**. KASK's says the same; it is **≈€8,800**. Both render struck through, marked wrong, and neither can reach a "cheap" filter.
