/* apps/blp-bruecke.js — Klebstoff von BookLedgerPro in den eingebetteten Apps (Workflow Calculate, Workflow Needs).
   Klaus 2026-10-26: „eins zu eins übernehmen … als Brücke". Die Apps liegen byte-1:1 unter apps/<app>/; diese Datei
   wird nur über die kontrollierte Abweichung in index.html (tools/apps-patch.mjs) VOR jedem Modul der App geladen.
   Sie tut genau drei Dinge, alle nur, wenn die App in BLP eingebettet läuft (sonst kehrt sie sofort zurück):
     1. Thema: BLP schickt {typ:'blp-thema', theme, farbe} per postMessage; hier wird data-theme (hell/dunkel, das kennen
        die Apps selbst) und data-blp-farbe (blau · graphit · petrol, apps/blp-thema.css) am <html> der App gesetzt.
     2. Übergabe ohne Sprung: Calculates „An BookLedgerPro" würde die Seite nach …/BookLedgerPro/?uebernahme= schicken —
        im Rahmen hieße das: BLP lädt IN der App. Calculate hat dafür schon den Haken window.__wcSprungAbfangen /
        window.__wcSprung (für seine Proben); hier wird die Adresse stattdessen an BLP gemeldet
        ({typ:'blp-uebernahme', url}) und BLP öffnet die Übergabe wie bisher (Datenvertrag v1).
     3. Bereit-Meldung ({typ:'blp-bereit'}), damit BLP das Thema gleich nachreicht.
   Kein Zugriff auf Daten der App, keine Änderung an ihrem Speicher. Klassisches Skript, kein Modul. */
(function () {
  "use strict";
  if (window.parent === window) return;
  var html = document.documentElement;
  html.setAttribute("data-blp-eingebettet", "1");
  var m = /\/apps\/([a-z]+)\//.exec(location.pathname);
  var APP = m ? m[1] : "";
  var ORIGIN = location.origin;
  function melde(daten) { try { window.parent.postMessage(daten, ORIGIN); } catch (_e) {} }
  function thema(d) {
    if (!d || d.typ !== "blp-thema") return;
    if (d.theme === "light") html.setAttribute("data-theme", "light"); else html.removeAttribute("data-theme");
    if (d.farbe) html.setAttribute("data-blp-farbe", String(d.farbe));
    html.setAttribute("data-blp-thema", (d.farbe || "") + "/" + (d.theme || ""));
  }
  window.addEventListener("message", function (e) { if (e.origin !== ORIGIN) return; thema(e.data); });
  // 2. Übergabe an BLP: dieselben Haken in Calculate (__wcSprung) und Needs (__wnSprung, seit D22 2026-10-26).
  function haken(flagge, name) {
    window[flagge] = true;
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: function () { return null; },
        set: function (url) { melde({ typ: "blp-uebernahme", app: APP, url: String(url || "") }); },
      });
    } catch (_e) {}
  }
  haken("__wcSprungAbfangen", "__wcSprung");
  haken("__wnSprungAbfangen", "__wnSprung");
  // Falls eine App einmal einen echten Link mit ?uebernahme= setzt: abfangen, nicht im Rahmen laden.
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="uebernahme="]') : null;
    if (!a) return;
    e.preventDefault();
    melde({ typ: "blp-uebernahme", app: APP, url: a.href });
  }, true);
  // Bereit: sofort (die Skripte der App laufen vor "load") und noch einmal nach "load" — BLP antwortet mit dem Thema.
  melde({ typ: "blp-bereit", app: APP });
  window.addEventListener("load", function () { melde({ typ: "blp-bereit", app: APP }); });
  window.BLP_BRUECKE = { app: APP, eingebettet: true, thema: thema };
})();
