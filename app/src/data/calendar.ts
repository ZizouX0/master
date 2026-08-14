/**
 * The time layer.
 *
 * The app's date parser was run over all 518 records and returned 12 dated results, not one of
 * which is a date this campaign runs on. The machinery is correct and it is aimed at the wrong
 * field: `deadline` holds 243 PRIOR CYCLE strings and none of the dozen dates that matter.
 *
 * So the dates come from `public/data/calendar.json` — hand-curated, one entry per human-confirmed
 * date or published annual rule, every one of them carrying the sentence it rests on.
 * `scripts/build-calendar.mjs` checks each quote verbatim against the record or the report it
 * cites, and refuses any entry sourced from a field containing the PRIOR CYCLE marker.
 *
 * Three rules govern everything below:
 *
 *  R1. A confirmed date and a recurring pattern are different things and never share a channel.
 *      `confidence` is on every entry; nothing here silently promotes one to the other.
 *  R2. A PRIOR CYCLE string never produces a date, a sort or a count. `assertNoPriorCycle` is
 *      called on load and `corpusSuggestions` is the only thing allowed to look at `deadline` —
 *      and what it returns is a suggestion for a human, never a displayed date.
 *  R3. `now` is always an argument. There is no `Date.now()` in this file, so a test can sit at
 *      3 January 2027 and get the answer the applicant would have got that morning.
 */

import { parseDeadline } from '../lib/format';

// ─────────────────────────────────────────────────────────────────────────────
// The shape of calendar.json
// ─────────────────────────────────────────────────────────────────────────────

export type EntryKind = 'application' | 'scholarship' | 'admin';
export type Confidence = 'confirmed' | 'recurring-pattern';
/** `opens` and `closes` carry one date; `window` carries both. */
export type Role = 'opens' | 'closes' | 'window';
export type EntryStatus = 'not-open' | 'open' | 'closing-soon' | 'closed';

export interface DateWindow {
  from: string;
  to: string;
}

export interface CalendarEntry {
  id: string;
  kind: EntryKind;
  role: Role;
  /** Present when `role` is `opens` or `closes`. YYYY-MM-DD. */
  date?: string;
  /** Present when `role` is `window`. */
  window?: DateWindow;
  label: string;
  /** `ProgrammeIndex.key` — the durable hash, never the positional id. */
  programmeKey?: string;
  /** Positional and unstable; present only so the validator can cross-check the key. */
  programmeId?: number;
  fundingId?: number;
  /** "programmes.json#15 deadline", "funding.json#59 opens", or a repo-relative file path. */
  source: string;
  /** Verbatim from `source`. Checked by scripts/build-calendar.mjs. */
  quote: string;
  confidence: Confidence;
  note?: string;
}

/**
 * A thing he must make or obtain. It has no date of its own; it takes time, and it stands in
 * front of things that do have dates. That is the whole reason it is in the time layer.
 */
export interface Prerequisite {
  id: string;
  label: string;
  /** Entry ids this blocks. Never empty. */
  blocks: string[];
  leadTimeDays: number;
  /** Where `leadTimeDays` came from. Every one of them is this app's estimate, and says so. */
  leadTimeNote: string;
  source: string;
  quote: string;
  confidence: Confidence;
}

export interface Calendar {
  generated: string;
  targetIntake: string;
  entries: CalendarEntry[];
  prerequisites: Prerequisite[];
}

// ─────────────────────────────────────────────────────────────────────────────
// R2 — the marker
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Matched case-sensitively, exactly as `parseDeadline` matches it. Lowercase prose is not the
 * marker: FHNW Basel's deadline field says "NOT a prior cycle" and is the most important
 * confirmed window in the campaign.
 */
const PRIOR_CYCLE = /PRIOR[- ]?CYCLE/;

export function containsPriorCycleMarker(text: string | null | undefined): boolean {
  return PRIOR_CYCLE.test(text ?? '');
}

