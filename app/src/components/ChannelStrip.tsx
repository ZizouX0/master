/**
 * THE CHANNEL STRIP — the signature of the whole design.
 *
 * A 24px strip in the left gutter of every record, in the list and on the record page, carrying
 * three ORTHOGONAL truths in three different *kinds* of mark, so all three are legible at scroll
 * speed without reading a word:
 *
 *   ┌ rail line style ── was this ever read?   solid = verified · dashed = never checked
 *   │                                          · hatched = a verified dispute
 *   ├ meter block ───── what came back?        filled = worth it · hatched = conditional
 *   │                                          · struck = avoid · ABSENT = never checked
 *   └ gate ladder ───── how tall is the climb? rungs, bottom-up; broken top rung = audition;
 *                                              crossbar across the rail = prerequisite wall
 *
 * Why a meter and not a traffic light: a meter with no signal shows NOTHING, and that is exactly
 * what *never checked* deserves. 249 of 398 records were never read — the majority state — and
 * absence is the only honest rendering of it. It cannot read as green because it has no fill and
 * no hue at all; it cannot read as AVOID because AVOID is a box that has been crossed out and
 * this is no box. That fourth state comes free from the metaphor, which is the whole reason the
 * metaphor was chosen.
 *
 * How the two mark systems stay apart: the verdict lives at the TOP of the rail and is the only
 * thing in this app that is ever a filled shape with hue. The gate lives LOWER DOWN and is only
 * ever open strokes. Red appears in both and means the identical thing both times — you cannot
 * proceed — but verdict red is a BAR and gate red is a STROKE, and neither is ever a fill. A
 * gate mark can never be mistaken for a verdict because a gate mark is never solid.
 *
 * Drawing notes:
 *
 *  - Inline SVG, no images, no icon font, no <defs> and no ids — the component renders 40+ times
 *    per screen and an id would collide with itself.
 *  - The SVG carries no viewBox, so one user unit is one CSS pixel and the marks never scale.
 *    The rail is NOT drawn here: it is a CSS background on the same element (`.rail` in
 *    styles.css), which is how it runs the full height of a card or of a whole record page
 *    without anyone measuring anything.
 *  - Everything is legible in greyscale. The three meter hues sit within 0.0014 relative
 *    luminance of each other on purpose (see styles.css §2); desaturate the page and the marks
 *    are still four different shapes.
 *  - It carries an accessible name that is a SENTENCE, not three shapes. `describeStrip()` below
 *    is the single source of that sentence and is exported so a view can print it as help text.
 */

import type { JSX } from 'preact';
import type { AuditionSource, Verdict } from '../types';
import { hasConfirmedAudition, hasSuspectedAudition } from '../data/filters';

// ── geometry ─────────────────────────────────────────────────────────────────
// The 24px column, in CSS pixels from the top of the strip.

const RAIL_X = 7; // centre of the 2px rail
const METER_X = 2; // the block spans 2 → 12, centred on the rail
const METER_W = 10;
const METER_TOP = 2; // 0–2 is the cap bar's lane
const METER_H = 20;
const METER_BOTTOM = METER_TOP + METER_H;
const RUNG_END = 21; // rungs run from the rail out to 21 — 14px, inside the 24px column
const RUNG_GAP = 10; // rungs are 10px apart, built bottom-up
const LADDER_BASE = 62; // far enough below the meter that the two systems cannot blur

// ── the three readings ───────────────────────────────────────────────────────

export type RailStyle = 'solid' | 'dashed' | 'hatched';
export type MeterState = 'nominal' | 'over' | 'clip' | 'absent' | 'none';
export type LadderKind = 'rungs' | 'audition' | 'unknown' | 'unpublished';

