import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'privacy.html', 'styles.css', 'script.js', 'robots.txt', '_headers']) {
  await cp(file, `dist/${file}`);
}
await cp('assets', 'dist/assets', { recursive: true });

// Cloudflare supplies the actual deployment URL. SITE_URL can override it after
// a permanent custom address is confirmed; the source never guesses a domain.
const suppliedUrl = process.env.SITE_URL || process.env.CF_PAGES_URL;
if (suppliedUrl) {
  const url = new URL(suppliedUrl);
  if (url.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS');
  const origin = url.origin;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc></url>\n  <url><loc>${origin}/privacy.html</loc></url>\n</urlset>\n`;
  await writeFile('dist/sitemap.xml', sitemap);
  const robots = await readFile('dist/robots.txt', 'utf8');
  await writeFile('dist/robots.txt', `${robots.trimEnd()}\nSitemap: ${origin}/sitemap.xml\n`);
}
console.log('Podium Air static site ready in dist/');
