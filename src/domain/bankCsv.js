// src/domain/bankCsv.js
// Kontoauszug als CSV (oder als Zeilen aus einer Excel-Datei, siehe xlsxZeilen.js) lesen.
// Jede Bank schreibt andere Spalten — darum keine Liste von Banken, sondern eine
// SPALTEN-ZUORDNUNG: welche Spalte ist Datum, Betrag (oder Soll/Haben, oder Betrag mit
// S/H-Kennzeichen), Text, Gegenseite, Saldo. Trennzeichen, Dezimalzeichen und Datumsform
// werden erraten; die Zuordnung ist ein schlichtes JSON-Objekt, damit sie am Konto gemerkt
// werden kann (Private Akte, Basic, Pro – ein Leser). Ergebnis: dasselbe Umsatz-Modell wie
// parseBankauszug (bankimport.js). Reine Funktionen — kein Netz, kein DOM.
//
// EHRLICHER HINWEIS: geprüft an erfundenen Dateien im Aufbau mehrerer Banken (Sparkasse,
// Volksbank, DKB, ING, Comdirect-artig, englisch). Echte Exporte können abweichen; dafür ist
// die Zuordnung von Hand änderbar.

export const ZUORDNUNG_FASSUNG = 1;

// ---- CSV zerlegen ----------------------------------------------------------

/** Rät das Trennzeichen aus den ersten Zeilen (außerhalb von Anführungszeichen gezählt). */
export function errateTrenner(text) {
  const kandidaten = [';', ',', '\t', '|'];
  const zeilen = String(text || '').replace(/^﻿/, '').split(/\r\n?|\n/).filter((z) => z.trim()).slice(0, 40);
  let best = ';', bestWert = -1;
  for (const t of kandidaten) {
    const zahlen = zeilen.map((z) => zaehleAusserhalb(z, t));
    // Häufigste Anzahl > 0 und wie oft sie vorkommt: gleichmäßige Spaltenzahl gewinnt.
    const haeufig = new Map();
    for (const n of zahlen) if (n > 0) haeufig.set(n, (haeufig.get(n) || 0) + 1);
    let wert = 0;
    for (const [n, c] of haeufig) wert = Math.max(wert, c * 100 + n);
    if (wert > bestWert) { bestWert = wert; best = t; }
  }
  return best;
}
function zaehleAusserhalb(zeile, t) {
  let n = 0, inQ = false;
  for (const ch of zeile) { if (ch === '"') inQ = !inQ; else if (ch === t && !inQ) n++; }
  return n;
}

/** Zerlegt CSV-Text in Zeilen und Zellen (Anführungszeichen, "" im Feld, Zeilenumbruch im Feld, BOM). */
export function csvZeilen(text, trenner) {
  const s = String(text || '').replace(/^﻿/, '');
  const t = trenner || errateTrenner(s);
  const out = [];
  let zeile = [], feld = '', inQ = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') { if (s[i + 1] === '"') { feld += '"'; i++; } else inQ = false; }
      else feld += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === t) { zeile.push(feld); feld = ''; }
    else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      zeile.push(feld); out.push(zeile); zeile = []; feld = '';
    } else feld += ch;
  }
  if (feld !== '' || zeile.length) { zeile.push(feld); out.push(zeile); }
  return out.map((z) => z.map((f) => f.trim())).filter((z) => z.some((f) => f !== ''));
}

// ---- Werte lesen -----------------------------------------------------------

