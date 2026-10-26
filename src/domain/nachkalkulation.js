// src/domain/nachkalkulation.js
// BAUPLAN Block 2 / Schritt 9 — Auftrags-Kostenträger + Nachkalkulation (REIN, node-getestet).
// Grundlage: docs/KALKULATION_KATALOG.md §5.1 (USP „selbstlernende Kalkulation": Vor- gegen
// Nachkalkulation je fertigem Auftrag) + §6 (Auftrags-Kostenträger: Material/Belege/Zeit je
// Auftrag über die vorhandenen BLP-Bausteine).
//
// WAS DIESER SCHRITT TUT
//   Ein KOSTENTRÄGER ist ein Auftrag/Projekt, identifiziert über seine `kostenstelle`. Diese
//   Schicht sammelt die IST-Kosten je Kostenträger aus den BEREITS VORHANDENEN Bausteinen und
//   stellt sie der Vorkalkulation (SOLL) gegenüber:
//     - BUCHUNGEN/BELEGE (domain/store.js, costcenters.js, payables.js): die Aufwands-Zeilen
//       FESTGESCHRIEBENER Buchungen, die dem Kostenträger zugeordnet sind (`kostenstelle`) →
//       Material/Fremdleistung. `belegRef` (Beleg↔Buchung) wird je beteiligter Buchung
//       mitgeführt. Aggregationsweg wie domain/costcenters.js (Soll mehrt Aufwand).
//     - ZEIT (domain/employees.js, Zeiteinträge `{dauerMin}`): je Kostenträger × interner
//       Stundenkostensatz → Arbeits-/Maschinenkosten (das Pendant zu den Zeitkosten der
//       Vorkalkulation, domain/kalkulation.js).
//   und vergleicht beides mit den SOLL-Kosten aus der Vorkalkulation (die interne `kalkulation`
//   je Position des angenommenen Angebots, domain/angebote.js) → Soll/Ist-Abweichung je
//   Kostenart + Deckungsbeitrag SOLL (kalkuliert) gegen IST (Erlös − tatsächliche Kosten).
//
// PRIME DIRECTIVE (Katalog §0): die Nachkalkulation ist — wie die Vorkalkulation — REIN
//   INTERN. Sie erzeugt KEIN Außendokument; Soll/Ist/Marge/Belegkosten verlassen das Haus nie.
//
// CENT-GENAU: Geld als ganzzahlige Cent (wie domain/money.js / kalkulation.js). EHRLICHE
//   GRENZE: reine Logik, KEIN UI/Store in diesem Schritt (eigener Folgeschritt). Buchungen,
//   Konten-Index und Zeiteinträge werden hereingereicht; die Persistenz (crm-store, ver-
//   schlüsselt) ist die I/O-Schicht darüber.

import { KOSTENART, KOSTENART_LISTE } from './kalkulation.js';
import { KONTOART } from './accounts.js';

/** Endliche Zahl oder 0 (schützt vor NaN/undefined/null). */
function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

const inPeriode = (datum, p) => !p || ((!p.von || datum >= p.von) && (!p.bis || datum <= p.bis));

/** Frisches perBlock-Objekt mit stabilen Schlüsseln (alle Kostenarten auf 0). */
function leerePerBlock() {
  const o = {};
  for (const k of KOSTENART_LISTE) o[k] = 0;
  return o;
}

/** Abweichung IST − SOLL + relativer Prozentwert (auf |SOLL|; bei SOLL=0 → null). */
function abweichung(sollCent, istCent) {
  const abweichungCent = istCent - sollCent;
  const abweichungProzent = sollCent !== 0
    ? Math.round((abweichungCent / Math.abs(sollCent)) * 1000) / 10
    : null;
  return { abweichungCent, abweichungProzent };
}

// ── konto → Kostenart: Standard-Zuordnung (SKR03-Kontenklassen) ──────────────

