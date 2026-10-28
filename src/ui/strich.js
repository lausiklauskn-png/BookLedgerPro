// src/ui/strich.js — Strichgrafiken statt Emojis (Leitfaden § 5, Klaus 2026-10-28: „kein Bilderbuch“).
//
// Die Texte in i18n.js tragen noch Emojis am Anfang („📷 Scannen“, „📧 Mail von …“). Statt jeden Satz in vier Sprachen
// umzuschreiben, ersetzt diese Schicht jedes bekannte Emoji durch das Strichsymbol aus den Sprites (icons.js) — der
// Wortlaut bleibt, nur das Bild wechselt. Eingaben, Textfelder und [data-kein-strich] bleiben unberührt.
// Idempotent: ein ersetztes Emoji ist danach weg, der Beobachter findet nichts mehr (kein Hin und Her).
//
// Pro-Umbau 4 (2026-10-28): gilt jetzt für ALLE Ansichten (einmal in der Shell auf <body> angemeldet, auch Dialoge und
// Hinweise). Wo kein Symbol stehen kann — title, aria-label, placeholder, <option> —, fällt das Emoji samt Leerzeichen
// weg. Ein unbekanntes Emoji fällt ebenso weg (nie still ein Bild). Ausgenommen sind die byte-1:1 kopierten SBKIM-Module
// (Siegel, Lampen, Mycel-Fenster: eigene Kennungen „sbkim-…“) — sie zeichnen ihre Texte selbst und werden nicht verändert.
// Der Beobachter sieht nur die geänderten Knoten an, nicht jedes Mal die ganze Seite (Belegliste mit Hunderten Zeilen).

import { icon } from './icons.js';

/** Emoji → Symbol-ID (pb-… aus Private Brain Pro, blp-… eigene), optional mit Zusatzklasse („blp-punkt ic-gruen“). */
export const STRICH = {
  '📷': 'blp-kamera', '📁': 'pb-folder', '📂': 'pb-folder', '📧': 'pb-mail', '✉': 'pb-mail', '📨': 'pb-mail', '📎': 'blp-anhang',
  '🧠': 'blp-bedeutung', '🤖': 'blp-ki', '✍': 'pb-edit', '📝': 'pb-edit', '⬇': 'pb-download', '🛡': 'blp-pruef', '⚠': 'pb-warning',
  '✓': 'pb-check', '✔': 'pb-check', '✅': 'pb-check', '🔗': 'pb-link', '🔒': 'pb-lock', '🔐': 'pb-lock', '🔍': 'pb-search', '🔎': 'pb-search',
  '📤': 'pb-send', '🗑': 'pb-trash', '💾': 'pb-save', '🧾': 'blp-beleg', '📄': 'pb-file', '🛠': 'blp-auftrag', 'ℹ': 'pb-info', '🧪': 'blp-pruef',
  '🎙': 'blp-mikro', '🎤': 'blp-mikro', '⏹': 'blp-stopp', '🌐': 'blp-welt', '🔑': 'blp-schluessel', '🧽': 'blp-reinigen', '💶': 'blp-euro',
  '🧑': 'blp-kunde', '⚖': 'blp-waage', '🛟': 'blp-rettung', '☰': 'pb-menu', '⚙': 'pb-settings',
  '🟢': 'blp-punkt ic-gruen', '🟡': 'blp-punkt ic-gelb', '⚪': 'blp-punkt ic-grau', '🔴': 'blp-punkt ic-rot', '🟦': 'blp-punkt ic-blau',
};
// Typografische Zeichen, die keine Bilder sind (dieselbe Ausnahme wie der Wächter in Private Brain Pro, test-design-26).
export const ERLAUBT = /[↗©™®↔↕↺↻]/gu;
const ESC = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BEKANNT = Object.keys(STRICH).map(ESC).join('|');
// Bekanntes Emoji (mit Varianten-Wähler) ODER irgendein anderes Bildzeichen (dann ohne Ersatz).
const MUSTER = new RegExp('(' + BEKANNT + ')️?|((?![↗©™®↔↕↺↻])\\p{Extended_Pictographic}️?(?:‍\\p{Extended_Pictographic}️?)*)', 'u');
const AUS = 'input,textarea,script,style,svg,[data-kein-strich],[contenteditable="true"],[id^="sbkim"],[class*="sbkim"]';
const NUR_TEXT = 'select,option,optgroup,title';
const ATTRIBUTE = ['title', 'aria-label', 'placeholder'];

