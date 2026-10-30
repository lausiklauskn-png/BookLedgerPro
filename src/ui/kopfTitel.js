// src/ui/kopfTitel.js — kein Seitentitel über dem Inhalt und keiner im Kopf.
// Umbau 8 (Klaus 2026-10-29: „Oben das Wort Belege, das nimmt so unheimlich viel Platz weg“) hatte den Titel klein in die Kopfleiste
// gelegt. Umbau 10 (Klaus 2026-10-30: „Wir machen oben aus dem Kopf das Belege raus … wir können links sehen, was es ist“): auch dort weg —
// die Leiste links zeigt die Ansicht schon. Die erste <h1> in #content bleibt im Baum für Vorleseprogramme (.titel-im-kopf, sichtbar weg).
// Das ⓘ eines Satzes unter der Seitenüberschrift sitzt seitdem im ersten Kasten der Seite (schlank.js).

/** Blendet die erste Überschrift in #content sichtbar aus und leert den Kopf-Platz. Gibt den Titeltext zurück (für Proben). */
export function kopfTitelSetzen(doc = document) {
  const ziel = doc.querySelector('[data-kopf-titel]'), inhalt = doc.getElementById('content');
  if (!inhalt) return '';
  const h = inhalt.querySelector('h1');
  if (h && !h.classList.contains('titel-im-kopf')) h.classList.add('titel-im-kopf');
  if (ziel) { if (ziel.firstChild) ziel.replaceChildren(); if (!ziel.hidden) ziel.hidden = true; }
  return h ? (h.textContent || '').trim() : '';
}

let _beobachter = null;
export function kopfTitelBeobachten(root) {
  if (_beobachter || !root || typeof MutationObserver === 'undefined') return;
  _beobachter = new MutationObserver(() => kopfTitelSetzen());
  _beobachter.observe(root, { childList: true, subtree: true });
  kopfTitelSetzen();
}
