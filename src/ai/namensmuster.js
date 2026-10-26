// src/ai/namensmuster.js — Namen, die BLP NICHT kennt, nach Muster erkennen (Klaus 2026-10-26:
// „bei der Anonymisierung noch Namen mit einfügen, die nicht klar definiert sind … auch nach Muster").
//
// Bis hierher wurden vor der KI nur Namen verdeckt, die in Stammdaten oder „Weitere Namen" stehen;
// Modul 25 machte aus Anrede/Begrüßung/Grußformel VORSCHLÄGE, die erst ein Tipp verdeckt. Ein Name
// mitten im Belegtext („Rechnung an Thomas Berger", „z. Hd. Petra Klein") ging hinaus.
//
// Jetzt: diese Muster werden AUTOMATISCH verdeckt (Richtung „im Zweifel verdecken", wie ner.js) —
// und sichtbar: namenVorschlagBox zeigt jeden verdeckten Treffer gelb; ein Tipp „kein Name" nimmt
// ihn zurück und legt ihn unter „Nie verdecken" (kiNieVerdecken). Deshalb dürfen die Muster lieber
// einmal zu viel treffen („Hans Riegel" ist Haribo, wird als Person verdeckt — schadet der
// Kontierung nicht) als einmal zu wenig.
//
// Reine, deterministische Logik (Regex + Stoppliste), node-getestet in tests/run.mjs. Kein Modell,
// kein Netz. Grenzen: Namen in GROSSBUCHSTABEN, Namen ohne Vornamen und ohne Anrede/Kontext,
// fremdsprachige Anreden außer Mr/Mrs/Ms werden nicht erkannt.

import { ANKER_TYP } from './pseudonym.js';

export const MUSTER_GRUND = Object.freeze({
  ANREDE: 'anrede',        // Herr/Frau/Dr. … Name
  KONTEXT: 'kontext',      // z. Hd. / Ansprechpartner / Inhaber … Name
  ZWEI_WOERTER: 'zweiWoerter', // Vorname Nachname
  FIRMA: 'firma',          // Name + Rechtsform (GmbH, AG, e.K. …)
});

// Ein Namenswort: Großbuchstabe, dann Kleinbuchstaben (auch ä/ö/ü/ß, Akzente), optional mit Bindestrich-Teil
// oder Apostroph („O'Brien"), Länge ab 2. Kein ALLES-GROSS (Überschriften), keine Ziffern.
const WORT = "\\p{Lu}\\p{Ll}+(?:[-']\\p{Lu}?\\p{Ll}+)*";
// Adelspartikel / Namenszusätze zwischen Vor- und Nachname.
const PARTIKEL = '(?:(?:van der|van den|von der|von dem|von|van|de|der|den|zu|zur|da|di|du|le|la|del|della)[ \\t]+)?';
const TITEL = '(?:(?:Dr|Prof|Dipl|Ing|Mag|Med|Jur|Rer|Nat|Phil|Habil|Dent)\\.(?:-Ing\\.)?\\s*)*';

const ANREDE_RE = new RegExp('\\b(?:Herrn?|Frau|Hr\\.|Fr\\.|Mr\\.?|Mrs\\.?|Ms\\.?|Fräulein)\\s+' + TITEL + '(' + WORT + '(?:[ \\t]+' + PARTIKEL + WORT + '){0,2})', 'gu');
const KONTEXT_RE = new RegExp('(?:z\\.\\s?Hd\\.|z\\.\\s?H\\.|zu Händen(?: von)?|Ansprechpartner(?:in)?|Kontakt(?:person)?|Inhaber(?:in)?|Kund(?:e|in)|Sachbearbeiter(?:in)?|Bearbeiter(?:in)?|Berater(?:in)?|Geschäftsführer(?:in)?|Vertreten durch|Mieter(?:in)?|Vermieter(?:in)?|Patient(?:in)?|Mandant(?:in)?|Empfänger(?:in)?|Auftraggeber(?:in)?|Attn\\.?|Attention)\\s*:?\\s+' + TITEL + '(' + WORT + '(?:[ \\t]+' + PARTIKEL + WORT + '){0,3})', 'gu');
const FIRMA_RE = new RegExp('\\b((?:' + WORT + '|\\p{Lu}{2,}|&|\\+)(?:\\s+(?:' + WORT + '|\\p{Lu}{2,}|&|\\+)){0,4}\\s+(?:GmbH(?:\\s*&\\s*Co\\.?\\s*KGaA|\\s*&\\s*Co\\.?\\s*KG)?|AG|UG(?:\\s*\\(haftungsbeschränkt\\))?|KG|KGaA|OHG|GbR|e\\.\\s?K\\.|e\\.\\s?V\\.|SE|mbH|Ltd\\.?|Inc\\.?|LLC|S\\.A\\.|B\\.V\\.|N\\.V\\.|Sàrl|S\\.r\\.l\\.))(?=[\\s,.;:)]|$)', 'gu');
const ZWEI_RE = new RegExp('(?<![\\p{L}\\p{N}-])(' + WORT + ')[ \\t]+(?:(' + WORT + ')[ \\t]+)?' + PARTIKEL + '(' + WORT + ')(?![\\p{L}\\p{N}-])', 'gu');

