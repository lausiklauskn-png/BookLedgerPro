// src/domain/invoicing.js
// Rechnung aus Auftrag → Buchungssatz (Ausgangsrechnung): Forderung an Erlöse + USt,
// mehrere USt-Sätze werden als separate Erlös-/USt-Zeilen gebucht. Reine Funktion.

import { auftragSummen } from './orders.js';

// Standard-Kontenzuordnung (SKR03-Auswahl).
const FORDERUNG_KONTO = '1400';                 // Forderungen aus L+L
const ERLOES_KONTO = { 19: '8400', 7: '8300', 0: '8200' };
const UST_KONTO = { 19: '1776', 7: '1771' };

/**
 * Baut die Buchungszeilen einer Ausgangsrechnung.
 * @returns {{zeilen:Array, summen:Object}}
 */
export function rechnungZeilen(auftrag, opts = {}) {
  const summen = auftragSummen(auftrag.positionen);
  const forderung = opts.forderungKonto || FORDERUNG_KONTO;
  const zeilen = [{ konto: forderung, seite: 'S', betrag: summen.brutto }];

  // Deterministische Reihenfolge der Sätze (höchster zuerst).
  const saetze = Object.keys(summen.perSatz).map(Number).sort((a, b) => b - a);
  for (const satz of saetze) {
    const g = summen.perSatz[satz];
    if (g.netto <= 0) continue;
    zeilen.push({ konto: ERLOES_KONTO[satz] || ERLOES_KONTO[0], seite: 'H', betrag: g.netto });
    if (satz > 0 && g.ust > 0) zeilen.push({ konto: UST_KONTO[satz], seite: 'H', betrag: g.ust });
  }
  return { zeilen, summen };
}

export const INVOICING_KONTEN = { FORDERUNG_KONTO, ERLOES_KONTO, UST_KONTO };
