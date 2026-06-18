// src/domain/kalibrierung.js
// BAUPLAN Block 2 / Schritt 10 — Kalibrierung + Statistik/Vergleich (REIN, node-getestet).
// Grundlage: docs/KALKULATION_KATALOG.md §5.1 (USP „selbstlernende Kalkulation":
// Korrekturfaktoren aus der eigenen Historie) + §5.3 (Trefferquote je Preisniveau).
//
// WAS DIESER SCHRITT TUT — zwei Auswertungen über die eigene Historie:
//   1) KORREKTURFAKTOREN je Kostenart (Vor→Nachkalkulation): wo lag der IST real über/unter
//      dem SOLL? (Beispiel Katalog §5.1: Demontage real 1,4×, Verschnitt +12 %.) Aus den
//      Soll/Ist-Vergleichen vieler fertiger Aufträge (domain/nachkalkulation.js) ergibt sich
//      je Kostenart ein Faktor IST/SOLL, der in den Kalkulations-Kern ZURÜCKFLIESST
//      (`kalkuliereKalibriert`) — die Maschine erfindet nichts, sie rechnet mit den eigenen
//      Zahlen weiter (Katalog §5 „ehrlich").
//   2) ANGEBOTS-TREFFERQUOTE je Preisniveau: angenommene vs. abgelehnte Angebote, gruppiert
//      nach interner Marge (Deckungsbeitrag/Netto) — „bei welchem Preisniveau gewinnen wir?".
//
// PRIME DIRECTIVE (Katalog §0): rein intern. Faktoren, Margen, Trefferquoten verlassen das
//   Haus NIE als Außendokument. Der `kalibrierungsDigest` ist eine PII-FREIE Aggregat-
//   Zusammenfassung (nur Kostenart-Faktoren + Margen-Kübel) — der mögliche, aber STRIKT
//   opt-in/BYOK pseudonyme Payload-Kandidat für eine spätere KI-Analyse (Mistral EU). Diese
//   Schicht ruft KEINE KI; das tatsächliche Senden ist ein eigener, ausdrücklich zu
//   bestätigender Schritt (CLAUDE.md §8).
//
// CENT-GENAU: Geld als ganzzahlige Cent (wie domain/kalkulation.js). Faktoren/Prozente sind
//   Dezimalwerte (gerundet zur Anzeige). EHRLICHE GRENZE: reine Logik, KEIN UI/Store in
//   diesem Schritt (eigener Folgeschritt) — die Vergleiche/Angebote werden hereingereicht.

import {
  KOSTENART, KOSTENART_LISTE, kalkuliereVorwaerts,
} from './kalkulation.js';
import { ANGEBOT_STATUS, interneAuswertung } from './angebote.js';

/** Endliche Zahl oder 0 (schützt vor NaN/undefined/null). */
function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

/** Auf 3 Nachkommastellen runden (Faktor-Anzeige, z. B. 1,083). */
function runde3(x) {
  return Math.round(num(x) * 1000) / 1000;
}

/** Auf 1 Nachkommastelle runden (Prozent-Anzeige, z. B. 8,3 %). */
function runde1(x) {
  return Math.round(num(x) * 10) / 10;
}

/** Median einer Zahlenliste (null bei leerer Liste). Robust gegen Ausreißer. */
function median(arr) {
  const s = [...(arr || [])].filter(Number.isFinite).sort((a, b) => a - b);
  const n = s.length;
  if (!n) return null;
  const m = Math.floor(n / 2);
  return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ── 1) Korrekturfaktoren je Kostenart aus der Historie ───────────────────────

/**
 * Aggregiert die Soll/Ist-Vergleiche vieler Aufträge (je ein Ergebnis von
 * `nachkalkulation()`, das ein `perBlock: [{block, sollCent, istCent}]` trägt) zu einem
 * Korrekturfaktor je Kostenart. Zwei Sichtweisen pro Kostenart:
 *   - `faktor`        = ΣIST / ΣSOLL (geldgewichtet — der ökonomisch korrekte Gesamtfaktor;
 *                       große Aufträge zählen stärker).
 *   - `medianFaktor`  = Median der Einzel-Job-Faktoren IST/SOLL (robust gegen Ausreißer;
 *                       jeder Auftrag zählt gleich).
 * Aufträge, bei denen der SOLL einer Kostenart 0 ist, gehen NICHT in den Median ein (kein
 * sinnvoller Quotient) und `anzahl` zählt nur die verwertbaren. `faktor` ist null, solange
 * ΣSOLL = 0 (keine Datengrundlage).
 *
 * @param {Array<{perBlock?:Array<{block:string, sollCent:number, istCent:number}>}>} vergleiche
 * @returns {Object} block → {sollSummeCent, istSummeCent, faktor, medianFaktor,
 *   abweichungProzent, anzahl}
 */