/** Betrag → signierte Cent. Dezimal ',' oder '.'; versteht 1.234,56 · -12,50 · 12,50- · (12,50) · +3 · „EUR“/„€“. */
export function betragLesen(wert, dezimal = ',') {
  let s = String(wert == null ? '' : wert).replace(/[\s  ']/g, '').replace(/EUR|€/gi, '');
  if (!s) return null;
  let minus = false;
  if (/^\(.*\)$/.test(s)) { minus = true; s = s.slice(1, -1); }
  if (/-$/.test(s)) { minus = !minus; s = s.slice(0, -1); }
  if (/^[-−–]/.test(s)) { minus = !minus; s = s.slice(1); }
  else if (s.startsWith('+')) s = s.slice(1);
  if (dezimal === ',') s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const c = Math.round(Number(s) * 100);
  return minus ? -c : c;
}

/** Rät das Dezimalzeichen aus Beträgen einer Spalte. */
export function errateDezimal(werte) {
  let komma = 0, punkt = 0;
  for (const w of werte || []) {
    const s = String(w || '').replace(/[\s ]/g, '');
    if (/\d\.\d{3},\d{1,2}-?$/.test(s) || /\d,\d{1,2}-?$/.test(s)) komma++;
    else if (/\d,\d{3}\.\d{1,2}-?$/.test(s) || /\d\.\d{1,2}-?$/.test(s)) punkt++;
  }
  return punkt > komma ? '.' : ',';
}

export const DATUMSFORMEN = ['TT.MM.JJJJ', 'TT.MM.JJ', 'JJJJ-MM-TT', 'TT/MM/JJJJ', 'MM/TT/JJJJ', 'TT-MM-JJJJ', 'JJJJMMTT', 'excel'];

function iso(j, m, t) {
  const jj = Number(j), mm = Number(m), tt = Number(t);
  if (!(mm >= 1 && mm <= 12 && tt >= 1 && tt <= 31 && jj >= 1900 && jj <= 2199)) return '';
  const d = new Date(Date.UTC(jj, mm - 1, tt));
  if (d.getUTCMonth() !== mm - 1) return '';
  return `${jj}-${String(mm).padStart(2, '0')}-${String(tt).padStart(2, '0')}`;
}
/** Excel-Seriennummer (System 1900) → JJJJ-MM-TT. */
export function excelDatum(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n) || n < 1) return '';
  const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Datum in einer gegebenen Form → JJJJ-MM-TT ('' wenn es nicht passt). Uhrzeit dahinter wird ignoriert. */
export function datumLesen(wert, form) {
  const s = String(wert == null ? '' : wert).trim().split(/[ T]/)[0];
  let m;
  switch (form) {
    case 'TT.MM.JJJJ': m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); return m ? iso(m[3], m[2], m[1]) : '';
    case 'TT.MM.JJ': m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/); return m ? iso(2000 + Number(m[3]), m[2], m[1]) : '';
    case 'JJJJ-MM-TT': m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); return m ? iso(m[1], m[2], m[3]) : '';
    case 'TT/MM/JJJJ': m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? iso(m[3], m[2], m[1]) : '';
    case 'MM/TT/JJJJ': m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? iso(m[3], m[1], m[2]) : '';
    case 'TT-MM-JJJJ': m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/); return m ? iso(m[3], m[2], m[1]) : '';
    case 'JJJJMMTT': m = s.match(/^(\d{4})(\d{2})(\d{2})$/); return m ? iso(m[1], m[2], m[3]) : '';
    case 'excel': return /^\d{4,5}(\.\d+)?$/.test(s) && Number(s) > 20000 && Number(s) < 80000 ? excelDatum(s) : '';
    default: return '';
  }
}

function spanne(werte, form) {
  const d = werte.map((x) => datumLesen(x, form)).filter(Boolean).sort();
  return d.length ? (Date.parse(d[d.length - 1]) - Date.parse(d[0])) : Infinity;
}

/** Rät die Datumsform aus den Werten einer Spalte (null, wenn keine passt). TT/MM vor MM/TT, außer die Werte sagen es. */
export function errateDatumsform(werte) {
  const w = (werte || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!w.length) return null;
  let best = null, bestN = 0;
  for (const f of DATUMSFORMEN) {
    const n = w.filter((x) => datumLesen(x, f)).length;
    if (n > bestN) { best = f; bestN = n; }
  }
  if (best === 'TT/MM/JJJJ' || best === 'MM/TT/JJJJ') {
    const a = w.filter((x) => datumLesen(x, 'TT/MM/JJJJ')).length, b = w.filter((x) => datumLesen(x, 'MM/TT/JJJJ')).length;
    // Passen beide gleich gut, gewinnt die Form mit der kürzeren Zeitspanne – ein Auszug umfasst Tage oder Wochen, nicht Monate.
    if (a === b) best = spanne(w, 'MM/TT/JJJJ') < spanne(w, 'TT/MM/JJJJ') ? 'MM/TT/JJJJ' : 'TT/MM/JJJJ';
    else best = b > a ? 'MM/TT/JJJJ' : 'TT/MM/JJJJ';
  }
  return bestN >= Math.max(1, Math.ceil(w.length * 0.5)) ? best : null;
}

// ---- Kopfzeile und Zuordnung ----------------------------------------------

