/**
 * The join. Two datasets that never reference each other, made to answer one question:
 *
 *   "Can I afford Basel, all in, with a scholarship I could actually win?"
 *
 * Today that is unanswerable in the app. The record says `FUNDING FOR THIS PROGRAMME: UNVERIFIED`
 * and offers a link to the top of a 120-row alphabetical list with no country filter. The true
 * answer — CHF 2,500/yr tuition is affordable, the one scheme that would cover living costs opens
 * in six days, and nobody knows yet whether Tunisia is on its list — is present in the data in
 * three separate fragments that the app never assembles.
 *
 * Two rules govern everything below, and the second one is the whole point:
 *
 *  M1. Match on country first, then subject, then the eligibility normalisers. A scheme whose
 *      country scope cannot reach this programme is not returned at all — it is not "excluded",
 *      it is about somewhere else.
 *  M2. **`unknown` must never render as `eligible`.** Most schemes simply never say. 36 of 120
 *      state no nationality scope; `requiresWorkExperience` is empty on 72. Reading an empty
 *      field as permission is how an applicant spends three weeks on Chevening.
 *
 * The normalisers are lifted from src/views/Money.tsx, unchanged, so the join and the view cannot
 * disagree about what "no work-experience bar" means. `__tests__/money.test.ts` asserts they agree
 * across all 120 schemes; when the view is eventually rebuilt it should import them from here.
 */

import type { FundingScheme } from '../types';
import { renderField } from '../lib/format';
import { fold } from './dedup';

// ─────────────────────────────────────────────────────────────────────────────
// The applicant. One person; every annotation below is about him specifically.
// ─────────────────────────────────────────────────────────────────────────────

/** Tunisian, software-engineering BSc, ~24 when he applies for the September 2027 intake. */
export const AGE_AT_APPLICATION = 24;
export const AGE_AT_ENTRY = 25;

// ─────────────────────────────────────────────────────────────────────────────
// Normalisers — lifted from src/views/Money.tsx. Each has a fourth answer,
// "nobody said", and it is never folded into "no".
// ─────────────────────────────────────────────────────────────────────────────

const UNVERIFIED_LEAD = /^\W*UNVERIFIED\b/i;

export type Verdictish = 'yes' | 'no' | 'conditional' | 'unknown';

export interface Normalised {
  kind: Verdictish;
  /** A short caption. The full prose is always rendered beside it, never replaced by it. */
  label: string;
}

/**
 * `requiresAdmissionFirst` — 7 spellings of yes/no, plus `UNVERIFIED` (12), plus blanks (7),
 * plus a long tail of sentences. This changes the ORDER of his year, so a wrong "no" costs a cycle.
 */
export function admissionFirst(raw: string): Normalised {
  const s = (raw ?? '').trim();
  if (s === '') return { kind: 'unknown', label: 'nobody recorded this' };
  if (UNVERIFIED_LEAD.test(s)) return { kind: 'unknown', label: 'nobody confirmed this' };
  if (/\bn\/a\b/i.test(s) || /there is no scholarship to apply for/i.test(s)) {
    return { kind: 'unknown', label: 'not applicable to this scheme' };
  }

  const leadsNo = /^\W*(no\b|not at application|no separate|no formal|nope\b)/i.test(s);
  const laterYes = /yes later|yes[,;] later|but[^.]{0,120}\b(required|requires|must|needs?)\b/i.test(s);
  if (leadsNo && laterYes) return { kind: 'conditional', label: 'not at application — but an offer is needed later' };
  if (leadsNo) return { kind: 'no', label: 'no offer needed first' };

  if (/^\W*(yes\b|y\b)|effectively yes|likely yes|typically yes|generally yes|historically yes|absolutely/i.test(s)) {
    return { kind: 'yes', label: 'an offer must be in hand first' };
  }
  if (/\bmust\b|\brequire|acceptance|invitation|nominat|enrol/i.test(s)) {
    return { kind: 'yes', label: 'an offer or a nomination is needed first' };
  }
  if (/combined|alongside|together with|underway|in parallel|pending/i.test(s)) {
    return { kind: 'conditional', label: 'decided together with admission' };
  }
  return { kind: 'unknown', label: 'the sentence does not settle it' };
}

