/**
 * The desk, at the width he actually works at.
 *
 * `styles.css` owns the type, the colour and the channel strip, and it is not mine to edit. What
 * it does not own is the shape of a 1440px canvas: it was written for one 390px column. This file
 * adds that shape, in `v-`-prefixed rules that read the same tokens and never restate a selector
 * styles.css already uses, so the two stylesheets compose instead of fighting.
 *
 * Three decisions carry the layout:
 *
 *  1. **One chrome bar, left-aligned, at the top.** Not a bottom tab strip: a bottom bar with
 *     three enormous tabs on a laptop is a phone screenshot stretched to fit, and looking like
 *     a stretched phone app is the exact failure this rebuild exists to undo.
 *  2. **The width is spent on a second column, never on longer lines.** Prose caps at 40–42rem
 *     wherever it lands. `correction` runs to 900 characters; at 1440px unconstrained that is a
 *     150-character measure and nobody reads it. So the canvas gets a document column and a
 *     console column, and the console column is where the numbers, the dates and the controls go.
 *  3. **A console is a wide object.** Channels sit side by side. On `Find` that means the record
 *     opens BESIDE the list rather than on top of it — he is comparing, and keeping the list in
 *     view while reading one record is the thing neither a spreadsheet nor a phone can do.
 *
 * Below 1080px every grid collapses to the single column, and the record pane stops being a pane
 * and becomes its own page. The route is the same either way (`#/record/:key`); only the frame
 * around it changes.
 */

import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { formatIso } from '../lib/format';
import {
  closesOn,
  daysBetween,
  isoDay,
  opensOn,
  statusOf,
  type CalendarEntry,
  type Prerequisite,
} from '../data/calendar';

// ─────────────────────────────────────────────────────────────────────────────
// The stylesheet
// ─────────────────────────────────────────────────────────────────────────────

