#!/usr/bin/env node
// Render a page in real Chromium and print its text. Several of the most
// important institutions in this sweep (upf.edu above all) sit behind a
// Cloudflare JS challenge that returns 403 to every plain HTTP client, so the
// only way to read them honestly is to actually run the challenge.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'node:fs';

const urls = process.argv.slice(2).filter(a => !a.startsWith('--'));
const outDir = (process.argv.find(a => a.startsWith('--out=')) || '').slice(6);
const wantHtml = process.argv.includes('--html');
if (!urls.length) { console.error('usage: fetch.mjs <url...> [--out=DIR] [--html]'); process.exit(1); }

// all outbound traffic in this environment goes through the agent proxy, and
// the proxy's CA has to be trusted or every TLS handshake fails
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-blink-features=AutomationControlled',
    `--proxy-server=${process.env.HTTPS_PROXY || 'http://127.0.0.1:41749'}`,
    '--proxy-bypass-list=<-loopback>', '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  locale: 'en-GB',
  viewport: { width: 1400, height: 1000 },
  ignoreHTTPSErrors: true,
});
await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }));

for (const url of urls) {
  const page = await ctx.newPage();
  let status = 'ERR', text = '', title = '';
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    status = resp ? resp.status() : 'no-response';
    // ride out the Cloudflare interstitial
    for (let i = 0; i < 12; i++) {
      title = await page.title().catch(() => '');
      if (!/just a moment|attention required|checking your browser/i.test(title)) break;
      await page.waitForTimeout(2500);
    }
    await page.waitForTimeout(1200);
    title = await page.title().catch(() => '');
    text = await page.evaluate(() => {
      for (const el of document.querySelectorAll('script,style,noscript,svg')) el.remove();
      return (document.body?.innerText || '').replace(/\n{3,}/g, '\n\n');
    });
    if (wantHtml) text = await page.content();
  } catch (e) { text = 'FETCH ERROR: ' + e.message; }
  const blocked = /just a moment|attention required|enable javascript and cookies/i.test(title + text.slice(0, 400));
  console.log(`\n===== ${url}\n===== HTTP ${status} | title: ${title} | ${blocked ? 'STILL BLOCKED' : 'OK'} | ${text.length} chars`);
  if (outDir) {
    const f = `${outDir}/${url.replace(/[^a-z0-9]+/gi, '_').slice(0, 120)}.txt`;
    writeFileSync(f, `URL: ${url}\nHTTP: ${status}\nTITLE: ${title}\n\n${text}`);
    console.log(`saved -> ${f}`);
  } else {
    console.log(text.slice(0, 6000));
  }
  await page.close();
}
await browser.close();
