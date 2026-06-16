// src/domain/payables.js
// Eingangsrechnungen (Kreditorenrechnungen) als offene VERBINDLICHKEITEN — die fehlende
// Posten-Quelle für den Zahlungsabgleich (A2). Spiegelbild zu invoicing.js/Forderungen:
//
//  - eingangsrechnungZeilen(): bucht eine Eingangsrechnung „auf Ziel" — Aufwand (+ abzieh-
//    bare Vorsteuer) AN Verbindlichkeiten aus L+L (Konto 1600).
//  - offeneVerbindlichkeiten(): leitet offene Kreditoren-Posten ab (Brutto − Zahlungen),
//    im selben Posten-Format wie zahlungsabgleich.offenePosten (richtung 'ausgabe'),
//    damit findeOffenePosten()/zahlungsBuchungZeilen() sie direkt verarbeiten.
//
// Reine, cent-genaue Funktionen (node-getestet). Persistenz: payables-store.js.

import { faelligkeit, tageUeberfaellig } from './mahnwesen.js';

const VERBINDLICHKEIT_KONTO = '1600';            // Verbindlichkeiten aus L+L
const AUFWAND_KONTO_STD = '4980';                // Sonstige betriebliche Aufwendungen (Fallback)
const VORSTEUER_KONTO = { 19: '1576', 7: '1571' }; // abziehbare Vorsteuer

export const ER_STATUS = {
  OFFEN: 'offen',
  TEILBEZAHLT: 'teilbezahlt',
  BEZAHLT: 'bezahlt',
  STORNIERT: 'storniert',
};

/**
 * Summen einer Eingangsrechnung, gruppiert nach Aufwandskonto und nach USt-Satz.
 * Positionen: { nettoCent, ustSatz, aufwandKonto }.
 * @returns {{netto:number, vorsteuer:number, brutto:number, perKonto:Object, perSatz:Object}}
 */
export function eingangsrechnungSummen(positionen) {
  const perKonto = {};
  const perSatz = {};
  for (const pos of positionen || []) {
    const netto = Math.round(Number(pos.nettoCent) || 0);
    const satz = Number(pos.ustSatz) || 0;
    const konto = pos.aufwandKonto || AUFWAND_KONTO_STD;
    perKonto[konto] = (perKonto[konto] || 0) + netto;
    const g = perSatz[satz] || (perSatz[satz] = { netto: 0, ust: 0 });
    g.netto += netto;
  }
  let netto = 0, vorsteuer = 0;
  for (const [satz, g] of Object.entries(perSatz)) {
    g.ust = Math.round((g.netto * Number(satz)) / 100);
    netto += g.netto;
    vorsteuer += g.ust;
  }
  return { netto, vorsteuer, brutto: netto + vorsteuer, perKonto, perSatz };
}

/** Bruttobetrag (Cent) einer Eingangsrechnung aus ihren Positionen. */
export function bruttoVonPositionen(positionen) {
  return eingangsrechnungSummen(positionen).brutto;
}

/** Brutto einer Rechnung: expliziter bruttoCent (Vorrang) oder aus Positionen abgeleitet. */
export function rechnungBrutto(rechnung) {
  return rechnung.bruttoCent != null
    ? Math.round(Number(rechnung.bruttoCent))
    : bruttoVonPositionen(rechnung.positionen);
}

/**
 * Buchungszeilen einer Eingangsrechnung „auf Ziel": Aufwand + abziehbare Vorsteuer AN
 * Verbindlichkeiten (1600). Reihenfolge: Aufwandskonten aufsteigend, Vorsteuer (höchster
 * Satz zuerst), zuletzt die Verbindlichkeit im Haben. Ausgeglichen.
 * @returns {{zeilen:Array, summen:Object}}
 */
export function eingangsrechnungZeilen(rechnung, opts = {}) {
  const summen = eingangsrechnungSummen(rechnung.positionen);
  const verbindlichkeit = opts.verbindlichkeitKonto || VERBINDLICHKEIT_KONTO;
  const zeilen = [];
  for (const konto of Object.keys(summen.perKonto).sort()) {
    const netto = summen.perKonto[konto];
    if (netto !== 0) zeilen.push({ konto, seite: 'S', betrag: netto });
  }
  for (const satz of Object.keys(summen.perSatz).map(Number).sort((a, b) => b - a)) {
    const g = summen.perSatz[satz];
    if (satz > 0 && g.ust > 0) zeilen.push({ konto: VORSTEUER_KONTO[satz], seite: 'S', betrag: g.ust });
  }
  zeilen.push({ konto: verbindlichkeit, seite: 'H', betrag: summen.brutto });
  return { zeilen, summen };
}

/** Summe der bis zum (optionalen) Stichtag geleisteten Zahlungen (Cent). */
export function summeZahlungen(zahlungen, stichtag) {
  let s = 0;
  for (const z of zahlungen || []) {
    if (stichtag && z.datum && z.datum > stichtag) continue;
    s += Math.round(Number(z.betragCent) || 0);
  }
  return s;
}

/** Offener Restbetrag einer Rechnung (Cent): Brutto − geleistete Zahlungen. */
export function offenerBetrag(rechnung, stichtag) {
  return rechnungBrutto(rechnung) - summeZahlungen(rechnung.zahlungen, stichtag);
}

/** Abgeleiteter Status (manuelles `storniert` hat Vorrang). */
export function rechnungStatus(rechnung, stichtag) {
  if (rechnung.storniert || rechnung.status === ER_STATUS.STORNIERT) return ER_STATUS.STORNIERT;
  const offen = offenerBetrag(rechnung, stichtag);
  if (offen <= 0) return ER_STATUS.BEZAHLT;
  if (summeZahlungen(rechnung.zahlungen, stichtag) > 0) return ER_STATUS.TEILBEZAHLT;
  return ER_STATUS.OFFEN;
}