/** Throws rather than returns, because a laundered date is indistinguishable once it is in. */
export function assertNoPriorCycle(entry: Pick<CalendarEntry, 'id' | 'quote' | 'source'>): void {
  if (containsPriorCycleMarker(entry.quote) || containsPriorCycleMarker(entry.source)) {
    throw new Error(
      `calendar entry "${entry.id}" is derived from a PRIOR CYCLE string. ` +
        `A prior-cycle string is evidence about when a window is likely to fall; it is never a date.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing and loading
// ─────────────────────────────────────────────────────────────────────────────

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function requireIso(value: unknown, where: string): string {
  if (typeof value !== 'string' || !ISO.test(value)) throw new Error(`${where}: "${String(value)}" is not YYYY-MM-DD`);
  return value;
}

const KINDS: readonly string[] = ['application', 'scholarship', 'admin'];
const CONFIDENCES: readonly string[] = ['confirmed', 'recurring-pattern'];

/**
 * Runtime validation of the hand-written file. The build script does this far more thoroughly
 * against the corpus; this is the part that must also hold in the browser, where the corpus is
 * not present — shape, and R2.
 */
export function parseCalendar(raw: unknown): Calendar {
  const src = raw as Partial<Calendar> | null;
  if (!src || !Array.isArray(src.entries)) throw new Error('calendar.json has no entries array');

  const entries: CalendarEntry[] = src.entries.map((e, i) => {
    const where = `calendar entry ${e?.id ?? i}`;
    if (!e || typeof e.id !== 'string' || e.id === '') throw new Error(`${where}: no id`);
    if (!KINDS.includes(e.kind)) throw new Error(`${where}: bad kind "${e.kind}"`);
    if (!CONFIDENCES.includes(e.confidence)) throw new Error(`${where}: bad confidence "${e.confidence}"`);
    if (typeof e.quote !== 'string' || e.quote.trim() === '') throw new Error(`${where}: no quote`);
    assertNoPriorCycle(e);

    const hasDate = e.date !== undefined;
    const hasWindow = e.window !== undefined;
    if (hasDate === hasWindow) throw new Error(`${where}: needs exactly one of date / window`);
    if (hasWindow) {
      const from = requireIso(e.window?.from, `${where} window.from`);
      const to = requireIso(e.window?.to, `${where} window.to`);
      if (from > to) throw new Error(`${where}: window runs backwards`);
      return { ...e, role: 'window', window: { from, to } } as CalendarEntry;
    }
    const date = requireIso(e.date, `${where} date`);
    const role: Role = e.role === 'opens' ? 'opens' : 'closes';
    return { ...e, role, date } as CalendarEntry;
  });

  const ids = new Set(entries.map((e) => e.id));
  if (ids.size !== entries.length) throw new Error('calendar.json has duplicate entry ids');

  const prerequisites: Prerequisite[] = (src.prerequisites ?? []).map((p, i) => {
    const where = `calendar prerequisite ${p?.id ?? i}`;
    if (!p || typeof p.id !== 'string') throw new Error(`${where}: no id`);
    if (!Array.isArray(p.blocks) || p.blocks.length === 0) throw new Error(`${where}: blocks nothing`);
    for (const b of p.blocks) if (!ids.has(b)) throw new Error(`${where}: blocks unknown entry "${b}"`);
    if (typeof p.leadTimeDays !== 'number' || p.leadTimeDays <= 0) throw new Error(`${where}: bad leadTimeDays`);
    assertNoPriorCycle(p as unknown as CalendarEntry);
    return p as Prerequisite;
  });

  return {
    generated: String(src.generated ?? ''),
    targetIntake: String(src.targetIntake ?? ''),
    entries,
    prerequisites,
  };
}

/** BASE_URL is '/master/' for the hosted build and './' for the single-file build. */
function dataUrl(name: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base}${base.endsWith('/') ? '' : '/'}data/${name}`;
}

/**
 * The single-file build inlines its payloads into `window.__DOOR3_DATA__` (see vite.config.ts);
 * read from there when it is present rather than fetching a sibling file over file://.
 */
export async function loadCalendar(signal?: AbortSignal): Promise<Calendar> {
  if (typeof window !== 'undefined') {
    const inline = (window.__DOOR3_DATA__ as unknown as { calendar?: unknown } | undefined)?.calendar;
    if (inline) return parseCalendar(inline);
  }
  const res = await fetch(dataUrl('calendar.json'), { signal });
  if (!res.ok) throw new Error(`calendar.json: HTTP ${res.status}`);
  return parseCalendar(await res.json());
}

// ─────────────────────────────────────────────────────────────────────────────
// Dates. Everything is a UTC calendar day; nothing here reads the clock.
// ─────────────────────────────────────────────────────────────────────────────

/** The UTC day `now` falls on, as YYYY-MM-DD. The only conversion from Date in this file. */
export function isoDay(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
}

const DAY = 86_400_000;

/** Whole days from `from` to `to`. Negative when `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / DAY);
}

/** `iso` shifted by `days`, clamped to nothing — used for latest-safe-start arithmetic. */
export function shiftDays(iso: string, days: number): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10);
}

