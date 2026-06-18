// src/domain/liquiditaet.js
// Liquiditätsvorschau („bald fällig") — der vorausschauende Gegenpol zu den
// Überfälligkeits-KPIs (mahnwesen.forderungUebersicht / eingangsverzug.verzugUebersicht).
// Während jene zeigen, was bereits ÜBERFÄLLIG ist (zu spät), zeigt diese Schicht, was in
// den NÄCHSTEN Tagen fällig wird: erwartete Eingänge (offene Forderungen) gegen erwartete
// Ausgänge (offene Verbindlichkeiten) im selben Zeithorizont → eine einfache Cash-Planung
// auf einen Blick (eingehend − ausgehend = Netto-Liquiditätsbeitrag des Fensters).
//
// Reine, cent-genaue Logik (node-getestet). Kein Netz, kein DOM. Sie arbeitet auf den
// bereits ANGEREICHERTEN Posten (mahnwesen.anreicherePosten {betragCent, faelligAm} bzw.
// payables.anreichereVerbindlichkeiten {offenCent, faelligAm}) — also genau dem, was
// forderungReport(...).angereichert / verzugReport(...).angereichert ohnehin liefern.
//
// Abgrenzung (KEINE Doppelzählung): „bald fällig" sind Posten mit Fälligkeit ab heute
// (inkl. heute) bis einschließlich heute + Horizont. Bereits überfällige Posten
// (Fälligkeit < heute) fallen NICHT hierein — die deckt die jeweilige Überfälligkeits-KPI ab.
//
// Ergänzung (Folgeschritt): Die reine Eingänge-vs-Ausgänge-Sicht beantwortet noch nicht die
// eigentliche Liquiditätsfrage „reicht das Geld?". Dafür wird der AKTUELLE Geldbestand
// (Kassen-/Bankkonten, aus den festgeschriebenen Buchungen) als Startwert herangezogen und
// daraus ein PROJIZIERTER Saldo am Ende des Fensters gebildet: Bestand + Eingänge − Ausgänge.

import { KONTOART, saldo } from './accounts.js';

/** Standard-Zeithorizont (Tage) für die Liquiditätsvorschau. */
export const LIQUIDITAET_HORIZONT_DEFAULT = 7;

// SKR03-Nummernbereiche der Geld-/Finanzkonten: Kasse (1000–1099) und Bank (1200–1299).
// Bewusst eng gewählt — Forderungen (1400), Vorsteuer (157x) usw. sind ebenfalls AKTIV,
// gehören aber NICHT zum verfügbaren Geld.
export const GELDKONTO_BEREICHE = [[1000, 1099], [1200, 1299]];

/** Ampel für die projizierte Liquidität. */
export const LIQUIDITAET_AMPEL = { OK: 'ok', WARNUNG: 'warnung', KRITISCH: 'kritisch' };

// Ganze Tage zwischen zwei ISO-Daten (b − a), oder null bei ungültigem Datum.
function tageDiff(a, b) {
  if (!a || !b) return null;
  const da = Date.parse(String(a).slice(0, 10));
  const db = Date.parse(String(b).slice(0, 10));
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
}

// Offener (Brutto-)Betrag eines Postens: payables tragen `offenCent`, Forderungen
// `betragCent` (= offener Rest aus zahlungsabgleich.offenePosten). Beide werden unterstützt.
function offenerBetrag(p = {}) {
  if (p.offenCent != null) return Math.round(Number(p.offenCent) || 0);
  if (p.betragCent != null) return Math.round(Number(p.betragCent) || 0);
  return 0;
}

/**
 * Summe + Anzahl der Posten, die im Fenster [heute … heute + Horizont] fällig werden und
 * noch NICHT überfällig sind. Erwartet angereicherte Posten mit `faelligAm` (JJJJ-MM-TT)
 * und `offenCent`/`betragCent`.
 * @param {Array} angereichertePosten
 * @param {{heute?:string, horizontTage?:number}} [opts]
 * @returns {{anzahl:number, summeCent:number, horizontTage:number}}
 */
export function baldFaellig(angereichertePosten = [], opts = {}) {
  const heute = opts.heute || new Date().toISOString().slice(0, 10);
  const horizont = opts.horizontTage != null
    ? Math.max(0, Math.floor(Number(opts.horizontTage) || 0))
    : LIQUIDITAET_HORIZONT_DEFAULT;
  let anzahl = 0, summeCent = 0;
  for (const p of angereichertePosten) {
    if (!p || !p.faelligAm) continue;
    const tage = tageDiff(heute, p.faelligAm); // Tage bis Fälligkeit: >0 künftig, 0 heute, <0 überfällig
    if (tage == null) continue;
    if (tage < 0 || tage > horizont) continue; // überfällig bzw. außerhalb des Fensters
    anzahl++;
    summeCent += offenerBetrag(p);
  }
  return { anzahl, summeCent, horizontTage: horizont };
}

/**
 * Gehört das Konto zum verfügbaren Geld (Kasse/Bank)? Nur AKTIV-Konten in den
 * Geldkonto-Nummernbereichen. Rein.
 * @param {{nummer?:string, art?:string}} konto
 * @returns {boolean}
 */
