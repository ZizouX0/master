/**
 * SHORTLIST — the tracker, which the critique called the product and which it is.
 *
 * After week one the corpus is not what changes; he is. So this holds his decisions and his own
 * sentences, grouped by what he has done about each, with the note shown in full and never
 * truncated — in month seven he will re-find a programme and need to know why he already said no.
 *
 * What changed in the rebuild:
 *
 *  · **The date beside a tracked record comes from `calendar.json`.** It used to come from the
 *    record's `deadline` field, which rendered HfMT Köln as "no confirmed date" while its own
 *    correction, three paragraphs down the same record, named 2 March. Where the calendar has
 *    nothing, this says so plainly instead of quoting a string that looks like a date.
 *  · **A published annual rule never renders as a date**, here as everywhere.
 *  · Export sits in its own column on a wide canvas rather than at the bottom of a scroll,
 *    because fifteen months in `localStorage` is a liability and the backup should be in view.
 *
 * Everything keys on `key` — hash(institution + programme + url) — never on `id`, which is
 * positional and moves on the next re-export. An entry whose record has vanished from the data is
 * still listed, by key, rather than silently dropped.
 */

import type { JSX } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { STATUSES, type Entry, type ProgrammeIndex, type Status } from '../types';
import { entriesForProgramme, statusOf } from '../data/calendar';
import { formatTimestamp, pluralise } from '../lib/format';
import { ChannelStrip } from '../components/ChannelStrip';
import { LevelChip, Meta, VerdictWord } from '../components/chips';
import { Band, CalendarWhen, Invite, Panel, Screen, Stat, type Tab } from './kit';
import { STATUS_LABEL, recordHref } from './Record';

/** Doing first, deciding next, dead last. `none` appears only when he wrote something on it. */
const ORDER: readonly Status[] = [
  'applying',
  'emailed',
  'applied',
  'shortlist',
  'rejected',
  'ruled-out',
  'none',
];

const BLURB: Record<Status, string> = {
  applying: 'A form is open. These are the ones with your hands on them.',
  emailed: 'Waiting on a reply from them.',
  applied: 'Filed. Nothing to do but wait.',
  shortlist: 'Deciding. Your note is shown in full.',
  rejected: 'They said no. Kept, so you do not re-find it in month seven and wonder.',
  'ruled-out': 'You said no. Your own reason is below it — that is the part a deleted row loses.',
  none: 'Not tracked, but you wrote something here.',
};

function tracked(e: Entry): boolean {
  return e.status !== 'none' || e.note.trim() !== '' || e.nextAction.trim() !== '';
}

// ─────────────────────────────────────────────────────────────────────────────
// One tracked record
// ─────────────────────────────────────────────────────────────────────────────

