# How to query RUCT programmatically — working method

**Author:** Wave 1 registry-technical agent  **Date accessed:** 2026-08-24
**Registry:** Registro de Universidades, Centros y Títulos — https://www.educacion.gob.es/ruct/

## Headline finding

RUCT **is** queryable, and far more easily than the brief assumed. It is **not a JSF app** —
it is **Struts 2 + displaytag**. There is no `ViewState` to round-trip. Every search can be
issued as a **stateless HTTP GET** with plain query parameters. No cookies, no session, no
JS execution, no form scraping. Results are a clean HTML `<table id="estudio">`.

This is the single most useful fact in this file: **you can drive RUCT with `curl`.**

## The one endpoint that matters

```
GET https://www.educacion.gob.es/ruct/listaestudios?<params>
```

Working example (copy-paste runnable):

```bash
curl -sS -G "https://www.educacion.gob.es/ruct/listaestudios" \
  --data-urlencode "actual=estudios" \
  --data-urlencode "consulta=1" \
  --data-urlencode "descripcionEstudio=Inteligencia Artificial" \
  --data-urlencode "codigoTipo=M" \
  --data-urlencode "buscarHistorico=N" \
  --data-urlencode "action:listaestudios=Consultar" \
  --data-urlencode "d-1335801-p=1"
```

### Parameters

| Param | Meaning | Values |
|---|---|---|
| `actual` | app section | always `estudios` |
| `consulta` | search flag | always `1` |
| `action:listaestudios` | Struts action trigger | always `Consultar` (**required**) |
| `codigoEstudio` | exact RUCT code | e.g. `4317140` |
| `codigoUniversidad` | university code | 3-digit, e.g. `050` = U. de Jaén (109 values) |
| `descripcionEstudio` | free-text on title | substring, **accent-insensitive** |
| `codigoTipo` | academic level | `M`=Máster, `G`=Grado, `D`=Doctor, `C`=Ciclo, `T`, `X`, ``=all |
| `codigoRama` | branch of knowledge | `431001` Artes/Hum · `431002` Ciencias · `431003` CC Sociales y Jur. · `431004` Ingeniería y Arquitectura · `431005` CC Salud |
| `ambito` | field of study | `1`–`32` (see list below) |
| `codigoEstado` | status | `P`=Publicado BOE, `ACA`=Autorizado por CA, `AJ`=Resolución judicial |
| `situacion` | title situation | `A`=Alta, `X`=A extinguir, `T`=Extinguida |
| `buscarHistorico` | include history | `S` / `N` |
| `d-1335801-p` | **page number** (displaytag) | `1`, `2`, … 25 rows/page |

### CRITICAL constraint — the thing that will waste your time

`codigoRama` and `ambito` are **refinement-only filters. They do not work standalone.**
A query with only `ambito=24` or only `codigoRama=431004` returns **0 results** and the app
emits the error:

> `Por favor, introduzca Código de Título, Universidad o Denominación para realizar la búsqueda`

You **must** supply at least one of `codigoEstudio`, `codigoUniversidad`, or
`descripcionEstudio`. Rama/ámbito can then narrow that result set, but can never drive a
query alone. This is why "filter by rama = Ingeniería" as a discovery strategy fails.

**Consequence:** the only route to a *complete* enumeration is to **iterate
`codigoUniversidad` over all 109 values** with `codigoTipo=M`. That is what this agent did.

### Pagination

Response contains `NN registros encontrados, mostrando del A al B`. 25 rows per page.
Increment `d-1335801-p`. Loop until collected rows == the `registros encontrados` count.

### Excel export (exists, but not needed)

The results page carries a displaytag export link using `6578706f7274=1` (hex for `export`)
and `d-1335801-e=2`. It returns a genuine BIFF `.xls`
(`application/vnd.ms-excel`). Usable, but requires `xlrd`/`pandas` which were absent in this
environment. **HTML pagination is simpler and has no dependencies — prefer it.**

### Encoding

Pages are **ISO-8859-1** — decode responses as `iso-8859-1` or you will get mojibake.
*Requests*, however, must be sent as **UTF-8**: `descripcionEstudio=Señal` works UTF-8-encoded
and returns 9 hits; the same term ISO-8859-1-encoded returns nothing.
Search is **accent-insensitive** (`Acustica` == `Acústica`, both 15 hits) but **`ñ` is NOT
folded to `n`** — `Senal` returns 0, `Señal` returns 9. Always send the real `ñ` in UTF-8.

