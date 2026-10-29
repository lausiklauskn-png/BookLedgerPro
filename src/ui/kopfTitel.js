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
  // ⓘ der Seite (schlank.js hängt es an die h1, wenn ein Erklärsatz direkt darunter steht): im Kopf ein gleiches ⓘ hinter dem Titel,
  // das den Knopf an der h1 auslöst (Klaus 2026-10-29 spät: „immer hinter dem Text … nicht eine neue Zeile erzeugen“).
  const quelle = h ? h.querySelector(':scope > .erklaer-knopf') : null;
  const alt = ziel.querySelector('.erklaer-knopf');
  if ((ziel.firstChild ? ziel.firstChild.textContent : '') !== text || (alt ? alt._quelle : null) !== quelle) {
    const span = doc.createElement('span'); span.className = 'kopf-titel-text'; span.textContent = text;
    const teile = [span];
    if (quelle) {
      const k = quelle.cloneNode(true);
      k._quelle = quelle; k.dataset.kopfErklaer = '';
      k.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); quelle.click(); k.setAttribute('aria-expanded', quelle.getAttribute('aria-expanded')); k.title = quelle.title; });
      teile.push(k);
    }
    ziel.replaceChildren(...teile);
  }
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