/** Emoji aus einem Text nehmen, wo kein Symbol stehen kann (Attribut, Auswahlliste). */
export function ohneEmoji(text) {
  return String(text).replace(new RegExp('(?:' + MUSTER.source + ')\\s?', 'gu'), '').replace(/^\s+/, '');
}

function attributeSaeubern(e) {
  if (!e || e.nodeType !== 1 || e.closest?.('[data-kein-strich],[id^="sbkim"],[class*="sbkim"]')) return 0;
  let zahl = 0;
  for (const a of ATTRIBUTE) {
    const v = e.getAttribute(a);
    if (v && MUSTER.test(v)) { const neu = ohneEmoji(v); if (neu !== v) { e.setAttribute(a, neu); zahl++; } }
  }
  return zahl;
}

function textErsetzen(n) {
  const e = n.parentElement;
  if (!e || !MUSTER.test(n.nodeValue) || e.closest(AUS)) return 0;
  if (e.closest(NUR_TEXT)) { const neu = ohneEmoji(n.nodeValue); if (neu !== n.nodeValue) { n.nodeValue = neu; return 1; } return 0; }
  let rest = n.nodeValue, zahl = 0;
  const teile = [];
  for (let m = MUSTER.exec(rest); m; m = MUSTER.exec(rest)) {
    if (m.index) teile.push(document.createTextNode(rest.slice(0, m.index)));
    if (m[1]) { const [id, ...klasse] = STRICH[m[1]].split(' '); teile.push(icon(id, ['ic-strich', ...klasse].join(' '))); }
    rest = rest.slice(m.index + m[0].length);
    if (!m[1]) rest = rest.replace(/^\s/, '');   // unbekanntes Bild: weg samt Leerzeichen
    zahl++;
  }
  if (rest) teile.push(document.createTextNode(rest));
  n.replaceWith(...teile);
  return zahl;
}

/** Ersetzt in `root` (Element oder Textknoten) alle Emojis. Gibt die Zahl der Ersetzungen zurück. */
export function strichStattEmoji(root) {
  if (!root || typeof document === 'undefined') return 0;
  if (root.nodeType === 3) return textErsetzen(root);
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return 0;
  const treffer = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (MUSTER.test(n.nodeValue)) treffer.push(n);
  let zahl = 0;
  for (const n of treffer) zahl += textErsetzen(n);
  if (root.nodeType === 1) zahl += attributeSaeubern(root);
  if (root.querySelectorAll) for (const e of root.querySelectorAll('[title],[aria-label],[placeholder]')) zahl += attributeSaeubern(e);
  return zahl;
}

/** Ersetzt sofort und danach bei jeder Änderung unter `root` — nur an den geänderten Knoten. */
const _beobachtet = new WeakSet();
export function strichBeobachten(root) {
  if (!root || _beobachtet.has(root)) return () => {};   // je Wurzel genau ein Beobachter (Start und Shell melden beide an)
  strichStattEmoji(root);
  if (typeof MutationObserver === 'undefined') return () => {};
  _beobachtet.add(root);
  const mo = new MutationObserver((liste) => {
    for (const r of liste) {
      if (r.type === 'childList') for (const n of r.addedNodes) strichStattEmoji(n);
      else if (r.type === 'characterData') strichStattEmoji(r.target);
      else if (r.type === 'attributes') attributeSaeubern(r.target);
    }
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTE });
  return () => { mo.disconnect(); _beobachtet.delete(root); };
}

/** Für Proben: sichtbare Bildzeichen im Text (ohne die erlaubten). */
export const istEmoji = (text) => /\p{Extended_Pictographic}/u.test(String(text || '').replace(ERLAUBT, ''));
