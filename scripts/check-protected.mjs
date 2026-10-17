import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const base = 'b8b23ef97b877d96d229b47a725fea2356e6b59f';
const before = path => execFileSync('git', ['show', `${base}:${path}`]);
for (const path of ['styles.css', 'intro-gate.js', 'src/intro.tsx', 'src/intro.css', 'src/hero.tsx', 'components/ui/shader-animation.tsx', 'components/ui/web-gl-shader.tsx', 'components/ui/liquid-glass-button.tsx', 'assets/red-record.webp', 'assets/podium-air-icon.webp', 'download-counter.js', 'functions/api/downloads.js', 'robots.txt']) {
  assert(before(path).equals(readFileSync(path)), `Protected file changed: ${path}`);
}
const old = before('index.html').toString();
const current = readFileSync('index.html', 'utf8');
for (const pattern of [/<header[\s\S]*?<\/header>/, /<section class="hero[\s\S]*?<\/section>/, /<div id="intro-root"[^\n]+/]) assert.equal(current.match(pattern)[0], old.match(pattern)[0]);
const meta = html => html.match(/<meta[^>]+>/g);
assert.deepEqual(meta(current), meta(old), 'SEO metadata must stay unchanged');
const links = html => [...html.matchAll(/href="(https:\/\/github.com\/kaizen-flims\/Podium-Air\/releases[^"#]*)"/g)].map(m => m[1]).sort();
assert.deepEqual(links(current), links(old), 'Release destinations must stay unchanged');
console.log('PASS: protected hero/dock/intro markup, shaders, styles, artwork, data implementation, SEO metadata and release destinations are unchanged.');
