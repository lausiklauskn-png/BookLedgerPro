// src/domain/export.js
// Export-Aufbereitung (rein, testbar): Buchungsjournal-CSV, DATEV-orientierte CSV,
// USt-Voranmeldung-Kennzahlen, EÜR-CSV.
//
// EHRLICHER HINWEIS: Die DATEV-Ausgabe ist DATEV-ORIENTIERT (klar dokumentierte
// Spalten), KEIN zertifiziertes EXTF-Format mit Steuerschlüssel-Mapping. Vor Übergabe
// an den Steuerberater prüfen. ELSTER-Einreichung erfolgt NICHT — es wird nur ein
// USt-VA-Datenpaket (amtliche Kennzahlen) erzeugt.

import { KONTOART, isVorsteuerKonto, isUmsatzsteuerKonto } from './accounts.js';
import { kontoBewegungen } from './taxes.js';

/** Cent → "1234,56" (Dezimalkomma, ohne Tausendertrenner) für CSV. */
export function centsToComma(cents) {
  return ((cents || 0) / 100).toFixed(2).replace('.', ',');
}

/** Ein CSV-Feld escapen (Semikolon-getrennt, deutsche Konvention). */
function csvField(v) {
  const s = v == null ? '' : String(v);
  return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvRow(fields) { return fields.map(csvField).join(';'); }
function csv(rows) { return rows.map(csvRow).join('\r\n'); }

function sortFest(buchungen) {
  return [...buchungen].sort((a, b) => {
    const sa = a.seq == null ? Infinity : a.seq, sb = b.seq == null ? Infinity : b.seq;
    return sa - sb;
  });
}

/** Buchungsjournal: eine Zeile je Buchungs-Zeile. */
export function buildLedgerCsv(buchungen, kontoIndex) {
  const rows = [['Datum', 'Nr', 'Buchungstext', 'Konto', 'Kontoname', 'Soll', 'Haben', 'Kostenstelle', 'Status']];
  for (const b of sortFest(buchungen)) {
    for (const z of b.zeilen || []) {
      const k = kontoIndex[z.konto];
      rows.push([
        b.datum, b.seq ?? '', b.beschreibung || '', z.konto, k ? k.name : '',
        z.seite === 'S' ? centsToComma(z.betrag) : '',
        z.seite === 'H' ? centsToComma(z.betrag) : '',
        b.kostenstelle || '', b.status,
      ]);
    }
  }
  return csv(rows);
}

/** DATEV-orientierter Buchungsstapel (nur festgeschriebene). */
export function buildDatevCsv(buchungen, kontoIndex) {
  const rows = [['Umsatz', 'SH', 'Konto', 'Gegenkonto', 'Belegdatum', 'Belegfeld1', 'Buchungstext', 'Kostenstelle']];
  for (const b of sortFest(buchungen)) {
    if (b.seq == null) continue; // nur festgeschriebene exportieren
    const zeilen = b.zeilen || [];
    if (zeilen.length === 2) {
      const soll = zeilen.find((z) => z.seite === 'S');
      const haben = zeilen.find((z) => z.seite === 'H');
      rows.push([centsToComma(soll.betrag), 'S', soll.konto, haben.konto, b.datum, b.seq, b.beschreibung || '', b.kostenstelle || '']);
    } else {
      // Mehrzeilig (z.B. mit USt-Split): je Zeile eine DATEV-Zeile, Gegenkonto leer.
      for (const z of zeilen) {
        rows.push([centsToComma(z.betrag), z.seite, z.konto, '', b.datum, b.seq, b.beschreibung || '', b.kostenstelle || '']);
      }
    }
  }
  return csv(rows);
}

// ---- DATEV EXTF (Buchungsstapel) -------------------------------------------
//
// EHRLICHER HINWEIS: Dies erzeugt eine EXTF-STRUKTUR (Header-Envelope + Konto/
// Gegenkonto-Brutto-Modell + Standard-Steuerschlüssel SKR03). Es ist KEIN
// vollständig zertifiziertes 116-Spalten-EXTF. Das Steuerschlüssel-Mapping deckt
// die Standardsätze (0/7/19 %) ab und ist vor Übergabe mit dem Berater/DATEV zu
// verifizieren (Kontenrahmen-/Versionsabhängig).

// SKR03-Standard-Steuerschlüssel (BU-Schlüssel): Vorsteuer 9/8, Umsatzsteuer 3/2.
const STEUERSCHLUESSEL = {
  ausgabe: { 19: '9', 7: '8' },
  einnahme: { 19: '3', 7: '2' },
};

/** 'YYYY-MM-DD' → 'TTMM' (Belegdatum im EXTF; Jahr stammt aus dem WJ im Header). */
function ddmm(datum) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum || '');
  return m ? m[3] + m[2] : '';
}

