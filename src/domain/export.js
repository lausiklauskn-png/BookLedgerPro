// src/domain/export.js
// Export-Aufbereitung (rein, testbar): Buchungsjournal-CSV, DATEV-orientierte CSV,
// USt-Voranmeldung-Kennzahlen, EÜR-CSV.
//
// EHRLICHER HINWEIS: Die DATEV-Ausgabe ist DATEV-ORIENTIERT (klar dokumentierte
// Spalten), KEIN zertifiziertes EXTF-Format mit Steuerschlüssel-Mapping. Vor Übergabe
// an den Steuerberater prüfen. ELSTER-Einreichung erfolgt NICHT — es wird nur ein
// USt-VA-Datenpaket (amtliche Kennzahlen) erzeugt.

import { KONTOART, isVorsteuerKonto, isUmsatzsteuerKonto } from './accounts.js';
import { kontoBewegungen } from './taxes.js';

/** Cent → "1234,56" (Dezimalkomma, ohne Tausendertrenner) für CSV. */
export function centsToComma(cents) {
  return ((cents || 0) / 100).toFixed(2).replace('.', ',');
}

/** Ein CSV-Feld escapen (Semikolon-getrennt, deutsche Konvention). */
function csvField(v) {
  const s = v == null ? '' : String(v);
  return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvRow(fields) { return fields.map(csvField).join(';'); }
function csv(rows) { return rows.map(csvRow).join('\r\n'); }

function sortFest(buchungen) {
  return [...buchungen].sort((a, b) => {
    const sa = a.seq == null ? Infinity : a.seq, sb = b.seq == null ? Infinity : b.seq;
    return sa - sb;
  });
}

/** Buchungsjournal: eine Zeile je Buchungs-Zeile. */
export function buildLedgerCsv(buchungen, kontoIndex) {
  const rows = [['Datum', 'Nr', 'Buchungstext', 'Konto', 'Kontoname', 'Soll', 'Haben', 'Kostenstelle', 'Status']];
  for (const b of sortFest(buchungen)) {
    for (const z of b.zeilen || []) {
      const k = kontoIndex[z.konto];
      rows.push([
        b.datum, b.seq ?? '', b.beschreibung || '', z.konto, k ? k.name : '',
        z.seite === 'S' ? centsToComma(z.betrag) : '',
        z.seite === 'H' ? centsToComma(z.betrag) : '',
        b.kostenstelle || '', b.status,
      ]);
    }
  }
  return csv(rows);
}

/** DATEV-orientierter Buchungsstapel (nur festgeschriebene). */
export function buildDatevCsv(buchungen, kontoIndex) {
  const rows = [['Umsatz', 'SH', 'Konto', 'Gegenkonto', 'Belegdatum', 'Belegfeld1', 'Buchungstext', 'Kostenstelle']];
  for (const b of sortFest(buchungen)) {
    if (b.seq == null) continue; // nur festgeschriebene exportieren
    const zeilen = b.zeilen || [];
    if (zeilen.length === 2) {
      const soll = zeilen.find((z) => z.seite === 'S');
      const haben = zeilen.find((z) => z.seite === 'H');
      rows.push([centsToComma(soll.betrag), 'S', soll.konto, haben.konto, b.datum, b.seq, b.beschreibung || '', b.kostenstelle || '']);
    } else {
      // Mehrzeilig (z.B. mit USt-Split): je Zeile eine DATEV-Zeile, Gegenkonto leer.
      for (const z of zeilen) {
        rows.push([centsToComma(z.betrag), z.seite, z.konto, '', b.datum, b.seq, b.beschreibung || '', b.kostenstelle || '']);
      }
    }
  }
  return csv(rows);
}

/**
 * USt-Voranmeldung: amtliche Kennzahlen (Bemessungsgrundlagen + Steuer + Vorsteuer).
 * Kz 81 = Umsätze 19 %, Kz 86 = Umsätze 7 %, Kz 66 = Vorsteuer, Kz 83 = Zahllast.
 * Alle Werte in Cent.
 */
export function buildUstVa(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  let kz81 = 0, kz86 = 0, kz81Steuer = 0, kz86Steuer = 0, kz66 = 0;
  for (const [nr, m] of Object.entries(bew)) {
    const k = kontoIndex[nr];
    if (!k) continue;
    if (k.art === KONTOART.ERTRAG) {
      const netto = m.haben - m.soll;
      if (k.ust === 19) kz81 += netto;
      else if (k.ust === 7) kz86 += netto;
    } else if (isUmsatzsteuerKonto(k)) {
      const steuer = m.haben - m.soll;
      if (k.ust === 19) kz81Steuer += steuer;
      else if (k.ust === 7) kz86Steuer += steuer;
    } else if (isVorsteuerKonto(k)) {
      kz66 += m.soll - m.haben;
    }
  }
  const kz83 = kz81Steuer + kz86Steuer - kz66;
  return { kz81, kz81Steuer, kz86, kz86Steuer, kz66, kz83 };
}

export function ustVaToCsv(va) {
  return csv([
    ['Kennzahl', 'Bezeichnung', 'Betrag'],
    ['81', 'Bemessungsgrundlage Umsätze 19 %', centsToComma(va.kz81)],
    ['', 'darauf Umsatzsteuer 19 %', centsToComma(va.kz81Steuer)],
    ['86', 'Bemessungsgrundlage Umsätze 7 %', centsToComma(va.kz86)],
    ['', 'darauf Umsatzsteuer 7 %', centsToComma(va.kz86Steuer)],
    ['66', 'Vorsteuerbeträge', centsToComma(va.kz66)],
    ['83', 'Verbleibende USt-Vorauszahlung (Zahllast)', centsToComma(va.kz83)],
  ]);
}

export function eurToCsv(eur) {
  const rows = [['Art', 'Konto', 'Bezeichnung', 'Betrag']];
  for (const e of eur.einnahmenKonten || []) rows.push(['Einnahme', e.nummer, e.name, centsToComma(e.wert)]);
  for (const a of eur.ausgabenKonten || []) rows.push(['Ausgabe', a.nummer, a.name, centsToComma(a.wert)]);
  rows.push(['', '', 'Summe Einnahmen (netto)', centsToComma(eur.einnahmen)]);
  rows.push(['', '', 'Summe Ausgaben (netto)', centsToComma(eur.ausgaben)]);
  rows.push(['', '', 'Überschuss', centsToComma(eur.ueberschuss)]);
  return csv(rows);
}
