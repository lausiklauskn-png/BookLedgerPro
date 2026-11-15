/* Beispiel „Private Brain Pro“ — die fertige App für Mails, Dokumente und Fotos, durchgespielt, als wäre sie ein
   Kundenauftrag gewesen (Klaus 2026-11-13). INHALT aus dem Repo Privat-Brain-Pro (Stand 27b275f, Fassung 1.0.49,
   gelesen 2026-11-13; Merkmalsliste Datei-Organizer rueckwaertstest/private-brain-pro/REFERENZ.json). KUNDENDATEN ERFUNDEN.
   Fassungen nach der echten Geschichte (git log):
     F1 Android-App: Suchen, Einlesen, echtes Postfach, verschlüsselter Speicherort bis 2026-10-21
     F2 Teilen, KI beim Schreiben, Windows-Fassung bis 2026-10-23
     F3 Ruhigere Oberfläche, Ausbau der Suche, gemeinsamer Ablageort bis 2026-10-28
     F4 Netz mit Chef-Code und Zusammenarbeit mit der Familien-App bis 2026-11-13
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf), UNTERGRENZE,
   nur dieses Repo — die Web-Vorgängerin (Private Brain) ist nicht mitgezählt.
   Nicht gebaut und deshalb nicht erfunden: Microsoft-Konten (nur Plan), iPhone-App, Abgleich über eine Cloud. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function privatebrain(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-10-18");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Mails, Dokumente und Fotos privat auf dem eigenen Gerät durchsuchen";
    v.beispiel = true; v.bid = "privatebrainpro";
    v.kunde.firma = "Haushalt Beispiel";
    v.kunde.ansprechpartner = "Renate Beispiel";
    v.kunde.mail = "renate@haushalt-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-10-18";
    H.e(p, 1, "E-Mail");
    H.e(p, 1, "Mails in mehreren Postfächern, Dokumente auf PC, Handy und Stick verstreut");
    H.e(p, 2, "Dokumente");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 3, "Inhaberin", { anzahl: 1 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Etwas wiederfinden dauert, wenn man das genaue Wort nicht mehr weiß");
    H.e(p, 5, "Große Anbieter lesen mit; kein Werkzeug, das alles auf dem Gerät lässt");
    var finden = H.bed(p, "Mails, Dokumente und Fotos gemeinsam durchsuchen, auch nach dem Sinn statt nur nach Wörtern", "muss", { h: 4 });
    var original = H.bed(p, "Originale bleiben unverändert und lassen sich jederzeit öffnen", "muss", {});
    var postfach = H.bed(p, "Ein Postfach direkt vom Gerät (Telekom, Gmail, WEB.DE, GMX …), lesen und schreiben", "muss", { h: 2 });
    var speicher = H.bed(p, "Alles verschlüsselt auf Tablet oder SD-Karte, Ersatzschlüssel", "muss", {});
    var schutz = H.bed(p, "Warnung vor Viren, Spam und Betrug, ohne alles hochzuladen", "soll", {});
    H.e(p, 7, "Jede Unterlage ist in Sekunden gefunden, nichts verlässt das Gerät ungefragt");
    H.e(p, 8, "Das System muss ohne Internet suchen können");
    H.e(p, 8, "Das System muss jede eingelesene Datei nur einmal lesen und einen kleinen Katalog behalten");
    H.e(p, 8, "Das System muss beim Einlesen eine geprüfte Originalkopie speichern und fehlende Originale neu zuordnen lassen");
    H.e(p, 8, "Das System muss jede Datei beim Hinzufügen prüfen (Anweisung an eine KI, versteckter Text, verdächtige Anhänge) und den Befund zeigen");
    H.e(p, 8, "Das System muss echte Mailkonten über IMAP/SMTP direkt vom Gerät anbinden: lesen, schreiben, senden mit Anhang, Ordner, Entwürfe");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "offline");
    H.e(p, 10, "Android-Tablet mit SD-Karte");
    H.e(p, 11, "Web-Postfächer der Anbieter, Dateien im Explorer");
    H.e(p, 12, "Postfächer über IMAP/SMTP bzw. Google-Anmeldung");
    H.e(p, 13, "Mails mit Anhängen, PDFs, Office-Dateien, Fotos");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 15, "kein großes Unternehmen dahinter, keine Cloud");
    H.e(p, 18, "Welche Mail-Anbieter werden gebraucht?", { wer: "Inhaberin", bis: "2026-10-20" });
    f.umfang.kundenStundenwertCent = 2500;
    H.bs(f, "suche", "Suche, Dateien hinzufügen, Explorer; Bedeutungssuche auf dem Gerät", "gross", [finden.id, original.id], { faktoren: ["offline"] });
    H.bs(f, "neu", "Postfach direkt vom Gerät für mehrere Anbieter", "gross", [postfach.id]);
    H.bs(f, "datei", "Verschlüsselter Speicherort auf Tablet oder SD-Karte, Ersatzschlüssel", "mittel", [speicher.id]);
    H.bs(f, "dateipruef", "Schutz-Prüfstelle für Viren, Spam und Betrug", "mittel", [schutz.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-21");

    /* F2 — Teilen, KI beim Schreiben, Windows */
    var f2 = F.neueFassung(v, { anlass: "Am Tablet zeigte sich, was im Alltag fehlt; die App soll auch am PC laufen und verschenkt werden können", von: "kunde", datum: "2026-10-22" }).fassung;
    var p2 = f2.protokoll;
    var teilen = H.bed(p2, "Aus anderen Apps über „Teilen“ hereingeben", "soll", { h: 1 });
    var kischreib = H.bed(p2, "Beim Schreiben eine KI gegenlesen lassen, ohne dass Namen hinausgehen", "kann", {});
    var windows = H.bed(p2, "Dieselbe App unter Windows", "soll", {});
    H.bs(f2, "schnitt", "Empfang über Teilen", "klein", [teilen.id]);
    H.bs(f2, "kipruef", "KI beim Schreiben mit Verdecken der Namen", "mittel", [kischreib.id], { faktoren: ["ki"] });
    H.bs(f2, "neu", "Windows-App mit gemeinsamem Kern", "gross", [windows.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-23");

    /* F3 — Oberfläche, Suche, Ablageort */
    var f3 = F.neueFassung(v, { anlass: "Die App war funktional, aber unübersichtlich; alle Apps sollen einen gemeinsamen Ablageort haben", von: "kunde", datum: "2026-10-24" }).fassung;
    var p3 = f3.protokoll;
    var ruhig = H.bed(p3, "Ruhige Oberfläche mit Farbthemen und kompakten Zeilen", "soll", {});
    var ocr = H.bed(p3, "Text in Fotos und Scans auf dem Gerät lesen, Mails lokal übersetzen", "soll", { h: 1 });
    var gemeinsam = H.bed(p3, "Gemeinsamer verschlüsselter Ablageort mit den anderen Apps; Mails an die Buchhaltung geben", "soll", {});
    H.bs(f3, "neu", "Designumbau: Themen, Liniensymbole, kompakte Zeilen", "mittel", [ruhig.id]);
    H.e(p3, 8, "Das System muss einen gemeinsamen Ablageort aller Apps mit einem Passwort nutzen; Einrichten nur durch Wahl des Speichers");
    H.bs(f3, "suche", "Lokale Texterkennung, lokale Übersetzung, Bildbeschreibung", "mittel", [ocr.id], { faktoren: ["sprachen"] });
    H.bs(f3, "datei", "Gemeinsamer Tresorordner, An Buchhaltung teilen", "mittel", [gemeinsam.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-10-28");

    /* F4 — Netz, Chef-Code, Familien-App */
    var f4 = F.neueFassung(v, { anlass: "Mitarbeiter und Familie sollen Dokumente arbeitsplatzübergreifend finden und gezielt an andere Apps weitergeben", von: "kunde", datum: "2026-10-29" }).fassung;
    var p4 = f4.protokoll;
    var ueberall = H.bed(p4, "Überall suchen: eigener Katalog, gemeinsamer Ablageort und auf Wunsch das eigene Netz", "soll", { h: 1 });
    var chef = H.bed(p4, "Ein Chef legt das eigene Netz fest; Mitarbeiter treten mit einem Zettel bei", "kann", {});
    var familie = H.bed(p4, "Mails mit Anhängen an die Familien-App geben", "kann", {});
    H.e(p4, 18, "Microsoft-Konten anbinden — Registrierung fehlt noch", { wer: "Inhaberin", bis: "" });
    H.bs(f4, "suche", "„Überall suchen“ über Katalog, Ablageort und Netz", "mittel", [ueberall.id], { faktoren: ["nutzer"] });
    H.bs(f4, "lizenz", "Chef-PIN und Beitritts-Zettel für das eigene Netz", "klein", [chef.id]);
    H.bs(f4, "schnitt", "Übergabe an die Familien-App", "klein", [familie.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-11-13");

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie (wie Tomys Hub gesamt). */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    /* Abstimmung der Mitarbeiter (erfunden, nur Rollenkürzel, keine Namen). */
    [["bedarf", finden.id, "Haushalt", "IN", 5],
     ["abnahme", finden.id, "Haushalt", "IN", 5],
     ["bedarf", postfach.id, "Haushalt", "IN", 4],
     ["abnahme", postfach.id, "Haushalt", "IN", 4],
     ["bedarf", speicher.id, "Haushalt", "IN", 5],
     ["abnahme", speicher.id, "Haushalt", "IN", 4],
     ["bedarf", schutz.id, "Haushalt", "IN", 3],
     ["abnahme", schutz.id, "Haushalt", "IN", 4]
    ].forEach(function (s) { WN.bedarf.sterneDazu(v, { zeitpunkt: s[0], kennung: s[1], bereich: s[2], kuerzel: s[3], sterne: s[4], datum: s[0] === "bedarf" ? "2026-10-18" : "2026-11-13" }); });
    v.ist = { 1: 31.0, 2: 48.7, 3: 102.8, 4: 121.0 };
    return v;
  }

  WN.beispiel.registrieren({ id: "privatebrainpro", name: { de: "Private Brain Pro (fertige App)", en: "Private Brain Pro (finished app)" }, bauen: privatebrain,
    quelle: "Privat-Brain-Pro 27b275f, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
