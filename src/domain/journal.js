// src/domain/journal.js
// Buchungssatz-Logik (doppelte Buchführung). Eine Buchung besteht aus ≥2 Zeilen
// (je {konto, seite:'S'|'H', betrag in Cent}); die Summe Soll muss Summe Haben
// entsprechen. Reine, testbare Funktionen — Persistenz liegt in store.js.

import { parseEuroToCents } from './money.js';

export const BUCHUNG_STATUS = { ENTWURF: 'entwurf', FESTGESCHRIEBEN: 'festgeschrieben', STORNIERT: 'storniert' };

export function summeSeiten(zeilen) {
  let soll = 0, haben = 0;
  for (const z of zeilen) {
    if (z.seite === 'S') soll += z.betrag;
    else if (z.seite === 'H') haben += z.betrag;
  }
  return { soll, haben };
}

export function istAusgeglichen(zeilen) {
  const { soll, haben } = summeSeiten(zeilen);
  return soll === haben && soll > 0;
}

/**
 * Validiert eine Buchung gegen die Kontenliste.
 * @returns {string[]} Liste von Fehlern (leer = gültig)
 */
export function validateBuchung(buchung, kontoIndex) {
  const errors = [];
  if (!buchung.datum || !/^\d{4}-\d{2}-\d{2}$/.test(buchung.datum)) errors.push('Datum fehlt oder ungültig (YYYY-MM-DD).');
  const zeilen = buchung.zeilen || [];
  if (zeilen.length < 2) errors.push('Mindestens zwei Buchungszeilen (Soll und Haben) nötig.');
  for (const z of zeilen) {
    if (z.seite !== 'S' && z.seite !== 'H') errors.push(`Ungültige Seite: ${z.seite}`);
    if (!Number.isInteger(z.betrag) || z.betrag <= 0) errors.push(`Betrag muss positiv sein (Konto ${z.konto}).`);
    if (kontoIndex && !kontoIndex[z.konto]) errors.push(`Unbekanntes Konto: ${z.konto}`);
  }
  if (!istAusgeglichen(zeilen)) {
    const { soll, haben } = summeSeiten(zeilen);
    errors.push(`Soll (${soll}) ≠ Haben (${haben}) — Buchung nicht ausgeglichen.`);
  }
  return errors;
}

/**
 * Baut eine einfache "Soll an Haben"-Buchung, optional mit USt-Aufteilung.
 * Bruttobetrag wird in Netto + USt zerlegt; die USt-Zeile bucht auf das
 * passende Vorsteuer-/Umsatzsteuer-Konto.
 *
 * @param opts.sollKonto, opts.habenKonto - Kontonummern
 * @param opts.brutto - Euro-Eingabe (String/Number); ODER opts.bruttoCents (Integer Cent)
 * @param opts.ustSatz - 0|7|19
 * @param opts.steuerKonto - Konto für die USt-Zeile (Vorsteuer bei Aufwand, USt bei Ertrag)
 * @param opts.steuerSeite - 'S' (Vorsteuer) oder 'H' (Umsatzsteuer)
 * @returns {{zeilen:Array, netto:number, steuer:number, brutto:number}}
 */
export function baueBuchungZeilen(opts) {
  const brutto = Number.isInteger(opts.bruttoCents) ? opts.bruttoCents : parseEuroToCents(opts.brutto);
  if (!Number.isInteger(brutto) || brutto <= 0) throw new Error('Ungültiger Betrag');
  const satz = Number(opts.ustSatz) || 0;

  if (satz === 0 || !opts.steuerKonto) {
    return {
      brutto, netto: brutto, steuer: 0,
      zeilen: [
        { konto: opts.sollKonto, seite: 'S', betrag: brutto },
        { konto: opts.habenKonto, seite: 'H', betrag: brutto },
      ],
    };
  }

  // Netto = round(brutto / (1 + satz/100)); Steuer = Differenz (Cent-genau).
  const netto = Math.round(brutto / (1 + satz / 100));
  const steuer = brutto - netto;

  // Beispiel Aufwand: Soll Aufwand(netto) + Soll Vorsteuer(steuer) an Haben Bank(brutto)
  // Beispiel Ertrag: Soll Bank(brutto) an Haben Erlöse(netto) + Haben USt(steuer)
  const zeilen = [];
  if (opts.steuerSeite === 'S') {
    zeilen.push({ konto: opts.sollKonto, seite: 'S', betrag: netto });
    zeilen.push({ konto: opts.steuerKonto, seite: 'S', betrag: steuer });
    zeilen.push({ konto: opts.habenKonto, seite: 'H', betrag: brutto });
  } else {
    zeilen.push({ konto: opts.sollKonto, seite: 'S', betrag: brutto });
    zeilen.push({ konto: opts.habenKonto, seite: 'H', betrag: netto });
    zeilen.push({ konto: opts.steuerKonto, seite: 'H', betrag: steuer });
  }
  return { brutto, netto, steuer, zeilen };
}

// Umsatzart einer Eingangs-/Ausgangsleistung (für korrekte USt-Behandlung).
export const UMSATZART = {
  INLAND: 'inland',          // normaler Inlandsumsatz (USt im Brutto enthalten)
  REVERSE_CHARGE_13B: '13b', // §13b UStG: Leistungsempfänger schuldet die USt
  IG_ERWERB: 'ig_erwerb',    // innergemeinschaftlicher Erwerb (Erwerber schuldet die USt)
  IG_LIEFERUNG: 'ig_lieferung', // steuerfreie innergem. Lieferung (Ausgang, kein USt-Ausweis)
  AUSFUHR: 'ausfuhr',        // steuerfreie Ausfuhrlieferung Drittland (Ausgang)
};

