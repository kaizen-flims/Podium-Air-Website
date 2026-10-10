import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('dist');
const output = resolve('download-verification');
const windowsUrl = 'https://github.com/kaizen-flims/Podium-Air-Windows-/releases/download/v0.2.0-preview.1/Podium-Air-Windows-0.2.0-x64.msi';
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
    for (const [platform, expected, minimum] of [['android', androidUrl, 3], ['windows', windowsUrl, 2]]) {
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
    assert.deepEqual(errors, []);
    await page.locator('.hero-actions').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/hero-${width}.png` });
    await page.locator('#download').scrollIntoViewIfNeeded();
    await page.locator('#download').screenshot({ path: `${output}/downloads-${width}.png` });
    await context.close();
  }
  // A later valid Android release must update APKs without replacing either Windows installer link.
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const nextAndroid = 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.2/Podium-Air-v1.0.2.apk';
  await page.route('https://api.github.com/repos/kaizen-flims/Podium-Air/releases/latest', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ draft: false, prerelease: false, tag_name: 'v1.0.2', assets: [{ name: 'Podium-Air-v1.0.2.apk', state: 'uploaded', browser_download_url: nextAndroid }] })
  }));
  await page.route('https://api.github.com/repos/kaizen-flims/Podium-Air/releases?**', route => route.abort());
  await page.goto(base, { waitUntil: 'networkidle' });
  for (const link of await page.locator('[data-platform="android"]').all()) assert.equal(await link.getAttribute('href'), nextAndroid);
  for (const link of await page.locator('[data-platform="windows"]').all()) assert.equal(await link.getAttribute('href'), windowsUrl);
  await context.close();
  console.log('PASS: Platform labels/logos/download URLs, 1440/768/390/320px button bounds, no uncaught errors and Android-update isolation.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
