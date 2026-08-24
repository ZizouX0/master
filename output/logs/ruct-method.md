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
