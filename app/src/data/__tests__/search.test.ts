import { describe, expect, it } from 'vitest';
import { buildCorpus, normalise, search } from '../search';
import type { ProgrammeIndex } from '../../types';
import { recordKey } from '../dedup';
import { records } from './fixtures';

/** The corpus takes index rows; build them the way scripts/build-data.mjs does. */
const rows = records.map((r) => ({ ...r, key: recordKey(r), g: r.id, primary: true, rows: 1 })) as unknown as ProgrammeIndex[];
const detail = Object.fromEntries(rows.map((r, i) => [r.key, records[i]!]));
const cardCorpus = buildCorpus(rows);
const fullCorpus = buildCorpus(rows, detail as never);

const idsFor = (q: string, corpus = fullCorpus) => (search(corpus, q) ?? []).map((h) => h.id);

describe('normalise', () => {
  it('folds diacritics so an ASCII keyboard reaches an accented name', () => {
    expect(normalise('Köln')).toBe(normalise('koln'));
    expect(normalise('Zvuková tvorba')).toBe('zvukova tvorba');
    expect(normalise('Genève')).toBe('geneve');
  });

  it('folds letters that do not decompose', () => {
    expect(normalise('Straße')).toBe('strasse');
    expect(normalise('Ø')).toBe('o');
    expect(normalise('Łódź')).toBe('lodz');
    expect(normalise('İstanbul')).toBe('istanbul');
  });

  it('leaves non-Latin scripts searchable in their own script', () => {
    expect(normalise('Ακουστική')).toBe('ακουστικη'); // Greek, tonos stripped
    expect(normalise('Звук')).toBe('звук'); // Cyrillic, unchanged but lowercased
  });
});

describe('search', () => {
  it('returns null for an empty query — different from an empty result', () => {
    expect(search(fullCorpus, '')).toBeNull();
    expect(search(fullCorpus, '   ')).toBeNull();
    expect(search(fullCorpus, 'zzzznotaword')).toEqual([]);
  });

  it('requires every token to match somewhere (token-AND, field-OR)', () => {
    const one = idsFor('tonmeister');
    const two = idsFor('tonmeister detmold');
    expect(one.length).toBeGreaterThan(0);
    expect(two.length).toBeGreaterThan(0);
    expect(two.length).toBeLessThanOrEqual(one.length);
    expect(idsFor('tonmeister zzzznotaword')).toEqual([]);
  });

  it('ranks a programme title above a passing mention in prose', () => {
    const hits = search(fullCorpus, 'mastering')!;
    expect(hits.length).toBeGreaterThan(1);
    const top = rows.find((r) => r.id === hits[0]!.id)!;
    expect(normalise(top.programme + ' ' + top.institution)).toContain('master');
    // Everything after the leader scores no higher than it.
    expect(hits[0]!.score).toBeGreaterThanOrEqual(hits[hits.length - 1]!.score);
  });

  it('finds accented and non-Latin records from folded input', () => {
    expect(idsFor('zvukova')).toContain(253);
    expect(idsFor('zvuková')).toContain(253);
    expect(idsFor('koln').length).toBeGreaterThan(0);
  });

  it('searches titles and places before the prose has loaded, and more after', () => {
    expect(cardCorpus.stage).toBe('index');
    expect(fullCorpus.stage).toBe('full');
    const card = idsFor('portfolio', cardCorpus);
    const full = idsFor('portfolio', fullCorpus);
    expect(full.length).toBeGreaterThan(card.length);
  });

  it('scans the whole corpus in a few milliseconds', () => {
    const started = performance.now();
    for (let i = 0; i < 20; i++) search(fullCorpus, 'music production');
    const per = (performance.now() - started) / 20;
    expect(per).toBeLessThan(50);
  });
});
