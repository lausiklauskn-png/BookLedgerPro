// src/domain/baukasten.js
// BAUPLAN Block 2 / Schritt 11 — Adaptiver Positions-Baukasten (REIN, node-getestet).
// Grundlage: docs/KALKULATION_KATALOG.md §3 (UX — adaptiver Positions-Baukasten).
//
// WAS DAS IST: die reine Sortier-/Zähl-Logik UNTER der späteren Angebots-UI. Sie macht
// zwei Dinge aus dem Katalog §3 build-frei und node-testbar:
//   1) NUTZUNGSZÄHLER je Leistungsart (Produkt-Schema): häufig/zuletzt genutzte Arten
//      rutschen in der Auswahl-Palette automatisch nach oben — der Baukasten passt sich
//      dem Betrieb an. Das Profil ist ein schlichtes { schemaId: {anzahl, zuletzt} }-Objekt,
//      das die UI lokal persistiert (gerätelokal, kein Außenbezug).
//   2) UMSORTIEREN der Positionsliste (Drag-and-drop): `verschiebePosition` &
//      `verschiebeNachOben/Unten` liefern eine NEUE, neu geordnete Liste — die UI ruft
//      sie beim Drop bzw. den Pfeil-Knöpfen.
//
// PRIME DIRECTIVE (Katalog §0): rein intern/neutral. Diese Schicht kennt nur Schema-IDs,
// Zähler und Positions-Reihenfolge — KEINE Kalkulationssystematik, KEINE Marge, KEIN
// Außendokument. Sie sortiert und zählt, mehr nicht.
//
// IMMUTABEL: alle Funktionen liefern NEUE Werte und lassen die Eingaben unangetastet
// (kein In-Place-Mutieren) — passt zum übrigen reinen Domänen-Code (angebote.js etc.).
// Positions-Objekte werden NICHT normalisiert/kopiert (das ist Sache von angebote.js) —
// sie werden nur per Referenz umsortiert, damit ihre interne `kalkulation` unberührt bleibt.

