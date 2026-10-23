import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequest } from '../functions/_middleware.js';
const html = readFileSync('dist/testers.html', 'utf8');
assert(html.includes('<meta name="robots" content="noindex, nofollow, noarchive">'));
assert(!html.includes('application/ld+json'), 'Hidden hub must not add search discovery schema');
assert(!readFileSync('dist/sitemap.xml', 'utf8').includes('/testers'));
assert(!/href=["'][^"']*testers/.test(readFileSync('dist/index.html','utf8')), 'No homepage link to the hub');
assert(readFileSync('dist/testers.js', 'utf8').includes("cache: 'no-store'"));
const builds = JSON.parse(readFileSync('dist/testers-builds.json', 'utf8'));
for (const key of ['android','tv','windows','macos','web']) {
  const b = builds.platforms[key];
  assert(b.name && b.status && b.version);
  assert(Array.isArray(b.assets));
  for (const a of b.assets) {
    const u = new URL(a.url);
    assert.equal(u.origin, 'https://github.com');
    assert(u.pathname.startsWith('/kaizen-flims/PodiuAirTesters/releases/download/'));
    assert.match(a.sha256, /^[a-f0-9]{64}$/);
  }
}
for (const path of ['/testers','/testers.html','/testers/','/testers-builds.json']) {
  const request = new Request(`https://podiumair.pages.dev${path}`);
  const response = await onRequest({request,next:()=>new Response('ok')});
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
}
const home = await onRequest({request:new Request('https://podiumair.pages.dev/'),next:()=>new Response('ok')});
assert.equal(home.headers.get('X-Robots-Tag'),null);
const legacy = await onRequest({request:new Request('https://podium-air-website.pages.dev/testers?from=invite'),next:()=>{throw new Error('Expected redirect')}});
assert.equal(legacy.status,301);
assert.equal(legacy.headers.get('location'),'https://podiumair.pages.dev/testers?from=invite');
console.log('PASS testers packaging, download allowlist, noindex isolation, sitemap/navigation exclusion and legacy redirect');
