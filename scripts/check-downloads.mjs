import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('dist');
const output = resolve('download-verification');
const androidUrl = 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.2/Podium-Air-v1.0.2.apk';
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
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.github.com/**', route => route.abort());
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#intro-root canvas').count(), 0, 'Reduced motion must skip the shader');
    assert(await page.locator('#hero-title').isVisible());
    assert.equal(await page.locator('#hero-download a').getAttribute('href'), '#download');
    assert.equal(await page.locator('#hero-download a').count(), 1);
    assert.equal(await page.locator('#hero-motion canvas').getAttribute('data-animating'), 'false');
    assert.equal(await page.locator('#hero-motion canvas').evaluate(el => getComputedStyle(el).position), 'absolute');
    const heroBox = await page.locator('.shader-hero').boundingBox();
    assert(heroBox.height >= 960 - (await page.locator('.site-header').boundingBox()).height - 2, 'Hero must fill the first screen');
    for (const [platform, expected, minimum] of [['android', androidUrl, 1], ['windows', 'https://github.com/kaizen-flims/Podium-Air/releases/download/desktop-v1.0.1-beta1/Podium-Air-1.0.1-beta1-windows-x64-setup.exe', 1], ['macos', 'https://github.com/kaizen-flims/Podium-Air/releases/download/desktop-v1.0.1-beta1/Podium-Air-1.0.1-beta1-macos-arm64.dmg', 1]]) {
      const links = page.locator(`.download-link[data-platform="${platform}"]`);
      assert(await links.count() >= minimum, `${platform} buttons missing`);
      for (const link of await links.all()) {
        assert.equal(await link.getAttribute('href'), expected);
        assert.equal((await link.locator('.download-label').textContent()).trim(), `Download Podium Air for ${({android: 'Android', windows: 'Windows', macos: 'macOS'})[platform]}`);
        assert.equal(await link.locator('svg use').getAttribute('href'), `#platform-${platform}`);
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        assert(box && box.width > 200 && box.height >= 24);
        assert(box.x >= -1 && box.x + box.width <= width + 1, `${platform} button clipped at ${width}px`);
        assert(await link.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${platform} label overflows at ${width}px`);
      }
    }
    assert.equal(await page.locator('[data-platform="windows"]').count(), 1);
    for (const link of await page.locator('.intel-download').all()) assert.equal(await link.getAttribute('href'), 'https://github.com/kaizen-flims/Podium-Air/releases/download/desktop-v1.0.1-beta1/Podium-Air-1.0.1-beta1-macos-x64.dmg');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page overflow at ' + width);
    await page.locator('#tab-settings').click();
    await page.waitForTimeout(250);
    assert((await page.locator('#screen-image').getAttribute('src')).includes('settings-screen'));
    await page.locator('#tab-settings').press('Home');
    assert.equal(await page.locator('#tab-home').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('.milestone #download-counter').count(), 1);
    assert.equal(await page.locator('.milestone .graph-area').getAttribute('fill'), 'url(#growth-tint)');
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
    // Theme switching and gallery navigation remain usable at every viewport.
    await page.locator('.theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: `${output}/dark-${width}.png`, fullPage: true });
    await page.locator('.theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    for (const link of await page.locator('a[href^="#"]').all()) {
      const href = await link.getAttribute('href');
      assert(await page.locator(href).count() > 0, `Missing anchor ${href}`);
    }
    const failedImages = await page.locator('img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src));
    assert.deepEqual(failedImages, [], 'Images must load');
    assert.deepEqual(errors, []);
    await page.locator('#top').scrollIntoViewIfNeeded();
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
  const nextAndroid = 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.3/Podium-Air-v1.0.3.apk';
  await page.route('https://api.github.com/repos/kaizen-flims/Podium-Air/releases/latest', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ draft: false, prerelease: false, tag_name: 'v1.0.3', assets: [{ name: 'Podium-Air-v1.0.3.apk', state: 'uploaded', browser_download_url: nextAndroid }] })
  }));
  await page.route('https://api.github.com/repos/kaizen-flims/Podium-Air/releases?**', route => route.abort());
  await page.goto(base, { waitUntil: 'networkidle' });
  for (const link of await page.locator('[data-platform="android"]').all()) assert.equal(await link.getAttribute('href'), nextAndroid);
  assert.equal(await page.locator('[data-platform="windows"]').count(), 1);
    for (const link of await page.locator('.intel-download').all()) assert.equal(await link.getAttribute('href'), 'https://github.com/kaizen-flims/Podium-Air/releases/download/desktop-v1.0.1-beta1/Podium-Air-1.0.1-beta1-macos-x64.dmg');
  await context.close();
  const motionContext = await browser.newContext({ viewport: { width: 390, height: 900 }, recordVideo: { dir: output, size: { width: 390, height: 900 } } });
  const motionPage = await motionContext.newPage();
  await motionPage.route('https://api.github.com/**', route => route.abort());
  await motionPage.goto(base, { waitUntil: 'networkidle' });
  await motionPage.waitForSelector('#intro-root canvas', { state: 'attached' });
  assert.equal((await motionPage.locator('#intro-root').textContent()).trim(), 'Podium Air');
  assert.equal(await motionPage.locator('#intro-root img, #intro-root button, #intro-root a').count(), 0);
  assert.equal(await motionPage.locator('.intro-air').evaluate(el => getComputedStyle(el).color), 'rgb(241, 40, 70)');
  await motionPage.screenshot({ path: `${output}/intro-390.png` });
  const firstFrame = await motionPage.locator('#intro-root canvas').screenshot();
  await motionPage.waitForTimeout(180);
  const secondFrame = await motionPage.locator('#intro-root canvas').screenshot();
  assert(!firstFrame.equals(secondFrame), 'Shader must animate, not display a still frame');
  await motionPage.waitForSelector('#intro-root', { state: 'detached', timeout: 6000 });
  assert(await motionPage.locator('#hero-title').isVisible());
  await motionPage.keyboard.press('Tab');
  assert.equal(await motionPage.locator(':focus').innerText(), 'Skip to content');
  await motionPage.screenshot({ path: `${output}/intro-finished-390.png` });
  const wave = motionPage.locator('#hero-motion canvas');
  await motionPage.waitForFunction(() => document.querySelector('#hero-motion canvas')?.dataset.animating === 'true');
  await motionPage.screenshot({ path: `${output}/wave-hero-390.png` });
  await motionPage.getByRole('button', { name: 'Pause animation' }).click();
  assert.equal(await wave.getAttribute('data-animating'), 'false');
  await motionPage.getByRole('button', { name: 'Play animation' }).click();
  assert.equal(await wave.getAttribute('data-animating'), 'true');
  await motionPage.locator('#hero-download a').click();
  await motionPage.waitForFunction(() => location.hash === '#download');
  await motionPage.waitForFunction(() => document.querySelector('#hero-motion canvas')?.dataset.animating === 'false');
  await motionPage.locator('.growth-figure').scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => document.querySelector('.growth-figure').classList.contains('graph-entered'));
  assert.equal(await motionPage.locator('#growth-reveal rect').evaluate(el => getComputedStyle(el).animationName), 'growth-draw');
  await motionPage.locator('#journey').scrollIntoViewIfNeeded();
  await motionPage.locator('.story-chapter').first().scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => !document.querySelector('.story-chapter').classList.contains('is-pending'));
  await motionContext.close();
  await motionPage.video().saveAs(`${output}/intro-playback-390.webm`);
  // The intro cannot trap visitors when GPU support or the bundle is unavailable.
  for (const failure of ['webgl', 'bundle', 'anchor']) {
    const fallback = await browser.newContext();
    const fallbackPage = await fallback.newPage();
    await fallbackPage.route('https://api.github.com/**', route => route.abort());
    if (failure === 'webgl') await fallbackPage.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return type.startsWith('webgl') ? null : original.call(this, type, ...args);
      };
    });
    if (failure === 'bundle') await fallbackPage.route('**/intro/intro.js', route => route.abort());
    await fallbackPage.goto(base + (failure === 'anchor' ? '/#download' : '/'));
    await fallbackPage.waitForFunction(() => !document.documentElement.classList.contains('intro-active'), null, { timeout: 6000 });
    assert(await fallbackPage.locator('#hero-title').isVisible(), failure + ' must reveal website');
    assert.equal(await fallbackPage.locator('#intro-root canvas').count(), 0);
    await fallback.close();
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await noJS.newPage();
  await staticPage.goto(base);
  assert.equal(await staticPage.locator('.download-link').count(), 3);
  assert(await staticPage.locator('#download-count').isVisible());
  assert(await staticPage.locator('#journey-title').isVisible());
  await noJS.close();
  console.log('PASS: Platform labels/logos/download URLs, 1440/768/390/320px button bounds, no uncaught errors gallery navigation, milestone metrics and Android updates.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
