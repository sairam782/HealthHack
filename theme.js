'use strict';
(function () {
  const key = 'kaalinga-theme';
  function savedTheme() {
    try { return localStorage.getItem(key) === 'dark' ? 'dark' : 'light'; }
    catch (_) { return 'light'; }
  }
  function apply(value, save) {
    const theme = value === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    if (save) {
      try { localStorage.setItem(key, theme); } catch (_) { /* Still works without storage. */ }
    }
    window.dispatchEvent(new Event('kaalinga-theme-change'));
    return theme;
  }
  apply(savedTheme(), false);
  window.KaalingaTheme = {
    get: () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
    set: value => apply(value, true)
  };
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(savedTheme(), false);
  });
})();
