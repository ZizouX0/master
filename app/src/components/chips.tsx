/**
 * What is left of the chips.
 *
 * The old build spent two full lines of every 390px card on five bordered pills — verdict, gate,
 * cost, language, level. The ChannelStrip now carries three of those five as marks in the left
 * gutter, at scroll speed and without a word, so the pills are gone. THAT TRADE IS THE WHOLE
 * DESIGN: the console carries the state, the document carries the words.
 *
 * Three things survive, because the strip cannot say them and the card still needs them:
 *
 *   1. `LevelChip` — kill-test rule 1. `isDegree === false` must be visible WITHOUT CLICKING and
 *      at title weight. 57 of those 137 records have "Master", "Máster" or "Mastère" in the
 *      programme name, so the title itself actively misleads; a quiet line underneath it loses.
 *      This is a fact about the award, not about the reading, so it is not the strip's job.
 *   2. `VerdictWord` — the mark always sits next to its word. Colour never travels alone, and a
 *      screen reader gets a word rather than an SVG. It is a panel legend, not a pill: no box,
 *      no fill, no border, Archivo caps at 0.14em.
 *   3. `Meta` — the raw strings. Cost, language and the gate as a mono line separated by `·`,
 *      because monospace in this app means one thing: THIS STRING IS RAW AND I HAVE NOT TOUCHED
 *      IT. `€1.5–5k/yr · ENGLISH · PORTFOLIO ONLY`.
 *
 * The old `VerdictChip` / `GateChip` / `CostChip` / `LangChip` names are kept below as thin
 * adapters onto the three above, so the five standing views keep compiling and keep looking like
 * one app while they are rebuilt. They render no pill and no border. Delete each call site as
 * its view moves onto `Meta` and the strip.
 */

import type { JSX } from 'preact';
import type { AuditionSource } from '../types';
import { hasConfirmedAudition, hasSuspectedAudition } from '../data/filters';

// ─────────────────────────────────────────────────────────────────────────────
// 1 · The verdict word — the legend beside the meter
// ─────────────────────────────────────────────────────────────────────────────

const VERDICT_WORD: Record<string, { word: string; variant: string; title: string }> = {
  'WORTH IT': {
    word: 'Worth it',
    variant: 'worth',
    title: 'Read on the official page and judged worth it.',
  },
  CONDITIONAL: {
    word: 'Conditional',
    variant: 'cond',
    title: 'Read on the official page. Worth it only if something specific resolves.',
  },
  AVOID: {
    word: 'Avoid',
    variant: 'avoid',
    title: 'Read on the official page and ruled out.',
  },
};

/**
 * `verdict` is `''` on 249 of 398 records. That is a state, not a missing value, and it gets the
 * one treatment that can never be mistaken for a verdict: no colour at all. The meter block in
 * the gutter is likewise absent, and the rail beside it is broken into dashes.
 */
