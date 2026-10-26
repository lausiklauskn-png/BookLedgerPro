/* Beispiel „Eigene Apps“ — Klaus' eigenes Vorhaben als EIN Vorgang (Klaus 2026-10-07, Frage 3):
   Mein Rezeptbuch, Sage-Protokol (Weiteraufbau), family-project / family-projekt.de, PWA-Toolpoint.
   Je App eine Gruppe Bausteine; der Name beginnt mit dem App-Namen. eigenesVorhaben → die
   Bauauftrags-MD trägt „verdeckt: nein“. Keine Kundendaten.
   INHALT aus den Repos, gelesen 2026-10-07: Mein-Rezeptbuch e8fe888, Sage-Protokol df54f0c,
   family-project 9062508, PWA-Toolpoint dad5ae6.
   Fassungen = Ausbaustufen über alle vier:
     F1 bis 2026-05-15 Rezeptbuch-Grundversion und Sage-Modulkern
     F2 bis 2026-07-16 Sage-Netz (Siegel, Relais, Rendezvous, Pinnwand, Suche, Pseudonym),
        Rezeptbuch als Knoten, family-project Grundversion
     F3 bis 2026-10-07 PWA-Toolpoint, family-project mit Server und Forschung
   Ist-Stunden: Commit-Zeitstempel ALLER VIER Repos zusammen, VEREINIGT (gleichzeitige Arbeit in
   zwei Repos zählt einmal), Lücke > 90 min = neuer Block, 30 min Vorlauf, UNTERGRENZE.
   Je Repo einzeln addiert wären es bis 2026-10-07 907,8 h statt 749,8 h. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function eigene(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-04-12");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Eigene Apps: Mein Rezeptbuch, Sage-Protokol, family-project, PWA-Toolpoint";
    v.beispiel = true; v.bid = "eigene";
    v.eigenesVorhaben = true;
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-04-12";
    H.e(p, 1, "nichts");
    H.e(p, 1, "Rezepte auf Papier und in Notizen");
    H.e(p, 2, "Dokumente");
    H.e(p, 3, "Inhaber", { anzahl: 1 });
    H.e(p, 3, "Familie und Freunde als erste Nutzer", { anzahl: 1 });
    H.e(p, 4, "Rezepte liegen verstreut und lassen sich nicht planen");
    H.e(p, 4, "Kleine Apps wissen nichts voneinander");
    H.e(p, 5, "Ohne Server und Konto gibt es keinen gemeinsamen Ort");
    var rez = H.bed(p, "Rezepte sammeln, ordnen und planen — auch offline", "muss", {});
    var imp = H.bed(p, "Rezepte aus Adresse, Foto oder Sicherung übernehmen", "soll", {});
    var aus = H.bed(p, "Rezepte als PDF, E-Book oder QR-Code teilen", "kann", {});
    var kern = H.bed(p, "Eine Quelle für die Netz-Module aller Apps", "muss", {});
    H.e(p, 7, "Kleine Apps finden einander nach Bedeutung — ohne Server, ohne Konto, privat");
    H.e(p, 8, "Das System muss offline laufen und installierbar sein");
    H.e(p, 10, "offline");
    H.e(p, 10, "Handbuch in mehreren Sprachen");
    H.e(p, 13, "Rezepte, Menüpläne, Einkaufslisten");
    H.e(p, 14, "personenbezogene Daten: nein");
    H.e(p, 15, "KI nur mit eigenem Schlüssel des Nutzers");
    H.bs(f, "liste", "Mein Rezeptbuch · Rezepte, Ordner, Kategorien", "gross", [rez.id], { faktoren: ["offline", "sprachen"] });
    H.bs(f, "liste", "Mein Rezeptbuch · Menüplan und Einkaufsliste", "mittel", [rez.id]);
    H.bs(f, "altdaten", "Mein Rezeptbuch · Import aus Adresse, Bild und Sicherung", "mittel", [imp.id]);
    H.bs(f, "scan", "Mein Rezeptbuch · KI-Scan mit der Kamera", "mittel", [imp.id], { faktoren: ["ki"] });
    H.bs(f, "datei", "Mein Rezeptbuch · PDF, E-Book, QR-Teilen", "mittel", [aus.id], { faktoren: ["druck"] });
    H.bs(f, "suche", "Sage-Protokol · Modulkern (Speicher, Spore, Bedeutungssuche)", "gross", [kern.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-05-15");

    /* F2 — das Netz */
    var f2 = F.neueFassung(v, { anlass: "Das Netz: Siegel, Relais, Rendezvous; Rezeptbuch wird Knoten; family-projekt.de", von: "betrieb", datum: "2026-05-16" }).fassung;
    var p2 = f2.protokoll;
    var netz = H.bed(p2, "Kleine Apps finden einander nach Bedeutung, ohne zentralen Index", "muss", {});
    var vertrauen = H.bed(p2, "Ein Siegel prüft, ob ein Knoten vollständig ist", "soll", {});
    var zeigen = H.bed(p2, "Die eigenen Werkzeuge an einem Ort zeigen (family-projekt.de)", "soll", {});
    H.e(p2, 12, "Relais für das Netz");
    H.bs(f2, "neu", "Sage-Protokol · Siegel, Membran, Widget, Andock", "gross", [vertrauen.id]);
    H.bs(f2, "chat", "Sage-Protokol · Relais, Rendezvous, Pseudonym", "gross", [netz.id]);
    H.bs(f2, "pinnwand", "Sage-Protokol · Pinnwand und Mycel-Karte", "gross", [netz.id]);
    H.bs(f2, "suche", "Sage-Protokol · Such-Werkzeug und Texterkennung", "mittel", [netz.id]);
    H.bs(f2, "chat", "Mein Rezeptbuch · Knoten im Netz (Siegel, Briefkästen)", "mittel", [netz.id], { wv: 0.8 });
    H.bs(f2, "seite", "family-project · Startseite und drei Räume", "mittel", [zeigen.id]);
    H.bs(f2, "shop", "family-project · Marktplatz der eigenen Apps", "mittel", [zeigen.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-07-16");

    /* F3 — offener Marktplatz und Forschung */
    var f3 = F.neueFassung(v, { anlass: "Ein Marktplatz für fremde PWAs; Einreichung über den Server; Messung", von: "betrieb", datum: "2026-07-21" }).fassung;
    var p3 = f3.protokoll;
    var markt = H.bed(p3, "Ein Marktplatz, dem Fremde trauen können (Messwerte mit Datum, Siegel)", "soll", {});
    var pflege = H.bed(p3, "Apps einreichen, freigeben und ein- oder ausschalten", "kann", {});
    H.e(p3, 10, "Server für Einreichung und Relais");
    H.e(p3, 11, "Messdienst für Ladezeit und Barrierefreiheit");
    H.bs(f3, "shop", "PWA-Toolpoint · Marktplatz für fremde PWAs", "mittel", [markt.id]);
    H.bs(f3, "auftrag", "PWA-Toolpoint · Pflege-Studio (Einsendungen, Ampel, Meldungen)", "mittel", [pflege.id]);
    H.bs(f3, "schnitt", "PWA-Toolpoint · Messwerte und Abgleich der Märkte", "mittel", [markt.id]);
    H.bs(f3, "seite", "PWA-Toolpoint · Detailseiten je App, Deutsch und Englisch", "mittel", [markt.id], { faktoren: ["sprachen"] });
    H.bs(f3, "schnitt", "family-project · Einreichung und Freigabe über den Server", "klein", [pflege.id], { faktoren: ["server"] });
    H.bs(f3, "neu", "family-project · Forschungsstation (nächtliche Messung)", "mittel", [markt.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-10-07");

    v.ist = { 1: 118.4, 2: 392.5, 3: 749.8 };
    return v;
  }

  WN.beispiel.registrieren({ id: "eigene", name: { de: "Eigene Apps (eigenes Vorhaben)", en: "Own apps (own project)" }, bauen: eigene,
    quelle: "Mein-Rezeptbuch e8fe888, Sage-Protokol df54f0c, family-project 9062508, PWA-Toolpoint dad5ae6, gelesen 2026-10-07" });
})(typeof window !== "undefined" ? window : globalThis);