/**
 * Leitet die offenen Verbindlichkeits-Posten (Kreditoren) aus den Eingangsrechnungen ab —
 * im selben Format wie zahlungsabgleich.offenePosten(), aber richtung 'ausgabe'. Der
 * matchbare Betrag (`betragCent`) ist der OFFENE Rest (damit Teilzahlungen passen).
 * Stornierte und vollständig bezahlte Rechnungen fallen heraus.
 * @param {Array} rechnungen
 * @param {{stichtag?:string}} [opts]
 * @returns {Array<{id,betragCent,datum,referenz,name,richtung:'ausgabe',kind:'verbindlichkeit',
 *           faelligAm,bruttoCent,bezahltCent,offenCent,buchungRef}>} nach Fälligkeit sortiert.
 */
export function offeneVerbindlichkeiten(rechnungen, opts = {}) {
  const stichtag = opts.stichtag || null;
  const out = [];
  for (const r of rechnungen || []) {
    if (stichtag && r.datum && r.datum > stichtag) continue;
    if (r.storniert || r.status === ER_STATUS.STORNIERT) continue;
    const offen = offenerBetrag(r, stichtag);
    if (offen <= 0) continue;
    const brutto = rechnungBrutto(r);
    out.push({
      id: r.id,
      betragCent: offen,
      datum: r.datum || '',
      referenz: r.rechnungsnr || '',
      name: r.kreditor || '',
      richtung: 'ausgabe',
      kind: 'verbindlichkeit',
      faelligAm: r.faelligAm || '',
      bruttoCent: brutto,
      bezahltCent: brutto - offen,
      offenCent: offen,
      buchungRef: r.buchungRef || null,
    });
  }
  out.sort((a, b) => {
    const fa = a.faelligAm || a.datum || '', fb = b.faelligAm || b.datum || '';
    if (fa !== fb) return fa.localeCompare(fb);
    return (a.name || '').localeCompare(b.name || '');
  });
  return out;
}

/** Summe aller offenen Verbindlichkeits-Posten (Cent). */
export function summeOffeneVerbindlichkeiten(posten) {
  return (posten || []).reduce((s, p) => s + (p.offenCent || 0), 0);
}

/**
 * Reichert offene Verbindlichkeits-Posten um Fälligkeit/Überfälligkeit an (für die OP-Liste).
 * Nutzt die rechnungseigene `faelligAm`, sonst Rechnungsdatum + Zahlungsziel (Default 30 Tage,
 * üblicher für Eingangsrechnungen). Anders als beim Mahnwesen geht es hier um die EIGENE
 * Zahlungspflicht (Liquidität/Skonto), daher keine Mahnstufe.
 * @param posten Ergebnis von offeneVerbindlichkeiten()
 * @param opts {heute, zielTage}
 */
export function anreichereVerbindlichkeiten(posten = [], opts = {}) {
  const heute = opts.heute || new Date().toISOString().slice(0, 10);
  const zielTage = opts.zielTage != null ? opts.zielTage : 30;
  return posten.map((p) => {
    const faelligAm = p.faelligAm || faelligkeit(p.datum, zielTage);
    const tage = tageUeberfaellig(faelligAm, heute);
    return { ...p, faelligAm, tageUeberfaellig: tage, ueberfaellig: tage > 0 };
  });
}

/**
 * Kennzahlen über die offenen Verbindlichkeiten (für Auswertung/Dashboard).
 * @returns {{summeCent, anzahl, ueberfaelligCent, ueberfaelligAnzahl}}
 */
export function verbindlichkeitenSummen(angereichertePosten = []) {
  let summeCent = 0, ueberfaelligCent = 0, ueberfaelligAnzahl = 0;
  for (const p of angereichertePosten) {
    summeCent += p.offenCent || 0;
    if (p.ueberfaellig) { ueberfaelligCent += p.offenCent || 0; ueberfaelligAnzahl++; }
  }
  return { summeCent, anzahl: angereichertePosten.length, ueberfaelligCent, ueberfaelligAnzahl };
}

/** Validiert eine Eingangsrechnung (vor dem Speichern). */
export function validateEingangsrechnung(r) {
  const errors = [];
  if (!r.kreditor || !String(r.kreditor).trim()) errors.push('Kreditor (Lieferant) fehlt.');
  if (!r.datum || !/^\d{4}-\d{2}-\d{2}$/.test(r.datum)) errors.push('Rechnungsdatum (JJJJ-MM-TT) fehlt.');
  const hatPositionen = r.positionen && r.positionen.length;
  if (!hatPositionen && r.bruttoCent == null) errors.push('Mindestens eine Position oder ein Bruttobetrag nötig.');
  for (const p of r.positionen || []) {
    if (!Number.isInteger(p.nettoCent) || p.nettoCent < 0) errors.push('Netto-Betrag einer Position ungültig.');
    if (![0, 7, 19].includes(Number(p.ustSatz))) errors.push('USt-Satz muss 0, 7 oder 19 sein.');
  }
  if (r.bruttoCent != null && (!Number.isInteger(r.bruttoCent) || r.bruttoCent < 0)) errors.push('Bruttobetrag ungültig.');
  if (r.faelligAm && !/^\d{4}-\d{2}-\d{2}$/.test(r.faelligAm)) errors.push('Fälligkeitsdatum ungültig.');
  return errors;
}

export const PAYABLES_KONTEN = { VERBINDLICHKEIT_KONTO, AUFWAND_KONTO_STD, VORSTEUER_KONTO };
