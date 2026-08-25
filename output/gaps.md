# gaps.md — what this dataset does not know

Generated from the data, not written by hand, so it cannot drift from what the
dataset actually says. Regenerate with `python3 .masters-search/spain/build_gaps.py`.

> The brief's closing instruction: *an incomplete dataset that is honest about its gaps
> is a success; a complete-looking dataset containing one invented fee, deadline or
> eligibility ruling is a failure, because it will be acted on.* This file is where that
> honesty is kept.

## 1. Coverage — what was searched versus what was enriched

- **970 unique candidates** were discovered in wave 1 across 19 slices.
- **135 were enriched** to the full schema and are in `programmes.csv`.
- **790 remain deferred** in `deferred_candidates.jsonl` — discovered,
  deduplicated and prioritised, but never enriched. They are parked, not dropped.
  Enriching them needs roughly four page-fetches each; that did not fit the run.
- The deferred pile is the single largest gap in this dataset. A programme's absence
  from `programmes.csv` does **not** mean it was judged unsuitable — most were simply
  never reached.

## 2. Missing ★ fields, by field

The brief marks these as the fields that decide the outcome. Counts are out of
135 enriched programmes.

| ★ field | missing | % |
|---|---:|---:|
| `official_status` | 0 | 0% |
| `ruct_code` | 20 | 15% |
| `tuition_total_eur` | 52 | 39% |
| `tuition_year_of_rates` | 49 | 36% |
| `non_eu_surcharge` | 72 | 53% |
| `language_of_instruction` | 31 | 23% |
| `complementary_credits_required` | 65 | 48% |
| `credit_recognition_available` | 97 | 72% |
| `application_window_2027` | 93 | 69% |

### The 2027-28 calendar does not exist yet, anywhere

`application_window_2027` is missing for 93 of 135 programmes, and
that is a fact about the world rather than a research failure: as of 2026-08-25 no
Spanish institution had published a 2027-28 admission calendar. Every date in this
dataset is the **2026-27** cycle, explicitly year-marked. **No date was shifted
forward by a year to fill the column** — doing so would have produced a clean-looking
calendar that quietly invented every deadline in it.

Use the 2026-27 windows to predict *shape* (how many rounds, roughly when, whether a
non-EU early round exists), then confirm each real date with the institution.

## 3. Conflicts — both values retained, none resolved silently

**68 field-level conflicts** across 43 programmes.
**0** are on cost, deadline, official status or language and are flagged
`needs_tiebreak` for a third pass, as the brief requires.

| field | conflicts |
|---|---:|
| `non_eu_surcharge` | 15 |
| `complementary_credits_required` | 13 |
| `tuition_total_eur` | 8 |
| `tuition_per_ects_eur` | 5 |
| `language_of_instruction` | 3 |
| `places_offered` | 2 |
| `currency` | 2 |
| `official_status` | 2 |
| `ruct_code` | 2 |
| `non_eu_surcharge basis` | 2 |
| `official_status/ruct_code` | 1 |
| `language_requirement` | 1 |
| `official_status / UPV-side listing` | 1 |
| `programme_identity` | 1 |
| `interuniversity status` | 1 |
| `language of instruction / English requirement` | 1 |
| `consortium membership` | 1 |
| `programme name` | 1 |
| `programme currently recruiting` | 1 |
| `consortium coordinator` | 1 |
| `programme identity — does RUCT 4317722 correspond to this marketed programme?` | 1 |
| `programme identity` | 1 |
| `ects internal breakdown` | 1 |
| `application_window_2027` | 1 |

### The conflicts that change a decision

