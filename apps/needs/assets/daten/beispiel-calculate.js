/* Beispiel „Workflow Calculate“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Workflow-Calculate
   (Stand c6b8dd9, gelesen 2026-11-13: CLAUDE.md, README.md, docs/sessions, git log origin/main).
   KUNDENDATEN ERFUNDEN (.example, kein echter Name). STERNE ERFUNDEN (Rollen statt Namen), plausibel gesetzt.
   Fassungen nach der echten Geschichte (git log origin/main):
     F1 Kalkulation, Angebot, Fassungen, Übergaben, Nachkalkulation, Handelsware, Anfrage, Suche bis 2026-10-12 (#1–#12)
     F2 Staffelpreise, Bedeutungssuche mit Modell vom eigenen Server, SBKIM-Knoten bis 2026-10-13 (#13–#18)
     F3 Schutz aus dem Sage-Kanon (Prüfliste vor dem KI-Richter, Echtheit, Sperrliste), Sicherheitsseite,
        Installieren und Manifest-Kennung bis 2026-10-18 (#19–#34)
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — mitgebrachte Bausteine (Sage-Module, Workflow-PDF-Dateien) nicht mitgezählt.
   Nicht gebaut und deshalb nicht erfunden: Live-Versandtarife (eigene Tabelle gewählt), KI-Recherche der
   Einkaufspreise, geprüft eingetragene Lieferanten, XLSX-Import, Mindestpreis; KI-Recherche nie gegen die echte
   Schnittstelle gemessen. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function calculate(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-10-11");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Angebote für Werbetechnik schnell und nachvollziehbar kalkulieren";
    v.beispiel = true; v.bid = "calculate";
    v.kunde.firma = "Werbetechnik Beispiel";
    v.kunde.ansprechpartner = "Inhaberin Beispiel";
    v.kunde.mail = "angebote@werbetechnik-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-10-11";
    H.e(p, 1, "Excel");
    H.e(p, 1, "Preise im Kopf und auf Zetteln, jedes Angebot neu gerechnet");
    H.e(p, 1, "E-Mail");
    H.e(p, 2, "Auftrag");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 3, "Inhaber", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiter (Druck, Stick, Montage)", { anzahl: 3 });
    H.e(p, 3, "Kunden (sehen nur das Angebot)", { anzahl: 1 });
    H.e(p, 4, "Zeitverlust");
    H.e(p, 4, "Preise schwanken je nach Tagesform, Material und Versand werden vergessen");
    H.e(p, 4, "Kunden fragen per Mail, die Angaben müssen abgetippt werden");
    H.e(p, 5, "Keine feste Kalkulation, jeder rechnet anders");
    H.e(p, 5, "Angebot, Auftrag und Buchhaltung sind getrennte Welten");
    var kalk = H.bed(p, "Produkt wählen, Maße, Menge, Material eingeben — der Preis wird nach Zuschlagskalkulation gerechnet (Material, Arbeitszeit, Maschine, Gemeinkosten, Gewinn)", "muss", { h: 6, text: "Angebot in Minuten statt Stunden" });
    var angebot = H.bed(p, "Angebot für den Kunden mit Leistung, Staffelpreisen, Versand und Summen; die Kalkulation bleibt intern", "muss", { text: "nichts Internes beim Kunden" });
    var versand = H.bed(p, "Verpackung und Versand werden automatisch dazugerechnet", "muss", { h: 1 });
    var fassung = H.bed(p, "Ein gestelltes Angebot ist eingefroren; Ändern ergibt eine neue Fassung mit Vergleich", "muss", {});
    var weiter = H.bed(p, "Angenommene Angebote gehen als Auftrag an den WorkFloh und als vorbefülltes Angebot in die Buchhaltung", "soll", { h: 2, text: "kein doppeltes Abtippen" });
    var sichern = H.bed(p, "Alles offline auf dem Gerät, Sicherung als verschlüsselte Datei", "muss", {});
    var anfrage = H.bed(p, "Eine Kundenanfrage (Mail) einlesen, Kunde und Mengen erkennen, Entwurf aus ähnlichen alten Angeboten", "soll", { h: 2 });
    var nachkalk = H.bed(p, "Nachkalkulation: Plan gegen Ist, die Zeiten lernen daraus", "soll", { h: 1 });
    var handel = H.bed(p, "Handelsware (Zukauf) mit Einkaufspreis je Menge und eigenem Aufschlag", "soll", {});
    var suche = H.bed(p, "Eine Frage eintippen („100 Tassen mit Logo“) und sofort Produkt, Menge und Preis sehen", "kann", { h: 1 });
    H.e(p, 7, "Jedes Angebot nach derselben Rechnung, in wenigen Minuten, vom Angebot bis zur Rechnung ohne Abtippen");
    H.e(p, 8, "Das System muss als installierbare Web-App auf Tablet, Handy und PC laufen, offline, ohne Konto und ohne Server");
    H.e(p, 8, "Das System muss nach der Zuschlagskalkulation rechnen (MEK+MGK, FEK+FGK+Maschine, Herstellkosten, Verwaltung/Vertrieb, Gewinn, Skonto/Rabatt im Hundert) und Satz-Ebenen Position → Angebot → Kundenklasse → Vorlage → Arbeitsgebiet kennen");
    H.e(p, 8, "Das System muss Mengen nach Regeln rechnen (Stück, Fläche, Rolle, Platte, Länge) und eine fehlende Angabe als „nicht kalkuliert“ zeigen, nie als 0");
    H.e(p, 8, "Das System muss den günstigsten passenden Versand aus einer eigenen Tariftabelle wählen und sagen, wenn kein Tarif passt");
    H.e(p, 8, "Das System muss das Kundenblatt nur aus einer Freigabeliste bauen; Einkaufspreise, Sätze und Lieferanten verlassen das Haus nie");
    H.e(p, 8, "Das System muss ein gestelltes Angebot einfrieren und Änderungen nur als neue Fassung mit derselben Nummer zulassen");
    H.e(p, 8, "Das System muss Aufträge als Datei an Mein WorkFloh / Tomys WorkFloh und Angebote per Adresse an BookLedgerPro übergeben");
    H.e(p, 8, "Das System muss alles verschlüsselt in eine Datei sichern; Zurückholen fügt hinzu und überschreibt nie");
    H.e(p, 8, "Das System muss eine Anfrage offline lesen und nichts raten: Unerkanntes steht als „nicht erkannt“ da, der Entwurf bleibt ein Entwurf");
    H.e(p, 8, "Das System muss Marktpreise nur mit Quelle übernehmen und als „ungeprüft“ führen, bis der Nutzer bestätigt");
    H.e(p, 9, "Schulung: Beispiel-Angebote und Beispiel-Fragen zum Durchspielen statt Handbuch");
    H.e(p, 9, "Rollen: der Inhaber pflegt Sätze und Katalog, Mitarbeiter tragen Ist-Zeiten nach");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "offline");
    H.e(p, 11, "Excel-Liste mit Preisen, Mein WorkFloh, BookLedgerPro");
    var schnittWf = H.e(p, 12, "Auftragsdatei für Mein WorkFloh und Tomys WorkFloh (Import dort)");
    var schnittBlp = H.e(p, 12, "Übergabe an BookLedgerPro (Datenvertrag v1)");
    H.e(p, 13, "Produktvorlagen, Materialien, Maschinen, Tarife, Kunden mit Klasse, Angebote, Bilder und Entwürfe");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 14, "Kundendaten gehen nie an eine KI; eine KI-Lesung der Anfrage nur verdeckt und auf ausdrücklichen Wunsch");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "Startwerte sind Platzhalter, bis eigene Zahlen eingetragen sind");
    H.e(p, 15, "Versandtarife aus eigener Tabelle, keine Live-Abfrage");
    H.e(p, 18, "Eigene Stundensätze und Handlungskosten eintragen", { wer: "Inhaber", bis: "2026-10-20" });
    f.umfang.kundenStundenwertCent = 4500;
    H.bs(f, "neu", "Kalkulations-Kern: Zuschlagskalkulation, Mengenregeln, Satz-Ebenen, Rückrechnung, Katalog mit Arbeitsgebieten", "gross", [kalk.id], { faktoren: ["offline"] });
    H.bs(f, "neu", "Angebot und Kundenblatt aus der Freigabeliste, Versand nach Tariftabelle, Fassungen mit Vergleich", "mittel", [angebot.id, versand.id, fassung.id], { faktoren: ["druck"] });
    H.bs(f, "schnitt", "Übergaben an Mein WorkFloh / Tomys WorkFloh und BookLedgerPro", "mittel", [weiter.id, schnittWf.id, schnittBlp.id]);
    H.bs(f, "datei", "Verschlüsselte Sicherung in eine Datei, Zurückholen fügt hinzu", "klein", [sichern.id]);
    H.bs(f, "kipruef", "Anfrage einlesen (Mail/.eml), alte Angebote nach Ähnlichkeit, KI-Lesung nur verdeckt", "mittel", [anfrage.id], { faktoren: ["ki"] });
    H.bs(f, "neu", "Nachkalkulation: Ist gegen Plan, Faktor je Vorlage ins Zeit-Muster", "klein", [nachkalk.id]);
    H.bs(f, "neu", "Handelsware: Einkaufsprodukte, Lieferanten-Vorschläge, Fremdfertigung", "mittel", [handel.id]);
    H.bs(f, "suche", "Suche als Startseite: Frage → Produkt, Menge, Preis; lernt aus jeder bestätigten Antwort", "mittel", [suche.id], { wv: 0.3 });
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-12");

    /* F2 — Staffel, Bedeutungssuche, Netzknoten */
    var f2 = F.neueFassung(v, { anlass: "Am Tablet: Zwischenmengen bei Zukauf blieben offen; die Suche soll auch Gemeintes finden; die App soll im Netz der eigenen Apps erreichbar sein", von: "kunde", datum: "2026-10-13" }).fassung;
    var p2 = f2.protokoll;
    var staffel = H.bed(p2, "Zwischenmengen aus der nächstkleineren Staffel rechnen statt offen lassen", "muss", { h: 1 });
    var bedeutung = H.bed(p2, "Suche nach Bedeutung, Sprachmodell vom eigenen Server, mit Ladebalken", "soll", {});
    var netz = H.bed(p2, "Die App ist ein Knoten im eigenen Netz (öffentlich oder Firmennetz), ohne dass beim Laden etwas hinausgeht", "kann", {});
    H.e(p2, 8, "Das System muss eine Zwischenmenge mit dem Stückpreis der nächstkleineren Staffel rechnen und den Rechenweg nennen");
    H.e(p2, 8, "Das System muss das Sprachmodell erst auf Wunsch laden und sagen, woher es kam");
    H.e(p2, 12, "SBKIM-Netz der eigenen Apps (Mycel, Siegel)");
    H.bs(f2, "neu", "Staffelpreise für Zwischenmengen", "klein", [staffel.id]);
    H.bs(f2, "suche", "Bedeutungssuche mit Modell vom eigenen Server und Rückfall", "mittel", [bedeutung.id], { wv: 0.6 });
    H.bs(f2, "pinnwand", "SBKIM-Knoten mit Lampen, Siegel und Netz-Einstellung", "mittel", [netz.id], { wv: 0.6 });
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-13");

    /* F3 — Schutz und Installation */
    var f3 = F.neueFassung(v, { anlass: "Antworten aus dem Netz sollen geprüft sein, bevor eine KI sie liest; Installieren soll auf allen Geräten klappen", von: "betrieb", datum: "2026-10-14" }).fassung;
    var p3 = f3.protokoll;
    var schutz = H.bed(p3, "Fremde Antworten werden vor dem KI-Richter geprüft, Unterschriften und Sperrliste wirken", "muss", {});
    var install = H.bed(p3, "Installieren-Knopf mit verständlicher Anleitung, eigene App-Kennung", "soll", {});
    var erklaer = H.bed(p3, "Eine Seite erklärt Mycel, Siegel und Schutz in einfachen Worten", "kann", {});
    H.e(p3, 8, "Das System muss eine Antwort mit Anweisung an eine KI ausschließen und nicht an die KI geben");
    H.e(p3, 14, "Schutz vor versteckten Anweisungen in fremden Antworten");
    H.bs(f3, "dateipruef", "Prüfliste vor dem KI-Richter, Echtheit, Sperrliste und Bürgen aus dem Kanon", "mittel", [schutz.id], { wv: 0.8 });
    H.bs(f3, "seite", "Installieren-Knopf, Manifest-Kennung, Sicherheitsseite", "klein", [install.id, erklaer.id], { wv: 0.6 });
    F.unterschreiben(v, f3, einst && einst.ust, "2026-10-18");

    /* Abstimmung der Mitarbeiter (Sterne erfunden, Rollen statt Namen) */
    var B = WN.bedarf;
    [
      [kalk.id, "Inhaber", "IN", 5, 5], [kalk.id, "Druck", "MA1", 4, 5], [kalk.id, "Stick", "MA2", 3, 4],
      [angebot.id, "Inhaber", "IN", 5, 5], [angebot.id, "Büro", "BH", 4, 4],
      [weiter.id, "Büro", "BH", 5, 5], [weiter.id, "Montage", "MA3", 3, 4],
      [anfrage.id, "Inhaber", "IN", 4, 4], [anfrage.id, "Büro", "BH", 4, 3],
      [nachkalk.id, "Druck", "MA1", 2, 4], [nachkalk.id, "Inhaber", "IN", 4, 4],
      [suche.id, "Inhaber", "IN", 3, 5], [suche.id, "Druck", "MA1", 3, 4]
    ].forEach(function (z) {
      B.sterneDazu(v, { zeitpunkt: "bedarf", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[3], datum: "2026-10-11" });
      B.sterneDazu(v, { zeitpunkt: "abnahme", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[4], datum: "2026-10-18" });
    });

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 8.0, 2: 9.9, 3: 19.1 };
    return v;
  }

  WN.beispiel.registrieren({ id: "calculate", name: { de: "Workflow Calculate (fertige App)", en: "Workflow Calculate (finished app)" }, bauen: calculate,
    quelle: "Workflow-Calculate c6b8dd9, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
