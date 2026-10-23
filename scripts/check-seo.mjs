import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const origin = 'https://podiumair.pages.dev';
const pages = new Map([['index.html', '/'], ['privacy.html', '/privacy'], ['prem.html', '/prem'], ['about.html', '/about']]);
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.deepEqual(locs.sort(), [...pages.values()].map(path => origin + path).sort(), 'Sitemap must contain only canonical indexable pages');
const schema = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
for (const [file, path] of pages) {
  const html = readFileSync(`dist/${file}`, 'utf8');
  assert.deepEqual([...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m => m[1]), [origin + path], `Wrong canonical: ${file}`);
  assert(!/<meta name="robots" content="[^"]*noindex/i.test(html), `Indexable page blocked: ${file}`);
  assert(/<title>[^<]+<\/title>/.test(html), `Missing title: ${file}`);
  assert(/<meta name="description" content="[^"]+"/.test(html), `Missing description: ${file}`);
  schema(html);
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (/^(?:https?:|#|\.\/)/.test(href)) continue;
    assert(existsSync(`dist/${href.split(/[?#]/)[0]}`), `Broken local link in ${file}: ${href}`);
  }
}
const home = readFileSync('index.html', 'utf8');
assert.equal(home, execFileSync('git', ['show', 'd01008bb4da3e1b884644724e28d5216ee212d7f:index.html']).toString().replaceAll('podium-air-website.pages.dev', 'podiumair.pages.dev'), 'V2 homepage must remain byte-identical');
const graph = schema(home)[0]['@graph'];
const profile = schema(readFileSync('prem.html', 'utf8'))[0];
assert.deepEqual(graph.find(n => n['@type'] === 'Person'), profile.mainEntity, 'Creator identity must agree between pages');
assert.equal(graph.find(n => n['@type'] === 'WebSite').name, 'Podium Air');
assert.equal(graph.find(n => n['@type'] === 'SoftwareApplication').sameAs, 'https://github.com/kaizen-flims/Podium-Air');
const about = readFileSync('dist/about.html', 'utf8');
for (const href of [origin + '/', 'https://github.com/kaizen-flims/Podium-Air', 'https://github.com/kaizen-flims/Podium-Air/releases', 'prem.html']) assert(about.includes(`href="${href}"`), `Missing official app reference: ${href}`);
const missing = readFileSync('dist/404.html', 'utf8');
assert(missing.includes('<meta name="robots" content="noindex">'), '404 must not be indexable');
assert(!missing.includes('rel="canonical"'), '404 must not canonicalize missing URLs to the homepage');
assert(!missing.includes('application/ld+json'), '404 must not describe a missing URL as the app');
assert(missing.includes(`href="${origin}/"`), '404 recovery must work from nested missing URLs');
assert.equal(readFileSync('dist/robots.txt', 'utf8'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log('PASS: canonical/sitemap alignment, profile/app identity, official links, unchanged V2 homepage, and custom 404 packaging. Cloudflare HTTP status must still be verified after deployment.');
