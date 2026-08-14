/**
 * FIND — search, the filters that survived, and the record beside the list.
 *
 * What was here before was a browse list: 13.3 screens of scroll, nine facets, three sorts, none
 * of them time. He is choosing among roughly fourteen targets, not 326, and faceting fields that
 * are 59% corrected and 68% unchecked manufactures a confidence the data cannot support. So the
 * facet rail is gone and what is left is the search — which already reads all the prose — plus
 * the six switches that actually decide something.
 *
 * Three things this screen owes him:
 *
 *  1. **The record opens beside the list, not on top of it.** That is the whole argument for a
 *     laptop: he is comparing Basel against Köln against İTÜ, and a spreadsheet cannot hold the
 *     comparison and the prose at once. Below 1080px the pane is not a pane — the same route
 *     renders as its own page.
 *  2. **The completeness rule.** When a filter is hiding matches, the app names the number and
 *     offers to reveal them. It never says "that is all 7" while the strongest target in the
 *     corpus sits behind a default — which is exactly what searching "Basel" used to do.
 *  3. **Counts are distinct programmes.** ICMP's three rows are one programme. `distinctCount`
 *     via the pipeline, everywhere, never `.length`.
 */

import type { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { useStore } from '../store';
import type { ProgrammeIndex } from '../types';
import {
  emptyFilters,
  isDefaultFilters,
  predicatesFor,
  runPipeline,
  type AuditionCertainty,
  type FilterState,
} from '../data/filters';
import { encodeFilters } from '../components/Filters';
import { ChannelStrip } from '../components/ChannelStrip';
import { LevelChip, Meta, VerdictWord } from '../components/chips';
import { Invite, Screen, useWide, type Tab } from './kit';
import { RecordDocument, recordHref, resolveRecord } from './Record';
import { Throw, ThrowScale } from './Throw';

const ALL_AUDITION: AuditionCertainty[] = ['confirmed', 'suspected', 'none-found'];
const PAGE = 30;

// ─────────────────────────────────────────────────────────────────────────────
// One row of the list
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One channel in the list. Three lines and the strip — the four things he scans by.
 *
 * Everything the old card carried below this (the sentence of a human's reasoning, the duplicate
 * note, the whole document) is in the pane on the right, once, rather than 398 times down a
 * column. What could NOT move, and did not: the not-a-degree banner at title weight, the strip's
 * three readings, and the struck-through cost band with "wrong — see correction" beside it.
 */
function Row(p: { row: ProgrammeIndex; selected: boolean }): JSX.Element {
  const r = p.row;
  return (
    <a
      class={
        'card v-list__row' +
        (r.verdict === 'AVOID' ? ' card--avoid' : '') +
        (p.selected ? ' v-sel' : '')
      }
      href={recordHref(r)}
      aria-current={p.selected ? 'true' : undefined}
    >
      <div class="channel channel--card">
        <div class="channel__strip">
          <ChannelStrip
            verdict={r.verdict}
            gate={r.gate}
            needsAudition={r.needsAudition}
            auditionSource={r.auditionSource}
            hasVerifiedDispute={r.hasVerifiedDispute}
            costDisputed={r.costDisputed}
            isDegree={r.isDegree}
          />
        </div>
        <div class="channel__body">
          {/* Rule 1: visible without clicking, at title weight, above the title. It costs this
              row a line, and it should: it is the loudest true thing about the record. */}
          {r.isDegree === false ? <LevelChip level={r.level} isDegree={false} /> : null}
          <h3 class="t-cardtitle v-2line">{r.programme || 'No programme name recorded'}</h3>
          <p class="v-list__where v-1line">
            <b>{r.institution || 'Institution not recorded'}</b>
            {r.city ? ' · ' + r.city : ''}
            {r.country ? ' · ' + r.country : ''}
          </p>
          {/* The verdict word rides on the metadata line rather than above it. Colour never
              travels alone — the word is always beside the meter — but on a scan row it does not
              need a line of its own, and a line of its own is 20px times 331. */}
          <span class="meta" style="margin-top:6px">
            <VerdictWord verdict={r.verdict} />
            <Meta
              costBand={r.costBand}
              costDisputed={r.costDisputed}
              language={r.language}
              languageOk={r.languageOk}
              gate={r.gate}
              needsAudition={r.needsAudition}
              auditionSource={r.auditionSource}
            />
          </span>
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The filters that survived, and the completeness rule they owe
// ─────────────────────────────────────────────────────────────────────────────

const HIDES: Record<string, string> = {
  degreeOnly: 'do not award a master’s degree',
  languageOnly: 'are taught in a language you do not read',
  cheapOnly: 'cost more than €5k a year, or have a cost their own page contradicts',
  verifiedOnly: 'were never checked against an official page',
  audition: 'have a confirmed live audition',
  disputes: 'carry no recorded contradiction',
};

/** Every active constraint, with what dropping it would give back. Never a silent omission. */
function hiding(
  index: readonly ProgrammeIndex[],
  filters: FilterState,
  shown: number,
): Array<{ label: string; gain: number; without: FilterState }> {
  const out: Array<{ label: string; gain: number; without: FilterState }> = [];
  for (const p of predicatesFor(filters)) {
    let without: FilterState;
    if (p.name === 'audition') without = { ...filters, audition: ALL_AUDITION.slice() };
    else if (p.name === 'disputes') without = { ...filters, disputes: [] };
    else if (p.name in HIDES || p.name === 'degreeOnly') without = { ...filters, [p.name]: false } as FilterState;
    else without = { ...filters, facets: { ...filters.facets, [p.name]: [] } };
    const gain = runPipeline(index, without).distinct - shown;
    if (gain > 0) {
      out.push({ label: HIDES[p.name] ?? `are filtered out by ${p.name}`, gain, without });
    }
  }
  return out.sort((a, b) => b.gain - a.gain);
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

// ─────────────────────────────────────────────────────────────────────────────

export default function Find(p: { tabs: Tab[]; path: string; shown?: number }): JSX.Element {
  const status = useStore((s) => s.status);
  const index = useStore((s) => s.index);
  const detailStatus = useStore((s) => s.detailStatus);
  const results = useStore((s) => s.results);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const navigate = useStore((s) => s.navigate);
  const wide = useWide();

  const selected = useMemo(() => resolveRecord(p.path, index), [p.path, index]);
  const limit = p.shown ?? PAGE;

  /** One place writes the URL, so the hash stays the truth and a search stays shareable. */
  const go = (next: FilterState) => {
    setFilters(next);
    const qs = encodeFilters(next);
    navigate('/find' + (qs ? '?' + qs : ''), true);
  };

  const rows = results.rows as ProgrammeIndex[];
  const hidden = useMemo(
    () => (status === 'ready' ? hiding(index, filters, results.distinct) : []),
    [index, filters, results.distinct, status],
  );

  const activeCount = predicatesFor(filters).length;
  const page = rows.slice(0, limit);

  const console_ = (
    <div class="v-col v-console">
      <label class="v-label" for="find-q" style="margin-top:0">
        Search every field, including the prose
      </label>
      <input
        id="find-q"
        class="search"
        type="search"
        placeholder="“acoustic source”, “no German”, RNCP, Köln"
        value={filters.q}
        onInput={(e) => go({ ...filters, q: (e.target as HTMLInputElement).value })}
      />
      {detailStatus !== 'ready' ? (
        <p class="v-src">
          The prose is still loading, so the search is running on names, cities and gates only. The 22 long
          fields join it in a moment.
        </p>
      ) : null}

      <details class="v-filters">
        <summary>
          Filters {activeCount > 0 ? `· ${activeCount} on` : '· none on'}
        </summary>
        <div class="v-filters__body">
          <Switch
            on={filters.degreeOnly}
            label="Real master’s degrees only"
            hint="130 of the 398 are sold as a master’s and are not one."
            onToggle={() => go({ ...filters, degreeOnly: !filters.degreeOnly })}
          />
          <Switch
            on={!filters.audition.includes('confirmed')}
            label="Hide confirmed live auditions"
            hint="A production test is not an audition. Only a confirmed live performance test is hidden."
            onToggle={() =>
              go({
                ...filters,
                audition: filters.audition.includes('confirmed') ? emptyFilters().audition : ALL_AUDITION.slice(),
              })
            }
          />
          <Switch
            on={filters.languageOnly}
            label="Taught in a language you have"
            hint="English or French. You have no German."
            onToggle={() => go({ ...filters, languageOnly: !filters.languageOnly })}
          />
          <Switch
            on={filters.cheapOnly}
            label="€5k a year or less"
            hint="Cost-disputed records are dropped whatever their band says — Edinburgh’s ≈£29,900 still sits in a cheap band."
            onToggle={() => go({ ...filters, cheapOnly: !filters.cheapOnly })}
          />
          <Switch
            on={filters.verifiedOnly}
            label="Checked against their own page only"
            hint="249 of 398 were never checked. Checked does not mean good — most of the checked ones are AVOID."
            onToggle={() => go({ ...filters, verifiedOnly: !filters.verifiedOnly })}
          />
          <Switch
            on={!filters.dedupe}
            label="Show duplicate rows"
            hint="Off: one card per programme, ICMP’s three rows counted once. On: all 398 source rows."
            onToggle={() => go({ ...filters, dedupe: !filters.dedupe })}
          />
          {!isDefaultFilters(filters) ? (
            <p style="margin-top:12px">
              <button type="button" class="btn btn--sm" onClick={() => go(emptyFilters())}>
                Clear everything
              </button>
            </p>
          ) : null}
        </div>
      </details>

      {/* Wide: the counts as a scale here, the fall itself in the pane where it fits.
          Narrow: there is no pane, so the throw runs here at the size styles.css sizes it for
          a 390px column (--throw-length drops to 380px below 720px). */}
      {wide ? (
        <>
          <p class="v-label">How 355 becomes 14</p>
          <ThrowScale onPick={go} />
          <p class="v-src">
            {selected ? (
              <a href="#/find">See the whole fall, with its reasons →</a>
            ) : (
              'The fall, and what each stop costs you, is on the right.'
            )}
          </p>
        </>
      ) : (
        <Throw onPick={go} />
      )}
    </div>
  );

  const list = (
    <div class="v-col v-hold">
      <p class="v-label" aria-live="polite" style="margin-top:0">
        {results.distinct} {results.distinct === 1 ? 'programme' : 'programmes'}
        {results.rows.length !== results.distinct ? ` · ${results.rows.length} rows` : ''}
      </p>

      {page.length === 0 ? (
        <Invite lead="Nothing matches all of those at once.">
          {hidden.length > 0 ? (
            hidden.map((h) => (
              <p key={h.label}>
                {h.gain} more {h.gain === 1 ? 'programme' : 'programmes'} {h.label}.{' '}
                <a href="#/find" onClick={() => go(h.without)}>
                  Show {h.gain === 1 ? 'it' : 'them'}
                </a>
              </p>
            ))
          ) : (
            <p>Nothing in the corpus carries that word. Try one of theirs — “Tonmeister”, “Musikregie”, “sound design”.</p>
          )}
        </Invite>
      ) : (
        page.map((r) => <Row key={r.key} row={r} selected={selected?.key === r.key} />)
      )}

      {rows.length > limit ? (
        <p class="v-src" style="margin-top:16px">
          {limit} of {rows.length} rows shown. Narrow the search rather than scrolling — the prose is
          searchable, so their own phrasing finds them.
        </p>
      ) : null}

      {/* The completeness rule. Never "that is all N" while a match sits behind a default. */}
      {page.length > 0 ? (
        <div style="margin-top:16px">
          {hidden.length === 0 ? (
            <p class="v-src">That is all {results.distinct}, with nothing held back by a filter.</p>
          ) : (
            hidden.map((h) => (
              <p class="v-src" key={h.label}>
                <strong>{h.gain} more</strong> {h.gain === 1 ? 'programme matches' : 'programmes match'} and{' '}
                {h.gain === 1 ? 'is' : 'are'} hidden because {h.gain === 1 ? 'it' : 'they'} {h.label}.{' '}
                <a href="#/find" onClick={() => go(h.without)}>
                  Show {h.gain === 1 ? 'it' : 'them'} →
                </a>
              </p>
            ))
          )}
        </div>
      ) : null}
    </div>
  );

  const pane = (
    <div class="v-col">
      {selected ? (
        <RecordDocument row={selected} />
      ) : (
        <>
          <Invite lead="Pick one on the left and it opens here, beside the list.">
            <p>
              The list stays where it is while you read, so you can put Basel against Köln against İTÜ
              without losing your place. That is the one thing neither the spreadsheet nor a phone can do.
            </p>
          </Invite>
          <p class="v-label" style="margin-top:24px">
            Until then: how 355 becomes 14
          </p>
          <Throw onPick={go} />
        </>
      )}
    </div>
  );

  if (status !== 'ready') {
    return (
      <Screen title="Find" tabs={p.tabs} path={p.path}>
        <div class="v-col">
          <p class="t-prose">{status === 'error' ? 'The records did not load.' : 'Reading 398 records…'}</p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      title={selected ? selected.programme || 'Record' : 'Find'}
      tabs={p.tabs}
      path={p.path}
      layout="find"
      footer={
        <p>
          Search reads institution, programme, city, country and the twelve prose fields including
          `correction` and `verdictWhy`. Counts are distinct programmes, not rows.
        </p>
      }
    >
      {console_}
      {list}
      {wide ? pane : null}
    </Screen>
  );
}
