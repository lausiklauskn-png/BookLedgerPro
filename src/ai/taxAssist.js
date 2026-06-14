// src/ai/taxAssist.js
// Steuer-Assistent: erklärt USt-VA & EÜR in einfacher Sprache über Mistral (EU).
// STRIKT opt-in, BYOK. Es werden nur AGGREGIERTE Kennzahlen gesendet (Datenminimierung
// — keine Einzelbelege/Personendaten).

import { erklaereSteuer as mistralErklaere } from './mistral.js';
import { formatEuro } from '../domain/money.js';

/** Baut den nutzbaren Kennzahlen-Text (nur Aggregate). */
export function buildKennzahlenText(va, eur, periode) {
  const z = periode && (periode.von || periode.bis) ? `Zeitraum ${periode.von || '…'} bis ${periode.bis || '…'}. ` : '';
  return z +
    `USt-VA: Umsätze 19% (Kz81) ${formatEuro(va.kz81)}, USt darauf ${formatEuro(va.kz81Steuer)}; ` +
    `Umsätze 7% (Kz86) ${formatEuro(va.kz86)}, USt darauf ${formatEuro(va.kz86Steuer)}; ` +
    `Vorsteuer (Kz66) ${formatEuro(va.kz66)}; Zahllast (Kz83) ${formatEuro(va.kz83)}. ` +
    `EÜR: Einnahmen ${formatEuro(eur.einnahmen)}, Ausgaben ${formatEuro(eur.ausgaben)}, ` +
    `Überschuss ${formatEuro(eur.ueberschuss)}.`;
}

/** Fragt Mistral (EU) um eine Erläuterung der Kennzahlen. */
export async function erklaereSteuer(va, eur, periode) {
  return mistralErklaere(buildKennzahlenText(va, eur, periode));
}
