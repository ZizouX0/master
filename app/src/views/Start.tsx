/**
 * The landing screen. Its whole job is to carry one finding before he decides anything:
 *
 *   Everything verified is expensive. Everything affordable was unverified — until now.
 *
 * That is a relationship between two sets, and a relationship between two sets is exactly what
 * a spreadsheet cannot hold — DOOR3.xlsx has a VERIFIED WORTH IT tab and a BEST BETS tab and
 * nothing anywhere says they barely intersect.
 *
 * Every number below is computed from the loaded data at render time. Nothing is hardcoded:
 * if the pipeline re-exports and a count moves, this screen moves with it.
 *
 * The funnel is defined as a stack of *filter states*, not as a stack of arbitrary predicates.
 * That is deliberate. It means each row's count is produced by exactly the same `runPipeline`
 * call that the list will make when he taps it, so the number he taps and the number he lands
 * on can never disagree.
 */

import type { JSX } from 'preact';
import { useStore } from '../store';
import { Page } from '../components/Layout';
import { listHref } from '../components/Filters';
import { emptyFilters, isCheap, isVerified, runPipeline, verdictSplit, type FilterState } from '../data/filters';
import { distinctCount } from '../data/dedup';
import type { ProgrammeIndex } from '../types';

/** A filter state built by layering a patch on the defaults. */
function step(patch: Partial<FilterState>, facets: Partial<FilterState['facets']> = {}): FilterState {
  const base = emptyFilters();
  return { ...base, ...patch, facets: { ...base.facets, ...facets } };
}

const ALL_AUDITION: FilterState['audition'] = ['confirmed', 'suspected', 'none-found'];
const NOT_AVOID = ['WORTH IT', 'CONDITIONAL', ''];
const REAL_CHANCE = ['Strong', 'Possible'];

/**
 * The seven steps, in the order that matters. A spreadsheet has 37 columns and no opinion about
 * which to touch first; the wrong first move (filter by country) leaves 52 UK rows, five of
 * which are not degrees. This encodes the correct order as a readable stack.
 */
const FUNNEL: Array<{ label: string; note?: string; filters: FilterState }> = [
  {
    label: 'collected in this door',
    filters: step({ audition: ALL_AUDITION }),
  },
  {
    label: 'award a real master’s degree',
    note: 'the rest are certificates, título propio, RNCP Mastère',
    filters: step({ audition: ALL_AUDITION, degreeOnly: true }),
  },
  {
    label: 'no confirmed live audition',
    note: 'a production test is the job, not a barrier',
    filters: step({ degreeOnly: true }),
  },
  {
    label: 'taught in English or French',
    note: 'you have no German',
    filters: step({ degreeOnly: true, languageOnly: true }),
  },
  {
    label: 'not ruled out on the official page',
    filters: step({ degreeOnly: true, languageOnly: true }, { verdict: NOT_AVOID }),
  },
  {
    label: 'your background gives you a real chance',
    filters: step({ degreeOnly: true, languageOnly: true }, { verdict: NOT_AVOID, chance: REAL_CHANCE }),
  },
  {
    label: 'affordable — €5k a year or less',
    note: 'cost-disputed records excluded, whatever their band says',
    filters: step({ degreeOnly: true, languageOnly: true, cheapOnly: true }, { verdict: NOT_AVOID, chance: REAL_CHANCE }),
  },
];

function FunnelRow(p: {
  label: string;
  note?: string;
  count: number;
  dropped: number | null;
  last: boolean;
  href: string;
}): JSX.Element {
  return (
    <a class={'funnel__row' + (p.last ? ' funnel__row--last' : '')} href={'#' + p.href}>
      <span class="funnel__n">{p.count}</span>
      <span class="funnel__label">
        {p.label}
        {p.note ? <span class="funnel__drop"> — {p.note}</span> : null}
      </span>
      {p.dropped ? <span class="funnel__drop">−{p.dropped}</span> : null}
      <span class="funnel__go" aria-hidden="true">
        ›
      </span>
    </a>
  );
}

