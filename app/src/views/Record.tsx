/**
 * THE RECORD — the best thing in the app, rebuilt on the desk.
 *
 * Field order is "what disqualifies fastest, and what a human actually checked, before anything a
 * machine guessed". Five things this file exists to get right:
 *
 *  1. **`correction` — workbook column G — appears in full.** Not truncated, not clamped, not
 *     behind a disclosure, and above the money, because a correction usually invalidates the
 *     money. Its absence is the single defect that killed the first attempt at this app.
 *  2. **The dates come from `calendar.json` and nowhere else.** The record's own `deadline` field
 *     is shown as a quotation of what was recorded, never as a date: 188 of these strings carry
 *     the PRIOR CYCLE marker and most of them contain a perfectly parseable 2026 date that would
 *     be a lie about 2027. And every calendar date arrives with what stands in front of it.
 *  3. **Money is joined here, once.** `totalCostPicture` puts corrections ahead of any figure and
 *     returns `total: null` by design — a total made partly of unknowns is a number he would
 *     remember as a fact. The scheme list keeps `unknown` and `excluded` visible and never lets
 *     either read as a yes.
 *  4. **`isDegree === false` is a banner at title weight**, above the title, because 57 of those
 *     records have "Master", "Máster" or "Mastère" in the name and the title itself misleads. The
 *     pattern behind it — título propio, RNCP Mastère, the UK validation chain — is stated here,
 *     which is where the screen that used to hold it has gone.
 *  5. **"DUPLICATE of index N" is printed and never followed.** All 65 of those pointers cross a
 *     country boundary; they are stale ids from the source workbook's id space.
 *
 * The document renders in two frames. On a laptop it is the right-hand pane of `Find`, beside the
 * list it came from, because comparing is the job. On a narrow window it is its own page. Same
 * route either way — `#/record/:key`.
 */

import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import { useStore } from '../store';
import { STATUSES, type ProgrammeDetail, type ProgrammeIndex, type Status } from '../types';
import { auditionCertainty } from '../data/filters';
import { entriesForProgramme, isoDay, statusOf } from '../data/calendar';
import { schemesForProgramme, splitByFit, totalCostPicture, type SchemeMatch } from '../data/money';
import { patternFor } from '../data/patterns';
import {
  formatTimestamp,
  hasValue,
  mentionsStaleDuplicatePointer,
  pluralise,
  renderField,
  splitUrls,
  deadlineDisplay,
} from '../lib/format';
import { ChannelStrip } from '../components/ChannelStrip';
import { LevelChip, Meta, VerdictWord, bandLabel } from '../components/chips';
import { Field, FieldGroup } from '../components/Field';
import { Band, Blocking, CalendarWhen, Invite, Screen, type Tab } from './kit';

// ─────────────────────────────────────────────────────────────────────────────
// Routing
// ─────────────────────────────────────────────────────────────────────────────

/** The durable link. `key` is hash(institution + programme + url) and survives a re-export. */
export function recordHref(row: Pick<ProgrammeIndex, 'key'>): string {
  return `#/record/${row.key}`;
}

const RECORD_PATH = /^\/(record|g)\/(.+)$/;
const LEGACY_ID = /^\/p\/(\d+)$/;

export function isRecordPath(path: string): boolean {
  return RECORD_PATH.test(path) || LEGACY_ID.test(path);
}

/**
 * `#/record/:key` is canonical. `#/p/:id` still resolves because links were shared with row
 * numbers in them, and it is exactly the address that goes stale: `id` is positional and every
 * record after an inserted one shifts by one on the next export. Nothing is ever persisted
 * against it.
 */
