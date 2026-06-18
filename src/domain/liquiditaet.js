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

/** Standard-Zeithorizont (Tage) für die Liquiditätsvorschau. */
export const LIQUIDITAET_HORIZONT_DEFAULT = 7;

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
 * Kombinierte Liquiditätsvorschau über denselben Horizont: erwartete Eingänge (bald fällige
 * Forderungen) gegen erwartete Ausgänge (bald fällige Verbindlichkeiten) + Netto.
 * @param {{forderungen?:Array, verbindlichkeiten?:Array, heute?:string, horizontTage?:number}} [opts]
 * @returns {{horizontTage:number, eingehendAnzahl:number, eingehendCent:number,
 *   ausgehendAnzahl:number, ausgehendCent:number, nettoCent:number}}
 */
export function liquiditaetsVorschau(opts = {}) {
  const ein = baldFaellig(opts.forderungen || [], opts);
  const aus = baldFaellig(opts.verbindlichkeiten || [], opts);
  return {
    horizontTage: ein.horizontTage,
    eingehendAnzahl: ein.anzahl,
    eingehendCent: ein.summeCent,
    ausgehendAnzahl: aus.anzahl,
    ausgehendCent: aus.summeCent,
    nettoCent: ein.summeCent - aus.summeCent,
  };
}