export function korrekturFaktoren(vergleiche = []) {
  const acc = {};
  for (const k of KOSTENART_LISTE) acc[k] = { sollSummeCent: 0, istSummeCent: 0, faktoren: [], anzahl: 0 };
  for (const v of vergleiche || []) {
    for (const b of (v && v.perBlock) || []) {
      const a = acc[b.block];
      if (!a) continue;
      const soll = num(b.sollCent);
      const ist = num(b.istCent);
      a.sollSummeCent += soll;
      a.istSummeCent += ist;
      if (soll !== 0) { a.faktoren.push(ist / soll); a.anzahl++; }
    }
  }
  const out = {};
  for (const k of KOSTENART_LISTE) {
    const a = acc[k];
    const faktor = a.sollSummeCent !== 0 ? runde3(a.istSummeCent / a.sollSummeCent) : null;
    const med = a.faktoren.length ? median(a.faktoren) : null;
    out[k] = {
      sollSummeCent: a.sollSummeCent,
      istSummeCent: a.istSummeCent,
      faktor,
      medianFaktor: med != null ? runde3(med) : null,
      abweichungProzent: faktor != null ? runde1((faktor - 1) * 100) : null,
      anzahl: a.anzahl,
    };
  }
  return out;
}

/**
 * Verdichtet das Faktoren-Objekt (aus korrekturFaktoren) zu reinen Multiplikatoren je
 * Kostenart ({ block: zahl }), die `kalibriereEingabe`/`kalkuliereKalibriert` direkt nutzen.
 * Konservativ-defensiv:
 *   - `opts.quelle`    'gewichtet' (Default, nutzt `faktor`) oder 'median' (nutzt `medianFaktor`).
 *   - `opts.minAnzahl` Mindest-Stichprobe je Kostenart (Default 1); darunter → Faktor 1
 *                      (zu wenig Historie → nicht kalibrieren).
 *   - `opts.min`/`opts.max` optionale Schranken (z. B. Faktor zwischen 0,5 und 2,0 deckeln,
 *                      damit ein Datenausreißer die Kalkulation nicht entgleisen lässt).
 * Fehlende/ungültige/≤0-Faktoren werden zu 1 (neutral — keine Kalibrierung).
 * @returns {Object} block → faktor (Zahl, neutral = 1)
 */
export function faktorWerte(faktoren = {}, opts = {}) {
  const quelle = opts.quelle === 'median' ? 'medianFaktor' : 'faktor';
  const minAnzahl = opts.minAnzahl != null ? opts.minAnzahl : 1;
  const out = {};
  for (const k of KOSTENART_LISTE) {
    const f = faktoren[k];
    let val = f && f.anzahl >= minAnzahl ? f[quelle] : null;
    if (val == null || !Number.isFinite(val) || val <= 0) val = 1;
    if (opts.min != null) val = Math.max(num(opts.min), val);
    if (opts.max != null) val = Math.min(num(opts.max), val);
    out[k] = val;
  }
  return out;
}

// ── 2) Kalibrierung in den Kalkulations-Kern zurückführen ────────────────────

/** Skaliert die mengen-/geldgetriebenen Felder eines Kostenart-Blocks mit dem Faktor. */
function skaliereBlock(block, faktor) {
  if (!block || faktor === 1) return block;
  const b = { ...block };
  // Geld-/Mengen-Treiber skalieren (Ergebnis skaliert linear mit) — Sätze/Prozente bleiben.
  for (const key of ['betragCent', 'preisProM2Cent', 'ekCent']) {
    if (b[key] != null) b[key] = num(b[key]) * faktor;
  }
  if (b.stunden != null) b.stunden = num(b.stunden) * faktor;
  return b;
}

