/* Beispiel „Pro-Verbund“ — Familienakte und die drei Pro-Apps als EIN Gesamtauftrag (Klaus 2026-11-13: „Die Familienakte und
   die Pro-Geschichte sollen zusammengeführt werden“), wie „Tomys Hub — Gesamtprogramm“. Die vier Apps stehen daneben auch als
   eigene Beispiele (familienakte, bookledgerpro, workflowpdfpro, privatebrainpro).
   Quellen: Meine-Familienakte a10e96f · BookLedgerPro 9b76370 · Workflow-PDF-Pro d37701a · Privat-Brain-Pro 27b275f (gelesen 2026-11-13).
   Fassungen auf der gemeinsamen Zeitachse:
     F1 bis 2026-10-22 Buchhaltung (Web, seit Juni), Private Brain Pro und Workflow PDF Pro als Android-Apps
     F2 bis 2026-10-29 Familienakte neu ohne Server, gemeinsamer Tresorordner, Windows-Fassungen
     F3 bis 2026-11-05 Pro-Verbund: Übergaben mit Quittung, Eingang und Scanner, BookLedgerPro als App
     F4 bis 2026-11-13 Kalender und Abgleich, Neuausrichtung Buchhaltung, Überall suchen, Verbund-Karte, Sortier-Kern
   Ist-Stunden: je Repo aus Commit-Zeiten (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf) und ADDIERT, Untergrenze;
   gleichzeitige Arbeit an zwei Repos zählt doppelt. Kundendaten und Sterne der Mitarbeiter ERFUNDEN (Rollenkürzel, keine Namen). */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function proverbund(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-10-15");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Familie und Betrieb: Unterlagen, Buchhaltung, PDFs und Mails in einem Verbund eigener Apps";
    v.beispiel = true; v.bid = "proverbund";
    v.kunde.firma = "Familienbetrieb Beispiel";
    v.kunde.ansprechpartner = "Petra Beispiel";
    v.kunde.mail = "buero@familienbetrieb-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-10-15";
    H.e(p, 1, "Papier"); H.e(p, 1, "E-Mail"); H.e(p, 1, "Excel");
    H.e(p, 1, "Familienunterlagen in Ordnern, Belege im Schuhkarton, Formulare ausgedruckt, Mails in drei Postfächern");
    H.e(p, 2, "Dokumente"); H.e(p, 2, "Buchhaltung"); H.e(p, 2, "Kundenkontakt"); H.e(p, 2, "Termin");
    H.e(p, 3, "Inhaberin", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiterinnen im Laden", { anzahl: 2 });
    H.e(p, 3, "Familie (Partner, Kinder, pflegebedürftige Mutter)", { anzahl: 4 });
    H.e(p, 3, "Steuerberater", { anzahl: 1 });
    H.e(p, 4, "doppelte Eingabe"); H.e(p, 4, "fehlende Übersicht"); H.e(p, 4, "Fristen werden verpasst");
    H.e(p, 5, "Jedes Programm hat seinen eigenen Speicher, nichts arbeitet zusammen; Cloud-Dienste lesen mit");
    var buch = H.bed(p, "Buchhaltung des Ladens offline und verschlüsselt, wie das Finanzamt es verlangt", "muss", { h: 6 });
    var pdf = H.bed(p, "Briefe scannen, Formulare am Gerät ausfüllen, PDFs übersetzen", "muss", { h: 4 });
    var brain = H.bed(p, "Mails, Dokumente und Fotos gemeinsam durchsuchen, auch nach dem Sinn; Postfach direkt vom Gerät", "muss", { h: 4 });
    var geraete = H.bed(p, "Als Apps auf Android-Tablet und Windows-PC, ohne Konto beim Anbieter", "muss", {});
    H.e(p, 7, "Jede Unterlage ist einmal erfasst, liegt an einem Ort und ist von jeder App aus zu finden");
    H.e(p, 8, "Das System muss ohne Internet arbeiten; KI nur auf Wunsch, aus der EU, mit eigenem Schlüssel und nach Bestätigung");
    H.e(p, 8, "Das System muss Originale unverändert aufbewahren und jede Buchung unveränderbar festschreiben");
    H.e(p, 9, "Abläufe ändern: Belege und Post sofort erfassen");
    H.e(p, 10, "Geräte"); H.e(p, 10, "offline"); H.e(p, 10, "SD-Karte im Tablet");
    H.e(p, 11, "Web-Vorgänger der Apps, Excel, Web-Postfächer");
    H.e(p, 12, "Export an den Steuerberater");
    H.e(p, 13, "Belege, Briefe, Formulare, Mails mit Anhängen, Fotos, Gesundheitsunterlagen");
    H.e(p, 14, "personenbezogene Daten: ja"); H.e(p, 14, "Gesundheitsdaten — besonders schutzwürdig");
    H.e(p, 15, "kein Abo, kein Konto beim Anbieter, keine Cloud");
    f.umfang.kundenStundenwertCent = 3000;
    H.bs(f, "rechnung", "BookLedgerPro · Buchhaltungs-Kern, Belege, Rechnungen, USt/EÜR, Export (Web)", "gross", [buch.id], { faktoren: ["offline"] });
    H.bs(f, "scan", "Workflow PDF Pro · Scannen, Formulare, Übersetzen als Android-App", "gross", [pdf.id, geraete.id], { wv: 0.8 });
    H.bs(f, "suche", "Private Brain Pro · Suche, Einlesen, Explorer, Bedeutungssuche", "gross", [brain.id], { faktoren: ["offline"] });
    H.bs(f, "neu", "Private Brain Pro · Postfach direkt vom Gerät", "gross", [brain.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-22");

    var f2 = F.neueFassung(v, { anlass: "Die Familienunterlagen sollen privat dazukommen, und alle Apps sollen einen Ablageort mit einem Passwort teilen", von: "kunde", datum: "2026-10-23" }).fassung;
    var p2 = f2.protokoll;
    var akte = H.bed(p2, "Familienunterlagen nach Lebensbereichen (Gesundheit, Familie, Wohnen, Fahrzeuge, Käufe), mit Fristen", "muss", { h: 4 });
    var tresor = H.bed(p2, "Ein gemeinsamer verschlüsselter Ablageort aller Apps mit einem Passwort, auf SD-Karte oder Gerät", "muss", {});
    var win = H.bed(p2, "Dieselben Apps unter Windows", "soll", {});
    H.e(p2, 8, "Das System muss im gemeinsamen Ablageort Fächer je App und Übergabefächer führen, mit verschlüsseltem Inhaltsverzeichnis");
    H.bs(f2, "neu", "Meine Familienakte · Neuaufbau ohne Server, Bereiche, Fristen, Sicherung, Android und Windows", "gross", [akte.id]);
    H.bs(f2, "datei", "Gemeinsamer Tresorordner (Paket in Workflow PDF Pro, byte-gleich in allen Apps)", "mittel", [tresor.id]);
    H.bs(f2, "neu", "Windows-Fassungen von Private Brain Pro und Workflow PDF Pro", "gross", [win.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-29");

    var f3 = F.neueFassung(v, { anlass: "Dokumente sollen zwischen den Apps verlässlich hin und her gehen; Post und Belege ohne Abtippen hinein", von: "kunde", datum: "2026-10-30" }).fassung;
    var p3 = f3.protokoll;
    var verbund = H.bed(p3, "Übergaben zwischen den Apps mit Quittung: Mail an die Familienakte, Beleg an die Buchhaltung, PDF an die Akte", "muss", { h: 2 });
    var eingang = H.bed(p3, "Brief fotografieren, Text lesen, Einordnung und Frist vorschlagen; ich bestätige", "muss", { h: 3 });
    var blpApp = H.bed(p3, "Die Buchhaltung als App am Tablet und PC, Belege direkt aus Scanner und Mail", "soll", {});
    H.e(p3, 8, "Das System muss nichts ohne Bestätigung ablegen und nie selbst etwas verschicken");
    H.bs(f3, "schnitt", "Pro-Verbund: Übergaben mit Quittung zwischen allen vier Apps", "mittel", [verbund.id], { faktoren: ["nutzer"] });
    H.bs(f3, "scan", "Familienakte · Eingang mit Scanner, Texterkennung, Vorschlag", "gross", [eingang.id]);
    H.bs(f3, "neu", "BookLedgerPro · Android- und Windows-App, Scanner, Mail-Teilen", "gross", [blpApp.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-11-05");

    var f4 = F.neueFassung(v, { anlass: "Gerätetests: Erinnerungen, Kasse, Suche über alle Apps, Übersicht wie die Apps zusammenhängen", von: "kunde", datum: "2026-11-06" }).fassung;
    var p4 = f4.protokoll;
    var kalender = H.bed(p4, "Kalender mit Erinnerung, Abgleich zwischen den Familiengeräten ohne fremden Server", "soll", { h: 1 });
    var kasse = H.bed(p4, "Kasse mit Tagesabschluss, Startseite mit Umsatzsteuer und Rücklage, Belege ohne KI vorkontiert", "muss", { h: 2 });
    var ueberall = H.bed(p4, "In allen Apps gleichzeitig suchen, auf Wunsch im eigenen Netz mit Chef-Code", "kann", {});
    var karte = H.bed(p4, "Eine Karte, wie die Apps zusammenhängen, und „Wo liegt was?“", "kann", {});
    H.bs(f4, "neu", "Familienakte · Kalender, Glocke, Abgleich, Vollsicherung, E-Mail-Wege, Sortier-Kern", "gross", [kalender.id]);
    H.bs(f4, "rechnung", "BookLedgerPro · Kasse & Shop, Startseite, trainierte Belegerkennung", "mittel", [kasse.id]);
    H.bs(f4, "suche", "„Überall suchen“ und Chef-Code (gemeinsamer Baustein)", "mittel", [ueberall.id]);
    H.bs(f4, "seite", "Pro-Verbund-Karte und Hilfe „Wo liegt was?“", "klein", [karte.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-11-13");

    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    /* Abstimmung der Mitarbeiter und der Familie (erfunden, nur Rollenkürzel). */
    [["bedarf", buch.id, "Buchhaltung", "IN", 5], ["bedarf", buch.id, "Buchhaltung", "BH", 4], ["abnahme", buch.id, "Buchhaltung", "IN", 4], ["abnahme", buch.id, "Buchhaltung", "BH", 5],
     ["bedarf", akte.id, "Familie", "IN", 5], ["bedarf", akte.id, "Familie", "FA", 4], ["abnahme", akte.id, "Familie", "IN", 5], ["abnahme", akte.id, "Familie", "FA", 4],
     ["bedarf", verbund.id, "Büro", "IN", 4], ["bedarf", verbund.id, "Laden", "MA1", 3], ["abnahme", verbund.id, "Büro", "IN", 4], ["abnahme", verbund.id, "Laden", "MA1", 4],
     ["bedarf", kasse.id, "Laden", "MA1", 5], ["bedarf", kasse.id, "Laden", "MA2", 4], ["abnahme", kasse.id, "Laden", "MA1", 5], ["abnahme", kasse.id, "Laden", "MA2", 4],
     ["bedarf", eingang.id, "Familie", "FA", 4], ["abnahme", eingang.id, "Familie", "FA", 3]
    ].forEach(function (s) { WN.bedarf.sterneDazu(v, { zeitpunkt: s[0], kennung: s[1], bereich: s[2], kuerzel: s[3], sterne: s[4], datum: s[0] === "bedarf" ? "2026-10-15" : "2026-11-13" }); });
    v.ist = { 1: 179.0, 2: 312.9, 3: 424.9, 4: 517.9 };
    return v;
  }

  WN.beispiel.registrieren({ id: "proverbund", name: { de: "Pro-Verbund: Familienakte + Pro-Apps (gesamt)", en: "Pro suite: family file + Pro apps (overall)" }, bauen: proverbund,
    quelle: "Meine-Familienakte a10e96f, BookLedgerPro 9b76370, Workflow-PDF-Pro d37701a, Privat-Brain-Pro 27b275f, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