export interface ChannelStripProps {
  /** '' on 249 of 398 records. Empty is a state, not a missing value. */
  verdict: Verdict | string;
  gate?: string;
  needsAudition?: boolean;
  auditionSource?: AuditionSource;
  /** Verified prose contradicts the recorded data — the rail is hatched. */
  hasVerifiedDispute?: boolean;
  /** The specific dispute that matters most often: the recorded cost band is wrong. */
  costDisputed?: string;
  /** `false` means it awards a certificate. There is no meter slot at all: it was never given
   *  a verdict, it was judged on its accreditation. */
  isDegree?: boolean;
  /** A prerequisite degree closes the door (Detmold, Copenhagen, CNSMD Paris): a bar is drawn
   *  across the whole channel, with the ladder above it left intact. Closed by a prerequisite,
   *  not by your ear — and a prerequisite is sometimes negotiable by equivalence. */
  prerequisiteWall?: boolean;
  /** Where the ladder's bottom rung sits, in px from the top. Raise it on the record page to
   *  put the ladder beside the entry section, which is the part of the page it explains. */
  ladderBase?: number;
  /** Drop the ladder entirely — the record page draws it once, beside "can you get in?", not
   *  again at the top of the document. */
  ladder?: boolean;
  class?: string;
}

/** Was this ever read? Line style, and nothing else, carries it. */
export function railStyle(p: ChannelStripProps): RailStyle {
  // A dispute can only come from verified correction prose, so it implies a human read the page.
  // (Measured on the current export: 0 records are both never-checked and disputed.)
  if (p.hasVerifiedDispute === true || (p.costDisputed ?? '') !== '') return 'hatched';
  if (p.isDegree === false) return 'hatched';
  return p.verdict === '' ? 'dashed' : 'solid';
}

/** What came back? Four categorical treatments — never a gradient, because the underlying fact
 *  is binary: a human opened the page or did not. Selling a ramp where the data has a boolean is
 *  the exact sin this product exists to fight. */
export function meterState(p: ChannelStripProps): MeterState {
  if (p.isDegree === false) return 'none';
  switch (p.verdict) {
    case 'WORTH IT':
      return 'nominal';
    case 'CONDITIONAL':
      return 'over';
    case 'AVOID':
      return 'clip';
    default:
      return 'absent';
  }
}

/**
 * How tall is the climb? Height is difficulty. The rule below is the one from
 * `data/filters.ts` and it is imported rather than restated: records 253, 254, 258, 259 and 260
 * carry an ordinary `gate` string while a verified correction found a live piano test, and a
 * strip that read `gate` alone would draw those five as a two-rung climb and put a live
 * performance programme into a "no audition" list.
 */
export function ladderReading(p: ChannelStripProps): {
  kind: LadderKind;
  rungs: number;
  dot: boolean;
  suspect: boolean;
} {
  const gate = p.gate ?? '';
  const source = (p.auditionSource ?? '') as AuditionSource;
  const confirmed = hasConfirmedAudition({ gate, auditionSource: source });
  const suspected = hasSuspectedAudition({ gate, auditionSource: source }) || p.needsAudition === true;

  if (confirmed || suspected) {
    return { kind: 'audition', rungs: 3, dot: true, suspect: !confirmed };
  }
  if (/not published/i.test(gate)) return { kind: 'unpublished', rungs: 1, dot: false, suspect: false };
  if (/none found/i.test(gate) || gate === '') return { kind: 'unknown', rungs: 0, dot: false, suspect: false };
  if (/exam|interview|test/i.test(gate)) return { kind: 'rungs', rungs: 2, dot: true, suspect: false };
  if (/portfolio/i.test(gate)) return { kind: 'rungs', rungs: 1, dot: false, suspect: false };
  return { kind: 'unknown', rungs: 0, dot: false, suspect: false };
}

// ── the sentence ─────────────────────────────────────────────────────────────

const RAIL_SAID: Record<RailStyle, string> = {
  solid: 'Read on the official page.',
  dashed: 'Never checked — nobody opened this institution’s page.',
  hatched: 'Disputed — verified prose contradicts what was recorded here.',
};

const METER_SAID: Record<MeterState, string> = {
  nominal: 'Verdict: worth it.',
  over: 'Verdict: conditional.',
  clip: 'Verdict: avoid.',
  absent: 'No verdict, because nothing was ever checked.',
  none: 'Not a master’s degree — judged on its accreditation, not on a page reading.',
};

