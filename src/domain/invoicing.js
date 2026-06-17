// src/domain/invoicing.js
// Rechnung aus Auftrag → Buchungssatz (Ausgangsrechnung): Forderung an Erlöse + USt,
// mehrere USt-Sätze werden als separate Erlös-/USt-Zeilen gebucht. Reine Funktion.

import { auftragSummen } from './orders.js';

// Standard-Kontenzuordnung (SKR03-Auswahl).
const FORDERUNG_KONTO = '1400';                 // Forderungen aus L+L
const BANK_KONTO = '1200';                      // Bank
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

/**
 * Prüft die Mindestangaben einer aus WorkFloh ÜBERNOMMENEN, bereits gestellten Rechnung
 * (R4 Stufe 2). Die Nummer stammt vom ausstellenden System (WorkFloh) und wird NICHT neu
 * vergeben; Datum muss als JJJJ-MM-TT vorliegen. Keine §14-Vollprüfung — das Dokument selbst
 * liegt beim Aussteller; hier wird nur die Übernahme als Forderung/Buchung abgesichert.
 * @returns {string[]} fehlende/ungültige Angaben
 */
export function validateRechnungsUebernahme(rechnung = {}) {
  const errors = [];
  if (!String(rechnung.nummer || '').trim()) errors.push('Rechnungsnummer fehlt.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(rechnung.datum || ''))) errors.push('Rechnungsdatum (JJJJ-MM-TT) fehlt oder ungültig.');
  return errors;
}

/**
 * Baut aus einem Auftrag + einer bereits gestellten Rechnung (von WorkFloh) den Buchungs-
 * ENTWURF für die ÜBERNAHME als Forderung (R4 Stufe 2: fertige Rechnung statt nur Auftrag).
 * Anders als rechnungAusAuftrag wird KEINE neue BLP-Rechnungsnummer vergeben — Nummer und
 * Datum stammen aus WorkFloh (der Aussteller führt die fortlaufende Nummerierung). Reine
 * Funktion; Festschreiben bleibt manuell (GoBD).
 * @returns {{nummer, datum, leistungsdatum, beschreibung, zeilen, summen, kostenstelle}}
 */
export function rechnungsUebernahmeEntwurf(auftrag = {}, rechnung = {}) {
  const { zeilen, summen } = rechnungZeilen(auftrag);
  const nummer = String(rechnung.nummer || '').trim();
  const datum = String(rechnung.datum || '');
  const basis = `Rechnung ${nummer} (WorkFloh)`;
  return {
    nummer,
    datum,
    leistungsdatum: rechnung.leistungsdatum || datum,
    beschreibung: auftrag.titel ? `${basis}: ${auftrag.titel}` : basis,
    zeilen,
    summen,
    kostenstelle: auftrag.kostenstelle || null,
  };
}

/**
 * Prüft die Mindestangaben einer aus WorkFloh ÜBERNOMMENEN (Teil-)Zahlung (R4-Rest, v3):
 * gültiges ISO-Datum (JJJJ-MM-TT) und positiver Betrag. Reine Funktion.
 * @returns {string[]} fehlende/ungültige Angaben
 */
export function validateZahlungsUebernahme(zahlung = {}) {
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(zahlung.datum || ''))) errors.push('Zahlungsdatum (JJJJ-MM-TT) fehlt oder ungültig.');
  if (!(Math.round(Number(zahlung.betragCent)) > 0)) errors.push('Zahlbetrag muss positiv sein.');
  return errors;
}

/**
 * Baut aus einer übernommenen Rechnung + einer (Teil-)Zahlung den Buchungs-ENTWURF für den
 * Zahlungseingang (R4-Rest): Soll Bank / Haben Forderung (gleicht die Forderung der Rechnungs-
 * übernahme cent-genau aus → korrekte Ist-EÜR §4 Abs.3 EStG). Reine Funktion; Festschreiben
 * bleibt manuell (GoBD). Die Zahlung sollte vorher mit validateZahlungsUebernahme geprüft sein.
 * @returns {{datum, beschreibung, zeilen, betragCent, ref}}
 */
export function zahlungsUebernahmeEntwurf(rechnung = {}, zahlung = {}, opts = {}) {
  const bank = opts.bankKonto || BANK_KONTO;
  const forderung = opts.forderungKonto || FORDERUNG_KONTO;
  const betrag = Math.round(Number(zahlung.betragCent) || 0);
  const nummer = String(rechnung.nummer || '').trim();
  const ref = nummer ? ` Rechnung ${nummer}` : '';
  return {
    datum: String(zahlung.datum || ''),
    beschreibung: `Zahlungseingang${ref} (WorkFloh)`,
    zeilen: [
      { konto: bank, seite: 'S', betrag },
      { konto: forderung, seite: 'H', betrag },
    ],
    betragCent: betrag,
    ref: zahlung.ref || nummer || null,
  };
}

export const INVOICING_KONTEN = { FORDERUNG_KONTO, BANK_KONTO, ERLOES_KONTO, UST_KONTO };
