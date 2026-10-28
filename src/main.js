// src/main.js
// Bootstrap: SW registrieren, Datendurabilität anfragen, Tresor-Status prüfen,
// Sperrbildschirm/Onboarding → App-Shell.

// ── Was VOR dem ersten Anstrich geladen wird, ist bewusst klein gehalten ──────
// Bis 2026-08-03 zog main.js hier den halben Buchhaltungs-Kern statisch herein
// (Mandanten, Sandbox, Sperrbildschirm, Kontenplan, Kostenstellen). Alle diese
// Module werden aber erst NACH dem Deckblatt gebraucht — der Browser musste
// trotzdem den ganzen Baum holen, bevor er das Deckblatt bauen konnte.
// Gemessen: 144 Modul-Anfragen vor dem ersten Anstrich, LCP 20,1 s.
// Jetzt steht hier nur noch, was das Deckblatt wirklich braucht; der Rest kommt
// per dynamischem import() genau an der Stelle, an der er gebraucht wird.
// Build-frei bleibt es (goldene Regel 1) — import() ist natives ES, kein Bundler.
// Die Reihenfolge der Abläufe ist unverändert: jeder import() steht exakt dort,
// wo vorher der Aufruf stand, und wird an derselben Stelle abgewartet.
import { requestPersistence } from './core/durability.js';
import { showIntro } from './ui/intro.js';
// renderShell wird ERST nach dem Entsperren gebraucht und darum erst dann geholt
// (dynamischer import weiter unten). Als statischer Import zog ./ui/shell.js
// seinen kompletten Modulbaum — alle Ansichten, alle Domaenen-Module — vor den
// ersten Anstrich: gemessen 144 Modul-Anfragen unter src/, bevor das Deckblatt
// ueberhaupt gebaut wurde. Build-frei bleibt es (goldene Regel 1): dynamischer
// import() ist natives ES, kein Bundler.
import { applyTheme, applyGemerktesThema } from './ui/theme.js';
import { setLang } from './ui/i18n.js';
import { ladeSymbole } from './ui/icons.js';
import { strichBeobachten } from './ui/strich.js';   // i18n zieht das Deckblatt ohnehin (t())

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
  // Strichgrafiken statt Emojis ab dem ersten Bild, auch Deckblatt und Anmeldung (Pro-Umbau 4, Leitfaden § 5).
  try { ladeSymbole(); strichBeobachten(document.body); } catch { /* ohne Beobachter bleibt der Text */ }
  applyGemerktesThema();    // zuletzt gewähltes Thema (localStorage), bis die Tresor-Einstellungen geladen sind
  await requestPersistence(); // so früh wie möglich (Browser-Lehre 2)
  registerSW();

  // Öffentliches Deckblatt/Datenblatt VOR der Anmeldung (zum Informieren).
  await showIntro(root);

  // Mehrmandanten (M2a): Registry laden, Alt-Tresor migrationsfrei registrieren und die
  // aktive Tresor-DB ausrichten (Default = Legacy). Behält das bisherige Verhalten bei,
  // solange nur ein Mandant existiert.
  const { initMandanten } = await import('./core/mandantenStore.js');
  await initMandanten();

  // Test-Modus (docs/TEST_MODUS.md), Aufräum-Sicherheit: verwaiste Sandbox-/Test-DBs (am
  // Namen erkennbar, nicht in der Registry — z. B. nach einem Absturz) vorsorglich entfernen.
  // Best-effort, blockiert den Start nie und fasst nie eine echte/aktive DB an.
  import('./core/sandboxStore.js')
    .then((m) => m.raeumeVerwaisteSandboxesAuf())
    .catch((e) => console.warn('[sandbox] Aufräumen übersprungen:', e));

  // Sperrbildschirm/Onboarding bis entsperrt.
  const { showLockScreen } = await import('./ui/lock.js');
  await showLockScreen(root);

  // Nach Unlock: Settings laden und anwenden.
  const { hydrateSettings } = await import('./state.js');
  const settings = await hydrateSettings();
  setLang(settings.lang);
  applyTheme(settings.theme, settings.themeFarbe);

  // Kontenplan + Kostenstellen einmalig anlegen.
  const { ensureAccountsSeeded } = await import('./domain/store.js');
  const { ensureKostenstellenSeeded } = await import('./domain/crm-store.js');
  await ensureAccountsSeeded();
  await ensureKostenstellenSeeded();

  const { renderShell } = await import('./ui/shell.js');
  renderShell(root, { onLock: () => location.reload() });
}

boot().catch((e) => {
  console.error('[boot] Fehler:', e);
  root.innerHTML = '<div class="fatal">Start fehlgeschlagen. Bitte Seite neu laden.</div>';
});
