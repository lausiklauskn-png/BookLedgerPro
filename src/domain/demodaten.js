// src/domain/demodaten.js
// Deterministische Simulations-/Testdaten (kein Echtbetrieb): ein Demo-Mandant in zwei
// Größen ("klein" = Freiberufler/Kleinbetrieb, "gross" = Volumen eines größeren Betriebs).
// Daraus lassen sich ECHTE Export-Dateien (DATEV-EXTF, ELSTER-USt-VA, EÜR, SuSa, Kontenblatt,
// Kassenbuch, GDPdU-ZIP) erzeugen und gegen die dokumentierten Vergleichswerte in
// docs/TESTDATEN.md prüfen — ohne DATEV-/ELSTER-Zugang. Reine Funktionen.

import { seedAccounts } from './accounts.js';
import { computeEUR } from './taxes.js';
import { summenSaldenliste, kontenblatt, anlageEUR } from './berichte.js';
import { kassenbuchEintraege, kassenbericht } from './kassenbuch.js';
import { anlagenverzeichnis } from './anlagen.js';
import {
  buildDatevExtf, buildUstVa, buildElsterVaPaket, eurToCsv,
  buildSusaCsv, buildAnlageEURCsv, buildKassenbuchCsv, buildKontenblattCsv, buildAnlagenverzeichnisCsv,
} from './export.js';
import { buildGdpduPaket } from './gdpdu.js';

export const DEMO_JAHR = 2026;

function fest(seq, datum, beschreibung, zeilen) {
  return { seq, datum, status: 'festgeschrieben', beschreibung, zeilen };
}

export function demoKonten() { return seedAccounts(); }

// ---- "klein": explizite Buchungen mit hand-geprüften Vergleichswerten (siehe TESTDATEN.md) --
function kleinSzenario() {
  const buchungen = [
    fest(1, '2026-01-15', 'Ausgangsrechnung 19% USt', [
      { konto: '1200', seite: 'S', betrag: 119000 }, { konto: '8400', seite: 'H', betrag: 100000 }, { konto: '1776', seite: 'H', betrag: 19000 }]),
    fest(2, '2026-02-10', 'Ausgangsrechnung 7% USt', [
      { konto: '1200', seite: 'S', betrag: 10700 }, { konto: '8300', seite: 'H', betrag: 10000 }, { konto: '1771', seite: 'H', betrag: 700 }]),
    fest(3, '2026-03-05', 'Barverkauf (steuerfrei §4)', [
      { konto: '1000', seite: 'S', betrag: 5000 }, { konto: '8200', seite: 'H', betrag: 5000 }]),
    fest(4, '2026-03-20', 'Miete März', [
      { konto: '4210', seite: 'S', betrag: 80000 }, { konto: '1200', seite: 'H', betrag: 80000 }]),
    fest(5, '2026-04-08', 'Bürobedarf 19% Vorsteuer', [
      { konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }]),
    fest(6, '2026-05-02', 'Cloud-Dienst §13b (Reverse-Charge)', [
      { konto: '4950', seite: 'S', betrag: 10000 }, { konto: '1577', seite: 'S', betrag: 1900 }, { konto: '1787', seite: 'H', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 10000 }]),
    fest(7, '2026-06-30', 'AfA Laptop (linear)', [
      { konto: '4830', seite: 'S', betrag: 40000 }, { konto: '0400', seite: 'H', betrag: 40000 }]),
    fest(8, '2026-07-15', 'Bewirtung 70/30', [
      { konto: '4650', seite: 'S', betrag: 7000 }, { konto: '4654', seite: 'S', betrag: 3000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }]),
  ];
  const anlagen = [{ bezeichnung: 'Laptop', akNettoCents: 120000, anschaffungsdatum: '2026-01-10', methode: 'linear', nutzungsdauerJahre: 3, anlageKonto: '0400' }];
  const anfangsbestaende = [{ konto: '1200', jahr: 2026, betragCent: 500000 }];
  return { buchungen, anlagen, anfangsbestaende };
}

