// src/domain/kassenbuch.js
// Kassenbuch / Eröffnungsbestände — reine, testbare Funktionen.
//
// GoBD-Kassenführung: chronologisch, fortlaufend, mit laufendem Kassenbestand und
// Kassenbericht (Anfangsbestand + Einnahmen − Ausgaben = Endbestand). Ein Kassenbestand
// darf NIE negativ werden — wird hier als Verstoß erkannt und gemeldet (nicht blockierend).
//
// EHRLICHER HINWEIS: Das Kassenbuch wird aus den festgeschriebenen Buchungen abgeleitet,
// die das Kassenkonto berühren. Eine zertifizierte TSE/Kassensicherungsverordnung
// (elektronische Registrierkasse) ist NICHT Gegenstand — dies ist ein offenes Kassenbuch.

// Gegenkonto für Anfangsbestände/Saldenvorträge (SKR03: 9000 Saldenvorträge Sachkonten).
export const SALDENVORTRAG_KONTO = '9000';
export const KASSE_KONTO = '1000';

function inPeriode(datum, periode) {
  if (!periode) return true;
  if (periode.von && datum < periode.von) return false;
  if (periode.bis && datum > periode.bis) return false;
  return true;
}

/**
 * Buchungszeilen für einen Anfangsbestand (Erststart/Jahresumbruch): Soll Geldkonto an
 * Haben Saldenvortrag. Reine Funktion.
 * @returns {{betrag:number, zeilen:Array}}
 */
export function anfangsbestandZeilen(kontoNr, betragCent, opts = {}) {
  if (!Number.isInteger(betragCent) || betragCent <= 0) throw new Error('Ungültiger Anfangsbestand');
  const gegen = opts.gegenkonto || SALDENVORTRAG_KONTO;
  return {
    betrag: betragCent,
    zeilen: [
      { konto: kontoNr, seite: 'S', betrag: betragCent },
      { konto: gegen, seite: 'H', betrag: betragCent },
    ],
  };
}

/**
 * Chronologische Kassen-Einträge aus den festgeschriebenen Buchungen, die das Kassenkonto
 * berühren. Soll am Kassenkonto = Einnahme (Zufluss), Haben = Ausgabe (Abfluss).
 * @returns {Array<{datum,seq,beschreibung,einnahme,ausgabe}>}
 */
export function kassenbuchEintraege(buchungen, kasseKonto = KASSE_KONTO, periode) {
  const eintraege = [];
  for (const b of buchungen) {
    if (b.seq == null) continue;            // nur festgeschriebene
    if (!inPeriode(b.datum, periode)) continue;
    let einnahme = 0, ausgabe = 0;
    for (const z of b.zeilen || []) {
      if (z.konto !== kasseKonto) continue;
      if (z.seite === 'S') einnahme += z.betrag; else ausgabe += z.betrag;
    }
    if (einnahme === 0 && ausgabe === 0) continue;
    eintraege.push({ datum: b.datum, seq: b.seq, beschreibung: b.beschreibung || '', einnahme, ausgabe });
  }
  eintraege.sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : a.seq - b.seq));
  return eintraege;
}

/**
 * Kassenbericht mit laufendem Bestand. Prüft die GoBD-Regel „Kasse nie negativ".
 * @returns {{anfangsbestand,summeEinnahmen,summeAusgaben,endbestand,zeilen,negativ,ersteNegative}}
 */
export function kassenbericht(eintraege, anfangsbestandCent = 0) {
  let bestand = anfangsbestandCent;
  let summeEinnahmen = 0, summeAusgaben = 0, negativ = false, ersteNegative = null;
  const zeilen = (eintraege || []).map((e) => {
    bestand += e.einnahme - e.ausgabe;
    summeEinnahmen += e.einnahme;
    summeAusgaben += e.ausgabe;
    if (bestand < 0 && !negativ) { negativ = true; ersteNegative = { datum: e.datum, seq: e.seq }; }
    return { ...e, bestand };
  });
  return {
    anfangsbestand: anfangsbestandCent, summeEinnahmen, summeAusgaben,
    endbestand: bestand, zeilen, negativ, ersteNegative,
  };
}
