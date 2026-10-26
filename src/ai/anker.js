// src/ai/anker.js
// Datenschutz-Modi, Bau-Schritt 2 — ANKER-QUELLE.
// Sammelt die EXAKTEN, bekannten Identifikatoren der eigenen Stammdaten (Kunden,
// Mitarbeiter, Firmenprofil) als typisierte Anker für `pseudonym.tokenize()`. Diese
// Anker sind das, was die App sicher als personenbezogen/eigen kennt — der Gegenpart
// zur „Anker = exakter Identifikator"-Regel des reinen Logik-Moduls.
//
// `baueAnker()` ist reine, node-getestete Logik. `ladeAnker()` zieht die Quellen aus
// dem verschlüsselten Speicher + den Settings (Browser/IndexedDB — nicht headless-E2E).

import { ANKER_TYP } from './pseudonym.js';

// Sehr kurze Werte (Initialen, „AG") richten mehr Lärm als Schutz an → verwerfen.
const MIN_LEN = 3;

function add(liste, gesehen, wert, typ) {
  const w = String(wert == null ? '' : wert).trim();
  if (w.length < MIN_LEN) return;
  if (gesehen.has(w)) return;
  gesehen.add(w);
  liste.push({ wert: w, typ });
}

/**
 * Baut die typisierte Anker-Liste aus den Stammdaten (rein, testbar).
 * @param {{kunden?:Array, mitarbeiter?:Array, firma?:object}} quellen
 * @returns {{wert:string, typ:string}[]} entdoppelt, Kurz-/Leerwerte verworfen.
 */
export function baueAnker({ kunden = [], mitarbeiter = [], firma = {} } = {}) {
  const liste = [];
  const gesehen = new Set();
  // Eigene Firma zuerst (taucht z.B. in Ausgangsrechnungs-Text auf).
  add(liste, gesehen, firma.name, ANKER_TYP.FIRMA);
  add(liste, gesehen, firma.anschrift, ANKER_TYP.ADRESSE);
  add(liste, gesehen, firma.iban, ANKER_TYP.IBAN);
  add(liste, gesehen, firma.ustId, ANKER_TYP.USTID);
  add(liste, gesehen, firma.steuernummer, ANKER_TYP.STEUERNR);
  for (const k of kunden) {
    add(liste, gesehen, k.name, ANKER_TYP.PERSON);
    add(liste, gesehen, k.email, ANKER_TYP.EMAIL);
    add(liste, gesehen, k.adresse, ANKER_TYP.ADRESSE);
    add(liste, gesehen, k.ustId, ANKER_TYP.USTID);
  }
  for (const m of mitarbeiter) add(liste, gesehen, m.name, ANKER_TYP.PERSON);
  return liste;
}

// Von Hand eingetragen (Klaus 2026-10-14, wie „Weitere Namen" im Sende-Prüfer und in
// Workflow-Needs): ein Mensch weiß, dass „Müller" ein Name ist und „Müller-Thurgau" ein Wein.
// Zwei Listen in den Einstellungen, je ein Eintrag pro Zeile:
//   kiWeitereNamen  — wird IMMER verdeckt (auch wenn es in keinen Stammdaten steht)
//   kiNieVerdecken  — bleibt wörtlich stehen und schirmt die Namen darin ab
const HAND_MIN = 2;
export const HAND_TYP = 'NAME';

/** Zerlegt den Inhalt eines Eingabefelds in Einträge (Zeilen, auch „;"), getrimmt, entdoppelt. */
export function handListe(eingabe) {
  const roh = Array.isArray(eingabe) ? eingabe : String(eingabe == null ? '' : eingabe).split(/[\n;]+/);
  const out = [], gesehen = new Set();
  for (const z of roh) {
    const w = String(z == null ? '' : z).trim();
    if (w.length < HAND_MIN || gesehen.has(w)) continue;
    gesehen.add(w); out.push(w);
  }
  return out;
}

/**
 * Die Anker aus den beiden Hand-Listen (rein, testbar). Schutz-Einträge kommen ZUERST,
 * damit bei gleichem Wort „nie verdecken" gewinnt.
 * @param {{kiWeitereNamen?:string[]|string, kiNieVerdecken?:string[]|string}} settings
 * @returns {{wert:string, typ:string, schutz?:true}[]}
 */
export function handAnker(settings = {}) {
  const schutz = handListe(settings.kiNieVerdecken).map((wert) => ({ wert, typ: 'SCHUTZ', schutz: true }));
  const namen = handListe(settings.kiWeitereNamen).map((wert) => ({ wert, typ: HAND_TYP }));
  return [...schutz, ...namen];
}

