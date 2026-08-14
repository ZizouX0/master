/**
 * The one store. Three layers, deliberately in one file because they are coupled:
 *
 *   data      the loaded payloads, the search corpus, and the result of the filter pipeline
 *   filters   the active filter state, plus the derived leave-one-out facet counts
 *   personal  his own state — status, note, next action — in localStorage, versioned
 *
 * Personal state keys on `ProgrammeIndex.key`, which is hash(institution + programme + url).
 * It is NEVER keyed on `id`: `id` is a positional index assigned by `enumerate()` when the data
 * is exported, so adding one record renumbers every record after it and an id-keyed shortlist
 * would quietly point at different programmes after the next re-export.
 */

import { create } from 'zustand';
import {
  PERSONAL_SCHEMA_VERSION,
  PERSONAL_STORAGE_KEY,
  type DetailMap,
  type Entry,
  type FundingScheme,
  type Meta,
  type PersonalExport,
  type PersonalState,
  type ProgrammeIndex,
  type Status,
} from './types';
import { loadDetail, loadFirst, loadFunding } from './data/load';
import { loadCalendar, type Calendar } from './data/calendar';
import {
  allFacetCounts,
  emptyFilters,
  runPipeline,
  type FacetKey,
  type FilterState,
  type PipelineResult,
} from './data/filters';
import { buildCorpus, type Corpus } from './data/search';
import { distinctCount } from './data/dedup';
import { formatTimestamp } from './lib/format';

// ─────────────────────────────────────────────────────────────────────────────
// Personal state persistence
// ─────────────────────────────────────────────────────────────────────────────

function emptyPersonal(): PersonalState {
  return { schemaVersion: PERSONAL_SCHEMA_VERSION, entries: {}, lastExportedAt: null, dataGenerated: '' };
}

/**
 * One pure function per version step, applied in order. A migration never deletes data it does
 * not understand; unknown keys are carried through untouched.
 */
const MIGRATIONS: Array<(doc: Record<string, unknown>) => Record<string, unknown>> = [
  /* v0 → v1: nothing to do; v1 is the first shipped version. */
];

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // private mode / blocked storage — the app still works, it just forgets
  }
}

export function migratePersonal(raw: unknown): PersonalState {
  if (!raw || typeof raw !== 'object') return emptyPersonal();
  let doc = raw as Record<string, unknown>;
  let version = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 0;
  while (version < PERSONAL_SCHEMA_VERSION && MIGRATIONS[version]) {
    doc = MIGRATIONS[version]!(doc);
    version += 1;
  }
  const entries = (doc.entries ?? {}) as Record<string, Entry>;
  return {
    ...emptyPersonal(),
    ...doc,
    schemaVersion: PERSONAL_SCHEMA_VERSION,
    entries: Object.fromEntries(
      Object.entries(entries).filter(([k, v]) => typeof k === 'string' && v && typeof v === 'object'),
    ),
  } as PersonalState;
}

function readPersonal(): PersonalState {
  const s = storage();
  if (!s) return emptyPersonal();
  const raw = s.getItem(PERSONAL_STORAGE_KEY);
  if (!raw) return emptyPersonal();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const version = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;
    if (version < PERSONAL_SCHEMA_VERSION) {
      // Keep the pre-migration document forever. 30 KB is the difference between a bad
      // migration being an annoyance and being a loss.
      s.setItem(`${PERSONAL_STORAGE_KEY}.backup.v${version}`, raw);
    }
    return migratePersonal(parsed);
  } catch {
    return emptyPersonal();
  }
}

let writeTimer: ReturnType<typeof setTimeout> | undefined;
function writePersonal(state: PersonalState): void {
  const s = storage();
  if (!s) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      s.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Quota errors must never be silent — the tracker is the product.
      useStore.setState({ storageError: String(err) });
    }
  }, 400);
}

/** Flush the debounced write immediately. Call before export or unload. */
export function flushPersonal(): void {
  if (writeTimer) clearTimeout(writeTimer);
  const s = storage();
  if (!s) return;
  try {
    s.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(useStore.getState().personal));
  } catch (err) {
    useStore.setState({ storageError: String(err) });
  }
}

