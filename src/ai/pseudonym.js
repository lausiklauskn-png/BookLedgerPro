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

// Form der erzeugten Token. Die schließende `]]` schützt vor Präfix-Kollisionen
// (z.B. greift `[[ID_1]]` NICHT in `[[ID_11]]`, weil dort `1]]` statt `]]` folgt).
function baueToken(typ, n) {
  return `[[${typ}_${n}]]`;
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
 * @param {{registry?:object}} [options]  optionales Register für aufrufsübergreifend
 *        stabile Token.
 * @returns {{text:string, map:{token:string,wert:string,typ:string}[]}}
 *          `map` ist die Re-Identifizierungstabelle (Token → Originalwert).
 */
export function tokenize(text, anchors, options = {}) {
  const src = String(text == null ? '' : text);
  const reg = options.registry || createRegistry();

  // Longest-Match zuerst, bei Gleichstand stabil nach Wert sortiert.
  const anker = normalizeAnchors(anchors).sort(
    (a, b) => b.wert.length - a.wert.length || (a.wert < b.wert ? -1 : a.wert > b.wert ? 1 : 0),
  );

  let out = '';
  let i = 0;
  while (i < src.length) {
    let treffer = null;
    for (const a of anker) {
      if (src.startsWith(a.wert, i)) { treffer = a; break; }
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
