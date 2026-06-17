// src/domain/orders.js
// Aufträge (WorkFloh-Domänenmodell). Positionen mit Menge × Einzelpreis (Cent) und
// USt-Satz; Summen cent-genau, nach USt-Satz gruppiert. Reine Funktionen.

export const AUFTRAG_STATUS = {
  ANGELEGT: 'angelegt',
  IN_ARBEIT: 'in_arbeit',
  ERLEDIGT: 'erledigt',
  BERECHNET: 'berechnet',
  BEZAHLT: 'bezahlt',
};

// Erlaubte Status-Übergänge (Workflow).
export const STATUS_FLOW = {
  angelegt: ['in_arbeit', 'erledigt'],
  in_arbeit: ['erledigt'],
  erledigt: ['berechnet'],
  berechnet: ['bezahlt'],
  bezahlt: [],
};

export function darfWechseln(von, nach) {
  return (STATUS_FLOW[von] || []).includes(nach);
}

/** Nettobetrag einer Position in Cent (Menge × Einzelpreis). */
export function positionNetto(pos) {
  const menge = Number(pos.menge) || 0;
  const preis = Number(pos.einzelpreisCent) || 0;
  return Math.round(menge * preis);
}

/**
 * Summen eines Auftrags, gruppiert nach USt-Satz.
 * @returns {{netto:number, ust:number, brutto:number, perSatz:Object}}
 */
export function auftragSummen(positionen) {
  const perSatz = {};
  for (const pos of positionen || []) {
    const satz = Number(pos.ustSatz) || 0;
    const netto = positionNetto(pos);
    const g = perSatz[satz] || (perSatz[satz] = { netto: 0, ust: 0 });
    g.netto += netto;
  }
  let netto = 0, ust = 0;
  for (const [satz, g] of Object.entries(perSatz)) {
    g.ust = Math.round((g.netto * Number(satz)) / 100);
    netto += g.netto;
    ust += g.ust;
  }
  return { netto, ust, brutto: netto + ust, perSatz };
}

/** Summe der auf einen Auftrag geleisteten (Teil-)Zahlungen in Cent. */
export function auftragGezahlt(auftrag) {
  let s = 0;
  for (const z of (auftrag && auftrag.zahlungen) || []) s += Math.round(Number(z.betragCent) || 0);
  return s;
}

/** Offener Forderungsbetrag eines Auftrags in Cent: Brutto − geleistete (Teil-)Zahlungen. */
export function auftragOffen(auftrag) {
  return auftragSummen((auftrag || {}).positionen).brutto - auftragGezahlt(auftrag);
}

export function validateAuftrag(a) {
  const errors = [];
  if (!a.titel || !a.titel.trim()) errors.push('Titel fehlt.');
  if (!a.positionen || !a.positionen.length) errors.push('Mindestens eine Position nötig.');
  for (const p of a.positionen || []) {
    if (!Number.isFinite(Number(p.menge)) || Number(p.menge) <= 0) errors.push('Menge muss positiv sein.');
    if (!Number.isInteger(p.einzelpreisCent) || p.einzelpreisCent < 0) errors.push('Einzelpreis ungültig.');
  }
  // Zahlungsziel je Forderung (A1-Rest, optional): ganzzahlige Tage ≥ 0.
  if (a.zahlungszielTage != null && (!Number.isInteger(Number(a.zahlungszielTage)) || Number(a.zahlungszielTage) < 0)) {
    errors.push('Zahlungsziel (Tage) ungültig.');
  }
  return errors;
}
