/*
 * SBKIM — Andock-Runtime + Auto-Lauschen (Stufe 2, 2026-06-27)
 *
 * BookLedgerPro war bisher SBKIM-Knoten nur über Identität (Ed25519-Spore) +
 * Briefkasten (§11.6). Dieser Init hebt den Knoten auf den Live-Nostr-Kanal:
 * er lädt den Modul-Runtime (01 Storage / 02 Spore / 03 Embedding /
 * 04 Match / 05 Anastomose / 05b Nostr-Relais / 07 Apoptose) und beginnt
 * beim Öffnen selbsttätig am Relais `wss://relay.family-projekt.de` zu lauschen.
 *
 * EMPFANGSMODUS MIT ANTWORTRECHT: der Knoten lauscht auf eingehende
 * Handshakes und ANTWORTET nur — er initiiert NIE von sich aus (kein
 * Crawler, keine Pulsation, keine Eigenanfrage ins offene Netz). Der
 * Handshake betrifft AUSSCHLIESSLICH die SBKIM-Identität (Ed25519-Spore) —
 * NIE Buchhaltungs-/Klartext-Daten (die bleiben verschlüsselt, lokal).
 *
 * Vollständig fail-soft + nicht-blockierend: ohne Browser (WebCrypto/
 * IndexedDB), ohne Relais-Client (Modul 05b, type=module) oder bei
 * Netz-Fehler passiert schlicht nichts — die App bleibt voll nutzbar.
 *
 * Muster: family-project/sbkim/sbkim-init.js + Sage-Protokol/sbkim-init.js.
 * Die acht Module sind byte-identisch aus Sage `src/modules/` kopiert.
 */
(function () {
  "use strict";

  // Eigener IndexedDB-Namensraum der SBKIM-Identität — getrennt von der
  // Buchhaltungs-DB (DB-Suffix `bookledgerpro` der App bleibt unberührt).
  var DB_SUFFIX = "bookledgerpro-sbkim";

  // Wartet kurz, bis das deferred type=module 05b window.SbkimNostrRelay
  // gesetzt hat (Module laufen nach klassischen Skripten). Fail-soft.
  function waitForRelay(tries) {
    return new Promise(function (resolve) {
      var n = tries || 25;
      (function poll() {
        if (window.SbkimNostrRelay) return resolve(window.SbkimNostrRelay);
        if (--n <= 0) return resolve(null);
        setTimeout(poll, 80);
      })();
    });
  }

  function boot() {
    (async function () {
      try {
        if (!window.SbkimStorage) return; // Module nicht geladen — still aussteigen.
        await SbkimStorage.init({ dbSuffix: DB_SUFFIX });

        // Modul 17 Floating-Widget — Lampen-Design (LEBT/VERKEHR/FREMD/SIEGEL),
        // self-mountend, verschiebbar, schließbar. Klick auf VERKEHR zeigt die
        // letzten 10 Handshakes/Knoten. Betrifft NUR die SBKIM-Statusanzeige,
        // nie Buchhaltungsdaten. Fail-soft. MUSS vor Membran (15) + Siegel (16)
        // laufen, damit die Proxy-Spans #lamp-fremd + #sbkim-siegel-badge im
        // DOM stehen (Karte 09 § Schritt 12).
        if (window.SbkimWidget && typeof SbkimWidget.init === "function") {
          try {
            await SbkimWidget.init({
              slots: ["lebt", "verkehr", "fremd", "siegel"],
              allowedOrigins: ["https://lausiklauskn-png.github.io"],
              repoUrl: "https://github.com/lausiklauskn-png/BookLedgerPro",
            });
          } catch (e) { console.warn("[BLP-SBKIM] Widget-Init übersprungen:", e); }
        }

        // Modul 15 Membran (Außenhülle / Fremdzugriff-Lampe) + Modul 16 Siegel
        // (Selbst-Bezeugung). Nach dem Widget, damit die Proxy-Spans bereitstehen.
        // Das Siegel rendert NUR, wenn die Pflicht-Module 01/02/03/04/05/07/15
        // wirklich geladen sind (Anti-Greenwashing). Fail-soft.
        if (window.SbkimMembrane && typeof SbkimMembrane.init === "function") {
          try {
            await SbkimMembrane.init({
              allowedOrigins: ["https://lausiklauskn-png.github.io"],
            });
          } catch (e) { console.warn("[BLP-SBKIM] Membran-Init übersprungen:", e); }
        }
        if (window.SbkimSiegel && typeof SbkimSiegel.init === "function") {
          try {
            SbkimSiegel.init({
              badgeSelector: "#sbkim-siegel-badge",
              repoUrl: "https://github.com/lausiklauskn-png/BookLedgerPro",
            });
          } catch (e) { console.warn("[BLP-SBKIM] Siegel-Init übersprungen:", e); }
        }

        if (window.SbkimApoptose && typeof SbkimApoptose.init === "function") {
          try { await SbkimApoptose.init(); }
          catch (e) { console.warn("[BLP-SBKIM] Apoptose-Init übersprungen:", e); }
        }

        if (window.SbkimAnastomose && typeof SbkimAnastomose.init === "function") {
          await SbkimAnastomose.init();
        }

        await waitForRelay();
        if (window.SbkimAnastomose &&
            typeof SbkimAnastomose.listenNostr === "function" &&
            window.SbkimNostrRelay) {
          try {
            SbkimAnastomose.listenNostr()
              .then(function () {
                console.info("[BLP-SBKIM] Auto-Lauschen aktiv (Empfangsmodus mit Antwortrecht).");
                // Sichtbar im Widget: VERKEHR-Lampe ruhig grün (= lauscht).
                try { window.dispatchEvent(new CustomEvent("sbkim:nostr-listening", { detail: { active: true } })); } catch (e) {}
              })
              .catch(function (e) { console.warn("[BLP-SBKIM] Auto-Lauschen übersprungen:", e); });
          } catch (e) { console.warn("[BLP-SBKIM] Auto-Lauschen übersprungen:", e); }
        }
      } catch (e) {
        console.warn("[BLP-SBKIM] Andock-Init übersprungen (braucht Browser):", e);
      }
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
