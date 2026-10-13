import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = resolve('dist');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
let snapshot = { total: 1200, verifiedAt: new Date().toISOString(), live: true };
let failure = false, requests = 0;
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://local').pathname;
  if (path === '/api/downloads') { requests++; res.writeHead(failure ? 503 : 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(snapshot)); return; }
  try { res.setHeader('Content-Type', mime[extname(path === '/' ? 'index.html' : path)] || 'application/octet-stream'); res.end(await readFile(resolve(root, path === '/' ? 'index.html' : '.' + path))); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('https://api.github.com/**', route => route.abort());
  await context.route('https://raw.githubusercontent.com/**', route => route.abort());
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const count = () => page.locator('#download-count').textContent();
  await page.waitForFunction(() => document.querySelector('#download-counter').dataset.total === '1200');
  const prior = requests;
  snapshot = { total: 1210, verifiedAt: new Date(Date.now() + 1000).toISOString(), live: true };
  await page.clock.fastForward(61000);
  await page.waitForFunction(() => document.querySelector('#download-counter').dataset.total === '1210');
  assert(requests > prior, 'Interval must refresh an already-open page');
  assert.equal(await count(), '1210');
  assert((await page.locator('#graph-desc').textContent()).includes('1210 APK downloads'));
  assert((await page.locator('.graph-value').allTextContents()).includes('1,210'));
  const fresh = snapshot;
  snapshot = { total: 10, verifiedAt: new Date(Date.now() - 60000).toISOString(), live: false };
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForTimeout(200);
  assert.equal(await count(), '1210', 'Stale response must not roll back browser');
  failure = true;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => document.querySelector('#download-count-label').textContent === 'LAST VERIFIED');
  assert.equal(await count(), '1210');
  failure = false;
  snapshot = { ...fresh, total: 1220, verifiedAt: new Date(Date.now() + 2000).toISOString() };
  const second = await context.newPage();
  await second.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => document.querySelector('#download-counter').dataset.total === '1220');
  assert((await page.locator('#graph-desc').textContent()).includes('1220 APK downloads'), 'Storage update must also refresh graph');
  await second.evaluate(() => localStorage.setItem('podium-air:verified-apk-downloads:v1', '{broken'));
  await page.waitForTimeout(100);
  assert.equal(await count(), '1220');
  assert.deepEqual(errors, []);
  console.log('PASS: periodic updates, counter/graph agreement, stale rejection, outage retention, recovery, cross-tab storage and malformed storage.');
  await context.close();
} finally { await browser.close(); await new Promise(done => server.close(done)); }
