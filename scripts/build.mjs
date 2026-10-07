import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fetchDownloadTotal } from '../download-counter.js';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'privacy.html', 'styles.css', 'script.js', 'download-counter.js', 'robots.txt', '_headers']) {
  await cp(file, `dist/${file}`);
}
await cp('assets', 'dist/assets', { recursive: true });

// Version CSS and JS URLs from their content so a fresh deploy does not reuse
// an older cached asset in the browser or GitHub Pages CDN.
const version = async file => createHash('sha256').update(await readFile(file)).digest('hex').slice(0, 12);
const cssVersion = await version('styles.css');
const jsVersion = await version('script.js');
const counterVersion = await version('download-counter.js');
// Refresh the API-offline fallback on every deploy. Never replace it with zero
// or a placeholder when GitHub is unavailable to the build environment.
let downloadSnapshot;
try {
  downloadSnapshot = await fetchDownloadTotal({ timeoutMs: 5000 });
} catch {
  console.log('Using the committed verified APK download snapshot.');
}
for (const page of ['index.html', 'privacy.html']) {
  const source = await readFile(`dist/${page}`, 'utf8');
  let html = source.replace('href="styles.css"', `href="styles.css?v=${cssVersion}"`)
    .replace('src="script.js"', `src="script.js?v=${jsVersion}"`)
    .replace('src="download-counter.js"', `src="download-counter.js?v=${counterVersion}"`);
  if (page === 'index.html' && downloadSnapshot) {
    html = html.replace(/data-total="\d+" data-verified-at="[^"]+"/,
      `data-total="${downloadSnapshot.total}" data-verified-at="${downloadSnapshot.verifiedAt}"`)
      .replace(/(id="download-count" aria-hidden="true">)\d+/, `$1${downloadSnapshot.total}`)
      .replace(/(id="download-count-announcement"[^>]*>)[^<]+/,
        `$1${downloadSnapshot.total} APK release-asset downloads. Last verified ${downloadSnapshot.verifiedAt}.`);
  }
  await writeFile(`dist/${page}`, html);
}

// SITE_URL may include a project path, as on GitHub Pages. Cloudflare supplies
// CF_PAGES_URL when the site is built there instead.
const suppliedUrl = process.env.SITE_URL || process.env.CF_PAGES_URL;
if (suppliedUrl) {
  const url = new URL(suppliedUrl);
  if (url.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS');
  if (url.search || url.hash) throw new Error('SITE_URL must not include a query or fragment');
  const base = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc></url>\n  <url><loc>${base}/privacy.html</loc></url>\n</urlset>\n`;
  await writeFile('dist/sitemap.xml', sitemap);
  const robots = await readFile('dist/robots.txt', 'utf8');
  await writeFile('dist/robots.txt', `${robots.trimEnd()}\nSitemap: ${base}/sitemap.xml\n`);
}
console.log('Podium Air static site ready in dist/');
