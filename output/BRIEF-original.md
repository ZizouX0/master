# Spain Master's Sweep — Multi-Agent Research Brief

**Purpose:** exhaustively map every master's programme in Spain across nine target fields, establish real cost and funding for each, and verify every claim against primary sources.

**Run this in Claude Code.** It is written to be pasted whole as the opening instruction. Dispatch agents in parallel waves as specified.

---

## 1. Mission

Produce a **verified, complete inventory** of master's programmes in Spain that fit nine defined fields, including:

- every **public** university programme
- every **private** university programme
- every **specialist school / conservatory / industry academy** programme
- the **official vs. non-official** legal status of each
- **real total cost** including all fees, not headline tuition
- **every funding route** that a Tunisian (non-EU) citizen could actually claim
- **application deadlines** for the 2027–28 intake

Completeness matters more than speed. A missed programme is a failure; a slow sweep is not.

---

## 2. Candidate profile — read before writing any query

| Attribute | Value |
|---|---|
| Nationality | Tunisian (**non-EU** — this constrains most scholarships) |
| Degree | Software Engineering, SMU MedTech, Tunisia |
| Credits | **300 ECTS**, 5-year programme, completed August 2026 |
| Languages | Arabic (native), French (fluent), English (fluent) |
| Spanish | Not currently spoken — assume A0/A1 by application, B1–B2 possible by Sept 2027 |
| Second career | Working music producer / DJ, not yet established commercially |
| Target intake | **September 2027** |
| Hard constraint | Funding availability is a primary ranking factor, not a footnote |

**Two consequences agents must internalise:**

1. **The 300 ECTS credential exceeds standard entry requirements** (most Spanish masters require 240 ECTS). Every programme must be checked for **advanced standing, credit recognition (`reconocimiento de créditos`), or exemption from complementary credits (`complementos de formación`)**. This can save a year and thousands of euros. Do not skip this field.
2. **Language of instruction is a filter, not a preference.** Programmes taught wholly in Spanish are *in scope but flagged*, since B2 Spanish by September 2027 is achievable but not guaranteed. Programmes in English or French rank higher. Record the language honestly — never assume English because the webpage has an English version.

---

## 3. Scope — the nine fields

Search each field **independently**. Do not let one agent cover two fields; overlap is fine, gaps are not.

### Technical fields

**`A` — Sound & Music Computing / Audio Technology**
Search vocabulary: `sound and music computing`, `tecnología musical`, `tecnologías del sonido`, `música y tecnología`, `ingeniería del sonido`, `audio technology`, `informática musical`, `tecnologia musical` (Catalan).

**`B` — Music Information Retrieval / AI for Music**
Search vocabulary: `music information retrieval`, `inteligencia artificial música`, `machine learning audio`, `generative audio`, `computational musicology`, `IA aplicada al sonido`. Note: frequently a *specialisation track inside* an AI or SMC master rather than a standalone degree — record tracks as well as degrees.

**`C` — Audio Signal Processing & DSP**
Search vocabulary: `procesado de señal`, `tratamiento digital de la señal`, `signal processing master`, `acústica`, `ingeniería acústica`, `telecomunicaciones señal audio`, `processament del senyal`. Look inside **telecommunications engineering** masters — DSP is usually a track there, not a named degree.

**`AA` — Artificial Intelligence / Machine Learning**
Search vocabulary: `inteligencia artificial`, `aprendizaje automático`, `máster en IA`, `artificial intelligence master Spain`, `deep learning`, `ciencia e ingeniería de datos`.

**`AB` — Data Science**
Search vocabulary: `ciencia de datos`, `data science`, `big data`, `analítica de datos`, `ciència de dades`.

**`AC` — Cloud / DevOps / SRE / Distributed Systems**
Search vocabulary: `cloud computing`, `computación en la nube`, `DevOps`, `ingeniería de software`, `sistemas distribuidos`, `arquitectura de software`, `site reliability`, `infraestructura`. Note: rarely a standalone master in Spain — check software engineering, computer engineering, and cybersecurity masters for cloud/infra tracks, and check **industry certifications-plus-master hybrids** at private schools.

### Business fields

**`X` — Business Analytics**
Search vocabulary: `business analytics`, `analítica de negocio`, `business intelligence`, `dirección de datos`, `data-driven management`.

**`P` — Music Industry / Label & Publishing Management**
Search vocabulary: `industria musical`, `gestión musical`, `music business`, `management musical`, `negocio de la música`, `derechos de autor música`, `edición musical`, `music industry master Spain`.

**`S` — Events, Festival & Live Entertainment Management**
Search vocabulary: `gestión de eventos`, `producción de eventos`, `event management`, `gestión de espectáculos`, `producción musical en directo`, `festivales`, `live entertainment`, `dirección de eventos`.

