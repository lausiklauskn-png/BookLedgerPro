// src/domain/accounts.js
// Kontenplan (SKR03-Auswahl, "light"). Konto-Typen bestimmen die Soll/Haben-Logik
// für Salden und Auswertungen.

export const KONTOART = {
  AKTIV: 'aktiv',       // Bestandskonto Aktiva (Soll mehrt) — z.B. Bank, Kasse, Vorsteuer
  PASSIV: 'passiv',     // Bestandskonto Passiva (Haben mehrt) — z.B. Umsatzsteuer, Verbindlichkeiten
  AUFWAND: 'aufwand',   // Erfolgskonto Aufwand (Soll mehrt)
  ERTRAG: 'ertrag',     // Erfolgskonto Ertrag (Haben mehrt)
};

/** Auf welcher Seite mehrt sich das Konto? 'S' (Soll) für Aktiv/Aufwand, 'H' für Passiv/Ertrag. */
export function mehrungsSeite(kontoart) {
  return (kontoart === KONTOART.AKTIV || kontoart === KONTOART.AUFWAND) ? 'S' : 'H';
}

/**
 * Saldo eines Kontos aus seinen Zeilen-Bewegungen.
 * @param {{soll:number, haben:number}} bewegung - Summen in Cent
 * @returns {number} Saldo in Cent im Sinne der Mehrungsseite (positiv = übliches Vorzeichen)
 */
export function saldo(kontoart, bewegung) {
  const diff = (bewegung.soll || 0) - (bewegung.haben || 0);
  return mehrungsSeite(kontoart) === 'S' ? diff : -diff;
}

