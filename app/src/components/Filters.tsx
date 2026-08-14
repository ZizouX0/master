/**
 * The filter sheet, plus the URL codec that makes any view of the list shareable.
 *
 * Two decisions worth stating:
 *
 *  1. **A bottom sheet, not a sidebar.** He is on a 390px phone holding it in one hand. The
 *     sheet opens from the thumb end, every control is ≥44px, and the footer showing
 *     "Show N results" stays pinned so the number he is steering by never scrolls away.
 *  2. **Counts are leave-one-out.** `store.facets` already reflects every OTHER active filter
 *     but not the facet's own selection, so selecting Germany does not zero every other
 *     country. Zero-count options are greyed and kept — options that disappear are how people
 *     lose their bearings.
 *
 * The codec is the other half of §4.3: filter state lives in the hash, never in component
 * state, so a view can be sent to himself on WhatsApp and come back identical.
 */

import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { useStore } from '../store';
import {
  emptyFilters,
  isDefaultFilters,
  FACET_KEYS,
  type AuditionCertainty,
  type DisputeKey,
  type FacetKey,
  type FilterState,
} from '../data/filters';

// ─────────────────────────────────────────────────────────────────────────────
// URL codec
// ─────────────────────────────────────────────────────────────────────────────

/** DESIGN-UX §4.3 key map. Short, because he will read these in a shared link. */
const PARAM: Record<FacetKey, string> = {
  country: 'c',
  region: 'r',
  subtype: 'st',
  level: 'lv',
  chance: 'ch',
  verdict: 'v',
  costBand: 'cost',
  gate: 'g',
  language: 'lang',
  publicPrivate: 'pp',
  funding: 'fund',
};

const FACET_BY_PARAM = Object.fromEntries(
  (Object.entries(PARAM) as [FacetKey, string][]).map(([k, v]) => [v, k]),
) as Record<string, FacetKey>;

/** The empty verdict is a real facet value; it needs a token that survives a comma list. */
const UNCHECKED_TOKEN = 'unchecked';

const ALL_AUDITION: AuditionCertainty[] = ['confirmed', 'suspected', 'none-found'];

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/** FilterState → query string (no leading '?'). Defaults are omitted, so URLs stay short. */
export function encodeFilters(f: FilterState): string {
  const q = new URLSearchParams();
  if (f.q.trim()) q.set('q', f.q.trim());
  for (const key of FACET_KEYS) {
    const vals = f.facets[key];
    if (vals.length === 0) continue;
    q.set(PARAM[key], vals.map((v) => (key === 'verdict' && v === '' ? UNCHECKED_TOKEN : v)).join(','));
  }
  if (f.degreeOnly) q.set('deg', '1');
  if (f.languageOnly) q.set('langok', '1');
  if (f.cheapOnly) q.set('cheap', '1');
  if (f.verifiedOnly) q.set('chk', '1');
  if (!f.dedupe) q.set('dedupe', '0');
  const d = emptyFilters();
  if (!sameSet(f.audition, d.audition)) {
    q.set('aud', sameSet(f.audition, ALL_AUDITION) ? 'all' : f.audition.join(','));
  }
  if (f.disputes.length) q.set('disp', f.disputes.join(','));
  return q.toString();
}

/** Query → FilterState. Unknown or stale params are ignored, never an error. */
export function decodeFilters(query: Record<string, string>): FilterState {
  const f = emptyFilters();
  if (query.q) f.q = query.q;
  for (const [param, raw] of Object.entries(query)) {
    const key = FACET_BY_PARAM[param];
    if (!key || !raw) continue;
    f.facets[key] = raw
      .split(',')
      .filter(Boolean)
      .map((v) => (key === 'verdict' && v === UNCHECKED_TOKEN ? '' : v));
  }
  f.degreeOnly = query.deg === '1';
  f.languageOnly = query.langok === '1';
  f.cheapOnly = query.cheap === '1';
  f.verifiedOnly = query.chk === '1';
  f.dedupe = query.dedupe !== '0';
  if (query.aud) {
    f.audition =
      query.aud === 'all'
        ? ALL_AUDITION.slice()
        : (query.aud.split(',').filter((v) => (ALL_AUDITION as string[]).includes(v)) as AuditionCertainty[]);
    if (f.audition.length === 0) f.audition = emptyFilters().audition;
  }
  if (query.disp) {
    f.disputes = query.disp
      .split(',')
      .filter((v) => v === 'audition' || v === 'cost' || v === 'existence') as DisputeKey[];
  }
  return f;
}

