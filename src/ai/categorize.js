// src/ai/categorize.js
// On-Device-Kategorisierung von Belegen → Kontovorschlag (rein, testbar).
//
// EHRLICHER HINWEIS: Dies ist eine Schlüsselwort-Heuristik, KEINE semantischen
// Embeddings. Sie liefert nachvollziehbare Vorschläge (Feld `grund`), keine Gewissheit.
//
// Stand 2026-11-12 (Klaus: „BookLedgerPro trainieren“): Im Blindtest an 120 fremden Belegen traf die alte Fassung
// (fünf Ausgaben-Regeln, eine Einnahmen-Regel) 8 % der Konten — fast alles fiel auf 4980. Zwei unabhängige Einordner
// waren sich bei 97,5 % der Belege einig; die Aufgabe ist also lösbar. Diese Fassung kennt die üblichen Belegarten
// eines kleinen Betriebs (SKR03) und zählt Treffer, statt den ersten zu nehmen. Maßstab und Messung:
// Datei-Organizer `docs/PRUEFSTAPEL-BLP-REGELN.md`.

import { KONTOART } from '../domain/accounts.js';

/** Wortanfang: „miete“ trifft „Mietzins“ nicht, „versicherung“ trifft „Versicherungsschein“; nie mitten im Wort. */
const w = (worte) => new RegExp(`(?<![a-zäöüß])(?:${worte})`, 'gi');

// Ausgaben: jede Regel zählt ihre Treffer (höchstens `max` je Regel), `gewicht` hebt eindeutige Belegarten.
// Reihenfolge nur für Gleichstand: das Speziellere steht weiter oben.
const AUSGABE_REGELN = [
  { konto: '4120', label: 'Gehälter', gewicht: 3, re: w('gehaltsabrechnung|lohnabrechnung|lohn- und gehaltsabrechnung|entgeltabrechnung|verdienstabrechnung|bruttolohn|brutto/netto-bezüge|nettobezüge|personal-nr|steuerklasse|gesamtbrutto|auszahlungsbetrag|lohnsteuer|sozialversicherungsbeitr') },
  { konto: '4955', label: 'Buchführungskosten', gewicht: 3, re: w('buchführung|finanzbuchhaltung|lohnbuchhaltung|steuerberat|jahresabschluss|steuererklärung|umsatzsteuer-voranmeldung') },
  { konto: '4950', label: 'Rechts- und Beratungskosten', gewicht: 3, re: w('rechtsanw|anwaltskanzlei|rechtsberatung|rvg|notar|gegenstandswert|mandat|unternehmensberatung') },
  { konto: '4970', label: 'Nebenkosten des Geldverkehrs', gewicht: 3, re: w('kontoführung|bankentgelt|entgeltabrechnung konto|kontoentgelt|disagio|transaktionsgebühr|transaktionsentgelt|kartenumsätze|kartenterminal|terminalmiete|kartenzahlungsabrechnung|buchungsposten|kontoabschluss|händlerentgelt') },
  { konto: '4540', label: 'Kfz-Versicherungen', gewicht: 4, re: w('kfz-versicherung|kraftfahrtversicherung|kraftfahrzeugversicherung|kfz-haftpflicht|vollkasko|teilkasko|schadenfreiheitsklasse') },
  { konto: '4360', label: 'Versicherungen', gewicht: 2, re: w('versicherung|versicherungsschein|police|haftpflicht|versicherungsbeitrag|versicherungsnehmer') },
  { konto: '4380', label: 'Beiträge', gewicht: 3, re: w('kammerbeitrag|handwerkskammer|handelskammer|ihk|mitgliedsbeitrag|beitragsbescheid|berufsgenossenschaft|innung|verbandsbeitrag|grundbeitrag|umlage') },
  { konto: '4530', label: 'Laufende Kfz-Betriebskosten', gewicht: 3, re: w('tankstelle|kraftstoff|super e10|super e5|super plus|diesel|zapfsäule|säule \\d|eur/l|€/l|liter|parkhaus|parkschein|parkgebühr|parkticket|parkdauer|autowäsche|waschstraße|adblue') },
  { konto: '4500', label: 'Fahrzeugkosten', gewicht: 3, re: w('kfz-werkstatt|autowerkstatt|autohaus|inspektion|hauptuntersuchung|ölwechsel|reifen|bremsbel|bremsscheib|kfz-reparatur|fahrzeugreparatur|kennzeichen|kilometerstand|fahrgestell') },
  { konto: '4210', label: 'Miete', gewicht: 3, re: w('miete|kaltmiete|mietzins|pacht|mietobjekt|gewerbemiet|ladenmiete|mietvertrag|nebenkostenvorauszahlung') },
  { konto: '4240', label: 'Gas, Strom, Wasser', gewicht: 3, re: w('stromrechnung|strom|erdgas|gasverbrauch|wasserverbrauch|abwasser|kwh|abschlag|zählernummer|zählerstand|stadtwerke|energieversorg|fernwärme') },
  { konto: '4250', label: 'Reinigung', gewicht: 3, re: w('gebäudereinigung|unterhaltsreinigung|reinigungsleistung|fensterreinigung|glasreinigung|reinigungsservice|reinigungskraft|grundreinigung') },
  { konto: '4260', label: 'Instandhaltung betrieblicher Räume', gewicht: 3, re: w('instandhaltung|instandsetzung|malerbetrieb|malerarbeiten|streichen|spachtel|elektriker|klempner|tischlerarbeiten|elektroinstallation|sanitär|heizungswartung|heizung|wartung der|schlüsseldienst|türschloss|handwerkerleistung|reparatur der|renovierung|anfahrt') },
  { konto: '4600', label: 'Werbekosten', gewicht: 3, re: w('werbung|werbeanzeige|anzeigenschaltung|anzeige|flyer|plakat|werbekampagne|kampagne|google ads|social media|werbemittel|banner|prospekt|druckerei') },
  { konto: '4650', label: 'Bewirtungskosten (abzugsfähig 70%)', gewicht: 4, re: w('bewirtung|bewirtungsbeleg|bewirtete personen|anlass der bewirtung|anlass|teilnehmer|restaurant|gasthaus|gaststätte|trinkgeld|tisch \\d|bedienung') },
  { konto: '4630', label: 'Geschenke abzugsfähig', gewicht: 4, re: w('geschenk|präsent|kundengeschenk|geschenkkorb|geschenkverpackung|aufmerksamkeit') },
  { konto: '4670', label: 'Reisekosten Unternehmer', gewicht: 3, re: w('fahrkarte|fahrschein|bahnticket|online-ticket|hin- und rückfahrt|ice |hotel|übernachtung|zimmer|reisekosten|flugticket|dienstreise|city tax') },
  { konto: '4945', label: 'Fortbildungskosten', gewicht: 3, re: w('seminar|fortbildung|weiterbildung|schulung|lehrgang|teilnahmegebühr|workshop|kursgebühr|zertifikatskurs') },
  { konto: '4940', label: 'Zeitschriften, Bücher', gewicht: 3, re: w('fachbuch|fachzeitschrift|zeitschrift|buchhandlung|abonnement|isbn|fachliteratur|jahresabo') },
  { konto: '4910', label: 'Porto', gewicht: 3, re: w('porto|briefmarke|postwertzeichen|einschreiben|paketmarke|frankier|postfiliale|sendungsnummer|päckchen') },
  { konto: '4920', label: 'Telefon', gewicht: 3, re: w('telefon|mobilfunk|festnetz|internet|router|internetanschluss|dsl|glasfaser|telekommunikation|rufnummer|grundgebühr|flatrate') },
  { konto: '4930', label: 'Bürobedarf', gewicht: 3, re: w('bürobedarf|buero|büro|stempel|etikett|büromaterial|kopierpapier|druckerpapier|papier|toner|druckerpatrone|ordner|schreibwaren|kugelschreiber|briefumschl|heftklammer') },
];

