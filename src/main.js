// src/main.js
// Bootstrap: SW registrieren, Datendurabilität anfragen, Tresor-Status prüfen,
// Sperrbildschirm/Onboarding → App-Shell.

import { requestPersistence } from './core/durability.js';
import { showLockScreen } from './ui/lock.js';
import { renderShell } from './ui/shell.js';
import { applyTheme } from './ui/theme.js';
import { setLang } from './ui/i18n.js';
import { hydrateSettings } from './state.js';
import { ensureAccountsSeeded } from './domain/store.js';

const root = document.getElementById('app-root');

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    // App-SW: cached die Shell für Offline-Betrieb. Versionierter Cache-Name
    // (Browser-Lehre 4) liegt in sw.js — Updates über Datei-/Versions-Bump.
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
  } catch (e) {
    console.warn('[sw] Registrierung fehlgeschlagen:', e);
  }
}

async function boot() {
  applyTheme('system');     // vorläufig, bis Settings geladen sind
  await requestPersistence(); // so früh wie möglich (Browser-Lehre 2)
  registerSW();

  // Sperrbildschirm/Onboarding bis entsperrt.
  await showLockScreen(root);

  // Nach Unlock: Settings laden und anwenden.
  const settings = await hydrateSettings();
  setLang(settings.lang);
  applyTheme(settings.theme);

  // Kontenplan einmalig anlegen (SKR03-Auswahl).
  await ensureAccountsSeeded();

  renderShell(root, { onLock: () => location.reload() });
}

boot().catch((e) => {
  console.error('[boot] Fehler:', e);
  root.innerHTML = '<div class="fatal">Start fehlgeschlagen. Bitte Seite neu laden.</div>';
});
