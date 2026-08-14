/**
 * Validates public/data/calendar.json against the corpus it claims to quote.
 *
 * calendar.json is hand-written and it is the ONLY place in this product a displayed date may
 * originate — REBUILD-SPEC §3. That makes it the one file where a typo is indistinguishable from
 * a fabrication, so every field is checked against something that is not calendar.json:
 *
 *   1. every entry has an id, a label, a kind, a confidence and a quote                (shape)
 *   2. every entry has exactly one of `date` / `window`, both real, `from` <= `to`     (shape)
 *   3. every `source` resolves — a record field in programmes.json / funding.json,
 *      or a file in the repo                                                          (provenance)
 *   4. the quote appears VERBATIM in that source, whitespace-normalised                (provenance)
 *   5. neither the quote nor the cited record field contains "PRIOR CYCLE"             (the rule)
 *   6. every `programmeKey` is the recordKey of a real record, and matches
 *      `programmeId` when one is given                                                (the join)
 *   7. every `fundingId` resolves to a funding scheme                                 (the join)
 *   8. every prerequisite blocks entries that exist                                   (the graph)
 *
 * Rule 5 is the load-bearing one. 258 records carry a PRIOR CYCLE string, most of them with a
 * perfectly parseable date inside; laundering one of those into calendar.json would manufacture a
 * 2027 deadline out of a 2026 fact, and it would look exactly like a curated date once it was in.
 * Where the report projects a date from such a record (RMC, MAECI, Romania, AESEF) the entry must
 * cite results/DOOR3.md — a human sentence — and carry `confidence: "recurring-pattern"`.
 *
 * Exit code 1 on any failure. Run: node scripts/build-calendar.mjs   (npm run calendar)
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const REPO = join(APP, '..');
const DATA = join(APP, 'public', 'data');

const KINDS = new Set(['application', 'scholarship', 'admin']);
const CONFIDENCES = new Set(['confirmed', 'recurring-pattern']);
const ROLES = new Set(['opens', 'closes', 'window']);
/**
 * The marker, matched case-sensitively and deliberately so: this is the same string
 * `parseDeadline` refuses in src/lib/format.ts, and it is what produces the 190 badges. Lowercase
 * prose is not the marker — FHNW Basel's field says "NOT a prior cycle" and Köln's portfolio says
 * "NEW vs the prior cycle", and neither is a prior-cycle string.
 */
const PRIOR_CYCLE = /PRIOR[- ]?CYCLE/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

