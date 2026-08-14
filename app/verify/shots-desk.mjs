// Screens of the rebuild, at laptop and phone width.
//   node verify/shots-desk.mjs [tag]
import { launch, newBrowser, newPage, goto, evalJs, sleep } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = '/home/user/master/app/design-shots';
mkdirSync(OUT, { recursive: true });
const tag = process.argv[2] || 'desk';
const BASE_DEFAULT = 'http://localhost:5173/master/';
const BASE = process.env.BASE || 'http://localhost:5173/master/';

const { proc, port, wsUrl } = await launch('/tmp/cdp-shots-' + tag);
const browser = await newBrowser(port, wsUrl);

async function capture(width, height, mobile, name, hash, full = false) {
  const pg = await newPage(browser, { width, height });
  await pg.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height,
  });
  await goto(pg, BASE + hash, 2200);
  if (full) {
    const m = await pg.send('Page.getLayoutMetrics');
    const h = Math.min(Math.ceil(m.contentSize.height), 9000);
    await pg.send('Emulation.setDeviceMetricsOverride', {
      width, height: h, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: h,
    });
    await sleep(400);
  }
  const { data } = await pg.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${tag}-${name}.png`, Buffer.from(data, 'base64'));
  await browser.send('Target.closeTarget', { targetId: pg.targetId });
  console.log(name);
}

const key = await (async () => {
  const pg = await newPage(browser, { width: 1440, height: 900 });
  await goto(pg, BASE + '#/find', 2500);
  const k = await evalJs(pg, `(document.querySelector('a.card')?.getAttribute('href')||'').replace('#/record/','')`);
  await browser.send('Target.closeTarget', { targetId: pg.targetId });
  return k;
})();

await capture(1440, 900, false, 'week', '#/');
await capture(1440, 900, false, 'find', '#/find');
await capture(1440, 900, false, 'find-open', '#/p/15');
await capture(1440, 900, false, 'record-pane', '#/p/105');
await capture(1440, 900, false, 'record-120', '#/p/120');
await capture(1440, 900, false, 'shortlist', '#/shortlist');
await capture(390, 844, true, 'week-narrow', '#/');
await capture(390, 844, true, 'record-narrow', '#/p/105');
await capture(1440, 900, false, 'week-full', '#/', true);

proc.kill();