// ---- "gross": generiertes Volumen (monatlich), prüft Konsistenz im Maßstab ----
function grossSzenario() {
  const buchungen = [];
  let seq = 0;
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    buchungen.push(fest(++seq, `2026-${mm}-05`, `Umsatzerlöse 19% (${mm})`, [
      { konto: '1200', seite: 'S', betrag: 5950000 }, { konto: '8400', seite: 'H', betrag: 5000000 }, { konto: '1776', seite: 'H', betrag: 950000 }]));
    buchungen.push(fest(++seq, `2026-${mm}-10`, `Personalkosten (${mm})`, [
      { konto: '4120', seite: 'S', betrag: 1800000 }, { konto: '1200', seite: 'H', betrag: 1800000 }]));
    buchungen.push(fest(++seq, `2026-${mm}-15`, `Miete (${mm})`, [
      { konto: '4210', seite: 'S', betrag: 300000 }, { konto: '1200', seite: 'H', betrag: 300000 }]));
    buchungen.push(fest(++seq, `2026-${mm}-20`, `Wareneinkauf 19% (${mm})`, [
      { konto: '3400', seite: 'S', betrag: 2000000 }, { konto: '1576', seite: 'S', betrag: 380000 }, { konto: '1200', seite: 'H', betrag: 2380000 }]));
  }
  for (let q = 1; q <= 4; q++) {
    const mm = String(q * 3).padStart(2, '0');
    buchungen.push(fest(++seq, `2026-${mm}-25`, `Cloud §13b Q${q}`, [
      { konto: '4950', seite: 'S', betrag: 300000 }, { konto: '1577', seite: 'S', betrag: 57000 }, { konto: '1787', seite: 'H', betrag: 57000 }, { konto: '1200', seite: 'H', betrag: 300000 }]));
  }
  buchungen.push(fest(++seq, '2026-06-30', 'AfA Maschine (linear)', [
    { konto: '4830', seite: 'S', betrag: 1200000 }, { konto: '0400', seite: 'H', betrag: 1200000 }]));
  const anlagen = [{ bezeichnung: 'Maschine', akNettoCents: 3600000, anschaffungsdatum: '2026-01-02', methode: 'linear', nutzungsdauerJahre: 3, anlageKonto: '0400' }];
  const anfangsbestaende = [{ konto: '1200', jahr: 2026, betragCent: 5000000 }];
  return { buchungen, anlagen, anfangsbestaende };
}