## Result table shape

`<table id="estudio">`, columns: **Código | Título | Universidad | Nivel académico | Estado | (detail link)**

- **Código** = the RUCT code. This is the field of record.
- `<tr class="... extinguido">` marks extinct titles.
- **Universidad** reads `(Conjunto)` / `(Conjunto Internacional)` for joint degrees — the real
  partner list is only on the detail page.
- **Nivel académico** distinguishes the governing decree: `RD 822/2021 (3)`, `RD 1393/2007 (1)`,
  `RD 56/2005 (2)`.
- **Estado** carries the lifecycle: `Publicado en B.O.E.`, `(TITULACIÓN RENOVADA)`,
  `(TITULACIÓN RENOVADA POR ACREDITACIÓN INSTITUCIONAL)`, `(TITULACIÓN A EXTINGUIR)`,
  `(TITULACIÓN EXTINGUIDA)`. **Filter on this** — 2,780 of 8,866 másteres are extinct and
  another ~1,735 are being phased out.

## Per-title deep links — BOTH work statelessly

**1. Title summary** (accreditation history, centres, BOE PDFs, CID link):

```
https://www.educacion.gob.es/ruct/estudio.action?codigoCiclo=SC&codigoTipo=M&CodigoEstudio=<RUCT>&actual=estudios
```

Deep-linkable by RUCT code alone. Use this as the citable registry URL for any programme.

**2. Full plan record** (`solicitud/detalles`) — the richest page:

```
https://www.educacion.gob.es/ruct/solicitud/detalles.action?cod=<COD>&sit=<A|X|T>&actual=menu.solicitud.basicos
```

`<COD>` is **not** the RUCT code: it is `RUCTcode + YYYYMMDD + seq` (e.g. RUCT `4317140` →
`43171402025053001`). You cannot construct it — **harvest it from the 6th `<td>` of each
results row**. Note the href contains a `;jsessionid=...` segment *before* `?cod=`, so a regex
of `detalles\.action\?cod=` will silently match nothing. Use
`detalles\.action[^"?]*\?cod=(\d+)&amp;sit=([A-Z])`.

This page yields, per title: **Rama**, **Campo de estudio (ámbito)**, **Créditos ECTS**,
**Créditos de complementos formativos**, créditos obligatorios/optativos/prácticas/TFM,
**Agencia evaluadora** (ANECA / AQU / ACSUCYL / Unibasq / ACSUG …), Título Conjunto,
Erasmus Mundus flag, Mención Dual, plus **BOE PDF URLs** and the **sede.educacion.gob.es CID**
link.

**Gotcha:** the values live in `value="..."` attributes of `readonly` `<input>` elements, not
in text nodes. Stripping tags before parsing destroys the data — the page then looks
deceptively "empty" (just a list of labels). Parse the `<input name=... value=...>` pairs.
Relevant input names: `denominacion`, `conjunto`, `rama.codigo`, `ambito.codigo`, `habilita`,
`agencia`, `creditos`, `creditosObligatorios`, `creditosOptativos`, `creditosPracticas`,
`creditosTrabajo`, `creditosComplementos`, `creditosEcts`, `erasmusMundus`.

`creditosComplementos` is directly relevant to this project's 300-ECTS advanced-standing
question, though in practice it is populated for only a minority of records.

## `ambito` (Campo de estudio) code table

Useful for refinement once a base filter is supplied.

```
 1 Actividad física y deporte          17 Física y astronomía
 2 Arquitectura/construcción/civil     18 Fisioterapia, podología, nutrición…
 3 Biología y genética                 19 Historia del arte / bellas artes
 4 Bioquímica y biotecnología          20 Historia, arqueología, geografía, filosofía
 5 Ciencias agrarias / alimentos       21 Industrias Culturales: diseño, animación, cine
 6 Ciencias del comportamiento         22 Ing. eléctrica, electrónica y telecomunicación
 7 Económicas, ADE, márketing          23 Ing. industrial, mecánica, automática
 8 Ciencias de la educación            24 Ingeniería informática y de sistemas
 9 Medioambientales y ecología         25 Ing. química, materiales, medio ambiente
10 Ciencias sociales, trabajo social   26 Matemáticas y estadística
11 Ciencias de la Tierra               27 Ciencias Biomédicas
12 Derecho                             28 Periodismo, comunicación, publicidad
13 Enfermería                          29 Química
14 Estudios de género                  30 Veterinaria
15 Farmacia                            31 Interdisciplinar
16 Filología, traducción, lingüística  32 Medicina y Odontología
```