export function VerdictWord(p: { verdict: string; size?: 'sm' | 'lg' }): JSX.Element {
  const v = VERDICT_WORD[p.verdict];
  const big = p.size === 'lg' ? ' t-verdict' : '';
  if (!v) {
    return (
      <span
        class={'vword vword--none' + big}
        title="Nobody has opened this institution’s official page. Everything here came from a listing."
      >
        Not checked
      </span>
    );
  }
  return (
    <span class={'vword vword--' + v.variant + big} title={v.title}>
      {v.word}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · The metadata line — raw strings, mono, separated by ·
// ─────────────────────────────────────────────────────────────────────────────

/** "EUR 1.5k-5k/yr" → "€1.5k–5k/yr". Mono, so it reads as a figure someone recorded. */
export function bandLabel(band: string): string {
  if (!band) return 'no band recorded';
  if (band === 'Not published') return 'no price published';
  return band.replace(/EUR\s*/g, '€').replace(/-/g, '–');
}

/**
 * Short gate labels. The 390px column cannot carry "Portfolio + exam/interview" beside a cost
 * and a language, and the ladder in the gutter is already carrying the height of the climb —
 * this line only has to name it.
 */
export function gateLabel(p: {
  gate: string;
  needsAudition?: boolean;
  auditionSource?: AuditionSource;
}): { text: string; weak: boolean } {
  const rec = { gate: p.gate ?? '', auditionSource: (p.auditionSource ?? '') as AuditionSource };
  // Records 253, 254, 258, 259 and 260 carry an ordinary gate string while a verified correction
  // found a live piano test. `hasConfirmedAudition` is the rule from data/filters.ts, imported
  // rather than restated, because a looser copy of it is exactly what puts a live-performance
  // programme into a "no audition" list.
  if (hasConfirmedAudition(rec)) return { text: 'Live audition', weak: false };
  if (hasSuspectedAudition(rec) || p.needsAudition === true) {
    return { text: 'Audition? unconfirmed', weak: true };
  }
  const gate = rec.gate;
  if (/portfolio \+ exam/i.test(gate)) return { text: 'Portfolio + test', weak: false };
  if (/portfolio only/i.test(gate)) return { text: 'Portfolio only', weak: false };
  if (/exam\/interview only/i.test(gate)) return { text: 'Test / interview', weak: false };
  if (/not published/i.test(gate)) return { text: 'Gate not published', weak: true };
  if (/none found/i.test(gate)) return { text: 'No gate in the text', weak: true };
  return { text: gate || 'Gate unknown', weak: true };
}

/** One segment of the metadata line. Exported so a view can compose its own order. */
export function MetaSeg(p: {
  children: JSX.Element | string | (JSX.Element | string)[];
  variant?: 'blocked' | 'wrong' | '';
  title?: string;
}): JSX.Element {
  return (
    <span class={'meta__seg' + (p.variant ? ' meta__seg--' + p.variant : '')} title={p.title}>
      <span class="meta__t">{p.children}</span>
    </span>
  );
}

/**
 * The card's whole metadata line, in one place so the rules can only be got wrong once.
 *
 * `costDisputed` is kill-test rule 4. Where verified prose contradicts the recorded band —
 * Edinburgh still says "Under EUR 1.5k/yr" against a real ≈£29,900 — the figure is struck in
 * china-marker red and the line says so. A wrong number shown quietly is worse than no number.
 */
export function Meta(p: {
  costBand?: string;
  costDisputed?: string;
  language?: string;
  languageOk?: boolean;
  gate?: string;
  needsAudition?: boolean;
  auditionSource?: AuditionSource;
}): JSX.Element {
  const band = p.costBand ?? '';
  const disputed = (p.costDisputed ?? '') !== '';
  const gate = gateLabel({ gate: p.gate ?? '', needsAudition: p.needsAudition, auditionSource: p.auditionSource });

  return (
    <span class="meta">
      {disputed ? (
        <MetaSeg variant="wrong" title="Verified prose contradicts this band — read the correction on the record.">
          <span class="meta__struck">{bandLabel(band)}</span> wrong — see correction
        </MetaSeg>
      ) : (
        <MetaSeg title={band || 'no cost band recorded'}>{bandLabel(band)}</MetaSeg>
      )}

      {p.language !== undefined && (
        <MetaSeg
          variant={p.languageOk === false ? 'blocked' : ''}
          title={
            p.languageOk === false
              ? `Taught in ${p.language}. You do not have it.`
              : `Taught in ${p.language || 'a language nobody recorded'}.`
          }
        >
          {p.language || 'language not stated'}
        </MetaSeg>
      )}

      {p.gate !== undefined && <MetaSeg title={p.gate}>{gate.text}</MetaSeg>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Level — the one piece of state that is not the strip's to carry
// ─────────────────────────────────────────────────────────────────────────────

const NOT_DEGREE_LINE: Record<string, string> = {
  'Not a degree': 'It awards a certificate, not a master’s. No student visa route.',
  'Funding scheme': 'This is money, not a course.',
  'Aggregate entry': 'A listing page, not a single programme.',
  'Master di I livello (60 CFU)': 'An Italian first-level master — not a second-cycle degree.',
  'Bachelor / first cycle': 'Bachelor level. Below the degree you already have.',
  Unclear: 'Nobody could confirm whether this awards a degree.',
};

/**
 * Kill-test rule 1. A degree gets a quiet line of micro type; a non-degree gets a banner at
 * title weight with a hatched edge, which stays unmistakable in greyscale and at scrolling
 * speed. It changes SHAPE, not colour — the colour is only confirming what the shape said.
 */
export function LevelChip(p: { level: string; isDegree?: boolean }): JSX.Element {
  const level = p.level || 'level not recorded';
  if (p.isDegree === false) {
    const why = NOT_DEGREE_LINE[level];
    // The level is echoed only when it says something the headline does not: "Master di I
    // livello", "Bachelor / first cycle", "Funding scheme".
    const echo = level === 'Not a degree' ? '' : ' — ' + level;
    return (
      <strong class="notdegree" title={`level: ${level}`}>
        <span>
          This is not a master’s degree
          <span class="notdegree__what">
            {echo}
            {why ? (echo ? '. ' : ' — ') + why : ''}
          </span>
        </span>
      </strong>
    );
  }
  return (
    <span class="levelchip" title={`level: ${level}`}>
      {level}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapters for the standing views. No pills, no borders — each renders into the
// vocabulary above. Delete the call site, then delete the adapter.
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated The ChannelStrip carries the verdict; use `VerdictWord` beside its meter. */
export function VerdictChip(p: { verdict: string }): JSX.Element {
  return <VerdictWord verdict={p.verdict} />;
}

/** @deprecated The ladder carries the climb; the word belongs in `Meta`. */
export function GateChip(p: {
  gate: string;
  needsAudition?: boolean;
  auditionSource?: string;
}): JSX.Element {
  const g = gateLabel({
    gate: p.gate,
    needsAudition: p.needsAudition,
    auditionSource: (p.auditionSource ?? '') as AuditionSource,
  });
  return (
    <span class="meta">
      <MetaSeg title={p.gate}>{g.text}</MetaSeg>
    </span>
  );
}

/** @deprecated Money is a raw string on the metadata line; use `Meta`. */
export function CostChip(p: { band: string; disputed?: boolean }): JSX.Element {
  return (
    <span class="meta">
      {p.disputed ? (
        <MetaSeg variant="wrong" title="Verified prose contradicts this band — read the correction on the record.">
          <span class="meta__struck">{bandLabel(p.band ?? '')}</span> wrong — see correction
        </MetaSeg>
      ) : (
        <MetaSeg title={p.band || 'no cost band recorded'}>{bandLabel(p.band ?? '')}</MetaSeg>
      )}
    </span>
  );
}

/** @deprecated Language is a raw string on the metadata line; use `Meta`. */
export function LangChip(p: { language: string; ok?: boolean }): JSX.Element {
  const language = p.language || 'language not stated';
  return (
    <span class="meta">
      <MetaSeg
        variant={p.ok === false ? 'blocked' : ''}
        title={p.ok === false ? `Taught in ${language}. You do not have it.` : `Taught in ${language}.`}
      >
        {language}
      </MetaSeg>
    </span>
  );
}