---

## 4. Non-negotiable rules — every agent

1. **Primary sources only.** The programme's own page on the university's own domain. Aggregators (Masterstudies, Studyportals, Educaedu, Emagister, FindAMasters) may be used **to discover** a programme, never to state a fact about it. Discovery via aggregator must be followed by verification on the university site.
2. **Every factual field carries a source URL and an access date.** No URL, no field.
3. **If a fact cannot be found, write `NOT FOUND` — never estimate, never infer, never carry over a figure from a similar programme.** A `NOT FOUND` is a useful result. A plausible invention is a corrupted dataset.
4. **Fee figures must state the year they apply to.** Spanish public fees are set annually per autonomous community and change. Record as `€X,XXX (2026–27 rates)`.
5. **Non-EU fee surcharges must be checked explicitly.** Several communities charge non-EU/non-resident students differently. Do not assume the headline price applies.
6. **Distinguish `máster universitario` from `título propio`.** This is the single most consequential distinction in Spanish higher education and agents get it wrong constantly:
   - **`Máster universitario` (official)** — ANECA-verified, appears in RUCT, grants access to doctoral study, recognised across the EU, eligible for public scholarships.
   - **`Título propio` / `máster propio`** — the university's own certificate. Not ANECA-verified, **no PhD access**, weaker recognition, often ineligible for public funding, and frequently marketed identically to the official kind.
   - **Verify against RUCT** (https://www.educacion.gob.es/ruct/) — if it is not in RUCT it is not official, whatever the marketing says.
7. **Never trust a translated page for language of instruction.** Find the explicit statement (`idioma de impartición` / `llengua de docència`). If a programme is "in English" on the English page but `castellano` in the official plan, the official plan wins.
8. Record **contradictions** rather than resolving them silently. If two university pages disagree, log both with both URLs and flag `CONFLICT`.

---

## 5. Agent architecture

Five waves. Do not begin a wave until the previous wave's output is written to disk.

```
WAVE 1  Discovery       ~18 agents, parallel   → raw_candidates.jsonl
WAVE 2  Enrichment      ~12 agents, parallel   → programmes.jsonl
WAVE 3  Funding         ~8 agents,  parallel   → funding.jsonl
WAVE 4  Verification    ~10 agents, parallel   → verified.jsonl
WAVE 5  QA & assembly   3 agents,  sequential  → deliverables
```

### Wave 1 — Discovery (~18 agents)

Goal: cast the widest possible net. False positives are cheap here; misses are not.

**Split agents two ways so nothing falls through:**

*By field (9 agents)* — one per field code, searching nationally in **Spanish, Catalan, and English** for that field's vocabulary.

*By institution (9 agents)* — each takes a slice of the seed institution list in §7 and enumerates **every master's programme that institution offers** in engineering, computing, communication, business, or arts, then filters to the nine fields. This catches programmes whose names do not match any expected keyword.

Each discovery agent must also query the two official registries directly, which is where public-university completeness actually comes from:

- **RUCT** — https://www.educacion.gob.es/ruct/ — search by field and by university
- **QEDU / Ministry programme finder** — https://www.educacion.gob.es/notascorte/ and the Ministry's `¿Qué estudiar y dónde?` tool

**Output per candidate:** `{path_code, programme_name, institution, url, discovery_source, confidence}` appended to `raw_candidates.jsonl`. Deduplicate on `(institution, programme_name)` at the end of the wave.

### Wave 2 — Enrichment (~12 agents)

Each agent takes a batch of ~15 deduplicated candidates and fills the **full schema in §6** from primary sources.

Enrichment agents must open, at minimum: the programme overview page, the curriculum/`plan de estudios` page, the admissions/`acceso y admisión` page, and the fees/`precios` page. Four pages minimum per programme. A programme enriched from one page is not enriched.

### Wave 3 — Funding (~8 agents)

Split by funding source type, not by programme. Each agent owns a category from §8, researches it exhaustively, and returns **eligibility for a Tunisian non-EU applicant specifically**, plus amount, deadline, and application mechanism.

The critical question every funding agent must answer explicitly: **"Can a Tunisian citizen with no prior Spanish residency claim this?"** Many Spanish scholarships require prior residency, EU citizenship, or Latin American nationality. Record the exclusion clause verbatim with its URL.

### Wave 4 — Verification (~10 agents)

**Verification agents must not have seen Wave 2's output for the programme they verify.** Give each agent only `{institution, programme_name}` and ask it to independently source the same fields. Then diff.

- Fields that match → `VERIFIED`
- Fields that differ → `CONFLICT`, both values retained, both URLs retained
- Fields the verifier cannot find → `UNCONFIRMED`

Any programme with a conflict on **cost, deadline, official status, or language** is escalated to a third agent for a tie-break.

### Wave 5 — QA & assembly (3 agents, sequential)

1. **Completeness agent** — re-runs a sample of Wave 1 queries and checks every result already exists in `verified.jsonl`. Any programme found that is not in the dataset means Wave 1 leaked; report it and add it.
2. **Schema agent** — asserts every record has every field, every fact has a URL and date, no field contains an unsourced number, and every `título propio` is correctly flagged.
3. **Assembly agent** — writes the deliverables in §9.

---

## 6. Data schema

Every programme record. Fields marked ★ are the ones that decide the outcome — never leave them unsourced.

```jsonc
{
  "id": "slug",
  "path_codes": ["A"],              // may match multiple fields
  "programme_name_es": "",
  "programme_name_en": "",
  "institution": "",
  "institution_type": "",           // public | private | specialist school | conservatory
  "city": "",
  "autonomous_community": "",

  "official_status": "",            // ★ máster universitario | título propio | UNKNOWN
  "ruct_code": "",                  // ★ empty means NOT official
  "ruct_url": "",

  "ects": 0,                        // 60 | 90 | 120
  "duration_years": 0,
  "modality": "",                   // presencial | semipresencial | online
  "language_of_instruction": "",    // ★ verbatim from official plan
  "language_source_url": "",
  "language_requirement": "",       // e.g. B2 English certificate required?

  "tuition_total_eur": 0,           // ★ full programme, not per credit
  "tuition_per_ects_eur": 0,
  "tuition_year_of_rates": "",      // ★ e.g. "2026-27"
  "non_eu_surcharge": "",           // ★ yes/no + detail
  "additional_fees_eur": 0,         // enrolment, insurance, admin
  "tuition_source_url": "",

  "entry_requirements": "",
  "accepts_engineering_background": "",     // ★ explicit or inferred? say which
  "complementary_credits_required": "",     // ★ complementos de formación
  "credit_recognition_available": "",       // ★ the 300 ECTS question
  "credit_recognition_source_url": "",

  "application_window_2027": "",     // ★ open and close dates
  "application_rounds": [],
  "non_eu_early_round_advised": "",
  "admissions_contact_email": "",
  "deadline_source_url": "",

  "curriculum_summary": "",
  "notable_faculty_or_lab": "",
  "industry_links": "",
  "thesis_or_internship": "",

  "scholarships_internal": [],       // university's own, with URLs
  "scholarship_ids_external": [],    // FK into funding.jsonl

  "verification_status": "",         // VERIFIED | CONFLICT | UNCONFIRMED
  "conflicts": [],
  "sources": [ {"field": "", "url": "", "accessed": "YYYY-MM-DD"} ]
}
```

---

## 7. Seed institution list

Not exhaustive — a floor, not a ceiling. Every discovery agent must also find institutions **not** on this list.

**Public universities — highest priority for the technical fields**

Universitat Pompeu Fabra (UPF, Barcelona — Music Technology Group) · Universitat Politècnica de Catalunya (UPC) · Universidad Politécnica de Madrid (UPM) · Universidad Politécnica de Valencia (UPV) · Universidad Carlos III de Madrid (UC3M) · Universidad Autónoma de Madrid (UAM) · Universitat de Barcelona (UB) · Universitat Autònoma de Barcelona (UAB) · Universidad Complutense de Madrid (UCM) · Universidad de Granada (UGR) · Universidad de Málaga (UMA) · Universidad de Sevilla (US) · Universidad de Zaragoza · Universidade de Santiago de Compostela · Universidad de Valladolid · Universitat de València · Universitat Rovira i Virgili · Universitat Jaume I · Universidad Rey Juan Carlos (URJC) · Universidad de Alicante · Universidad del País Vasco (UPV/EHU) · Universidad de Oviedo · Universidad de Murcia · Universitat de les Illes Balears · Universidad de Las Palmas de Gran Canaria · Universidad Pública de Navarra · UNED

**Private universities and business schools**

IE University · ESADE · IESE · ESIC · EAE Business School · La Salle – Universitat Ramon Llull · Universitat Oberta de Catalunya (UOC) · UNIR · Universidad Europea de Madrid · Universidad Nebrija · Universidad Alfonso X el Sabio · CEU San Pablo · Universidad Pontificia Comillas (ICAI) · Universidad de Deusto · Mondragon Unibertsitatea · Universidad Francisco de Vitoria · Universidad Camilo José Cela · Universitat Internacional de Catalunya · Universitat de Vic · Tecnocampus (UPF-affiliated)

**Specialist schools — essential for fields A, P, S; often overlooked**

Berklee College of Music Valencia campus · SAE Institute (Madrid, Barcelona) · Microfusa (Barcelona, Madrid) · Point Blank Music School Ibiza · ESMUC (Escola Superior de Música de Catalunya) · Musikene (San Sebastián) · Escuela Superior de Música Reina Sofía · CEV (Madrid, Barcelona) · Trazos · U-tad · ESDIP · Escuela de Espectáculos y Eventos · Deusto Formación

⚠️ Specialist schools very often issue **títulos propios**, not official masters. Flag rigorously — this is exactly where the distinction bites hardest.

---

## 8. Funding sources — one agent per block

For every source: **amount, coverage (tuition/living/travel), eligibility for a Tunisian non-EU citizen, deadline for 2027 entry, application URL, and the verbatim exclusion clause if any.**

**Block 1 — EU-level**
Erasmus Mundus Joint Masters (search the EMJM catalogue for Spain-coordinated programmes in all nine fields — these are **fully funded including stipend** and are the single highest-value target). Marie Skłodowska-Curie routes. EIT Digital Master School.

**Block 2 — Spanish government**
MAEC-AECID scholarships (explicitly covers Mediterranean and Arab countries — highest-probability government route for a Tunisian applicant). Becas MEC / Ministry general scholarships (check the residency requirement carefully — likely excludes). Fundación Carolina (verify whether Tunisia is eligible; historically Latin America-focused).

**Block 3 — Regional government**
Catalonia (AGAUR), Madrid, Valencia, Andalusia, Basque Country. Each community runs its own scheme with its own residency rules.

**Block 4 — Foundations & banks**
Fundación "la Caixa" postgraduate fellowships · Fundación Ramón Areces · Fundación Rafael del Pino · Fundación BBVA · Banco Santander scholarships (Santander runs a large international programme worth checking per-university).

**Block 5 — University-internal**
Each shortlisted institution's own scholarship, fee-waiver, and merit-discount pages. Private schools in particular discount heavily and do not advertise it prominently.

**Block 6 — Tunisia-origin and bilateral**
Tunisian Ministry of Higher Education outbound scholarships · Tunisia–Spain bilateral agreements · AUF (Agence Universitaire de la Francophonie) · Islamic Development Bank scholarship programme · Arab Fund / ALECSO schemes.

**Block 7 — Field-specific**
Music-tech and audio industry scholarships (Berklee Valencia offers substantial merit aid) · AI/data industry-sponsored places · Google/Microsoft/NVIDIA academic programmes active in Spain.

**Block 8 — Assistantships & employment**
Research assistant and teaching assistant positions attached to specific labs (the MTG at UPF is the priority target). PhD-track funded entry where the master is a funded first year. Industry-sponsored theses.

---

## 9. Deliverables

Write to `./output/`:

1. **`programmes.csv`** — every verified programme, full schema flattened, one row each.
2. **`funding.csv`** — every funding source with the Tunisian-eligibility verdict as a dedicated column.
3. **`shortlist.md`** — the top 15 programmes ranked by a stated formula: funding availability (40%), field fit (25%), official status and recognition (15%), language accessibility (10%), credit-recognition upside (10%). Show the score breakdown per programme; do not hide the arithmetic.
4. **`deadlines.ics`** — calendar file, every application deadline plus a reminder 45 days prior.
5. **`gaps.md`** — every `NOT FOUND`, every `CONFLICT`, every `UNCONFIRMED`, and every question that needs a human to email an admissions office. This file is a deliverable, not an apology.
6. **`sources.jsonl`** — the complete audit trail.

---

## 10. Definition of done

The sweep is complete when **all** of these hold:

- [ ] Every one of the nine fields has been searched in Spanish, Catalan, and English
- [ ] RUCT has been queried directly for every field, not just Google
- [ ] Every seed institution has been enumerated, not just keyword-matched
- [ ] Every programme has `official_status` verified against RUCT
- [ ] Every cost figure carries a rate year and a source URL
- [ ] Non-EU fee treatment is explicitly resolved for every programme
- [ ] Every programme has been checked for credit recognition against 300 ECTS
- [ ] Every funding source has an explicit Tunisian-eligibility verdict with the exclusion clause quoted
- [ ] Wave 4 verification has run on 100% of programmes, not a sample
- [ ] The completeness agent's re-run surfaced no programme missing from the dataset
- [ ] `gaps.md` exists and is honest

**Final instruction to every agent: an incomplete dataset that is honest about its gaps is a success. A complete-looking dataset containing one invented fee, deadline, or eligibility ruling is a failure, because it will be acted on.**
