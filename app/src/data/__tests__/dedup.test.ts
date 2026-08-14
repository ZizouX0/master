import { describe, expect, it } from 'vitest';
import { buildGroups, distinctCount, groupKey, primariesOnly, recordKey } from '../dedup';
import { records } from './fixtures';

describe('dedup', () => {
  const groups = buildGroups(records);
  const groupOf = (id: number) => groups.find((g) => g.members.some((m) => m.id === id))!;

  it('collapses rows into fewer distinct programmes', () => {
    expect(groups.length).toBeLessThan(records.length);
    expect(distinctCount(records)).toBe(groups.length);
    expect(primariesOnly(records).length).toBe(groups.length);
  });

  it("counts ICMP's three rows as one programme", () => {
    const icmp = records.filter((r) => /icmp\.ac\.uk\/course\/ma-creative-music-production/i.test(r.url));
    expect(icmp.length).toBeGreaterThan(1);
    expect(distinctCount(icmp)).toBe(1);
    const keys = new Set(icmp.map(groupKey));
    expect(keys.size).toBe(1);
  });

  it('keeps the six Detmold Tonmeister rows in one group', () => {
    const detmold = records.filter((r) => /hfm-detmold\.de/i.test(r.url) && /tonmeister/i.test(r.url));
    expect(detmold.length).toBeGreaterThan(1);
    expect(distinctCount(detmold)).toBe(1);
  });

  it('never merges records across a country boundary — the no-transitivity guarantee', () => {
    // Union-find over shared URLs pulled 27 unrelated SAE records into one group through a
    // shared fees page. A group that spans two countries is that bug reappearing.
    for (const group of groups) {
      const countries = new Set(group.members.map((m) => m.country));
      expect(countries.size, `${group.key} spans ${[...countries].join(' / ')}`).toBe(1);
    }
  });

  it('keeps the SAE campuses apart', () => {
    const sae = records.filter((r) => /\bSAE\b/i.test(r.institution));
    expect(sae.length).toBeGreaterThan(5);
    expect(distinctCount(sae)).toBeGreaterThan(5);
  });

  it('picks a verified row as the group primary wherever the group has one', () => {
    for (const group of groups) {
      if (group.members.some((m) => m.verdict !== '')) {
        expect(group.primary.verdict, group.key).not.toBe('');
      }
    }
  });

  it('assigns every record exactly one group', () => {
    const seen = new Set<number>();
    for (const g of groups) for (const m of g.members) seen.add(m.id);
    expect(seen.size).toBe(records.length);
  });

  it('counts index-style rows by their build-time group ordinal', () => {
    const rows = records.map((r) => ({ id: r.id, g: groupOf(r.id).g }));
    expect(distinctCount(rows)).toBe(groups.length);
  });

  it('produces a unique record key for every record', () => {
    expect(new Set(records.map(recordKey)).size).toBe(records.length);
  });
});
