import { beforeEach, describe, expect, it } from 'vitest';
import { recordKey } from '../dedup';
import { records } from './fixtures';

/** localStorage shim — the store degrades gracefully without one, but we want the real path. */
class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}
(globalThis as { localStorage?: Storage }).localStorage = new MemoryStorage() as unknown as Storage;

const { useStore, flushPersonal, migratePersonal, parseHash, serialiseRoute } = await import('../../store');

describe('personal-state key', () => {
  it('depends on institution + programme + url, never on id', () => {
    const rec = records.find((r) => r.institution.startsWith('The University of Edinburgh'))!;
    const before = recordKey(rec);
    // A re-export renumbers by enumeration order; the record itself is unchanged.
    const renumbered = { ...rec, id: rec.id + 1000 };
    expect(recordKey(renumbered)).toBe(before);
  });

  it('survives a full renumbering of the corpus', () => {
    const reExported = [...records].reverse().map((r, i) => ({ ...r, id: i }));
    for (const rec of reExported) {
      const original = records.find(
        (r) => r.institution === rec.institution && r.programme === rec.programme && r.url === rec.url,
      )!;
      expect(recordKey(rec)).toBe(recordKey(original));
    }
  });

  it('keeps the tracked entry pointing at the same programme after ids move', () => {
    const rec = records.find((r) => r.institution.startsWith('The University of Edinburgh'))!;
    const key = recordKey(rec);
    useStore.getState().setStatus(key, 'shortlist');
    useStore.getState().setNote(key, 'ask about the real fee');

    // Simulate the next export: every id shifts by one, nothing else changes.
    const reExported = records.map((r) => ({ ...r, id: r.id + 1 }));
    const resolved = reExported.find((r) => recordKey(r) === key)!;

    expect(resolved.institution).toBe(rec.institution);
    expect(resolved.programme).toBe(rec.programme);
    expect(resolved.id).not.toBe(rec.id);
    expect(useStore.getState().entryFor(key)?.status).toBe('shortlist');
  });
});

describe('personal store', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ personal: { schemaVersion: 1, entries: {}, lastExportedAt: null, dataGenerated: '' } });
  });

  it('records status, note and next action against the durable key', () => {
    const key = recordKey(records[0]!);
    const s = useStore.getState();
    s.setStatus(key, 'applying');
    s.setNextAction(key, 'email study@…');
    const entry = useStore.getState().entryFor(key)!;
    expect(entry.key).toBe(key);
    expect(entry.status).toBe('applying');
    expect(entry.nextAction).toBe('email study@…');
    expect(Date.parse(entry.updated)).not.toBeNaN();
  });

  it('persists to localStorage and reloads through the migration chain', () => {
    const key = recordKey(records[1]!);
    useStore.getState().setStatus(key, 'shortlist');
    flushPersonal();
    const raw = localStorage.getItem('door3.personal.v1')!;
    expect(raw).toBeTruthy();
    const restored = migratePersonal(JSON.parse(raw));
    expect(restored.schemaVersion).toBe(1);
    expect(restored.entries[key]!.status).toBe('shortlist');
  });

  it('exports to JSON and imports it back', () => {
    const key = recordKey(records[2]!);
    useStore.getState().setStatus(key, 'emailed');
    const json = useStore.getState().exportJson();
    expect(JSON.parse(json).format).toBe('door3-personal');
    useStore.setState({ personal: { schemaVersion: 1, entries: {}, lastExportedAt: null, dataGenerated: '' } });
    const res = useStore.getState().importJson(json, 'replace');
    expect(res.imported).toBe(1);
    expect(useStore.getState().entryFor(key)?.status).toBe('emailed');
  });

  it('merges an import rather than losing either side', () => {
    const a = recordKey(records[3]!);
    const b = recordKey(records[4]!);
    useStore.getState().setStatus(a, 'shortlist');
    const exported = useStore.getState().exportJson();
    useStore.setState({ personal: { schemaVersion: 1, entries: {}, lastExportedAt: null, dataGenerated: '' } });
    useStore.getState().setStatus(b, 'applied');
    useStore.getState().importJson(exported, 'merge');
    expect(useStore.getState().entryFor(a)?.status).toBe('shortlist');
    expect(useStore.getState().entryFor(b)?.status).toBe('applied');
  });

  it('exports Markdown that names the programme, not the key', () => {
    const rec = records[5]!;
    const key = recordKey(rec);
    useStore.setState({
      index: [{ ...rec, key, g: 0, primary: true, rows: 1 }] as never,
    });
    useStore.getState().setStatus(key, 'shortlist');
    useStore.getState().setNextAction(key, 'send transcript');
    const md = useStore.getState().exportMarkdown();
    expect(md).toContain('# My list');
    expect(md).toContain(rec.institution);
    expect(md).toContain('send transcript');
  });

  it('sets lastExportedAt so the export nudge has something to compare against', () => {
    useStore.getState().setStatus(recordKey(records[6]!), 'shortlist');
    expect(useStore.getState().personal.lastExportedAt).toBeNull();
    useStore.getState().exportJson();
    expect(useStore.getState().personal.lastExportedAt).not.toBeNull();
  });
});

describe('hash routing', () => {
  it('round-trips a path and its query', () => {
    expect(parseHash('#/p/261?c=DE')).toEqual({ path: '/p/261', query: { c: 'DE' } });
    expect(parseHash('')).toEqual({ path: '/', query: {} });
    expect(serialiseRoute({ path: '/funding', query: { te: 'yes' } })).toBe('#/funding?te=yes');
    expect(serialiseRoute({ path: '/', query: {} })).toBe('#/');
  });
});
