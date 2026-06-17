// src/ai/ner.js
// Datenschutz-Modi, Erweiterung: PII-Erkennung ÜBER die bekannten Anker hinaus.
//
// `ai/anker.js` liefert EXAKTE Identifikatoren aus den eigenen Stammdaten (Kunden,
// Mitarbeiter, Firma). Was dort fehlt, sind personenbezogene Daten DRITTER, die nur
// im Belegtext stehen (z.B. die IBAN/E-Mail/USt-IdNr eines fremden Lieferanten auf
// einem Fremdbeleg). Dieses Modul erkennt solche Muster heuristisch und liefert sie
// als ZUSÄTZLICHE Anker für `pseudonym.tokenize()`, damit sie vor dem KI-Versand
// ebenfalls maskiert werden.
//
// ENTWURFS-PRINZIPIEN (verbindlich):
//  - Bewusst KONSERVATIV: nur Muster mit sehr geringer Falsch-Positiv-Rate (E-Mail,
//    IBAN, USt-IdNr, Steuernummer, Telefon mit Trenner). KEIN BIC (kollidiert mit
//    Großbuchstaben-Wörtern wie „RECHNUNG"), keine reinen Namens-Heuristiken.
//  - Reine, deterministische, build-freie Logik (nur Regex) → node-testbar.
//  - Datenschutz-Richtung „im Zweifel maskieren": die exakten Anker behalten Vorrang
//    (sie kommen in der kombinierten Liste zuerst → `normalizeAnchors` entdoppelt nach
//    Wert, der erste Typ gewinnt); überlappende Treffer werden Longest-Match aufgelöst.
//  - Es findet KEINE Netzkommunikation statt; die Übertragung bleibt opt-in.

import { ANKER_TYP } from './pseudonym.js';

// Zusätzliche Typen über das Anker-Vokabular hinaus (für sprechende Token/Transparenz).
export const NER_TYP = Object.freeze({
  TELEFON: 'TELEFON',
});

// Scope für PII DRITTER, wenn der dreistufige Briefkasten (ai/briefkasten.js) aktiv ist.
// Die exakten Stammdaten tragen dann Hierarchie-Scopes (MANDANT, FIRMA_1, FIRMA_2_IBAN …);
// die im Belegtext erkannte Fremd-PII wird mit DIESEM Scope versehen (EXTERN_IBAN,
// EXTERN_EMAIL …), sodass die KI sie als externe, gruppierte Dritt-Identifikatoren sieht —
// deutlich getrennt von den bekannten eigenen/Mandanten-Entitäten. Bewusst EIN gemeinsamer
// Scope: welche der Fremd-Treffer zu derselben Drittpartei gehören, ist aus flachem
// Belegtext nicht ohne Heuristik (FP-Risiko) ableitbar → konservativ alle als „extern".
export const EXTERN_SCOPE = 'EXTERN';

