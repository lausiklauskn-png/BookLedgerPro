// src/ai/schluesselabgleich.js
// Datenschutz-Modi, P9 — DATEI-IMPORT MIT EXAKTEM SCHLÜSSEL-ABGLEICH.
//
// Die Pseudonymisierung (`ai/pseudonym.js`) ersetzt vor dem KI-Versand bekannte,
// EXAKTE Identifikatoren durch stabile Token `[[TYP_N]]` und liefert eine
// Re-Identifizierungstabelle (`map`: Token → Klartext). Bisher lebte diese Tabelle
// nur im RAM eines einzelnen `tokenize → senden → reidentify`-Durchlaufs.
//
// P9 macht den Round-Trip **dateibasiert / über Sitzungen hinweg** möglich:
//  1. Ein Klartext wird pseudonymisiert → das pseudonyme Dokument kann gefahrlos
//     nach außen gegeben werden (externer Berater / externes KI-Werkzeug).
//  2. Die Tabelle wird als **Schlüssel-Datei (Anker-Tresor)** GERÄTELOKAL behalten —
//     sie enthält Klartext und verlässt das Gerät NICHT (CLAUDE.md Regel 4).
//  3. Kommt eine Antwort-Datei zurück, die noch Token enthält, wird sie über den
//     **exakten Schlüssel-Abgleich** wieder den echten Werten zugeordnet — verlustfrei,
//     und mit ehrlichem Bericht über jeden Token OHNE Schlüssel (statt still zu lecken).
//
// ENTWURFS-PRINZIPIEN (verbindlich):
//  - „Exakter Abgleich": ein Token wird NUR ersetzt, wenn sein Schlüssel exakt vorliegt.
//    KEINE Heuristik/Fuzzy-Zuordnung. Token ohne Schlüssel bleiben sichtbar stehen und
//    werden als `fehlend` gemeldet (datenschutz-/buchhaltungs-sicher: nichts erfinden).
//  - Reine, deterministische, build-freie Logik (kein Netz, keine Krypto) → node-testbar.
//  - Reuse statt Neubau: die eigentliche Ersetzung nutzt `pseudonym.reidentify`
//    (Longest-Token-zuerst); dieses Modul ergänzt nur den Abgleichs-/Vollständigkeits-Bericht
//    und die Serialisierung der Schlüssel-Datei.

import { reidentify, tokenize, STANDARD_TYP } from './pseudonym.js';

// Format-Marker der exportierten Schlüssel-Datei (Anker-Tresor).
export const SCHLUESSEL_FORMAT = 'blp-schluessel';
export const SCHLUESSEL_VERSION = 1;

// Ein vollständiges Token: `[[<TYP>_<N>]]`. TYP darf Unterstriche tragen (Briefkasten-
// Scopes wie `FIRMA_1_IBAN`); die laufende Nummer ist der letzte `_<Ziffern>`-Abschnitt.
const TOKEN_GLOBAL = /\[\[[A-Z0-9_]+_\d+\]\]/g;
const TOKEN_EXAKT = /^\[\[([A-Z0-9_]+)_\d+\]\]$/;

/** Liest den Typ-Teil aus einem Token (`[[FIRMA_1_IBAN_2]]` → `FIRMA_1_IBAN`). */
export function typAusToken(token) {
  return (String(token == null ? '' : token).match(TOKEN_EXAKT) || [])[1] || STANDARD_TYP;
}

/** Prüft, ob `s` exakt die Form eines Tokens hat. */
export function istToken(s) {
  return TOKEN_EXAKT.test(String(s == null ? '' : s));
}

/**
 * Alle im Text vorkommenden Token, in Reihenfolge des ersten Auftretens, mit Häufigkeit.
 * @param {string} text
 * @returns {{token:string, anzahl:number, typ:string}[]}
 */
