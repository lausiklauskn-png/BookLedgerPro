// src/ai/extract.js
// Heuristische Extraktion von Buchungs-Feldern aus Beleg-TEXT (rein, testbar).
// Quelle des Textes: eingefügt/abgetippt ODER aus Google Vision EU (ai/vision.js).
// Dieses Modul kennt keine KI — nur robuste Regex-Heuristik.

import { parseEuroToCents } from '../domain/money.js';
import { erkenneAbsender, absenderAusGruss } from '../vendor/sortierkern/erkennen.js';
import { nummerAb } from '../domain/auszugText.js';
import { vorschauAn } from '../domain/vorschau.js';

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

// Aussteller: zuerst der Sortier-Kern des Datei-Organizers (Briefkopf, Rechtsform, Grußzeile; gemessen an fremden Belegen
// 44 % → 84–96 %), sonst wie bisher die erste Zeile mit Buchstaben. Kern byte-gleich mit Pin (src/vendor/sortierkern/).
function findeVendor(text) {
  try {
    const k = erkenneAbsender(text.slice(0, 1500)) || absenderAusGruss(text);
    if (k && k.wert && k.wert !== 'unbekannt') return String(k.wert).slice(0, 80);
  } catch { /* Kern nicht lesbar: alter Weg */ }
  return ersteZeile(text);
}

