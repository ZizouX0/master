import { launch, newBrowser, newPage, goto, evalJs, text, shot, overflow, click, typeInto, report, sleep } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

console.log('###### OVERFLOW at 390px on every screen ######');
const screens = [
  ['start', '#/'], ['list', '#/list'], ['list-filtered', '#/list?ch=Strong,Possible&v=WORTH+IT,CONDITIONAL,unchecked&deg=1&langok=1&cheap=1'],
  ['record-30', '#/p/30'], ['record-331-dedup', '#/p/331'], ['record-258-audition', '#/p/258'],
  ['record-120-edinburgh', '#/p/120'], ['money', '#/money'], ['not-degree', '#/rejects'], ['my-list', '#/me'],
];
let overflowFail = [];
for (const [name, r] of screens) {
  await goto(p, BASE + r, 1800);
  // measure at top and after scrolling to the bottom (sticky bars can overflow only when pinned)
  const a = await overflow(p);
  await evalJs(p, `(window.scrollTo(0,document.body.scrollHeight),true)`);
  await sleep(400);
  const c = await overflow(p);
  const bad = a.scrollWidth !== 390 || c.scrollWidth !== 390;
  if (bad) overflowFail.push(name);
  console.log(`${name.padEnd(22)} top.scrollWidth=${a.scrollWidth} bottom.scrollWidth=${c.scrollWidth} offenders=${JSON.stringify(a.offenders.concat(c.offenders).slice(0, 4))} ${bad ? '**OVERFLOW**' : 'ok'}`);
}
console.log('OVERFLOW RESULT:', overflowFail.length ? 'FAIL ' + overflowFail : 'PASS — 390 everywhere');

// Also open the filter drawer, which is the widest control surface
await goto(p, BASE + '#/list', 1800);
await click(p, 'Filters', { byText: true });
await sleep(900);
const dr = await overflow(p);
console.log('filter drawer open: scrollWidth=', dr.scrollWidth, 'offenders', JSON.stringify(dr.offenders.slice(0, 4)));
const drawerTxt = await text(p);
const ai = drawerTxt.search(/audition/i);
console.log('drawer mentions audition at', ai, ':', JSON.stringify(drawerTxt.slice(Math.max(0, ai - 300), ai + 700)));
await shot(p, 'x-filter-drawer', true);

console.log('\n###### TRACKER: star + note, then RELOAD ######');
await goto(p, BASE + '#/p/30', 2200);
const star = await click(p, 'Add to my list', { byText: true });
console.log('clicked star:', JSON.stringify(star));
await sleep(700);
// status
const st = await click(p, 'Emailed them', { byText: true });
console.log('clicked status Emailed them:', JSON.stringify(st));
await sleep(700);
// notes: find textareas
const areas = await evalJs(p, `JSON.stringify([...document.querySelectorAll('textarea,input[type=text]')].map((e,i)=>i+':'+e.tagName+':'+(e.placeholder||e.getAttribute('aria-label')||'')))`);
console.log('text fields on record:', areas);
await evalJs(p, `(() => {
  const els=[...document.querySelectorAll('textarea')];
  const set=(e,v)=>{const p=Object.getPrototypeOf(e);const s=Object.getOwnPropertyDescriptor(p,'value').set;s.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('blur',{bubbles:true}));};
  if(els[0]) set(els[0],'VERIFY-NEXT-ACTION-9f3a');
  if(els[1]) set(els[1],'VERIFY-NOTE-9f3a emailed the admissions office');
  return els.length; })()`);
await sleep(1200);
const ls1 = await evalJs(p, `JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k, (localStorage.getItem(k)||'').slice(0,400)])))`);
console.log('localStorage BEFORE reload:', ls1.slice(0, 800));

await goto(p, BASE + '#/p/30', 2500);
const after = await text(p);
console.log('AFTER RELOAD -> note present:', after.includes('VERIFY-NOTE-9f3a'), '| nextAction present:', after.includes('VERIFY-NEXT-ACTION-9f3a'), '| status Emailed:', /emailed/i.test(after));
const si = after.search(/VERIFY-N/);
console.log('CONTEXT:', JSON.stringify(after.slice(Math.max(0, si - 500), si + 300)));
await shot(p, 'x-tracker-after-reload', true);

await goto(p, BASE + '#/me', 2200);
const mine = await text(p);
console.log('\nMY LIST after reload:', JSON.stringify(mine.slice(0, 1600)));
console.log('note visible on My list:', mine.includes('VERIFY-NOTE-9f3a'));
await shot(p, 'x-my-list', true);

console.log('\n###### EXPORT ######');
const btns = await evalJs(p, `JSON.stringify([...document.querySelectorAll('button,a')].map(e=>e.innerText.replace(/\\n/g,' ').slice(0,40)).filter(Boolean))`);
console.log('controls on My list:', btns);
// Intercept blob/anchor downloads so we can read what export actually produces.
await evalJs(p, `(() => {
  window.__dl=[];
  const origCreate=URL.createObjectURL;
  URL.createObjectURL=function(blob){ blob.text().then(t=>window.__dl.push({type:blob.type,size:blob.size,text:t})); return origCreate.call(URL,blob); };
  const origClick=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){ window.__dlAnchor=(this.download||'')+' :: '+String(this.href).slice(0,80); return origClick.call(this); };
  return true; })()`);
for (const label of ['JSON', 'Markdown', 'Export']) {
  const c = await click(p, label, { byText: true });
  if (c) { console.log('clicked', label, JSON.stringify(c.txt)); await sleep(900); }
}
const dl = await evalJs(p, `JSON.stringify({anchor: window.__dlAnchor||null, files: (window.__dl||[]).map(d=>({type:d.type,size:d.size,head:d.text.slice(0,700)}))})`);
console.log('EXPORT OUTPUT:', dl.slice(0, 2500));
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
