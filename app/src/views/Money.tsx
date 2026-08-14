/**
 * Money — the 120 funding schemes.
 *
 * The view opens on the finding that organises the whole set: **nationality was rarely the
 * bar. Subject was.** Eiffel excludes the arts, NAWA Banach is STEM-only (and Tunisia *is*
 * on its country list), the Islamic Development Bank funds science and engineering, the
 * OPEC Fund funds development. His software-engineering BSc fits all four — it is the
 * master's subject that fails them. The numbers under that sentence are computed from the
 * data, never typed in.
 *
 * Each scheme's fields are ordered by **what disqualifies fastest**:
 *
 *   whoCanApply → subjectScope → requiresWorkExperience → ageLimit →
 *   requiresAdmissionFirst → coverage → deadlines → how to apply → notes
 *
 * The two structured eligibility fields cannot be filtered on as they stand:
 * `requiresWorkExperience` is empty on 72 of 120, and `requiresAdmissionFirst` has seven
 * spellings of yes and no plus `UNVERIFIED` plus blanks. Everything below therefore
 * normalises first, and — the rule that matters — **an unknown is never presented as a
 * "no"**. A filter that says "no work-experience bar" keeps only the schemes where somebody
 * actually said so, and states on screen how many it set aside as unconfirmed.
 *
 * Chevening is the case that proves the rule: its `requiresWorkExperience` cell is EMPTY,
 * and its prose says he needs 2,800 post-bachelor hours and cannot use the scheme before
 * roughly 2029. `workExperienceBar()` reads the prose when the field is silent, so the app
 * cannot present it as available to him.
 */

import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../store';
import type { FundingScheme } from '../types';
import { hasValue, pluralise, renderField } from '../lib/format';
import { Field, FieldGroup } from '../components/Field';
import { Empty, Page } from '../components/Layout';
import { BackLink, DeadlineBlock, RecStyles, Section } from './Record';

// ─────────────────────────────────────────────────────────────────────────────
// The applicant. One person, and the annotations below are about him specifically.
// ─────────────────────────────────────────────────────────────────────────────

/** Tunisian, software-engineering BSc, ~24 when he applies for the September 2027 intake. */
export const AGE_AT_APPLICATION = 24;
export const AGE_AT_ENTRY = 25;

