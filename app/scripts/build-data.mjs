/**
 * Splits public/data/programmes.json into the two files the app actually loads:
 *
 *   index.json   card + filter + search fields, one array. Blocks first paint.
 *   detail.json  the long prose fields, an object KEYED BY RECORD KEY, not by id.
 *
 * Detail is keyed by `recordKey` — hash(institution + programme + url) — for the same reason
 * personal state is: `id` is a positional index assigned by `enumerate()` at export time, so
 * inserting one record renumbers every record after it. A detail map keyed by id would silently
 * attach the wrong prose to a card after the next re-export.
 *
 * The dedup group ordinal `g` and the `primary` flag are computed here rather than in the
 * browser, because dedup needs `url` and `url` costs ~17 KB gzip that the card index should not
 * carry. src/data/dedup.ts is the single implementation, imported here through esbuild so the
 * build and the app can never disagree about what a duplicate is.
 *
 * Run: node scripts/build-data.mjs   (npm run data; also a pre-step of npm run build)
 */

import { gzipSync } from 'node:zlib';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as esbuild from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const DATA = join(APP, 'public', 'data');

/** Must stay in sync with the `IndexField` union in src/types.ts. Verified below. */
const INDEX_FIELDS = [
  'id',
  'country',
  'region',
  'city',
  'institution',
  'programme',
  'subtype',
  'level',
  'isDegree',
  'gate',
  'needsAudition',
  'auditionDisputed',
  'auditionSource',
  'auditionSuspected',
  'costDisputed',
  'existenceDisputed',
  'hasVerifiedDispute',
  'chance',
  'whyChance',
  'costBand',
  'language',
  'languageOk',
  'publicPrivate',
  'funding',
  'verdict',
];

/** Load src/data/dedup.ts without a build artefact on disk. */
async function loadDedup() {
  const out = await esbuild.build({
    entryPoints: [join(APP, 'src', 'data', 'dedup.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  });
  const js = out.outputFiles[0].text;
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
}

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;

function readJson(name) {
  return JSON.parse(readFileSync(join(DATA, name), 'utf8'));
}

function fail(msg) {
  console.error('build-data: ' + msg);
  process.exit(1);
}

const { buildGroups, recordKey } = await loadDedup();

const programmes = readJson('programmes.json');
if (!Array.isArray(programmes) || programmes.length === 0) fail('programmes.json is not a non-empty array');

// Guard the seam: every declared index field must exist on every record, and the split must be
// exhaustive — a field added upstream must land in one file or the other, never be dropped.
const allFields = Object.keys(programmes[0]);
for (const f of INDEX_FIELDS) {
  if (!allFields.includes(f)) fail(`INDEX_FIELDS names "${f}", which is not in programmes.json`);
}
const DETAIL_FIELDS = allFields.filter((f) => !INDEX_FIELDS.includes(f));
for (const rec of programmes) {
  const missing = allFields.filter((f) => !(f in rec));
  if (missing.length) fail(`record id ${rec.id} is missing ${missing.join(', ')}`);
}

// Dedup, once, here.
const groups = buildGroups(programmes);
const groupOf = new Map();
for (const grp of groups) {
  for (const rec of grp.members) {
    groupOf.set(rec.id, { g: grp.g, primary: grp.primary.id === rec.id, rows: grp.members.length });
  }
}

// Record keys must be unique or detail.json would lose rows.
const keys = new Map();
for (const rec of programmes) {
  const k = recordKey(rec);
  if (keys.has(k)) fail(`record key collision between id ${keys.get(k)} and id ${rec.id} (${k})`);
  keys.set(k, rec.id);
}

const index = [];
const detail = {};
for (const rec of programmes) {
  const key = recordKey(rec);
  const meta = groupOf.get(rec.id);
  const row = { key, g: meta.g, primary: meta.primary, rows: meta.rows };
  for (const f of INDEX_FIELDS) row[f] = rec[f];
  index.push(row);
  const d = {};
  for (const f of DETAIL_FIELDS) d[f] = rec[f];
  detail[key] = d;
}

const indexJson = JSON.stringify(index);
const detailJson = JSON.stringify(detail);
writeFileSync(join(DATA, 'index.json'), indexJson);
writeFileSync(join(DATA, 'detail.json'), detailJson);

// ── Report ──────────────────────────────────────────────────────────────────
const sourceBytes = statSync(join(DATA, 'programmes.json')).size;
const rows = [
  ['programmes.json (source)', sourceBytes, gz(readFileSync(join(DATA, 'programmes.json')))],
  ['index.json', Buffer.byteLength(indexJson), gz(indexJson)],
  ['detail.json', Buffer.byteLength(detailJson), gz(detailJson)],
];
for (const name of ['funding.json', 'meta.json']) {
  const buf = readFileSync(join(DATA, name));
  rows.push([name, buf.length, gz(buf)]);
}

console.log('');
console.log('  file                        raw        gzip');
console.log('  ' + '-'.repeat(46));
for (const [name, raw, g] of rows) {
  console.log('  ' + name.padEnd(26) + kb(raw).padStart(9) + '  ' + kb(g).padStart(9));
}
console.log('');
console.log(
  `  ${programmes.length} records in ${groups.length} distinct programmes ` +
    `(${groups.filter((g) => g.members.length > 1).length} groups hold more than one row)`,
);
console.log(
  `  index carries ${INDEX_FIELDS.length} fields; detail carries ${DETAIL_FIELDS.length}, keyed by record key`,
);
console.log('');