export interface WorkExperience extends Normalised {
  /** Where the answer came from. `prose` means the structured field was empty. */
  source: 'field' | 'prose' | 'none';
  /** The sentence the answer rests on, for display. */
  evidence: string;
}

const WORK_PROSE =
  /(\d[\d,\s]*hours of work experience)|work experience|years? of (professional|work|relevant)|post-bachelor|professional (experience|activity)|track record|activite professionnelle/i;

/**
 * `requiresWorkExperience` is non-empty on only 48 of 120, so the field alone cannot answer the
 * question. When it is silent this reads `whoCanApply` and `notes` for a work-experience bar and
 * says where it found one. Chevening's cell is empty; its prose names 2,800 post-bachelor hours.
 */
export function workExperienceBar(f: FundingScheme): WorkExperience {
  const s = (f.requiresWorkExperience ?? '').trim();
  if (s !== '') {
    if (UNVERIFIED_LEAD.test(s)) {
      return { kind: 'unknown', label: 'nobody confirmed this', source: 'field', evidence: s };
    }
    const soft = /\bbut\b|track record|membership|effectively|see notes|equivalent professional/i.test(s);
    if (/effectively yes|^\W*yes\b|\brequired\b/i.test(s)) {
      return { kind: 'yes', label: 'work experience is required', source: 'field', evidence: s };
    }
    if (/^\W*(no|none)\b/i.test(s)) {
      return soft
        ? { kind: 'conditional', label: 'no formal bar — but a track record is expected', source: 'field', evidence: s }
        : { kind: 'no', label: 'no work-experience bar', source: 'field', evidence: s };
    }
    if (soft) return { kind: 'conditional', label: 'a soft version of the same bar', source: 'field', evidence: s };
    return { kind: 'unknown', label: 'the sentence does not settle it', source: 'field', evidence: s };
  }

  const prose = `${f.whoCanApply} ${f.notes}`;
  const hit = WORK_PROSE.exec(prose);
  if (hit) {
    return {
      kind: 'yes',
      label: 'the field is empty — the prose names a work-experience bar',
      source: 'prose',
      evidence: sentenceAround(prose, hit.index),
    };
  }
  return {
    kind: 'unknown',
    label: 'the field is empty, as it is on 72 of 120. Nobody said.',
    source: 'none',
    evidence: '',
  };
}

/** The sentence a regex hit sits in, so evidence is quotable rather than a fragment. */
function sentenceAround(text: string, at: number): string {
  const start = Math.max(0, text.lastIndexOf('.', at) + 1);
  const dot = text.indexOf('.', at);
  const end = dot === -1 ? Math.min(text.length, at + 240) : dot + 1;
  return text.slice(start, end).trim();
}

export interface AgeCap extends Normalised {
  /** The upper bound in years, when one was published. */
  cap: number | null;
}