export function tokenVorkommen(text) {
  const src = String(text == null ? '' : text);
  const zaehler = new Map();
  const reihenfolge = [];
  for (const m of src.matchAll(TOKEN_GLOBAL)) {
    const tk = m[0];
    if (!zaehler.has(tk)) { zaehler.set(tk, 0); reihenfolge.push(tk); }
    zaehler.set(tk, zaehler.get(tk) + 1);
  }
  return reihenfolge.map((token) => ({ token, anzahl: zaehler.get(token), typ: typAusToken(token) }));
}

/**
 * Bringt eine Schlüssel-Eingabe in eine kanonische, entdoppelte Tabelle.
 * Akzeptiert:
 *   - eine `tokenize()`-map: `[{token, wert, typ}]` (auch `{value}`-Alias)
 *   - ein einfaches Objekt: `{ "[[ID_1]]": "Klartext", … }`
 * Nur gültig geformte Token werden übernommen; bei doppeltem Token gewinnt der erste.
 * @returns {{token:string, wert:string, typ:string}[]}
 */
export function schluesselAusMap(map) {
  const eintraege = Array.isArray(map)
    ? map.map((e) => ({ token: e && e.token, wert: e && (e.wert != null ? e.wert : e.value), typ: e && e.typ }))
    : Object.entries(map || {}).map(([token, wert]) => ({ token, wert }));
  const gesehen = new Map();
  for (const e of eintraege) {
    const token = String(e.token == null ? '' : e.token);
    if (!TOKEN_EXAKT.test(token)) continue;
    if (gesehen.has(token)) continue;
    gesehen.set(token, { token, wert: String(e.wert == null ? '' : e.wert), typ: e.typ || typAusToken(token) });
  }
  return [...gesehen.values()];
}

/**
 * Serialisiert eine Schlüssel-Tabelle (aus `tokenize().map`) als JSON-Text für die
 * gerätelokale Schlüssel-Datei (Anker-Tresor). ENTHÄLT KLARTEXT → nicht nach außen geben.
 * @param {Array|Object} map  Re-Identifizierungstabelle.
 * @param {{titel?:string, erstellt?:string}} [meta]
 * @returns {string} JSON.
 */
export function serialisiereSchluessel(map, meta = {}) {
  const schluessel = schluesselAusMap(map);
  return JSON.stringify({
    format: SCHLUESSEL_FORMAT,
    version: SCHLUESSEL_VERSION,
    erstellt: meta.erstellt || new Date().toISOString(),
    titel: String(meta.titel || ''),
    anzahl: schluessel.length,
    schluessel,
  }, null, 2);
}

/**
 * Liest eine importierte Schlüssel-Datei (oder ein bereits geparstes Objekt) ein.
 * Robust gegenüber: unserem Format `{schluessel:[…]}`, einer blanken map-Liste `[…]`
 * oder einem `{token:wert}`-Objekt.
 * @param {string|object|Array} eingabe
 * @returns {{ok:boolean, schluessel:{token,wert,typ}[], fehler?:string, format?:string, version?:number}}
 */
export function parseSchluessel(eingabe) {
  let obj = eingabe;
  if (typeof eingabe === 'string') {
    if (eingabe.trim() === '') return { ok: false, schluessel: [], fehler: 'leer' };
    try { obj = JSON.parse(eingabe); } catch { return { ok: false, schluessel: [], fehler: 'kein gültiges JSON' }; }
  }
  if (!obj || typeof obj !== 'object') return { ok: false, schluessel: [], fehler: 'leer' };
  let roh;
  if (Array.isArray(obj)) roh = obj;
  else if (Array.isArray(obj.schluessel)) roh = obj.schluessel;
  else if (Array.isArray(obj.map)) roh = obj.map;
  else roh = obj; // {token: wert}-Objekt
  const schluessel = schluesselAusMap(roh);
  if (!schluessel.length) return { ok: false, schluessel: [], fehler: 'keine Schlüssel-Einträge gefunden' };
  return { ok: true, schluessel, format: obj.format, version: obj.version };
}

