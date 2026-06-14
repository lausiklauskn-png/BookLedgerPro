// src/domain/summary.js
// Kennzahlen für das Dashboard (rein, testbar). Baut auf den geprüften
// Auswertungsfunktionen auf und filtert auf ein Geschäftsjahr.

import { computeEUR, computeUStVoranmeldung } from './taxes.js';

export function jahrPeriode(jahr) {
  return { von: `${jahr}-01-01`, bis: `${jahr}-12-31` };
}

function inPeriode(datum, p) {
  return (!p.von || datum >= p.von) && (!p.bis || datum <= p.bis);
}

/**
 * Dashboard-Kennzahlen für ein Jahr.
 * @returns {{jahr, ertrag, aufwand, ueberschuss, ustZahllast, festgeschrieben, entwuerfe}}
 */
export function dashboardKennzahlen(buchungen, kontoIndex, jahr) {
  const p = jahrPeriode(jahr);
  const eur = computeEUR(buchungen, kontoIndex, p);
  const ust = computeUStVoranmeldung(buchungen, kontoIndex, p);
  let festgeschrieben = 0, entwuerfe = 0;
  for (const b of buchungen) {
    if (b.seq == null) { entwuerfe++; continue; }
    if (inPeriode(b.datum, p)) festgeschrieben++;
  }
  return {
    jahr,
    ertrag: eur.einnahmen,
    aufwand: eur.ausgaben,
    ueberschuss: eur.ueberschuss,
    ustZahllast: ust.zahllast,
    festgeschrieben,
    entwuerfe,
  };
}
