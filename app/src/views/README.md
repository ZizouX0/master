Owned by the views agent. Five screens became three.

| file | what it is |
|---|---|
| `App.tsx` | the router. Three destinations, plus the record. Dead addresses (`/list`, `/me`, `/money`, `/rejects`) redirect to whatever absorbed them. |
| `kit.tsx` | the desk at laptop width: the `v-`-prefixed stylesheet, the page frame, the bands and panels, and the two date renderings (`CalendarWhen`, `Blocking`). Adds the shape `styles.css` does not own; never restates one of its selectors or its measure. |
| `ThisWeek.tsx` | **home.** `thisWeek(cal, now)` rendered as five disjoint bands: overdue → closing → open now → opening → the making. |
| `Find.tsx` | **search.** Console (search, six switches, the counts as a scale) · list (compact channels, the widest column) · the record — or, until one is open, the full fader throw — in the pane beside it. |
| `Shortlist.tsx` | **the tracker.** Grouped by what he has done about each; dates from `calendar.json` only; export and import. |
| `Record.tsx` | the document. `correction` in full, the money join, the calendar dates with what stands in front of them. Renders standalone below 1240px and in `Find`'s pane above it. |
| `Throw.tsx` | the funnel as a fader travel, plus `ThrowScale`, the same six stops reduced to an index for the 240px console. A component, not a screen. |

Cut: `Start.tsx` (the funnel is now `Throw.tsx`), `Programmes.tsx` (the browse list and its nine facets),
`MyList.tsx` (became `Shortlist.tsx`), `NotDegree.tsx` (the pattern engine moved to `data/patterns.ts`
and now states itself on the record it applies to), and `Money.tsx` — its eligibility normalisers
were already lifted into `data/money.ts`, and `money.test.ts` now checks those readings against
named schemes instead of against a duplicate of itself.
