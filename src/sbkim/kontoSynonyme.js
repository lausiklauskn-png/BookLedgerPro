// src/sbkim/kontoSynonyme.js — Alltags-Stichworte je Konto (SKR03), NUR für den
// Bedeutungs-Text der SBKIM-Suche (Vektor-Vorfilter + Richter). Sie verbessern den
// RECALL bei umgangssprachlichen Anfragen ("Geschäftsessen" → 4650 Bewirtung) —
// sie ändern NICHTS an Buchung/Kontierung/Steuer. Nur etablierte, korrekte Begriffe.

export const KONTO_SYNONYME = {
  // Anlagen / GWG
  '0320': 'Pkw kaufen, Firmenwagen Anschaffung, Auto kaufen, Anlagevermögen Fahrzeug',
  '0400': 'Betriebsausstattung, Maschine, Transporter, Lieferwagen, Werkstatteinrichtung, langfristiges Anlagevermögen',
  '0410': 'Geschäftsausstattung, Büromöbel, Computer, Laptop, Drucker, Telefonanlage',
  '0480': 'GWG, geringwertige Wirtschaftsgüter, günstiges Gerät, kleine Anschaffung unter 800 Euro',
  // Privat
  '1800': 'Privatentnahme, privat entnommen, Geld für mich privat überwiesen, Entnahme',
  '1890': 'Privateinlage, eigenes Geld eingezahlt, privat eingelegt',
  // Erträge / Aufwand Zins/Ware
  '2100': 'Zinsen Kredit, Darlehenszinsen, Zinsaufwand, Bankzinsen Soll',
  '2650': 'Zinserträge, Guthabenzinsen, Habenzinsen',
  '2700': 'sonstige Erträge, sonstige Einnahmen',
  '3300': 'Wareneinkauf 7%, Einkauf Waren ermäßigt',
  '3400': 'Wareneinkauf 19%, Einkauf Waren, Material einkaufen, Handelsware',
  // Personal
  '4100': 'Personalkosten, Mitarbeiter bezahlen, Lohn und Gehalt',
  '4110': 'Löhne, Stundenlohn, Arbeiter bezahlen',
  '4120': 'Gehälter, Angestellte bezahlen, Monatsgehalt',
  '4130': 'Sozialabgaben, Arbeitgeberanteil, Sozialversicherung',
  // Raum / Energie
  '4210': 'Miete, Büromiete, Raummiete, Ladenmiete, Pacht',
  '4240': 'Strom, Gas, Wasser, Heizung, Energie, Stromrechnung, Nebenkosten',
  '4250': 'Reinigung, Putzkraft, Reinigungskraft, Gebäudereinigung, Büroreinigung',
  '4260': 'Instandhaltung, Reparatur Räume, Renovierung Büro',
  // Versicherung / Beiträge
  '4360': 'Versicherung, Betriebshaftpflicht, Geschäftsversicherung, Inhaltsversicherung',
  '4380': 'Beiträge, Mitgliedsbeitrag, IHK, Handelskammer, Innung, Verband, Kammerbeitrag',
  // Fahrzeug
  '4500': 'Fahrzeugkosten, Auto, Firmenwagen, Kfz allgemein',
  '4530': 'Tanken, Sprit, Benzin, Diesel, Kraftstoff, Werkstatt, Inspektion, Reparatur Auto, laufende Kfz-Kosten',
  '4540': 'Kfz-Versicherung, Autoversicherung, Fahrzeugversicherung',
  // Werbung / Geschenke / Bewirtung
  '4600': 'Werbung, Anzeigen, Online-Werbung, Google Ads, Social Media, Instagram Werbung, Marketing, Inserate, Flyer, Plakate, Messestand',
  '4630': 'Geschenke an Kunden, Präsent, Blumenstrauß, Aufmerksamkeit, Werbegeschenk abzugsfähig',
  '4635': 'Geschenke nicht abzugsfähig, teures Präsent',
  '4650': 'Bewirtung, Geschäftsessen, Restaurant, Essen mit Kunden, Mittagessen mit Geschäftspartner, Abendessen, Café, Kunden einladen',
  '4654': 'nicht abzugsfähige Bewirtung, privater Anteil Essen',
  '4660': 'Reisekosten Mitarbeiter, Dienstreise Angestellte',
  '4670': 'Reisekosten, Dienstreise, Geschäftsreise, Hotel, Übernachtung, Bahnticket, Zugfahrt, Flug, Messe Reise, Auswärtstermin',
  // Abschreibung
  '4830': 'Abschreibung, AfA, Wertverlust Anlage',
  '4855': 'GWG Sofortabschreibung, geringwertiges Gut sofort abschreiben',
  // Büro / Kommunikation / Beratung / Bank
  '4910': 'Porto, Briefmarken, Versand, Paketversand, DHL',
  '4920': 'Telefon, Handy, Handyrechnung, Mobilfunk, Internet, Mobiltelefon',
  '4930': 'Bürobedarf, Schreibwaren, Druckerpapier, Toner, Stifte, Ordner',
  '4940': 'Fachbuch, Fachliteratur, Zeitschrift, Abo, Zeitung, Bücher',
  '4945': 'Fortbildung, Seminar, Schulung, Weiterbildung, Kurs, Workshop, Webinar',
  '4950': 'Rechtsanwalt, Anwalt, Rechtsberatung, Beratung, Notar',
  '4955': 'Steuerberater, Buchführung, Jahresabschluss, Buchhaltung, Lohnabrechnung',
  '4970': 'Bankgebühren, Kontoführung, Kontoführungsgebühr, Geldverkehr, Überweisungsgebühr',
  '4980': 'sonstige betriebliche Aufwendungen, sonstige Kosten, Verschiedenes, nicht zuordenbar',
  // Erlöse
  '8200': 'Erlöse, Umsatz, Einnahmen, Verkauf',
  '8300': 'Erlöse 7%, Umsatz ermäßigt',
  '8400': 'Erlöse 19%, Umsatz, Rechnung an Kunden, Verkauf, Honorar, Dienstleistung verkauft',
  '8500': 'Provision, Vermittlungsprovision, Provisionserlöse',
};

/** Synonym-String für eine Kontonummer (oder ''), rein/testbar. */
export function synonymeFor(nummer) {
  return KONTO_SYNONYME[String(nummer)] || '';
}
