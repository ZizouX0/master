// Minimal CDP driver over Node 22's global WebSocket. No Playwright on this box.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const SHOTS = '/home/user/master/app/verification-shots';
mkdirSync(SHOTS, { recursive: true });

export async function launch(profileDir = '/tmp/cdp-profile') {
  rmSync(profileDir, { recursive: true, force: true });
  mkdirSync(profileDir, { recursive: true });
  const port = 9222 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--allow-file-access-from-files',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stderr.on('data', () => {});

  let wsUrl = null;
  for (let i = 0; i < 100; i++) {
    await sleep(200);
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      const j = await r.json();
      wsUrl = j.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }
  if (!wsUrl) throw new Error('chrome did not come up');
  return { proc, port, wsUrl };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Session {
  constructor(ws, sessionId) {
    this.ws = ws; this.sessionId = sessionId; this.nextId = 1;
    this.pending = new Map(); this.consoleErrors = []; this.pageErrors = [];
    this.allConsole = [];
  }
  send(method, params = {}) {
    const id = this.nextId++;
    const msg = { id, method, params };
    if (this.sessionId) msg.sessionId = this.sessionId;
    this.ws.send(JSON.stringify(msg));
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); }
      }, 30000);
    });
  }
}

export async function newBrowser(port, wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  const browser = new Session(ws, null);
  const targets = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id !== undefined) {
      const target = m.sessionId ? targets.get(m.sessionId) : browser;
      const p = target?.pending.get(m.id);
      if (p) { target.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
      return;
    }
    const s = m.sessionId ? targets.get(m.sessionId) : null;
    if (!s) return;
    if (m.method === 'Runtime.consoleAPICalled') {
      const text = (m.params.args || []).map(argToStr).join(' ');
      s.allConsole.push({ type: m.params.type, text });
      if (m.params.type === 'error' || m.params.type === 'assert') s.consoleErrors.push(text);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      s.pageErrors.push(d.exception?.description || d.text || JSON.stringify(d));
    }
    if (m.method === 'Log.entryAdded') {
      const e = m.params.entry;
      s.allConsole.push({ type: 'log:' + e.level, text: `${e.source} ${e.level}: ${e.text} ${e.url || ''}` });
      if (e.level === 'error') s.consoleErrors.push(`[${e.source}] ${e.text} ${e.url || ''}`);
    }
  };
  browser.targets = targets;
  return browser;
}

function argToStr(a) {
  if (a.value !== undefined) return typeof a.value === 'string' ? a.value : JSON.stringify(a.value);
  if (a.description) return a.description;
  if (a.preview) return JSON.stringify(a.preview);
  return a.type;
}

export async function newPage(browser, { width = 390, height = 844 } = {}) {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const page = new Session(browser.ws, sessionId);
  browser.targets.set(sessionId, page);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Log.enable');
  await page.send('Network.enable');
  // --window-size is clamped on this box; device metrics override gives a true 390x844.
  await page.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: true,
    screenWidth: width, screenHeight: height,
  });
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  page.targetId = targetId;
  return page;
}

export async function goto(page, url, waitMs = 1200) {
  await page.send('Page.navigate', { url });
  await sleep(waitMs);
  await waitForIdle(page);
}

export async function waitForIdle(page, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const r = await evalJs(page, `document.readyState === 'complete' && !!document.querySelector('#app')?.children.length`);
    if (r === true) return true;
    await sleep(250);
  }
  return false;
}

export async function evalJs(page, expr) {
  const r = await page.send('Runtime.evaluate', {
    expression: `(function(){ ${expr.trim().startsWith('return') ? expr : 'return (' + expr + ')'} })()`,
    returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}

export async function text(page) {
  return evalJs(page, `document.body.innerText`);
}

export async function shot(page, name, fullPage = false) {
  const params = { format: 'png' };
  if (fullPage) {
    const m = await page.send('Page.getLayoutMetrics');
    const h = Math.min(Math.ceil(m.contentSize.height), 16000);
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: h, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: h,
    });
    await sleep(400);
  }
  const { data } = await page.send('Page.captureScreenshot', params);
  writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data, 'base64'));
  if (fullPage) {
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844,
    });
    await sleep(200);
  }
  return `${name}.png`;
}

export async function click(page, selectorOrText, { byText = false, nth = 0 } = {}) {
  const expr = byText
    ? `(() => { const els=[...document.querySelectorAll('button,a,label,[role=button],summary,input')].filter(e=>(e.innerText||e.value||'').trim().toLowerCase().includes(${JSON.stringify(String(selectorOrText).toLowerCase())})); const e=els[${nth}]; if(!e) return null; const r=e.getBoundingClientRect(); e.scrollIntoView({block:'center'}); const r2=e.getBoundingClientRect(); return {x:r2.x+r2.width/2,y:r2.y+r2.height/2,tag:e.tagName,txt:(e.innerText||e.value||'').slice(0,60)}; })()`
    : `(() => { const e=document.querySelectorAll(${JSON.stringify(selectorOrText)})[${nth}]; if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2,tag:e.tagName,txt:(e.innerText||'').slice(0,60)}; })()`;
  const r = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  const pos = r.result.value;
  if (!pos) return null;
  for (const type of ['mousePressed', 'mouseReleased']) {
    await page.send('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
  }
  await sleep(500);
  return pos;
}

export async function typeInto(page, selector, value) {
  await evalJs(page, `(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e) return false; e.focus(); return true; })()`);
  // set value via native setter + input event (Preact listens to input)
  await evalJs(page, `(() => {
    const e = document.querySelector(${JSON.stringify(selector)});
    if (!e) return false;
    const proto = Object.getPrototypeOf(e);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(e, ${JSON.stringify(value)});
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await sleep(700);
  return true;
}

export async function overflow(page) {
  return evalJs(page, `({
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
    offenders: [...document.querySelectorAll('*')]
      .filter(e => e.getBoundingClientRect().right > 391.5)
      .slice(0,8)
      .map(e => e.tagName + '.' + (e.className && e.className.baseVal === undefined ? String(e.className).slice(0,40) : '') + ' right=' + Math.round(e.getBoundingClientRect().right))
  })`);
}

export function report(page) {
  return { consoleErrors: page.consoleErrors, pageErrors: page.pageErrors };
}