function newEntry(key: string): Entry {
  return { key, status: 'none', note: '', nextAction: '', updated: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hash routing
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteState {
  /** The path after the '#', always starting with '/'. e.g. "/p/261". */
  path: string;
  /** The query string after the path, parsed. */
  query: Record<string, string>;
}

/**
 * Hash routing, not history routing: the single-file build runs from file:// off a USB stick,
 * where the History API cannot change the path. Hash URLs work identically in both builds.
 */
export function parseHash(hash: string): RouteState {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  const query: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(search)) query[k] = v;
  return { path: path!.startsWith('/') ? path! : '/' + path!, query };
}

export function serialiseRoute(route: RouteState): string {
  const qs = new URLSearchParams(route.query).toString();
  return '#' + route.path + (qs ? '?' + qs : '');
}

// ─────────────────────────────────────────────────────────────────────────────
// The store
// ─────────────────────────────────────────────────────────────────────────────

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Store {
  // data
  status: DataStatus;
  error: string | null;
  index: ProgrammeIndex[];
  detail: DetailMap | null;
  /** 'idle' until the prose file has been requested; full-text search waits on 'ready'. */
  detailStatus: DataStatus;
  /** Empty until something asks. `funding.json` is 74.6 KB and no screen but the record page
   *  and the money filter reads it; `meta.funding` carries the count everywhere else. */
  funding: FundingScheme[];
  fundingStatus: DataStatus;
  /** The hand-confirmed dates. The only origin of a displayed date in the product. */
  calendar: Calendar | null;
  calendarStatus: DataStatus;
  /** Why the dates are missing. Shown on the week screen rather than swallowed. */
  calendarError: string | null;
  meta: Meta | null;
  corpus: Corpus | null;
  /** Distinct programmes in the whole corpus — the denominator for every headline. */
  totalDistinct: number;
  /**
   * The morning this session is being read on, taken once, here, and passed down as an argument.
   * No component calls `new Date()`: every time answer in the app is therefore reproducible, and
   * a test can sit at 3 January 2027 and get what he would have got that morning.
   */
  now: Date;

  // filters
  filters: FilterState;
  results: PipelineResult<ProgrammeIndex>;
  facets: Record<FacetKey, Record<string, number>>;

  // personal
  personal: PersonalState;
  storageError: string | null;

  // routing
  route: RouteState;

  // actions
  load: () => Promise<void>;
  /** Fetch the 120 schemes if they are not here yet. Safe to call on every render. */
  ensureFunding: () => void;
  setFilters: (patch: Partial<FilterState>) => void;
  setFacet: (key: FacetKey, values: string[]) => void;
  toggleFacet: (key: FacetKey, value: string) => void;
  resetFilters: () => void;

  entryFor: (key: string) => Entry | undefined;
  setStatus: (key: string, status: Status) => void;
  setNote: (key: string, note: string) => void;
  setNextAction: (key: string, nextAction: string) => void;
  clearEntry: (key: string) => void;

  exportJson: () => string;
  exportMarkdown: () => string;
  importJson: (text: string, mode?: 'merge' | 'replace') => { imported: number; mode: string };

  navigate: (to: string, replace?: boolean) => void;
  syncRoute: () => void;
}

const EMPTY_RESULTS: PipelineResult<ProgrammeIndex> = { rows: [], distinct: 0, scores: null };
const EMPTY_FACETS = {} as Record<FacetKey, Record<string, number>>;

/** Re-run the pipeline and the facet counts. Both are ~1 ms over 398 records. */
function recompute(
  index: ProgrammeIndex[],
  filters: FilterState,
  corpus: Corpus | null,
  meta: Meta | null,
): { results: PipelineResult<ProgrammeIndex>; facets: Record<FacetKey, Record<string, number>> } {
  const results = runPipeline(index, filters, { corpus });
  const vocab: Partial<Record<FacetKey, readonly string[]>> = {};
  if (meta) {
    for (const key of Object.keys(meta.facets) as FacetKey[]) {
      vocab[key] = Object.keys(meta.facets[key]!);
    }
  }
  const facets = allFacetCounts(index, filters, vocab, { corpus });
  return { results, facets };
}

export const useStore = create<Store>((set, get) => ({
  status: 'idle',
  error: null,
  index: [],
  detail: null,
  detailStatus: 'idle',
  funding: [],
  fundingStatus: 'idle',
  calendar: null,
  calendarStatus: 'idle',
  calendarError: null,
  meta: null,
  corpus: null,
  totalDistinct: 0,
  now: new Date(),

  filters: emptyFilters(),
  results: EMPTY_RESULTS,
  facets: EMPTY_FACETS,

  personal: readPersonal(),
  storageError: null,

  route: parseHash(typeof location === 'undefined' ? '#/' : location.hash),

  async load() {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading', error: null, calendarStatus: 'loading' });

    // The dates and the records are fetched together — the home screen is the calendar, so
    // waiting for one and then the other would show an empty week for a whole round trip.
    // A calendar failure is not a data failure: the corpus still works without it, and the
    // week screen says out loud that it cannot see the dates.
    const cal = loadCalendar().then(
      (calendar) => set({ calendar, calendarStatus: 'ready' }),
      (err) => set({ calendarStatus: 'error', calendarError: String(err) }),
    );

    try {
      const first = await loadFirst();
      const corpus = buildCorpus(first.index, first.detail);
      const { results, facets } = recompute(first.index, get().filters, corpus, first.meta);
      set({
        status: 'ready',
        index: first.index,
        meta: first.meta,
        detail: first.detail,
        detailStatus: first.detail ? 'ready' : 'idle',
        // The single-file build has the schemes inlined already; the hosted build does not,
        // and does not fetch them until something needs one.
        funding: first.funding ?? [],
        fundingStatus: first.funding ? 'ready' : 'idle',
        corpus,
        totalDistinct: distinctCount(first.index),
        results,
        facets,
        personal: { ...get().personal, dataGenerated: first.meta.generated },
      });
    } catch (err) {
      set({ status: 'error', error: String(err) });
      return;
    }

    // Second stage: the prose. Nothing on a card waits for it.
    if (get().detailStatus === 'idle') {
      set({ detailStatus: 'loading' });
      try {
        const detail = await loadDetail();
        const corpus = buildCorpus(get().index, detail);
        const { results, facets } = recompute(get().index, get().filters, corpus, get().meta);
        set({ detail, detailStatus: 'ready', corpus, results, facets });
      } catch (err) {
        set({ detailStatus: 'error', error: String(err) });
      }
    }

    await cal;
  },

  ensureFunding() {
    if (get().fundingStatus !== 'idle') return;
    set({ fundingStatus: 'loading' });
    void loadFunding().then(
      (funding) => set({ funding, fundingStatus: 'ready' }),
      (err) => set({ fundingStatus: 'error', error: String(err) }),
    );
  },

  setFilters(patch) {
    const filters = { ...get().filters, ...patch };
    set({ filters, ...recompute(get().index, filters, get().corpus, get().meta) });
  },

  setFacet(key, values) {
    const filters = { ...get().filters, facets: { ...get().filters.facets, [key]: values } };
    set({ filters, ...recompute(get().index, filters, get().corpus, get().meta) });
  },

  toggleFacet(key, value) {
    const current = get().filters.facets[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    get().setFacet(key, next);
  },

  resetFilters() {
    const filters = emptyFilters();
    set({ filters, ...recompute(get().index, filters, get().corpus, get().meta) });
  },

  entryFor(key) {
    return get().personal.entries[key];
  },

  setStatus(key, status) {
    patchEntry(set, get, key, { status });
  },
  setNote(key, note) {
    patchEntry(set, get, key, { note });
  },
  setNextAction(key, nextAction) {
    patchEntry(set, get, key, { nextAction });
  },

  clearEntry(key) {
    const entries = { ...get().personal.entries };
    delete entries[key];
    const personal = { ...get().personal, entries };
    set({ personal });
    writePersonal(personal);
  },

  exportJson() {
    const doc: PersonalExport = {
      format: 'door3-personal',
      version: PERSONAL_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      state: get().personal,
    };
    const personal = { ...get().personal, lastExportedAt: doc.exportedAt };
    set({ personal });
    writePersonal(personal);
    return JSON.stringify(doc, null, 2);
  },

  exportMarkdown() {
    const { personal, index } = get();
    const byKey = new Map(index.map((r) => [r.key, r]));
    const entries = Object.values(personal.entries).filter((e) => e.status !== 'none' || e.note || e.nextAction);
    const groups = new Map<Status, Entry[]>();
    for (const e of entries) {
      const g = groups.get(e.status);
      if (g) g.push(e);
      else groups.set(e.status, [e]);
    }
    const out: string[] = ['# My list', '', `Exported ${formatTimestamp(new Date().toISOString())}`, ''];
    for (const [status, list] of groups) {
      out.push(`## ${status} (${list.length})`, '');
      for (const e of list.sort((a, b) => a.key.localeCompare(b.key))) {
        const row = byKey.get(e.key);
        // The label falls back to the key, so an entry whose record vanished from a re-export
        // is still exported rather than silently dropped.
        out.push(row ? `- **${row.institution}** — ${row.programme} (${row.country})` : `- *(record ${e.key} not in the current data)*`);
        if (e.nextAction) out.push(`  - Next: ${e.nextAction}`);
        if (e.note) out.push(...e.note.split('\n').map((l) => `  - ${l}`));
        out.push(`  - Updated ${formatTimestamp(e.updated)}`);
      }
      out.push('');
    }
    if (entries.length === 0) out.push('_Nothing tracked yet._', '');
    const personalOut = { ...personal, lastExportedAt: new Date().toISOString() };
    set({ personal: personalOut });
    writePersonal(personalOut);
    return out.join('\n');
  },

  importJson(text, mode = 'merge') {
    const parsed = JSON.parse(text) as Partial<PersonalExport> & Partial<PersonalState>;
    const incoming = migratePersonal((parsed as PersonalExport).state ?? parsed);
    const current = get().personal;
    const entries =
      mode === 'replace'
        ? incoming.entries
        : mergeEntries(current.entries, incoming.entries);
    const personal: PersonalState = { ...current, entries };
    set({ personal });
    writePersonal(personal);
    return { imported: Object.keys(incoming.entries).length, mode };
  },

  navigate(to, replace = false) {
    const hash = to.startsWith('#') ? to : '#' + (to.startsWith('/') ? to : '/' + to);
    if (typeof location === 'undefined') {
      set({ route: parseHash(hash) });
      return;
    }
    if (replace) history.replaceState(null, '', location.pathname + location.search + hash);
    else location.hash = hash;
    set({ route: parseHash(hash) });
  },

  syncRoute() {
    set({ route: parseHash(typeof location === 'undefined' ? '#/' : location.hash) });
  },
}));

type Setter = (partial: Partial<Store>) => void;

function patchEntry(set: Setter, get: () => Store, key: string, patch: Partial<Entry>): void {
  const existing = get().personal.entries[key] ?? newEntry(key);
  const entry: Entry = { ...existing, ...patch, key, updated: new Date().toISOString() };
  const personal: PersonalState = {
    ...get().personal,
    entries: { ...get().personal.entries, [key]: entry },
  };
  set({ personal });
  writePersonal(personal);
}

/** On conflict keep the later edit, and keep both notes rather than losing one. */
function mergeEntries(a: Record<string, Entry>, b: Record<string, Entry>): Record<string, Entry> {
  const out: Record<string, Entry> = { ...a };
  for (const [key, incoming] of Object.entries(b)) {
    const mine = out[key];
    if (!mine) {
      out[key] = incoming;
      continue;
    }
    const newer = incoming.updated > mine.updated ? incoming : mine;
    const older = newer === incoming ? mine : incoming;
    out[key] = {
      ...newer,
      note: mine.note === incoming.note ? newer.note : [newer.note, older.note].filter(Boolean).join('\n\n---\n\n'),
    };
  }
  return out;
}
