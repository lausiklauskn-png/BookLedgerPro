// src/ui/testmarke.js — TEMPORÄRE In-App-Test-Marken (Browser-Verifikation).
//
// Zweck: An jeder Stelle mit noch offenem Browser-Test sitzt eine kleine, anklickbare
// Marke „🧪 Test offen". Antippen → „✅ getestet" (in localStorage gemerkt, übersteht
// Reload). So kann der Nutzer beim echten Beleg-Testen direkt in der App abhaken.
//
// WICHTIGES PRINZIP: Die Marke wird DORT eingehängt, wo der zu testende Knopf gerendert
// wird. Fehlt der Knopf (z. B. Bedingung nicht erfüllt, Render-Fehler), fehlt auch die
// Marke — so fällt ein „unsichtbar fehlender" Knopf beim Abhaken sofort auf.
//
// ENTFERNEN (wenn alle Tests durch sind): `TEST_MARKEN_AKTIV = false` blendet ALLE Marken
// aus, ohne den restlichen Code anzufassen. Danach die `testMarke(...)`-Aufrufe + diese
// Datei löschen. Liste/Zuordnung der IDs: docs/TESTPLAN.md.

import { el } from './dom.js';

// Master-Schalter: auf false setzen → alle Test-Marken verschwinden (Code bleibt intakt).
export const TEST_MARKEN_AKTIV = true;

const LS_PREFIX = 'blpr.testmarke.';

function gemerkt(key) {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}
function merke(key, an) {
  try { if (an) localStorage.setItem(key, '1'); else localStorage.removeItem(key); } catch { /* localStorage gesperrt → nur Sitzung */ }
}

/**
 * Liefert eine anklickbare Test-Marke (oder null, wenn global deaktiviert).
 * @param {string} id     stabile Kennung (localStorage-Schlüssel), siehe docs/TESTPLAN.md
 * @param {string} [label] kurzer Klartext neben dem Status
 * @returns {HTMLElement|null}
 */
export function testMarke(id, label) {
  if (!TEST_MARKEN_AKTIV) return null;
  const key = LS_PREFIX + String(id || '');
  let done = gemerkt(key);
  const marke = el('button', { type: 'button', class: 'test-marke', title: 'Browser-Test — antippen zum Abhaken (temporär)' });
  const render = () => {
    marke.classList.toggle('done', done);
    marke.textContent = (done ? '✅ getestet' : '🧪 Test offen') + (label ? ' · ' + label : '');
  };
  marke.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    done = !done; merke(key, done); render();
  });
  render();
  return marke;
}