/** Load src/data/dedup.ts so recordKey here is the same function the build and the app use. */
async function loadDedup() {
  const out = await esbuild.build({
    entryPoints: [join(APP, 'src', 'data', 'dedup.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  });
  return import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
}

const { recordKey } = await loadDedup();

const readJson = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf8'));
const programmes = readJson('programmes.json');
const funding = readJson('funding.json');
const calendar = readJson('calendar.json');

const programmeById = new Map(programmes.map((r) => [r.id, r]));
const fundingById = new Map(funding.map((r) => [r.id, r]));
const keyToRecord = new Map(programmes.map((r) => [recordKey(r), r]));

/** Quotes are compared with runs of whitespace collapsed, so a line break in the source is fine. */
const flat = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const fileCache = new Map();
function repoFile(rel) {
  if (!fileCache.has(rel)) {
    const abs = join(REPO, rel);
    fileCache.set(rel, existsSync(abs) ? readFileSync(abs, 'utf8') : null);
  }
  return fileCache.get(rel);
}

/**
 * A `source` is either "<file>.json#<id> <field>" (a record field) or a repo-relative path.
 * Returns the text the quote must appear in, or null with a problem already recorded.
 */
function resolveSource(where, source) {
  const rec = /^(programmes|funding)\.json#(\d+)\s+(\w+)$/.exec(String(source ?? ''));
  if (rec) {
    const [, file, rawId, field] = rec;
    const id = Number(rawId);
    const record = file === 'programmes' ? programmeById.get(id) : fundingById.get(id);
    if (!record) {
      fail(where, `source cites ${file}.json#${id}, which is not a record`);
      return null;
    }
    if (!(field in record)) {
      fail(where, `source cites the field "${field}", which ${file}.json does not have`);
      return null;
    }
    const text = String(record[field] ?? '');
    if (text.trim() === '') {
      fail(where, `source cites ${file}.json#${id} ${field}, which is empty`);
      return null;
    }
    // Rule 5, the load-bearing one.
    if (PRIOR_CYCLE.test(text)) {
      fail(
        where,
        `source field ${file}.json#${id} ${field} contains a PRIOR CYCLE marker. ` +
          `A prior-cycle string may never become a date. Cite results/DOOR3.md instead and mark ` +
          `the entry recurring-pattern, or drop it.`,
      );
      return null;
    }
    return { text, kind: 'record' };
  }

  const text = repoFile(String(source ?? ''));
  if (text === null) {
    fail(where, `source "${source}" is neither "<programmes|funding>.json#<id> <field>" nor a file in the repo`);
    return null;
  }
  return { text, kind: 'file' };
}

function checkQuote(where, node) {
  const quote = flat(node.quote);
  if (quote === '') {
    fail(where, 'has no quote. Nothing enters calendar.json without one.');
    return;
  }
  if (PRIOR_CYCLE.test(quote)) {
    fail(where, 'the quote itself contains a PRIOR CYCLE marker');
    return;
  }
  const src = resolveSource(where, node.source);
  if (!src) return;
  if (!flat(src.text).includes(quote)) {
    fail(where, `the quote is not in ${node.source} verbatim.\n      wanted: ${quote.slice(0, 140)}`);
  }
}

function checkDate(where, iso, label) {
  if (!ISO.test(String(iso ?? ''))) {
    fail(where, `${label} "${iso}" is not YYYY-MM-DD`);
    return false;
  }
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) {
    fail(where, `${label} "${iso}" is not a real date`);
    return false;
  }
  return true;
}

// ── entries ─────────────────────────────────────────────────────────────────
const entries = Array.isArray(calendar.entries) ? calendar.entries : null;
if (!entries) fail('calendar.json', 'has no `entries` array');

const ids = new Set();
for (const e of entries ?? []) {
  const where = `entry "${e.id ?? '(no id)'}"`;
  if (!e.id) fail(where, 'has no id');
  else if (ids.has(e.id)) fail(where, 'duplicate id');
  else ids.add(e.id);

  if (!e.label) fail(where, 'has no label');
  if (!KINDS.has(e.kind)) fail(where, `kind "${e.kind}" is not one of ${[...KINDS].join(' | ')}`);
  if (!CONFIDENCES.has(e.confidence)) {
    fail(where, `confidence "${e.confidence}" is not one of ${[...CONFIDENCES].join(' | ')}`);
  }
  if (e.role !== undefined && !ROLES.has(e.role)) fail(where, `role "${e.role}" is not one of ${[...ROLES].join(' | ')}`);

  const hasDate = e.date !== undefined;
  const hasWindow = e.window !== undefined;
  if (hasDate === hasWindow) fail(where, 'must carry exactly one of `date` or `window`');
  if (hasDate) {
    checkDate(where, e.date, 'date');
    if (e.role === 'window') fail(where, 'has role "window" but a single date');
  }
  if (hasWindow) {
    const ok = checkDate(where, e.window?.from, 'window.from') && checkDate(where, e.window?.to, 'window.to');
    if (ok && e.window.from > e.window.to) fail(where, 'window.from is after window.to');
    if (e.role !== undefined && e.role !== 'window') fail(where, `role "${e.role}" but a window`);
  }

  if (e.programmeKey !== undefined) {
    const rec = keyToRecord.get(e.programmeKey);
    if (!rec) fail(where, `programmeKey "${e.programmeKey}" matches no record in programmes.json`);
    else if (e.programmeId !== undefined && rec.id !== e.programmeId) {
      fail(where, `programmeKey resolves to id ${rec.id} but programmeId says ${e.programmeId}`);
    }
  } else if (e.programmeId !== undefined) {
    fail(where, 'carries programmeId without programmeKey — ids are positional and must never be the only link');
  }

  if (e.fundingId !== undefined && !fundingById.has(e.fundingId)) {
    fail(where, `fundingId ${e.fundingId} matches no scheme in funding.json`);
  }

  checkQuote(where, e);
}

// ── prerequisites ───────────────────────────────────────────────────────────
const prereqs = Array.isArray(calendar.prerequisites) ? calendar.prerequisites : [];
if (calendar.prerequisites !== undefined && !Array.isArray(calendar.prerequisites)) {
  fail('calendar.json', '`prerequisites` is not an array');
}
const prereqIds = new Set();
for (const p of prereqs) {
  const where = `prerequisite "${p.id ?? '(no id)'}"`;
  if (!p.id) fail(where, 'has no id');
  else if (prereqIds.has(p.id)) fail(where, 'duplicate id');
  else prereqIds.add(p.id);
  if (!p.label) fail(where, 'has no label');
  if (!CONFIDENCES.has(p.confidence)) fail(where, `confidence "${p.confidence}" is not valid`);
  if (!Array.isArray(p.blocks) || p.blocks.length === 0) {
    fail(where, 'blocks nothing. A prerequisite exists to stand in front of a dated thing.');
  } else {
    for (const b of p.blocks) if (!ids.has(b)) fail(where, `blocks "${b}", which is not an entry id`);
  }
  if (!Number.isInteger(p.leadTimeDays) || p.leadTimeDays <= 0) fail(where, 'leadTimeDays must be a positive integer');
  if (!p.leadTimeNote) fail(where, 'leadTimeDays needs a leadTimeNote saying where the number came from');
  checkQuote(where, p);
}

// ── report ──────────────────────────────────────────────────────────────────
const priorCycleProgrammes = programmes.filter((r) => PRIOR_CYCLE.test(r.deadline ?? '')).length;
const priorCycleFunding = funding.filter((r) => PRIOR_CYCLE.test(r.deadline ?? '')).length;
const confirmed = (entries ?? []).filter((e) => e.confidence === 'confirmed').length;
const pattern = (entries ?? []).filter((e) => e.confidence === 'recurring-pattern').length;
const linked = (entries ?? []).filter((e) => e.programmeKey).length;
const funded = (entries ?? []).filter((e) => e.fundingId !== undefined).length;

if (problems.length > 0) {
  console.error('');
  console.error(`  calendar.json FAILED — ${problems.length} problem${problems.length === 1 ? '' : 's'}`);
  console.error('  ' + '-'.repeat(70));
  for (const p of problems) console.error('  · ' + p);
  console.error('');
  process.exit(1);
}

console.log('');
console.log('  calendar.json validated');
console.log('  ' + '-'.repeat(70));
console.log(`  ${entries.length} entries — ${confirmed} confirmed, ${pattern} recurring-pattern`);
console.log(`  ${linked} linked to a programme record, ${funded} to a funding scheme`);
console.log(`  ${prereqs.length} prerequisites, blocking ${new Set(prereqs.flatMap((p) => p.blocks)).size} dated entries`);
console.log(`  every quote found verbatim in its cited source`);
console.log(
  `  ${priorCycleProgrammes + priorCycleFunding} records (${priorCycleProgrammes} programmes + ` +
    `${priorCycleFunding} funding) carry a PRIOR CYCLE deadline; none of them is a source here`,
);
console.log('');