/** The accessible name. A screen-reader user gets this sentence, not three shapes. */
export function describeStrip(p: ChannelStripProps): string {
  // A non-degree's rail is hatched for the same reason a disputed record's is — this row is not
  // what it says it is — but the two are never described with the same sentence.
  const parts =
    p.isDegree === false
      ? [METER_SAID.none]
      : [RAIL_SAID[railStyle(p)], METER_SAID[meterState(p)]];
  const l = ladderReading(p);

  if (p.ladder !== false) {
    if (l.kind === 'audition') {
      parts.push(
        l.suspect
          ? 'The way in may be a live audition — the phrase was found in unchecked text, so the top rung is drawn provisionally.'
          : 'The way in is a live audition, confirmed: the top rung is broken.'
      );
    } else if (l.kind === 'unpublished') {
      parts.push('The way in is not published — ask them.');
    } else if (l.kind === 'unknown') {
      parts.push('No entry requirement was found in the text.');
    } else if (l.rungs === 1) {
      parts.push('One rung to climb: a portfolio.');
    } else {
      parts.push('Two rungs to climb: a portfolio and a test or interview.');
    }
  }

  if (p.prerequisiteWall) {
    parts.push('A prerequisite degree bars the channel — closed by a prerequisite, not by your ear.');
  }
  return parts.join(' ');
}

// ── drawing helpers ──────────────────────────────────────────────────────────

/**
 * 45° hatch, clipped analytically to a box. A <pattern> would need an id, and this component
 * renders dozens of times per screen; ids that repeat are ids that collide.
 */
function hatch(x0: number, y0: number, x1: number, y1: number, step: number): string {
  const segs: string[] = [];
  for (let c = x0 + y0; c <= x1 + y1; c += step) {
    const xa = Math.max(x0, c - y1);
    const xb = Math.min(x1, c - y0);
    if (xb - xa > 0.4) segs.push(`M${xa.toFixed(2)} ${(c - xa).toFixed(2)}L${xb.toFixed(2)} ${(c - xb).toFixed(2)}`);
  }
  return segs.join('');
}

// ── the component ────────────────────────────────────────────────────────────