/**
 * Standard-Kostenart einer Aufwands-Kontonummer anhand der SKR03-Kontenklasse — damit die
 * IST-Buchungen je Kostenträger nicht mehr pauschal als MATERIAL zählen (frühere Grenze), wo
 * die Kontonummer eine eindeutige Zuordnung erlaubt:
 *   - **3100–3199** Fremdleistungen → ZUKAUF (extern zugekaufte Leistung/Druck-Zukauf).
 *   - **3000–3999** (sonst) Wareneingang / Roh-, Hilfs- und Betriebsstoffe → MATERIAL.
 *   - **4100–4199** Personalaufwand (Löhne/Gehälter/soziale Aufwendungen) → ARBEIT.
 * Alle übrigen Konten → null (die aufrufende `istkostenAusBuchungen` fällt dann auf ihren
 * konservativen Default MATERIAL zurück — Verhalten wie bisher).
 *
 * EHRLICHE GRENZE: Eine Heuristik nach Kontenklasse, KEINE betriebswirtschaftlich exakte
 * Einzelkosten-Zuordnung. Class-4-Gemeinkosten (Miete/Versicherung/Telefon …) bleiben
 * absichtlich unklassifiziert (→ Default MATERIAL, falls überhaupt einem Kostenträger
 * zugeordnet); MASCHINE wird hier NICHT aus Konten abgeleitet (Maschinenzeit kommt über die
 * Zeiteinträge, `istZeitkosten`). Eine feinere Zuordnung kann jederzeit per `opts.kontoBlock`
 * überschrieben werden (gewinnt vor dieser Standard-Zuordnung).
 *
 * @param {string|number} nummer  Kontonummer
 * @returns {?string} KOSTENART oder null
 */
export function kostenartFuerKonto(nummer) {
  const n = parseInt(String(nummer == null ? '' : nummer).trim(), 10);
  if (!Number.isFinite(n)) return null;
  if (n >= 3100 && n <= 3199) return KOSTENART.ZUKAUF;    // Fremdleistungen
  if (n >= 3000 && n <= 3999) return KOSTENART.MATERIAL;  // Wareneingang / RHB-Stoffe
  if (n >= 4100 && n <= 4199) return KOSTENART.ARBEIT;    // Personalaufwand (Löhne/Gehälter)
  return null;
}

/**
 * Baut die `kontoBlock`-Map (konto-Nr → KOSTENART) für `istkostenAusBuchungen` aus dem
 * Kontenplan — nur für AUFWAND-Konten mit eindeutiger Klassen-Zuordnung (siehe
 * `kostenartFuerKonto`). Konten ohne sichere Zuordnung tauchen NICHT in der Map auf und
 * bleiben damit auf dem Default MATERIAL.
 * @param {Array<{nummer:string, art?:string}>} konten
 * @returns {Object} konto-Nr → KOSTENART
 */
export function standardKontoBlock(konten = []) {
  const map = {};
  for (const k of konten || []) {
    if (!k || k.art !== KONTOART.AUFWAND) continue;
    const block = kostenartFuerKonto(k.nummer);
    if (block) map[k.nummer] = block;
  }
  return map;
}

// ── IST: Material/Fremdleistung aus Buchungen/Belegen ────────────────────────

/**
 * Sammelt die IST-Material-/Fremdkosten eines Kostenträgers aus den Buchungen: alle
 * Aufwands-Zeilen FESTGESCHRIEBENER Buchungen (`b.seq != null`), deren `kostenstelle` dem
 * Kostenträger entspricht (Soll mehrt Aufwand, Haben mindert → Storni heben sich auf, wie in
 * domain/costcenters.js). Pro Konto und pro Kostenart-Block (über `opts.kontoBlock`
 * konto→KOSTENART, Default MATERIAL) summiert; je beteiligte Buchung wird ein Beleg-Eintrag
 * mitgeführt (belegRef/buchungId — der Beleg↔Buchung-Bezug aus domain/store.js).
 *
 * @param {Array} buchungen
 * @param {Object} kontoIndex  konto-Nr → Konto (mit `.art`)
 * @param {string} kostenstelle  Kostenträger-Schlüssel (muss `b.kostenstelle` exakt entsprechen)
 * @param {{kontoBlock?:Object, periode?:{von?:string,bis?:string}}} [opts]
 * @returns {{summeCent:number, perKonto:Object, perBlock:Object,
 *   belege:Array<{belegRef:?string, buchungId:?string, datum:string, betragCent:number,
 *   beschreibung:string}>}}
 */
