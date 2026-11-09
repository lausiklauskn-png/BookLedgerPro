// src/domain/tagesabschluss.js
// Tagesabschluss der offenen Ladenkasse (Klaus 2026-11-09, Bauplan Neuausrichtung, Weg c / M1).
// REINE Logik, in Node geprüft — kein I/O, kein DOM.
//
// Offene Ladenkasse: Bargeld wird beim Verkauf NICHT elektronisch erfasst. Abends wird die Kasse
// gezählt; aus dem gezählten Endbestand wird die Tageseinnahme zurückgerechnet:
//
//   Einnahme = Endbestand − Anfangsbestand − (schon gebuchte Kassenbewegungen des Tages)
//              + Ausgaben aus der Kasse + Bankeinzahlung + Privatentnahme − Privateinlage
//
// Die Einnahme ist brutto (Preise im Laden sind Endpreise); die Umsatzsteuer wird herausgerechnet.
// Ein negatives Ergebnis ist ein Kassenfehlbetrag (gezählt zu wenig) — das wird NICHT gebucht,
// sondern gemeldet: erst Zählung und Angaben prüfen.
//
// EHRLICH: rechtliche Einschätzung (offene Ladenkasse, Zählprotokoll, Kleinbetragsrechnung) — mit dem
// Steuerberater bestätigen. Keine TSE, keine elektronische Registrierkasse.

import { baueBuchungZeilen } from './journal.js';

export const KONTEN_TA = Object.freeze({
  kasse: '1000', bank: '1200', privatEntnahme: '1800', privatEinlage: '1890',
  ausgabe: '4980',
  19: { erloes: '8400', ust: '1776', vorsteuer: '1576' },
  7: { erloes: '8300', ust: '1771', vorsteuer: '1571' },
  0: { erloes: '8200', ust: null, vorsteuer: null },
});
export const KLEINBETRAG_GRENZE_CENT = 25000;   // § 33 UStDV: bis 250 € brutto

const ganz = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
const satzNorm = (s) => ([0, 7, 19].includes(Number(s)) ? Number(s) : 19);

/** USt aus einem Bruttobetrag herausrechnen (Cent-genau, wie baueBuchungZeilen). */
export function ustHeraus(bruttoCent, satz = 19) {
  const b = ganz(bruttoCent), s = satzNorm(satz);
  if (!s) return { brutto: b, netto: b, ust: 0, satz: s };
  const netto = Math.round(b / (1 + s / 100));
  return { brutto: b, netto, ust: b - netto, satz: s };
}

/**
 * Rückrechnung der Tageseinnahme.
 * @param e {{anfangCent, endCent, ausgaben?:Array<{betragCent,text?,ustSatz?}>, bankCent?, entnahmeCent?,
 *            einlageCent?, gebuchtCent?, ustSatz?}}  gebuchtCent = Saldo schon gebuchter Kassenbewegungen
 *            desselben Tages (Zufluss +, Abfluss −), z. B. eine bar bezahlte Rechnung aus dem Eingang.
 * @returns {{einnahmeCent, nettoCent, ustCent, satz, ausgabenCent, fehler:string[], hinweise:string[]}}
 */
export function rueckrechnung(e = {}) {
  const fehler = [], hinweise = [];
  if (e.endCent == null || e.endCent === '' || !Number.isFinite(Number(e.endCent))) fehler.push('Gezählter Endbestand fehlt.');
  const anfang = ganz(e.anfangCent), end = ganz(e.endCent);
  if (end < 0) fehler.push('Endbestand darf nicht negativ sein.');
  const ausgaben = (e.ausgaben || []).filter((a) => ganz(a.betragCent) > 0);
  for (const a of e.ausgaben || []) if (ganz(a.betragCent) < 0) fehler.push('Ausgabe mit negativem Betrag.');
  const ausgabenCent = ausgaben.reduce((n, a) => n + ganz(a.betragCent), 0);
  const bank = Math.max(0, ganz(e.bankCent)), entnahme = Math.max(0, ganz(e.entnahmeCent));
  const einlage = Math.max(0, ganz(e.einlageCent)), gebucht = ganz(e.gebuchtCent);
  const einnahmeCent = end - anfang - gebucht + ausgabenCent + bank + entnahme - einlage;
  if (!fehler.length && einnahmeCent < 0) {
    fehler.push(`Kassenfehlbetrag: es fehlen ${(-einnahmeCent / 100).toFixed(2).replace('.', ',')} €. Zählung und Angaben prüfen.`);
  }
  const u = ustHeraus(Math.max(0, einnahmeCent), e.ustSatz);
  if (!fehler.length && einnahmeCent === 0) hinweise.push('Heute keine Bareinnahme.');
  if (gebucht) hinweise.push('Schon gebuchte Kassenbewegungen dieses Tages sind berücksichtigt.');
  return { einnahmeCent, nettoCent: u.netto, ustCent: u.ust, satz: u.satz, ausgabenCent, fehler, hinweise };
}

