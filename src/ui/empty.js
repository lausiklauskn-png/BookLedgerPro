// src/ui/empty.js — Wiederverwendbarer Leerzustand mit Illustration.

import { el } from './dom.js';

/** @param img Dateiname unter assets/img/ · @param text Hinweistext */
export function emptyState(img, text) {
  return el('div', { class: 'empty-state' }, [
    el('img', { class: 'empty-illu', src: `./assets/img/${img}`, alt: '', loading: 'lazy' }),
    el('p', { class: 'muted', text }),
  ]);
}
