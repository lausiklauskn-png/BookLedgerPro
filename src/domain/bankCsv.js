// src/domain/bankCsv.js
// Kontoauszug als CSV (oder als Zeilen aus Excel, siehe xlsxZeilen.js) → dasselbe Umsatz-Modell wie
// parseBankauszug (bankimport.js). Jede Bank schreibt andere Spalten — darum keine Liste von Banken,
// sondern eine SPALTEN-ZUORDNUNG (Klaus 2026-11-18): die App rät Trennzeichen, Kopfzeile, Dezimalzeichen,
// Datumsform und welche Spalte Datum, Betrag (oder Soll/Haben), Text und Gegenseite ist; der Nutzer
// berichtigt, und die Zuordnung wird am Konto gemerkt (ein schlichtes, JSON-taugliches Objekt).
// Reine Funktionen — kein Netz, kein DOM. Geschrieben für BookLedgerPro, genutzt auch von Basic und der
// Privaten Akte (als Klon mit Pin).
//
// EHRLICHE GRENZEN: Raten ist Raten — die Oberfläche zeigt die Zuordnung zum Prüfen. Ein Saldo steht in
// CSV-Dateien selten verlässlich; gelesen wird er nur, wenn eine Saldo-Spalte zugeordnet ist (dann
// Anfang = Saldo vor der ältesten Zeile, Ende = Saldo nach der jüngsten).

import { parseEuroToCents } from './money.js';

export const CSV_FASSUNG = 1;
const TRENNER = [';', ',', '\t', '|'];
export const DATUMSFORMEN = ['TT.MM.JJJJ', 'TT.MM.JJ', 'JJJJ-MM-TT', 'TT/MM/JJJJ', 'MM/TT/JJJJ', 'JJJJMMTT'];
/** Felder, die einer Spalte zugeordnet werden können. */
export const CSV_FELDER = ['datum', 'valuta', 'betrag', 'soll', 'haben', 'sh', 'text', 'gegen', 'iban', 'saldo', 'waehrung'];

// ---- CSV zerlegen -----------------------------------------------------------

/** Zerlegt CSV-Text in Zeilen aus Zellen (Anführungszeichen, "" als Zeichen, Umbrüche in Anführung). */
export function csvZeilen(text, trenner = ';') {
  const s = String(text || '').replace(/^﻿/, '');
  const zeilen = [];
  let zeile = [], zelle = '', inAnf = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inAnf) {
      if (c === '"') {
        if (s[i + 1] === '"') { zelle += '"'; i++; } else inAnf = false;
      } else zelle += c;
    } else if (c === '"' && zelle.trim() === '') { zelle = ''; inAnf = true; }
    else if (c === trenner) { zeile.push(zelle.trim()); zelle = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      zeile.push(zelle.trim()); zelle = '';
      if (zeile.some((z) => z !== '')) zeilen.push(zeile);
      zeile = [];
    } else zelle += c;
  }
  zeile.push(zelle.trim());
  if (zeile.some((z) => z !== '')) zeilen.push(zeile);
  return zeilen;
}

/** Rät das Trennzeichen: das, mit dem die meisten Zeilen gleich viele (≥ 3) Zellen haben. */
export function errateTrenner(text) {
  const probe = String(text || '').replace(/^﻿/, '').split(/\r?\n/).slice(0, 60).join('\n');
  let best = ';', bestWert = -1;
  for (const t of TRENNER) {
    const z = csvZeilen(probe, t);
    const zaehl = {};
    for (const r of z) if (r.length >= 3) zaehl[r.length] = (zaehl[r.length] || 0) + 1;
    const wert = Math.max(0, ...Object.values(zaehl));
    if (wert > bestWert) { best = t; bestWert = wert; }
  }
  return best;
}

// ---- Werte erkennen ---------------------------------------------------------

const RE_DATUM = {
  'TT.MM.JJJJ': /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
  'TT.MM.JJ': /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/,
  'JJJJ-MM-TT': /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/,
  'TT/MM/JJJJ': /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  'MM/TT/JJJJ': /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  'JJJJMMTT': /^(\d{4})(\d{2})(\d{2})$/,
};
const zwei = (n) => String(n).padStart(2, '0');
function gueltig(j, m, t) {
  if (!(m >= 1 && m <= 12 && t >= 1 && t <= 31 && j >= 1900 && j <= 2199)) return '';
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCMonth() === m - 1 ? `${j}-${zwei(m)}-${zwei(t)}` : '';
}

