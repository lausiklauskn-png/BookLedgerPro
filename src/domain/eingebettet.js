// src/domain/eingebettet.js — reine Helfer für die eingebetteten Apps (Workflow Calculate/Needs, Klaus 2026-10-26).
// Node-getestet (tests/run.mjs); die Oberfläche steht in src/ui/views/apps.js.
import { parseUebernahmeParam } from './uebernahmeExtern.js';

export const APPS_VORRAT = 'blpr-apps';   // Cache-Name in sw.js (BLEIBT): die App-Dateien, getrennt von der BLP-Schale
export const APP_FARBEN = ['blau', 'graphit', 'petrol'];

/** Thema-Nachricht an einen App-Rahmen: hell/dunkel kennen die Apps selbst (data-theme), die Farbe setzt apps/blp-thema.css. */
export function themaNachricht(theme, farbe) {
  return { typ: 'blp-thema', theme: theme === 'dark' ? 'dark' : 'light', farbe: APP_FARBEN.includes(farbe) ? farbe : 'blau' };
}

/** Übergabe aus einer eingebetteten App: die Adresse, die die App sonst aufgerufen hätte (…/BookLedgerPro/?uebernahme=…). */
export function uebernahmeAusAdresse(url) {
  try { return parseUebernahmeParam(new URL(String(url || ''), 'https://x/').search); } catch { return null; }
}

/** Dateiliste einer App aus apps/HERKUNFT.json → Adressen relativ zur App-Wurzel von BLP. */
export function appDateien(herkunft, app) {
  const e = herkunft && herkunft.apps && herkunft.apps[app];
  if (!e || !e.dateien) return [];
  return Object.keys(e.dateien).map((d) => './apps/' + app + '/' + d);
}
