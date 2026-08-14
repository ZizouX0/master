/**
 * Rendering rules shared by every view.
 *
 * Two jobs, both of them correctness rules rather than cosmetics:
 *
 *  1. `renderField` separates three states that look alike in a spreadsheet and must never look
 *     alike here — a value, an explicit `UNVERIFIED` ("nobody published this"), and empty
 *     ("nobody collected this"). Each returns a distinct `kind`; the view gives each `kind` its
 *     own visual treatment. Rendering an empty field as a dash and an UNVERIFIED field as a dash
 *     is the failure this exists to prevent.
 *  2. `deadlineDisplay` refuses to print a bare date it cannot stand behind.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Field rendering
// ─────────────────────────────────────────────────────────────────────────────

export type FieldKind =
  /** A real value, published by somebody. */
  | 'value'
  /** The source explicitly says the figure was never published. */
  | 'unverified'
  /** Nothing was collected for this field. Different from `unverified`, and says less. */
  | 'empty';

export interface FieldRender {
  kind: FieldKind;
  /** What to show. For `unverified` and `empty` this is a caption, not data. */
  text: string;
  /** The untouched source string. Always available for a "show the prose" affordance. */
  raw: string;
  /**
   * True when a real value nonetheless contains an inline `UNVERIFIED` caveat — 139 deadline
   * strings do. The value is shown; the caveat must be shown with it.
   */
  caveated: boolean;
}

export const UNVERIFIED_TEXT = 'nobody published this';
export const EMPTY_TEXT = 'not collected';

const UNVERIFIED_RE = /\bUNVERIFIED\b/;
/** Typographic placeholders the export uses for "nothing here". */
const PLACEHOLDER_RE = /^[\s—–-]*$/;

export function renderField(raw: string | null | undefined): FieldRender {
  const s = (raw ?? '').trim();
  if (s === '' || PLACEHOLDER_RE.test(s)) {
    return { kind: 'empty', text: EMPTY_TEXT, raw: raw ?? '', caveated: false };
  }
  // The whole cell is the word UNVERIFIED (optionally with light punctuation around it).
  if (/^\W*UNVERIFIED\W*$/.test(s)) {
    return { kind: 'unverified', text: UNVERIFIED_TEXT, raw: raw ?? '', caveated: true };
  }
  return { kind: 'value', text: s, raw: raw ?? '', caveated: UNVERIFIED_RE.test(s) };
}

/** Convenience for `${label}: ${…}` rows where only presence matters. */
export function hasValue(raw: string | null | undefined): boolean {
  return renderField(raw).kind === 'value';
}

// ─────────────────────────────────────────────────────────────────────────────
// Deadlines
// ─────────────────────────────────────────────────────────────────────────────

export type DeadlineKind =
  | 'dated' // an explicit date, year >= 2027 — the only kind that carries `iso`
  | 'recurring' // "15 February annually" — month and day, deliberately no year
  | 'prior-cycle' // the string describes a previous intake
  | 'rolling'
  | 'unverified'
  | 'no-intake'
  | 'not-applicable'
  | 'none';

export interface ParsedDeadline {
  kind: DeadlineKind;
  /** YYYY-MM-DD. Present only when kind === 'dated'. Never inferred. */
  iso?: string;
  /** 1–12. Present only when kind === 'recurring'. */
  month?: number;
  /** 1–31. Present only when kind === 'recurring'. */
  day?: number;
  /** The unmodified source string. The badge is a summary of this; this is the truth. */
  raw: string;
}

export interface DeadlineDisplay extends ParsedDeadline {
  /** The badge caption. Contains a date only when `kind === 'dated'`. */
  label: string;
  /** Grouping for styling: red = closed/urgent, amber = needs checking, grey = nothing to act on. */
  tone: 'red' | 'amber' | 'blue' | 'grey' | 'none';
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const MONTH_NAMES = Object.keys(MONTHS).join('|');

const D_MONTH_YEAR = new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_NAMES})\\s+(\\d{4})\\b`, 'i');
const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const D_MONTH = new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_NAMES})\\b`, 'i');

/** The intake this whole dataset is aimed at. A date before it is by definition a prior cycle. */
export const TARGET_YEAR = 2027;

const MONTH_LABEL = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * An ordered cascade: the first rule that matches wins, and the disqualifying markers are
 * checked before any date is extracted.
 *
 * Rule 4 is the load-bearing one. 186 records say `PRIOR CYCLE`, and most of them also contain
 * a perfectly parseable date — "15 January 2026 — PRIOR CYCLE". That date is real and it is
 * wrong for him; extracting it would manufacture a 2027 deadline out of a 2026 fact. A
 * prior-cycle record therefore carries no date at all, ever.
 */