export function istkostenAusBuchungen(buchungen, kontoIndex, kostenstelle, opts = {}) {
  const kontoBlock = opts.kontoBlock || {};
  const perKonto = {};
  const perBlock = leerePerBlock();
  const belege = [];
  let summeCent = 0;
  for (const b of buchungen || []) {
    if (b.seq == null) continue;                          // nur festgeschriebene
    if ((b.kostenstelle || null) !== kostenstelle) continue;
    if (!inPeriode(b.datum, opts.periode)) continue;
    let buchungAufwand = 0;
    for (const z of b.zeilen || []) {
      const konto = kontoIndex && kontoIndex[z.konto];
      if (!konto || konto.art !== KONTOART.AUFWAND) continue;  // nur Aufwand zählt als Kosten
      const betrag = (z.seite === 'S' ? 1 : -1) * num(z.betrag);
      perKonto[z.konto] = (perKonto[z.konto] || 0) + betrag;
      const block = KOSTENART_LISTE.includes(kontoBlock[z.konto]) ? kontoBlock[z.konto] : KOSTENART.MATERIAL;
      perBlock[block] += betrag;
      buchungAufwand += betrag;
      summeCent += betrag;
    }
    if (buchungAufwand !== 0) {
      belege.push({
        belegRef: b.belegRef || null,
        buchungId: b.id || null,
        datum: b.datum || '',
        betragCent: buchungAufwand,
        beschreibung: b.beschreibung || '',
      });
    }
  }
  return { summeCent, perKonto, perBlock, belege };
}

// ── IST: Zeit aus Zeiteinträgen ──────────────────────────────────────────────

/** Zeit-Kostenart eines Eintrags (Maschine vs. Arbeit). Default ARBEIT. */
function zeitBlock(art) {
  return art === KOSTENART.MASCHINE ? KOSTENART.MASCHINE : KOSTENART.ARBEIT;
}

/**
 * IST-Zeitkosten eines Kostenträgers aus Zeiteinträgen (domain/employees.js-Datenmodell,
 * `{dauerMin}`). Jeder Eintrag wird mit seinem `kostensatzCentProStd` (interner Stunden-
 * kostensatz; sonst `opts.kostensatzCentProStd`) bewertet — apples-to-apples zu den Zeitkosten
 * der Vorkalkulation (kalkulation.zeitkosten) — und nach Kostenart (`art`: arbeit/maschine)
 * gruppiert. Optional auf eine `kostenstelle` und eine `periode` gefiltert.
 *
 * @param {Array<{dauerMin:number, art?:string, kostensatzCentProStd?:number, datum?:string,
 *   kostenstelle?:string}>} zeiteintraege
 * @param {{kostensatzCentProStd?:number, kostenstelle?:string, periode?:object}} [opts]
 * @returns {{summeCent:number, minuten:number, stunden:number, perBlock:Object}}
 */
export function istZeitkosten(zeiteintraege, opts = {}) {
  const defaultSatz = num(opts.kostensatzCentProStd);
  const ks = opts.kostenstelle;
  const perBlock = leerePerBlock();
  let minuten = 0, summeCent = 0;
  for (const e of zeiteintraege || []) {
    if (ks != null && (e.kostenstelle || null) !== ks) continue;
    if (!inPeriode(e.datum, opts.periode)) continue;
    const min = num(e.dauerMin);
    const satz = e.kostensatzCentProStd != null ? num(e.kostensatzCentProStd) : defaultSatz;
    const kostenCent = Math.round((min / 60) * satz);
    perBlock[zeitBlock(e.art)] += kostenCent;
    minuten += min;
    summeCent += kostenCent;
  }
  return { summeCent, minuten, stunden: minuten / 60, perBlock };
}

