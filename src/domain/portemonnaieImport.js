// src/domain/portemonnaieImport.js
// „Portemonnaie-Monat“ (Fassung 1): die Monatsdatei, die das Portemonnaie der Privaten Akte einmal im Monat an
// BookLedgerPro gibt (Klaus 2026-11-18). Schreiben UND Lesen stehen hier, damit beide Seiten dasselbe Format
// haben — die Akte holt diese Datei als Klon mit Pin herein und schreibt mit `baueMonatsdatei`.
// BookLedgerPro liest mit `lesePortemonnaieMonat` und macht mit `monatsEntwuerfe` daraus ENTWÜRFE
// (Kasse 1000 bzw. Bank 1200 gegen ein Sachkonto, das die Oberfläche vorschlägt) — festgeschrieben wird erst
// auf Tipp. Reine Funktionen — kein Netz, kein DOM.
//
// Format (JSON):
// { "art": "portemonnaie-monat", "fassung": 1, "quelle": "private-akte", "monat": "2026-11", "erstellt": "…ISO…",
//   "faecher": [
//     { "fach": "bargeld", "name": "Bargeld", "anfangCent": 12000, "endeCent": 9050,
//       "posten": [ { "id": "…", "datum": "2026-11-03", "cent": 2950, "richtung": "aus", "text": "Einkauf",
//                     "wofuer": "Lebensmittel", "beleg": "Bon …", "vomKonto": false } ] },
//     { "fach": "bank", "name": "Girokonto", "bank": "Beispielbank", "ibanEnde": "1234",
//       "anfangCent": 150000, "endeCent": 129100, "saldoAuszugCent": 129100,
//       "posten": [ { "id": "…", "datum": "2026-11-02", "cent": 20000, "richtung": "aus", "text": "Barabhebung",
//                     "gegen": "", "zurKasse": true } ] } ] }
// Cent sind immer positiv, die Richtung steht in "richtung" ("ein" | "aus").
// "vomKonto" (Bargeld) und "zurKasse" (Bank) markieren dieselbe Barabhebung von beiden Seiten: gebucht wird sie
// einmal als Umbuchung Kasse an Bank (Geldtransit), die Bank-Seite wird dann übersprungen.

export const PM_ART = 'portemonnaie-monat';
export const PM_FASSUNG = 1;
export const PM_KASSE = '1000';
export const PM_BANK = '1200';

const istMonat = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(m || ''));
const istTag = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
const ganz = (n) => Number.isInteger(n);
const kurz = (s, n = 200) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

function postenBauen(p, fach) {
  const x = p || {};
  const o = {
    id: kurz(x.id, 80), datum: String(x.datum || '').slice(0, 10), cent: Math.abs(Math.round(Number(x.cent) || 0)),
    richtung: x.richtung === 'ein' ? 'ein' : 'aus', text: kurz(x.text),
  };
  if (x.wofuer) o.wofuer = kurz(x.wofuer);
  if (x.gegen) o.gegen = kurz(x.gegen);
  if (x.beleg) o.beleg = kurz(x.beleg);
  if (fach === 'bargeld' && x.vomKonto) o.vomKonto = true;
  if (fach === 'bank' && x.zurKasse) o.zurKasse = true;
  return o;
}

/** Rechnet ein Fach: Anfang + rein − raus. */
export function fachSumme(fach) {
  const f = fach || {};
  let rein = 0, raus = 0;
  for (const p of f.posten || []) { if (p.richtung === 'ein') rein += p.cent || 0; else raus += p.cent || 0; }
  const anfang = ganz(f.anfangCent) ? f.anfangCent : 0;
  return { anfangCent: anfang, reinCent: rein, rausCent: raus, endeCent: anfang + rein - raus };
}

/**
 * Baut die Monatsdatei (Objekt; JSON.stringify macht die Datei). Posten außerhalb des Monats bleiben draußen.
 * @param {{monat:string, quelle?:string, erstellt?:string, faecher:Array}} eingabe
 */