// Anschaffungen: Gegenstand + Hinweis auf Kauf. Die Höhe entscheidet (GWG bis 800 € netto).
const ANLAGE_PKW = w('fahrzeug-kaufvertrag|kaufvertrag über ein|fahrzeugrechnung|neuwagen|gebrauchtwagen|fahrzeug-ident|fin:|erstzulassung|lieferwagen|transporter|kastenwagen');
const ANLAGE_AUSSTATTUNG = w('bürostuhl|schreibtisch|regal|vitrine|theke|tresen|ladeneinrichtung|möbel|drucker|notebook|laptop|monitor|kasse|registrierkasse|schrank|tisch|stühle|sitzgruppe|einrichtung');
const ANLAGE_MASCHINE = w('maschine|backofen|ofen|kühl|kompressor|hebebühne|werkbank|bohrmaschine|säge|schweißgerät|anlage|gerät|spülmaschine|kaffeemaschine');
const WARE = w('wareneingang|lieferschein|großhandel|grosshandel|großmarkt|lieferung|artikel-nr|art\\.-nr|art\\.nr|bestellnummer|stück|stk|kg|karton|gebinde|palette|sortiment');

// Einnahmen
const EINNAHME_REGELN = [
  { konto: '8500', label: 'Provisionserlöse', gewicht: 5, re: w('provision|provisionsabrechnung|vermittlungsprovision') },
  { konto: '8125', label: 'Steuerfreie innergem. Lieferungen (§4 Nr.1b)', gewicht: 5, re: w('innergemeinschaftliche lieferung|steuerfreie innergem|§ ?4 nr\\. ?1 ?b|intra-community') },
  { konto: '8120', label: 'Steuerfreie Umsätze Ausfuhr/Drittland (§4 Nr.1a)', gewicht: 5, re: w('ausfuhrlieferung|ausfuhr|drittland|§ ?4 nr\\. ?1 ?a|export|zollanmeldung') },
];
const EINNAHME_HINWEIS = /\b(ausgangsrechnung|wir berechnen|honorar|unsere leistung|rechnungssteller|wir erlauben uns|stellen wir ihnen|berechnen wir ihnen)\b/i;
const EINNAHME_WORT = /\b(honorar|dienstleistung|beratung|erlös|erlöse|umsatz|leistung)\b/i;

