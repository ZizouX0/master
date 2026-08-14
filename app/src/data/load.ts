/**
 * Loading. Three payloads in three stages, and which stage a file lands in is a measurement,
 * not a preference:
 *
 *   index.json + meta.json      fetched first; the list, the filters and the counts render
 *                               from these and nothing else
 *   detail.json                 fetched after first paint; ~59% of the bytes and nothing on a
 *                               card depends on it
 *   funding.json                fetched on demand — the first time a record page or a money
 *                               filter actually needs a scheme
 *
 * That last one is the app-level performance fix REBUILD-SPEC §4 names. `funding.json` is
 * **74.6 KB on the critical path for one number**: the old landing screen printed "120 funding
 * schemes" and nothing else on it read the file. The count now comes from `meta.funding`, which
 * is already in the 3 KB meta payload, and the 74.6 KB is spent only by the screen that reads it.
 *
 * The single-file offline build has no server to fetch from, so a Vite plugin inlines all the
 * payloads into `window.__DOOR3_DATA__` and this module reads them from there. That branch is
 * the only mode-aware code in the app, and it makes every stage above resolve instantly.
 */

import type { DetailMap, FundingScheme, Meta, ProgrammeIndex } from '../types';

export interface InlineData {
  index: ProgrammeIndex[];
  detail: DetailMap;
  funding: FundingScheme[];
  meta: Meta;
}

declare global {
  interface Window {
    __DOOR3_DATA__?: InlineData;
  }
}

function inline(): InlineData | undefined {
  return typeof window === 'undefined' ? undefined : window.__DOOR3_DATA__;
}

/** BASE_URL is '/master/' for the hosted build and './' for the single-file build. */
function dataUrl(name: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base}${base.endsWith('/') ? '' : '/'}data/${name}`;
}

async function fetchJson<T>(name: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(dataUrl(name), { signal });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface FirstPayload {
  index: ProgrammeIndex[];
  meta: Meta;
  /** Present immediately in the single-file build; null when it still has to be fetched. */
  detail: DetailMap | null;
  /** Same: inlined builds already hold the schemes, so nothing has to be deferred. */
  funding: FundingScheme[] | null;
}

/** Everything the list, the filters and the week screen need. 74.6 KB lighter than it was. */
export async function loadFirst(signal?: AbortSignal): Promise<FirstPayload> {
  const bundled = inline();
  if (bundled) {
    return { index: bundled.index, meta: bundled.meta, detail: bundled.detail, funding: bundled.funding };
  }
  const [index, meta] = await Promise.all([
    fetchJson<ProgrammeIndex[]>('index.json', signal),
    fetchJson<Meta>('meta.json', signal),
  ]);
  return { index, meta, detail: null, funding: null };
}

/** The prose. Call after first paint; the record page and full-text search need it. */
export async function loadDetail(signal?: AbortSignal): Promise<DetailMap> {
  const bundled = inline();
  if (bundled) return bundled.detail;
  return fetchJson<DetailMap>('detail.json', signal);
}

/**
 * The 120 schemes. Called by the first screen that has to answer "what could pay for this" —
 * never at boot. `meta.funding` already carries the count, which is all any other screen wanted.
 */
export async function loadFunding(signal?: AbortSignal): Promise<FundingScheme[]> {
  const bundled = inline();
  if (bundled) return bundled.funding;
  return fetchJson<FundingScheme[]>('funding.json', signal);
}
