# gaps.md — what this dataset does not know

Generated from the data, not written by hand, so it cannot drift from what the
dataset actually contains. Every entry is either a fact nobody could source, a place
two sources disagree, or a question that needs a human with an email client.

**The brief's framing, kept:** an incomplete dataset that is honest about its gaps is a
success; a complete-looking dataset containing one invented fee, deadline or eligibility
ruling is a failure, because it will be acted on.

## 1. Coverage — what was searched versus what was enriched

- **970 unique candidate programmes** were discovered across 19 discovery slices.
- **135 were enriched** to the full schema.
- **790 remain deferred** in `deferred_candidates.jsonl` — parked, not dropped.

The deferred set is real coverage debt. Discovery was deliberately broad (false positives
are cheap, misses are not), and enrichment at four pages per programme does not fit that
breadth in the time available. Round 1 took the candidates where enrichment most changes
the answer: an active official title, a core field, corroboration from two independent
discovery axes, and a working URL. **Anything in the deferred file has been seen but not
checked, and must not be treated as absent or as rejected.**

## 2. Verification status

| status | count | meaning |
|---|---:|---|
| VERIFIED | 94 | a second agent, given only the name and institution, reached the same answers |
| CONFLICT | 31 | the two passes disagree on at least one field; both values kept |
| UNCONFIRMED | 0 | the verifier could not source the fields at all |
| NOT VERIFIED | 10 | no independent pass ran — **single-sourced, treat with more caution** |

**14 programmes carry a conflict on a decisive field** (cost, deadline, official
status or language) and the brief escalates those to a third agent for a tie-break.
That tie-break has not run. Until it does, treat these figures as contested:

