// Regression 7, restated for a laptop: no horizontal scroll at any width he might use.
//   node verify/t-widths.mjs
import { launch, newBrowser, newPage, goto, evalJs } from './cdp.mjs';

const BASE = process.env.BASE || 'http://localhost:5173/master/';
const WIDTHS = [390, 768, 1024, 1239, 1240, 1280, 1440, 1600, 1920];
const SCREENS = [['#/', 'week'], ['#/find', 'find'], ['#/p/105', 'record'], ['#/shortlist', 'shortlist']];

const { proc, port, wsUrl } = await launch('/tmp/cdp-widths');
const browser = await newBrowser(port, wsUrl);
let bad = 0;

for (const w of WIDTHS) {
  const pg = await newPage(browser, { width: w, height: 900 });
  await pg.send('Emulation.setDeviceMetricsOverride', {
    width: w, height: 900, deviceScaleFactor: 1, mobile: w < 720, screenWidth: w, screenHeight: 900,
  });
  const line = [];
  for (const [hash, name] of SCREENS) {
    await goto(pg, BASE + hash, 1600);
    const o = await evalJs(pg, `({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})`);
    const ok = o.sw <= o.cw;
    if (!ok) bad++;
    line.push(`${name}:${ok ? 'ok' : o.sw + '>' + o.cw}`);
  }
  console.log(`${String(w).padStart(4)}  ${line.join('  ')}`);
  await browser.send('Target.closeTarget', { targetId: pg.targetId });
}

console.log(bad === 0 ? '\nno horizontal scroll at any width' : `\n${bad} overflowing`);
proc.kill();
process.exit(bad ? 1 : 0);
