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

/** Demo-Mandant in zwei Größen. @param {'klein'|'gross'} groesse */
export function demoMandant(groesse = 'klein') {
  const konten = demoKonten();
  const s = groesse === 'gross' ? grossSzenario() : kleinSzenario();
  return { groesse, jahr: DEMO_JAHR, konten, ...s };
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
