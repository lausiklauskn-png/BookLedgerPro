// src/ui/kopfTitel.js — der Seitentitel steht klein in der Kopfleiste, nicht groß über dem Inhalt (Klaus 2026-10-29: „Oben das Wort
// Belege, das nimmt so unheimlich viel Platz weg … oben in der Kopfleiste irgendwo klein … das musst du dir merken“; Leitfaden § 1.7).
// Eine Schicht über allen Ansichten (wie schlank.js): die erste <h1> in #content wird in [data-kopf-titel] geschrieben und selbst nur
// noch für Vorleseprogramme geführt (.titel-im-kopf, sichtbar weg, im Baum da). Die Kopfleiste ist fest oben — der Titel bleibt beim Rollen.

/** Setzt den Kopftitel nach der ersten Überschrift in #content. Gibt den Text zurück (für Proben). */
export function kopfTitelSetzen(doc = document) {
  const ziel = doc.querySelector('[data-kopf-titel]'), inhalt = doc.getElementById('content');
  if (!ziel || !inhalt) return '';
  const h = inhalt.querySelector('h1');
  const text = h ? (h.textContent || '').trim() : '';
  if (h && !h.classList.contains('titel-im-kopf')) h.classList.add('titel-im-kopf');
  if (ziel.textContent !== text) ziel.textContent = text;
  if (ziel.hidden !== !text) ziel.hidden = !text;
  return text;
}

let _beobachter = null;
export function kopfTitelBeobachten(root) {
  if (_beobachter || !root || typeof MutationObserver === 'undefined') return;
  _beobachter = new MutationObserver(() => kopfTitelSetzen());
  _beobachter.observe(root, { childList: true, subtree: true });
  kopfTitelSetzen();
}
