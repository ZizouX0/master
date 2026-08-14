import { launch, newBrowser, newPage, goto, evalJs, text, shot, overflow, report } from './cdp.mjs';

const BASE = 'http://127.0.0.1:8099/master/';
const { port, wsUrl } = await launch();
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

const AUDITION_RE = /live (music|performance|instrumental) (test|audition)|ear[- ]training|piano performance|functionally an audition|pitch-memory|rhythmic dictation|AUDITION/i;

console.log('###### ITEM 4 — audition records 253,254,258,259,260 ######');
for (const id of [253, 254, 258, 259, 260]) {
  await goto(p, `${BASE}#/p/${id}`, 1800);
  const t = await text(p);
  const ov = await overflow(p);
  const hit = t.match(AUDITION_RE);
  // Is the audition warning visible ABOVE the fold / without clicking? capture what is in the
  // first 1200 chars of the record page text.
  console.log(`\n--- id ${id} --- overflow.scrollWidth=${ov.scrollWidth} offenders=${ov.offenders.length}`);
  console.log('   auditionPhraseFound:', hit ? JSON.stringify(hit[0]) : 'NONE');
  console.log('   idx of phrase:', hit ? t.search(AUDITION_RE) : -1, 'of', t.length);
  console.log('   HEAD:', JSON.stringify(t.slice(0, 900)));
  await shot(p, `04-audition-${id}`, true);
}

console.log('\n###### ITEM 4b — do they appear in a "no audition" filter? ######');
// The app default keeps audition ∈ {suspected, none-found}. Probe several no-audition routes.
const routes = [
  ['default list', '#/list'],
  ['no-audition explicit', '#/list?aud=none-found'],
  ['no-audition+suspected (default)', '#/list?aud=suspected,none-found'],
  ['free+cheap reachable', '#/list?cheap=1'],
  ['start funnel final (the 14)', '#/list?ch=Strong,Possible&v=WORTH+IT,CONDITIONAL,unchecked&deg=1&langok=1&cheap=1'],
  ['degree+langok+cheap', '#/list?deg=1&langok=1&cheap=1'],
  ['cost band Free facet', '#/list?cost=Free'],
];
for (const [name, r] of routes) {
  await goto(p, BASE + r, 1600);
  const ids = await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"],a[href*="#/g/"]')].map(a=>a.getAttribute('href')))`);
  const t = await text(p);
  const has = [253, 254, 258, 259, 260].filter((id) => JSON.parse(ids).some((h) => h.endsWith('/p/' + id) || h.includes('/p/' + id + '?') || h.endsWith('/g/' + id)));
  const nameHits = ['Babelsberg', 'FAMU'].filter((s) => t.includes(s));
  console.log(`${name.padEnd(34)} -> targetIdsPresent=[${has}] institutionNameHits=[${nameHits}] count="${(t.match(/\n(\d+)\s+(programme|result|match)/i) || [])[0] || ''}"`);
  if (nameHits.length) {
    // find the surrounding text so we can see whether the warning rides along
    const i = t.indexOf(nameHits[0]);
    console.log('     CONTEXT:', JSON.stringify(t.slice(Math.max(0, i - 300), i + 500)));
  }
}
console.log('\nCONSOLE:', JSON.stringify(report(p), null, 1));
process.exit(0);
