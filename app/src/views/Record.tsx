/**
 * The record page — the most important screen in the app.
 *
 * Field order is BUILD-SPEC §Record page, and the order is not cosmetic: it is
 * "what disqualifies fastest, and what was actually checked, before anything a
 * machine guessed".
 *
 * The four things this file exists to get right:
 *
 *  1. `correction` (workbook column G) is rendered IN FULL, inside the verdict block,
 *     above the money. Omitting that column is the defect that killed the previous
 *     attempt at this app.
 *  2. The three disputes are each shown with the phrase that triggered them and labelled
 *     confirmed or suspected. `costDisputed` and `existenceDisputed` only ever fire from
 *     verified `correction` prose; `auditionDisputed` fires from either, and its
 *     provenance is in `auditionSource`. A suspicion must never wear the authority of a
 *     confirmation.
 *  3. "DUPLICATE of index N" inside a correction is printed and never dereferenced. All
 *     65 of those pointers cross a country boundary — they are stale ids from the source
 *     workbook's id space.
 *  4. The recorded `chance` / `whyChance` render last and visibly subordinate. A verdict
 *     is a human reading the official page; `chance` is a heuristic over a search blurb,
 *     and it is wrong on 28 of the records where both exist.
 *
 * Everything textual goes through `Field`, which renders through `renderField()`, so a
 * value, an explicit `UNVERIFIED` and an uncollected field never look alike. Deadlines go
 * through `deadlineDisplay()`, which refuses to emit a bare date for a `PRIOR CYCLE`
 * string.
 *
 * This file also carries the small shared furniture the other three views import — the
 * scoped `rec-` stylesheet, the section/strip/block primitives and the personal-state
 * controls. It lives here rather than in `src/components/` because that directory belongs
 * to the shell agent; the `rec-` prefix guarantees no collision with `styles.css`.
 */

import type { ComponentChildren } from 'preact';
import { useMemo } from 'preact/hooks';
import { useStore } from '../store';
import { STATUSES, type ProgrammeDetail, type ProgrammeIndex, type Status } from '../types';
import { auditionCertainty } from '../data/filters';
import {
  deadlineDisplay,
  formatTimestamp,
  hasValue,
  mentionsStaleDuplicatePointer,
  pluralise,
  renderField,
  splitUrls,
} from '../lib/format';
import { CostChip, GateChip, LangChip, LevelChip, VerdictChip } from '../components/chips';
import { Field, FieldGroup } from '../components/Field';
import { Empty, Page } from '../components/Layout';

// ─────────────────────────────────────────────────────────────────────────────
// Shared furniture. `styles.css` belongs to the shell agent; everything here is
// `rec-`-prefixed and reads the shell's custom properties with a fallback, so the two
// stylesheets compose instead of fighting.
// ─────────────────────────────────────────────────────────────────────────────