// SKR03-Auswahl: gängige Konten für eine kleine EÜR-Firma (Dienstleistung/Handel).
// EHRLICHER HINWEIS: Dies ist eine PRAKTISCHE Auswahl, KEIN vollständiger SKR03 (~1.500 Konten).
// Weitere Konten sind im UI frei anlegbar/editierbar (Kontonummern beliebig). Vor produktivem
// Einsatz / DATEV-Export Kontonummern + Steuerschlüssel mit Berater/DATEV abgleichen.
// `ust` ist informativ (Standard-Satz des Kontos); `rolle` markiert USt-/Vorsteuer-Konten.
export const SKR03_SEED = [
  // ---- Anlagevermögen (Klasse 0) ----
  { nummer: '0320', name: 'Pkw', art: KONTOART.AKTIV },
  { nummer: '0400', name: 'Betriebsausstattung', art: KONTOART.AKTIV },
  { nummer: '0410', name: 'Geschäftsausstattung', art: KONTOART.AKTIV },
  { nummer: '0480', name: 'Geringwertige Wirtschaftsgüter (GWG)', art: KONTOART.AKTIV },
  { nummer: '0485', name: 'Wirtschaftsgüter Sammelposten', art: KONTOART.AKTIV },
  // ---- Eigenkapital / Privat (Klasse 0/1, Passiva) ----
  { nummer: '0880', name: 'Eigenkapital', art: KONTOART.PASSIV },
  { nummer: '1800', name: 'Privatentnahmen allgemein', art: KONTOART.PASSIV },
  { nummer: '1890', name: 'Privateinlagen', art: KONTOART.PASSIV },
  { nummer: '9000', name: 'Saldenvorträge / Anfangsbestände', art: KONTOART.PASSIV, rolle: 'saldenvortrag' },
  // ---- Umlaufvermögen / Geld (Klasse 1, Aktiva) ----
  { nummer: '1000', name: 'Kasse', art: KONTOART.AKTIV },
  { nummer: '1200', name: 'Bank', art: KONTOART.AKTIV },
  { nummer: '1210', name: 'Bank (2)', art: KONTOART.AKTIV },
  { nummer: '1400', name: 'Forderungen aus Lieferungen und Leistungen', art: KONTOART.AKTIV },
  { nummer: '1571', name: 'Abziehbare Vorsteuer 7%', art: KONTOART.AKTIV, ust: 7, rolle: 'vorsteuer' },
  { nummer: '1576', name: 'Abziehbare Vorsteuer 19%', art: KONTOART.AKTIV, ust: 19, rolle: 'vorsteuer' },
  { nummer: '1574', name: 'Abziehbare Vorsteuer innergem. Erwerb 19%', art: KONTOART.AKTIV, ust: 19, rolle: 'vorsteuer_ig' },
  { nummer: '1577', name: 'Abziehbare Vorsteuer §13b (Leistungsempfänger)', art: KONTOART.AKTIV, ust: 19, rolle: 'vorsteuer_13b' },
  // ---- Verbindlichkeiten / Steuern (Klasse 1, Passiva) ----
  { nummer: '1600', name: 'Verbindlichkeiten aus Lieferungen und Leistungen', art: KONTOART.PASSIV },
  { nummer: '1700', name: 'Sonstige Verbindlichkeiten', art: KONTOART.PASSIV },
  { nummer: '1771', name: 'Umsatzsteuer 7%', art: KONTOART.PASSIV, ust: 7, rolle: 'umsatzsteuer' },
  { nummer: '1776', name: 'Umsatzsteuer 19%', art: KONTOART.PASSIV, ust: 19, rolle: 'umsatzsteuer' },
  { nummer: '1772', name: 'Umsatzsteuer innergem. Erwerb 19%', art: KONTOART.PASSIV, ust: 19, rolle: 'umsatzsteuer_ig' },
  { nummer: '1787', name: 'Umsatzsteuer §13b (Leistungsempfänger)', art: KONTOART.PASSIV, ust: 19, rolle: 'umsatzsteuer_13b' },
  { nummer: '1780', name: 'Umsatzsteuer-Vorauszahlungen', art: KONTOART.PASSIV },
  // ---- Neutrale Aufwendungen/Erträge (Klasse 2) ----
  { nummer: '2100', name: 'Zinsen und ähnliche Aufwendungen', art: KONTOART.AUFWAND },
  { nummer: '2650', name: 'Sonstige Zinsen und ähnliche Erträge', art: KONTOART.ERTRAG },
  { nummer: '2700', name: 'Sonstige betriebliche Erträge', art: KONTOART.ERTRAG },
  // ---- Wareneingang (Klasse 3) ----
  { nummer: '3300', name: 'Wareneingang 7% Vorsteuer', art: KONTOART.AUFWAND, ust: 7 },
  { nummer: '3400', name: 'Wareneingang 19% Vorsteuer', art: KONTOART.AUFWAND, ust: 19 },
  // ---- Betriebliche Aufwendungen (Klasse 4) ----
  { nummer: '4100', name: 'Löhne und Gehälter', art: KONTOART.AUFWAND },
  { nummer: '4120', name: 'Gehälter', art: KONTOART.AUFWAND },
  { nummer: '4130', name: 'Gesetzliche soziale Aufwendungen', art: KONTOART.AUFWAND },
  { nummer: '4210', name: 'Miete', art: KONTOART.AUFWAND },
  { nummer: '4240', name: 'Gas, Strom, Wasser', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4250', name: 'Reinigung', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4260', name: 'Instandhaltung betrieblicher Räume', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4360', name: 'Versicherungen', art: KONTOART.AUFWAND },
  { nummer: '4380', name: 'Beiträge', art: KONTOART.AUFWAND },
  { nummer: '4500', name: 'Fahrzeugkosten', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4530', name: 'Laufende Kfz-Betriebskosten', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4540', name: 'Kfz-Versicherungen', art: KONTOART.AUFWAND },
  { nummer: '4600', name: 'Werbekosten', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4630', name: 'Geschenke abzugsfähig', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4635', name: 'Geschenke nicht abzugsfähig', art: KONTOART.AUFWAND },
  { nummer: '4650', name: 'Bewirtungskosten (abzugsfähig 70%)', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4654', name: 'Nicht abzugsfähige Bewirtungskosten (30%)', art: KONTOART.AUFWAND },
  { nummer: '4660', name: 'Reisekosten Arbeitnehmer', art: KONTOART.AUFWAND },
  { nummer: '4670', name: 'Reisekosten Unternehmer', art: KONTOART.AUFWAND },
  { nummer: '4830', name: 'Abschreibungen auf Sachanlagen', art: KONTOART.AUFWAND },
  { nummer: '4855', name: 'Sofortabschreibung GWG', art: KONTOART.AUFWAND },
  { nummer: '4910', name: 'Porto', art: KONTOART.AUFWAND },
  { nummer: '4920', name: 'Telefon', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4930', name: 'Bürobedarf', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4940', name: 'Zeitschriften, Bücher', art: KONTOART.AUFWAND, ust: 7 },
  { nummer: '4945', name: 'Fortbildungskosten', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4950', name: 'Rechts- und Beratungskosten', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4955', name: 'Buchführungskosten', art: KONTOART.AUFWAND, ust: 19 },
  { nummer: '4970', name: 'Nebenkosten des Geldverkehrs', art: KONTOART.AUFWAND },
  { nummer: '4980', name: 'Sonstige betriebliche Aufwendungen', art: KONTOART.AUFWAND },
  // ---- Erlöse (Klasse 8) ----
  { nummer: '8100', name: 'Steuerfreie Umsätze §4 UStG', art: KONTOART.ERTRAG, ust: 0 },
  { nummer: '8125', name: 'Steuerfreie innergem. Lieferungen (§4 Nr.1b)', art: KONTOART.ERTRAG, ust: 0, rolle: 'erloes_ig' },
  { nummer: '8120', name: 'Steuerfreie Umsätze Ausfuhr/Drittland (§4 Nr.1a)', art: KONTOART.ERTRAG, ust: 0, rolle: 'erloes_ausfuhr' },
  { nummer: '8200', name: 'Erlöse', art: KONTOART.ERTRAG, ust: 0 },
  { nummer: '8300', name: 'Erlöse 7% USt', art: KONTOART.ERTRAG, ust: 7 },
  { nummer: '8400', name: 'Erlöse 19% USt', art: KONTOART.ERTRAG, ust: 19 },
  { nummer: '8500', name: 'Provisionserlöse', art: KONTOART.ERTRAG, ust: 19 },
];

export function seedAccounts() {
  return SKR03_SEED.map((k) => ({ id: `konto:${k.nummer}`, type: 'konto', ...k }));
}

export function isVorsteuerKonto(konto) { return konto && konto.rolle === 'vorsteuer'; }
export function isUmsatzsteuerKonto(konto) { return konto && konto.rolle === 'umsatzsteuer'; }

// Steuerschuldumkehr (Leistungsempfänger schuldet die USt): §13b UStG und
// innergemeinschaftlicher Erwerb. Standard-Konten der SKR03-Auswahl. Bei beiden wird
// Vorsteuer UND geschuldete USt gleichzeitig gebucht (heben sich bei vollem Abzug auf).
export const REVERSE_CHARGE_KONTEN = {
  '13b':      { vorsteuer: '1577', umsatzsteuer: '1787' },
  ig_erwerb:  { vorsteuer: '1574', umsatzsteuer: '1772' },
};
// Standard-Erlöskonten für steuerfreie Ausgangsumsätze (kein USt-Ausweis).
export const STEUERFREI_ERLOES_KONTEN = { ig_lieferung: '8125', ausfuhr: '8120' };

/** Alle Kontoarten als Liste (für Auswahlfelder). */
export const KONTOART_LISTE = [KONTOART.AKTIV, KONTOART.PASSIV, KONTOART.AUFWAND, KONTOART.ERTRAG];

/**
 * Validiert ein (neues oder geändertes) Konto. Rein & testbar.
 * @param {{nummer,name,art,ust?}} konto
 * @param {string[]} [vorhandeneNummern] - bestehende Kontonummern (für Eindeutigkeit beim Anlegen)
 * @returns {string[]} Fehlerliste (leer = ok)
 */
export function validateKonto(konto, vorhandeneNummern = []) {
  const errors = [];
  const nummer = String((konto && konto.nummer) || '').trim();
  if (!/^\d{3,6}$/.test(nummer)) errors.push('Kontonummer muss 3–6 Ziffern haben.');
  else if (vorhandeneNummern.includes(nummer)) errors.push('Kontonummer existiert bereits.');
  if (!konto || !String(konto.name || '').trim()) errors.push('Kontobezeichnung fehlt.');
  if (!konto || !KONTOART_LISTE.includes(konto.art)) errors.push('Kontoart ungültig.');
  if (konto && konto.ust != null && konto.ust !== '' && ![0, 7, 19].includes(Number(konto.ust))) {
    errors.push('USt-Satz muss 0, 7 oder 19 sein.');
  }
  return errors;
}

/** Normalisiert ein Konto-Eingabeobjekt auf das gespeicherte Format. */
export function normalizeKonto(konto) {
  const k = {
    nummer: String(konto.nummer).trim(),
    name: String(konto.name).trim(),
    art: konto.art,
  };
  if (konto.ust != null && konto.ust !== '') k.ust = Number(konto.ust);
  if (konto.rolle) k.rolle = konto.rolle;
  return k;
}
