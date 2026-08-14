import { launch, newBrowser, newPage, goto, evalJs, text, shot, typeInto, click, report } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

async function searchOn(route, q) {
  await goto(p, BASE + route, 1600);
  await typeInto(p, 'input[type=search]', q);
  await new Promise((r) => setTimeout(r, 900));
  const ids = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0])))`));
  return { ids, t: await text(p) };
}

console.log('### Detmold under DEFAULT filters ###');
const d1 = await searchOn('#/list', 'Detmold');
console.log('ids:', JSON.stringify(d1.ids));
console.log('chips//header:', JSON.stringify(d1.t.slice(0, 260)));
console.log('mentions suppressed/hidden?:', /hidden|excluded|suppress|audition filter|live audition/i.test(d1.t));
await shot(p, '06-detmold-default', true);

console.log('\n### Detmold with aud=all ###');
const d2 = await searchOn('#/list?aud=all', 'Detmold');
console.log('ids:', JSON.stringify(d2.ids));
console.log(JSON.stringify(d2.t.slice(0, 3000)));
await shot(p, '06-detmold-all', true);

console.log('\n### Record 331 — is the 3-cost-band disagreement stated? ###');
await goto(p, BASE + '#/p/331', 2000);
const t331 = await text(p);
console.log('len', t331.length);
console.log('mentions "6 records"?', /6 records/i.test(t331));
console.log('mentions disagree?', /disagree|conflict|differ|three different/i.test(t331));
const di = t331.search(/disagree|differ|records for this programme|6 records/i);
console.log('CONTEXT:', JSON.stringify(t331.slice(Math.max(0, di - 400), di + 1400)));
await shot(p, '06-record-331', true);

console.log('\n### Does the DEFAULT list disclose that confirmed auditions are hidden? ###');
await goto(p, BASE + '#/list', 1800);
const td = await text(p);
console.log('header:', JSON.stringify(td.slice(0, 400)));
console.log('total distinct in data = 355; list says:', (td.match(/(\d+)\s+programmes?/) || [])[0]);
await shot(p, '06-default-list-header', false);
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