// ---- "quartal": volles Vierteljahr (Q1 2026) quer durch ALLE Bereiche -------
// Zeigt, „wie es nach einem Vierteljahr aussieht": Erlöse (19/7/steuerfrei),
// Reverse-Charge §13b, Bewirtung 70/30, Vorsteuer, Kfz/Tank, Telefon, Reise (7+19),
// Personal (Brutto-Methode), AfA, GWG, Bankgebühren — plus eine versehentliche
// DOPPELBUCHUNG, die STORNIERT wird (GoBD: Storno statt Löschen). Dazu Stammdaten:
// Kunden, Aufträge (offen/berechnet+Teilzahlung), Mitarbeiter+Zeiten, Eingangsrechnungen
// (bezahlt/offen/storniert) — von der Store-Glue über die echten APIs geschrieben.
// `_storno` markiert die zu stornierende Buchung; `_key`/`_kundeKey`/`_buchungKey` erlauben
// der Glue, zur Laufzeit erzeugte IDs zu verknüpfen (Auftrag → gebuchte Rechnung).
function quartalSzenario() {
  const buchungen = [
    fest(1, '2026-01-03', 'GWG Monitor (19% Vorsteuer)', [
      { konto: '0480', seite: 'S', betrag: 35000 }, { konto: '1576', seite: 'S', betrag: 6650 }, { konto: '1200', seite: 'H', betrag: 41650 }]),
    { ...fest(2, '2026-01-08', 'Ausgangsrechnung 2026-0001 Nordlicht Design GmbH (19%)', [
      { konto: '1400', seite: 'S', betrag: 595000 }, { konto: '8400', seite: 'H', betrag: 500000 }, { konto: '1776', seite: 'H', betrag: 95000 }]), kostenstelle: '2000' },
    { ...fest(3, '2026-01-12', 'Bürobedarf KontorPlus Bürohandel (19% Vorsteuer)', [
      { konto: '4930', seite: 'S', betrag: 10000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }]), _beleg: 'beleg-buerobedarf.jpg' },
    fest(4, '2026-01-15', 'Miete Januar', [
      { konto: '4210', seite: 'S', betrag: 80000 }, { konto: '1200', seite: 'H', betrag: 80000 }]),
    { ...fest(5, '2026-01-20', 'Tankbeleg ARALUX Station (19% Vorsteuer, bar)', [
      { konto: '4530', seite: 'S', betrag: 6714 }, { konto: '1576', seite: 'S', betrag: 1276 }, { konto: '1000', seite: 'H', betrag: 7990 }]), _beleg: 'beleg-tank.jpg' },
    fest(6, '2026-01-31', 'Zahlungseingang Rechnung 2026-0001 (Bank)', [
      { konto: '1200', seite: 'S', betrag: 595000 }, { konto: '1400', seite: 'H', betrag: 595000 }]),
    { ...fest(7, '2026-02-02', 'Cloud-Dienst NimbusSoft §13b (Reverse-Charge)', [
      { konto: '4950', seite: 'S', betrag: 10000 }, { konto: '1577', seite: 'S', betrag: 1900 }, { konto: '1787', seite: 'H', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 10000 }]), _beleg: 'beleg-cloud-13b.jpg' },
    fest(8, '2026-02-05', 'Barverkauf 7% (Café Morgenrot)', [
      { konto: '1200', seite: 'S', betrag: 10700 }, { konto: '8300', seite: 'H', betrag: 10000 }, { konto: '1771', seite: 'H', betrag: 700 }]),
    fest(9, '2026-02-10', 'Online-Werbung (19% Vorsteuer)', [
      { konto: '4600', seite: 'S', betrag: 50000 }, { konto: '1576', seite: 'S', betrag: 9500 }, { konto: '1200', seite: 'H', betrag: 59500 }]),
    fest(10, '2026-02-14', 'Steuerfreier Umsatz §4 (bar)', [
      { konto: '1000', seite: 'S', betrag: 8000 }, { konto: '8100', seite: 'H', betrag: 8000 }]),
    fest(11, '2026-02-15', 'Miete Februar', [
      { konto: '4210', seite: 'S', betrag: 80000 }, { konto: '1200', seite: 'H', betrag: 80000 }]),
    { ...fest(12, '2026-02-15', 'Miete Februar (versehentliche Doppelbuchung)', [
      { konto: '4210', seite: 'S', betrag: 80000 }, { konto: '1200', seite: 'H', betrag: 80000 }]), _storno: true },
    fest(13, '2026-02-20', 'Gehalt Februar (Brutto-Methode)', [
      { konto: '4120', seite: 'S', betrag: 200000 }, { konto: '4130', seite: 'S', betrag: 40000 },
      { konto: '1740', seite: 'H', betrag: 140000 }, { konto: '1741', seite: 'H', betrag: 40000 }, { konto: '1742', seite: 'H', betrag: 60000 }]),
    { ...fest(14, '2026-02-28', 'Bewirtung 70/30 (Trattoria Da Vinci)', [
      { konto: '4650', seite: 'S', betrag: 7000 }, { konto: '4654', seite: 'S', betrag: 3000 }, { konto: '1576', seite: 'S', betrag: 1900 }, { konto: '1200', seite: 'H', betrag: 11900 }]), _beleg: 'beleg-bewirtung.jpg' },
    { ...fest(15, '2026-03-05', 'Wareneinkauf 19% (Hansa Großhandel)', [
      { konto: '3400', seite: 'S', betrag: 200000 }, { konto: '1576', seite: 'S', betrag: 38000 }, { konto: '1200', seite: 'H', betrag: 238000 }]), kostenstelle: '3000' },
    fest(16, '2026-03-10', 'Telefon/Internet (19% Vorsteuer)', [
      { konto: '4920', seite: 'S', betrag: 5000 }, { konto: '1576', seite: 'S', betrag: 950 }, { konto: '1200', seite: 'H', betrag: 5950 }]),
    { ...fest(17, '2026-03-18', 'Hotel/Reisekosten (7% + 19% Vorsteuer)', [
      { konto: '4670', seite: 'S', betrag: 13000 }, { konto: '1571', seite: 'S', betrag: 700 }, { konto: '1576', seite: 'S', betrag: 570 }, { konto: '1200', seite: 'H', betrag: 14270 }]), _beleg: 'beleg-hotel.jpg' },
    { ...fest(18, '2026-03-25', 'Ausgangsrechnung 2026-0002 Hafenkontor UG (19%)', [
      { konto: '1400', seite: 'S', betrag: 357000 }, { konto: '8400', seite: 'H', betrag: 300000 }, { konto: '1776', seite: 'H', betrag: 57000 }]), kostenstelle: '2000', _key: 'rechnung_hafenkontor' },
    fest(19, '2026-03-30', 'Bankgebühren', [
      { konto: '4970', seite: 'S', betrag: 1500 }, { konto: '1200', seite: 'H', betrag: 1500 }]),
    fest(20, '2026-03-31', 'AfA Laptop (linear, Q1 anteilig)', [
      { konto: '4830', seite: 'S', betrag: 10000 }, { konto: '0400', seite: 'H', betrag: 10000 }]),
    fest(21, '2026-03-31', 'GWG Monitor Sofortabschreibung', [
      { konto: '4855', seite: 'S', betrag: 35000 }, { konto: '0480', seite: 'H', betrag: 35000 }]),
  ];
  const anlagen = [
    { bezeichnung: 'Laptop', akNettoCents: 120000, anschaffungsdatum: '2026-01-02', methode: 'linear', nutzungsdauerJahre: 3, anlageKonto: '0400' },
    { bezeichnung: 'Monitor (GWG)', akNettoCents: 35000, anschaffungsdatum: '2026-01-03', methode: 'gwg', nutzungsdauerJahre: 1, anlageKonto: '0480' },
  ];
  const anfangsbestaende = [
    { konto: '1200', jahr: 2026, betragCent: 800000 },
    { konto: '1000', jahr: 2026, betragCent: 30000 },
  ];
  // Stammdaten — von domain/demodaten-store.js über die echten CRM-/Payables-APIs geschrieben.
  const kunden = [
    { _key: 'k_nordlicht', name: 'Nordlicht Design GmbH', email: 'buchhaltung@nordlicht-design.example', adresse: 'Lindenweg 4, 30159 Hannover', ustId: 'DE123456789', telefon: '0511 5550101' },
    { _key: 'k_cafe', name: 'Café Morgenrot e.K.', email: 'hallo@cafe-morgenrot.example', adresse: 'Marktplatz 3, 50667 Köln' },
    { _key: 'k_hafen', name: 'Hafenkontor UG (haftungsbeschränkt)', email: 'rechnung@hafenkontor.example', adresse: 'Speicherstraße 12, 20457 Hamburg', ustId: 'DE987654321' },
  ];
  const auftraege = [
    { _kundeKey: 'k_nordlicht', titel: 'Website-Relaunch', status: 'angelegt', zahlungszielTage: 14, kostenstelle: '2000',
      positionen: [{ menge: 18, einheit: 'h', leistung: 'Konzept & Design', einzelpreisCent: 9000, ustSatz: 19 }, { menge: 1, einheit: 'Pauschale', leistung: 'Hosting-Einrichtung', einzelpreisCent: 15000, ustSatz: 19 }] },
    { _kundeKey: 'k_hafen', titel: 'Beratungsprojekt Q1', status: 'berechnet', _buchungKey: 'rechnung_hafenkontor', rechnungNummer: '2026-0002', rechnungDatum: '2026-03-25', zahlungszielTage: 14,
      positionen: [{ menge: 30, einheit: 'h', leistung: 'Prozessberatung', einzelpreisCent: 10000, ustSatz: 19 }],
      _zahlungen: [{ datum: '2026-04-05', betragCent: 100000, ref: 'Teilzahlung' }] },
    { _kundeKey: 'k_cafe', titel: 'Menükarten-Gestaltung', status: 'angelegt', zahlungszielTage: 7,
      positionen: [{ menge: 1, einheit: 'Pauschale', leistung: 'Gestaltung Menükarten', einzelpreisCent: 40000, ustSatz: 19 }] },
  ];
  const mitarbeiter = [
    { _key: 'm_jana', name: 'Jana Berg', stundenlohnCent: 2500 },
    { _key: 'm_tom', name: 'Tom Kruse', stundenlohnCent: 2000 },
  ];
  const zeiten = [
    { _maKey: 'm_jana', datum: '2026-01-09', dauerMin: 240, kostenstelle: '2000', beschreibung: 'Designentwurf Nordlicht' },
    { _maKey: 'm_jana', datum: '2026-02-11', dauerMin: 180, kostenstelle: '2000', beschreibung: 'Werbekampagne' },
    { _maKey: 'm_tom', datum: '2026-03-06', dauerMin: 300, kostenstelle: '3000', beschreibung: 'Wareneingang prüfen' },
  ];
  const eingangsrechnungen = [
    { _key: 'er_kontor', kreditor: 'KontorPlus Bürohandel GmbH', rechnungsnr: '2026-0312', datum: '2026-01-12', zahlungszielTage: 14,
      positionen: [{ nettoCent: 10000, ustSatz: 19, aufwandKonto: '4930' }],
      _zahlungen: [{ datum: '2026-01-20', betragCent: 11900, ref: 'Überweisung' }] },
    { _key: 'er_hansa', kreditor: 'Hansa Großhandel KG', rechnungsnr: 'RG-5582', datum: '2026-03-05', zahlungszielTage: 30,
      positionen: [{ nettoCent: 200000, ustSatz: 19, aufwandKonto: '3400' }] },
    { _key: 'er_storno', kreditor: 'Fehlbuchung Service e.K.', rechnungsnr: 'X-001', datum: '2026-02-22',
      positionen: [{ nettoCent: 5000, ustSatz: 19, aufwandKonto: '4980' }], _storniert: true },
  ];
  // Belege ohne Buchung (bewusst „noch nicht verbucht") — realistischer Posteingang und
  // zugleich ein Test-Target für OCR (Vision EU) + „Konto-Vorschlag (SBKIM-Richter)".
  const belege = [
    { name: 'beleg-quittung-blumen.jpg', mediaType: 'image/jpeg', titel: 'Quittung Marktstand Blumen Sommer (50,00 € bar, unverbucht)' },
  ];
  return { buchungen, anlagen, anfangsbestaende, kunden, auftraege, mitarbeiter, zeiten, eingangsrechnungen, belege };
}

