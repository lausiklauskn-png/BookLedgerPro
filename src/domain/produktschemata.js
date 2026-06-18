// src/domain/produktschemata.js
// BAUPLAN Block 2 / Schritt 6 — Produkt-Schemata (REIN, node-getestet).
// Grundlage: docs/KALKULATION_KATALOG.md §1 (Kostentreiber-Matrix) + §2 (Rechenformel).
//
// WAS DAS IST: kalibrierbare VORLAGEN je Leistungsart (Folierung/Schild/Gravur/
// Leuchtreklame/Druck-Zukauf/Montage …). Jedes Schema beschreibt nur, WELCHE Felder
// der Nutzer füllt und WIE diese Felder auf die Kostenarten des vorhandenen
// Kalkulations-Kerns (domain/kalkulation.js) abgebildet werden. Die eigentliche
// Rechnung macht weiterhin der Kern (`kalkuliereVorwaerts`) — diese Schicht erfindet
// keine neue Formel, sie FÜTTERT nur den Kern.
//
// PRIME DIRECTIVE (Katalog §0): rein intern. Diese Schicht erzeugt KEIN Außendokument.
// Verschnitt, Maschinen-/Stundensätze, Marge usw. verlassen das Haus nie — Schritt 7/8
// bauen daraus erst das neutrale Angebot/die Rechnung.
//
// KALIBRIERBAR: Felder mit `kalibrierbar: true` sind die „Hotspots" aus Katalog §1
// (Verschnitt, Verklebezeit, Entgitterzeit, Fräszeit, Elektrik, Montage …) — also die
// Sätze/Zeiten, die der Betrieb aus eigener Erfahrung nachjustiert. Ihre `default`-Werte
// sind STARTWERTE; `kalibrierteDefaults(schema, kalibrierung)` überschreibt sie aus den
// gepflegten Werten des Betriebs. Die selbstlernende Korrektur aus der Historie
// (Vor→Nachkalkulation) ist Schritt 9/10 — diese Schicht liefert nur den Andockpunkt.
//
// CENT-GENAU: Geld als ganzzahlige Cent, Zeiten als Dezimal-Stunden, Flächen als
// Dezimal-m² — exakt wie der Kern. Gerundet wird ausschließlich im Kern.

import {
  KOSTENART_LISTE, kalkuliereVorwaerts, kalibriereEingabe,
} from './kalkulation.js';

/** Endliche Zahl oder 0 (schützt vor NaN/undefined/null). Wie im Kern. */
function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

// ── Klassifikation (Katalog §1) ─────────────────────────────────────────────

/** Art der Leistung (Katalog §1, Spalte „Art"). Eigen-/Misch-/reine Handelsleistung. */
export const PRODUKT_ART = Object.freeze({
  EIGEN: 'eigen',     // eigene Wertschöpfung (Material/Maschine/Arbeit)
  MISCH: 'misch',     // Eigenleistung + nennenswerter Zukauf (Hardware/Komponenten)
  HANDEL: 'handel',   // eingekauft & weiterverkauft (Ware + Handelsspanne)
});

/** Mengenbasis (Katalog §1, Spalte „Basis") — informativ für die spätere UI. */
export const BASIS = Object.freeze({
  M2: 'm2',           // Fläche in Quadratmetern
  STK: 'stk',         // Stück
  LFM: 'lfm',         // laufender Meter
  STD: 'std',         // Arbeits-/Servicestunden
  MIN: 'min',         // Minuten (z. B. Gravur-Maschinenzeit)
  AUFL: 'aufl',       // Auflage (Druck)
  PAUSCH: 'pausch',   // Pauschale
});

/** Feldtyp — steuert später Eingabe/Anzeige (Geld als Cent, Zeit als Std usw.). */
export const FELD_TYP = Object.freeze({
  GELD: 'geld',         // Betrag in ganzen Cent
  PROZENT: 'prozent',   // Prozentwert (z. B. Verschnitt)
  FLAECHE: 'flaeche',   // m²
  ZEIT: 'zeit',         // Stunden (Dezimal)
  MINUTEN: 'minuten',   // Minuten (Dezimal)
  MENGE: 'menge',       // Stückzahl/Auflage
});

