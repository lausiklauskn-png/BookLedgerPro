/* Beispiel „Mein Rezeptbuch“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Mein-Rezeptbuch
   (Stand f930a81 auf origin/main, gelesen 2026-11-13; CLAUDE.md, README.md, git log). Die App ist der
   öffentliche Klon von „Muttis Rezeptbuch“ (Start 2026-04-12). KUNDENDATEN ERFUNDEN (.example, kein echter Name).
   Fassungen nach der echten Geschichte (git log origin/main):
     F1 Rezeptbuch als PWA: eigene Speicher, Ordner, Import, KI-Scan, Menüplaner, 8 Sprachen bis 2026-04-20
     F2 KI-Kreativbuch, KI-Bilder, Food-Zine, Kategorie-Zuordnung beim Import bis 2026-05-13
     F3 Knoten im SBKIM-Netz: eigene Identität, Siegel, Mycel, Bedeutungssuche, schnellerer Start bis 2026-08-22
     F4 Kategorien selbst verwalten, Herkunft am Rezept, Kamerafoto, Reinigung vor der KI, Installieren bis 2026-10-31
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — die Vorarbeit in Muttis Rezeptbuch ist nicht mitgezählt.
   Sterne der Mitarbeiter ERFUNDEN (Rollen, keine Namen), plausibel nach dem, was im Alltag half.
   Nicht gebaut und deshalb nicht erfunden: Abgleich zwischen Geräten über einen Server, native Android-/
   Windows-App (nur PWA), eigene Konten/Anmeldung, Prüfung je Datei im Stapel-Scan. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function rezeptbuch(nr, einst) {
    var F = WN.fassungen, B = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-04-12");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Familienrezepte digital sammeln, planen und teilen";
    v.beispiel = true; v.bid = "rezeptbuch";
    v.kunde.firma = "Haushalt Beispiel";
    v.kunde.ansprechpartner = "Küchenleitung Beispiel";
    v.kunde.mail = "kueche@rezeptbuch-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-04-12";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Rezeptkarten, Zeitungsausschnitte, Fotos auf dem Handy, Lesezeichen im Browser");
    H.e(p, 2, "Rezepte sammeln, Wochenplan, Einkauf");
    H.e(p, 3, "Hauptkoch/-köchin im Haushalt", { anzahl: 1 });
    H.e(p, 3, "Mitkochende Familienmitglieder", { anzahl: 2 });
    H.e(p, 3, "Gäste und Verwandte, die Rezepte geschickt bekommen", { anzahl: 4 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Rezepte von Webseiten und aus Büchern müssen abgetippt werden");
    H.e(p, 4, "Einkaufsliste wird jede Woche neu von Hand geschrieben");
    H.e(p, 5, "Kein gemeinsamer Ort für Rezepte aus Papier, Web und Fotos");
    var sammeln = H.bed(p, "Alle Rezepte an einem Ort, nach Kategorien und eigenen Ordnern geordnet, mit Suche", "muss", { h: 2, text: "kein Suchen mehr in Zetteln" });
    var importieren = H.bed(p, "Rezepte per Webadresse, Foto (KI-Scan), Datei oder Eintippen übernehmen", "muss", { h: 3, text: "kein Abtippen" });
    var offline = H.bed(p, "Läuft im Browser, installierbar, auch ohne Internet in der Küche", "muss", {});
    var sicherung = H.bed(p, "Sicherung als Datei und Backup-Tresor mit mehreren Ständen", "muss", { text: "nichts geht verloren" });
    var plan = H.bed(p, "Menüplan für die Woche mit Einkaufsliste nach Kategorien, Portionen umrechnen", "soll", { h: 1.5 });
    var sprachen = H.bed(p, "Oberfläche und Handbuch in 8 Sprachen, Rezepte übersetzen", "soll", {});
    var teilen = H.bed(p, "Rezepte teilen (Code zum Scannen, Datei) und drucken", "kann", {});
    H.e(p, 7, "Jedes Rezept ist in Sekunden gefunden, der Wochenplan steht in zehn Minuten");
    H.e(p, 8, "Das System muss als installierbare Web-App (PWA) im Browser laufen und nach dem ersten Besuch ohne Internet funktionieren");
    H.e(p, 8, "Das System muss alle Rezepte nur auf dem Gerät speichern, ohne Konto und ohne eigenen Server");
    H.e(p, 8, "Das System muss Rezepte in Kategorien und frei benennbaren Ordnern führen, mit Ziehen und Ablegen");
    H.e(p, 8, "Das System muss Rezepte aus einer Webadresse, aus Fotos und PDF-Dateien (KI-Scan, auch ganze Ordner) und aus Text übernehmen");
    H.e(p, 8, "Das System muss alle Rezepte als JSON-Datei sichern und wieder einlesen können und mehrere Sicherungen im Backup-Tresor verwalten");
    H.e(p, 8, "Das System muss einen Menüplan für Tage und Wochen führen und daraus eine Einkaufsliste nach Kategorien bilden");
    H.e(p, 8, "Das System muss Oberfläche, Handbuch und Mengeneinheiten in 8 Sprachen anbieten");
    H.e(p, 8, "Das System muss KI-Funktionen nur mit dem eigenen Schlüssel des Nutzers und nur auf seinen Tipp hin aufrufen");
    H.e(p, 9, "für Hobbyköche ohne Technikwissen; Handbuch mit 9 Kapiteln in der App, als PDF und E-Book");
    H.e(p, 9, "Themen: Landhaus, Frühling, Nacht, Modern, Bunt; Barrierefreiheit einstellbar");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "offline");
    H.e(p, 10, "Tablet in der Küche, Handy beim Einkaufen");
    H.e(p, 11, "Muttis Rezeptbuch (Schwester-App mit gleichem Aufbau)");
    var schnittWeb = H.e(p, 12, "Rezeptseiten im Internet (Übernahme per Adresse)");
    H.e(p, 12, "KI-Anbieter mit eigenem Schlüssel (Claude, Mistral OCR)");
    H.e(p, 13, "Rezepte mit Zutaten, Schritten, Bildern, Kategorie, Ordner; Menüpläne; Einkaufslisten");
    H.e(p, 14, "personenbezogene Daten: nein");
    H.e(p, 14, "Die Rezepte verlassen das Gerät nur auf ausdrücklichen Tipp (KI, Teilen, Export)");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "kein Abo, keine Werbung, kein Zähldienst; eigene Speicherschlüssel neben der Schwester-App");
    H.e(p, 18, "Welche KI-Anbieter sollen wählbar sein?", { wer: "Haushalt", bis: "2026-04-18" });
    f.umfang.kundenStundenwertCent = 2000;
    H.bs(f, "liste", "Rezeptbuch: Rezepte, Kategorien, Ordner mit Ziehen und Ablegen, Suche", "gross", [sammeln.id], { faktoren: ["offline"] });
    H.bs(f, "scan", "Import: Webadresse, KI-Scan von Foto, PDF und ganzen Ordnern, Eintippen", "gross", [importieren.id, schnittWeb.id], { faktoren: ["ki"] });
    H.bs(f, "seite", "Installierbare Web-App mit Offline-Vorrat (Service Worker)", "mittel", [offline.id]);
    H.bs(f, "datei", "Sicherung als JSON-Datei und Backup-Tresor mit mehreren Ständen", "mittel", [sicherung.id]);
    H.bs(f, "neu", "Menüplaner mit Einkaufsliste nach Kategorien und Portionsrechner", "mittel", [plan.id]);
    H.bs(f, "neu", "8 Sprachen für Oberfläche, Handbuch und Einheiten; Rezeptübersetzer", "mittel", [sprachen.id], { faktoren: ["sprachen"] });
    H.bs(f, "neu", "Teilen per Code zum Scannen, Datei und Druck", "klein", [teilen.id], { faktoren: ["druck"] });
    F.unterschreiben(v, f, einst && einst.ust, "2026-04-20");

    /* F2 — Kreativbuch, KI-Bilder, Food-Zine */
    var f2 = F.neueFassung(v, { anlass: "Die Sammlung soll schön aussehen: Bilder zu Rezepten ohne Foto, ein eigenes Kochbuch und Poster zum Verschenken", von: "kunde", datum: "2026-04-21" }).fassung;
    var p2 = f2.protokoll;
    var kibild = H.bed(p2, "Fehlende Rezeptbilder von einer KI erzeugen lassen, altes Bild bleibt speicherbar", "soll", { text: "jedes Rezept mit Bild" });
    var kreativ = H.bed(p2, "Aus ausgewählten Rezepten ein gestaltetes Kochbuch erzeugen, mit Kostenübersicht vorher", "kann", {});
    var zine = H.bed(p2, "Food-Zine-Poster zu einem Rezept, auch ohne KI-Schlüssel, in einer Galerie sortierbar", "kann", {});
    var katImport = H.bed(p2, "Beim Import fremder Dateien die Kategorien zuordnen, statt Rezepte zu verlieren", "muss", {});
    H.e(p2, 8, "Das System muss vor jedem KI-Bildauftrag die Kosten schätzen und den Fortschritt zeigen");
    H.e(p2, 8, "Das System muss beim Einlesen einer fremden Datei für jede unbekannte Kategorie fragen, wohin sie gehört");
    H.e(p2, 12, "Bild-KI mit eigenem Schlüssel");
    H.bs(f2, "neu", "KI-Bild je Rezept und für viele Rezepte, mit Kosten und Fortschritt", "mittel", [kibild.id], { faktoren: ["ki"] });
    H.bs(f2, "neu", "KI-Kreativbuch aus gewählten Rezepten, scrollbarer Download", "mittel", [kreativ.id], { faktoren: ["ki"] });
    H.bs(f2, "neu", "Food-Zine: Poster-Seite, Prompt-Generator, Galerie mit Ziehen", "mittel", [zine.id]);
    H.bs(f2, "altdaten", "Kategorie-Zuordnung beim Import fremder Dateien", "klein", [katImport.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-05-13");

    /* F3 — Knoten im SBKIM-Netz */
    var f3 = F.neueFassung(v, { anlass: "Das Rezeptbuch soll im Netz der eigenen Apps gefunden werden und nach Bedeutung suchen, ohne einen fremden Server", von: "kunde", datum: "2026-05-14" }).fassung;
    var p3 = f3.protokoll;
    var knoten = H.bed(p3, "Eigene Identität im App-Netz mit Siegel, Verbindung zu anderen Apps nur auf Wunsch", "soll", {});
    var sinn = H.bed(p3, "Suche nach Bedeutung („etwas Leichtes mit Gemüse“), auf dem Gerät", "soll", { h: 1 });
    var tempo = H.bed(p3, "Die App startet schneller, auch auf dem Küchentablet", "muss", { text: "erster Anstrich 4,3 → 2,6 s" });
    H.e(p3, 12, "SBKIM-Netz: Sage-Protokol, Mein Mixarium, Muttis Rezeptbuch, Tresor-Apps");
    H.e(p3, 8, "Das System muss die Bedeutungssuche im Hintergrund rechnen, damit die Oberfläche bedienbar bleibt");
    H.e(p3, 8, "Das System muss beim Laden nichts ins Netz senden; Verbindungen entstehen erst auf Tipp");
    H.e(p3, 18, "Welche Apps dürfen Rezepte finden?", { wer: "Haushalt", bis: "2026-07-15" });
    H.bs(f3, "schnitt", "Knoten im App-Netz: Identität, Siegel, Mycel-Fenster, Verbinden auf Wunsch", "gross", [knoten.id], { faktoren: ["nutzer"], wv: 0.7 });
    H.bs(f3, "suche", "Bedeutungssuche auf dem Gerät, im Hintergrund gerechnet", "mittel", [sinn.id]);
    H.bs(f3, "neu", "Schneller Start: Symbole als Dateien, kleinerer erster Anstrich", "klein", [tempo.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-08-22");

    /* F4 — Kategorien, Herkunft, Kamera, Reinigung */
    var f4 = F.neueFassung(v, { anlass: "Im Alltag fielen Lücken auf: Rezepte ohne Kategorie verschwanden, Kamerafotos wurden abgewiesen, Text ging ungeprüft an die KI", von: "kunde", datum: "2026-08-23" }).fassung;
    var p4 = f4.protokoll;
    var kategorien = H.bed(p4, "Kategorien umbenennen, mit eigenem Symbol, neu anlegen, löschen, zusammenlegen und sortieren", "muss", { h: 0.5 });
    var herkunft = H.bed(p4, "Rezepte tragen ihre Herkunft; beim Einlesen entsteht kein Doppel, auch nach Umbenennen", "soll", {});
    var kamera = H.bed(p4, "Große Kamerafotos werden verkleinert statt abgewiesen", "muss", { text: "Foto direkt aus der Küche" });
    var reinigung = H.bed(p4, "Vor dem Senden an eine KI versteckten Text und Bild-Metadaten entfernen, Datei auf Knopfdruck prüfen", "muss", {});
    var installieren = H.bed(p4, "Installieren-Knopf gut sichtbar, verschwindet nach der Installation", "kann", {});
    H.e(p4, 8, "Das System muss eine Kategorie beim Löschen erst fragen, wohin ihre Rezepte gehen");
    H.e(p4, 8, "Das System muss Rezepte ohne Kategorie sichtbar unter „Ohne Kategorie“ führen, nie still verlieren");
    H.e(p4, 8, "Das System muss PDF-Seiten als gereinigtes Bild an die KI geben und bei einer Anweisung an eine KI einmal anhalten");
    H.e(p4, 15, "Bewusste Grenze: nur die ersten 10 Seiten eines PDF gehen an die KI");
    H.bs(f4, "liste", "Kategorien verwalten: umbenennen, Symbole, löschen, zusammenlegen, sortieren", "mittel", [kategorien.id]);
    H.bs(f4, "altdaten", "Herkunft am Rezept und Wiedererkennen beim Einlesen", "mittel", [herkunft.id]);
    H.bs(f4, "scan", "Kamerafoto verkleinern statt abweisen, ein Weg für alle KI-Bilder", "klein", [kamera.id]);
    H.bs(f4, "kipruef", "Reinigung vor der KI und Dateiprüfung auf Knopfdruck", "mittel", [reinigung.id], { faktoren: ["ki"] });
    H.bs(f4, "seite", "Installieren-Knopf in Kopfleiste und Einstellungen", "klein", [installieren.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-10-31");

    /* Abstimmung der Mitarbeiter — Sterne ERFUNDEN; Rollen: HK Hauptkoch/-köchin, MK1/MK2 Mitkochende, GA Gast. */
    [
      [importieren.id, "Rezepte erfassen", "HK", 5, 5], [importieren.id, "Rezepte erfassen", "MK1", 4, 5],
      [sammeln.id, "Rezeptbuch", "HK", 5, 5], [sammeln.id, "Rezeptbuch", "MK1", 4, 4], [sammeln.id, "Rezeptbuch", "MK2", 4, 5],
      [plan.id, "Wochenplan", "HK", 4, 5], [plan.id, "Einkauf", "MK2", 3, 4],
      [offline.id, "Küche", "HK", 4, 4], [offline.id, "Küche", "MK1", 3, 4],
      [teilen.id, "Teilen", "GA", 3, 4], [teilen.id, "Teilen", "HK", 2, 3],
      [kategorien.id, "Rezeptbuch", "HK", 4, 5], [kategorien.id, "Rezeptbuch", "MK1", 3, 4]
    ].forEach(function (z) {
      var datum = z[0] === kategorien.id ? "2026-08-25" : "2026-04-12";
      B.sterneDazu(v, { zeitpunkt: "bedarf", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[3], datum: datum });
      B.sterneDazu(v, { zeitpunkt: "abnahme", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[4], datum: "2026-10-31" });
    });

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 37.1, 2: 84.8, 3: 170.3, 4: 205.8 };
    return v;
  }

  WN.beispiel.registrieren({ id: "rezeptbuch", name: { de: "Mein Rezeptbuch (fertige App)", en: "Mein Rezeptbuch (finished app)" }, bauen: rezeptbuch,
    quelle: "Mein-Rezeptbuch f930a81, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
