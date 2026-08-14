/**
 * THIS WEEK — the home screen, and the only default destination.
 *
 * It replaces `Start`, which was a seven-row funnel from 355 records to 14 and three verdict
 * counters. That funnel was a correct argument about where the data came from, it was worth
 * making once, and it read identically on 14 August 2026 and on 3 January 2027. The test the
 * old home screen failed: **if a screen's content is the same on both those mornings, it is not
 * a campaign screen.** Everything below changes every single day.
 *
 * The five bands are `thisWeek(cal, now)` rendered in the order regret arrives:
 *
 *     overdue → closing → open now → opening → the making
 *
 * `overdue` is first because it is the only band that is already a loss: an artefact whose
 * latest safe start has passed does not announce itself, it just quietly closes a gate four
 * months later. `the making` is last and always present, because it is the band that is true for
 * all fifty-six weeks and the one he will otherwise defer.
 *
 * Two rules from the time layer are load-bearing here, and both are about not lying:
 *
 *  1. **A confirmed date and a published annual rule never share a visual channel.** 22 of the
 *     36 calendar entries are patterns — "the page says applications close 2 March each year" —
 *     and a pattern is evidence about when a window will probably fall, not a 2027 date. So they
 *     render in a separate sub-group, on a hatched edge, with no countdown, carrying the note
 *     that says why. A countdown against a guess is the most confident thing on a screen.
 *  2. **No date renders without its cost.** `Due.blockedBy` hands over the prerequisites, and
 *     "2 March 2027" alone is a lie when what stands between him and it is German A2 and two
 *     tracks he has not made. Every lead time on those is this app's own estimate and says so.
 */

import type { JSX } from 'preact';
import { useMemo } from 'preact/hooks';
import { useStore } from '../store';
import {
  closesOn,
  daysBetween,
  isoDay,
  opensOn,
  priorCycleCount,
  thisWeek,
  TARGET_INTAKE,
  type CalendarEntry,
  type Due,
  type Making,
  type Week,
} from '../data/calendar';
import { isVerified } from '../data/filters';
import { Band, Blocking, CalendarWhen, Invite, Panel, Screen, Stat, dayCount, longDate, type Tab } from './kit';

// ─────────────────────────────────────────────────────────────────────────────
// One dated thing
// ─────────────────────────────────────────────────────────────────────────────

const KIND_WORD: Record<CalendarEntry['kind'], string> = {
  application: 'application',
  scholarship: 'money',
  admin: 'admin',
};

function DueItem(p: { due: Due; today: string; now: Date; href: string | null }): JSX.Element {
  const e = p.due.entry;
  return (
    <article class="v-item">
      {p.href ? (
        <a class="v-item__title" href={p.href}>
          {e.label}
        </a>
      ) : (
        <span class="v-item__title">{e.label}</span>
      )}
      <p class="v-item__inst">{KIND_WORD[e.kind]}</p>
      <CalendarWhen entry={e} now={p.now} />
      {e.note ? <p class="v-src">{e.note}</p> : null}
      <Blocking list={p.due.blockedBy} dueDay={closesOn(e) ?? opensOn(e)!} today={p.today} />
      <p class="v-src">
        “{e.quote}” — {e.source}
      </p>
    </article>
  );
}

/**
 * One band, split in two: everything confirmed, then everything that is only a published rule.
 * They are never interleaved and never counted together — the count on the band head is the
 * confirmed count, and the patterns carry their own.
 */
