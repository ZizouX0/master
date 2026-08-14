import { launch, newBrowser, newPage, goto, evalJs, text, shot, typeInto, click, report } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

async function searchDefault(q) {
  await goto(p, BASE + '#/list', 1600);
  await typeInto(p, 'input[type=search]', q);
  await new Promise((r) => setTimeout(r, 900));
  const ids = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0])))`));
  return { ids, t: await text(p) };
}

console.log('### A search that ONLY matches confirmed-audition records: "Babelsberg" ###');
const bb = await searchDefault('Babelsberg');
console.log('ids:', JSON.stringify(bb.ids));
console.log(JSON.stringify(bb.t.slice(0, 1400)));
await shot(p, '06b-search-babelsberg-default', true);

console.log('\n### The filter drawer — what does it say about auditions? ###');
await goto(p, BASE + '#/list', 1800);
await click(p, 'Filters', { byText: true });
await new Promise((r) => setTimeout(r, 700));
const ft = await text(p);
const ai = ft.search(/audition/i);
console.log('drawer audition section:', JSON.stringify(ft.slice(Math.max(0, ai - 500), ai + 900)));
await shot(p, '06b-filter-drawer', true);

console.log('\n### "Cheapest" sort — where does cost-disputed Edinburgh land? ###');
await goto(p, BASE + '#/list', 1800);
await click(p, 'Cheapest', { byText: true });
await new Promise((r) => setTimeout(r, 1200));
const ids = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0])))`));
console.log('first 25 ids after Cheapest sort:', JSON.stringify(ids.slice(0, 25)));
console.log('index of Edinburgh(120):', ids.indexOf(120), 'of', ids.length);
const st = await text(p);
console.log('head:', JSON.stringify(st.slice(0, 1500)));
await shot(p, '05b-cheapest-sort', false);

// Does the cost-disputed marker travel with the card in the cheapest sort?
const cardTexts = await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].slice(0,60).map(a=>({id:Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0]), txt:a.innerText.replace(/\\n/g,' ').slice(0,200)})))`);
const parsed = JSON.parse(cardTexts);
const disputed = parsed.filter((c) => /WRONG — see correction/i.test(c.txt));
console.log('cards in cheapest sort carrying the WRONG-see-correction marker:', disputed.length);
for (const c of disputed.slice(0, 8)) console.log('   ', c.id, c.txt.slice(0, 150));
const edin = parsed.find((c) => c.id === 120);
console.log('Edinburgh card text:', edin ? edin.txt : 'not in first 60');
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