// Erkennungsmuster, geordnet nach Spezifität (spezifischste zuerst, damit z.B. eine
// USt-IdNr nicht als Teil eines anderen Treffers verloren geht). Jedes Muster ist
// bewusst eng gefasst, um Belegtext (Rechnungsnummern, Beträge, Datumsangaben) nicht
// fälschlich zu maskieren.
const MUSTER = [
  // E-Mail (RFC-nah, pragmatisch).
  { typ: ANKER_TYP.EMAIL, re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  // Deutsche USt-IdNr.: DE + 9 Ziffern. (EU-weit unterschiedlich → hier DE + AT konservativ.)
  { typ: ANKER_TYP.USTID, re: /\b(?:DE\d{9}|ATU\d{8})\b/g },
  // IBAN, gruppierte Schreibweise mit Leerzeichen (z.B. „DE89 3704 0044 0532 0130 00").
  { typ: ANKER_TYP.IBAN, re: /\b[A-Z]{2}\d{2}(?: [A-Z0-9]{4}){2,7}(?: [A-Z0-9]{1,4})?\b/g },
  // IBAN, kompakt (15–34 Zeichen gesamt → 11–30 nach Länder-/Prüfzeichen).
  { typ: ANKER_TYP.IBAN, re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
  // Deutsche Steuernummer im Standard-Schema FF/BBB/UUUU(P) — die zwei „/" machen sie
  // spezifisch (Auszug-Felder wie „00012/001" mit nur einem „/" treffen nicht).
  { typ: ANKER_TYP.STEUERNR, re: /\b\d{2,3}\/\d{3}\/\d{4,5}\b/g },
  // Telefon: international (+49/0049) ODER national mit Vorwahl-Trenner. Trenner sind
  // Leerzeichen/Schrägstrich/Bindestrich — bewusst KEIN Punkt, damit Datumsangaben
  // („01.06.2026") und Dezimalbeträge nicht als Telefonnummer maskiert werden.
  { typ: NER_TYP.TELEFON, re: /(?:\+49|0049)[ /-]?(?:\d[ /-]?){6,14}\d/g },
  { typ: NER_TYP.TELEFON, re: /\b0\d{1,4}[ /-]\d[\d /-]{4,}\d/g },
];

// Überlappen sich zwei [start,end)-Bereiche?
function ueberlappt(a, b) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Erkennt PII-Muster im Text. Liefert die Treffer mit Position; überlappende Treffer
 * werden zugunsten des längeren (bei Gleichstand: des früher gefundenen) verworfen.
 * @param {string} text
 * @returns {{wert:string, typ:string, start:number, end:number}[]} nach Position sortiert.
 */
export function erkennePII(text) {
  const src = String(text == null ? '' : text);
  const roh = [];
  for (const { typ, re } of MUSTER) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const wert = m[0];
      if (wert) roh.push({ wert, typ, start: m.index, end: m.index + wert.length });
      if (m.index === re.lastIndex) re.lastIndex++; // Schutz gegen Leertreffer
    }
  }
  // Längere Treffer zuerst → bei Überlappung gewinnt der spezifischere/längere.
  roh.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  const behalten = [];
  for (const kand of roh) {
    if (!behalten.some((b) => ueberlappt(kand, b))) behalten.push(kand);
  }
  behalten.sort((a, b) => a.start - b.start);
  return behalten;
}

// Versieht einen NER-Typ — falls ein nicht-leerer Scope übergeben ist — mit dem
// Scope-Präfix (EXTERN_IBAN, EXTERN_EMAIL …). Ohne Scope bleibt der flache Typ erhalten
// (Rückwärtskompatibilität für den nicht-hierarchischen Pseudonym-Modus).
function mitScope(typ, scope) {
  const s = String(scope == null ? '' : scope).trim();
  return s ? `${s}_${typ}` : typ;
}

/**
 * Liefert die erkannten PII als entdoppelte Anker-Liste ({wert, typ}) für tokenize().
 * Ist `scope` gesetzt (z.B. `EXTERN`), tragen die Typen den Scope-Präfix, damit die
 * Fremd-PII im dreistufigen Briefkasten als externe, gruppierte Dritt-Identifikatoren
 * erscheint (siehe `EXTERN_SCOPE`). Ohne `scope` bleiben die Typen flach.
 * @param {string} text
 * @param {{scope?:string}} [options]
 * @returns {{wert:string, typ:string}[]}
 */
export function piiAnker(text, { scope } = {}) {
  const gesehen = new Set();
  const out = [];
  for (const { wert, typ } of erkennePII(text)) {
    if (gesehen.has(wert)) continue;
    gesehen.add(wert);
    out.push({ wert, typ: mitScope(typ, scope) });
  }
  return out;
}

/**
 * Kombiniert die exakten Stammdaten-Anker mit den im Text erkannten PII-Ankern.
 * Die exakten Anker stehen ZUERST → bei gleichem Wert behält `pseudonym.normalizeAnchors`
 * deren Typ (Stammdaten sind verlässlicher als die Heuristik). Reine Funktion.
 * `options.scope` reicht den Fremd-PII-Scope an `piiAnker()` durch (NER-Scoping im
 * Briefkasten-Modus); die exakten Anker bleiben unangetastet (sie tragen ihre eigenen
 * Hierarchie-Scopes bereits).
 * @param {{wert:string,typ?:string}[]} exakteAnker
 * @param {string} text
 * @param {{scope?:string}} [options]
 * @returns {{wert:string,typ:string}[]}
 */
export function kombiniereAnker(exakteAnker, text, { scope } = {}) {
  const exakt = Array.isArray(exakteAnker) ? exakteAnker : [];
  return [...exakt, ...piiAnker(text, { scope })];
}