// ─────────────────────────────────────────────────────────────────────────────
// Normalisers. Every one of them has a fourth answer — "nobody said" — and it is
// never folded into "no".
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
 * plus a long tail of sentences ("No at application; yes later", "Effectively YES", "n/a -
 * there is no scholarship to apply for"). This changes the ORDER of his year, so a wrong
 * "no" costs him a cycle.
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
 * `requiresWorkExperience` is non-empty on only 48 of 120, so the field alone cannot answer
 * the question. When it is silent this reads `whoCanApply` and `notes` for a work-experience
 * bar and says where it found one. Chevening's cell is empty; its prose is not.
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

/**
 * `ageLimit` is empty on 23, `None found` / `None stated` on many more, `UNVERIFIED` on
 * several, and prose everywhere else. Only an explicit upper bound is treated as a cap; a
 * bare number in a sentence is not one.
 */
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
  const cap = band ? Number(band[2]) : upper ? Number(upper[1]) : null;
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
 * The verifier sometimes wrote the conclusion into the prose in so many words — Chevening's
 * `whoCanApply` ends "HE IS NOT ELIGIBLE for the 2027/28 cycle". That is a finding about him,
 * not about Tunisia, and it is kept separate so the app never reports the wrong reason: on
 * Chevening the country page lists Tunisia, and what actually stops him is 2,800 hours of
 * post-bachelor work he does not have.
 */
export function statedIneligible(f: FundingScheme): string {
  const hit = /\bhe (is|would be) not eligible\b[^.]*\.|\bnot eligible\b[^.]{0,80}\./i.exec(
    `${f.whoCanApply} ${f.notes}`,
  );
  return hit && /\bhe\b/i.test(hit[0]) ? hit[0].trim() : '';
}

/**
 * Nationality, read from `whoCanApply`. Three answers, and "unstated" is one of them: 84 of
 * 120 schemes name Tunisia, a handful exclude it, and the rest simply never say. Saying "no"
 * for those would invent a bar; saying "yes" would invent a permission.
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
// Filters
// ─────────────────────────────────────────────────────────────────────────────

interface MoneyFilters {
  tunisian: boolean;
  ageOk: boolean;
  noOfferFirst: boolean;
  noWorkBar: boolean;
}

const NO_FILTERS: MoneyFilters = { tunisian: false, ageOk: false, noOfferFirst: false, noWorkBar: false };

function keeps(read: SchemeRead, f: MoneyFilters): boolean {
  if (f.tunisian && read.nationality.kind === 'excluded') return false;
  if (f.ageOk && read.age.kind !== 'no' && read.age.kind !== 'unknown') return false;
  if (f.noOfferFirst && read.admission.kind !== 'no') return false;
  if (f.noWorkBar && read.work.kind !== 'no') return false;
  return true;
}

/** How many rows a filter removed *only because nobody confirmed the answer*. */
function setAside(reads: readonly SchemeRead[], f: MoneyFilters): number {
  let n = 0;
  for (const r of reads) {
    if (keeps(r, f)) continue;
    const unknownOnly =
      (!f.noOfferFirst || r.admission.kind !== 'yes') &&
      (!f.noWorkBar || r.work.kind !== 'yes') &&
      (!f.ageOk || r.age.kind !== 'yes') &&
      (!f.tunisian || r.nationality.kind !== 'excluded');
    if (unknownOnly) n++;
  }
  return n;
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ComponentChildren;
}) {
  return (
    <button type="button" class={on ? 'rec-btn rec-btn-on' : 'rec-btn'} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The scheme page — `#/f/:id`
// ─────────────────────────────────────────────────────────────────────────────

function Answer({ label, value }: { label: string; value: Normalised | { kind: string; label: string } }) {
  const tone =
    value.kind === 'yes' ? 'rec-tag-confirmed' : value.kind === 'no' ? 'rec-tag-neutral' : 'rec-tag-suspected';
  return (
    <p class="rec-label" style="margin-top:0.75rem">
      <span class={`rec-tag ${tone}`}>{value.kind === 'unknown' ? 'nobody said' : value.kind}</span>
      {label}: {value.label}
    </p>
  );
}

function SchemePage({ scheme }: { scheme: FundingScheme }) {
  const read = readScheme(scheme);
  return (
    <article class="rec-wrap">
      <BackLink href="#/money">All 120 schemes</BackLink>
      <h1 class="rec-h1">{scheme.name}</h1>
      <p class="rec-inst">{scheme.provider || 'Provider not recorded'}</p>
      <p class="rec-where">{scheme.country || 'Country not recorded'}</p>

      {read.blockers.length > 0 ? (
        <strong class="rec-banner">
          Blocked for him today: {read.blockers.join(' · ')}.
        </strong>
      ) : null}
      {read.unknowns.length > 0 ? (
        <p class="rec-warn">
          Nobody confirmed: {read.unknowns.join(' · ')}. These are open questions, not permissions —
          the app does not read an empty field as a "no".
        </p>
      ) : null}

      <Section label="Can he apply at all?">
        {read.ineligible !== '' ? (
          <div class="rec-block rec-block-red">
            <p class="rec-label">The verification prose answers this outright</p>
            <p class="rec-quote">{read.ineligible}</p>
          </div>
        ) : null}
        <Answer label="Nationality" value={read.nationality} />
        <Field label="Who can apply" value={scheme.whoCanApply} wide />

        <Answer label="Subject" value={read.subject} />
        <Field label="Subject scope" value={scheme.subjectScope} wide />
        {read.subject.kind === 'blocked' ? (
          <p class="rec-note">
            This is the pattern that repeats across the set: his software-engineering BSc fits the
            scheme, and the master's subject is what fails it.
          </p>
        ) : null}

        <Answer label="Work experience" value={read.work} />
        {read.work.source === 'prose' ? (
          <div class="rec-block rec-block-red">
            <p class="rec-label">The structured field is empty — this came from the prose</p>
            <p class="rec-quote">{read.work.evidence}</p>
          </div>
        ) : null}
        <Field label="Requires work experience (as recorded)" value={scheme.requiresWorkExperience} wide />

        <Answer label="Age" value={read.age} />
        <Field label="Age limit (as recorded)" value={scheme.ageLimit} wide />

        <Answer label="Admission first" value={read.admission} />
        <Field label="Requires admission first (as recorded)" value={scheme.requiresAdmissionFirst} wide />
        <Field label="Language requirement" value={scheme.languageRequirement} wide />
      </Section>

      <Section label="What does it pay?">
        <FieldGroup title="Coverage">
          <Field label="Coverage" value={scheme.coverage} wide />
          <Field label="Duration" value={scheme.duration} />
          <Field label="Number of awards" value={scheme.numberOfAwards} />
          <Field label="Competitiveness" value={scheme.competitiveness} wide />
        </FieldGroup>
      </Section>

      <Section label="When, and how">
        <DeadlineBlock raw={scheme.deadline} />
        <Field label="Opens" value={scheme.opens} />
        <Field label="How to apply" value={scheme.howToApply} wide />
        {read.admission.kind === 'yes' ? (
          <p class="rec-note">
            An offer is needed before this is worth filing, so the admission application has to run
            first. That ordering is the thing that costs a cycle when it is discovered late.
          </p>
        ) : null}
      </Section>

      <Section label="Notes">
        <Field label="Notes" value={scheme.notes} wide />
        <Field label="Found by" value={scheme.foundBy} />
        {hasValue(scheme.url) ? (
          <p>
            <a class="rec-link rec-mono" href={scheme.url} rel="noreferrer noopener" target="_blank">
              {scheme.url}
            </a>
          </p>
        ) : (
          <Field label="Official page" value={scheme.url} wide />
        )}
      </Section>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The list — `#/money`
// ─────────────────────────────────────────────────────────────────────────────

function SchemeRow({ read }: { read: SchemeRead }) {
  const s = read.scheme;
  return (
    <li class="rec-item">
      <a class="rec-link" href={`#/f/${s.id}`} style="font-weight:600">
        {s.name}
      </a>
      <p class="rec-sub" style="margin:0.25rem 0 0">
        {[s.provider, s.country].filter(Boolean).join(' · ')}
      </p>
      <p style="margin:0.375rem 0 0">
        {read.blockers.map((b) => (
          <span class="rec-tag rec-tag-confirmed" key={b}>
            {b} bar
          </span>
        ))}
        {read.blockers.length === 0 ? (
          <span class="rec-tag rec-tag-neutral">nothing found that stops him</span>
        ) : null}
        {read.unknowns.length > 0 ? (
          <span class="rec-tag rec-tag-suspected">{read.unknowns.length} unconfirmed</span>
        ) : null}
      </p>
      <p class="rec-sub" style="margin:0.375rem 0 0">
        {renderField(s.subjectScope).text.slice(0, 160)}
        {s.subjectScope.length > 160 ? '…' : ''}
      </p>
    </li>
  );
}

function MoneyList({ schemes }: { schemes: readonly FundingScheme[] }) {
  const [filters, setFilters] = useState<MoneyFilters>(NO_FILTERS);
  const reads = useMemo(() => schemes.map(readScheme), [schemes]);

  const nationalityBar = reads.filter((r) => r.nationality.kind === 'excluded').length;
  const named = reads.filter((r) => r.nationality.kind === 'named').length;
  const unstated = reads.filter((r) => r.nationality.kind === 'unstated').length;
  const subjectBar = reads.filter((r) => r.subject.kind === 'blocked').length;
  const workEmpty = reads.filter((r) => (r.scheme.requiresWorkExperience ?? '').trim() === '').length;
  const admissionUnknown = reads.filter((r) => r.admission.kind === 'unknown').length;

  const shown = reads.filter((r) => keeps(r, filters));
  const aside = setAside(reads, filters);
  const ordered = shown
    .slice()
    .sort((a, b) => a.blockers.length - b.blockers.length || a.unknowns.length - b.unknowns.length || a.scheme.id - b.scheme.id);

  const toggle = (k: keyof MoneyFilters) => () => setFilters({ ...filters, [k]: !filters[k] });

  return (
    <div class="rec-wrap">
      <BackLink href="#/">Where you stand</BackLink>
      <h1 class="rec-h1">Nationality was rarely the bar. Subject was.</h1>
      <p class="rec-quote">
        Tunisia is named as eligible in <span class="rec-count">{named}</span> of the{' '}
        <span class="rec-count">{schemes.length}</span> schemes and explicitly excluded in only{' '}
        <span class="rec-count">{nationalityBar}</span>. What kills them is the subject:{' '}
        <span class="rec-count">{subjectBar}</span> fund science, engineering or development and
        exclude the arts outright. Eiffel, NAWA Banach, the Islamic Development Bank and the OPEC
        Fund all take a Tunisian software-engineering graduate happily — and none of them will pay
        for a master's in music production.
      </p>
      <p class="rec-note">
        <span class="rec-count">{unstated}</span> schemes never mention a nationality scope at all.
        That is not a yes and it is not a no, and nothing below treats it as either.
      </p>

      <Section label="Filter by what disqualifies fastest">
        <div class="rec-chips">
          <Toggle on={filters.tunisian} onClick={toggle('tunisian')}>
            A Tunisian can apply
          </Toggle>
          <Toggle on={filters.ageOk} onClick={toggle('ageOk')}>
            An age cap he clears
          </Toggle>
          <Toggle on={filters.noOfferFirst} onClick={toggle('noOfferFirst')}>
            No offer needed first
          </Toggle>
          <Toggle on={filters.noWorkBar} onClick={toggle('noWorkBar')}>
            No work-experience bar
          </Toggle>
        </div>
        <p class="rec-say" aria-live="polite">
          <span class="rec-count">{ordered.length}</span> of{' '}
          <span class="rec-count">{schemes.length}</span> schemes shown.
          {aside > 0 ? (
            <>
              {' '}
              <span class="rec-count">{aside}</span> more were set aside because nobody confirmed the
              answer — they are unknowns, not refusals.
            </>
          ) : null}
        </p>
        <p class="rec-note">
          Normalised before filtering: <span class="rec-count">{workEmpty}</span> schemes have an
          empty <code>requiresWorkExperience</code> cell, so the prose is read instead;{' '}
          <span class="rec-count">{admissionUnknown}</span> have a{' '}
          <code>requiresAdmissionFirst</code> value that no reading settles. Neither is shown as a
          "no".
        </p>
      </Section>

      <Section label={`All ${schemes.length} schemes`}>
        {ordered.length === 0 ? (
          <Empty>Nothing clears all of those filters. Drop one — the unknowns are where the work is.</Empty>
        ) : (
          <ul style="list-style:none;padding:0;margin:0">
            {ordered.map((r) => (
              <SchemeRow read={r} key={r.scheme.id} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Money() {
  const status = useStore((s) => s.status);
  const funding = useStore((s) => s.funding);
  const route = useStore((s) => s.route);

  const match = /^\/f\/(\d+)$/.exec(route.path);
  const scheme = match ? funding.find((f) => f.id === Number(match[1])) : undefined;

  if (status !== 'ready') {
    return (
      <Page title="Money">
        <RecStyles />
        <div class="rec-wrap">
          <p class="rec-note">{status === 'error' ? 'The data did not load.' : 'Loading the funding schemes…'}</p>
        </div>
      </Page>
    );
  }

  if (match && !scheme) {
    return (
      <Page title="Money">
        <RecStyles />
        <div class="rec-wrap">
          <BackLink href="#/money">All 120 schemes</BackLink>
          <Empty>No funding scheme at this address.</Empty>
        </div>
      </Page>
    );
  }

  return (
    <Page title={scheme ? scheme.name : `Money — ${pluralise(funding.length, 'scheme')}`}>
      <RecStyles />
      {scheme ? <SchemePage scheme={scheme} /> : <MoneyList schemes={funding} />}
    </Page>
  );
}
