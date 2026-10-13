import { fetchDownloadTotal, validSnapshot } from '../../download-counter.js';

const SNAPSHOT_URL = 'https://raw.githubusercontent.com/kaizen-flims/Podium-Air-Website/download-data/download-count.json';
function json(record, ttl = 0, status = 200) {
  return new Response(JSON.stringify(record), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': ttl ? `public, max-age=${ttl}` : 'no-store',
      ...(!ttl && { 'CDN-Cache-Control': 'no-store', 'Cloudflare-CDN-Cache-Control': 'no-store' })
    }
  });
}

export async function onRequestGet(context) {
  const cache = globalThis.caches?.default;
  // New namespace invalidates the old frozen fallback. Never key the shared
  // cache by the browser's refresh query: all visitors share the same quota.
  const freshKey = new Request(new URL('/api/downloads?cache=verified-v2', context.request.url));
  const lastKey = new Request(new URL('/api/downloads?cache=last-verified-v2', context.request.url));
  try {
    const cached = await cache?.match(freshKey);
    if (cached) {
      const record = await cached.json();
      if (validSnapshot(record) && typeof record.live === 'boolean') return json(record);
    }
  } catch { /* A cache outage must not stop upstream reads. */ }

  const candidates = [];
  const readSnapshot = async (url, asset = false) => {
    try {
      const request = new Request(url);
      const response = asset ? await context.env.ASSETS.fetch(request) : await fetch(request, {
        cache: 'no-store', signal: AbortSignal.timeout(4000), cf: { cacheTtl: 0, cacheEverything: false }
      });
      const record = await response.json();
      if (response.ok && validSnapshot(record)) candidates.push({ ...record, live: false, source: asset ? 'build' : 'github-actions' });
    } catch { /* Continue to another independently verified source. */ }
  };
  let upstream = 'ok';
  try {
    const token = context.env.GITHUB_TOKEN;
    const record = await fetchDownloadTotal({ timeoutMs: 4500, headers: {
      'User-Agent': 'Podium-Air-Website',
      ...(token && { Authorization: `Bearer ${token}` })
    } });
    candidates.push({ ...record, live: true, source: 'github-api' });
  } catch (error) {
    // Controlled diagnostics contain no upstream response text or credentials.
    upstream = /rate limited/.test(error?.message) ? 'rate-limited' : 'unavailable';
    await readSnapshot(`${SNAPSHOT_URL}?refresh=${Date.now()}`);
    try {
      const cached = await cache?.match(lastKey);
      if (cached) {
        const record = await cached.json();
        if (validSnapshot(record)) candidates.push({ ...record, live: false, source: 'last-verified' });
      }
    } catch { /* Try the verified static build. */ }
    await readSnapshot(new URL('/download-count.json', context.request.url), true);
  }
  candidates.sort((a, b) => Date.parse(b.verifiedAt) - Date.parse(a.verifiedAt));
  if (!candidates.length) return json({ error: 'Verified snapshot unavailable', upstream }, 0, 503);
  const record = { ...candidates[0], upstream };
  // Only verified data enters the cache; fallbacks retain their original date.
  if (cache) context.waitUntil(Promise.all([
    cache.put(freshKey, json(record, record.live ? 60 : 30)),
    cache.put(lastKey, json(record, 86400))
  ]).catch(() => {}));
  return json(record);
}
