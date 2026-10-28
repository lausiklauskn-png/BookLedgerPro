// src/ui/strich.js — Strichgrafiken statt Emojis (Leitfaden § 5, Klaus 2026-10-28: „kein Bilderbuch“).
//
// Die Texte in i18n.js tragen noch Emojis am Anfang („📷 Scannen“, „📧 Mail von …“). Statt jeden Satz in vier Sprachen
// umzuschreiben, ersetzt diese Schicht in einer Ansicht jedes bekannte Emoji durch das Strichsymbol aus den Sprites
// (icons.js) — der Wortlaut bleibt, nur das Bild wechselt. Eingaben, Textfelder und [data-kein-strich] bleiben unberührt.
// Idempotent: ein ersetztes Emoji ist danach weg, der Beobachter findet nichts mehr (kein Hin und Her).

import { icon } from './icons.js';

/** Emoji → Symbol-ID (pb-… aus Private Brain Pro, blp-… eigene). Reihenfolge egal; Varianten-Wähler U+FE0F fällt mit weg. */
export const STRICH = {
  '📷': 'blp-kamera', '📁': 'pb-folder', '📂': 'pb-folder', '📧': 'pb-mail', '✉': 'pb-mail', '📎': 'blp-anhang',
  '🧠': 'blp-bedeutung', '🤖': 'blp-ki', '✍': 'pb-edit', '⬇': 'pb-download', '🛡': 'blp-pruef', '⚠': 'pb-warning',
  '✓': 'pb-check', '✅': 'pb-check', '🔗': 'pb-link', '🔒': 'pb-lock', '🔐': 'pb-lock', '🔍': 'pb-search', '🔎': 'pb-search',
  '📤': 'pb-send', '🗑': 'pb-trash', '💾': 'pb-save', '🧾': 'blp-beleg', '📄': 'pb-file', '🛠': 'blp-auftrag', 'ℹ': 'pb-info', '🧪': 'blp-pruef',
};
const MUSTER = new RegExp('(' + Object.keys(STRICH).map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\uFE0F?', 'u');
const AUS = 'input,textarea,select,script,style,svg,[data-kein-strich],[contenteditable="true"]';

/** Ersetzt in `root` alle bekannten Emojis durch Strichsymbole. Gibt die Zahl der Ersetzungen zurück. */
export function strichStattEmoji(root) {
  if (!root || typeof document === 'undefined') return 0;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const treffer = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!MUSTER.test(n.nodeValue)) continue;
    const e = n.parentElement;
    if (!e || e.closest(AUS)) continue;
    treffer.push(n);
  }
  let zahl = 0;
  for (const n of treffer) {
    let rest = n.nodeValue;
    const teile = [];
    for (let m = MUSTER.exec(rest); m; m = MUSTER.exec(rest)) {
      if (m.index) teile.push(document.createTextNode(rest.slice(0, m.index)));
      teile.push(icon(STRICH[m[1]], 'ic-strich'));
      rest = rest.slice(m.index + m[0].length);
      zahl++;
    }
    if (rest) teile.push(document.createTextNode(rest));
    n.replaceWith(...teile);
  }
  return zahl;
}

/** Ersetzt sofort und danach bei jeder Änderung unter `root` (z. B. neu gezeichnete Suchtreffer). */
export function strichBeobachten(root) {
  strichStattEmoji(root);
  if (typeof MutationObserver === 'undefined') return () => {};
  const mo = new MutationObserver(() => strichStattEmoji(root));
  mo.observe(root, { childList: true, subtree: true, characterData: true });
  return () => mo.disconnect();
}