// ── IST: alles zusammen (Belege + Zeit) ──────────────────────────────────────

/**
 * Vollständige IST-Kosten eines Kostenträgers = Belege/Buchungen (Material/Fremdleistung) +
 * Zeit (Arbeit/Maschine), über alle Kostenarten zusammengeführt.
 * @param {{buchungen?:Array, kontoIndex?:Object, kostenstelle:string, zeiteintraege?:Array,
 *   kontoBlock?:Object, kostensatzCentProStd?:number, periode?:object}} p
 * @returns {{summeCent:number, perBlock:Object, perKonto:Object, belege:Array,
 *   minuten:number, stunden:number}}
 */
export function istkosten({
  buchungen, kontoIndex, kostenstelle, zeiteintraege,
  kontoBlock, kostensatzCentProStd, periode,
} = {}) {
  const ausBuchungen = istkostenAusBuchungen(buchungen, kontoIndex, kostenstelle, { kontoBlock, periode });
  const ausZeit = istZeitkosten(zeiteintraege, { kostenstelle, kostensatzCentProStd, periode });
  const perBlock = leerePerBlock();
  for (const k of KOSTENART_LISTE) perBlock[k] = ausBuchungen.perBlock[k] + ausZeit.perBlock[k];
  return {
    summeCent: ausBuchungen.summeCent + ausZeit.summeCent,
    perBlock,
    perKonto: ausBuchungen.perKonto,
    belege: ausBuchungen.belege,
    minuten: ausZeit.minuten,
    stunden: ausZeit.stunden,
  };
}

// ── IST: Zeiteinträge in die istZeitkosten-Form bringen ──────────────────────

/**
 * Löst den KOSTENTRÄGER (`kostenstelle`) eines gespeicherten Zeiteintrags auf — die EINE
 * Wahrheit, die sowohl `zeiteintraegeAusZeiten` (für die IST-Zeitkosten) als auch die
 * Zuordnungs-UI nutzen:
 *   1. EXPLIZITE Zuordnung gewinnt: ist `zeit.kostenstelle` gesetzt (über die Zeit-Zuordnungs-
 *      UI direkt einem Kostenträger zugewiesen), zählt genau diese.
 *   2. SONST Ableitung über den Auftrag: zeit.auftragId → auftragIndex[..].kostenstelle
 *      (Alt-Verhalten, rückwärtskompatibel — Zeiten ohne explizite Zuordnung bleiben so
 *      ihrem Auftrag zugeordnet).
 *   3. sonst null (zählt keinem Kostenträger zu).
 * Eine explizite Zuordnung auf den Leer-String '' bedeutet bewusst „keinem Kostenträger"
 * (überschreibt die Auftrags-Ableitung) → wird zu null normalisiert.
 *
 * @param {{kostenstelle?:?string, auftragId?:?string}} zeit
 * @param {Object} auftragIndex  auftragId → Auftrag (mit `.kostenstelle`)
 * @returns {?string} Kostenträger-Schlüssel oder null
 */
export function aufgeloesteKostenstelle(zeit = {}, auftragIndex = {}) {
  if (zeit.kostenstelle != null) return zeit.kostenstelle || null;   // '' → null (bewusst keiner)
  const auftrag = zeit.auftragId != null ? auftragIndex[zeit.auftragId] : null;
  return (auftrag && auftrag.kostenstelle) || null;
}

