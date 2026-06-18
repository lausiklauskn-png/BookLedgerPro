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

// Auswählbare Zeithorizonte (Tage) für die Vorschau — bewusst gestaffelt von „diese Woche"
// bis „dieses Quartal". Der Nutzer kann das Fenster im Dashboard umschalten (Setting
// liquiditaetHorizontTage); die reine Logik rechnet mit jedem Wert, normalizeHorizont hält
// das Setting aber auf einen dieser kuratierten Werte.
export const LIQUIDITAET_HORIZONT_OPTIONEN = [7, 14, 30, 90];

/**
 * Normalisiert einen (z.B. persistierten) Horizont-Wert auf eine der angebotenen Optionen.
 * Unbekanntes/ungültiges → Default (7 Tage). Rein.
 * @param {*} value
 * @returns {number} einer aus LIQUIDITAET_HORIZONT_OPTIONEN
 */
export function normalizeHorizont(value) {
  const n = Math.floor(Number(value));
  return LIQUIDITAET_HORIZONT_OPTIONEN.includes(n) ? n : LIQUIDITAET_HORIZONT_DEFAULT;
}

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
 * Liquiditäts-VERLAUF über das Fenster: der projizierte Geldsaldo NACH jedem Tag mit
 * Zahlungsbewegung — und daraus der TIEFPUNKT (tiefster Stand + Datum) innerhalb des Fensters.
 *
 * Warum: liquiditaetsVorschau projiziert nur den Saldo am FENSTER-ENDE. Der kann positiv sein,
 * obwohl der laufende Saldo zwischendurch ins Minus rutscht (z. B. große Verbindlichkeit am
 * Tag 3, große Forderung erst am Tag 25). Der Tiefpunkt beantwortet das ehrlicher: „wird es
 * zwischendurch eng — und wann?".
 *
 * Bewegungen werden je Fälligkeits-Tag gebündelt und chronologisch aufaddiert (Eingänge +,
 * Ausgänge −), beginnend beim aktuellen Geldbestand. Ohne `geldbestandCent` bleiben die
 * Saldo-Felder `null` (nur die Bewegungs-Punkte werden geliefert) — abwärtskompatibel.
 * @param {{forderungen?:Array, verbindlichkeiten?:Array, heute?:string, horizontTage?:number,
 *   geldbestandCent?:number}} [opts]
 * @returns {{horizontTage:number, startCent:?number, endeCent:?number, tiefpunktCent:?number,
 *   tiefpunktDatum:?string, punkte:Array<{datum:string, eingehendCent:number,
 *   ausgehendCent:number, saldoCent:?number}>}}
 */
export function liquiditaetsVerlauf(opts = {}) {
  const heute = opts.heute || new Date().toISOString().slice(0, 10);
  const horizont = opts.horizontTage != null
    ? Math.max(0, Math.floor(Number(opts.horizontTage) || 0))
    : LIQUIDITAET_HORIZONT_DEFAULT;
  const hatBestand = opts.geldbestandCent != null;
  const startCent = hatBestand ? Math.round(Number(opts.geldbestandCent) || 0) : null;

  // Bewegungen je Fälligkeits-Tag innerhalb des Fensters bündeln (nur bald fällig, nicht überfällig).
  const perTag = {}; // 'JJJJ-MM-TT' -> {eingehendCent, ausgehendCent}
  const erfasse = (posten, feld) => {
    for (const p of posten || []) {
      if (!p || !p.faelligAm) continue;
      const tage = tageDiff(heute, p.faelligAm);
      if (tage == null || tage < 0 || tage > horizont) continue;
      const d = String(p.faelligAm).slice(0, 10);
      const t = perTag[d] || (perTag[d] = { eingehendCent: 0, ausgehendCent: 0 });
      t[feld] += offenerBetrag(p);
    }
  };
  erfasse(opts.forderungen, 'eingehendCent');
  erfasse(opts.verbindlichkeiten, 'ausgehendCent');

  let lauf = startCent;
  // Tiefpunkt startet beim aktuellen Bestand (Tag heute) — auch ein heute schon knapper
  // Bestand soll als Tiefpunkt erkennbar sein.
  let tiefpunktCent = startCent;
  let tiefpunktDatum = hatBestand ? heute : null;
  const punkte = [];
  for (const d of Object.keys(perTag).sort()) {
    const t = perTag[d];
    if (hatBestand) {
      lauf += t.eingehendCent - t.ausgehendCent;
      if (lauf < tiefpunktCent) { tiefpunktCent = lauf; tiefpunktDatum = d; }
    }
    punkte.push({ datum: d, eingehendCent: t.eingehendCent, ausgehendCent: t.ausgehendCent, saldoCent: hatBestand ? lauf : null });
  }
  return {
    horizontTage: horizont,
    startCent,
    endeCent: hatBestand ? lauf : null,
    tiefpunktCent,
    tiefpunktDatum,
    punkte,
  };
}

/**
 * Normalisiert einen (z.B. persistierten) Mindestreserve-Betrag (Cent) auf eine ganze,
 * nicht-negative Zahl. Ungültiges/Negatives → 0 (keine Reserve). Rein.
 * @param {*} value
 * @returns {number} Cent ≥ 0
 */
