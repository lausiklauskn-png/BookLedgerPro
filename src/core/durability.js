// src/core/durability.js
// Datendurabilität = Pflicht-Feature #1 (Browser-Lehre 2: "IndexedDB ist
// persistent, aber nicht unsterblich"). Für eine Buchhaltung ist Datenverlust
// GoBD-rechtswidrig und existenzbedrohend — deshalb aktiv überwacht.

import { kvGet, kvSet } from './db.js';

const LAST_BACKUP_KEY = 'lastBackupAt';
const BACKUP_REMINDER_DAYS = 7;

/**
 * Bittet den Browser, den Speicher als "persistent" zu markieren.
 * Chrome gewährt das PWAs i.d.R. automatisch. Ergebnis sollte sichtbar gemacht
 * werden (Banner), damit der Nutzer "best effort"-Speicherung erkennt.
 */
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) {
    return { supported: false, persisted: false };
  }
  let persisted = await navigator.storage.persisted();
  if (!persisted) {
    try { persisted = await navigator.storage.persist(); } catch { /* ignore */ }
  }
  return { supported: true, persisted };
}

/** Liefert Speicher-Schätzung (Nutzung/Quote) zur Quota-Druck-Erkennung. */
export async function storageEstimate() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { supported: false };
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  const ratio = quota > 0 ? usage / quota : 0;
  return { supported: true, usage, quota, ratio, pressure: ratio > 0.8 };
}

export async function markBackupDone() {
  await kvSet(LAST_BACKUP_KEY, Date.now());
}

export async function getLastBackupAt() {
  return (await kvGet(LAST_BACKUP_KEY)) || null;
}

/**
 * Gesamt-Durabilitätsstatus für das Shell-Banner.
 * level: 'ok' | 'warn' | 'critical'
 */
export async function durabilityStatus() {
  const persist = await requestPersistence();
  const est = await storageEstimate();
  const lastBackup = await getLastBackupAt();
  const now = Date.now();
  const daysSinceBackup = lastBackup ? (now - lastBackup) / 86400000 : Infinity;

  const issues = [];
  if (persist.supported && !persist.persisted) issues.push('persist-denied');
  if (est.supported && est.pressure) issues.push('quota-pressure');
  if (!lastBackup) issues.push('no-backup');
  else if (daysSinceBackup > BACKUP_REMINDER_DAYS) issues.push('backup-stale');

  let level = 'ok';
  if (issues.includes('no-backup') || issues.includes('quota-pressure')) level = 'critical';
  else if (issues.length) level = 'warn';

  return { level, issues, persist, estimate: est, lastBackup, daysSinceBackup };
}

export const DURABILITY_PARAMS = { BACKUP_REMINDER_DAYS };
