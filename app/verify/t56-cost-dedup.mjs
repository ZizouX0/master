import { launch, newBrowser, newPage, goto, evalJs, text, shot, typeInto, report } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

async function search(q) {
  await goto(p, BASE + '#/list', 1600);
  const sel = await evalJs(p, `(() => { const e=document.querySelector('input[type=search],input[type=text],input[placeholder]'); return e ? (e.tagName+'|'+(e.type||'')+'|'+(e.placeholder||'')) : null; })()`);
  await typeInto(p, 'input[type=search],input[type=text],input[placeholder]', q);
  await new Promise((r) => setTimeout(r, 900));
  const hrefs = await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>a.getAttribute('href')))`);
  return { sel, ids: JSON.parse(hrefs).map((h) => Number(h.split('#/p/')[1].split(/[?&]/)[0])), t: await text(p) };
}

console.log('###### ITEM 5 — Edinburgh (120) and KASK (5) ######');
for (const [q, id, want] of [['Edinburgh', 120, /29,?900|29900/], ['KASK', 5, /8,?800|8800/]]) {
  const r = await search(q);
  console.log(`\n=== search "${q}" === input=${r.sel} ids=${JSON.stringify(r.ids)}`);
  console.log('LIST TEXT:', JSON.stringify(r.t.slice(0, 1800)));
  await shot(p, `05-search-${q.toLowerCase()}`, true);

  await goto(p, `${BASE}#/p/${id}`, 1800);
  const t = await text(p);
  console.log(`--- record ${id}: correctedFigureFound=${want.test(t)} `);
  const m = t.match(want);
  if (m) {
    const i = t.indexOf(m[0]);
    console.log('   CONTEXT:', JSON.stringify(t.slice(Math.max(0, i - 700), i + 400)));
  }
  console.log('   HEAD:', JSON.stringify(t.slice(0, 800)));
  await shot(p, `05-record-${id}`, true);
}

console.log('\n###### ITEM 5b — do 120 / 5 appear in any cheap or free selection? ######');
for (const [name, r] of [['cheap=1', '#/list?cheap=1'], ['cost=Under EUR 1.5k/yr', '#/list?cost=' + encodeURIComponent('Under EUR 1.5k/yr')], ['cost=Free', '#/list?cost=Free'], ['sort cheapest', '#/list?sort=cost']]) {
  await goto(p, BASE + r, 1800);
  await evalJs(p, `(window.scrollTo(0,document.body.scrollHeight),true)`);
  const ids = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0])))`));
  const t = await text(p);
  console.log(`${name.padEnd(26)} n=${ids.length} has120=${ids.includes(120)} has5=${ids.includes(5)} EdinburghName=${t.includes('Edinburgh')} KASKName=${t.includes('KASK')}`);
}

console.log('\n###### ITEM 6 — Detmold and ICMP ######');
const det = await search('Detmold');
console.log('Detmold ids:', JSON.stringify(det.ids));
console.log(JSON.stringify(det.t.slice(0, 2500)));
await shot(p, '06-search-detmold', true);

const icmp = await search('ICMP');
console.log('\nICMP ids:', JSON.stringify(icmp.ids));
console.log(JSON.stringify(icmp.t.slice(0, 2000)));
await shot(p, '06-search-icmp', true);

console.log('\n### WORTH IT count as displayed ###');
for (const r of ['#/', '#/list?v=WORTH+IT&aud=all', '#/list?v=WORTH+IT']) {
  await goto(p, BASE + r, 1800);
  const t = await text(p);
  const worth = t.match(/.{140}WORTH IT.{140}/is);
  console.log(`route ${r}:`, JSON.stringify((t.match(/(\d+)\s+programmes?/) || [])[0]), '||', JSON.stringify(worth ? worth[0].replace(/\n/g, ' ') : null));
}
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
