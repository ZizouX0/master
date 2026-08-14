/**
 * The list. Deliberately not a table — DOOR3.xlsx is the table, it has 19 tabs and filter
 * buttons and he likes it, and rebuilding it in a webview at 390px is strictly worse.
 *
 * What this does that a spreadsheet row cannot: it carries one sentence of a human's reasoning
 * on every card, and it marks the two states a grid hides. An empty `verdict` is drawn as an
 * explicit NOT VERIFIED marker rather than as a blank cell (249 of 398), and `isDegree: false`
 * is a banner at title weight rather than a column he has to scroll to (130 of 398, 57 of them
 * with "Master" in the name).
 *
 * Paginated rather than infinite-scrolled, so his scroll position survives a "show more". At
 * 398 records that is cheaper and steadier than virtualisation, and the count stays exact.
 */

import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../store';
import { Page, Empty } from '../components/Layout';
import { CostChip, GateChip, LangChip, LevelChip, VerdictChip } from '../components/chips';
import {
  Filters,
  activeFilters,
  encodeFilters,
  listHref,
  type ActiveFilter,
} from '../components/Filters';
import { emptyFilters, isDefaultFilters, predicatesFor, runPipeline, type AuditionCertainty, type FilterState } from '../data/filters';

/** Every certainty, i.e. no audition constraint at all. */
const ALL_AUDITION: AuditionCertainty[] = ['confirmed', 'suspected', 'none-found'];
import type { ProgrammeIndex } from '../types';

const PAGE_SIZE = 40;

// ── sorting ────────────────────────────────────────────────────────────────
// A verdict outranks everything, including `chance`: 28 records rated Strong were judged AVOID
// once a human read the page. AVOID sorts last but is NOT hidden — the 86 avoids are the point
// of the exercise, each one an application he now does not have to make.

const VERDICT_RANK: Record<string, number> = { 'WORTH IT': 0, CONDITIONAL: 1, '': 2, AVOID: 3 };
const CHANCE_RANK: Record<string, number> = { Strong: 0, Possible: 1, Weak: 2 };
const COST_RANK: Record<string, number> = {
  Free: 0,
  'Under EUR 1.5k/yr': 1,
  'EUR 1.5k-5k/yr': 2,
  'EUR 5k-15k/yr': 3,
  'Over EUR 15k/yr': 4,
  'Not published': 5,
};

type Sort = 'verdict' | 'cost' | 'country';

const SORTS: Array<{ key: Sort; label: string }> = [
  { key: 'verdict', label: 'Verdict' },
  { key: 'cost', label: 'Cheapest' },
  { key: 'country', label: 'Country' },
];

function compare(sort: Sort, a: ProgrammeIndex, b: ProgrammeIndex): number {
  if (sort === 'country') {
    return a.country.localeCompare(b.country) || a.institution.localeCompare(b.institution);
  }
  if (sort === 'cost') {
    return (
      (COST_RANK[a.costBand] ?? 9) - (COST_RANK[b.costBand] ?? 9) ||
      (VERDICT_RANK[a.verdict] ?? 9) - (VERDICT_RANK[b.verdict] ?? 9) ||
      a.id - b.id
    );
  }
  return (
    (VERDICT_RANK[a.verdict] ?? 9) - (VERDICT_RANK[b.verdict] ?? 9) ||
    (CHANCE_RANK[a.chance] ?? 9) - (CHANCE_RANK[b.chance] ?? 9) ||
    (COST_RANK[a.costBand] ?? 9) - (COST_RANK[b.costBand] ?? 9) ||
    a.id - b.id
  );
}

// ── the card sentence ──────────────────────────────────────────────────────

function firstSentence(text: string, max = 220): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const stop = s.search(/[.!?](\s|$)/);
  const cut = stop > 30 ? s.slice(0, stop + 1) : s;
  return cut.length > max ? cut.slice(0, max).replace(/\s\S*$/, '') + '…' : cut;
}

/**
 * Fixed precedence, so the sentence is always the most decision-relevant known thing. The last
 * rung is `whyChance` — an automatic guess over a listing blurb — and it is rendered muted and
 * upright to mark it as exactly that. A card with nothing at all is visibly thinner, and that
 * thinness is information: nobody looked at this one.
 */
