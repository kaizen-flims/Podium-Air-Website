import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';
import { removals, removeApprovedV1Rules } from './v1-css-cleanup.mjs';

const baseline = execFileSync('git', ['show', '3091b1d61673cb03abda63982f34306e1dad3824:styles.css'], { encoding: 'utf8' });
const cleaned = await readFile('styles.css', 'utf8');
assert.equal(cleaned, removeApprovedV1Rules(baseline));
const retired = /(?<![\w-])(?:hero-copy|hero-lead|hero-actions|hero-art|record-stage|hero-phone|button-red|mix-visual|scroll-reveal|phone-settle)(?![\w-])/;
const runtimeFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n')
  .filter(path => /\.(?:html|css|js|jsx|ts|tsx)$/.test(path) && !/^(?:scripts|tests)\//.test(path));
for (const path of runtimeFiles) assert(!retired.test(await readFile(path, 'utf8')), `Retired name referenced in ${path}`);

// The same built page is tested with both sheets, eliminating network/build-data differences.
const root = resolve(process.argv[2] || 'dist');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://local').pathname;
    if (path === '/api/downloads') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ total: 1200, verifiedAt: '2026-10-19T00:00:00Z', live: true })); return;
    }
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    assert(file.startsWith(root + sep));
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let comparisons = 0;
try {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' });
    await context.route('https://**', route => route.abort());
    const page = await context.newPage();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/#top', '/privacy.html']) {
        await page.goto(`http://127.0.0.1:${server.address().port}${path}`);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(({ baseline, cleaned, rules }) => {
          // Freeze only in this test. Runtime animation definitions remain byte protected.
          const freeze = document.createElement('style');
          freeze.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}';
          document.head.append(freeze);
          const original = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link => /\/styles\.css(?:\?|$)/.test(link.href));
          if (!original) throw Error('Missing shared stylesheet');
          const sheet = document.createElement('style');
          original.replaceWith(sheet);
          const snapshot = () => [...document.querySelectorAll('*')].flatMap(element => {
            const rect = element.getBoundingClientRect();
            const geometry = [rect.x, rect.y, rect.width, rect.height].map(n => Math.round(n * 1000) / 1000);
            return [JSON.stringify(geometry), ...[null, '::before', '::after'].map(pseudo => {
              const style = getComputedStyle(element, pseudo);
              return [...style].map(key => key + ':' + style.getPropertyValue(key)).join(';');
            })];
          });
          let count = 0;
          const compare = label => {
            sheet.textContent = baseline;
            for (const rule of rules) {
              if (rule.selector.startsWith('@')) continue;
              const selector = rule.selector.replace(/::?(?:before|after)\b/g, '');
              if (document.querySelector(selector)) throw Error('Retired selector matches: ' + rule.selector);
            }
            const before = snapshot();
            sheet.textContent = cleaned;
            const after = snapshot();
            const mismatch = before.findIndex((value, i) => value !== after[i]);
            if (before.length !== after.length || mismatch !== -1) throw Error(label + ': computed style/layout mismatch at ' + mismatch + '\n' + before[mismatch] + '\n' + after[mismatch]);
            count++;
          };
          for (const theme of ['dark', 'light']) {
            document.documentElement.dataset.theme = theme;
            compare(theme + ' top');
            scrollTo(0, document.body.scrollHeight / 2);
            compare(theme + ' scrolled');
            document.querySelectorAll('[role="tab"]').forEach(tab => { tab.click(); compare(theme + ' gallery tab'); });
            document.querySelector('.vinyl-toggle')?.click();
            compare(theme + ' vinyl');
            document.querySelector('a,button')?.focus();
            compare(theme + ' focus');
          }
          return count;
        }, { baseline, cleaned, rules: removals.rules });
        comparisons += result;
      }
    }
    await context.close();
  }
  console.log(`PASS: ${comparisons} before/after comparisons; every element and pseudo-element has identical computed styles and geometry at 320/390/768/1024/1440px, both themes, home/privacy, JS/no-JS, scroll, tabs, vinyl and focus states. Retired selectors match no elements.`);
} finally { await browser.close(); await new Promise(done => server.close(done)); }