export function istGeldkonto(konto) {
  if (!konto || konto.art !== KONTOART.AKTIV) return false;
  const n = parseInt(String(konto.nummer), 10);
  if (!Number.isInteger(n)) return false;
  return GELDKONTO_BEREICHE.some(([von, bis]) => n >= von && n <= bis);
}

/**
 * Aktueller Geldbestand (Kasse + Bank) aus den FESTGESCHRIEBENEN Buchungen bis einschließlich
 * `stichtag` (Default: alle). Saldo je Geldkonto = Soll − Haben (Aktiv-Konto). Rein.
 * @param {Array} buchungen - alle Buchungen (nur `seq != null` zählt)
 * @param {Array} konten - Kontenplan (zur Geldkonto-Erkennung + Namen)
 * @param {{stichtag?:string}} [opts]
 * @returns {{gesamtCent:number, perKonto:Array<{nummer:string,name:string,saldoCent:number}>}}
 */
export function geldbestand(buchungen = [], konten = [], opts = {}) {
  const stichtag = opts.stichtag || null;
  const namen = {};
  const geld = new Set();
  for (const k of konten || []) {
    if (istGeldkonto(k)) { const nr = String(k.nummer); geld.add(nr); namen[nr] = k.name || ''; }
  }
  const bewegung = {}; // nummer -> {soll, haben}
  for (const b of buchungen || []) {
    if (!b || b.seq == null) continue;                       // nur festgeschrieben
    if (stichtag && b.datum && b.datum > stichtag) continue; // Zukunft ausblenden
    for (const z of b.zeilen || []) {
      const nr = String(z.konto);
      if (!geld.has(nr)) continue;
      const w = bewegung[nr] || (bewegung[nr] = { soll: 0, haben: 0 });
      if (z.seite === 'S') w.soll += z.betrag || 0; else w.haben += z.betrag || 0;
    }
  }
  let gesamtCent = 0;
  const perKonto = [];
  for (const nr of [...geld].sort()) {
    const s = saldo(KONTOART.AKTIV, bewegung[nr] || { soll: 0, haben: 0 });
    perKonto.push({ nummer: nr, name: namen[nr], saldoCent: s });
    gesamtCent += s;
  }
  return { gesamtCent, perKonto };
}

/**
 * Kombinierte Liquiditätsvorschau über denselben Horizont: erwartete Eingänge (bald fällige
 * Forderungen) gegen erwartete Ausgänge (bald fällige Verbindlichkeiten) + Netto. Wird
 * zusätzlich `geldbestandCent` übergeben, kommt ein PROJIZIERTER Saldo am Fenster-Ende dazu
 * (Bestand + Eingänge − Ausgänge); sonst bleiben diese Felder `null` (abwärtskompatibel).
 * @param {{forderungen?:Array, verbindlichkeiten?:Array, heute?:string, horizontTage?:number,
 *   geldbestandCent?:number}} [opts]
 * @returns {{horizontTage:number, eingehendAnzahl:number, eingehendCent:number,
 *   ausgehendAnzahl:number, ausgehendCent:number, nettoCent:number,
 *   geldbestandCent:?number, projiziertCent:?number}}
 */
export function liquiditaetsVorschau(opts = {}) {
  const ein = baldFaellig(opts.forderungen || [], opts);
  const aus = baldFaellig(opts.verbindlichkeiten || [], opts);
  const nettoCent = ein.summeCent - aus.summeCent;
  const hatBestand = opts.geldbestandCent != null;
  const geldbestandCent = hatBestand ? Math.round(Number(opts.geldbestandCent) || 0) : null;
  const projiziertCent = hatBestand ? geldbestandCent + nettoCent : null;
  return {
    horizontTage: ein.horizontTage,
    eingehendAnzahl: ein.anzahl,
    eingehendCent: ein.summeCent,
    ausgehendAnzahl: aus.anzahl,
    ausgehendCent: aus.summeCent,
    nettoCent,
    geldbestandCent,
    projiziertCent,
  };
}

/**
 * Ampel für die projizierte Liquidität: kritisch, wenn der projizierte Saldo negativ wird
 * (nach Plan illiquide); Warnung, wenn der aktuelle Bestand allein die Ausgänge nicht deckt
 * (Liquidität hängt an erwarteten Eingängen); sonst ok. Ohne Bestand → ok (keine Aussage).
 * @param {{geldbestandCent:?number, ausgehendCent?:number, projiziertCent:?number}} v
 * @returns {string} LIQUIDITAET_AMPEL.*
 */
export function liquiditaetsAmpel(v = {}) {
  if (v.projiziertCent == null) return LIQUIDITAET_AMPEL.OK;
  if (v.projiziertCent < 0) return LIQUIDITAET_AMPEL.KRITISCH;
  if ((v.geldbestandCent || 0) - (v.ausgehendCent || 0) < 0) return LIQUIDITAET_AMPEL.WARNUNG;
  return LIQUIDITAET_AMPEL.OK;
}