- **Universidad Carlos III de Madrid (UC3M) — Máster Universitario en Métodos Analíticos para Datos Masivos: Big Data** · `non_eu_surcharge`
  - A (batch-02): YES - explicit. Verbatim from the master's MATRÍCULA tab: 'ESTUDIANTES NACIONALES Y COMUNITARIOS (80€/ECTS) — Primer curso - 60 ECTS — 4.800€' and 'ESTUDIANTES EXTRACOMUNITARIOS (120€/ECTS) — Primer curso - 60 ECTS — 7.200€'. +50%
  - B (None): YES, CONFIRMED AND LARGE — €80 per ECTS for EU/national students versus €120 per ECTS for non-EU students, i.e. a 50% surcharge. Full programme: €4,800 (EU) versus €7,200 (non-EU) at 2025-26 rates. The optional 12-ECTS MBA complem
- **Universidad Carlos III de Madrid (UC3M) — Máster Universitario en Aprendizaje Automático para la Salud** · `non_eu_surcharge`
  - A (batch-02): YES — explicit, and at the Madrid statutory rate rather than the higher UC3M 'own' band. Verbatim: 'ESTUDIANTES NACIONALES Y COMUNITARIOS (45,02€/ECTS) — Primer curso - 60 ECTS — 2.701,20€' and 'ESTUDIANTES EXTRACOMUNITARIOS (84,0
  - B (None): YES — CONFIRMED AND QUANTIFIED ON THE PROGRAMME PAGE. EU students EUR 45.02 per ECTS (EUR 2,701.20 for 60 ECTS); NON-EU students EUR 84.07 per ECTS (EUR 5,044.20 for 60 ECTS), 2025-26 rates. That is an 86.7% surcharge. ARITHMETIC:
- **Universidad Politécnica de Madrid (UPM) — Máster Universitario en Aprendizaje Automático y Datos Masivos** · `non_eu_surcharge`
  - A (batch-02): YES — explicit, published by UPM itself as a named column, and legally grounded. UPM's 'Precios públicos para Másteres Oficiales' page prints a two-column table headed verbatim 'Máster Universitario | Estudiantes españoles y de la
  - B (None): YES - EXPLICIT. UPM publishes both rows for másteres no habilitantes: 45,02 EUR/crédito for Spanish/EU students on 1a matrícula versus 84,07 EUR/crédito «no UE», and states the 60-ECTS totals directly: «Un curso completo (60 ECTS)
- **Universidad Politécnica de Madrid (UPM) — Máster Universitario en Software de Sistemas Distribuidos y Empotrados** · `non_eu_surcharge`
  - A (batch-02): YES — explicit, published by UPM itself as a named column, and legally grounded. UPM's 'Precios públicos para Másteres Oficiales' page prints a two-column table headed verbatim 'Máster Universitario | Estudiantes españoles y de la
  - B (None): YES - EXPLICIT. UPM publishes 45,02 EUR/crédito for Spanish/EU students on 1a matrícula and 84,07 EUR/crédito «no UE» for másteres no habilitantes. Mechanism: Comunidad de Madrid Decreto 43/2022, de 29 de junio - foreign students 
