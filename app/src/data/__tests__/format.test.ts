import { describe, expect, it } from 'vitest';
import { deadlineDisplay, parseDeadline, renderField } from '../../lib/format';
import { records, schemes } from './fixtures';

const MONTH_NAME = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
const DATE_LIKE = /\b\d{1,2}[\s./-]\d{1,2}[\s./-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/;

describe('deadlineDisplay', () => {
  it('never emits a bare date for a PRIOR CYCLE string', () => {
    const raw =
      '15 January 2026 (15:00 EET) — PRIOR CYCLE (this is the 2026 intake); 2027 date UNVERIFIED';
    const d = deadlineDisplay(raw);
    expect(d.kind).toBe('prior-cycle');
    expect(d.iso).toBeUndefined();
    expect(d.label).toBe('prior cycle — confirm the 2027 date');
    expect(d.raw).toBe(raw); // the prose is always one tap away
  });

  it('holds for every PRIOR CYCLE record in the corpus', () => {
    const prior = records.filter((r) => /PRIOR CYCLE/.test(r.deadline));
    expect(prior.length).toBeGreaterThan(100);
    for (const r of prior) {
      const d = deadlineDisplay(r.deadline);
      // A string may also say NO INTAKE or lead with "Not applicable", both checked earlier
      // and both more disqualifying. Either way the record carries no date.
      expect(['prior-cycle', 'no-intake', 'not-applicable'], `id ${r.id}`).toContain(d.kind);
      expect(d.iso, `id ${r.id}`).toBeUndefined();
      expect(d.month, `id ${r.id}`).toBeUndefined();
    }
  });

  it('never carries a date on any kind other than dated/recurring', () => {
    for (const r of [...records.map((r) => r.deadline), ...schemes.map((s) => s.deadline)]) {
      const p = parseDeadline(r);
      if (p.kind !== 'dated') expect(p.iso).toBeUndefined();
      if (p.kind !== 'recurring') expect(p.month).toBeUndefined();
      if (p.kind === 'dated') expect(Number(p.iso!.slice(0, 4))).toBeGreaterThanOrEqual(2027);
    }
  });

  it('never prints a calendar date in a label unless the record carries one', () => {
    // The failure mode is a date, not the digits 2027: "prior cycle — confirm the 2027 date"
    // is a prompt to go and look, whereas "15 January 2026" would be a manufactured deadline.
    for (const r of records) {
      const d = deadlineDisplay(r.deadline);
      if (d.kind === 'dated' || d.kind === 'recurring') continue;
      expect(MONTH_NAME.test(d.label), `id ${r.id}: ${d.label}`).toBe(false);
      expect(DATE_LIKE.test(d.label), `id ${r.id}: ${d.label}`).toBe(false);
    }
  });

  it('refuses a day-and-month with no year, and accepts an explicit annual one', () => {
    expect(parseDeadline('15 February').kind).toBe('unverified');
    const rec = parseDeadline('15 February annually');
    expect(rec.kind).toBe('recurring');
    expect(rec.month).toBe(2);
    expect(rec.day).toBe(15);
    expect(deadlineDisplay('15 February annually').label).toBe('around 15 February each year');
  });

  it('reads a real 2027 date, and treats a 2026 one as a previous cycle', () => {
    const d = deadlineDisplay('Applications close 15 January 2027', new Date('2026-08-14T00:00:00Z'));
    expect(d.kind).toBe('dated');
    expect(d.iso).toBe('2027-01-15');
    expect(parseDeadline('Applications closed 15 January 2026').kind).toBe('prior-cycle');
  });

  it('flags the disqualifying markers before looking for a date', () => {
    expect(parseDeadline('*** NO INTAKE IN 2027 *** applications ran 7 January 2026').kind).toBe('no-intake');
    expect(parseDeadline('Not applicable — this is a funding scheme').kind).toBe('not-applicable');
    expect(parseDeadline('rolling admissions').kind).toBe('rolling');
    expect(parseDeadline('').kind).toBe('none');
  });
});

describe('renderField', () => {
  it('separates a value, an UNVERIFIED, and an empty field', () => {
    expect(renderField('EUR 8,800.20 per year').kind).toBe('value');
    expect(renderField('UNVERIFIED').kind).toBe('unverified');
    expect(renderField('').kind).toBe('empty');
    const kinds = new Set(['value', 'unverified', 'empty'].map((k) => k));
    expect(kinds.size).toBe(3);
  });

  it('gives the three states three different captions', () => {
    const a = renderField('Master of Music');
    const b = renderField('UNVERIFIED');
    const c = renderField('   ');
    expect(new Set([a.text, b.text, c.text]).size).toBe(3);
    expect(new Set([a.kind, b.kind, c.kind]).size).toBe(3);
  });

  it('treats a typographic placeholder as empty, not as a value', () => {
    expect(renderField('—').kind).toBe('empty');
    expect(records.some((r) => r.scholarship === '—')).toBe(true);
  });

  it('keeps an inline UNVERIFIED caveat attached to the value that carries it', () => {
    const f = renderField('approx. EUR 800/month, UNVERIFIED 2027 figure');
    expect(f.kind).toBe('value');
    expect(f.caveated).toBe(true);
    expect(renderField('EUR 0').caveated).toBe(false);
  });
});