/** Endliche, nicht-negative ganze Zahl oder 0 (schützt vor NaN/undefined/negativ). */
function nat(x) {
  const n = Math.floor(Number(x));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ── Nutzungsprofil (Zähler je Leistungsart) ──────────────────────────────────

/** Leeres Nutzungsprofil. */
export function leeresNutzungsprofil() {
  return {};
}

/**
 * Säubert ein (z. B. persistiertes) Profil: nur nicht-leere String-IDs, je Eintrag
 * `{ anzahl, zuletzt }` als nicht-negative ganze Zahlen. Einträge mit anzahl 0 UND
 * zuletzt 0 (also faktisch nie genutzt) werden verworfen. Liefert ein NEUES Objekt.
 */
export function normalizeNutzung(profil = {}) {
  const out = {};
  if (!profil || typeof profil !== 'object') return out;
  for (const id of Object.keys(profil)) {
    if (!id) continue;
    const e = profil[id] || {};
    const anzahl = nat(e.anzahl);
    const zuletzt = nat(e.zuletzt);
    if (anzahl === 0 && zuletzt === 0) continue;
    out[String(id)] = { anzahl, zuletzt };
  }
  return out;
}

/** Roh-Eintrag eines Schemas (immer ein Objekt, auch wenn ungenutzt). */
export function nutzungVon(profil, schemaId) {
  const e = (profil && schemaId != null) ? profil[schemaId] : null;
  return { anzahl: nat(e && e.anzahl), zuletzt: nat(e && e.zuletzt) };
}

/** Wie oft wurde `schemaId` genutzt? */
export function anzahlVon(profil, schemaId) {
  return nutzungVon(profil, schemaId).anzahl;
}

/** Wurde `schemaId` schon mindestens einmal genutzt? */
export function istGenutzt(profil, schemaId) {
  return anzahlVon(profil, schemaId) > 0;
}

/**
 * Zählt eine Nutzung von `schemaId` hoch und stempelt den Zeitpunkt. Liefert ein NEUES
 * Profil (Eingabe unverändert). `opts.jetzt` (epoch-ms) ist injizierbar (Tests/Determinismus),
 * Default `Date.now()`; `opts.um` erhöht um mehr als 1 (Default 1, min. 1).
 * @returns {object} neues Nutzungsprofil
 */
export function zaehleNutzung(profil, schemaId, opts = {}) {
  const next = normalizeNutzung(profil);
  if (schemaId == null || schemaId === '') return next;
  const id = String(schemaId);
  const jetzt = nat(opts.jetzt != null ? opts.jetzt : Date.now());
  const um = Math.max(1, nat(opts.um) || 1);
  const vorher = nutzungVon(next, id);
  next[id] = { anzahl: vorher.anzahl + um, zuletzt: jetzt };
  return next;
}

// ── Adaptive Palette (häufig/zuletzt genutzte nach oben) ─────────────────────

/**
 * Reihenfolge-Schlüssel für die Palette. Sortier-Priorität (Katalog §3
 * „häufig/zuletzt genutzte … rutschen nach oben"):
 *   1. anzahl  ABSTEIGEND (häufig genutzte oben),
 *   2. zuletzt ABSTEIGEND (bei Gleichstand: zuletzt genutzte oben),
 *   3. ursprünglicher Index AUFSTEIGEND (stabil → ungenutzte behalten Katalog-Reihenfolge).
 * Reine Vergleichsfunktion für zwei dekorierte Einträge {anzahl, zuletzt, index}.
 */
function vergleicheNutzung(a, b) {
  if (b.anzahl !== a.anzahl) return b.anzahl - a.anzahl;
  if (b.zuletzt !== a.zuletzt) return b.zuletzt - a.zuletzt;
  return a.index - b.index;
}

/**
 * Reichert die Schema-Liste mit dem Nutzungsprofil an und sortiert sie adaptiv.
 * Jeder Eintrag: `{ schema, anzahl, zuletzt, genutzt }`. Liefert eine NEUE Liste; die
 * Eingabe-Reihenfolge dient als stabiler Tiebreaker (Katalog-Reihenfolge bleibt für
 * ungenutzte/gleichrangige Arten erhalten). Reine Funktion — kein UI, kein DOM.
 * @param {Array} schemata Produkt-Schemata (z. B. PRODUKT_SCHEMATA), je mit `.id`
 * @param {object} profil  Nutzungsprofil { schemaId: {anzahl, zuletzt} }
 * @returns {Array<{schema:object, anzahl:number, zuletzt:number, genutzt:boolean}>}
 */
export function baukastenPalette(schemata, profil = {}) {
  const p = normalizeNutzung(profil);
  return (schemata || [])
    .map((schema, index) => {
      const u = nutzungVon(p, schema && schema.id);
      return { schema, anzahl: u.anzahl, zuletzt: u.zuletzt, genutzt: u.anzahl > 0, index };
    })
    .sort(vergleicheNutzung)
    .map(({ schema, anzahl, zuletzt, genutzt }) => ({ schema, anzahl, zuletzt, genutzt }));
}

/**
 * Nur die Schemata, adaptiv sortiert (Komfort-Variante von `baukastenPalette`).
 * @returns {Array} dieselben Schema-Objekte, neu geordnet
 */
export function sortiereSchemata(schemata, profil = {}) {
  return baukastenPalette(schemata, profil).map((e) => e.schema);
}

/**
 * Die `n` häufigsten/zuletzt genutzten Schemata (nur tatsächlich genutzte, anzahl>0) —
 * für eine optionale Schnellzugriffs-Zeile „häufig genutzt" über der vollen Palette.
 * Liefert <= n Einträge; nie ungenutzte. `n` Default 3, min. 0.
 * @returns {Array} Schema-Objekte
 */
export function haeufigsteSchemata(schemata, profil = {}, n = 3) {
  const grenze = Math.max(0, nat(n));
  return baukastenPalette(schemata, profil)
    .filter((e) => e.genutzt)
    .slice(0, grenze)
    .map((e) => e.schema);
}

// ── Positions-Reihenfolge (Drag-and-drop / Pfeil-Knöpfe) ─────────────────────

/** Ist `i` ein gültiger Index in eine Liste der Länge `len`? */
function gueltigerIndex(i, len) {
  return Number.isInteger(i) && i >= 0 && i < len;
}

/**
 * Verschiebt das Element von `vonIndex` an `nachIndex`. Liefert eine NEUE Liste; die
 * Elemente bleiben per Referenz erhalten (keine Normalisierung → interne `kalkulation`
 * unberührt). `nachIndex` wird in [0, len-1] geklemmt. Ungültiger `vonIndex` oder
 * Ziel == Quelle → unveränderte (flache) Kopie. Reine Funktion.
 */
export function verschiebePosition(positionen, vonIndex, nachIndex) {
  const arr = Array.isArray(positionen) ? positionen.slice() : [];
  const len = arr.length;
  if (!gueltigerIndex(vonIndex, len)) return arr;
  let ziel = Number.isInteger(nachIndex) ? nachIndex : vonIndex;
  if (ziel < 0) ziel = 0;
  if (ziel > len - 1) ziel = len - 1;
  if (ziel === vonIndex) return arr;
  const [item] = arr.splice(vonIndex, 1);
  arr.splice(ziel, 0, item);
  return arr;
}

/** Eine Position eins nach oben (Pfeil ↑). Index 0 bleibt unverändert. */
export function verschiebeNachOben(positionen, index) {
  return verschiebePosition(positionen, index, Number.isInteger(index) ? index - 1 : index);
}

/** Eine Position eins nach unten (Pfeil ↓). Letzter Index bleibt unverändert. */
export function verschiebeNachUnten(positionen, index) {
  return verschiebePosition(positionen, index, Number.isInteger(index) ? index + 1 : index);
}