// ── Standard-Startsätze (kalibrierbar, Katalog §2 „eigene Sätze") ────────────
// Bewusst neutrale Startwerte. Sie sind ZUM Kalibrieren da — kein Versprechen,
// dass sie für einen konkreten Betrieb stimmen (siehe Katalog §5 „ehrlich").
const SATZ = Object.freeze({
  ARBEIT_CENT_PRO_STD: 4500,    // 45,00 €/Std interner Stundenkostensatz
  MASCHINE_CENT_PRO_STD: 6000,  // 60,00 €/Std Maschinenstundensatz
  FOLIE_CENT_PRO_M2: 4000,      // 40,00 €/m² Folie (Werkstoff)
  VERSCHNITT_PROZENT: 15,       // 15 % Verschnitt (Hotspot Folie)
  HANDELSAUFSCHLAG_PROZENT: 30, // 30 % auf reinen Zukauf/Handel
});

// ── Felddefinition (Helfer) ──────────────────────────────────────────────────
// feld(key, label, typ, default, { kalibrierbar })
function feld(key, label, typ, def = 0, opts = {}) {
  return Object.freeze({
    key, label, typ,
    default: def,
    kalibrierbar: !!opts.kalibrierbar,
  });
}

// ── Die Schemata (Katalog §1) ────────────────────────────────────────────────
// Jedes Schema: { id, label, art, basis, hotspot, felder[], mapping(werte) }.
// `mapping` bildet die gefüllten Felder auf die Kostenarten-Eingabe des Kerns ab
// ({ material?, maschine?, arbeit?, zukauf?, montage? }). Es rechnet NICHT selbst —
// es ordnet nur zu (m²-Felder ins Material, Stunden in Maschine/Arbeit usw.).

