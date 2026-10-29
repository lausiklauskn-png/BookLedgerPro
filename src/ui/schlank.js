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

// Wo das ⓘ hinkommt (Klaus 2026-10-29 spät: „Info-Button … dürfen keine neue Zeile erzeugen, sondern hinter dem Wort stehen, zum
// Beispiel hinter Modus oder hinter Alle Einstellungen zeigen oder Erscheinungsbild … immer hinter dem Text, was er anzeigen will“):
// rückwärts vom Satz die nächste Beschriftung suchen — Überschrift (h1–h4), <summary>, .setting-label, .card-title, legend, oder die
// Beschriftung eines Einstellungs-Kastens davor —, auch eine bis drei Ebenen höher (der Satz steckt oft in einem Behälter unter der
// Knopfreihe). Nie über eine andere Karte, Tabelle oder ein Formular hinweg. Eine h1 steht klein im Kopf: dort zeigt kopfTitel.js das ⓘ.
// Nur ohne jede Beschriftung bleibt es an der Stelle des Satzes (wie bisher).
const BESCHRIFTUNG = '.setting-label, .card-title, legend';
const TITEL = 'h1, h2, h3, h4, summary, ' + BESCHRIFTUNG;
const GRENZE = '.card, section, details, form, table, .modal, [role="dialog"], fieldset';
export function erklaerZiel(p) {
  let n = p;
  for (let stufe = 0; stufe < 4 && n && n.parentElement; stufe++) {
    for (let v = n.previousElementSibling; v; v = v.previousElementSibling) {
      if (v.matches(TITEL)) return v;
      // Kopfzeile mit Titel und Knöpfen („Bankauszug importieren … [Schließen]“): der Titel darin.
      if (v.matches('div') && v.firstElementChild && v.firstElementChild.matches(TITEL) && !v.matches(GRENZE)) return v.firstElementChild;
      if (v.matches('.setting, .card-title-row, .card-head, header')) { const l = v.querySelector(':scope > :is(' + TITEL + '), :scope > * > :is(' + BESCHRIFTUNG + ')'); if (l) return l; }
      // Feld oder Zeile mit einer Beschriftung vorn („Suchbereich“, „Sprache:“).
      if (v.matches('.field, .btn-row')) { const l = v.querySelector(':scope > :is(span, label):first-child'); if (l && l.textContent.trim()) return l; }
      if (v.matches(GRENZE)) break;
    }
    n = n.parentElement;
    if (n.matches('section.view, #content, main, .modal, [role="dialog"]')) {
      // Satz direkt in der Seite ohne eigene Beschriftung: er erklärt die Seite → hinter den Seitentitel (im Kopf).
      if (n.matches('section.view')) { const h = n.querySelector(':scope > h1'); if (h) return h; }
      break;
    }
    if (n.matches('.card, details, form, fieldset')) {
      // Kopf der Karte (Titel, <summary>, legend) — sonst nicht weiter hinaus.
      const k = n.querySelector(':scope > :is(' + TITEL + '), :scope > :is(.card-title-row, .card-head) :is(' + TITEL + ')');
      if (k && (k.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)) return k;
      break;
    }
  }
  return null;
}

function erklaerSchlank(p) {
  if (p.dataset.erklaer || p.closest(AUS) || p.closest('table,li,[aria-live],[role="status"],.form-error,label,.empty-state,.deckblatt')) return 0;
  if (p.hasAttribute('aria-live') || p.getAttribute('role') === 'status' || [...p.attributes].some((a) => /^data-.*(status|stapel|zustand|fehler|ergebnis)/.test(a.name))) return 0;
  const text = (p.textContent || '').trim();
  if (text.length < ERKLAER_MIN) return 0;
  const k = textSchluessel(text);
  p.dataset.erklaer = k;
  const ziel = erklaerZiel(p);
  // Steht an dieser Beschriftung schon ein ⓘ, nimmt es den Satz mit — nie zwei ⓘ (oder zwei Zeilen) für eine Beschriftung.
  const da = ziel && [...ziel.children].find((c) => c.classList && c.classList.contains('erklaer-knopf'));
  if (da && da._saetze) { da._saetze.push(p); p.hidden = da.getAttribute('aria-expanded') !== 'true'; return 1; }
  const knopf = document.createElement('button');
  knopf.type = 'button'; knopf.className = 'erklaer-knopf'; knopf.dataset.erklaerKnopf = k;
  knopf.append(icon('pb-info'));
  knopf._saetze = [p];
  const setzen = (offen) => { for (const s of knopf._saetze) s.hidden = !offen; knopf.setAttribute('aria-expanded', String(offen)); const tt = t(offen ? 'common.erklaerungZu' : 'common.erklaerungAuf'); knopf.title = tt; knopf.setAttribute('aria-label', tt); };
  setzen(merk()[k] === true);
  knopf.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const offen = knopf.getAttribute('aria-expanded') !== 'true'; setzen(offen); merken(k, offen); });
  if (ziel) ziel.append(knopf); else p.before(knopf);
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