function cardSentence(
  row: ProgrammeIndex,
  detail: Record<string, { verdictWhy?: string; acceptsNonMusic?: string }> | null,
): { text: string; guess: boolean } {
  const d = detail?.[row.key];
  if (d?.verdictWhy) return { text: firstSentence(d.verdictWhy), guess: false };
  const accepts = d?.acceptsNonMusic ?? '';
  if (accepts.length > 60) return { text: firstSentence(accepts), guess: false };
  if (row.whyChance) return { text: firstSentence(row.whyChance, 160), guess: true };
  return { text: '', guess: false };
}

// ── the card ───────────────────────────────────────────────────────────────

function Card(p: { row: ProgrammeIndex; sentence: { text: string; guess: boolean } }): JSX.Element {
  const r = p.row;
  return (
    <a class={'card' + (r.verdict === 'AVOID' ? ' card--avoid' : '')} href={`#/p/${r.id}`}>
      {/* isDegree === false is a banner above the title, at title weight, because 57 of the
          130 have "Master", "Máster" or "Mastère" in the name and the title itself misleads. */}
      {r.isDegree === false ? <LevelChip level={r.level} isDegree={false} /> : null}

      <h3 class="card__title">{r.programme || 'Programme not recorded'}</h3>
      <p class="card__inst">
        {r.institution || <em class="dim">Institution not recorded</em>}
        <br />
        <span class="card__where">
          {r.city ? r.city + ' · ' : ''}
          {r.country}
        </span>
      </p>

      <div class="chiprow">
        <VerdictChip verdict={r.verdict} />
        <GateChip gate={r.gate} needsAudition={r.needsAudition} auditionSource={r.auditionSource} />
        <CostChip band={r.costBand} disputed={r.costDisputed !== ''} />
        <LangChip language={r.language} ok={r.languageOk} />
        {r.isDegree !== false ? <LevelChip level={r.level} isDegree={r.isDegree} /> : null}
      </div>

      {p.sentence.text ? (
        <p class={'card__sentence' + (p.sentence.guess ? ' card__sentence--guess' : '')}>
          {p.sentence.guess ? 'Unverified guess from the listing text: ' : ''}
          {p.sentence.text}
        </p>
      ) : null}

      {r.rows > 1 ? (
        <p class="card__dupes">
          {r.rows} records for this programme, from different searches — the fullest is shown.
        </p>
      ) : null}
    </a>
  );
}

// ── no results: name the constraint doing the killing ──────────────────────

function rescue(index: ProgrammeIndex[], filters: FilterState): Array<{ name: string; count: number; without: FilterState }> {
  const out: Array<{ name: string; count: number; without: FilterState }> = [];
  for (const p of predicatesFor(filters)) {
    let without: FilterState;
    if (p.name === 'degreeOnly') without = { ...filters, degreeOnly: false };
    else if (p.name === 'languageOnly') without = { ...filters, languageOnly: false };
    else if (p.name === 'cheapOnly') without = { ...filters, cheapOnly: false };
    else if (p.name === 'verifiedOnly') without = { ...filters, verifiedOnly: false };
    else if (p.name === 'audition') without = { ...filters, audition: ['confirmed', 'suspected', 'none-found'] };
    else if (p.name === 'disputes') without = { ...filters, disputes: [] };
    else without = { ...filters, facets: { ...filters.facets, [p.name]: [] } };
    out.push({ name: p.name, count: runPipeline(index, without).distinct, without });
  }
  return out.sort((a, b) => b.count - a.count).slice(0, 2);
}

// ───────────────────────────────────────────────────────────────────────────