export function normalizeReserveCent(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Deckungslücke (Unterdeckung) im Fenster: Wenn der laufende Saldo am TIEFPUNKT unter die
 * Schwelle fällt, ist das der Betrag, der bis dahin zusätzlich gebraucht wird, damit der Saldo
 * die Schwelle hält — plus das Datum, bis zu dem er bereitstehen muss.
 *
 * Schwelle ist standardmäßig null (echte Unterdeckung: Saldo < 0). Wird eine MINDESTRESERVE
 * (`opts.reserveCent`, ein gewünschter Sicherheitspuffer) übergeben, greift die Lücke schon,
 * wenn der laufende Saldo zwar positiv bleibt, aber unter diesen Puffer rutscht — viele Betriebe
 * wollen das Geld eben NICHT bis auf null herunterfahren. `negativ` zeigt an, ob der Tiefpunkt
 * tatsächlich unter null liegt (echte Illiquidität) oder „nur" die Reserve unterschreitet.
 *
 * Warum eigenständig zum Tiefpunkt-Hinweis: der Tiefpunkt zeigt den tiefsten Stand auch dann,
 * wenn er die Schwelle hält (reine Info „wird es eng"). Die Deckungslücke greift nur, wenn der
 * Saldo ZWISCHENDURCH tatsächlich unter die Schwelle rutscht — auch, wenn er sich bis zum
 * Fenster-Ende wieder erholt (große Verbindlichkeit früh, ausgleichende Forderung spät). Genau
 * dieser Intra-Fenster-Engpass bleibt von der End-Saldo-Ampel (liquiditaetsAmpel, projiziert<0)
 * unentdeckt. Rein, cent-genau.
 * @param {{tiefpunktCent:?number, tiefpunktDatum:?string}} verlauf - aus liquiditaetsVerlauf
 * @param {{reserveCent?:number}} [opts] - gewünschte Mindestreserve (Cent, Default 0)
 * @returns {{unterdeckung:boolean, lueckeCent:number, datum:?string, reserveCent:number,
 *   negativ:boolean}}
 */
export function deckungsluecke(verlauf = {}, opts = {}) {
  const schwelle = normalizeReserveCent(opts.reserveCent);
  const tp = verlauf.tiefpunktCent;
  if (tp == null || tp >= schwelle) {
    return { unterdeckung: false, lueckeCent: 0, datum: null, reserveCent: schwelle, negativ: false };
  }
  return {
    unterdeckung: true,
    lueckeCent: schwelle - tp,
    datum: verlauf.tiefpunktDatum || null,
    reserveCent: schwelle,
    negativ: tp < 0,
  };
}

/**
 * Liquiditäts-REICHWEITE („Runway"): bis zu welchem Datum hält der laufende Geldsaldo die
 * Schwelle? Das ist der ERSTE Tag im Fenster, an dem der projizierte Saldo unter die Schwelle
 * fällt — die intuitivste Antwort auf „wie lange bin ich sicher?".
 *
 * Abgrenzung zu den bestehenden Hinweisen: der Tiefpunkt (liquiditaetsVerlauf) zeigt den
 * TIEFSTEN Stand, die Deckungslücke den am Tiefpunkt FEHLENDEN Betrag. Die Reichweite zeigt den
 * FRÜHESTEN Engpass — und der kann VOR dem Tiefpunkt liegen: rutscht der Saldo früh unter die
 * Schwelle, erholt sich kurz und fällt später noch tiefer, ist die Reichweite trotzdem schon am
 * ersten Tag erschöpft. Genau dann ist „reicht bis {datum}" eine andere (frühere) Aussage als
 * „tiefster Stand am {tiefpunktDatum}".
 *
 * Schwelle = gewünschte Mindestreserve (`opts.reserveCent`, Default 0 → echtes Minus, konsistent
 * mit deckungsluecke/normalizeReserveCent). Ohne bekannten Geldbestand (`verlauf.startCent == null`)
 * keine Aussage (`bekannt:false`). Liegt der Saldo schon HEUTE unter der Schwelle, ist die
 * Reichweite sofort erschöpft (`sofort:true`, `datum:null`). Hält er die Schwelle über das ganze
 * Fenster, `reicht:true`. `negativ` zeigt an, ob der erste Engpass echtes Minus ist (Saldo < 0)
 * statt „nur" Reserve-Unterschreitung. Rein, cent-genau.
 * @param {{startCent:?number, punkte:Array<{datum:string, saldoCent:?number}>}} verlauf - aus liquiditaetsVerlauf
 * @param {{reserveCent?:number, heute?:string}} [opts] - heute nur für tageBis (Tage bis Engpass)
 * @returns {{bekannt:boolean, reicht:boolean, sofort:boolean, datum:?string, tageBis:?number,
 *   reserveCent:number, negativ:boolean}}
 */
export function liquiditaetsReichweite(verlauf = {}, opts = {}) {
  const schwelle = normalizeReserveCent(opts.reserveCent);
  const start = verlauf.startCent;
  if (start == null) {
    return { bekannt: false, reicht: true, sofort: false, datum: null, tageBis: null, reserveCent: schwelle, negativ: false };
  }
  // Schon heute unter der Schwelle? Dann ist die Reichweite sofort erschöpft.
  if (start < schwelle) {
    return { bekannt: true, reicht: false, sofort: true, datum: null, tageBis: 0, reserveCent: schwelle, negativ: start < 0 };
  }
  // Erster Tag im Fenster, an dem der laufende Saldo die Schwelle reißt.
  for (const p of verlauf.punkte || []) {
    if (p.saldoCent != null && p.saldoCent < schwelle) {
      const tageBis = opts.heute ? tageDiff(opts.heute, p.datum) : null;
      return { bekannt: true, reicht: false, sofort: false, datum: p.datum, tageBis, reserveCent: schwelle, negativ: p.saldoCent < 0 };
    }
  }
  // Hält die Schwelle über das ganze Fenster.
  return { bekannt: true, reicht: true, sofort: false, datum: null, tageBis: null, reserveCent: schwelle, negativ: false };
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
