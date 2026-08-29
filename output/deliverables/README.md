# Spain master's sweep — deliverables

## Excel
| File | Contents |
|---|---|
| **`Spain-masters-sweep.xlsx`** | **Everything in one workbook**, 5 sheets: Index · Programmes (135) · Funding (84) · Spring intakes (357) · Regional fees (17) |
| `programmes.xlsx` | 135 enriched + verified programmes, 42 columns |
| `funding.xlsx` | 84 funding sources, Tunisian eligibility as its own column |
| `spring-intakes.xlsx` | 357 programmes checked for a Jan–Jun cohort start |

Every sheet is frozen at the header, auto-filtered, and written as **text format** so Excel
cannot reinterpret a value (a cell starting `=` or `+` would otherwise become a formula,
and `1-2` could become a date). Conversion was verified **cell by cell** against the source
CSVs — 593 rows, zero mismatches. The longest single cell is 3,883 characters, well inside
Excel's 32,767 limit, so nothing is truncated.

## PDF (`pdf/`)
`shortlist` · `gaps` · `AGENT-BRIEF` · `BRIEF-original` · `SPRING-BRIEF` · `STATE` ·
`COVERED` · `blocked-and-redo` · `ensenanzas-artisticas-register` · `ruct-method`

Each PDF was verified by extracting its text back with `pdftotext` and confirming every
word of the source markdown survives. **URLs are printed in full after each link** — in a
sources-based dataset the URL is the evidence, and a normal hyperlink hides it inside an
attribute where neither a reader nor a text extractor can see it.

## Also here
`deadlines.ics` (150 events, each deadline plus a 45-day reminder) · `sources.jsonl`
(925 source records, the audit trail) · the three source CSVs.

## Read this first
`gaps.pdf` is not an apology, it is a deliverable. A low score in `shortlist` often means
*unknown*, not *bad*, and gaps says which. The most consequential blank: `non_eu_surcharge`
is unsourced for 65 of 135 programmes, and where it IS known it roughly doubles the price.
