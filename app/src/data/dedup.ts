/**
 * Duplicate detection — a two-tier deterministic key, with NO transitive closure.
 *
 * Tier 1: the first non-generic URL with a path, normalised.
 * Tier 2: (country, institution key, programme key) when no URL survives tier 1.
 *
 * The two rules that look like premature restrictions are both measured failures of the
 * obvious approach:
 *
 *  - NO UNION-FIND. Merging records transitively through any shared URL pulled 27 unrelated
 *    SAE records (Amsterdam, Madrid, Barcelona, London) into a single group, because they all
 *    cite the same course-fees page. One bad edge becomes one bad component. Here a record
 *    belongs to exactly one group, decided by its own fields and nothing else.
 *  - THE GENERIC FILTER. Without it, five different Berklee Valencia scholarships collapsed
 *    into one group over a shared scholarships-and-financial-aid page. A shared fees page is
 *    not a shared programme.
 */

export interface DedupInput {
  id: number;
  country: string;
  institution: string;
  programme: string;
  /** A citation list; frequently several URLs in one string. */
  url: string;
}

/** Anything that can be counted as a distinct programme: a raw record, or an index row. */
export type Groupable = Partial<DedupInput> & { g?: number };

export interface DupGroup<T> {
  /** "U:host/path" or "K:country|instKey|progKey". */
  key: string;
  /** Dense ordinal, assigned in order of first appearance. Mirrors `ProgrammeIndex.g`. */
  g: number;
  members: T[];
  /** The member the list shows — the one that was actually verified, where there is one. */
  primary: T;
}

/**
 * Pages that describe an institution rather than a programme. A record whose only URLs are
 * these gets no tier-1 key and falls through to the institution/programme key instead.
 */
const GENERIC_URL =
  /(fee|tuition|scholarship|beca|financial-aid|faq|entry-requirement|admission|admisiones|\/apply|application|visa|accreditation|standards|contact|\/courses\/?$|\/corsi\/?$|\/study\/?$|\/en\/?$|default\.asp|index\.)/i;

const URL_RE = /https?:\/\/[^\s;,)\]]+/gi;

/** Function words only. Dropping content words here would merge different programmes. */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'von', 'der', 'die', 'das', 'den', 'des', 'und', 'fur', 'fuer',
  'les', 'des', 'del', 'dei', 'della', 'delle', 'dos', 'das', 'los', 'las', 'van', 'voor',
  'och', 'och', 'och', 'per', 'pour', 'com', 'con', 'nel', 'sur',
]);