export function parseDeadline(raw: string | null | undefined): ParsedDeadline {
  const s = (raw ?? '').trim();
  const out = (kind: DeadlineKind, extra: Partial<ParsedDeadline> = {}): ParsedDeadline => ({
    kind,
    raw: raw ?? '',
    ...extra,
  });

  if (/NO INTAKE/i.test(s)) return out('no-intake'); // 1
  if (/^\s*Not applicable/i.test(s)) return out('not-applicable'); // 2
  if (s === '') return out('none'); // 3
  if (/PRIOR CYCLE/.test(s)) return out('prior-cycle'); // 4 — no date, whatever else is in there
  if (UNVERIFIED_RE.test(s)) return out('unverified'); // 5
  if (/\brolling\b/i.test(s) || /no (published )?deadline/i.test(s)) return out('rolling'); // 6

  const iso = ISO_DATE.exec(s);
  if (iso && Number(iso[1]) >= TARGET_YEAR) {
    return out('dated', { iso: `${iso[1]}-${iso[2]}-${iso[3]}` }); // 7
  }
  const dmy = D_MONTH_YEAR.exec(s);
  if (dmy) {
    const year = Number(dmy[3]);
    const month = MONTHS[dmy[2]!.toLowerCase()]!;
    const day = Number(dmy[1]);
    if (year >= TARGET_YEAR) {
      return out('dated', {
        iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      }); // 7
    }
    return out('prior-cycle'); // 8 — a 2026 date in a 2026-vintage corpus is a previous intake
  }
  if (iso) return out('prior-cycle'); // ISO date before the target year

  const dm = D_MONTH.exec(s);
  if (dm) {
    if (/annual/i.test(s)) {
      return out('recurring', { month: MONTHS[dm[2]!.toLowerCase()]!, day: Number(dm[1]) }); // 9
    }
    return out('unverified'); // 10 — a day and a month with no year is not a date
  }
  return out('unverified'); // 11
}

/**
 * The badge. `label` is safe to print anywhere: it carries a date only when `kind === 'dated'`,
 * so a `PRIOR CYCLE` string can never surface as a bare date.
 */
export function deadlineDisplay(raw: string | null | undefined, today: Date = new Date()): DeadlineDisplay {
  const p = parseDeadline(raw);
  switch (p.kind) {
    case 'dated': {
      const when = new Date(p.iso + 'T00:00:00Z');
      const days = Math.round((when.getTime() - startOfDay(today)) / 86_400_000);
      if (days < 0) return { ...p, label: `${formatIso(p.iso!)} — date has passed, confirm`, tone: 'grey' };
      if (days <= 30) return { ...p, label: `closes in ${days} day${days === 1 ? '' : 's'}`, tone: 'red' };
      if (days <= 120) return { ...p, label: `closes ${formatIso(p.iso!)}`, tone: 'amber' };
      return { ...p, label: formatIso(p.iso!), tone: 'grey' };
    }
    case 'recurring':
      return { ...p, label: `around ${p.day} ${MONTH_LABEL[p.month!]} each year`, tone: 'blue' };
    case 'prior-cycle':
      return { ...p, label: 'prior cycle — confirm the 2027 date', tone: 'amber' };
    case 'rolling':
      return { ...p, label: 'rolling / no published deadline', tone: 'grey' };
    case 'no-intake':
      return { ...p, label: 'no 2027 intake', tone: 'red' };
    case 'not-applicable':
      return { ...p, label: 'not applicable', tone: 'none' };
    case 'unverified':
    case 'none':
    default:
      return { ...p, label: 'no confirmed date', tone: 'grey' };
  }
}

function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** "2027-01-15" → "15 January 2027". Only ever called on an iso we parsed ourselves. */
export function formatIso(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTH_LABEL[Number(m)]} ${y}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Misc shared rendering
// ─────────────────────────────────────────────────────────────────────────────

/** `url` is a citation list, not a link. Views render every entry, not just the first. */
export function splitUrls(raw: string | null | undefined): string[] {
  return (raw ?? '').match(/https?:\/\/[^\s;,)\]]+/gi) ?? [];
}

/**
 * A `correction` may say "DUPLICATE of index 8". Those indices are from the source workbook's
 * id space and every one of them points at a record in a different country. The sentence is
 * shown to the reader verbatim; the number is never dereferenced. This helper exists so a view
 * can label the note, not resolve it.
 */
export function mentionsStaleDuplicatePointer(correction: string | null | undefined): boolean {
  return /DUPLICATE of indic?e?s?\s/i.test(correction ?? '');
}

/** "2026-08-14T09:12:03.000Z" → "14 August 2026". For personal-state timestamps only. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTH_LABEL[d.getUTCMonth() + 1]} ${d.getUTCFullYear()}`;
}

export function pluralise(n: number, one: string, many = one + 's'): string {
  return `${n} ${n === 1 ? one : many}`;
}