function Tracked(p: { entry: Entry; row: ProgrammeIndex | undefined }): JSX.Element {
  const setStatus = useStore((s) => s.setStatus);
  const setNote = useStore((s) => s.setNote);
  const setNextAction = useStore((s) => s.setNextAction);
  const clearEntry = useStore((s) => s.clearEntry);
  const calendar = useStore((s) => s.calendar);
  const now = useStore((s) => s.now);
  const e = p.entry;
  const row = p.row;

  const dates = row && calendar ? entriesForProgramme(calendar, row.key) : [];
  const live = dates.filter((d) => statusOf(d, now) !== 'closed');

  if (!row) {
    return (
      <article class="v-item">
        <p class="t-prose-2">
          <strong>A record that is no longer in the data.</strong> Its key is{' '}
          <span class="t-data">{e.key}</span>. Your note is kept — nothing you wrote is deleted because a
          re-export moved the rows.
        </p>
        <p class="v-src">{e.note || 'No note.'}</p>
        <p style="margin-top:8px">
          <button type="button" class="btn btn--sm" onClick={() => clearEntry(e.key)}>
            Remove it
          </button>
        </p>
      </article>
    );
  }

  return (
    <article class="v-item">
      <div class="channel">
        <div class="channel__strip">
          <ChannelStrip
            verdict={row.verdict}
            gate={row.gate}
            needsAudition={row.needsAudition}
            auditionSource={row.auditionSource}
            hasVerifiedDispute={row.hasVerifiedDispute}
            costDisputed={row.costDisputed}
            isDegree={row.isDegree}
          />
        </div>
        <div class="channel__body">
          {row.isDegree === false ? <LevelChip level={row.level} isDegree={false} /> : null}
          <a class="v-item__title" href={recordHref(row)}>
            {row.programme || '(no programme name)'}
          </a>
          <p class="v-item__inst">{[row.institution, row.city, row.country].filter(Boolean).join(' · ')}</p>
          <p style="margin:6px 0 4px">
            <VerdictWord verdict={row.verdict} />
          </p>
          <Meta
            costBand={row.costBand}
            costDisputed={row.costDisputed}
            language={row.language}
            languageOk={row.languageOk}
          />

          {live.length > 0 ? (
            live.map((d) => <CalendarWhen key={d.id} entry={d} now={now} />)
          ) : (
            <p class="v-src">
              {dates.length > 0
                ? 'Every confirmed date for this one has passed.'
                : 'No date for this programme has been confirmed. Asking them is one email, and it is the cheapest thing on your list.'}
            </p>
          )}

          <label class="v-label" for={`na-${e.key}`}>
            Next action
          </label>
          <input
            id={`na-${e.key}`}
            class="v-input"
            type="text"
            value={e.nextAction}
            placeholder="the one thing that moves this forward"
            onInput={(ev) => setNextAction(e.key, (ev.currentTarget as HTMLInputElement).value)}
          />

          <label class="v-label" for={`nt-${e.key}`}>
            Your note
          </label>
          <textarea
            id={`nt-${e.key}`}
            class="v-input v-textarea"
            value={e.note}
            onInput={(ev) => setNote(e.key, (ev.currentTarget as HTMLTextAreaElement).value)}
          />

          <div class="v-row" style="margin-top:12px">
            <select
              class="v-select"
              aria-label="Status"
              value={e.status}
              onChange={(ev) => setStatus(e.key, (ev.currentTarget as HTMLSelectElement).value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button type="button" class="btn btn--sm" onClick={() => clearEntry(e.key)}>
              Remove
            </button>
            <span class="v-src">edited {formatTimestamp(e.updated)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Getting it out of the browser
// ─────────────────────────────────────────────────────────────────────────────

function Transfer(): JSX.Element {
  const exportJson = useStore((s) => s.exportJson);
  const exportMarkdown = useStore((s) => s.exportMarkdown);
  const importJson = useStore((s) => s.importJson);
  const lastExportedAt = useStore((s) => s.personal.lastExportedAt);
  const storageError = useStore((s) => s.storageError);

  const [out, setOut] = useState<{ kind: 'json' | 'md'; text: string } | null>(null);
  const [inText, setInText] = useState('');
  const [msg, setMsg] = useState('');
  const outRef = useRef<HTMLTextAreaElement>(null);

  const copy = () => {
    const el = outRef.current;
    if (!el) return;
    el.select();
    void navigator.clipboard?.writeText(el.value).catch(() => {
      /* the selection is left in place; Ctrl/Cmd-C finishes it */
    });
    setMsg('Copied — or selected, if the browser refused. Ctrl/Cmd-C finishes it.');
  };

  return (
    <>
      <Panel name="Get it out of the browser">
        <p class="v-panel__says">
          This list lives in this browser on this machine. Clearing site data, a private window, or the
          browser evicting an unused site takes it with it. There is no account and no server — the export
          is the backup.
        </p>
        <p class="v-src" style="margin-top:8px">
          {lastExportedAt ? `Last exported ${formatTimestamp(lastExportedAt)}.` : 'Never exported.'}
        </p>
        {storageError ? (
          <p class="v-warn">
            The browser refused the last save: {storageError}. Export now, before you type anything else.
          </p>
        ) : null}

        <div class="v-row" style="margin-top:12px">
          <button
            type="button"
            class="btn btn--sm"
            onClick={() => {
              setOut({ kind: 'md', text: exportMarkdown() });
              setMsg('');
            }}
          >
            Export Markdown
          </button>
          <button
            type="button"
            class="btn btn--sm"
            onClick={() => {
              setOut({ kind: 'json', text: exportJson() });
              setMsg('');
            }}
          >
            Export JSON
          </button>
        </div>

        {out ? (
          <>
            <label class="v-label" for="out-box">
              {out.kind === 'md' ? 'my-shortlist.md' : 'state.json'} — select and copy
            </label>
            <textarea id="out-box" class="v-input v-textarea v-code" ref={outRef} readOnly value={out.text} />
            <p class="v-row" style="margin-top:8px">
              <button type="button" class="btn btn--sm" onClick={copy}>
                Copy
              </button>
            </p>
          </>
        ) : null}
      </Panel>

      <Panel name="Put it back">
        <label class="v-label" for="in-box" style="margin-top:0">
          Paste a previously exported state.json
        </label>
        <textarea
          id="in-box"
          class="v-input v-textarea"
          value={inText}
          placeholder='{"format":"door3-personal", …}'
          onInput={(e) => setInText((e.currentTarget as HTMLTextAreaElement).value)}
        />
        <div class="v-row" style="margin-top:8px">
          <button
            type="button"
            class="btn btn--sm"
            onClick={() => {
              try {
                const r = importJson(inText, 'merge');
                setMsg(
                  `Merged ${pluralise(r.imported, 'entry', 'entries')}. Where both sides had edited one record, the later edit won and both notes were kept.`,
                );
              } catch (err) {
                setMsg(`That did not parse as an export: ${String(err)}. Paste the whole file, braces included.`);
              }
            }}
          >
            Merge into this list
          </button>
          <button
            type="button"
            class="btn btn--sm"
            onClick={() => {
              try {
                const r = importJson(inText, 'replace');
                setMsg(`Replaced everything with ${pluralise(r.imported, 'entry', 'entries')}.`);
              } catch (err) {
                setMsg(`That did not parse as an export: ${String(err)}. Paste the whole file, braces included.`);
              }
            }}
          >
            Replace this list
          </button>
        </div>
        {msg ? (
          <p class="v-src" aria-live="polite">
            {msg}
          </p>
        ) : null}
      </Panel>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Shortlist(p: { tabs: Tab[]; path: string }): JSX.Element {
  const status = useStore((s) => s.status);
  const index = useStore((s) => s.index);
  const entries = useStore((s) => s.personal.entries);
  const calendar = useStore((s) => s.calendar);
  const now = useStore((s) => s.now);

  const byKey = useMemo(() => new Map(index.map((r) => [r.key, r])), [index]);
  const groups = useMemo(() => {
    const kept = Object.values(entries).filter(tracked);
    const out = new Map<Status, Entry[]>();
    for (const e of kept) {
      const bucket = out.get(e.status);
      if (bucket) bucket.push(e);
      else out.set(e.status, [e]);
    }
    for (const list of out.values()) list.sort((a, b) => b.updated.localeCompare(a.updated));
    return out;
  }, [entries]);

  const total = [...groups.values()].reduce((n, list) => n + list.length, 0);
  const waiting = groups.get('emailed')?.length ?? 0;

  /** How many tracked programmes have a confirmed date still ahead of them. */
  const dated = useMemo(() => {
    if (!calendar) return 0;
    let n = 0;
    for (const e of Object.values(entries)) {
      if (!tracked(e)) continue;
      const row = byKey.get(e.key);
      if (!row) continue;
      if (entriesForProgramme(calendar, row.key).some((d) => statusOf(d, now) !== 'closed')) n++;
    }
    return n;
  }, [entries, byKey, calendar, now]);

  if (status !== 'ready') {
    return (
      <Screen title="Shortlist" tabs={p.tabs} path={p.path}>
        <div class="v-col">
          <p class="t-prose">{status === 'error' ? 'The records did not load.' : 'Reading the records…'}</p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Shortlist" tabs={p.tabs} path={p.path} layout="aside">
      <div class="v-col">
        {total === 0 ? (
          <Invite lead="Nothing is on your shortlist yet.">
            <p>
              Open a record — from a band on This week, or from a search — and add it. It appears here with
              your note, your next action, and the dates a human actually confirmed for it.
            </p>
            <p>
              This is the part of the app that is about you rather than about the data, and it is the part
              worth keeping for the next fifty-six weeks.
            </p>
            <p style="margin-top:16px">
              <a class="btn btn--sm" href="#/find">
                Find something to put on it
              </a>
            </p>
          </Invite>
        ) : null}

        {ORDER.map((s) => {
          const list = groups.get(s);
          if (!list || list.length === 0) return null;
          return (
            <Band key={s} name={STATUS_LABEL[s]} count={list.length} says={BLURB[s]}>
              {list.map((e) => (
                <Tracked key={e.key} entry={e} row={byKey.get(e.key)} />
              ))}
            </Band>
          );
        })}
      </div>

      <aside class="v-col v-aside">
        {total > 0 ? (
          <Panel name="Your campaign">
            <Stat n={total}>programmes you are carrying</Stat>
            <Stat n={dated}>of them have a confirmed date still ahead</Stat>
            <Stat n={waiting}>waiting on a reply from them</Stat>
            <p class="v-panel__says" style="margin-top:12px">
              {total - dated > 0
                ? `${total - dated} have no confirmed date at all. That is not a gap in this app — it is a question nobody has asked them yet.`
                : 'Every one of them has a date.'}
            </p>
          </Panel>
        ) : null}
        <Transfer />
      </aside>
    </Screen>
  );
}