const REC_CSS = `
/* The shell's .page owns the measure and the 20px gutters; this only adds the clearance the
   fixed 56px tab bar needs, so the last line of a record is never under it. */
.rec-wrap { max-width: 100%; padding: 0 0 4.5rem; }
.rec-back { display: inline-block; font-size: 0.8125rem; margin: 0 0 1rem; color: var(--accent, #1f6f6b); }
.rec-h1 { font: 600 1.375rem/1.25 var(--serif, Iowan Old Style, Charter, Georgia, serif); margin: 0 0 0.25rem; }
.rec-inst { font-size: 0.9375rem; margin: 0 0 0.25rem; }
.rec-where { font-size: 0.8125rem; color: var(--muted, #6a6a6a); margin: 0; }
.rec-section { margin: 2rem 0 0; }
.rec-h2 { font: 600 0.6875rem/1.4 var(--sans, system-ui, sans-serif); letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted, #6a6a6a); margin: 0 0 0.75rem;
  padding-bottom: 0.375rem; border-bottom: 1px solid var(--rule, rgba(0,0,0,0.12)); }
.rec-h3 { font: 600 0.875rem/1.3 var(--sans, system-ui, sans-serif); margin: 1rem 0 0.375rem; }
.rec-block { border-left: 3px solid var(--rule, rgba(0,0,0,0.2)); padding: 0.625rem 0 0.625rem 0.75rem;
  margin: 0 0 1rem; }
.rec-block-red { border-left-color: var(--red, #b3261e); }
.rec-block-amber { border-left-color: var(--amber, #8a5a00); }
.rec-block-green { border-left-color: var(--green, #1f7a44); }
.rec-block-grey { border-left-color: var(--rule, rgba(0,0,0,0.25)); }
.rec-tone-red { border-left-color: var(--red, #b3261e); }
.rec-tone-amber { border-left-color: var(--amber, #8a5a00); }
.rec-tone-blue { border-left-color: var(--accent, #1f6f6b); }
.rec-tone-grey, .rec-tone-none { border-left-color: var(--rule, rgba(0,0,0,0.25)); }
.rec-banner { display: block; font: 600 0.9375rem/1.3 var(--sans, system-ui, sans-serif);
  color: var(--red, #b3261e); border: 1px solid var(--red, #b3261e); border-radius: 2px;
  padding: 0.5rem 0.625rem; margin: 0 0 0.75rem; }
.rec-label { font: 600 0.6875rem/1.4 var(--sans, system-ui, sans-serif); letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--muted, #6a6a6a); margin: 0 0 0.25rem; }
.rec-note { font-size: 0.8125rem; line-height: 1.5; color: var(--muted, #6a6a6a); margin: 0.25rem 0; }
.rec-say { font-size: 0.9375rem; line-height: 1.55; margin: 0.25rem 0; }
.rec-quote { font: 0.9375rem/1.55 var(--serif, Iowan Old Style, Charter, Georgia, serif);
  margin: 0.25rem 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.rec-mono { font: 0.8125rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow-wrap: anywhere; }
.rec-sub { font-size: 0.8125rem; color: var(--muted, #6a6a6a); }
.rec-tag { display: inline-block; font: 600 0.6875rem/1 var(--sans, system-ui, sans-serif);
  letter-spacing: 0.04em; text-transform: uppercase; border: 1px solid currentColor;
  border-radius: 2px; padding: 0.25rem 0.375rem; margin: 0 0.375rem 0.25rem 0; }
.rec-tag-confirmed { color: var(--red, #b3261e); }
.rec-tag-suspected { color: var(--amber, #8a5a00); }
.rec-tag-neutral { color: var(--muted, #6a6a6a); }
.rec-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; margin: 0.5rem 0; }
.rec-controls { border: 1px solid var(--rule, rgba(0,0,0,0.12)); border-radius: 3px;
  padding: 0.75rem; margin: 1rem 0 0; }
.rec-controls-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin: 0 0 0.5rem; }
.rec-btn { min-height: 44px; font: 0.875rem/1 var(--sans, system-ui, sans-serif);
  padding: 0 0.75rem; border: 1px solid var(--rule, rgba(0,0,0,0.3)); border-radius: 3px;
  background: transparent; color: inherit; cursor: pointer; }
.rec-btn-on { border-color: var(--accent, #1f6f6b); color: var(--accent, #1f6f6b); font-weight: 600; }
.rec-select, .rec-input { min-height: 44px; width: 100%; font: 0.875rem/1.3 var(--sans, system-ui, sans-serif);
  padding: 0.5rem; border: 1px solid var(--rule, rgba(0,0,0,0.3)); border-radius: 3px;
  background: transparent; color: inherit; box-sizing: border-box; }
.rec-textarea { width: 100%; min-height: 5.5rem; font: 0.875rem/1.45 var(--sans, system-ui, sans-serif);
  padding: 0.5rem; border: 1px solid var(--rule, rgba(0,0,0,0.3)); border-radius: 3px;
  background: transparent; color: inherit; box-sizing: border-box; resize: vertical; }
.rec-export { width: 100%; min-height: 12rem; font: 0.75rem/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 0.5rem; border: 1px solid var(--rule, rgba(0,0,0,0.3)); border-radius: 3px;
  background: transparent; color: inherit; box-sizing: border-box; white-space: pre; }
.rec-item { border-top: 1px solid var(--rule, rgba(0,0,0,0.12)); padding: 0.875rem 0; }
.rec-item:first-child { border-top: 0; }
.rec-link { color: var(--accent, #1f6f6b); overflow-wrap: anywhere; }
.rec-demote { opacity: 0.8; border-top: 1px solid var(--rule, rgba(0,0,0,0.12)); margin-top: 2rem;
  padding-top: 0.75rem; }
.rec-warn { border: 1px dashed var(--amber, #8a5a00); color: var(--amber, #8a5a00);
  padding: 0.5rem 0.625rem; font-size: 0.8125rem; line-height: 1.45; margin: 0.75rem 0; }
.rec-count { font-variant-numeric: tabular-nums; }
.rec-scroll { overflow-x: auto; }
@media (max-width: 420px) { .rec-h1 { font-size: 1.25rem; } }
`;