const DESK_CSS = `
/* ── shell ─────────────────────────────────────────────────────────────── */
.v-app { min-height: 100vh; display: flex; flex-direction: column; }

.v-top { position: sticky; top: 0; z-index: 30; display: flex; align-items: center;
  gap: var(--s3); min-height: 52px; padding: 0 var(--s4) 0 var(--pad-l);
  background: var(--console-recess); border-bottom: 1px solid var(--rule); }
.v-mark { font: 600 11px/1 var(--sans); font-stretch: 115%; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--strip); white-space: nowrap; }
.v-nav { display: flex; gap: 2px; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.v-nav::-webkit-scrollbar { display: none; }
.v-nav a { display: inline-flex; align-items: center; min-height: var(--tap); padding: 0 var(--s3);
  color: var(--strip); text-decoration: none; white-space: nowrap;
  font: 600 11px/1 var(--sans); font-stretch: 115%; letter-spacing: 0.12em; text-transform: uppercase; }
.v-nav a:hover { color: var(--legend); }
.v-nav a[aria-current='page'] { color: var(--legend); box-shadow: inset 0 -2px 0 var(--cap); }
/* The date lives in the bar only where there is room for it. Below 900px it moves into the page,
   as .v-today, because the one thing the home screen must always say is what day it is. */
.v-clock { display: none; font: 400 12px/1.4 var(--mono); color: var(--strip); white-space: nowrap; }
.v-today { margin-bottom: var(--s4); font: 400 13px/1.45 var(--mono); color: var(--strip); }
@media (min-width: 900px) {
  .v-clock { display: inline; }
  .v-today { display: none; }
}

.v-main { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--s6);
  align-items: start; width: 100%; max-width: 1600px;
  padding: var(--s5) var(--s4) var(--s7) var(--pad-l); }
.v-col { min-width: 0; }
/* The reading measure. Wherever prose lands, it stops here. */
.v-doc { max-width: 42rem; }
.v-measure { max-width: 40rem; }
.v-doc .field__value, .v-measure .field__value { overflow-wrap: anywhere; }

.v-foot { width: 100%; max-width: 1600px; margin-top: auto;
  padding: var(--s4) var(--s4) var(--s6) var(--pad-l);
  border-top: 1px solid var(--rule); color: var(--strip); font: 400 12px/1.5 var(--mono); }
.v-foot p { max-width: 46rem; }
.v-foot p + p { margin-top: var(--s2); }

@media (min-width: 1080px) {
  .v-main--aside { grid-template-columns: minmax(0, 46rem) minmax(17rem, 24rem); column-gap: var(--s7); }
  .v-main--panes { grid-template-columns: minmax(19rem, 27rem) minmax(0, 1fr); column-gap: var(--s7); }
  /* The list keeps its own travel so the record beside it can be read without losing your place. */
  .v-hold { position: sticky; top: 68px; max-height: calc(100vh - 84px);
    overflow-y: auto; overflow-x: hidden; padding-right: var(--s3); overscroll-behavior: contain; }
  .v-aside { position: sticky; top: 68px; }
}

/* ── bands ─────────────────────────────────────────────────────────────── */
.v-band + .v-band { margin-top: var(--s6); }
.v-band__head { display: flex; align-items: baseline; gap: var(--s3);
  padding-bottom: var(--s2); border-bottom: 1px solid var(--rule); }
.v-band__name { flex: 1; min-width: 0; font: 600 11px/1.3 var(--sans); font-stretch: 115%;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--strip); }
.v-band__n { font: 400 15px/1 var(--mono); color: var(--legend); }
.v-band__says { margin: var(--s2) 0 0; max-width: 40rem;
  font: 400 14px/1.5 var(--serif); color: var(--strip); }

.v-item { padding: var(--s4) 0; border-top: 1px solid var(--rule); }
.v-item:first-of-type { border-top: 0; }
.v-item__title { display: block; margin-bottom: 2px; color: var(--legend);
  font: 500 17px/1.3 var(--serif); letter-spacing: -0.005em; text-decoration: none; }
a.v-item__title:hover { color: var(--cap); }
.v-item__inst { font: 400 14px/1.4 var(--sans); font-stretch: 100%; color: var(--strip); }

/* ── time. A confirmed date and a published rule never share a channel. ── */
.v-when { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--s1) var(--s3);
  margin: var(--s3) 0 0; padding: var(--s1) 0 var(--s1) var(--s3);
  border-left: 2px solid var(--legend); }
.v-when__days { font: 400 20px/1.1 var(--mono); color: var(--legend); }
.v-when__date { font: 400 13px/1.45 var(--mono); color: var(--legend); }
.v-when__role { font: 600 11px/1.3 var(--sans); font-stretch: 115%; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--strip); }
.v-when--soon { border-left-color: var(--meter-clip); }
.v-when--soon .v-when__days { color: var(--meter-clip); }
.v-when--open { border-left-color: var(--meter-nominal); }

/* A published annual rule is not a 2027 date: no countdown, no solid edge, hatched like a
   disputed rail — the app's existing mark for "this is not what it appears to be". */
.v-rule { margin: var(--s3) 0 0; padding: var(--s1) 0 var(--s1) calc(9px + var(--s3));
  background: repeating-linear-gradient(45deg, var(--strip) 0 1px, transparent 1px 5px)
    left top / 9px 100% no-repeat; }
.v-rule__flag { display: block; margin-bottom: var(--s1); font: 600 11px/1.3 var(--sans);
  font-stretch: 115%; letter-spacing: 0.14em; text-transform: uppercase; color: var(--meter-over); }
.v-rule__what { font: 400 13px/1.5 var(--mono); color: var(--legend); }

.v-src { margin-top: var(--s2); font: 400 12px/1.5 var(--mono); color: var(--strip);
  max-width: 40rem; overflow-wrap: anywhere; }

/* ── what stands in front of a date ────────────────────────────────────── */
.v-blockers { margin: var(--s3) 0 0; }
.v-blocker { display: grid; grid-template-columns: 12px minmax(0, 1fr); gap: var(--s2);
  padding: var(--s1) 0; max-width: 40rem; }
.v-blocker__box { margin-top: 6px; width: 10px; height: 10px; border: 1px solid var(--strip);
  border-radius: 1px; }
.v-blocker--late .v-blocker__box { border-color: var(--meter-clip);
  background: repeating-linear-gradient(135deg, var(--meter-clip) 0 1.5px, transparent 1.5px 5px); }
.v-blocker__label { font: 400 15px/1.4 var(--serif); color: var(--legend); }
.v-blocker__note { font: 400 12px/1.5 var(--mono); color: var(--strip); }
.v-blocker--late .v-blocker__note { color: var(--meter-clip); }

/* ── the console column ────────────────────────────────────────────────── */
.v-panel { padding-top: var(--s4); border-top: 2px solid var(--strip); }
.v-panel + .v-panel { margin-top: var(--s5); }
.v-panel__name { margin-bottom: var(--s2); font: 600 11px/1.3 var(--sans); font-stretch: 115%;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--strip); }
.v-panel__says { font: 400 13px/1.5 var(--serif); color: var(--strip); }
.v-stat { display: flex; align-items: baseline; gap: var(--s3); padding: var(--s2) 0;
  border-bottom: 1px solid var(--rule); background: none; border-left: 0; border-right: 0;
  border-top: 0; width: 100%; text-align: left; color: inherit; text-decoration: none; }
a.v-stat:hover .v-stat__t, button.v-stat:hover .v-stat__t { color: var(--cap); }
.v-stat__n { flex: 0 0 4.2em; text-align: right; font: 400 19px/1.15 var(--mono);
  font-variant-numeric: tabular-nums; color: var(--legend); }
.v-stat__t { flex: 1; min-width: 0; font: 400 13px/1.45 var(--sans); color: var(--strip); }

/* ── the invitation. An empty screen asks for something; it does not shrug. ── */
.v-invite { max-width: 40rem; padding: var(--s5) 0; border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule); }
.v-invite__lead { margin-bottom: var(--s2); font: 450 21px/1.3 var(--serif); color: var(--legend); }
.v-invite p { font: 400 15px/1.55 var(--serif); color: var(--strip); }
.v-invite p + p { margin-top: var(--s2); }

/* ── correction and money ──────────────────────────────────────────────── */
.v-correction { margin: var(--s3) 0; padding: var(--s3);
  border-left: 2px solid var(--meter-clip); background: var(--console-recess); }
.v-correction__name { margin-bottom: var(--s2); font: 600 11px/1.3 var(--sans); font-stretch: 115%;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--meter-clip); }
.v-correction__text { font: 400 15px/1.6 var(--serif); color: var(--legend);
  white-space: pre-wrap; overflow-wrap: anywhere; }
.v-warn { margin: var(--s3) 0; padding: var(--s2) var(--s3); border: 1px dashed var(--meter-over);
  color: var(--meter-over); font: 400 13px/1.5 var(--sans); max-width: 40rem; }
.v-scheme { padding: var(--s3) 0; border-top: 1px solid var(--rule); max-width: 40rem; }
.v-scheme__name { font: 400 15px/1.4 var(--serif); color: var(--legend); }
.v-scheme__why { margin-top: var(--s1); font: italic 400 14px/1.5 var(--serif); color: var(--legend); }
.v-scheme__gap { margin-top: var(--s1); font: 400 12px/1.5 var(--mono); color: var(--strip); }

/* The record open in the pane beside the list. Set into the desk, not lifted off it. */
.v-sel { background: var(--console-recess); }

/* ── controls ──────────────────────────────────────────────────────────── */
.v-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2); }
.v-input, .v-textarea { width: 100%; max-width: 40rem; min-height: var(--tap);
  padding: var(--s2) var(--s3); background: var(--console-recess); border: 1px solid var(--rule);
  border-radius: var(--radius); color: var(--legend); font: 400 15px/1.5 var(--serif); }
.v-textarea { min-height: 6rem; resize: vertical; }
.v-code { max-width: 46rem; min-height: 11rem; font: 400 12px/1.5 var(--mono); white-space: pre; }
.v-label { display: block; margin: var(--s3) 0 var(--s1); font: 600 11px/1.3 var(--sans);
  font-stretch: 115%; letter-spacing: 0.14em; text-transform: uppercase; color: var(--strip); }
.v-select { min-height: var(--tap); padding: 0 var(--s2); background: none;
  border: 1px solid var(--strip); border-radius: var(--radius); color: var(--legend);
  font: 500 14px/1.2 var(--sans); }
.v-filters { margin: var(--s3) 0; border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule); }
.v-filters > summary { display: flex; align-items: center; gap: var(--s2); min-height: var(--tap);
  cursor: pointer; font: 600 11px/1.3 var(--sans); font-stretch: 115%; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--strip); }
.v-filters > summary::marker { color: var(--strip); }
.v-filters[open] > summary { border-bottom: 1px solid var(--rule); }
.v-filters__body { padding: var(--s2) 0 var(--s3); }
`;

