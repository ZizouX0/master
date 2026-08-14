/**
 * Filtering — every filter is a pure predicate over one row, so they compose in any order and
 * each one is testable on its own.
 *
 * The functions in the "correctness rules" block below are the ones BUILD-SPEC §Non-negotiable
 * makes load-bearing. They live here, once, so that no view can accidentally implement a looser
 * version of "cheap" or "no audition".
 *
 * Pipeline order is fixed and it matters:
 *   1. dedupe    — collapse groups first, so every count below describes options, not rows
 *   2. predicates — cheap enum/boolean tests, short-circuiting
 *   3. search     — the only expensive step, so it runs on the smallest possible set
 */

import { CHEAP_BANDS, type ProgrammeRecord } from '../types';
import { distinctCount } from './dedup';
import { searchScores, type Corpus } from './search';

/** The minimum shape a filter needs. Both `ProgrammeRecord` and `ProgrammeIndex` satisfy it. */
export type Filterable = Pick<
  ProgrammeRecord,
  | 'id'
  | 'country'
  | 'region'
  | 'subtype'
  | 'level'
  | 'isDegree'
  | 'gate'
  | 'needsAudition'
  | 'auditionDisputed'
  | 'auditionSource'
  | 'auditionSuspected'
  | 'costDisputed'
  | 'existenceDisputed'
  | 'hasVerifiedDispute'
  | 'chance'
  | 'costBand'
  | 'language'
  | 'languageOk'
  | 'publicPrivate'
  | 'funding'
  | 'verdict'
>;

/** Index rows carry the build-time dedup flags; raw records do not. */
export type Row = Filterable & { primary?: boolean; g?: number };

// ─────────────────────────────────────────────────────────────────────────────
// Correctness rules — BUILD-SPEC §Non-negotiable, as functions
// ─────────────────────────────────────────────────────────────────────────────

export type AuditionCertainty = 'confirmed' | 'suspected' | 'none-found';

/**
 * Rule 5. A cost-disputed record may not appear in any cheap or free selection.
 *
 * `costDisputed` fires only from verified `correction` prose, so a non-empty value means a human
 * re-read the source page and found the recorded band wrong. Edinburgh's record still says
 * "Under EUR 1.5k/yr" against a real ≈£29,900, and KASK's still says the same against ≈€8,800.
 * The band is not corrected in the data — parsing the real number out of the prose would invent
 * precision — so the only safe rule is to drop the record from the cheap set and show the
 * correction instead.
 */
export function isCheap(rec: Pick<Filterable, 'costBand' | 'costDisputed'>): boolean {
  if (rec.costDisputed !== '') return false;
  return (CHEAP_BANDS as readonly string[]).includes(rec.costBand);
}

/**
 * Rule from the kill test. `auditionSource` distinguishes a phrase found in verified prose from
 * one found by regex over the raw, never-re-checked `audition` field. Only the first is a
 * confirmed audition. Collapsing them — or using the exported `needsAudition` boolean, half of
 * whose trues rest on the unverified field — is what puts a live-performance programme into a
 * "no audition" list.
 */
export function hasConfirmedAudition(
  rec: Pick<Filterable, 'gate' | 'auditionSource'>,
): boolean {
  if (rec.auditionSource === 'confirmed') return true;
  return /AUDITION/.test(rec.gate);
}

/** A phrase fired, but only over the unverified `audition` field. Show it; do not act on it. */
export function hasSuspectedAudition(rec: Pick<Filterable, 'gate' | 'auditionSource'>): boolean {
  return !hasConfirmedAudition(rec) && rec.auditionSource === 'suspected';
}

export function auditionCertainty(
  rec: Pick<Filterable, 'gate' | 'auditionSource'>,
): AuditionCertainty {
  if (hasConfirmedAudition(rec)) return 'confirmed';
  if (rec.auditionSource === 'suspected') return 'suspected';
  return 'none-found';
}

/** Rule 1. An empty verdict is a state of its own — never styled, sorted or counted as a verdict. */
export function isVerified(rec: Pick<Filterable, 'verdict'>): boolean {
  return rec.verdict !== '';
}

/** Rule 2. `isDegree === false` is a fact about the award, visible without opening the record. */
export function isRealDegree(rec: Pick<Filterable, 'isDegree'>): boolean {
  return rec.isDegree === true;
}

/** Verified prose says the programme is discontinued, suspended, or has no intake. */
export function existenceDisputed(rec: Pick<Filterable, 'existenceDisputed'>): boolean {
  return rec.existenceDisputed !== '';
}

/** Not eliminated by a verdict or by a verified doubt that it still exists. */
export function notRuledOut(rec: Pick<Filterable, 'verdict' | 'existenceDisputed'>): boolean {
  return rec.verdict !== 'AVOID' && !existenceDisputed(rec);
}

/** He can study in one of the languages this programme teaches in. */
export function languageReachable(rec: Pick<Filterable, 'languageOk'>): boolean {
  return rec.languageOk === true;
}