For this project's technical fields the relevant ámbitos are **24** (informática/sistemas),
**22** (telecomunicación — where DSP/acoustics tracks live), **26** (matemáticas y
estadística) and **31** (interdisciplinar).

## Method actually used for this wave

1. **Complete census.** Iterated all 109 `codigoUniversidad` values with `codigoTipo=M`,
   `buscarHistorico=N`, paginating each. Result: **8,866 unique official másteres** — the
   entire RUCT máster catalogue of Spain.
2. **Keyword sweep** (49 terms across AA/AB/AC/C) as an independent cross-check.
   **Every one of its 687 hits was already present in the census (0 misses)** — strong
   evidence the per-university enumeration is complete.
3. **Status filter** → 4,342 currently-active másteres (excluding extinguida / a extinguir).
4. **Field classification** by strong/weak regex tiers over the official title.
5. **Enrichment** of every candidate via `solicitud/detalles` for ECTS, rama, ámbito,
   agencia evaluadora, complementos formativos and BOE references.

## Reusable code

A dependency-free harvester (`fetch` / `parse` / `query`) is preserved at
`/tmp/claude-0/-home-user-master/e2d64666-b661-5915-9410-8c2508a62e48/scratchpad/w1tech/ruct.py`
with `census.py` (university iteration) and `enrich.py` (detail enrichment). Raw HTML is
cached under `w1tech/raw/` and `w1tech/det/`, so re-runs cost nothing. Note this scratchpad is
**shared between agents** — several files there were clobbered mid-run by sibling agents, so
work in a private subdirectory.

## What did NOT work

- **`ambito` / `codigoRama` as standalone filters** — always 0 results (see above). This is
  the main trap.
- **ISO-8859-1-encoded request parameters** — send UTF-8 instead.
- **`Senal` for `Señal`** — accent folding does not cover `ñ`.
- **Tag-stripping the `solicitud/detalles` page** — destroys all values (they are input
  attributes).
- **Ministry `¿Qué estudiar y dónde?` finder** — `https://www.universidades.gob.es/que-estudiar-y-donde/`
  returned **HTTP 503** on every attempt (direct curl and WebFetch), and direct `curl` to
  `universidades.gob.es` additionally failed TLS chain validation through the agent proxy.
  **Not usable this session.**
- **`https://www.educacion.gob.es/notascorte/`** — "Empty reply from server" via curl and
  **HTTP 503** via WebFetch. Also unusable. (It is in any case a *grado* admission-cutoff
  tool; másteres set their own admission criteria, so it was never likely to add much.)
- **Excel export path** — works, but blocked by absent `xlrd`/`openpyxl`/`pandas`.

## Recommendations for later waves

- **Verification wave:** to confirm any programme is official, query
  `codigoEstudio=<RUCT>` directly, or `descripcionEstudio=<distinctive words>` +
  `codigoTipo=M`. A hit = official `máster universitario`. **No hit = título propio**, whatever
  the marketing says. This is a single cheap GET per programme.
- The registry gives **no URL to the university's own programme page** and **no language of
  instruction**. Both must still come from the university site. Do not expect RUCT to settle
  the `castellano` vs English question.
- `agencia` tells you which regional agency verified the title — useful context, but ANECA is
  not the only valid verifier; AQU (Catalonia), Unibasq (Basque Country), ACSUCYL (Castilla y
  León), ACSUG (Galicia) etc. are equally official.
## Enseñanzas Artísticas register

_Written by the wave-1 registry agent for the MUSIC & BUSINESS slice (paths A, B, P, S, X), 2026-08-24.
Appended section — do not overwrite other agents' sections above/below._

### Headline finding

**There is no queryable national register of `Máster en Enseñanzas Artísticas` today.**
The register exists in law but is not yet operational, and conservatory-sector masters are
**not in RUCT** — RUCT covers universities only. Anyone who checks RUCT, finds nothing, and
concludes an ESMUC/Musikene/conservatorio master is unofficial will be **wrong**.