/**
 * Buchungs-Entwürfe eines Tagesabschlusses (je Geschäftsvorfall eine Buchung, alle am Kassenkonto).
 * @returns {Array<{art, datum, beschreibung, zeilen}>}
 */
export function tagesabschlussBuchungen(datum, e = {}, r = rueckrechnung(e)) {
  if (r.fehler.length) throw new Error(r.fehler.join(' '));
  const K = KONTEN_TA, out = [];
  if (r.einnahmeCent > 0) {
    const k = K[r.satz];
    const z = baueBuchungZeilen({ bruttoCents: r.einnahmeCent, ustSatz: r.satz, sollKonto: K.kasse,
      habenKonto: k.erloes, steuerKonto: k.ust, steuerSeite: 'H' });
    out.push({ art: 'einnahme', datum, beschreibung: `Tageseinnahme bar ${datum} (Tagesabschluss)`, zeilen: z.zeilen });
  }
  for (const a of (e.ausgaben || []).filter((x) => ganz(x.betragCent) > 0)) {
    const satz = a.ustSatz == null ? 0 : satzNorm(a.ustSatz);
    const k = K[satz];
    const z = baueBuchungZeilen({ bruttoCents: ganz(a.betragCent), ustSatz: satz, sollKonto: a.konto || K.ausgabe,
      habenKonto: K.kasse, steuerKonto: k.vorsteuer, steuerSeite: 'S' });
    out.push({ art: 'ausgabe', datum, beschreibung: `Barausgabe ${datum}: ${String(a.text || 'Ausgabe').slice(0, 80)}`, zeilen: z.zeilen });
  }
  const zwei = (art, betrag, soll, haben, text) => {
    if (betrag > 0) out.push({ art, datum, beschreibung: `${text} ${datum}`,
      zeilen: [{ konto: soll, seite: 'S', betrag }, { konto: haben, seite: 'H', betrag }] });
  };
  zwei('bank', Math.max(0, ganz(e.bankCent)), K.bank, K.kasse, 'Bankeinzahlung aus der Kasse');
  zwei('entnahme', Math.max(0, ganz(e.entnahmeCent)), K.privatEntnahme, K.kasse, 'Privatentnahme aus der Kasse');
  zwei('einlage', Math.max(0, ganz(e.einlageCent)), K.kasse, K.privatEinlage, 'Privateinlage in die Kasse');
  return out;
}

/** Alle Konten, die ein Tagesabschluss berühren kann (für ensureSeedKonten). */
export function benoetigteKontenTA() {
  const K = KONTEN_TA;
  return [K.kasse, K.bank, K.privatEntnahme, K.privatEinlage, K.ausgabe,
    ...[19, 7, 0].flatMap((s) => [K[s].erloes, K[s].ust, K[s].vorsteuer]).filter(Boolean)];
}

// ---- Fehlende Tage --------------------------------------------------------------------------------

