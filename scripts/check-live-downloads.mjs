import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const origin = 'https://podium-air-website.pages.dev';
const url = 'https://github.com/kaizen-flims/Podium-Air-Windows-/releases/download/v0.3.0-preview.1/Podium-Air-Windows-0.3.0-x64.msi';
const asset = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(30000) });
assert(asset.ok, 'Windows asset returned HTTP ' + asset.status);
assert(Number(asset.headers.get('content-length')) > 100_000_000, 'Windows installer size is not plausible');
const binary = await fetch(url, { headers: { Range: 'bytes=0-7' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
assert(binary.ok);
const reader = binary.body.getReader();
const first = await reader.read();
await reader.cancel();
assert(first.value && Buffer.from(first.value.subarray(0, 8)).toString('hex') === 'd0cf11e0a1b11ae1', 'Windows download is not an MSI compound file');
let last;
for (let attempt = 0; attempt < 24; attempt++) {
  try {
    const response = await fetch(`${origin}/?download-check=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(10000) });
    assert(response.ok);
    const html = await response.text();
    assert(html.includes(url));
    assert((html.match(/data-platform="windows"/g) || []).length === 2);
    assert((html.match(/data-platform="android"/g) || []).length === 3);
    assert(html.includes('Download Podium Air for Android') && html.includes('Download Podium Air for Windows'));
    assert(html.includes('id="platform-android"') && html.includes('id="platform-windows"'));
    assert(html.includes('Google/YouTube streaming and account sync are unavailable'));
    const result = `PASS: Live Cloudflare website returned HTTP ${response.status} with both platform buttons/logos and the permanent Windows installer link.\n${origin}\n${url}\n`;
    await writeFile('download-verification/live-result.txt', result);
    await writeFile('download-verification/live-index.html', html);
    console.log(result.trim());
    process.exit(0);
  } catch (error) { last = error; }
  await new Promise(resolve => setTimeout(resolve, 5000));
}
throw last;