/**
 * Wendet die Korrektur-Multiplikatoren (aus `faktorWerte`) auf eine Kern-Eingabe an:
 * skaliert je Kostenart den Mengen-/Geld-Treiber, lässt Sätze/Prozente und die internen
 * Zuschläge (Gemeinkosten%/Gewinn%/USt%) unangetastet. Reine Zuordnung — KEINE neue Formel
 * (analog domain/produktschemata.js, „füttert nur den Kern").
 * @param {object} eingabe  Eingabe für kalkuliereVorwaerts
 * @param {Object} faktoren block → Multiplikator (Default 1)
 */
export function kalibriereEingabe(eingabe = {}, faktoren = {}) {
  const f = (k) => {
    const v = faktoren[k];
    return Number.isFinite(v) && v > 0 ? v : 1;
  };
  return {
    ...eingabe,
    material: skaliereBlock(eingabe.material, f(KOSTENART.MATERIAL)),
    maschine: skaliereBlock(eingabe.maschine, f(KOSTENART.MASCHINE)),
    arbeit: skaliereBlock(eingabe.arbeit, f(KOSTENART.ARBEIT)),
    zukauf: skaliereBlock(eingabe.zukauf, f(KOSTENART.ZUKAUF)),
    montage: skaliereBlock(eingabe.montage, f(KOSTENART.MONTAGE)),
  };
}

/**
 * Kalibrierte Vorwärtskalkulation: wie `kalkuliereVorwaerts`, aber mit den aus der Historie
 * gewonnenen Korrekturfaktoren je Kostenart. Liefert exakt das Kern-Ergebnis (cent-genau).
 * @param {object} eingabe  Eingabe für kalkuliereVorwaerts
 * @param {Object} faktoren block → Multiplikator (aus faktorWerte)
 */
export function kalkuliereKalibriert(eingabe = {}, faktoren = {}) {
  return kalkuliereVorwaerts(kalibriereEingabe(eingabe, faktoren));
}

// ── 3) Angebots-Trefferquote je Preisniveau ──────────────────────────────────

/** Ergebnis eines Angebots aus Vertriebssicht. */
export const ANGEBOT_ERGEBNIS = Object.freeze({
  GEWONNEN: 'gewonnen',
  VERLOREN: 'verloren',
  OFFEN: 'offen',
});

/**
 * Ergebnis eines Angebots aus seinem Status. Default: `angenommen` → gewonnen,
 * `abgelehnt` → verloren, alles andere (entwurf/offen/archiviert) → offen (nicht entschieden).
 * `archiviert` ist BEWUSST nicht „gewonnen" — es ist mehrdeutig (abgelehnte Angebote wandern
 * laut Katalog §4 ebenfalls ins Archiv, angenommene nach der Rechnungs-Übernahme auch). Wer
 * den Ausgang archivierter Angebote kennt, kann die Status-Mengen über `opts` überschreiben.
 * @param {object} angebot
 * @param {{gewonnenStatus?:string[], verlorenStatus?:string[]}} [opts]
 */
export function angebotErgebnis(angebot, opts = {}) {
  const gewonnen = opts.gewonnenStatus || [ANGEBOT_STATUS.ANGENOMMEN];
  const verloren = opts.verlorenStatus || [ANGEBOT_STATUS.ABGELEHNT];
  const s = angebot && angebot.status;
  if (gewonnen.includes(s)) return ANGEBOT_ERGEBNIS.GEWONNEN;
  if (verloren.includes(s)) return ANGEBOT_ERGEBNIS.VERLOREN;
  return ANGEBOT_ERGEBNIS.OFFEN;
}

/**
 * Interne Marge eines Angebots in Prozent = Deckungsbeitrag / Netto × 100 (aus der internen
 * Auswertung, domain/angebote.js). null, wenn kein Netto/keine interne Kalkulation vorliegt.
 */
export function angebotMargeProzent(angebot) {
  const a = interneAuswertung(angebot);
  if (!a || a.netto === 0) return null;
  return runde1((a.deckungsbeitrag / a.netto) * 100);
}

/** Preisniveau-Kübel. */
export const PREISNIVEAU = Object.freeze({
  NIEDRIG: 'niedrig',
  MITTEL: 'mittel',
  HOCH: 'hoch',
  UNBEKANNT: 'unbekannt',
});

/** Reihenfolge der Preisniveau-Kübel (stabil). */
export const PREISNIVEAU_LISTE = [
  PREISNIVEAU.NIEDRIG, PREISNIVEAU.MITTEL, PREISNIVEAU.HOCH, PREISNIVEAU.UNBEKANNT,
];