/** The day it opens, or null when the source never published one. */
export function opensOn(entry: CalendarEntry): string | null {
  if (entry.role === 'window') return entry.window!.from;
  return entry.role === 'opens' ? entry.date! : null;
}

/** The day it closes, or null when only an opening is known. */
export function closesOn(entry: CalendarEntry): string | null {
  if (entry.role === 'window') return entry.window!.to;
  return entry.role === 'closes' ? entry.date! : null;
}

/** The instant work must be finished by: the close where there is one, otherwise the opening. */
export function dueOn(entry: CalendarEntry): string {
  return closesOn(entry) ?? opensOn(entry)!;
}

export interface Horizons {
  /** How near a close has to be before it reads as urgent. Three weeks. */
  closingSoonDays: number;
  /** How near an opening has to be to belong on the week screen. */
  openingSoonDays: number;
}

export const DEFAULT_HORIZONS: Horizons = { closingSoonDays: 21, openingSoonDays: 7 };

/**
 * Four states, and the fourth is the one that matters: an entry that only ever published an
 * opening (KTH, Masaryk, mdw) can be `open` forever and can never be `closed`, because nobody
 * said when it shuts. Inventing a close would be the same failure as inventing a deadline.
 */
export function statusOf(entry: CalendarEntry, now: Date, horizons: Horizons = DEFAULT_HORIZONS): EntryStatus {
  const today = isoDay(now);
  const opens = opensOn(entry);
  const closes = closesOn(entry);
  if (opens !== null && today < opens) return 'not-open';
  if (closes === null) return 'open';
  const left = daysBetween(today, closes);
  if (left < 0) return 'closed';
  return left <= horizons.closingSoonDays ? 'closing-soon' : 'open';
}

export interface Due {
  entry: CalendarEntry;
  status: EntryStatus;
  /** Days until it opens. Null once it has opened, or when no opening was published. */
  daysUntilOpen: number | null;
  /** Days until it closes. Null when nobody published a close. */
  daysUntilClose: number | null;
  /** Days to the next thing that can be done about it. The sort key. */
  urgencyDays: number;
  /** What is still owed before this one can be filed. */
  blockedBy: Prerequisite[];
}

const BAND_RANK: Record<EntryStatus, number> = { 'closing-soon': 0, open: 1, 'not-open': 2, closed: 3 };

function due(entry: CalendarEntry, cal: Calendar, now: Date, horizons: Horizons): Due {
  const today = isoDay(now);
  const opens = opensOn(entry);
  const closes = closesOn(entry);
  const status = statusOf(entry, now, horizons);
  const daysUntilOpen = opens !== null && today < opens ? daysBetween(today, opens) : null;
  const daysUntilClose = closes !== null ? daysBetween(today, closes) : null;
  const urgencyDays =
    status === 'not-open' ? daysUntilOpen! : daysUntilClose !== null ? daysUntilClose : Number.MAX_SAFE_INTEGER;
  return {
    entry,
    status,
    daysUntilOpen,
    daysUntilClose,
    urgencyDays,
    blockedBy: cal.prerequisites.filter((p) => p.blocks.includes(entry.id)),
  };
}

