import { fetchDownloadTotal, validSnapshot } from '../../download-counter.js';

function json(record, cacheControl = 'no-store', status = 200) {
  return new Response(JSON.stringify(record), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl }
  });
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const freshKey = new Request(new URL('/api/downloads?cache=verified-v1', context.request.url));
  const lastKey = new Request(new URL('/api/downloads?cache=last-verified-v1', context.request.url));
  // A two-minute shared cache reduces GitHub API calls without exposing a token.
  try {
    const cached = await cache.match(freshKey);
    if (cached) {
      const record = await cached.json();
      if (validSnapshot(record)) return json({ ...record, live: true });
    }
  } catch { /* Cache failure must not prevent a fresh GitHub request. */ }

  try {
    const record = await fetchDownloadTotal({ timeoutMs: 4500, headers: { 'User-Agent': 'Podium-Air-Website' } });
    context.waitUntil(Promise.all([
      cache.put(freshKey, json(record, 'public, max-age=120')),
      cache.put(lastKey, json(record, 'public, max-age=86400'))
    ]).catch(() => {}));
    return json({ ...record, live: true });
  } catch {
    try {
      const cached = await cache.match(lastKey);
      if (cached) {
        const record = await cached.json();
        if (validSnapshot(record)) return json({ ...record, live: false });
      }
    } catch { /* Try the verified snapshot produced by the static build. */ }
    try {
      const response = await context.env.ASSETS.fetch(new Request(new URL('/download-count.json', context.request.url)));
      const record = await response.json();
      if (response.ok && validSnapshot(record)) return json({ ...record, live: false });
    } catch { /* The browser still has its verified HTML/local fallback. */ }
    return json({ error: 'Verified snapshot unavailable' }, 'no-store', 503);
  }
}