// Wörter, die groß geschrieben in Belegen vorkommen, aber keine Namen sind. Trifft eines der beiden
// Wörter eines Zwei-Wort-Treffers hier (kleingeschrieben), ist es kein Name. Monate, Wochentage,
// Rechnungs- und Zahlungswörter, Banken, Satzanfänge, Grußformeln, Adresswörter.
const STOPP = new Set(`
januar februar märz april mai juni juli august september oktober november dezember
montag dienstag mittwoch donnerstag freitag samstag sonntag
rechnung rechnungsnummer rechnungsdatum nummer nr datum betrag gesamt gesamtbetrag summe netto brutto mwst ust umsatzsteuer steuer
zwischensumme endbetrag rabatt skonto zahlbar zahlung zahlungsziel fällig innerhalb tage tagen bis sofort bar überweisung lastschrift
lieferung lieferdatum lieferschein leistung leistungsdatum leistungszeitraum frei haus versand versandkosten porto verpackung
menge anzahl stück flasche flaschen packung packungen karton kartons paket pakete liter kilo kg einzelpreis preis gesamtpreis position pos artikel artikelnummer beschreibung bezeichnung einheit
kunde kundin kunden kundennummer kundennr lieferant lieferanten lieferantin ansprechpartner ansprechpartnerin kontakt kontaktperson sachbearbeiter sachbearbeiterin bearbeiter bearbeiterin berater beraterin mieter mieterin vermieter vermieterin patient patientin mandant mandantin empfänger empfängerin auftraggeber auftraggeberin absender absenderin zahlungsempfänger rechnungssteller attn attention auftrag auftragsnummer bestellung bestellnummer angebot angebotsnummer vertrag vertragsnummer
konto kontonummer bank bankverbindung sparkasse volksbank raiffeisenbank postbank commerzbank bic iban swift
sehr geehrte geehrter geehrten damen herren herr herrn frau fräulein dr prof dipl ing mag liebe lieber hallo guten tag morgen abend
mit freundlichen freundlichem besten herzlichen herzliche viele vielen dank grüßen gruß grüße hochachtungsvoll
anbei beiliegend bitte danke zahlen prüfen bestätigen senden
seite blatt anlage anhang hinweis hinweise bemerkung bemerkungen notiz bedingungen agb impressum
firma gmbh ag kg ug ohg gbr inhaber geschäftsführer handelsregister amtsgericht sitz
straße strasse str weg platz gasse allee ring damm ufer markt chaussee postfach plz ort stadt
deutschland österreich schweiz berlin hamburg münchen köln frankfurt stuttgart düsseldorf leipzig dresden hannover nürnberg bremen wien zürich
telefon tel fax mobil mail email internet web www
kasse kassenbon bon beleg quittung gutschrift storno mahnung erinnerung
büro bürobedarf material miete strom gas wasser heizung versicherung beitrag gebühr gebühren honorar
euro eur cent ust-idnr steuernummer finanzamt
der die das ein eine einer eines und oder für von zu zum zur im in am an auf aus bei nach über unter vor ohne gegen durch
ihr ihre ihrer ihren ihrem unser unsere wir sie ich es dies diese dieser dieses
total invoice amount date due payment thank you dear regards sincerely best kind yours
`.split(/\s+/).filter(Boolean));

const ADRESSE_RE = /(?:straße|strasse|str\.|weg|platz|gasse|allee|ring|damm|ufer|chaussee)$/iu;

function istStopp(wort) {
  const w = String(wort || '').toLowerCase().replace(/\.$/, '');
  return STOPP.has(w) || ADRESSE_RE.test(w);
}

function ueberlappt(a, b) { return a.start < b.end && b.start < a.end; }

// Ein Treffer ist geschützt, wenn er einen „Nie verdecken"-Begriff (ganz oder als Wort) enthält.
function geschuetzt(wert, schutz) {
  const w = String(wert).toLowerCase();
  return schutz.some((s) => s && w.includes(String(s).toLowerCase()));
}