/**
 * I/O-naher reiner Helfer (für die Store-Glue, BAUPLAN Block 2 / Schritt „Nachkalkulation-
 * UI"): macht aus den gespeicherten Zeiteinträgen (crm-store: `{dauerMin, auftragId,
 * mitarbeiterId, datum, kostenstelle?}`) die von `istZeitkosten` erwartete Form
 * `{dauerMin, kostenstelle, kostensatzCentProStd, datum, art}`.
 *   - Der Kostenträger (`kostenstelle`) wird über `aufgeloesteKostenstelle` ermittelt:
 *     EXPLIZITE Zuordnung (`zeit.kostenstelle`, über die Zeit-Zuordnungs-UI) vor der
 *     Ableitung aus dem Auftrag (zeit.auftragId → auftragIndex[..].kostenstelle); ohne
 *     beides → null (zählt dann keinem Kostenträger zu).
 *   - Der interne Stundenkostensatz wird aus dem Mitarbeiter (`stundenlohnCent`) genommen;
 *     ohne Mitarbeiter/Satz → 0 (der Eintrag bringt dann keine Zeitkosten ein).
 *
 * EHRLICHE GRENZE: `stundenlohnCent` ist der Stundenlohn — er wird hier als interner
 * Stundenkostensatz verwendet (KEIN Arbeitgeber-Gemeinkostenaufschlag modelliert). Alle
 * Zeiteinträge zählen als ARBEIT (das Datenmodell trennt Arbeit/Maschine nicht je Eintrag).
 *
 * @param {Array<{dauerMin?:number, auftragId?:?string, mitarbeiterId?:?string, datum?:string,
 *   kostenstelle?:?string}>} zeiten
 * @param {Object} auftragIndex  auftragId → Auftrag (mit `.kostenstelle`)
 * @param {Object} mitarbeiterIndex  mitarbeiterId → Mitarbeiter (mit `.stundenlohnCent`)
 * @returns {Array<{dauerMin:number, datum:string, kostenstelle:?string,
 *   kostensatzCentProStd:number, art:string}>}
 */
export function zeiteintraegeAusZeiten(zeiten = [], auftragIndex = {}, mitarbeiterIndex = {}) {
  return (zeiten || []).map((z) => {
    const ma = z.mitarbeiterId != null ? mitarbeiterIndex[z.mitarbeiterId] : null;
    return {
      dauerMin: num(z.dauerMin),
      datum: z.datum || '',
      kostenstelle: aufgeloesteKostenstelle(z, auftragIndex),
      kostensatzCentProStd: ma && ma.stundenlohnCent != null ? num(ma.stundenlohnCent) : 0,
      art: KOSTENART.ARBEIT,
    };
  });
}

// ── SOLL: Vorkalkulation aus dem Angebot ─────────────────────────────────────

/**
 * SOLL-Kosten aus der Vorkalkulation: aggregiert die interne `kalkulation` je Position des
 * (angenommenen) Angebots über alle Kostenarten — pro Position das Kern-Ergebnis × Menge
 * (gleiche Logik wie angebote.interneAuswertung, hier zusätzlich nach Kostenart aufgeschlüsselt).
 * Positionen ohne interne Kalkulation zählen mit 0. Die Selbstkosten ergeben sich als Summe der
 * (gerundeten) Kostenart-Blöcke → intern konsistent (Σ Blöcke = selbstkostenCent).
 * @param {object} angebot
 * @returns {{selbstkostenCent:number, perBlock:Object, nettoCent:number, deckungsbeitragCent:number}}
 */
export function sollkostenAusAngebot(angebot = {}) {
  const roh = leerePerBlock();
  let nettoRoh = 0;
  for (const p of (angebot && angebot.positionen) || []) {
    const e = p && p.kalkulation && p.kalkulation.ergebnis;
    if (!e) continue;
    const menge = num(p.menge);
    for (const k of KOSTENART_LISTE) roh[k] += num(e[k]) * menge;
    nettoRoh += num(e.netto) * menge;
  }
  const perBlock = leerePerBlock();
  let selbstkostenCent = 0;
  for (const k of KOSTENART_LISTE) {
    perBlock[k] = Math.round(roh[k]);
    selbstkostenCent += perBlock[k];
  }
  const nettoCent = Math.round(nettoRoh);
  return { selbstkostenCent, perBlock, nettoCent, deckungsbeitragCent: nettoCent - selbstkostenCent };
}

// ── Soll/Ist-Vergleich (Vor- gegen Nachkalkulation) ──────────────────────────

