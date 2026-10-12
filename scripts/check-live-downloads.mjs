import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const origin = 'https://podium-air-website.pages.dev';
let last;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const response = await fetch(origin + '/?renovation-check=' + Date.now(), { signal: AbortSignal.timeout(10000) });
    assert(response.ok);
    const html = await response.text();
    assert(html.includes('id="downloads-count"'), 'Renovation not deployed yet');
    assert(!html.includes('data-platform="windows"'));
    assert((html.match(/data-platform="android"/g) || []).length === 2);
    assert(html.includes('Download Podium Air for Android'));
    await writeFile('download-verification/live-result.txt', 'PASS: renovated Cloudflare site with Android CTA and no Windows download.');
    console.log('PASS: Cloudflare renovation is live.');
    process.exit(0);
  } catch (error) { last = error; }
  await new Promise(resolve => setTimeout(resolve, 5000));
}
throw last;