/** Demo-Mandant in drei Größen. @param {'klein'|'gross'|'quartal'} groesse */
export function demoMandant(groesse = 'klein') {
  const konten = demoKonten();
  const s = groesse === 'gross' ? grossSzenario() : groesse === 'quartal' ? quartalSzenario() : kleinSzenario();
  return { groesse, jahr: DEMO_JAHR, konten, ...s };
}

// ---- Vorbefüllung eines (Test-)Tresors -------------------------------------
// Reine Logik UNTER der Store-Glue (domain/demodaten-store.js), die einen frischen
// Sandbox-Tresor (docs/TEST_MODUS.md) mit den Demo-Daten füttert. Hier wird NICHTS
// geschrieben — nur die zu schreibenden Records aufbereitet (node-testbar). Die
// Buchungen werden in die Entwurfs-Form gebracht (ohne seq/status/Hash), damit die
// Glue sie über den ECHTEN Pfad `saveEntwurf` → `festschreiben` schreiben kann
// (lückenlose seq + GoBD-Hash-Kette wie im Echtbetrieb).

/**
 * Bringt die Demo-Buchungen eines Mandanten in die Entwurfs-Form `{datum, beschreibung,
 * zeilen}` und sortiert sie **chronologisch** (Datum, dann ursprüngliche seq) — die
 * Reihenfolge, in der die Glue sie festschreibt, damit die lückenlose seq der zeitlichen
 * Reihenfolge folgt. Rein/immutabel: die Eingabe-Buchungen bleiben unangetastet.
 * @returns {Array<{datum:string, beschreibung:string, zeilen:Array}>}
 */
