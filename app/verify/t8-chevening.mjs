import { launch, newBrowser, newPage, goto, evalJs, text, shot, typeInto, click, report } from './cdp.mjs';
const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

await goto(p, BASE + '#/money', 2500);
console.log('inputs on Money page:', await evalJs(p, `JSON.stringify([...document.querySelectorAll('input,select,button')].slice(0,20).map(e=>e.tagName+'|'+(e.type||'')+'|'+((e.placeholder||e.innerText||'').slice(0,50))))`));

// exhaust any pagination, then locate Chevening
for (let i = 0; i < 40; i++) {
  await evalJs(p, `(window.scrollTo(0,document.body.scrollHeight),true)`);
  await new Promise((r) => setTimeout(r, 200));
  const more = await evalJs(p, `(() => { const el=[...document.querySelectorAll('button')].find(e=>/more|show all|load/i.test(e.innerText)); if(!el) return false; el.click(); return true; })()`);
  if (!more) break;
  await new Promise((r) => setTimeout(r, 350));
}
const t = await text(p);
const i = t.search(/chevening/i);
console.log('\nChevening found on Money page:', i >= 0, 'at', i, 'of', t.length);
if (i >= 0) console.log('CONTEXT:\n', JSON.stringify(t.slice(Math.max(0, i - 900), i + 1400)));

// Scroll Chevening into view and shoot it
await evalJs(p, `(() => { const el=[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && /chevening/i.test(e.textContent))[0]; if(el) el.scrollIntoView({block:'center'}); return !!el; })()`);
await new Promise((r) => setTimeout(r, 500));
await shot(p, '08-chevening-card', false);

console.log('\n### the four eligibility filters — does Chevening survive "No work-experience bar"? ###');
for (const label of ['A Tunisian can apply', 'No work-experience bar', 'No offer needed first', 'An age cap he clears']) {
  await goto(p, BASE + '#/money', 2200);
  const clicked = await click(p, label, { byText: true });
  await new Promise((r) => setTimeout(r, 900));
  for (let k = 0; k < 40; k++) {
    await evalJs(p, `(window.scrollTo(0,document.body.scrollHeight),true)`);
    await new Promise((r) => setTimeout(r, 150));
    const more = await evalJs(p, `(() => { const el=[...document.querySelectorAll('button')].find(e=>/more|show all|load/i.test(e.innerText)); if(!el) return false; el.click(); return true; })()`);
    if (!more) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  const tt = await text(p);
  const shown = (tt.match(/(\d+) of 120 schemes shown/) || [])[0];
  console.log(`${label.padEnd(26)} clicked=${!!clicked} -> ${shown} | Chevening present=${/chevening/i.test(tt)}`);
  if (/chevening/i.test(tt)) {
    const j = tt.search(/chevening/i);
    console.log('    ', JSON.stringify(tt.slice(Math.max(0, j - 260), j + 420)));
  }
}
await shot(p, '08-money-filtered', true);
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