/** Only an explicit upper bound is treated as a cap; a bare number in a sentence is not one. */
export function ageCap(raw: string): AgeCap {
  const s = (raw ?? '').trim();
  if (s === '') return { kind: 'unknown', cap: null, label: 'nobody recorded an age limit' };
  if (UNVERIFIED_LEAD.test(s)) return { kind: 'unknown', cap: null, label: 'nobody confirmed an age limit' };
  if (/none (found|stated)|no (stated )?(upper )?age|there is no upper age|no age (limit|bar)/i.test(s)) {
    return { kind: 'no', cap: null, label: 'no age cap' };
  }

  const band = /\b(\d{2})\s*[-–—]\s*(\d{2})\b/.exec(s);
  const upper =
    /\b(?:under|max(?:imum)?|up to|below|not (?:be )?(?:over|older than)|age cap|age limit)\D{0,12}(\d{2})\b/i.exec(s);

  // An explicitly named upper bound outranks a band, because a band in this corpus is usually
  // the APPLICANT's age, not the rule's. ESKAS reads "At 24-26 he CLEARS it ... The maximum age
  // is 35": taking the band first gave a cap of 26 and a one-year margin where the scheme
  // publishes ten. Nothing visible was wrong — 26 is still above his age at entry, so the
  // verdict came out the same — but a record phrased "at 24-25" would have flipped the same
  // scheme to conditional for no reason at all.
  //
  // The explicit bound only wins when it reads as an age. "maximum 12 months, ages 20-30" would
  // otherwise yield 12, fail the plausibility floor, and throw away a band that was correct.
  const plausible = (n: number) => n >= 18 && n <= 70;
  const explicit = upper ? Number(upper[1]) : null;
  const banded = band ? Number(band[2]) : null;
  const cap =
    explicit !== null && plausible(explicit) ? explicit
    : banded !== null && plausible(banded) ? banded
    : explicit ?? banded;
  if (cap === null || cap < 18 || cap > 70) {
    if (/^\W*\d{2}\s*or over/i.test(s)) return { kind: 'no', cap: null, label: 'a minimum age only — no cap' };
    return { kind: 'unknown', cap: null, label: 'an age rule is described but no cap could be read' };
  }
  if (cap >= AGE_AT_ENTRY + 1) return { kind: 'no', cap, label: `age cap ${cap}. He clears it at ${AGE_AT_ENTRY}.` };
  if (cap === AGE_AT_ENTRY) {
    return { kind: 'conditional', cap, label: `age cap ${cap}. He turns ${AGE_AT_ENTRY} around entry — marginal.` };
  }
  return { kind: 'yes', cap, label: `age cap ${cap}. He is over it by entry — this one rules him out.` };
}

export type Nationality = 'named' | 'excluded' | 'unstated';

const TUNISIA_OUT =
  /(tunisia[^.]{0,60}(is )?not (eligible|listed|included|on)|not open to tunisia|excludes? tunisia|tunisia is excluded|tunisia[^.]{0,30}\bexcluded\b)/i;

/**
 * The verifier sometimes wrote the conclusion into the prose — Chevening's `whoCanApply` ends
 * "HE IS NOT ELIGIBLE for the 2027/28 cycle". That is a finding about him, not about Tunisia, and
 * it is kept separate so the app never reports the wrong reason.
 */
export function statedIneligible(f: FundingScheme): string {
  const hit = /\bhe (is|would be) not eligible\b[^.]*\.|\bnot eligible\b[^.]{0,80}\./i.exec(
    `${f.whoCanApply} ${f.notes}`,
  );
  return hit && /\bhe\b/i.test(hit[0]) ? hit[0].trim() : '';
}

/**
 * Nationality, read from `whoCanApply`. Three answers, and "unstated" is one of them: 84 of 120
 * name Tunisia, a handful exclude it, and the rest never say. Saying "no" for those would invent
 * a bar; saying "yes" would invent a permission.
 */
export function tunisiaEligible(f: FundingScheme): { kind: Nationality; label: string } {
  const s = f.whoCanApply ?? '';
  if (TUNISIA_OUT.test(s)) return { kind: 'excluded', label: 'Tunisia is excluded, or he is' };
  if (/tunisia/i.test(s)) return { kind: 'named', label: 'Tunisia is named as eligible' };
  return { kind: 'unstated', label: 'nationality scope never mentions Tunisia' };
}

export type Subject = 'open' | 'blocked' | 'narrow' | 'unstated';

const SUBJECT_OUT =
  /(STEM[- ]only|only STEM|excludes? (the )?arts|arts (are|is) excluded|not (open to|available for) (the )?(arts|music)|science and engineering only|engineering and science only|does not (fund|cover) (the )?arts|priority (is|given to) (STEM|science))/i;