export function demoEntwuerfe(mandant) {
  const buchungen = (mandant && mandant.buchungen) || [];
  return buchungen
    .map((b) => ({
      datum: b.datum,
      beschreibung: b.beschreibung || '',
      // Zeilen flach kopieren → die Glue/der Store kann sie unbedenklich weiterreichen.
      zeilen: (b.zeilen || []).map((z) => ({ ...z })),
      // Optionale Felder durchreichen (saveEntwurf ignoriert unbekannte; die Glue liest
      // `_key`/`_storno` für Verknüpfung bzw. Storno der festgeschriebenen Buchung).
      ...(b.kostenstelle ? { kostenstelle: b.kostenstelle } : {}),
      ...(b._key ? { _key: b._key } : {}),
      ...(b._storno ? { _storno: true } : {}),
      ...(b._beleg ? { _beleg: b._beleg } : {}),
      _seq: b.seq == null ? Infinity : b.seq,
    }))
    .sort((a, b) => (a.datum.localeCompare(b.datum)) || (a._seq - b._seq))
    .map(({ _seq, ...e }) => e);
}

/**
 * Vollständiger Vorbefüllungs-Plan für einen Test-Tresor: was die Glue der Reihe nach
 * schreibt. Konten kommen aus dem Standard-Seed (die Glue nutzt `ensureAccountsSeeded`,
 * daher hier nur informativ als Anzahl/Liste mitgeführt). @param {'klein'|'gross'} groesse
 * @returns {{groesse, jahr, buchungenEntwuerfe, anlagen, anfangsbestaende, konten}}
 */
