// The rebuild's own kill test. Drives the dev server at 1280x900 and 390x844.
//   node verify/t-rebuild.mjs
import { launch, newBrowser, newPage, goto, evalJs, sleep, text } from './cdp.mjs';

const BASE = process.env.BASE || 'http://localhost:5173/master/';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

/** Poll a boolean expression until it is true. Replaces every arbitrary wait in this file. */
async function until(pg, expr, tries = 40, gap = 150) {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await evalJs(pg, expr)) === true) return true;
    } catch { /* mid-render; try again */ }
    await sleep(gap);
  }
  return false;
}

const { proc, port, wsUrl } = await launch('/tmp/cdp-rebuild');
const browser = await newBrowser(port, wsUrl);

async function page(width, height, mobile) {
  const pg = await newPage(browser, { width, height });
  await pg.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height,
  });
  return pg;
}

const wide = await page(1280, 900, false);

async function go(pg, hash, wait = 1400) {
  await goto(pg, BASE + hash, wait);
}

async function overflowAt(pg, label) {
  const r = await evalJs(pg, `({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth})`);
  return r;
}

// ── load ────────────────────────────────────────────────────────────────────
await go(wide, '#/', 2500);
const home = await text(wide);
ok('1280 · This week renders', /THIS WEEK|CLOSING|OPENING|THE MAKING|OPEN NOW/i.test(home), home.slice(0, 80).replace(/\n/g, ' | '));

// ── 7. no horizontal scroll ─────────────────────────────────────────────────
for (const [hash, name] of [['#/', 'This week'], ['#/find', 'Find'], ['#/shortlist', 'Shortlist']]) {
  await go(wide, hash);
  const o = await overflowAt(wide, name);
  ok(`1280 · no h-scroll on ${name}`, o.sw <= o.cw, JSON.stringify(o));
}

// a record, in the pane
const firstKey = await evalJs(wide, `(window.__DOOR3_KEY__ || (document.querySelector('a.card')?.getAttribute('href') || '').replace('#/record/',''))`);
await go(wide, '#/find');
const key = await evalJs(wide, `(document.querySelector('a.card')?.getAttribute('href')||'').replace('#/record/','')`);
await go(wide, `#/record/${key}`, 2000);
{
  const o = await overflowAt(wide, 'record');
  ok('1280 · no h-scroll on a record in the pane', o.sw <= o.cw, JSON.stringify(o));
  const paneAndList = await evalJs(wide, `!!document.querySelector('a.card') && !!document.querySelector('.channel__body h1')`);
  ok('1280 · the record opens BESIDE the list', paneAndList === true);
}

// ── narrow ──────────────────────────────────────────────────────────────────
const narrow = await page(390, 844, true);
for (const [hash, name] of [['#/', 'This week'], ['#/find', 'Find'], ['#/shortlist', 'Shortlist'], [`#/record/${key}`, 'Record']]) {
  await go(narrow, hash, 1800);
  const o = await overflowAt(narrow, name);
  ok(`390 · no h-scroll on ${name}`, o.sw <= 390, JSON.stringify(o));
}
{
  await go(narrow, `#/record/${key}`, 1500);
  const collapsed = await evalJs(narrow, `!document.querySelector('a.card') && !!document.querySelector('.channel__body h1')`);
  ok('390 · the pane collapses to a full-width page', collapsed === true);
}

// ── 1. isDegree === false without clicking ──────────────────────────────────
await go(wide, '#/find?q=master%20propio', 1800);
{
  const t = await text(wide);
  const anyBanner = await evalJs(wide, `document.querySelectorAll('a.card .notdegree').length`);
  ok('1 · not-a-degree banner on the card, no click', anyBanner > 0, `${anyBanner} banners`);
  ok('1 · banner says it in words', /not a master/i.test(t));
}

// ── 2. never-checked cannot read green ──────────────────────────────────────
await go(wide, '#/find', 1600);
{
  const probe = await evalJs(wide, `(() => {
    const cards=[...document.querySelectorAll('a.card')];
    const out={checkedGreenOnUnchecked:0, absentMeters:0, sample:''};
    for (const c of cards) {
      const w=c.querySelector('.vword');
      if (!w) continue;
      if (w.classList.contains('vword--none')) {
        const svg=c.querySelector('svg.strip');
        const filled=svg ? svg.querySelectorAll('.strip__meter--nominal').length : -1;
        if (filled>0) out.checkedGreenOnUnchecked++;
        if (svg && svg.querySelector('.strip__absent')) out.absentMeters++;
        out.sample=w.textContent.trim();
      }
    }
    return out;
  })()`);
  ok('2 · unchecked records never draw a filled meter', probe.checkedGreenOnUnchecked === 0, JSON.stringify(probe));
  ok('2 · unchecked records draw the empty slot', probe.absentMeters > 0, JSON.stringify(probe));
}

