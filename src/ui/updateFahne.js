// src/ui/updateFahne.js — Update-Fähnchen neben der Version im Kopf (Klaus 2026-11-13, 0.1.18).
//
// Erscheint VON SELBST, sobald ein Update bereitsteht; ein Tipp startet den vorhandenen Update-Weg.
// Kein Fähnchen, solange die Fassung aktuell ist oder kein Netz da ist — still, keine Fehlermeldung.
//
// ⚠ Tafel-Evolution, benannt: bis 0.1.17 galt „nie von selbst prüfen, erst auf Tipp“ (Leitfaden § 6). Das stille Prüfen
//   FRAGT nur (Feed + Unterschrift, wenige KB), es lädt und installiert nichts — das bleibt hinter dem Tipp.
//
// Zwei Wege, eine Anzeige:
//  · App (window.BLPNative.updates): dieselbe Brücke wie „Auf Updates prüfen“ (pruefen() zeigt keinen Dialog).
//    Tipp = das vorhandene Fenster an der Version (prüft, dann „Laden und installieren“).
//  · PWA (auch BookLedger Basic): version.json neben der Seite, nie aus dem Vorrat (sw.js lässt sie durch, cache: no-store).
//    Verglichen wird die Vorrats-Nummer (FASSUNG unten = CACHE_VERSION in sw.js = "cache" in version.json; tests/run.mjs hält
//    die drei zusammen). Die laufende Seite kennt ihre eigene Nummer aus DIESER Datei — steht im Vorrat noch die alte Schale,
//    sagt sie die alte Nummer, und genau dann soll das Fähnchen kommen. Tipp = neuen Worker holen, dann neu laden.
//
// Die Prüfung (pruefeStill) ist rein: Brücke, Abruf und eigene Nummer werden hineingereicht (in Node geprüft).

import { el } from './dom.js';
import { t } from './i18n.js';
import { appNativ } from './intro.js';

/** Vorrats-Nummer dieser Schale. Bei jedem CACHE_VERSION-Bump mit erhöhen (sw.js, version.json, hier). */
export const FASSUNG = 'v302';
export const STUENDLICH_MS = 60 * 60 * 1000;
/** Zurückholen der App fragt höchstens so oft (ein Fensterwechsel alle paar Sekunden soll nicht jedes Mal fragen). */
export const RUHE_MS = 5 * 60 * 1000;

const nummer = (v) => { const m = /^v(\d+)$/.exec(String(v == null ? '' : v).trim()); return m ? Number(m[1]) : NaN; };

/** Ist die Fassung auf dem Server NEUER als die laufende? Unlesbar oder älter → nein (nie raten). */
export function fassungNeuer(eigene, server) {
  const a = nummer(eigene), b = nummer(server);
  return Number.isFinite(a) && Number.isFinite(b) && b > a;
}

/**
 * Still nach einem Update fragen. Wirft nie; jeder Fehler (kein Netz, Server weg, Unsinn) heißt „kein Angebot“.
 * @returns {Promise<null | {art:'app', neu:string} | {art:'pwa', fassung:string, version:string}>}
 */
export async function pruefeStill({ updates = null, abruf = null, eigene = FASSUNG } = {}) {
  try {
    if (updates) {
      const r = await updates.pruefen();
      const neu = r && typeof r.neu === 'string' ? r.neu.trim() : '';
      return /^\d+\.\d+\.\d+/.test(neu) ? { art: 'app', neu } : null;
    }
    if (!abruf) return null;
    const res = await abruf('./version.json', { cache: 'no-store' });
    if (!res || !res.ok) return null;
    const j = await res.json();
    if (!j || !fassungNeuer(eigene, j.cache)) return null;
    return { art: 'pwa', fassung: String(j.cache), version: /^\d+\.\d+\.\d+$/.test(String(j.version || '')) ? String(j.version) : '' };
  } catch { return null; }
}

// ── Zustand und Anzeige (Browser) ──────────────────────────────────────────────────────────────────────────────────────────
let _angebot = null, _laeuft = false, _zuletzt = 0, _eingerichtet = false, _laedt = false;