function byUrgency(a: Due, b: Due): number {
  return (
    a.urgencyDays - b.urgencyDays ||
    BAND_RANK[a.status] - BAND_RANK[b.status] ||
    a.entry.id.localeCompare(b.entry.id)
  );
}

/**
 * Everything open, closing, or opening inside the horizon, in the order regret arrives.
 *
 * Closed entries are dropped rather than greyed: this list answers "what can I still do", and a
 * missed gate belongs on the postmortem, not the worklist.
 */
export function upcoming(
  cal: Calendar,
  now: Date,
  horizonDays: number,
  horizons: Horizons = DEFAULT_HORIZONS,
): Due[] {
  const today = isoDay(now);
  const out: Due[] = [];
  for (const entry of cal.entries) {
    const d = due(entry, cal, now, horizons);
    if (d.status === 'closed') continue;
    // The horizon bounds what has not started yet. Something already open stays on the list
    // however far off its close is — an open window is a thing he can act on today.
    if (d.status === 'not-open' && daysBetween(today, opensOn(entry)!) > horizonDays) continue;
    out.push(d);
  }
  return out.sort(byUrgency);
}

// ─────────────────────────────────────────────────────────────────────────────
// The making — prerequisites, and when each has to start
// ─────────────────────────────────────────────────────────────────────────────

export interface Making {
  prerequisite: Prerequisite;
  /** The entries it stands in front of, soonest first. Closed ones are dropped. */
  blocks: CalendarEntry[];
  /** The nearest live thing it blocks, or null when they have all closed. */
  nextGate: CalendarEntry | null;
  /** `nextGate`'s due date minus the lead time. Null when nothing live is blocked. */
  latestSafeStart: string | null;
  daysUntilLatestSafeStart: number | null;
  /** True once the latest safe start is today or in the past. This is the alarm. */
  overdue: boolean;
}

/**
 * Works backwards from the gates. This is the only arithmetic in the file that produces a date
 * the sources do not contain, which is why every `leadTimeDays` carries a `leadTimeNote` saying
 * it is this app's estimate.
 */