const zaehle = (re, text, max = 3) => { re.lastIndex = 0; let n = 0; while (re.exec(text) && n < max) n++; return n; };
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');

/** Steht der eigene Betrieb im Briefkopf (erste Zeilen)? Dann hat ER den Beleg ausgestellt → Einnahme. */
export function istEigenerBeleg(text, eigenerName) {
  const n = norm(eigenerName);
  if (n.length < 4) return false;
  // Nur der erste Block bis zur ersten Leerzeile (höchstens 3 Zeilen): darunter steht der Empfänger — und das ist bei
  // jeder Eingangsrechnung der eigene Betrieb. Die Zeile muss mit dem Namen beginnen („Händler: …“ zählt nicht).
  const zeilen = String(text || '').split(/\r?\n/).map((z) => z.trim());
  while (zeilen.length && !zeilen[0]) zeilen.shift();
  const ende = zeilen.indexOf('');
  const kopf = zeilen.slice(0, Math.min(ende < 0 ? 3 : ende, 3));
  return kopf.some((z) => norm(z).startsWith(n));
}

/** USt-Satz aus dem Text (7 / 19 / null), nur soweit für Wareneingang und Erlöse nötig. */
function ustSatz(text) {
  const hat7 = /(?<!\d)7\s?(?:,0+\s?)?%/.test(text), hat19 = /(?<!\d)19\s?(?:,0+\s?)?%/.test(text);
  if (hat7 && !hat19) return 7;
  if (hat19 && !hat7) return 19;
  return null;
}
/** Größter Nettobetrag einer Zeile „Netto … 1.234,56“ in Cent (für die GWG-Grenze); null, wenn nicht genannt. */
function nettoCent(text) {
  const m = text.match(/netto[^\n\d]{0,80}(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/i);
  return m ? Number(m[1].replace(/\./g, '')) * 100 + Number(m[2]) : null;
}

const aus = (konto, label, richtung, confidence, grund) => ({ konto, art: richtung === 'einnahme' ? KONTOART.ERTRAG : KONTOART.AUFWAND, label, richtung, confidence, grund });

/**
 * Schlägt anhand des Beleg-Texts ein Konto + Richtung vor.
 * @param {string} text
 * @param {{eigenerName?: string}} [opts] eigenerName = Name aus dem Firmenprofil; steht er im Briefkopf, ist es eine Ausgangsrechnung.
 * @returns {{konto:string, art:string, label:string, richtung:'einnahme'|'ausgabe', confidence:number, grund:string}}
 */
export function categorize(text, opts = {}) {
  const safe = String(text || '');
  const satz = ustSatz(safe);

  // Privat
  if (/privateinlage|einlage aus privat/i.test(safe)) return { ...aus('1890', 'Privateinlagen', 'einnahme', 0.7, 'Privateinlage'), art: KONTOART.PASSIV ?? KONTOART.AUFWAND };
  if (/privatentnahme|entnahme für privat|eigenbeleg[^\n]*privat/i.test(safe)) return { ...aus('1800', 'Privatentnahmen allgemein', 'ausgabe', 0.7, 'Privatentnahme'), art: KONTOART.PASSIV ?? KONTOART.AUFWAND };

  // Lohnabrechnung: stellt der eigene Betrieb aus und ist trotzdem eine Ausgabe
  const lohn = AUSGABE_REGELN[0];
  if (zaehle(lohn.re, safe) >= 2) return aus(lohn.konto, lohn.label, 'ausgabe', 0.7, 'Lohnabrechnung');

  // Einnahme: eigener Briefkopf oder ausdrücklicher Hinweis
  const eigen = istEigenerBeleg(safe, opts.eigenerName);
  if (eigen || EINNAHME_HINWEIS.test(safe) || (!opts.eigenerName && EINNAHME_WORT.test(safe) && !AUSGABE_REGELN.some((r) => zaehle(r.re, safe, 1)))) {
    const treffer = EINNAHME_REGELN.map((r) => ({ r, n: zaehle(r.re, safe) * r.gewicht })).filter((x) => x.n).sort((a, b) => b.n - a.n)[0];
    if (treffer) return aus(treffer.r.konto, treffer.r.label, 'einnahme', 0.7, eigen ? 'eigener Briefkopf, ' + treffer.r.label : treffer.r.label);
    if (satz === 7) return aus('8300', 'Erlöse 7% USt', 'einnahme', eigen ? 0.7 : 0.5, eigen ? 'eigener Briefkopf, 7 % USt' : '7 % USt');
    return aus('8400', 'Erlöse 19% USt', 'einnahme', eigen || EINNAHME_WORT.test(safe) ? 0.7 : 0.4, eigen ? 'eigener Briefkopf' : 'Hinweis auf eigene Leistung');
  }

  // Anschaffungen
  const netto = nettoCent(safe);
  if (zaehle(ANLAGE_PKW, safe) >= 2) return { ...aus('0320', 'Pkw', 'ausgabe', 0.6, 'Fahrzeugkauf'), art: KONTOART.AKTIV };
  const punkte = AUSGABE_REGELN.map((r) => ({ r, n: zaehle(r.re, safe) * r.gewicht })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const bester = punkte[0];
  const ausstattung = zaehle(ANLAGE_AUSSTATTUNG, safe), maschine = zaehle(ANLAGE_MASCHINE, safe), ware = zaehle(WARE, safe, 6);
  if ((ausstattung || maschine) && netto != null && netto >= 25000 && (!bester || bester.n <= 3) && ware <= 3) {
    if (netto <= 80000) return { ...aus('0480', 'Geringwertige Wirtschaftsgüter (GWG)', 'ausgabe', 0.5, 'Anschaffung bis 800 € netto'), art: KONTOART.AKTIV };
    return maschine > ausstattung
      ? { ...aus('0400', 'Betriebsausstattung', 'ausgabe', 0.5, 'Anschaffung über 800 € netto'), art: KONTOART.AKTIV }
      : { ...aus('0410', 'Geschäftsausstattung', 'ausgabe', 0.5, 'Anschaffung über 800 € netto'), art: KONTOART.AKTIV };
  }

  if (bester) {
    let { konto, label } = bester.r;
    // Geschenk über 50 € netto je Stück gilt als nicht abzugsfähig
    if (konto === '4630') {
      const einzel = [...safe.matchAll(/(?:^|\s)1\s+(?:x\s+)?[^\n]*?(\d+),(\d{2})\s*$/gm)].map((m) => Number(m[1]) * 100 + Number(m[2]));
      if (/nicht abzugsfähig|über 50/i.test(safe) || (netto != null && netto > 5000 && !/\b(\d{1,3})\s*(?:x|stück|stk)\b/i.test(safe.replace(/\b1\s*(?:x|stück|stk)\b/gi, ''))) || einzel.some((c) => c > 5950)) { konto = '4635'; label = 'Geschenke nicht abzugsfähig'; }
    }
    // Reise eines Mitarbeiters
    if (konto === '4670' && /mitarbeiter|arbeitnehmer|angestellte|auszubildende|reisender:\s*(?!inh)/i.test(safe) && !/inhaber|geschäftsführer/i.test(safe)) { konto = '4660'; label = 'Reisekosten Arbeitnehmer'; }
    // Ware schlägt eine einzelne schwache Fundstelle (z. B. „Papier“ in einer Großhandelsrechnung)
    if (!(ware >= 3 && bester.n <= 3 && !['4650', '4530', '4500'].includes(konto))) {
      const zweiter = punkte[1];
      return aus(konto, label, 'ausgabe', zweiter && zweiter.n === bester.n ? 0.5 : 0.7, `Wörter für „${label}“`);
    }
  }
  // Wareneingang nach Steuersatz
  if (ware >= 2 || satz === 7) return satz === 7 ? aus('3300', 'Wareneingang 7% Vorsteuer', 'ausgabe', 0.5, 'Ware, 7 % USt') : aus('3400', 'Wareneingang 19% Vorsteuer', 'ausgabe', 0.5, 'Ware, 19 % USt');
  // Rechnung mit Positionstabelle (Menge/Einzelpreis), aber ohne erkennbare Belegart: am ehesten Ware — unsicher.
  if (/\bmenge\b/i.test(safe) && /\b(einzel|einzelpreis|e-preis|ep)\b/i.test(safe)) return aus('3400', 'Wareneingang 19% Vorsteuer', 'ausgabe', 0.4, 'Rechnung mit Positionen, Belegart unklar');
  // Fallback: sonstige betriebliche Aufwendungen.
  return aus('4980', 'Sonstige betriebliche Aufwendungen', 'ausgabe', 0.3, 'kein Hinweis auf eine Belegart');
}
