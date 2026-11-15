/* Beispiel „Mein Mixarium“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Mein-Mixarium
   (Stand ddf402e, Fassung v9.5, gelesen 2026-11-13: CLAUDE.md, README, git log origin/main).
   KUNDENDATEN ERFUNDEN (.example, kein echter Name). STERNE ERFUNDEN (Rollen, keine Personen).
   Fassungen nach der echten Geschichte (git log origin/main):
     F1 Getränke-Rezeptbuch aus dem Rezeptbuch umgebaut, KI-Labor, Bilder, Themen, 8 Sprachen bis 2026-05-12
     F2 Netz-Knoten (SBKIM): Bedeutungssuche, Spore, Siegel, Rendezvous über eigenes Relais bis 2026-06-28
     F3 KI-Scan mit Anbieterwahl (Anthropic / Mistral EU), OCR, KI-Richter, Schlüssel-Tresor, Spracheingabe, Ladezeit bis 2026-08-22
     F4 KI-Bilder, eigene Kategorien, Herkunft am Getränk, Kamerafoto verkleinert, Reinigung vor der KI, Installieren bis 2026-10-31
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — das Vorbild Mein Rezeptbuch und die Sage-Module sind nicht mitgezählt.
   Nicht gebaut und deshalb nicht erfunden: Konto/Server-Synchronisation, eigene iPhone- oder Windows-App (nur PWA),
   Bezahlvorgang, die geplanten SBKIM-Agenten A1–B3 (nur Konzept im Repo). */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function mixarium(nr, einst) {
    var F = WN.fassungen, B = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-04-19");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Getränke-Rezepte für Bar und Zuhause als App ohne Server";
    v.beispiel = true; v.bid = "mixarium";
    v.kunde.firma = "Saftbar Beispiel";
    v.kunde.ansprechpartner = "Inhaberin Beispiel";
    v.kunde.mail = "theke@saftbar-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-04-19";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Rezeptkarten hinter der Theke, Fotos im Handy, eine Rezeptbuch-App fürs Essen");
    H.e(p, 2, "Dokumente");
    H.e(p, 2, "Einkauf der Zutaten und Wochenkarte");
    H.e(p, 3, "Inhaberin", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiter an der Theke", { anzahl: 2 });
    H.e(p, 3, "Gäste (sehen die Karte, nutzen die App nicht selbst)", { anzahl: 1 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Rezepte werden je nach Schicht anders gemischt");
    H.e(p, 4, "neue alkoholfreie Getränke zu erfinden kostet viel Probierzeit");
    H.e(p, 5, "Rezepte liegen verstreut, ohne feste Mengen und ohne Bild");
    H.e(p, 5, "vorhandene Rezept-Apps sind fürs Essen gebaut, nicht für Getränke");
    var buch = H.bed(p, "Alle Getränkerezepte an einem Ort: Mocktails, Smoothies, Cocktails, Limonaden, Tees, Sirupe, mit Zutaten, Mengen, Schritten, Glas und Bild", "muss", { h: 6, text: "jede Schicht mischt gleich" });
    var offline = H.bed(p, "Läuft auf Handy und Tablet hinter der Theke, auch ohne Internet, ohne Konto", "muss", { text: "kein WLAN an der Theke nötig" });
    var labor = H.bed(p, "Ein Labor schlägt neue Getränke nach Geschmack und vorhandenen Zutaten vor; wir bewerten und übernehmen die guten", "soll", { h: 3, text: "weniger Probierzeit" });
    var karte = H.bed(p, "Wochenplan, Menü zum Zeigen und Einkaufsliste aus den Rezepten", "soll", { h: 2 });
    var sprachen = H.bed(p, "Oberfläche in mehreren Sprachen, weil das Team gemischt ist", "soll", {});
    var entdecken = H.bed(p, "Bekannte Drinks aus einer offenen Sammlung übernehmen", "kann", {});
    var sicherung = H.bed(p, "Export und Import der Rezepte als Datei", "muss", { text: "nichts geht beim Gerätewechsel verloren" });
    H.e(p, 7, "Jedes Getränk ist in Sekunden mit Bild und Mengen gefunden, neue Ideen kommen aus dem Labor");
    H.e(p, 8, "Das System muss als installierbare Web-App ohne Server laufen und nach dem ersten Öffnen vollständig offline arbeiten");
    H.e(p, 8, "Das System muss Getränke mit Kategorie, Zutaten (Menge, Einheit), Schritten, Glastyp, Alkoholangabe, Portionen, Zeit und Sternebewertung führen");
    H.e(p, 8, "Das System muss die Daten nur im Browser des Geräts speichern und als Datei exportieren und wieder einlesen");
    H.e(p, 8, "Das System muss im Labor aus Kategorie, Geschmack und Zutaten einen Vorschlag einer KI holen, der zuerst als experimentell gilt und nach Bewertung ins Buch übernommen oder verworfen wird");
    H.e(p, 8, "Das System muss einen alkoholfreien Modus haben, der Getränke mit Alkohol ausblendet");
    H.e(p, 8, "Das System muss Wochenplan, Menüansicht und Einkaufsliste aus den Rezepten erzeugen");
    H.e(p, 8, "Das System muss acht Sprachen und mehrere Farbthemen anbieten");
    H.e(p, 9, "für Thekenpersonal ohne Technikwissen; Bedienungsanleitung in der App");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "offline");
    H.e(p, 11, "Rezeptbuch-App für Essen (dient als Vorlage)");
    var schnittDB = H.e(p, 12, "offene Getränke-Datenbank im Netz (nur beim Entdecken, nur lesend)");
    H.e(p, 13, "Rezepte, Zutaten, Fotos, Bewertungen");
    H.e(p, 14, "personenbezogene Daten: nein");
    H.e(p, 14, "KI-Schlüssel nur im Gerät, nie im Quelltext");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "kein Abo, keine Werbung; Jugendschutz: alkoholfreier Modus");
    H.e(p, 15, "bewusst nicht: Konto, Server-Abgleich, Bezahlvorgang; nur Web-App, keine eigene iPhone- oder Windows-App");
    H.e(p, 18, "Welche KI darf das Labor benutzen?", { wer: "Inhaberin", bis: "2026-04-25" });
    f.umfang.kundenStundenwertCent = 2500;
    H.bs(f, "liste", "Getränke-Rezeptbuch: Kategorien, Zutaten, Schritte, Bilder mit Ausschnitt, Sterne, Suche, Karussell", "gross", [buch.id], { faktoren: ["offline"] });
    H.bs(f, "seite", "Installierbare Web-App mit Offline-Vorrat, Themen und Startanimation", "mittel", [offline.id]);
    H.bs(f, "kipruef", "KI-Labor: Vorschlag, Bewertung in vier Punkten, Übernahme ins Buch", "mittel", [labor.id], { faktoren: ["ki"] });
    H.bs(f, "neu", "Wochenplan, Menü, Einkaufsliste", "mittel", [karte.id], { faktoren: ["druck"] });
    H.bs(f, "neu", "Acht Sprachen mit Prüfskript", "klein", [sprachen.id], { faktoren: ["sprachen"] });
    H.bs(f, "schnitt", "Bekannte Drinks entdecken (offene Getränke-Datenbank)", "klein", [entdecken.id, schnittDB.id]);
    H.bs(f, "altdaten", "Export und Import als Datei", "klein", [sicherung.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-05-12");

    /* F2 — Netz-Knoten */
    var f2 = F.neueFassung(v, { anlass: "Die Rezepte sollen nach Bedeutung gefunden werden und die App soll mit den Schwester-Apps im eigenen Netz sprechen, ohne Server", von: "kunde", datum: "2026-05-16" }).fassung;
    var p2 = f2.protokoll;
    var sinn = H.bed(p2, "Suche nach Bedeutung („etwas Fruchtiges ohne Zucker“), auf dem Gerät", "soll", { h: 1 });
    var netz = H.bed(p2, "Die App findet andere Apps des Hauses (Rezeptbuch, Marktplatz) und antwortet ihnen, mit eigener Kennung und Siegel", "soll", {});
    H.e(p2, 8, "Das System muss eine eigene, signierte Kennung (Spore) führen und ihre Beschreibung im Siegel zeigen");
    H.e(p2, 8, "Das System muss sich nur auf Wunsch über ein Relais verbinden; beim Laden geht nichts ins Netz");
    var schnittNetz = H.e(p2, 12, "Netz der Schwester-Apps über ein eigenes Relais");
    H.bs(f2, "suche", "Bedeutungssuche über die Getränke, Modell auf dem Gerät", "mittel", [sinn.id]);
    H.bs(f2, "schnitt", "Netz-Knoten: Spore, Siegel, Lampen, Rendezvous über eigenes Relais", "gross", [netz.id, schnittNetz.id], { faktoren: ["nutzer"] });
    F.unterschreiben(v, f2, einst && einst.ust, "2026-06-28");

    /* F3 — KI-Scan, Richter, Tresor, Spracheingabe */
    var f3 = F.neueFassung(v, { anlass: "Alte Rezeptkarten und Handschrift sollen eingelesen werden, die KI wahlweise in der EU, der Schlüssel sicher gemerkt", von: "kunde", datum: "2026-07-01" }).fassung;
    var p3 = f3.protokoll;
    var scan = H.bed(p3, "Rezeptkarte oder Handschrift fotografieren, Text wird gelesen und als Getränk vorgeschlagen", "muss", { h: 3, text: "kein Abtippen" });
    var tresor = H.bed(p3, "KI-Schlüssel verschlüsselt merken, Anbieter wählbar (auch EU)", "soll", {});
    var sprechen = H.bed(p3, "Suchen per Spracheingabe, wenn die Hände nass sind", "kann", {});
    var tempo = H.bed(p3, "Schneller Start am Handy", "soll", {});
    H.e(p3, 8, "Das System muss für Scan und Texterkennung den Anbieter wählen lassen (Anthropic oder Mistral EU) und nur auf Tipp senden");
    H.e(p3, 8, "Das System muss fremde Antworten aus dem Netz nur mit Prüfung an einen KI-Richter geben");
    H.bs(f3, "scan", "KI-Scan und Texterkennung von Fotos und Handschrift, Stapel", "mittel", [scan.id], { faktoren: ["ki"] });
    H.bs(f3, "kipruef", "Schlüssel-Tresor, Anbieterwahl, KI-Richter mit Prüfliste", "mittel", [tresor.id]);
    H.bs(f3, "neu", "Spracheingabe in der Suche", "klein", [sprechen.id]);
    H.bs(f3, "neu", "Ladezeit: Bilder als Datei, Netz-Module erst nach dem Laden", "klein", [tempo.id], { wv: 0.6 });
    F.unterschreiben(v, f3, einst && einst.ust, "2026-08-22");

    /* F4 — Bilder, Kategorien, Herkunft, Reinigung, Installieren */
    var f4 = F.neueFassung(v, { anlass: "Rezepte aus der Schwester-App kamen ohne Platz an; Getränke sollen Bilder per KI bekommen, Fotos und PDFs vor der KI gereinigt werden", von: "kunde", datum: "2026-09-10" }).fassung;
    var p4 = f4.protokoll;
    var kat = H.bed(p4, "Eigene Kategorien: umbenennen, mit Symbol, löschen, zusammenlegen, verschieben; fremde Kategorien gehen nicht verloren", "muss", { h: 1 });
    var bild = H.bed(p4, "Bild zu einem Getränk per KI erzeugen; Kamerafotos werden verkleinert statt abgewiesen", "soll", { h: 1 });
    var herkunft = H.bed(p4, "Beim Austausch mit der Schwester-App bleibt die Herkunft am Getränk, keine Doppel", "soll", {});
    var rein = H.bed(p4, "Versteckter Text und Bild-Metadaten werden vor dem Senden an eine KI entfernt, Dateien lassen sich auf Knopfdruck prüfen", "muss", {});
    var install = H.bed(p4, "Installieren-Knopf oben und in den Einstellungen", "kann", {});
    H.e(p4, 8, "Das System muss eine Kategorie nur über ihre Kennung zuordnen; Umbenennen ändert nur die Beschriftung");
    H.e(p4, 8, "Das System muss PDFs als gereinigte Seitenbilder an eine KI geben und vorher einmal anhalten, wenn etwas entfernt wird");
    H.e(p4, 8, "Das System muss eine eigene App-Kennung tragen, damit es neben den Schwester-Apps installierbar bleibt");
    H.e(p4, 18, "Darf das Labor Bilder bei einem Bild-Dienst bestellen?", { wer: "Inhaberin", bis: "2026-09-20" });
    H.bs(f4, "neu", "Kategorien verwalten: umbenennen, Symbol, löschen, zusammenlegen, ziehen, Zuordnen aus der Zeile", "mittel", [kat.id]);
    H.bs(f4, "kipruef", "KI-Bilder fürs Getränk, Kamerafoto verkleinern", "mittel", [bild.id], { faktoren: ["ki"] });
    H.bs(f4, "altdaten", "Herkunft und feste Kennung am Getränk beim Import", "klein", [herkunft.id]);
    H.bs(f4, "dateipruef", "Reinigung vor der KI und Datei prüfen auf Knopfdruck", "mittel", [rein.id]);
    H.bs(f4, "seite", "Installieren oben und in den Einstellungen, eigene App-Kennung", "klein", [install.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-10-31");

    /* Abstimmung der Mitarbeiter — Sterne ERFUNDEN, Kürzel sind Rollen. */
    [
      [buch.id, "Theke", "IN", 5, 5], [buch.id, "Theke", "MA1", 4, 5], [buch.id, "Service", "MA2", 4, 5],
      [offline.id, "Theke", "MA1", 4, 5], [offline.id, "Leitung", "IN", 5, 5],
      [labor.id, "Leitung", "IN", 4, 4], [labor.id, "Theke", "MA1", 3, 4], [labor.id, "Service", "MA2", 3, 3],
      [scan.id, "Leitung", "IN", 5, 5], [scan.id, "Theke", "MA1", 3, 4],
      [kat.id, "Leitung", "IN", 4, 5], [kat.id, "Theke", "MA2", 3, 4],
      [karte.id, "Service", "MA2", 4, 4], [karte.id, "Gast", "KU", 3, 4]
    ].forEach(function (z) {
      B.sterneDazu(v, { zeitpunkt: "bedarf", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[3], datum: "2026-04-19" });
      B.sterneDazu(v, { zeitpunkt: "abnahme", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[4], datum: "2026-10-31" });
    });

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 36.3, 2: 65.0, 3: 124.4, 4: 162.3 };
    return v;
  }

  WN.beispiel.registrieren({ id: "mixarium", name: { de: "Mein Mixarium (fertige App)", en: "Mein Mixarium (finished app)" }, bauen: mixarium,
    quelle: "Mein-Mixarium ddf402e, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
