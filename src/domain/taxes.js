// src/domain/taxes.js
// Auswertungen: Kontensalden, USt-Voranmeldung, EÜR. Reine Funktionen über
// festgeschriebenen Buchungen (seq != null). Storno-Buchungen heben ihre
// Originale rechnerisch wieder auf, daher werden sie mitgezählt.
//
// EHRLICHER HINWEIS: `computeEUR` ist eine vereinfachte, periodengerechte Auswertung
// aus den Erfolgskonten (Aufwand/Ertrag). `computeEURIst` ist die strenge Zufluss-/
// Abfluss-EÜR nach §4 Abs.3 EStG (Ist-Prinzip, Bruttoverfahren) — Erfassung zum
// Geldfluss (Kasse/Bank), nicht zum Rechnungsdatum.

import { KONTOART, isVorsteuerKonto, isUmsatzsteuerKonto, isGeldKonto, isEigenkapitalKonto } from './accounts.js';

export const UST_SAETZE = [0, 7, 19];

function inPeriode(datum, periode) {
  if (!periode) return true;
  if (periode.von && datum < periode.von) return false;
  if (periode.bis && datum > periode.bis) return false;
  return true;
}

/** Bewegungssummen je Konto (Soll/Haben in Cent) über die festgeschriebenen Buchungen. */
export function kontoBewegungen(buchungen, periode) {
  const map = {};
  for (const b of buchungen) {
    if (b.seq == null) continue;            // nur festgeschriebene
    if (!inPeriode(b.datum, periode)) continue;
    for (const z of b.zeilen || []) {
      const m = map[z.konto] || (map[z.konto] = { soll: 0, haben: 0 });
      if (z.seite === 'S') m.soll += z.betrag; else m.haben += z.betrag;
    }
  }
  return map;
}

/** Saldenliste: je Konto Soll/Haben/Saldo (im Sinne der Mehrungsseite). */
export function saldenliste(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  const out = [];
  for (const [nr, m] of Object.entries(bew)) {
    const konto = kontoIndex[nr];
    const art = konto ? konto.art : null;
    const diff = m.soll - m.haben;
    const saldo = (art === KONTOART.AKTIV || art === KONTOART.AUFWAND) ? diff : -diff;
    out.push({ nummer: nr, name: konto ? konto.name : '(unbekannt)', art, soll: m.soll, haben: m.haben, saldo });
  }
  out.sort((a, b) => a.nummer.localeCompare(b.nummer));
  return out;
}

/** USt-Voranmeldung: Umsatzsteuer (Schuld), Vorsteuer, Zahllast — alles in Cent. */
export function computeUStVoranmeldung(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  let umsatzsteuer = 0, vorsteuer = 0;
  const perKonto = [];
  for (const [nr, m] of Object.entries(bew)) {
    const konto = kontoIndex[nr];
    if (isUmsatzsteuerKonto(konto)) {
      const wert = m.haben - m.soll;
      umsatzsteuer += wert;
      perKonto.push({ nummer: nr, name: konto.name, wert });
    } else if (isVorsteuerKonto(konto)) {
      const wert = m.soll - m.haben;
      vorsteuer += wert;
      perKonto.push({ nummer: nr, name: konto.name, wert });
    }
  }
  return { umsatzsteuer, vorsteuer, zahllast: umsatzsteuer - vorsteuer, perKonto };
}