/** The field that actually kills most of these for him. */
export function subjectFit(f: FundingScheme): { kind: Subject; label: string } {
  const s = (f.subjectScope ?? '').trim();
  if (s === '') return { kind: 'unstated', label: 'no subject scope recorded' };
  if (SUBJECT_OUT.test(s)) return { kind: 'blocked', label: 'the subject is the bar' };
  if (/^\W*(yes|open|any\b|all disciplines)/i.test(s)) return { kind: 'open', label: 'music production qualifies' };
  if (/restricted|only\b|specific|named (programme|course)/i.test(s)) {
    return { kind: 'narrow', label: 'restricted to named subjects — check it fits' };
  }
  return { kind: 'unstated', label: 'the scope is described but not settled' };
}

export interface SchemeRead {
  scheme: FundingScheme;
  nationality: ReturnType<typeof tunisiaEligible>;
  subject: ReturnType<typeof subjectFit>;
  work: WorkExperience;
  age: AgeCap;
  admission: Normalised;
  /** A sentence in the prose that says outright he cannot use this one. '' when there is none. */
  ineligible: string;
  /** Things that would stop him today, each already checked against the prose. */
  blockers: string[];
  /** Things nobody confirmed either way. Never counted as a pass. */
  unknowns: string[];
}

export function readScheme(scheme: FundingScheme): SchemeRead {
  const nationality = tunisiaEligible(scheme);
  const subject = subjectFit(scheme);
  const work = workExperienceBar(scheme);
  const age = ageCap(scheme.ageLimit);
  const admission = admissionFirst(scheme.requiresAdmissionFirst);
  const ineligible = statedIneligible(scheme);

  const blockers: string[] = [];
  const unknowns: string[] = [];
  if (ineligible !== '') blockers.push('The prose says he cannot use this one');
  if (nationality.kind === 'excluded') blockers.push('Nationality');
  if (nationality.kind === 'unstated') unknowns.push('Nationality');
  if (subject.kind === 'blocked') blockers.push('Subject');
  if (subject.kind === 'unstated' || subject.kind === 'narrow') unknowns.push('Subject');
  if (work.kind === 'yes') blockers.push('Work experience');
  if (work.kind === 'conditional') unknowns.push('Work experience');
  if (work.kind === 'unknown') unknowns.push('Work experience');
  if (age.kind === 'yes') blockers.push('Age');
  if (age.kind === 'conditional' || age.kind === 'unknown') unknowns.push('Age');
  if (admission.kind === 'unknown') unknowns.push('Admission first');

  return { scheme, nationality, subject, work, age, admission, ineligible, blockers, unknowns };
}

// ─────────────────────────────────────────────────────────────────────────────
// M1 — country scope. 65 distinct strings for roughly 40 countries.
// ─────────────────────────────────────────────────────────────────────────────

/** The programme side of the join. `ProgrammeIndex`, `ProgrammeFull` and a raw record all fit. */
export interface ProgrammeLike {
  key?: string;
  country: string;
  institution: string;
  programme: string;
  costBand?: string;
  costDisputed?: string;
  funding?: string;
  tuition?: string;
  otherFees?: string;
  totalCost?: string;
  scholarshipDetail?: string;
}

/** Spellings that appear on one side of the join and not the other. */
const COUNTRY_ALIASES: Record<string, string[]> = {
  'united kingdom': ['uk', 'britain', 'british', 'england', 'scotland', 'wales', 'northern ireland'],
  'czech republic': ['czechia', 'czech'],
  turkey: ['turkiye', 'türkiye'],
  netherlands: ['holland', 'dutch'],
  'united states': ['usa', 'us', 'america'],
  ireland: ['republic of ireland'],
};

/** EU/EEA-ish, for the "EU-wide" schemes. Read off the corpus's own country list. */
const EUROPEAN = new Set(
  [
    'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic', 'denmark', 'estonia',
    'finland', 'france', 'germany', 'greece', 'hungary', 'iceland', 'ireland', 'italy', 'latvia',
    'lithuania', 'luxembourg', 'malta', 'netherlands', 'norway', 'poland', 'portugal', 'romania',
    'slovakia', 'slovenia', 'spain', 'sweden', 'switzerland', 'liechtenstein',
  ].map(fold),
);

