(() => {
  'use strict';

  const fallback = {
    version: 'v1.0.1',
    url: 'https://github.com/kaizen-flims/Podium-Air/releases/download/v1.0.1/Podium-Air-v1.0.1.apk'
  };

  function applyRelease(release) {
    document.querySelectorAll('.download-link').forEach(link => {
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

  document.getElementById('year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window && !reduced) {
    // Observe once per element. Scroll never runs a JavaScript animation loop;
    // CSS only animates opacity and transform after an element enters view.
    const revealGroups = [
      ['.hero-copy', '.eyebrow, h1, .hero-lead, .hero-actions'],
      ['.statement', '.section-intro, h2, .statement-bottom > p, .feature-lines > div'],
      ['.showcase-copy', '.section-intro, h2, .showcase-lead, .showcase-tabs'],
      ['.details', '.section-intro, h2, .detail-stack article'],
      ['.journey-head', '.section-intro, h2, p'],
      ['.attempts-copy', '.story-kicker, h3, p'],
      ['.pivot', '.story-kicker, h3, p:not(.story-kicker), .name-transition'],
      ['.weeks', '.story-kicker, .weeks-track, h3, p, .text-link'],
      ['.ecosystem', '.section-intro, h2, .eco-item'],
      ['.final-cta', ':scope > img, :scope > .eyebrow, :scope > h2, :scope > .button, :scope > .cta-version']
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