/**
 * Ordnet eine Marge (in Prozent) einem Preisniveau zu. `grenzen = [unten, oben]`:
 * < unten → niedrig, < oben → mittel, sonst hoch. null/NaN → unbekannt.
 * @param {?number} margeProzent
 * @param {[number, number]} [grenzen]  Default [15, 30]
 */
export function preisniveau(margeProzent, grenzen = [15, 30]) {
  if (margeProzent == null || !Number.isFinite(margeProzent)) return PREISNIVEAU.UNBEKANNT;
  const [unten, oben] = grenzen;
  if (margeProzent < num(unten)) return PREISNIVEAU.NIEDRIG;
  if (margeProzent < num(oben)) return PREISNIVEAU.MITTEL;
  return PREISNIVEAU.HOCH;
}

/**
 * Trefferquote über eine Angebots-Liste: gewonnen/verloren/offen + Quote
 * (gewonnen / entschieden, in Prozent; null, wenn nichts entschieden ist).
 * @param {Array<object>} angebote
 * @param {object} [opts]  durchgereicht an angebotErgebnis
 */
export function trefferquote(angebote = [], opts = {}) {
  let gewonnen = 0, verloren = 0, offen = 0;
  for (const a of angebote || []) {
    const e = angebotErgebnis(a, opts);
    if (e === ANGEBOT_ERGEBNIS.GEWONNEN) gewonnen++;
    else if (e === ANGEBOT_ERGEBNIS.VERLOREN) verloren++;
    else offen++;
  }
  const entschieden = gewonnen + verloren;
  return {
    gewonnen,
    verloren,
    offen,
    entschieden,
    gesamt: (angebote || []).length,
    quoteProzent: entschieden ? runde1((gewonnen / entschieden) * 100) : null,
  };
}

/**
 * Trefferquote je Preisniveau: gruppiert die Angebote nach ihrer internen Marge in die
 * Preisniveau-Kübel und liefert je Kübel eine `trefferquote`. So wird sichtbar, bei welchem
 * Preisniveau gewonnen wird (Katalog §5.3). Mengen-getreue Aufschlüsselung — keine Aussage,
 * dass ein Preisniveau „besser" sei (das entscheidet der Betrieb).
 * @param {Array<object>} angebote
 * @param {{grenzen?:[number,number]}} [opts]  + an angebotErgebnis durchgereicht
 * @returns {Object} preisniveau → trefferquote
 */
export function trefferquoteJePreisniveau(angebote = [], opts = {}) {
  const grenzen = opts.grenzen || [15, 30];
  const gruppen = {};
  for (const niveau of PREISNIVEAU_LISTE) gruppen[niveau] = [];
  for (const a of angebote || []) {
    gruppen[preisniveau(angebotMargeProzent(a), grenzen)].push(a);
  }
  const out = {};
  for (const niveau of PREISNIVEAU_LISTE) out[niveau] = trefferquote(gruppen[niveau], opts);
  return out;
}

// ── 4) Pseudonymer Aggregat-Digest (Andockpunkt für optionale KI, opt-in) ────

/**
 * PII-FREIE Aggregat-Zusammenfassung der Historie — Korrekturfaktoren + Trefferquoten. Sie
 * enthält KEINE Klartext-Kunden/Belege/Angebotsnummern, nur Kostenart-Faktoren und Margen-
 * Kübel-Zähler. Damit ist sie der mögliche Payload-Kandidat für eine spätere, STRIKT opt-in
 * + BYOK pseudonyme KI-Analyse (Mistral EU, CLAUDE.md §8). Diese Funktion SENDET NICHTS —
 * das tatsächliche Übertragen ist ein eigener, ausdrücklich zu bestätigender Schritt.
 * @param {Array<object>} vergleiche  Soll/Ist-Vergleiche (nachkalkulation())
 * @param {Array<object>} angebote
 * @param {object} [opts]  durchgereicht an die Auswertungen
 */
export function kalibrierungsDigest(vergleiche = [], angebote = [], opts = {}) {
  return {
    anzahlVergleiche: (vergleiche || []).length,
    anzahlAngebote: (angebote || []).length,
    faktoren: korrekturFaktoren(vergleiche),
    trefferquote: trefferquote(angebote, opts),
    trefferquoteJePreisniveau: trefferquoteJePreisniveau(angebote, opts),
  };
}