/** "funds study anywhere", "worldwide", "study abroad" — the scheme travels with him. */
const PORTABLE =
  /(anywhere|worldwide|internationally|globally|global entry|any accredited university|other destinations|study abroad|funds study in europe|creative europe)/i;

const EU_WIDE = /\beu[- ]wide\b|\beurope[- ]wide\b|european union/i;

export type Scope = 'named-country' | 'eu-wide' | 'portable' | 'elsewhere';

/**
 * Can this scheme's money reach this country at all? Four answers, and `elsewhere` means the
 * scheme is not about this programme — it is dropped, not labelled "excluded". Labelling a
 * Slovak national scheme "excluded" for a Swiss programme would bury the real exclusions.
 */
export function countryScope(programmeCountry: string, scheme: FundingScheme): Scope {
  const target = fold(programmeCountry).trim();
  const field = fold(`${scheme.country} ${scheme.subjectScope}`);
  const names = [target, ...(COUNTRY_ALIASES[target] ?? [])];
  for (const n of names) {
    if (n.length >= 2 && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(field)) {
      return 'named-country';
    }
  }
  if (EU_WIDE.test(scheme.country) && EUROPEAN.has(target)) return 'eu-wide';
  if (PORTABLE.test(scheme.country)) return 'portable';
  return 'elsewhere';
}

/** Words that identify a school rather than describing one. */
const GENERIC_INSTITUTION = new Set([
  'university', 'universite', 'universität', 'universiteit', 'universidad', 'universita',
  'hochschule', 'conservatoire', 'conservatorium', 'conservatorio', 'conservatory', 'academy',
  'akademie', 'akademia', 'institute', 'institut', 'school', 'schule', 'college', 'music',
  'musik', 'musique', 'musica', 'faculty', 'department', 'centre', 'center', 'national',
  'international', 'royal', 'state', 'higher', 'studies', 'arts', 'design', 'technology',
  'sciences', 'science', 'applied', 'performing',
]);

/** Distinctive words and acronyms from an institution name, for the "Named" tier. */
function institutionTokens(institution: string): string[] {
  const out = new Set<string>();
  for (const raw of institution.split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length >= 3 && raw.length <= 6 && raw === raw.toUpperCase() && /[A-Z]{3}/.test(raw)) {
      out.add(fold(raw));
    }
    const t = fold(raw);
    if (t.length >= 6 && !GENERIC_INSTITUTION.has(t)) out.add(t);
  }
  return [...out];
}

// ─────────────────────────────────────────────────────────────────────────────
// M2 — the verdict, and the sentence it rests on
// ─────────────────────────────────────────────────────────────────────────────

/** Three answers. `unknown` is the honest one for most of the corpus, and it is not a yes. */
export type Fit = 'eligible' | 'unknown' | 'excluded';

/** WORKFLOW §5's vocabulary, kept alongside `fit` because it explains HOW it reached him. */
export type Tier = 'named' | 'scoped' | 'silent' | 'barred';

export interface SchemeMatch {
  scheme: FundingScheme;
  read: SchemeRead;
  scope: Scope;
  tier: Tier;
  fit: Fit;
  /** The sentence that decided it. Verbatim from the record wherever one exists. */
  because: string;
  /** Which field that sentence came from. */
  becauseField: string;
  /** Everything nobody settled. Each is a question with an owner, not a caveat. */
  gaps: string[];
}

/**
 * Some schemes are one school's own money wearing a national name — "NL Scholarship (incoming)
 * **at Codarts**" is the whole Dutch allocation for one conservatoire. Its country scope reaches
 * every Dutch programme and its subject scope says "Yes", so without this it would read as
 * eligible for schools it cannot pay for.
 *
 * Narrow on purpose: only "… at <Proper Noun>" in the scheme's own name or `whoCanApply`, and only
 * when that name is absent from this institution. It downgrades to `unknown`, never to `excluded`
 * — the scheme may well cover the programme, and nobody here has read the small print.
 */
