// src/ai/extract.js
// Heuristische Extraktion von Buchungs-Feldern aus Beleg-TEXT (rein, testbar).
// Quelle des Textes: eingefügt/abgetippt ODER aus Google Vision EU (ai/vision.js).
// Dieses Modul kennt keine KI — nur robuste Regex-Heuristik.

import { parseEuroToCents } from '../domain/money.js';

const BETRAG_RE = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g;
const SUMMEN_KEYWORDS = /(gesamt|summe|rechnungsbetrag|zu\s*zahlen|zahlbetrag|brutto|endbetrag|total)/i;
const DATUM_KEYWORDS = /(datum|rechnungsdatum|belegdatum|date)/i;

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

/** Normalisiert ein Datum (DD.MM.YYYY, DD.MM.YY, YYYY-MM-DD) zu YYYY-MM-DD. */
function normDatum(s) {
  let m = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
  if (m) {
    let [_, d, mo, y] = m;
    if (y.length === 2) y = (Number(y) > 70 ? '19' : '20') + y;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return null;
}

function findeDatum(text) {
  for (const zeile of text.split(/\r?\n/)) {
    if (DATUM_KEYWORDS.test(zeile)) { const d = normDatum(zeile); if (d) return d; }
  }
  return normDatum(text); // erstes plausibles Datum irgendwo
}

function findeUstSatz(text) {
  if (/19\s*%/.test(text)) return 19;
  if (/\b7\s*%/.test(text)) return 7;
  if (/(steuerfrei|kleinunternehmer|§\s*19|0\s*%\s*(mwst|ust))/i.test(text)) return 0;
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