export function making(cal: Calendar, now: Date, horizons: Horizons = DEFAULT_HORIZONS): Making[] {
  const today = isoDay(now);
  const byId = new Map(cal.entries.map((e) => [e.id, e]));
  return cal.prerequisites
    .map((prerequisite) => {
      const blocks = prerequisite.blocks
        .map((id) => byId.get(id))
        .filter((e): e is CalendarEntry => e !== undefined && statusOf(e, now, horizons) !== 'closed')
        .sort((a, b) => dueOn(a).localeCompare(dueOn(b)));
      const nextGate = blocks[0] ?? null;
      const latestSafeStart = nextGate ? shiftDays(dueOn(nextGate), -prerequisite.leadTimeDays) : null;
      return {
        prerequisite,
        blocks,
        nextGate,
        latestSafeStart,
        daysUntilLatestSafeStart: latestSafeStart ? daysBetween(today, latestSafeStart) : null,
        overdue: latestSafeStart !== null && latestSafeStart <= today,
      };
    })
    .sort((a, b) => {
      if (a.latestSafeStart === null) return b.latestSafeStart === null ? 0 : 1;
      if (b.latestSafeStart === null) return -1;
      return a.latestSafeStart.localeCompare(b.latestSafeStart);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// The home screen's answer
// ─────────────────────────────────────────────────────────────────────────────

export interface Week {
  /** The day this was computed for. Everything below is relative to it. */
  today: string;
  /** Whole weeks to the target intake. Negative once it has passed. */
  weeksToIntake: number;
  /** Closing inside `closingSoonDays`. First, because it is the order of regret. */
  closing: Due[];
  /** Opening inside `openingSoonDays`. */
  opening: Due[];
  /** Open now and not closing soon. Shown, because an open window is a thing he can act on. */
  openNow: Due[];
  /** Everything he must make, soonest safe start first. Always present, even when empty. */
  making: Making[];
  /** The subset of `making` whose latest safe start has already arrived. The alarm. */
  overdue: Making[];
  counts: {
    entries: number;
    confirmed: number;
    recurringPattern: number;
    /** Entries already closed on `today`. Kept as a number, never as a row. */
    closed: number;
  };
}

/** The intake everything is aimed at. Used only for the countdown. */
export const TARGET_INTAKE = '2027-09-01';

/**
 * What he owes, to whom, by when — computed for one specific morning.
 *
 * `making` is here rather than on a separate screen because an artefact with no date is the thing
 * that silently closes a gate that does have one: İTÜ wants three mixes each containing an
 * acoustically miked source, and that is four months of work standing in front of a June date.
 * A week screen that only showed dated things would show him nothing to do until December.
 */
export function thisWeek(cal: Calendar, now: Date, horizons: Horizons = DEFAULT_HORIZONS): Week {
  const today = isoDay(now);
  const all = cal.entries.map((e) => due(e, cal, now, horizons));
  const live = all.filter((d) => d.status !== 'closed');

  return {
    today,
    weeksToIntake: Math.floor(daysBetween(today, TARGET_INTAKE) / 7),
    closing: live.filter((d) => d.status === 'closing-soon').sort(byUrgency),
    opening: live
      .filter((d) => d.status === 'not-open' && d.daysUntilOpen !== null && d.daysUntilOpen <= horizons.openingSoonDays)
      .sort(byUrgency),
    openNow: live.filter((d) => d.status === 'open').sort(byUrgency),
    making: making(cal, now, horizons),
    overdue: making(cal, now, horizons).filter((m) => m.overdue),
    counts: {
      entries: cal.entries.length,
      confirmed: cal.entries.filter((e) => e.confidence === 'confirmed').length,
      recurringPattern: cal.entries.filter((e) => e.confidence === 'recurring-pattern').length,
      closed: all.length - live.length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────────────────────────────────────

/** Every entry attached to a programme, soonest first. The record page's date section. */
export function entriesForProgramme(cal: Calendar, programmeKey: string): CalendarEntry[] {
  return cal.entries
    .filter((e) => e.programmeKey === programmeKey)
    .sort((a, b) => dueOn(a).localeCompare(dueOn(b)));
}

export function entriesForScheme(cal: Calendar, fundingId: number): CalendarEntry[] {
  return cal.entries.filter((e) => e.fundingId === fundingId).sort((a, b) => dueOn(a).localeCompare(dueOn(b)));
}

export function entryById(cal: Calendar, id: string): CalendarEntry | undefined {
  return cal.entries.find((e) => e.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// The corpus, kept at arm's length
// ─────────────────────────────────────────────────────────────────────────────

export interface CorpusSuggestion {
  /** Whatever identifies the row to the caller — a record key or a funding id. */
  ref: string;
  iso: string;
  raw: string;
}

/**
 * The one function allowed to read `deadline`, and what it returns is explicitly NOT a date the
 * product may show. `parseDeadline` refuses prior-cycle strings, and this refuses them a second
 * time, out loud: a suggestion may prompt a human to add a calendar entry; it may never become
 * one on its own. Twelve dates is a hand-written file — that asymmetry is the whole design.
 */
export function corpusSuggestions(rows: readonly { ref: string; deadline: string }[]): CorpusSuggestion[] {
  const out: CorpusSuggestion[] = [];
  for (const row of rows) {
    const parsed = parseDeadline(row.deadline);
    if (parsed.kind !== 'dated' || !parsed.iso) continue;
    if (containsPriorCycleMarker(row.deadline)) {
      throw new Error(`parseDeadline returned a date for a PRIOR CYCLE string (${row.ref}). R2 is broken.`);
    }
    out.push({ ref: row.ref, iso: parsed.iso, raw: row.deadline });
  }
  return out.sort((a, b) => a.iso.localeCompare(b.iso) || a.ref.localeCompare(b.ref));
}

/** How many rows the time layer refuses to date. The footer number, computed rather than typed. */
export function priorCycleCount(rows: readonly { deadline: string }[]): number {
  return rows.filter((r) => parseDeadline(r.deadline).kind === 'prior-cycle').length;
}
