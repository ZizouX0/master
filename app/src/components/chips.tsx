/**
 * The five chips. Every view — mine and the detail agent's — renders record state through
 * these and nothing else, so a rule can only be got wrong in one place.
 *
 * Two invariants the CSS and this file enforce together:
 *
 *  1. ONE traffic light, owned by `verdict`. Green means "a human read the official page and
 *     judged it worth it" and never anything else. The gate, the cost band and the language
 *     each get their own visual language so none of them can borrow that meaning.
 *  2. NOTHING depends on hue. Each state also differs in fill, border style and glyph, so the
 *     card is still readable in greyscale or with any colour vision.
 */

import type { JSX } from 'preact';

// ─────────────────────────────────────────────────────────────────────────────
// Verdict — the traffic light
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `verdict` is `''` on 249 of 398 records. That is a state, not a missing value, and it gets
 * the one treatment that can never be mistaken for a verdict: no fill, a dashed border, no
 * colour, and the words NOT VERIFIED first. BUILD-SPEC rule 1.
 */
export function VerdictChip(p: { verdict: string }): JSX.Element {
  switch (p.verdict) {
    case 'WORTH IT':
      return (
        <span class="vchip vchip--worth" title="Read on the official page and judged worth it.">
          <span class="vchip__glyph" aria-hidden="true">
            ✔
          </span>
          Worth it
        </span>
      );
    case 'CONDITIONAL':
      return (
        <span class="vchip vchip--cond" title="Read on the official page. Worth it only if something specific resolves.">
          <span class="vchip__glyph" aria-hidden="true">
            !
          </span>
          Conditional
        </span>
      );
    case 'AVOID':
      return (
        <span class="vchip vchip--avoid" title="Read on the official page and ruled out.">
          <span class="vchip__glyph" aria-hidden="true">
            ✕
          </span>
          Avoid
        </span>
      );
    default:
      return (
        <span
          class="vchip vchip--none"
          title="Nobody has opened this institution's official page. Everything here came from a listing."
        >
          <span class="vchip__glyph" aria-hidden="true">
            ?
          </span>
          Not verified
        </span>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gate — a separate language: square corners, mono type, geometric glyphs
// ─────────────────────────────────────────────────────────────────────────────

const AUDITION_IN_GATE = /AUDITION/i;

/** Short labels, because a 390px card cannot carry "Portfolio + exam/interview" in full. */
function gateLabel(gate: string): { text: string; glyph: string; variant: string } {
  if (/portfolio \+ exam/i.test(gate)) return { text: 'Portfolio + exam', glyph: '⚙', variant: '' };
  if (/portfolio only/i.test(gate)) return { text: 'Portfolio only', glyph: '◆', variant: '' };
  if (/exam\/interview only/i.test(gate)) return { text: 'Exam / interview', glyph: '⚙', variant: '' };
  if (/not published/i.test(gate)) return { text: 'Gate not published', glyph: '?', variant: 'gchip--unknown' };
  if (/none found/i.test(gate)) return { text: 'No gate in the text', glyph: '◇', variant: 'gchip--unknown' };
  return { text: gate || 'Gate unknown', glyph: '◇', variant: 'gchip--unknown' };
}

/**
 * The correctness-critical chip.
 *
 * Records 253, 254, 258, 259 and 260 carry `gate: "Exam/interview only"` or `"Portfolio only"`
 * while `needsAudition: true`, because a verified correction found a live piano test that the
 * original gate string missed. Reading `gate` alone renders those five as an ordinary exam and
 * puts a live-performance programme into a "no audition" list. So `needsAudition === true`
 * always wins.
 *
 * The second half of the rule matters just as much: `auditionSource` says where the finding
 * came from. `confirmed` means verified prose; `suspected` means a regex fired over the raw,
 * never-re-checked `audition` field. A suspicion is shown — he can disprove it in two
 * sentences — but it is drawn weaker (dotted, uncoloured, and with a question mark) so it
 * never wears the authority of a verified finding.
 */
export function GateChip(p: {
  gate: string;
  needsAudition?: boolean;
  auditionSource?: string;
}): JSX.Element {
  const confirmed = p.auditionSource === 'confirmed' || AUDITION_IN_GATE.test(p.gate ?? '');
  const audition = p.needsAudition === true || confirmed;

  if (audition && confirmed) {
    return (
      <span class="gchip gchip--audition" title="A live performance audition, confirmed against the official page.">
        <span aria-hidden="true">▲</span>
        Live audition
      </span>
    );
  }
  if (audition) {
    return (
      <span
        class="gchip gchip--suspected"
        title="An audition phrase was found in the unchecked text. Nobody has confirmed it — read the record before believing it."
      >
        <span aria-hidden="true">▲</span>
        Audition? unconfirmed
      </span>
    );
  }

  const { text, glyph, variant } = gateLabel(p.gate ?? '');
  return (
    <span class={'gchip ' + variant} title={p.gate}>
      <span aria-hidden="true">{glyph}</span>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost — a cool ramp, deliberately not the traffic light
// ─────────────────────────────────────────────────────────────────────────────

const CHEAP = new Set(['Free', 'Under EUR 1.5k/yr', 'EUR 1.5k-5k/yr']);

/** "EUR 1.5k-5k/yr" → "€1.5k–5k/yr". Mono, so it reads as a raw figure. */
function bandLabel(band: string): string {
  if (!band) return 'no band recorded';
  if (band === 'Not published') return 'no price published';
  return band.replace(/EUR\s*/g, '€').replace(/-/g, '–');
}

/**
 * A green "Free" beside a green "WORTH IT" would imply a correlation the data flatly
 * contradicts — of the nine WORTH IT records exactly one is affordable. So money gets a cool
 * teal ramp and never a verdict colour.
 *
 * `disputed` is BUILD-SPEC rule 5. Where verified prose contradicts the recorded band —
 * Edinburgh still says "Under EUR 1.5k/yr" against a real ≈£29,900 — the band is struck
 * through and marked, and the record is excluded from every cheap selection upstream in
 * `isCheap()`. Showing the wrong number quietly is worse than showing no number.
 */
export function CostChip(p: { band: string; disputed?: boolean }): JSX.Element {
  const band = p.band ?? '';
  const label = bandLabel(band);

  if (p.disputed) {
    return (
      <span
        class="cchip cchip--disputed"
        title="Verified prose contradicts this band. The recorded figure is wrong — read the correction on the record."
      >
        <span class="cchip__struck">{label}</span>
        <span aria-hidden="true">·</span>
        WRONG — see correction
      </span>
    );
  }

  const variant = !band || band === 'Not published'
    ? 'cchip--unknown'
    : CHEAP.has(band)
      ? 'cchip--cheap'
      : band === 'EUR 5k-15k/yr'
        ? 'cchip--mid'
        : 'cchip--dear';

  return (
    <span class={'cchip ' + variant} title={band || 'no cost band recorded'}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `ok` is `languageOk` — he has Arabic, French and working English, and no German. A language
 * he cannot follow is a hard stop, but it is not a verdict, so it is drawn as a struck-through
 * neutral chip rather than in red.
 */
export function LangChip(p: { language: string; ok?: boolean }): JSX.Element {
  const language = p.language || 'language not stated';
  if (p.ok === false) {
    return (
      <span class="lchip lchip--blocked" title={`Taught in ${language}. You do not have it.`}>
        <span aria-hidden="true">✕</span>
        <span class="lchip__name">{language}</span>
      </span>
    );
  }
  return (
    <span class="lchip" title={`Taught in ${language}.`}>
      <span class="lchip__name">{language}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Level
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
 * BUILD-SPEC rule 2: `isDegree === false` must be visible without clicking, at the same visual
 * weight as the title. 57 of the 130 have "Master", "Máster" or "Mastère" in their name, so the
 * title itself actively misleads and a quiet chip underneath it would lose.
 *
 * So this component changes shape rather than colour: a degree gets a small neutral chip, a
 * non-degree gets a full-width 15px banner with a hatched edge, which stays unmistakable in
 * greyscale and at scrolling speed.
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
  return <span class="levelchip" title={`level: ${level}`}>{level}</span>;
}