/** Liest ein Datum in der genannten Form → 'JJJJ-MM-TT' (oder '' wenn es nicht passt). */
export function datumLesen(wert, form) {
  const s = String(wert || '').trim();
  const m = s.match(RE_DATUM[form] || /$^/);
  if (!m) return '';
  if (form === 'JJJJ-MM-TT' || form === 'JJJJMMTT') return gueltig(+m[1], +m[2], +m[3]);
  if (form === 'MM/TT/JJJJ') return gueltig(+m[3], +m[1], +m[2]);
  if (form === 'TT.MM.JJ') return gueltig(2000 + +m[3], +m[2], +m[1]);
  return gueltig(+m[3], +m[2], +m[1]);
}

/** Rät die Datumsform aus Beispielwerten (die, die alle Werte gültig liest; bei / ohne Hinweis TT/MM). */
export function errateDatumsform(werte) {
  const w = (werte || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!w.length) return null;
  for (const form of DATUMSFORMEN) {
    if (w.every((x) => datumLesen(x, form))) return form;
  }
  return null;
}

/** Liest einen Betrag mit Dezimalzeichen ',' oder '.' → signierte Cent (oder null). */
export function betragLesen(wert, dezimal = ',') {
  let s = String(wert == null ? '' : wert).trim().replace(/\s| |€|EUR/gi, '');
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/-$/.test(s)) { neg = !neg; s = s.slice(0, -1); }        // „42,90-“ (manche Banken)
  if (/^[+-]/.test(s)) { if (s[0] === '-') neg = !neg; s = s.slice(1); }
  if (dezimal === ',') s = s.replace(/[.']/g, '').replace(',', '.');
  else s = s.replace(/[,']/g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const cent = parseEuroToCents(s);
  if (!Number.isFinite(cent)) return null;
  return neg ? -cent : cent;
}

/** Rät das Dezimalzeichen aus Beispielbeträgen. */
export function errateDezimal(werte) {
  let komma = 0, punkt = 0;
  for (const x of werte || []) {
    const s = String(x || '').replace(/[\s€]/g, '');
    const k = s.lastIndexOf(','), p = s.lastIndexOf('.');
    if (k > p && /,\d{1,2}-?$/.test(s)) komma++;
    else if (p > k && /\.\d{1,2}-?$/.test(s)) punkt++;
    else if (k >= 0 && p >= 0) { if (k > p) komma++; else punkt++; }
  }
  return punkt > komma ? '.' : ',';
}

const istBetrag = (x) => /^[+-]?\(?[+-]?[\d.,' ]*\d[\d.,' ]*\)?-?\s*(€|EUR)?$/i.test(String(x || '').trim()) && /\d/.test(String(x || ''));
const istDatum = (x) => DATUMSFORMEN.some((f) => datumLesen(x, f));

// ---- Kopfzeile und Zuordnung raten ------------------------------------------

const STICH = {
  datum: [/buchungstag/, /buchungsdatum/, /^datum$/, /^buchung$/, /^date$/, /booking ?date/, /transaction ?date/, /^tag$/, /datum/],
  valuta: [/valuta/, /wertstellung/, /value ?date/],
  betrag: [/^betrag/, /^umsatz/, /amount/, /betrag/],
  soll: [/^soll/, /^ausgang/, /^belastung/, /^debit/, /lastschrift/, /ausgabe/],
  haben: [/^haben/, /^eingang/, /^gutschrift/, /^credit/, /einnahme/],
  sh: [/^s\/h$/, /soll\/haben/, /^kennung$/, /^cd$/],
  text: [/verwendungszweck/, /^zweck/, /^text$/, /buchungstext/, /description/, /purpose/, /reference/, /^vorgang/, /^info/],
  gegen: [/empf(ä|ae)nger/, /auftraggeber/, /beg(ü|ue)nstigter/, /zahlungspflichtiger/, /^name/, /gegenseite/, /^payee/, /counterparty/, /^partner/],
  // eigenes Konto (nicht die IBAN der Gegenseite, die steht in vielen Exporten auch als „IBAN“)
  iban: [/auftragskonto/, /^eigenes konto/, /^konto$/],
  saldo: [/^saldo/, /kontostand/, /balance/],
  waehrung: [/w(ä|ae)hrung/, /currency/],
};
const norm = (s) => String(s || '').toLowerCase().replace(/[„“"()*]/g, '').replace(/\s+/g, ' ').trim();

/** Findet die Kopfzeile: die letzte Zeile mit Stichwörtern vor der ersten Datenzeile (Banken setzen Vorspann davor). */
export function errateKopfzeile(zeilen) {
  const z = zeilen || [];
  const datenStart = z.findIndex((r) => r.some(istDatum) && r.some((x) => istBetrag(x) && !istDatum(x)));
  if (datenStart <= 0) return datenStart === 0 ? -1 : 0;
  for (let i = datenStart - 1; i >= 0; i--) {
    const kopf = z[i].map(norm);
    const treffer = kopf.filter((k) => Object.values(STICH).some((liste) => liste.some((re) => re.test(k)))).length;
    if (treffer >= 2) return i;
  }
  return datenStart - 1;
}

function spalteNachStich(kopf, feld, belegt) {
  for (const re of STICH[feld]) {
    const i = kopf.findIndex((k, j) => !belegt.has(j) && re.test(k));
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Rät die Zuordnung aus Kopf und Beispielzeilen. Ergebnis: Feld → Spaltennummer (−1 = keine).
 * Ohne Kopf: aus dem Inhalt (erste Datumsspalte, erste Betragsspalte, längste Textspalte).
 */
export function errateZuordnung(kopf, beispiele) {
  const k = (kopf || []).map(norm);
  const zuo = Object.fromEntries(CSV_FELDER.map((f) => [f, -1]));
  const belegt = new Set();
  const setze = (f, i) => { if (i >= 0) { zuo[f] = i; belegt.add(i); } };
  // Reihenfolge zählt: „Wertstellung“ vor „Datum“, „Soll/Haben“ (Kennung) vor „Soll“, Soll/Haben und „Saldo“ vor „Betrag“.
  for (const f of ['valuta', 'datum', 'saldo', 'sh', 'soll', 'haben', 'betrag', 'iban', 'gegen', 'text', 'waehrung']) {
    if (k.length) setze(f, spalteNachStich(k, f, belegt));
  }
  if (zuo.soll >= 0 && zuo.haben < 0) { belegt.delete(zuo.soll); zuo.soll = -1; }   // ein „Soll“ allein ist keine Soll/Haben-Zuordnung
  if (zuo.soll >= 0 && zuo.haben >= 0 && zuo.betrag >= 0) { belegt.delete(zuo.betrag); zuo.betrag = -1; }
  const b = beispiele || [];
  const spalten = Math.max(k.length, ...b.map((r) => r.length), 0);
  const anteil = (i, test) => { const w = b.map((r) => r[i]).filter((x) => x != null && String(x).trim() !== ''); return w.length ? w.filter(test).length / w.length : 0; };
  if (zuo.datum < 0) { for (let i = 0; i < spalten; i++) if (!belegt.has(i) && anteil(i, istDatum) >= 0.8) { setze('datum', i); break; } }
  if (zuo.datum < 0 && zuo.valuta >= 0) { zuo.datum = zuo.valuta; zuo.valuta = -1; }
  if (zuo.betrag < 0 && zuo.soll < 0) { for (let i = 0; i < spalten; i++) if (!belegt.has(i) && anteil(i, (x) => istBetrag(x) && !istDatum(x)) >= 0.8) { setze('betrag', i); break; } }
  if (zuo.text < 0) {
    let best = -1, laenge = 0;
    for (let i = 0; i < spalten; i++) {
      if (belegt.has(i)) continue;
      const l = b.reduce((s, r) => s + String(r[i] || '').length, 0);
      if (l > laenge && anteil(i, (x) => !istBetrag(x) && !istDatum(x)) >= 0.5) { best = i; laenge = l; }
    }
    setze('text', best);
  }
  return zuo;
}

/**
 * Rät alles, was zum Einlesen nötig ist. Das Ergebnis `einstellung` ist JSON-tauglich und wird am Konto gemerkt;
 * dazu `kopf` und `beispiele` (erste Datenzeilen) zum Zeigen.
 * @param {string|Array<Array<string>>} eingabe CSV-Text oder schon zerlegte Zeilen (Excel)
 */
export function errateCsv(eingabe) {
  const istText = typeof eingabe === 'string';
  const trenner = istText ? errateTrenner(eingabe) : null;
  const zeilen = istText ? csvZeilen(eingabe, trenner) : (eingabe || []).map((r) => r.map((x) => String(x == null ? '' : x).trim()));
  const kopfzeile = errateKopfzeile(zeilen);
  const kopf = kopfzeile >= 0 ? zeilen[kopfzeile] : [];
  const beispiele = zeilen.slice(kopfzeile + 1, kopfzeile + 21);
  const zuordnung = errateZuordnung(kopf, beispiele);
  const spalte = (i) => (i >= 0 ? beispiele.map((r) => r[i]) : []);
  const datumsform = errateDatumsform(spalte(zuordnung.datum)) || 'TT.MM.JJJJ';
  const betraege = [...spalte(zuordnung.betrag), ...spalte(zuordnung.soll), ...spalte(zuordnung.haben), ...spalte(zuordnung.saldo)];
  const dezimal = errateDezimal(betraege);
  const einstellung = {
    fassung: CSV_FASSUNG, trenner, kopfzeile, dezimal, datumsform, zuordnung,
    // Soll-Spalte trägt positive Zahlen für Ausgaben (die meisten Banken); wer dort Minus schreibt, ist auch richtig.
    kennung: kopfSchluessel(kopf),
  };
  return { einstellung, kopf, beispiele, zeilen: zeilen.length };
}

/** Fingerabdruck der Kopfzeile — ändert die Bank ihre Spalten, passt die gemerkte Zuordnung nicht mehr. */
export function kopfSchluessel(kopf) {
  return (kopf || []).map(norm).join('|');
}

/** Prüft eine Zuordnung. @returns {string[]} Fehlercodes (leer = in Ordnung) */
export function pruefeZuordnung(einstellung) {
  const e = einstellung || {}, z = e.zuordnung || {};
  const f = [];
  if (!(z.datum >= 0)) f.push('datum-fehlt');
  if (!(z.betrag >= 0) && !(z.soll >= 0 && z.haben >= 0)) f.push('betrag-fehlt');
  if (e.datumsform && !DATUMSFORMEN.includes(e.datumsform)) f.push('datumsform-unbekannt');
  if (e.dezimal && e.dezimal !== ',' && e.dezimal !== '.') f.push('dezimal-unbekannt');
  return f;
}

/** Passt eine gemerkte Einstellung noch zur Datei (gleiche Kopfzeile)? */
export function passtEinstellung(einstellung, eingabe) {
  if (!einstellung || !einstellung.kennung) return false;
  const zeilen = typeof eingabe === 'string' ? csvZeilen(eingabe, einstellung.trenner || errateTrenner(eingabe)) : (eingabe || []);
  const kopf = zeilen[einstellung.kopfzeile] || [];
  return kopfSchluessel(kopf) === einstellung.kennung;
}

// ---- Einlesen ---------------------------------------------------------------

function shAusgabe(x) {
  const s = norm(x);
  if (/^(s|soll|d|debit|dbit|lastschrift|belastung|-)$/.test(s)) return true;
  if (/^(h|haben|c|credit|crdt|gutschrift|\+)$/.test(s)) return false;
  return null;
}

/**
 * Liest eine CSV-Datei (Text) oder Excel-Zeilen mit einer Zuordnung ein.
 * @returns {{format:'CSV', konto:string, saldoStartCent:number|null, saldoEndeCent:number|null,
 *   umsaetze:Array<{valuta:string, buchung:string, betragCent:number, richtung:'einnahme'|'ausgabe', zweck:string, gegen:string}>,
 *   uebersprungen:Array<{zeile:number, grund:string}>, fehler:string[]}}
 */
export function leseBankCsv(eingabe, einstellung) {
  const e = einstellung || errateCsv(eingabe).einstellung;
  const fehler = pruefeZuordnung(e);
  const leer = { format: 'CSV', konto: '', saldoStartCent: null, saldoEndeCent: null, umsaetze: [], uebersprungen: [], fehler };
  if (fehler.length) return leer;
  const z = e.zuordnung, dez = e.dezimal || ',', form = e.datumsform || 'TT.MM.JJJJ';
  const zeilen = typeof eingabe === 'string' ? csvZeilen(eingabe, e.trenner || errateTrenner(eingabe))
    : (eingabe || []).map((r) => r.map((x) => String(x == null ? '' : x).trim()));
  const zelle = (r, i) => (i >= 0 && i < r.length ? r[i] : '');
  const umsaetze = [], uebersprungen = [], salden = [];
  let konto = '';
  for (let n = (e.kopfzeile >= 0 ? e.kopfzeile + 1 : 0); n < zeilen.length; n++) {
    const r = zeilen[n];
    const datum = datumLesen(zelle(r, z.datum), form);
    if (!datum) { if (r.some((x) => x !== '')) uebersprungen.push({ zeile: n + 1, grund: 'kein-datum' }); continue; }
    let cent = null;
    if (z.betrag >= 0) {
      cent = betragLesen(zelle(r, z.betrag), dez);
      if (cent != null && z.sh >= 0) { const aus = shAusgabe(zelle(r, z.sh)); if (aus != null) cent = aus ? -Math.abs(cent) : Math.abs(cent); }
    } else {
      const s = betragLesen(zelle(r, z.soll), dez), h = betragLesen(zelle(r, z.haben), dez);
      if (s) cent = -Math.abs(s); else if (h) cent = Math.abs(h); else if (s === 0 || h === 0) cent = 0;
    }
    if (cent == null) { uebersprungen.push({ zeile: n + 1, grund: 'kein-betrag' }); continue; }
    if (cent === 0) { uebersprungen.push({ zeile: n + 1, grund: 'null-betrag' }); continue; }
    const valuta = z.valuta >= 0 ? (datumLesen(zelle(r, z.valuta), form) || datum) : datum;
    const text = String(zelle(r, z.text)).replace(/\s+/g, ' ').trim();
    const gegen = String(zelle(r, z.gegen)).replace(/\s+/g, ' ').trim();
    if (!konto && z.iban >= 0) konto = String(zelle(r, z.iban)).replace(/\s/g, '');
    umsaetze.push({ valuta, buchung: datum, betragCent: Math.abs(cent), richtung: cent > 0 ? 'einnahme' : 'ausgabe', zweck: text, gegen });
    if (z.saldo >= 0) { const s = betragLesen(zelle(r, z.saldo), dez); if (s != null) salden.push({ datum, saldo: s, cent }); }
  }
  // Viele Banken schreiben die jüngste Zeile zuerst — Reihenfolge nach Datum (stabil), Salden ebenso.
  const absteigend = umsaetze.length > 1 && umsaetze[0].buchung > umsaetze[umsaetze.length - 1].buchung;
  if (absteigend) { umsaetze.reverse(); salden.reverse(); }
  let saldoStartCent = null, saldoEndeCent = null;
  if (salden.length && salden.length === umsaetze.length) {
    saldoStartCent = salden[0].saldo - salden[0].cent;
    saldoEndeCent = salden[salden.length - 1].saldo;
  }
  return { format: 'CSV', konto, saldoStartCent, saldoEndeCent, umsaetze, uebersprungen, fehler: [] };
}

/** Schlüssel für doppelte Umsätze: Konto, Buchungsdatum, Betrag mit Richtung, Zweck (gekürzt, ohne Leerraum). */
export function umsatzSchluessel(u, konto = '') {
  const x = u || {};
  const zweck = String(x.zweck || x.gegen || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '').slice(0, 40);
  return [String(konto || '').replace(/\s/g, '').slice(-8), x.buchung || x.valuta || '', (x.richtung === 'einnahme' ? '+' : '-') + (x.betragCent || 0), zweck].join('|');
}

/** Bytes → Text: UTF-8, sonst Windows-1252 (viele Banken schreiben CSV noch so; „Empfänger“ bliebe sonst kaputt). */
export function textAusBytes(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^﻿/, ''); }
  catch { return new TextDecoder('windows-1252').decode(b); }
}

/** Sieht der Text wie eine Tabelle aus (mindestens zwei Zeilen mit je drei Zellen)? */
export function istCsvText(text) {
  const t = String(text || '');
  if (/^\s*[{<]/.test(t)) return false;
  return csvZeilen(t.split(/\r?\n/).slice(0, 40).join('\n'), errateTrenner(t)).filter((r) => r.length >= 3).length >= 2;
}