// the app can state the number
await go(wide, '#/', 1800);
{
  const t = await text(wide);
  ok('2 · the app states how many were never checked', /249/.test(t), (t.match(/\d+ of \d+ records[^.]*/) || [''])[0]);
}

// ── 3. the five audition records ────────────────────────────────────────────
const AUDITION_IDS = [253, 254, 258, 259, 260];
for (const id of AUDITION_IDS) {
  await go(wide, `#/p/${id}`, 1600);
  const t = await text(wide);
  const shows = /audition|ear test|piano|vorspiel|eignung/i.test(t);
  ok(`3 · record ${id} shows its live test`, shows);
}
// and they stay out of every "no audition" and "free and reachable" list.
// Their keys, read from the shipped index rather than typed in.
const AUDITION_KEYS = await evalJs(wide, `(async () => {
  const idx = await (await fetch('/master/data/index.json')).json();
  return [253,254,258,259,260].map(id => (idx.find(r => r.id === id) || {}).key);
})()`);
const EDINBURGH_KASK = await evalJs(wide, `(async () => {
  const idx = await (await fetch('/master/data/index.json')).json();
  return [120,5].map(id => (idx.find(r => r.id === id) || {}).key);
})()`);

for (const [hash, name] of [
  ['#/find?dedupe=0', 'the default no-audition list'],
  ['#/find?deg=1&langok=1&cheap=1&dedupe=0', 'free and reachable'],
]) {
  await go(wide, hash, 2000);
  const hrefs = await evalJs(wide, `[...document.querySelectorAll('a.card')].map(a=>a.getAttribute('href')).join(' ')`);
  const leaked = AUDITION_KEYS.filter((k) => k && hrefs.includes(k));
  ok(`3 · 253/254/258/259/260 stay out of ${name}`, leaked.length === 0, leaked.join(', ') || 'none of the five');
}

// 4 · and neither Edinburgh nor KASK may reach a cheap selection. Searched by name so the
// result set is small enough that "not on the page" means "not in the set".
for (const [i, q] of [[0, 'Edinburgh'], [1, 'KASK']]) {
  await go(wide, `#/find?cheap=1&dedupe=0&aud=all&q=${q}`, 2000);
  const hrefs = await evalJs(wide, `[...document.querySelectorAll('a.card')].map(a=>a.getAttribute('href')).join(' ')`);
  const key = EDINBURGH_KASK[i];
  ok(`4 · ${q} never reaches a cheap selection`, !!key && !hrefs.includes(key), `key ${key}`);
  // and without the cheap filter it is found, so the absence above is the filter, not the search
  await go(wide, `#/find?dedupe=0&aud=all&q=${q}`, 2000);
  const found = await evalJs(wide, `[...document.querySelectorAll('a.card')].map(a=>a.getAttribute('href')).join(' ')`);
  ok(`4 · ${q} is findable when the cheap filter is off`, !!key && found.includes(key));
}

// ── 4. Edinburgh and KASK ───────────────────────────────────────────────────
for (const [id, needle] of [[120, /29,?900|29900/], [5, /8,?800|8800/]]) {
  await go(wide, `#/p/${id}`, 1800);
  const t = await text(wide);
  ok(`4 · record ${id} shows its corrected figure`, needle.test(t), (t.match(needle) || [''])[0]);
  ok(`4 · record ${id} says the recorded band is wrong`, /recorded band is wrong|contradicted|correction/i.test(t));
}

// ── 5. correction in full ───────────────────────────────────────────────────
await go(wide, '#/p/105', 1800);
{
  const probe = await evalJs(wide, `(() => {
    const el=[...document.querySelectorAll('.v-correction__text')][0];
    if (!el) return {found:false};
    const cs=getComputedStyle(el);
    return {found:true, len:el.textContent.length, clamp:cs.webkitLineClamp, overflow:cs.overflow,
      inDetails: !!el.closest('details'), h:el.scrollHeight, ch:el.clientHeight};
  })()`);
  ok('5 · correction rendered', probe.found === true, JSON.stringify(probe));
  ok('5 · correction not clamped, not truncated, not in a disclosure',
    probe.found && probe.inDetails === false && probe.h <= probe.ch + 2 && (probe.clamp === 'none' || !probe.clamp),
    JSON.stringify(probe));
}

