// src/core/mandantenStore.js
// Persistenz + Laufzeit-Glue für die Mehrmandanten-Registry (M2).
//
// Die Registry liegt in einer EIGENEN, UNVERSCHLÜSSELTEN kv-DB (`REGISTRY_DB_NAME`),
// getrennt von den per Mandant verschlüsselten Tresor-DBs. Grund: Die Mandanten-Liste
// muss VOR dem Entsperren lesbar sein (Auswahl am Sperrbildschirm). Konsequenz: die
// Mandanten-NAMEN sind unverschlüsselt — im UI ist darauf hinzuweisen, es dürfen keine
// personenbezogenen Pflichtangaben im Namen erzwungen werden. Tresor-INHALTE bleiben
// pro Mandant verschlüsselt (eigener DEK/Passwort/Shamir/Backup).
//
// Reine Logik (Registry-Datenmodell, Namensbildung, Legacy-Seed) lebt in
// `domain/mandanten.js` und ist node-getestet. Dieses Modul ist die dünne IndexedDB-
// und Verdrahtungsschicht (DOM/IndexedDB → statisch geprüft, kein Headless-Browser).

import { setActiveDbName, closeDb } from './db.js';
import { lockVault, vaultExists } from './vault.js';
import {
  REGISTRY_DB_NAME, LEGACY_MANDANT_ID, leereRegistry, mitLegacyMandant,
  dbNameFuer, addMandant, setzeAktiv, erstelleMandant,
} from '../domain/mandanten.js';

const STORE = 'kv';
const KEY = 'registry';
let _p = null;

function openRegistryDb() {
  if (_p) return _p;
  _p = new Promise((resolve, reject) => {
    const req = indexedDB.open(REGISTRY_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _p;
}

/** Lädt die Registry (oder eine leere, falls noch keine existiert). */
export async function ladeRegistry() {
  const db = await openRegistryDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
    r.onsuccess = () => resolve(r.result || leereRegistry());
    r.onerror = () => reject(r.error);
  });
}

/** Speichert die Registry. */
export async function speichereRegistry(registry) {
  const db = await openRegistryDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readwrite').objectStore(STORE).put(registry, KEY);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

/**
 * Boot-Schritt: stellt sicher, dass der bestehende Einzel-Tresor migrationsfrei als
 * „Mandant 1" (ID `standard`) registriert ist, wählt den aktiven Mandanten und richtet
 * die aktive Tresor-DB (`setActiveDbName`) darauf aus.
 *
 * Verhalten:
 *  - Registry vorhanden → aktiven Mandanten anwenden.
 *  - Registry leer, aber Legacy-Tresor existiert (Bestandsnutzer ODER frisch onboardeter
 *    Nutzer) → als „Mandant 1" registrieren (Legacy-DB-Name bleibt) und aktiv setzen.
 *  - Registry leer und kein Tresor (frische Installation) → nichts registrieren; das
 *    Onboarding legt den ersten Tresor in der Legacy-DB an, der beim nächsten Boot
 *    automatisch registriert wird. Aktive DB bleibt der Legacy-Default.
 *
 * @returns {Promise<{registry, aktiv: string|null}>}
 */
export async function initMandanten() {
  let registry = await ladeRegistry();

  if (!registry.mandanten.length) {
    // Default zeigt bereits auf die Legacy-DB → dort nach einem Tresor schauen.
    setActiveDbName(dbNameFuer(LEGACY_MANDANT_ID)); // = Legacy-Name (No-op)
    if (await vaultExists()) {
      registry = mitLegacyMandant(leereRegistry());
      await speichereRegistry(registry);
    }
  }

  if (registry.aktiv) setActiveDbName(dbNameFuer(registry.aktiv));
  return { registry, aktiv: registry.aktiv };
}

/**
 * Registriert einen NEUEN Mandanten (Name) und persistiert die Registry. Legt KEINEN
 * Tresor an — das geschieht anschließend beim Onboarding der neuen Mandanten-DB.
 * @returns {Promise<{registry, mandant}>}
 */
export async function registriereMandant(name) {
  const registry = await ladeRegistry();
  const mandant = erstelleMandant(name);
  const next = addMandant(registry, mandant);
  await speichereRegistry(next);
  return { registry: next, mandant };
}

/**
 * Wechselt den aktiven Mandanten: verwirft den Sitzungs-DEK (`lockVault`), schließt die
 * alte DB-Verbindung, richtet die aktive DB auf den Ziel-Mandanten aus und persistiert
 * die Auswahl. Das eigentliche Entsperren (Passwort) erfolgt danach im Sperrbildschirm.
 * @returns {Promise<{registry, aktiv: string}>}
 */
export async function wechsleAktivenMandant(id) {
  const registry = await ladeRegistry();
  const next = setzeAktiv(registry, id); // wirft, wenn unbekannt
  lockVault();           // Sitzungs-Key (DEK) sauber verwerfen
  closeDb();             // altes DB-Handle schließen
  setActiveDbName(dbNameFuer(id));
  await speichereRegistry(next);
  return { registry: next, aktiv: id };
}
