/**
 * My list — the tracker.
 *
 * The critique's verdict was that the browsing features are decoration and **the tracker is
 * the product**: after week one the corpus is not what changes, he is. So this view holds
 * his decisions and his sentences, grouped by what he has done about each one, with the
 * note shown in full and never truncated — in month seven he will re-find a programme and
 * need to know why he already said no.
 *
 * Two things it must do that a spreadsheet cannot, and one it must confess:
 *
 *  · every record shows its next action and its deadline, the deadline through
 *    `deadlineDisplay()` so a `PRIOR CYCLE` string can never surface as a 2027 date;
 *  · **export to JSON and to Markdown, and import back**, in one click, so his work can
 *    leave the browser. The textarea is the primary path rather than the download, because
 *    a download is inert inside a sandboxed frame and copy-paste always works on a phone;
 *  · it says plainly that this lives in browser storage and can be evicted.
 *
 * Everything keys on `row.key` — hash(institution + programme + url) — never on `id`, which
 * is positional and moves on the next re-export. An entry whose record has vanished from the
 * data is still listed, by key, rather than silently dropped.
 */

import { useMemo, useRef, useState } from 'preact/hooks';
import { useStore } from '../store';
import { STATUSES, type Entry, type ProgrammeIndex, type Status } from '../types';
import { deadlineDisplay, formatTimestamp, pluralise } from '../lib/format';
import { CostChip, VerdictChip } from '../components/chips';
import { Empty, Page } from '../components/Layout';
import { BackLink, RecStyles, STATUS_LABEL, Section, recordHref } from './Record';

/** Doing first, deciding next, dead last. `none` is only shown when he wrote something. */
const ORDER: readonly Status[] = ['applying', 'emailed', 'applied', 'shortlist', 'rejected', 'ruled-out', 'none'];