function ersteZeile(text) {
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

// Rechnungs-/Beleg-/Invoice-Nummer: nur hinter einer ausdrücklichen Bezeichnung. Gewicht 3 = „…nummer/Nr.“,
// 2 = Rechnungsart mit Nummer („Rechnung AZ-250518“, „Beitragsrechnung B-2025-0417“). Kunden-, Vertrags-, Auftrags-,
// Steuer-, Mandats- und Mitgliedsnummern haben eigene Bezeichnungen und werden darum nie genommen.
const RNR_MARKE = [
  { w: 3, re: /(?<![A-Za-zÄÖÜäöüß-])(?:rechnungs-?\s?(?:nummer|nr\.?)|rechnung\s?-?\s?nr\.?|rg\.?\s?-?\s?nr\.?|re\.?\s?-?\s?nr\.?|beleg-?\s?(?:nummer|nr\.?)|gutschrifts?-?\s?(?:nummer|nr\.?)|invoice\s?(?:no\.?|number|nr\.?|#)|rechnung\s?#)(?:\s?\/\s?[A-Za-zäöü.-]+)?/gi },
  { w: 3, re: /(?<![A-Za-zÄÖÜäöüß-])(?:quittungs?-?\s?(?:nummer|nr\.?))/gi },
  { w: 2, re: /(?<![A-Za-zÄÖÜäöüß-])(?:(?:beitrags|schluss|abschlags|teil|jahres|sammel|gebühren|gebuehren|honorar|korrektur|storno)?rechnung|gutschrift|invoice|(?:gebühren|gebuehren)?quittung)(?![A-Za-zäöüß])/gi },
];
// Steht davor „zu/aus/abzüglich …“, ist es der Verweis auf einen ANDEREN Beleg.
const RNR_VERWEIS = /(?:\bzu|\bzur|\bzum|\baus|abzgl\.?|abzüglich|abzueglich|bezüglich|bezueglich|betr\.?|betreff|gemäß|gemaess|laut|\blt\.?|siehe|ersetzt|storniert)\s*$/i;
// Kurzer Vorsatz mit Leerzeichen vor der Nummer: „R 26-014“, „RE 2026 0087“, „Rg 2026-031“.
const RNR_VORSATZ = /^([A-Z][A-Za-z]{0,2})\s(?=\d)/;
const KEIN_VORSATZ = /^(?:nr|no|kd|eur|vom|von|für|zum|zur|am|im|per|mai|jan|feb|mär|apr|jun|jul|aug|sep|okt|nov|dez|q)$/i;

function nummerHier(zeile, ab) {
  const rest = zeile.slice(ab);
  const v = rest.match(RNR_VORSATZ);
  if (v && !KEIN_VORSATZ.test(v[1])) {
    const n = nummerAb(zeile, ab + v[0].length);
    if (n) return { n: `${v[1]} ${n}`, ende: ab + v[0].length + n.length };
  }
  const n = nummerAb(zeile, ab);
  return n ? { n, ende: ab + n.length } : null;
}

function findeRechnungsnummer(text) {
  const zeilen = text.split(/\r?\n/);
  const funde = [];
  zeilen.forEach((zeile, nr) => {
    for (const { w, re } of RNR_MARKE) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(zeile))) {
        if (RNR_VERWEIS.test(zeile.slice(0, m.index))) continue;
        const ab = m.index + m[0].length;
        const rest = zeile.slice(ab);
        // „Rechnung / Quittung Nr. 25-0719“, „Beitragsrechnung Nr. BR-7741902“, „QUITTUNG      Nr. 3/2026“
        const vorlauf = rest.match(/^\s{0,3}(?:\/\s?[A-Za-zÄÖÜäöü]+\s?)?(?:\s{0,60}(?:nr|no|nummer)\.?\s?)?[:.#]?\s{0,12}/i)[0];
        const hier = nummerHier(zeile, ab + vorlauf.length);
        let nrText = hier ? hier.n : '';
        if (hier && /^,\d{2}\b/.test(zeile.slice(hier.ende))) nrText = '';                // ein Betrag („Rechnung: 3.960,00“)
        // Bezeichnung am Zeilenende, Nummer darunter (Tabellenkopf „Rechnungsnummer   Datum“ / Wert in der nächsten Zeile).
        if (!nrText && w === 3 && /^\s*[:.]?\s*$/.test(rest) && zeilen[nr + 1] != null) {
          const naechste = zeilen[nr + 1];
          const start = naechste.search(/\S/);
          if (start >= 0) nrText = nummerAb(naechste, start);
        }
        if (!nrText && w === 3 && /^\s{2,}[A-Za-zÄÖÜäöü]/.test(rest)) {
          // Tabellenkopf mit mehreren Bezeichnungen: Nummer in der nächsten Zeile unter der Spalte.
          const naechste = zeilen[nr + 1] || '';
          const spalte = m.index;
          const teil = naechste.slice(Math.max(0, spalte - 2));
          const start = teil.search(/\S/);
          if (start >= 0 && start <= 4) nrText = nummerAb(teil, start);
        }
        if (!nrText) continue;
        const n = nrText.trim().replace(/[-\/.,;:]+$/, '');
        if ((n.match(/\d/g) || []).length < 3) continue;
        if (/^\d{1,2}\.\d{1,2}\.(\d{2,4})?$/.test(n) || /^(19|20)\d{2}$/.test(n)) continue;   // Datum oder nur ein Jahr
        if (/^\d{1,3}(?:\.\d{3})*(?:,\d{2})?$/.test(n) && /[.,]/.test(n)) continue;        // ein Betrag
        if (/^[A-Za-z]+\s(19|20)\d{2}$/.test(n)) continue;                                // „Mai 2026“
        funde.push({ n, w, nr });
      }
    }
  });
  if (!funde.length) return null;
  const besteW = Math.max(...funde.map((f) => f.w));
  const kandidaten = [...new Set(funde.filter((f) => f.w === besteW).map((f) => f.n.replace(/\s/g, '').toUpperCase()))];
  if (kandidaten.length !== 1) return null;                 // widersprüchlich → lieber leer als falsch
  return funde.find((f) => f.w === besteW).n;
}

/**
 * Extrahiert Felder aus Beleg-Text.
 * `rechnungsnummer` nur, wenn sie ausdrücklich als Rechnungs-/Beleg-/Invoice-Nummer bezeichnet ist (sonst null).
 * @returns {{betragBrutto:?number, datum:?string, ustSatz:?number, vendor:?string, rechnungsnummer:?string, confidence:number}}
 */
export function extractFromText(text) {
  const safe = String(text || '');
  const brutto = findeBrutto(safe);
  const datum = findeDatum(safe);
  const ustSatz = findeUstSatz(safe);
  const vendor = findeVendor(safe);
  const rechnungsnummer = vorschauAn('rechnungsnummer') ? findeRechnungsnummer(safe) : null;

  let confidence = 0;
  if (brutto.cents != null) confidence += brutto.viaKeyword ? 0.5 : 0.25;
  if (datum) confidence += 0.2;
  if (ustSatz != null) confidence += 0.2;
  if (vendor) confidence += 0.1;
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  return { betragBrutto: brutto.cents, datum, ustSatz, vendor, rechnungsnummer, confidence };
}
