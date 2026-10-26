/* Beispiel „Tomys Hub — Gesamtprogramm“ (Klaus 2026-10-07): ALLES, was für Tomys Hub gebaut
   wurde, durchgespielt als EIN Kundenauftrag — Internetseite (Schaufenster, Gestalter,
   Promptgenerator), WorkFloh (Aufträge, Zeitkonto, Posteingang), BookLedgerPro (Buchhaltung),
   Angebote und Brücke, Tresor, Netz, PDF-Werkzeug mit Scanner und Prüfung beim Anhängen.
   Ziel: sehen, wie der Bedarf hätte aufgenommen werden müssen, damit genau dieses Ergebnis
   dasteht — und was es als Kundenauftrag gekostet hätte (Ist-Stunden × Stundensatz).

   INHALT aus den Repos, gelesen 2026-10-07: Tomys-Hub (324 Commits ab 2026-07-04),
   BookLedgerPro (611 ab 2026-06-14), Mein-WorkFloh (die WorkFloh-Grundlage: 332 Commits
   2026-06-08 bis zum Abzweig am 2026-07-04), Workflow-PDF und Auslieferung-Pruefer nur die
   Dateien, die byte-gleich in Tomys' WorkFloh stecken (PDF-Werkzeug, Scanner, Prüfkern).
   NICHT gezählt: die Netz-Module aus Sage-Protokol (gemeinsame Grundlage aller Apps).

   IST-STUNDEN: Commit-Zeitstempel aller dieser Quellen VEREINIGT (gleichzeitige Arbeit zählt
   einmal), Lücke > 90 min = neuer Block, je Block 30 min Vorlauf — UNTERGRENZE, kumuliert bis
   zum Ende der Stufe. Je Quelle einzeln addiert wären es bis 2026-10-07 300,6 h statt 248,4 h.
     F1 Auftragsverwaltung und Buchhaltung   bis 2026-07-03   108,6 h
     F2 Internetseite, Gestalter, Verbund    bis 2026-07-16   154,3 h
     F3 Netz, Feinschliff, Buchhaltung aus   bis 2026-09-23   199,9 h
     F4 PDF-Werkzeug, Scanner, Prüfung       bis 2026-10-07   248,4 h

   ERFUNDEN (Klaus: „Wofür du keine Daten hast, erfinde welche“): Ansprechpartner, Anschrift,
   Telefon (Berliner Film-Block 030 23125 …), Mailadressen *.example, Sterne, Unterschriften
   (WN.beispielUnterschriften), alle Anhänge unter beispiele/tomys-gesamt/. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};
  var ORDNER = "beispiele/tomys-gesamt/";

  function gesamt(nr, einst) {
    var F = WN.fassungen, B = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-06-05");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Tomys Hub — Gesamtprogramm: Internetseite, WorkFloh, BookLedgerPro, PDF-Werkzeug";
    v.beispiel = true; v.bid = "tomys-gesamt";
    v.kunde.firma = "Tomys Hub";
    v.kunde.ansprechpartner = "Max Beispiel";
    v.kunde.anschrift = "Musterstraße 12, 12345 Musterstadt";
    v.kunde.mail = "kontakt@tomys-hub.example";
    v.kunde.telefon = "030 23125456";
    v.kunde.kundennummer = "KD-2026-001";
    v.weitereNamen = "Sportverein Beispiel e. V.\nBäckerei Beispiel";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-06-05";

    /* 1 Ausgangssituation */
    H.e(p, 1, "Papier");
    H.e(p, 1, "Auftragszettel auf Papier, ein Stapel je Woche");
    H.e(p, 1, "Motive und Wünsche kommen per E-Mail und WhatsApp");
    H.e(p, 1, "Rechnungen in einem alten Programm, Buchhaltung in Excel");
    /* 2 Prozess */
    H.e(p, 2, "Auftrag"); H.e(p, 2, "Kundenkontakt"); H.e(p, 2, "Angebot und Rechnung"); H.e(p, 2, "Buchhaltung");
    H.e(p, 2, "Zeiterfassung der Mitarbeiter");
    /* 3 Nutzer */
    H.e(p, 3, "Inhaber", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiter in Produktion und Büro (mehrere Sprachen)", { anzahl: 4 });
    H.e(p, 3, "Kunden (Vereine, Gastronomie, Handwerk)", { anzahl: 120 });
    H.e(p, 3, "Steuerberaterin", { anzahl: 1 });
    /* 4 Probleme */
    H.e(p, 4, "Kundenmails mit Motiven gehen zwischen den Aufträgen verloren");
    H.e(p, 4, "Arbeitszeit je Auftrag wird nicht erfasst — Preise sind geschätzt");
    H.e(p, 4, "Rechnungen werden für die Buchhaltung ein zweites Mal abgetippt");
    H.e(p, 4, "Druckvorlagen zu erstellen kostet den Betrieb viel Zeit");
    H.e(p, 4, "Belege liegen in einer Kiste, die Steuerberaterin fragt jedes Quartal nach");
    /* 5 Ursachen */
    H.e(p, 5, "Kein gemeinsames System für Auftrag, Zeit, Angebot und Buchhaltung");
    H.e(p, 5, "Kunden können ihr Motiv nicht selbst vorbereiten");
    /* 6 Bedarfe */
    var auftr = H.bed(p, "Aufträge vom Zettel bis zur Rechnung an einem Ort verfolgen", "muss", { h: 8, text: "nichts geht verloren" });
    var zeit = H.bed(p, "Arbeitszeit je Mitarbeiter und Auftrag erfassen, jeder mit eigener PIN", "muss", { h: 3, text: "Preise nach echter Zeit" });
    var mails = H.bed(p, "Kundenmails und ihre Anhänge dem richtigen Auftrag zuordnen", "soll", { h: 3 });
    var papier = H.bed(p, "Vorhandene Papierformulare weiter nutzen und digital ausfüllen", "soll", { h: 2 });
    var buch = H.bed(p, "Buchhaltung selbst führen: Journal, EÜR, USt-Voranmeldung, GoBD", "muss", { eur: 250, text: "weniger Kosten bei der Steuerberaterin" });
    var belege = H.bed(p, "Belege fotografieren und automatisch erkennen lassen", "soll", { h: 4 });
    var steuer = H.bed(p, "Export für die Steuerberaterin (DATEV-CSV)", "muss", { h: 2 });
    var sicher = H.bed(p, "Alle Daten verschlüsselt auf dem Gerät, mit Sicherung zum Wiederherstellen", "muss", { text: "kein Datenverlust" });
    /* 7 Ziel */
    H.e(p, 7, "Ein Verbund: der Kunde gestaltet, der Betrieb nimmt an, produziert und rechnet ab — ohne doppelte Eingabe");
    /* 8 Funktional */
    H.e(p, 8, "Das System muss Aufträge mit dem Status Anfrage → Vorlage → Angebot → Freigabe → Produktion → Fertig führen");
    H.e(p, 8, "Das System muss einen fertigen Auftrag als Rechnung an die Buchhaltung übergeben");
    H.e(p, 8, "Das System muss Buchungen festschreiben (Storno statt Löschen)");
    /* 9 Organisatorisch */
    H.e(p, 9, "Rollen"); H.e(p, 9, "Schulung"); H.e(p, 9, "Der Inhaber korrigiert Zeiten mit einer eigenen PIN");
    /* 10 Technisch */
    H.e(p, 10, "Geräte"); H.e(p, 10, "Tablet ist das Hauptgerät, dazu ein PC im Büro"); H.e(p, 10, "offline");
    H.e(p, 10, "Oberfläche auch auf Russisch, Arabisch und Englisch");
    /* 11 Systeme */
    H.e(p, 11, "Altes Rechnungsprogramm (Kundenliste als CSV)");
    H.e(p, 11, "E-Mail-Postfach des Betriebs");
    /* 12 Schnittstellen */
    var sBuch = H.e(p, 12, "Fertiger Auftrag → Rechnung in der Buchhaltung");
    H.e(p, 12, "DATEV-orientierte CSV an die Steuerberaterin");
    /* 13 Daten */
    H.e(p, 13, "Aufträge, Kunden, Zeiten, Angebote, Rechnungen, Buchungen, Belege, Dateien am Auftrag");
    H.e(p, 13, "Kundenliste aus dem alten Programm übernehmen (rund 120 Kunden)");
    /* 14 Datenschutz */
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 14, "Zeitkonto je Mitarbeiter mit eigener PIN verschlüsselt");
    H.e(p, 14, "Eine KI von außen nur freiwillig, mit eigenem Schlüssel, Belegerkennung in der EU");
    /* 15 Rahmen */
    H.e(p, 15, "Termin"); H.e(p, 15, "Kein Server, keine laufenden Kosten"); H.e(p, 15, "Start der Buchhaltung zum 1. Juli");
    /* 18 Offene Punkte */
    H.e(p, 18, "Druckdateien technisch prüfen (Auflösung, Farbraum) — gewünscht?", { wer: "Inhaber", bis: "2026-06-12" });
    H.e(p, 18, "Kundenliste: wer bereinigt die Doppelten vor der Übernahme?", { wer: "Büro", bis: "2026-06-15" });
    p.bereiche[4].notiz = "Der Inhaber will vor allem: keine verlorenen Motive mehr und keine doppelte Eingabe.";

    var u = f.umfang;
    u.kundenStundenwertCent = 3500;
    /* Tomys Hub hat ALLES beauftragt (so ist es gebaut worden): keine Grenzlinie, alles im Angebotspreis */
    u.grenzeManuell = "keine";
    H.bs(f, "auftrag", "WorkFloh · Auftragszettel, Status, Akte, Kunden", "gross", [auftr.id], { faktoren: ["offline", "nutzer"] });
    H.bs(f, "neu", "WorkFloh · Zeitkonto und Stoppuhr je Mitarbeiter (PIN)", "mittel", [zeit.id]);
    H.bs(f, "datei", "WorkFloh · Posteingang: Mails und Anhänge zum Auftrag", "mittel", [mails.id]);
    H.bs(f, "scan", "WorkFloh · Originaldokument mit Texterkennung ausfüllen", "mittel", [papier.id], { faktoren: ["ki"] });
    H.bs(f, "altdaten", "Kundenliste aus dem alten Programm übernehmen", "klein", [auftr.id]);
    H.bs(f, "rechnung", "BookLedgerPro · Buchhaltungskern: SKR03, Journal, GoBD, EÜR, USt-VA", "gross", [buch.id], { faktoren: ["offline"] });
    H.bs(f, "auftrag", "BookLedgerPro · Kunden, Aufträge, Mitarbeiter, Kostenstellen", "mittel", [buch.id, zeit.id]);
    H.bs(f, "scan", "BookLedgerPro · Belege fotografieren und erkennen", "mittel", [belege.id], { faktoren: ["ki"] });
    H.bs(f, "schnitt", "BookLedgerPro · Export DATEV-CSV, USt-VA, Steuer-Assistent", "mittel", [steuer.id]);
    H.bs(f, "datei", "BookLedgerPro · Tresor, Shamir-Sicherung, Geheim-Fach", "mittel", [sicher.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-06-07");

    /* F2 — Internetseite, Gestalter, Verbund */
    var f2 = F.neueFassung(v, { anlass: "Kunden sollen selbst gestalten und anfragen; Angebote und Rechnung ohne Abtippen", von: "kunde", datum: "2026-07-04" }).fassung;
    var p2 = f2.protokoll;
    var schau = H.bed(p2, "Kunden sehen, was der Betrieb herstellt und wie der Ablauf ist", "soll", { eur: 400, text: "mehr Anfragen" });
    var vorlage = H.bed(p2, "Kunden gestalten ihre Druckvorlage selbst", "muss", { h: 10, text: "weniger Vorlagenarbeit im Betrieb" });
    var angeb = H.bed(p2, "Angebote aus Katalogpreisen, als PDF an den Kunden", "soll", { h: 3 });
    var gutschein = H.bed(p2, "Geschenkgutscheine anbieten", "kann", {});
    H.e(p2, 8, "Das System muss aus dem Motiv des Kunden eine druckfertige Vorlage mit 300 dpi machen");
    H.e(p2, 11, "BookLedgerPro (aus Fassung 1)");
    H.bs(f2, "seite", "Internetseite: Schaufenster mit Ablauf, Galerie, Videos, Kontakt", "mittel", [schau.id], { faktoren: ["sprachen"] });
    H.bs(f2, "neu", "Gestalter: Druckvorlage selbst machen (KI-Prompt, 300 dpi)", "mittel", [vorlage.id], { faktoren: ["ki", "druck"] });
    H.bs(f2, "neu", "Promptgenerator für Motive", "klein", [vorlage.id], { faktoren: ["ki"] });
    H.bs(f2, "rechnung", "Angebots-Werkzeug mit Katalogpreisen", "klein", [angeb.id]);
    H.bs(f2, "schnitt", "Brücke WorkFloh → BookLedgerPro (Rechnung ohne Abtippen)", "klein", [angeb.id, sBuch.id, buch.id]);
    H.bs(f2, "datei", "Tomy-Tresor: ein verschlüsselter Speicher für alle Werkzeuge", "klein", [sicher.id]);
    H.bs(f2, "seite", "Gutschein-Seite", "klein", [gutschein.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-07-16");

    /* F3 — Netz, Feinschliff, Buchhaltung ausbauen */
    var f3 = F.neueFassung(v, { anlass: "Im Netz der Geschwister-Apps gefunden werden; Feinschliff; Buchhaltung ausbauen", von: "betrieb", datum: "2026-07-17" }).fassung;
    var p3 = f3.protokoll;
    var netz = H.bed(p3, "Der Betrieb ist im Netz der Geschwister-Apps zu finden", "kann", {});
    var kennz = H.bed(p3, "Jahres-Kennzahlen auf einen Blick", "soll", { h: 1 });
    H.e(p3, 10, "Handy-Ansicht und Bedienung ohne Maus");
    H.bs(f3, "schnitt", "Anbindung an das Knotennetz (Siegel, Andock-Assistent, Briefkasten)", "mittel", [netz.id], { wv: 0.8 });
    H.bs(f3, "neu", "Leistung, Barrierefreiheit, sieben Sprachen auch von rechts nach links", "klein", [], { faktoren: ["sprachen"] });
    H.bs(f3, "suche", "BookLedgerPro · Suche nach Bedeutung", "mittel", [netz.id]);
    H.bs(f3, "rechnung", "BookLedgerPro · Dashboard mit Jahres-Kennzahlen, Gestaltung", "klein", [kennz.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-09-23");

    /* F4 — PDF-Werkzeug, Scanner, Prüfung */
    var f4 = F.neueFassung(v, { anlass: "Kunden-PDFs ausfüllen, übersetzen und scannen; Anhänge vor der KI prüfen", von: "kunde", datum: "2026-09-25" }).fassung;
    var p4 = f4.protokoll;
    var pdf = H.bed(p4, "Kunden-PDFs und Formulare ausfüllen, übersetzen (DE/RU/EN) und Fotos scannen", "soll", { h: 4 });
    var dateien = H.bed(p4, "Dateien am Auftrag sammeln und als ZIP oder ein PDF weitergeben", "soll", { h: 1 });
    var pruef = H.bed(p4, "Angehängte Dateien vor einer KI auf versteckte Befehle prüfen", "muss", { text: "Schutz der Kundendaten" });
    var sprech = H.bed(p4, "Aufträge per Sprache suchen", "kann", {});
    H.e(p4, 8, "Das System muss einen Fund markieren, nicht löschen, und vor der KI einmal anhalten");
    H.bs(f4, "scan", "PDF-Werkzeug: Felder erkennen, ausfüllen, übersetzen, Scanner", "gross", [pdf.id, papier.id], { faktoren: ["sprachen"] });
    H.bs(f4, "datei", "Dateien am Auftrag: Auswahl, ZIP, ein PDF", "klein", [dateien.id]);
    H.bs(f4, "dateipruef", "Prüfung beim Anhängen", "mittel", [pruef.id]);
    H.bs(f4, "kipruef", "Halt vor der KI und an jedem Ausgang", "klein", [pruef.id]);
    H.bs(f4, "suche", "Spracheingabe in der Auftragssuche", "klein", [sprech.id]);
    H.e(p4, 18, "Lager und Artikel — vorgesehen, nicht gebaut", { wer: "Inhaber", bis: "2026-11-30" });
    F.unterschreiben(v, f4, einst && einst.ust, "2026-10-07");

    v.ist = { 1: 108.6, 2: 154.3, 3: 199.9, 4: 248.4 };

    /* Sterne (erfunden): Fachbereich und Kürzel, keine Namen */
    [[auftr.id, "Produktion", "P1", 5, 5], [auftr.id, "Büro", "B1", 5, 4], [zeit.id, "Produktion", "P2", 3, 4], [mails.id, "Büro", "B1", 4, 5],
      [buch.id, "Büro", "B2", 5, 5], [belege.id, "Büro", "B2", 4, 4], [steuer.id, "Büro", "B2", 4, 5], [papier.id, "Produktion", "P1", 3, 4]].forEach(function (z) {
      B.sterneDazu(v, { zeitpunkt: "bedarf", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[3], datum: "2026-06-05" });
      B.sterneDazu(v, { zeitpunkt: "abnahme", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[4], datum: "2026-10-07" });
    });

    /* Rechtsblätter mit erfundenen Unterschriften. Ohne eigene Firmendaten steht als
       Auftragnehmer eine erfundene Werkstatt da (nur in diesen eingefrorenen Blättern). */
    var U = WN.beispielUnterschriften || {};
    var fi = einst && einst.firma && String(einst.firma.name || "").trim() ? einst.firma
      : { name: "Werkstatt Beispiel", anschrift: "Beispielweg 3\n12345 Musterstadt", kontakt: "030 23125400 · werkstatt@werkstatt-beispiel.example" };
    var ctx = { firma: fi, ust: einst && einst.ust, tabellen: null, zeitraum: (einst && einst.zeitraum) || 24, wartung: (einst && einst.wartung) || { freistunden: 4, wochen: 8, pauschaleCent: null } };
    [["erklaerung", "2026-06-05"], ["vereinbarung", "2026-10-07"], ["wartung", "2026-10-07"]].forEach(function (z) {
      v[z[0]] = { unterschriftBetrieb: U.betrieb || "", unterschriftKunde: U.kunde || "", fassung: z[0] === "erklaerung" ? null : 4 };
      if (!U.betrieb) v[z[0]].papier = true;
      WN.aussen.aktivieren(v, z[0], ctx, z[1]);
    });
    return v;
  }

  WN.beispiel.registrieren({ id: "tomys-gesamt", name: { de: "Tomys Hub — Gesamtprogramm (Seite, WorkFloh, BookLedgerPro, PDF)", en: "Tomys Hub — complete programme (site, WorkFloh, BookLedgerPro, PDF)" },
    bauen: gesamt,
    quelle: "Tomys-Hub, BookLedgerPro, Mein-WorkFloh (bis 2026-07-04), Workflow-PDF und Auslieferung-Pruefer (Dateien in Tomys), gelesen 2026-10-07",
    /* Erfundene Anhänge (tools/beispiel-dateien.py); beim Laden als Dateien an den Vorgang gehängt */
    anhaenge: [
      { datei: ORDNER + "Anfrage-Tomys-Hub.eml", name: "Anfrage-Tomys-Hub.eml", typ: "message/rfc822", datum: "2026-06-02" },
      { datei: ORDNER + "Auftragszettel-Papier.jpg", name: "Auftragszettel-Papier.jpg", typ: "image/jpeg", datum: "2026-06-02" },
      { datei: ORDNER + "Rueckfrage-Buchhaltung.eml", name: "Rueckfrage-Buchhaltung.eml", typ: "message/rfc822", datum: "2026-06-04" },
      { datei: ORDNER + "Ablauf-Motiv-bis-Rechnung.pdf", name: "Ablauf-Motiv-bis-Rechnung.pdf", typ: "application/pdf", datum: "2026-06-05" },
      { datei: ORDNER + "Preisliste-Beispiel.pdf", name: "Preisliste-Beispiel.pdf", typ: "application/pdf", datum: "2026-07-04" },
      { datei: ORDNER + "Logo-Entwurf-Kunde.png", name: "Logo-Entwurf-Kunde.png", typ: "image/png", datum: "2026-07-04" },
      { datei: ORDNER + "Skizze-Schaufenster.png", name: "Skizze-Schaufenster.png", typ: "image/png", datum: "2026-07-04" },
    ] });
})(typeof window !== "undefined" ? window : globalThis);