function tiedToAnotherInstitution(programme: ProgrammeLike, scheme: FundingScheme): string {
  const institution = fold(programme.institution);
  for (const text of [scheme.name, scheme.whoCanApply]) {
    for (const hit of String(text ?? '').matchAll(/\bat\s+((?:[A-ZÀ-Ý][\p{L}&'’.-]+)(?:\s+[A-ZÀ-Ý][\p{L}&'’.-]+){0,3})/gu)) {
      const words = fold(hit[1]!).split(/\s+/).filter((w) => w.length >= 5 && !GENERIC_INSTITUTION.has(w));
      if (words.length === 0) continue;
      if (words.some((w) => institution.includes(w))) return ''; // it names this one
      return `The scheme is tied to a named institution: "${hit[0]!.trim()}". Check it covers this programme before counting on it.`;
    }
  }
  return '';
}

function firstSentence(text: string, max = 260): string {
  const s = (text ?? '').trim().replace(/\s+/g, ' ');
  if (s === '') return '';
  const dot = s.indexOf('. ');
  const cut = dot === -1 ? s : s.slice(0, dot + 1);
  return cut.length > max ? cut.slice(0, max).trimEnd() + '…' : cut;
}

/**
 * One programme against one scheme.
 *
 * The order is the order that disqualifies fastest, and it is also the order of certainty: a
 * stated exclusion beats a silence, and a silence never beats anything.
 */
export function assessScheme(programme: ProgrammeLike, scheme: FundingScheme): SchemeMatch | null {
  const scope = countryScope(programme.country, scheme);
  // Only where a school would actually be named. `notes` is a paragraph of strategy and matching
  // against it made half the French corpus look like the Eiffel scholarship's own institution.
  const haystack = fold(`${scheme.name} ${scheme.provider} ${scheme.whoCanApply}`);
  const named = institutionTokens(programme.institution).some((t) =>
    new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack),
  );
  if (scope === 'elsewhere' && !named) return null;
  const otherSchool = tiedToAnotherInstitution(programme, scheme);

  const read = readScheme(scheme);

  // ── excluded ──────────────────────────────────────────────────────────────
  if (read.ineligible !== '') {
    return match(scheme, read, scope, 'barred', 'excluded', read.ineligible, 'whoCanApply / notes');
  }
  if (read.nationality.kind === 'excluded') {
    return match(scheme, read, scope, 'barred', 'excluded', firstSentence(scheme.whoCanApply), 'whoCanApply');
  }
  if (read.subject.kind === 'blocked') {
    return match(scheme, read, scope, 'barred', 'excluded', firstSentence(scheme.subjectScope), 'subjectScope');
  }
  if (read.work.kind === 'yes') {
    return match(
      scheme,
      read,
      scope,
      'barred',
      'excluded',
      read.work.evidence || firstSentence(scheme.requiresWorkExperience),
      read.work.source === 'prose' ? 'whoCanApply / notes (the structured field is empty)' : 'requiresWorkExperience',
    );
  }
  if (read.age.kind === 'yes') {
    return match(scheme, read, scope, 'barred', 'excluded', firstSentence(scheme.ageLimit), 'ageLimit');
  }

  // ── eligible ──────────────────────────────────────────────────────────────
  // Every axis must be a positive statement. `narrow` — "restricted to named subjects, check it
  // fits" — is a question, not a yes: it is exactly what the Eiffel scholarship's scope says while
  // its own record shouts THIS IS THE DISQUALIFIER three words earlier.
  if (
    read.nationality.kind === 'named' &&
    read.subject.kind === 'open' &&
    read.work.kind === 'no' &&
    read.age.kind === 'no' &&
    otherSchool === ''
  ) {
    return match(
      scheme,
      read,
      scope,
      named ? 'named' : 'scoped',
      'eligible',
      firstSentence(scheme.whoCanApply),
      'whoCanApply',
    );
  }

  // ── unknown — the honest answer for most of the corpus ─────────────────────
  if (otherSchool !== '') {
    const tied: Tier = named ? 'named' : read.nationality.kind === 'unstated' ? 'silent' : 'scoped';
    return match(scheme, read, scope, tied, 'unknown', otherSchool, 'name / whoCanApply');
  }
  const [field, sentence] =
    read.nationality.kind === 'unstated'
      ? ['whoCanApply', firstSentence(scheme.whoCanApply)]
      : read.subject.kind !== 'open'
        ? ['subjectScope', firstSentence(scheme.subjectScope)]
        : read.work.kind !== 'no'
          ? ['requiresWorkExperience', read.work.evidence || firstSentence(scheme.requiresWorkExperience)]
          : ['ageLimit', firstSentence(scheme.ageLimit)];
  // Named beats Silent: a scheme that names this institution is about this programme even when it
  // never says who may apply — ICMP's Andrew Scheps award states no nationality scope at all.
  const tier: Tier = named ? 'named' : read.nationality.kind === 'unstated' ? 'silent' : 'scoped';
  return match(scheme, read, scope, tier, 'unknown', sentence, field);
}

