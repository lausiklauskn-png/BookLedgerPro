// src/domain/gdpdu.js
// GoBD/GDPdU-Datenträgerüberlassung („Z3"): Datentabellen (CSV) + Beschreibungsdatei
// `index.xml` (GDPdU-Beschreibungsstandard, gdpdu-01-09-2004.dtd) für die digitale
// Betriebsprüfung (z.B. Prüfsoftware IDEA). Reine, testbare Funktionen.
//
// EHRLICHER HINWEIS: GDPdU-Beschreibungsstandard-ORIENTIERT. Die DTD `gdpdu-01-09-2004.dtd`
// ist die öffentliche Standarddatei der Finanzverwaltung und wird vom Prüfer-Tool
// mitgeliefert — sie ist hier NICHT eingepackt (um keine abweichende Kopie zu verteilen);
// `index.xml` referenziert sie per DOCTYPE. Vor einer echten Prüfung mit IDEA testen.
// KEIN DSFinV-K-Kassendatenexport (eigener Standard).

import { centsToComma } from './export.js';
import { KONTOART } from './accounts.js';

function xmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function csvField(v) {
  const s = v == null ? '' : String(v);
  return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvRows(rows) { return rows.map((r) => r.map(csvField).join(';')).join('\r\n'); }

function inPeriode(datum, periode) {
  if (!periode) return true;
  if (periode.von && datum < periode.von) return false;
  if (periode.bis && datum > periode.bis) return false;
  return true;
}

// Spaltenbeschreibung je Tabelle: { name, typ:'alpha'|'num'|'date', accuracy? }.
export const TABELLE_BUCHUNGEN = {
  datei: 'buchungen.csv', name: 'Buchungsjournal',
  beschreibung: 'Festgeschriebene Buchungssätze (eine Zeile je Buchungszeile).',
  spalten: [
    { name: 'Datum', typ: 'date' },
    { name: 'Belegnummer', typ: 'num', accuracy: 0 },
    { name: 'Buchungstext', typ: 'alpha' },
    { name: 'Konto', typ: 'alpha' },
    { name: 'Kontobezeichnung', typ: 'alpha' },
    { name: 'Soll', typ: 'num', accuracy: 2 },
    { name: 'Haben', typ: 'num', accuracy: 2 },
    { name: 'Kostenstelle', typ: 'alpha' },
    { name: 'Status', typ: 'alpha' },
  ],
};
export const TABELLE_KONTEN = {
  datei: 'konten.csv', name: 'Kontenplan',
  beschreibung: 'Kontenstammdaten (Nummer, Bezeichnung, Art, USt-Satz).',
  spalten: [
    { name: 'Kontonummer', typ: 'alpha' },
    { name: 'Bezeichnung', typ: 'alpha' },
    { name: 'Kontoart', typ: 'alpha' },
    { name: 'USt-Satz', typ: 'num', accuracy: 0 },
  ],
};

/** Buchungsjournal-CSV (nur festgeschriebene), Spalten gem. TABELLE_BUCHUNGEN. */
export function gdpduCsvBuchungen(buchungen, kontoIndex, periode) {
  const rows = [TABELLE_BUCHUNGEN.spalten.map((s) => s.name)];
  const fest = (buchungen || [])
    .filter((b) => b.seq != null && inPeriode(b.datum, periode))
    .sort((a, b) => a.seq - b.seq);
  for (const b of fest) {
    for (const z of b.zeilen || []) {
      const k = kontoIndex[z.konto];
      rows.push([
        b.datum, b.seq, b.beschreibung || '', z.konto, k ? k.name : '',
        z.seite === 'S' ? centsToComma(z.betrag) : '',
        z.seite === 'H' ? centsToComma(z.betrag) : '',
        b.kostenstelle || '', b.status || '',
      ]);
    }
  }
  return csvRows(rows);
}

/** Kontenplan-CSV, Spalten gem. TABELLE_KONTEN. */
export function gdpduCsvKonten(konten) {
  const rows = [TABELLE_KONTEN.spalten.map((s) => s.name)];
  for (const k of konten || []) {
    rows.push([k.nummer, k.name, k.art || '', k.ust != null ? String(k.ust) : '']);
  }
  return csvRows(rows);
}

function spalteXml(s) {
  const inner = s.typ === 'date'
    ? '<Date><Format>YYYY-MM-DD</Format></Date>'
    : s.typ === 'num'
      ? `<Numeric><Accuracy>${s.accuracy ?? 2}</Accuracy></Numeric>`
      : '<AlphaNumeric/>';
  return `        <VariableColumn>\n          <Name>${xmlEscape(s.name)}</Name>\n          ${inner}\n        </VariableColumn>`;
}

function tabelleXml(tab) {
  const cols = tab.spalten.map(spalteXml).join('\n');
  return [
    '    <Table>',
    `      <URL><File>${xmlEscape(tab.datei)}</File></URL>`,
    `      <Name>${xmlEscape(tab.name)}</Name>`,
    `      <Description>${xmlEscape(tab.beschreibung)}</Description>`,
    '      <DecimalSymbol>,</DecimalSymbol>',
    '      <DigitGroupingSymbol>.</DigitGroupingSymbol>',
    '      <Separator>;</Separator>',
    '      <Encoding>UTF-8</Encoding>',
    '      <Range><From>2</From></Range>',
    '      <VariableLength>',
    cols,
    '      </VariableLength>',
    '    </Table>',
  ].join('\n');
}

/** Beschreibungsdatei index.xml (GDPdU-Beschreibungsstandard) für die angegebenen Tabellen. */
export function buildGdpduIndexXml(meta = {}, tabellen = [TABELLE_BUCHUNGEN, TABELLE_KONTEN]) {
  const lieferant = meta.firma || 'BookLedgerPro';
  const mediaName = `BookLedgerPro GoBD-Export${meta.jahr ? ' ' + meta.jahr : ''}`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE DataSet SYSTEM "gdpdu-01-09-2004.dtd">',
    '<DataSet>',
    '  <Version>1.0</Version>',
    '  <DataSupplier>',
    `    <Name>${xmlEscape(lieferant)}</Name>`,
    `    <Location>${xmlEscape(meta.ort || '')}</Location>`,
    `    <Comment>${xmlEscape('Export aus BookLedgerPro (GDPdU-orientiert)' + (meta.steuernummer ? ', Steuernr. ' + meta.steuernummer : ''))}</Comment>`,
    '  </DataSupplier>',
    '  <Media>',
    `    <Name>${xmlEscape(mediaName)}</Name>`,
    ...tabellen.map(tabelleXml),
    '  </Media>',
    '</DataSet>',
  ].join('\n');
}

