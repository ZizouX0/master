/**
 * Search — a hand-written weighted linear scan. No search library, no prebuilt index.
 *
 * MiniSearch's prebuilt index for this corpus measured 195 KB gzip — 5× the whole card index —
 * and its queries were not faster than a linear pass over 398 records. An inverted index
 * amortises its build cost over a corpus large enough that scanning is unaffordable; 398 records
 * is not that corpus.
 *
 * Rules:
 *   - a query is split on whitespace; a record matches only if EVERY token is found in at
 *     least one field (token-AND, field-OR);
 *   - each token scores the maximum field weight it occurs in, ×1.5 at a word boundary;
 *   - the record score is the sum over tokens.
 *
 * The corpus is built in two stages. The card fields are searchable from first paint; when
 * detail.json arrives the corpus is rebuilt with the prose fields added. `stage` says which.
 */

import type { ProgrammeDetail, ProgrammeIndex } from '../types';

/** Card-tier fields, available immediately. */
export const INDEX_WEIGHTS: ReadonlyArray<readonly [keyof ProgrammeIndex, number]> = [
  ['programme', 10],
  ['institution', 6],
  ['city', 4],
  ['country', 4],
  ['subtype', 3],
  ['gate', 2],
  ['whyChance', 2],
  ['language', 1],
  ['level', 1],
];

/** Prose-tier fields, added once detail.json has loaded. */
export const DETAIL_WEIGHTS: ReadonlyArray<readonly [keyof ProgrammeDetail, number]> = [
  ['study', 2],
  ['recommendation', 2],
  ['verdictWhy', 2],
  ['correction', 2],
  ['acceptsNonMusic', 1],
  ['entry', 1],
  ['portfolio', 1],
  ['audition', 1],
  ['qualification', 1],
  ['tuition', 1],
  ['scholarshipDetail', 1],
  ['deadline', 1],
];

/**
 * Letters that carry meaning but do not decompose under NFKD, so folding alone leaves them
 * unmatchable by an ASCII keyboard. The corpus contains Czech, Turkish, Polish, Greek and
 * Cyrillic; Greek tonos and Cyrillic breves do decompose and need no entry here.
 */
const SPECIAL_FOLD: Record<string, string> = {
  ß: 'ss', ø: 'o', æ: 'ae', œ: 'oe', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i', ŋ: 'n', ħ: 'h',
};
const SPECIAL_RE = new RegExp(`[${Object.keys(SPECIAL_FOLD).join('')}]`, 'g');

/**
 * NFKD-fold, drop combining marks, lowercase, then map the letters that do not decompose.
 * "Köln" and "koln" normalise alike; so do "İstanbul"/"istanbul" and "Ostrava"/"Ostrava".
 */
export function normalise(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(SPECIAL_RE, (c) => SPECIAL_FOLD[c] ?? c);
}

export function tokenise(query: string): string[] {
  return normalise(query)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export interface CorpusEntry {
  id: number;
  /** Parallel to `Corpus.weights`. */
  texts: string[];
}

export interface Corpus {
  entries: CorpusEntry[];
  weights: number[];
  /** 'index' = card fields only; 'full' = card fields plus the prose fields. */
  stage: 'index' | 'full';
}

export function buildCorpus(
  rows: readonly ProgrammeIndex[],
  detail?: Record<string, ProgrammeDetail> | null,
): Corpus {
  const useDetail = !!detail;
  const weights = [
    ...INDEX_WEIGHTS.map(([, w]) => w),
    ...(useDetail ? DETAIL_WEIGHTS.map(([, w]) => w) : []),
  ];
  const entries: CorpusEntry[] = rows.map((row) => {
    const texts = INDEX_WEIGHTS.map(([f]) => normalise(String(row[f] ?? '')));
    if (useDetail) {
      const d = detail![row.key];
      for (const [f] of DETAIL_WEIGHTS) texts.push(d ? normalise(String(d[f] ?? '')) : '');
    }
    return { id: row.id, texts };
  });
  return { entries, weights, stage: useDetail ? 'full' : 'index' };
}

export interface SearchHit {
  id: number;
  score: number;
}

/** Word-boundary occurrences score 1.5×, so "MA Mastering" outranks a paragraph saying it. */
function bestWeight(entry: CorpusEntry, weights: number[], token: string): number {
  let best = 0;
  for (let f = 0; f < entry.texts.length; f++) {
    const w = weights[f]!;
    if (w * 1.5 <= best) continue; // cannot beat what we have, whatever we find
    const text = entry.texts[f]!;
    let at = text.indexOf(token);
    while (at !== -1) {
      const boundary = at === 0 || !/[a-z0-9]/.test(text[at - 1]!);
      const score = boundary ? w * 1.5 : w;
      if (score > best) best = score;
      if (best >= w * 1.5) break; // best possible for this field
      at = text.indexOf(token, at + 1);
    }
  }
  return best;
}

/**
 * Score every entry. Returns hits sorted by score desc, then id asc — a stable order the caller
 * can re-sort. An empty query returns null, which means "no search is active": that is different
 * from an empty result set and callers must not conflate them.
 */
export function search(corpus: Corpus, query: string): SearchHit[] | null {
  const tokens = tokenise(query);
  if (tokens.length === 0) return null;
  const hits: SearchHit[] = [];
  for (const entry of corpus.entries) {
    let score = 0;
    let all = true;
    for (const token of tokens) {
      const w = bestWeight(entry, corpus.weights, token);
      if (w === 0) {
        all = false;
        break;
      }
      score += w;
    }
    if (all) hits.push({ id: entry.id, score });
  }
  hits.sort((a, b) => b.score - a.score || a.id - b.id);
  return hits;
}

/** Convenience for the filter pipeline: id → score, or null when no search is active. */
export function searchScores(corpus: Corpus, query: string): Map<number, number> | null {
  const hits = search(corpus, query);
  if (!hits) return null;
  return new Map(hits.map((h) => [h.id, h.score]));
}