- **Máster Universitario en Composición Musical para Cine, Televisión y Vi** — Berklee College of Music, Valencia Campus (Berklee V · disputed: currency, official_status, official_status / UPV-side listing, places_offered
- **Máster Universitario en Innovación en Tecnología Musical (Music Techno** — Universitat Politècnica de València (UPV) — teaching · disputed: application_window_2027, currency, official_status, programme_identity
- **Máster Universitario en Aprendizaje Profundo para el Tratamiento de Se** — Universidad Autónoma de Madrid (UAM) — Escuela Polit · disputed: tuition_total_eur
- **Máster Universitario en Ciencia de Datos** — Universidad Autónoma de Madrid (UAM) — Escuela Polit · disputed: tuition_total_eur
- **Máster Universitario en Sistemas Interactivos Inteligentes** — Universidad Autónoma de Madrid (UAM) — Escuela Polit · disputed: tuition_total_eur
- **Máster Universitario en Ciencia de Datos e Inteligencia de Negocios** — Universidad Complutense de Madrid (UCM) — Facultad d · disputed: tuition_per_ects_eur, tuition_total_eur
- **Máster Universitario en Nuevas Tecnologías Electrónicas y Fotónicas** — Universidad Complutense de Madrid (UCM) — Facultad d · disputed: tuition_total_eur
- **Máster de Formación Permanente en Big Data, Data Science e Inteligenci** — Universidad Complutense de Madrid (UCM) — Centro de  · disputed: modality, tuition_total_eur
- **Máster Universitario en Análisis de Datos Deportivos** — Universidad Rey Juan Carlos (URJC) · disputed: tuition_total_eur
- **Máster Universitario en Economía con Ciencia de Datos** — Universidad de Alicante (UA) · disputed: non_eu_surcharge, tuition_per_ects_eur, tuition_total_eur
- **Máster Universitario en Inteligencia Artificial Aplicada a la Industri** — Universidad del País Vasco / Euskal Herriko Uniberts · disputed: programme name, tuition_total_eur
- **NEGATIVE FINDING — la Universitat Oberta de Catalunya no ofrece un más** — Universitat Oberta de Catalunya (UOC) · disputed: application_window_2027, official_status, tuition_year_of_rates
- **Máster en Producción Musical** — CEV — Escuela Superior de Comunicación, Imagen y Son · disputed: official_status
- **Máster Universitario en Electrónica y Tecnología Digital Aplicada (MET** — Universidad de Las Palmas de Gran Canaria (ULPGC) · disputed: language_of_instruction

## 3. Starred fields that are NOT FOUND

These are the fields the brief marks as deciding the outcome. A blank here means nobody
could source it — never that the answer is zero or no.

| field | missing | of |
|---|---:|---:|
| `official_status` | 0 | 135 |
| `ruct_code` | 6 | 135 |
| `tuition_total_eur` | 31 | 135 |
| `tuition_year_of_rates` | 28 | 135 |
| `non_eu_surcharge` | 55 | 135 |
| `language_of_instruction` | 16 | 135 |
| `complementary_credits_required` | 0 | 135 |
| `credit_recognition_available` | 97 | 135 |
| `application_window_2027` | 33 | 135 |

## 4. Programmes whose September-2027 intake is in doubt

Scored down accordingly, but listed here because a registry entry is not a promise
that a programme will admit you.

| programme | institution | risk |
|---|---|---|
| Máster Universitario en Composición Musical para Cine, T | Berklee College of Music, Valencia C | title winding down (A EXTINGUIR) |
| Máster Universitario en Innovación en Tecnología Musical | Universitat Politècnica de València  | title winding down (A EXTINGUIR) |
| Máster Universitario en Tecnologías del Sonido y de la M | Universitat Pompeu Fabra (UPF) | title winding down (A EXTINGUIR) |
| Máster Universitario Erasmus Mundus en Gestión y Análisi | Universitat Politècnica de Catalunya | Erasmus Mundus EU funding has ended for this consortium; tit |
| Máster Universitario en Derecho y Ética de la Inteligenc | Universidad de Granada + Universidad | title winding down (A EXTINGUIR); not yet verified / not yet |
| Máster Universitario Erasmus Mundus en Ondas, Acústica,  | Conjunto Internacional — Universitat | consortium has suspended recruitment |
| Máster en Producción Musical | CEV — Escuela Superior de Comunicaci | no live programme page - may be withdrawn |
| Máster Universitario en Análisis de Negocios | Universidad Antonio de Nebrija | title winding down (A EXTINGUIR); not yet verified / not yet |
| Máster Universitario en Análisis de Datos Masivos (Big D | Universidad Europea de Valencia | title winding down (A EXTINGUIR); not yet verified / not yet |
| Máster Universitario en Tecnología e Inteligencia de Dat | Universidad Intercontinental de la E | title winding down (A EXTINGUIR); not yet verified / not yet |
| Máster Universitario en Estadística Computacional y Cien | Universidad Miguel Hernández de Elch | title winding down (A EXTINGUIR); not yet verified / not yet |
| Máster Universitario en Inteligencia Artificial Aplicada | Universidad de Córdoba (UCO) + Unive | title winding down (A EXTINGUIR); not yet verified / not yet |
| Máster Universitario en Inteligencia Artificial Aplicada | Universidad de Diseño, Innovación y  | title winding down (A EXTINGUIR); not yet verified / not yet |

## 5. Funding — what is closed, and what is still open

| Tunisian eligibility | count |
|---|---:|
| NO | 43 |
| CONDITIONAL | 23 |
| YES | 10 |
| NOT FOUND | 5 |
| CONDITIONAL —  | 2 |
| NO FOR THE FIR | 1 |

Every `NO` carries the disqualifying clause verbatim with its URL in `funding.csv`, so a
closed route can be re-checked rather than re-researched.

**Eligibility could not be established at all for these — they are open questions, not refusals:**

- CoSI — Erasmus Mundus Master in Computational Colour and Spectral Imaging (COlou — European Commission / EACEA (Erasmus+ EM
- CSIC — Becas JAE Intro / JAE Intro ICU (introducción a la investigación) — Consejo Superior de Investigaciones Cien
- Ministerio de Ciencia, Innovación y Universidades — funding for máster universit — Ministerio de Ciencia, Innovación y Univ
- Generation Google Scholarship (EMEA) - UNVERIFIED — Google
- Company-funded master's places at Spanish universities (Indra, Repsol, Inditex,  — Indra / Fundacion Repsol / Inditex / Fun

## 6. Questions that need a human

Each of these needs an email or a browser session. They are listed because they are
decision-changing, not because they are merely unfinished.

### Blocked by this environment, not by the source
- **`www.upf.edu` returns 403 to every fetch method available here** — WebFetch, curl with
  full browser headers, and headless Chromium alike. `mtg.upf.edu` redirects into the same
  wall. UPF hosts the Music Technology Group and the Sound and Music Computing master
  (RUCT 4315538). Official status came from the registry; **fees, language and curriculum
  were never read from the source**. `bsm.upf.edu` is a separate site and does work.
- **UB's official master catalogue could not be enumerated at all** (Cloudflare). Only the
  Data Science microsite and IL3 (títols propis) were reachable.
- **`ucjc.edu` returns HTTP 202 with a 221-byte shell** for HTML and PDFs alike, including
  its price book — it looks like a response and carries nothing.
- **`www.uclm.es` 403s**, and Castilla-La Mancha's decree defers the non-EU figure to UCLM's
  own tariff — so that community's real cost is the one hole in an otherwise complete map.
- **`fundacionindra.org` and `fundacionaccenture.org` fail at the network gateway (502)** —
  an environment block, NOT evidence that no scheme exists.
- Título propio catalogues for **UMA, UCA, UJA, UHU, UAL, UPO** returned 503/500/JS-only and
  are unenumerated. That matters most for fields P and S, where propios dominate.

### Specific questions worth one email each
- **WAVES (Erasmus Mundus, UPV Gandia)** — the consortium announced it would not open
  recruitment for 2026-2028, while UPV still advertises the title with a live calendar.
  *Will there be a 2027-2029 cohort?* This decides whether a top-ranked option exists.
- **BDMA** — EC funding ended; the successor appears to be DEAI (ULB/UPC/TU Wien/Lyon 1/
  Padova), first cohort 2026-28. *Is UPC still a partner, and is the 2027 intake funded?*
- **ISEACV Valencia, Sonología Aplicada y Creación Sonora** — the highest content fit in the
  conservatory register (deep learning, Python, Max/MSP). Admission PDFs unretrievable.
  *What is the prueba de acceso, and does it admit a non-music graduate?* One email decides
  whether this is the best music-tech option in Spain or not an option at all.
- **Musikene, Mediación/Gestión/Difusión Musical** — published rules admit graduates of any
  discipline with no audition. *Confirm in writing that a Software Engineering degree
  qualifies*, since this is the one conservatory route that looks genuinely open.
- **Berklee GEMB** — published per-credit price x credits does not equal the published
  total; the gap is over €4,000. *Which figure is right?*
- **UPF SMC** — wave 1 saw 'up to 50 credits of complementary courses', which would extend a
  60-ECTS master to two years and change its cost completely. *How many complementos would
  a 300-ECTS software engineering graduate actually be assigned?*
- **UDIT (RUCT 3500703)** — officially registered, but no programme page exists anywhere on
  udit.es. *Does it run at all?*
- **Becas MEC** bars anyone already holding 'un título de nivel igual o superior'. A 300-ECTS
  5-year engineering title may sit at MECES 3, the same level as a master. *Would that bar
  the candidate even if the residency rule were met?* Recorded as a reasoned flag, not a ruling.
- **CSIC JAE Intro** publishes no eligibility page (404s); **universidades.gob.es** 503s.

## 7. Recorded contradictions (46)

Rule 8 says record contradictions rather than resolving them silently. Both values and
both sources are kept in `programmes.csv`. The pattern worth knowing: **the commonest
disagreement is one source quoting the resident price and the other the non-EU price for
the same programme** — which is exactly the confusion this candidate must not inherit.

| institution | field | value A | value B |
|---|---|---|---|
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online. Programme page ficha: 'Modalidad: Onli |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online. Programme page: 'UNIR te ofrece esta t |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online. Programme page: online master; 'Exámen |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online — UNIR page field 'Online interactivo'; |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online — UNIR page field reads 'Online interac |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online — UNIR page: 'en formato online, para q |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online — UNIR is a 100%-online university; pro |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online, one academic year ('obtendrás en un añ |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online, one academic year. 'Exámenes online y/ |
| Universidad Internacional de L | `modality` | online ('Online interactivo' per the programme | Online — brochure verbatim: 'METODOLOGÍA Educa |
| Berklee College of Music, Vale | `official_status` | máster universitario (OFFICIAL) — and the prog | máster universitario (OFFICIAL) — CONFLICT FRO |
| Berklee College of Music, Vale | `official_status` | máster universitario (OFFICIAL) — and the prog | máster universitario (OFFICIAL) — RUCT estado  |
| Universitat Politècnica de Val | `official_status` | ⛔ REGISTERED BUT DEAD — DO NOT TREAT AS AN OPT | WAS an official máster universitario, NOW EXTI |
| Universitat Politècnica de Val | `application_window_2027` | NOT APPLICABLE for the extinct Spanish title — | NONE — this programme does not admit students. |
| Universitat Pompeu Fabra — UPF | `modality` | presencial (on campus, afternoons, 10 months) | TWO DELIVERIES UNDER THE SAME OFFICIAL TITLE — |
| Universidad Autónoma de Madrid | `tuition_total_eur` | 5079 | EUR 2,701.20 for 60 ECTS (60 x 45.02 EUR/ECTS, |
| Universidad Autónoma de Madrid | `tuition_total_eur` | 5079 | EUR 2,701.20 for 60 ECTS (60 x 45.02 EUR/ECTS, |
| Universidad Autónoma de Madrid | `tuition_total_eur` | 5079 | EUR 2,701.20 for 60 ECTS (60 x 45.02 EUR/ECTS, |
| Universidad Complutense de Mad | `tuition_total_eur` | 5044.2 | 5100 |
| Universidad Complutense de Mad | `tuition_per_ects_eur` | 84.07 | 85.0 |
| Universidad Complutense de Mad | `tuition_total_eur` | 5044.2 | 5100 |
| Universidad Complutense de Mad | `tuition_per_ects_eur` | 84.07 | 85 |
| Universidad Complutense de Mad | `tuition_total_eur` | 5044.2 | CONFLICT. (a) Faculty page verbatim: "Precio d |
| Universidad Complutense de Mad | `tuition_total_eur` | 5044.2 | EUR 2,701.20 for 60 ECTS (60 x 45.02 EUR/crédi |
| Universidad Complutense de Mad | `modality` | online — UCM's catalogue records «Modalidad: O | semipresencial — UCM CFP ficha verbatim label: |
| Universidad Complutense de Mad | `tuition_total_eur` | 4805 | EUR 5,830 for the full programme — UCM CFP fic |
| Universidad Rey Juan Carlos (U | `tuition_total_eur` | 2701.2 | EUR 5,044.20 for the non-EU non-resident popul |
| Universidad de Alicante (UA) | `tuition_total_eur` | 4240.8 | 2120.4 |
| Universidad de Alicante (UA) | `tuition_per_ects_eur` | 70.68 | 35.34 |
| Universidad de Alicante (UA) | `non_eu_surcharge` | YES - EXPLICIT AND DOUBLE. Universidad de Alic | YES — UA precios públicos page: non-resident f |
| CONSORTIUM (Erasmus Mundus Joi | `tuition_year_of_rates` | Rate quoted on the consortium's Costs and Fund | 2027-2029 cohort (i.e. the Sept 2027 intake it |
| Universidad del País Vasco / E | `tuition_total_eur` | 1947.0 | EUR 2,000 approximately for the full 60-ECTS p |
| Universidad de La Rioja | `tuition_total_eur` | 2876.4 | 1476.6 |
| Universidad de La Rioja | `tuition_per_ects_eur` | 47.94 | 24.61 |
| Universidad Europea Miguel de  | `modality` | online — the page states 'Virtual' | online — UEMC's own fact sheet states verbatim |
| Universitat Oberta de Cataluny | `official_status` | NOT APPLICABLE — negative finding, no programm | NEGATIVE FINDING CONFIRMED — no such official  |
| Universitat Oberta de Cataluny | `tuition_year_of_rates` | NOT APPLICABLE | N/A |
| Universitat Oberta de Cataluny | `application_window_2027` | NOT APPLICABLE | N/A |
| Universitat Rovira i Virgili ( | `tuition_total_eur` | 2913.0 | 2766.6 |
| Universitat Rovira i Virgili ( | `tuition_per_ects_eur` | 48.55 | 46.11 |
