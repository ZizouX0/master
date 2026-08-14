/**
 * THE THROW — the funnel drawn as a fader travel.
 *
 * It used to be a whole screen, and as a screen it was an essay about where the data came from
 * that read identically for fifty-six weeks. It is not a screen. It is one component, it appears
 * exactly once in the app, above the search results, and it does one job: it says how 398 becomes
 * a number he could act on, and every stop is a live filter he can stand on.
 *
 * Every row's count comes from the same `runPipeline` call the list will make when he clicks it,
 * so the number on the fader and the number on the list can never disagree. The travel between
 * two stops is proportional to what that stop cut — the fader falls furthest where the loss is
 * biggest — but the number is always printed, so position never has to be decoded.
 *
 * `chance` is not a stop. It was one, and it should not have been: `Strong / Possible / Weak` is
 * a heuristic over a search-listing blurb, and 28 records it rated Strong came back AVOID once a
 * human read the page. A guess does not get to remove options.
 */

import type { JSX } from 'preact';
import { useStore } from '../store';
import { emptyFilters, runPipeline, type FilterState } from '../data/filters';
import { encodeFilters } from '../components/Filters';

/** A filter state built by layering a patch on the defaults. */
function step(patch: Partial<FilterState>, facets: Partial<FilterState['facets']> = {}): FilterState {
  const base = emptyFilters();
  return { ...base, ...patch, facets: { ...base.facets, ...facets } };
}

const ALL_AUDITION: FilterState['audition'] = ['confirmed', 'suspected', 'none-found'];
const NOT_AVOID = ['WORTH IT', 'CONDITIONAL', ''];

interface Stop {
  label: string;
  /** What this stop removed, in his terms. Named by the thing he controls wherever possible. */
  drop: string;
  filters: FilterState;
}

const STOPS: Stop[] = [
  {
    label: 'collected in this door',
    drop: 'production and studio craft, everything found',
    filters: step({ audition: ALL_AUDITION }),
  },
  {
    label: 'award a real master’s degree',
    drop: 'certificates, título propio, RNCP Mastère',
    filters: step({ audition: ALL_AUDITION, degreeOnly: true }),
  },
  {
    label: 'no confirmed live audition',
    drop: 'a production test is the job, not a barrier',
    filters: step({ degreeOnly: true }),
  },
  {
    label: 'taught in English or French',
    drop: 'you have no German',
    filters: step({ degreeOnly: true, languageOnly: true }),
  },
  {
    label: 'not ruled out on their own page',
    drop: 'read, and judged AVOID',
    filters: step({ degreeOnly: true, languageOnly: true }, { verdict: NOT_AVOID }),
  },
  {
    label: '€5k a year or less',
    drop: 'cost-disputed records dropped whatever their band says',
    filters: step({ degreeOnly: true, languageOnly: true, cheapOnly: true }, { verdict: NOT_AVOID }),
  },
];

function href(f: FilterState): string {
  const qs = encodeFilters(f);
  return '#/find' + (qs ? '?' + qs : '');
}

export function Throw(p: { onPick?: (f: FilterState) => void }): JSX.Element {
  const index = useStore((s) => s.index);

  const rows = STOPS.map((s) => ({ ...s, count: runPipeline(index, s.filters).distinct }));
  const top = rows[0]?.count ?? 0;

  return (
    <section aria-label="How the corpus narrows">
      <ol class="throw">
        {rows.map((r, i) => {
          // Two different falls meet on one row, and they are not the same number.
          // `cut` is what was removed to REACH this stop — that is the printed −N.
          // `--travel` is what falls away BELOW it, which is the distance to the next tick.
          const cut = i === 0 ? 0 : rows[i - 1]!.count - r.count;
          const next = rows[i + 1];
          const travel = next && top > 0 ? (r.count - next.count) / top : 0;
          const last = i === rows.length - 1;
          return (
            <li key={r.label}>
              <a
                class={'throw__row' + (last ? ' throw__row--cap' : '')}
                /* The cap row carries no --travel: the fader has bottomed out and rests at the
                   end of the rail. Giving it a fall would draw travel below the last stop. */
                style={last ? undefined : `--travel:${travel.toFixed(3)}`}
                href={href(r.filters)}
                onClick={p.onPick ? () => p.onPick!(r.filters) : undefined}
              >
                <span class="throw__n">{r.count}</span>
                <span class="throw__tick" aria-hidden="true" />
                <span class="throw__main">
                  <span class="throw__label">{r.label}</span>
                  <span class="throw__drop">
                    {i === 0 ? r.drop : `−${cut} ${r.drop}`}
                  </span>
                </span>
                <span class="throw__go" aria-hidden="true">
                  ›
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <p class="v-src">
        Counts are distinct programmes, not rows — ICMP’s three records are one programme. Every stop opens
        exactly the set it names.
      </p>
    </section>
  );
}

export default Throw;
