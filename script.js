(() => {
  'use strict';

  const fallback = {
    version: 'v1.0.2',
    url: 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.2/Podium-Air-v1.0.2.apk'
  };

  function applyRelease(release) {
    document.querySelectorAll('.download-link[data-platform="android"]').forEach(link => {
      link.href = release.url;
      link.setAttribute('aria-label', `Download Podium Air ${release.version} APK for Android`);
    });
    document.querySelectorAll('.version-text').forEach(el => { el.textContent = release.version; });
  }

  // A verified, signed stable release remains usable if the GitHub API is blocked or rate-limited.
  applyRelease(fallback);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  fetch('https://api.github.com/repos/kaizen-flims/Podium-Air/releases/latest', {
    headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal
  }).then(response => {
    if (!response.ok) throw new Error('Release unavailable');
    return response.json();
  }).then(data => {
    if (data.draft || data.prerelease || !/^v\d+\.\d+\.\d+$/.test(data.tag_name)) return;
    const asset = data.assets?.find(item =>
      /^Podium-Air-v\d+\.\d+\.\d+\.apk$/.test(item.name) &&
      item.name === `Podium-Air-${data.tag_name}.apk` &&
      item.state === 'uploaded' &&
      item.browser_download_url?.startsWith(`https://github.com/kaizen-flims/Podium-Air/releases/download/${data.tag_name}/`)
    );
    if (asset) applyRelease({ version: data.tag_name, url: asset.browser_download_url });
  }).catch(() => {}).finally(() => clearTimeout(timeout));

  const screens = {
    home: {
      src: 'assets/update-screen.jpg',
      alt: 'Real Podium Air Listen Now screen showing music recommendations and its in-app update prompt',
      caption: 'Listen Now brings your recent tracks, albums and quick picks together.', index: '01'
    },
    accounts: {
      src: 'assets/account-screen.jpg',
      alt: 'Real Podium Air account switcher over the Listen Now screen',
      caption: 'Switch accounts without losing your place in the music.', index: '02'
    },
    settings: {
      src: 'assets/settings-screen.jpg',
      alt: 'Real Podium Air settings screen with playback and language controls',
      caption: 'Fine-tune playback and make the app feel yours.', index: '03'
    }
  };
  const tabs = [...document.querySelectorAll('.showcase-tabs [role="tab"]')];
  const screen = document.getElementById('screen-image');
  const panel = document.getElementById('screen-panel');
  const caption = document.getElementById('screen-caption');
  const screenIndex = document.getElementById('screen-index');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function selectTab(tab, focus = false) {
    const next = screens[tab.dataset.screen];
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    const swap = () => {
      screen.src = next.src;
      screen.alt = next.alt;
      caption.textContent = next.caption;
      screenIndex.textContent = next.index;
      screen.parentElement.classList.remove('is-changing');
    };
    if (reduced) swap();
    else {
      screen.parentElement.classList.add('is-changing');
      setTimeout(swap, 160);
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(tabs[next], true);
    });
  });

  // Compare real observations only. A dashed connector is not a daily series.
  const counter = document.getElementById('download-counter');
  let history = [];
  let current = { total: Number(counter.dataset.total), verifiedAt: counter.dataset.verifiedAt };
  const ns = 'http://www.w3.org/2000/svg';
  const dateLabel = value => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
  function renderGraph(record) {
    if (!Number.isSafeInteger(record.total) || record.total < 0 || !Number.isFinite(Date.parse(record.verifiedAt))) return;
    if (Date.parse(record.verifiedAt) >= Date.parse(current.verifiedAt)) current = record;
    const observations = [...history, current].sort((a, b) => Date.parse(a.verifiedAt) - Date.parse(b.verifiedAt));
    const daily = new Map();
    for (const item of observations) daily.set(item.verifiedAt.slice(0, 10), item);
    const points = [...daily.values()];
    const first = points[0]; const last = points.at(-1);
    const span = Date.parse(last.verifiedAt) - Date.parse(first.verifiedAt);
    const max = Math.max(1, ...points.map(point => point.total));
    const coords = points.map(point => ({ ...point, x: span ? 60 + (Date.parse(point.verifiedAt) - Date.parse(first.verifiedAt)) / span * 470 : 295, y: 238 - point.total / max * 180 }));
    const graph = document.getElementById('growth-graph');
    graph.querySelector('.graph-line').setAttribute('d', coords.map((point, i) => `${i ? 'L' : 'M'}${point.x} ${point.y}`).join(''));
    graph.querySelector('.graph-area').setAttribute('d', coords.map((point, i) => `${i ? 'L' : 'M'}${point.x} ${point.y}`).join('') + `L${coords.at(-1).x} 238L${coords[0].x} 238Z`);
    graph.querySelectorAll('.graph-point, .graph-value, .graph-label').forEach(element => element.remove());
    for (const [i, point] of coords.entries()) {
      const circle = document.createElementNS(ns, 'circle');
      for (const [name, value] of Object.entries({ cx: point.x, cy: point.y, r: 6, class: 'graph-point' })) circle.setAttribute(name, value);
      graph.append(circle);
      if (i !== 0 && i !== coords.length - 1) continue;
      const number = document.createElementNS(ns, 'text');
      number.setAttribute('x', point.x); number.setAttribute('y', point.y - 18); number.setAttribute('class', 'graph-value'); number.setAttribute('text-anchor', i ? 'end' : 'start'); number.textContent = new Intl.NumberFormat('en').format(point.total); graph.append(number);
      const label = document.createElementNS(ns, 'text'); label.setAttribute('x', point.x); label.setAttribute('y', 266); label.setAttribute('class', 'graph-label'); label.setAttribute('text-anchor', i ? 'end' : 'start'); label.textContent = dateLabel(point.verifiedAt); graph.append(label);
    }
    document.getElementById('graph-range').textContent = `${dateLabel(first.verifiedAt)} to ${dateLabel(last.verifiedAt)}, ${new Date(last.verifiedAt).getUTCFullYear()}`;
    document.getElementById('graph-desc').textContent = points.map(point => `${point.total} APK downloads on ${dateLabel(point.verifiedAt)}`).join('; ') + '. Dashed connectors compare observations; intervening daily data is unavailable.';
    document.getElementById('graph-note').textContent = `${points.length} verified snapshots; daily history unavailable.`;
  }
  const growthFigure = document.querySelector('.growth-figure');
  if (!reduced && 'IntersectionObserver' in window) {
    const graphObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      growthFigure.classList.add('graph-entered');
      graphObserver.disconnect();
    }, { threshold: .25 });
    // Start after the V1 intro, so the line reveal is visible to the visitor.
    const intro = document.querySelector('.intro')?.getAnimations?.().find(animation => animation.animationName === 'intro-away');
    Promise.resolve(intro?.finished).catch(() => {}).then(() => graphObserver.observe(growthFigure));
    growthFigure.classList.add('graph-animated');
  }
  document.addEventListener('podium:downloads', event => renderGraph(event.detail));
  renderGraph(current);
  fetch('download-history.json', { signal: AbortSignal.timeout(4000), cache: 'no-store' }).then(response => { if (!response.ok) throw new Error('History unavailable'); return response.json(); }).then(data => {
    if (!Array.isArray(data) || !data.length || data.length > 366) return;
    history = [...history, ...data].filter(item => Number.isSafeInteger(item.total) && item.total >= 0 && Number.isFinite(Date.parse(item.verifiedAt)) && Date.parse(item.verifiedAt) <= Date.now() + 60000);
    renderGraph(current);
  }).catch(() => {});

  async function refreshHistory() {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/kaizen-flims/Podium-Air-Website/download-data/download-history.json?refresh=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data) || data.length > 366) return;
      history = data.filter(item => Number.isSafeInteger(item.total) && item.total >= 0 && Number.isFinite(Date.parse(item.verifiedAt)) && Date.parse(item.verifiedAt) <= Date.now() + 60000);
      renderGraph(current);
    } catch { /* Retain verified history and the latest counter observation. */ }
  }
  refreshHistory();
  setInterval(() => { if (document.visibilityState !== 'hidden') refreshHistory(); }, 300000);

  document.getElementById('year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window && !reduced) {
    // Observe once per element. Scroll never runs a JavaScript animation loop;
    // CSS only animates opacity and transform after an element enters view.
    const revealGroups = [
      ['.hero-copy', '.eyebrow, h1, .hero-lead, .hero-actions, .hero-metrics, .hero-metric-note'],
      ['.statement', '.section-intro, h2, .statement-bottom > p, .feature-lines > div'],
      ['.showcase-copy', '.section-intro, h2, .showcase-lead, .showcase-tabs'],
      ['.details', '.section-intro, h2, .detail-stack article'],
      ['.journey-head', '.section-intro, h2, p'],
      ['.attempts-copy', '.story-kicker, h3, p'],
      ['.pivot', '.story-kicker, h3, p:not(.story-kicker), .name-transition'],
      ['.weeks', '.story-kicker, .weeks-track, h3, p, .text-link'],
      ['.ecosystem', '.section-intro, h2, .eco-item'],
      ['.final-cta', ':scope > img, :scope > .eyebrow, :scope > h2, .download-option']
    ];
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (const [rootSelector, itemSelector] of revealGroups) {
      const root = document.querySelector(rootSelector);
      if (!root) continue;
      root.querySelectorAll(itemSelector).forEach((item, index) => {
        // The hero starts as the intro clears; later groups stagger briefly.
        const heroWait = rootSelector === '.hero-copy' ? Math.max(0, 2050 - performance.now()) : 0;
        item.style.setProperty('--reveal-delay', `${Math.round(heroWait + Math.min(index * 70, 350))}ms`);
        item.classList.add('scroll-reveal');
        revealObserver.observe(item);
      });
    }
    document.documentElement.classList.add('motion-ready');

    const attemptCells = document.querySelectorAll('.attempt-grid > span');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        attemptCells.forEach((cell, i) => setTimeout(() => cell.classList.add('seen'), i * 55));
        observer.disconnect();
      });
    }, { threshold: .35 });
    const grid = document.querySelector('.attempt-grid');
    if (grid) observer.observe(grid);
  }
})();
