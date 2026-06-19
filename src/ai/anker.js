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
    if (text && settings.nerPii !== false) {
      const { kombiniereAnker, EXTERN_SCOPE } = await import('./ner.js');
      // Im Briefkasten-Modus tragen die exakten Anker Hierarchie-Scopes → die Fremd-PII
      // wird unter dem externen Scope (EXTERN_*) gruppiert, damit sie sich sichtbar von
      // den bekannten Mandant-/Firmen-Entitäten abhebt. Im flachen Modus bleibt sie flach.
      const scope = settings.briefkastenScopes === true ? EXTERN_SCOPE : undefined;
      return kombiniereAnker(exakt, text, { scope });
    }
    return exakt;
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