- **Berklee College of Music, Valencia Campus (Berklee Valen — Máster Universitario en Composición Musical para Cine, Televisión y Videojuegos** · `official_status`
  - A (batch-02): máster universitario (OFFICIAL) — and the programme states its own RUCT code, which is the strongest form of evidence the shared brief asks for. Verbatim from the programme page: 'The Master of Music in scoring for film, televisio
  - B (None): máster universitario (OFFICIAL) — CONFLICT FROM DISCOVERY NOW RESOLVED, both ways. (a) Berklee's own programme page states the DUAL award verbatim: "Master of Music in scoring for film, television, and video games" AND "Máster Uni
- **Universitat Politècnica de Catalunya (UPC) — joint inter — Máster Universitario Erasmus Mundus en Gestión y Análisis de Datos Masivos (BDMA)** · `non_eu_surcharge`
  - A (batch-03): YES — and it is structural, not a Catalan decree matter. The consortium charges Partner Country students (which includes Tunisia) €9,000 per year versus €4,500 per year for Programme Country students: exactly 2x. Total €18,000 vs 
  - B (None): YES — a Partner Country tier, and it is exactly double. The BDMA consortium publishes: Programme Country students 4.500 EUR/year; PARTNER COUNTRY STUDENTS 9.000 EUR/year, these figures 'include national enrolment fees and the insu
- **Universitat Politècnica de Catalunya (UPC) — Escola Poli — Máster Universitario en Aprendizaje Automático y Ciberseguridad para Sistemas Conectados** · `non_eu_surcharge`
  - A (batch-03): YES — explicit and quantified. UPC's catalogue page publishes "EU residents: €1,743 (approximately)" and "Non-EU residents: €4,050 (approximately)" for the same 90-ECTS master: 19,37 vs 45,00 EUR per credit, a surcharge of about 2
  - B (None): YES — EXPLICIT AND LARGE. UPC publishes a separate per-credit tariff row: "Qualifying and NON-Qualifying master's degree (non-residents, non-UE)  €45" for 1st enrolment (then €60 / €100 / €120 for 2nd/3rd/4th), against "NON-Qualif
- **Universitat Politècnica de Catalunya (UPC) — Escola d'En — Máster Universitario en Inteligencia Artificial para Industrias Conectadas (AI4CI)** · `non_eu_surcharge`
  - A (batch-03): YES — explicit and quantified. UPC's catalogue page publishes "EU residents: €2,324" and "Non-EU residents: €5,400" for the same 120-ECTS master: 19,37 vs 45,00 EUR per credit, about 2.3x. Legal basis: Decret 96/2026 art. 1.5 (con
  - B (None): YES — EXPLICIT. UPC publishes a dedicated tariff row: "Qualifying and NON-Qualifying master's degree (non-residents, non-UE)  €45" per credit on first enrolment (€60/€100/€120 on 2nd/3rd/4th), versus €19,37 for the EU/resident fir
- **Universidad Autónoma de Madrid (UAM) — Escuela Politécni — Máster Universitario en Aprendizaje Profundo para el Tratamiento de Señales de Audio y V** · `non_eu_surcharge`
  - A (batch-03): YES — explicit, quantified, and published on the programme page itself: "Standard enrollment: €2,736" versus "Non-EU residents: €5,079" for the same 60-ECTS master, i.e. a surcharge of €2,343 (1.86x). Mechanism, from UAM's own tas
  - B (None): YES — CONFIRMED AND QUANTIFIED ON THE PROGRAMME PAGE ITSELF. First-enrolment cost for the full 60 ECTS: EUR 2,736 for EU/resident students vs EUR 5,079 for non-EU non-resident students (2026-27). That is a surcharge of EUR 2,343, 
- **Universidad Complutense de Madrid (UCM) — Facultad de Es — Máster Universitario en Ciencia de Datos e Inteligencia de Negocios** · `tuition_total_eur`
  - A (batch-03): 5044.2
  - B (None): 5100
- **Universidad Complutense de Madrid (UCM) — Facultad de Es — Máster Universitario en Ciencia de Datos e Inteligencia de Negocios** · `tuition_per_ects_eur`
  - A (batch-03): 84.07
  - B (None): 85.0
- **Universidad Complutense de Madrid (UCM) — Facultad de Es — Máster Universitario en Ciencia de Datos e Inteligencia de Negocios** · `non_eu_surcharge`
  - A (batch-03): YES — explicit, quantified and legally sourced. UCM's own information sheet for non-EU students states verbatim: «Los estudiantes ajenos al EEES no residentes en España se les aplicará el precio público correspondiente a 3ª matríc
  - B (None): YES — the programme page publishes two distinct totals: approximately EUR 3,200 for the full programme for EU students and non-EU RESIDENTS, versus approximately EUR 5,100 for NON-EU NON-RESIDENTS. This candidate falls in the seco
- **Universidad Complutense de Madrid (UCM) — Facultad de Es — Máster Universitario en Ciencia de Datos e Inteligencia de Negocios** · `tuition_total_eur`
  - A (batch-03): 5044.2
  - B (None): 5100
- **Universidad Complutense de Madrid (UCM) — Facultad de Es — Máster Universitario en Ciencia de Datos e Inteligencia de Negocios** · `tuition_per_ects_eur`
  - A (batch-03): 84.07
  - B (None): 85
- **Universidad Complutense de Madrid (UCM) — Facultad de Es — Máster Universitario en Ciencia de Datos e Inteligencia de Negocios** · `non_eu_surcharge`
  - A (batch-03): YES — explicit, quantified and legally sourced. UCM's own information sheet for non-EU students states verbatim: «Los estudiantes ajenos al EEES no residentes en España se les aplicará el precio público correspondiente a 3ª matríc
  - B (None): YES, CONFIRMED — UCM publishes two figures: approximately €3,200 for 'estudiantes comunitarios y extranjeros residentes' and approximately €5,100 for 'estudiantes extranjeros no comunitarios no residentes'. That is roughly a 59% s
- **Universidad de Oviedo — Facultad de Ciencias — Máster Universitario en Análisis de Datos para la Inteligencia de Negocios** · `non_eu_surcharge`
  - A (batch-03): YES — explicit and quantified on the university's own programme page, which publishes two separate columns: Spanish/EU citizens and eligible nationalities pay 21,84 €/crédito on first enrolment (45,10 on second, 88,16 on third and
  - B (None): YES — AND IT APPLIES TO THIS CANDIDATE. Two-step mechanism. (1) Decreto 45/2026 art. 1.2 does NOT fix a non-EU price; it authorises the university: 'La Universidad de Oviedo podrá diferenciar el precio del crédito cuando se trate 
- **Universidad de Alcalá (UAH) — Máster Universitario en Analítica de Negocio y Big Data** · `tuition_total_eur`
  - A (batch-05): 5079.0
  - B (None): 2,736 (Spanish/EU residents) / 5,079 (no residentes extracomunitarios)
- **Universidad de Alcalá (UAH) — Máster Universitario en Analítica de Negocio y Big Data** · `non_eu_surcharge`
  - A (batch-05): YES - EXPLICIT AND LARGE. UAH publishes the two prices side by side for curso 2026-27: «españoles y residentes: 2.736 €» versus «extracomunitarios no residentes: 5.079 €», i.e. +2.343 EUR (+85.6%) for this candidate. Mechanism: un
  - B (None): YES — explicit and roughly +86%: the programme page publishes 'residentes españoles y residentes: 2.736 €' against 'no residentes extracomunitarios: 5.079 €'. This is exactly the candidate's category.
- **Universidad de Alicante (UA) — Máster Universitario en Economía con Ciencia de Datos** · `tuition_total_eur`
  - A (batch-05): 4240.8
  - B (None): 2120.4
- **Universidad de Alicante (UA) — Máster Universitario en Economía con Ciencia de Datos** · `tuition_per_ects_eur`
  - A (batch-05): 70.68
  - B (None): 35.34
- **Universidad de Alicante (UA) — Máster Universitario en Economía con Ciencia de Datos** · `non_eu_surcharge`
  - A (batch-05): YES - EXPLICIT AND DOUBLE. Universidad de Alicante states: «Al estudiantado extranjero, que no tenga la condición de residente, excluidos los nacionales de Estados miembros de la Unión Europea... se les aplicará el doble de los pr
  - B (None): YES — DOUBLE. Verbatim (UA public-price page): "Al estudiantado extranjero, que no tenga la condición de residente, excluidos los nacionales de Estados miembros de la Unión Europea y aquellos a quienes les sea de aplicación el rég
- **Universidad de La Rioja — Máster Universitario en Ciencia de Datos y Aprendizaje Automático** · `tuition_total_eur`
  - A (batch-07): 2876.4
  - B (None): 1476.6
- **Universidad de La Rioja — Máster Universitario en Ciencia de Datos y Aprendizaje Automático** · `tuition_per_ects_eur`
  - A (batch-07): 47.94
  - B (None): 24.61
- **IE Universidad — IE School of Science & Technology — Máster Universitario en Computación y Tecnología Empresarial** · `official_status`
  - A (?): None
  - B (?): None
- **Universidad Pública de Navarra (UPNA / NUP) — Máster Universitario en Machine Learning** · `tuition_total_eur`
  - A (batch-09): 1701.0
  - B (None): 1,701.00 (28,35 €/ECTS x 60 = 1.701,00, 'otros másteres', primera matrícula)

## 4. Verification status

| status | programmes |
|---|---:|
| PENDING | 131 |
| CONFLICT | 4 |

`UNCONFIRMED` means an independent second agent could not source the field —
not that the first agent was wrong. `NOT VERIFIED` means no second pass ran.

## 5. Programmes that may not admit for September 2027

Scored down, not hidden. Registry presence is not an open intake.

- **Berklee College of Music, Valencia Campus (Berklee V — Máster Universitario en Composición Musical para Cine, Televisión y Videojuegos** — title winding down (A EXTINGUIR)
- **Universitat Politècnica de València (UPV) — teaching — Máster Universitario en Innovación en Tecnología Musical (Music Technology Innovation) p** — title winding down (A EXTINGUIR)
- **Universitat Pompeu Fabra (UPF) — Máster Universitario en Tecnologías del Sonido y de la Música** — title winding down (A EXTINGUIR)
- **Universitat Politècnica de Catalunya (UPC) — joint i — Máster Universitario Erasmus Mundus en Gestión y Análisis de Datos Masivos (BDMA)** — Erasmus Mundus EU funding has ended for this consortium; title winding down (A EXTINGUIR)
- **Universidad de Granada + Universidad de Sevilla + Un — Máster Universitario en Derecho y Ética de la Inteligencia Artificial** — title winding down (A EXTINGUIR); not yet verified / not yet official
- **Conjunto Internacional — Universitat Politècnica de  — Máster Universitario Erasmus Mundus en Ondas, Acústica, Vibraciones, Ingeniería y Sonido** — consortium has suspended recruitment
- **CEV — Escuela Superior de Comunicación, Imagen y Son — Máster en Producción Musical** — no live programme page - may be withdrawn
- **Universidad Antonio de Nebrija — Máster Universitario en Análisis de Negocios** — title winding down (A EXTINGUIR); not yet verified / not yet official
- **Universidad Europea de Valencia — Máster Universitario en Análisis de Datos Masivos (Big Data)** — title winding down (A EXTINGUIR); not yet verified / not yet official
- **Universidad Intercontinental de la Empresa (UIE) — Máster Universitario en Tecnología e Inteligencia de Datos Empresariales** — title winding down (A EXTINGUIR); not yet verified / not yet official
- **Universidad Miguel Hernández de Elche (UMH) — Máster Universitario en Estadística Computacional y Ciencia de Datos para la Toma de Dec** — title winding down (A EXTINGUIR); not yet verified / not yet official
- **Universidad de Córdoba (UCO) + Universidad Internaci — Máster Universitario en Inteligencia Artificial Aplicada a Entornos Empresariales y Fina** — title winding down (A EXTINGUIR); not yet verified / not yet official
- **Universidad de Diseño, Innovación y Tecnología (UDIT — Máster Universitario en Inteligencia Artificial Aplicada al Ámbito Educativo** — title winding down (A EXTINGUIR); not yet verified / not yet official

## 6. Funding questions still open

- **5** funding sources have **no established Tunisian-eligibility verdict**.
- **25** are `CONDITIONAL` — claimable only if a further condition is met.
  These need a human to confirm the condition before being counted on.

  - **WAVES — Erasmus Mundus Master in Waves, Acoustics, Vibrations, Engineering** — NOT FOUND — no nationality or residency eligibility text is published on master-waves.eu (the application platform is down) or on the UPV page. The blocker here is not nationality,
  - **MAIA — Erasmus Mundus Joint Master in Medical Imaging and Applications** — Entry: "holders of a bachelor degree in Informatics Engineering but also in closely related fields in either Engineering... or Science...". No nationality restriction on the Erasmu
  - **EMILDAI — Erasmus Mundus Master in Law, Data and Artificial Intelligence** — "Full Erasmus Mundus Scholarship will not be available" for this cohort, with a stated hope to restore it if future funding permits. Track-based nationality rules apply to the two 
  - **MIR — Erasmus Mundus Joint Master in Marine and Maritime Intelligent Robot** — "Hold at the beginning of the programme/time of registering to the programme (September) a first university degree after at least three years of university studies totaling 180 ECT
  - **IFRoS — Erasmus Mundus Joint Master in Intelligent Field Robotic Systems** — "Programme Country status requires being Spanish nationals, students from EU member states, or foreign students residing in Spain." "Students with dual nationality must select whic
  - **Becas MAEC-AECID — Programa África-Med Máster: Becas para la ciudadanía de** — « Programa África-Med Máster: Becas para la ciudadanía de países de África y Oriente Medio, 2026-2027. Dirigidas a: Personas funcionarias o empleados públicos de carácter fijo, no 
  - **Doctoral INPhINIT Fellowships — Incoming call ("la Caixa" Foundation)** — §4.1 Nationality: "Young researchers of any nationality are eligible to apply for the Doctoral INPhINIT Incoming Fellowships Programme." || §4.2 Studies pursued: "Applicants must h
  - **Becas Santander / Santander Open Academy (umbrella programme — scholarship** — Platform-level: "To sign up and start learning, you just need to be over 16 years old. We believe in your potential and want to help you succeed, whether or not you're a bank custo
  - **Bourses pour études de mastère et de doctorat à l'étranger — Annonce n°1 :** — اعلان عدد 1: منح لإعداد دراسات الماجستير والدكتوراه ببلدان الاتحاد الأوروبي بعنوان السنة الجامعية 2026-2027 || مجال الدراسة المزمع إتباعه بالخارج: 1. التحول الطاقي (عدد 5) 2. الصنا
  - **Bourses d'alternance (recherche / PFE) — Circulaire n° 43/19** — « Aux étudiants tunisiens chercheurs inscrits dans des établissements universitaires publics en Tunisie, en deuxième année mastère de recherche ou en doctorat jusqu'à la troisième 
  - **AUF — Programme International de Mobilité et d'Employabilité Francophone (** — « Le Programme International de Mobilité et d'Employabilité Francophone (PIMEF), conçu et porté par l'AUF, est une initiative unique qui place les étudiants au cœur de la coopérati
  - **Berklee Valencia Diversity Scholarship** — "Eligibility Requirements: Demonstrated leadership or support for historically underrepresented or culturally diverse communities, including first-generation college students. Acce
  - **Berklee Outstanding Women Scholarships with Mentorship (MPTI / GEMB / SFTV** — "Awarded to one gifted individual who supports the musicianship and leadership of women in the music industry and who is accepted to the MM in Music Production, Technology, and Inn
  - **AES Educational Foundation Graduate Studies Grant** — "Any student participating in a graduate program in audio or related subjects who is a current AES member." / "Yes, you must be a member in good standing of the AES. (All grades of
  - **Becas Fundacion SGAE para la ampliacion de estudios internacionales** — "La convocatoria esta dirigida a todos los autores y autoras socios/as de SGAE." Categories: "creacion teatral, creacion coreografica, escritura de guion, direccion de audiovisual,
  - **Santander Open Academy scholarships (formerly Becas Santander)** — "Who can apply for Santander Open Academy scholarships? The scholarships are aimed at a wide variety of profiles, from university students to professionals. Each call may have spec
  - **Conversion from student stay to residence-and-work authorisation after the** — Art. 190.1: "Las personas extranjeras que se encuentren en España con una autorización de estancia de larga duración concedida para llevar a cabo los estudios o las actividades for
  - **María de Maeztu DTIC-UPF MSc Research Assistantship (paid research assista** — "The María de Maeztu Strategic Research Program supports a number of research assistantships to students enrolled in any of the DTIC-UPF master programs, linked to the projects exe

## 7. Questions that need a human to send an email

Each of these is blocked on something no automated fetch in this environment can
reach — a Cloudflare challenge, a JS-only page, or a document that simply is not
published. They are not research failures to retry; they are phone calls.

### UPF (Music Technology Group)
Its own pages disagree on complementary credits: the academic-program page says **up to 50 credits**, the FAQ says **up to 15**. At UPF's non-EU rate of €93.50/credit that is a difference of roughly **€3,300 and a second year**. `www.upf.edu` returns 403 to every automated fetch here. Ask admissions which applies to a 300-ECTS engineering degree.

### Universitat de Barcelona
UB's **official** master catalogue could not be enumerated at all — Cloudflare blocks it. Only the Data Science microsite and IL3 (títols propis) were reachable. UB's official offering is therefore absent from this dataset.

### Castilla-La Mancha / UCLM
The regional decree does not fix a non-EU price; it delegates to UCLM's own tariff, and `www.uclm.es` returns 403. The non-EU cost of every UCLM programme here is unknown.

### ISEACV Valencia — Sonología Aplicada y Creación Sonora
Highest content fit in the conservatory register (deep learning, Python, Max/MSP) and states only *recommended* music profiles with no exclusion. Its admission PDFs were unretrievable. One email decides whether this is a top option or drops out.

### Berklee Valencia — GEMB
Published per-credit price (€1,615) × stated credits (34–35) does not reconcile with the published total ($50,430). A discrepancy worth over €4,000.

### WAVES consortium (UPV Gandia)
The consortium says it decided not to open recruitment for the 2026-2028 cohort; UPV still advertises the title with a live calendar. Ask whether a 2027-2029 cohort will run before planning around it.

### BDMA / DEAI
BDMA states its European Commission funding has ended and DEAI holds the funding from 2026-2028. Ask DEAI whether a 2027-2029 intake is planned.

### Universidad de Jaén
Secondary reporting mentions UJA scholarships specifically for Tunisian nationals (housing + tuition). Not confirmable on ujaen.es. Worth one email — it would be the only Tunisia-specific university scheme found.

### UPNA (Navarra)
Orden Foral 63E/2026 art. 4.2 lets UPNA waive master fees under an internationalisation agreement — nationality-neutral, no padrón. Ask whether such an agreement exists and how to be considered.

### Andalusian universities (UMA, US, UNIA)
Decreto 98/2023 art. 12.1.c gives a 99% bonificación from year 2 with no nationality or residence condition. Confirm it applies to a non-EU master student and how year 1 is treated.

### CSIC (JAE Intro) and Ministerio de Universidades
Neither publishes reachable eligibility pages (404 / 503). Both recorded as NOT FOUND rather than as negatives.

### Fundación Indra, Fundación Accenture
Both refused at the **network gateway** (502 on CONNECT) — an environment block, not evidence that no scheme exists. Unexamined, and among the highest-value remaining leads.

### Universidad Camilo José Cela (UCJC)
Returns HTTP 202 with a 221-byte shell for HTML *and* PDFs, including its 2026/27 price book. All UCJC data here is registry-derived; fees, language and admission are unknown.

### VIU — Composición Musical (RUCT 4318085)
Registered and active in RUCT, but both plausible URLs serve a different programme's page. Confirm it still runs.

### UDIT — AI master (RUCT 3500703)
Officially registered, but no programme page exists anywhere on udit.es. Registered is not running.

## 8. Sources that no tool in this environment could reach

Chromium cannot reach the session proxy for **any** host, so there is no
JS-capable fallback here; the Wayback Machine rate-limits. These are hard limits,
not retries. Full list in `output/logs/blocked-and-redo.md`.

`www.upf.edu` · `www.ub.edu` · `unir.net` · `il3.ub.edu` · `www.uclm.es` ·
`ucjc.edu` · `pointblankmusicschool.com` · `imep.es` · `fundacionsgae.org` ·
`fundacionindra.org` · `fundacionaccenture.org` (gateway) · `guiadocent.upf.edu`
(gateway) · `estudiospropios.unizar.es` (gateway)

