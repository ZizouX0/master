import { launch, newBrowser, newPage, goto, evalJs, text, shot, overflow, report, sleep } from './cdp.mjs';
const FILE = 'file:///home/user/master/app/dist-single/door3.html';
const { port, wsUrl } = await launch('/tmp/cdp-profile-offline');
const b = await newBrowser(port, wsUrl);
const p = await newPage(b);

console.log('###### STATUS CONTROL (http build) ######');
await goto(p, 'http://127.0.0.1:8099/master/#/p/30', 2200);
const kinds = await evalJs(p, `JSON.stringify([...document.querySelectorAll('button,label,input')].filter(e=>/emailed|applying|shortlist|not tracked/i.test(e.innerText||e.value||'')).map(e=>e.tagName+'|'+(e.type||'')+'|'+(e.innerText||e.value||'').trim().slice(0,20)))`);
console.log('status controls:', kinds);
const res = await evalJs(p, `(() => { const el=[...document.querySelectorAll('button,label')].find(e=>/^emailed them$/i.test((e.innerText||'').trim())); if(!el) return 'not found'; el.click(); return 'clicked ' + el.tagName; })()`);
console.log('click result:', res);
await sleep(1000);
console.log('localStorage now:', await evalJs(p, `localStorage.getItem('door3.personal.v1')`));
await goto(p, 'http://127.0.0.1:8099/master/#/p/30', 2200);
console.log('after reload status persists:', await evalJs(p, `localStorage.getItem('door3.personal.v1')`));

console.log('\n\n###### OFFLINE SINGLE FILE — file:// ######');
await goto(p, FILE, 3500);
console.log('url:', await evalJs(p, 'location.href'));
console.log('viewport:', await evalJs(p, 'JSON.stringify({w:innerWidth,h:innerHeight})'));
const t0 = await text(p);
console.log('rendered chars:', t0.length);
console.log('HEAD:', JSON.stringify(t0.slice(0, 1100)));
console.log('OVERFLOW:', JSON.stringify(await overflow(p)));
await shot(p, 'off-01-start', true);

console.log('\n--- navigate: open a record (258, an audition record) ---');
await goto(p, FILE + '#/p/258', 2200);
const t1 = await text(p);
console.log('len', t1.length, '| LIVE AUDITION chip:', /LIVE AUDITION/.test(t1), '| correction block:', /CORRECTION \(WORKBOOK COLUMN G\)/i.test(t1));
console.log(JSON.stringify(t1.slice(0, 700)));
await shot(p, 'off-02-record-258', true);

console.log('\n--- navigate: Edinburgh correction offline ---');
await goto(p, FILE + '#/p/120', 2200);
const t2 = await text(p);
console.log('29,900 present:', /29,?900/.test(t2), '| WRONG-see-correction chip:', /WRONG — see correction/.test(t2));
await shot(p, 'off-03-record-120', true);

console.log('\n--- use a filter offline ---');
await goto(p, FILE + '#/list?cheap=1', 2500);
const t3 = await text(p);
console.log('cheap list count:', (t3.match(/(\d+)\s+programmes?/) || [])[0]);
const ids = JSON.parse(await evalJs(p, `JSON.stringify([...document.querySelectorAll('a[href*="#/p/"]')].map(a=>Number(a.getAttribute('href').split('#/p/')[1].split(/[?&]/)[0])))`));
console.log('has Edinburgh(120):', ids.includes(120), '| has KASK(5):', ids.includes(5), '| rendered', ids.length);
await shot(p, 'off-04-cheap-filter', true);

console.log('\n--- search offline ---');
await goto(p, FILE + '#/list', 2200);
await evalJs(p, `(() => { const e=document.querySelector('input[type=search]'); const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),'value').set; s.call(e,'Detmold'); e.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
await sleep(1200);
const t4 = await text(p);
console.log('search Detmold offline ->', (t4.match(/(\d+)\s+programmes?/) || [])[0]);
await shot(p, 'off-05-search', true);

console.log('\n--- tracker offline ---');
await goto(p, FILE + '#/p/30', 2200);
await evalJs(p, `(() => { const el=[...document.querySelectorAll('button')].find(e=>/add to my list/i.test(e.innerText)); if(el) el.click(); return !!el; })()`);
await sleep(900);
console.log('localStorage (file://):', await evalJs(p, `localStorage.getItem('door3.personal.v1')`));
await goto(p, FILE + '#/me', 2500);
const t5 = await text(p);
console.log('My list offline:', JSON.stringify(t5.slice(0, 500)));
await shot(p, 'off-06-my-list', true);

console.log('\nCONSOLE (offline session):', JSON.stringify(report(p), null, 1));
process.exit(0);
