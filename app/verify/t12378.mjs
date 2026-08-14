import { launch, newBrowser, newPage, goto, evalJs, text, shot, typeInto, click, report } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

async function searchList(q, route = '#/list') {
  await goto(p, BASE + route, 1600);
  await typeInto(p, 'input[type=search]', q);
  await new Promise((r) => setTimeout(r, 900));
  const cards = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>({id:Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0]), txt:a.innerText.replace(/\\n/g,' | ')})))`));
  return { cards, t: await text(p) };
}

console.log('###### ITEM 1 — non-degree test (the money test) ######');
for (const [q, id] of [['Mastère Réalisation et Production Sonore', 44], ['Máster en Producción Musical Discográfica', 37]]) {
  const r = await searchList(q);
  const card = r.cards.find((c) => c.id === id);
  console.log(`\nsearch ${JSON.stringify(q.slice(0, 40))} -> ids ${JSON.stringify(r.cards.map((c) => c.id))}`);
  console.log('  card present:', !!card);
  if (card) {
    console.log('  CARD TEXT:', JSON.stringify(card.txt.slice(0, 400)));
    console.log('  not-a-degree marker on card:', /not a master|not a degree|certificate, not|título propio|this is not a/i.test(card.txt));
  }
  await shot(p, `01-notdegree-search-${id}`, true);
}

console.log('\n### Item 1b — most optimistic filter: any isDegree:false without a marker? ###');
for (const [name, route] of [
  ['best chance+cheap+no audition', '#/list?ch=Strong&cheap=1'],
  ['cheap only', '#/list?cheap=1'],
  ['the-14', '#/list?ch=Strong,Possible&v=WORTH+IT,CONDITIONAL,unchecked&deg=1&langok=1&cheap=1'],
]) {
  await goto(p, BASE + route, 1800);
  for (let i = 0; i < 20; i++) {
    await evalJs(p, `(window.scrollTo(0,document.body.scrollHeight),true)`);
    await new Promise((r) => setTimeout(r, 200));
    const more = await evalJs(p, `(() => { const el=[...document.querySelectorAll('button')].find(e=>/more|show all/i.test(e.innerText)); if(!el) return false; el.click(); return true; })()`);
    if (!more) break;
    await new Promise((r) => setTimeout(r, 400));
  }
  const cards = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>({id:Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0]), txt:a.innerText.replace(/\\n/g,' | ')})))`));
  const nd = cards.filter((c) => /not a master|not a degree|certificate, not/i.test(c.txt));
  console.log(`${name.padEnd(30)} n=${cards.length} cardsMarkedNotADegree=${nd.length} ids=${JSON.stringify(nd.map((c) => c.id))}`);
  console.log('   NDIDS_ALL:', JSON.stringify(cards.map((c) => c.id)));
}

console.log('\n###### ITEM 2 — unverified-gap test ######');
await goto(p, BASE + '#/list', 1800);
const t2 = await text(p);
const cards2 = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].slice(0,20).map(a=>a.innerText.replace(/\\n/g,' | ')))`));
console.log('sample card markers (first 8):');
for (const c of cards2.slice(0, 8)) console.log('   ', JSON.stringify(c.slice(0, 170)));
console.log('list contains NOT VERIFIED marker:', /NOT VERIFIED/i.test(t2));
await goto(p, BASE + '#/', 1800);
const tS = await text(p);
console.log('start states 249/398:', /249 of 398/.test(tS));
console.log('start states non-degree unverified:', JSON.stringify((tS.match(/\d+ of the \d+[^\n]*/g) || []).slice(0, 6)));
await goto(p, BASE + '#/rejects', 2000);
const tR = await text(p);
console.log('\nNOT-A-DEGREE view head:', JSON.stringify(tR.slice(0, 1200)));
console.log('states 135 never verified?', /135/.test(tR));
await shot(p, '02-not-degree-view', true);

console.log('\n###### ITEM 3 — the survivors test ######');
await goto(p, BASE + '#/list?ch=Strong,Possible&v=WORTH+IT,CONDITIONAL,unchecked&deg=1&langok=1&cheap=1', 2000);
const t3 = await text(p);
console.log('count:', (t3.match(/(\d+)\s+programmes?/) || [])[0]);
console.log('verdict split visible on screen?', /worth it/i.test(t3), /conditional/i.test(t3), /not verified|unchecked|never checked/i.test(t3));
console.log(JSON.stringify(t3.slice(0, 1500)));
await shot(p, '03-survivors', true);

console.log('\n###### ITEM 7 — PRIOR CYCLE deadline honesty ######');
for (const id of [30, 82, 72]) {
  await goto(p, `${BASE}#/p/${id}`, 1800);
  const t = await text(p);
  const i = t.search(/prior cycle/i);
  console.log(`\nid ${id}: hasPRIORCYCLE=${i >= 0}`);
  if (i >= 0) console.log('   CONTEXT:', JSON.stringify(t.slice(Math.max(0, i - 420), i + 380)));
}
await shot(p, '07-prior-cycle-30', true);

console.log('\n###### ITEM 8 — Chevening ######');
await goto(p, BASE + '#/money', 2200);
await typeInto(p, 'input[type=search]', 'Chevening');
await new Promise((r) => setTimeout(r, 1200));
const t8 = await text(p);
console.log(JSON.stringify(t8.slice(0, 2500)));
await shot(p, '08-chevening', true);
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