const SCHEMATA_DEF = [
  // 1) Folierung (m²) — Fahrzeug-/Flächenfolierung. Eigenleistung, Basis m².
  {
    id: 'folierung',
    label: 'Folierung (Fahrzeug/Fläche)',
    art: PRODUKT_ART.EIGEN,
    basis: BASIS.M2,
    hotspot: 'Verschnitt + Verklebezeit',
    felder: [
      feld('flaecheM2', 'Fläche', FELD_TYP.FLAECHE, 0),
      feld('preisProM2Cent', 'Folienpreis je m²', FELD_TYP.GELD, SATZ.FOLIE_CENT_PRO_M2, { kalibrierbar: true }),
      feld('verschnittProzent', 'Verschnitt', FELD_TYP.PROZENT, SATZ.VERSCHNITT_PROZENT, { kalibrierbar: true }),
      feld('verklebeStunden', 'Verklebezeit', FELD_TYP.ZEIT, 0, { kalibrierbar: true }),
      feld('arbeitssatzCentProStd', 'Arbeitssatz je Std', FELD_TYP.GELD, SATZ.ARBEIT_CENT_PRO_STD, { kalibrierbar: true }),
      feld('montageCent', 'Montage/Anfahrt', FELD_TYP.GELD, 0),
    ],
    mapping: (w) => ({
      material: { flaecheM2: w.flaecheM2, preisProM2Cent: w.preisProM2Cent, verschnittProzent: w.verschnittProzent },
      arbeit: { stunden: w.verklebeStunden, satzCentProStd: w.arbeitssatzCentProStd },
      montage: { betragCent: w.montageCent },
    }),
  },

  // 2) Schild (Dibond/Acryl) — Mischleistung, Basis Stück. Platte + Fräs-/Druckzeit + Montage.
  {
    id: 'schild',
    label: 'Schild (Dibond/Acryl)',
    art: PRODUKT_ART.MISCH,
    basis: BASIS.STK,
    hotspot: 'Zuschnitt/Fräszeit',
    felder: [
      feld('plattenCent', 'Plattenmaterial', FELD_TYP.GELD, 0),
      feld('verschnittProzent', 'Verschnitt', FELD_TYP.PROZENT, 0, { kalibrierbar: true }),
      feld('fraesStunden', 'Fräs-/Druckzeit', FELD_TYP.ZEIT, 0, { kalibrierbar: true }),
      feld('maschinensatzCentProStd', 'Maschinensatz je Std', FELD_TYP.GELD, SATZ.MASCHINE_CENT_PRO_STD, { kalibrierbar: true }),
      feld('arbeitsStunden', 'Arbeitszeit', FELD_TYP.ZEIT, 0),
      feld('arbeitssatzCentProStd', 'Arbeitssatz je Std', FELD_TYP.GELD, SATZ.ARBEIT_CENT_PRO_STD, { kalibrierbar: true }),
      feld('montageCent', 'Montage/Anfahrt', FELD_TYP.GELD, 0),
    ],
    mapping: (w) => ({
      material: { betragCent: w.plattenCent, verschnittProzent: w.verschnittProzent },
      maschine: { stunden: w.fraesStunden, satzCentProStd: w.maschinensatzCentProStd },
      arbeit: { stunden: w.arbeitsStunden, satzCentProStd: w.arbeitssatzCentProStd },
      montage: { betragCent: w.montageCent },
    }),
  },

  // 3) Gravur (Laser/Fräse) — Eigenleistung, Basis Stück/Minute. Maschinenzeit in MINUTEN.
  {
    id: 'gravur',
    label: 'Gravur (Laser/Fräse)',
    art: PRODUKT_ART.EIGEN,
    basis: BASIS.MIN,
    hotspot: 'Vorlagen-/Rüstzeit',
    felder: [
      feld('rohlingCent', 'Rohling/Material', FELD_TYP.GELD, 0),
      feld('gravurMinuten', 'Maschinenzeit', FELD_TYP.MINUTEN, 0),
      feld('maschinensatzCentProStd', 'Maschinensatz je Std', FELD_TYP.GELD, SATZ.MASCHINE_CENT_PRO_STD, { kalibrierbar: true }),
      feld('vorlageStunden', 'Vorlagen-/Rüstzeit', FELD_TYP.ZEIT, 0, { kalibrierbar: true }),
      feld('arbeitssatzCentProStd', 'Arbeitssatz je Std', FELD_TYP.GELD, SATZ.ARBEIT_CENT_PRO_STD, { kalibrierbar: true }),
    ],
    // Maschinenzeit kommt in Minuten → in Stunden umrechnen (der Kern rechnet in Std).
    mapping: (w) => ({
      material: { betragCent: w.rohlingCent },
      maschine: { stunden: num(w.gravurMinuten) / 60, satzCentProStd: w.maschinensatzCentProStd },
      arbeit: { stunden: w.vorlageStunden, satzCentProStd: w.arbeitssatzCentProStd },
    }),
  },

  // 4) Leuchtreklame (Leuchtkasten) — Mischleistung, Basis Stück. Material + Fertigung +
  //    Elektrik (Arbeit) + Zukauf LED/Netzteil + Montage. Mehrere Hotspots (Katalog §1).
  {
    id: 'leuchtreklame',
    label: 'Leuchtreklame/Leuchtkasten',
    art: PRODUKT_ART.MISCH,
    basis: BASIS.STK,
    hotspot: 'Elektrik + Montage + Genehmigung/Statik',
    felder: [
      feld('materialCent', 'Profil/Acryl/Material', FELD_TYP.GELD, 0),
      feld('fertigungStunden', 'Fertigungszeit', FELD_TYP.ZEIT, 0),
      feld('maschinensatzCentProStd', 'Maschinensatz je Std', FELD_TYP.GELD, SATZ.MASCHINE_CENT_PRO_STD, { kalibrierbar: true }),
      feld('elektrikStunden', 'Elektrik-Arbeitszeit', FELD_TYP.ZEIT, 0, { kalibrierbar: true }),
      feld('arbeitssatzCentProStd', 'Arbeitssatz je Std', FELD_TYP.GELD, SATZ.ARBEIT_CENT_PRO_STD, { kalibrierbar: true }),
      feld('ledEkCent', 'LED/Netzteil (Einkauf)', FELD_TYP.GELD, 0),
      feld('handelsaufschlagProzent', 'Handelsaufschlag', FELD_TYP.PROZENT, SATZ.HANDELSAUFSCHLAG_PROZENT, { kalibrierbar: true }),
      feld('montageCent', 'Montage/Anfahrt', FELD_TYP.GELD, 0, { kalibrierbar: true }),
    ],
    mapping: (w) => ({
      material: { betragCent: w.materialCent },
      maschine: { stunden: w.fertigungStunden, satzCentProStd: w.maschinensatzCentProStd },
      arbeit: { stunden: w.elektrikStunden, satzCentProStd: w.arbeitssatzCentProStd },
      zukauf: { ekCent: w.ledEkCent, handelsaufschlagProzent: w.handelsaufschlagProzent },
      montage: { betragCent: w.montageCent },
    }),
  },

  // 5) Druck-Zukauf (Visitenkarten/Flyer/Drucksachen) — Handel, Basis Auflage.
  //    Eigenleistung nur Layout (Arbeit); Druck selbst kommt vom Druckpartner (Zukauf).
  {
    id: 'druckZukauf',
    label: 'Druck-Zukauf (Drucksachen)',
    art: PRODUKT_ART.HANDEL,
    basis: BASIS.AUFL,
    hotspot: 'Layoutzeit vs. Pauschale',
    felder: [
      feld('layoutStunden', 'Layout-/Datenarbeit', FELD_TYP.ZEIT, 0, { kalibrierbar: true }),
      feld('arbeitssatzCentProStd', 'Arbeitssatz je Std', FELD_TYP.GELD, SATZ.ARBEIT_CENT_PRO_STD, { kalibrierbar: true }),
      feld('druckEkCent', 'Druckpartner (Einkauf)', FELD_TYP.GELD, 0),
      feld('handelsaufschlagProzent', 'Handelsaufschlag', FELD_TYP.PROZENT, SATZ.HANDELSAUFSCHLAG_PROZENT, { kalibrierbar: true }),
    ],
    mapping: (w) => ({
      arbeit: { stunden: w.layoutStunden, satzCentProStd: w.arbeitssatzCentProStd },
      zukauf: { ekCent: w.druckEkCent, handelsaufschlagProzent: w.handelsaufschlagProzent },
    }),
  },

  // 6) Montage/Service vor Ort — Eigenleistung, Basis Stunden. Arbeit + Anfahrt/km;
  //    Kleinmaterial optional. Hotspot: Anfahrt/Montage wird fast immer unterschätzt.
  {
    id: 'montage',
    label: 'Montage/Service vor Ort',
    art: PRODUKT_ART.EIGEN,
    basis: BASIS.STD,
    hotspot: 'Anfahrt/Montage unterschätzt',
    felder: [
      feld('arbeitsStunden', 'Arbeitszeit vor Ort', FELD_TYP.ZEIT, 0, { kalibrierbar: true }),
      feld('arbeitssatzCentProStd', 'Arbeitssatz je Std', FELD_TYP.GELD, SATZ.ARBEIT_CENT_PRO_STD, { kalibrierbar: true }),
      feld('kleinmaterialCent', 'Kleinmaterial', FELD_TYP.GELD, 0),
      feld('anfahrtCent', 'Anfahrt/km/Hubsteiger', FELD_TYP.GELD, 0, { kalibrierbar: true }),
    ],
    mapping: (w) => ({
      material: { betragCent: w.kleinmaterialCent },
      arbeit: { stunden: w.arbeitsStunden, satzCentProStd: w.arbeitssatzCentProStd },
      montage: { betragCent: w.anfahrtCent },
    }),
  },
];