/**
 * Steuerschuldumkehr (§13b UStG / innergem. Erwerb): Eine Eingangsleistung OHNE
 * ausgewiesene USt. Der Leistungsempfänger bucht **gleichzeitig** die geschuldete
 * Umsatzsteuer (Haben) UND — bei voller Abzugsberechtigung — die Vorsteuer (Soll);
 * beide heben sich auf. An den Lieferanten fließt nur der **Netto**-Betrag.
 *
 *   Soll  Aufwand           netto
 *   Soll  Vorsteuer §13b    steuer
 *   Haben Umsatzsteuer §13b steuer
 *   Haben Bank/Verbindlichk. netto
 *
 * @param opts.nettoCents (Integer Cent) ODER opts.netto (Euro-Eingabe String/Number)
 * @param opts.ustSatz 0|7|19 (i.d.R. 19)
 * @param opts.aufwandKonto Aufwands-/Wareneingangskonto (Soll)
 * @param opts.gegenKonto Bank/Verbindlichkeit (Haben, Netto an den Lieferanten)
 * @param opts.vorsteuerKonto §13b/ig-Vorsteuerkonto (Soll); weglassbar bei nicht abziehbar
 * @param opts.umsatzsteuerKonto §13b/ig-Umsatzsteuerkonto (Haben)
 * @param opts.vorsteuerAbziehbar default true; false → nur USt geschuldet (kein VSt-Abzug)
 * @returns {{netto:number, steuer:number, zeilen:Array}}
 */
export function baueReverseChargeZeilen(opts) {
  const netto = Number.isInteger(opts.nettoCents) ? opts.nettoCents : parseEuroToCents(opts.netto);
  if (!Number.isInteger(netto) || netto <= 0) throw new Error('Ungültiger Nettobetrag');
  const satz = Number(opts.ustSatz) || 0;
  const steuer = Math.round((netto * satz) / 100);
  const abziehbar = opts.vorsteuerAbziehbar !== false;
  const zeilen = [
    { konto: opts.aufwandKonto, seite: 'S', betrag: netto },
    { konto: opts.gegenKonto, seite: 'H', betrag: netto },
  ];
  if (steuer > 0) {
    zeilen.push({ konto: opts.umsatzsteuerKonto, seite: 'H', betrag: steuer });
    if (abziehbar) zeilen.push({ konto: opts.vorsteuerKonto, seite: 'S', betrag: steuer });
    else zeilen[0] = { konto: opts.aufwandKonto, seite: 'S', betrag: netto + steuer }; // USt wird Kostenbestandteil
  }
  return { netto, steuer, zeilen };
}

/**
 * Rekonstruiert die einfachen Formular-Felder (Soll/Haben/Brutto/USt-Satz) aus den
 * Zeilen einer gespeicherten Buchung — für das Bearbeiten eines Entwurfs. Erkennt
 * die optionale USt-Zeile (Vor-/Umsatzsteuer) und leitet Richtung/Brutto korrekt ab.
 * Rein & testbar.
 * @returns {{datum, beschreibung, begruendung, kostenstelle, sollKonto, habenKonto, bruttoCent, ustSatz}}
 */
export function formularAusBuchung(buchung, kontoIndex) {
  const z = (buchung && buchung.zeilen) || [];
  const out = {
    datum: buchung.datum || '',
    beschreibung: buchung.beschreibung || '',
    begruendung: buchung.begruendung || '',
    kostenstelle: buchung.kostenstelle || '',
    sollKonto: '', habenKonto: '', bruttoCent: 0, ustSatz: 0,
  };
  const istSteuer = (konto) => {
    const k = kontoIndex && kontoIndex[konto];
    return !!(k && (k.rolle === 'vorsteuer' || k.rolle === 'umsatzsteuer'));
  };
  const steuer = z.find((x) => istSteuer(x.konto));
  if (!steuer) {
    const s = z.find((x) => x.seite === 'S');
    const h = z.find((x) => x.seite === 'H');
    if (s) { out.sollKonto = s.konto; out.bruttoCent = s.betrag; }
    if (h) { out.habenKonto = h.konto; out.bruttoCent = Math.max(out.bruttoCent, h.betrag); }
    return out;
  }
  out.ustSatz = Number((kontoIndex[steuer.konto] || {}).ust) || 0;
  if (steuer.seite === 'S') {                       // Vorsteuer → Ausgabe
    const soll = z.find((x) => x.seite === 'S' && !istSteuer(x.konto));
    const haben = z.find((x) => x.seite === 'H');
    out.sollKonto = soll ? soll.konto : '';
    out.habenKonto = haben ? haben.konto : '';
    out.bruttoCent = haben ? haben.betrag : 0;
  } else {                                          // Umsatzsteuer → Einnahme
    const haben = z.find((x) => x.seite === 'H' && !istSteuer(x.konto));
    const soll = z.find((x) => x.seite === 'S');
    out.habenKonto = haben ? haben.konto : '';
    out.sollKonto = soll ? soll.konto : '';
    out.bruttoCent = soll ? soll.betrag : 0;
  }
  return out;
}

/** Erzeugt die Storno-Zeilen (Soll↔Haben getauscht). */
export function stornoZeilen(zeilen) {
  return zeilen.map((z) => ({ konto: z.konto, seite: z.seite === 'S' ? 'H' : 'S', betrag: z.betrag }));
}