const INFO_TXT = [
  'GoBD / GDPdU-Datenträgerüberlassung ("Z3") — Export aus BookLedgerPro',
  '',
  'Inhalt:',
  '  index.xml      Beschreibungsdatei (GDPdU-Beschreibungsstandard)',
  '  buchungen.csv  Festgeschriebenes Buchungsjournal',
  '  konten.csv     Kontenplan',
  '',
  'Die zugehörige DTD "gdpdu-01-09-2004.dtd" ist die öffentliche Standarddatei der',
  'Finanzverwaltung und wird von der Prüfsoftware (z. B. IDEA) bereitgestellt; sie ist',
  'in diesem Paket bewusst NICHT enthalten, um keine abweichende Kopie zu verteilen.',
  '',
  'EHRLICHER HINWEIS: GDPdU-Beschreibungsstandard-ORIENTIERT. Vor einer echten',
  'Betriebsprüfung mit der Prüfsoftware testen. Kein DSFinV-K-Kassendatenexport.',
].join('\r\n');

/**
 * Baut die Dateiliste des GoBD/GDPdU-Pakets (für zipFiles).
 * @returns {Array<{name:string, data:string}>}
 */
export function buildGdpduPaket(buchungen, konten, kontoIndex, meta = {}) {
  return [
    { name: 'index.xml', data: buildGdpduIndexXml(meta) },
    { name: 'buchungen.csv', data: gdpduCsvBuchungen(buchungen, kontoIndex, meta.periode) },
    { name: 'konten.csv', data: gdpduCsvKonten(konten) },
    { name: 'gdpdu-info.txt', data: INFO_TXT },
  ];
}