export function baueMonatsdatei(eingabe) {
  const e = eingabe || {};
  if (!istMonat(e.monat)) throw new Error('monat-ungueltig');
  const faecher = (e.faecher || []).map((f) => {
    const fach = f.fach === 'bank' ? 'bank' : 'bargeld';
    const o = { fach, name: kurz(f.name || (fach === 'bank' ? 'Bank' : 'Bargeld'), 80) };
    if (fach === 'bank') {
      if (f.bank) o.bank = kurz(f.bank, 80);
      const iban = String(f.iban || f.ibanEnde || '').replace(/\s/g, '');
      if (iban) o.ibanEnde = iban.slice(-4);           // nie die ganze IBAN in die Datei
    }
    o.anfangCent = ganz(f.anfangCent) ? f.anfangCent : 0;
    o.posten = (f.posten || []).map((p) => postenBauen(p, fach)).filter((p) => p.datum.slice(0, 7) === e.monat && p.cent > 0)
      .sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));
    o.endeCent = fachSumme(o).endeCent;
    if (fach === 'bank' && ganz(f.saldoAuszugCent)) o.saldoAuszugCent = f.saldoAuszugCent;
    return o;
  });
  return { art: PM_ART, fassung: PM_FASSUNG, quelle: kurz(e.quelle || 'private-akte', 40), monat: e.monat, erstellt: e.erstellt || new Date().toISOString(), faecher };
}

/** Dateiname der Monatsdatei. */
export function monatsdateiName(monat) {
  return `portemonnaie-${monat}.json`;
}

/** Erkennt die Monatsdatei an Text oder Objekt (ohne zu werfen). */
export function istPortemonnaieMonat(eingabe) {
  try {
    const o = typeof eingabe === 'string' ? JSON.parse(eingabe) : eingabe;
    return !!o && o.art === PM_ART;
  } catch { return false; }
}

/**
 * Liest und prüft eine Monatsdatei.
 * @returns {{ok:boolean, fehler:string[], warnungen:Array<{code:string,[k:string]:any}>, monat:string, quelle:string, faecher:Array}}
 */
export function lesePortemonnaieMonat(eingabe) {
  let o;
  try { o = typeof eingabe === 'string' ? JSON.parse(String(eingabe).replace(/^﻿/, '')) : eingabe; }
  catch { return { ok: false, fehler: ['kein-json'], warnungen: [], monat: '', quelle: '', faecher: [] }; }
  const fehler = [], warnungen = [];
  if (!o || o.art !== PM_ART) fehler.push('falsche-art');
  else if (o.fassung !== PM_FASSUNG) fehler.push('fassung-unbekannt');
  if (o && !istMonat(o.monat)) fehler.push('monat-ungueltig');
  if (fehler.length) return { ok: false, fehler, warnungen, monat: (o && o.monat) || '', quelle: (o && o.quelle) || '', faecher: [] };
  const faecher = [];
  for (const [i, f] of (Array.isArray(o.faecher) ? o.faecher : []).entries()) {
    if (!f || (f.fach !== 'bargeld' && f.fach !== 'bank')) { warnungen.push({ code: 'fach-unbekannt', fach: i }); continue; }
    const posten = [];
    for (const p of Array.isArray(f.posten) ? f.posten : []) {
      if (!p || !istTag(p.datum) || !ganz(p.cent) || p.cent <= 0 || (p.richtung !== 'ein' && p.richtung !== 'aus')) {
        warnungen.push({ code: 'posten-unvollstaendig', fach: f.name || f.fach, id: p && p.id }); continue;
      }
      if (p.datum.slice(0, 7) !== o.monat) warnungen.push({ code: 'posten-anderer-monat', fach: f.name || f.fach, id: p.id, datum: p.datum });
      posten.push(postenBauen(p, f.fach));
    }
    const fach = { fach: f.fach, name: kurz(f.name || f.fach, 80), bank: f.bank ? kurz(f.bank, 80) : '', ibanEnde: f.ibanEnde ? String(f.ibanEnde).slice(-4) : '',
      anfangCent: ganz(f.anfangCent) ? f.anfangCent : 0, endeCent: ganz(f.endeCent) ? f.endeCent : null, posten };
    if (ganz(f.saldoAuszugCent)) fach.saldoAuszugCent = f.saldoAuszugCent;
    const s = fachSumme(fach);
    if (fach.endeCent != null && fach.endeCent !== s.endeCent) warnungen.push({ code: 'summe-differenz', fach: fach.name, differenzCent: fach.endeCent - s.endeCent });
    if (fach.saldoAuszugCent != null && fach.saldoAuszugCent !== s.endeCent) warnungen.push({ code: 'saldo-auszug-differenz', fach: fach.name, differenzCent: fach.saldoAuszugCent - s.endeCent });
    faecher.push(fach);
  }
  if (!faecher.some((f) => f.posten.length)) warnungen.push({ code: 'keine-posten' });
  return { ok: true, fehler: [], warnungen, monat: o.monat, quelle: kurz(o.quelle, 40), faecher };
}