/**
 * EXAKTER SCHLÜSSEL-ABGLEICH: ordnet die Token in `text` über die Schlüssel-Tabelle
 * wieder ihren echten Werten zu — verlustfrei, ohne Heuristik. Liefert neben dem
 * re-identifizierten Text einen ehrlichen Abgleichs-Bericht:
 *   - `ersetzt`   Token im Text MIT Schlüssel (ersetzt) — `[{token, anzahl, typ}]`
 *   - `fehlend`   Token im Text OHNE Schlüssel (bleiben stehen!) — `[{token, anzahl, typ}]`
 *   - `ungenutzt` Schlüssel, die im Text NICHT vorkommen — `[{token, typ}]`
 *   - `vollstaendig` true ⇔ kein fehlender Token (lückenloser, verlustfreier Abgleich)
 *
 * @param {string} text  importierter Text (kann noch Token enthalten).
 * @param {Array|Object} schluessel  Schlüssel-Tabelle (siehe schluesselAusMap).
 * @returns {{text:string, ersetzt:Array, fehlend:Array, ungenutzt:Array, vollstaendig:boolean}}
 */
export function gleicheAb(text, schluessel) {
  const src = String(text == null ? '' : text);
  const tabelle = schluesselAusMap(schluessel);
  const bekannt = new Map(tabelle.map((e) => [e.token, e]));
  const imText = tokenVorkommen(src);

  const ersetzt = [];
  const fehlend = [];
  for (const v of imText) {
    if (bekannt.has(v.token)) ersetzt.push({ token: v.token, anzahl: v.anzahl, typ: bekannt.get(v.token).typ });
    else fehlend.push({ token: v.token, anzahl: v.anzahl, typ: v.typ });
  }
  const benutzt = new Set(ersetzt.map((e) => e.token));
  const ungenutzt = tabelle.filter((e) => !benutzt.has(e.token)).map((e) => ({ token: e.token, typ: e.typ }));

  // Eigentliche Ersetzung: reidentify ersetzt ausschließlich bekannte Token; unbekannte
  // (`fehlend`) bleiben sichtbar als `[[…]]` stehen → kein stilles Datenleck/Verlust.
  const ausgabe = reidentify(src, tabelle);

  return { text: ausgabe, ersetzt, fehlend, ungenutzt, vollstaendig: fehlend.length === 0 };
}

/**
 * Zähler-Zusammenfassung eines `gleicheAb`-Ergebnisses für die gefahrlose Anzeige
 * (KEINE Klartextwerte — nur Token/Typen/Zähler).
 * @param {ReturnType<typeof gleicheAb>} ergebnis
 * @returns {{ersetzt:number, ersetztVorkommen:number, fehlend:number, ungenutzt:number, vollstaendig:boolean}}
 */
export function abgleichBericht(ergebnis) {
  const r = ergebnis || {};
  const summe = (liste) => (liste || []).reduce((n, e) => n + (e.anzahl || 1), 0);
  return {
    ersetzt: (r.ersetzt || []).length,
    ersetztVorkommen: summe(r.ersetzt),
    fehlend: (r.fehlend || []).length,
    ungenutzt: (r.ungenutzt || []).length,
    vollstaendig: r.vollstaendig === true,
  };
}

/**
 * Selbsttest des dateibasierten Round-Trips: pseudonymisiert `originaltext` mit den
 * gegebenen Ankern, gleicht das Ergebnis wieder über seine eigene Schlüssel-Tabelle ab
 * und prüft Verlustfreiheit + Vollständigkeit. Reicht `opts` an `tokenize()` durch.
 * @param {string} originaltext
 * @param {Array} anchors
 * @param {object} [opts]  z.B. `{wortgrenze:true, registry}`.
 * @returns {{ok:boolean, pseudo:string, zurueck:string, schluesselAnzahl:number, vollstaendig:boolean}}
 */
export function pruefeRoundtrip(originaltext, anchors, opts = {}) {
  const original = String(originaltext == null ? '' : originaltext);
  const { text: pseudo, map } = tokenize(original, anchors, opts);
  const zurueck = gleicheAb(pseudo, map);
  return {
    ok: zurueck.text === original && zurueck.vollstaendig,
    pseudo,
    zurueck: zurueck.text,
    schluesselAnzahl: map.length,
    vollstaendig: zurueck.vollstaendig,
  };
}