/** Spaltenname vergleichbar machen: klein, Umlaute ausgeschrieben, nur Buchstaben/Ziffern. */
export function kopfNorm(s) {
  return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
}

// Bekannte Spaltennamen je Rolle, in Vorrangfolge (Teilwörter, auf kopfNorm-Form).
const NAMEN = {
  datum: ['buchungstag', 'buchungsdatum', 'buchung', 'datum', 'bookingdate', 'date', 'transactiondate', 'valutadatum', 'valuta', 'wertstellung', 'werttag'],
  betrag: ['betrageur', 'betragineur', 'umsatzineur', 'betrag', 'umsatz', 'amount', 'wert'],
  soll: ['soll', 'belastung', 'debit', 'ausgang', 'abgang', 'auszahlung'],
  haben: ['haben', 'gutschrift', 'credit', 'eingang', 'zugang', 'einzahlung'],
  kennzeichen: ['sollhaben', 'sh', 'kennzeichen', 'debitcredit', 'dc'],
  text: ['verwendungszweck', 'verwendung', 'zweck', 'buchungsinformation', 'beschreibung', 'description', 'purpose', 'reference', 'buchungstext', 'vorgang', 'umsatzart', 'text', 'details'],
  gegen: ['beguenstigterzahlungspflichtiger', 'zahlungspflichtigerbeguenstigter', 'beguenstigter', 'zahlungspflichtiger', 'auftraggeberempfaenger', 'auftraggeber', 'empfaenger', 'zahlungsempfaenger', 'gegenpartei', 'namezahlungsbeteiligter', 'counterparty', 'payee', 'name'],
  saldo: ['saldo', 'kontostand', 'balance'],
  konto: ['auftragskonto', 'eigeneskonto', 'eigeneiban'],
};
// Diese Teilwörter schließen eine Rolle aus (z. B. „Kontonummer“ ist keine Gegenseite, „Saldo“ kein Betrag).
const NICHT = {
  datum: ['text', 'art', 'info'],
  betrag: ['saldo', 'kontostand', 'balance', 'waehrung', 'currency', 'ursprung', 'fremd', 'gebuehr', 'umsatzart', 'wertstellung', 'werttag'],
  gegen: ['iban', 'bic', 'kontonummer', 'kontonr', 'blz', 'bank', 'glaeubigerid', 'mandat', 'referenz'],
  text: ['iban', 'bic', 'kontonummer'],
  soll: ['sollhaben'], haben: ['sollhaben'],
};

function rolleVon(name, rolle) {
  const n = kopfNorm(name);
  if (!n) return -1;
  const liste = NAMEN[rolle];
  let idx = -1;
  for (let i = 0; i < liste.length; i++) {
    const k = liste[i];
    if (k.length <= 3 || rolle === 'kennzeichen' ? n === k : n.includes(k)) { idx = i; break; }
  }
  if (idx < 0 || (NICHT[rolle] || []).some((x) => n.includes(x))) return -1;
  return idx;
}

/** Index der Kopfzeile (Bankexporte haben oft Kontoangaben darüber). -1 = keine Kopfzeile. */
export function kopfFinden(zeilen) {
  let best = -1, bestPunkte = 1;
  const grenze = Math.min(zeilen.length, 40);
  for (let i = 0; i < grenze; i++) {
    const z = zeilen[i];
    if (z.length < 2) continue;
    let punkte = 0;
    for (const rolle of ['datum', 'betrag', 'soll', 'haben', 'text', 'gegen']) if (z.some((c) => rolleVon(c, rolle) >= 0)) punkte++;
    // Eine Kopfzeile trägt selbst keine Daten.
    if (z.some((c) => errateDatumsform([c]))) punkte -= 2;
    if (punkte > bestPunkte) { bestPunkte = punkte; best = i; }
  }
  return best;
}

function spalte(zeilen, start, j) { const out = []; for (let i = start; i < zeilen.length; i++) out.push(zeilen[i][j] == null ? '' : zeilen[i][j]); return out; }

/**
 * Schlägt eine Zuordnung vor (aus Spaltennamen, sonst aus den Werten). Das Ergebnis ist JSON
 * und kann am Konto gemerkt werden.
 * @returns {{fassung:number, kopfZeile:number, kopf:string[], datum:number, betrag:number, soll:number, haben:number,
 *   kennzeichen:number, text:number[], gegen:number, saldo:number, dezimal:','|'.', datumsform:string|null, trenner?:string}}
 */
