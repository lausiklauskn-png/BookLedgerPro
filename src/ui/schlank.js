// src/ui/schlank.js — schlanker in allen Ansichten (Klaus 2026-10-28, Tablet in geteilter Ansicht, Leitfaden § 1.2/§ 1.3).
//
// Zwei Dinge, als Schicht über allen Ansichten (wie strich.js; einmal am <body>, der Beobachter sieht nur geänderte Knoten):
//   1 · Wortknöpfe „Bearbeiten“/„Löschen“ (und ✕) in Listen werden kleine Strichsymbole (Stift, Papierkorb); der Name steht
//       in title und aria-label. Klaus: „Bearbeiten = Stift, Löschen = kleiner Papierkorb“. Knopf, Handler und Daten bleiben.
//   2 · Lange Erklärsätze (p.muted ab ERKLAER_MIN Zeichen) liegen hinter ⓘ — zu, und der Zustand je Satz wird gemerkt
//       (localStorage, nur Schlüssel → offen/zu). Klaus: „Erklärtexte in ein i verstecken, Leerräume … aufrücken“.
//       Status- und Fehlermeldungen (aria-live, role=status, .form-error, [data-…-status]) bleiben immer sichtbar.
// Ausgenommen: [data-kein-schlank], SBKIM-Fenster (byte-1:1), eingebettete Apps (eigener Rahmen).

import { icon } from './icons.js';
import { t } from './i18n.js';

export const ERKLAER_MIN = 70;
const AUS = '[data-kein-schlank],[id^="sbkim"],[class*="sbkim"],.modal,[role="dialog"]';
const MERK = 'blpr_erklaer_v1';
let _merk = null;
const merk = () => { if (_merk) return _merk; try { _merk = JSON.parse(localStorage.getItem(MERK) || '{}') || {}; } catch { _merk = {}; } return _merk; };
const merken = (k, offen) => { merk()[k] = !!offen; try { localStorage.setItem(MERK, JSON.stringify(_merk)); } catch { /* nur Komfort */ } };

/** Kurzer, stabiler Schlüssel aus dem Text (FNV-1a). */
export function textSchluessel(text) {
  let h = 0x811c9dc5;
  for (const c of String(text || '').slice(0, 200)) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

const WORT = () => ({ [t('common.edit')]: 'pb-edit', [t('common.delete')]: 'pb-trash' });

function knopfSchlank(b) {
  if (b.dataset.schlank || b.closest(AUS)) return 0;
  const text = b.textContent.trim(), id = WORT()[text] || (text === '✕' && b.classList.contains('pos-remove') ? 'pb-trash' : null);
  if (!id) return 0;
  b.dataset.schlank = 'symbol';
  const name = text === '✕' ? (b.getAttribute('title') || t('common.delete')) : text;
  b.setAttribute('title', name); b.setAttribute('aria-label', name);
  b.classList.add('btn-symbol');
  b.replaceChildren(icon(id));
  return 1;
}

function erklaerSchlank(p) {
  if (p.dataset.erklaer || p.closest(AUS) || p.closest('table,li,[aria-live],[role="status"],.form-error,label')) return 0;
  if (p.hasAttribute('aria-live') || p.getAttribute('role') === 'status' || [...p.attributes].some((a) => /^data-.*(status|stapel|zustand|fehler|ergebnis)/.test(a.name))) return 0;
  const text = (p.textContent || '').trim();
  if (text.length < ERKLAER_MIN) return 0;
  const k = textSchluessel(text);
  p.dataset.erklaer = k;
  const knopf = document.createElement('button');
  knopf.type = 'button'; knopf.className = 'erklaer-knopf'; knopf.dataset.erklaerKnopf = k;
  knopf.append(icon('pb-info'));
  const setzen = (offen) => { p.hidden = !offen; knopf.setAttribute('aria-expanded', String(offen)); const tt = t(offen ? 'common.erklaerungZu' : 'common.erklaerungAuf'); knopf.title = tt; knopf.setAttribute('aria-label', tt); };
  setzen(merk()[k] === true);
  knopf.addEventListener('click', () => { const offen = p.hidden; setzen(offen); merken(k, offen); });
  // Das ⓘ steht hinten an der Zwischenüberschrift davor (wenn es eine gibt), sonst an der Stelle des Satzes.
  // Nicht an die Seitenüberschrift (h1): die steht klein im Kopf (kopfTitel.js), im Inhalt ist sie nur noch für Vorleser da.
  const vor = p.previousElementSibling;
  if (vor && /^(H2|H3|H4)$/.test(vor.tagName)) vor.append(' ', knopf); else p.before(knopf);
  return 1;
}

/** Wendet beide Regeln auf `root` an. Gibt die Zahl der Änderungen zurück. */
export function schlankMachen(root) {
  if (!root || typeof document === 'undefined') return 0;
  let n = 0;
  const el = root.nodeType === 1 ? root : root.parentElement;
  if (!el) return 0;
  const knoepfe = el.matches && el.matches('button.btn-sm') ? [el] : [];
  for (const b of [...knoepfe, ...el.querySelectorAll('button.btn-sm')]) n += knopfSchlank(b);
  const saetze = el.matches && el.matches('p.muted') ? [el] : [];
  for (const p of [...saetze, ...el.querySelectorAll('p.muted')]) n += erklaerSchlank(p);
  return n;
}

const _beobachtet = new WeakSet();
export function schlankBeobachten(root) {
  if (!root || _beobachtet.has(root)) return () => {};
  schlankMachen(root);
  if (typeof MutationObserver === 'undefined') return () => {};
  _beobachtet.add(root);
  const mo = new MutationObserver((liste) => { for (const r of liste) for (const n of r.addedNodes) if (n.nodeType === 1) schlankMachen(n); });
  mo.observe(root, { childList: true, subtree: true });
  return () => { mo.disconnect(); _beobachtet.delete(root); };
}
