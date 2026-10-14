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
    assert((html.match(/data-platform="windows"/g) || []).length === 2);
    assert((html.match(/data-platform="macos"/g) || []).length === 2);
    assert(html.includes('desktop-v1.0.1-beta1/Podium-Air-1.0.1-beta1-macos-x64.dmg'));
    assert(html.includes('v1.0.2/Podium-Air-v1.0.2.apk'));
    assert((html.match(/data-platform="android"/g) || []).length === 3);
    assert(html.includes('Download Podium Air for Android'));
    await writeFile('download-verification/live-result.txt', 'PASS: renovated Cloudflare site with released Android, Windows and macOS downloads.');
    console.log('PASS: Cloudflare renovation is live.');
    process.exit(0);
  } catch (error) { last = error; }
  await new Promise(resolve => setTimeout(resolve, 5000));
}
throw last;
