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

// Test-Modus (Sandbox-Tresor): eigener, wegwerfbarer Tresor-Infix. Ein Sandbox-Mandant
// trägt das Flag `sandbox:true` und liegt in einer DB mit eigenem Namens-Infix
// `blpr_sandbox_<id>_bookledgerpro` — so sind verwaiste Test-DBs auch OHNE Registry am
// Namen erkennbar (Aufräum-Sicherheit, docs/TEST_MODUS.md). Suffix bleibt (Regel #3).
export const SANDBOX_INFIX = 'sandbox';

/**
 * Bildet den IndexedDB-Namen für einen Mandanten. Der Legacy-Mandant (oder eine
 * leere ID) behält den unveränderten Bestandsnamen — so bleibt der vorhandene
 * Tresor ohne Migration erreichbar. Sandbox-Tresore (`{ sandbox:true }`) bekommen den
 * eigenen Infix und werden NIE auf die Legacy-/Bestands-DB abgebildet. Jeder Name endet
 * mit dem Suffix `bookledgerpro` (Regel #3), damit keine Origin-Kollision mit
 * Geschwister-Apps entsteht.
 */
export function dbNameFuer(mandantId, { sandbox = false } = {}) {
  if (!sandbox && (!mandantId || mandantId === LEGACY_MANDANT_ID)) return LEGACY_DB_NAME;
  if (!ID_RE.test(mandantId)) throw new Error(`Ungültige Mandant-ID: ${mandantId}`);
  return sandbox
    ? `blpr_${SANDBOX_INFIX}_${mandantId}_${DB_SUFFIX}`
    : `blpr_${mandantId}_${DB_SUFFIX}`;
}

/** DB-Name AUS einem Mandanten-Datensatz (berücksichtigt das `sandbox`-Flag). */
export function dbNameVon(mandant) {
  if (!mandant?.id) throw new Error('Mandant ohne ID');
  return dbNameFuer(mandant.id, { sandbox: !!mandant.sandbox });
}