/**
 * Soll/Ist-Vergleich. Je Kostenart und gesamt: Abweichung = IST − SOLL (positiv = teurer als
 * kalkuliert → Kostenüberschreitung). Zusätzlich der Deckungsbeitrag SOLL (kalkuliert) gegen
 * IST (Erlös − tatsächliche Selbstkosten). Der Erlös (`nettoCent`) ist standardmäßig der
 * Soll-Netto (Angebotspreis); ein abweichender tatsächlicher Rechnungs-Netto kann über
 * `opts.nettoCent` übergeben werden.
 * @param {object} soll  Ergebnis von sollkostenAusAngebot()
 * @param {object} ist   Ergebnis von istkosten()
 * @param {{nettoCent?:number}} [opts]
 * @returns {{perBlock:Array<{block:string, sollCent:number, istCent:number,
 *   abweichungCent:number, abweichungProzent:?number}>, sollSummeCent:number,
 *   istSummeCent:number, abweichungCent:number, abweichungProzent:?number, nettoCent:number,
 *   deckungsbeitragSollCent:number, deckungsbeitragIstCent:number,
 *   deckungsbeitragAbweichungCent:number}}
 */
export function nachkalkulation(soll = {}, ist = {}, opts = {}) {
  const sollBlock = soll.perBlock || leerePerBlock();
  const istBlock = ist.perBlock || leerePerBlock();
  const perBlock = KOSTENART_LISTE.map((block) => {
    const sollCent = Math.round(num(sollBlock[block]));
    const istCent = Math.round(num(istBlock[block]));
    return { block, sollCent, istCent, ...abweichung(sollCent, istCent) };
  });
  const sollSummeCent = perBlock.reduce((s, b) => s + b.sollCent, 0);
  const istSummeCent = perBlock.reduce((s, b) => s + b.istCent, 0);
  const nettoCent = opts.nettoCent != null ? Math.round(num(opts.nettoCent)) : Math.round(num(soll.nettoCent));
  const deckungsbeitragSollCent = nettoCent - sollSummeCent;
  const deckungsbeitragIstCent = nettoCent - istSummeCent;
  return {
    perBlock,
    sollSummeCent,
    istSummeCent,
    ...abweichung(sollSummeCent, istSummeCent),
    nettoCent,
    deckungsbeitragSollCent,
    deckungsbeitragIstCent,
    deckungsbeitragAbweichungCent: deckungsbeitragIstCent - deckungsbeitragSollCent,
  };
}

// ── Komfort-Einstieg ─────────────────────────────────────────────────────────

/**
 * Komfort-Einstieg für UI/Store (Folgeschritt): führt SOLL (Vorkalkulation aus dem Angebot)
 * und IST (Belege/Buchungen + Zeit je Kostenträger) zusammen und liefert direkt den Soll/Ist-
 * Vergleich. Der Kostenträger ergibt sich aus `quelle.kostenstelle` (Default: `angebot.kostenstelle`).
 * @param {object} angebot  angenommenes Angebot (Vorkalkulation)
 * @param {{kostenstelle?:string, buchungen?:Array, kontoIndex?:Object, zeiteintraege?:Array,
 *   kontoBlock?:Object, kostensatzCentProStd?:number, periode?:object, nettoCent?:number}} [quelle]
 * @returns {{kostenstelle:?string, soll:object, ist:object, vergleich:object}}
 */
export function kostentraegerAnalyse(angebot, quelle = {}) {
  const kostenstelle = quelle.kostenstelle != null
    ? quelle.kostenstelle
    : ((angebot && angebot.kostenstelle) || null);
  const soll = sollkostenAusAngebot(angebot);
  const ist = istkosten({
    buchungen: quelle.buchungen,
    kontoIndex: quelle.kontoIndex,
    kostenstelle,
    zeiteintraege: quelle.zeiteintraege,
    kontoBlock: quelle.kontoBlock,
    kostensatzCentProStd: quelle.kostensatzCentProStd,
    periode: quelle.periode,
  });
  const vergleich = nachkalkulation(soll, ist, { nettoCent: quelle.nettoCent });
  return { kostenstelle, soll, ist, vergleich };
}
