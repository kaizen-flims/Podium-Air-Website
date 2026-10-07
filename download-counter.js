const RELEASES_URL = 'https://api.github.com/repos/kaizen-flims/Podium-Air/releases';
const RELEASE_DOWNLOAD_PATH = 'https://github.com/kaizen-flims/Podium-Air/releases/download/';

// Shared by the browser and static build: count branded, uploaded APKs only.
// Accept future versions and architecture variants without pinning a release.
export function sumApkDownloads(releases) {
  if (!Array.isArray(releases)) throw new Error('Invalid release response');
  let total = 0;
  let matched = 0;
  const seen = new Set();
  for (const release of releases) {
    if (release.draft) continue;
    if (!Array.isArray(release.assets)) throw new Error('Missing release assets');
    for (const asset of release.assets) {
      if (!/^Podium[-_ ]?Air(?:[-_ ].+)?\.apk$/i.test(asset.name || '') ||
          asset.state !== 'uploaded' ||
          !asset.browser_download_url?.startsWith(`${RELEASE_DOWNLOAD_PATH}${encodeURIComponent(release.tag_name)}/`)) continue;
      if (!Number.isSafeInteger(asset.download_count) || asset.download_count < 0) {
        throw new Error('Invalid APK download count');
      }
      const key = asset.id ?? asset.browser_download_url;
      if (seen.has(key)) continue;
      seen.add(key);
      matched++;
      total += asset.download_count;
      if (!Number.isSafeInteger(total)) throw new Error('Invalid download total');
    }
  }
  if (!matched) throw new Error('No Podium Air APK assets');
  return total;
}

export async function fetchDownloadTotal({ timeoutMs = 2500 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const releases = [];
  try {
    for (let page = 1; ; page++) {
      const response = await fetch(`${RELEASES_URL}?per_page=100&page=${page}`, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal,
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('GitHub release data unavailable');
      const batch = await response.json();
      if (!Array.isArray(batch)) throw new Error('Invalid release response');
      releases.push(...batch);
      if (batch.length < 100) break;
    }
    return { total: sumApkDownloads(releases), verifiedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timeout);
  }
}

export function validSnapshot(snapshot) {
  const time = Date.parse(snapshot?.verifiedAt);
  return Number.isSafeInteger(snapshot?.total) && snapshot.total >= 0 &&
    Number.isFinite(time) && time <= Date.now() + 60000;
}

function initializeCounter() {
  const counter = document.getElementById('download-counter');
  if (!counter) return;
  const value = document.getElementById('download-count');
  const label = document.getElementById('download-count-label');
  const announcement = document.getElementById('download-count-announcement');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cacheKey = 'podium-air:verified-apk-downloads:v1';
  let snapshot = { total: Number(counter.dataset.total), verifiedAt: counter.dataset.verifiedAt };
  if (!validSnapshot(snapshot)) return; // The verified HTML remains readable on any setup failure.
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (validSnapshot(cached) && Date.parse(cached.verifiedAt) > Date.parse(snapshot.verifiedAt)) snapshot = cached;
  } catch { /* Storage may be disabled; the build snapshot is always available. */ }

  function staticDigits(total) {
    const digits = String(total);
    // Keep longer future totals inside narrow mobile bars without shrinking labels.
    if (digits.length > 6) value.style.setProperty('--counter-size', '24px');
    value.replaceChildren(...[...digits].map(digit => {
      const reel = document.createElement('span');
      reel.className = 'download-counter-digit';
      reel.textContent = digit;
      return reel;
    }));
  }

  function describe(record, live) {
    label.textContent = live ? 'LIVE DOWNLOADS' : 'LAST VERIFIED';
    counter.dataset.total = String(record.total);
    counter.dataset.source = live ? 'live' : 'snapshot';
    counter.dataset.verifiedAt = record.verifiedAt;
    const checked = new Date(record.verifiedAt).toLocaleString();
    counter.title = `Total APK release-asset downloads across Podium Air releases, not unique users. Verified ${checked}.`;
    announcement.textContent = `${record.total} APK release-asset downloads. ${live ? 'Live from GitHub.' : `Last verified ${checked}.`}`;
  }

  async function spin(record, live) {
    if (reduced || typeof value.animate !== 'function') {
      staticDigits(record.total);
      describe(record, live);
      return;
    }
    const targetDigits = String(record.total);
    const startDigits = String(snapshot.total).padStart(targetDigits.length, '0').slice(-targetDigits.length);
    if (targetDigits.length > 6) value.style.setProperty('--counter-size', '24px');
    const animations = [];
    const reels = [...targetDigits].map((digit, index) => {
      const reel = document.createElement('span');
      reel.className = 'download-counter-digit';
      const track = document.createElement('span');
      track.className = 'download-counter-track';
      const start = Number(startDigits[index]);
      const turns = 4 + index % 3;
      const steps = turns * 10 + (Number(digit) - start + 10) % 10;
      for (let step = 0; step <= steps; step++) {
        const cell = document.createElement('span');
        cell.textContent = String((start + step) % 10);
        track.append(cell);
      }
      reel.append(track);
      animations.push({ track, steps, delay: Math.min(index * 55, 300) });
      return reel;
    });
    value.replaceChildren(...reels);
    counter.classList.add('is-spinning');
    try {
      await Promise.all(animations.map(({ track, steps, delay }) => track.animate([
        { transform: 'translateY(0)' },
        { transform: `translateY(-${steps}em)` }
      ], {
        delay, duration: 2000 - delay,
        easing: 'cubic-bezier(.12,.65,.18,1)', fill: 'forwards'
      }).finished.catch(() => {})));
    } finally {
      staticDigits(record.total);
      counter.classList.remove('is-spinning');
      describe(record, live);
    }
  }

  staticDigits(snapshot.total);
  describe(snapshot, false);
  const liveResult = fetchDownloadTotal().then(record => {
    try { localStorage.setItem(cacheKey, JSON.stringify(record)); } catch { /* Optional cache. */ }
    return { record, live: true };
  }).catch(() => ({ record: snapshot, live: false }));

  // Preserve the site's existing logo intro, then make the full two-second roll visible.
  // Reduced-motion visitors see verified data promptly and never wait for an animation.
  const introAnimation = !reduced && document.querySelector('.intro')?.getAnimations?.()
    .find(animation => animation.animationName === 'intro-away');
  const introDone = introAnimation ? introAnimation.finished.catch(() => {}) : Promise.resolve();
  Promise.all([liveResult, introDone])
    .then(([{ record, live }]) => spin(record, live))
    .catch(() => { staticDigits(snapshot.total); describe(snapshot, false); });
}

// Independent module: API, storage, and counter failures cannot stop script.js.
if (typeof document !== 'undefined') {
  try { initializeCounter(); } catch { /* Keep the verified, accessible HTML fallback. */ }
}
