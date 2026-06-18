// src/core/sandboxStore.js
// Store-Glue für den Test-Modus (Sandbox-Tresore) — die DÜNNE IndexedDB-/Verdrahtungs-
// schicht über dem reinen Sandbox-Kern (domain/mandanten.js) und der Registry-Persistenz
// (core/mandantenStore.js). Spezifikation: docs/TEST_MODUS.md.
//
// Aufgabenteilung (verbindlich, damit testbar):
//  • REINE Lebenszyklus-Logik (Sandbox erzeugen/auflisten/entfernen, DB-Namensbildung,
//    Auswahl des nachrückenden aktiven Mandanten, „welche DBs gehören zu Tests", verwaiste
//    Test-DBs) lebt im Kern `domain/mandanten.js` und ist NODE-GETESTET.
//  • DIESES Modul macht nur die IndexedDB-Operationen (`deleteDatabase`, `databases()`) und
//    verdrahtet sie mit Registry-Persistenz + aktiver Tresor-DB. Diese Glue-Pfade sind
//    „statisch geprüft" (kein Headless-Browser in der Build-Umgebung).
//
// Sicherheits-Invarianten (docs/TEST_MODUS.md):
//  • Echte Daten unberührt: Sandbox-Tresore sind EIGENE DBs (eigener Namens-Infix), das
//    Suffix `bookledgerpro` bleibt (Regel #3). Gelöscht/geleert werden NUR Sandbox-DBs.
//  • Belt & suspenders: verworfene Tests werden gelöscht UND verwaiste Sandbox-DBs beim
//    Start vorsorglich entfernt (falls die App mal abstürzt) — nie eine echte/aktive DB.

import { setActiveDbName, closeDb, getActiveDbName } from './db.js';
import { lockVault } from './vault.js';
import { ladeRegistry, speichereRegistry } from './mandantenStore.js';
import {
  erstelleSandbox, dbNameVon, addMandant, setzeAktiv, entferneMandant, findeMandant,
  istSandbox, entferneAlleSandboxes, sandboxDbNamen, verwaisteSandboxDbs, aktiveDbName,
  echteMandanten,
} from '../domain/mandanten.js';

// ---- IndexedDB-Primitive (reine Browser-API-Wrapper) -----------------------

/**
 * Promise-Wrapper um `indexedDB.deleteDatabase`. Hält bei `onblocked` (anderer Tab hält die
 * DB offen) NICHT ewig fest, sondern löst best-effort auf — die DB wird gelöscht, sobald sie
 * frei ist; das Aufräum-Versprechen soll den Boot/UI-Fluss nicht blockieren.
 */
export function deleteDatabase(name) {
  return new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.deleteDatabase(name); }
    catch (e) { reject(e); return; }
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

/**
 * Namen aller vorhandenen IndexedDBs (für das Aufräumen verwaister Test-DBs). Nutzt
 * `indexedDB.databases()`; fehlt die API (ältere Browser), wird `[]` zurückgegeben — das
 * Aufräumen entfällt dann still (kein Fehler), die Registry-basierten Pfade bleiben aktiv.
 */
export async function vorhandeneDbNamen() {
  if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') return [];
  try {
    const dbs = await indexedDB.databases();
    return (dbs ?? []).map((d) => d?.name).filter((n) => typeof n === 'string');
  } catch {
    return [];
  }
}

// ---- Lebenszyklus eines Sandbox-Tresors ------------------------------------

/**
 * Legt einen NEUEN, leeren Sandbox-Tresor an: registriert ihn als Sandbox-Mandant, setzt
 * ihn AKTIV, verwirft den Sitzungs-DEK und schaltet die aktive DB auf die (noch leere)
 * Sandbox-DB. Der eigentliche Tresor (Passwort/DEK) wird danach im Onboarding der neuen DB
 * angelegt — analog zum „zweiten Mandanten" (core/mandantenStore.js). Es wird KEIN echter
 * Mandant berührt; echte Daten bleiben in ihren eigenen DBs unangetastet.
 * @returns {Promise<{registry, mandant}>}
 */
export async function erstelleSandboxTresor(name) {
  const registry = await ladeRegistry();
  const mandant = erstelleSandbox(name);
  // Explizit aktiv setzen: `addMandant` macht nur den ERSTEN Mandanten aktiv; hier existiert
  // bereits ein echter Mandant, daher wird die neue Sandbox bewusst zum aktiven Tresor.
  const next = setzeAktiv(addMandant(registry, mandant), mandant.id);
  lockVault();           // Sitzungs-Key (DEK) sauber verwerfen
  closeDb();             // altes DB-Handle schließen
  setActiveDbName(dbNameVon(mandant)); // eigener Sandbox-Infix (Regel #3: Suffix bleibt)
  await speichereRegistry(next);
  return { registry: next, mandant };
}

/**
 * Wechselt in einen vorhandenen Sandbox-Tresor: DEK verwerfen, DB-Handle schließen, aktive
 * DB auf die Sandbox-DB (Sandbox-Flag via `dbNameVon` beachtet) ausrichten, Auswahl
 * persistieren. Das Entsperren (Passwort) erfolgt anschließend im Sperrbildschirm. Verweigert
 * NICHT-Sandbox-IDs, damit dieser Test-Pfad nie versehentlich einen echten Mandanten lädt.
 * @returns {Promise<{registry, aktiv: string}>}
 */
export async function wechsleZuSandbox(id) {
  const registry = await ladeRegistry();
  const mandant = findeMandant(registry, id);
  if (!mandant) throw new Error('Test-Tresor nicht gefunden');
  if (!istSandbox(mandant)) throw new Error('Kein Test-Tresor: ' + id);
  const next = setzeAktiv(registry, id);
  lockVault();
  closeDb();
  setActiveDbName(dbNameVon(mandant));
  await speichereRegistry(next);
  return { registry: next, aktiv: id };
}