### The register: REEAS

Source: <https://www.infoartisticas.gob.es/comunes/registro-superiores.html> (accessed 2026-08-24).
`infoartisticas.gob.es` is the Ministry's dedicated portal for enseñanzas artísticas; the general
ministry URL `educacionfpydeportes.gob.es/contenidos/estudiantes/ensenanzas-artisticas.html`
redirects to it.

Verbatim, from that page:

> "La Ley 1/2024, de 7 de junio, por la que se regulan las enseñanzas artísticas superiores y se
> establece la organización y equivalencias de las enseñanzas artísticas profesionales, ha previsto
> **por primera vez** la creación de este registro."

> "El Registro Estatal de Enseñanzas Artísticas Superiores (REEAS) tendrá carácter público y en él,
> a instancias de las administraciones autonómicas competentes, se inscribirán los centros que
> impartan las enseñanzas artísticas superiores, así como los títulos oficiales de dichas enseñanzas
> con validez en todo el Estado. Este registro tendrá **interoperabilidad con el Registro de
> Universidades, Centros y Títulos (RUCT)**."

> "En el calendario de implantación de la Ley 1/2024, se establece la fecha en la que se establecerá
> el régimen, la organización y el funcionamiento del Registro Estatal de Enseñanzas Artísticas
> Superiores, **previsto para antes del 30 de septiembre de 2026**."

So: created by **Ley 1/2024, de 7 de junio (LEA)**; public; will be interoperable with RUCT; but its
operating rules were still pending as of this check, with a statutory deadline of 30 Sept 2026.
**No public query interface was found.** For a September 2027 intake it may well be live by the time
this dossier is acted on — re-check that URL.

### How to enumerate EAS masters in the meantime (the working route)

The legal chain, per the same page, is: plan de estudios **verificado** → **autorizado** by the
competent autonomous administration → carácter oficial established → **inscribed in REEAS and
published in the BOE**. Centres are registered first in a **register run by the autonomous education
administration**, which then transmits the entries to the Ministry.

That makes the practical enumeration route **per autonomous community**, not national:

1. Ministry index of the 19 competent administrations, each with its EAS page:
   <https://www.infoartisticas.gob.es/administraciones/ensenanzas-superiores-comunidades-autonomas.html>
   (verified: lists Andalucía, Aragón, Asturias, Illes Balears, Canarias, Cantabria, Castilla-La Mancha,
   Castilla y León, Cataluña, Extremadura, Galicia, Madrid, Murcia, Navarra, País Vasco, La Rioja,
   C. Valenciana, Ceuta, Melilla, each with its own URL.)
2. The regional body's own master list. The two that matter for music technology and music
   management were both driven successfully this way:
   - **C. Valenciana — ISEACV**: <https://iseacv.gva.es/es/musica-masters> — a clean, complete list of
     the six official `Máster en Enseñanzas Artísticas` in music.
   - **País Vasco — Musikene**: <https://musikene.eus/informate-sobre-nuestros-masteres/>.
   - **Cataluña — ESMUC**: <https://www.esmuc.cat/es/masteres-musicales-en-la-esmuc/> — note ESMUC's
     index is itself the cleanest official/propio discriminator found anywhere in this sweep (below).
