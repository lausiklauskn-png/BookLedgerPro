// src/ui/theme.js
// Erscheinungsbild (Klaus 2026-10-26): Farbe (blau · graphit · petrol) × Helligkeit (light · dark · system).
// Setzt data-theme (aufgelöste Helligkeit) und data-farbe auf <html>.
//
// Merken: Die Wahl liegt verschlüsselt in den Tresor-Einstellungen (state.js) UND unverschlüsselt im
// localStorage (THEMA_KEY) — nur Farbe/Helligkeit, nichts Persönliches. So gilt das zuletzt gewählte Thema
// schon vor dem Entsperren (Sperrbildschirm, Deckblatt) und beim allerersten Anstrich (index.html liest den
// Schlüssel synchron, bevor das Stylesheet wirkt). Startwert ohne Wahl: Blau, wie das Gerät (= Private Brain Pro).

export const FARBEN = ['blau', 'graphit', 'petrol'];
export const HELLIGKEITEN = ['system', 'light', 'dark'];
export const THEMA_KEY = 'blpr_thema';           // localStorage: "farbe/helligkeit", z. B. "petrol/dark"
const THEME_COLOR = { // <meta name="theme-color"> je aufgelöstem Thema (Browserrahmen der installierten App)
  'blau/light': '#2563eb', 'graphit/light': '#475569', 'petrol/light': '#0f766e',
  'blau/dark': '#111827', 'graphit/dark': '#141619', 'petrol/dark': '#0b1120',
};

let _mode = 'system';
let _farbe = 'blau';
let _mql = null;

export function normalizeFarbe(f) { return FARBEN.includes(f) ? f : 'blau'; }
export function normalizeHelligkeit(h) { return HELLIGKEITEN.includes(h) ? h : 'system'; }

/** Reine Logik (node-getestet): löst „system" nach dem Gerät auf. */
export function resolveHelligkeit(mode, geraetDunkel) {
  const m = normalizeHelligkeit(mode);
  if (m === 'system') return geraetDunkel ? 'dark' : 'light';
  return m;
}

/** Reine Logik (node-getestet): liest "farbe/helligkeit" aus dem gemerkten Text; Unbekanntes → Startwert. */
export function parseThema(text) {
  const [f, h] = String(text || '').split('/');
  return { farbe: normalizeFarbe(f), helligkeit: normalizeHelligkeit(h) };
}

/** Name des aufgelösten Themas (für Anzeige/Tests): klarblau · nachtblau · graphit · nachtgraphit · petrol · nachtpetrol. */
export function themaName(farbe, aufgeloest) {
  const f = normalizeFarbe(farbe);
  if (aufgeloest === 'dark') return 'nacht' + f;
  return f === 'blau' ? 'klarblau' : f;
}

function geraetDunkel() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function setzen() {
  const html = document.documentElement;
  const aufgeloest = resolveHelligkeit(_mode, geraetDunkel());
  html.setAttribute('data-theme', aufgeloest);
  html.setAttribute('data-farbe', _farbe);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOR[_farbe + '/' + aufgeloest] || THEME_COLOR['blau/light']);
}

/** Wendet Helligkeit (und optional Farbe) an und merkt beides im localStorage. */
export function applyTheme(mode, farbe) {
  _mode = normalizeHelligkeit(mode);
  if (farbe !== undefined) _farbe = normalizeFarbe(farbe);
  setzen();
  try { localStorage.setItem(THEMA_KEY, _farbe + '/' + _mode); } catch { /* localStorage gesperrt: dann eben nur für diese Sitzung */ }

  // Bei "system" auf OS-Wechsel reagieren.
  if (_mql) { _mql.onchange = null; _mql = null; }
  if (_mode === 'system' && window.matchMedia) {
    _mql = window.matchMedia('(prefers-color-scheme: dark)');
    _mql.onchange = () => setzen();
  }
}

/** Wendet das zuletzt gemerkte Thema an (vor dem Entsperren); ohne Merkzettel den Startwert. */
export function applyGemerktesThema() {
  let text = '';
  try { text = localStorage.getItem(THEMA_KEY) || ''; } catch { /* ignore */ }
  const { farbe, helligkeit } = parseThema(text);
  applyTheme(helligkeit, farbe);
}

export function getThemeMode() { return _mode; }
export function getFarbe() { return _farbe; }

// ── Schriftgröße (Klaus 2026-10-29: „ein Schieberegler für die Größe der Schrift … weil es auch Leute gibt, die nicht so gut lesen
// können“). Prozent der Grundschrift am <html> (die App misst in rem → fast alles wächst mit). Gemerkt wie das Thema: im localStorage
// (nur die Zahl, nichts Persönliches; index.html liest sie vor dem ersten Anstrich) und in den Tresor-Einstellungen.
export const SCHRIFT_KEY = 'blpr_schrift';
export const SCHRIFT_MIN = 85, SCHRIFT_MAX = 150, SCHRIFT_SCHRITT = 5;

/** Reine Logik (node-getestet): auf 5er-Schritte runden, in die Grenzen holen; Unbekanntes → 100. */
export function schriftNormal(v) {
  const n = Math.round(Number(v) / SCHRIFT_SCHRITT) * SCHRIFT_SCHRITT;
  return Number.isFinite(n) && n > 0 ? Math.min(SCHRIFT_MAX, Math.max(SCHRIFT_MIN, n)) : 100;
}

/** Setzt die Schriftgröße (Prozent) und merkt sie. Gibt den angewandten Wert zurück. */
export function applySchrift(v) {
  const p = schriftNormal(v);
  const html = document.documentElement;
  html.style.fontSize = p === 100 ? '' : p + '%';
  html.setAttribute('data-schrift', String(p));
  try { localStorage.setItem(SCHRIFT_KEY, String(p)); } catch { /* nur für diese Sitzung */ }
  return p;
}
export function gemerkteSchrift() {
  try { return schriftNormal(localStorage.getItem(SCHRIFT_KEY) || 100); } catch { return 100; }
}