/**
 * Macht aus einer gelesenen Monatsdatei die Liste der Entwürfe — noch ohne Sachkonto (das schlägt die Oberfläche
 * je Posten vor, wie beim Bankimport). Barabhebungen werden EINE Umbuchung (fertige Zeilen: Kasse an Bank).
 * @param {{faecher:Array}} gelesen Ergebnis von lesePortemonnaieMonat
 * @param {{kasse?:string, bank?:string, faecher?:string[]}} opts Geldkonten; `faecher` = nur diese Fach-Namen
 * @returns {{entwuerfe:Array<{art:'umsatz'|'umbuchung', fach:string, geldkonto:string, posten:object,
 *   umsatz:{valuta:string, betragCent:number, richtung:'einnahme'|'ausgabe', zweck:string, gegen:string},
 *   datum:string, beschreibung:string, zeilen?:Array}>, uebersprungen:Array<{grund:string, fach:string, posten:object}>}}
 */
export function monatsEntwuerfe(gelesen, opts = {}) {
  const kasse = opts.kasse || PM_KASSE, bank = opts.bank || PM_BANK;
  const nur = Array.isArray(opts.faecher) ? new Set(opts.faecher) : null;
  const entwuerfe = [], uebersprungen = [];
  const hatBargeld = (gelesen.faecher || []).some((f) => f.fach === 'bargeld' && (!nur || nur.has(f.name)));
  for (const f of gelesen.faecher || []) {
    if (nur && !nur.has(f.name)) continue;
    const geldkonto = f.fach === 'bank' ? bank : kasse;
    for (const p of f.posten) {
      if (f.fach === 'bank' && p.zurKasse && hatBargeld) { uebersprungen.push({ grund: 'umbuchung-im-bargeld', fach: f.name, posten: p }); continue; }
      const text = [p.text, p.wofuer].filter(Boolean).join(' · ');
      const umsatz = { valuta: p.datum, betragCent: p.cent, richtung: p.richtung === 'ein' ? 'einnahme' : 'ausgabe', zweck: text, gegen: p.gegen || '' };
      if ((f.fach === 'bargeld' && p.vomKonto) || (f.fach === 'bank' && p.zurKasse)) {
        // Geld wandert zwischen Bank und Kasse: kein Aufwand, kein Ertrag.
        const zurKasse = p.richtung === (f.fach === 'bargeld' ? 'ein' : 'aus');
        const [soll, haben] = zurKasse ? [kasse, bank] : [bank, kasse];
        entwuerfe.push({ art: 'umbuchung', fach: f.name, geldkonto, posten: p, umsatz, datum: p.datum,
          beschreibung: kurz(p.text || (zurKasse ? 'Barabhebung' : 'Bareinzahlung'), 120),
          zeilen: [{ konto: soll, seite: 'S', betrag: p.cent }, { konto: haben, seite: 'H', betrag: p.cent }] });
        continue;
      }
      entwuerfe.push({ art: 'umsatz', fach: f.name, geldkonto, posten: p, umsatz, datum: p.datum, beschreibung: kurz(text || (p.richtung === 'ein' ? 'Einnahme' : 'Ausgabe'), 120) });
    }
  }
  return { entwuerfe, uebersprungen };
}
