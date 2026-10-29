// src/domain/sicherungAnzeige.js — Farbe des Sicherungs-Eintrags in der Leiste (Klaus 2026-10-29: „jetzt sichern und dann die
// Bestätigung gesichert und dann vielleicht in den nächsten 10 Minuten nochmal anfragen, indem es rot wird … nicht als eine
// zusätzliche Leiste“). Rein, ohne DOM: grün nach einer Sicherung; rot, wenn nie gesichert, der Speicher knapp ist, die letzte
// Sicherung älter als eine Woche ist oder seit ihr etwas geändert wurde und mindestens 10 Minuten vergangen sind.

export const ERINNERN_NACH_MS = 10 * 60 * 1000;

/**
 * @param {{jetzt:number, letzteSicherung:number|null, geaendertAm:number, issues:string[]}} a
 * @returns {{farbe:'gruen'|'rot', grund:string}}
 */
export function sicherungStand({ jetzt, letzteSicherung, geaendertAm = 0, issues = [] }) {
  if (!letzteSicherung || issues.includes('no-backup')) return { farbe: 'rot', grund: 'nie' };
  if (issues.includes('quota-pressure')) return { farbe: 'rot', grund: 'speicher' };
  if (issues.includes('backup-stale')) return { farbe: 'rot', grund: 'alt' };
  if (geaendertAm > letzteSicherung && jetzt - letzteSicherung >= ERINNERN_NACH_MS) return { farbe: 'rot', grund: 'geaendert' };
  return { farbe: 'gruen', grund: 'ok' };
}

/** Uhrzeit heute, sonst Datum (kurz). */
export function sicherungZeit(ms, jetzt = Date.now()) {
  const d = new Date(ms), h = new Date(jetzt);
  const zwei = (n) => String(n).padStart(2, '0');
  if (d.toDateString() === h.toDateString()) return zwei(d.getHours()) + ':' + zwei(d.getMinutes());
  return zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.';
}
