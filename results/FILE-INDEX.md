# File index — what every file is, and when to open it

> **All five workbooks are now real Excel Tables.** Every sheet has sticky filter buttons with a
> search box in each dropdown, banded rows, frozen identity columns, and single-line rows so a
> screen shows ~30 programmes instead of 6. Click any header arrow to filter or search that column.

Everything produced by this search, in one table. **PDFs are in `pdf/`; spreadsheets and markdown
are in `results/`.**

---

## 🟢 Tier 1 — read these

| File | Size | What's in it | Open it when |
|---|---|---|---|
| **`THE-COMPLETE-GUIDE.pdf`** | 515 lines | **The whole search explained.** 1,091 opportunities · 56 countries. How the "chance of acceptance" column works and how it was validated · the 18 verified WORTH IT options · the accreditation trap in each country · the two separate tests (accreditation vs contact hours) that decide a visa · country-by-country cost table · the Italian DSU scholarship finding · scholarship comparison · your deadline calendar · what to do in the next month · an honest limits section | **First. Before anything else.** It is the map for every other file |
| **`MASTER-all-opportunities.xlsx`** | 3.8 MB · **20 tabs** | **Every opportunity found, merged from all five searches.** 1,091 rows × 37 columns. Column D now says whether each record is a **real master's degree**. Tabs: *START HERE · ★ BEST BETS · **Master's degrees only (889)** · **NOT a degree — avoid (145)** · Strong + English or French · Fully funded · Has a scholarship · Scholarship index · Free or cheap · Everything ·* then one per region (Western Europe, Southern Europe, Central Europe, Nordics & Baltics, Balkans & Türkiye, Eastern Europe & Caucasus, North America, Asia-Pacific, MENA). Colour-coded on qualification level, chance, cost, language, public/private and funding | **Whenever you want to decide something.** Start on ★ BEST BETS (116 real degrees), then filter *Master's degrees only* |
| **`SOUND-and-SCHOLARSHIPS.xlsx`** | 27 tabs | **Only the sound side, plus every scholarship — and now degrees only.** 460 sound programmes that award a real master's (audio engineering 209, sound design/production 208, music tech 43), with the 335 music-business and 193 adjacent rows removed, and 64 certificates moved to their own tab. Tabs: *★ Best bets (64) · one per track · No portfolio needed · Fully funded (68) · Sound + a scholarship · All scholarships (335) · Scholarship index (308 schemes) · **NOT a degree — avoid** · **Award unclear — ask them** ·* one per country | You want the sound options and the funding in one place, without the business noise |
| **`DEGREE-CHECK.pdf`** | 303 lines | **"Is it actually a master's degree?"** The verdict on all 1,091 records: **889 real degrees, 145 not**. The look-alike in every country (*título propio*, *Master di I livello*, *pós-graduação*, CRKBO) and how to verify each against the national register. Plus the full list of the 145 to avoid, with the reason for each | **Before you pay any institution.** Especially a private one, and especially in Spain or Italy |
| **`PATHS-DEEP-DIVE.pdf`** | 336 lines | **What you'd actually study and become.** The three career paths — sound & music tech, sound design & production, music business — explained in depth: the modules, the daily reality, the job you end up doing, and what each does *not* teach. Plus a full explanation of what a portfolio means in practice and how to build one | **Before you choose a direction.** The other files tell you *where*; this tells you *what toward* |

---

## 🔵 Tier 2 — the three regional deep dives

