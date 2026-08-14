/**
 * The shell. Three jobs and no content of its own:
 *
 *  1. **Route.** Hash routing, read from `store.route` — the single-file build runs from a
 *     file:// URL where the History API cannot change the path, and hash URLs behave identically
 *     in both builds.
 *  2. **Keep the URL and the filter state in step**, so any search is shareable and comes back
 *     identical.
 *  3. **Choose the frame for a record.** On a laptop `#/record/:key` renders inside `Find`, in
 *     the right-hand pane beside the list it came from. Below 1080px the same route renders as
 *     its own page. The route does not change; only the frame around it does.
 *
 * Five screens became three. `Start` was an argument about provenance that read identically for
 * fifty-six weeks — its funnel is now a component above the search results. `Money` was 31
 * screens of alphabetical scroll nobody reads — it is now the money answer on the record of the
 * programme it could pay for. `Not a degree` was a read-once recognition pattern given a
 * permanent tab — the pattern now states itself on the record it applies to.
 */

import '../styles.css';

import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { useStore } from '../store';
import { encodeFilters, decodeFilters } from '../components/Filters';
import { useWide, type Tab } from './kit';
import ThisWeek from './ThisWeek';
import Find from './Find';
import Shortlist from './Shortlist';
import Record, { isRecordPath } from './Record';

const TABS: Tab[] = [
  { href: '/', label: 'This week', match: (p) => p === '/' || p === '' },
  { href: '/shortlist', label: 'Shortlist', match: (p) => p.startsWith('/shortlist') },
  {
    href: '/find',
    label: 'Find',
    match: (p) => p.startsWith('/find') || isRecordPath(p),
  },
];

/** Addresses that were tabs and are not any more. Nothing dead-ends. */
function redirect(path: string): string | null {
  if (path === '/list' || path.startsWith('/list/')) return '/find';
  if (path === '/me') return '/shortlist';
  if (path === '/money' || path === '/funding' || path.startsWith('/f/')) return '/find';
  // The Not-a-degree tab is gone; the address still lands on the set it was about, and every
  // one of those records now states its own pattern on its own page.
  if (path === '/rejects' || path === '/not-degree') return '/find?lv=' + encodeURIComponent('Not a degree');
  return null;
}

export default function App(): JSX.Element {
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const route = useStore((s) => s.route);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const navigate = useStore((s) => s.navigate);
  const wide = useWide();

  // A cut screen's address still resolves, to the screen that absorbed it.
  const to = redirect(route.path);
  useEffect(() => {
    if (to) navigate(to, true);
  }, [to, navigate]);

  // The hash is the source of truth for the search's filters. Encoding both sides makes the
  // comparison exact, so applying a filter — which writes the hash — cannot loop back here.
  const fromUrl = route.path === '/find' ? encodeFilters(decodeFilters(route.query)) : null;
  useEffect(() => {
    if (fromUrl === null) return;
    if (fromUrl !== encodeFilters(filters)) setFilters(decodeFilters(route.query));
    // `filters` is deliberately not a dependency: this effect reacts to the URL, not to state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);

  if (status === 'error') {
    return (
      <div class="v-app">
        <main class="v-main">
          <div class="v-col v-doc">
            <h1 class="t-title">The data did not load.</h1>
            <p class="t-prose" style="margin-top:12px">
              The app reads four JSON files out of <code>./data/</code> and one of them did not arrive.
              Reload the page. If it keeps failing, the deploy is incomplete — nothing here is cached
              server-side, so a second attempt costs nothing.
            </p>
            <p class="v-src" style="margin-top:12px">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const path = to ?? route.path;

  if (path === '/shortlist') return <Shortlist tabs={TABS} path={path} />;
  if (path === '/find') return <Find tabs={TABS} path={path} />;
  if (isRecordPath(path)) {
    // The laptop frame: the record beside the list it came from. Narrow: its own page.
    return wide ? <Find tabs={TABS} path={path} /> : <Record tabs={TABS} path={path} />;
  }
  return <ThisWeek tabs={TABS} path={path} />;
}
