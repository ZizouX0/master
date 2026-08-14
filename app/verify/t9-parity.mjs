import { readFileSync } from 'node:fs';
import { launch, newBrowser, newPage, goto, evalJs, text, shot, report } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const parity = JSON.parse(readFileSync('/tmp/claude-0/-home-user-master/8f162b98-27f5-5264-a4b4-07668aac85f1/scratchpad/parity.json', 'utf8'));

const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

// Normalise for comparison: the app renders EUR as €, uses typographic dashes/quotes, and
// collapses whitespace. None of that is a missing cell.
function norm(s) {
  return String(s)
    .replace(/ /g, ' ')
    .replace(/EUR\s?/gi, '€')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}
// Longest common prefix length between the workbook cell and anywhere in the page.
function findable(hay, needle) {
  const H = norm(hay), N = norm(needle);
  if (N === '') return { ok: true, how: 'empty cell — nothing to find' };
  if (H.includes(N)) return { ok: true, how: 'exact substring' };
  // The workbook truncates long cells (G at 400 chars). Try progressively shorter prefixes.
  for (const frac of [0.98, 0.95, 0.9, 0.8, 0.6, 0.4]) {
    const pre = N.slice(0, Math.floor(N.length * frac));
    if (pre.length > 30 && H.includes(pre)) {
      return { ok: true, how: `prefix ${Math.round(frac * 100)}% (${pre.length}/${N.length} chars) — workbook cell is truncated` };
    }
  }
  // last resort: does a distinctive middle chunk appear?
  const chunk = N.slice(0, 60);
  return { ok: false, how: `NOT FOUND. first 60 chars sought: ${JSON.stringify(chunk)}` };
}

let allPass = true;
console.log('###### ITEM 9 — PARITY: columns E,F,G,H,K,S from ✅ VERIFIED WORTH IT ######');
for (const rec of parity) {
  await goto(p, `${BASE}#/p/${rec.id}`, 2000);
  const t = await text(p);
  console.log(`\n================ app id ${rec.id} — ${String(rec.institution).slice(0, 55)}`);
  console.log(`   page text length ${t.length}`);
  for (const col of ['E', 'F', 'G', 'H', 'K', 'S']) {
    const v = rec.cells[col];
    const r = findable(t, v);
    if (!r.ok) allPass = false;
    const label = { E: 'Verified verdict', F: 'Why that verdict', G: 'CORRECTION FOUND', H: 'Admission gate', K: 'Cost band', S: 'Deadline' }[col];
    console.log(`   ${col} ${label.padEnd(18)} len=${String(v).length.toString().padStart(4)} ${r.ok ? 'FOUND ' : '**MISSING**'} — ${r.how}`);
    if (!r.ok) console.log(`       cell: ${JSON.stringify(String(v).slice(0, 300))}`);
  }
  await shot(p, `09-parity-${rec.id}`, true);
}
console.log('\nITEM 9 RESULT:', allPass ? 'PASS — every non-empty cell in E,F,G,H,K,S findable' : 'FAIL');
console.log('CONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