/**
 * Lädt die Anker aus dem verschlüsselten Speicher (Kunden, Mitarbeiter) + dem
 * Firmenprofil (Settings). Browser/IndexedDB — NICHT headless-E2E getestet.
 * Fällt bei Fehlern auf eine leere Liste zurück (kein Anker → keine Maskierung,
 * aber auch kein Absturz der Pipeline).
 *
 * Ist `text` gesetzt UND die Einstellung `nerPii` nicht ausdrücklich `false`, werden
 * zusätzlich im Text erkannte PII-Muster (E-Mail/IBAN/USt-IdNr/Steuernr./Telefon
 * Dritter, die NICHT in den Stammdaten stehen) als weitere Anker ergänzt — die
 * exakten Stammdaten-Anker behalten Vorrang (siehe `ner.kombiniereAnker`).
 *
 * Ist die Einstellung `briefkastenScopes === true`, werden die Stammdaten-Anker statt
 * flach über den **dreistufigen Briefkasten** (Mandant ⊃ Firma ⊃ Person, `ai/briefkasten.js`)
 * erzeugt → die Token tragen dann die Hierarchie (`[[FIRMA_2_IBAN_1]]`, `[[FIRMA_1_PERSON_1]]`).
 * Downstream bleibt alles gleich: es ist weiterhin eine `{wert,typ}[]`-Liste für `tokenize()`.
 * @param {string} [text] der vor dem KI-Versand zu maskierende Klartext.
 * @returns {Promise<{wert:string,typ:string}[]>}
 */
export async function ladeAnker(text) {
  try {
    const [{ listKunden, listMitarbeiter }, { getSettings }] = await Promise.all([
      import('../domain/crm-store.js'),
      import('../state.js'),
    ]);
    const [kunden, mitarbeiter] = await Promise.all([
      listKunden().catch(() => []),
      listMitarbeiter().catch(() => []),
    ]);
    const settings = getSettings() || {};
    const firma = settings.firma || {};
    let exakt;
    if (settings.briefkastenScopes === true) {
      const [{ baueBriefkasten, briefkastenAnker }, mandant] = await Promise.all([
        import('./briefkasten.js'),
        aktiverMandantInfo(),
      ]);
      exakt = briefkastenAnker(baueBriefkasten({ mandant, firma, kunden, mitarbeiter }));
    } else {
      exakt = baueAnker({ kunden, mitarbeiter, firma });
    }
    // Die Hand-Listen vorn: „nie verdecken" schlägt einen gleichnamigen Stammdaten-Anker.
    exakt = [...handAnker(settings), ...exakt];
    const scope = settings.briefkastenScopes === true ? (await import('./ner.js')).EXTERN_SCOPE : undefined;
    let liste = exakt;
    if (text && settings.nerPii !== false) {
      const { kombiniereAnker } = await import('./ner.js');
      // Im Briefkasten-Modus tragen die exakten Anker Hierarchie-Scopes → die Fremd-PII
      // wird unter dem externen Scope (EXTERN_*) gruppiert, damit sie sich sichtbar von
      // den bekannten Mandant-/Firmen-Entitäten abhebt. Im flachen Modus bleibt sie flach.
      liste = kombiniereAnker(exakt, text, { scope });
    }
    // Namen nach Muster (Klaus 2026-10-26, ai/namensmuster.js): Anrede, z. Hd./Ansprechpartner, Vor- + Nachname,
    // Firma mit Rechtsform. „Nie verdecken" schirmt ab; was schon exakt bekannt ist, bleibt beim exakten Anker.
    if (text && settings.namensmuster !== false) {
      const { musterAnker } = await import('./namensmuster.js');
      liste = [...liste, ...musterAnker(text, { schutz: handListe(settings.kiNieVerdecken), bekannt: liste.map((a) => a.wert), scope })];
    }
    return liste;
  } catch {
    return [];
  }
}

// Liest — best effort — den aktiven Mandanten (Name/ID) aus der unverschlüsselten
// Mandanten-Registry. Fehlt sie/schlägt fehl → `{}` (Briefkasten kommt ohne Mandant aus).
async function aktiverMandantInfo() {
  try {
    const [{ ladeRegistry }, { aktiverMandant }] = await Promise.all([
      import('../core/mandantenStore.js'),
      import('../domain/mandanten.js'),
    ]);
    const registry = await ladeRegistry();
    return aktiverMandant(registry) || {};
  } catch {
    return {};
  }
}
