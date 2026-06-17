// src/domain/mandanten.js
// Mehrmandanten-Fundament (M1) — REINE Schicht, ohne IndexedDB-Zugriff.
//
// Architektur (siehe docs/NACHFOLGE_PLAN.md, Abschnitt A): 1 Mandant = 1 eigener,
// getrennt verschlüsselter Tresor. Getrennte Tresore statt Record-Namespacing →
// KEINE Kreuz-Kontamination, passt zum Krypto-Modell, schützt die Datendurabilität
// (Regel #2). Die Trennung geschieht über einen **Mandanten-Präfix im IndexedDB-
// Namen** — das App-weite Suffix `bookledgerpro` bleibt dabei UNVERÄNDERT (Regel #3),
// damit es weiterhin keine Origin-Kollision mit Geschwister-Apps gibt.
//
// Diese Datei enthält bewusst NUR reine Funktionen (Registry-Datenmodell, Auswahl
// des aktiven Mandanten, Namensbildung für den Speicher). Die eigentliche Tresor-
// Umverdrahtung (Anlegen/Wechseln am Sperrbildschirm) folgt in M2 — hier wird noch
// kein Tresor angefasst.

import { DB_SUFFIX } from '../core/db.js';

// Der bestehende Einzel-Tresor liegt in der DB `blpr_bookledgerpro`. Damit M2
// **migrationsfrei** bleiben kann, bekommt dieser Bestand die feste Legacy-ID und
// behält exakt seinen alten DB-Namen (siehe `dbNameFuer`).
export const LEGACY_MANDANT_ID = 'standard';

// Basis-/Legacy-Name — identisch mit `LEGACY_DB_NAME` aus core/db.js. Nicht verändern.
export const LEGACY_DB_NAME = `blpr_${DB_SUFFIX}`;

// Eigene, UNVERSCHLÜSSELTE kv-DB für die Mandanten-Registry. Muss vor dem Entsperren
// lesbar sein (Auswahl am Sperrbildschirm) und ist von den Tresor-DBs getrennt. Das
// Suffix bleibt erhalten (Regel #3 → keine Origin-Kollision mit Geschwister-Apps).
export const REGISTRY_DB_NAME = `blpr_mandanten_${DB_SUFFIX}`;

// Erlaubte Mandant-IDs: kurze, URL-/DB-sichere Kennungen.
const ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const NAME_MAX = 60;

/**
 * Bildet den IndexedDB-Namen für einen Mandanten. Der Legacy-Mandant (oder eine
 * leere ID) behält den unveränderten Bestandsnamen — so bleibt der vorhandene
 * Tresor ohne Migration erreichbar. Jeder Name endet mit dem Suffix `bookledgerpro`
 * (Regel #3), damit keine Origin-Kollision mit Geschwister-Apps entsteht.
 */
export function dbNameFuer(mandantId) {
  if (!mandantId || mandantId === LEGACY_MANDANT_ID) return LEGACY_DB_NAME;
  if (!ID_RE.test(mandantId)) throw new Error(`Ungültige Mandant-ID: ${mandantId}`);
  return `blpr_${mandantId}_${DB_SUFFIX}`;
}

/** Erzeugt eine zufällige, DB-sichere Mandant-ID (8 Hex-Zeichen). */
export function neueMandantId() {
  const buf = new Uint8Array(4);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(buf);
  else for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Prüft einen Mandantennamen. Gibt eine Fehlermeldung zurück oder `null`, wenn ok. */
export function validateMandantName(name) {
  const n = (name ?? '').trim();
  if (n.length < 1) return 'Name darf nicht leer sein.';
  if (n.length > NAME_MAX) return `Name zu lang (max. ${NAME_MAX} Zeichen).`;
  return null;
}

/**
 * Baut einen Mandanten-Datensatz `{id, name, erstellt}`. `id`/`erstellt` können für
 * deterministische Tests bzw. den Legacy-Bestand übergeben werden.
 */
export function erstelleMandant(name, { id, erstellt } = {}) {
  const fehler = validateMandantName(name);
  if (fehler) throw new Error(fehler);
  const mid = id ?? neueMandantId();
  if (!ID_RE.test(mid)) throw new Error(`Ungültige Mandant-ID: ${mid}`);
  return { id: mid, name: String(name).trim(), erstellt: erstellt ?? Date.now() };
}

/** Leere Registry: keine Mandanten, keiner aktiv. */
export function leereRegistry() {
  return { mandanten: [], aktiv: null };
}

/** Findet einen Mandanten anhand der ID (oder `null`). */
export function findeMandant(registry, id) {
  return registry?.mandanten?.find((m) => m.id === id) ?? null;
}

/** Liefert den aktiven Mandanten-Datensatz (oder `null`). */
export function aktiverMandant(registry) {
  return findeMandant(registry, registry?.aktiv);
}

/**
 * Fügt einen Mandanten hinzu (immutabel — gibt eine neue Registry zurück). Der erste
 * hinzugefügte Mandant wird automatisch aktiv. IDs müssen eindeutig sein.
 */
export function addMandant(registry, mandant) {
  if (!mandant?.id) throw new Error('Mandant ohne ID');
  if (findeMandant(registry, mandant.id)) throw new Error(`Mandant-ID schon vergeben: ${mandant.id}`);
  const mandanten = [...registry.mandanten, mandant];
  return { mandanten, aktiv: registry.aktiv ?? mandant.id };
}

/** Benennt einen Mandanten um (immutabel). */
export function umbenenneMandant(registry, id, neuerName) {
  const fehler = validateMandantName(neuerName);
  if (fehler) throw new Error(fehler);
  if (!findeMandant(registry, id)) throw new Error('Mandant nicht gefunden');
  const mandanten = registry.mandanten.map((m) =>
    m.id === id ? { ...m, name: String(neuerName).trim() } : m
  );
  return { mandanten, aktiv: registry.aktiv };
}

/**
 * Entfernt einen Mandanten aus der Registry (immutabel). Hinweis: Das Löschen der
 * zugehörigen Tresor-DB ist NICHT Teil dieser reinen Schicht (M2/M3). War der
 * entfernte Mandant aktiv, rückt der erste verbleibende nach (oder `null`).
 */
export function entferneMandant(registry, id) {
  const mandanten = registry.mandanten.filter((m) => m.id !== id);
  if (mandanten.length === registry.mandanten.length) throw new Error('Mandant nicht gefunden');
  let aktiv = registry.aktiv;
  if (aktiv === id) aktiv = mandanten[0]?.id ?? null;
  return { mandanten, aktiv };
}

/** Setzt den aktiven Mandanten (immutabel). Die ID muss existieren. */
export function setzeAktiv(registry, id) {
  if (!findeMandant(registry, id)) throw new Error('Mandant nicht gefunden');
  return { mandanten: registry.mandanten, aktiv: id };
}

/**
 * Stellt sicher, dass der vorhandene Einzel-Tresor als Legacy-Mandant registriert ist
 * (migrationsfrei). Ist die Registry leer, wird der Bestand als „Mandant 1" mit der
 * festen Legacy-ID aufgenommen und aktiv gesetzt. Vorhandene Registries bleiben
 * unverändert. Reine Funktion — legt nichts an, sondern beschreibt nur den Sollzustand.
 */
export function mitLegacyMandant(registry, { name = 'Mandant 1', erstellt } = {}) {
  if (registry?.mandanten?.length) return registry;
  const legacy = erstelleMandant(name, { id: LEGACY_MANDANT_ID, erstellt: erstellt ?? 0 });
  return addMandant(leereRegistry(), legacy);
}