// Tief eingefroren (Definitionen sind unveränderlich; Werte kommen separat herein).
function freezeSchema(s) {
  return Object.freeze({ ...s, felder: Object.freeze(s.felder.map((f) => Object.freeze({ ...f }))) });
}

/** Alle Produkt-Schemata (eingefroren). Reihenfolge = Katalog §1. */
export const PRODUKT_SCHEMATA = Object.freeze(SCHEMATA_DEF.map(freezeSchema));

/** Liste der Schema-IDs (stabile Reihenfolge). */
export const SCHEMA_IDS = Object.freeze(PRODUKT_SCHEMATA.map((s) => s.id));

/** Schema nach ID (oder null). */
export function schemaNach(id) {
  return PRODUKT_SCHEMATA.find((s) => s.id === id) || null;
}

// ── Werte/Defaults/Kalibrierung ──────────────────────────────────────────────

/** Startwerte des Schemas als { feldKey: default }. */
export function feldDefaults(schema) {
  const out = {};
  if (!schema) return out;
  for (const f of schema.felder) out[f.key] = f.default;
  return out;
}

/** Nur die kalibrierbaren Felder (die „Hotspots"). */
export function kalibrierbareFelder(schema) {
  return schema ? schema.felder.filter((f) => f.kalibrierbar) : [];
}

