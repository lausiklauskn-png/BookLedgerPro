// src/domain/costcenters.js
// Kostenstellen-Auswertung: ordnet die Erfolgs-Zeilen einer Buchung der Kostenstelle
// der Buchung zu und summiert Aufwand/Ertrag je Kostenstelle. Reine Funktion.

import { KONTOART } from './accounts.js';

const inPeriode = (datum, p) => !p || ((!p.von || datum >= p.von) && (!p.bis || datum <= p.bis));

/**
 * @returns {Array<{kostenstelle:string, aufwand:number, ertrag:number, saldo:number}>}
 */
export function kostenstellenAuswertung(buchungen, kontoIndex, periode) {
  const map = {};
  for (const b of buchungen) {
    if (b.seq == null) continue;                 // nur festgeschriebene
    if (!inPeriode(b.datum, periode)) continue;
    const ks = b.kostenstelle || '(ohne)';
    const agg = map[ks] || (map[ks] = { kostenstelle: ks, aufwand: 0, ertrag: 0 });
    for (const z of b.zeilen || []) {
      const konto = kontoIndex[z.konto];
      if (!konto) continue;
      const vorzeichen = z.seite === 'S' ? 1 : -1;
      if (konto.art === KONTOART.AUFWAND) agg.aufwand += vorzeichen * z.betrag;       // Soll mehrt Aufwand
      else if (konto.art === KONTOART.ERTRAG) agg.ertrag += -vorzeichen * z.betrag;    // Haben mehrt Ertrag
    }
  }
  const out = Object.values(map).map((a) => ({ ...a, saldo: a.ertrag - a.aufwand }));
  out.sort((a, b) => a.kostenstelle.localeCompare(b.kostenstelle));
  return out;
}
