// Runs before the body paints. A bounded watchdog also works if React fails to load.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || location.hash) return;
  let timer;
  const finish = () => {
    if (!window.podiumIntro.active) return;
    window.podiumIntro.active = false;
    clearTimeout(timer);
    document.documentElement.classList.remove('intro-active');
    window.dispatchEvent(new Event('podium-intro-finished'));
    document.getElementById('intro-root')?.remove();
    preference.removeEventListener('change', finish);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', finish);
  };
  const onVisibility = () => { if (document.hidden) finish(); };
  window.podiumIntro = { active: true, finish };
  document.documentElement.classList.add('intro-active');
  timer = setTimeout(finish, 4200);
  preference.addEventListener('change', finish);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', finish);
})();