const BLURB: Record<Status, string> = {
  applying: 'In progress. These are the ones with a form open.',
  emailed: 'Waiting on a reply. This is the status with a clock on it.',
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

function Tracked({ entry, row, deadline }: { entry: Entry; row: ProgrammeIndex | undefined; deadline: string }) {
  const setStatus = useStore((s) => s.setStatus);
  const setNote = useStore((s) => s.setNote);
  const setNextAction = useStore((s) => s.setNextAction);
  const clearEntry = useStore((s) => s.clearEntry);
  const d = deadlineDisplay(deadline);

  return (
    <li class="rec-item">
      {row ? (
        <>
          <a class="rec-link" href={recordHref(row)} style="font-weight:600">
            {row.programme || '(no programme name)'}
          </a>
          <p class="rec-sub" style="margin:0.25rem 0 0">
            {[row.institution, row.city, row.country].filter(Boolean).join(' · ')}
          </p>
          <div class="rec-chips">
            <VerdictChip verdict={row.verdict} />
            <CostChip band={row.costBand} disputed={row.costDisputed !== ''} />
          </div>
        </>
      ) : (
        <p class="rec-say">
          <strong>A record that is no longer in the data.</strong> Its key is{' '}
          <span class="rec-mono">{entry.key}</span>. Your note is kept — nothing you wrote is
          deleted because a re-export moved the rows.
        </p>
      )}

      <p class={`rec-block rec-tone-${d.tone}`} style="margin:0.5rem 0">
        <span class="rec-label">Deadline — {d.label}</span>
        {d.kind === 'prior-cycle' ? (
          <span class="rec-note">
            Previous cycle. The 2027 date is not published — confirming it is an email you can send
            today.
          </span>
        ) : null}
      </p>

      <label class="rec-label" for={`na-${entry.key}`}>
        Next action
      </label>
      <input
        id={`na-${entry.key}`}
        class="rec-input"
        type="text"
        value={entry.nextAction}
        placeholder="the one thing that moves this forward"
        onInput={(e) => setNextAction(entry.key, (e.currentTarget as HTMLInputElement).value)}
      />

      <label class="rec-label" for={`nt-${entry.key}`} style="margin-top:0.5rem">
        My note
      </label>
      <textarea
        id={`nt-${entry.key}`}
        class="rec-textarea"
        value={entry.note}
        onInput={(e) => setNote(entry.key, (e.currentTarget as HTMLTextAreaElement).value)}
      />

      <div class="rec-controls-row" style="margin-top:0.5rem">
        <select
          class="rec-select"
          style="max-width:12rem"
          value={entry.status}
          onChange={(e) => setStatus(entry.key, (e.currentTarget as HTMLSelectElement).value as Status)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button type="button" class="rec-btn" onClick={() => clearEntry(entry.key)}>
          Remove from my list
        </button>
        <span class="rec-sub">edited {formatTimestamp(entry.updated)}</span>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export / import
// ─────────────────────────────────────────────────────────────────────────────

function offerDownload(name: string, text: string, mime: string): void {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch {
    // A sandboxed frame blocks page-initiated downloads. The textarea above is the real path.
  }
}

function Transfer() {
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
      /* selection is left in place; Cmd/Ctrl-C works */
    });
    setMsg('Copied — or selected, if the browser refused. Ctrl/Cmd-C finishes it.');
  };

  return (
    <Section label="Get it out of the browser">
      <p class="rec-warn">
        This list lives in this browser's storage on this device. Clearing site data, a private
        window, or iOS evicting an unused site takes it with it. There is no account and no server —
        export is the backup.
      </p>
      {storageError ? (
        <p class="rec-warn">
          The browser refused the last save: <span class="rec-mono">{storageError}</span>. Export now.
        </p>
      ) : null}
      <p class="rec-note">
        {lastExportedAt ? `Last exported ${formatTimestamp(lastExportedAt)}.` : 'Never exported.'}
      </p>

      <div class="rec-chips">
        <button
          type="button"
          class="rec-btn"
          onClick={() => {
            const text = exportMarkdown();
            setOut({ kind: 'md', text });
            setMsg('');
          }}
        >
          Export Markdown
        </button>
        <button
          type="button"
          class="rec-btn"
          onClick={() => {
            const text = exportJson();
            setOut({ kind: 'json', text });
            setMsg('');
          }}
        >
          Export JSON
        </button>
      </div>

      {out ? (
        <>
          <label class="rec-label" for="rec-out">
            {out.kind === 'md' ? 'my-shortlist.md' : 'state.json'} — select and copy
          </label>
          <textarea id="rec-out" class="rec-export" ref={outRef} readOnly value={out.text} />
          <div class="rec-chips">
            <button type="button" class="rec-btn" onClick={copy}>
              Copy
            </button>
            <button
              type="button"
              class="rec-btn"
              onClick={() =>
                offerDownload(
                  out.kind === 'md' ? 'my-shortlist.md' : 'door3-state.json',
                  out.text,
                  out.kind === 'md' ? 'text/markdown' : 'application/json',
                )
              }
            >
              Download the file
            </button>
          </div>
        </>
      ) : null}

      <label class="rec-label" for="rec-in" style="margin-top:1.5rem">
        Import — paste a previously exported <span class="rec-mono">state.json</span>
      </label>
      <textarea
        id="rec-in"
        class="rec-export"
        style="min-height:6rem"
        value={inText}
        placeholder='{"format":"door3-personal", …}'
        onInput={(e) => setInText((e.currentTarget as HTMLTextAreaElement).value)}
      />
      <div class="rec-chips">
        <button
          type="button"
          class="rec-btn"
          onClick={() => {
            try {
              const r = importJson(inText, 'merge');
              setMsg(`Merged ${pluralise(r.imported, 'entry', 'entries')}. Where both sides had edited one record, the later edit won and both notes were kept.`);
            } catch (err) {
              setMsg(`That did not parse as an export: ${String(err)}`);
            }
          }}
        >
          Merge into this list
        </button>
        <button
          type="button"
          class="rec-btn"
          onClick={() => {
            try {
              const r = importJson(inText, 'replace');
              setMsg(`Replaced everything with ${pluralise(r.imported, 'entry', 'entries')}.`);
            } catch (err) {
              setMsg(`That did not parse as an export: ${String(err)}`);
            }
          }}
        >
          Replace this list
        </button>
      </div>
      {msg ? (
        <p class="rec-say" aria-live="polite">
          {msg}
        </p>
      ) : null}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MyList() {
  const status = useStore((s) => s.status);
  const index = useStore((s) => s.index);
  const detail = useStore((s) => s.detail);
  const entries = useStore((s) => s.personal.entries);

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

  if (status !== 'ready') {
    return (
      <Page title="My list">
        <RecStyles />
        <div class="rec-wrap">
          <p class="rec-note">{status === 'error' ? 'The data did not load.' : 'Loading…'}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="My list">
      <RecStyles />
      <div class="rec-wrap">
        <BackLink href="#/">Where you stand</BackLink>
        <h1 class="rec-h1">
          {total === 0 ? 'Nothing on your list yet.' : `${pluralise(total, 'programme')} on your list.`}
        </h1>
        {total > 0 ? (
          <p class="rec-quote">
            {waiting > 0
              ? `${pluralise(waiting, 'of them is', 'of them are')} waiting on an email you sent.`
              : 'Nothing is waiting on a reply.'}{' '}
            This is the part of the app that is about you rather than about the data, and it is the
            part that is worth keeping.
          </p>
        ) : (
          <Empty>
            Star a record, or set its status, and it appears here with your note, your next action
            and its deadline. Nothing is tracked until you say so.
          </Empty>
        )}

        {ORDER.map((s) => {
          const list = groups.get(s);
          if (!list || list.length === 0) return null;
          return (
            <Section label={`${STATUS_LABEL[s]} — ${list.length}`} key={s}>
              <p class="rec-note">{BLURB[s]}</p>
              <ul style="list-style:none;padding:0;margin:0">
                {list.map((e) => (
                  <Tracked
                    entry={e}
                    row={byKey.get(e.key)}
                    deadline={detail?.[e.key]?.deadline ?? ''}
                    key={e.key}
                  />
                ))}
              </ul>
            </Section>
          );
        })}

        <Transfer />
      </div>
    </Page>
  );
}
