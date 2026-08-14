/**
 * The time layer, tested against the real corpus and the real curated file.
 *
 * The failure these exist for is not a parser bug. `parseDeadline` is correct: it refuses to make
 * a date out of a PRIOR CYCLE string, and it should keep refusing. The failure is that it is
 * pointed at a field which holds 243 prior-cycle strings and none of the dozen dates the campaign
 * runs on — so the app renders FHNW Basel's confirmed 15 December – 15 February window as
 * "PRIOR CYCLE — CONFIRM THE 2027 DATE", and HfMT Köln as "NO CONFIRMED DATE" while its own
 * correction names 2 March.
 *
 * Every assertion below is therefore about the seam between the two: the calendar must produce the
 * date, and the corpus must never be allowed to.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  containsPriorCycleMarker,
  corpusSuggestions,
  daysBetween,
  entriesForProgramme,
  entryById,
  isoDay,
  making,
  parseCalendar,
  priorCycleCount,
  statusOf,
  thisWeek,
  upcoming,
  type Calendar,
} from '../calendar';
import { recordKey } from '../dedup';
import { deadlineDisplay, parseDeadline } from '../../lib/format';
import { records, schemes } from './fixtures';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(SRC, '..', '..', 'public', 'data');

const cal: Calendar = parseCalendar(JSON.parse(readFileSync(join(DATA, 'calendar.json'), 'utf8')));

const at = (iso: string) => new Date(`${iso}T09:00:00Z`);
const keyOf = (id: number) => recordKey(records.find((r) => r.id === id)!);

// ─────────────────────────────────────────────────────────────────────────────

describe('calendar.json', () => {
  it('parses, and every entry carries a quote and a source', () => {
    expect(cal.entries.length).toBeGreaterThanOrEqual(30);
    for (const e of cal.entries) {
      expect(e.quote.trim(), e.id).not.toBe('');
      expect(e.source.trim(), e.id).not.toBe('');
      expect(['confirmed', 'recurring-pattern']).toContain(e.confidence);
    }
  });

  it('every programmeKey resolves to a real record', () => {
    const keys = new Set(records.map(recordKey));
    for (const e of cal.entries) {
      if (e.programmeKey) expect(keys.has(e.programmeKey), `${e.id} → ${e.programmeKey}`).toBe(true);
    }
  });

  it('every fundingId resolves to a real scheme', () => {
    const ids = new Set(schemes.map((s) => s.id));
    for (const e of cal.entries) {
      if (e.fundingId !== undefined) expect(ids.has(e.fundingId), e.id).toBe(true);
    }
  });

  it('no entry — and no prerequisite — is derived from a PRIOR CYCLE string', () => {
    for (const e of [...cal.entries, ...cal.prerequisites]) {
      expect(containsPriorCycleMarker(e.quote), `${e.id} quote`).toBe(false);
      const cited = /^(programmes|funding)\.json#(\d+)\s+(\w+)$/.exec(e.source);
      if (!cited) continue;
      const [, file, id, field] = cited as unknown as [string, string, string, string];
      const row: Record<string, unknown> =
        file === 'programmes'
          ? (records.find((r) => r.id === Number(id)) as unknown as Record<string, unknown>)
          : (schemes.find((s) => s.id === Number(id)) as unknown as Record<string, unknown>);
      expect(row, e.source).toBeTruthy();
      expect(containsPriorCycleMarker(String(row[field])), `${e.id} ← ${e.source}`).toBe(false);
    }
  });

  it('confirmed and recurring-pattern are both present, and distinguishable', () => {
    const confirmed = cal.entries.filter((e) => e.confidence === 'confirmed');
    const pattern = cal.entries.filter((e) => e.confidence === 'recurring-pattern');
    expect(confirmed.length).toBeGreaterThan(5);
    expect(pattern.length).toBeGreaterThan(5);
    // Nothing may be both, and nothing may be neither.
    expect(confirmed.length + pattern.length).toBe(cal.entries.length);
  });

  it('the logic never reads the clock — `now` is always an argument', () => {
    // Comments are stripped first: the module documents the rule in prose, and the prose names
    // the thing it forbids.
    const source = readFileSync(join(SRC, 'calendar.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(source).not.toMatch(/Date\.now\(/);
    expect(source).not.toMatch(/new Date\(\s*\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The two records the whole rebuild is named after
// ─────────────────────────────────────────────────────────────────────────────

describe('FHNW Basel', () => {
  const basel = records.find((r) => r.id === 15)!;
  const entry = entriesForProgramme(cal, keyOf(15))[0]!;

  it('the corpus field is what the parser calls a prior cycle — that is the bug', () => {
    // The record's own text says, in so many words, "NOT a prior cycle".
    expect(basel.deadline).toContain('NOT a prior cycle');
    expect(parseDeadline(basel.deadline).kind).toBe('prior-cycle');
    expect(deadlineDisplay(basel.deadline, at('2026-08-14')).label).toBe('prior cycle — confirm the 2027 date');
  });

  it('the calendar resolves the window, and it is not badged prior-cycle', () => {
    expect(entry.id).toBe('fhnw-basel-producing-window');
    expect(entry.window).toEqual({ from: '2026-12-15', to: '2027-02-15' });
    expect(entry.confidence).toBe('confirmed');
    expect(entry.quote).toContain('15 December 2026 – 15 February 2027');
    expect(containsPriorCycleMarker(entry.quote)).toBe(false);
  });

  it('is open on 3 January 2027 — the day J2 asks about', () => {
    expect(statusOf(entry, at('2026-12-14'))).toBe('not-open');
    expect(statusOf(entry, at('2026-12-15'))).toBe('open');
    expect(statusOf(entry, at('2027-01-03'))).toBe('open');
    expect(statusOf(entry, at('2027-02-01'))).toBe('closing-soon');
    expect(statusOf(entry, at('2027-02-15'))).toBe('closing-soon');
    expect(statusOf(entry, at('2027-02-16'))).toBe('closed');
  });
});

describe('HfMT Köln', () => {
  const koeln = records.find((r) => r.id === 105)!;
  const entry = entriesForProgramme(cal, keyOf(105))[0]!;

  it('the app renders "no confirmed date" while the record\'s correction names 2 March', () => {
    expect(deadlineDisplay(koeln.deadline, at('2026-08-14')).label).toBe('no confirmed date');
    expect(koeln.correction).toContain('non-EU deadline of 2 March');
  });

  it('the calendar resolves it to 2 March 2027', () => {
    expect(entry.id).toBe('hfmt-koeln-closes');
    expect(entry.date).toBe('2027-03-02');
    expect(entry.confidence).toBe('confirmed');
    expect(entry.source).toBe('programmes.json#105 correction');
    expect(koeln.correction.replace(/\s+/g, ' ')).toContain(entry.quote.replace(/\s+/g, ' '));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// R2 — a prior-cycle string never produces a date, a sort or a count
// ─────────────────────────────────────────────────────────────────────────────

describe('prior-cycle records', () => {
  const rows = [
    ...records.map((r) => ({ ref: `p:${r.id}`, deadline: r.deadline })),
    ...schemes.map((s) => ({ ref: `f:${s.id}`, deadline: s.deadline })),
  ];

  it('none of the 243 yields a date, and corpusSuggestions throws rather than let one through', () => {
    expect(priorCycleCount(rows)).toBeGreaterThan(150);
    const suggestions = corpusSuggestions(rows);
    for (const s of suggestions) {
      const row = rows.find((r) => r.ref === s.ref)!;
      expect(containsPriorCycleMarker(row.deadline), s.ref).toBe(false);
    }
    // The 12 dated results the workflow measured. They are suggestions, not calendar entries.
    expect(suggestions.length).toBeLessThanOrEqual(20);
  });

  it('a prior-cycle string cannot enter the calendar even by hand', () => {
    expect(() =>
      parseCalendar({
        entries: [
          {
            id: 'laundered',
            kind: 'application',
            role: 'closes',
            date: '2027-03-12',
            label: 'invented',
            source: 'programmes.json#999 deadline',
            quote: '12 March 2026 — PRIOR CYCLE; 2027/28 call expected ~Jan 2027',
            confidence: 'confirmed',
          },
        ],
      }),
    ).toThrow(/PRIOR CYCLE/);
  });

  it('no calendar entry duplicates a date the parser already refused for the same record', () => {
    for (const e of cal.entries) {
      if (!e.programmeKey) continue;
      const rec = records.find((r) => recordKey(r) === e.programmeKey)!;
      if (parseDeadline(rec.deadline).kind !== 'prior-cycle') continue;
      // The record IS prior-cycle. The calendar may still hold a date for it — but only from a
      // different, quoted source.
      expect(containsPriorCycleMarker(e.quote), e.id).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// statusOf
// ─────────────────────────────────────────────────────────────────────────────

describe('statusOf', () => {
  it('an entry that only published an opening is never "closed"', () => {
    const kth = entryById(cal, 'kth-imt-opens')!;
    expect(kth.role).toBe('opens');
    expect(statusOf(kth, at('2026-10-15'))).toBe('not-open');
    expect(statusOf(kth, at('2026-10-16'))).toBe('open');
    expect(statusOf(kth, at('2028-01-01'))).toBe('open'); // nobody said when it shuts
  });

  it('a deadline with no published opening is open until it closes', () => {
    const unil = entryById(cal, 'unil-master-grant')!;
    expect(statusOf(unil, at('2026-08-14'))).toBe('open');
    expect(statusOf(unil, at('2026-10-25'))).toBe('closing-soon');
    expect(statusOf(unil, at('2026-11-02'))).toBe('closed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// thisWeek — the home screen's answer, on three specific mornings
// ─────────────────────────────────────────────────────────────────────────────

describe('thisWeek', () => {
  it('14 August 2026 — the ESKAS window opens in six days, and DAAD is 17 days out', () => {
    const w = thisWeek(cal, at('2026-08-14'));
    expect(w.today).toBe('2026-08-14');
    expect(w.weeksToIntake).toBe(54);

    expect(w.opening.map((d) => d.entry.id)).toEqual(['eskas-arts-opens']);
    expect(w.opening[0]!.daysUntilOpen).toBe(6);

    expect(w.closing.map((d) => d.entry.id)).toEqual(['daad-study-scholarship']);
    expect(w.closing[0]!.daysUntilClose).toBe(17);

    // The ARES / Wallonia call is open right now and Tunisia is a named priority country.
    expect(w.openNow.map((d) => d.entry.id)).toContain('ares-wbi-2027-call');
    expect(w.counts.closed).toBe(0);
  });

  it('1 October 2026 — the first gate. Campus France opens, and it gates 28 French options', () => {
    const w = thisWeek(cal, at('2026-10-01'));
    const open = w.openNow.map((d) => d.entry.id);
    expect(open).toContain('campus-france-tn-opens');
    expect(open).toContain('polimi-first-call');
    expect(open).toContain('haw-hamburg-aptitude-window');
    expect(open).toContain('tunisian-bourse-circulaire');
    // Nothing closes inside three weeks on that day; the pressure is all lead time.
    expect(w.closing).toEqual([]);
  });

  it('3 January 2027 — J2, the question the app cannot answer today', () => {
    const w = thisWeek(cal, at('2027-01-03'));
    expect(w.closing.map((d) => d.entry.id)).toEqual(['campus-france-tn-masters-close', 'skh-stockholm-closes']);
    expect(w.closing.every((d) => d.daysUntilClose === 12)).toBe(true);

    expect(w.opening.map((d) => d.entry.id)).toEqual(['turkiye-burslari-arts-window']);
    expect(w.opening[0]!.daysUntilOpen).toBe(7);

    // Basel — the strongest single target — is open on that morning, not badged prior-cycle.
    expect(w.openNow.map((d) => d.entry.id)).toContain('fhnw-basel-producing-window');

    // Track 3 needs a miked acoustic source and Türkiye Bursları closes on 20 February.
    expect(w.overdue.map((m) => m.prerequisite.id)).toContain('track-3-miked-acoustic');
  });

  it('the bands are disjoint, on every morning tested', () => {
    for (const day of ['2026-08-14', '2026-10-01', '2026-12-15', '2027-01-03', '2027-03-02']) {
      const w = thisWeek(cal, at(day));
      const ids = [...w.closing, ...w.opening, ...w.openNow].map((d) => d.entry.id);
      expect(new Set(ids).size, day).toBe(ids.length);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// upcoming
// ─────────────────────────────────────────────────────────────────────────────

describe('upcoming', () => {
  it('is sorted by urgency and drops what has already closed', () => {
    const rows = upcoming(cal, at('2027-01-03'), 60);
    expect(rows.length).toBeGreaterThan(3);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.urgencyDays).toBeGreaterThanOrEqual(rows[i - 1]!.urgencyDays);
    }
    expect(rows.every((r) => r.status !== 'closed')).toBe(true);
    expect(rows.map((r) => r.entry.id)).not.toContain('rdam-tonmeister-closes'); // closed 1 Dec
  });

  it('carries the blockers with each gate, so a date never appears without what it costs', () => {
    const koeln = upcoming(cal, at('2027-02-20'), 30).find((d) => d.entry.id === 'hfmt-koeln-closes')!;
    expect(koeln.blockedBy.map((p) => p.id)).toEqual(
      expect.arrayContaining(['track-1', 'track-2', 'working-method-doc', 'german-a2']),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The making — things with no date that block things with one
// ─────────────────────────────────────────────────────────────────────────────

describe('making', () => {
  it('computes a latest safe start backwards from the nearest live gate', () => {
    const rows = making(cal, at('2026-08-14'));
    const track3 = rows.find((m) => m.prerequisite.id === 'track-3-miked-acoustic')!;
    // Türkiye Bursları closes 20 February 2027; three miked mixes are estimated at 120 days.
    expect(track3.nextGate!.id).toBe('turkiye-burslari-arts-window');
    expect(track3.latestSafeStart).toBe('2026-10-23');
    expect(track3.overdue).toBe(false);
    expect(track3.daysUntilLatestSafeStart).toBe(daysBetween('2026-08-14', '2026-10-23'));
  });

  it('every lead time says out loud that it is this app\'s estimate', () => {
    for (const p of cal.prerequisites) {
      expect(p.leadTimeNote, p.id).toMatch(/estimate|reading of that/i);
      expect(p.blocks.length, p.id).toBeGreaterThan(0);
    }
  });

  it('drops gates that have closed rather than reporting a start date in the past', () => {
    const rows = making(cal, at('2027-06-20'));
    const track1 = rows.find((m) => m.prerequisite.id === 'track-1')!;
    // Basel, Köln and Saint Louis have all closed by then; İTÜ's late-June window has not.
    expect(track1.blocks.map((e) => e.id)).toEqual(['itu-miam-window']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('isoDay', () => {
  it('is a UTC calendar day, so a test at 09:00 and one at 23:00 agree', () => {
    expect(isoDay(new Date('2027-01-03T09:00:00Z'))).toBe('2027-01-03');
    expect(isoDay(new Date('2027-01-03T23:59:59Z'))).toBe('2027-01-03');
  });
});