function beschriften(k) {
  const a = _angebot;
  k.hidden = !a;
  if (!a) return;
  const text = _laedt ? t('upd.fahneLaedt') : (a.art === 'app' ? t('upd.fahne').replace('{v}', a.neu) : t('upd.fahnePwa'));
  const titel = a.art === 'app' ? t('upd.fahneTitel').replace('{v}', a.neu) : t('upd.fahneTitelPwa');
  k.textContent = text; k.title = titel; k.setAttribute('aria-label', titel);
  k.setAttribute('data-update-fahne', a.art);
}
function alleBeschriften() { try { document.querySelectorAll('[data-update-fahne]').forEach(beschriften); } catch { /* nur Anzeige */ } }

/** Der Nutzer ist gerade selbst im Update-Fenster (Angebot steht da oder es wird geprüft/geladen): nicht dazwischenfragen —
 *  die Hülle merkt sich das geprüfte Angebot, ein stilles pruefen() nähme es kurz weg. */
function nutzerAmUpdate() {
  try { return !!document.querySelector('[data-update-installieren], [data-update-pruefen][disabled]'); } catch { return false; }
}

export async function stillPruefen() {
  if (_laeuft || _laedt || typeof window === 'undefined') return _angebot;
  const nativ = appNativ();
  if (nativ && !nativ.updates) return null;                       // ältere Hülle ohne Updates: nichts zu fragen
  if (nativ && nutzerAmUpdate()) return _angebot;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return _angebot;   // ohne Netz gar nicht erst fragen
  _laeuft = true; _zuletzt = Date.now();
  try {
    const a = await pruefeStill(nativ ? { updates: nativ.updates } : { abruf: (u, o) => fetch(u, o) });
    // Ein Fehlschlag (kein Netz) nimmt ein schon gezeigtes Fähnchen nicht weg; eine klare Antwort „aktuell“ gibt es nur als null —
    // deshalb bleibt ein einmal gefundenes Angebot stehen, bis die App neu startet (nach dem Update ist sie neu gestartet).
    if (a) _angebot = a;
  } finally { _laeuft = false; }
  alleBeschriften();
  return _angebot;
}

/** Einmal je Sitzung: beim Start, beim Zurückholen der App und stündlich still fragen. */
export function stillPruefenEinrichten() {
  if (_eingerichtet || typeof window === 'undefined' || typeof document === 'undefined') return;
  _eingerichtet = true;
  const los = () => { stillPruefen().catch(() => {}); };
  setTimeout(los, 1500);                                          // nach dem ersten Bild, nicht davor
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - _zuletzt >= RUHE_MS) los(); });
  setInterval(() => { if (document.visibilityState !== 'hidden') los(); }, STUENDLICH_MS);
}

/** PWA: neuen Worker holen (er legt die neue Schale in den Vorrat), dann neu laden. Wirft nie; lädt in jedem Fall neu. */
export async function neuLadenMitNeuerFassung() {
  const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const r = await navigator.serviceWorker.getRegistration();
      if (r) {
        await Promise.race([r.update(), warte(6000)]);
        const w = r.installing || r.waiting;
        if (w) await Promise.race([new Promise((ok) => {
          const pruef = () => { if (w.state === 'activated' || w.state === 'redundant') ok(); };
          w.addEventListener('statechange', pruef); pruef();
        }), warte(30000)]);
      }
    }
  } catch { /* dann eben nur neu laden */ }
  try { location.reload(); } catch { /* nichts mehr zu tun */ }
}

/**
 * Das Fähnchen für den Kopf (wird bei jedem Neuzeichnen neu gebaut; der Zustand lebt hier).
 * @param {(anker: HTMLElement) => void} appWeg  Tipp in der App: das vorhandene Update-Fenster öffnen.
 */
export function updateFahne(appWeg) {
  if (typeof document === 'undefined') return null;
  const nativ = appNativ();
  if (nativ && !nativ.updates) return null;
  const k = el('button', { class: 'update-fahne', type: 'button', 'data-update-fahne': '', hidden: true });
  k.addEventListener('click', () => {
    const a = _angebot;
    if (!a || _laedt) return;
    if (a.art === 'app') { if (typeof appWeg === 'function') appWeg(k); return; }
    _laedt = true; alleBeschriften();
    neuLadenMitNeuerFassung();
  });
  beschriften(k);
  stillPruefenEinrichten();
  return k;
}

/** Nur für Proben. */
export function _zuruecksetzen() { _angebot = null; _laeuft = false; _zuletzt = 0; _laedt = false; }
