/**
 * The not-a-degree patterns.
 *
 * A third of everything collected in this door is not a degree — the highest proportion of any
 * field this project searched, because Door 3 is where the private audio-school market lives. He
 * needs a student visa, and a certificate is not a route to one.
 *
 * This was a whole screen once. It should not be: it is a **read-once recognition pattern**, not
 * a weekly destination — the same eleven groups every day for fifty-six weeks. So the engine
 * moved here, out of the view that was cut, and the sentence it produces now appears where it is
 * actually needed: on the record of the programme he is looking at, right under the banner that
 * says the thing is not a master's.
 *
 * Nothing below reads a verdict. 135 of these records have none, because there was nothing to
 * judge: the disqualification is structural and it lives in `level`, `qualification` and
 * `accreditation`.
 */

import type { DetailMap, ProgrammeIndex } from '../types';

export type PatternId =
  | 'dbs-online'
  | 'titulo-propio'
  | 'rncp-mastere'
  | 'master-i-livello'
  | 'pos-graduacao'
  | 'private-academy'
  | 'uk-validation'
  | 'bachelor'
  | 'unclear'
  | 'aggregate'
  | 'funding'
  | 'other';

/**
 * "MA awarded by the University of Hertfordshire" and the like. The award is usually real; the
 * school on the sign is not the body that grants it, and that is the thing to notice.
 */
const AWARDED_BY =
  /\b(awarded|validated|accredited) by\b|\baward is made by\b|\bawarding (body|institution)\b/i;

/**
 * Anchored to the start of the institution string on purpose: SAE Glasgow's record reads "SAE
 * Institute Glasgow … delivered with ICMP", and SAE Glasgow is the textbook validated provider —
 * its MA is awarded by the University of Hertfordshire. Only a record whose institution IS ICMP
 * gets the exemption.
 */
const ICMP = /^\s*(the\s+)?(ICMP\b|Institute of Contemporary Music Performance)/i;

/** ICMP has held full degree-awarding powers since November 2021. */
const OWN_POWERS =
  /(holds?|has|held|with)\s(its\s|their\s)?own[^.|]{0,30}degree[- ]awarding powers|full degree-awarding powers|degree[- ]awarding powers since/i;

/** The private-academy belt: the chains that sell "Master" without awarding one. */
const ACADEMY_CHAIN =
  /abbey road institute|sae institute|microfusa|point blank|herman brood|cev\b|cice\b|deviare|\btai\b|ucam|francisco de vitoria/i;

/**
 * True for the UK records whose degree comes from somebody else's charter.
 *
 * Four conditions, each removing a class of false positive that would teach him the wrong
 * pattern: UK only (this is a UK regulatory arrangement); it must award a degree at all; private
 * only (York, Bath Spa, UAL and Leeds Beckett all have prose containing "awarded by" and
 * flagging them would be false); and not ICMP, the one private provider that awards its own.
 */
export function isValidationChain(row: ProgrammeIndex, blob: string): boolean {
  if (!/United Kingdom|England|Scotland|Wales/i.test(row.country)) return false;
  if (!row.isDegree) return false;
  if (!/private/i.test(row.publicPrivate)) return false;
  if (ICMP.test(row.institution)) return false;
  const text = `${row.institution} ${blob}`;
  if (OWN_POWERS.test(text)) return false;
  return AWARDED_BY.test(text);
}

export interface Pattern {
  id: PatternId;
  title: string;
  /** What it actually awards, and why that is not a master's degree. */
  says: string;
  test: (row: ProgrammeIndex, blob: string) => boolean;
}

