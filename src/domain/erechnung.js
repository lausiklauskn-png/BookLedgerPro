// src/domain/erechnung.js
// E-Rechnung: erzeugt aus einem Rechnungs-Dokument (rechnung.baueRechnung) eine
// strukturierte XML im Format UN/CEFACT Cross Industry Invoice (CII), Profil
// EN16931 / XRechnung. Reine, testbare Funktion (String-Erzeugung, kein DOM/Netz).
//
// EHRLICHER HINWEIS (verbindlich): Dies ist eine **XRechnung-orientierte** CII-XML mit
// den zentralen EN16931-Pflichtfeldern (BT-1, BT-2, BT-5, BT-9, BT-27/44, BT-31/32,
// BT-106..112, BT-151/152 …). Sie ist NICHT gegen den offiziellen KoSIT-Validator
// geprüft (kein Validator in der Bau-Umgebung). Vor echter Einreichung/Versand bitte
// einmal validieren (z. B. KoSIT Validator / XRechnung-Schematron). Freitext-Adressen
// werden best-effort in PLZ/Ort/Straße zerlegt; Ländercode fix DE.

const GUIDELINE = 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0';

// Cent → Dezimalbetrag mit Punkt und 2 Nachkommastellen (CII-Konvention).
function amt(cents) {
  return (Math.round(Number(cents) || 0) / 100).toFixed(2);
}

// YYYY-MM-DD → CCYYMMDD (DateTimeString format="102").
function datum102(iso) {
  return String(iso || '').slice(0, 10).replace(/-/g, '');
}

// XML-Sonderzeichen maskieren (verhindert kaputtes/injiziertes XML).
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Freitext-Adresse best-effort zerlegen: „Straße 1, 12345 Ort" → {strasse, plz, ort}.
export function splitAdresse(adr) {
  const s = String(adr || '').trim();
  const m = s.match(/(\d{5})\s+([^\n,]+?)\s*$/);
  if (m) {
    return {
      strasse: s.slice(0, m.index).replace(/[,\s]+$/, '').trim(),
      plz: m[1],
      ort: m[2].trim(),
    };
  }
  return { strasse: s, plz: '', ort: '' };
}

// Steuer-Kategorie nach EN16931: Kleinunternehmer → E (befreit), 0 % → Z, sonst S.
function kategorie(satz, kleinunternehmer) {
  if (kleinunternehmer) return 'E';
  return Number(satz) > 0 ? 'S' : 'Z';
}

function adressBlock(adr) {
  const a = splitAdresse(adr);
  return [
    '<ram:PostalTradeAddress>',
    a.plz ? `<ram:PostcodeCode>${esc(a.plz)}</ram:PostcodeCode>` : '',
    a.strasse ? `<ram:LineOne>${esc(a.strasse)}</ram:LineOne>` : '',
    a.ort ? `<ram:CityName>${esc(a.ort)}</ram:CityName>` : '',
    '<ram:CountryID>DE</ram:CountryID>',
    '</ram:PostalTradeAddress>',
  ].filter(Boolean).join('');
}

/**
 * Erzeugt die CII-XML (XRechnung-orientiert) aus einem Rechnungs-Dokument.
 * @param {object} rechnung  Ergebnis von domain/rechnung.baueRechnung
 * @returns {string} XML als String (mit <?xml?>-Deklaration).
 */
