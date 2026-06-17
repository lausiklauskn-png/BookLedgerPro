// src/domain/summary.js
// Kennzahlen für das Dashboard (rein, testbar). Baut auf den geprüften
// Auswertungsfunktionen auf und filtert auf ein Geschäftsjahr.

import { computeEUR, computeUStVoranmeldung } from './taxes.js';
import { wjPeriode } from './geschaeftsjahr.js';

/** Periode eines (Wirtschafts-)Jahres. wjBeginn '01-01' (Default) = Kalenderjahr. */
export function jahrPeriode(jahr, wjBeginn = '01-01') {
  return wjPeriode(jahr, wjBeginn);
}

function inPeriode(datum, p) {
  return (!p.von || datum >= p.von) && (!p.bis || datum <= p.bis);
}

/**
 * Dashboard-Kennzahlen für ein Jahr.
 * @returns {{jahr, ertrag, aufwand, ueberschuss, ustZahllast, festgeschrieben, entwuerfe}}
 */
export function dashboardKennzahlen(buchungen, kontoIndex, jahr, wjBeginn = '01-01') {
  const p = jahrPeriode(jahr, wjBeginn);
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
