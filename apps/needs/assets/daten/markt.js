/* Markt-Tabelle und Kalibrierung — Orientierung, keine Messung.
   Startwerte aus dem Brief (Fahrplan 2026-10-07). In der App änderbar
   (Reiter „Tabellen“), die Änderung liegt nur auf dem Gerät. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};
  var Q = "Fahrplan 2026-10-07, Schätzung, nicht gemessen";
  function m(id, de, en, von, bis, art) {
    return { id: id, name: { de: de, en: en }, vonCent: von * 100, bisCent: bis * 100, art: art, quelle: Q };
  }
  WN.MARKT = [
    m("fach_markt", "Kleine Fachanwendung für einen Betrieb, am Markt", "Small business application, market", 3000, 15000, "einmalig"),
    m("fach_eigen", "Fachanwendung im eigenen Vorgehen (vorsichtig)", "Business application, own approach (cautious)", 1500, 5000, "einmalig"),
    m("pflege", "Pflege dazu", "Maintenance", 20, 50, "monat"),
    m("einrichtung", "Einrichtung und Anpassung (Formulare, Logo, Felder, Schulung)", "Setup and adaptation (forms, logo, fields, training)", 300, 1500, "einmalig"),
    m("seite", "Firmenseite nach Vorlage einrichten", "Company website from template", 400, 900, "einmalig"),
    m("abo", "Abo-Paket für Betriebe", "Subscription for businesses", 15, 29, "monat"),
    m("domain", "Domain", "Domain", 15, 15, "jahr"),
  ];
  /* Welche Zeile die Markt-Sicht neben die einmalige Rechnung stellt. */
  WN.MARKT_VERGLEICH = "fach_markt";

  /* Brief § 9 — Klaus' echte Zeiten, gemessen 2026-10-07 aus Commit-Zeitstempeln:
     Lücke > 90 min = neuer Block, je Block 30 min Vorlauf. UNTERGRENZE.
     Bildschirme: gezählt 2026-10-07 im Code (nicht in der laufenden App), Regel in
     `bildschirmRegel`. mycel-karte lag nicht vor → bleibt null („nicht gezählt“). */
  /* Gezählt 2026-10-07 (Regel unten). Ordner, die nur dieselbe Liste filtern, zählen hier
     einzeln — Sende-Prüfer und Küchenzettel wären sonst 2. */
  var GEZAEHLT = { "Datei-Post": 4, "Kim-sync": 4, "Kuechenzettel": 7, "Company-Brain": 4, "Auslieferung-Pruefer": 6,
    "Sende-Pruefer": 7, "Workflow-PDF": 4, "Kimboard": 4, "Mein-WorkFloh": 5 };
  WN.KALIBRIERUNG = {
    methode: "Commit-Zeitstempel je Repo; Lücke > 90 min = neuer Block, je Block 30 min Vorlauf. Untergrenze. Mit KI-Hilfe entstanden.",
    datum: "2026-10-07",
    zeilen: [
      ["Datei-Post", 3.2, 5], ["Kim-sync", 5.9, 12], ["Kuechenzettel", 8.2, 17], ["Company-Brain", 13.9, 33],
      ["mycel-karte", 16.4, 36], ["Auslieferung-Pruefer", 25.0, 56], ["Sende-Pruefer", 34.0, 80],
      ["Workflow-PDF", 44.0, 117], ["Kimboard", 76.3, 220], ["Mein-WorkFloh", 110.2, 526],
    ].map(function (z) { return { repo: z[0], stunden: z[1], commits: z[2], bildschirme: GEZAEHLT.hasOwnProperty(z[0]) ? GEZAEHLT[z[0]] : null }; }),
    bildschirmRegel: "Gezählt im Code: jede eigene App-Seite, jeder feste Reiter oder app-eigene Ordner, Einstellungen und ein Pflicht-Einrichten. Nicht: Detailansichten, Dialoge für eine Aufgabe, Hilfe, Impressum, selbst angelegte Ordner.",
    gesamt: "Kimhub-Historie 10.03.–24.08.2026: 128 Tage, 1 186,6 h",
  };
})(typeof window !== "undefined" ? window : globalThis);