/**
 * Strenge Ist-EÜR nach §4 Abs.3 EStG (Zufluss-/Abfluss-Prinzip), Bruttoverfahren.
 *
 * Betriebseinnahmen/-ausgaben werden im Moment des **Geldflusses** (Kasse/Bank) erfasst —
 * nicht zum Rechnungsdatum. Pro festgeschriebener Buchung mit Geldkonto-Beteiligung:
 *  - Netto-Geldzufluss (Soll Geld > Haben Geld) → die Gegenbuchungen erklären eine
 *    **Betriebseinnahme** (brutto: Erlös + vereinnahmte USt + getilgte Forderung).
 *  - Netto-Geldabfluss → die Gegenbuchungen erklären eine **Betriebsausgabe** (brutto:
 *    Aufwand + gezahlte Vorsteuer + USt-Vorauszahlung ans Finanzamt + getilgte Verbindlichkeit).
 *
 * Erfolgsneutral und damit NICHT gezählt: reine Geld-zu-Geld-Umbuchungen (z.B. Kasse↔Bank,
 * Netto-Geldfluss = 0) sowie Eigenkapital-/Privat-Zeilen (Privatentnahme/-einlage).
 *
 * EHRLICHE GRENZE: Bruttoverfahren-Standardfälle sind abgedeckt und Node-getestet. Die
 * Brutto-Positionen werden je Gegenkonto ausgewiesen (Erlös/USt getrennt); Sonderfälle
 * (Skonto-Splits, gemischte Zahlungen, anteilige Privatnutzung) sind nicht modelliert.
 */
export function computeEURIst(buchungen, kontoIndex, periode) {
  const einnahmenMap = {}, ausgabenMap = {};
  let einnahmen = 0, ausgaben = 0;
  for (const b of buchungen) {
    if (b.seq == null) continue;            // nur festgeschriebene
    if (!inPeriode(b.datum, periode)) continue;
    const zeilen = b.zeilen || [];
    let geldSoll = 0, geldHaben = 0;
    for (const z of zeilen) {
      if (isGeldKonto(kontoIndex[z.konto])) {
        if (z.seite === 'S') geldSoll += z.betrag; else geldHaben += z.betrag;
      }
    }
    const netto = geldSoll - geldHaben;     // > 0 Zufluss, < 0 Abfluss
    if (netto === 0) continue;              // kein Netto-Geldfluss → erfolgsneutral
    const einnahme = netto > 0;
    const map = einnahme ? einnahmenMap : ausgabenMap;
    for (const z of zeilen) {
      const k = kontoIndex[z.konto];
      if (isGeldKonto(k) || isEigenkapitalKonto(k)) continue; // Geld + Privat erfolgsneutral
      // Bei Einnahme zählt die Haben-Seite der Gegenkonten positiv, bei Ausgabe die Soll-Seite.
      const richtung = einnahme ? (z.seite === 'H' ? 1 : -1) : (z.seite === 'S' ? 1 : -1);
      const wert = z.betrag * richtung;
      const cur = map[z.konto] || (map[z.konto] = { nummer: z.konto, name: k ? k.name : '(unbekannt)', wert: 0 });
      cur.wert += wert;
      if (einnahme) einnahmen += wert; else ausgaben += wert;
    }
  }
  const einnahmenKonten = Object.values(einnahmenMap).filter((e) => e.wert !== 0).sort((a, b) => a.nummer.localeCompare(b.nummer));
  const ausgabenKonten = Object.values(ausgabenMap).filter((a) => a.wert !== 0).sort((a, b) => a.nummer.localeCompare(b.nummer));
  return { einnahmen, ausgaben, ueberschuss: einnahmen - ausgaben, einnahmenKonten, ausgabenKonten };
}

/** EÜR (vereinfacht): Einnahmen (Ertrag) − Ausgaben (Aufwand) = Überschuss. */
export function computeEUR(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  let einnahmen = 0, ausgaben = 0;
  const einnahmenKonten = [], ausgabenKonten = [];
  for (const [nr, m] of Object.entries(bew)) {
    const konto = kontoIndex[nr];
    if (!konto) continue;
    if (konto.art === KONTOART.ERTRAG) {
      const wert = m.haben - m.soll;
      einnahmen += wert;
      einnahmenKonten.push({ nummer: nr, name: konto.name, wert });
    } else if (konto.art === KONTOART.AUFWAND) {
      const wert = m.soll - m.haben;
      ausgaben += wert;
      ausgabenKonten.push({ nummer: nr, name: konto.name, wert });
    }
  }
  return { einnahmen, ausgaben, ueberschuss: einnahmen - ausgaben, einnahmenKonten, ausgabenKonten };
}