export default function Start(): JSX.Element {
  const index = useStore((s) => s.index);
  const funding = useStore((s) => s.funding);
  const totalDistinct = useStore((s) => s.totalDistinct);
  const entries = useStore((s) => s.personal.entries);

  // ── the funnel, every row a real pipeline run ──────────────────────────────
  const rows = FUNNEL.map((f) => {
    const r = runPipeline(index, f.filters);
    return { ...f, count: r.distinct, rows: r.rows as ProgrammeIndex[] };
  });
  const finalStep = rows[rows.length - 1]!;
  const split = verdictSplit(finalStep.rows);

  // ── the tension, stated in live numbers ────────────────────────────────────
  const primaries = index.filter((r) => r.primary !== false);
  const worthIt = primaries.filter((r) => r.verdict === 'WORTH IT');
  const worthItCount = distinctCount(worthIt);
  const worthItAffordable = distinctCount(worthIt.filter(isCheap));
  const worthItRows = index.filter((r) => r.verdict === 'WORTH IT').length;
  const unverified = index.filter((r) => !isVerified(r)).length;
  const notDegree = distinctCount(primaries.filter((r) => !r.isDegree));

  const tracked = Object.values(entries).filter((e) => e.status !== 'none').length;

  const worthItHref = listHref(step({ audition: ALL_AUDITION }, { verdict: ['WORTH IT'] }));
  const uncheckedHref = listHref(step({ audition: ALL_AUDITION }, { verdict: [''] }));

  return (
    <Page title="Where you stand">
      <p class="kicker">Door 3 · production and studio craft · September 2027 intake</p>

      <h2 class="thesis">
        Everything verified is expensive. <em>Everything affordable was unverified</em> — until now.
      </h2>

      <p class="standfirst">
        {worthItCount} distinct programmes ({worthItRows} rows) have been opened, read and judged
        worth it. Exactly {worthItAffordable} of them{' '}
        {worthItAffordable === 1 ? 'is one' : 'are ones'} you could pay for. Meanwhile{' '}
        {unverified} of {index.length} records have never been checked against an official page —
        and that is where nearly everything cheap lives.
      </p>

      <hr class="hairline" />

      <h3 class="kicker" id="funnel-heading">
        How {rows[0]!.count} becomes {finalStep.count}
      </h3>
      <div class="funnel" aria-labelledby="funnel-heading">
        {rows.map((r, i) => (
          <FunnelRow
            key={r.label}
            label={r.label}
            note={r.note}
            count={r.count}
            dropped={i === 0 ? null : rows[i - 1]!.count - r.count}
            last={i === rows.length - 1}
            href={listHref(r.filters)}
          />
        ))}
      </div>
      <p class="dim" style="font-size:12px;margin-top:8px">
        Counts are distinct programmes, not rows — ICMP’s three records are one programme. Every
        row opens the exact set it names.
      </p>

      <h3 class="kicker" style="margin-top:24px">
        And those {finalStep.count} are not equivalent
      </h3>
      <div class="split">
        <a
          class="split__cell split__cell--worth"
          href={'#' + listHref({ ...finalStep.filters, facets: { ...finalStep.filters.facets, verdict: ['WORTH IT'] } })}
        >
          <span class="split__n">{split.worthIt}</span>
          <span class="split__label">read and judged worth it</span>
        </a>
        <a
          class="split__cell split__cell--cond"
          href={'#' + listHref({ ...finalStep.filters, facets: { ...finalStep.filters.facets, verdict: ['CONDITIONAL'] } })}
        >
          <span class="split__n">{split.conditional}</span>
          <span class="split__label">conditional — worth it only if…</span>
        </a>
        <a
          class="split__cell split__cell--unchecked"
          href={'#' + listHref({ ...finalStep.filters, facets: { ...finalStep.filters.facets, verdict: [''] } })}
        >
          <span class="split__n">{split.unchecked}</span>
          <span class="split__label">never checked by anyone</span>
        </a>
      </div>
      <p class="dim" style="font-size:12px">
        {split.unchecked > 0
          ? `Those ${split.unchecked} came from a search listing, not from the institution. Treat every line on them as a lead, not a fact.`
          : 'Every one of these has been read against the official page.'}
      </p>

      <div class="bigbtns">
        <a class="bigbtn bigbtn--primary" href={'#' + listHref(finalStep.filters)}>
          <span class="bigbtn__main">
            <span class="bigbtn__title">The ones I could actually do</span>
            <span class="bigbtn__sub">
              {finalStep.count} programmes · {split.worthIt} worth it · {split.conditional}{' '}
              conditional · {split.unchecked} unchecked
            </span>
          </span>
          <span class="bigbtn__arrow" aria-hidden="true">
            →
          </span>
        </a>
        <a class="bigbtn" href="#/money">
          <span class="bigbtn__main">
            <span class="bigbtn__title">Money</span>
            <span class="bigbtn__sub">
              {funding.length} funding schemes. Nationality was rarely the bar — subject was.
            </span>
          </span>
          <span class="bigbtn__arrow" aria-hidden="true">
            →
          </span>
        </a>
        <a class="bigbtn" href="#/me">
          <span class="bigbtn__main">
            <span class="bigbtn__title">My list</span>
            <span class="bigbtn__sub">
              {tracked === 0 ? 'Nothing saved yet — it lives on this phone only.' : `${tracked} saved`}
            </span>
          </span>
          <span class="bigbtn__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>

      <hr class="hairline" />

      <ul class="standfirst" style="display:grid;gap:16px">
        <li>
          <a href="#/rejects">{notDegree} of the {totalDistinct} are sold as a master’s and are not
          one →</a>{' '}
          <span class="dim">
            The highest proportion of any field this project searched. 57 of them have “Master”,
            “Máster” or “Mastère” in the name.
          </span>
        </li>
        <li>
          <a href={'#' + uncheckedHref}>{unverified} of {index.length} were never checked →</a>{' '}
          <span class="dim">
            Nothing in this app is verified unless it says so. Where a record carries no verdict it
            gets no colour — absence of colour means absence of checking.
          </span>
        </li>
        <li>
          <a href={'#' + worthItHref}>The {worthItCount} that were read and judged worth it →</a>{' '}
          <span class="dim">
            A verdict outranks the automatic “chance” rating everywhere: 28 records rated Strong
            were judged AVOID once a human read the page.
          </span>
        </li>
      </ul>
    </Page>
  );
}