/** Ob ein DB-Name ein Sandbox-Tresor ist (am Namens-Infix erkennbar, ohne Registry). */
export function istSandboxDbName(name) {
  return typeof name === 'string'
    && name.startsWith(`blpr_${SANDBOX_INFIX}_`)
    && name.endsWith(`_${DB_SUFFIX}`);
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

/** Ob ein Mandant ein Sandbox-/Test-Tresor ist. */
export const istSandbox = (mandant) => !!mandant?.sandbox;

/** Nur die ECHTEN Mandanten (ohne Sandbox-/Test-Tresore). */
export function echteMandanten(registry) {
  return (registry?.mandanten ?? []).filter((m) => !istSandbox(m));
}

/** Nur die Sandbox-/Test-Tresore. */
export function sandboxMandanten(registry) {
  return (registry?.mandanten ?? []).filter((m) => istSandbox(m));
}

/**
 * Baut einen Sandbox-Mandanten-Datensatz `{id, name, erstellt, sandbox:true}`.
 * Wie `erstelleMandant`, nur als Test-Tresor markiert (eigene DB, wegwerfbar).
 */
export function erstelleSandbox(name, opts = {}) {
  return { ...erstelleMandant(name, opts), sandbox: true };
}

/**
 * Entscheidet, ob am Sperrbildschirm eine Mandanten-Auswahl VOR dem Entsperren nötig
 * ist (M2b). Reine Funktion (node-getestet). Bei genau einem (oder keinem) ECHTEN
 * Mandanten bleibt es beim direkten Entsperren/Onboarding — verhaltensneutral für
 * Bestandsnutzer. Sandbox-Tresore zählen NICHT mit (eigener „Tests"-Bereich).
 */
export function brauchtMandantenAuswahl(registry) {
  return echteMandanten(registry).length > 1;
}

/**
 * Liefert die ECHTEN Mandanten als anzeige-fertige, stabil sortierte Liste (ältester
 * zuerst, Name als Tiebreak) inkl. `aktiv`-Markierung. Reine Funktion (immutabel,
 * node-getestet) — die UI am Sperrbildschirm baut daraus die Auswahlliste. Sandbox-
 * Tresore erscheinen hier NICHT (sie leben im separaten „Tests"-Bereich).
 */
export function mandantenAuswahlListe(registry) {
  return sortierteAuswahl(echteMandanten(registry), registry?.aktiv ?? null);
}

/**
 * Liefert die Sandbox-/Test-Tresore als anzeige-fertige, stabil sortierte Liste
 * (ältester zuerst) inkl. `aktiv`-Markierung — für den „🧪 Tests"-Bereich der UI.
 */
export function sandboxAuswahlListe(registry) {
  return sortierteAuswahl(sandboxMandanten(registry), registry?.aktiv ?? null);
}

/**
 * Liefert den AKTIVEN Mandanten nur dann, wenn er ein Sandbox-/Test-Tresor ist (sonst
 * `null`). Grundlage für den dauerhaften TEST-MODUS-Banner und den „behalten/verwerfen"-
 * Dialog beim Verlassen — die UI muss wissen, ob gerade in einem Test gearbeitet wird.
 * Reine Funktion (node-getestet).
 */
export function aktiverSandbox(registry) {
  const m = aktiverMandant(registry);
  return istSandbox(m) ? m : null;
}

/**
 * Schlägt einen fortlaufenden Default-Namen für einen NEUEN Test vor („Test 1", „Test 2", …).
 * Wertet vorhandene „<prefix> N"-Namen aus und nimmt das Maximum + 1, damit nach dem Löschen
 * einzelner Tests kein unmittelbarer Namens-Doppler entsteht. Reine Funktion (node-getestet).
 */
export function naechsterTestName(registry, prefix = 'Test') {
  const re = new RegExp(`^${prefix} (\\d+)$`);
  let max = 0;
  for (const m of sandboxMandanten(registry)) {
    const treffer = re.exec((m?.name ?? '').trim());
    if (treffer) max = Math.max(max, Number(treffer[1]));
  }
  return `${prefix} ${max + 1}`;
}

/** Gemeinsame Sortier-/Projektions-Hilfe für die Auswahl-Listen. */
function sortierteAuswahl(mandanten, aktiv) {
  return [...mandanten]
    .sort((a, b) => (a.erstellt - b.erstellt) || a.name.localeCompare(b.name))
    .map((m) => ({ id: m.id, name: m.name, erstellt: m.erstellt, aktiv: m.id === aktiv, sandbox: !!m.sandbox }));
}

/**
 * Entfernt ALLE Sandbox-Tresore aus der Registry (immutabel) — „Alle Tests löschen".
 * Das Löschen der zugehörigen DBs ist Sache der Store-Schicht (`dbNameVon` je Sandbox).
 * War ein Sandbox-Tresor aktiv, rückt der erste verbleibende (echte) Mandant nach.
 */
export function entferneAlleSandboxes(registry) {
  const mandanten = echteMandanten(registry);
  let aktiv = registry?.aktiv ?? null;
  if (aktiv && !mandanten.some((m) => m.id === aktiv)) aktiv = mandanten[0]?.id ?? null;
  return { mandanten, aktiv };
}

/**
 * Aufräum-Sicherheit (belt & suspenders): liefert aus einer Liste vorhandener
 * IndexedDB-Namen die VERWAISTEN Sandbox-DBs — am Namen als Sandbox erkennbar, aber in
 * der Registry nicht (mehr) referenziert (z. B. nach einem Absturz). Diese dürfen beim
 * Start vorsorglich gelöscht werden. Reine Funktion.
 */
export function verwaisteSandboxDbs(dbNamen, registry) {
  const bekannt = new Set(sandboxMandanten(registry).map((m) => dbNameVon(m)));
  return (dbNamen ?? []).filter((n) => istSandboxDbName(n) && !bekannt.has(n));
}

/**
 * Liefert die DB-Namen ALLER in der Registry geführten Sandbox-Tresore (Sandbox-Flag
 * beachtet). Die Store-Schicht löscht damit beim „Alle Tests löschen" gezielt nur die
 * Test-DBs — echte Mandanten-DBs sind nie dabei. Reine Funktion.
 */
export function sandboxDbNamen(registry) {
  return sandboxMandanten(registry).map((m) => dbNameVon(m));
}

/**
 * DB-Name des AKTIVEN Mandanten — berücksichtigt das `sandbox`-Flag (über `dbNameVon`).
 * Fällt auf die Legacy-/Bestands-DB zurück, wenn keiner aktiv ist (z. B. nachdem der
 * aktive Test-Tresor gelöscht wurde und kein Mandant nachrückt). Reine Funktion; die
 * Store-Schicht richtet die aktive DB damit nach Lösch-/Wechsel-Operationen wieder aus.
 */
export function aktiveDbName(registry) {
  const m = aktiverMandant(registry);
  return m ? dbNameVon(m) : LEGACY_DB_NAME;
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
