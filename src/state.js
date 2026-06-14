// src/state.js
// Zentraler App-Zustand + Settings. Settings werden verschlüsselt im Tresor
// gespeichert (vault.saveSettings/loadSettings). Einfaches Pub/Sub.

import { saveSettings, loadSettings } from './core/vault.js';

export const MODES = ['einfach', 'profi', 'berater'];
export const AI_LEVELS = ['suggest', 'draft', 'auto'];

const DEFAULTS = Object.freeze({
  mode: 'profi',        // Einfach / Profi / Berater
  theme: 'system',      // system / light / dark
  lang: 'de',
  aiAutonomy: 'suggest', // suggest / draft / auto
  taxProfile: 'DE',     // Deutschland zuerst
  kleinunternehmer: false, // §19 UStG — unterdrückt USt-Hinweise
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
