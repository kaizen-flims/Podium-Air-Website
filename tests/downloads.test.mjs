import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchDownloadTotal, sumApkDownloads, loadLiveTotal } from '../download-counter.js';
import { onRequestGet } from '../functions/api/downloads.js';
const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
afterEach(() => { globalThis.fetch = originalFetch; globalThis.caches = originalCaches; });
const record = (total, age = 0) => ({ total, verifiedAt: new Date(Date.now() - age).toISOString() });
const release = (count, id = 1) => ({ tag_name: 'v1.0.1', assets: [{ id, name: 'Podium-Air-v1.0.1.apk', state: 'uploaded', download_count: count, browser_download_url: 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.1/Podium-Air-v1.0.1.apk' }] });
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
function context(build, token) {
  const waits = [];
  const entries = new Map();
  globalThis.caches = { default: {
    async match(key) { return entries.get(key.url)?.clone(); },
    async put(key, value) { entries.set(key.url, value); }
  } };
  return { request: new Request('https://example.com/api/downloads?refresh=random'), env: { GITHUB_TOKEN: token, ASSETS: { fetch: async () => response(build, build ? 200 : 404) } }, waitUntil(p) { waits.push(p); }, waits, entries };
}
test('counts uploaded APKs across releases, excludes drafts/other files and duplicates', () => {
  const a = release(12), b = release(8, 2);
  b.assets.push({ ...b.assets[0], id: 3, name: 'installer.exe', download_count: 500 });
  assert.equal(sumApkDownloads([a, b, a, { ...release(99, 4), draft: true }]), 20);
  assert.throws(() => sumApkDownloads([release(-1)]));
  assert.throws(() => sumApkDownloads([]));
});
test('fetch paginates, disables HTTP caching and passes server authorization', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return response(calls.length === 1 ? Array.from({ length: 100 }, (_, i) => release(1, i)) : [release(7, 101)]);
  };
  assert.equal((await fetchDownloadTotal({ headers: { Authorization: 'Bearer test-only' } })).total, 107);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-only');
});
test('rate limit is an error, never a fabricated zero', async () => {
  globalThis.fetch = async () => response({ message: 'API rate limit exceeded' }, 403);
  await assert.rejects(fetchDownloadTotal(), /rate limited/);
});
test('live API uses canonical short edge cache and no browser/CDN caching', async () => {
  const ctx = context(record(1, 60000), 'test-only');
  let calls = 0;
  globalThis.fetch = async (_, opts) => { calls++; assert.equal(opts.headers.Authorization, 'Bearer test-only'); return response([release(22)]); };
  const first = await onRequestGet(ctx);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  assert.equal(first.headers.get('cdn-cache-control'), 'no-store');
  assert.deepEqual(await first.json(), { total: 22, verifiedAt: (await ctx.entries.get('https://example.com/api/downloads?cache=verified-v2').clone().json()).verifiedAt, live: true, source: 'github-api', upstream: 'ok' });
  await Promise.all(ctx.waits);
  assert.equal(ctx.entries.get('https://example.com/api/downloads?cache=verified-v2').headers.get('cache-control'), 'public, max-age=60');
  assert.equal((await (await onRequestGet(ctx)).json()).live, true);
  assert.equal(calls, 1);
});
test('rate limited edge selects freshest authenticated observation over old build/cache', async () => {
  const snapshot = record(33, 1000);
  const ctx = context(record(2, 60000));
  ctx.entries.set('https://example.com/api/downloads?cache=last-verified-v2', response(record(5, 30000)));
  globalThis.fetch = async url => String(url.url || url).includes('raw.githubusercontent') ? response(snapshot) : response({ message: 'rate limit' }, 403);
  const result = await (await onRequestGet(ctx)).json();
  assert.equal(result.total, 33);
  assert.equal(result.verifiedAt, snapshot.verifiedAt);
  assert.equal(result.live, false);
  assert.equal(result.source, 'github-actions');
  assert.equal(result.upstream, 'rate-limited');
});
test('newer build wins over old edge cache; total outage returns 503 without a count', async () => {
  globalThis.fetch = async () => { throw new Error('offline'); };
  const ctx = context(record(44));
  ctx.entries.set('https://example.com/api/downloads?cache=last-verified-v2', response(record(5, 30000)));
  assert.equal((await (await onRequestGet(ctx)).json()).total, 44);
  const unavailable = await onRequestGet(context(null));
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).total, undefined);
});
test('cache failures do not stop fresh GitHub data', async () => {
  const ctx = context(null);
  globalThis.caches.default.match = async () => { throw new Error('cache unavailable'); };
  globalThis.caches.default.put = async () => { throw new Error('cache unavailable'); };
  globalThis.fetch = async () => response([release(55)]);
  assert.equal((await (await onRequestGet(ctx)).json()).total, 55);
  await Promise.all(ctx.waits);
});
test('browser retries GitHub on successful-but-stale endpoint response', async () => {
  globalThis.fetch = async url => String(url).startsWith('api/downloads') ? response({ ...record(3, 30000), live: false }) : response([release(66)]);
  assert.equal((await loadLiveTotal()).record.total, 66);
});
test('browser retains exact fallback timestamp if both upstreams fail', async () => {
  const saved = { ...record(77, 60000), live: false };
  globalThis.fetch = async url => String(url).startsWith('api/downloads') ? response(saved) : response({ message: 'rate limit' }, 403);
  assert.deepEqual(await loadLiveTotal(), { record: saved, live: false });
});
