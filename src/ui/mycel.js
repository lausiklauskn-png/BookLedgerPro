// src/ui/mycel.js
// Dezente Mycel-Andeutung als eigenständiges Marken-Element (kein voller
// Mycel-Look). Inline-SVG, damit es Theme-Farben erbt und offline funktioniert.
// Hinweis (Browser-Lehre 8): visuelle Gesten als Addition denken, nie via
// `cursor: none` — auf DeX/Android wird das ignoriert.

import { el } from './dom.js';
import { WAPPEN_SVG } from '../sbkim/wappen.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/**
 * Kleines Mycel-Zeichen: ein Knotenpunkt mit feinen, verzweigenden Fäden —
 * Anspielung auf das Sage-Mycel (Vernetzung), ruhig und reduziert.
 */
export function MycelMark(size = 32) {
  const svg = svgEl('svg', {
    width: size, height: size, viewBox: '0 0 32 32',
    fill: 'none', 'aria-hidden': 'true', class: 'mycel-mark',
  });
  // Fäden (Hyphen)
  const threads = [
    'M16 16 L6 6', 'M16 16 L26 7', 'M16 16 L4 19',
    'M16 16 L27 22', 'M16 16 L14 28', 'M16 16 L23 29',
  ];
  for (const d of threads) {
    svg.appendChild(svgEl('path', {
      d, stroke: 'currentColor', 'stroke-width': '1.2',
      'stroke-linecap': 'round', opacity: '0.55',
    }));
  }
  // Endknoten
  const nodes = [[6, 6], [26, 7], [4, 19], [27, 22], [14, 28], [23, 29]];
  for (const [cx, cy] of nodes) {
    svg.appendChild(svgEl('circle', { cx, cy, r: '1.6', fill: 'currentColor', opacity: '0.7' }));
  }
  // Zentraler Knoten (Akzentfarbe)
  svg.appendChild(svgEl('circle', { cx: '16', cy: '16', r: '4', fill: 'var(--accent)' }));
  svg.appendChild(svgEl('circle', { cx: '16', cy: '16', r: '4', fill: 'none', stroke: 'var(--accent-strong)', 'stroke-width': '1' }));
  return svg;
}

/**
 * SBKIM-Siegel-Wappen: das ECHTE Sage-Wappen (verbatim, Modul 09), klein und
 * dezent gerendert — wie Sages Kopf-Siegel, nie dominant. Größe kommt aus dem CSS
 * (`.siegel-badge`/`.siegel-wappen`); die Stufung (Bronze „ruhend" = verified-spore,
 * Gold „aktiv" = verified-match) steuert ein CSS-Filter über das `data-stufe`-Attribut
 * des umgebenden Buttons.
 */
export function SiegelBadge() {
  return el('span', { class: 'siegel-wappen', html: WAPPEN_SVG, 'aria-hidden': 'true' });
}

/** Dünner Mycel-Trenner für Sektionen (dezent). */
export function MycelDivider() {
  return el('div', { class: 'mycel-divider', 'aria-hidden': 'true' });
}
