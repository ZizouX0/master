import { launch, newBrowser, newPage, goto, evalJs, text, shot, report } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

// Scroll to the bottom repeatedly, clicking any "show more" control, then enumerate every card.
async function fullList(route) {
  await goto(p, BASE + route, 1800);
  for (let i = 0; i < 30; i++) {
    await evalJs(p, `(window.scrollTo(0, document.body.scrollHeight), true)`);
    await new Promise((r) => setTimeout(r, 250));
    const more = await evalJs(p, `(() => {
      const el=[...document.querySelectorAll('button')].find(e=>/more|show all|load/i.test(e.innerText));
      if(!el) return false; el.click(); return true; })()`);
    if (!more) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const hrefs = await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>a.getAttribute('href')))`);
  const stated = await evalJs(p, `(() => { const m=document.body.innerText.match(/(\\d+)\\s+programmes?/); return m?m[1]:null; })()`);
  const t = await text(p);
  return { ids: JSON.parse(hrefs).map((h) => Number(h.split('#/p/')[1].split(/[?&]/)[0])), stated, t };
}

const TARGET = [253, 254, 258, 259, 260];
const routes = [
  ['default', '#/list'],
  ['aud=none-found', '#/list?aud=none-found'],
  ['cost=Free', '#/list?cost=Free'],
  ['cheap=1', '#/list?cheap=1'],
  ['the-14', '#/list?ch=Strong,Possible&v=WORTH+IT,CONDITIONAL,unchecked&deg=1&langok=1&cheap=1'],
];
for (const [name, r] of routes) {
  const { ids, stated } = await fullList(r);
  const bad = ids.filter((i) => TARGET.includes(i));
  console.log(`${name.padEnd(16)} rendered=${ids.length} stated=${stated} TARGETS_PRESENT=${JSON.stringify(bad)}`);
}

console.log('\n### cost=Free full contents (the free-and-reachable trap) ###');
const free = await fullList('#/list?cost=Free');
console.log('ids:', JSON.stringify(free.ids));
console.log(free.t.slice(0, 2600));
await shot(p, '04b-free-list', true);

console.log('\n### aud=none-found : does it contain any confirmed-audition record? ###');
const na = await fullList('#/list?aud=none-found');
console.log('ids count', na.ids.length, 'stated', na.stated);
console.log(JSON.stringify(na.ids));
await shot(p, '04b-no-audition-list', true);
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
