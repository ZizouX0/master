/**
 * Not a degree — the records sold as a master's that are not one.
 *
 * A third of everything collected in this door is not a degree, which is the highest
 * proportion of any field this project searched: Door 3 is where the private audio-school
 * market lives. He needs a student visa, and a certificate is not a route to one.
 *
 * **135 of these carry no verdict at all.** Nobody opened their page and judged them,
 * because there was nothing to judge — the disqualification is structural and it lives in
 * `level`, `qualification` and `accreditation`. So this view never leans on a verdict, and
 * it never shows an empty verdict slot for them either: they were judged, by a different
 * mechanism, and each entry states what it actually awards.
 *
 * Grouped by the pattern rather than by country, because the pattern is what he has to
 * recognise on a website he finds himself next month:
 *
 *   · *título propio* / *máster propio* — a Spanish institution's own certificate, outside
 *     the state register, no ECTS-bearing official master's status.
 *   · the French *Mastère* at RNCP level 5–6 — bachelor level or below, whatever the name
 *     suggests. "Mastère" is a trade name; "Master" is the protected one.
 *   · the Italian *Master di I livello* — a 60-credit first-level course that sits beside
 *     the laurea magistrale, not in place of it.
 *   · the Portuguese *pós-graduação* — a postgraduate course that awards no degree.
 *   · the UK validation chain — SAE Glasgow's MA is awarded by Hertfordshire, dBs by
 *     Falmouth, Thinkspace by AUB, Leeds Conservatoire by Hull, ACM by Middlesex. ICMP is
 *     the exception that makes the pattern worth learning: it has had its own
 *     degree-awarding powers since November 2021.
 *   · dBs Institute — a real Falmouth-awarded degree, and **international students are
 *     accepted on the online programmes only, which means no student visa.** It is in this
 *     room because the outcome is the same: it does not move him to Europe.
 */

import { useMemo } from 'preact/hooks';
import { useStore } from '../store';
import type { DetailMap, ProgrammeIndex } from '../types';
import { distinctCount } from '../data/dedup';
import { pluralise, renderField } from '../lib/format';
import { LevelChip, VerdictChip } from '../components/chips';
import { Field } from '../components/Field';
import { Empty, Page } from '../components/Layout';
import { BackLink, RecStyles, Section, recordHref } from './Record';

// ─────────────────────────────────────────────────────────────────────────────
// Patterns
// ─────────────────────────────────────────────────────────────────────────────

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
 * "MA awarded by the University of Hertfordshire" and the like. The award is usually real;
 * the school on the sign is not the body that grants it, and that is the thing to notice.
 */
const AWARDED_BY = /\b(awarded|validated|accredited) by\b|\baward is made by\b|\bawarding (body|institution)\b/i;

/**
 * Named once, because it is the exception the whole pattern is worth learning for. Anchored
 * to the start of the institution string on purpose: SAE Glasgow's record reads "SAE
 * Institute Glasgow … delivered with ICMP", and SAE Glasgow is the textbook validated
 * provider — its MA is awarded by the University of Hertfordshire. Only a record whose
 * institution IS ICMP gets the exemption.
 */
const ICMP = /^\s*(the\s+)?(ICMP\b|Institute of Contemporary Music Performance)/i;

/**
 * ICMP has held full degree-awarding powers since November 2021 — it is the exception that
 * makes the pattern worth learning, and the phrasings below are the ones its records use
 * ("holds its own taught-degree awarding powers", "awarded by ICMP itself").
 */
const OWN_POWERS =
  /(holds?|has|held|with)\s(its\s|their\s)?own[^.|]{0,30}degree[- ]awarding powers|full degree-awarding powers|degree[- ]awarding powers since/i;

/** The private-academy belt: the chains that sell "Master" without awarding one. */
const ACADEMY_CHAIN =
  /abbey road institute|sae institute|microfusa|point blank|herman brood|cev\b|cice\b|deviare|\btai\b|ucam|francisco de vitoria/i;