/** The canonical link to a filtered list. Every funnel row and every shortcut goes through it. */
export function listHref(f: FilterState): string {
  const qs = encodeFilters(f);
  return '/list' + (qs ? '?' + qs : '');
}

/** A filter state built by layering a patch on the defaults — how the funnel makes its links. */
export function withFilters(patch: Partial<FilterState>): FilterState {
  return { ...emptyFilters(), ...patch };
}

// ─────────────────────────────────────────────────────────────────────────────
// Active-filter descriptors, for the removable chips in the sticky bar
// ─────────────────────────────────────────────────────────────────────────────

export interface ActiveFilter {
  label: string;
  /** The state with this one constraint removed. */
  without: FilterState;
}

const SWITCH_LABEL: Record<string, string> = {
  degreeOnly: 'real degrees only',
  languageOnly: 'English or French',
  cheapOnly: 'affordable (≤ €5k/yr)',
  verifiedOnly: 'checked only',
};

export function activeFilters(f: FilterState): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (f.q.trim()) out.push({ label: `“${f.q.trim()}”`, without: { ...f, q: '' } });
  for (const key of FACET_KEYS) {
    for (const v of f.facets[key]) {
      out.push({
        label: v === '' ? 'not verified' : v,
        without: { ...f, facets: { ...f.facets, [key]: f.facets[key].filter((x) => x !== v) } },
      });
    }
  }
  for (const k of ['degreeOnly', 'languageOnly', 'cheapOnly', 'verifiedOnly'] as const) {
    if (f[k]) out.push({ label: SWITCH_LABEL[k]!, without: { ...f, [k]: false } });
  }
  if (f.audition.includes('confirmed')) {
    out.push({ label: 'incl. live auditions', without: { ...f, audition: emptyFilters().audition } });
  }
  if (!f.dedupe) out.push({ label: 'duplicates shown', without: { ...f, dedupe: true } });
  for (const d of f.disputes) {
    out.push({ label: `${d} disputed`, without: { ...f, disputes: f.disputes.filter((x) => x !== d) } });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// The sheet
// ─────────────────────────────────────────────────────────────────────────────

function Section(p: { name: string; active: number; children: any; defaultOpen?: boolean }): JSX.Element {
  const [open, setOpen] = useState(p.defaultOpen ?? false);
  return (
    <div class="fsection">
      <button type="button" class="fsection__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span class="fsection__name">{p.name}</span>
        {p.active > 0 ? <span class="fsection__n">{p.active} on</span> : null}
        <span class="dim" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open ? <div class="fsection__body">{p.children}</div> : null}
    </div>
  );
}

function Switch(p: { on: boolean; label: string; hint: string; onToggle: () => void }): JSX.Element {
  return (
    <button type="button" class="switch" aria-pressed={p.on} onClick={p.onToggle}>
      <span class="switch__box" aria-hidden="true">
        ✔
      </span>
      <span class="switch__main">
        <span class="switch__label">{p.label}</span>
        <span class="switch__hint">{p.hint}</span>
      </span>
    </button>
  );
}

