// src/domain/backupStrategie.js
// Datensicherungs-Strategie (BAUPLAN Block 1/Schritt 3). REINE LOGIK ohne DOM/IndexedDB:
// welche Strategien es gibt, der Default, Normalisierung, die Ziel-Entscheidung
// (gemerkter Ordner vs. Download-Fallback) und der Backup-Dateiname.
//
// Datendurabilität ist Pflicht-Feature #1 (CLAUDE.md Regel #2): Das Ziel darf NIE
// blockieren — fehlt die File-System-Access-API (Tablet/iOS) oder wurde kein Ordner
// gemerkt, fällt jede Strategie konservativ auf den Download zurück.

/** Auswählbare Sicherungs-Strategien (im Onboarding + in den Einstellungen). */
export const BACKUP_STRATEGIEN = ['download', 'ordner'];

/** Default: Download — funktioniert in JEDEM Browser (auch ohne File System Access). */
export const DEFAULT_BACKUP_STRATEGIE = 'download';

/** Normalisiert einen beliebigen Wert auf eine gültige Strategie (sonst Default). */
export function normalizeBackupStrategie(v) {
  return BACKUP_STRATEGIEN.includes(v) ? v : DEFAULT_BACKUP_STRATEGIE;
}

/**
 * Entscheidet, WOHIN ein Backup tatsächlich geschrieben wird.
 * Nur `'ordner'`, wenn die Strategie das vorsieht UND die File-System-Access-API
 * verfügbar ist UND ein Zielordner gemerkt wurde — sonst konservativer
 * Download-Fallback (nie blockieren, Pflicht #1).
 * @returns {'ordner'|'download'}
 */
export function backupZiel({ strategie, ordnerApiVerfuegbar = false, hatOrdner = false } = {}) {
  if (normalizeBackupStrategie(strategie) === 'ordner' && ordnerApiVerfuegbar && hatOrdner) {
    return 'ordner';
  }
  return 'download';
}

/**
 * Stabiler, sortierbarer Backup-Dateiname mit lokalem Zeitstempel (Sekundengenau →
 * kollisionsarm bei mehreren Sicherungen am selben Tag).
 * Form: `bookledgerpro-backup-YYYY-MM-DD-HH-MM-SS.blpr.json`.
 */
export function backupDateiname(date = new Date()) {
  const stamp = date.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `bookledgerpro-backup-${stamp}.blpr.json`;
}

/**
 * Erkennt eine BookLedgerPro-Sicherung an Dateiname ODER Inhalt — für den
 * Drag-and-drop-Restore, um eine fallengelassene Datei freundlich vorzufiltern,
 * BEVOR das Passwort abgefragt wird. Reine Heuristik (die echte Prüfung macht
 * `core/backup.readBackup` beim Entschlüsseln).
 */
export function istBackupDatei({ name = '', text = '' } = {}) {
  if (/\.blpr\.json$/i.test(name)) return true;
  // Roher JSON-Export ohne `.blpr`-Endung: am Magic im Klartext-Umschlag erkennen.
  if (/\.json$/i.test(name) && /"magic"\s*:\s*"BLPR-BACKUP"/.test(text)) return true;
  return false;
}
