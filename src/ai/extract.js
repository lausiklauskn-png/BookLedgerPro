// src/ai/extract.js
// Heuristische Extraktion von Buchungs-Feldern aus Beleg-TEXT (rein, testbar).
// Quelle des Textes: eingefügt/abgetippt ODER aus Google Vision EU (ai/vision.js).
// Dieses Modul kennt keine KI — nur robuste Regex-Heuristik.

import { parseEuroToCents } from '../domain/money.js';

const BETRAG_RE = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g;
const SUMMEN_KEYWORDS = /(gesamt|summe|rechnungsbetrag|zu\s*zahlen|zahlbetrag|brutto|endbetrag|total)/i;

/** Findet alle deutschen Geldbeträge mit Zeilenkontext. */
function findeBetraege(text) {
  const out = [];
  for (const zeile of text.split(/\r?\n/)) {
    let m;
    BETRAG_RE.lastIndex = 0;
    while ((m = BETRAG_RE.exec(zeile))) {
      const cents = parseEuroToCents(m[0]);
      if (Number.isInteger(cents) && cents > 0) out.push({ cents, zeile });
    }
  }
  return out;
}

/** Wählt den Bruttobetrag: bevorzugt Summen-Zeilen, sonst größter Betrag. */
function findeBrutto(text) {
  const alle = findeBetraege(text);
  if (!alle.length) return { cents: null, viaKeyword: false };
  const ausSummen = alle.filter((a) => SUMMEN_KEYWORDS.test(a.zeile));
  if (ausSummen.length) {
    const max = ausSummen.reduce((a, b) => (b.cents > a.cents ? b : a));
    return { cents: max.cents, viaKeyword: true };
  }
  const max = alle.reduce((a, b) => (b.cents > a.cents ? b : a));
  return { cents: max.cents, viaKeyword: false };
}

const MONATE = { januar: 1, jan: 1, februar: 2, feb: 2, 'märz': 3, maerz: 3, mrz: 3, 'mär': 3, april: 4, apr: 4, mai: 5, juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9, sept: 9, sep: 9, oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12 };
const MONAT_RE = Object.keys(MONATE).sort((x, y) => y.length - x.length).join('|');
// Alle Schreibweisen eines Datums: 2026-03-08 · 8.3.2026 · 08.03.26 · 8. März 2026 · 8. Mrz. 26
const DATUM_RE = new RegExp(`(?<![\\d.])(?:(\\d{4})-(\\d{2})-(\\d{2})|(\\d{1,2})\\.\\s?(\\d{1,2})\\.\\s?(\\d{4}|\\d{2})|(\\d{1,2})\\.?\\s?(${MONAT_RE})\\.?\\s?(\\d{4}|\\d{2}))(?![\\d])`, 'gi');
// Was unmittelbar vor einem Datum steht, sagt, was es ist.
const DATUM_BELEG = /(rechnungsdatum|belegdatum|ausstellungsdatum|bondatum|abrechnungsdatum|ausgestellt am|erstellt am|ausführung am|ausgeführt am|buchungstag|(?:^|\s)datum|(?:rechnung|gutschrift|quittung|beleg|bescheid|abrechnung|mahnung|nachtrag)\b[^\n]{0,40}\bvom|(?:^|\s)den)\W*$/i;
const DATUM_ANDERES = /(fällig|zahlbar|bis zum|bis|spätestens|liefer\w*|leistungs\w*|zeitraum|termin|eintritt|übergabe|abholung|anreise|abreise|geb\.|geboren|gültig\w*|valuta|wertstellung|beginn|ablauf|ende|von|–|-|vereinbarung vom|vertrag vom|bestellung vom|auftrag vom|schreiben vom|angebot vom|kündigung zum|zum|ab|seit|am)\W*$/i;

