/* Beispiel „Datei-Organizer“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Datei-Organizer
   (Stand 07f79fd auf origin/main, Fassung 0.3.3, gelesen 2026-11-13: CLAUDE.md, README.md, docs/PLAN.md, docs/FACHREGEL.md,
   git log). Der Ordner rueckwaertstest/ dort ist ein Testlauf, keine App-Funktion, und geht hier nicht ein.
   KUNDENDATEN ERFUNDEN (.example, kein echter Name). STERNE ERFUNDEN (Rollen-Kürzel, keine Namen), plausibel nach dem,
   was im Alltag am meisten half.
   Fassungen nach der echten Geschichte (git log origin/main, nur zwei Tage):
     F1 Kern mit fünf Sieben, Oberfläche, Testordner, installierbar bis 2026-11-12 (0.1.0, PR #1)
     F2 besserer Kern an fremden Stapeln nachgewiesen, Fachregel, Merken nach Sache, Kern für die Schwester-Apps,
        Bedienung (Ladebalken, Entfernen, Ziehen und Ablegen, Neues zuerst) bis 2026-11-13 (0.2.0–0.3.3, PR #2–#5)
   Ist-Stunden: Commit-Zeitstempel auf origin/main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo; Messläufe und Prüfstapel sind mitgezählt, weil sie in denselben Commits liegen.
   Nicht gebaut und deshalb nicht erfunden: Lehrer-Dienst (großes Sprachmodell über den eigenen Server), Barcodes und gründliche
   Prüfung, Lesen von .msg, Umbenennen und Verschieben von Dateien, eigene Regeln des Nutzers in der Oberfläche (erst Vorschau),
   Zweitfach im Kern; die Übernahme des Index in der Familienakte ist dort noch nicht gebaut. Am Gerät (SD-Karte, Android) ungeprüft. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function dateiorganizer(nr, einst) {
    var F = WN.fassungen, B = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-11-12");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Eingehende Dateien prüfen und vorsortieren, bevor sie in die Akte gehen";
    v.beispiel = true; v.bid = "dateiorganizer";
    v.kunde.firma = "Haushaltsbüro Beispiel";
    v.kunde.ansprechpartner = "Inhaberin Beispiel";
    v.kunde.mail = "eingang@organizer-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-11-12";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Scans, Handyfotos, Mail-Anhänge und Altbestand liegen durcheinander in Download- und Scanner-Ordnern");
    H.e(p, 1, "die Akte liest jede Datei einzeln und rät Bereich und Frist aus dem Dateinamen");
    H.e(p, 2, "Dokumente");
    H.e(p, 2, "Posteingang des Haushalts und Altbestand mehrerer Jahre");
    H.e(p, 3, "Inhaber", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiter (Büro, Ablage)", { anzahl: 2 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Zeitverlust");
    H.e(p, 4, "Doppelte Dateien und Dateien, deren Endung nicht zum Inhalt passt, fallen niemandem auf");
    H.e(p, 5, "Es gibt keine Eingangskontrolle: die Prüfer kontrollieren nur, was hinausgeht");
    H.e(p, 5, "Jedes Programm liest dieselbe Datei noch einmal von vorn");
    var ein = H.bed(p, "Alles in einen Ordner werfen; das Werkzeug sortiert Klick für Klick feiner (Art, Kopf, Bereich und Nummern, Absender, Inhalt)", "muss", { h: 6, text: "kein Vorsortieren von Hand" });
    var pruef = H.bed(p, "Beim Eingang auffällige Dateien (Endung passt nicht, Programme, Makros) und Doppelte erkennen und zurückhalten", "muss", { text: "nichts Fremdes rutscht in die Akte" });
    var orig = H.bed(p, "Originale bleiben unverändert; die Sortierung steht in einer Begleitdatei, nichts wird verschoben oder kopiert", "muss", {});
    var baum = H.bed(p, "Dieselbe Datei unter vielen Gesichtspunkten finden: Datum, Art, Absender, Person, Frist, Nummer, Bereich, Wortsuche", "muss", { h: 2 });
    var akte = H.bed(p, "Die Familienakte übernimmt den vorsortierten Ordner und ordnet automatisch zu", "soll", { h: 2 });
    var lern = H.bed(p, "Korrekturen merken und daraus besser werden, jeder Schritt rückgängig", "soll", {});
    var probe = H.bed(p, "Ein Testordner mit erfundenen Dateien zum Ausprobieren", "kann", {});
    H.e(p, 7, "Ein Stapel von hundert Dateien ist in Minuten vorsortiert; zur Bestätigung bleibt nur das Unsichere");
    H.e(p, 8, "Das System muss in einen Eingangsordner geworfene Dateien in fünf Stufen sieben: Art, Kopf, Bereich und Nummern, Absender, Inhalt; jede Stufe zeigt ihr Ergebnis und ist einzeln rückgängig zu machen");
    H.e(p, 8, "Das System muss je Stufe nur so viel lesen, wie sie braucht (Dateikopf, oberes Drittel der ersten Seite, Briefkopf), und den ganzen Text erst zuletzt");
    H.e(p, 8, "Das System muss die Originale nur lesen und höchstens die Datei organizer-index.json schreiben");
    H.e(p, 8, "Das System muss Doppelte am Fingerabdruck erkennen und auffällige Dateien (Endung passt nicht zum Kopf, Daten hinter dem Bildende, Programme, Makros) anhalten und nicht weitergeben");
    H.e(p, 8, "Das System muss je Datei einen Steckbrief führen: Art, Absender, angesprochene Person, Datum, Betreff, Nummern, Bereich, Fristen, Beträge, Prüfstand, Herkunft");
    H.e(p, 8, "Das System muss die Dateien als Baum mit wählbaren Zweigen zeigen, ohne etwas zu verschieben");
    H.e(p, 8, "Das System muss Unsicheres als „bitte prüfen“ anhalten statt sicher falsch einzuordnen");
    H.e(p, 8, "Das System muss Archivnummern A-JJJJ-NNNN nur auf Knopf und nur für fertig gesiebte Dateien vergeben; eine Nummer ändert sich nie");
    H.e(p, 8, "Das System muss Mails samt Anhängen, Word- und LibreOffice-Dateien, PDFs und Fotos mit Aufnahmedaten lesen");
    H.e(p, 9, "Schulung: Erklärungen nur hinter einem Fragezeichen, Bedienung wie ein Explorer");
    H.e(p, 9, "Abläufe ändern: erst einwerfen, dann sieben, dann übernehmen");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "offline");
    H.e(p, 10, "Browser am PC (Ordnerwahl) und am Handy; Ordner auf der SD-Karte neben dem verschlüsselten Tresor, nicht darin");
    H.e(p, 11, "Familienakte (nimmt die Dateien heute einzeln)");
    var schnittAkte = H.e(p, 12, "organizer-index.json als offenes Format für die Familienakte und andere Programme");
    H.e(p, 13, "Briefe, Rechnungen, Bescheide, Verträge, Kassenbons, Fotos, E-Mails mit Anhängen");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 14, "alles bleibt auf dem Gerät; keine Datei geht an einen Server");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "kein großes Sprachmodell in der ersten Fassung; nur Regeln, Muster und kleine Modelle auf dem Gerät");
    H.e(p, 15, "nur erfundene Beispieldaten im Testordner");
    H.e(p, 18, "Wo liegt der Eingangsordner am Tablet?", { wer: "Inhaber", bis: "2026-11-15" });
    f.umfang.kundenStundenwertCent = 3000;
    H.bs(f, "neu", "Sortier-Kern mit fünf Sieben, Steckbrief, Archivnummern, Lesen von Mail, docx/odt, PDF und Fotodaten", "gross", [ein.id], { faktoren: ["offline"] });
    H.bs(f, "dateipruef", "Eingangsprüfung: Dateiart am Kopf, Fingerabdruck, Doppelte, Auffällige anhalten", "mittel", [pruef.id]);
    H.bs(f, "suche", "Sichten als selbstsortierender Baum, Wortsuche", "mittel", [baum.id]);
    H.bs(f, "datei", "Nur lesen, Begleitdatei organizer-index.json, Verlauf mit Rückgängig", "mittel", [orig.id, lern.id]);
    H.bs(f, "schnitt", "Index-Format für die Übernahme in die Familienakte", "klein", [akte.id, schnittAkte.id]);
    H.bs(f, "neu", "Testordner mit 101 erfundenen Dateien, installierbare Web-App", "klein", [probe.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-11-12");

    /* F2 — besserer Kern, Fachregel, Kern für die Schwester-Apps, Bedienung */
    var f2 = F.neueFassung(v, { anlass: "Die ersten Treffer galten nur für selbst gebaute Daten; an fremden Stapeln soll der Kern nachweislich besser werden, und die anderen Apps sollen ihn mitnutzen", von: "kunde", datum: "2026-11-13" }).fassung;
    var p2 = f2.protokoll;
    var genau = H.bed(p2, "Bereich, Absender, Art, Frist und Person an fremden, gescannten Stapeln nachweislich besser treffen", "muss", { h: 3, text: "weniger Nacharbeit" });
    var ocr = H.bed(p2, "Fotos und gescannte PDFs ohne Textebene per Texterkennung lesen", "soll", { h: 1 });
    var fach = H.bed(p2, "Feste Regel, in welches Fach ein Schriftstück gehört, das in zwei passt; die Sache entscheidet, nicht der Absender", "soll", {});
    var merken = H.bed(p2, "Merken nach Sache: Absender und Vorschlag zusammen ergeben den Bereich", "soll", { h: 1 });
    var gruppe = H.bed(p2, "Familienakte und Buchhaltung nutzen denselben Kern, byte-gleich und ohne zweite Fassung", "muss", { h: 2 });
    var stich = H.bed(p2, "Stichprobe der eigenen Unterlagen: nur Zahlen je Feld, nichts verlässt das Gerät", "kann", {});
    var bedien = H.bed(p2, "Ladebalken, Aktualisieren mit Hinweis auf neue Fassung, Dateien einfügen per Ziehen und Ablegen, einzelne Dateien entfernen, Neues zuerst", "soll", {});
    H.e(p2, 8, "Das System muss die Fachregel als Daten führen; eigene Zuordnung von Hand gewinnt immer und wird nie überschrieben");
    H.e(p2, 8, "Das System muss den Kern zusätzlich als JavaScript ohne Bau-Schritt bereitstellen, damit Apps ohne Bau-Schritt ihn mit Pin übernehmen");
    H.e(p2, 8, "Das System muss beim Entfernen nur die Liste ändern, nie das Original, und „Zurück“ anbieten");
    H.e(p2, 8, "Das System muss Fristen aus Zeiträumen, Skonto, Angebotsbindung und dem Briefdatum lesen");
    var schnittBlp = H.e(p2, 12, "Kern byte-gleich in Familienakte (Bereich und Frist) und Buchhaltungs-App (Aussteller)");
    H.e(p2, 15, "Nachweis an fremden Stapeln mit drei unabhängigen Einordnern, Regeln vorab festgelegt");
    H.e(p2, 18, "Eigene Regeln des Nutzers: erst als Vorschau zeigen", { wer: "Inhaber", bis: "2026-11-20" });
    H.bs(f2, "neu", "Kern 0.2/0.3: Wortmodell für Bereich und Art, neue Regeln für Absender, Frist und Person, Nachweis an fremden Stapeln", "gross", [genau.id], { faktoren: ["offline"] });
    H.bs(f2, "scan", "Texterkennung für Fotos und gescannte PDFs", "mittel", [ocr.id], { faktoren: ["druck"] });
    H.bs(f2, "neu", "Fachregel als Tabelle, Merken nach Sache, Stichprobe nur mit Zahlen", "mittel", [fach.id, merken.id, stich.id]);
    H.bs(f2, "schnitt", "Kern als JavaScript für die Schwester-Apps, byte-gleich mit Pin", "mittel", [gruppe.id, schnittBlp.id], { wv: 0.6 });
    H.bs(f2, "neu", "Bedienung: Ladebalken, Aktualisieren, Update-Fähnchen, Leeren, Entfernen, Ziehen und Ablegen, Neues zuerst", "mittel", [bedien.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-11-13");

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 1.0, 2: 10.4 };

    /* Abstimmung der Mitarbeiter (STERNE ERFUNDEN): Fachbereich und Rollen-Kürzel, keine Namen */
    [[ein.id, "Leitung", "IN", 5, 5, "2026-11-12"], [ein.id, "Ablage", "MA1", 4, 5, "2026-11-12"], [ein.id, "Büro", "BU", 4, 4, "2026-11-12"],
      [pruef.id, "Leitung", "IN", 4, 4, "2026-11-12"], [pruef.id, "Büro", "BU", 3, 4, "2026-11-12"],
      [baum.id, "Ablage", "MA1", 5, 4, "2026-11-12"], [baum.id, "Büro", "BU", 4, 4, "2026-11-12"],
      [akte.id, "Leitung", "IN", 5, 3, "2026-11-12"], [akte.id, "Ablage", "MA1", 4, 3, "2026-11-12"],
      [genau.id, "Leitung", "IN", 5, 4, "2026-11-13"], [genau.id, "Ablage", "MA1", 5, 5, "2026-11-13"], [genau.id, "Büro", "BU", 4, 4, "2026-11-13"],
      [bedien.id, "Ablage", "MA1", 3, 5, "2026-11-13"], [bedien.id, "Büro", "BU", 3, 4, "2026-11-13"]].forEach(function (z) {
      B.sterneDazu(v, { zeitpunkt: "bedarf", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[3], datum: z[5] });
      B.sterneDazu(v, { zeitpunkt: "abnahme", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[4], datum: "2026-11-13" });
    });
    return v;
  }

  WN.beispiel.registrieren({ id: "dateiorganizer", name: { de: "Datei-Organizer (fertige App)", en: "Datei-Organizer (finished app)" }, bauen: dateiorganizer,
    quelle: "Datei-Organizer 07f79fd, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