export function ChannelStrip(props: ChannelStripProps): JSX.Element {
  const rail = railStyle(props);
  const meter = meterState(props);
  const l = ladderReading(props);
  const base = props.ladderBase ?? LADDER_BASE;
  const withLadder = props.ladder !== false;

  const railClass =
    'strip rail' + (rail === 'dashed' ? ' rail--dashed' : rail === 'hatched' ? ' rail--hatched' : '');
  const noSlot = meter === 'none';

  const marks: JSX.Element[] = [];

  // ── the meter block: 10 × 22 at the rail's top ─────────────────────────────
  if (meter === 'nominal') {
    // The densest mark on the page. Solid fill, plus a cap bar across the top edge — a channel
    // sending signal at nominal. Unmistakable at 20 cm, and a solid black block in greyscale.
    marks.push(
      <rect key="cap" class="strip__meter--nominal" x={METER_X - 1.5} y={0} width={METER_W + 3} height={2} />,
      <rect key="m" class="strip__meter--nominal" x={METER_X} y={METER_TOP} width={METER_W} height={METER_H} rx={1} />
    );
  } else if (meter === 'over') {
    // Above nominal: it works, watch it. Outline, hatched to 70% of its height, with the
    // reference tick protruding to the right at the fill line — the mark on a meter scale.
    const fillTop = METER_TOP + METER_H * 0.3;
    marks.push(
      <rect
        key="m"
        class="strip__meter--over"
        x={METER_X + 0.5}
        y={METER_TOP + 0.5}
        width={METER_W - 1}
        height={METER_H - 1}
        rx={1}
        stroke-width={1}
      />,
      <path
        key="h"
        class="strip__hatch--over"
        d={hatch(METER_X + 1, fillTop, METER_X + METER_W - 1, METER_BOTTOM - 1, 3)}
        stroke-width={1}
        fill="none"
      />,
      <path
        key="t"
        class="strip__hatch--over"
        d={`M${METER_X + METER_W} ${fillTop}L${METER_X + METER_W + 4} ${fillTop}`}
        stroke-width={1.5}
      />
    );
  } else if (meter === 'clip') {
    // Clipped. The mute bar: an empty box struck through, overhanging 2px on both sides.
    marks.push(
      <rect
        key="m"
        class="strip__meter--clip"
        x={METER_X + 0.5}
        y={METER_TOP + 0.5}
        width={METER_W - 1}
        height={METER_H - 1}
        rx={1}
        stroke-width={1}
      />,
      <path
        key="s"
        class="strip__wall"
        d={`M${METER_X - 2} ${METER_TOP + METER_H / 2}L${METER_X + METER_W + 2} ${METER_TOP + METER_H / 2}`}
        stroke-width={2}
      />
    );
  } else if (meter === 'absent') {
    // No block. The slot is empty, and a single em dash of the strip's own rank sits where the
    // block would be — one hairline, no box, no hue, on a rail that is visibly broken.
    marks.push(
      <path
        key="d"
        class="strip__absent"
        d={`M${METER_X + 1} ${METER_TOP + METER_H / 2}L${METER_X + METER_W - 1} ${METER_TOP + METER_H / 2}`}
        stroke-width={1.5}
      />
    );
  }

  // ── the gate ladder: open strokes, built bottom-up from the rail ───────────
  if (withLadder) {
    if (l.kind === 'unknown') {
      // An open hole — unknown, not absent. The one circle in the application, and it is here
      // because a hole is what it means.
      marks.push(
        <circle key="hole" class="strip__hole" cx={RAIL_X + 5} cy={base} r={2} stroke-width={1} />
      );
    } else {
      for (let i = 0; i < l.rungs; i++) {
        const y = base - i * RUNG_GAP;
        const top = i === l.rungs - 1;

        if (top && l.kind === 'audition') {
          // The rung that stops him is drawn broken: a 5px gap at its centre, in gate red —
          // a STROKE, never a fill, so it can never be read as a verdict. Where the finding is
          // only suspected, the same rung is dotted: shown, because he can disprove it in two
          // sentences, but never wearing the authority of a verified reading.
          const cls = 'strip__rung strip__rung--' + (l.suspect ? 'suspect' : 'stop');
          marks.push(
            <path
              key={'r' + i}
              class={cls}
              d={`M${RAIL_X} ${y}L${RAIL_X + 4.5} ${y}M${RAIL_X + 9.5} ${y}L${RUNG_END} ${y}`}
              stroke-width={1.5}
            />,
            // and the stile terminates above it. The rail is a CSS background running the whole
            // height of the channel, so the terminus is drawn as a positive mark rather than a
            // gap: 5px of the stile overprinted in the gate's own stroke, directly above the
            // break. The climb stops here; the channel does not.
            <path
              key="cut"
              class={'strip__rung strip__rung--' + (l.suspect ? 'suspect' : 'stop')}
              d={`M${RAIL_X} ${y - 4}L${RAIL_X} ${y - 9}`}
              stroke-width={2}
            />
          );
        } else if (l.kind === 'unpublished') {
          marks.push(
            <path
              key={'r' + i}
              class="strip__rung"
              d={`M${RAIL_X} ${y}L${RUNG_END} ${y}`}
              stroke-width={1.5}
              stroke-dasharray="1.5 2"
            />
          );
        } else {
          marks.push(
            <path key={'r' + i} class="strip__rung" d={`M${RAIL_X} ${y}L${RUNG_END} ${y}`} stroke-width={1.5} />
          );
          // Rung 2 is the production test: a filled dot at the outer end, the raw material you
          // are handed. Deliberately not green — it is passable, but it is not a verdict.
          if (i === 1 && l.dot) marks.push(<circle key="dot" class="strip__dot" cx={RUNG_END} cy={y} r={1.5} />);
        }
      }
    }
  }

  // ── the prerequisite wall: across the whole channel, ladder above it intact ─
  if (props.prerequisiteWall) {
    marks.push(
      <path key="wall" class="strip__wall" d={`M0 ${base + 9}L24 ${base + 9}`} stroke-width={2} />
    );
  }

  return (
    <svg
      class={railClass + (noSlot ? ' strip--noslot' : '') + (props.class ? ' ' + props.class : '')}
      width="24"
      height="100%"
      role="img"
      aria-label={describeStrip(props)}
      fill="none"
      stroke-linecap="butt"
    >
      {marks}
    </svg>
  );
}
