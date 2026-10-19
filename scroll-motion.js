(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const headings = [...document.querySelectorAll('.v2 h2')];
  // Keep real text and explicit line breaks in the accessibility tree.
  for (const heading of headings) {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let order = 0;
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const token of node.textContent.split(/(\s+)/)) {
        if (!token.trim()) { fragment.append(document.createTextNode(token)); continue; }
        const word = document.createElement('span');
        word.className = 'motion-word';
        word.textContent = token;
        word.style.setProperty('--word-order', String(order++));
        fragment.append(word);
      }
      node.replaceWith(fragment);
    }
    heading.classList.add('motion-heading');
  }
  const blocks = [...document.querySelectorAll('.v2 .feature-lines article, .v2 .utility-stack article, .v2 .story-chapter > div:last-child, .v2 .eco-item')];
  blocks.forEach(block => block.classList.add('motion-block'));
  const story = document.querySelector('.journey-evolution');
  story?.classList.add('motion-story');
  // Native scroll timelines run without a JS scroll loop. Older browsers get
  // the same reversible movement, with layout reads limited to visible targets.
  if (CSS.supports('animation-timeline: view()') || !('IntersectionObserver' in window)) return;
  const targets = [...headings, ...blocks, ...(story ? [story] : [])];
  const active = new Set();
  const words = new Map(headings.map(heading => [heading, [...heading.querySelectorAll('.motion-word')]]));
  const air = story?.querySelector('.evolution-air');
  const track = story?.querySelector('.evolution-track > span');
  let frame = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const paint = () => {
    frame = 0;
    if (preference.matches || document.hidden) return;
    const height = window.innerHeight;
    // Read all geometry before writing any styles.
    const positions = [...active].map(target => [target, target.getBoundingClientRect()]);
    for (const [target, rect] of positions) {
      const progress = clamp((height - rect.top) / Math.max(1, height * .3 + rect.height));
      if (words.has(target)) {
        words.get(target).forEach((word, index) => {
          const p = clamp((progress - index * .03) / .65);
          word.style.opacity = String(.6 + .4 * p);
          word.style.transform = `translate3d(0, ${(1 - p) * .24}em, 0)`;
        });
      } else if (target === story) {
        const p = clamp(((height - rect.top) / (height + rect.height) - .25) / .4);
        air.style.opacity = String(.15 + .85 * p);
        air.style.transform = `translate3d(${(1 - p) * -.18}em, ${(1 - p) * .12}em, 0)`;
        track.style.transform = `scaleX(${p})`;
      } else {
        target.style.opacity = '1';
        target.style.transform = `translate3d(0, ${(1 - progress) * 24}px, 0)`;
      }
    }
  };
  const schedule = () => {
    if (!frame && !preference.matches && !document.hidden) frame = requestAnimationFrame(paint);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) active.add(entry.target);
      else active.delete(entry.target);
    }
    schedule();
  }, { rootMargin: '80px 0px' });
  const syncPreference = () => {
    observer.disconnect(); active.clear(); cancelAnimationFrame(frame); frame = 0;
    for (const target of [...targets, ...words.values()].flat().concat([air, track])) {
      target?.style.removeProperty('opacity'); target?.style.removeProperty('transform');
    }
    if (!preference.matches) targets.forEach(target => observer.observe(target));
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  preference.addEventListener('change', syncPreference);
  syncPreference();
})();