function DueBand(p: {
  name: string;
  says: string;
  dues: Due[];
  today: string;
  now: Date;
  hrefFor: (key: string | undefined) => string | null;
}): JSX.Element | null {
  if (p.dues.length === 0) return null;
  const confirmed = p.dues.filter((d) => d.entry.confidence === 'confirmed');
  const patterns = p.dues.filter((d) => d.entry.confidence !== 'confirmed');
  return (
    <Band name={p.name} count={confirmed.length} says={p.says}>
      {confirmed.map((d) => (
        <DueItem key={d.entry.id} due={d} today={p.today} now={p.now} href={p.hrefFor(d.entry.programmeKey)} />
      ))}
      {confirmed.length === 0 ? (
        <p class="v-band__says">
          Nothing in this band is a confirmed date. What follows is only what their pages publish as a rule.
        </p>
      ) : null}
      {patterns.length > 0 ? (
        <>
          <div class="v-band__head" style="margin-top:24px">
            <h3 class="v-band__name">Published rules, same window — not dates</h3>
            <span class="v-band__n">{patterns.length}</span>
          </div>
          {patterns.map((d) => (
            <DueItem key={d.entry.id} due={d} today={p.today} now={p.now} href={p.hrefFor(d.entry.programmeKey)} />
          ))}
        </>
      ) : null}
    </Band>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The making — the band with no dates of its own, which is why it is dangerous
// ─────────────────────────────────────────────────────────────────────────────

function MakingItem(p: { making: Making }): JSX.Element {
  const m = p.making;
  const gate = m.nextGate;
  return (
    <article class="v-item">
      <span class="v-item__title">{m.prerequisite.label}</span>
      {gate ? (
        <p class="v-item__inst">
          Stands in front of {m.blocks.length === 1 ? '' : `${m.blocks.length} gates, first `}
          {gate.label}
        </p>
      ) : (
        <p class="v-item__inst">Everything it blocked has closed.</p>
      )}
      {m.latestSafeStart ? (
        <div class={'v-when' + (m.overdue ? ' v-when--soon' : '')}>
          <span class="v-when__role">{m.overdue ? 'should have started' : 'start within'}</span>
          <span class="v-when__days">{dayCount(m.daysUntilLatestSafeStart ?? 0)}</span>
          <span class="v-when__date">{longDate(m.latestSafeStart)}</span>
        </div>
      ) : null}
      <p class="v-src">
        {m.prerequisite.leadTimeNote} It is worked backwards from {gate ? gate.label : 'the gate it blocked'}, so
        it moves when that date moves.
      </p>
      <p class="v-src">
        “{m.prerequisite.quote}” — {m.prerequisite.source}
      </p>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ThisWeek(p: { tabs: Tab[]; path: string }): JSX.Element {
  const status = useStore((s) => s.status);
  const calendar = useStore((s) => s.calendar);
  const calendarStatus = useStore((s) => s.calendarStatus);
  const calendarError = useStore((s) => s.calendarError);
  const index = useStore((s) => s.index);
  const detail = useStore((s) => s.detail);
  const meta = useStore((s) => s.meta);
  const entries = useStore((s) => s.personal.entries);
  const now = useStore((s) => s.now);

  const today = isoDay(now);
  const week: Week | null = useMemo(
    () => (calendar ? thisWeek(calendar, now) : null),
    [calendar, now],
  );

  const byKey = useMemo(() => new Map(index.map((r) => [r.key, r])), [index]);
  const hrefFor = (key: string | undefined): string | null =>
    key && byKey.has(key) ? `#/record/${key}` : null;

  // The two honesty numbers the footer states. Both are computed, never typed.
  const neverChecked = index.filter((r) => !isVerified(r)).length;
  const priorCycle = useMemo(
    () =>
      detail
        ? priorCycleCount(Object.values(detail).map((d) => ({ deadline: d.deadline ?? '' })))
        : null,
    [detail],
  );

  const tracked = Object.values(entries).filter((e) => e.status !== 'none').length;
  const weeks = week?.weeksToIntake ?? Math.floor(daysBetween(today, TARGET_INTAKE) / 7);

  const footer = (
    <>
      <p>
        {week
          ? `${week.counts.confirmed} dates were confirmed by a human against the source. ${week.counts.recurringPattern} more are annual rules their pages publish, held apart above and never counted as dates. ${week.counts.closed} have already closed.`
          : 'The dates are not loaded.'}
      </p>
      <p>
        {priorCycle === null
          ? `${neverChecked} of ${index.length} records were never checked against an official page.`
          : `${priorCycle} records carry a deadline that describes a previous cycle; not one of them became a date here. ${neverChecked} of ${index.length} records were never checked against an official page at all.`}
      </p>
      <p>Snapshot {meta?.generated ?? '2026-08'} · mirrors results/DOOR3.xlsx · nothing is verified unless it says so.</p>
    </>
  );

  const clock = `${longDate(today)} · ${weeks} weeks to September 2027`;

  if (status !== 'ready' && calendarStatus !== 'ready') {
    return (
      <Screen title="This week" tabs={p.tabs} path={p.path} clock={clock}>
        <div class="v-col">
          <p class="t-prose">
            {status === 'error' ? 'The records did not load. Reload the page.' : 'Reading the dates…'}
          </p>
        </div>
      </Screen>
    );
  }

  if (!week) {
    return (
      <Screen title="This week" tabs={p.tabs} path={p.path} clock={clock} footer={footer}>
        <div class="v-col v-doc">
          <Invite lead="The dates did not load, so this screen has nothing to stand on.">
            <p>
              Every date in this app comes from one hand-checked file, <code>data/calendar.json</code>, and it
              is not there. Reload. If it still fails, the deploy is missing that file — everything else on the
              site works without it.
            </p>
            {calendarError ? <p class="v-src">{calendarError}</p> : null}
          </Invite>
        </div>
      </Screen>
    );
  }

  const laterMaking = week.making.filter((m) => !m.overdue);
  const nothingDated =
    week.overdue.length === 0 && week.closing.length === 0 && week.openNow.length === 0 && week.opening.length === 0;

  return (
    <Screen title="This week" tabs={p.tabs} path={p.path} clock={clock} layout="aside" footer={footer}>
      <div class="v-col">
        <p class="v-today">{clock}</p>
        {nothingDated ? (
          <Invite lead="Nothing is open, closing or opening this week.">
            <p>
              That is a real answer, not an empty screen: the next thing on the calendar is{' '}
              {week.making[0]?.nextGate?.label ?? 'still ahead'}. Use the week on the making below — it is the
              only work that has no deadline pushing it and the only work that takes months.
            </p>
          </Invite>
        ) : null}

        {/* 1 — already a loss. First, because nothing else on this page can be fixed retroactively. */}
        {week.overdue.length > 0 ? (
          <Band
            name="Already late"
            count={week.overdue.length}
            says="These are things you have to make, worked backwards from a gate that is still open. On this app's own lead-time estimates, the safe start has passed. They are not lost — the estimate is an estimate — but every day from here costs a day of the gate."
          >
            {week.overdue.map((m) => (
              <MakingItem key={m.prerequisite.id} making={m} />
            ))}
          </Band>
        ) : null}

        {/* 2 — closing */}
        <DueBand
          name="Closing"
          says="Inside three weeks of its close. This is the band that ends applications."
          dues={week.closing}
          today={today}
          now={now}
          hrefFor={hrefFor}
        />

        {/* 3 — open now */}
        <DueBand
          name="Open now"
          says="You can act on these today. Some published an opening and never a close: that is their silence, not an open door."
          dues={week.openNow}
          today={today}
          now={now}
          hrefFor={hrefFor}
        />

        {/* 4 — opening */}
        <DueBand
          name="Opening"
          says="Not open yet. The only work here is being ready on the day."
          dues={week.opening}
          today={today}
          now={now}
          hrefFor={hrefFor}
        />

        {/* 5 — the making. Always present, always last. */}
        <Band
          name="The making"
          count={`${week.making.length - week.overdue.length} of ${week.making.length}`}
          says="What you have to make or obtain. None of it has a deadline of its own, which is exactly why it closes gates that do. Every start date below is this app's arithmetic on this app's estimate."
        >
          {laterMaking.length === 0 ? (
            <p class="v-band__says">Everything here is already late — it is all in the first band.</p>
          ) : (
            laterMaking.map((m) => <MakingItem key={m.prerequisite.id} making={m} />)
          )}
        </Band>
      </div>

      <aside class="v-col v-aside">
        <Panel name="Where you stand">
          <Stat n={weeks}>weeks to the September 2027 intake</Stat>
          <Stat n={week.counts.confirmed}>dates a human confirmed against the source</Stat>
          <Stat n={week.counts.recurringPattern}>annual rules held apart from them</Stat>
          <Stat n={tracked} href="#/shortlist">
            programmes on your shortlist
          </Stat>
        </Panel>

        <Panel name="What the corpus is">
          <Stat n={neverChecked} href="#/find?chk=&v=unchecked">
            of {index.length} records nobody ever opened the page for
          </Stat>
          <Stat n={meta?.funding ?? 120} href="#/find">
            funding schemes, read on the record of the programme they could pay for
          </Stat>
          <p class="v-panel__says" style="margin-top:12px">
            Where a record carries no verdict it gets no mark at all. Absence of colour is absence of checking,
            not a pass.
          </p>
        </Panel>

        <Panel name="Next">
          <p class="v-panel__says">
            {tracked === 0
              ? 'Nothing is on your shortlist. Open a record from a band on the left, or search, and add it — the tracker is the part of this that is about you rather than about the data.'
              : 'Your shortlist carries your own note and your next action on each one.'}
          </p>
          <p class="v-row" style="margin-top:12px">
            <a class="btn btn--sm" href="#/find">
              Search 398 records
            </a>
            <a class="btn btn--sm" href="#/shortlist">
              Shortlist
            </a>
          </p>
        </Panel>
      </aside>
    </Screen>
  );
}