function match(
  scheme: FundingScheme,
  read: SchemeRead,
  scope: Scope,
  tier: Tier,
  fit: Fit,
  because: string,
  becauseField: string,
): SchemeMatch {
  const gaps: string[] = [];
  if (read.nationality.kind === 'unstated') gaps.push('Nationality — the scheme never mentions Tunisia');
  if (read.subject.kind === 'unstated') gaps.push('Subject — no scope recorded, or the scope does not settle it');
  if (read.subject.kind === 'narrow') gaps.push('Subject — restricted to named subjects; check this one is on the list');
  if (read.work.kind === 'unknown') gaps.push('Work experience — nobody said');
  if (read.work.kind === 'conditional') gaps.push('Work experience — no formal bar, but a track record is expected');
  if (read.age.kind === 'unknown') gaps.push('Age — no cap recorded');
  if (read.age.kind === 'conditional') gaps.push(`Age — ${read.age.label}`);
  if (read.admission.kind === 'unknown') gaps.push('Admission first — the sentence does not settle it');
  // An empty deciding field is itself the finding, and it must read as one rather than as a blank.
  const sentence = because.trim() !== '' ? because : `Nobody recorded a ${becauseField} for this scheme.`;
  return { scheme, read, scope, tier, fit, because: sentence, becauseField, gaps };
}

const FIT_RANK: Record<Fit, number> = { eligible: 0, unknown: 1, excluded: 2 };
const TIER_RANK: Record<Tier, number> = { named: 0, scoped: 1, silent: 2, barred: 3 };
/** A scheme whose own country is this country outranks a pan-European one that merely reaches it. */
const SCOPE_RANK: Record<Scope, number> = { 'named-country': 0, 'eu-wide': 1, portable: 2, elsewhere: 3 };

/**
 * Every scheme whose money could plausibly reach this programme, best first.
 *
 * "Plausibly" is doing real work: a scheme is here because its country scope reaches this country
 * or because it names this institution, not because it exists. What it is NOT is a shortlist —
 * `excluded` rows stay in the list, with the sentence that ruled them out, so he never re-checks
 * Chevening in month nine.
 */
export function schemesForProgramme(
  programme: ProgrammeLike,
  schemes: readonly FundingScheme[],
): SchemeMatch[] {
  const out: SchemeMatch[] = [];
  for (const scheme of schemes) {
    const m = assessScheme(programme, scheme);
    if (m) out.push(m);
  }
  return out.sort(
    (a, b) =>
      FIT_RANK[a.fit] - FIT_RANK[b.fit] ||
      TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
      SCOPE_RANK[a.scope] - SCOPE_RANK[b.scope] ||
      a.gaps.length - b.gaps.length ||
      a.scheme.id - b.scheme.id,
  );
}

