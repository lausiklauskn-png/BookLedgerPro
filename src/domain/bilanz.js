// src/domain/bilanz.js
// B2 — Gewinn- und Verlustrechnung (GuV) und B3 — Bilanz für den
// Betriebsvermögensvergleich (Bilanzierung, §4 Abs.1 / §5 EStG). Reine,
// node-getestete Logik.
//
// Die GuV verdichtet die ERFOLGSKONTEN (Aufwand/Ertrag) je Periode zu zwei
// Listen — Erträge und Aufwendungen — und bildet den Jahresüberschuss bzw.
// -fehlbetrag = Σ Erträge − Σ Aufwendungen. Die Bilanz (B3) verdichtet die
// BESTANDSKONTEN (Aktiva/Passiva) zum Stichtag; der Jahresüberschuss aus den
// Erfolgskonten fließt als Ergebnis ins Eigenkapital (Passiva). Die Salden
// werden über die Mehrungsseite des Kontos gebildet (accounts.saldo).
//
// EHRLICHE GRENZE: GuV im Gesamtkostenverfahren-Sinn und Bilanz im Konten-Sinn
// (Salden je Konto), KEINE amtliche Gliederung nach §266/§275 HGB, kein
// Konzernabschluss und keine E-Bilanz-Taxonomie. Bestandskonten werden nach
// ihrer Kontoart einer Bilanzseite zugeordnet, NICHT nach Saldovorzeichen
// umgegliedert (ein Bankkonto im Soll-Minus bleibt auf der Aktivseite negativ).
// Vor produktivem Einsatz mit Berater abgleichen.

import { saldo } from './accounts.js';
import { istErfolgskonto, istBestandskonto, guvSeite, bilanzSeite } from './bilanzierung.js';
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

/**
 * Bilanz: Aktiva/Passiva aus den Bestandskonten-Salden zum Stichtag. Der
 * Jahresüberschuss/-fehlbetrag aus den Erfolgskonten (über denselben Zeitraum)
 * fließt als Ergebnis ins Eigenkapital → Passiva, sodass die Grundgleichung
 * Aktiva = Passiva (inkl. Ergebnis) erfüllt ist (Folge der doppelten
 * Buchführung). Eröffnungssalden — als gebuchter Saldenvortrag (Konto 9000)
 * ODER über den Parameter `eroeffnungssalden` — werden einbezogen.
 *
 * @param {Array} buchungen - alle Buchungen (nur festgeschriebene zählen)
 * @param {Object} kontoIndex - Kontonummer → Konto ({art,name,...})
 * @param {string} [stichtag] - 'YYYY-MM-DD'; nur Buchungen bis einschließlich
 *        Stichtag fließen ein (Bestand ist kumulativ, kein `von`).
 * @param {Object<string,number>} [eroeffnungssalden] - Kontonummer → Anfangs-
 *        bestand in Cent, im Sinne der Mehrungsseite (Aktivkonto: positiv =
 *        Sollbestand, Passivkonto: positiv = Habenbestand). Nur Bestandskonten;
 *        eine ausgeglichene Eröffnungsbilanz vorausgesetzt.
 * @returns {{stichtag:?string, aktiva:Array, passiva:Array, summeAktiva:number,
 *            summePassiva:number, jahresueberschuss:number,
 *            summePassivaMitErgebnis:number, bilanzsumme:number,
 *            differenz:number, ausgeglichen:boolean}}
 */
export function bilanz(buchungen, kontoIndex, stichtag, eroeffnungssalden) {
  const bew = kontoBewegungen(buchungen, stichtag ? { bis: stichtag } : undefined);
  const eb = eroeffnungssalden || {};
  // Bewegte Konten + Konten mit reinem Eröffnungssaldo (ohne Bewegung).
  const nummern = new Set([...Object.keys(bew), ...Object.keys(eb)]);

  const aktiva = [];
  const passiva = [];
  let jahresueberschuss = 0;
  for (const nr of nummern) {
    const konto = kontoIndex[nr];
    if (!konto) continue;
    const m = bew[nr] || { soll: 0, haben: 0 };
    if (istBestandskonto(konto.art)) {
      const wert = saldo(konto.art, m) + (eb[nr] || 0);
      if (wert === 0) continue;
      const zeile = { nummer: nr, name: konto.name, wert };
      if (bilanzSeite(konto.art) === 'aktiva') aktiva.push(zeile);
      else passiva.push(zeile);
    } else if (istErfolgskonto(konto.art)) {
      // Erfolgskonten erscheinen nicht als Posten, sondern als Ergebnis im EK.
      const wert = saldo(konto.art, m);
      if (guvSeite(konto.art) === 'ertrag') jahresueberschuss += wert;
      else jahresueberschuss -= wert;
    }
  }

  const nachNummer = (a, b) => a.nummer.localeCompare(b.nummer);
  aktiva.sort(nachNummer);
  passiva.sort(nachNummer);
  const summeAktiva = aktiva.reduce((s, r) => s + r.wert, 0);
  const summePassiva = passiva.reduce((s, r) => s + r.wert, 0);
  const summePassivaMitErgebnis = summePassiva + jahresueberschuss;
  return {
    stichtag: stichtag || null,
    aktiva,
    passiva,
    summeAktiva,
    summePassiva,
    jahresueberschuss,
    summePassivaMitErgebnis,
    bilanzsumme: summeAktiva,
    // 0 bei korrekter doppelter Buchführung + ausgeglichener Eröffnungsbilanz.
    differenz: summeAktiva - summePassivaMitErgebnis,
    ausgeglichen: summeAktiva === summePassivaMitErgebnis,
  };
}