/**
 * Verdichtet eine Buchung (ggf. mit USt-Split) zum DATEV-Konto/Gegenkonto-Modell:
 * EIN Satz mit Bruttobetrag + Steuerschlüssel (DATEV rechnet die Steuer heraus).
 * Rein & testbar.
 * @returns {{umsatz:number, sh:'S'|'H', konto:string, gegenkonto:string, bu:string, satz:number, richtung:?string}}
 */
export function datevBuchungssatz(buchung, kontoIndex) {
  const z = buchung.zeilen || [];
  const istSteuer = (konto) => {
    const k = kontoIndex[konto];
    return !!(k && (k.rolle === 'vorsteuer' || k.rolle === 'umsatzsteuer'));
  };
  const steuer = z.find((x) => istSteuer(x.konto));
  let konto = '', gegenkonto = '', sh = 'S', satz = 0, richtung = null, umsatz = 0;
  if (steuer) {
    satz = Number((kontoIndex[steuer.konto] || {}).ust) || 0;
    if (steuer.seite === 'S') {                       // Vorsteuer → Ausgabe
      richtung = 'ausgabe';
      const aufwand = z.find((x) => x.seite === 'S' && !istSteuer(x.konto));
      const geld = z.find((x) => x.seite === 'H');
      konto = aufwand ? aufwand.konto : '';
      gegenkonto = geld ? geld.konto : '';
      umsatz = geld ? geld.betrag : 0; sh = 'S';
    } else {                                          // Umsatzsteuer → Einnahme
      richtung = 'einnahme';
      const erloes = z.find((x) => x.seite === 'H' && !istSteuer(x.konto));
      const geld = z.find((x) => x.seite === 'S');
      konto = erloes ? erloes.konto : '';
      gegenkonto = geld ? geld.konto : '';
      umsatz = geld ? geld.betrag : 0; sh = 'H';
    }
  } else {
    const s = z.find((x) => x.seite === 'S');
    const h = z.find((x) => x.seite === 'H');
    konto = s ? s.konto : '';
    gegenkonto = h ? h.konto : '';
    umsatz = s ? s.betrag : (h ? h.betrag : 0); sh = 'S';
    const ks = kontoIndex[konto];
    if (ks && ks.art === KONTOART.AUFWAND) richtung = 'ausgabe';
    else if (kontoIndex[gegenkonto] && kontoIndex[gegenkonto].art === KONTOART.ERTRAG) richtung = 'einnahme';
  }
  const bu = (richtung && STEUERSCHLUESSEL[richtung] && STEUERSCHLUESSEL[richtung][satz]) || '';
  return { umsatz, sh, konto, gegenkonto, bu, satz, richtung };
}

function pad2(n) { return String(n).padStart(2, '0'); }

