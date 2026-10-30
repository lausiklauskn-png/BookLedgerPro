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

// Wo das ⓘ hinkommt.
// Umbau 10 (Klaus 2026-10-30): „nur einen Informationsbutton grundsätzlich in jedem Container wie Anlagen, Kassenbuch … bei einem Klick
// gehen alle Informationen an und wieder aus. So sparen wir eine Unmenge Informationsbutton.“ — Steht der Satz in einem Kasten (.card),
// gehört er zum ⓘ hinter dem Titel dieses Kastens; alle Sätze des Kastens teilen sich dieses eine ⓘ. Ein Satz direkt unter der
// Seitenüberschrift („Text oben raus … in den Container reinsetzen“) zieht in den ersten Kasten der Seite, hinter dessen Titel.
// Außerhalb von Kästen (Einstellungen) gilt Umbau 9 (Klaus 2026-10-29 spät: „hinter dem Wort … zum Beispiel hinter Modus“):
// rückwärts vom Satz die nächste Beschriftung suchen — Überschrift (h2–h4), <summary>, .setting-label, .card-title, legend, oder die
// Beschriftung eines Einstellungs-Kastens davor —, auch eine bis drei Ebenen höher. Nie über eine andere Karte, Tabelle oder ein Formular
// hinweg. Nur ohne jede Beschriftung bleibt es an der Stelle des Satzes.
const BESCHRIFTUNG = '.setting-label, .card-title, legend';
const TITEL = 'h2, h3, h4, summary, ' + BESCHRIFTUNG;
const GRENZE = '.card, section, details, form, table, .modal, [role="dialog"], fieldset';

/** Titel eines Kastens: die erste Überschrift oder Beschriftung in den obersten zwei Ebenen. */
export function kastenTitel(kasten) {
  if (!kasten) return null;
  return kasten.querySelector(':scope > :is(' + TITEL + '), :scope > :not(.card, details, table, form) > :is(' + TITEL + '), :scope > form > :is(' + TITEL + ')')
    // Kasten ohne Überschrift (SBKIM-Suche): die erste Feldbeschriftung („Suchbereich“).
    || kasten.querySelector(':scope > .field > :is(span, label):first-child, :scope > label.field > span:first-child');
}
/** Erster Kasten der Seite mit Titel (für den Satz unter der Seitenüberschrift). */
function ersterKasten(view) {
  for (const k of view.querySelectorAll('.card')) { if (k.closest(AUS)) continue; const titel = kastenTitel(k); if (titel) return { kasten: k, titel }; }
  return null;
}

export function erklaerZiel(p) {
  const kasten = p.closest('.card');
  if (kasten && !kasten.closest(AUS)) { const k = kastenTitel(kasten); if (k) return k; }
  let n = p;
  for (let stufe = 0; stufe < 4 && n && n.parentElement; stufe++) {
    for (let v = n.previousElementSibling; v; v = v.previousElementSibling) {
      if (v.matches(TITEL)) return v;
      // Kopfzeile mit Titel und Knöpfen („Bankauszug importieren … [Schließen]“): der Titel darin.
      if (v.matches('div') && v.firstElementChild && v.firstElementChild.matches(TITEL) && !v.matches(GRENZE)) return v.firstElementChild;
      if (v.matches('.setting, .card-title-row, .card-head, header')) { const l = v.querySelector(':scope > :is(' + TITEL + '), :scope > * > :is(' + BESCHRIFTUNG + ')'); if (l) return l; }
      // Feld oder Zeile mit einer Beschriftung vorn („Suchbereich“, „Sprache:“).
      if (v.matches('.field, .btn-row')) { const l = v.querySelector(':scope > :is(span, label):first-child'); if (l && l.textContent.trim()) return l; }
      if (v.matches('h1')) break;   // Seitenüberschrift: weiter unten (erster Kasten)
      if (v.matches(GRENZE)) break;
    }
    n = n.parentElement;
    if (n.matches('section.view, #content, main, .modal, [role="dialog"]')) {
      // Satz in der Seite ohne eigene Beschriftung: er erklärt die Seite → in den ersten Kasten.
      if (n.matches('section.view')) {
        const e = ersterKasten(n); if (e) return e.titel;
        // Ohne Kasten (Nachkalkulation, leere Seite): hinter den Satz der Leer-Anzeige, nicht allein in eine eigene Zeile.
        const leer = n.querySelector('.empty-state > p') || n.querySelector('.empty-state'); if (leer) return leer;
      }
      break;
    }
    if (n.matches('details, form, fieldset')) {
      const k = n.querySelector(':scope > :is(' + TITEL + '), :scope > :is(.card-title-row, .card-head) :is(' + TITEL + ')');
      if (k && (k.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)) return k;
      break;
    }
  }
  return null;
}

