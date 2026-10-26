// src/domain/rechtsregeln.js
// Kuratiertes, lokales Regel-Set als RECHTS-GRUNDLAGE für KI-Begründungen.
//
// WARUM: Eine KI soll Buchungs-Begründungen NICHT aus freier „Rechtskenntnis"
// erfinden (Halluzinationsgefahr), sondern auf Basis geprüfter §§ formulieren.
// Diese Datei ist diese Basis: häufige, oft missverstandene Fälle des deutschen
// Steuerrechts, jeweils mit Paragraph, Kurzregel und Dokumentations-Hinweis.
//
// EHRLICHER HINWEIS: bewusst kompakt und allgemein gehalten — KEINE abschließende
// Rechtsberatung, keine Gewähr auf Aktualität. Erweiterbar. Die Begründung ist als
// Eigenbeleg/Notiz für den Nutzer gedacht („parat, falls das Finanzamt fragt").

/**
 * @typedef {Object} Kontext
 * @property {string} [konto]   Kontonummer (SKR03)
 * @property {string} [text]    Beleg-/Buchungstext
 * @property {number} [betragCent] Bruttobetrag in Cent
 * @property {boolean} [kleinunternehmer]
 */

const re = (p) => new RegExp(p, 'i');

/** @type {{id:string, paragraph:string, kurz:string, dokumentation:string, test:(k:Kontext)=>boolean}[]} */
export const RECHTSREGELN = [
  {
    id: 'bewirtung',
    paragraph: '§ 4 Abs. 5 S. 1 Nr. 2 EStG',
    kurz: 'Geschäftliche Bewirtung ist zu 70 % als Betriebsausgabe abziehbar (30 % nicht abziehbar).',
    dokumentation: 'Bewirtungsbeleg mit Anlass und Namen aller Teilnehmer aufbewahren.',
    test: (k) => re('bewirt|restaurant|gaststätte|gaststaette|geschäftsessen|geschaeftsessen|geschäftsfreunde').test(k.text || ''),
  },
  {
    id: 'geschenke',
    paragraph: '§ 4 Abs. 5 S. 1 Nr. 1 EStG',
    kurz: 'Geschenke an Geschäftsfreunde sind nur bis 35 € pro Empfänger und Jahr abziehbar; darüber nicht abziehbar.',
    dokumentation: 'Empfänger und Anlass dokumentieren; Grenze pro Person und Jahr beachten.',
    test: (k) => re('geschenk|präsent|praesent|aufmerksamkeit').test(k.text || ''),
  },
  {
    id: 'gwg',
    paragraph: '§ 6 Abs. 2 EStG',
    kurz: 'Geringwertige Wirtschaftsgüter bis 800 € netto können im Jahr der Anschaffung sofort abgeschrieben werden.',
    dokumentation: 'Bei höherem Wert: planmäßige Abschreibung (AfA) über die Nutzungsdauer prüfen.',
    test: (k) => re('gwg|geringwertig|anschaffung|werkzeug|laptop|notebook|monitor|büromöbel|bueromoebel').test(k.text || ''),
  },
  {
    id: 'kfz',
    paragraph: '§ 6 Abs. 1 Nr. 4 EStG',
    kurz: 'Bei betrieblichem Fahrzeug mit Privatnutzung ist ein privater Nutzungsanteil anzusetzen (1-%-Regel oder Fahrtenbuch).',
    dokumentation: 'Nutzungsart festhalten; bei Fahrtenbuch lückenlose Aufzeichnung.',
    test: (k) => re('kfz|pkw|firmenwagen|fahrzeug|tankstelle|benzin|diesel|leasing.*auto').test(k.text || ''),
  },
  {
    id: 'telekommunikation',
    paragraph: '§ 4 Abs. 4 EStG (betriebliche Veranlassung)',
    kurz: 'Telefon/Internet bei gemischter Nutzung nur mit dem betrieblichen Anteil als Betriebsausgabe ansetzen.',
    dokumentation: 'Privaten Anteil schätzen/aufteilen und Aufteilungsmaßstab notieren.',
    test: (k) => re('telefon|handy|mobilfunk|internet|telekom|vodafone|festnetz').test(k.text || ''),
  },
  {
    id: 'reisekosten',
    paragraph: '§ 9 Abs. 4a EStG / R 9.6 LStR',
    kurz: 'Bei Geschäftsreisen sind Verpflegungsmehraufwand (Pauschalen) und Übernachtung abziehbar.',
    dokumentation: 'Reiseanlass, Dauer und Ort dokumentieren; Pauschbeträge je Abwesenheit beachten.',
    test: (k) => re('reise|verpflegung|übernachtung|uebernachtung|hotel|dienstreise').test(k.text || ''),
  },
  {
    id: 'arbeitszimmer',
    paragraph: '§ 4 Abs. 5 S. 1 Nr. 6b / 6c EStG',
    kurz: 'Häusliches Arbeitszimmer nur bei Mittelpunkt der Tätigkeit voll abziehbar; sonst Tagespauschale (Homeoffice).',
    dokumentation: 'Nutzung als Mittelpunkt prüfen; alternativ Tagespauschale ansetzen und Tage festhalten.',
    test: (k) => re('arbeitszimmer|homeoffice|home-office|häusliches büro').test(k.text || ''),
  },
  {
    id: 'fortbildung',
    paragraph: '§ 4 Abs. 4 EStG',
    kurz: 'Betrieblich veranlasste Fortbildung/Seminare sind in voller Höhe Betriebsausgabe.',
    dokumentation: 'Beruflichen Bezug der Fortbildung dokumentieren (Thema, Veranstalter).',
    test: (k) => re('fortbildung|seminar|schulung|weiterbildung|kurs|workshop|konferenz').test(k.text || ''),
  },
  {
    id: 'anlage_afa',
    paragraph: '§ 7 EStG (AfA)',
    kurz: 'Wirtschaftsgüter über 800 € netto sind nicht sofort, sondern planmäßig über die Nutzungsdauer abzuschreiben (AfA).',
    dokumentation: 'In das Anlageverzeichnis aufnehmen; Nutzungsdauer nach AfA-Tabelle ansetzen.',
    test: (k) => re('anlage|abschreibung|afa|maschine|investition').test(k.text || ''),
  },
  {
    id: 'bewirtung_personal',
    paragraph: '§ 19 Abs. 1 Nr. 1a EStG',
    kurz: 'Betriebsveranstaltungen sind bis 110 € je Arbeitnehmer und Veranstaltung (max. zwei/Jahr) steuerfrei.',
    dokumentation: 'Teilnehmerzahl und Anlass festhalten; Freibetrag je Veranstaltung beachten.',
    test: (k) => re('betriebsfeier|betriebsveranstaltung|weihnachtsfeier|sommerfest|firmenfeier').test(k.text || ''),
  },
  {
    id: 'nicht_abziehbar',
    paragraph: '§ 4 Abs. 5 S. 1 Nr. 8 / § 12 EStG',
    kurz: 'Bußgelder, Geldstrafen und privat veranlasste Kosten sind keine Betriebsausgaben.',
    dokumentation: 'Privatanteil ausscheiden; Strafen/Bußgelder nicht als Aufwand buchen.',
    test: (k) => re('bußgeld|bussgeld|strafe|geldstrafe|verwarnung|privat\\b|privatentnahme').test(k.text || ''),
  },
  {
    id: 'kleinbetragsrechnung',
    paragraph: '§ 33 UStDV',
    kurz: 'Bei Rechnungen bis 250 € (brutto) genügen vereinfachte Pflichtangaben (ohne Empfängername/Steuernummer).',
    dokumentation: 'Datum, Aussteller, Leistung, Bruttobetrag und Steuersatz müssen erkennbar sein.',
    test: (k) => Number(k.betragCent) > 0 && Number(k.betragCent) <= 25000,
  },
  {
    id: 'kleinunternehmer',
    paragraph: '§ 19 UStG',
    kurz: 'Als Kleinunternehmer wird keine Umsatzsteuer ausgewiesen; ein Vorsteuerabzug ist ausgeschlossen.',
    dokumentation: 'Rechnungen ohne USt-Ausweis; Hinweis auf § 19 UStG auf Ausgangsrechnungen.',
    test: (k) => !!k.kleinunternehmer,
  },
];

/**
 * Findet die zum Kontext passenden Rechtsregeln (kann mehrere sein).
 * @param {Kontext} kontext
 * @returns {typeof RECHTSREGELN}
 */
export function findeRechtsregeln(kontext) {
  const k = kontext || {};
  return RECHTSREGELN.filter((r) => {
    try { return r.test(k); } catch { return false; }
  });
}

/**
 * Baut eine on-device-Begründung (ohne KI) aus den passenden Regeln. Dient als
 * Fallback und als Rohstoff/Grounding für die KI-Formulierung.
 * @param {Kontext} kontext
 * @returns {string}
 */
export function onDeviceBegruendung(kontext) {
  const treffer = findeRechtsregeln(kontext);
  if (!treffer.length) return '';
  return treffer
    .map((r) => `${r.kurz} (${r.paragraph}) ${r.dokumentation}`)
    .join(' ');
}
