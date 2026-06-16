// src/domain/kleinfaelle.js
// „Kleinfälle" als RECHNENDE Buchungshilfen (nicht nur Hinweise): Bewirtung 70/30
// (§4 Abs.5 Nr.2 EStG), Geschenkegrenze (§4 Abs.5 Nr.1 EStG), Kleinbetragsrechnung
// (§33 UStDV). Reine, testbare Funktionen.
//
// EHRLICHER HINWEIS: vereinfachte Standardfälle. Angemessenheit der Bewirtung,
// Aufzeichnungspflichten und Empfänger-/Anlass-Dokumentation bleiben Sache des Nutzers.

import { parseEuroToCents } from './money.js';

// ---- Kleinbetragsrechnung (§33 UStDV): bis 250 € brutto reduzierte Pflichtangaben ----
export const KLEINBETRAG_GRENZE_CENT = 25000; // 250 € brutto

export function kleinbetragsrechnung(bruttoCent) {
  const klein = Number(bruttoCent) <= KLEINBETRAG_GRENZE_CENT;
  // Pflichtangaben einer Kleinbetragsrechnung (vereinfacht ggü. §14 Abs.4 UStG).
  const pflichtKlein = ['Name+Anschrift leistender Unternehmer', 'Ausstellungsdatum',
    'Menge/Art der Leistung', 'Entgelt + Steuer in einer Summe', 'Steuersatz (bzw. Hinweis Steuerbefreiung)'];
  const pflichtVoll = [...pflichtKlein.slice(0, 3), 'Name+Anschrift Leistungsempfänger',
    'Steuernummer/USt-IdNr. des Ausstellers', 'fortlaufende Rechnungsnummer',
    'Entgelt netto + Steuerbetrag getrennt', 'Steuersatz', 'Leistungszeitpunkt'];
  return { kleinbetrag: klein, grenzeCent: KLEINBETRAG_GRENZE_CENT, pflichtangaben: klein ? pflichtKlein : pflichtVoll };
}

// ---- Geschenkegrenze (§4 Abs.5 Nr.1 EStG): seit 2024 50 € netto je Empfänger/Jahr ----
export const GESCHENK_GRENZE_CENT = 5000; // 50 € netto

export function geschenkAbzug(nettoCent) {
  const n = Number(nettoCent) || 0;
  const abzugsfaehig = n <= GESCHENK_GRENZE_CENT;
  return {
    abzugsfaehig,
    grenzeCent: GESCHENK_GRENZE_CENT,
    vorsteuerAbzug: abzugsfaehig, // bei nicht abzugsfähigem Geschenk auch kein Vorsteuerabzug
    kontoVorschlag: abzugsfaehig ? '4630' : '4635',
    hinweis: abzugsfaehig
      ? 'Bis 50 € netto je Empfänger/Jahr abzugsfähig (Aufzeichnungspflicht beachten).'
      : 'Über 50 € netto: NICHT als Betriebsausgabe abzugsfähig; auch kein Vorsteuerabzug.',
  };
}

// ---- Bewirtung 70/30 (§4 Abs.5 Nr.2 EStG): 70 % abzugsfähig, Vorsteuer zu 100 % ----
export const BEWIRTUNG_ABZUG_QUOTE = 0.7;

/**
 * Baut die Buchungszeilen einer angemessenen Geschäfts-Bewirtung:
 *   70 % Netto → abzugsfähig (4650), 30 % Netto → nicht abzugsfähig (4654),
 *   Vorsteuer 100 % (1576), Gegenkonto (Bank/Kasse) brutto im Haben.
 * @param opts.nettoCents (Integer) ODER opts.netto (Euro-Eingabe)
 * @param opts.ustSatz 0|7|19 (i.d.R. 19)
 * @param opts.gegenKonto Bank/Kasse (Haben)
 * @param opts.abzugKonto (Default 4650), opts.nichtAbzugKonto (Default 4654), opts.vorsteuerKonto (Default 1576)
 * @returns {{netto, steuer, brutto, abzugsfaehig, nichtAbzugsfaehig, zeilen}}
 */
export function bewirtungAufteilung(opts) {
  const netto = Number.isInteger(opts.nettoCents) ? opts.nettoCents : parseEuroToCents(opts.netto);
  if (!Number.isInteger(netto) || netto <= 0) throw new Error('Ungültiger Nettobetrag');
  const satz = Number(opts.ustSatz) || 0;
  const steuer = Math.round((netto * satz) / 100);
  const abzug = Math.round(netto * BEWIRTUNG_ABZUG_QUOTE);
  const nichtAbzug = netto - abzug; // Restbetrag → Rundung sauber
  const brutto = netto + steuer;
  const zeilen = [
    { konto: opts.abzugKonto || '4650', seite: 'S', betrag: abzug },
    { konto: opts.nichtAbzugKonto || '4654', seite: 'S', betrag: nichtAbzug },
    { konto: opts.gegenKonto, seite: 'H', betrag: brutto },
  ];
  if (steuer > 0) zeilen.splice(2, 0, { konto: opts.vorsteuerKonto || '1576', seite: 'S', betrag: steuer });
  return { netto, steuer, brutto, abzugsfaehig: abzug, nichtAbzugsfaehig: nichtAbzug, zeilen };
}