function Options(p: {
  facet: FacetKey;
  values: string[];
  counts: Record<string, number>;
  selected: string[];
  onToggle: (v: string) => void;
  labelOf?: (v: string) => string;
}): JSX.Element {
  return (
    <div class="opts">
      {p.values.map((v) => {
        const n = p.counts[v] ?? 0;
        const on = p.selected.includes(v);
        return (
          <button
            type="button"
            key={v}
            class={'opt' + (n === 0 && !on ? ' opt--zero' : '')}
            aria-pressed={on}
            onClick={() => p.onToggle(v)}
          >
            <span>{p.labelOf ? p.labelOf(v) : v || 'not verified'}</span>
            <span class="opt__n">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Facet vocabularies come from meta.json, ordered by their corpus-wide count. */
function vocabulary(meta: Record<string, Record<string, number>> | undefined, key: FacetKey): string[] {
  const table = meta?.[key] ?? {};
  return Object.keys(table).sort((a, b) => (table[b] ?? 0) - (table[a] ?? 0));
}

export function Filters(p: { open: boolean; onClose: () => void; onChange: (next: FilterState) => void }): JSX.Element | null {
  const filters = useStore((s) => s.filters);
  const facets = useStore((s) => s.facets);
  const meta = useStore((s) => s.meta);
  const results = useStore((s) => s.results);
  const [countryQuery, setCountryQuery] = useState('');
  const [allLanguages, setAllLanguages] = useState(false);

  if (!p.open) return null;

  const set = (patch: Partial<FilterState>) => p.onChange({ ...filters, ...patch });
  const toggleFacet = (key: FacetKey, v: string) => {
    const cur = filters.facets[key];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    p.onChange({ ...filters, facets: { ...filters.facets, [key]: next } });
  };
  const counts = (key: FacetKey) => facets[key] ?? {};
  const vocab = (key: FacetKey) => vocabulary(meta?.facets, key);

  const languages = vocab('language');
  const countries = vocab('country').filter((c) =>
    countryQuery ? c.toLowerCase().includes(countryQuery.toLowerCase()) : true,
  );
  const showAudition = filters.audition.includes('confirmed');

  return (
    <>
      <button type="button" class="sheet__scrim" aria-label="Close filters" onClick={p.onClose} />
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Filters">
        <div class="sheet__head">
          <span class="sheet__title">Filters</span>
          <button type="button" class="iconbtn" onClick={p.onClose} aria-label="Close">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div class="sheet__body">
          <Section
            name="The five that decide"
            active={
              (filters.degreeOnly ? 1 : 0) +
              (filters.languageOnly ? 1 : 0) +
              (filters.cheapOnly ? 1 : 0) +
              (filters.verifiedOnly ? 1 : 0) +
              (showAudition ? 1 : 0)
            }
            defaultOpen
          >
            <Switch
              on={filters.degreeOnly}
              label="Real master’s degrees only"
              hint="130 of the 398 are sold as a master’s and are not one."
              onToggle={() => set({ degreeOnly: !filters.degreeOnly })}
            />
            <Switch
              on={!showAudition}
              label="Hide confirmed live auditions"
              hint="A production test is not an audition. Only a confirmed live performance test is hidden here."
              onToggle={() =>
                set({ audition: showAudition ? emptyFilters().audition : ALL_AUDITION.slice() })
              }
            />
            <Switch
              on={filters.languageOnly}
              label="Taught in a language you have"
              hint="English or French. You have no German."
              onToggle={() => set({ languageOnly: !filters.languageOnly })}
            />
            <Switch
              on={filters.cheapOnly}
              label="Affordable — ≤ €5k/yr"
              hint="Cost-disputed records are excluded whatever their band says: Edinburgh’s ≈£29,900 still sits in a cheap band."
              onToggle={() => set({ cheapOnly: !filters.cheapOnly })}
            />
            <Switch
              on={filters.verifiedOnly}
              label="Checked against the official page only"
              hint="249 of 398 were never checked. Checked does not mean good — most of the checked ones are AVOID."
              onToggle={() => set({ verifiedOnly: !filters.verifiedOnly })}
            />
            <Switch
              on={!filters.dedupe}
              label="Show duplicate rows"
              hint="Off, one card per programme: ICMP’s three rows are one programme. On, all 398 source rows."
              onToggle={() => set({ dedupe: !filters.dedupe })}
            />
          </Section>

          <Section name="Money" active={filters.facets.costBand.length + filters.facets.funding.length}>
            <Options
              facet="costBand"
              values={vocab('costBand')}
              counts={counts('costBand')}
              selected={filters.facets.costBand}
              onToggle={(v) => toggleFacet('costBand', v)}
              labelOf={(v) => (v === 'Not published' ? 'no price published' : v.replace(/EUR\s*/g, '€'))}
            />
            <p class="switch__hint" style="margin:8px 0 10px">
              Funding attached:
            </p>
            <Options
              facet="funding"
              values={vocab('funding')}
              counts={counts('funding')}
              selected={filters.facets.funding}
              onToggle={(v) => toggleFacet('funding', v)}
            />
          </Section>

          <Section name="The gate" active={filters.facets.gate.length}>
            <p class="switch__hint" style="margin:0 0 10px">
              A practical production test is not an audition. “Here is raw material, make a
              production” is the job, not a barrier — only 16 records gate on a live performance.
            </p>
            <Options
              facet="gate"
              values={vocab('gate')}
              counts={counts('gate')}
              selected={filters.facets.gate}
              onToggle={(v) => toggleFacet('gate', v)}
            />
          </Section>

          <Section name="Where" active={filters.facets.region.length + filters.facets.country.length}>
            <Options
              facet="region"
              values={vocab('region')}
              counts={counts('region')}
              selected={filters.facets.region}
              onToggle={(v) => toggleFacet('region', v)}
            />
            <p class="switch__hint" style="margin:12px 0 6px">
              Country ({vocab('country').length}):
            </p>
            <input
              class="optfilter"
              type="search"
              placeholder="Find a country"
              value={countryQuery}
              onInput={(e) => setCountryQuery((e.target as HTMLInputElement).value)}
            />
            <Options
              facet="country"
              values={countries}
              counts={counts('country')}
              selected={filters.facets.country}
              onToggle={(v) => toggleFacet('country', v)}
            />
          </Section>

          <Section name="Language" active={filters.facets.language.length}>
            <Options
              facet="language"
              values={allLanguages ? languages : languages.slice(0, 6)}
              counts={counts('language')}
              selected={filters.facets.language}
              onToggle={(v) => toggleFacet('language', v)}
            />
            {languages.length > 6 ? (
              <button type="button" class="btn btn--ghost btn--sm" style="margin-top:8px" onClick={() => setAllLanguages(!allLanguages)}>
                {allLanguages ? 'Fewer' : `All ${languages.length} languages`}
              </button>
            ) : null}
          </Section>

          <Section name="Verdict" active={filters.facets.verdict.length}>
            <Options
              facet="verdict"
              values={['WORTH IT', 'CONDITIONAL', 'AVOID', '']}
              counts={counts('verdict')}
              selected={filters.facets.verdict}
              onToggle={(v) => toggleFacet('verdict', v)}
              labelOf={(v) => (v === '' ? 'not verified' : v)}
            />
          </Section>

          <Section
            name="More filters"
            active={
              filters.facets.subtype.length +
              filters.facets.level.length +
              filters.facets.publicPrivate.length +
              filters.facets.chance.length +
              filters.disputes.length
            }
          >
            <p class="switch__hint" style="margin:0 0 8px">
              What kind of programme:
            </p>
            <Options
              facet="subtype"
              values={vocab('subtype')}
              counts={counts('subtype')}
              selected={filters.facets.subtype}
              onToggle={(v) => toggleFacet('subtype', v)}
            />
            <p class="switch__hint" style="margin:12px 0 8px">
              What it awards:
            </p>
            <Options
              facet="level"
              values={vocab('level')}
              counts={counts('level')}
              selected={filters.facets.level}
              onToggle={(v) => toggleFacet('level', v)}
            />
            <p class="switch__hint" style="margin:12px 0 8px">
              Public or private:
            </p>
            <Options
              facet="publicPrivate"
              values={vocab('publicPrivate')}
              counts={counts('publicPrivate')}
              selected={filters.facets.publicPrivate}
              onToggle={(v) => toggleFacet('publicPrivate', v)}
            />
            <p class="switch__hint" style="margin:12px 0 8px">
              Recorded chance — an automatic guess over a listing blurb. 28 records it rated Strong
              were judged AVOID once the page was read. A verdict outranks it.
            </p>
            <Options
              facet="chance"
              values={vocab('chance')}
              counts={counts('chance')}
              selected={filters.facets.chance}
              onToggle={(v) => toggleFacet('chance', v)}
            />
            <p class="switch__hint" style="margin:12px 0 8px">
              Only records where verified prose contradicts the data:
            </p>
            <div class="opts">
              {(['cost', 'audition', 'existence'] as DisputeKey[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  class="opt"
                  aria-pressed={filters.disputes.includes(d)}
                  onClick={() =>
                    set({
                      disputes: filters.disputes.includes(d)
                        ? filters.disputes.filter((x) => x !== d)
                        : [...filters.disputes, d],
                    })
                  }
                >
                  {d} disputed
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div class="sheet__foot">
          <button
            type="button"
            class="btn btn--ghost"
            disabled={isDefaultFilters(filters)}
            onClick={() => p.onChange(emptyFilters())}
          >
            Clear all
          </button>
          <button type="button" class="btn btn--accent" onClick={p.onClose}>
            Show {results.distinct} {results.distinct === 1 ? 'programme' : 'programmes'}
          </button>
        </div>
      </div>
    </>
  );
}
