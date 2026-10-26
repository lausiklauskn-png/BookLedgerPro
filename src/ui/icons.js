// src/ui/icons.js — Strichsymbole (Klaus 2026-10-26, Sammlung A1/D2).
//
// Zwei Sprite-Dateien, einmal in den Rumpf eingehängt (versteckt), danach zeigt jedes
// <svg><use href="#id"/></svg> darauf. Build-frei, kein Netz, beide liegen im Vorrat (sw.js).
//   assets/pb-icons.svg   byte-1:1 aus Private-Brain-Pro (design-kit/icons.svg) — NIE hier abwandeln;
//                         in tests/run.mjs per SHA-256 genagelt. IDs „pb-…".
//   assets/blp-icons.svg  BLP-Fachsymbole im selben Stil. IDs „blp-…".
// Ein <use> auf eine ID, die (noch) nicht da ist, zeichnet nichts und wirft nichts — darum steht
// neben jedem Symbol im Menü immer der sichtbare Name (Kit-Regel: Symbol + Name gehören zusammen).

import { el } from './dom.js';

export const SPRITES = ['./assets/pb-icons.svg', './assets/blp-icons.svg'];
let _geladen = null;

/** Hängt beide Sprites einmal versteckt in den Rumpf. Fail-soft: ohne Sprite bleibt der Text. */
export function ladeSymbole() {
  if (_geladen) return _geladen;
  _geladen = (async () => {
    for (const pfad of SPRITES) {
      try {
        const r = await fetch(pfad);
        if (!r.ok) continue;
        const text = await r.text();
        const host = document.createElement('div');
        host.setAttribute('data-symbole', pfad);
        host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        host.innerHTML = text;
        // Nur <symbol>-Definitionen, keine Skripte (die Dateien sind eigene, aber Vorsicht kostet nichts).
        for (const s of host.querySelectorAll('script')) s.remove();
        document.body.prepend(host);
      } catch { /* offline ohne Vorrat: Text bleibt sichtbar */ }
    }
  })();
  return _geladen;
}

/** Ein Symbol als Inline-SVG; `cls` ergänzt die Klasse `ic`. */
export function icon(id, cls) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#' + id);
  svg.appendChild(use);
  return svg;
}

/** Symbol + sichtbarer Text (für Knöpfe und Menüpunkte). */
export function iconText(id, text, cls) {
  return [icon(id, cls), el('span', { class: 'ic-text', text })];
}