const STYLE_ID = 'rec-styles';

/**
 * The stylesheet goes into `<head>` imperatively rather than into the view tree, because a
 * `<style>` rendered by a view dies with that view: switching from the record page to Money
 * would unmount it and leave the next view unstyled. In `<head>` it is written once, when
 * this chunk loads, and it stays.
 */
function ensureRecStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = REC_CSS;
  document.head.appendChild(el);
}

ensureRecStyles();

/** Kept as a component so every view declares its dependency on these rules at its top. */
export function RecStyles() {
  ensureRecStyles();
  return null;
}

export function Section({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <section class="rec-section">
      <h2 class="rec-h2">{label}</h2>
      {children}
    </section>
  );
}

export function BackLink({ href, children }: { href: string; children: ComponentChildren }) {
  return (
    <a class="rec-back" href={href}>
      ← {children}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal state controls — status, note, next action. Shared with My list.
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<Status, string> = {
  none: 'Not tracked',
  shortlist: 'Shortlist',
  emailed: 'Emailed them',
  applying: 'Applying',
  applied: 'Applied',
  rejected: 'Rejected',
  'ruled-out': 'Ruled out',
};

/**
 * Writes straight to the store, which keys on `row.key` — hash(institution + programme +
 * url). Never on `id`: `id` is positional and every record after an inserted one shifts by
 * one on the next export, so an id-keyed note silently reattaches to another programme.
 */
export function PersonalControls({ recordKey }: { recordKey: string }) {
  const entry = useStore((s) => s.personal.entries[recordKey]);
  const setStatus = useStore((s) => s.setStatus);
  const setNote = useStore((s) => s.setNote);
  const setNextAction = useStore((s) => s.setNextAction);
  const status: Status = entry?.status ?? 'none';
  const starred = status !== 'none';

  return (
    <div class="rec-controls">
      <div class="rec-controls-row">
        <button
          type="button"
          class={starred ? 'rec-btn rec-btn-on' : 'rec-btn'}
          aria-pressed={starred}
          onClick={() => setStatus(recordKey, starred ? 'none' : 'shortlist')}
        >
          {starred ? '★ On my list' : '☆ Add to my list'}
        </button>
        <label class="rec-sub" for={`st-${recordKey}`}>
          Status
        </label>
        <select
          id={`st-${recordKey}`}
          class="rec-select"
          style="max-width: 12rem"
          value={status}
          onChange={(e) => setStatus(recordKey, (e.currentTarget as HTMLSelectElement).value as Status)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <label class="rec-label" for={`na-${recordKey}`}>
        Next action
      </label>
      <input
        id={`na-${recordKey}`}
        class="rec-input"
        type="text"
        placeholder="e.g. email them about the affine-subject rule"
        value={entry?.nextAction ?? ''}
        onInput={(e) => setNextAction(recordKey, (e.currentTarget as HTMLInputElement).value)}
      />
      <label class="rec-label" for={`nt-${recordKey}`} style="margin-top:0.75rem">
        My note
      </label>
      <textarea
        id={`nt-${recordKey}`}
        class="rec-textarea"
        placeholder="Your words. The facts on this page are not editable; this is."
        value={entry?.note ?? ''}
        onInput={(e) => setNote(recordKey, (e.currentTarget as HTMLTextAreaElement).value)}
      />
      {entry ? <p class="rec-note">Last edited {formatTimestamp(entry.updated)}. Stored in this browser only.</p> : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Route helpers
// ─────────────────────────────────────────────────────────────────────────────

export function recordHref(row: Pick<ProgrammeIndex, 'id'>): string {
  return `#/p/${row.id}`;
}

/** `#/p/:id` (positional, what the list links) and `#/g/:key` (durable across re-export). */
export function resolveRecord(
  path: string,
  index: readonly ProgrammeIndex[],
): ProgrammeIndex | undefined {
  const byId = /^\/p\/(\d+)$/.exec(path);
  if (byId) {
    const id = Number(byId[1]);
    return index.find((r) => r.id === id);
  }
  const byKey = /^\/g\/(.+)$/.exec(path);
  if (byKey) {
    const key = decodeURIComponent(byKey[1]!);
    return index.find((r) => r.key === key);
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Blocks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The deadline, always through `deadlineDisplay()`. 186 records say `PRIOR CYCLE`, and
 * most of those strings also contain a perfectly parseable date that belongs to the 2026
 * intake. `deadlineDisplay` never puts a date in its label unless it parsed one at or
 * after the target year, so nothing here can surface a bare stale date as a 2027 deadline.
 */
export function DeadlineBlock({ raw, label = 'Deadline' }: { raw: string; label?: string }) {
  const d = deadlineDisplay(raw);
  const caveat =
    d.kind === 'prior-cycle'
      ? 'This is a previous cycle. The 2027 date has not been published — confirm it with them.'
      : d.kind === 'unverified' || d.kind === 'none'
        ? 'Nobody confirmed a date. Treat the text below as a lead, not a deadline.'
        : d.kind === 'rolling'
          ? 'No fixed date published.'
          : d.kind === 'no-intake'
            ? 'The source says there is no intake to apply for.'
            : '';
  return (
    <div class={`rec-block rec-tone-${d.tone}`}>
      <p class="rec-label">
        {label} — {d.label}
      </p>
      {caveat ? <p class="rec-note">{caveat}</p> : null}
      <Field label="As recorded, verbatim" value={raw} wide />
    </div>
  );
}

/**
 * One dispute. `confirmed` means the phrase came out of verified `correction` prose;
 * `suspected` means it came out of the raw `audition` field, which nobody re-read. The two
 * are never given the same weight, and the phrase that fired is always shown, because a
 * suspicion he can disprove by reading two sentences is worth more than a hidden one.
 */
function Dispute({
  title,
  phrase,
  certainty,
  meaning,
}: {
  title: string;
  phrase: string;
  certainty: 'confirmed' | 'suspected';
  meaning: string;
}) {
  return (
    <div class={certainty === 'confirmed' ? 'rec-block rec-block-red' : 'rec-block rec-block-amber'}>
      <p class="rec-label">
        <span class={certainty === 'confirmed' ? 'rec-tag rec-tag-confirmed' : 'rec-tag rec-tag-suspected'}>
          {certainty}
        </span>
        {title}
      </p>
      <p class="rec-note">{meaning}</p>
      <Field label="The phrase that triggered it" value={phrase} wide />
    </div>
  );
}

/**
 * The audition rung, as the record page states it.
 *
 * `auditionCertainty` already promotes `gate: "AUDITION — hardest for you"` to confirmed,
 * which covers the 13 records whose `auditionSource` is empty or suspected. `needsAudition`
 * is folded in as well so that the five records the kill test names — 253, 254 (FAMU) and
 * 258, 259, 260 (Babelsberg), all of them `gate: "Exam/interview only"` or `"Portfolio
 * only"` and all of them free — can never render as reachable because their gate string
 * missed the live piano test that a verified correction found.
 */
export function auditionRung(row: ProgrammeIndex): 'confirmed' | 'suspected' | 'none-found' {
  if (row.needsAudition) return 'confirmed';
  return auditionCertainty(row);
}

function Disputes({ row }: { row: ProgrammeIndex }) {
  const certainty = auditionRung(row);
  const any = row.costDisputed !== '' || row.auditionDisputed !== '' || row.existenceDisputed !== '';
  if (!any) {
    return (
      <p class="rec-note">
        No contradiction was recorded between this record's structured fields and the prose.
      </p>
    );
  }
  return (
    <>
      {row.costDisputed !== '' ? (
        <Dispute
          title="The recorded cost is contradicted"
          phrase={row.costDisputed}
          certainty="confirmed"
          meaning={`The band still reads "${row.costBand}". A human re-read the official page and found that wrong, so this record is excluded from every cheap and free selection in the app — the correction below is the figure to trust.`}
        />
      ) : null}
      {row.auditionDisputed !== '' ? (
        <Dispute
          title="A live audition or ear test may be part of the entrance exam"
          phrase={row.auditionDisputed}
          certainty={certainty === 'confirmed' ? 'confirmed' : 'suspected'}
          meaning={
            certainty === 'confirmed'
              ? 'This came from verified prose or from the gate itself. Treat it as real: a performance audition is the one gate a twelve-month portfolio build cannot open.'
              : 'This phrase was matched in the raw `audition` field, which nobody re-checked against the official page. It is a lead, not a fact — two sentences of their page will settle it. Read the full audition text below before you act on it.'
          }
        />
      ) : null}
      {row.existenceDisputed !== '' ? (
        <Dispute
          title="Whether the programme still runs is contradicted"
          phrase={row.existenceDisputed}
          certainty="confirmed"
          meaning="Verified prose says this may be discontinued, suspended, or without an intake. Confirm it exists before spending a day on it."
        />
      ) : null}
    </>
  );
}

/**
 * The verdict block, with `correction` in full inside it — above the money, because a
 * correction usually invalidates the money.
 */
function VerdictBlock({ row, detail }: { row: ProgrammeIndex; detail: ProgrammeDetail | undefined }) {
  const verified = row.verdict !== '';
  const correction = detail?.correction ?? '';
  const stale = mentionsStaleDuplicatePointer(correction);

  return (
    <Section label="The verdict">
      {verified ? (
        <div class="rec-chips">
          <VerdictChip verdict={row.verdict} />
        </div>
      ) : (
        <div class="rec-block rec-block-grey">
          <p class="rec-label">Not checked</p>
          <p class="rec-say">
            Nobody has opened this institution's official page and read it. Everything below came
            from a search listing and may be out of date, wrong, or describe a different programme
            with a similar name. Treat every line as a lead, not a fact.
          </p>
        </div>
      )}

      {verified ? <Field label="Why" value={detail?.verdictWhy ?? ''} wide /> : null}

      {/*
        Column G of the workbook. It is mandatory: leaving it out is the exact defect that
        killed the previous console, and it is the field that most often overturns the cost
        band, the funding level or the entry route recorded above it.
      */}
      <div class="rec-block rec-block-red" style="margin-top:1rem">
        <p class="rec-label">Correction found — what was wrong in the earlier data</p>
        {stale ? (
          <p class="rec-note">
            This correction names another record by index. Those pointers are stale — they come
            from the source workbook's id space and every one of them crosses a country boundary,
            so the app prints the sentence and follows nothing. Do not go looking for that index.
          </p>
        ) : null}
        <Field label="Correction (workbook column G)" value={correction} wide />
      </div>
    </Section>
  );
}

/** The dedup group, with any disagreement between its rows stated rather than hidden. */
function GroupBlock({ row, index }: { row: ProgrammeIndex; index: readonly ProgrammeIndex[] }) {
  const members = useMemo(() => index.filter((r) => r.g === row.g), [index, row.g]);
  if (members.length < 2) return null;

  const fields: Array<{ label: string; get: (r: ProgrammeIndex) => string }> = [
    { label: 'Cost band', get: (r) => r.costBand },
    { label: 'Verdict', get: (r) => (r.verdict === '' ? 'not checked' : r.verdict) },
    { label: 'Gate', get: (r) => r.gate },
    { label: 'Level', get: (r) => r.level },
    { label: 'Language', get: (r) => r.language },
  ];
  const disagreements = fields
    .map((f) => ({ label: f.label, values: [...new Set(members.map(f.get))] }))
    .filter((d) => d.values.length > 1);

  return (
    <Section label="Other records for this programme">
      <p class="rec-say">
        {pluralise(members.length, 'source row')} describe this same programme. They came from
        different discovery sweeps with different field coverage, so the app counts them once and
        shows the fullest — but it does not quietly average them.
      </p>
      {disagreements.length > 0 ? (
        <div class="rec-block rec-block-amber">
          <p class="rec-label">These rows disagree with each other</p>
          {disagreements.map((d) => (
            <p class="rec-say" key={d.label}>
              <strong>{d.label}:</strong> {d.values.map((v) => (v === '' ? 'not collected' : v)).join(' · ')}
            </p>
          ))}
          <p class="rec-note">
            Nothing here resolves that. Take the correction and the official page as the authority,
            not the row with the friendliest number.
          </p>
        </div>
      ) : (
        <p class="rec-note">The rows agree on cost, verdict, gate, level and language.</p>
      )}
      <ul style="list-style:none;padding:0;margin:0.5rem 0 0">
        {members.map((m) => (
          <li class="rec-item" key={m.key}>
            <a class="rec-link" href={recordHref(m)}>
              {m.programme || '(no programme name)'}
            </a>
            <p class="rec-sub" style="margin:0.25rem 0 0">
              row {m.id} · {m.costBand} · {m.verdict === '' ? 'not checked' : m.verdict}
              {m.key === row.key ? ' · you are reading this one' : ''}
              {m.primary ? ' · shown in the list' : ''}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The page
// ─────────────────────────────────────────────────────────────────────────────

export default function Record() {
  const status = useStore((s) => s.status);
  const index = useStore((s) => s.index);
  const detailMap = useStore((s) => s.detail);
  const detailStatus = useStore((s) => s.detailStatus);
  const route = useStore((s) => s.route);

  const row = useMemo(() => resolveRecord(route.path, index), [route.path, index]);

  if (status !== 'ready') {
    return (
      <Page title="Record">
        <RecStyles />
        <div class="rec-wrap">
          <p class="rec-note">{status === 'error' ? 'The data did not load.' : 'Loading the records…'}</p>
        </div>
      </Page>
    );
  }

  if (!row) {
    return (
      <Page title="Record">
        <RecStyles />
        <div class="rec-wrap">
          <BackLink href="#/list">All programmes</BackLink>
          <Empty>
            No record at this address. A record link is either its workbook row number or its
            durable key — if you followed an old link, the row numbers moved when the data was
            re-exported, which is exactly why nothing personal is keyed on them.
          </Empty>
        </div>
      </Page>
    );
  }

  const detail: ProgrammeDetail | undefined = detailMap?.[row.key];
  const urls = splitUrls(detail?.url ?? '');
  const certainty = auditionRung(row);

  return (
    <Page title={row.programme || row.institution || 'Record'}>
      <RecStyles />
      <article class="rec-wrap">
        <BackLink href="#/list">All programmes</BackLink>

        {/* Rule 2: `isDegree: false` is visible without clicking, at the weight of the title. */}
        {!row.isDegree ? (
          <strong class="rec-banner">
            This is not a master's degree. It is recorded as “{row.level || 'award unclear'}”.
          </strong>
        ) : null}

        <h1 class="rec-h1">{row.programme || '(no programme name recorded)'}</h1>
        <p class="rec-inst">{row.institution || 'Institution not recorded'}</p>
        <p class="rec-where">
          {[row.city, row.country, row.region].filter(Boolean).join(' · ')} · row{' '}
          <span class="rec-count">{row.id}</span> in the workbook
        </p>

        <div class="rec-chips">
          <VerdictChip verdict={row.verdict} />
          <LevelChip level={row.level} isDegree={row.isDegree} />
          <CostChip band={row.costBand} disputed={row.costDisputed !== ''} />
          <GateChip gate={row.gate} needsAudition={row.needsAudition} auditionSource={row.auditionSource} />
          <LangChip language={row.language} ok={row.languageOk} />
        </div>

        <PersonalControls recordKey={row.key} />

        {detailStatus !== 'ready' ? (
          <p class="rec-warn">
            {detailStatus === 'error'
              ? 'The prose file did not load, so the long fields — the correction, the entry route, the portfolio brief — are missing from this page. Everything below is only the card-level data. Reload before you decide anything.'
              : 'The prose is still loading. The correction, entry route, portfolio brief and deadline appear as soon as it arrives.'}
          </p>
        ) : null}

        <VerdictBlock row={row} detail={detail} />

        <Section label="Contradictions found in this record">
          <Disputes row={row} />
        </Section>

        <GroupBlock row={row} index={index} />

        <Section label="Can I get in?">
          <div class="rec-chips">
            <GateChip gate={row.gate} needsAudition={row.needsAudition} auditionSource={row.auditionSource} />
          </div>
          <p class="rec-say">
            {certainty === 'confirmed'
              ? 'A live performance or ear test is confirmed here. This is the one gate a twelve-month portfolio build does not open.'
              : certainty === 'suspected'
                ? 'A phrase in the unchecked audition text looks like a live audition. Nobody confirmed it. Read the full text below before you rule this in or out.'
                : 'No audition phrase fired for this record — which is not the same as somebody confirming there is no audition.'}
          </p>
          <FieldGroup title="Getting in">
            <Field label="Audition / entrance test, in full" value={detail?.audition ?? ''} wide />
            <Field label="What you must submit (portfolio)" value={detail?.portfolio ?? ''} wide />
            <Field
              label="Does it accept a non-music bachelor?"
              value={detail?.acceptsNonMusic ?? ''}
              wide
            />
            <Field label="Entry requirements" value={detail?.entry ?? ''} wide />
          </FieldGroup>
        </Section>

        <Section label="What it costs">
          <div class="rec-chips">
            <CostChip band={row.costBand} disputed={row.costDisputed !== ''} />
          </div>
          {row.costDisputed !== '' ? (
            <p class="rec-warn">
              The band above is contradicted by the correction. It is shown because it is what the
              record says, not because it is true, and this programme is excluded from every cheap
              and free selection in the app.
            </p>
          ) : null}
          <FieldGroup title="Money">
            <Field label="Tuition" value={detail?.tuition ?? ''} wide />
            <Field label="Other fees" value={detail?.otherFees ?? ''} />
            <Field label="Total cost" value={detail?.totalCost ?? ''} />
            <Field label="Funding attached" value={row.funding} />
            <Field label="Scholarship" value={detail?.scholarship ?? ''} />
            <Field label="Scholarship detail" value={detail?.scholarshipDetail ?? ''} wide />
          </FieldGroup>
          <p class="rec-note">
            Money you bring with you is in <a class="rec-link" href="#/money">the 120 funding schemes</a>.
          </p>
        </Section>

        <Section label="When">
          <DeadlineBlock raw={detail?.deadline ?? ''} />
          <Field label="Applications open" value={detail?.opens ?? ''} />
        </Section>

        <Section label="What it is">
          <FieldGroup title="The award">
            <Field label="Level" value={row.level} />
            <Field label="Qualification awarded" value={detail?.qualification ?? ''} wide />
            <Field label="Accreditation" value={detail?.accreditation ?? ''} wide />
            <Field label="Duration" value={detail?.duration ?? ''} />
            <Field label="Language of teaching" value={row.language} />
            <Field label="Language requirement" value={detail?.languageReq ?? ''} wide />
            <Field label="English test" value={detail?.englishTest ?? ''} />
            <Field label="What you would study" value={detail?.study ?? ''} wide />
            <Field label="Recommendation" value={detail?.recommendation ?? ''} wide />
          </FieldGroup>
          {!row.languageOk ? (
            <p class="rec-warn">
              Taught in {renderField(row.language).text}. That is not a language he reads — French
              fluent, English working, no German.
            </p>
          ) : null}
        </Section>

        <Section label="Source">
          {urls.length > 0 ? (
            <ul style="list-style:none;padding:0;margin:0">
              {urls.map((u) => (
                <li class="rec-item" key={u}>
                  <a class="rec-link rec-mono" href={u} rel="noreferrer noopener" target="_blank">
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Field label="Official page" value={detail?.url ?? ''} wide />
          )}
          <Field label="Found by" value={detail?.foundBy ?? ''} />
          <p class="rec-note">
            {row.verdict !== ''
              ? 'Checked against the official page.'
              : 'Never checked. Everything above came from a listing, not from them.'}
          </p>
        </Section>

        {/*
          Last, and deliberately quiet. `chance` is a heuristic over a scraped blurb; a verdict
          is a human reading the source. Where the two disagree the verdict wins, and 28 records
          rated Strong came back AVOID.
        */}
        <div class="rec-demote">
          <p class="rec-label">Unverified guess from the listing text</p>
          {hasValue(row.chance) ? (
            <p class="rec-sub">Automatic rating: {renderField(row.chance).text}</p>
          ) : (
            <p class="rec-sub">No automatic rating was recorded.</p>
          )}
          <p class="rec-sub" style="white-space:pre-wrap">
            {renderField(row.whyChance).text}
          </p>
          {row.verdict !== '' && row.chance === 'Strong' && row.verdict === 'AVOID' ? (
            <p class="rec-note">
              An automatic rating said Strong. The page was then read by hand and judged AVOID.
              Trust the second one.
            </p>
          ) : null}
        </div>
      </article>
    </Page>
  );
}
