// src/domain/journal.js
// Buchungssatz-Logik (doppelte Buchführung). Eine Buchung besteht aus ≥2 Zeilen
// (je {konto, seite:'S'|'H', betrag in Cent}); die Summe Soll muss Summe Haben
// entsprechen. Reine, testbare Funktionen — Persistenz liegt in store.js.

import { parseEuroToCents } from './money.js';

export const BUCHUNG_STATUS = { ENTWURF: 'entwurf', FESTGESCHRIEBEN: 'festgeschrieben', STORNIERT: 'storniert' };

export function summeSeiten(zeilen) {
  let soll = 0, haben = 0;
  for (const z of zeilen) {
    if (z.seite === 'S') soll += z.betrag;
    else if (z.seite === 'H') haben += z.betrag;
  }
  return { soll, haben };
}

export function istAusgeglichen(zeilen) {
  const { soll, haben } = summeSeiten(zeilen);
  return soll === haben && soll > 0;
}

/**
 * Validiert eine Buchung gegen die Kontenliste.
 * @returns {string[]} Liste von Fehlern (leer = gültig)
 */
export function validateBuchung(buchung, kontoIndex) {
  const errors = [];
  if (!buchung.datum || !/^\d{4}-\d{2}-\d{2}$/.test(buchung.datum)) errors.push('Datum fehlt oder ungültig (YYYY-MM-DD).');
  const zeilen = buchung.zeilen || [];
  if (zeilen.length < 2) errors.push('Mindestens zwei Buchungszeilen (Soll und Haben) nötig.');
  for (const z of zeilen) {
    if (z.seite !== 'S' && z.seite !== 'H') errors.push(`Ungültige Seite: ${z.seite}`);
    if (!Number.isInteger(z.betrag) || z.betrag <= 0) errors.push(`Betrag muss positiv sein (Konto ${z.konto}).`);
    if (kontoIndex && !kontoIndex[z.konto]) errors.push(`Unbekanntes Konto: ${z.konto}`);
  }
  if (!istAusgeglichen(zeilen)) {
    const { soll, haben } = summeSeiten(zeilen);
    errors.push(`Soll (${soll}) ≠ Haben (${haben}) — Buchung nicht ausgeglichen.`);
  }
  return errors;
}

/**
 * Baut eine einfache "Soll an Haben"-Buchung, optional mit USt-Aufteilung.
 * Bruttobetrag wird in Netto + USt zerlegt; die USt-Zeile bucht auf das
 * passende Vorsteuer-/Umsatzsteuer-Konto.
 *
 * @param opts.sollKonto, opts.habenKonto - Kontonummern
 * @param opts.brutto - Eingabe (String/Number), Bruttobetrag
 * @param opts.ustSatz - 0|7|19
 * @param opts.steuerKonto - Konto für die USt-Zeile (Vorsteuer bei Aufwand, USt bei Ertrag)
 * @param opts.steuerSeite - 'S' (Vorsteuer) oder 'H' (Umsatzsteuer)
 * @returns {{zeilen:Array, netto:number, steuer:number, brutto:number}}
 */
export function baueBuchungZeilen(opts) {
  const brutto = parseEuroToCents(opts.brutto);
  if (!Number.isInteger(brutto) || brutto <= 0) throw new Error('Ungültiger Betrag');
  const satz = Number(opts.ustSatz) || 0;

  if (satz === 0 || !opts.steuerKonto) {
    return {
      brutto, netto: brutto, steuer: 0,
      zeilen: [
        { konto: opts.sollKonto, seite: 'S', betrag: brutto },
        { konto: opts.habenKonto, seite: 'H', betrag: brutto },
      ],
    };
  }

  // Netto = round(brutto / (1 + satz/100)); Steuer = Differenz (Cent-genau).
  const netto = Math.round(brutto / (1 + satz / 100));
  const steuer = brutto - netto;

  // Beispiel Aufwand: Soll Aufwand(netto) + Soll Vorsteuer(steuer) an Haben Bank(brutto)
  // Beispiel Ertrag: Soll Bank(brutto) an Haben Erlöse(netto) + Haben USt(steuer)
  const zeilen = [];
  if (opts.steuerSeite === 'S') {
    zeilen.push({ konto: opts.sollKonto, seite: 'S', betrag: netto });
    zeilen.push({ konto: opts.steuerKonto, seite: 'S', betrag: steuer });
    zeilen.push({ konto: opts.habenKonto, seite: 'H', betrag: brutto });
  } else {
    zeilen.push({ konto: opts.sollKonto, seite: 'S', betrag: brutto });
    zeilen.push({ konto: opts.habenKonto, seite: 'H', betrag: netto });
    zeilen.push({ konto: opts.steuerKonto, seite: 'H', betrag: steuer });
  }
  return { brutto, netto, steuer, zeilen };
}

/** Erzeugt die Storno-Zeilen (Soll↔Haben getauscht). */
export function stornoZeilen(zeilen) {
  return zeilen.map((z) => ({ konto: z.konto, seite: z.seite === 'S' ? 'H' : 'S', betrag: z.betrag }));
}
