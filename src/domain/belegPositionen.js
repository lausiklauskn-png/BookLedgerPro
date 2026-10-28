// domain/belegPositionen.js — Rechnungs-/Bon-Positionen aus dem erkannten Text (Klaus 2026-10-26, Steuer-Plan S1).
//
// „einzelne Werte auslesen … Komponenten werden ausgeschlossen oder eingeschlossen" — hier der erste Schritt: aus
// dem Belegtext (Textebene oder OCR) die Zeilen „Bezeichnung · Menge · Einzelpreis · Betrag · USt" lesen und gegen
// die Summenzeile prüfen. Ein-/Ausschließen und Zweck (S2) kommen später am selben Datensatz.
// Reine Rechnung, kein DOM; ohne KI. Benannte Grenzen: mehrzeilige Positionen, Pfand/Rabatt-Zeilen und Zeilen ohne
// Betrag werden nicht als Position gelesen; Kassenbon-Kennzeichen A/B stehen als `kz`, ein USt-Satz nur bei „19 %".

const BETRAG = '(-?\\d{1,3}(?:[.\\s]\\d{3})*,\\d{2}|-?\\d+\\.\\d{2})';
const ZEILE_BETRAG = new RegExp(BETRAG + '\\s*(?:€|EUR|Euro)?\\s*(?:([AB12])\\b|(\\d{1,2})\\s?%)?\\s*\\*?\\s*$', 'i');
const MENGE_VORN = /^(\d+(?:[.,]\d+)?)\s*(?:x|×|St(?:ü|ue)ck|Stk\.?|Stck\.?)\s+/i;
const MENGE_MAL = new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(?:x|×)\\s*' + BETRAG + '\\s*(?:€|EUR)?');
const SUMME = /\b(zu zahlen|gesamtbetrag|gesamtsumme|gesamt|rechnungsbetrag|endbetrag|summe|total|brutto)\b/i;
const NETTO = /\b(netto|nettobetrag|nettosumme|zwischensumme)/i;
// Englische Rechnungen (Stripe & Co., Klaus' Anthropic-Beleg 2026-10-28): „Subtotal"/„Total excluding tax" sind netto und
// stehen VOR der Summenprüfung (sonst griffe „total"); „VAT"/„Tax"/„Amount paid/due" sind keine Positionen.
const NETTO_EN = /\b(subtotal|sub-total|total excl(?:uding|\.)?\s+(?:tax|vat)|net amount|amount excl(?:uding|\.)?\s+(?:tax|vat))\b/i;
const NICHT_POSITION_EN = /\b(vat|tax|sales tax|amount paid|amount due|balance due|amount remaining|paid|due)\b/i;
const NICHT_POSITION = /\b(zwischensumme|netto|mwst|ust|umsatzsteuer|steuer|rückgeld|rueckgeld|trinkgeld|skonto|iban|bic|kundennr|kunden-nr|rechnungsnr|rechnungs-nr|datum|seite|telefon|tel\.|fax)|\b(gegeben|bar|ec|karte|kartenzahlung)\b/i;
const POS_NUMMER = /^\d{1,3}[.)]?\s+(?=[A-Za-zÄÖÜäöüß])/;

export function centsVon(s) {
  const t = String(s || '').trim().replace(/\s/g, '');
  if (/^-?\d+\.\d{2}$/.test(t)) return Math.round(Number(t) * 100);
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/**
 * @param {string} text  erkannter Belegtext
 * @returns {{positionen:Array<{zeile:number,beschreibung:string,menge:number,einzelpreisCent:number|null,betragCent:number,ustSatz:number|null,kz:string}>,
 *   summeCent:number, erkannteSummeCent:number|null, nettoCent:number|null, stimmt:boolean|null}}
 */
export function belegPositionen(text) {
  const zeilen = String(text || '').replace(/\r/g, '').split('\n');
  const positionen = [];
  let erkannteSumme = null, summeGewicht = 0, netto = null;
  zeilen.forEach((roh, i) => {
    const z = roh.replace(/\s+/g, ' ').trim();
    if (z.length < 3) return;
    const m = ZEILE_BETRAG.exec(z);
    if (!m) return;
    const betragCent = centsVon(m[1]);
    if (betragCent == null) return;
    const vorne = z.slice(0, m.index).trim();
    if (NETTO_EN.test(vorne)) { if (netto == null) netto = betragCent; return; }
    if (SUMME.test(vorne) && !MENGE_VORN.test(vorne)) {
      // Summenzeile: „zu zahlen"/„Gesamt"/„Brutto" schlagen „Summe"
      const g = /zu zahlen|gesamt|endbetrag|rechnungsbetrag|brutto|total/i.test(vorne) ? 2 : 1;
      if (g >= summeGewicht) { erkannteSumme = betragCent; summeGewicht = g; }
      return;
    }
    if (NETTO.test(vorne) && netto == null) { netto = betragCent; return; }
    if (NICHT_POSITION.test(vorne) || NICHT_POSITION_EN.test(vorne)) return;
    let beschreibung = vorne, menge = 1, einzelpreisCent = null;
    const mv = MENGE_VORN.exec(beschreibung);
    if (mv) { menge = Number(mv[1].replace(',', '.')) || 1; beschreibung = beschreibung.slice(mv[0].length); }
    else beschreibung = beschreibung.replace(POS_NUMMER, '');   // „1  Tasse …" = Positionsnummer, aber „3 x Milch" = Menge
    const mm = MENGE_MAL.exec(beschreibung);
    if (mm) { menge = Number(mm[1].replace(',', '.')) || menge; einzelpreisCent = centsVon(mm[2]); beschreibung = beschreibung.replace(mm[0], ''); }
    beschreibung = beschreibung.replace(/[\s.:\-–€$£]+$/g, '').replace(/^[\s.:\-–#*]+/g, '').trim();
    if (!/[A-Za-zÄÖÜäöüß]{2,}/.test(beschreibung)) return;   // nur Zahlen/Zeichen: keine Position
    const kz = m[2] ? m[2].toUpperCase() : '';
    const ustSatz = m[3] ? Number(m[3]) : null;
    if (einzelpreisCent == null && menge > 1 && betragCent % 1 === 0) einzelpreisCent = Math.round(betragCent / menge);
    positionen.push({ zeile: i + 1, beschreibung, menge, einzelpreisCent, betragCent, ustSatz: [0, 7, 19].includes(ustSatz) ? ustSatz : null, kz });
  });
  const summeCent = positionen.reduce((s, p) => s + p.betragCent, 0);
  // Die Positionen können netto (Rechnung) oder brutto (Kassenbon) sein — beides zählt als „stimmt".
  const ziele = [erkannteSumme, netto].filter((x) => x != null);
  const stimmt = !ziele.length || !positionen.length ? null : ziele.some((z) => Math.abs(summeCent - z) <= 2);
  return { positionen, summeCent, erkannteSummeCent: erkannteSumme, nettoCent: netto, stimmt };
}
