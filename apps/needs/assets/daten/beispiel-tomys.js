/* Beispiel „Tomys Hub“ — der kleine Betrieb für Werbeartikel (Digitaldruck, Stickerei,
   Kleinwerbeartikel), so durchgespielt, als wäre die App ein Kundenauftrag gewesen.
   INHALT aus dem Repo Tomys-Hub, gelesen am 2026-10-07 (Stand 0e05091): Bereiche, Ablauf,
   Geräte, Ausbaugeschichte. KUNDENDATEN ERFUNDEN (.example, kein echter Name).
   Fassungen nach der echten Geschichte:
     F1 Grundverbund bis 2026-07-07 (Hub, Schaufenster, Gestalter, WorkFloh, Angebote, Tresor,
        Übergabe an die Buchhaltung — alles am 2026-07-04/05 angelegt, nicht nach Datum trennbar)
     F2 Netz und Feinschliff bis 2026-09-23
     F3 PDF-Werkzeug und Prüfung beim Anhängen bis 2026-10-07
   Ist-Stunden: gemessen aus Commit-Zeitstempeln (Lücke > 90 min = neuer Block, je Block
   30 min Vorlauf), UNTERGRENZE, jeweils vom ersten Commit bis zum Ende der Stufe.
   Die Sterne der Mitarbeiter sind ein BEISPIEL (erfunden), keine Bewertung echter Personen. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function tomys(nr, einst) {
    var F = WN.fassungen, B = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-07-01");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Werbeartikel-Betrieb: vom Kundenmotiv bis zur Rechnung";
    v.beispiel = true; v.bid = "tomys";
    v.kunde.firma = "Tomys Hub";
    v.kunde.ansprechpartner = "Max Beispiel";
    v.kunde.mail = "kontakt@tomys-hub.example";
    v.kunde.kundennummer = "KD-2026-001";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-07-01";
    H.e(p, 1, "Papier-Auftragszettel");
    H.e(p, 1, "Kunden schicken Motive und Wünsche per E-Mail");
    H.e(p, 2, "Auftrag");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 2, "Angebot und Rechnung");
    H.e(p, 3, "Inhaber", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiter (gemischtes Team, mehrere Sprachen)", { anzahl: 1 });
    H.e(p, 3, "Kunden", { anzahl: 1 });
    H.e(p, 4, "Druckvorlagen zu erstellen kostet den Betrieb viel Zeit");
    H.e(p, 4, "Kundenmails gehen zwischen den Aufträgen verloren");
    H.e(p, 4, "Arbeitszeit je Auftrag wird nicht erfasst");
    H.e(p, 4, "Angebote werden von Hand gerechnet und für die Buchhaltung abgetippt");
    H.e(p, 5, "Kein gemeinsames System für Auftrag, Zeit und Angebot");
    var vorlage = H.bed(p, "Kunden gestalten ihre Druckvorlage selbst", "muss", { h: 10, text: "weniger Vorlagenarbeit im Betrieb (Beispielwert)" });
    var schau = H.bed(p, "Kunden sehen, was der Betrieb herstellt und wie der Ablauf ist", "soll", { text: "mehr Anfragen" });
    var auftr = H.bed(p, "Aufträge vom Zettel bis zur Übergabe an einem Ort verfolgen", "muss", { h: 8, text: "nichts geht verloren (Beispielwert)" });
    var zeit = H.bed(p, "Arbeitszeit je Mitarbeiter und Auftrag erfassen", "soll", { h: 2 });
    var angeb = H.bed(p, "Angebote aus Katalogpreisen, Rechnung an die Buchhaltung übergeben", "soll", { h: 3 });
    var mails = H.bed(p, "Kundenmails dem richtigen Auftrag zuordnen", "soll", { h: 2 });
    var sicher = H.bed(p, "Daten aller Werkzeuge an einem sicheren Ort", "muss", { text: "verschlüsselt, mit PIN" });
    H.e(p, 7, "Ein Verbund: der Kunde gestaltet, der Betrieb nimmt an, produziert und rechnet ab");
    H.e(p, 8, "Das System muss Aufträge mit dem Status Anfrage → Vorlage → Angebot → Freigabe → Produktion → Fertig führen");
    H.e(p, 8, "Das System muss aus dem Motiv des Kunden eine druckfertige Vorlage mit 300 dpi machen");
    H.e(p, 9, "Rollen");
    H.e(p, 9, "Der Inhaber schaltet Preise und Anfrage-Wege intern frei");
    H.e(p, 9, "Schulung zum Umgang mit KI, mit Unterschrift");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "Tablet ist das Hauptgerät");
    H.e(p, 10, "offline");
    H.e(p, 10, "Oberfläche in sieben Sprachen, auch von rechts nach links");
    H.e(p, 11, "BookLedgerPro (Buchhaltung)");
    var schnittBuch = H.e(p, 12, "Fertiger Auftrag geht als Rechnung an die Buchhaltung");
    H.e(p, 13, "Aufträge, Kunden, Zeiten, Angebote, Dateien am Auftrag");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 14, "Zeitkonto je Mitarbeiter mit eigener PIN verschlüsselt");
    H.e(p, 15, "Kein Server, keine laufenden Kosten");
    H.e(p, 15, "Eine KI von außen nur freiwillig und nur in der EU");
    H.e(p, 18, "Druckdateien technisch prüfen (Auflösung, Farbraum) — gewünscht?", { wer: "Inhaber", bis: "2026-07-10" });
    p.bereiche[4].notiz = "Beispiel: Der Inhaber will vor allem weniger Vorlagenarbeit.";
    var u = f.umfang;
    u.kundenStundenwertCent = 3500;
    H.bs(f, "shop", "Schaufenster: Ablauf in vier Schritten, Videos, Galerie, Kontakt", "klein", [schau.id]);
    H.bs(f, "neu", "Gestalter: der Kunde macht seine Druckvorlage selbst (KI-Prompt, 300 dpi)", "mittel", [vorlage.id], { faktoren: ["ki", "druck"] });
    H.bs(f, "auftrag", "WorkFloh: Aufträge, Status, Akte, Posteingang, Zeiterfassung", "gross", [auftr.id, zeit.id, mails.id], { faktoren: ["sprachen", "nutzer"] });
    H.bs(f, "rechnung", "Angebote mit Katalogpreisen", "klein", [angeb.id]);
    H.bs(f, "schnitt", "Übergabe an die Buchhaltung (BookLedgerPro)", "klein", [angeb.id, schnittBuch.id]);
    H.bs(f, "datei", "Tresor: ein verschlüsselter Speicher für alle Werkzeuge", "klein", [sicher.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-07-03");

    /* F2 — Netz und Feinschliff */
    var f2 = F.neueFassung(v, { anlass: "Anbindung an das eigene Knotennetz, Leistung und Barrierefreiheit", von: "betrieb", datum: "2026-07-16" }).fassung;
    var netz = H.bed(f2.protokoll, "Der Betrieb ist im Netz der Geschwister-Apps zu finden", "kann", { text: "" });
    H.e(f2.protokoll, 10, "Handy-Ansicht und Bedienung ohne Maus");
    H.bs(f2, "schnitt", "Anbindung an das Knotennetz (Siegel, Andock-Assistent, Briefkasten)", "mittel", [netz.id], { wv: 0.8 });
    H.bs(f2, "neu", "Leistung und Barrierefreiheit", "klein", []);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-07-16");

    /* F3 — PDF-Werkzeug und Prüfung beim Anhängen */
    var f3 = F.neueFassung(v, { anlass: "Kunden-PDFs ausfüllen, übersetzen und scannen; Anhänge vor der KI prüfen", von: "kunde", datum: "2026-09-25" }).fassung;
    var p3 = f3.protokoll;
    var pdf = H.bed(p3, "Kunden-PDFs und Formulare ausfüllen, übersetzen (DE/RU/EN) und Fotos scannen", "soll", { h: 4 });
    var dateien = H.bed(p3, "Dateien am Auftrag sammeln und als ZIP oder ein PDF weitergeben", "soll", { h: 1 });
    var pruef = H.bed(p3, "Angehängte Dateien vor einer KI auf versteckte Befehle prüfen", "muss", { text: "Schutz der Kundendaten" });
    var sprech = H.bed(p3, "Aufträge per Sprache suchen", "kann", {});
    H.e(p3, 8, "Das System muss einen Fund markieren, nicht löschen, und vor der KI einmal anhalten");
    H.bs(f3, "scan", "PDF-Werkzeug: Felder erkennen, ausfüllen, übersetzen, Scanner", "gross", [pdf.id], { faktoren: ["sprachen"] });
    H.bs(f3, "datei", "Dateien am Auftrag: Auswahl, ZIP, ein PDF", "klein", [dateien.id]);
    H.bs(f3, "dateipruef", "Prüfung beim Anhängen", "mittel", [pruef.id]);
    H.bs(f3, "kipruef", "Halt vor der KI und an jedem Ausgang", "klein", [pruef.id]);
    H.bs(f3, "suche", "Spracheingabe in der Auftragssuche", "klein", [sprech.id]);
    H.e(p3, 18, "Lager und Artikel — der Haken ist vorgesehen, gebaut ist nichts", { wer: "Inhaber", bis: "" });
    F.unterschreiben(v, f3, einst && einst.ust, "2026-10-07");

    v.ist = { 1: 22.9, 2: 76.0, 3: 103.9 };
    /* Beispiel-Sterne (erfunden): Fachbereich und Kürzel, keine Namen */
    [[vorlage.id, "Produktion", "P1", 5, 4], [vorlage.id, "Büro", "B1", 4, 5], [auftr.id, "Produktion", "P1", 5, 5], [auftr.id, "Büro", "B1", 5, 4],
      [zeit.id, "Produktion", "P1", 3, 4], [mails.id, "Büro", "B1", 4, 3]].forEach(function (z) {
      B.sterneDazu(v, { zeitpunkt: "bedarf", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[3], datum: "2026-07-02" });
      B.sterneDazu(v, { zeitpunkt: "abnahme", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[4], datum: "2026-10-07" });
    });
    v.erklaerung = { papier: true };
    WN.aussen.aktivieren(v, "erklaerung", { firma: einst && einst.firma }, "2026-07-01");
    return v;
  }

  WN.beispiel.registrieren({ id: "tomys", name: { de: "Tomys Hub — nur die Hub-App (Werbeartikel-Betrieb)", en: "Tomys Hub — the hub app only (promotional products)" }, bauen: tomys,
    quelle: "Tomys-Hub 0e05091, gelesen 2026-10-07" });
})(typeof window !== "undefined" ? window : globalThis);