/** Baut die EXTF-Header-Zeile (Envelope) mit Pflicht-/Standardfeldern. */
function extfHeaderZeile(opts, jahr) {
  const d = new Date();
  const ts = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}000`;
  const felder = [
    '"EXTF"', '700', '21', '"Buchungsstapel"', '13', ts, '', '"RE"', '', '',
    opts.berater || '', opts.mandant || '', `${jahr}0101`, '4',
    opts.von || '', opts.bis || '', `"${opts.bezeichnung || 'BookLedgerPro Buchungsstapel'}"`, '', '1', '0',
    String(opts.festschreibung ? 1 : 0), '"EUR"', '', '', '', '', '', '', '', '', '',
  ];
  return felder.join(';');
}

const EXTF_SPALTEN = [
  'Umsatz (ohne Soll-/Haben-Kz)', 'Soll-/Haben-Kennzeichen', 'WKZ Umsatz', 'Kurs',
  'Basis-Umsatz', 'WKZ Basis-Umsatz', 'Konto', 'Gegenkonto (ohne BU-Schlüssel)',
  'BU-Schlüssel', 'Belegdatum', 'Belegfeld 1', 'Belegfeld 2', 'Skonto', 'Buchungstext', 'Kostenstelle',
];

/**
 * DATEV-EXTF-Buchungsstapel (nur festgeschriebene Buchungen): Header-Envelope +
 * Spaltenüberschriften + Datenzeilen im Konto/Gegenkonto-Brutto-Modell.
 */
export function buildDatevExtf(buchungen, kontoIndex, opts = {}) {
  const fest = sortFest(buchungen).filter((b) => b.seq != null);
  const jahr = opts.jahr || Number((fest[0] && fest[0].datum || '').slice(0, 4)) || new Date().getFullYear();
  const zeilen = [extfHeaderZeile(opts, jahr), csvRow(EXTF_SPALTEN)];
  for (const b of fest) {
    const d = datevBuchungssatz(b, kontoIndex);
    if (!d.konto || !d.gegenkonto) continue;
    zeilen.push(csvRow([
      centsToComma(d.umsatz), d.sh, 'EUR', '', '', '',
      d.konto, d.gegenkonto, d.bu, ddmm(b.datum), b.seq, '', '',
      b.beschreibung || '', b.kostenstelle || '',
    ]));
  }
  return zeilen.join('\r\n');
}

/**
 * USt-Voranmeldung: amtliche Kennzahlen (Bemessungsgrundlagen + Steuer + Vorsteuer).
 * Kz 81 = Umsätze 19 %, Kz 86 = Umsätze 7 %, Kz 66 = Vorsteuer, Kz 83 = Zahllast.
 * Alle Werte in Cent.
 */
// Kennzahlen über die Standard-Inlandssätze hinaus: §13b (Leistungsempfänger),
// innergem. Erwerb, steuerfreie ig Lieferung / Ausfuhr. Reine Konto-Rollen-Zuordnung
// (siehe accounts.js). EHRLICH/PFLICHT: Die exakte Zuordnung ist am amtlichen ELSTER-
// USt-VA-Formular bzw. mit dem Berater zu verifizieren — bei §13b/EU im Zweifel Berater.
export function buildUstVa(buchungen, kontoIndex, periode) {
  const bew = kontoBewegungen(buchungen, periode);
  let kz81 = 0, kz86 = 0, kz81Steuer = 0, kz86Steuer = 0, kz66 = 0;
  let kz46 = 0, kz47 = 0, kz67 = 0;        // §13b Leistungsempfänger: BMG / Steuer / Vorsteuer
  let kz89 = 0, kz93 = 0, kz61 = 0;        // innergem. Erwerb: BMG / Steuer / Vorsteuer
  let kz41 = 0, kz43 = 0;                  // steuerfreie ig Lieferung / Ausfuhr (BMG)
  const bmg = (steuer, satz) => (satz ? Math.round((steuer * 100) / Number(satz)) : 0);
  for (const [nr, m] of Object.entries(bew)) {
    const k = kontoIndex[nr];
    if (!k) continue;
    const rolle = k.rolle;
    if (rolle === 'umsatzsteuer_13b') { const s = m.haben - m.soll; kz47 += s; kz46 += bmg(s, k.ust); }
    else if (rolle === 'vorsteuer_13b') { kz67 += m.soll - m.haben; }
    else if (rolle === 'umsatzsteuer_ig') { const s = m.haben - m.soll; kz93 += s; kz89 += bmg(s, k.ust); }
    else if (rolle === 'vorsteuer_ig') { kz61 += m.soll - m.haben; }
    else if (rolle === 'erloes_ig') { kz41 += m.haben - m.soll; }
    else if (rolle === 'erloes_ausfuhr') { kz43 += m.haben - m.soll; }
    else if (k.art === KONTOART.ERTRAG) {
      const netto = m.haben - m.soll;
      if (k.ust === 19) kz81 += netto;
      else if (k.ust === 7) kz86 += netto;
    } else if (isUmsatzsteuerKonto(k)) {
      const steuer = m.haben - m.soll;
      if (k.ust === 19) kz81Steuer += steuer;
      else if (k.ust === 7) kz86Steuer += steuer;
    } else if (isVorsteuerKonto(k)) {
      kz66 += m.soll - m.haben;
    }
  }
  // Zahllast inkl. Steuerschuldumkehr: geschuldete USt (47/93) erhöht, abziehbare
  // Vorsteuer (67/61) mindert; bei vollem Abzug heben sich 47/67 bzw. 93/61 auf.
  const kz83 = kz81Steuer + kz86Steuer + kz47 + kz93 - kz66 - kz67 - kz61;
  return { kz81, kz81Steuer, kz86, kz86Steuer, kz66, kz83, kz41, kz43, kz46, kz47, kz67, kz89, kz93, kz61 };
}

export function ustVaToCsv(va) {
  return csv([
    ['Kennzahl', 'Bezeichnung', 'Betrag'],
    ['41', 'Steuerfreie innergem. Lieferungen (§4 Nr.1b UStG)', centsToComma(va.kz41 || 0)],
    ['43', 'Weitere steuerfreie Umsätze mit Vorsteuerabzug (z.B. Ausfuhr)', centsToComma(va.kz43 || 0)],
    ['81', 'Bemessungsgrundlage Umsätze 19 %', centsToComma(va.kz81)],
    ['', 'darauf Umsatzsteuer 19 %', centsToComma(va.kz81Steuer)],
    ['86', 'Bemessungsgrundlage Umsätze 7 %', centsToComma(va.kz86)],
    ['', 'darauf Umsatzsteuer 7 %', centsToComma(va.kz86Steuer)],
    ['89', 'Innergem. Erwerbe 19 % (Bemessungsgrundlage)', centsToComma(va.kz89 || 0)],
    ['93', 'darauf Umsatzsteuer (innergem. Erwerb)', centsToComma(va.kz93 || 0)],
    ['46', 'Leistungen §13b (Leistungsempfänger) — Bemessungsgrundlage', centsToComma(va.kz46 || 0)],
    ['47', 'darauf Umsatzsteuer §13b', centsToComma(va.kz47 || 0)],
    ['66', 'Vorsteuerbeträge (§15 Abs.1 Nr.1)', centsToComma(va.kz66)],
    ['61', 'Vorsteuer aus innergem. Erwerb', centsToComma(va.kz61 || 0)],
    ['67', 'Vorsteuer aus Leistungen §13b', centsToComma(va.kz67 || 0)],
    ['83', 'Verbleibende USt-Vorauszahlung (Zahllast)', centsToComma(va.kz83)],
  ]);
}

/**
 * Offene-Posten-Liste der Verbindlichkeiten (Kreditoren) als CSV — für Liquiditätsplanung
 * und Übergabe an den Steuerberater. Erwartet (angereicherte) Posten aus
 * payables.offeneVerbindlichkeiten()/anreichereVerbindlichkeiten().
 */
export function buildOffeneVerbindlichkeitenCsv(posten) {
  const rows = [['Kreditor', 'Rechnungsnr', 'Datum', 'Fällig', 'Brutto', 'Bezahlt', 'Offen', 'Überfällig (Tage)']];
  let summe = 0;
  for (const p of posten || []) {
    summe += p.offenCent || 0;
    rows.push([
      p.name || '', p.referenz || '', p.datum || '', p.faelligAm || '',
      centsToComma(p.bruttoCent), centsToComma(p.bezahltCent), centsToComma(p.offenCent),
      p.ueberfaellig ? String(p.tageUeberfaellig) : '',
    ]);
  }
  rows.push(['', '', '', '', '', 'Summe offen', centsToComma(summe), '']);
  return csv(rows);
}

/**
 * Anlagenverzeichnis / AVEÜR-orientierte CSV zu einem Wirtschaftsjahr. Erwartet das
 * Ergebnis von anlagen.anlagenverzeichnis(anlagen, jahr).
 * EHRLICHER HINWEIS: Spaltenform ist AVEÜR-ORIENTIERT (nachvollziehbar), nicht das amtliche
 * Anlage-AVEÜR-Formular. Vor Übergabe an den Steuerberater prüfen.
 */
export function buildAnlagenverzeichnisCsv(verzeichnis) {
  const rows = [['Bezeichnung', 'Anschaffung', 'AK netto', 'Methode', 'Nutzungsdauer (J.)',
    `AfA ${verzeichnis.jahr}`, 'AfA kumuliert', 'Restbuchwert', 'Anlagekonto']];
  for (const z of verzeichnis.zeilen || []) {
    rows.push([
      z.bezeichnung || '', z.anschaffungsdatum || '', centsToComma(z.akNettoCents),
      z.methode || '', z.nutzungsdauerJahre || '',
      centsToComma(z.afaJahr), centsToComma(z.kumuliert), centsToComma(z.restbuchwert), z.anlageKonto || '',
    ]);
  }
  const s = verzeichnis.summen || {};
  rows.push(['', '', centsToComma(s.ak), '', '', centsToComma(s.afaJahr), centsToComma(s.kumuliert), centsToComma(s.restbuchwert), '']);
  return csv(rows);
}

/**
 * ELSTER-orientiertes USt-VA-Datenpaket: amtliche Kennzahlen (mit Code) + Meta (Steuernummer,
 * Zeitraum). EHRLICHER HINWEIS: KEIN ERiC-XML und KEIN Direktversand an ELSTER — eine
 * strukturierte Übergabedatei zur manuellen Erfassung/Prüfung. Vor Einreichung verifizieren.
 */
export function buildElsterVaPaket(va, meta = {}) {
  const z = (kz, wert) => [kz, centsToComma(wert || 0)];
  const rows = [
    ['# USt-Voranmeldung — Datenpaket (NICHT amtlich eingereicht)'],
    ['Steuernummer', meta.steuernummer || ''],
    ['USt-IdNr.', meta.ustId || ''],
    ['Jahr', meta.jahr != null ? String(meta.jahr) : ''],
    ['Zeitraum-Code', meta.zeitraumCode || ''],
    ['Zeitraum', meta.zeitraumLabel || ''],
    ['Kennzahl', 'Wert'],
    z('41', va.kz41), z('43', va.kz43),
    z('81', va.kz81), z('86', va.kz86),
    z('89', va.kz89), z('93', va.kz93),
    z('46', va.kz46), z('47', va.kz47),
    z('66', va.kz66), z('61', va.kz61), z('67', va.kz67),
    z('83', va.kz83),
  ];
  return csv(rows);
}

/**
 * Kassenbuch-CSV (chronologisch, mit laufendem Bestand). Erwartet das Ergebnis von
 * kassenbuch.kassenbericht(...). GoBD-orientiert; vor Übergabe an den Berater prüfen.
 */
export function buildKassenbuchCsv(bericht) {
  const rows = [['Datum', 'Nr', 'Buchungstext', 'Einnahme', 'Ausgabe', 'Bestand']];
  rows.push(['', '', 'Anfangsbestand', '', '', centsToComma(bericht.anfangsbestand)]);
  for (const z of bericht.zeilen || []) {
    rows.push([z.datum, z.seq ?? '', z.beschreibung || '',
      z.einnahme ? centsToComma(z.einnahme) : '', z.ausgabe ? centsToComma(z.ausgabe) : '',
      centsToComma(z.bestand)]);
  }
  rows.push(['', '', 'Summe', centsToComma(bericht.summeEinnahmen), centsToComma(bericht.summeAusgaben), '']);
  rows.push(['', '', 'Endbestand', '', '', centsToComma(bericht.endbestand)]);
  return csv(rows);
}

export function eurToCsv(eur) {
  const rows = [['Art', 'Konto', 'Bezeichnung', 'Betrag']];
  for (const e of eur.einnahmenKonten || []) rows.push(['Einnahme', e.nummer, e.name, centsToComma(e.wert)]);
  for (const a of eur.ausgabenKonten || []) rows.push(['Ausgabe', a.nummer, a.name, centsToComma(a.wert)]);
  rows.push(['', '', 'Summe Einnahmen (netto)', centsToComma(eur.einnahmen)]);
  rows.push(['', '', 'Summe Ausgaben (netto)', centsToComma(eur.ausgaben)]);
  rows.push(['', '', 'Überschuss', centsToComma(eur.ueberschuss)]);
  return csv(rows);
}