3. The **quality agency** that verified the plan: ANECA or the regional agency
   (<https://www.infoartisticas.gob.es/comunes/agencias-ccaa.html>). A verification report is strong
   evidence of officiality.
4. **BOE**, for the plan-de-estudios publication. NOTE: I could not drive the BOE advanced search
   form programmatically — `https://www.boe.es/buscar/boe.php` rejected every parameter shape I tried
   (`dato[0]`, `dato[0][T]`) with "Los valores de búsqueda enviados son incorrectos", i.e. it needs a
   full form-derived parameter set. A later agent wanting BOE enumeration of
   `"Máster en Enseñanzas Artísticas"` should scrape the search form's own hidden fields first.

### What the register covers, and what it means for the candidate

`Máster en Enseñanzas Artísticas` is an **official Spanish qualification** (MECES 3 equivalent), but
it is **not** a `máster universitario`. Consequences worth carrying into the ranking:

- It will **never** have a RUCT code. Absence from RUCT is not evidence against it.
- PhD access is **not automatic** the way it is from a máster universitario — ISEACV's own page says
  doctoral study happens "a través de convenios con universidades"
  (<https://iseacv.gva.es/es/informacio-sobre-masters-oficials>). **Verify per programme**; do not
  assume. That page cites no Real Decreto, no BOE, no RUCT/REEAS — the legal framing must be taken
  from the LEA itself, not from ISEACV.
- Public master's scholarship eligibility for EAS titles was **NOT verified** in this sweep. Flag it.

### Enumerated: EAS masters in music technology / music management

Only three EAS masters in the whole sweep touch this slice:

| Programme | Centre | Region | Path |
|---|---|---|---|
| Máster en Enseñanzas Artísticas en **Sonología Aplicada y Creación Sonora** | CSM "Joaquín Rodrigo", València | C. Valenciana (ISEACV) | A |
| Máster en Enseñanzas Artísticas en **Composición Multimedia** | CSM "Salvador Seguí", Castelló | C. Valenciana (ISEACV) | A |
| Máster en Enseñanzas Artísticas en **Mediación, Gestión y Difusión Musical** | Musikene | País Vasco | P |

The other EAS music masters found are performance/research: ISEACV's Interpretación e Investigación
de la Música (Alicante), Interpretación Musical e Investigación Aplicada (Castelló), Interpretación
de Música Antigua e Investigación de Patrimonio Musical (Castelló), Interpretación Operística
(València); Musikene's Estudios Orquestales, Interpretación Musical, Interpretación Jazz, Creación de
la Música Contemporánea; ESMUC's six (Barcelona Jazz Máster, Recerca Musical, Lied "Victoria de los
Ángeles", Interpretació de la Música Clàssica i Contemporània, Flamencologia, Interpretació del
Flamenc).

ECTS, language of instruction and fees for all of these are **NOT FOUND** at the regional-index level
and need the conservatory's own programme page.

### The ESMUC three-way split — reusable as a discriminator

ESMUC's own masters index (<https://www.esmuc.cat/es/masteres-musicales-en-la-esmuc/>) sorts its
programmes into three explicitly named buckets, which is exactly the distinction the brief cares
about, stated by the institution itself:

- **Másteres oficiales** → `Máster en Enseñanzas Artísticas` (official, EAS sector, not in RUCT)
- **Másteres universitarios** → official university masters run with a university partner
  (Interpretació de la Música Antiga; Música com a Art Interdisciplinari — the latter is RUCT 4314740,
  UB + URV)
- **Másteres propios** → **títulos propios**. This bucket contains ESMUC's two most-marketed
  programmes: **Management i Producció Musical** and **Composició amb Tecnologies**.

When a conservatory does not label its buckets this clearly, the fallback test is the same as for
universities: a genuine EAS master cites a regional authorisation (decreto/orden of the CCAA) and a
BOE plan-de-estudios publication. A `máster propio` cites neither.

### Registry-adjacent notes on the university side (RUCT), same slice

- The Ministry's **"¿Qué estudiar y dónde?"** finder was **unreachable** during this session — every
  host/path tried (`educacion.gob.es/notasdecorte/`, `universidades.gob.es/que-estudiar-y-donde/`,
  and the `educacionfpydeportes.gob.es` catálogo paths) returned connection failure or 404. RUCT
  itself was fully available, so nothing was lost; but do not record that finder as "checked".
- **RUCT encoding gotcha, costly if missed**: the app decodes the two transports differently.
  A **POST** to `/ruct/consultaestudios.action` needs the body **latin-1 (ISO-8859-1)** percent-encoded;
  a **GET** to `/ruct/listaestudios` needs the query string **UTF-8** percent-encoded. Get it backwards
  and accented terms silently return "Ningún registro encontrado" — a false negative, not an error.
  `Música` returns **41** records when encoded correctly and **0** when not.
- **RUCT requires a non-empty `descripcionEstudio`.** Filtering by `ambito` or `codigoRama` alone
  returns zero. To browse an ámbito exhaustively, pass a near-universal substring (`a`, then union
  with `e`/`o`/`i`/`u`) together with the `ambito` code. Matching is a case- and accent-sensitive
  substring on the title, so `Ocio` also matches *negocio* and *socio* — occasionally useful, mostly
  a trap.
