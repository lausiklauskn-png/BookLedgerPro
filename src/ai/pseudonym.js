// src/ai/pseudonym.js
// Reines Logik-Modul für die Datenschutz-Modi: Pseudonymisierung von Klartext,
// bevor er ein externes EU-KI-Endpunkt erreicht (Mistral-Kontierung, Steuer-
// Assistent). `tokenize()` ersetzt bekannte, EXAKTE Identifikatoren (Anker) durch
// stabile Token; `reidentify()` macht die Ersetzung verlustfrei rückgängig.
//
// ENTWURFS-PRINZIPIEN (verbindlich für dieses Modul):
//  - „Anker = exakter Identifikator": ein Anker ist ein exakter Zeichenketten-
//    Treffer, KEINE Heuristik/NER/Regex. Die App kennt ihre Identifikatoren bereits
//    (Kunden-, Mitarbeiter-, Firmennamen, IBAN, E-Mail, Steuer-Nr.) aus dem eigenen
//    verschlüsselten Speicher und übergibt sie als Anker. So bleibt das Modul rein,
//    deterministisch, build-frei und node-testbar.
//  - „Stabile Token": derselbe Anker-Wert erhält IMMER denselben Token — über alle
//    Vorkommen einer Tokenisierung hinweg und (bei Wiederverwendung eines Registers)
//    auch über mehrere Aufrufe/Belege hinweg.
//  - Round-Trip-Garantie: reidentify(tokenize(text, anker).text, map) === text,
//    solange der Klartext die Token-Form `[[TYP_N]]` nicht selbst literal enthält
//    (für Belegtexte praktisch ausgeschlossen; siehe Annahme unten).
//
// Es findet KEINE Netzkommunikation und KEINE Krypto in diesem Modul statt — es ist
// die reine Abbildungs-Logik. Die Übertragung pseudonymisierten Texts bleibt opt-in
// und bestätigungspflichtig (CLAUDE.md, Regel 4 & 8).

// Standard-Typ, wenn ein Anker ohne Typ als reine Zeichenkette übergeben wird.
export const STANDARD_TYP = 'ID';

// Gemeinsames Vokabular der Identifikator-Typen (für sprechende Token & die
// Anker-Quelle in ai/anker.js). Frei erweiterbar; normTyp() normalisiert ohnehin.
export const ANKER_TYP = Object.freeze({
  PERSON: 'PERSON', FIRMA: 'FIRMA', EMAIL: 'EMAIL',
  IBAN: 'IBAN', USTID: 'USTID', STEUERNR: 'STEUERNR', ADRESSE: 'ADRESSE',
});

// Form der erzeugten Token. Die schließende `]]` schützt vor Präfix-Kollisionen
// (z.B. greift `[[ID_1]]` NICHT in `[[ID_11]]`, weil dort `1]]` statt `]]` folgt).
function baueToken(typ, n) {
  return `[[${typ}_${n}]]`;
}

// Ein „Wortzeichen" für die optionale Wortgrenzen-Prüfung: Unicode-Buchstabe/Ziffer
// oder Unterstrich (deckt ä/ö/ü/ß korrekt ab — anders als ASCII-`\b`).
const WORTZEICHEN = /[\p{L}\p{N}_]/u;

// Liegt der Treffer von `wert` ab Position `start` an einer Wortgrenze? Eine Grenze
// gilt als verletzt nur, wenn an einer Anker-Kante BEIDE Seiten Wortzeichen sind
// (z.B. „Anna" mitten in „Annahme"). Anker, die mit Satzzeichen beginnen/enden
// (IBAN-Lücken, „(GmbH)"), passieren die jeweilige Kante immer. Entspricht der
// `\b`-Semantik, beschränkt auf die alphanumerischen Anker-Ränder.
function anWortgrenze(src, start, wert) {
  const linksInnen = WORTZEICHEN.test(wert[0]);
  const rechtsInnen = WORTZEICHEN.test(wert[wert.length - 1]);
  const vor = src[start - 1];
  const nach = src[start + wert.length];
  const linksOk = !(linksInnen && vor !== undefined && WORTZEICHEN.test(vor));
  const rechtsOk = !(rechtsInnen && nach !== undefined && WORTZEICHEN.test(nach));
  return linksOk && rechtsOk;
}