export function fold(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Every http(s) URL in a citation-list field, in source order. */
export function extractUrls(field: string): string[] {
  return field.match(URL_RE) ?? [];
}

/** lowercase, no scheme, no "www.", no query, no fragment, no trailing slash. */
export function normaliseUrl(raw: string): string {
  let u = raw.trim().toLowerCase();
  u = u.replace(/^https?:\/\//, '');
  u = u.replace(/^www\./, '');
  u = u.replace(/[?#].*$/, '');
  u = u.replace(/\/+$/, '');
  return u;
}

/** A URL is specific enough to identify a programme if it has a path and is not generic. */
function isSpecific(normalised: string): boolean {
  if (!normalised.includes('/')) return false; // bare host — identifies a school, not a course
  return !GENERIC_URL.test('/' + normalised.split('/').slice(1).join('/'));
}

function tokens(s: string, minLen: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of fold(s).split(/[^a-z0-9]+/)) {
    if (t.length < minLen || STOPWORDS.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.sort().slice(0, 4);
}

/** Institution names carry awarding-body tails that differ between rows for one school. */
function institutionKey(institution: string): string {
  let s = institution.replace(/\([^)]*\)/g, ' ');
  const cut = s.search(/ (—|–|-|\+|with|awarded|validated|consortium) /i);
  if (cut > 0) s = s.slice(0, cut);
  return tokens(s, 3).join('-');
}

function programmeKey(programme: string): string {
  return tokens(programme.replace(/\([^)]*\)/g, ' '), 4).join('-');
}

/** The group key for one record. Depends only on that record — never on its neighbours. */
export function groupKey(rec: Pick<DedupInput, 'country' | 'institution' | 'programme' | 'url'>): string {
  for (const raw of extractUrls(rec.url ?? '')) {
    const n = normaliseUrl(raw);
    if (isSpecific(n)) return 'U:' + n;
  }
  return `K:${fold(rec.country ?? '')}|${institutionKey(rec.institution ?? '')}|${programmeKey(rec.programme ?? '')}`;
}

/**
 * Identity used for counting. Index rows already carry the build-time ordinal `g`, so they do
 * not need `url` (which lives in detail.json); raw records are keyed from their own fields.
 */
function identity(rec: Groupable): string {
  if (typeof rec.g === 'number') return 'G:' + rec.g;
  return groupKey({
    country: rec.country ?? '',
    institution: rec.institution ?? '',
    programme: rec.programme ?? '',
    url: rec.url ?? '',
  });
}

const VERDICT_RANK: Record<string, number> = { 'WORTH IT': 0, CONDITIONAL: 1, AVOID: 2 };

function nonEmptyFieldCount(rec: unknown): number {
  let n = 0;
  for (const v of Object.values(rec as Record<string, unknown>)) {
    if (v === '' || v === null || v === undefined) continue;
    n++;
  }
  return n;
}

/**
 * Within a group the primary is the row that was actually verified, so the card the list shows
 * carries the verdict and the correction rather than a stale sibling.
 */
function pickPrimary<T extends { id: number }>(members: T[]): T {
  const scored = members.map((m) => {
    const r = m as unknown as { verdict?: string; correction?: string };
    const verdict = r.verdict ?? '';
    return {
      m,
      hasVerdict: verdict !== '' ? 0 : 1,
      rank: VERDICT_RANK[verdict] ?? 3,
      hasCorrection: (r.correction ?? '') !== '' ? 0 : 1,
      fields: -nonEmptyFieldCount(m),
      id: m.id,
    };
  });
  scored.sort(
    (a, b) =>
      a.hasVerdict - b.hasVerdict ||
      a.rank - b.rank ||
      a.hasCorrection - b.hasCorrection ||
      a.fields - b.fields ||
      a.id - b.id,
  );
  return scored[0]!.m;
}

/** All groups, in order of first appearance. */
export function buildGroups<T extends DedupInput>(records: readonly T[]): DupGroup<T>[] {
  const byKey = new Map<string, T[]>();
  for (const rec of records) {
    const k = groupKey(rec);
    const bucket = byKey.get(k);
    if (bucket) bucket.push(rec);
    else byKey.set(k, [rec]);
  }
  let g = 0;
  const groups: DupGroup<T>[] = [];
  for (const [key, members] of byKey) {
    groups.push({ key, g: g++, members, primary: pickPrimary(members) });
  }
  return groups;
}

/** record id → its group, for O(1) lookup from a card. */
export function groupIndex<T extends DedupInput>(groups: DupGroup<T>[]): Map<number, DupGroup<T>> {
  const m = new Map<number, DupGroup<T>>();
  for (const grp of groups) for (const rec of grp.members) m.set(rec.id, grp);
  return m;
}

/**
 * How many distinct programmes a set of rows represents. ICMP's three rows are one programme,
 * Detmold's six are one; every headline count in the app must use this rather than `.length`.
 */
export function distinctCount(records: readonly Groupable[]): number {
  const seen = new Set<string>();
  for (const rec of records) seen.add(identity(rec));
  return seen.size;
}

/** Only the group primaries, in input order. What the list renders when dedup is on. */
export function primariesOnly<T extends DedupInput>(records: readonly T[]): T[] {
  const keep = new Set<number>();
  for (const grp of buildGroups(records)) keep.add(grp.primary.id);
  return records.filter((r) => keep.has(r.id));
}

/**
 * Durable record identity: a 48-bit FNV-1a over institution + programme + url.
 *
 * `id` is a positional index assigned by `enumerate()` at export time: adding one record
 * renumbers every record after it, so anything persisted against `id` silently points at a
 * different programme after the next re-export. Personal state keys on this instead.
 */
export function recordKey(rec: Pick<DedupInput, 'institution' | 'programme' | 'url'>): string {
  const s = `${rec.institution} ${rec.programme} ${rec.url}`;
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x85ebca6b) >>> 0;
  }
  return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')).slice(0, 12);
}
