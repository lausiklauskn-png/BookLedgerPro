/* Beispiel „Kim-sync“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Kim-sync
   (Stand bd7f533 auf origin/main, gelesen 2026-11-13: CLAUDE.md, README, docs, git log).
   KUNDENDATEN ERFUNDEN (.example, kein echter Name). STERNE ERFUNDEN (Rollen, keine Personen).
   Fassungen nach der echten Geschichte (git log origin/main):
     F1 Mini-Messenger: Raum-Code, Bilder, Videos, Abholbestätigung, Galerie, DE/EN/RU bis 2026-10-06
     F2 Empfangene Bilder neu zeichnen, SBKIM-Knoten mit Siegel, Installieren, Manifest-Kennung bis 2026-10-18
     F3 Räume im Tresor, Dateien, Gruppe mit Leitung und Einlass, privat, Lesebestätigung, Sicherung,
        Datei-Post-Zugang aus der Gruppe, Relais je Gerät/Raum, Zulassungsdienst bis 2026-11-02
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — Kimboard (Pinnwand-Technik) und Datei-Post sind nicht mitgezählt.
   Nicht gebaut und deshalb nicht erfunden: Benachrichtigung bei ganz geschlossener App (braucht
   Push-Dienst), Nachricht an mehrere Geräte derselben Person, Warnung bei Schlüsselwechsel,
   Übersetzung über eine Cloud. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function kimsync(nr, einst) {
    var F = WN.fassungen, BD = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-10-02");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Bilder und kurze Nachrichten im kleinen Kreis, ohne fremden Messenger";
    v.beispiel = true; v.bid = "kimsync";
    v.kunde.firma = "Handwerksbetrieb Beispiel";
    v.kunde.ansprechpartner = "Inhaberin Beispiel";
    v.kunde.mail = "buero@werkstatt-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-10-02";
    H.e(p, 1, "Fotos von der Baustelle gehen über einen großen Messenger");
    H.e(p, 1, "große Videos per Mail scheitern an der Größe");
    H.e(p, 2, "Bilder");
    H.e(p, 2, "Videos");
    H.e(p, 2, "kurze Nachrichten");
    H.e(p, 3, "Inhaberin und Mitarbeiter auf der Baustelle", { anzahl: 4 });
    H.e(p, 3, "Büro", { anzahl: 1 });
    H.e(p, 4, "Fotos landen bei einem Konzern, der mitliest und auswertet");
    H.e(p, 4, "man weiß nicht, ob das Bild beim anderen angekommen ist");
    H.e(p, 5, "Ohne Konto und Telefonnummer soll es gehen, verschlüsselt, auf jedem Gerät");
    var raum = H.bed(p, "Zwei oder mehr Geräte teilen einen Raum-Code und schicken sich Bilder, Videos und kurze Nachrichten", "muss", { h: 3, text: "Fotos von der Baustelle ohne Umweg" });
    var verschl = H.bed(p, "Alles wird auf dem Gerät verschlüsselt, die Relais sehen nur verschlüsselte Teile", "muss", { text: "niemand liest mit" });
    var abholt = H.bed(p, "Ich sehe, ob das Gegenüber abgeholt hat; danach wird es vom Relais gelöscht", "muss", { h: 1 });
    var gross = H.bed(p, "Große Videos gehen über einen eigenen Datei-Dienst statt per Mail", "soll", { h: 1 });
    var galerie = H.bed(p, "Galerie aller Bilder und Videos des Raums, mehrere auswählen und löschen", "soll", {});
    var sprachen = H.bed(p, "Oberfläche auf Deutsch, Englisch und Russisch", "kann", {});
    H.e(p, 7, "Ein Foto ist in Sekunden beim Büro, und man sieht, dass es angekommen ist");
    H.e(p, 8, "Das System muss als installierbare Web-App ohne Konto auf Handy, Tablet und PC laufen");
    H.e(p, 8, "Das System muss jeden Raum über einen Code (XXXX-XXXX-XXXX-XXXX) öffnen und den Schlüssel daraus auf dem Gerät ableiten (PBKDF2, AES-GCM)");
    H.e(p, 8, "Das System muss Bilder verkleinern, Videos unverändert in Teilen senden und beim Empfänger wieder zusammensetzen");
    H.e(p, 8, "Das System muss jeden Zettel signieren und beim Empfang prüfen");
    H.e(p, 8, "Das System muss Unversandtes merken und nachsenden, sobald die Verbindung zurück ist");
    H.e(p, 8, "Das System muss nach der Abholquittung die eigenen Teile vom Relais löschen lassen");
    H.e(p, 9, "für Leute ohne Technikwissen, ein Knopf je Handgriff");
    H.e(p, 10, "Handy");
    H.e(p, 10, "Tablet");
    H.e(p, 10, "PC");
    var schnittPost = H.e(p, 12, "Datei-Dienst des Hauses für Videos über 20 MB");
    H.e(p, 13, "Baustellenfotos, Videos, kurze Abstimmungen");
    H.e(p, 14, "personenbezogene Daten: ja (Fotos)");
    H.e(p, 15, "kein Abo, keine Werbung, keine Telefonnummer");
    H.e(p, 15, "Relais sind fremde Rechner: nur verschlüsselte Teile dürfen dort liegen");
    H.e(p, 18, "Welche Relais nutzt der Betrieb?", { wer: "Kunde", bis: "2026-10-04" });
    f.umfang.kundenStundenwertCent = 3500;
    H.bs(f, "chat", "Raum-Code, Bilder, Videos und Nachrichten über Relais, signiert und verschlüsselt", "gross", [raum.id, verschl.id], { faktoren: ["offline"] });
    H.bs(f, "neu", "Abholbestätigung, Löschen vom Relais, Nachsenden", "mittel", [abholt.id]);
    H.bs(f, "datei", "Große Videos über den Datei-Dienst, Vergleich per SHA-256", "mittel", [gross.id, schnittPost.id]);
    H.bs(f, "neu", "Galerie mit Auswahl, Ziehen und Löschen; Ansicht mit Videoabspieler", "mittel", [galerie.id]);
    H.bs(f, "neu", "Sprachen DE/EN/RU, Installieren, Neu laden, drei Themen", "klein", [sprachen.id], { faktoren: ["sprachen"] });
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-06");

    /* F2 — Bilder neu zeichnen, SBKIM-Knoten */
    var f2 = F.neueFassung(v, { anlass: "Fremde Geräte schicken Fotos mit Standort und angehängten Dateien; die App soll im Netz der Schwester-Apps erkennbar sein", von: "betrieb", datum: "2026-10-13" }).fassung;
    var p2 = f2.protokoll;
    var neuzeichnen = H.bed(p2, "Empfangene Bilder werden neu gezeichnet, bevor sie gezeigt oder gespeichert werden", "muss", { text: "kein Standort, keine versteckte Datei" });
    var knoten = H.bed(p2, "Die App ist ein Knoten im Netz der eigenen Apps, mit Siegel und Lampen, ohne beim Laden etwas zu senden", "soll", {});
    var install = H.bed(p2, "Installieren auch in den Einstellungen, jede App mit eigener Kennung", "soll", {});
    H.e(p2, 8, "Das System muss ein Bild, das sich nicht zeichnen lässt, nicht zeigen und einen Hinweis setzen — nie das Original");
    H.e(p2, 8, "Das System muss eine eigene Netz-Schublade führen, getrennt vom Raum");
    var schnittNetz = H.e(p2, 12, "Netz der Schwester-Apps (SBKIM, Modulsatz aus Sage-Protokol)");
    H.bs(f2, "dateipruef", "Empfangene Bilder neu zeichnen, Bestand einmal nachzeichnen", "mittel", [neuzeichnen.id]);
    H.bs(f2, "schnitt", "SBKIM-Knoten mit Siegel, Mycel und Lampen", "mittel", [knoten.id, schnittNetz.id]);
    H.bs(f2, "seite", "Installieren in den Einstellungen, eigene Manifest-Kennung", "klein", [install.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-18");

    /* F3 — Räume, Gruppe, Dateien, Sicherung, Relais */
    var f3 = F.neueFassung(v, { anlass: "Mehrere Räume, Gruppen mit Leitung, beliebige Dateien und ein Umzug aufs neue Handy wie bei großen Messengern", von: "kunde", datum: "2026-10-25" }).fassung;
    var p3 = f3.protokoll;
    var raeume = H.bed(p3, "Mehrere Räume mit Namen, verschlüsselt gemerkt, ein Tipp wechselt", "muss", { h: 1 });
    var gruppe = H.bed(p3, "Gruppe mit Leitung: Eintritt nur mit Bestätigung, Herausnehmen nur durch die Leitung, Profilbild", "muss", {});
    var dateien = H.bed(p3, "Beliebige Dateien (PDF, App-Datei, ZIP) schicken, mit Warnung bei Programmen", "soll", {});
    var lesen = H.bed(p3, "Gelesen-Haken und private Nachricht an eine Person", "soll", {});
    var sicher = H.bed(p3, "Sicherung als Datei, auf einem neuen Gerät einspielen", "muss", { text: "Handywechsel ohne Verlust" });
    var relais = H.bed(p3, "Eigene Relais statt fremder; die Leitung gibt sie an die Gruppe weiter, nur zugelassene Geräte schreiben", "soll", {});
    var suche = H.bed(p3, "Mikrofon in jedem Textfeld, Suche nach Wort und Bedeutung, Übersetzen auf dem Gerät", "kann", {});
    H.e(p3, 8, "Das System muss je Raum einen eigenen Raumschlüssel führen; der Code öffnet nur die Tür");
    H.e(p3, 8, "Das System muss vom Relais erst löschen, wenn alle abgeholt haben");
    H.e(p3, 8, "Das System muss den Zugang zum Datei-Dienst von der Leitung an die Gruppe geben, ohne den Code zu zeigen");
    H.e(p3, 8, "Das System muss eine fremde App nicht in die Familienakte einbinden, nur Pakete transportieren");
    var schnittZul = H.e(p3, 12, "Zulassungsdienst am eigenen Relais (Server des Betriebs)");
    H.e(p3, 15, "Wer den Code hat, kann mitlesen, bis die Leitung den Raum umzieht");
    H.e(p3, 18, "Server für das private Relais einrichten", { wer: "Betrieb", bis: "2026-10-27" });
    H.bs(f3, "kipruef", "Räume im Tresor, Raumschlüssel, Einlass und Umzug durch die Leitung", "gross", [raeume.id, gruppe.id], { faktoren: ["nutzer"] });
    H.bs(f3, "datei", "Dateien jeder Art, Datei-Dienst-Zugang aus der Gruppe, Abschluss mit Schreibnachweis", "mittel", [dateien.id]);
    H.bs(f3, "chat", "Lesebestätigung, private Nachricht, Vertrauens-Haken", "mittel", [lesen.id]);
    H.bs(f3, "neu", "Sicherung in eine verschlüsselte Datei, Einspielen auf neuem Gerät", "mittel", [sicher.id]);
    H.bs(f3, "schnitt", "Relais je Gerät und Raum, Zulassungsdienst auf dem Server", "mittel", [relais.id, schnittZul.id], { faktoren: ["server"] });
    H.bs(f3, "suche", "Diktat, Wort- und Bedeutungssuche, Übersetzen auf dem Gerät", "mittel", [suche.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-11-02");

    /* Abstimmung der Mitarbeiter — erfunden, Rollen statt Namen */
    function st(z, k, b, kz, n, d) { BD.sterneDazu(v, { zeitpunkt: z, kennung: k, bereich: b, kuerzel: kz, sterne: n, datum: d }); }
    [[raum.id, "Baustelle", [["IN", 5], ["MA1", 5], ["MA2", 4]], [["IN", 5], ["MA1", 5], ["MA2", 5]]],
     [abholt.id, "Büro", [["BU", 4], ["IN", 3]], [["BU", 5], ["IN", 5], ["MA1", 4]]],
     [gross.id, "Baustelle", [["MA1", 4], ["IN", 3]], [["MA1", 4], ["MA2", 3]]],
     [neuzeichnen.id, "Büro", [["BU", 3], ["IN", 4]], [["BU", 4], ["IN", 5]]],
     [raeume.id, "Büro", [["IN", 4], ["BU", 4]], [["IN", 5], ["BU", 4], ["MA1", 4]]],
     [sicher.id, "Inhaberin", [["IN", 5], ["MA2", 3]], [["IN", 5], ["MA2", 4]]]
    ].forEach(function (z) {
      z[2].forEach(function (s) { st("bedarf", z[0], z[1], s[0], s[1], "2026-10-02"); });
      z[3].forEach(function (s) { st("abnahme", z[0], z[1], s[0], s[1], "2026-11-02"); });
    });

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 9.1, 2: 16.9, 3: 30.5 };
    return v;
  }

  WN.beispiel.registrieren({ id: "kimsync", name: { de: "Kim-sync (fertige App)", en: "Kim-sync (finished app)" }, bauen: kimsync,
    quelle: "Kim-sync bd7f533, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
