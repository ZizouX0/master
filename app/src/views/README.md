Owned by the views agent. Five screens became three.

| file | what it is |
|---|---|
| `App.tsx` | the router. Three destinations, plus the record. Dead addresses (`/list`, `/me`, `/money`, `/rejects`) redirect to whatever absorbed them. |
| `kit.tsx` | the desk at laptop width: the `v-`-prefixed stylesheet, the page frame, the bands and panels, and the two date renderings (`CalendarWhen`, `Blocking`). Adds the shape `styles.css` does not own; never restates one of its selectors or its measure. |
| `ThisWeek.tsx` | **home.** `thisWeek(cal, now)` rendered as five disjoint bands: overdue → closing → open now → opening → the making. |
| `Find.tsx` | **search.** Console (search, six switches, the throw) · list (compact channels) · the record, in the pane beside it. |
| `Shortlist.tsx` | **the tracker.** Grouped by what he has done about each; dates from `calendar.json` only; export and import. |
| `Record.tsx` | the document. `correction` in full, the money join, the calendar dates with what stands in front of them. Renders standalone below 1240px and in `Find`'s pane above it. |
| `Throw.tsx` | the funnel as a fader travel. A component, not a screen; it appears once, above the results. |
| `Money.tsx` | **not a screen.** A re-export of the eligibility normalisers, kept only because `data/__tests__/money.test.ts` still imports this path. See the note at the top of the file. |

Cut: `Start.tsx` (the funnel is now `Throw.tsx`), `Programmes.tsx` (the browse list and its nine facets),
`MyList.tsx` (became `Shortlist.tsx`), `NotDegree.tsx` (the pattern engine moved to `data/patterns.ts`
and now states itself on the record it applies to).