/**
 * Leert einen Sandbox-Tresor (Inhalt weg, Listen-Eintrag bleibt): löscht die Sandbox-DB
 * vollständig — beim nächsten Betreten entsteht ein frischer, leerer Test (neues Onboarding/
 * Passwort). War die DB aktiv, werden vorher Sitzungs-Key und Handle sauber verworfen.
 * Verweigert das Leeren von NICHT-Sandbox-Tresoren (echte Daten unberührt).
 * @returns {Promise<{registry}>}
 */
export async function leereSandboxTresor(id) {
  const registry = await ladeRegistry();
  const mandant = findeMandant(registry, id);
  if (!mandant) throw new Error('Test-Tresor nicht gefunden');
  if (!istSandbox(mandant)) throw new Error('Nur Test-Tresore können geleert werden');
  const dbName = dbNameVon(mandant);
  if (getActiveDbName() === dbName) { lockVault(); closeDb(); }
  await deleteDatabase(dbName);
  return { registry };
}

/**
 * Löscht einen Sandbox-Tresor vollständig: entfernt ihn aus der Registry UND löscht die
 * zugehörige IndexedDB. War er aktiv, rückt (über `entferneMandant`) der erste verbleibende
 * Mandant nach; die aktive DB wird über `aktiveDbName` (Sandbox-Flag beachtet, Legacy-
 * Fallback) wieder ausgerichtet. Verweigert NICHT-Sandbox-Tresore (echte Daten unberührt).
 * @returns {Promise<{registry, aktiv: string|null}>}
 */
export async function loescheSandboxTresor(id) {
  const registry = await ladeRegistry();
  const mandant = findeMandant(registry, id);
  if (!mandant) throw new Error('Test-Tresor nicht gefunden');
  if (!istSandbox(mandant)) throw new Error('Nur Test-Tresore können hier gelöscht werden');
  const dbName = dbNameVon(mandant);
  const next = entferneMandant(registry, id);
  if (getActiveDbName() === dbName) {
    lockVault();
    closeDb();
    setActiveDbName(aktiveDbName(next)); // nachrückender Mandant (oder Legacy-Default)
  }
  await deleteDatabase(dbName);
  await speichereRegistry(next);
  return { registry: next, aktiv: next.aktiv };
}

/**
 * „Alle Tests löschen": entfernt alle Sandbox-Tresore aus der Registry und löscht ihre DBs.
 * War ein Sandbox aktiv, rückt ein echter Mandant nach (`entferneAlleSandboxes`) und die
 * aktive DB wird darauf ausgerichtet. Echte Mandanten und deren DBs bleiben unberührt.
 * @returns {Promise<{registry, geloescht: string[]}>}
 */
export async function loescheAlleSandboxes() {
  const registry = await ladeRegistry();
  const dbNamen = sandboxDbNamen(registry);     // nur Sandbox-DBs (node-getestet)
  const next = entferneAlleSandboxes(registry); // echte bleiben, aktiv rückt ggf. nach
  if (dbNamen.includes(getActiveDbName())) {
    lockVault();
    closeDb();
    setActiveDbName(aktiveDbName(next));
  }
  for (const name of dbNamen) await deleteDatabase(name);
  await speichereRegistry(next);
  return { registry: next, geloescht: dbNamen };
}

/**
 * „Test behalten und verlassen": schaltet den aktiven Tresor von einem Sandbox-Test zurück
 * auf einen ECHTEN Mandanten (den ersten registrierten), damit der nächste Start in der
 * echten Welt landet — der Test selbst BLEIBT erhalten (Listeneintrag + DB) und ist über
 * den „🧪 Tests"-Bereich wieder erreichbar (weitertesten, wo man war). Existiert kein echter
 * Mandant (nur Tests), bleibt alles unverändert. Sitzungs-Key + DB-Handle werden verworfen.
 * @returns {Promise<{registry, aktiv: string|null}>}
 */
export async function behalteUndVerlasseSandbox() {
  const registry = await ladeRegistry();
  const echte = echteMandanten(registry);
  if (!echte.length) return { registry, aktiv: registry.aktiv };
  const next = setzeAktiv(registry, echte[0].id);
  lockVault();
  closeDb();
  setActiveDbName(aktiveDbName(next)); // echter Mandant (Sandbox-Flag in dbNameVon beachtet)
  await speichereRegistry(next);
  return { registry: next, aktiv: next.aktiv };
}

/**
 * Boot-Aufräumen (belt & suspenders): löscht VERWAISTE Sandbox-DBs — am Namen als Sandbox
 * erkennbar, aber nicht (mehr) in der Registry geführt (z. B. nach einem Absturz). Die
 * Auswahl trifft die reine, node-getestete `verwaisteSandboxDbs`; die aktive DB ist sicher
 * ausgeschlossen. Fehlt `indexedDB.databases()`, passiert nichts (kein Fehler). Best-effort —
 * Fehler einzelner Löschungen werden geschluckt, damit der Boot nie hängen bleibt.
 * @returns {Promise<string[]>} tatsächlich gelöschte DB-Namen.
 */
export async function raeumeVerwaisteSandboxesAuf() {
  const registry = await ladeRegistry();
  const namen = await vorhandeneDbNamen();
  const verwaist = verwaisteSandboxDbs(namen, registry).filter((n) => n !== getActiveDbName());
  const geloescht = [];
  for (const name of verwaist) {
    try { await deleteDatabase(name); geloescht.push(name); }
    catch { /* best-effort: nächste DB weiter aufräumen */ }
  }
  return geloescht;
}