/**
 * Startwerte mit gepflegter Kalibrierung überschrieben. `kalibrierung` ist ein
 * { feldKey: wert }-Objekt (z. B. der vom Betrieb gepflegte Folienpreis/Verschnitt).
 * Es werden NUR Felder überschrieben, die das Schema kennt UND als kalibrierbar
 * markiert sind — fremde/feste Felder bleiben unangetastet (GoBD-/Daten-Disziplin).
 */
export function kalibrierteDefaults(schema, kalibrierung = {}) {
  const out = feldDefaults(schema);
  if (!schema || !kalibrierung) return out;
  for (const f of schema.felder) {
    if (f.kalibrierbar && kalibrierung[f.key] != null) out[f.key] = kalibrierung[f.key];
  }
  return out;
}

/** Gefüllte Werte über die (ggf. kalibrierten) Defaults legen — fehlende ergänzt. */
export function werteMitDefaults(schema, werte = {}, kalibrierung = {}) {
  return { ...kalibrierteDefaults(schema, kalibrierung), ...(werte || {}) };
}

// ── Mapping auf den Kern ─────────────────────────────────────────────────────

/**
 * Bildet die (defaultgefüllten) Werte auf die Kostenarten-Eingabe des Kerns ab:
 * { material?, maschine?, arbeit?, zukauf?, montage? }. Reine Zuordnung, keine Rechnung.
 */
export function baueKostenarten(schema, werte = {}, kalibrierung = {}) {
  if (!schema) return {};
  return schema.mapping(werteMitDefaults(schema, werte, kalibrierung));
}

/**
 * Vollständige Eingabe für `kalkuliereVorwaerts`: Kostenarten aus dem Schema +
 * die internen Zuschläge (Gemeinkosten%/Gewinn%/USt%), die schema-UNABHÄNGIG sind
 * (sie kommen aus den Einstellungen, nicht aus dem Produkt).
 *
 * @param {object} schema Produkt-Schema
 * @param {object} werte  gefüllte Feldwerte (fehlende → Default/Kalibrierung)
 * @param {{gemeinkostenProzent?:number, gewinnProzent?:number, ustProzent?:number}} zuschlaege
 * @param {object} [kalibrierung] { feldKey: wert } für kalibrierbare Felder
 */
export function schemaEingabe(schema, werte = {}, zuschlaege = {}, kalibrierung = {}) {
  return {
    ...baueKostenarten(schema, werte, kalibrierung),
    gemeinkostenProzent: num(zuschlaege.gemeinkostenProzent),
    gewinnProzent: num(zuschlaege.gewinnProzent),
    ustProzent: num(zuschlaege.ustProzent),
  };
}