export default function Programmes(): JSX.Element {
  const index = useStore((s) => s.index);
  const results = useStore((s) => s.results);
  const detail = useStore((s) => s.detail);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const navigate = useStore((s) => s.navigate);
  const route = useStore((s) => s.route);

  const [sheet, setSheet] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);

  const sort: Sort = (['verdict', 'cost', 'country'] as const).includes(route.query.sort as Sort)
    ? (route.query.sort as Sort)
    : 'verdict';

  /** One place writes the URL, so the hash is always the truth and always shareable. */
  const go = (next: FilterState, nextSort: Sort = sort) => {
    setFilters(next);
    setShown(PAGE_SIZE);
    const qs = [encodeFilters(next), nextSort === 'verdict' ? '' : 'sort=' + nextSort]
      .filter(Boolean)
      .join('&');
    navigate('/list' + (qs ? '?' + qs : ''), true);
  };

  const rows = results.rows as ProgrammeIndex[];
  // A search orders by score; anything else orders by the verdict-first rule.
  const ordered = useMemo(
    () => (results.scores ? rows : rows.slice().sort((a, b) => compare(sort, a, b))),
    [rows, sort, results.scores],
  );

  const active: ActiveFilter[] = activeFilters(filters);
  // The default hides confirmed live auditions. Saying "that is all N" while
  // a match sits behind that filter is a completeness claim the app has not earned.
  const hiddenByAudition =
    filters.audition.length < ALL_AUDITION.length
      ? Math.max(0, runPipeline(index, { ...filters, audition: ALL_AUDITION }).rows.length - ordered.length)
      : 0;

  const page = ordered.slice(0, shown);

  return (
    <Page title="Programmes" back="/">
      <div class="searchrow" style="padding:0 0 8px">
        <input
          class="search"
          type="search"
          placeholder="Search names and all prose — “raw material”, “no German”, RNCP"
          value={filters.q}
          onInput={(e) => go({ ...filters, q: (e.target as HTMLInputElement).value })}
        />
      </div>

      <div class="listbar">
        <span class="listbar__count" aria-live="polite">
          {results.distinct} {results.distinct === 1 ? 'programme' : 'programmes'}
          {results.rows.length !== results.distinct ? ` · ${results.rows.length} rows` : ''}
        </span>
        <select
          class="btn btn--sm"
          aria-label="Sort"
          value={sort}
          onChange={(e) => go(filters, (e.target as HTMLSelectElement).value as Sort)}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="button" class="btn btn--sm" onClick={() => setSheet(true)}>
          Filters {active.length ? `(${active.length})` : '▾'}
        </button>
      </div>

      {active.length > 0 ? (
        <div class="activefilters">
          {active.map((a) => (
            <button key={a.label} type="button" class="fchip" onClick={() => go(a.without)}>
              {a.label}
              <span aria-hidden="true">✕</span>
            </button>
          ))}
          {!isDefaultFilters(filters) ? (
            <button type="button" class="fchip" onClick={() => go(emptyFilters())}>
              clear all
            </button>
          ) : null}
        </div>
      ) : null}

      {ordered.length === 0 ? (
        <Empty>
          <p style="margin-bottom:12px">Nothing matches all of those.</p>
          {rescue(index, filters).map((r) => (
            <p key={r.name} style="margin-bottom:8px">
              Dropping <strong>{r.name}</strong> gives you {r.count}.{' '}
              <a href={'#' + listHref(r.without)}>Drop it →</a>
            </p>
          ))}
          <p>
            <a href={'#' + listHref(emptyFilters())}>Start over →</a>
          </p>
        </Empty>
      ) : (
        <>
          <div class="cards" style="padding:0">
            {page.map((r) => (
              <Card key={r.key} row={r} sentence={cardSentence(r, detail)} />
            ))}
          </div>
          {shown < ordered.length ? (
            <button type="button" class="more" onClick={() => setShown(shown + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, ordered.length - shown)} more · {ordered.length - shown}{' '}
              left
            </button>
          ) : (
            <p class="dim" style="font-size:12px;margin-top:16px">
              {hiddenByAudition > 0 ? (
                <>
                  {ordered.length} shown. <strong>{hiddenByAudition} more match</strong> and{' '}
                  {hiddenByAudition === 1 ? 'is' : 'are'} hidden because{' '}
                  {hiddenByAudition === 1 ? 'it needs' : 'they need'} a live audition.{' '}
                  <a href={'#' + listHref({ ...filters, audition: ALL_AUDITION })}>Show {hiddenByAudition === 1 ? 'it' : 'them'} →</a>
                </>
              ) : (
                <>That is all {ordered.length}.</>
              )}
            </p>
          )}
        </>
      )}

      <Filters open={sheet} onClose={() => setSheet(false)} onChange={(next) => go(next)} />
    </Page>
  );
}
