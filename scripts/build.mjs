import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fetchDownloadTotal, validSnapshot } from '../download-counter.js';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'privacy.html', 'prem.html', 'about.html', '404.html', 'styles.css', 'revamp.css', 'scroll-motion.css', 'scroll-motion.js', 'script.js', 'download-counter.js', 'intro-gate.js', 'robots.txt', '_headers', '_routes.json', '_redirects']) {
  await cp(file, `dist/${file}`);
}
await cp('google97acfcede1709f28.html', 'dist/google97acfcede1709f28.html');
await cp('assets', 'dist/assets', { recursive: true });

// Version CSS and JS URLs from their content so a fresh deploy does not reuse
// an older cached asset in the browser or GitHub Pages CDN.
const version = async file => createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 12);
const cssVersion = await version('styles.css');
const revampVersion = await version('revamp.css');
const motionCSSVersion = await version('scroll-motion.css');
const motionJSVersion = await version('scroll-motion.js');
const jsVersion = await version('script.js');
const counterVersion = await version('download-counter.js');
// Refresh the API-offline fallback on every deploy. Never replace it with zero
// or a placeholder when GitHub is unavailable to the build environment.
let downloadSnapshot;
try {
  downloadSnapshot = await fetchDownloadTotal({ timeoutMs: 5000 });
} catch {
  console.log('Using the committed verified APK download snapshot.');
  const source = await readFile('index.html', 'utf8');
  const [, total, verifiedAt] = source.match(/data-total="(\d+)" data-verified-at="([^"]+)"/);
  downloadSnapshot = { total: Number(total), verifiedAt };
  try {
    const saved = JSON.parse(await readFile('download-count.json', 'utf8'));
    if (validSnapshot(saved) && Date.parse(saved.verifiedAt) > Date.parse(downloadSnapshot.verifiedAt)) downloadSnapshot = saved;
  } catch { /* The verified HTML remains available. */ }
}
await writeFile('dist/download-count.json', JSON.stringify(downloadSnapshot));
const savedHistory = JSON.parse(await readFile('download-history.json', 'utf8'));
const byDay = new Map();
for (const point of [...savedHistory, downloadSnapshot].sort((a,b) => Date.parse(a.verifiedAt) - Date.parse(b.verifiedAt))) {
  if (Number.isSafeInteger(point.total) && point.total >= 0 && Number.isFinite(Date.parse(point.verifiedAt))) byDay.set(point.verifiedAt.slice(0, 10), point);
}
await writeFile('dist/download-history.json', JSON.stringify([...byDay.values()]));

// Social crawlers need an absolute image URL that exists on this deployment.
// A Cloudflare preview must not fetch an unmerged asset from production.
const suppliedUrl = process.env.SITE_URL || 'https://podiumair.pages.dev';
const isCloudflarePreview = Boolean(process.env.CF_PAGES && process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'main');
if (isCloudflarePreview && !process.env.CF_PAGES_URL) throw new Error('CF_PAGES_URL missing for Cloudflare preview');
const imageBaseUrl = isCloudflarePreview ? process.env.CF_PAGES_URL : suppliedUrl;
const socialImageUrl = new URL('assets/social-card-v2.png', imageBaseUrl.endsWith('/') ? imageBaseUrl : `${imageBaseUrl}/`);
if (socialImageUrl.protocol !== 'https:') throw new Error('Social image must use HTTPS');

for (const page of ['index.html', 'privacy.html', 'prem.html', 'about.html']) {
  const source = await readFile(`dist/${page}`, 'utf8');
  let html = source.replace('href="styles.css"', `href="styles.css?v=${cssVersion}"`)
    .replace('href="revamp.css"', `href="revamp.css?v=${revampVersion}"`)
    .replace('href="scroll-motion.css"', `href="scroll-motion.css?v=${motionCSSVersion}"`)
    .replace('src="scroll-motion.js"', `src="scroll-motion.js?v=${motionJSVersion}"`)
    .replace('src="script.js"', `src="script.js?v=${jsVersion}"`)
    .replace('src="download-counter.js"', `src="download-counter.js?v=${counterVersion}"`);
  if (page === 'index.html') {
    const imageTags = /(<meta (?:property="og:image"|name="twitter:image") content=")[^"]+(")/g;
    if ([...html.matchAll(imageTags)].length !== 2) throw new Error('Expected OG and Twitter image tags');
    html = html.replace(imageTags, (_, prefix, suffix) => `${prefix}${socialImageUrl.href}${suffix}`);
  }
  if (page === 'index.html' && downloadSnapshot) {
    html = html.replace(/data-total="\d+" data-verified-at="[^"]+"/,
      `data-total="${downloadSnapshot.total}" data-verified-at="${downloadSnapshot.verifiedAt}"`)
      .replace(/(id="download-count" aria-hidden="true">)\d+/, `$1${downloadSnapshot.total}`)
      .replace(/(id="download-count-announcement"[^>]*>)[^<]+/,
        `$1${downloadSnapshot.total} APK release-asset downloads. Last verified ${downloadSnapshot.verifiedAt}.`);
  }
  await writeFile(`dist/${page}`, html);
}

// Discovery URLs always identify the preferred Cloudflare site, including on
// the GitHub Pages mirror. SITE_URL still controls social image URLs above.
if (suppliedUrl) {
  const url = new URL(suppliedUrl);
  if (url.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS');
  if (url.search || url.hash) throw new Error('SITE_URL must not include a query or fragment');
  const base = 'https://podiumair.pages.dev';
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc></url>\n  <url><loc>${base}/privacy</loc></url>\n  <url><loc>${base}/prem</loc></url>\n  <url><loc>${base}/about</loc></url>\n</urlset>\n`;
  await writeFile('dist/sitemap.xml', sitemap);
  const robots = await readFile('dist/robots.txt', 'utf8');
  await writeFile('dist/robots.txt', `${robots.trimEnd()}\nSitemap: ${base}/sitemap.xml\n`);
}
console.log('Podium Air static site ready in dist/');