/**
 * Schema durchrechnen: baut die Kern-Eingabe und ruft `kalkuliereVorwaerts`.
 * Liefert exakt das Kern-Ergebnis (cent-genau) — diese Schicht rundet nichts selbst.
 */
export function kalkuliereSchema(schema, werte = {}, zuschlaege = {}, kalibrierung = {}) {
  return kalkuliereVorwaerts(schemaEingabe(schema, werte, zuschlaege, kalibrierung));
}

/**
 * Schema durchrechnen MIT den Korrekturfaktoren aus der eigenen Historie (Schritt 9/10,
 * domain/kalibrierung.js `faktorWerte`): baut die Kern-Eingabe wie `kalkuliereSchema` und
 * skaliert sie je Kostenart, BEVOR der Kern rechnet (`kalibriereEingabe`). So fließt die
 * gelernte Erfahrung (z. B. „Verschnitt real +12 %") in die Vorwärtskalkulation zurück —
 * ohne neue Formel, nur den Mengen-/Geld-Treiber skaliert. Ohne `faktoren` (bzw. mit lauter
 * 1-en) identisch zu `kalkuliereSchema`. Cent-genau (gerundet wird nur im Kern).
 * @param {object} schema Produkt-Schema
 * @param {object} werte  gefüllte Feldwerte
 * @param {object} zuschlaege Gemeinkosten%/Gewinn%/USt%
 * @param {object} [kalibrierung] { feldKey: wert } für kalibrierbare Felder (Hotspots)
 * @param {Object} [faktoren] block → Multiplikator (aus kalibrierung.js faktorWerte)
 */
export function kalkuliereSchemaKalibriert(schema, werte = {}, zuschlaege = {}, kalibrierung = {}, faktoren = {}) {
  return kalkuliereVorwaerts(kalibriereEingabe(schemaEingabe(schema, werte, zuschlaege, kalibrierung), faktoren));
}

// ── Validierung der Definitionen (Selbstschutz, im Node-Test geprüft) ────────

/**
 * Prüft EIN Schema strukturell: eindeutige Feld-Keys, gültige Art/Basis/Feldtypen,
 * mapping ist eine Funktion und liefert nur gültige Kostenart-Schlüssel.
 * @returns {{ok:boolean, fehler:string[]}}
 */
export function validateSchema(schema) {
  const fehler = [];
  if (!schema || typeof schema !== 'object') return { ok: false, fehler: ['kein Schema'] };
  if (!schema.id) fehler.push('id fehlt');
  if (!Object.values(PRODUKT_ART).includes(schema.art)) fehler.push(`art ungültig: ${schema.art}`);
  if (!Object.values(BASIS).includes(schema.basis)) fehler.push(`basis ungültig: ${schema.basis}`);
  const keys = new Set();
  for (const f of schema.felder || []) {
    if (keys.has(f.key)) fehler.push(`Feld doppelt: ${f.key}`);
    keys.add(f.key);
    if (!Object.values(FELD_TYP).includes(f.typ)) fehler.push(`Feldtyp ungültig: ${f.key}/${f.typ}`);
  }
  if (typeof schema.mapping !== 'function') {
    fehler.push('mapping fehlt');
  } else {
    const ka = schema.mapping(feldDefaults(schema)) || {};
    for (const k of Object.keys(ka)) {
      if (!KOSTENART_LISTE.includes(k)) fehler.push(`mapping nutzt unbekannte Kostenart: ${k}`);
    }
  }
  return { ok: fehler.length === 0, fehler };
}

/** Alle Schemata strukturell prüfen. @returns {{ok:boolean, fehler:string[]}} */
export function validateAlleSchemata() {
  const fehler = [];
  for (const s of PRODUKT_SCHEMATA) {
    const r = validateSchema(s);
    if (!r.ok) fehler.push(`${s.id}: ${r.fehler.join(', ')}`);
  }
  return { ok: fehler.length === 0, fehler };
}
