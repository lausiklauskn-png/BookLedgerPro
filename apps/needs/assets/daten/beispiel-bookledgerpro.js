/* Beispiel „BookLedgerPro“ — die fertige Buchhaltungs-App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13). INHALT aus dem Repo BookLedgerPro (Stand 9b76370, Fassung 0.1.17, gelesen 2026-11-13;
   Merkmalsliste Datei-Organizer rueckwaertstest/bookledgerpro/REFERENZ.json). KUNDENDATEN ERFUNDEN (.example).
   Fassungen nach der echten Geschichte (git log):
     F1 Buchhaltungs-Kern, verschlüsselt und offline bis 2026-06-19 (Phasen 0–6, Lohn)
     F2 Anbindung an die anderen Apps und KI-Hilfe aus der EU bis 2026-10-25
     F3 Android- und Windows-App, gemeinsamer Ablageort, Scanner und Mail bis 2026-11-05
     F4 Neuausrichtung auf kleine Betriebe: Kasse, Startseite, Belegerkennung ohne KI bis 2026-11-13
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf), UNTERGRENZE.
   Nicht gebaut und deshalb nicht erfunden: ELSTER-Übermittlung, Bankabruf (Online-Banking), TSE-Kasse,
   Warenbestand mit Inventur (liegt in der Warenwirtschaft einer anderen App). */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function bookledger(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-06-12");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Buchhaltung für einen kleinen Betrieb, offline und verschlüsselt";
    v.beispiel = true; v.bid = "bookledgerpro";
    v.kunde.firma = "Laden Beispiel";
    v.kunde.ansprechpartner = "Petra Beispiel";
    v.kunde.mail = "buero@laden-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-06-12";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Excel");
    H.e(p, 1, "Quittungen im Schuhkarton, Monatsende beim Steuerberater");
    H.e(p, 2, "Buchhaltung");
    H.e(p, 2, "Auftrag");
    H.e(p, 3, "Inhaberin", { anzahl: 1 });
    H.e(p, 3, "Steuerberater", { anzahl: 1 });
    H.e(p, 4, "doppelte Eingabe");
    H.e(p, 4, "fehlende Übersicht über Umsatzsteuer und Kasse");
    H.e(p, 5, "Cloud-Buchhaltungen kosten monatlich und die Daten liegen beim Anbieter");
    var kern = H.bed(p, "Einnahmen und Ausgaben richtig buchen, mit Konten, wie das Finanzamt es verlangt", "muss", { h: 6, text: "weniger Zeit beim Steuerberater" });
    var fest = H.bed(p, "Gebuchtes nicht mehr still änderbar: Korrektur nur als Gegenbuchung", "muss", {});
    var belege = H.bed(p, "Belege einlesen und einen Buchungsvorschlag bekommen", "muss", { h: 4 });
    var rechnung = H.bed(p, "Kunden, Aufträge und Rechnungen, die gleich gebucht werden", "soll", { h: 3 });
    var ust = H.bed(p, "Umsatzsteuer-Voranmeldung und EÜR auf Knopfdruck, Export für den Steuerberater", "muss", { h: 3 });
    var sicher = H.bed(p, "Alles mit Passwort verschlüsselt, Sicherung, Ersatzschlüssel bei vergessenem Passwort", "muss", { text: "Daten bleiben im Betrieb" });
    H.e(p, 7, "Am Monatsende ist alles gebucht, die Umsatzsteuer ist bekannt, der Steuerberater bekommt eine Datei");
    H.e(p, 8, "Das System muss ohne Internet und ohne Konto beim Anbieter laufen");
    H.e(p, 8, "Das System muss jede Buchung mit Beleg und Zeitstempel unveränderbar festhalten");
    H.e(p, 8, "Das System muss doppelt buchen (Soll/Haben, Kontenrahmen SKR03) und die Umsatzsteuer automatisch aufteilen");
    H.e(p, 8, "Das System muss festgeschriebene Buchungen nie löschen, nur stornieren, und die Unveränderbarkeit mit einer Hash-Kette sichern (GoBD)");
    H.e(p, 8, "Das System muss die Daten als DATEV-orientierte CSV für den Steuerberater ausgeben");
    H.e(p, 9, "Abläufe ändern: Belege sofort erfassen statt am Monatsende");
    H.e(p, 10, "offline");
    H.e(p, 10, "Geräte");
    H.e(p, 11, "Excel-Tabelle, Kassenbuch auf Papier");
    var schnittStb = H.e(p, 12, "Export an den Steuerberater (DATEV-orientiert)");
    H.e(p, 13, "Belege (Fotos, PDF), Buchungen, Konten, Kunden, Rechnungen");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 14, "Aufbewahrungsfristen nach GoBD");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "kein Abo");
    H.e(p, 18, "Welcher Kontenrahmen gilt beim Steuerberater?", { wer: "Inhaberin", bis: "2026-06-15" });
    f.umfang.kundenStundenwertCent = 3500;
    H.bs(f, "rechnung", "Buchhaltungs-Kern: Konten, doppelte Buchführung, Festschreibung mit Storno", "gross", [kern.id, fest.id], { faktoren: ["offline"] });
    H.bs(f, "scan", "Belege einlesen mit Erkennung und Buchungsvorschlag", "mittel", [belege.id]);
    H.bs(f, "auftrag", "Kunden, Aufträge, Rechnungen mit Buchung", "mittel", [rechnung.id]);
    H.bs(f, "rechnung", "USt-Voranmeldung, EÜR, Export an den Steuerberater", "mittel", [ust.id, schnittStb.id]);
    H.bs(f, "datei", "Verschlüsselter Tresor, Pflicht-Sicherung, Ersatzschlüssel", "mittel", [sicher.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-06-19");

    /* F2 — Anbindung und KI aus der EU */
    var f2 = F.neueFassung(v, { anlass: "Nicht doppelt tippen: Aufträge, Shop-Umsätze und Belege kommen aus den Apps, die der Betrieb schon nutzt; KI-Hilfe nur aus der EU", von: "kunde", datum: "2026-07-01" }).fassung;
    var p2 = f2.protokoll;
    var uebernahme = H.bed(p2, "Aufträge und Angebote aus der Auftrags-App und dem Angebotsplaner übernehmen", "soll", { h: 2 });
    var euki = H.bed(p2, "Texterkennung und Kontierungshilfe nur über EU-Anbieter, mit eigenem Schlüssel und nach Bestätigung", "kann", { h: 2 });
    H.e(p2, 12, "Auftrags-App, Angebotsplaner, Warenwirtschaft des Ladens");
    H.e(p2, 14, "Vor jeder KI werden Namen verdeckt");
    H.bs(f2, "schnitt", "Übernahme aus Auftrags-App, Angebotsplaner und Shop-Warenwirtschaft", "mittel", [uebernahme.id]);
    H.bs(f2, "kipruef", "EU-Texterkennung und Kontierungshilfe mit Prüfung vor der KI", "mittel", [euki.id], { faktoren: ["ki"] });
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-25");

    /* F3 — native Apps, Ablageort, Scanner, Mail */
    var f3 = F.neueFassung(v, { anlass: "Am Tablet und am PC im Laden arbeiten, Belege direkt aus Scanner und Mail, Daten sicher auf SD-Karte zusammen mit den anderen Apps", von: "kunde", datum: "2026-10-26" }).fassung;
    var p3 = f3.protokoll;
    var nativ = H.bed(p3, "Als App auf dem Android-Tablet und unter Windows, Updates ohne App-Laden", "muss", {});
    var ablage = H.bed(p3, "Gemeinsamer verschlüsselter Ablageort mit den anderen Apps, automatische Sicherung", "soll", {});
    var scanmail = H.bed(p3, "Belege scannen und Rechnungsmails teilen, Positionen werden gelesen", "soll", { h: 2 });
    var suche = H.bed(p3, "Belege nach Wörtern und nach Bedeutung durchsuchen", "kann", { h: 1 });
    H.e(p3, 10, "Android-Tablet, Windows-PC, SD-Karte");
    H.bs(f3, "neu", "Android- und Windows-App mit Updates vom eigenen Server", "gross", [nativ.id]);
    H.bs(f3, "datei", "Gemeinsamer Tresorordner mit den anderen Apps, automatische Sicherung", "mittel", [ablage.id]);
    H.bs(f3, "scan", "Scanner und Mail-Teilen mit Rechnungspositionen", "mittel", [scanmail.id]);
    H.bs(f3, "suche", "Suche über Belege nach Wörtern und Bedeutung", "mittel", [suche.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-11-05");

    /* F4 — Neuausrichtung */
    var f4 = F.neueFassung(v, { anlass: "Die App wirkte wie ein Haushaltsbuch: auf einen Blick Kasse, Umsatzsteuer, Rücklage; Belege ohne Tipparbeit und ohne Datenweitergabe vorkontieren", von: "kunde", datum: "2026-11-09" }).fassung;
    var p4 = f4.protokoll;
    var kasse = H.bed(p4, "Offene Ladenkasse mit Tagesabschluss und Quittungsvorlage", "muss", { h: 2 });
    var start = H.bed(p4, "Startseite mit fälliger Umsatzsteuer, Steuer-Rücklage und Kassenstand", "soll", {});
    var mehrere = H.bed(p4, "Mehrere Buchhaltungen (Laden, zweiter Laden, Haushalt) auf einem Gerät", "soll", {});
    var erkennung = H.bed(p4, "Belegerkennung ohne KI: Konto, Datum, Steuersatz, Rechnungsnummer", "soll", { h: 3, text: "kein Abtippen" });
    H.e(p4, 8, "Das System muss Kontoauszüge als Text einlesen und mit den Buchungen abgleichen (Saldo-Gegenrechnung), zunächst hinter einem Vorschau-Schalter");
    H.e(p4, 18, "Kontoauszug-Einlesen ab Werk einschalten — erst nach weiterer Messung", { wer: "Inhaberin", bis: "" });
    H.e(p4, 8, "Das System muss vier Nutzungsmodi kennen: Privat, Kleinunternehmer, Selbstständig, Berater");
    H.e(p4, 8, "Das System muss den Tagesabschluss der offenen Ladenkasse aus dem gezählten Bestand mit Foto erstellen und festschreiben");
    H.bs(f4, "rechnung", "Kasse & Shop: Tagesabschluss, Quittungsvorlage, Rückfrage bei hoher Einnahme", "mittel", [kasse.id]);
    H.bs(f4, "neu", "Startseite mit Umsatzsteuer, Rücklage, Kassenstand; mehrere Buchhaltungen", "mittel", [start.id, mehrere.id]);
    H.bs(f4, "neu", "Trainierte Belegerkennung auf dem Gerät", "mittel", [erkennung.id], { wv: 0.6 });
    F.unterschreiben(v, f4, einst && einst.ust, "2026-11-13");

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie (wie Tomys Hub gesamt). */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    /* Abstimmung der Mitarbeiter (erfunden, nur Rollenkürzel, keine Namen). */
    [["bedarf", kern.id, "Buchhaltung", "IN", 5],
     ["bedarf", kern.id, "Buchhaltung", "BH", 5],
     ["abnahme", kern.id, "Buchhaltung", "IN", 4],
     ["abnahme", kern.id, "Buchhaltung", "BH", 5],
     ["bedarf", belege.id, "Buchhaltung", "BH", 5],
     ["abnahme", belege.id, "Buchhaltung", "BH", 4],
     ["bedarf", ust.id, "Buchhaltung", "BH", 4],
     ["abnahme", ust.id, "Buchhaltung", "BH", 5],
     ["bedarf", sicher.id, "Büro", "IN", 4],
     ["abnahme", sicher.id, "Büro", "IN", 4]
    ].forEach(function (s) { WN.bedarf.sterneDazu(v, { zeitpunkt: s[0], kennung: s[1], bereich: s[2], kuerzel: s[3], sterne: s[4], datum: s[0] === "bedarf" ? "2026-06-12" : "2026-11-13" }); });
    v.ist = { 1: 42.9, 2: 119.2, 3: 176.6, 4: 188.2 };
    return v;
  }

  WN.beispiel.registrieren({ id: "bookledgerpro", name: { de: "BookLedgerPro (fertige App)", en: "BookLedgerPro (finished app)" }, bauen: bookledger,
    quelle: "BookLedgerPro 9b76370, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
