/**
 * The page frame every view sits in — mine and the detail agent's — so the chrome is identical
 * across the app and no view has to reinvent a header.
 *
 * `Page` owns: the sticky top bar (back · title · theme), the reading column at 34rem, and the
 * provenance footer that DESIGN-UX requires on every view. The bottom tab bar is owned by
 * `App.tsx`, one level up, so it survives a view change.
 */

import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { useStore } from '../store';

type Theme = 'system' | 'light' | 'dark';

const THEME_KEY = 'door3.theme';

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

const NEXT: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };
const GLYPH: Record<Theme, string> = { system: '◐', dark: '●', light: '○' };

function ThemeButton(): JSX.Element {
  const t = readTheme();
  return (
    <button
      type="button"
      class="iconbtn"
      title={`Theme: ${t}. Tap for ${NEXT[t]}.`}
      aria-label={`Theme: ${t}`}
      onClick={() => {
        applyTheme(NEXT[t]);
        // The attribute is the source of truth; force one re-render so the glyph follows.
        useStore.setState({});
      }}
    >
      <span aria-hidden="true">{GLYPH[t]}</span>
    </button>
  );
}

export function Page(p: { title: string; back?: string; children: any }): JSX.Element {
  const generated = useStore((s) => s.meta?.generated ?? '');

  useEffect(() => {
    applyTheme(readTheme());
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') document.title = `${p.title} — Door 3`;
  }, [p.title]);

  return (
    <>
      <header class="topbar">
        {p.back ? (
          <a class="iconbtn" href={p.back.startsWith('#') ? p.back : '#' + p.back} aria-label="Back">
            <span aria-hidden="true">←</span>
          </a>
        ) : null}
        <h1 class="topbar__title">{p.title}</h1>
        <ThemeButton />
      </header>
      <main class="page">
        {p.children}
        <p class="footnote">
          Snapshot {generated || '2026-08'} · mirrors results/DOOR3.xlsx · nothing here is verified
          unless it says so
        </p>
      </main>
    </>
  );
}

/**
 * Never a shrug. The caller passes either a sentence or a block that names the constraint doing
 * the killing and offers to drop it — DESIGN-UX §6.1.
 */
export function Empty(p: { message?: string; children?: any }): JSX.Element {
  return <div class="empty">{p.children ?? p.message ?? 'Nothing here.'}</div>;
}
