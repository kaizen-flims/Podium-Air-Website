import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('dist');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : decodeURIComponent(path)));
    assert(file.startsWith(root + sep) && (await stat(file)).isFile());
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
await mkdir('download-verification', { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const settle = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const position = async (page, selector, top) => {
  await page.locator(selector).evaluate((element, y) => scrollTo({ top: scrollY + element.getBoundingClientRect().top - y, behavior: 'instant' }), top);
  await settle(page);
};
try {
  for (const fallback of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await context.route('https://**', route => route.abort());
    if (fallback) await context.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = (...args) => args[0] === 'animation-timeline: view()' ? false : supports(...args);
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const requested = [];
    page.on('request', request => requested.push(request.url()));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForSelector('#intro-root', { state: 'detached', timeout: 6000 });
    if (fallback) await page.addStyleTag({ content: '.motion-word, .motion-block, .evolution-air, .evolution-track > span { animation: none !important; }' });
    assert.equal(await page.locator('.hero .motion-word, .intro .motion-word').count(), 0, 'Protected regions must not receive motion');
    assert(!requested.some(url => /vinyl-disc|account-screen|settings-screen/.test(url)), 'Far-offscreen artwork and inactive tabs must not consume initial bandwidth');
    assert(!requested.some(url => /update-screen\.jpg/.test(url)), 'Gallery must use the compressed responsive screenshot');
    assert(!requested.some(url => url.includes('barlow-condensed')), 'Unused font must not be preloaded');
    const heading = page.locator('#statement-title .motion-word').first();
    await position(page, '#statement-title', 826);
    const initial = Number(await heading.evaluate(word => getComputedStyle(word).opacity));
    await position(page, '#statement-title', 350);
    const entered = Number(await heading.evaluate(word => getComputedStyle(word).opacity));
    await position(page, '#statement-title', 826);
    const reversed = Number(await heading.evaluate(word => getComputedStyle(word).opacity));
    assert(entered > initial + .2 && reversed < entered - .2, 'Text must follow scrolling in both directions');
    await position(page, '.journey-evolution', 800);
    const air = page.locator('.evolution-air');
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.evolution-air')).opacity) < .3);
    const start = Number(await air.evaluate(element => getComputedStyle(element).opacity));
    await position(page, '.journey-evolution', -400);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.evolution-air')).opacity) > .9);
    const finish = Number(await air.evaluate(element => getComputedStyle(element).opacity));
    assert(finish > start + .5, 'Podium → Podium Air must respond to scroll progress');
    await position(page, '.journey-evolution', 800);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.evolution-air')).opacity) < .3);
    assert(Number(await air.evaluate(element => getComputedStyle(element).opacity)) < finish - .5, 'Story must reverse on upward scroll');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);
    assert.equal(await heading.evaluate(word => getComputedStyle(word).opacity), '1');
    assert.equal(await air.evaluate(element => getComputedStyle(element).opacity), '1');
    assert.equal(await page.locator('.evolution-stage').evaluate(element => getComputedStyle(element).position), 'static');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await position(page, '.journey-evolution', 180);
    await page.screenshot({ path: `download-verification/story-${fallback ? 'fallback' : 'native'}-390.png` });
    assert.deepEqual(errors, []);
    console.log(`PASS ${fallback ? 'JS fallback' : 'native timeline'}: reversible headings/story, initial lazy loading, live reduced-motion toggle, no page errors`);
    await context.close();
  }
  for (const width of [320, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    await context.route('https://**', route => route.abort());
    const page = await context.newPage();
    await page.goto(base);
    await position(page, '.journey-evolution', 180);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}px`);
    await page.screenshot({ path: `download-verification/story-reduced-${width}.png` });
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base);
  assert(await page.locator('#statement-title').isVisible());
  assert.equal(await page.locator('.download-link').count(), 3);
  assert.equal(await page.locator('.evolution-air').evaluate(element => getComputedStyle(element).opacity), '1', 'No-JS story must remain fully visible');
  await context.close();
  console.log('PASS: responsive widths 320/768/1024/1440; no-JS text, story and download access');
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