| File | Size | What's in it | Open it when |
|---|---|---|---|
| **`EUROPE-GAPFILL.pdf`** + **`.xlsx`** | 329 lines · 706 KB · **31 tabs** | **104 institutions the earlier searches missed**, in 26 countries, searched in every local language. Contains your two best-rated options — **TU Ilmenau** and **HfK Bremen**. Documents that most German states charge non-EU students **no tuition at all**, that French public masters are a flat **€3,950**, and that Greece charges **no non-EU differential**. Spreadsheet has a tab per country plus *No Portfolio Needed · English-taught · Free or Cheap* | You want cheap or free public options, or a specific country |
| **`PRIVATE-SCHOOLS.pdf`** + **`.xlsx`** | 461 lines · 906 KB · 9 tabs | **The "don't get scammed" document.** 198 private institutions in Spain, Portugal, Netherlands, Italy — accreditation checked first. Which "Masters" are **not degrees** (*título propio*, CRKBO diploma, *Master di I livello*) · why the Netherlands is **structurally closed** to you · the **Italian DSU scholarship** worth €5,776–€8,134/yr at private academies · Saint Louis Rome. Spreadsheet tabs: *Official Only · Worth It · **AVOID** · Everything ·* one per country | Before you pay any private institution a single euro |
| **`SOUND-DESIGN-EUROPE.pdf`** + **`.xlsx`** | 125 lines · 589 KB · 8 tabs | **The deep dive into your core subject.** 319 programmes across every European country — conservatoires, film schools, private academies. The A-list of 13. Spreadsheet tabs: *A-LIST · All Programmes · **No Audition** · **Accepts Non-Music** · Fully Funded · By Country · Full Detail* | You want to go deep on sound design and production specifically |

---

## ⚪ Tier 3 — planning and honesty

| File | Size | What's in it | Open it when |
|---|---|---|---|
| **`ACTION-TIMELINE.pdf`** | 76 lines | Month-by-month plan from now to September 2027 — portfolio milestones, language study, test dates, document preparation, application windows | You're ready to plan the year |
| **`SHORTLIST.pdf`** | 130 lines | The earlier ranked shortlist of 12–15 programmes, each with its study location, fit score and reasoning | You want a short, opinionated list rather than a database |
| **`COULD-NOT-VERIFY.pdf`** | 31 lines | **Everything I could not confirm**, listed openly — figures no institution publishes, dates that only exist for the prior cycle, claims that need an email to settle | Before you rely on any single number. This is the honesty file |
| `README.md` | 20 lines | Short index of the folder | You're browsing the repo |

---

## ⚫ Tier 4 — raw data and earlier snapshots

| File | Size | What's in it | Open it when |
|---|---|---|---|
| `opportunities.xlsx` | 1.1 MB · 546 rows · 9 tabs | The **original worldwide sweep** dataset, with its own fit-score and admission-difficulty columns. Superseded by the master file but kept intact | You want the first sweep on its own terms |
| `europe-gapfill.xlsx` | 706 KB · 31 tabs | (also listed in Tier 2) | — |
| `console.html` | 3.4 MB | An interactive browser for the same 1,091 records — filter, star, compare. Kept for completeness; the documents and workbooks above carry the same data | You'd rather click than scroll a spreadsheet |

*Everything is Excel now — the CSV duplicates were removed, and the raw JSON moved to
`.masters-search/results/`. No data was lost: every CSV's rows were confirmed present in its
workbook before deletion.*

---

## How the files relate

```
        5 searches                     merged into              explained by
  ┌──────────────────────┐
  │ worldwide sweep  539 │──┐
  │ deep Europe      102 │──┤
  │ sound design     319 │──┼──► MASTER-all-opportunities.xlsx ──► THE-COMPLETE-GUIDE.pdf
  │ private ES/PT/NL/IT  │  │         1,091 unique rows                (read this first)
  │                  198 │──┤         0 records lost
  │ Europe gap sweep 104 │──┘
  └──────────────────────┘
     1,262 raw records          each search also kept its own report:
                                  EUROPE-GAPFILL · PRIVATE-SCHOOLS · SOUND-DESIGN-EUROPE
```

The three regional reports hold **more per-record detail** than the master file carries — full
verification notes, complete fee breakdowns, portfolio specifications. The master file is for
**deciding**; the regional files are for **checking a specific programme in depth**.

---

## If you only have 20 minutes

1. `THE-COMPLETE-GUIDE.pdf` → the sections **"First: is it actually a master's degree?"** and
   **"What verification actually found"**
2. `MASTER-all-opportunities.xlsx` → tab **★ BEST BETS** (already degrees-only) → filter
   **Taught in = English or French**

That is your real shortlist.