const STYLE_ID = 'door3-desk';

function ensureDeskStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = DESK_CSS;
  document.head.appendChild(el);
}

ensureDeskStyles();

// ─────────────────────────────────────────────────────────────────────────────
// Viewport. Not the clock — a layout question, answered by the browser.
// ─────────────────────────────────────────────────────────────────────────────

/** True once the canvas is wide enough to hold the list and a record side by side. */
export function useWide(minWidth = 1080): boolean {
  const [wide, setWide] = useState(
    typeof window === 'undefined' ? false : window.matchMedia(`(min-width: ${minWidth}px)`).matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [minWidth]);
  return wide;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chrome
// ─────────────────────────────────────────────────────────────────────────────

type Theme = 'system' | 'light' | 'dark';

const THEME_KEY = 'door3.theme';
const NEXT: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };
const GLYPH: Record<Theme, string> = { system: '◐', dark: '●', light: '○' };

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(t: Theme): void {
  if (typeof document === 'undefined') return;
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  try {
    if (t === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, t);
  } catch {
    /* private mode — the theme just does not persist */
  }
}

function ThemeButton(): JSX.Element {
  const [t, setT] = useState<Theme>(readTheme());
  useEffect(() => applyTheme(t), [t]);
  return (
    <button
      type="button"
      class="iconbtn"
      title={`Theme: ${t}. Click for ${NEXT[t]}.`}
      aria-label={`Theme: ${t}`}
      onClick={() => setT(NEXT[t])}
    >
      <span aria-hidden="true">{GLYPH[t]}</span>
    </button>
  );
}

