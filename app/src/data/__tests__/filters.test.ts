import { describe, expect, it } from 'vitest';
import {
  auditionCertainty,
  emptyFilters,
  facetCounts,
  hasConfirmedAudition,
  isCheap,
  isVerified,
  runPipeline,
} from '../filters';
import { buildGroups, distinctCount } from '../dedup';
import { byId, records } from './fixtures';

/** Index-shaped rows: the pipeline's dedupe step reads the build-time `primary` flag. */
const rows = (() => {
  const groups = buildGroups(records);
  const meta = new Map<number, { g: number; primary: boolean }>();
  for (const grp of groups) {
    for (const m of grp.members) meta.set(m.id, { g: grp.g, primary: grp.primary.id === m.id });
  }
  return records.map((r) => ({ ...r, ...meta.get(r.id)! }));
})();

describe('isCheap', () => {
  it('excludes Edinburgh (120), whose recorded band is contradicted', () => {
    const edinburgh = byId(120);
    expect(edinburgh.costDisputed).not.toBe('');
    expect(edinburgh.costBand).toBe('Under EUR 1.5k/yr'); // the stale value is still in the data
    expect(isCheap(edinburgh)).toBe(false);
  });

  it('excludes KASK (5) for the same reason', () => {
    const kask = byId(5);
    expect(kask.costDisputed).not.toBe('');
    expect(isCheap(kask)).toBe(false);
  });

  it('excludes every cost-disputed record, whatever band it carries', () => {
    const disputed = records.filter((r) => r.costDisputed !== '');
    expect(disputed.length).toBeGreaterThan(0);
    expect(disputed.filter(isCheap)).toHaveLength(0);
  });

  it('still admits undisputed records in the cheap bands', () => {
    const cheap = records.filter(isCheap);
    expect(cheap.length).toBeGreaterThan(0);
    for (const r of cheap) {
      expect(['Free', 'Under EUR 1.5k/yr', 'EUR 1.5k-5k/yr']).toContain(r.costBand);
    }
  });

  it('keeps cost-disputed records out of a cheap selection run through the pipeline', () => {
    const state = { ...emptyFilters(), cheapOnly: true };
    const ids = runPipeline(rows, state).rows.map((r) => r.id);
    expect(ids).not.toContain(120);
    expect(ids).not.toContain(5);
  });
});

describe('hasConfirmedAudition', () => {
  const CONFIRMED = [253, 254, 258, 259, 260];

  it('catches the five records with a live performance or ear test', () => {
    for (const id of CONFIRMED) {
      const rec = byId(id);
      expect(rec.auditionSource, `id ${id}`).toBe('confirmed');
      expect(hasConfirmedAudition(rec), `id ${id}`).toBe(true);
      expect(auditionCertainty(rec), `id ${id}`).toBe('confirmed');
    }
  });

  it('distinguishes confirmed from suspected', () => {
    const suspected = records.filter((r) => auditionCertainty(r) === 'suspected');
    expect(suspected.length).toBeGreaterThan(0);
    for (const r of suspected) {
      expect(r.auditionSource).toBe('suspected');
      expect(hasConfirmedAudition(r)).toBe(false);
    }
    // The two sets are disjoint and neither is the exported needsAudition boolean.
    const confirmed = records.filter(hasConfirmedAudition);
    expect(confirmed.some((r) => suspected.includes(r))).toBe(false);
  });

  it('keeps them out of the default "no audition" view', () => {
    const ids = runPipeline(rows, emptyFilters()).rows.map((r) => r.id);
    for (const id of CONFIRMED) expect(ids, `id ${id}`).not.toContain(id);
  });

  it('keeps them out of a cheap-and-reachable selection, even though they are free', () => {
    for (const id of CONFIRMED) expect(byId(id).costBand).toBe('Free');
    const state = { ...emptyFilters(), cheapOnly: true, dedupe: false };
    const ids = runPipeline(rows, state).rows.map((r) => r.id);
    for (const id of CONFIRMED) expect(ids, `id ${id}`).not.toContain(id);
  });
});

describe('verdicts', () => {
  it('treats an empty verdict as its own state, not as a verdict', () => {
    const unverified = records.filter((r) => !isVerified(r));
    expect(unverified.length).toBeGreaterThan(0);
    expect(unverified.length + records.filter(isVerified).length).toBe(records.length);
    // The app must be able to state how many were never verified, from the data.
    expect(unverified.length).toBe(records.filter((r) => r.verdict === '').length);
  });

  it('selects the never-verified set through the verdict facet', () => {
    const state = { ...emptyFilters(), facets: { ...emptyFilters().facets, verdict: [''] } };
    const result = runPipeline(rows, state);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.every((r) => r.verdict === '')).toBe(true);
  });
});

describe('pipeline and facets', () => {
  it('reports distinct programmes, not rows', () => {
    const unfiltered = {
      ...emptyFilters(),
      dedupe: false,
      audition: ['confirmed', 'suspected', 'none-found'] as const satisfies readonly string[],
    };
    const result = runPipeline(rows, unfiltered as never);
    expect(result.rows.length).toBe(records.length);
    expect(result.distinct).toBeLessThan(result.rows.length);
    expect(result.distinct).toBe(distinctCount(records));
  });

  it('leaves the other values of a facet countable when one is selected', () => {
    const base = emptyFilters();
    const vocabulary = [...new Set(records.map((r) => r.country))];
    const withGermany = { ...base, facets: { ...base.facets, country: ['Germany'] } };
    const counts = facetCounts(rows, withGermany, 'country', vocabulary);
    // Leave-one-out: selecting Germany must not zero the countries he might switch to.
    expect(counts['Germany']).toBeGreaterThan(0);
    expect(counts['Austria']).toBeGreaterThan(0);
  });

  it('lets another active filter change a facet count', () => {
    const base = emptyFilters();
    const vocabulary = [...new Set(records.map((r) => r.country))];
    const all = facetCounts(rows, base, 'country', vocabulary);
    const degrees = facetCounts(rows, { ...base, degreeOnly: true }, 'country', vocabulary);
    const shrunk = vocabulary.some((c) => (degrees[c] ?? 0) < (all[c] ?? 0));
    expect(shrunk).toBe(true);
  });
});