export function baueXRechnungCII(rechnung) {
  const r = rechnung || {};
  const firma = r.firma || {};
  const kunde = r.kunde || {};
  const klein = !!r.kleinunternehmer;

  // Rechnungspositionen.
  const lineItems = (r.positionen || []).map((p, i) => {
    const satz = Number(p.ustSatz) || 0;
    return [
      '<ram:IncludedSupplyChainTradeLineItem>',
      `<ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>`,
      `<ram:SpecifiedTradeProduct><ram:Name>${esc(p.beschreibung || r.titel || 'Leistung')}</ram:Name></ram:SpecifiedTradeProduct>`,
      '<ram:SpecifiedLineTradeAgreement>',
      `<ram:NetPriceProductTradePrice><ram:ChargeAmount>${amt(p.einzelpreisCent)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>`,
      '</ram:SpecifiedLineTradeAgreement>',
      `<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">${esc(p.menge)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>`,
      '<ram:SpecifiedLineTradeSettlement>',
      `<ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${kategorie(satz, klein)}</ram:CategoryCode><ram:RateApplicablePercent>${klein ? '0.00' : satz.toFixed(2)}</ram:RateApplicablePercent></ram:ApplicableTradeTax>`,
      `<ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${amt(p.netto)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>`,
      '</ram:SpecifiedLineTradeSettlement>',
      '</ram:IncludedSupplyChainTradeLineItem>',
    ].join('');
  }).join('');

  // Steuer-Aufschlüsselung (Header): bei Kleinunternehmer EINE befreite Position,
  // sonst je USt-Satz eine Zeile.
  const tradeTax = klein
    ? [
        '<ram:ApplicableTradeTax>',
        `<ram:CalculatedAmount>0.00</ram:CalculatedAmount>`,
        '<ram:TypeCode>VAT</ram:TypeCode>',
        '<ram:ExemptionReason>Kleinunternehmer gemäß § 19 UStG</ram:ExemptionReason>',
        `<ram:BasisAmount>${amt(r.netto)}</ram:BasisAmount>`,
        '<ram:CategoryCode>E</ram:CategoryCode>',
        '<ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>',
        '</ram:ApplicableTradeTax>',
      ].join('')
    : (r.steuerzeilen || []).map((z) => [
        '<ram:ApplicableTradeTax>',
        `<ram:CalculatedAmount>${amt(z.ust)}</ram:CalculatedAmount>`,
        '<ram:TypeCode>VAT</ram:TypeCode>',
        `<ram:BasisAmount>${amt(z.netto)}</ram:BasisAmount>`,
        `<ram:CategoryCode>${kategorie(z.satz, false)}</ram:CategoryCode>`,
        `<ram:RateApplicablePercent>${(Number(z.satz) || 0).toFixed(2)}</ram:RateApplicablePercent>`,
        '</ram:ApplicableTradeTax>',
      ].join('')).join('');

  const sellerTax = [
    firma.ustId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(firma.ustId)}</ram:ID></ram:SpecifiedTaxRegistration>` : '',
    firma.steuernummer ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(firma.steuernummer)}</ram:ID></ram:SpecifiedTaxRegistration>` : '',
  ].filter(Boolean).join('');

  const paymentMeans = firma.iban
    ? `<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${esc(String(firma.iban).replace(/\s+/g, ''))}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount></ram:SpecifiedTradeSettlementPaymentMeans>`
    : '';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">',
    '<rsm:ExchangedDocumentContext>',
    `<ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>${GUIDELINE}</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>`,
    '</rsm:ExchangedDocumentContext>',
    '<rsm:ExchangedDocument>',
    `<ram:ID>${esc(r.nummer)}</ram:ID>`,
    '<ram:TypeCode>380</ram:TypeCode>',
    `<ram:IssueDateTime><udt:DateTimeString format="102">${datum102(r.datum)}</udt:DateTimeString></ram:IssueDateTime>`,
    '</rsm:ExchangedDocument>',
    '<rsm:SupplyChainTradeTransaction>',
    lineItems,
    '<ram:ApplicableHeaderTradeAgreement>',
    `<ram:SellerTradeParty><ram:Name>${esc(firma.name)}</ram:Name>${adressBlock(firma.anschrift)}${sellerTax}</ram:SellerTradeParty>`,
    `<ram:BuyerTradeParty><ram:Name>${esc(kunde.name)}</ram:Name>${adressBlock(kunde.adresse)}${kunde.ustId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(kunde.ustId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}</ram:BuyerTradeParty>`,
    '</ram:ApplicableHeaderTradeAgreement>',
    `<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${datum102(r.leistungsdatum || r.datum)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>`,
    '<ram:ApplicableHeaderTradeSettlement>',
    '<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>',
    paymentMeans,
    tradeTax,
    '<ram:SpecifiedTradeSettlementHeaderMonetarySummation>',
    `<ram:LineTotalAmount>${amt(r.netto)}</ram:LineTotalAmount>`,
    `<ram:TaxBasisTotalAmount>${amt(r.netto)}</ram:TaxBasisTotalAmount>`,
    `<ram:TaxTotalAmount currencyID="EUR">${amt(r.ust)}</ram:TaxTotalAmount>`,
    `<ram:GrandTotalAmount>${amt(r.brutto)}</ram:GrandTotalAmount>`,
    `<ram:DuePayableAmount>${amt(r.brutto)}</ram:DuePayableAmount>`,
    '</ram:SpecifiedTradeSettlementHeaderMonetarySummation>',
    '</ram:ApplicableHeaderTradeSettlement>',
    '</rsm:SupplyChainTradeTransaction>',
    '</rsm:CrossIndustryInvoice>',
  ].filter(Boolean).join('\n');
}

/** Dateiname-Vorschlag für die XRechnung (z. B. „XRechnung_2026-0007.xml"). */
export function xRechnungDateiname(rechnung) {
  const nr = String((rechnung || {}).nummer || 'entwurf').replace(/[^\w.-]+/g, '_');
  return `XRechnung_${nr}.xml`;
}
