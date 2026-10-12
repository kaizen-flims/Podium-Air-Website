import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('dist');
const output = resolve('download-verification');
const androidUrl = 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.1/Podium-Air-v1.0.1.apk';
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    const file = resolve(root, `.${path === '/' ? '/index.html' : decodeURIComponent(path)}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    assert((await stat(file)).isFile());
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await mkdir(output, { recursive: true });
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch();
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.github.com/**', route => route.abort());
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    for (const [platform, expected, minimum] of [['android', androidUrl, 3]]) {
      const links = page.locator(`.download-link[data-platform="${platform}"]`);
      assert(await links.count() >= minimum, `${platform} buttons missing`);
      for (const link of await links.all()) {
        assert.equal(await link.getAttribute('href'), expected);
        assert.equal((await link.locator('.download-label').textContent()).trim(), `Download Podium Air for ${platform === 'android' ? 'Android' : 'Windows'}`);
        assert.equal(await link.locator('svg use').getAttribute('href'), `#platform-${platform}`);
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        assert(box && box.width > 200 && box.height >= 24);
        assert(box.x >= -1 && box.x + box.width <= width + 1, `${platform} button clipped at ${width}px`);
        assert(await link.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${platform} label overflows at ${width}px`);
      }
    }
    assert.equal(await page.locator('[data-platform="windows"]').count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page overflow at ' + width);
    await page.locator('#tab-settings').click();
    await page.waitForTimeout(250);
    assert((await page.locator('#screen-image').getAttribute('src')).includes('settings-screen'));
    await page.locator('#tab-settings').press('Home');
    assert.equal(await page.locator('#tab-home').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('.hero #download-counter').count(), 1);
    assert.equal(await page.locator('.hero .graph-area').getAttribute('fill'), 'url(#growth-tint)');
    await page.evaluate(() => document.fonts.ready);
    const glyphsFit = await page.locator('.download-counter-digit').evaluateAll(digits => digits.every(digit => {
      const style = getComputedStyle(digit);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return ctx.measureText(digit.textContent.trim()).width <= digit.getBoundingClientRect().width;
    }));
    assert(glyphsFit, 'Counter digit slot must fit the complete glyph at ' + width);
    const metricBox = await page.locator('#download-counter').boundingBox();
    const graphBox = await page.locator('.growth-figure').boundingBox();
    assert(graphBox.y >= metricBox.y + metricBox.height - 1, 'Graph must sit below full-width counter');
    assert(metricBox.width >= graphBox.width - 1, 'Counter must own the graph width');
    assert.deepEqual(errors, []);
    await page.locator('.hero-actions').scrollIntoViewIfNeeded();
    await page.locator('.hero').screenshot({ path: `${output}/hero-${width}.png` });
    await page.locator('#download').scrollIntoViewIfNeeded();
    await page.locator('#download').screenshot({ path: `${output}/downloads-${width}.png` });
    await page.locator('#downloads-count').screenshot({ path: `${output}/metrics-${width}.png` });
    if (width === 1440 || width === 390) await page.screenshot({ path: `${output}/full-${width}.png`, fullPage: true });
    await context.close();
  }
  // A later valid Android release must update APKs on every APK link.
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const nextAndroid = 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.2/Podium-Air-v1.0.2.apk';
  await page.route('https://api.github.com/repos/kaizen-flims/Podium-Air/releases/latest', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ draft: false, prerelease: false, tag_name: 'v1.0.2', assets: [{ name: 'Podium-Air-v1.0.2.apk', state: 'uploaded', browser_download_url: nextAndroid }] })
  }));
  await page.route('https://api.github.com/repos/kaizen-flims/Podium-Air/releases?**', route => route.abort());
  await page.goto(base, { waitUntil: 'networkidle' });
  for (const link of await page.locator('[data-platform="android"]').all()) assert.equal(await link.getAttribute('href'), nextAndroid);
  assert.equal(await page.locator('[data-platform="windows"]').count(), 0);
  await context.close();
  const motionContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const motionPage = await motionContext.newPage();
  await motionPage.route('https://api.github.com/**', route => route.abort());
  await motionPage.goto(base, { waitUntil: 'networkidle' });
  await motionPage.locator('.growth-figure').scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => document.querySelector('.growth-figure').classList.contains('graph-entered'));
  assert.equal(await motionPage.locator('#growth-reveal rect').evaluate(el => getComputedStyle(el).animationName), 'growth-draw');
  await motionContext.close();
  console.log('PASS: Platform labels/logos/download URLs, 1440/768/390/320px button bounds, no uncaught errors gallery navigation, hero metrics and Android updates.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
