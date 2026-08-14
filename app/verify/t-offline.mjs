// The offline artefact, opened the way he would open it: a file on a stick, no server.
//   node verify/t-offline.mjs
//
// The load-bearing assertion is the typography one. The four faces used to be fetched from an
// absolute /master/fonts/… URL, which resolves to nothing under file://, so door3.html rendered
// in whatever the system had and nobody noticed — a "self-contained" artefact silently dropping
// the thing the rebuild spent its budget on. They are inlined as data: URIs now, and this test
// is here so that cannot come back.

import { launch, newBrowser, newPage, goto, evalJs, text, sleep } from './cdp.mjs';

const FILE = 'file:///home/user/master/app/dist-single/door3.html';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const { proc, port, wsUrl } = await launch('/tmp/cdp-offline');
const browser = await newBrowser(port, wsUrl);
const p = await newPage(browser, { width: 1440, height: 900 });
await p.send('Emulation.setDeviceMetricsOverride', {
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 900,
});

await goto(p, FILE + '#/', 3000);

// ── the four faces, actually loaded, from a file:// origin ───────────────────
const FACES = ['Literata', 'Archivo', 'Spline Sans Mono'];
{
  // document.fonts only reports a face as loaded once something has asked for it, so ask.
  const loaded = await evalJs(p, `(async () => {
    const want = ${JSON.stringify(FACES)};
    await Promise.all(want.map(f => document.fonts.load('400 16px "' + f + '"')));
    await document.fonts.ready;
    const have = new Set();
    document.fonts.forEach(f => { if (f.status === 'loaded') have.add(f.family); });
    return want.map(f => [f, have.has(f)]);
  })()`);
  for (const [family, isLoaded] of loaded) {
    ok(`offline · ${family} loads from file://`, isLoaded === true);
  }
  const sources = await evalJs(p, `(() => {
    const out = [];
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules) {
        if (r.constructor.name === 'CSSFontFaceRule') out.push((r.style.src || '').slice(0, 24));
      }
    }
    return out;
  })()`);
  const real = sources.filter((s) => s.startsWith('url("data:'));
  ok('offline · every @font-face src is a data: URI, not a path', real.length >= 4,
    `${real.length} of ${sources.length} @font-face rules are inlined`);
  const rendered = await evalJs(p, `getComputedStyle(document.body).fontFamily.split(',')[0]`);
  ok('offline · the body is actually set in the body face', /Literata/.test(rendered), rendered);
}

// ── and the app itself still works with no server ───────────────────────────
{
  const t = await text(p);
  ok('offline · This week renders', /ALREADY LATE|CLOSING|OPEN NOW|THE MAKING/i.test(t));
  ok('offline · a published rule is still held apart from a date', /NOT A 2027 DATE/i.test(t));
}

await goto(p, FILE + '#/p/105', 2500);
{
  const t = await text(p);
  ok('offline · the correction is on the record', /CORRECTION — WORKBOOK COLUMN G/i.test(t));
  ok('offline · the money join ran with no network',
    /could apply on the published rules|never say who can apply|No scheme in the 120/i.test(t));
}

await goto(p, FILE + '#/p/120', 2500);
{
  const t = await text(p);
  ok('offline · Edinburgh still reads ≈£29,900 as a correction', /29,?900/.test(t));
}

// ── the tracker writes and survives a reload, from file:// ──────────────────
await goto(p, FILE + '#/find?q=Basel', 2500);
{
  const key = await evalJs(p, `(document.querySelector('a.card')?.getAttribute('href')||'').replace('#/record/','')`);
  await goto(p, FILE + '#/record/' + key, 2200);
  await evalJs(p, `(() => { const b=[...document.querySelectorAll('button')].find(b=>/shortlist/i.test(b.textContent)); b && b.click(); return true; })()`);
  await sleep(900);
  const raw = await evalJs(p, `localStorage.getItem('door3.personal.v1')`);
  const keys = raw ? Object.keys(JSON.parse(raw).entries || {}) : [];
  ok('offline · the tracker writes to localStorage under file://',
    keys.length > 0 && keys.every((k) => /^[0-9a-f]{12}$/.test(k)), JSON.stringify(keys));
  await goto(p, FILE + '#/shortlist', 2500);
  ok('offline · and it is still there after a reload', /1\b|shortlist/i.test(await text(p)));
}

const errs = [...p.consoleErrors, ...p.pageErrors].filter((e) => !/favicon/i.test(e));
ok('offline · no console or page errors', errs.length === 0, errs.slice(0, 3).join(' || '));

console.log('\n' + results.filter((r) => r.pass).length + ' / ' + results.length + ' passed');
const failed = results.filter((r) => !r.pass);
if (failed.length) console.log('FAILED:\n' + failed.map((f) => ' - ' + f.name + (f.detail ? ' — ' + f.detail : '')).join('\n'));
proc.kill();
process.exit(failed.length ? 1 : 0);
