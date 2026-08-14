/**
 * Entry point. It does four things and owns no UI beyond a bootstrap screen:
 *
 *  1. mounts the app;
 *  2. keeps `store.route` in sync with `location.hash` (hash routing — the single-file build
 *     runs from file://, where the History API cannot change the path);
 *  3. starts the two-stage data load;
 *  4. hands over to `src/views/App.tsx` as soon as the views agent creates it.
 *
 * Step 4 is resolved through `import.meta.glob`, which yields an empty object rather than a
 * build error while that file does not exist yet. Until then the bootstrap screen below renders
 * the load status and the counts the funnel is built from, so the foundation is verifiable on
 * its own.
 */

import { render, type ComponentType } from 'preact';
import { useEffect } from 'preact/hooks';
import { ErrorBoundary, LocationProvider, lazy } from 'preact-iso';
import { useStore } from './store';
import { distinctCount } from './data/dedup';
import { isCheap, isVerified } from './data/filters';
import { pluralise } from './lib/format';

/** Empty until src/views/App.tsx exists; then it holds exactly that one module. */
const viewModules = import.meta.glob<{ default: ComponentType }>('./views/App.tsx');
const viewEntry = Object.values(viewModules)[0];

function Bootstrap() {
  const { status, error, index, detailStatus, funding, meta, totalDistinct } = useStore();

  if (status === 'error') {
    return (
      <main style={PAGE}>
        <h1 style={H1}>Could not load the data</h1>
        <p style={MUTED}>{error}</p>
      </main>
    );
  }
  if (status !== 'ready') {
    return (
      <main style={PAGE}>
        <p style={MUTED}>Loading…</p>
      </main>
    );
  }

  const unverified = index.filter((r) => !isVerified(r));
  const cheap = index.filter((r) => r.primary && isCheap(r));

  return (
    <main style={PAGE}>
      <h1 style={H1}>Everything verified is expensive. Everything affordable was unverified — until now.</h1>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 1rem', margin: '1.5rem 0' }}>
        <Row label="Source rows" value={String(index.length)} />
        <Row label="Distinct programmes" value={String(totalDistinct)} />
        <Row label="Never verified" value={`${unverified.length} of ${index.length}`} />
        <Row label="Affordable, not cost-disputed" value={pluralise(distinctCount(cheap), 'programme')} />
        <Row label="Funding schemes" value={String(funding.length)} />
        <Row label="Data generated" value={meta?.generated ?? '—'} />
        <Row label="Prose payload" value={detailStatus} />
      </dl>
      <p style={MUTED}>
        The foundation is loaded. The views agent adds <code>src/views/App.tsx</code>; this screen
        disappears the moment it does.
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={{ ...MUTED, margin: 0 }}>{label}</dt>
      <dd style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</dd>
    </>
  );
}

const PAGE = {
  font: '16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  maxWidth: '38rem',
  margin: '0 auto',
  padding: '2rem 1rem',
};
const H1 = { fontSize: '1.25rem', lineHeight: 1.3, margin: 0 };
const MUTED = { color: '#666', fontSize: '0.875rem' };

/** Resolved once, at module scope, so switching to the real view does not remount on every render. */
const View: ComponentType = viewEntry ? (lazy(viewEntry) as ComponentType) : Bootstrap;

function App() {
  const syncRoute = useStore((s) => s.syncRoute);
  const load = useStore((s) => s.load);

  useEffect(() => {
    void load();
    addEventListener('hashchange', syncRoute);
    return () => removeEventListener('hashchange', syncRoute);
  }, [load, syncRoute]);

  return (
    <LocationProvider>
      <ErrorBoundary>
        <View />
      </ErrorBoundary>
    </LocationProvider>
  );
}

const root = document.getElementById('app');
if (root) render(<App />, root);
