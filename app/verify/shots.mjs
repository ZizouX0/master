// Design-pass screenshot harness. Captures every screen at 390x844 in dark and light.
//   node verify/shots.mjs <tag> [--full] [--gray] [--wide]
import { launch, newBrowser, newPage, goto, evalJs, sleep, click } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = '/home/user/master/app/design-shots';
mkdirSync(OUT, { recursive: true });

const tag = process.argv[2] || 'x';
const FULL = process.argv.includes('--full');
const GRAY = process.argv.includes('--gray');
const WIDE = process.argv.includes('--wide');
const BASE = 'http://localhost:5173/master/';

// Five screens became three; the record is the fourth thing worth shooting.
const SCREENS = [
  ['week', '#/'],
  ['find', '#/find'],
  ['record-105', '#/p/105'],
  ['record-120', '#/p/120'],
  ['record-44', '#/p/44'],
  ['shortlist', '#/shortlist'],
];

async function shotTo(page, name, w, h, fullPage) {
  if (fullPage) {
    const m = await page.send('Page.getLayoutMetrics');
    const hh = Math.min(Math.ceil(m.contentSize.height), 16000);
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: hh, deviceScaleFactor: 1, mobile: !WIDE, screenWidth: w, screenHeight: hh,
    });
    await sleep(350);
  }
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
  if (fullPage) {
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile: !WIDE, screenWidth: w, screenHeight: h,
    });
    await sleep(200);
  }
}

const W = WIDE ? 1280 : 390;
const H = WIDE ? 900 : 844;

const { proc, port, wsUrl } = await launch('/tmp/cdp-shots-' + tag);
const browser = await newBrowser(port, wsUrl);
const page = await newPage(browser, { width: W, height: H });
if (WIDE) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: W, height: H, deviceScaleFactor: 1, mobile: false, screenWidth: W, screenHeight: H,
  });
}
if (GRAY) {
  await page.send('Emulation.setEmulatedMedia', { features: [] });
}

const themes = GRAY || WIDE ? ['dark'] : ['dark', 'light'];
const widths = [];

for (const theme of themes) {
  for (const [name, hash] of SCREENS) {
    await goto(page, BASE + hash, 900);
    await evalJs(page, `(() => { document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)}); return 1; })()`);
    if (GRAY) {
      await evalJs(page, `(() => { let s=document.getElementById('gs'); if(!s){s=document.createElement('style');s.id='gs';document.head.appendChild(s);} s.textContent='html{filter:grayscale(1) !important}'; return 1; })()`);
    }
    await sleep(450);
    const sw = await evalJs(page, `document.documentElement.scrollWidth`);
    widths.push([name, theme, sw]);
    await shotTo(page, `${tag}-${theme}-${name}`, W, H, FULL);
  }
}

// filter sheet, dark
await goto(page, BASE + '#/list', 900);
await evalJs(page, `(() => { document.documentElement.setAttribute('data-theme','dark'); return 1; })()`);
await click(page, 'Filters', { byText: true });
await sleep(500);
widths.push(['filtersheet', 'dark', await evalJs(page, `document.documentElement.scrollWidth`)]);
await shotTo(page, `${tag}-dark-filtersheet`, W, H, false);

// loading state
await evalJs(page, `(() => { location.hash = '#/'; return 1; })()`);
console.log(JSON.stringify(widths));
const bad = widths.filter(([, , w]) => w !== W);
console.log(bad.length ? 'OVERFLOW: ' + JSON.stringify(bad) : `scrollWidth ${W} everywhere`);
proc.kill();
process.exit(0);
