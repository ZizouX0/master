/**
 * The shell. Three jobs and no content of its own:
 *
 *  1. **Route.** Hash routing, read from `store.route` — preact-iso's Router cannot do hash
 *     routing, and hash routing is what lets the single-file build work from file://.
 *  2. **Keep the URL and the filter state in step.** Filter state lives in the hash so a view
 *     is shareable; this is the one place that copies it into the store and back.
 *  3. **Mount the detail agent's four views.** They are resolved through `import.meta.glob`,
 *     which yields an empty object rather than a build error while a file does not exist, so
 *     the two halves of the app can be built in parallel without blocking each other.
 */

import '../styles.css';

import type { ComponentType, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { encodeFilters, decodeFilters } from '../components/Filters';
import { Page } from '../components/Layout';
import Start from './Start';
import Programmes from './Programmes';

// ─────────────────────────────────────────────────────────────────────────────
// The detail agent's views, loaded only if they exist
// ─────────────────────────────────────────────────────────────────────────────

type Loader = () => Promise<{ default: ComponentType }>;

const first = (mods: Record<string, Loader>): Loader | undefined => Object.values(mods)[0];

/** Each glob names exactly one file. A missing file yields `{}`, never a build error. */
const DETAIL_VIEWS: Record<string, Loader | undefined> = {
  Record: first(import.meta.glob<{ default: ComponentType }>('./Record.tsx')),
  Money: first(import.meta.glob<{ default: ComponentType }>('./Money.tsx')),
  NotDegree: first(import.meta.glob<{ default: ComponentType }>('./NotDegree.tsx')),
  MyList: first(import.meta.glob<{ default: ComponentType }>('./MyList.tsx')),
};

/** They take no props and parse the route themselves, so mounting one is a bare `<C />`. */
function Deferred(p: { name: keyof typeof DETAIL_VIEWS }): JSX.Element | null {
  const loader = DETAIL_VIEWS[p.name];
  const [View, setView] = useState<ComponentType | null>(null);

  useEffect(() => {
    let live = true;
    if (loader) void loader().then((m) => live && setView(() => m.default));
    return () => {
      live = false;
    };
  }, [loader]);

  if (!loader) {
    return (
      <p class="placeholder">
        views/{String(p.name)}.tsx does not exist yet — the detail-views agent owns this screen.
      </p>
    );
  }
  if (!View) return null;
  return <View />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Routing table
// ─────────────────────────────────────────────────────────────────────────────

function routeTo(path: string): JSX.Element {
  if (path === '/' || path === '') return <Start />;
  if (path === '/list' || path.startsWith('/list/')) return <Programmes />;
  if (path.startsWith('/p/') || path.startsWith('/g/')) return <Deferred name="Record" />;
  if (path === '/money' || path === '/funding' || path.startsWith('/f/')) return <Deferred name="Money" />;
  if (path === '/rejects' || path === '/not-degree') return <Deferred name="NotDegree" />;
  if (path === '/me' || path === '/shortlist') return <Deferred name="MyList" />;
  return <Start />;
}

const TABS: Array<{ href: string; label: string; glyph: string; match: (p: string) => boolean }> = [
  { href: '/', label: 'Now', glyph: '◉', match: (p) => p === '/' || p === '' },
  { href: '/list', label: 'Programmes', glyph: '≡', match: (p) => p.startsWith('/list') || p.startsWith('/p/') || p.startsWith('/g/') },
  { href: '/money', label: 'Money', glyph: '€', match: (p) => p === '/money' || p === '/funding' || p.startsWith('/f/') },
  { href: '/rejects', label: 'Not a degree', glyph: '⊘', match: (p) => p === '/rejects' || p === '/not-degree' },
  { href: '/me', label: 'My list', glyph: '★', match: (p) => p === '/me' || p === '/shortlist' },
];

function Tabs(p: { path: string; listHref: string }): JSX.Element {
  return (
    <nav class="tabs" aria-label="Main">
      {TABS.map((t) => (
        <a
          key={t.href}
          href={'#' + (t.href === '/list' ? p.listHref : t.href)}
          aria-current={t.match(p.path) ? 'page' : undefined}
        >
          <span class="tabs__glyph" aria-hidden="true">
            {t.glyph}
          </span>
          {t.label}
        </a>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App(): JSX.Element {
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const route = useStore((s) => s.route);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);

  // The hash is the source of truth for the list's filters. `encodeFilters` on both sides makes
  // the comparison exact, so applying a filter (which writes the hash) cannot loop back here.
  const fromUrl = route.path === '/list' ? encodeFilters(decodeFilters(route.query)) : null;
  useEffect(() => {
    if (fromUrl === null) return;
    if (fromUrl !== encodeFilters(filters)) setFilters(decodeFilters(route.query));
    // `filters` is deliberately not a dependency: this effect reacts to the URL, not to state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);

  const listQuery = encodeFilters(filters);
  const listHref = '/list' + (listQuery ? '?' + listQuery : '');

  let body: JSX.Element;
  if (status === 'error') {
    body = (
      <Page title="Could not load the data">
        <p class="prose">{error}</p>
        <p class="muted">The app reads three JSON files from ./data/. Nothing else is required.</p>
      </Page>
    );
  } else if (status !== 'ready') {
    // No skeleton shimmer: 420 KB loads fast and a fake page is worse than a plain line.
    body = (
      <Page title="Door 3">
        <p class="muted">Loading 398 programmes…</p>
      </Page>
    );
  } else {
    body = routeTo(route.path);
  }

  return (
    <div class="app">
      {body}
      <Tabs path={route.path} listHref={listHref} />
    </div>
  );
}