export interface Tab {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

/**
 * The whole page frame: one sticky bar, one grid, one footer. `layout` chooses how the width is
 * spent — a document plus a console column, or a list plus a record pane.
 */
export function Screen(p: {
  title: string;
  tabs: Tab[];
  path: string;
  /** Right of the nav: the date, the countdown. Never a decoration. */
  clock?: string;
  layout?: 'single' | 'aside' | 'panes';
  footer?: ComponentChildren;
  children: ComponentChildren;
}): JSX.Element {
  useEffect(() => {
    if (typeof document !== 'undefined') document.title = `${p.title} — Door 3`;
  }, [p.title]);

  const layout = p.layout ?? 'single';
  return (
    <div class="v-app">
      <header class="v-top">
        <span class="v-mark">Door 3</span>
        <nav class="v-nav" aria-label="Main">
          {p.tabs.map((t) => (
            <a key={t.href} href={'#' + t.href} aria-current={t.match(p.path) ? 'page' : undefined}>
              {t.label}
            </a>
          ))}
        </nav>
        {p.clock ? <span class="v-clock">{p.clock}</span> : null}
        <ThemeButton />
      </header>
      <main class={'v-main' + (layout === 'single' ? '' : ' v-main--' + layout)}>{p.children}</main>
      <footer class="v-foot">{p.footer}</footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pieces every screen shares
// ─────────────────────────────────────────────────────────────────────────────

/** A named group with its own count. Bands are omitted when empty; that is the caller's job. */
export function Band(p: {
  name: string;
  count?: number | string;
  says?: string;
  children: ComponentChildren;
}): JSX.Element {
  return (
    <section class="v-band">
      <div class="v-band__head">
        <h2 class="v-band__name">{p.name}</h2>
        {p.count !== undefined ? <span class="v-band__n">{p.count}</span> : null}
      </div>
      {p.says ? <p class="v-band__says">{p.says}</p> : null}
      {p.children}
    </section>
  );
}

export function Panel(p: { name: string; children: ComponentChildren }): JSX.Element {
  return (
    <section class="v-panel">
      <h2 class="v-panel__name">{p.name}</h2>
      {p.children}
    </section>
  );
}

export function Stat(p: { n: number | string; children: ComponentChildren; href?: string }): JSX.Element {
  const inner = (
    <>
      <span class="v-stat__n">{p.n}</span>
      <span class="v-stat__t">{p.children}</span>
    </>
  );
  return p.href ? (
    <a class="v-stat" href={p.href}>
      {inner}
    </a>
  ) : (
    <div class="v-stat">{inner}</div>
  );
}

/** Never a shrug. Every empty state names the thing that would fill it. */
export function Invite(p: { lead: string; children?: ComponentChildren }): JSX.Element {
  return (
    <div class="v-invite">
      <p class="v-invite__lead">{p.lead}</p>
      {p.children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dates — the two renderings that must never look alike
// ─────────────────────────────────────────────────────────────────────────────

/** "6 days", "today", "1 day late". Never a bare date on its own. */
export function dayCount(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 0) return `${-days} days ago`;
  return `${days} days`;
}

export function longDate(iso: string): string {
  return formatIso(iso);
}

/** The store owns `now`; nothing under it reads the clock. */
export function useNow(): Date {
  return useStore((s) => s.now);
}

/**
 * A calendar date, rendered as what it actually is.
 *
 * A **confirmed** entry gets the solid edge, the countdown and the day. A **recurring-pattern**
 * entry gets the hatch, the word RULE, and no countdown at all — because a countdown against a
 * published annual rule is the most confident-looking thing on a screen and it is a guess. 22 of
 * the 36 entries in the file are patterns. They never share this channel with the other 14, here
 * or anywhere else in the app.
 */
export function CalendarWhen(p: { entry: CalendarEntry; now: Date }): JSX.Element {
  const e = p.entry;
  const today = isoDay(p.now);
  const opens = opensOn(e);
  const closes = closesOn(e);

  if (e.confidence === 'recurring-pattern') {
    return (
      <div class="v-rule">
        <span class="v-rule__flag">Published rule — not a 2027 date</span>
        <p class="v-rule__what">
          {closes ? `Their page's rule closes it around ${longDate(closes)}` : `Their page's rule opens it around ${longDate(opens!)}`}
          {opens && closes ? `, opening around ${longDate(opens)}` : ''}. Nobody has confirmed the 2027 cycle.
          One email settles it.
        </p>
      </div>
    );
  }

  const status = statusOf(e, p.now);
  const notOpen = status === 'not-open';
  const days = notOpen ? daysBetween(today, opens!) : closes ? daysBetween(today, closes) : null;
  const word = notOpen ? 'opens' : closes === null ? 'open now' : status === 'closed' ? 'closed' : 'closes';
  const tone = status === 'closing-soon' || status === 'closed' ? ' v-when--soon' : status === 'open' ? ' v-when--open' : '';

  return (
    <div class={'v-when' + tone}>
      <span class="v-when__role">{word}</span>
      {days !== null ? <span class="v-when__days">{dayCount(days)}</span> : null}
      <span class="v-when__date">
        {notOpen && opens
          ? longDate(opens)
          : closes
            ? longDate(closes)
            : 'no closing date was ever published — that is their silence, not an open door'}
      </span>
    </div>
  );
}

/**
 * What stands in front of a date. No date renders without this: "2 March 2027" on its own is a
 * lie when what is between him and it is German A2 and two tracks he has not made.
 */
export function Blocking(p: { list: readonly Prerequisite[]; dueDay: string; today: string }): JSX.Element | null {
  if (p.list.length === 0) return null;
  const left = daysBetween(p.today, p.dueDay);
  return (
    <div class="v-blockers">
      <p class="v-blocker__note" style="margin-bottom:6px">
        {p.list.length === 1
          ? 'One thing stands in front of this:'
          : `${p.list.length} things stand in front of this:`}
      </p>
      {p.list.map((b) => {
        const start = left - b.leadTimeDays;
        const late = start <= 0;
        return (
          <div key={b.id} class={'v-blocker' + (late ? ' v-blocker--late' : '')}>
            <span class="v-blocker__box" aria-hidden="true" />
            <span>
              <span class="v-blocker__label">{b.label}</span>
              <span class="v-blocker__note" style="display:block">
                {late
                  ? `Start it now. On this app's own estimate of ${b.leadTimeDays} days it is already ${-start} days late.`
                  : `Start within ${start} days. ${b.leadTimeDays} days is this app's estimate, not a published figure.`}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const DESK_STYLE_ID = STYLE_ID;