function datumAus(m) {
  let y, mo, d;
  if (m[1]) [y, mo, d] = [m[1], Number(m[2]), Number(m[3])];
  else if (m[4]) [d, mo, y] = [Number(m[4]), Number(m[5]), m[6]];
  else [d, mo, y] = [Number(m[7]), MONATE[m[8].toLowerCase()], m[9]];
  if (y.length === 2) y = (Number(y) > 70 ? '19' : '20') + y;
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Alle Daten im Text mit einer Wertung: Belegdatum hoch, Fälligkeit/Lieferung/Zeitraum niedrig; bei Gleichstand gewinnt das erste. */
export function findeDaten(text) {
  const out = [];
  const zeilen = text.split(/\r?\n/);
  zeilen.forEach((zeile, nr) => {
    DATUM_RE.lastIndex = 0;
    let m, ende = 0;
    while ((m = DATUM_RE.exec(zeile))) {
      const iso = datumAus(m);
      const davor = zeile.slice(ende, m.index);
      ende = m.index + m[0].length;
      if (!iso) continue;
      let wert = 0;
      if (DATUM_BELEG.test(davor)) wert += 10;
      else if (DATUM_ANDERES.test(davor)) wert -= 6;
      if (/zeitraum|von\b.*\bbis|\d\s*[–-]\s*$/i.test(davor) || /^\s*(?:[–-]|bis)\s*\d/.test(zeile.slice(ende))) wert -= 6;   // Teil einer Spanne
      out.push({ iso, wert, zeile: nr });
    }
  });
  return out;
}

function findeDatum(text) {
  const alle = findeDaten(text);
  if (!alle.length) return null;
  return alle.reduce((a, b) => (b.wert > a.wert ? b : a)).iso;
}

const SATZ_RE = /(?<![\d,.])(19|7)(?:[.,]0{1,2})?\s?%/g;
const BETRAG_IN_ZEILE = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g;
// Prozentangaben, die kein Umsatzsteuersatz sind
const KEIN_UST_SATZ = /(versicherungs?teuer|skonto|rabatt|nachlass|zins|abzugsfähig|anteil|disagio|provision von|provisionssatz)/i;
const STEUERFREI = /(umsatzsteuerfrei|steuerfrei|steuerbefreit|nicht\s+(?:umsatz)?steuerbar|unterliegt\s+nicht\s+der\s+umsatzsteuer|keine\s+umsatzsteuer|ohne\s+umsatzsteuer|kein\s+ausweis\s+der\s+umsatzsteuer|kleinunternehmer|§\s*19\s*ustg|§\s*4\s*nr|reverse[\s-]?charge|steuerschuldnerschaft|(?<![\d,.])0\s*%\s*(mwst|ust|umsatzsteuer))/i;

/** USt-Satz des Belegs: 19 oder 7 (bei zwei Sätzen der mit dem größeren Betrag), 0 bei ausdrücklich steuerfrei, sonst null. */
function findeUstSatz(text) {
  const summe = { 19: 0, 7: 0 }, zahl = { 19: 0, 7: 0 };
  for (const zeile of text.split(/\r?\n/)) {
    if (KEIN_UST_SATZ.test(zeile)) continue;
    const treffer = [...zeile.matchAll(SATZ_RE)];
    treffer.forEach((m, i) => {
      const satz = Number(m[1]);
      zahl[satz]++;
      const bis = i + 1 < treffer.length ? treffer[i + 1].index : zeile.length;
      const von = i > 0 ? treffer[i - 1].index + treffer[i - 1][0].length : 0;
      const danach = zeile.slice(m.index + m[0].length, bis).match(BETRAG_IN_ZEILE);
      const betraege = danach || zeile.slice(von, m.index).match(BETRAG_IN_ZEILE) || [];
      summe[satz] += betraege.reduce((s, b) => Math.max(s, parseEuroToCents(b) || 0), 0);
    });
  }
  if (zahl[19] || zahl[7]) {
    if (zahl[19] && zahl[7]) {
      if (summe[19] !== summe[7]) return summe[19] > summe[7] ? 19 : 7;
      return zahl[7] > zahl[19] ? 7 : 19;
    }
    return zahl[19] ? 19 : 7;
  }
  if (STEUERFREI.test(text)) return 0;
  return null;
}

function findeVendor(text) {
  for (const zeile of text.split(/\r?\n/)) {
    const t = zeile.trim();
    if (t.length < 3) continue;
    if (!/[A-Za-zÀ-ÿ]{2,}/.test(t)) continue;          // muss Buchstaben enthalten
    if (/^\d{1,2}\.\d{1,2}\.\d{2,4}/.test(t)) continue;  // keine Datumszeile
    if (/^(rechnung|invoice|beleg|quittung)\b/i.test(t)) continue;
    return t.slice(0, 80);
  }
  return null;
}

/**
 * Extrahiert Felder aus Beleg-Text.
 * @returns {{betragBrutto:?number, datum:?string, ustSatz:?number, vendor:?string, confidence:number}}
 */
export function extractFromText(text) {
  const safe = String(text || '');
  const brutto = findeBrutto(safe);
  const datum = findeDatum(safe);
  const ustSatz = findeUstSatz(safe);
  const vendor = findeVendor(safe);

  let confidence = 0;
  if (brutto.cents != null) confidence += brutto.viaKeyword ? 0.5 : 0.25;
  if (datum) confidence += 0.2;
  if (ustSatz != null) confidence += 0.2;
  if (vendor) confidence += 0.1;
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  return { betragBrutto: brutto.cents, datum, ustSatz, vendor, confidence };
}
