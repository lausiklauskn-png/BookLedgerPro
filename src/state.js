// src/state.js
// Zentraler App-Zustand + Settings. Settings werden verschlüsselt im Tresor
// gespeichert (vault.saveSettings/loadSettings). Einfaches Pub/Sub.

import { saveSettings, loadSettings } from './core/vault.js';

export const MODES = ['einfach', 'profi', 'berater'];
export const AI_LEVELS = ['suggest', 'draft', 'auto'];
export const DATENSCHUTZ_MODI = ['aus', 'pseudonym']; // KI-Datensparsamkeit

const DEFAULTS = Object.freeze({
  mode: 'profi',        // Einfach / Profi / Berater (UI-Komplexität)
  nutzungsmodus: 'firma', // firma | privat | verein — Nutzungskontext (blendet Ansichten je Kontext)
  theme: 'system',      // system / light / dark
  lang: 'de',
  aiAutonomy: 'suggest', // suggest / draft / auto
  taxProfile: 'DE',     // Deutschland zuerst
  kleinunternehmer: false, // §19 UStG — unterdrückt USt-Hinweise
  gewinnermittlung: 'euer', // euer (§4 Abs.3) | bilanz (§4 Abs.1/§5 EStG) — Default EÜR (Bestand unverändert)
  rechnungsstelle: 'blp', // blp | extern — Nummernkreis-Hoheit (§14): BLP vergibt echte Nummern (blp) vs. externes Programm/Steuerberater (extern → BLP nur Vorlage). Default blp (Bestand unverändert), Katalog §7a
  datenschutzModus: 'aus', // aus | pseudonym — ersetzt bekannte Identifikatoren vor KI-Versand
  nerPii: true, // im Pseudonym-Modus zusätzlich erkannte PII Dritter (E-Mail/IBAN/USt-IdNr/Tel.) maskieren
  backupStrategie: 'download', // download | ordner — Ziel der Datensicherung (Ordner braucht File System Access; sonst Download-Fallback)
  zahlungszielTage: 14,    // Standard-Zahlungsziel für Fälligkeit/Mahnwesen
  vaZeitraum: 'vierteljaehrlich', // USt-Voranmeldungszeitraum: monatlich/vierteljaehrlich/jaehrlich
  wirtschaftsjahrBeginn: '01-01', // MM-TT; 01-01 = Kalenderjahr (abweichendes WJ möglich)
  verzugBasiszinsProzent: 3.37, // Basiszinssatz §247 BGB — REGELMÄSSIG AKTUALISIEREN
  firma: { name: '', anschrift: '', steuernummer: '', ustId: '', iban: '' }, // Aussteller-Stammdaten (Rechnung §14)
  datev: { beraterNr: '', mandantNr: '', sachkontenlaenge: 4 }, // für DATEV-EXTF-Header (Berater/Mandant)
  partnerAppUrl: '', // verbundene App (z.B. Mein-WorkFloh) — reziproke Verlinkung
  baukastenNutzungsprofil: {}, // { schemaId: {anzahl, zuletzt} } — adaptiver Angebots-Baukasten (Katalog §3): häufig genutzte Leistungsarten rutschen nach oben. Gerätelokal (verschlüsselt im Tresor), reines IDs/Zähler-Profil (keine Marge), domain/baukasten.js
});

const _state = { settings: { ...DEFAULTS }, route: 'dashboard' };
const _subs = new Set();

export function getSettings() { return { ..._state.settings }; }
export function getRoute() { return _state.route; }

export function subscribe(fn) { _subs.add(fn); return () => _subs.delete(fn); }
function emit() { for (const fn of _subs) fn(_state); }

/** Lädt Settings aus dem Tresor (nach Unlock). */
export async function hydrateSettings() {
  const loaded = await loadSettings();
  _state.settings = { ...DEFAULTS, ...(loaded || {}) };
  emit();
  return getSettings();
}

/** Aktualisiert Settings (teilweise), persistiert verschlüsselt, benachrichtigt. */
export async function updateSettings(patch) {
  _state.settings = { ...DEFAULTS, ..._state.settings, ...patch };
  await saveSettings(_state.settings);
  emit();
  return getSettings();
}

export function navigate(route) { _state.route = route; emit(); }