export function demoBefuellungsplan(groesse = 'klein') {
  const mandant = demoMandant(groesse);
  return {
    groesse: mandant.groesse,
    jahr: mandant.jahr,
    konten: mandant.konten,
    buchungenEntwuerfe: demoEntwuerfe(mandant),
    anlagen: (mandant.anlagen || []).map((a) => ({ ...a })),
    anfangsbestaende: (mandant.anfangsbestaende || []).map((a) => ({ ...a })),
    // Stammdaten (nur „quartal"; bei klein/gross leer) — von der Store-Glue über die
    // echten CRM-/Payables-APIs geschrieben. Tiefe Kopie, damit die reine Vorlage bleibt.
    kunden: (mandant.kunden || []).map((k) => ({ ...k })),
    auftraege: (mandant.auftraege || []).map((a) => ({ ...a, positionen: (a.positionen || []).map((p) => ({ ...p })), _zahlungen: (a._zahlungen || []).map((z) => ({ ...z })) })),
    mitarbeiter: (mandant.mitarbeiter || []).map((m) => ({ ...m })),
    zeiten: (mandant.zeiten || []).map((z) => ({ ...z })),
    eingangsrechnungen: (mandant.eingangsrechnungen || []).map((r) => ({ ...r, positionen: (r.positionen || []).map((p) => ({ ...p })), _zahlungen: (r._zahlungen || []).map((z) => ({ ...z })) })),
    belege: (mandant.belege || []).map((b) => ({ ...b })),
  };
}

const DEMO_README = [
  'BookLedgerPro — Demo-/Test-Exportpaket (SIMULIERTE Daten, kein Echtbetrieb)',
  '',
  'Dieses Paket wurde aus dem deterministischen Demo-Mandanten erzeugt, damit die',
  'Export-Formate mit ECHTEN Dateiendungen geprüft werden können — ohne DATEV-/ELSTER-Zugang.',
  'Die erwarteten Vergleichswerte stehen in docs/TESTDATEN.md. Abweichungen bitte dort',
  'gegen echtes DATEV/ELSTER abgleichen und melden.',
  '',
  'Ordner: datev/ (EXTF), ust-va/ (ELSTER-Datenpaket), euer/ (EÜR, SuSa, Anlage-EÜR),',
  'kasse/ (Kassenbuch), konten/ (Kontenblatt), anlagen/ (Anlagenverzeichnis), gdpdu/ (GoBD Z3).',
].join('\r\n');

/**
 * Baut die komplette Export-Dateiliste eines Demo-Mandanten (alle Formate) — für den
 * In-App-Download (zipFiles) und für Tests. @returns {Array<{name,data}>}
 */
export function demoExportDateien(mandant) {
  const b = mandant.buchungen;
  const jahr = mandant.jahr;
  const idx = {}; for (const k of mandant.konten) idx[k.nummer] = k;
  const p = { von: `${jahr}-01-01`, bis: `${jahr}-12-31` };
  const anfang1000 = (mandant.anfangsbestaende || []).find((a) => a.konto === '1000');
  const va = buildUstVa(b, idx, p);
  const dateien = [
    { name: 'datev/EXTF_Buchungsstapel.csv', data: buildDatevExtf(b, idx) },
    { name: 'ust-va/ust-va-elster.csv', data: buildElsterVaPaket(va, { jahr, firma: 'Demo-Mandant' }) },
    { name: 'euer/euer.csv', data: eurToCsv(computeEUR(b, idx, p)) },
    { name: 'euer/susa.csv', data: buildSusaCsv(summenSaldenliste(b, idx, p)) },
    { name: 'euer/anlage-euer.csv', data: buildAnlageEURCsv(anlageEUR(b, idx, p)) },
    { name: 'kasse/kassenbuch-1000.csv', data: buildKassenbuchCsv(kassenbericht(kassenbuchEintraege(b, '1000', p), anfang1000 ? anfang1000.betragCent : 0)) },
    { name: 'konten/kontenblatt-1200.csv', data: buildKontenblattCsv(kontenblatt(b, '1200', idx, p)) },
    { name: 'anlagen/anlagenverzeichnis.csv', data: buildAnlagenverzeichnisCsv(anlagenverzeichnis(mandant.anlagen || [], jahr)) },
    ...buildGdpduPaket(b, mandant.konten, idx, { jahr, periode: p }).map((f) => ({ name: 'gdpdu/' + f.name, data: f.data })),
    { name: 'README.txt', data: DEMO_README },
  ];
  return dateien;
}
