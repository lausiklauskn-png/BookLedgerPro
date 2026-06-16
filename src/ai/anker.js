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
 * @returns {Promise<{wert:string,typ:string}[]>}
 */
export async function ladeAnker() {
  try {
    const [{ listKunden, listMitarbeiter }, { getSettings }] = await Promise.all([
      import('../domain/crm-store.js'),
      import('../state.js'),
    ]);
    const [kunden, mitarbeiter] = await Promise.all([
      listKunden().catch(() => []),
      listMitarbeiter().catch(() => []),
    ]);
    const firma = (getSettings() || {}).firma || {};
    return baueAnker({ kunden, mitarbeiter, firma });
  } catch {
    return [];
  }
}
