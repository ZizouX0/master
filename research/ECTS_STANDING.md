# Your 300 ECTS: what it actually does across the 168 programmes

Audited on 2026-08-22 against the merged Wave-1 dataset.

## 1. No programme was excluded for a credit shortfall — confirmed

Every one of the 168 rows was judged against the real credential: a 5-year
software-engineering diploma worth **300 ECTS**. Nothing in the dataset is
marked down because a master's asks for 180 or 240 ECTS — you clear every such
bar, and several rows say so in as many words:

> "Credit volume is a non-issue (300 ECTS); the pre-Master requirement is disciplinary." — AD-057, Radboud
> "300 ECTS far exceeds the credit bar; the blocker is DISCIPLINE, not credit volume." — J-116, Erasmus Rotterdam
> "The gating factor is Spanish, not money and not credits (300 ECTS is far above any bar)." — AD-064, URJC

## 2. Where 300 ECTS is an active advantage — 6 programmes

German universities of applied sciences commonly set a **210-ECTS** entry bar and
make 180-ECTS holders add a semester. You skip that. In two cases it shortens the
degree outright:

| id | Programme | What the 300 ECTS buys |
|---|---|---|
| **J-102** | Macromedia Berlin — M.A. Music Management (English) | 210 ECTS ⇒ the **3-semester / 90-ECTS** route instead of 4 semesters / 120 ECTS. ~6 months and ~€6,840 saved. No subject restriction stated. |
| **AD-055** | HMKW Berlin — M.A. International Marketing and Media Management | Cut by a semester for 210-ECTS holders ⇒ ~18 months, ~€16k total. |
| **AC-031** | IU International — M.A. Marketing Management (60 ECTS, English) | Requires a **240-ECTS** degree; engineering explicitly accepted. Also needs 1 year post-bachelor work experience. |
| **R-160** | BHT Berlin — Veranstaltungstechnik M.Eng. | Entrants with <210 credits must take extra modules before the thesis; you are exempt. |
| **AC-029 / AC-030** | HWR Berlin — (International) Marketing Management M.A. | Clears the 210-ECTS bar — but still blocked on subject (see below). |

## 3. What actually blocks you — subject composition, not volume

22 programmes are marked `no`. **15 of them are subject-composition gates**: they
demand a set number of credits *in a named discipline* you did not study. More
engineering ECTS cannot satisfy these, because the requirement is about content:

- **UdK Berlin, Tonmeister M.A.** — requires a Tonmeister/sound-engineering bachelor specifically.
- **FU Berlin, Musik Sound Performance** — ≥20 credit points of *musicological* content.
- **Utrecht, MA Applied Musicology** — ≥60 ECTS of music/musicology at bachelor level.
- **VU Amsterdam, MSc Marketing** — 18 EC of marketing; the statistics/R requirement you would pass easily.
- **HWR Berlin, Marketing Management** — 15 ECTS of marketing coursework plus a business/economics bachelor.
- **FU Berlin, Medien und politische Kommunikation** — ≥60 credit points in media and communication studies.
- **Groningen, MA Media Studies** — ≥30 ECTS of Media Studies coursework.
- **Radboud, Creative Industries and Cultural Management** — a BA plus 30 EC of art history / cultural studies.
- **Erasmus Rotterdam, Media & Creative Industries** — social sciences / humanities / business only.

The remaining 7 are blocked on other grounds — Spanish or German language, an
audition or portfolio, required professional experience, or (3 rows) they are
coverage-check placeholders recording that an institution has **no** master's
at all, not real programmes.

## 4. The practical consequence

**The subject gates have a standard workaround, and it is worth pricing in:** most
Dutch universities run a **pre-master** (usually 30–60 EC, one semester to a year)
precisely for applicants whose degree is at the right level but the wrong subject.
Radboud, Groningen and Erasmus all name it as the official route. That converts a
`no` into a 2-year total commitment rather than a rejection — relevant for the
marketing and media paths (AC, AD, J), irrelevant for the technical ones.

**Where your credential is simply strong and unqualified:** paths **A, C, N, H and R**
— sound and music computing, AI/ML, music-tech product, immersive audio, acoustics.
These want exactly what you have. TU Berlin's Audiokommunikation admission text
names engineering degrees and the precise maths and programming prerequisites you
already hold; it is the only `yes_explicit` on its path.

## 5. Data hygiene note

Six rows carried values outside the schema's `{yes_explicit, likely, unclear, no}`
enum (variants of "n/a — entry is below degree level"). Those are programmes whose
entry sits *below* bachelor level, so the credential certainly qualifies; they are
normalised to `yes_explicit` with the caveat moved into `fit_notes`, since the
concern there is the value of the award, not your eligibility for it.