/** First match wins, so the order is the specificity order. */
export const PATTERNS: readonly Pattern[] = [
  {
    id: 'dbs-online',
    title: 'dBs Institute — online only, so no student visa',
    says:
      'A real degree, awarded by Falmouth University. But dBs states that international students can enrol on the ONLINE postgraduate programmes only: there is no visa sponsorship for the campus route. The award is fine; the route out of Tunisia is not there.',
    test: (row) => /\bdbs\b/i.test(row.institution),
  },
  {
    id: 'bachelor',
    title: 'Bachelor / first cycle',
    says: 'This is below the degree you already hold.',
    test: (row) => /bachelor|first cycle/i.test(row.level),
  },
  {
    id: 'titulo-propio',
    title: 'Spanish título propio / máster propio',
    says:
      "The institution's own certificate. It is not the state-registered máster universitario, it carries no official ECTS status, and it does not open a doctorate. Spanish private academies sell it under the word Máster.",
    test: (_row, blob) => /t[íi]tulo propio|m[áa]ster propio|titulo propio/i.test(blob),
  },
  {
    id: 'rncp-mastere',
    title: 'French Mastère at RNCP level 5–6',
    says:
      'RNCP level 6 is bachelor level and level 5 is below it. "Mastère" is a school trade name; "Master" is the protected state title. Several of these cost around €15,000 a year for two years and award nothing at master\'s level.',
    test: (row, blob) => /RNCP/i.test(blob) || (/^France$/i.test(row.country) && /mast[èe]re/i.test(blob)),
  },
  {
    id: 'master-i-livello',
    title: 'Italian Master di I livello',
    says:
      'A 60-credit first-level course taken after the laurea triennale. It sits beside the laurea magistrale, not in place of it, and it is not the second-cycle degree a visa or a doctorate asks for.',
    test: (row, blob) => /master di i livello|primo livello/i.test(`${row.level} ${blob}`),
  },
  {
    id: 'pos-graduacao',
    title: 'Portuguese pós-graduação',
    says:
      'A postgraduate course that awards a certificate, not a mestrado. The Portuguese schools in this set run them alongside real degrees, and the word on the page is the only thing that separates them.',
    test: (_row, blob) => /p[óo]s-gradua/i.test(blob),
  },
  {
    id: 'uk-validation',
    title: 'The UK validation chain — a real degree, awarded by somebody else',
    says:
      "These ARE degrees, and that is why they are subtle. The teaching provider is not the awarding body: SAE Glasgow's MA is awarded by the University of Hertfordshire, Thinkspace by AUB, Leeds Conservatoire by Hull, ACM by Middlesex, dBs by Falmouth. ICMP is the exception that makes the pattern worth learning — it has held full degree-awarding powers since November 2021. What to check on any school's site: whose name is on the certificate.",
    test: (row, blob) => isValidationChain(row, blob),
  },
  {
    id: 'private-academy',
    title: 'The Spanish and Dutch private-academy belt',
    says:
      'Abbey Road Institute, SAE, Microfusa, CEV, CICE, Point Blank Ibiza, Herman Brood. Private schools selling a "Master" that is the school\'s own certificate — no state register, no ECTS-bearing official title, and in most cases no route to a doctorate. This is the largest single block of not-a-degree records in the door, and the marketing is indistinguishable from a real one.',
    test: (row, blob) =>
      ACADEMY_CHAIN.test(`${row.institution} ${blob}`) ||
      (/^(Spain|Netherlands|Belgium)$/i.test(row.country) && /private/i.test(row.publicPrivate)),
  },
  {
    id: 'unclear',
    title: 'Nobody could confirm what it awards',
    says:
      'The award could not be established from the official page. One email each — the national register settles it in a day, and a day is cheaper than an application.',
    test: (row) => /unclear/i.test(row.level),
  },
  {
    id: 'aggregate',
    title: 'Aggregate entry — a list, not a programme',
    says:
      'This row describes a group of institutions or a directory page rather than one programme. It is kept because it is how several real programmes were found, but there is nothing here to apply to.',
    test: (row) => /aggregate/i.test(row.level),
  },
  {
    id: 'funding',
    title: 'Money filed as a course',
    says: 'This is a funding scheme that landed in the programme sweep. It is money, not a course.',
    test: (row) => /funding scheme/i.test(row.level),
  },
  {
    id: 'other',
    title: 'Not a degree — no single pattern',
    says:
      'Recorded as not awarding a degree, without matching one of the named patterns. Read the qualification line: it is the evidence.',
    test: () => true,
  },
];

/** Everything the pattern test reads. Falls back to index fields before the prose arrives. */
export function patternBlob(row: ProgrammeIndex, detail: DetailMap | null): string {
  const d = detail?.[row.key];
  return [
    row.programme,
    row.institution,
    row.level,
    row.subtype,
    d?.qualification ?? '',
    d?.accreditation ?? '',
    d?.recommendation ?? '',
  ].join(' | ');
}

export function classify(row: ProgrammeIndex, blob: string): PatternId {
  for (const p of PATTERNS) if (p.test(row, blob)) return p.id;
  return 'other';
}

/**
 * The pattern to show on a record. Returns null for an ordinary degree that is not caught by the
 * two "real degree, wrong outcome" traps — dBs's online-only route and the UK validation chain.
 */
export function patternFor(row: ProgrammeIndex, detail: DetailMap | null): Pattern | null {
  const blob = patternBlob(row, detail);
  const relevant = !row.isDegree || /\bdbs\b/i.test(row.institution) || isValidationChain(row, blob);
  if (!relevant) return null;
  const id = classify(row, blob);
  return PATTERNS.find((p) => p.id === id) ?? null;
}