function tagPlus(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
function wochentag(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }

/**
 * Tage ohne Abschluss zwischen dem ersten Abschluss (oder `seit`) und `bis` (meist gestern).
 * Ruhetage (Wochentage 0 = Sonntag … 6) und ausdrücklich geschlossene Tage zählen nicht.
 * @returns {string[]} ISO-Daten, älteste zuerst
 */
export function fehlendeTage(abschlussDaten, { seit, bis, ruhetage = [0], geschlossen = [] } = {}) {
  const da = new Set(abschlussDaten || []), zu = new Set(geschlossen || []);
  const sortiert = [...da].sort();
  const start = seit || sortiert[0];
  if (!start || !bis || start > bis) return [];
  const out = [];
  for (let d = start, n = 0; d <= bis && n < 3700; d = tagPlus(d, 1), n++) {
    if (da.has(d) || zu.has(d) || ruhetage.includes(wochentag(d))) continue;
    out.push(d);
  }
  return out;
}

// ---- Eingabe per Sprache: Satz → Felder ------------------------------------------------------------

const ZAHL = /(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:euro|eur|€)?(?:\s+(?:und\s+)?(\d{1,2})\s*(?:cent|ct))?/i;

function zahlCent(m) {
  let s = m[1];
  if (/^\d{1,3}(\.\d{3})+/.test(s)) s = s.replace(/\./g, '');
  const v = Math.round(parseFloat(s.replace(',', '.')) * 100);
  return v + (m[2] ? Number(m[2]) : 0);
}

/**
 * Liest einen gesprochenen oder getippten Satz, z. B.
 * „Bestand 612 Euro, 20 Euro Kaffee ausgegeben, 300 zur Bank, 50 privat entnommen“.
 * Nie raten: was nicht eindeutig ist, landet in `unklar` und wird angezeigt.
 * @returns {{endCent:number|null, ausgaben:Array<{betragCent,text}>, bankCent, entnahmeCent, einlageCent, unklar:string[]}}
 */
export function satzZuFeldern(satz) {
  const out = { endCent: null, ausgaben: [], bankCent: 0, entnahmeCent: 0, einlageCent: 0, unklar: [] };
  const teile = String(satz || '').replace(/\s+/g, ' ')
    .split(/\s*(?:[;\n]|,(?!\d)|\.(?!\d)|\bund dann\b|\bdann\b|\bund\b(?=\s+\d))\s*/i)
    .map((s) => s.trim()).filter(Boolean);
  for (const teil of teile) {
    const m = teil.match(ZAHL);
    const t = teil.toLowerCase();
    if (!m) { if (/\d/.test(t) || /bestand|bank|privat|ausgegeben/.test(t)) out.unklar.push(teil); continue; }
    const cent = zahlCent(m);
    if (/(end)?bestand|gezählt|gezaehlt|in der kasse|kasse hat|kassenstand/.test(t) && !/ausgegeben|bank|privat/.test(t)) {
      if (out.endCent != null) out.unklar.push(teil); else out.endCent = cent;
    } else if (/bank/.test(t)) out.bankCent += cent;
    else if (/privat.*(einge?leg|rein|dazu)|einlage|eingelegt/.test(t)) out.einlageCent += cent;
    else if (/privat|entnomm|entnahme/.test(t)) out.entnahmeCent += cent;
    else if (/ausgegeben|ausgabe|bezahlt|gekauft|für\s/.test(t)) {
      const text = teil.replace(ZAHL, ' ').replace(/\b(ausgegeben|ausgabe|bezahlt|gekauft|für|fuer|euro|eur)\b/gi, ' ')
        .replace(/[€]/g, ' ').replace(/\s+/g, ' ').trim();
      out.ausgaben.push({ betragCent: cent, text: text || 'Ausgabe' });
    } else out.unklar.push(teil);
  }
  return out;
}

// ---- Quittung (Kleinbetragsrechnung) ---------------------------------------------------------------

/**
 * Pflichtangaben einer Kleinbetragsrechnung (§ 33 UStDV, bis 250 € brutto) prüfen.
 * @param q {{aussteller, anschrift, datum, leistung, menge?, bruttoCent, ustSatz}}
 * @returns {{ok:boolean, fehlt:string[], hinweise:string[], ust:{netto,ust}}}
 */
export function quittungPruefen(q = {}) {
  const fehlt = [], hinweise = [];
  if (!String(q.aussteller || '').trim()) fehlt.push('Name des Betriebs');
  if (!String(q.anschrift || '').trim()) fehlt.push('Anschrift des Betriebs');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(q.datum || ''))) fehlt.push('Datum');
  if (!String(q.leistung || '').trim()) fehlt.push('Menge und Art der Ware/Leistung');
  const brutto = ganz(q.bruttoCent);
  if (brutto <= 0) fehlt.push('Betrag (brutto)');
  if (q.ustSatz == null || ![0, 7, 19].includes(Number(q.ustSatz))) fehlt.push('Steuersatz');
  if (brutto > KLEINBETRAG_GRENZE_CENT) hinweise.push('Über 250 €: Kleinbetragsrechnung reicht nicht — vollständige Rechnung mit Steuernummer, Nummer, Empfänger, Netto und Steuer ausstellen.');
  const u = ustHeraus(brutto, q.ustSatz == null ? 19 : q.ustSatz);
  return { ok: !fehlt.length && brutto <= KLEINBETRAG_GRENZE_CENT, fehlt, hinweise, ust: { netto: u.netto, ust: u.ust } };
}
