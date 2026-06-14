// src/ui/theme.js
// Erscheinungsbild: hell/dunkel/system. Setzt data-theme auf <html>.

let _mode = 'system';
let _mql = null;

function resolve(mode) {
  if (mode === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }
  return mode;
}

export function applyTheme(mode) {
  _mode = mode || 'system';
  document.documentElement.setAttribute('data-theme', resolve(_mode));

  // Bei "system" auf OS-Wechsel reagieren.
  if (_mql) { _mql.onchange = null; _mql = null; }
  if (_mode === 'system' && window.matchMedia) {
    _mql = window.matchMedia('(prefers-color-scheme: dark)');
    _mql.onchange = () => document.documentElement.setAttribute('data-theme', resolve('system'));
  }
}

export function getThemeMode() { return _mode; }