export function zuordnungVorschlagen(zeilen, opts = {}) {
  const kopfZeile = kopfFinden(zeilen);
  const kopf = kopfZeile >= 0 ? zeilen[kopfZeile] : [];
  const start = kopfZeile + 1;
  const breite = Math.max(0, ...zeilen.slice(start, start + 50).map((z) => z.length), kopf.length);
  const z = { fassung: ZUORDNUNG_FASSUNG, kopfZeile, kopf: kopf.slice(), datum: -1, betrag: -1, soll: -1, haben: -1, kennzeichen: -1, text: [], gegen: -1, saldo: -1, konto: -1, dezimal: ',', datumsform: null };
  if (opts.trenner) z.trenner = opts.trenner;
  const nach = (rolle) => {
    let bestJ = -1, bestR = Infinity;
    for (let j = 0; j < kopf.length; j++) { const r = rolleVon(kopf[j], rolle); if (r >= 0 && r < bestR) { bestR = r; bestJ = j; } }
    return bestJ;
  };
  if (kopf.length) {
    z.datum = nach('datum');
    z.betrag = nach('betrag');
    z.soll = nach('soll'); z.haben = nach('haben');
    z.kennzeichen = nach('kennzeichen');
    z.gegen = nach('gegen');
    z.saldo = nach('saldo');
    z.konto = nach('konto');
    // Text: Verwendungszweck zuerst, dazu Buchungstext/Vorgang, wenn es eine eigene Spalte ist.
    const texte = [];
    for (let j = 0; j < kopf.length; j++) { const r = rolleVon(kopf[j], 'text'); if (r >= 0 && ![z.datum, z.betrag, z.gegen].includes(j)) texte.push([r, j]); }
    texte.sort((a, b) => a[0] - b[0]);
    z.text = texte.slice(0, 2).map((x) => x[1]);
  }
  // Soll/Haben nur, wenn es beide gibt und keinen Betrag.
  if (z.betrag >= 0 || z.soll < 0 || z.haben < 0) { if (z.betrag < 0 && z.soll >= 0 && z.haben < 0) z.betrag = z.soll; z.soll = -1; z.haben = -1; }
  // Aus den Werten: Datum, Betrag, Kennzeichen, Text, wo der Kopf nichts sagt.
  const zeigt = (j, test) => { const w = spalte(zeilen, start, j).filter(Boolean); return w.length ? w.filter(test).length / w.length : 0; };
  if (z.datum < 0) for (let j = 0; j < breite; j++) { if (errateDatumsform(spalte(zeilen, start, j))) { z.datum = j; break; } }
  if (z.betrag < 0 && z.soll < 0) {
    for (let j = breite - 1; j >= 0; j--) {
      if (j === z.datum || j === z.saldo) continue;
      const w = spalte(zeilen, start, j);
      if (zeigt(j, (x) => /^[-+(]?\s*[\d.,'\s]*\d[.,]\d{1,2}\)?-?\s*(EUR|€)?$/i.test(x)) > 0.8 && !errateDatumsform(w)) { z.betrag = j; break; }
    }
  }
  if (z.kennzeichen < 0 && z.betrag >= 0) {
    for (let j = 0; j < breite; j++) if (j !== z.betrag && zeigt(j, (x) => /^(S|H|D|C|DR|CR|Soll|Haben)$/i.test(x)) > 0.9) { z.kennzeichen = j; break; }
  }
  if (!z.text.length) {
    let bestJ = -1, bestL = 0;
    for (let j = 0; j < breite; j++) {
      if ([z.datum, z.betrag, z.soll, z.haben, z.kennzeichen, z.saldo].includes(j)) continue;
      const w = spalte(zeilen, start, j); const l = w.reduce((s, x) => s + x.length, 0) / (w.length || 1);
      if (l > bestL && !errateDatumsform(w)) { bestL = l; bestJ = j; }
    }
    if (bestJ >= 0) z.text = [bestJ];
  }
  const betragSpalten = [z.betrag, z.soll, z.haben, z.saldo].filter((j) => j >= 0);
  z.dezimal = errateDezimal(betragSpalten.flatMap((j) => spalte(zeilen, start, j)));
  z.datumsform = z.datum >= 0 ? errateDatumsform(spalte(zeilen, start, z.datum)) : null;
  return z;
}

/**
 * Eine gemerkte Zuordnung auf eine neue Datei anwenden: gesucht wird dieselbe Kopfzeile (Namen
 * verglichen, nicht die Lage). Passt sie, gibt es die Zuordnung mit der neuen Lage der Kopfzeile
 * zurück; sonst null (dann neu zuordnen).
 */
export function zuordnungAnwenden(zeilen, gemerkt) {
  if (!gemerkt || gemerkt.fassung !== ZUORDNUNG_FASSUNG) return null;
  const soll = (gemerkt.kopf || []).map(kopfNorm).join('|');
  if (!soll) {
    // Ohne Kopfzeile gemerkt: gilt, wenn die Spaltenzahl stimmt.
    const breite = Math.max(...gemerkt.text, gemerkt.datum, gemerkt.betrag, gemerkt.soll, gemerkt.haben, gemerkt.gegen);
    return zeilen.length && zeilen[0].length > breite ? { ...gemerkt, kopfZeile: -1 } : null;
  }
  for (let i = 0; i < Math.min(zeilen.length, 40); i++) {
    if (zeilen[i].map(kopfNorm).join('|') === soll) return { ...gemerkt, kopfZeile: i };
  }
  return null;
}

/** Fehlt etwas Wesentliches an der Zuordnung? Liste der fehlenden Rollen ([] = vollständig). */
export function zuordnungFehlt(z) {
  const f = [];
  if (!z || z.datum < 0) f.push('datum');
  if (!z || !z.datumsform) f.push('datumsform');
  if (!z || (z.betrag < 0 && (z.soll < 0 || z.haben < 0))) f.push('betrag');
  return f;
}

// ---- Lesen -----------------------------------------------------------------

const SOLL_KENNZEICHEN = /^(S|D|DR|Soll|Debit|Lastschrift|Belastung|-)$/i;

/** Text vergleichbar machen (für den Doppelten-Schlüssel). */
function textKern(s) { return kopfNorm(s).slice(0, 40); }

/**
 * Schlüssel gegen doppeltes Einlesen: Konto, Datum, Betrag mit Vorzeichen, Anfang des Textes.
 * Gilt für Umsätze aus jedem Verfahren (CSV, Excel, CAMT, MT940, von Hand).
 */
export function umsatzSchluessel(u, konto = '') {
  const v = u.richtung === 'einnahme' ? '+' : '-';
  return [String(konto || '').replace(/\s/g, '').slice(-4), u.valuta || '', v + (u.betragCent || 0), textKern((u.zweck || '') + (u.gegen || ''))].join('|');
}

/**
 * Liest Zeilen mit einer Zuordnung → Umsatz-Modell wie parseBankauszug.
 * @returns {{format:'CSV', konto:string, saldoStartCent:number|null, saldoEndeCent:number|null,
 *   umsaetze:Array<{valuta:string, betragCent:number, richtung:'einnahme'|'ausgabe', zweck:string, gegen:string, zeile:number}>,
 *   fehler:Array<{zeile:number, grund:'datum'|'betrag'}>, uebersprungen:number}}
 */
export function leseBankZeilen(zeilen, z, opts = {}) {
  const umsaetze = [], fehler = [];
  let uebersprungen = 0;
  const start = (z.kopfZeile == null ? -1 : z.kopfZeile) + 1;
  const zelle = (r, j) => (j >= 0 && r[j] != null ? String(r[j]).trim() : '');
  const saldi = [];
  for (let i = start; i < zeilen.length; i++) {
    const r = zeilen[i];
    const valuta = datumLesen(zelle(r, z.datum), z.datumsform);
    let cent = null;
    if (z.betrag >= 0) {
      cent = betragLesen(zelle(r, z.betrag), z.dezimal);
      if (cent != null && z.kennzeichen >= 0 && SOLL_KENNZEICHEN.test(zelle(r, z.kennzeichen))) cent = -Math.abs(cent);
      else if (cent != null && z.kennzeichen >= 0 && zelle(r, z.kennzeichen)) cent = Math.abs(cent);
    } else if (z.soll >= 0 && z.haben >= 0) {
      const s = betragLesen(zelle(r, z.soll), z.dezimal), h = betragLesen(zelle(r, z.haben), z.dezimal);
      if (s != null || h != null) cent = (h ? Math.abs(h) : 0) - (s ? Math.abs(s) : 0);
    }
    if (!valuta && cent == null) { uebersprungen++; continue; } // Fußzeile, Leerzeile, Zwischentitel
    if (!valuta) { fehler.push({ zeile: i + 1, grund: 'datum' }); continue; }
    if (cent == null) { fehler.push({ zeile: i + 1, grund: 'betrag' }); continue; }
    const zweck = (z.text || []).map((j) => zelle(r, j)).filter(Boolean).join(' · ').replace(/\s+/g, ' ');
    umsaetze.push({ valuta, betragCent: Math.abs(cent), richtung: cent >= 0 ? 'einnahme' : 'ausgabe', zweck, gegen: zelle(r, z.gegen), zeile: i + 1 });
    if (z.saldo >= 0) saldi.push({ valuta, saldo: betragLesen(zelle(r, z.saldo), z.dezimal), cent });
  }
  // Salden aus der Saldo-Spalte: Reihenfolge der Datei (neueste oben oder unten) aus den Daten.
  let saldoStartCent = null, saldoEndeCent = null;
  const mitSaldo = saldi.filter((x) => x.saldo != null);
  if (mitSaldo.length === saldi.length && saldi.length) {
    const absteigend = saldi[0].valuta > saldi[saldi.length - 1].valuta;
    const erster = absteigend ? saldi[saldi.length - 1] : saldi[0];
    const letzter = absteigend ? saldi[0] : saldi[saldi.length - 1];
    saldoStartCent = erster.saldo - erster.cent;
    saldoEndeCent = letzter.saldo;
  }
  // Konto: IBAN aus den Zeilen über der Kopfzeile (Kontoangaben), sonst aus opts.
  let konto = opts.konto || '';
  if (!konto && z.konto >= 0) konto = (zeilen.slice(start).find((r) => zelle(r, z.konto)) || [])[z.konto] || '';
  if (!konto) for (let i = 0; i < Math.max(0, start - 1); i++) {
    const m = zeilen[i].join(' ').replace(/\s/g, '').match(/[A-Z]{2}\d{2}[A-Z0-9]{11,30}/);
    if (m) { konto = m[0]; break; }
  }
  return { format: 'CSV', konto, saldoStartCent, saldoEndeCent, umsaetze, fehler, uebersprungen };
}

/**
 * Einstieg für CSV-Text: Zeilen bilden, gemerkte Zuordnung anwenden oder eine vorschlagen, lesen.
 * `neu: true` heißt: die Zuordnung wurde erraten — die Oberfläche zeigt sie zum Prüfen.
 */
export function parseBankCsv(text, gemerkt = null) {
  const trenner = (gemerkt && gemerkt.trenner) || errateTrenner(text);
  const zeilen = csvZeilen(text, trenner);
  return leseMitZuordnung(zeilen, gemerkt, { trenner });
}

/** Wie parseBankCsv, aber für fertige Zeilen (z. B. aus xlsxZeilen). */
export function leseMitZuordnung(zeilen, gemerkt = null, opts = {}) {
  const angewandt = zuordnungAnwenden(zeilen, gemerkt);
  const zuordnung = angewandt || zuordnungVorschlagen(zeilen, opts);
  if (opts.trenner) zuordnung.trenner = opts.trenner;
  const fehlt = zuordnungFehlt(zuordnung);
  const ergebnis = fehlt.length
    ? { format: 'CSV', konto: '', saldoStartCent: null, saldoEndeCent: null, umsaetze: [], fehler: [], uebersprungen: 0 }
    : leseBankZeilen(zeilen, zuordnung);
  return { ...ergebnis, zuordnung, neu: !angewandt, fehlt, zeilen };
}

/**
 * Bytes einer Bankdatei → Text. Viele Banken schreiben CSV noch in Windows-1252 (ISO-8859-1):
 * zuerst streng UTF-8, sonst Windows-1252 (Umlaute bleiben lesbar).
 */
export function textAusBytes(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^﻿/, ''); }
  catch { return new TextDecoder('windows-1252').decode(b); }
}

/** Sieht der Text wie eine Tabelle (CSV) aus? Mindestens zwei Zeilen mit Trennzeichen. */
export function istCsvText(text) {
  const t = errateTrenner(text);
  return String(text || '').split(/\r\n?|\n/).filter((z) => zaehleAusserhalb(z, t) > 0).length >= 2;
}
