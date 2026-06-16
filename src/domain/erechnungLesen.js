// src/domain/erechnungLesen.js
// E-Rechnung EMPFANG: liest eine eingehende strukturierte Rechnung (XRechnung) ein
// und extrahiert die Kernfelder für einen Buchungsvorschlag. Unterstützt beide
// XRechnung-Syntaxen: UN/CEFACT CII und OASIS UBL. Reine, testbare Funktionen.
//
// EHRLICHER HINWEIS: best-effort Extraktion der Kern-Geschäftsfelder über robuste,
// namespace-tolerante Textsuche (KEIN vollständiges Schema-Parsing/keine Validierung,
// kein CDATA/Kommentar-Handling). Genügt, um aus einer eingegangenen Rechnung einen
// Buchungs-ENTWURF vorzuschlagen — die Prüfung/Festschreibung bleibt beim Nutzer.
// ZUGFeRD (CII in PDF/A-3 eingebettet) wird hier NICHT ausgepackt — nur reine XML.

import { parseEuroToCents } from './money.js';

// Inneren Inhalt des ERSTEN Elements mit lokalem Namen `local` (Namespace-Präfix egal).
function block(xml, local) {
  const m = String(xml).match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`));
  return m ? m[1] : '';
}
// Text des ERSTEN Elements mit lokalem Namen `local`.
function tagText(xml, local) {
  const m = String(xml).match(new RegExp(`<(?:[\\w.-]+:)?${local}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${local}>`));
  return m ? entdecken(m[1].trim()) : '';
}
// Minimales XML-Entescaping (Gegenstück zum Erzeuger).
function entdecken(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
// Dezimalbetrag ("226.00" oder "226,00") → Cent.
function betragCent(s) {
  const t = String(s || '').trim();
  if (!t) return null;
  return parseEuroToCents(t);
}
// CII-Datum "20260616" oder ISO "2026-06-16" → "2026-06-16".
function normDatum(s) {
  const t = String(s || '').trim();
  if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
  const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

/** Erkennt das Format einer eingehenden E-Rechnung. @returns {'CII'|'UBL'|null} */
export function erkenneFormat(xml) {
  const s = String(xml || '');
  if (/CrossIndustryInvoice/.test(s)) return 'CII';
  if (/<(?:[\w.-]+:)?Invoice\b/.test(s) || /oasis:names:specification:ubl/.test(s)) return 'UBL';
  return null;
}

function parseCII(xml) {
  const kopf = block(xml, 'ExchangedDocument');
  const summe = block(xml, 'SpecifiedTradeSettlementHeaderMonetarySummation');
  const verkaeufer = block(xml, 'SellerTradeParty');
  const steuer = block(xml, 'ApplicableTradeTax'); // erste Steuerzeile (Header)
  return {
    nummer: tagText(kopf, 'ID'),
    datum: normDatum(tagText(kopf, 'DateTimeString')),
    lieferant: tagText(verkaeufer, 'Name'),
    netto: betragCent(tagText(summe, 'LineTotalAmount')),
    ust: betragCent(tagText(summe, 'TaxTotalAmount')),
    brutto: betragCent(tagText(summe, 'GrandTotalAmount')),
    ustSatz: Number(tagText(steuer, 'RateApplicablePercent')) || 0,
  };
}

function parseUBL(xml) {
  const lieferantBlock = block(xml, 'AccountingSupplierParty');
  const summe = block(xml, 'LegalMonetaryTotal');
  const taxTotal = block(xml, 'TaxTotal');             // cac:TaxTotal → cbc:TaxAmount (BT-110)
  const subtotal = block(taxTotal, 'TaxSubtotal');     // Satz aus cac:TaxCategory/cbc:Percent
  return {
    nummer: tagText(xml, 'ID'), // erstes cbc:ID = Rechnungsnummer (BT-1)
    datum: normDatum(tagText(xml, 'IssueDate')),
    lieferant: tagText(lieferantBlock, 'RegistrationName') || tagText(lieferantBlock, 'Name'),
    netto: betragCent(tagText(summe, 'TaxExclusiveAmount')),
    ust: betragCent(tagText(taxTotal, 'TaxAmount')),
    brutto: betragCent(tagText(summe, 'PayableAmount')),
    ustSatz: Number(tagText(block(subtotal, 'TaxCategory'), 'Percent')) || 0,
  };
}

/**
 * Liest eine eingehende E-Rechnung (CII oder UBL) und extrahiert die Kernfelder.
 * @returns {{format:'CII'|'UBL'|null, nummer, datum, lieferant, netto, ust, brutto, ustSatz, confidence, fehler?:string}}
 */
export function parseEingangsrechnung(xml) {
  const format = erkenneFormat(xml);
  if (!format) return { format: null, confidence: 0, fehler: 'Unbekanntes Format (weder CII noch UBL erkannt).' };
  const f = format === 'CII' ? parseCII(xml) : parseUBL(xml);
  const vollstaendig = Boolean(f.nummer && f.datum && f.brutto != null);
  return { format, ...f, confidence: vollstaendig ? 0.85 : 0.4 };
}

/**
 * Bildet aus einer geparsten Eingangsrechnung das Extraktions-Objekt (wie ai/extract),
 * damit der bestehende Buchungsvorschlag (ai/suggest.buildVorschlag) genutzt werden kann.
 * Eingangsrechnungen sind i.d.R. Aufwand → die Kategorisierung erfolgt separat über den
 * Lieferantennamen.
 * @returns {{betragBrutto:number|null, datum:string|null, ustSatz:number|null, vendor:string, confidence:number}}
 */
export function eingangsrechnungExtraktion(parsed) {
  const p = parsed || {};
  return {
    betragBrutto: p.brutto != null ? p.brutto : null,
    datum: p.datum || null,
    ustSatz: p.ustSatz || null,
    vendor: p.lieferant || '',
    confidence: p.confidence || 0,
  };
}