/**
 * True for the UK records whose degree comes from somebody else's charter.
 *
 * Four conditions, and each one removes a class of false positive that would teach him the
 * wrong pattern:
 *
 *   UK           — this is a UK regulatory arrangement, not a general one;
 *   a degree     — a record that awards nothing has no awarding body to argue about;
 *   private      — every UK public university awards under its own charter, and York, Bath
 *                  Spa, UAL and Leeds Beckett all have prose containing the words "awarded
 *                  by". Flagging them would be false;
 *   not its own  — ICMP holds its own taught-degree awarding powers, so it is the one
 *                  private provider here that is NOT a validated one.
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

interface Pattern {
  id: PatternId;
  title: string;
  /** What it actually awards, and why that is not a master's degree. */
  says: string;
  test: (row: ProgrammeIndex, blob: string) => boolean;
}

/**
 * First match wins, so the order is the specificity order. Everything is matched against
 * the record's own words — `level`, `qualification`, `accreditation`, the programme name —
 * never against a verdict, because 135 of these have none.
 */
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
    says: 'This is below the degree he already holds.',
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
      "These ARE degrees, and that is why they are subtle. The teaching provider is not the awarding body: SAE Glasgow's MA is awarded by the University of Hertfordshire, Thinkspace by AUB, Leeds Conservatoire by Hull, ACM by Middlesex, dBs by Falmouth. ICMP is the exception that makes the pattern worth learning — it has held full degree-awarding powers since November 2021, so it is not a validated provider. And Point Blank has no postgraduate provision at all. What to check on any school's site: whose name is on the certificate.",
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
    title: 'Aggregate entries — a list, not a programme',
    says:
      'These rows describe a group of institutions or a directory page rather than one programme. They are kept because they are how several real programmes were found, but there is nothing here to apply to.',
    test: (row) => /aggregate/i.test(row.level),
  },
  {
    id: 'funding',
    title: 'Money filed as a course',
    says: 'This is a funding scheme that landed in the programme sweep. It belongs in Money.',
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

export function classify(row: ProgrammeIndex, blob: string): PatternId {
  for (const p of PATTERNS) if (p.test(row, blob)) return p.id;
  return 'other';
}

/** Everything the pattern test reads. Falls back to the index fields before detail arrives. */
function blobFor(row: ProgrammeIndex, detail: DetailMap | null): string {
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

// ─────────────────────────────────────────────────────────────────────────────

function Entry({ row, detail }: { row: ProgrammeIndex; detail: DetailMap | null }) {
  const d = detail?.[row.key];
  return (
    <li class="rec-item">
      <a class="rec-link" href={recordHref(row)} style="font-weight:600">
        {row.programme || '(no programme name)'}
      </a>
      <p class="rec-sub" style="margin:0.25rem 0 0">
        {[row.institution, row.city, row.country].filter(Boolean).join(' · ')}
      </p>
      <div class="rec-chips">
        <LevelChip level={row.level} isDegree={row.isDegree} />
        {row.verdict !== '' ? <VerdictChip verdict={row.verdict} /> : null}
      </div>
      {/* What it actually awards. This is the evidence, in place of the verdict it has not got. */}
      <Field label="What it awards" value={d?.qualification ?? ''} wide />
      <Field label="Accreditation" value={d?.accreditation ?? ''} wide />
    </li>
  );
}

function Group({
  pattern,
  rows,
  detail,
}: {
  pattern: Pattern;
  rows: readonly ProgrammeIndex[];
  detail: DetailMap | null;
}) {
  if (rows.length === 0) return null;
  const unchecked = rows.filter((r) => r.verdict === '').length;
  return (
    <details class="rec-section">
      <summary class="rec-h3" style="cursor:pointer; min-height:44px; display:flex; align-items:center; gap:0.5rem">
        <span>{pattern.title}</span>
        <span class="rec-count rec-sub">
          {rows.length} {rows.length === 1 ? 'record' : 'records'}
        </span>
      </summary>
      <p class="rec-quote">{pattern.says}</p>
      <p class="rec-note">
        <span class="rec-count">{unchecked}</span> of these{' '}
        {unchecked === 1 ? 'carries' : 'carry'} no verdict. Nothing here rests on one.
      </p>
      <ul style="list-style:none;padding:0;margin:0.5rem 0 0">
        {rows.map((r) => (
          <Entry row={r} detail={detail} key={r.key} />
        ))}
      </ul>
    </details>
  );
}

export default function NotDegree() {
  const status = useStore((s) => s.status);
  const index = useStore((s) => s.index);
  const detail = useStore((s) => s.detail);
  const detailStatus = useStore((s) => s.detailStatus);

  const grouped = useMemo(() => {
    // Three kinds of record belong in this room: the ones that award no degree, dBs (a real
    // degree with no visa route), and the UK validation chain (a real degree awarded by a body
    // other than the school on the sign). All three end the same way — they are not the thing
    // he thinks he is buying — and each group says which of the three it is.
    const rows = index.filter(
      (r) =>
        !r.isDegree ||
        /\bdbs\b/i.test(r.institution) ||
        isValidationChain(r, blobFor(r, detail)),
    );
    const byPattern = new Map<PatternId, ProgrammeIndex[]>();
    for (const row of rows) {
      const id = classify(row, blobFor(row, detail));
      const bucket = byPattern.get(id);
      if (bucket) bucket.push(row);
      else byPattern.set(id, [row]);
    }
    return { rows, byPattern };
  }, [index, detail]);

  if (status !== 'ready') {
    return (
      <Page title="Not a degree">
        <RecStyles />
        <div class="rec-wrap">
          <p class="rec-note">{status === 'error' ? 'The data did not load.' : 'Loading the records…'}</p>
        </div>
      </Page>
    );
  }

  const { rows, byPattern } = grouped;
  const notDegree = rows.filter((r) => !r.isDegree);
  const unchecked = notDegree.filter((r) => r.verdict === '').length;

  return (
    <Page title="Not a degree">
      <RecStyles />
      <div class="rec-wrap">
        <BackLink href="#/">Where you stand</BackLink>
        <h1 class="rec-h1">
          <span class="rec-count">{notDegree.length}</span> of{' '}
          <span class="rec-count">{index.length}</span> are sold as a master's and are not one.
        </h1>
        <p class="rec-quote">
          That is <span class="rec-count">{pluralise(distinctCount(notDegree), 'distinct programme')}</span>{' '}
          once duplicate rows are collapsed, and{' '}
          <span class="rec-count">{unchecked}</span> of them carry no verdict — nobody opened their
          page to judge them, because there was nothing to judge. The disqualification is structural:
          it lives in what the thing awards. He needs a student visa, and a certificate is not a
          route to one.
        </p>
        <p class="rec-note">
          Grouped by the pattern rather than by country, because the pattern is what he has to
          recognise on a school's website next month. Each entry states what it actually awards.
        </p>
        {detailStatus !== 'ready' ? (
          <p class="rec-warn">
            {detailStatus === 'error'
              ? 'The prose file did not load, so the qualification and accreditation lines are missing and the grouping is running on names alone.'
              : 'The prose is still loading. Grouping is running on the record names until it arrives; the qualification lines fill in.'}
          </p>
        ) : null}

        <Section label="The patterns">
          {rows.length === 0 ? (
            <Empty>No non-degree records in the current data.</Empty>
          ) : (
            PATTERNS.map((p) => (
              <Group pattern={p} rows={byPattern.get(p.id) ?? []} detail={detail} key={p.id} />
            ))
          )}
        </Section>

        <p class="rec-note" style="margin-top:2rem">
          Levels recorded across this set:{' '}
          {[...new Set(rows.map((r) => renderField(r.level).text))].join(' · ')}.
        </p>
      </div>
    </Page>
  );
}