/**
 * Erkennt Namen nach Muster. Rein, deterministisch.
 * @param {string} text
 * @param {{schutz?: string[]}} [options] Begriffe aus „Nie verdecken": ein Treffer, der einen davon enthält, entfällt.
 * @returns {{wert:string, typ:string, grund:string, start:number, end:number}[]} nach Position, überlappungsfrei
 */
export function namenImText(text, { schutz = [] } = {}) {
  const src = String(text == null ? '' : text);
  const roh = [];
  const sammle = (re, grund, typ, gruppe = 1) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const wert = (m[gruppe] || '').trim();
      if (wert) roh.push({ wert, typ, grund, start: m.index + m[0].indexOf(wert), end: m.index + m[0].indexOf(wert) + wert.length });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  };
  // Firma: führende Rollenwörter („Lieferant Muster GmbH") gehören nicht zum Namen.
  FIRMA_RE.lastIndex = 0;
  let f;
  while ((f = FIRMA_RE.exec(src))) {
    let wert = f[1], start = f.index + f[0].indexOf(f[1]);
    let worte = wert.split(/[ \t]+/);
    while (worte.length > 1 && istStopp(worte[0])) { start += worte[0].length + 1; worte = worte.slice(1); }
    wert = src.slice(start, f.index + f[0].indexOf(f[1]) + f[1].length).trim();
    if (wert) roh.push({ wert, typ: ANKER_TYP.FIRMA, grund: MUSTER_GRUND.FIRMA, start, end: start + wert.length });
    if (f.index === FIRMA_RE.lastIndex) FIRMA_RE.lastIndex++;
  }
  sammle(ANREDE_RE, MUSTER_GRUND.ANREDE, ANKER_TYP.PERSON);
  sammle(KONTEXT_RE, MUSTER_GRUND.KONTEXT, ANKER_TYP.PERSON);
  // Zwei-Wort-Namen: beide Wörter dürfen keine Stoppwörter sein.
  ZWEI_RE.lastIndex = 0;
  let m;
  while ((m = ZWEI_RE.exec(src))) {
    const [ganz, vor, mitte, nach] = m;
    if (!istStopp(vor) && !istStopp(nach) && (mitte === undefined || !istStopp(mitte))) {
      const wert = ganz.trim();
      roh.push({ wert, typ: ANKER_TYP.PERSON, grund: MUSTER_GRUND.ZWEI_WOERTER, start: m.index, end: m.index + wert.length });
    }
    if (m.index === ZWEI_RE.lastIndex) ZWEI_RE.lastIndex++;
    else ZWEI_RE.lastIndex = m.index + vor.length;   // überlappend weitersuchen („Anna Maria Berg" → auch „Maria Berg")
  }
  // Bei Überlappung gewinnt der Treffer mit Kontext (Firma, Anrede, z. Hd.) vor dem bloßen Zwei-Wort-Muster,
  // dann der längere („Berater Petra Klein": Kontext „Petra Klein", nicht Zwei-Wort „Berater Petra").
  const RANG = { [MUSTER_GRUND.FIRMA]: 0, [MUSTER_GRUND.ANREDE]: 1, [MUSTER_GRUND.KONTEXT]: 1, [MUSTER_GRUND.ZWEI_WOERTER]: 2 };
  roh.sort((a, b) => RANG[a.grund] - RANG[b.grund] || (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  const behalten = [];
  for (const k of roh) {
    if (geschuetzt(k.wert, schutz)) continue;
    if (!behalten.some((b) => ueberlappt(k, b))) behalten.push(k);
  }
  behalten.sort((a, b) => a.start - b.start);
  return behalten;
}

/**
 * Anker-Liste für pseudonym.tokenize(): entdoppelt nach Wert; `bekannt` (Stammdaten, Weitere Namen)
 * wird ausgelassen, die exakten Anker stehen ohnehin vorn. Mit `scope` tragen die Typen den Präfix
 * (EXTERN_PERSON …, wie ner.piiAnker im Briefkasten-Modus).
 * @param {string} text
 * @param {{schutz?:string[], bekannt?:string[], scope?:string}} [options]
 * @returns {{wert:string, typ:string, grund:string}[]}
 */
export function musterAnker(text, { schutz = [], bekannt = [], scope } = {}) {
  const b = new Set((bekannt || []).map((w) => String(w == null ? '' : w).trim()).filter(Boolean));
  const gesehen = new Set();
  const out = [];
  const s = String(scope == null ? '' : scope).trim();
  for (const t of namenImText(text, { schutz })) {
    if (gesehen.has(t.wert) || b.has(t.wert)) continue;
    gesehen.add(t.wert);
    out.push({ wert: t.wert, typ: s ? `${s}_${t.typ}` : t.typ, grund: t.grund });
  }
  return out;
}