// Normalisiert einen Typ-Namen zu einem schlanken Token-Segment (Großbuchstaben,
// nur A–Z/0–9, sonst Unterstrich). Leerer/fehlender Typ → STANDARD_TYP.
function normTyp(typ) {
  const t = String(typ || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t || STANDARD_TYP;
}

/**
 * Bringt die Anker-Eingabe in eine einheitliche, entdoppelte Liste.
 * Erlaubt:
 *   - 'Max Mustermann'                          → { wert, typ: STANDARD_TYP }
 *   - { wert: 'DE12…', typ: 'IBAN' }            → typisierter Anker
 *   - { value: 'a@b.de', type: 'EMAIL' }        → englische Aliasse werden akzeptiert
 * Leere/whitespace-Anker werden verworfen. Bei doppeltem Wert gewinnt der erste Typ.
 * @returns {{wert:string, typ:string}[]}
 */
export function normalizeAnchors(anchors) {
  const liste = Array.isArray(anchors) ? anchors : (anchors == null ? [] : [anchors]);
  const gesehen = new Map(); // wert -> {wert, typ}
  for (const a of liste) {
    let wert, typ;
    if (a && typeof a === 'object') {
      wert = a.wert != null ? a.wert : a.value;
      typ = a.typ != null ? a.typ : a.type;
    } else {
      wert = a;
    }
    wert = String(wert == null ? '' : wert);
    if (wert.trim() === '') continue;
    if (!gesehen.has(wert)) gesehen.set(wert, { wert, typ: normTyp(typ) });
  }
  return [...gesehen.values()];
}

/**
 * Erzeugt ein Register für stabile Token über MEHRERE tokenize()-Aufrufe hinweg
 * (z.B. mehrere Belege eines Vorgangs, die gemeinsam an die KI gehen).
 * Innerhalb eines einzelnen tokenize()-Aufrufs wird ohnehin stets stabil ersetzt.
 */
export function createRegistry() {
  return {
    tokenByWert: new Map(), // exakter Anker-Wert -> Token
    counters: Object.create(null), // typ -> nächste laufende Nummer
    entries: [], // { token, wert, typ } in Vergabereihenfolge
  };
}

// Liefert (oder vergibt erstmalig) den stabilen Token für einen Anker im Register.
function tokenFuer(reg, anker) {
  const vorhanden = reg.tokenByWert.get(anker.wert);
  if (vorhanden) return vorhanden;
  const n = (reg.counters[anker.typ] = (reg.counters[anker.typ] || 0) + 1);
  const token = baueToken(anker.typ, n);
  reg.tokenByWert.set(anker.wert, token);
  reg.entries.push({ token, wert: anker.wert, typ: anker.typ });
  return token;
}

/**
 * Pseudonymisiert `text`, indem jedes EXAKTE Vorkommen eines Ankers durch seinen
 * stabilen Token ersetzt wird. Längere Anker haben an einer Position Vorrang
 * (Longest-Match), sodass „Müller GmbH" nicht von „Müller" zerlegt wird. Die
 * Ersetzung scannt strikt von links nach rechts und fasst NIE in bereits gesetzte
 * Token hinein — daher sind auch Anker mit Regex-Sonderzeichen (IBAN, „a.b+c")
 * sowie überlappende Anker sicher.
 *
 * @param {string} text  Klartext (z.B. OCR-Beleg-Text).
 * @param {Array<string|{wert?:string,value?:string,typ?:string,type?:string}>} anchors
 *        Exakte Identifikatoren. Token-Nummern werden in Reihenfolge des ersten
 *        Auftretens im Text vergeben (PERSON_1 = die erste genannte Person).
 * @param {{registry?:object, wortgrenze?:boolean}} [options]
 *        `registry`: optionales Register für aufrufsübergreifend stabile Token.
 *        `wortgrenze` (Standard `false`): wenn `true`, greift ein Anker nur an einer
 *        Wortgrenze — verhindert, dass ein kurzer Anker (z.B. „Anna") mitten in einem
 *        längeren Wort („Annahme") ersetzt wird und so den an die KI gesendeten Text
 *        verunreinigt. Standard ist exakte Ersetzung (datenschutz-sicherste Richtung:
 *        eher zu viel maskieren als ein Vorkommen zu verfehlen).
 * @returns {{text:string, map:{token:string,wert:string,typ:string}[]}}
 *          `map` ist die Re-Identifizierungstabelle (Token → Originalwert).
 */
export function tokenize(text, anchors, options = {}) {
  const src = String(text == null ? '' : text);
  const reg = options.registry || createRegistry();
  const wortgrenze = options.wortgrenze === true;

  // Longest-Match zuerst, bei Gleichstand stabil nach Wert sortiert.
  const anker = normalizeAnchors(anchors).sort(
    (a, b) => b.wert.length - a.wert.length || (a.wert < b.wert ? -1 : a.wert > b.wert ? 1 : 0),
  );
  // Index nach erstem Zeichen: an Position i kommen nur Anker mit gleichem Anfangs-
  // zeichen als Treffer infrage (startsWith). Spart das Prüfen aller Anker je Position;
  // die Longest-First-Reihenfolge bleibt je Eimer erhalten → identisches Ergebnis.
  const nachErstem = new Map();
  for (const a of anker) {
    const c = a.wert[0];
    if (!nachErstem.has(c)) nachErstem.set(c, []);
    nachErstem.get(c).push(a);
  }

  let out = '';
  let i = 0;
  while (i < src.length) {
    let treffer = null;
    const kandidaten = nachErstem.get(src[i]);
    if (kandidaten) {
      for (const a of kandidaten) {
        if (src.startsWith(a.wert, i) && (!wortgrenze || anWortgrenze(src, i, a.wert))) { treffer = a; break; }
      }
    }
    if (treffer) {
      out += tokenFuer(reg, treffer);
      i += treffer.wert.length;
    } else {
      out += src[i];
      i += 1;
    }
  }
  return { text: out, map: reg.entries.slice() };
}

/**
 * Macht eine Tokenisierung rückgängig: ersetzt jeden Token wieder durch seinen
 * Originalwert. Akzeptiert die `map` aus tokenize() (Array von {token, wert})
 * ODER ein einfaches Objekt `{ "[[ID_1]]": "Originalwert", … }`.
 * Längere Token werden zuerst ersetzt (zusätzliche Absicherung gegen Präfix-Fälle).
 *
 * @param {string} text  pseudonymisierter Text (z.B. KI-Antwort, die Token zitiert).
 * @param {{token:string,wert:string}[]|Record<string,string>} map
 * @returns {string} Klartext mit re-identifizierten Werten.
 */
export function reidentify(text, map) {
  let out = String(text == null ? '' : text);
  const eintraege = Array.isArray(map)
    ? map.map((e) => ({ token: e.token, wert: e.wert != null ? e.wert : e.value }))
    : Object.entries(map || {}).map(([token, wert]) => ({ token, wert }));

  eintraege.sort((a, b) => b.token.length - a.token.length);
  for (const e of eintraege) {
    if (!e.token) continue;
    out = out.split(e.token).join(String(e.wert == null ? '' : e.wert));
  }
  return out;
}

/**
 * Fasst eine Maskierungs-Tabelle (map aus tokenize()) für die TRANSPARENZ-Anzeige
 * zusammen: wie viele Identifikatoren wurden ersetzt, aufgeschlüsselt nach Typ.
 * Enthält bewusst KEINE Klartextwerte — nur Zähler, damit der Bericht selbst gefahrlos
 * angezeigt/protokolliert werden kann.
 * @param {{token:string,wert:string,typ?:string}[]} map
 * @returns {{gesamt:number, proTyp:Record<string,number>}}
 */
export function maskierungsBericht(map) {
  const eintraege = Array.isArray(map) ? map : [];
  const proTyp = {};
  for (const e of eintraege) {
    const typ = e.typ
      || (String(e.token || '').match(/^\[\[([A-Z0-9_]+)_\d+\]\]$/) || [])[1]
      || STANDARD_TYP;
    proTyp[typ] = (proTyp[typ] || 0) + 1;
  }
  return { gesamt: eintraege.length, proTyp };
}
