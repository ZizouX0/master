import { launch, newBrowser, newPage, goto, evalJs, text, shot, click, report, sleep } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

const setVal = (sel, v) => `(() => {
  const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return 'no element';
  const proto=Object.getPrototypeOf(e); const s=Object.getOwnPropertyDescriptor(proto,'value').set;
  s.call(e, ${JSON.stringify(v)});
  e.dispatchEvent(new Event('input',{bubbles:true}));
  e.dispatchEvent(new Event('change',{bubbles:true}));
  e.dispatchEvent(new Event('blur',{bubbles:true}));
  return 'ok'; })()`;

console.log('###### TRACKER round-trip on record 30 ######');
await goto(p, BASE + '#/p/30', 2200);
console.log('star:', JSON.stringify(await click(p, 'Add to my list', { byText: true })));
await sleep(600);
console.log('status Emailed them:', JSON.stringify(await click(p, 'Emailed them', { byText: true })));
await sleep(600);
console.log('set nextAction:', await evalJs(p, setVal('input[placeholder*="email them"]', 'ASK-POLIMI-2027-DATES')));
await sleep(400);
console.log('set note:', await evalJs(p, setVal('textarea', 'NOTE-ALPHA-771: emailed admissions 14 Aug, awaiting reply')));
await sleep(1200);
console.log('localStorage:', await evalJs(p, `localStorage.getItem('door3.personal.v1')`));

// star a second record so export has more than one row
await goto(p, BASE + '#/p/105', 2200);
await click(p, 'Add to my list', { byText: true });
await sleep(800);

console.log('\n--- RELOAD (fresh navigation) ---');
await goto(p, BASE + '#/p/30', 2500);
const vals = await evalJs(p, `JSON.stringify({
  nextAction: document.querySelector('input[placeholder*="email them"]')?.value ?? null,
  note: document.querySelector('textarea')?.value ?? null,
  starLabel: [...document.querySelectorAll('button')].map(b=>b.innerText).find(t=>/my list/i.test(t)) ?? null,
  statusPressed: [...document.querySelectorAll('button')].filter(b=>b.getAttribute('aria-pressed')==='true'||b.className.includes('on')||b.className.includes('sel')).map(b=>b.innerText).slice(0,6)
})`);
console.log('AFTER RELOAD:', vals);
await shot(p, 'x-tracker-record-after-reload', false);

await goto(p, BASE + '#/me', 2500);
const mv = await evalJs(p, `JSON.stringify({
  noteVals: [...document.querySelectorAll('textarea')].map(t=>t.value.slice(0,120)),
  inputVals: [...document.querySelectorAll('input')].map(t=>t.value.slice(0,80)),
  bodyHas: document.body.innerText.includes('NOTE-ALPHA-771')
})`);
console.log('MY LIST values:', mv);
await shot(p, 'x-my-list-after-reload', true);

console.log('\n###### EXPORT ######');
for (const label of ['Export Markdown', 'Export JSON']) {
  await click(p, label, { byText: true });
  await sleep(1200);
  const out = await evalJs(p, `(() => { const e=document.querySelector('#rec-out'); return e ? e.value : null; })()`);
  console.log(`\n===== ${label} → #rec-out length ${out ? out.length : 'NULL'} =====`);
  console.log(out ? out.slice(0, 1400) : 'NO OUTPUT');
}
await shot(p, 'x-export-output', true);

// Does the export actually contain his state and real record identity?
const jsonOut = await evalJs(p, `(() => { const e=document.querySelector('#rec-out'); return e ? e.value : ''; })()`);
try {
  const parsed = JSON.parse(jsonOut);
  console.log('\nJSON parses OK. keys:', Object.keys(parsed), 'entries:', Object.keys(parsed.entries || {}).length);
  console.log('entry sample:', JSON.stringify(Object.values(parsed.entries || {})[0]));
  console.log('contains note:', jsonOut.includes('NOTE-ALPHA-771'), '| contains nextAction:', jsonOut.includes('ASK-POLIMI-2027-DATES'));
} catch (e) { console.log('JSON parse failed:', String(e).slice(0, 200)); }
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