export interface FitSplit {
  eligible: number;
  unknown: number;
  excluded: number;
}

export function splitByFit(matches: readonly SchemeMatch[]): FitSplit {
  return {
    eligible: matches.filter((m) => m.fit === 'eligible').length,
    unknown: matches.filter((m) => m.fit === 'unknown').length,
    excluded: matches.filter((m) => m.fit === 'excluded').length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// What it costs — stated, never totalled
// ─────────────────────────────────────────────────────────────────────────────

export interface CostLine {
  label: string;
  /** The record's own words. Never reformatted into a number. */
  value: string;
  field: string;
  /** True when the value carries an inline UNVERIFIED caveat that must travel with it. */
  caveated: boolean;
}

export interface CostPicture {
  programme: string;
  /** Cost facts somebody actually published. */
  known: CostLine[];
  /** Named gaps. Each is a question with an owner, not a blank cell. */
  missing: string[];
  /** Verified prose that contradicts the recorded cost band. Shown before any figure. */
  corrections: string[];
  split: FitSplit;
  /** The schemes, already assessed, in the same order `schemesForProgramme` returns. */
  schemes: SchemeMatch[];
  /**
   * Always null. Adding CHF 2,500 tuition to a living-cost figure the record marks UNVERIFIED
   * would produce a number with a false precision, and a number is exactly what gets remembered.
   */
  total: null;
  /** One honest sentence: what is known, what is missing, what could pay. */
  sentence: string;
}

const COST_FIELDS: Array<[keyof ProgrammeLike, string, string]> = [
  ['tuition', 'Tuition', 'tuition'],
  ['otherFees', 'Other fees', 'otherFees'],
  ['totalCost', 'Total cost as recorded', 'totalCost'],
  ['scholarshipDetail', 'Funding named on the record', 'scholarshipDetail'],
];

/**
 * States what is known and what is missing rather than producing a total.
 *
 * The honest shape is three parts, always: the number, the one unconfirmed thing, and the action
 * that resolves it. This function owns the first two; the action belongs to whoever renders it.
 */
export function totalCostPicture(
  programme: ProgrammeLike,
  schemes: readonly FundingScheme[],
): CostPicture {
  const known: CostLine[] = [];
  const missing: string[] = [];
  for (const [field, label, name] of COST_FIELDS) {
    const r = renderField(programme[field] as string | undefined);
    if (r.kind === 'value') known.push({ label, value: r.text, field: name, caveated: r.caveated });
    else missing.push(r.kind === 'unverified' ? `${label} — the source says nobody published it` : `${label} — not collected`);
  }

  const corrections: string[] = [];
  if ((programme.costDisputed ?? '') !== '') {
    corrections.push(programme.costDisputed as string);
    missing.unshift('The recorded cost band is disputed by verified prose — the band below is wrong');
  }

  const matches = schemesForProgramme(programme, schemes);
  const split = splitByFit(matches);

  const parts: string[] = [];
  parts.push(
    known.length > 0
      ? `Known: ${known.map((k) => `${k.label.toLowerCase()} — ${k.value.replace(/\s+/g, ' ').slice(0, 120)}`).join('; ')}.`
      : 'Nothing about the cost of this programme was published.',
  );
  if (missing.length > 0) parts.push(`Missing: ${missing.join('; ')}.`);
  parts.push(
    `${split.eligible} scheme${split.eligible === 1 ? '' : 's'} could apply on the published rules, ` +
      `${split.unknown} never say, ${split.excluded} are ruled out.`,
  );
  parts.push('No total is shown, because a total made partly of unknowns is a number he would remember as a fact.');

  return {
    programme: `${programme.institution} — ${programme.programme}`,
    known,
    missing,
    corrections,
    split,
    schemes: matches,
    total: null,
    sentence: parts.join(' '),
  };
}
