/**
 * Loading. Two payloads in two stages:
 *
 *   index.json + meta.json + funding.json   fetched first; the list can render from these
 *   detail.json                             fetched after first paint; ~59% of the bytes and
 *                                           nothing on a card depends on it
 *
 * The single-file offline build has no server to fetch from, so a Vite plugin inlines all four
 * payloads into `window.__DOOR3_DATA__` and this module reads them from there. That branch is
 * the only mode-aware code in the app.
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
  funding: FundingScheme[];
  meta: Meta;
  /** Present immediately in the single-file build; null when it still has to be fetched. */
  detail: DetailMap | null;
}

/** Everything the list, the filters and the funnel need. */
export async function loadFirst(signal?: AbortSignal): Promise<FirstPayload> {
  const bundled = inline();
  if (bundled) {
    return { index: bundled.index, funding: bundled.funding, meta: bundled.meta, detail: bundled.detail };
  }
  const [index, funding, meta] = await Promise.all([
    fetchJson<ProgrammeIndex[]>('index.json', signal),
    fetchJson<FundingScheme[]>('funding.json', signal),
    fetchJson<Meta>('meta.json', signal),
  ]);
  return { index, funding, meta, detail: null };
}

/** The prose. Call after first paint; the record page and full-text search need it. */
export async function loadDetail(signal?: AbortSignal): Promise<DetailMap> {
  const bundled = inline();
  if (bundled) return bundled.detail;
  return fetchJson<DetailMap>('detail.json', signal);
}