// ── 6. DUPLICATE pointers shown, never followed ─────────────────────────────
{
  const found = await evalJs(wide, `(async () => {
    const res = await fetch('/master/data/detail.json'); const d = await res.json();
    const hit = Object.entries(d).find(([k,v]) => /DUPLICATE of ind/i.test(v.correction||''));
    return hit ? hit[0] : null;
  })()`);
  if (found) {
    await go(wide, `#/record/${found}`, 1800);
    const t = await text(wide);
    const links = await evalJs(wide, `[...document.querySelectorAll('.v-correction a')].length`);
    ok('6 · a stale DUPLICATE pointer is printed', /DUPLICATE of ind/i.test(t));
    ok('6 · and it is not a link to follow', links === 0, `${links} links inside the correction`);
    ok('6 · and the app says the pointer is stale', /stale/i.test(t));
  } else {
    ok('6 · found a DUPLICATE correction to test', false, 'none in detail.json');
  }
}

// ── 8. personal state keys on the durable hash ──────────────────────────────
await go(wide, `#/record/${key}`, 1600);
{
  // Poll rather than sleep: the pane re-renders when the route changes and the store's write is
  // debounced by 400ms, so a fixed wait is a race that fails about half the time on a cold run.
  const clicked = await until(wide,
    `(() => { const b=[...document.querySelectorAll('button')].find(b=>/add to your shortlist/i.test(b.textContent)); if(!b) return false; b.click(); return true; })()`);
  ok('8 · the record page offers to track it', clicked === true);
  await until(wide, `!!localStorage.getItem('door3.personal.v1')`);
  const raw = await evalJs(wide, `localStorage.getItem('door3.personal.v1')`);
  const parsed = raw ? JSON.parse(raw) : { entries: {} };
  const keys = Object.keys(parsed.entries || {});
  ok('8 · personal state keys on the 12-char record hash, not the row id',
    keys.length > 0 && keys.every((k) => /^[0-9a-f]{12}$/.test(k)), JSON.stringify(keys));
}

// ── 9. completeness rule ────────────────────────────────────────────────────
await go(wide, '#/find?q=Basel', 2000);
{
  const t = await text(wide);
  const claimsAll = /That is all \d+, with nothing held back/.test(t);
  const names = /more programmes? match[\s\S]{0,120}hidden because/i.test(t);
  ok('9 · a hidden match is named with a way to reveal it', names || claimsAll, names ? 'named' : 'claims completeness');
  if (names) ok('9 · the reveal link is present', /Show (it|them)/.test(t));
}

// ── 10. counts are distinct programmes ──────────────────────────────────────
await go(wide, '#/find', 1800);
{
  const t = await text(wide);
  const m = t.match(/(\d+) PROGRAMMES(?: · (\d+) ROWS)?/i);
  ok('10 · the count is distinct programmes, and rows are stated separately when they differ',
    !!m && (!m[2] || Number(m[2]) > Number(m[1])), m ? m[0] : 'no count found');
}

// ── funding.json is off the critical path ───────────────────────────────────
{
  const fresh = await page(1280, 900, false);
  const seen = [];
  fresh.ws.addEventListener?.('message', () => {});
  await fresh.send('Network.enable');
  const reqs = [];
  const original = browser.targets.get(fresh.sessionId);
  // simplest reliable probe: performance entries after the home screen settles
  await goto(fresh, BASE + '#/', 2500);
  const loaded = await evalJs(fresh, `performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/\\.json/.test(n))`);
  ok('perf · funding.json is not fetched by This week',
    !loaded.some((n) => /funding\.json/.test(n)), loaded.map((n) => n.split('/').pop()).join(', '));
  await goto(fresh, BASE + `#/record/${key}`, 2500);
  const after = await evalJs(fresh, `performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/funding\\.json/.test(n)).length`);
  ok('perf · funding.json IS fetched by the record page', after > 0, String(after));
}

// ── console errors ──────────────────────────────────────────────────────────
const errs = [...wide.consoleErrors, ...wide.pageErrors, ...narrow.consoleErrors, ...narrow.pageErrors]
  .filter((e) => !/favicon/i.test(e));
ok('no console or page errors', errs.length === 0, errs.slice(0, 3).join(' || '));

console.log('\n' + results.filter((r) => r.pass).length + ' / ' + results.length + ' passed');
const failed = results.filter((r) => !r.pass);
if (failed.length) console.log('FAILED:\n' + failed.map((f) => ' - ' + f.name + (f.detail ? ' — ' + f.detail : '')).join('\n'));
proc.kill();
process.exit(failed.length ? 1 : 0);
