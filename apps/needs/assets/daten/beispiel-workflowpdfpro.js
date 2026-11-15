/* Beispiel „Workflow PDF Pro“ — die fertige PDF- und Formular-App, durchgespielt, als wäre sie ein Kundenauftrag
   gewesen (Klaus 2026-11-13). INHALT aus dem Repo Workflow-PDF-Pro (Stand d37701a, Fassung 1.0.16, gelesen
   2026-11-13; Merkmalsliste Datei-Organizer rueckwaertstest/workflow-pdf-pro/REFERENZ.json). KUNDENDATEN ERFUNDEN.
   Fassungen nach der echten Geschichte (git log, Versionen 1.0.x):
     F1 Native App für Android und Windows, verschlüsselte Ablage bis 2026-10-22 (1.0.0–1.0.3)
     F2 Gemeinsamer Ablageort, Sicherung, Scanner bis 2026-10-29 (1.0.4–1.0.9)
     F3 Suche über alle Apps und Zusammenarbeit der Apps bis 2026-11-03 (1.0.10–1.0.13)
     F4 Schutz beim Einrichten und Übersicht der Apps bis 2026-11-09 (1.0.14–1.0.16)
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf), UNTERGRENZE,
   nur dieses Repo — der Formular-Kern stammt aus der Web-App Workflow PDF und ist nicht mitgezählt.
   Nicht gebaut und deshalb nicht erfunden: eigene iPhone-App (nur vorbereitet), qualifizierte elektronische
   Signatur, Abgleich über ein Online-Konto. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function wfpdf(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-10-19");
    var H = WN.beispiel.hilfen(v);
    v.titel = "PDFs scannen, ausfüllen und übersetzen — als App auf Tablet und PC";
    v.beispiel = true; v.bid = "workflowpdfpro";
    v.kunde.firma = "Schreibbüro Beispiel";
    v.kunde.ansprechpartner = "Monika Beispiel";
    v.kunde.mail = "post@schreibbuero-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-10-19";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Drucken, von Hand ausfüllen, wieder einscannen");
    H.e(p, 1, "eine Web-App im Browser, deren Daten beim Löschen des Browsers weg wären");
    H.e(p, 2, "Dokumente");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 3, "Inhaberin", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiterinnen", { anzahl: 2 });
    H.e(p, 4, "Zeitverlust");
    H.e(p, 4, "Formulare kommen schief und unleserlich zurück");
    H.e(p, 5, "Kein Werkzeug, das Formularfelder erkennt und ohne Konto läuft");
    var scan = H.bed(p, "Briefe mit Tablet oder Handy abfotografieren und als ordentliches PDF ablegen", "muss", { h: 4 });
    var formular = H.bed(p, "Formularfelder erkennen und am Gerät ausfüllen, als festes oder ausfüllbares PDF ausgeben", "muss", { h: 5 });
    var uebers = H.bed(p, "Fremdsprachige Schreiben übersetzen, im Aufbau des Originals", "soll", { h: 2 });
    var app = H.bed(p, "Als echte App auf Android-Tablet und Windows-PC, ohne Konto", "muss", {});
    var ablage = H.bed(p, "Ablage verschlüsselt, auf Wunsch in einem selbst gewählten Ordner, Ersatzschlüssel bei vergessenem Passwort", "muss", {});
    H.e(p, 7, "Ein Formular ist in Minuten ausgefüllt und verschickt, ohne Drucker");
    H.e(p, 8, "Das System muss ohne Internet arbeiten; KI nur auf Wunsch und mit eigenem Schlüssel");
    H.e(p, 8, "Das System muss Originale unverändert aufbewahren");
    H.e(p, 8, "Das System muss den vollen Funktionsumfang der bestehenden Formular-Web-App übernehmen und um Geräteanbindung und verschlüsselte Ablage ergänzen");
    H.e(p, 8, "Das System muss die Web-App weiterführen (für iPhone und iPad) und auf demselben Stand halten wie die Apps");
    H.e(p, 8, "Das System muss ohne Ordnerwahl mit einer internen Arbeitsablage starten; ein eigener Ordner ist freiwillig");
    H.e(p, 15, "Windows-Installer zunächst unsigniert (Warnung beim Installieren wird erklärt)");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "offline");
    H.e(p, 11, "Web-App im Browser");
    H.e(p, 12, "Teilen an Mail und andere Apps");
    H.e(p, 13, "Briefe, Formulare, Fotos, ausgefüllte PDFs");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 15, "Vorgaben");
    H.e(p, 18, "Brauchen die Mitarbeiterinnen eigene Geräte?", { wer: "Inhaberin", bis: "2026-10-25" });
    f.umfang.kundenStundenwertCent = 3000;
    H.bs(f, "scan", "Scannen, Formularfelder erkennen und ausfüllen, Ausgabe fest oder ausfüllbar", "gross", [scan.id, formular.id], { wv: 0.8, faktoren: ["druck"] });
    H.bs(f, "neu", "Übersetzen im Aufbau des Originals", "mittel", [uebers.id], { wv: 0.8, faktoren: ["sprachen"] });
    H.bs(f, "neu", "Android-App (dauerhaft signiert) und Windows-App (Installer zunächst unsigniert)", "gross", [app.id]);
    H.bs(f, "datei", "Verschlüsselte Hauptablage (intern oder im gewählten Ordner), Ersatzschlüssel 3 von 5", "mittel", [ablage.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-22");

    /* F2 — gemeinsamer Ablageort, Sicherung, Scanner */
    var f2 = F.neueFassung(v, { anlass: "Mehrere Apps sollen einen Ablageort mit einem Passwort teilen; Tests am Tablet zeigten Speicherprobleme und ungewollte Hintergrundarbeit", von: "kunde", datum: "2026-10-23" }).fassung;
    var p2 = f2.protokoll;
    var tresor = H.bed(p2, "Ein gemeinsamer verschlüsselter Ablageort für alle Apps des Büros", "soll", {});
    var sicherung = H.bed(p2, "Sicherung, die auch bei großen Beständen nicht abstürzt; Prüfen und Einordnen nur auf Knopfdruck", "muss", {});
    var scanner = H.bed(p2, "Scanner und Kamera auch am Windows-PC; andere Apps können den Scanner direkt starten", "soll", { h: 1 });
    H.bs(f2, "datei", "Einzug in den gemeinsamen Tresorordner, Einstellungen „Tresor & Ablage“", "mittel", [tresor.id]);
    H.e(p2, 8, "Das System muss im gemeinsamen Ablageort Fächer je App und Übergabefächer führen, mit verschlüsseltem Inhaltsverzeichnis je Fach");
    H.e(p2, 8, "Das System muss die Bibliothek als verschlüsselte Sicherungsdatei sichern; Zurückholen fügt hinzu und überschreibt nie");
    H.bs(f2, "neu", "Gestreamte Sicherung, Hintergrundaufgabe, nichts startet von selbst", "mittel", [sicherung.id]);
    H.bs(f2, "scan", "Scanner und Kamera unter Windows, Direktstart aus anderen Apps", "mittel", [scanner.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-29");

    /* F3 — Suche und Zusammenarbeit der Apps */
    var f3 = F.neueFassung(v, { anlass: "Dokumente sollen zwischen den Apps des Betriebs verlässlich hin und her gehen, ohne doppelt oder verloren zu gehen", von: "kunde", datum: "2026-10-30" }).fassung;
    var p3 = f3.protokoll;
    var ueberall = H.bed(p3, "In allen Apps gleichzeitig suchen, auf Wunsch auch im eigenen Netz", "kann", { h: 1 });
    var verbund = H.bed(p3, "Dokumente an die Familien-, Mail- und Buchhaltungs-App übergeben, mit Quittung", "soll", {});
    var schrift = H.bed(p3, "Schriftgröße je Feld, eigene Feldarten", "kann", {});
    H.e(p3, 12, "Familien-App, Mail-App, Buchhaltungs-App des Betriebs");
    H.e(p3, 8, "Das System muss mit der Familien-, Mail- und Buchhaltungs-App nur freiwillig zusammenarbeiten: Eingang mit Einzelauswahl, Übergabe mit Quittung");
    H.bs(f3, "suche", "„Überall suchen“ über Bibliothek, Ablageort und eigenes Netz", "mittel", [ueberall.id]);
    H.bs(f3, "schnitt", "Übergabe an die anderen Apps mit Quittung", "mittel", [verbund.id]);
    H.bs(f3, "scan", "Schriftgröße je Feld, eigene Feldarten", "klein", [schrift.id], { wv: 0.8 });
    F.unterschreiben(v, f3, einst && einst.ust, "2026-11-03");

    /* F4 — Schutz beim Einrichten, Übersicht */
    var f4 = F.neueFassung(v, { anlass: "Beim Einrichten am Gerät entstanden falsche Ordner und leere Dateien; Nutzer sollen verstehen, wo was liegt", von: "bau", datum: "2026-11-04" }).fassung;
    var p4 = f4.protokoll;
    var schutz = H.bed(p4, "Ordnerwahl ohne Verschachtelung, Rückfrage vor neuer Ablage, Warnung beim Speichern in den Ablageort", "muss", {});
    var karte = H.bed(p4, "Eine Übersicht, wie die Apps zusammenhängen, und „Wo liegt was?“", "kann", {});
    H.bs(f4, "neu", "Tresor-Schutz beim Einrichten und Speichern", "klein", [schutz.id]);
    H.bs(f4, "seite", "Hilfe „Wo liegt was?“ und Übersichtskarte der Apps", "klein", [karte.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-11-09");

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie (wie Tomys Hub gesamt). */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    /* Abstimmung der Mitarbeiter (erfunden, nur Rollenkürzel, keine Namen). */
    [["bedarf", scan.id, "Büro", "MA1", 5],
     ["bedarf", scan.id, "Büro", "MA2", 4],
     ["abnahme", scan.id, "Büro", "MA1", 5],
     ["abnahme", scan.id, "Büro", "MA2", 4],
     ["bedarf", formular.id, "Büro", "IN", 5],
     ["bedarf", formular.id, "Büro", "MA1", 5],
     ["abnahme", formular.id, "Büro", "IN", 4],
     ["abnahme", formular.id, "Büro", "MA1", 5],
     ["bedarf", uebers.id, "Büro", "MA2", 3],
     ["abnahme", uebers.id, "Büro", "MA2", 4]
    ].forEach(function (s) { WN.bedarf.sterneDazu(v, { zeitpunkt: s[0], kennung: s[1], bereich: s[2], kuerzel: s[3], sterne: s[4], datum: s[0] === "bedarf" ? "2026-10-19" : "2026-11-09" }); });
    v.ist = { 1: 20.7, 2: 39.4, 3: 60.6, 4: 66.4 };
    return v;
  }

  WN.beispiel.registrieren({ id: "workflowpdfpro", name: { de: "Workflow PDF Pro (fertige App)", en: "Workflow PDF Pro (finished app)" }, bauen: wfpdf,
    quelle: "Workflow-PDF-Pro d37701a, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
