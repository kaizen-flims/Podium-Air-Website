const byId = id => document.getElementById(id);
let manifest;
let selected = 'android';
let build;
const platformButtons = [...document.querySelectorAll('[data-platform]')];
const checks = [...document.querySelectorAll('.checklist input')];
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const list = items => {
  const ul = el('ul');
  for (const item of items) ul.append(el('li', item));
  return ul;
};
const progressKey = () => `podium-test-checks:${selected}:${build?.version || 'pending'}`;
function updateProgress(save = true) {
  const done = checks.filter(c => c.checked).map(c => c.value);
  byId('progress').textContent = `${done.length} of ${checks.length} checked`;
  if (save) try { localStorage.setItem(progressKey(), JSON.stringify(done)); } catch { /* Storage is optional. */ }
}
function restoreProgress() {
  let done = [];
  try { const saved = JSON.parse(localStorage.getItem(progressKey()) || '[]'); if (Array.isArray(saved)) done = saved; } catch { /* Start fresh when storage is unavailable. */ }
  checks.forEach(c => { c.checked = done.includes(c.value); });
  updateProgress(false);
}
function safeAsset(asset) {
  try {
    const url = new URL(asset.url);
    return url.origin === 'https://github.com' && url.pathname.startsWith('/kaizen-flims/Podium-Air-Test-Builds/releases/download/') && typeof asset.name === 'string';
  } catch { return false; }
}
function renderBuild() {
  build = manifest.platforms[selected];
  const card = byId('build-card');
  card.replaceChildren();
  const top = el('div', '', 'build-top');
  const heading = el('div');
  heading.append(el('h3', build.label || build.name), el('span', build.version, 'version'));
  top.append(heading, el('span', build.status, 'eyebrow badge'));
  card.append(top, el('p', build.summary));
  if (build.date || build.commit || build.pr) {
    const meta = el('div', '', 'build-meta');
    if (build.date) meta.append(el('span', `Built ${build.date}`));
    if (build.commit) meta.append(el('span', `Commit ${build.commit.slice(0, 7)}`));
    if (build.pr === 'https://github.com/kaizen-flims/Podium-Air/pull/6') { const pr = el('a', 'PR #6 notes ↗'); pr.href = build.pr; meta.append(pr); }
    card.append(meta);
  }
  const downloads = el('div', '', 'downloads');
  for (const asset of (build.assets || []).filter(safeAsset)) {
    const link = el('a', `Download ${asset.label || build.name} ↗`, 'primary');
    link.href = asset.url;
    downloads.append(link, el('span', `${asset.name}${asset.size ? ' · ' + asset.size : ''}`, 'asset-note'));
    if (asset.sha256) downloads.append(el('span', `SHA-256: ${asset.sha256}`, 'asset-note'));
  }
  if (!downloads.children.length) downloads.append(el('span', 'No direct download published for this platform yet.', 'helper'));
  card.append(downloads);
  const content = el('div', '', 'build-content');
  for (const [title, items] of [['Install notes', build.notes || []], ['Focus for this build', build.focus || []]]) {
    if (!items.length) continue;
    const section = el('div'); section.append(el('h4', title), list(items)); content.append(section);
  }
  if (content.children.length) card.append(content);
  if (build.knownIssues?.length) { const details = el('details'); details.append(el('summary', 'Known limitations & build status'), list(build.knownIssues)); card.append(details); }
  card.hidden = false;
  byId('build-status').textContent = `${build.name} · ${build.status}`;
  restoreProgress();
  byId('report-label').hidden = true;
  byId('copy-report').disabled = true;
  byId('report-status').textContent = '';
}
async function loadBuilds() {
  byId('retry').hidden = true;
  byId('build-status').textContent = 'Loading build details…';
  try {
    const response = await fetch('/testers-builds.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Build list unavailable');
    const data = await response.json();
    if (data.schemaVersion !== 1 || !['android', 'windows', 'macos', 'web'].every(p => data.platforms?.[p]?.name && Array.isArray(data.platforms[p].assets))) throw new Error('Invalid build list');
    manifest = data; renderBuild();
  } catch {
    byId('build-card').hidden = true;
    byId('build-status').textContent = 'Build details could not load. Check your connection and try again. You can still prepare a report below.';
    byId('retry').hidden = false;
  }
}
for (const button of platformButtons) button.addEventListener('click', () => {
  selected = button.dataset.platform;
  platformButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  if (manifest) renderBuild();
});
checks.forEach(c => c.addEventListener('change', () => updateProgress()));
byId('retry').addEventListener('click', loadBuilds);
byId('report-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const value = key => String(data.get(key) || '').trim();
  const text = `PODIUM AIR — TESTER REPORT\n\nTitle: ${value('title')}\nPlatform: ${build?.name || selected}\nBuild: ${build?.version || 'Please specify'}\nCommit: ${build?.commit || 'Not supplied'}\nDevice / OS: ${value('device')}\nCategory: ${value('category')}\nFrequency: ${value('frequency')}\n\nSteps to reproduce:\n${value('steps')}\n\nExpected:\n${value('expected')}\n\nActual:\n${value('actual')}\n\nAttachments: Add screenshots or a recording when sharing with Prem.\n`;
  byId('report-output').value = text;
  byId('report-label').hidden = false;
  byId('copy-report').disabled = false;
  byId('report-status').textContent = 'Report prepared. Copy it and share it with Prem; nothing has been sent.';
});
byId('report-form').addEventListener('input', () => {
  byId('copy-report').disabled = true;
  byId('report-label').hidden = true;
  byId('report-status').textContent = '';
});
byId('copy-report').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('report-output').value);
    byId('report-status').textContent = 'Copied. Share the report with Prem along with your screenshots.';
  } catch {
    byId('report-output').focus(); byId('report-output').select();
    byId('report-status').textContent = 'Automatic copying is unavailable. Select and copy the prepared report below.';
  }
});
loadBuilds();