// Das ⓘ hinter einem Fließtext bricht sonst allein in die nächste Zeile: letztes Wort und ⓘ bleiben zusammen.
function mitLetztemWort(ziel, knopf) {
  const letzter = ziel.lastChild;
  const huelle = document.createElement('span'); huelle.className = 'erklaer-zusammen';
  if (letzter && letzter.nodeType === 3) {
    const m = /(\S+)\s*$/.exec(letzter.nodeValue || '');
    if (m) { letzter.nodeValue = letzter.nodeValue.slice(0, m.index); huelle.append(document.createTextNode(m[1])); }
  }
  huelle.append(knopf);
  return huelle;
}

function erklaerSchlank(p) {
  if (p.dataset.erklaer || p.closest(AUS) || p.closest('table,li,[aria-live],[role="status"],.form-error,label,.empty-state,.deckblatt')) return 0;
  // Ein Hinweis, den die Ansicht selbst ein- und ausblendet (Inline-Stil, z. B. §13b nur bei Steuerschuldumkehr), ist kein Erklärsatz:
  // hinter einem ⓘ bliebe er unsichtbar, das ⓘ täte scheinbar nichts (Klaus 2026-10-30: „bei Neue Buchung funktioniert der Info-Button nicht“).
  if (p.hasAttribute('style')) return 0;
  if (p.hasAttribute('aria-live') || p.getAttribute('role') === 'status' || [...p.attributes].some((a) => /^data-.*(status|stapel|zustand|fehler|ergebnis)/.test(a.name))) return 0;
  const text = (p.textContent || '').trim();
  if (text.length < ERKLAER_MIN) return 0;
  const k = textSchluessel(text);
  p.dataset.erklaer = k;
  const ziel = erklaerZiel(p);
  // Satz direkt in einer Seite ohne Kasten und ohne Leer-Anzeige (Shop-Buchung leer, Selbsttest): sichtbar lassen — ein ⓘ allein
  // in einer eigenen Zeile wäre schlechter als der Satz selbst (Leitfaden § 1.8).
  if (!ziel && p.parentElement && p.parentElement.matches('section.view')) return 0;
  // Der Satz erscheint dort, wo sein ⓘ ist: liegt das Ziel in einem Kasten, der Satz aber nicht, zieht er unter dessen Titel um.
  const zielKasten = ziel && ziel.closest('.card, .empty-state');
  if (zielKasten && !zielKasten.contains(p)) {
    let anker = ziel; while (anker !== zielKasten && anker.parentElement && anker.parentElement !== zielKasten) anker = anker.parentElement;
    if (anker === zielKasten) { zielKasten.append(p); p.dataset.erklaerUmgezogen = ''; }
    else if (anker.parentElement === zielKasten) { const schon = zielKasten.querySelectorAll(':scope > p[data-erklaer-umgezogen]'); (schon.length ? schon[schon.length - 1] : anker).after(p); p.dataset.erklaerUmgezogen = ''; }
  }
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
  if (ziel && ziel.matches('.empty-state > p')) ziel.append(mitLetztemWort(ziel, knopf));
  else if (ziel) ziel.append(knopf); else p.before(knopf);
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