/** The recorded chance is better than Weak. A verdict outranks this wherever both exist. */
export function hasRealChance(rec: Pick<Filterable, 'chance'>): boolean {
  return rec.chance === 'Strong' || rec.chance === 'Possible';
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter state
// ─────────────────────────────────────────────────────────────────────────────

/** Multi-select facets. Each maps to one field; an empty array means "no constraint". */
export type FacetKey =
  | 'country'
  | 'region'
  | 'subtype'
  | 'level'
  | 'chance'
  | 'verdict'
  | 'costBand'
  | 'gate'
  | 'language'
  | 'publicPrivate'
  | 'funding';

export const FACET_KEYS: readonly FacetKey[] = [
  'country', 'region', 'subtype', 'level', 'chance', 'verdict',
  'costBand', 'gate', 'language', 'publicPrivate', 'funding',
];

export type DisputeKey = 'audition' | 'cost' | 'existence';

export interface FilterState {
  q: string;
  facets: Record<FacetKey, string[]>;
  /** Which audition certainties to KEEP. The default excludes only `confirmed`. */
  audition: AuditionCertainty[];
  /** Keep only records carrying the named dispute. Empty = no constraint. */
  disputes: DisputeKey[];
  degreeOnly: boolean;
  languageOnly: boolean;
  /** `isCheap`, so cost-disputed records are excluded whatever their band says. */
  cheapOnly: boolean;
  verifiedOnly: boolean;
  /** Show one row per dedup group. On by default — counts describe programmes, not rows. */
  dedupe: boolean;
}

export function emptyFilters(): FilterState {
  return {
    q: '',
    facets: {
      country: [], region: [], subtype: [], level: [], chance: [], verdict: [],
      costBand: [], gate: [], language: [], publicPrivate: [], funding: [],
    },
    // Suspected auditions stay visible: one he can disprove by reading two sentences is worth
    // more to him than one silently removed.
    audition: ['suspected', 'none-found'],
    disputes: [],
    degreeOnly: false,
    languageOnly: false,
    cheapOnly: false,
    verifiedOnly: false,
    dedupe: true,
  };
}

export function isDefaultFilters(s: FilterState): boolean {
  const d = emptyFilters();
  return (
    s.q === d.q &&
    FACET_KEYS.every((k) => s.facets[k].length === 0) &&
    sameSet(s.audition, d.audition) &&
    s.disputes.length === 0 &&
    s.degreeOnly === d.degreeOnly &&
    s.languageOnly === d.languageOnly &&
    s.cheapOnly === d.cheapOnly &&
    s.verifiedOnly === d.verifiedOnly &&
    s.dedupe === d.dedupe
  );
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

// ─────────────────────────────────────────────────────────────────────────────
// Predicates
// ─────────────────────────────────────────────────────────────────────────────

export type Predicate = (rec: Row) => boolean;

const FACET_FIELD: Record<FacetKey, keyof Filterable> = {
  country: 'country', region: 'region', subtype: 'subtype', level: 'level',
  chance: 'chance', verdict: 'verdict', costBand: 'costBand', gate: 'gate',
  language: 'language', publicPrivate: 'publicPrivate', funding: 'funding',
};

/** One facet as a predicate. `verdict: ['']` selects the 249 never-verified records. */
export function facetPredicate(key: FacetKey, selected: readonly string[]): Predicate {
  if (selected.length === 0) return () => true;
  const field = FACET_FIELD[key];
  const set = new Set(selected);
  return (rec) => set.has(String(rec[field]));
}

function disputePredicate(keys: readonly DisputeKey[]): Predicate {
  if (keys.length === 0) return () => true;
  return (rec) =>
    keys.some((k) =>
      k === 'audition'
        ? rec.auditionDisputed !== ''
        : k === 'cost'
          ? rec.costDisputed !== ''
          : rec.existenceDisputed !== '',
    );
}

/** Every active predicate, in evaluation order. Exported so a view can explain a filtered-out row. */
export function predicatesFor(state: FilterState): Array<{ name: string; test: Predicate }> {
  const out: Array<{ name: string; test: Predicate }> = [];
  for (const key of FACET_KEYS) {
    if (state.facets[key].length > 0) {
      out.push({ name: key, test: facetPredicate(key, state.facets[key]) });
    }
  }
  if (state.degreeOnly) out.push({ name: 'degreeOnly', test: isRealDegree });
  if (state.languageOnly) out.push({ name: 'languageOnly', test: languageReachable });
  if (state.cheapOnly) out.push({ name: 'cheapOnly', test: isCheap });
  if (state.verifiedOnly) out.push({ name: 'verifiedOnly', test: isVerified });
  if (state.audition.length < 3) {
    const keep = new Set(state.audition);
    out.push({ name: 'audition', test: (rec) => keep.has(auditionCertainty(rec)) });
  }
  if (state.disputes.length > 0) {
    out.push({ name: 'disputes', test: disputePredicate(state.disputes) });
  }
  return out;
}

export function passesPredicates(rec: Row, state: FilterState): boolean {
  return predicatesFor(state).every((p) => p.test(rec));
}

// ─────────────────────────────────────────────────────────────────────────────
// The pipeline
// ─────────────────────────────────────────────────────────────────────────────

export interface PipelineOptions {
  /** Required for the search step; omit to skip search entirely. */
  corpus?: Corpus | null;
  /** Skip this filter's own predicate — used for leave-one-out facet counts. */
  skip?: FacetKey | 'audition' | 'disputes' | null;
}

export interface PipelineResult<T extends Row> {
  rows: T[];
  /** Distinct programmes among `rows` — ICMP's three rows count once. */
  distinct: number;
  /** id → search score, or null when no search is active. */
  scores: Map<number, number> | null;
}

export function runPipeline<T extends Row>(
  all: readonly T[],
  state: FilterState,
  opts: PipelineOptions = {},
): PipelineResult<T> {
  // 1. dedupe. Index rows carry `primary` from the build step; a row without the flag is its
  //    own group and always survives.
  let rows = state.dedupe ? all.filter((r) => r.primary !== false) : all.slice();

  // 2. predicates
  const preds = predicatesFor(state).filter((p) => p.name !== opts.skip);
  if (preds.length > 0) rows = rows.filter((r) => preds.every((p) => p.test(r)));

  // 3. search — last, so the scan runs on the smallest possible set
  let scores: Map<number, number> | null = null;
  if (opts.corpus && state.q.trim() !== '') {
    scores = searchScores(opts.corpus, state.q);
    if (scores) {
      const hit = scores;
      rows = rows.filter((r) => hit.has(r.id));
      rows.sort((a, b) => (hit.get(b.id)! - hit.get(a.id)!) || a.id - b.id);
    }
  }

  return { rows: rows as T[], distinct: distinctCount(rows), scores };
}

// ─────────────────────────────────────────────────────────────────────────────
// Faceted counts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Leave-one-out counts: each facet's numbers reflect every OTHER active filter but not its own.
 *
 * Selecting Germany must not zero the other countries — their counts continue to answer the
 * question he is actually asking, "what would I get if I switched to it". Counting a facet
 * against its own selection makes every unselected value read 0, which is true and useless.
 *
 * Counts are of distinct programmes, not rows, whenever dedupe is on.
 */
export function facetCounts<T extends Row>(
  all: readonly T[],
  state: FilterState,
  key: FacetKey,
  values: readonly string[],
  opts: PipelineOptions = {},
): Record<string, number> {
  const base = runPipeline(all, state, { ...opts, skip: key }).rows;
  const field = FACET_FIELD[key];
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = 0;
  const buckets = new Map<string, T[]>();
  for (const rec of base) {
    const v = String(rec[field]);
    const b = buckets.get(v);
    if (b) b.push(rec);
    else buckets.set(v, [rec]);
  }
  for (const [v, rows] of buckets) {
    if (!(v in counts)) counts[v] = 0;
    counts[v] = state.dedupe ? rows.length : distinctCount(rows);
  }
  return counts;
}

/** All facets at once. `vocabularies` comes from meta.json, never from a hard-coded list. */
export function allFacetCounts<T extends Row>(
  all: readonly T[],
  state: FilterState,
  vocabularies: Partial<Record<FacetKey, readonly string[]>>,
  opts: PipelineOptions = {},
): Record<FacetKey, Record<string, number>> {
  const out = {} as Record<FacetKey, Record<string, number>>;
  for (const key of FACET_KEYS) {
    out[key] = facetCounts(all, state, key, vocabularies[key] ?? [], opts);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// The funnel
// ─────────────────────────────────────────────────────────────────────────────

export interface FunnelStep {
  label: string;
  test: Predicate | null;
}

export interface FunnelRow<T extends Row> {
  label: string;
  /** Distinct programmes surviving this step and every step above it. */
  count: number;
  rows: T[];
}

/**
 * Runs a set of predicates cumulatively and reports distinct programmes at each step. The steps
 * themselves are the view's to choose — this only guarantees they are applied in order and
 * counted as programmes rather than rows.
 */
export function funnel<T extends Row>(all: readonly T[], steps: readonly FunnelStep[]): FunnelRow<T>[] {
  let rows = all.slice();
  const out: FunnelRow<T>[] = [];
  for (const step of steps) {
    if (step.test) rows = rows.filter(step.test);
    out.push({ label: step.label, count: distinctCount(rows), rows: rows.slice() });
  }
  return out;
}

/** The verdict split that must be visible next to any shortlist, never a uniform list. */
export function verdictSplit(rows: readonly Row[]): {
  worthIt: number;
  conditional: number;
  avoid: number;
  unchecked: number;
} {
  const by = (v: string) => distinctCount(rows.filter((r) => r.verdict === v));
  return {
    worthIt: by('WORTH IT'),
    conditional: by('CONDITIONAL'),
    avoid: by('AVOID'),
    unchecked: by(''),
  };
}