export function resolveRecord(
  path: string,
  index: readonly ProgrammeIndex[],
): ProgrammeIndex | undefined {
  const byKey = RECORD_PATH.exec(path);
  if (byKey) {
    const key = decodeURIComponent(byKey[2]!);
    return index.find((r) => r.key === key);
  }
  const byId = LEGACY_ID.exec(path);
  if (byId) {
    const id = Number(byId[1]);
    return index.find((r) => r.id === id);
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal state. Keyed on `key`, never on `id`.
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

export function PersonalControls({ recordKey }: { recordKey: string }): JSX.Element {
  const entry = useStore((s) => s.personal.entries[recordKey]);
  const setStatus = useStore((s) => s.setStatus);
  const setNote = useStore((s) => s.setNote);
  const setNextAction = useStore((s) => s.setNextAction);
  const status: Status = entry?.status ?? 'none';
  const tracked = status !== 'none';

  return (
    <div>
      <div class="v-row">
        <button
          type="button"
          class={tracked ? 'btn btn--accent' : 'btn'}
          aria-pressed={tracked}
          onClick={() => setStatus(recordKey, tracked ? 'none' : 'shortlist')}
        >
          {tracked ? 'On your shortlist' : 'Add to your shortlist'}
        </button>
        <select
          class="v-select"
          aria-label="Status"
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

      <label class="v-label" for={`na-${recordKey}`}>
        Next action
      </label>
      <input
        id={`na-${recordKey}`}
        class="v-input"
        type="text"
        placeholder="the one thing that moves this forward"
        value={entry?.nextAction ?? ''}
        onInput={(e) => setNextAction(recordKey, (e.currentTarget as HTMLInputElement).value)}
      />

      <label class="v-label" for={`nt-${recordKey}`}>
        Your note
      </label>
      <textarea
        id={`nt-${recordKey}`}
        class="v-input v-textarea"
        placeholder="Your words. Nothing else on this page is editable; this is."
        value={entry?.note ?? ''}
        onInput={(e) => setNote(recordKey, (e.currentTarget as HTMLTextAreaElement).value)}
      />
      {entry ? (
        <p class="v-src">Last edited {formatTimestamp(entry.updated)}. Stored in this browser only.</p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blocks
// ─────────────────────────────────────────────────────────────────────────────

function Say(p: { children: ComponentChildren }): JSX.Element {
  return <p class="t-prose-2" style="margin-bottom:12px">{p.children}</p>;
}

/**
 * One dispute, with the phrase that fired it and its provenance. `confirmed` means it came from
 * verified `correction` prose; `suspected` means it came from the raw `audition` field, which
 * nobody re-read. A suspicion must never wear the authority of a confirmation, and it is never
 * hidden either — one he can disprove in two sentences is worth more to him than one removed.
 */
function Dispute(p: {
  title: string;
  phrase: string;
  certainty: 'confirmed' | 'suspected';
  meaning: string;
}): JSX.Element {
  return (
    <div class="v-correction" style={p.certainty === 'suspected' ? 'border-left-color: var(--meter-over)' : ''}>
      <p class="v-correction__name" style={p.certainty === 'suspected' ? 'color: var(--meter-over)' : ''}>
        {p.certainty} · {p.title}
      </p>
      <Say>{p.meaning}</Say>
      <p class="v-correction__text">{p.phrase}</p>
    </div>
  );
}

/**
 * `auditionCertainty` already promotes `gate: "AUDITION — hardest for you"` to confirmed.
 * `needsAudition` is folded in on top so records 253, 254, 258, 259 and 260 — all of them free,
 * all of them `Exam/interview only` or `Portfolio only`, all of them carrying a live piano test a
 * verified correction found — can never render as reachable.
 */
export function auditionRung(row: ProgrammeIndex): 'confirmed' | 'suspected' | 'none-found' {
  if (row.needsAudition) return 'confirmed';
  return auditionCertainty(row);
}

// ─────────────────────────────────────────────────────────────────────────────
// Money
// ─────────────────────────────────────────────────────────────────────────────

const FIT_WORD = {
  eligible: 'Could apply on the published rules',
  unknown: 'Nobody said',
  excluded: 'Ruled out',
} as const;

function Scheme(p: { match: SchemeMatch }): JSX.Element {
  const m = p.match;
  return (
    <div class="v-scheme">
      <p class="v-scheme__name">{m.scheme.name}</p>
      <p class="meta">
        <span class="meta__seg">
          <span class="meta__t">{m.scheme.provider || 'provider not recorded'}</span>
        </span>
        <span class="meta__seg">
          <span class="meta__t">{m.tier}</span>
        </span>
      </p>
      <p class="v-scheme__why">
        “{m.because}” — {m.becauseField}
      </p>
      {m.gaps.map((g) => (
        <p class="v-scheme__gap" key={g}>
          unknown · {g}
        </p>
      ))}
    </div>
  );
}

function MoneySection(p: { row: ProgrammeIndex; detail: ProgrammeDetail | undefined }): JSX.Element {
  const funding = useStore((s) => s.funding);
  const fundingStatus = useStore((s) => s.fundingStatus);
  const ensureFunding = useStore((s) => s.ensureFunding);
  const disputed = p.row.costDisputed !== '';

  // 74.6 KB, fetched by the first screen that actually needs a scheme — which is this one.
  useEffect(() => ensureFunding(), [ensureFunding]);

  const programme = { ...p.row, ...p.detail };
  const picture = useMemo(
    () => (funding.length > 0 ? totalCostPicture(programme, funding) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.row.key, funding],
  );
  const matches: SchemeMatch[] = picture?.schemes ?? [];
  const split = picture ? picture.split : splitByFit(matches);

  const eligible = matches.filter((m) => m.fit === 'eligible');
  const unknown = matches.filter((m) => m.fit === 'unknown');
  const excluded = matches.filter((m) => m.fit === 'excluded');

  return (
    <Band name="What it costs, and what could pay for it">
      {/* The correction lands before any figure. A wrong number shown quietly is worse than none. */}
      {disputed ? (
        <div class="v-correction">
          <p class="v-correction__name">The recorded band is wrong</p>
          <Say>
            The record still says <span class="t-struck">{bandLabel(p.row.costBand)}</span>. A human re-read the
            official page and found that false, so this programme is excluded from every cheap and free
            selection in the app. The sentence below is the figure to trust.
          </Say>
          <p class="v-correction__text">{p.row.costDisputed}</p>
        </div>
      ) : (
        <p class="meta" style="margin-bottom:12px">
          <span class="meta__seg">
            <span class="meta__t">{bandLabel(p.row.costBand)}</span>
          </span>
          <span class="meta__seg">
            <span class="meta__t">funding recorded: {p.row.funding || 'not stated'}</span>
          </span>
        </p>
      )}

      <FieldGroup title="What somebody published">
        <Field label="Tuition" value={p.detail?.tuition ?? ''} wide />
        <Field label="Other fees" value={p.detail?.otherFees ?? ''} />
        <Field label="Total cost as recorded" value={p.detail?.totalCost ?? ''} />
        <Field label="Scholarship" value={p.detail?.scholarship ?? ''} />
        <Field label="Scholarship detail" value={p.detail?.scholarshipDetail ?? ''} wide />
      </FieldGroup>

      {picture && picture.missing.length > 0 ? (
        <>
          <p class="v-label">What nobody published</p>
          {picture.missing.map((m) => (
            <p class="v-scheme__gap" key={m}>
              {m}
            </p>
          ))}
        </>
      ) : null}

      <p class="v-src" style="margin-top:16px">
        No total is shown. A figure made partly of unknowns is the thing he would remember as a fact, and
        the living-cost line on most of these records is marked unverified by its own source.
      </p>

      <div class="v-band__head" style="margin-top:24px">
        <h3 class="v-band__name">Money that could reach this programme</h3>
        <span class="v-band__n">
          {fundingStatus === 'ready' || funding.length > 0 ? matches.length : '…'}
        </span>
      </div>

      {fundingStatus === 'error' ? (
        <p class="v-warn">
          The 120 funding schemes did not load, so this section is empty. Everything else on this page is
          unaffected. Reload to try again.
        </p>
      ) : funding.length === 0 ? (
        <p class="v-src">Reading the 120 schemes…</p>
      ) : matches.length === 0 ? (
        <p class="v-src">
          No scheme in the 120 has a country scope that reaches {p.row.country}, and none names this
          institution. That is an absence of matches, not a refusal.
        </p>
      ) : (
        <>
          <p class="v-src" style="margin-bottom:8px">
            {split.eligible} could apply on the published rules · {split.unknown} never say who may apply ·{' '}
            {split.excluded} state a bar you fail. A silence is not a yes: most of these schemes simply do
            not publish a nationality or a subject scope.
          </p>

          {eligible.length > 0 ? (
            <>
              <p class="v-label">{FIT_WORD.eligible}</p>
              {eligible.map((m) => (
                <Scheme key={m.scheme.id} match={m} />
              ))}
            </>
          ) : (
            <p class="v-src">
              Not one of the {matches.length} says outright that you could apply. That is the honest state of
              this dataset, and it is what an email to each of them would change.
            </p>
          )}

          {unknown.length > 0 ? (
            <details class="v-filters" style="margin-top:16px">
              <summary>
                {unknown.length} never say who can apply — listed, never counted
              </summary>
              <div class="v-filters__body">
                {unknown.map((m) => (
                  <Scheme key={m.scheme.id} match={m} />
                ))}
              </div>
            </details>
          ) : null}

          {excluded.length > 0 ? (
            <details class="v-filters">
              <summary>{excluded.length} state a bar you fail — kept, so you do not re-check them</summary>
              <div class="v-filters__body">
                {excluded.map((m) => (
                  <Scheme key={m.scheme.id} match={m} />
                ))}
              </div>
            </details>
          ) : null}
        </>
      )}
    </Band>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// When
// ─────────────────────────────────────────────────────────────────────────────

function WhenSection(p: { row: ProgrammeIndex; detail: ProgrammeDetail | undefined }): JSX.Element {
  const calendar = useStore((s) => s.calendar);
  const now = useStore((s) => s.now);
  const entries = calendar ? entriesForProgramme(calendar, p.row.key) : [];
  const live = entries.filter((e) => statusOf(e, now) !== 'closed');
  const closed = entries.filter((e) => statusOf(e, now) === 'closed');
  const recorded = deadlineDisplay(p.detail?.deadline ?? '', now);

  return (
    <Band name="When">
      {entries.length === 0 ? (
        <p class="t-prose-2" style="margin-bottom:12px">
          No date for this programme has been confirmed by a human, so this app shows none. Twelve to forty
          hand-checked dates is the whole calendar; a record that is not in it has a date nobody has yet
          asked for. Asking is one email.
        </p>
      ) : null}

      {[...live, ...closed].map((e) => {
        const blockedBy = calendar ? calendar.prerequisites.filter((q) => q.blocks.includes(e.id)) : [];
        const dueDay = e.window ? e.window.to : e.date!;
        return (
          <article class="v-item" key={e.id}>
            <span class="v-item__title">{e.label}</span>
            <CalendarWhen entry={e} now={now} />
            {e.note ? <p class="v-src">{e.note}</p> : null}
            <Blocking list={blockedBy} dueDay={dueDay} today={isoDay(now)} />
            <p class="v-src">
              “{e.quote}” — {e.source}
            </p>
          </article>
        );
      })}

      <div class="v-band__head" style="margin-top:24px">
        <h3 class="v-band__name">What the record itself said</h3>
      </div>
      <p class="v-src" style="margin-bottom:8px">
        Read as: {recorded.label}. This is shown as a quotation, not as a date — 188 records carry a PRIOR
        CYCLE marker and most of those strings contain a real 2026 date that would be a lie about 2027.
      </p>
      <Field label="Deadline, as recorded" value={p.detail?.deadline ?? ''} wide />
      <Field label="Applications open, as recorded" value={p.detail?.opens ?? ''} wide />
    </Band>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The document
// ─────────────────────────────────────────────────────────────────────────────

export function RecordDocument(p: { row: ProgrammeIndex }): JSX.Element {
  const row = p.row;
  const detailMap = useStore((s) => s.detail);
  const detailStatus = useStore((s) => s.detailStatus);
  const index = useStore((s) => s.index);
  const detail: ProgrammeDetail | undefined = detailMap?.[row.key];

  const correction = detail?.correction ?? '';
  const stale = mentionsStaleDuplicatePointer(correction);
  const certainty = auditionRung(row);
  const pattern = patternFor(row, detailMap);
  const urls = splitUrls(detail?.url ?? '');
  const members = useMemo(() => index.filter((r) => r.g === row.g), [index, row.g]);

  return (
    <article class="channel v-doc">
      <div class="channel__strip">
        <ChannelStrip
          verdict={row.verdict}
          gate={row.gate}
          needsAudition={row.needsAudition}
          auditionSource={row.auditionSource}
          hasVerifiedDispute={row.hasVerifiedDispute}
          costDisputed={row.costDisputed}
          isDegree={row.isDegree}
          ladderBase={132}
        />
      </div>

      <div class="channel__body">
        {/* Rule 1 of the kill test: visible without clicking, at title weight, above the title. */}
        {row.isDegree === false ? <LevelChip level={row.level} isDegree={false} /> : null}

        <h1 class="t-title">{row.programme || 'No programme name was recorded'}</h1>
        <p class="t-inst" style="margin-top:4px">
          {row.institution || 'Institution not recorded'}
          <br />
          <span class="t-strip">{[row.city, row.country, row.region].filter(Boolean).join(' · ')}</span>
        </p>

        <p class="v-row" style="margin-top:12px">
          <VerdictWord verdict={row.verdict} />
        </p>
        <Meta
          costBand={row.costBand}
          costDisputed={row.costDisputed}
          language={row.language}
          languageOk={row.languageOk}
          gate={row.gate}
          needsAudition={row.needsAudition}
          auditionSource={row.auditionSource}
        />

        {detailStatus !== 'ready' ? (
          <p class="v-warn">
            {detailStatus === 'error'
              ? 'The prose file did not load, so the correction, the entry route and the portfolio brief are missing from this page. What you see is card-level data only. Reload before you decide anything.'
              : 'The prose is still loading. The correction, the entry route and the portfolio brief appear as soon as it arrives.'}
          </p>
        ) : null}

        <Band name="Your state">
          <PersonalControls recordKey={row.key} />
        </Band>

        {/* ── the verdict, and column G in full ─────────────────────────── */}
        <Band name="What a human found">
          {row.verdict === '' ? (
            <Say>
              Nobody has opened this institution’s official page. Everything below came from a search listing
              and may be out of date, wrong, or about a different programme with a similar name. Treat every
              line as a lead, not a fact — that is what the empty slot on the strip means.
            </Say>
          ) : (
            <Field label="Why" value={detail?.verdictWhy ?? ''} wide />
          )}

          <div class="v-correction">
            <p class="v-correction__name">Correction — workbook column G</p>
            {stale ? (
              <Say>
                This correction names another record by index. Those pointers are stale: they come from the
                source workbook’s id space and every one of them crosses a country boundary, so the sentence
                is printed and the number is followed nowhere. Do not go looking for that index.
              </Say>
            ) : null}
            {correction.trim() === '' ? (
              <p class="v-scheme__gap">
                {detailStatus === 'ready'
                  ? 'No correction was recorded for this record.'
                  : 'Loading the corrections…'}
              </p>
            ) : (
              <p class="v-correction__text">{correction}</p>
            )}
          </div>

          {row.costDisputed !== '' ? (
            <Dispute
              title="The recorded cost is contradicted"
              phrase={row.costDisputed}
              certainty="confirmed"
              meaning={`The band still reads "${row.costBand}". A human re-read the official page and found that wrong, so this record is out of every cheap and free selection in the app.`}
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
                  : 'This phrase was matched in the raw audition field, which nobody re-checked against the official page. It is a lead, not a fact — two sentences of their page settle it. Read the full audition text below before you act on it.'
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
          {row.costDisputed === '' && row.auditionDisputed === '' && row.existenceDisputed === '' ? (
            <p class="v-src">
              No contradiction was recorded between this record’s structured fields and its prose.
            </p>
          ) : null}
        </Band>

        {/* ── the pattern, folded in from the screen that was cut ────────── */}
        {pattern ? (
          <Band name="What this actually awards">
            <p class="t-cardtitle" style="margin-bottom:8px">
              {pattern.title}
            </p>
            <Say>{pattern.says}</Say>
            <Field label="Qualification awarded" value={detail?.qualification ?? ''} wide />
            <Field label="Accreditation" value={detail?.accreditation ?? ''} wide />
          </Band>
        ) : null}

        {/* ── when ───────────────────────────────────────────────────────── */}
        <WhenSection row={row} detail={detail} />

        {/* ── can you get in ─────────────────────────────────────────────── */}
        <Band name="Can you get in">
          <Say>
            {certainty === 'confirmed'
              ? 'A live performance or ear test is confirmed here. This is the one gate a twelve-month portfolio build does not open.'
              : certainty === 'suspected'
                ? 'A phrase in the unchecked audition text looks like a live audition, and nobody confirmed it. Read the full text below before you rule this in or out.'
                : 'No audition phrase fired for this record — which is not the same as somebody confirming there is no audition.'}
          </Say>
          <FieldGroup title="Getting in">
            <Field label="Audition / entrance test, in full" value={detail?.audition ?? ''} wide />
            <Field label="What you must submit (portfolio)" value={detail?.portfolio ?? ''} wide />
            <Field label="Does it accept a non-music bachelor?" value={detail?.acceptsNonMusic ?? ''} wide />
            <Field label="Entry requirements" value={detail?.entry ?? ''} wide />
          </FieldGroup>
        </Band>

        {/* ── money ──────────────────────────────────────────────────────── */}
        <MoneySection row={row} detail={detail} />

        {/* ── what it is ─────────────────────────────────────────────────── */}
        <Band name="What it is">
          <FieldGroup title="The award">
            <Field label="Level" value={row.level} />
            <Field label="Subtype" value={row.subtype} />
            <Field label="Public or private" value={row.publicPrivate} />
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
            <p class="v-warn">
              Taught in {renderField(row.language).text}. That is not a language you read — French fluent,
              English working, no German.
            </p>
          ) : null}
        </Band>

        {/* ── other rows for the same programme ──────────────────────────── */}
        {members.length > 1 ? (
          <Band name="Other rows for this programme" count={members.length}>
            <Say>
              {pluralise(members.length, 'source row')} describe this same programme, from different discovery
              sweeps with different field coverage. The app counts them once and shows the fullest, and it does
              not quietly average them.
            </Say>
            {members.map((m) => (
              <p class="v-src" key={m.key}>
                <a href={recordHref(m)}>{m.programme || '(no programme name)'}</a> · row {m.id} · {m.costBand} ·{' '}
                {m.verdict === '' ? 'not checked' : m.verdict}
                {m.key === row.key ? ' · you are reading this one' : ''}
              </p>
            ))}
          </Band>
        ) : null}

        {/* ── source ─────────────────────────────────────────────────────── */}
        <Band name="Source">
          {urls.length > 0 ? (
            urls.map((u) => (
              <p class="v-src" key={u}>
                <a href={u} rel="noreferrer noopener" target="_blank">
                  {u}
                </a>
              </p>
            ))
          ) : (
            <Field label="Official page" value={detail?.url ?? ''} wide />
          )}
          <Field label="Found by" value={detail?.foundBy ?? ''} />
          <p class="v-src">
            {row.verdict !== ''
              ? 'Checked against the official page.'
              : 'Never checked. Everything above came from a listing, not from them.'}
          </p>
        </Band>

        {/* ── last, and deliberately quiet ───────────────────────────────── */}
        <Band name="An automatic guess, kept only for completeness">
          <p class="v-src">
            {hasValue(row.chance)
              ? `Rated ${renderField(row.chance).text} by a heuristic over a search-listing blurb. 28 records it rated Strong were judged AVOID once a human read the page, so a verdict outranks it everywhere.`
              : 'No automatic rating was recorded.'}
          </p>
          <p class="t-sentence t-sentence--guess" style="margin-top:8px">
            {renderField(row.whyChance).text}
          </p>
        </Band>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The standalone page — the narrow frame. On a laptop `Find` renders the document
// in its right-hand pane instead, on the same route.
// ─────────────────────────────────────────────────────────────────────────────

export default function Record(p: { tabs: Tab[]; path: string }): JSX.Element {
  const status = useStore((s) => s.status);
  const index = useStore((s) => s.index);
  const row = useMemo(() => resolveRecord(p.path, index), [p.path, index]);

  if (status !== 'ready') {
    return (
      <Screen title="Record" tabs={p.tabs} path={p.path}>
        <div class="v-col">
          <p class="t-prose">{status === 'error' ? 'The records did not load.' : 'Reading the records…'}</p>
        </div>
      </Screen>
    );
  }

  if (!row) {
    return (
      <Screen title="Record" tabs={p.tabs} path={p.path}>
        <div class="v-col">
          <Invite lead="No record at this address.">
            <p>
              A record link is its durable key — hash of institution, programme and source URL. If you
              followed an old link built from a workbook row number, the rows moved when the data was
              re-exported, which is exactly why nothing you write is keyed on them.
            </p>
            <p>
              <a class="btn btn--sm" href="#/find">
                Search all 398 records
              </a>
            </p>
          </Invite>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title={row.programme || row.institution || 'Record'} tabs={p.tabs} path={p.path}>
      <div class="v-col">
        <p style="margin-bottom:16px">
          <a class="btn btn--sm" href="#/find">
            ← Back to the search
          </a>
        </p>
        <RecordDocument row={row} />
      </div>
    </Screen>
  );
}
