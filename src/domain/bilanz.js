// src/domain/bilanz.js
// B2 — Gewinn- und Verlustrechnung (GuV) für den Betriebsvermögensvergleich
// (Bilanzierung, §4 Abs.1 / §5 EStG). Reine, node-getestete Logik.
//
// Die GuV verdichtet die ERFOLGSKONTEN (Aufwand/Ertrag) je Periode zu zwei
// Listen — Erträge und Aufwendungen — und bildet den Jahresüberschuss bzw.
// -fehlbetrag = Σ Erträge − Σ Aufwendungen. Die Salden werden über die
// Mehrungsseite des Kontos gebildet (accounts.saldo): Erträge mehren im Haben,
// Aufwendungen im Soll. Bestandskonten (Bilanz, B3) bleiben außen vor.
//
// EHRLICHE GRENZE: Dies ist eine GuV im Gesamtkostenverfahren-Sinn (Konten je
// Posten), KEINE amtliche Gliederung nach §275 HGB, kein Konzernabschluss und
// keine E-Bilanz-Taxonomie. Vor produktivem Einsatz mit Berater abgleichen.

import { saldo } from './accounts.js';
import { istErfolgskonto, guvSeite } from './bilanzierung.js';
import { kontoBewegungen } from './taxes.js';

/**
 * Gewinn- und Verlustrechnung: Erträge/Aufwendungen aus den Erfolgskonten je
 * Periode, gegliedert nach GuV-Seite, plus Jahresüberschuss/-fehlbetrag.
 * @param {Array} buchungen - alle Buchungen (nur festgeschriebene zählen)
 * @param {Object} kontoIndex - Kontonummer → Konto ({art,name,...})
 * @param {{von?:string,bis?:string}} [periode]
 * @returns {{ertraege:Array, aufwendungen:Array, summeErtraege:number,
 *            summeAufwendungen:number, jahresueberschuss:number}}
 */
export function gewinnUndVerlust(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  const ertraege = [];
  const aufwendungen = [];
  for (const [nr, m] of Object.entries(bew)) {
    const konto = kontoIndex[nr];
    if (!konto || !istErfolgskonto(konto.art)) continue;
    // Saldo im Sinne der Mehrungsseite: Ertrag = Haben−Soll, Aufwand = Soll−Haben.
    const wert = saldo(konto.art, m);
    if (wert === 0) continue;
    const zeile = { nummer: nr, name: konto.name, wert };
    if (guvSeite(konto.art) === 'ertrag') ertraege.push(zeile);
    else aufwendungen.push(zeile);
  }
  const nachNummer = (a, b) => a.nummer.localeCompare(b.nummer);
  ertraege.sort(nachNummer);
  aufwendungen.sort(nachNummer);
  const summeErtraege = ertraege.reduce((s, r) => s + r.wert, 0);
  const summeAufwendungen = aufwendungen.reduce((s, r) => s + r.wert, 0);
  return {
    ertraege,
    aufwendungen,
    summeErtraege,
    summeAufwendungen,
    jahresueberschuss: summeErtraege - summeAufwendungen,
  };
}
