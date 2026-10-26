/*
 * Siegel-Inhalt — DIE IDENTITÄT DIESES KNOTENS, und sonst nichts.
 *
 * Der Andock-Wizard liegt byte-1:1 aus Sage in `modules/16b_andock_wizard.js`
 * und liest nur `window.SBKIM_SIEGEL_WIZ`. Diese Datei wird NIE verteilt: sie
 * trägt die Bedeutung des Knotens (Sage-Protokol/docs/INTERFACES.md §11.9).
 *
 * ⚠ Modul 03 rechnet aus der Beschreibung den Domänen-Vektor. Das Wichtigste
 * steht vorn (Name, Zweck, Protokoll). Kein Kundendatum und kein Stundensatz
 * gehören hierher — die Beschreibung geht ins Netz.
 */
(function () {
  "use strict";
  window.SBKIM_SIEGEL_WIZ = {
    domain: "Bedarfsanalyse/Angebot/Werkzeug",
    endpoint: "https://lausiklauskn-png.github.io/Workflow-Needs/",
    nodeType: "hybrid",
    nodeName: "Workflow Bedarfsanalyse",
    domainDescription: "Workflow Bedarfsanalyse (Workflow-Needs) ist ein Werkzeug im SBKIM-Mycel und ein eigener Knoten. ZWECK: den Bedarf eines Kunden an eine App oder einen Arbeitsablauf aufnehmen, bevor gebaut wird, und daraus ein nachvollziehbares Angebot machen. Drei getrennte Stufen: 1 Bedarf in 18 Bereichen, lösungsneutral und ohne Preis, als Bedarfsprotokoll für den Kunden; 2 Umfang mit Bausteinen, geschätzten Stunden, Kosten-Nutzen und Grenzlinie, nur intern; 3 Angebot mit Positionen und zwei Unterschriften. Dazu Fassungen mit Vergleich und Nachtrag, ein Bauauftrag als Markdown mit Platzhaltern statt Kundendaten für die nächste Bau-Sitzung, eine verschlüsselte Sicherung und die Übergabe als Auftrag an Mein WorkFloh und Tomys Hub. FORSCHUNG UND PROTOKOLL: Workflow-Needs gehört zum SBKIM-Protokoll (Semantisches Bidirektionales KI-Matching), der offenen Spezifikation aus dem Sage-Protokol; die Platzhalter kommen aus dem Sage-Modul 25, unverändert übernommen. Er ist selbst ein Knoten: eigene signierte Spore, eigene Kennung, und mit dem Netz verbindet er sich nur auf ausdrücklichen Klick, auf Wunsch in einem eigenen Firmennetz. WAS ER NICHT IST: keine Buchhaltung und keine Projektverwaltung; alle Stunden und Faktoren sind Schätzungen. Die Vorgänge bleiben im Browser des Geräts. FÜR WEN: für Betriebe und Entwickler, die vor dem Bauen klären wollen, was gebraucht wird und was es kostet.",
    domainKeywords: ["SBKIM", "SBKIM-Protokoll", "Sage-Protokol", "Mycel", "Knoten", "Workflow-Needs", "Bedarfsanalyse", "Bedarfsprotokoll", "Angebot", "Schätzung", "Bausteine", "Kosten-Nutzen", "Fassungen", "Bauauftrag", "Platzhalter", "Übergabe", "WorkFloh", "offline", "Daten bleiben auf dem Gerät", "Werkzeug"],
    stammCategories: ["Bedarfsanalyse", "Angebot", "Werkzeug"],
    guestCategories: ["Bauauftrag", "Auftrag", "Siegel"],
    backupPrefix: "workflow-needs-backup",
  };
})();
