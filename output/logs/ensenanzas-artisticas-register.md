# The `Máster en Enseñanzas Artísticas` register — how it actually works

Written for wave 2+ and the QA pass. All facts below carry a URL; access date **2026-08-25**.
Companion dataset: `output/wave1/registry-ensenanzas-artisticas.jsonl` (47 rows).

---

## 1. The one-paragraph version

Spain runs **two parallel official higher-education systems**. Universities award
`Máster Universitario`, verified by ANECA and registered in **RUCT**. Conservatories and
authorised arts centres award `Máster en Enseñanzas Artísticas` under the education (not
university) branch of the law — **these are equally official, MECES level 3 / EQF 7, and give
doctoral access, but they are NOT in RUCT and never will be.** Their proof of officiality is a
**BOE homologation order** signed by the Ministry of Education, plus an entry on the Ministry's
own arts register at `infoartisticas.gob.es`. Applying brief rule 6 ("not in RUCT = título
propio") to this sector produces a wrong answer every single time.

---

## 2. The authorisation chain — who does what

Legal basis: **Real Decreto 1614/2009**, de 26 de octubre
(<https://www.boe.es/buscar/act.php?id=BOE-A-2009-17005>), which orders the enseñanzas
artísticas superiores established by LOE 2/2006.

The chain, in order:

1. **The autonomous community proposes.** The centre designs a plan de estudios; its
   comunidad autónoma submits it to the Ministry for homologation. (Wave-1 worked example:
   the Comunitat Valenciana proposed the Sonología plan.)
2. **A quality agency evaluates.** Art. 17 RD 1614/2009 names *"la ANECA **o los órganos de
   evaluación creados por las comunidades autónomas**"*. So it is **not always ANECA** — the
   Aragón contemporary-music master was evaluated by **ACPUA**, Aragón's own agency
   (BOE-A-2017-7087). **Do not treat "no ANECA report" as evidence against officiality.**
3. **The Consejo Superior de Enseñanzas Artísticas reports.** An advisory favourable report
   precedes ministerial approval.
4. **The Ministry homologates by Orden.** Art. 13.5. The Orden is published in the BOE and is
   *the* citable proof of official status. Signing ministry name drifts with governments:
   `ECD/…` (2015-2017) → `EFP/…` (2018-2023) → `EFD/…` (2026). Do not read the prefix as a
   different register.
5. **The title is inscribed in the state registry of non-university centres**, which has the
   effect of initial accreditation. Re-accreditation every 6 years (art. 17).

**Net: the Ministry authorises the title; the autonomous community proposes it and runs the
centre.** Both are involved — the common shorthand "the region authorises it" is wrong.

### What a BOE order looks like
`Orden EFP/673/2023, de 14 de junio, por la que se homologa el plan de estudios del Título de
Máster en Enseñanzas Artísticas en Sonología Aplicada y Creación Sonora del Conservatorio
Superior de Música "Joaquín Rodrigo" de Valencia` — BOE-A-2023-14865,
<https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-14865>. It names the proposing community,
the evaluating agency, the Consejo Superior report date, and the **centre code** (46013219).
Note: the BOE order text itself did **not** publish an anexo with ECTS or access rules — so the
BOE proves *status*, not *entry requirements*. Those live on the centre's page.

**Record the BOE reference in `ruct_code` prefixed `BOE:`, and put `NOT IN RUCT — expected for
this register` in `notes`.** Never leave `official_status` as UNKNOWN merely because RUCT is silent.

---

## 3. Is there a searchable public register? Yes — one, and it is imperfect

**<https://www.infoartisticas.gob.es/ensenanzas/musica/superiores-musica/superiores-master-musica.html>**

The Ministry's own page, grouped by autonomous community → centre → title, with the BOE
reference beside most titles. Sister pages exist for
[Diseño](https://www.infoartisticas.gob.es/ensenanzas/artes-plasticas-diseno/superiores-grado-diseno/superior-master-diseno.html)
and [Artes Plásticas](https://www.infoartisticas.gob.es/ensenanzas/artes-plasticas-diseno/superiores-artes-plasticas/superiores-master-aapp.html);
a centre-finder is at <https://www.infoartisticas.gob.es/administraciones/administraciones-centros.html>.

**Three limitations you must carry forward:**

- **It is incomplete.** Aragón's CSMA masters are homologated (BOE-A-2017-7087) yet do **not**
  appear on the music page. So absence from `infoartisticas` is *not* proof a title is
  unofficial — cross-check the BOE.
- **It lags.** A July-2026 order (BOE-A-2026-15287, Escuela Superior Musical Arts) is in the
  BOE but was found via BOE search, not via the register page. The register is still growing.
- **Some rows carry no BOE reference at all** (e.g. Katarina Gurska's Composición
  Electroacústica, Musikene's Estudios Orquestales). Those are recorded `NOT FOUND` in the
  dataset rather than guessed.

**Reliable second route:** BOE full-text search for
`homologa el plan de estudios` + `Máster en Enseñanzas Artísticas` + the centre name. That is
how the Aragón and 2026 orders were confirmed.

`educagob.educacionfpydeportes.gob.es` paths for this topic **302 → 404** and are dead; use
`infoartisticas.gob.es`.

---

## 4. Entry requirements — the part that actually decides this candidate's fate

### The legal floor is generous
**Art. 15 RD 1614/2009**, verbatim:

> *"Para acceder a las enseñanzas oficiales de Máster será necesario estar en posesión de un
> Título Superior oficial de enseñanzas artísticas, de un título oficial de Graduado o Graduada
> o su equivalente expedido por una institución del Espacio Europeo de Educación Superior que
> faculte en el país expedidor del título para el acceso a enseñanzas de Máster."*

**A `Título Superior de Música` is NOT legally required.** Any official Grado qualifies. Holders
of non-EHEA qualifications may also be admitted once the competent education administration
verifies an **equivalent level of training** — expressly *without* full homologación.

### But art. 16 hands the gate back to the centre
Admission is by centre-set **specific requirements and merit criteria**, which may include
prerequisites in particular disciplines. **This is where the real filter sits**, and in practice
it is almost always an audition or a composition portfolio rather than a degree rule.

### So the correct question is never "does it require a Título Superior?"
It is **"what does the prueba de acceso consist of?"** A programme can accept any Grado and
still be unreachable because 40% of the admission score is a contemporary-music portfolio
(RCSMM), or because the sole criterion is talent judged at audition (Reina Sofía).

### What was found, per programme (13 in-scope titles)

| Gate | Programmes |
|---|---|
| **Genuinely open** — non-music degree accepted *and* no audition | Musikene **Mediación, Gestión y Difusión Musical** (field P) |
| **Open on degree, portfolio-gated** | Musikene Creación de la Música Contemporánea (3 own compositions on video); Katarina Gurska **MCE** (*"muestras de trabajos recientes"* — no scores demanded); Katarina Gurska MCAV (*"partitura+audio"* — scores demanded, effectively closed) |
| **Explicit Título Superior de Música gate** | RCSMM Nuevas Tecnologías; CSMA Aragón Música Contemporánea; Liceu Composición Aplicada |
| **Open on degree, closed by audition** | Reina Sofía Composición Dramática |
| **Unresolved — needs a human** | ISEACV Valencia **Sonología Aplicada**; ISEACV Castelló Composición Multimedia; ESMUC Recerca Musical; Gurska Investigación Musical Interdisciplinar; CSM Vigo |

### Non-EU applicants: a live contradiction, logged not resolved
- Art. 15 RD 1614/2009 and **Musikene**: prior **verification of equivalent level** by the
  competent education administration; homologación *not* required.
- **ESMUC**: *"the homologation of the degree is not necessary, but it will be necessary to
  verify in advance that the degree accredits an equivalent level"* — agrees.
- **Escuela Superior de Música Reina Sofía**: states foreign credentials **must be homologated
  through the Ministry of Education** — stricter, and conflicts with the above.

For a Tunisian applicant on a Sept-2027 timeline this is weeks versus many months of paperwork.
Both values are recorded against their sources; **do not silently pick one.**

---

## 5. Traps specific to this sector

1. **RUCT absence proves nothing here.** Confirmed empirically in wave 1: querying RUCT for the
   conservatory sector returns zero master rows while the same titles carry BOE orders.
   `output/ruct-backbone.jsonl` and `ruct-detail.jsonl` cover the **university** register only.
2. **Conservatories award BOTH kinds, side by side, on the same website.** ESMUC is the trap:
   its six performance/research masters are official register titles, while
   **Composició amb Tecnologies** and **Management i Producció Musical** — the only two ESMUC
   masters that sit in fields A and P — are labelled `màster propi` by ESMUC itself and are
   absent from the Ministry register. **ESMUC offers nothing official in fields A or P.**
   Same pattern at the Liceu, whose *Cursos de Music Training* are own-title.
3. **Third parties teach on conservatory premises without conservatory status.** IMB
   (International Music Business School) holds classes at the Liceu; it is not a Liceu title and
   not in this register. Location is not accreditation.
4. **"Título Oficial … Nivel MECES 3" on a private centre's own page is a claim, not a source.**
   Katarina Gurska states it for MCE and MCAV; both appear in the Ministry register, but neither
   row shows a BOE order. Recorded as present-in-register with `boe_order: NOT FOUND`.
5. **The evaluating agency varies by region** (ANECA vs ACPUA vs others) — see §2.2.
6. **Ministry name prefixes drift** (ECD → EFP → EFD) — see §2.4.

---

## 6. Coverage — every community checked

**Homologated music masters found in:** Aragón, Castilla y León, Cataluña, Galicia, Madrid,
País Vasco, Comunitat Valenciana.

**None found in:** Andalucía, Asturias, Baleares, **Canarias**, Cantabria, Castilla-La Mancha,
Extremadura, Murcia, **Navarra**, La Rioja. The superior conservatories of **Canarias** and
**Navarra** — both named in the task — publish access tests for their *Grado/Título Superior*
only; no master appears against them in the Ministry register. Recorded as a **negative result**,
citing the register page. Note Andalucía has its own Decreto 54/2022 covering *"enseñanzas
artísticas de máster y estudios de doctorado **propios**"* — a regional own-title track, which is
**not** the state-homologated register described here and should not be conflated with it.

**Institutions named in the task, resolved:**
ESMUC ✔ (6 official, 0 in fields A/P) · Musikene ✔ (5 official, incl. the one genuine opening) ·
Liceu ✔ (5 official) · Reina Sofía ✔ (2 official) · Valencia ✔ · Madrid RCSMM ✔ · Aragón ✔ ·
Galicia/Vigo ✔ · Castilla y León ✔ · Canarias ✗ none · Navarra ✗ none.
**Others found beyond the task list:** Escuela Superior de Canto de Madrid, Forum Musikae,
Progreso Musical, Katarina Gurska, Música Creativa, ESMAR (València), Escuela Superior Musical
Arts, CSM Óscar Esplá (Alacant), CSM Salvador Seguí (Castelló).

---

## 7. Open items for a human

1. **ISEACV Valencia — Sonología Aplicada y Creación Sonora.** Highest content fit in the entire
   register (deep learning, Python, Max/MSP). Its programme page lists *recommended* music
   profiles but states no exclusion, and the linked `Proceso de admisión` / `Convocatoria acceso`
   PDFs on <https://www.csmvalencia.es/postgrado/> were not retrievable. **Email the centre and
   ask directly whether a non-music Grado plus a technical/production portfolio is admissible.**
   The answer either makes this the top conservatory option or removes it entirely.
2. **ISEACV Castelló — Composición Multimedia.** Same question; likely shares an ISEACV admission
   regulation with (1). Its access-procedures page 404'd.
3. **Katarina Gurska MCE** — confirm the BOE order number and the DELE A2 requirement.
4. **CSM Vigo, ESMUC Recerca Musical, Gurska Investigación Musical Interdisciplinar** — entry
   requirements unverified.
5. **Reina Sofía vs everyone else on non-EHEA homologación** (§4) — needs an authoritative ruling.

**Budget note:** the session-wide WebSearch cap (200) was reached during this slice; items 3-5
were cut for that reason, not because the sources do not exist. WebFetch on known URLs still
worked and was used to the end.
