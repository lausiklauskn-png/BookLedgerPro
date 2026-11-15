/* Beispiel „PWA Toolpoint“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo PWA-Toolpoint
   (Stand origin/main af9fcd0, gelesen 2026-11-13: CLAUDE.md, docs/RAUSWURF-REGEL.md, git log).
   KUNDENDATEN ERFUNDEN (.example, kein echter Name). STERNE ERFUNDEN (Rollenkürzel, keine Personen).
   Fassungen nach der echten Git-Geschichte:
     F1 Marktplatz steht: Karten mit Messwerten, Einreichen, Pflege-Studio, Ampel bis 2026-08-17 (#1–#82)
     F2 Auslieferungsprüfer, zweiter SBKIM-Knoten, E-Mail-Eingang, Deutsch/Englisch bis 2026-09-17 (#83–#126)
     F3 Wartung, Detailseiten /apps/ als Messblatt, Sitemap, Prüfer gibt Befund ohne Fundwerte bis 2026-09-30 (#127–#159)
     F4 Sicherheitsnetz aus dem Sage-Kanon (Fragen signiert, Sperrliste, Bürgen, Netz-Verwaltung), neue Einträge,
        Installieren-Knopf bis 2026-11-13 (#160–#184)
   Ist-Stunden: Commit-Zeitstempel auf origin/main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo; die nächtlichen Messwert-/Eigenschafts-Läufe des Arbeitsablaufs zählen als
   Commits mit, die Messstation in family-project und die eigene Auslieferungsprüfer-App nicht.
   Nicht gebaut und deshalb nicht erfunden: Preise, Provision, Bezahlvorgang (Stufe 2, erst nach Gewerbeanmeldung),
   eigene Messung (die Zahlen kommen aus family-projects Messreihe), eigener Raum im Mycel (vorbereitet, Modul 23
   kennt ihn noch nicht), Senden-Knopf im Prüfer. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function toolpoint(nr, einst) {
    var F = WN.fassungen, B = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-08-08");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Offener Marktplatz für Web-Apps mit nachprüfbaren Messwerten";
    v.beispiel = true; v.bid = "toolpoint";
    v.kunde.firma = "Marktplatz Beispiel";
    v.kunde.ansprechpartner = "Ansprechperson Beispiel";
    v.kunde.mail = "betrieb@marktplatz-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-08-08";
    H.e(p, 1, "nichts");
    H.e(p, 1, "eigene Apps liegen verstreut auf einzelnen Adressen, nur im Freundeskreis bekannt");
    H.e(p, 1, "ein Marktplatz für den inneren Kreis besteht schon (gleiche Technik, persönlicher Ton)");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 2, "Apps vorstellen, prüfen und aufnehmen");
    H.e(p, 3, "Betreiber", { anzahl: 1 });
    H.e(p, 3, "fremde Anbieter, die eine App eintragen wollen", { anzahl: 20 });
    H.e(p, 3, "Besucher, die eine App suchen (Fremde)", { anzahl: 500 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Fremde haben keinen Grund, einer unbekannten App zu vertrauen");
    H.e(p, 4, "Bewertungen anderswo sind Selbstauskunft oder geschönt");
    H.e(p, 5, "Vertrauen kommt bisher von den Personen; bei Fremden muss es die Software herstellen");
    var markt = H.bed(p, "Eine Seite, auf der Web-Apps mit Symbol, Beschreibung und Anbieter stehen, auch am Handy übersichtlich", "muss", { text: "gefunden werden" });
    var mess = H.bed(p, "Gemessene Werte (Leistung, Bedienbarkeit, gute Praxis, Auffindbarkeit) mit Datum an jeder Karte, auch die schlechten", "muss", { text: "nachprüfbar statt geschönt" });
    var suche = H.bed(p, "Suchen nach Worten und nach Bedeutung, mit Mikrofon", "soll", { h: 2 });
    var eintragen = H.bed(p, "Fremde können ihre App einreichen; nichts erscheint ohne Freigabe des Betreibers", "muss", { h: 3 });
    var studio = H.bed(p, "Ein verstecktes Pflege-Studio zum Freigeben, Bearbeiten und Sperren, ohne Schlüssel im Browser", "muss", { h: 4 });
    var ampel = H.bed(p, "Ampel je Eintrag mit Grund; Melden-Knopf an jeder Karte", "soll", { h: 1 });
    var netz = H.bed(p, "Selbst ein Knoten im SBKIM-Netz mit Siegel und Lampen", "kann", {});
    H.e(p, 7, "Jede Karte sagt mit Datum, was gemessen wurde; jede Einsendung geht über einen Tisch");
    H.e(p, 8, "Das System muss als Seite ohne Konto und ohne Anmeldung laufen, installierbar und nach dem ersten Besuch offline");
    H.e(p, 8, "Das System muss jede App als kompakte Karte zeigen: Symbol, Name, Beschreibung, Messwerte mit Datum; Anbieter, Bereich und Links erst beim Aufklappen");
    H.e(p, 8, "Das System muss „noch nicht gemessen“ anzeigen, wo keine Messung vorliegt, und nie eine Zahl erfinden");
    H.e(p, 8, "Das System muss die Messwerte nachts aus der Messreihe der Schwester-Seite übernehmen statt selbst ein zweites Mal zu messen");
    H.e(p, 8, "Das System muss die Einträge nach dem Anfangsdatum der App ordnen (Zeitachse, keine Rangliste)");
    H.e(p, 8, "Das System muss die Einträge als fertiges HTML in der Seite tragen, damit nichts springt und Suchmaschinen sie ohne Skript lesen");
    H.e(p, 8, "Das System muss Einsendungen nur über den Server annehmen; der Zugang zum Repo liegt nur dort");
    H.e(p, 8, "Das System muss eine gesperrte App sichtbar mit Grund zeigen, den Link abschalten und sie nicht als Fund der Woche wählen");
    H.e(p, 8, "Das System muss eine Sperre aus dem Studio setzen und nur in der Datei lösen lassen");
    H.e(p, 8, "Das System muss in Stufe 1 ohne Preis, Provision und Bezahlvorgang auskommen");
    H.e(p, 9, "sachlicher, knapper Ton für Fremde, kein Mitmach-Appell");
    H.e(p, 9, "Erklärungen hinter Aufklappern statt Textwänden");
    H.e(p, 10, "offline");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "drei Themen (Nacht, Signal, Tag), Kontrast in jedem geprüft");
    H.e(p, 11, "Marktplatz der Schwester-Seite mit Messstation und Einreich-Server");
    var schnittMess = H.e(p, 12, "Messreihe der Schwester-Seite (nächtlich gelesen)");
    var schnittServer = H.e(p, 12, "gemeinsamer Einreich- und Freigabe-Server mit Herkunft je Einsendung");
    H.e(p, 13, "Einträge, Messwerte mit Datum, geprüfte Eigenschaften, Ampel mit Grund, Meldungen");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 14, "kein Zähldienst, keine Laufzeit-Abhängigkeit von fremden Servern");
    H.e(p, 14, "Impressum und Datenschutz mit echten Angaben (§ 5 DDG)");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "Stufe 1: nur zeigen, keine Preise; vor dem ersten Preis die Gewerbeanmeldung");
    H.e(p, 15, "kein eigener Bezahlvorgang, keine automatische Auszahlung, kein Kopierschutz");
    H.e(p, 18, "Ab wann wird ein Preis gezeigt?", { wer: "Betreiber", bis: "2026-09-30" });
    f.umfang.kundenStundenwertCent = 3000;
    H.bs(f, "shop", "Marktplatz-Seite mit kompakten Karten, Zeitachse, drei Themen, statisch eingebackener Liste", "gross", [markt.id], { faktoren: ["offline"] });
    H.bs(f, "schnitt", "Messwerte nächtlich aus der Messreihe der Schwester-Seite übernehmen, Abgleich beider Märkte", "mittel", [mess.id, schnittMess.id]);
    H.bs(f, "suche", "Wort- und Bedeutungssuche mit Mikrofon", "mittel", [suche.id]);
    H.bs(f, "schnitt", "Einreichen über den gemeinsamen Server, Herkunft vom Browser bezeugt", "mittel", [eintragen.id, schnittServer.id], { faktoren: ["server"] });
    H.bs(f, "neu", "Pflege-Studio hinter langem Druck: Warteschlange, Bearbeiten, Veröffentlichen ins Repo, Ampel und Melde-Kette", "gross", [studio.id, ampel.id]);
    H.bs(f, "neu", "SBKIM-Knoten mit Siegel, Lampen und eigenem Netz (Module aus dem Kanon kopiert)", "mittel", [netz.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-08-17");

    /* F2 — Auslieferungsprüfer */
    var f2 = F.neueFassung(v, { anlass: "Anbieter sollen ihre App vor dem Eintragen selbst prüfen können: Schlüssel, fremde Adressen, versteckte Befehle", von: "betrieb", datum: "2026-08-21" }).fassung;
    var p2 = f2.protokoll;
    var pruefer = H.bed(p2, "Ein Prüfer, der eine Seite, ein Archiv, einen Text oder eine Adresse auf dem Gerät durchsieht und in Klartext sagt, was auffällt", "muss", { h: 2, text: "kein Schlüssel und keine fremde Adresse rutscht mehr mit hinaus" });
    var mail = H.bed(p2, "Auch E-Mails prüfen: Links, versteckter Text, Anweisungen an eine KI", "soll", { h: 1 });
    var knoten2 = H.bed(p2, "Der Prüfer ist ein eigener Knoten mit eigener Identität neben dem Marktplatz", "kann", {});
    var sprachen = H.bed(p2, "Deutsch und Englisch mit einem Knopf, Rechtstexte bleiben verbindlich Deutsch", "soll", {});
    var schulung = H.bed(p2, "KI-Schulung nach Art. 4 EU AI Act als eigene, druckbare Seite", "kann", {});
    H.e(p2, 8, "Das System muss jede Prüfung im Browser ausführen und nichts hochladen");
    H.e(p2, 8, "Das System muss jeden Befund mit Stelle, Sorte und Rat in Klartext zeigen und nie „virenfrei“ behaupten");
    H.e(p2, 8, "Das System muss eine Seite zweifach lesen (Text und Browser-Parser) und Unterschiede selbst als Befund melden");
    H.e(p2, 8, "Das System muss eine gespeicherte Seite (.mhtml) auspacken und sagen, welchen Teil es geprüft hat");
    H.e(p2, 13, "Prüfberichte (nur auf dem Gerät)");
    H.e(p2, 18, "Bekommt der Prüfer einen Senden-Knopf?", { wer: "Betreiber", bis: "2026-10-31" });
    H.bs(f2, "dateipruef", "Auslieferungsprüfer: HTML, Archiv, Text, Adresse; Befund in Klartext, zweite Meinung", "gross", [pruefer.id]);
    H.bs(f2, "kipruef", "E-Mail-Eingang mit KI-Anweisungs-Prüfung", "mittel", [mail.id], { faktoren: ["ki"] });
    H.bs(f2, "neu", "Zweiter SBKIM-Knoten mit eigener Schublade und eigenem Siegel", "klein", [knoten2.id]);
    H.bs(f2, "neu", "Zweisprachigkeit mit Sprachriegel gegen den Auto-Übersetzer", "mittel", [sprachen.id], { faktoren: ["sprachen"] });
    H.bs(f2, "seite", "Seite KI-Schulung mit Druckfassung", "klein", [schulung.id], { faktoren: ["druck"] });
    F.unterschreiben(v, f2, einst && einst.ust, "2026-09-17");

    /* F3 — Wartung, Detailseiten, Sitemap */
    var f3 = F.neueFassung(v, { anlass: "Ein Anbieter bittet um Unsichtbarkeit während der Überarbeitung; die Apps sollen bei Suchmaschinen eigene Seiten haben", von: "kunde", datum: "2026-09-18" }).fassung;
    var p3 = f3.protokoll;
    var wartung = H.bed(p3, "Eine App per Klick auf Wartung schalten und wieder zurück; währenddessen keine Warnung aus Messungen", "muss", { h: 1 });
    var detail = H.bed(p3, "Je App eine eigene Seite mit Messverlauf, Mängeln und Weg zur App, dazu eine Übersicht aller Apps", "muss", { text: "gefunden werden über Suchmaschinen" });
    var sitemap = H.bed(p3, "Sitemap und Kennzeichnung werden aus den Seiten gebaut, nicht von Hand gepflegt", "soll", {});
    var befund = H.bed(p3, "Den Befund des Prüfers kopieren können, ohne dass Schlüssel oder Kontonummern mitgehen", "muss", { text: "an die eigene KI weitergeben" });
    H.e(p3, 8, "Das System muss eine gesperrte App auch in der Wartung sichtbar lassen (die Sperre geht vor)");
    H.e(p3, 8, "Das System muss in der Detailseite kein Datum erfinden und keine Bewertung vortäuschen (keine Sterne, kein Preis im Strukturdaten-Block)");
    H.e(p3, 8, "Das System muss beim Kopieren jede Quellzeile eines Befunds durch einen Platzhalter ersetzen");
    H.bs(f3, "neu", "Wartungs-Schalter im Studio, Sichtbarkeit an einer Stelle gefiltert", "klein", [wartung.id]);
    H.bs(f3, "seite", "Detailseiten /apps/ als Messblatt, Übersicht mit Suchfeld", "gross", [detail.id]);
    H.bs(f3, "seite", "Sitemap-Bau aus dem Canonical, Arbeitsabläufe bauen alles mit", "klein", [sitemap.id]);
    H.bs(f3, "kipruef", "Befund ohne Fundwerte in die Zwischenablage", "klein", [befund.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-09-30");

    /* F4 — Sicherheitsnetz aus dem Kanon, neue Einträge */
    var f4 = F.neueFassung(v, { anlass: "Fremde Knoten im Netz sollen sich nicht als andere ausgeben können; weitere eigene Apps gehören ins Regal", von: "betrieb", datum: "2026-10-01" }).fassung;
    var p4 = f4.protokoll;
    var echt = H.bed(p4, "Fragen und Antworten im Netz sind unterschrieben, Echtheit wird geprüft, gesperrte Knoten stehen in einer signierten Liste", "muss", {});
    var buergen = H.bed(p4, "Bürgen je App mit Ablauf und Widerruf, Netz-Verwaltung als eigene Seite", "soll", {});
    var neue = H.bed(p4, "Neue eigene Apps aufnehmen (Sende-Prüfer, Workflow Calculate, Bedarfsanalyse, Kim-sync, BookLedger Basic)", "soll", { h: 1 });
    var install = H.bed(p4, "Installieren-Knopf in der Kopfleiste, der verschwindet, sobald die Seite als App läuft", "kann", {});
    H.e(p4, 8, "Das System muss die Netz-Module byte-gleich aus dem Kanon übernehmen und Abweichungen per Prüfwert melden");
    H.e(p4, 8, "Das System muss eine Antwort mit Anweisung an eine KI vom KI-Richter ausschließen");
    H.e(p4, 18, "Wann kommt Stufe 2 (Preise, Provision)?", { wer: "Betreiber", bis: "2027-01-31" });
    H.bs(f4, "neu", "Sicherheitsnetz aus dem Sage-Kanon: signierte Fragen, Rechenaufwand, Sperrliste", "mittel", [echt.id], { wv: 0.7 });
    H.bs(f4, "lizenz", "Bürgen je App und Netz-Verwaltungsseite", "mittel", [buergen.id], { faktoren: ["nutzer"] });
    H.bs(f4, "shop", "Neue Einträge mit Detailseite und Sitemap", "klein", [neue.id], { menge: 5 });
    H.bs(f4, "seite", "Installieren-Knopf ohne Sprung der Kopfleiste", "klein", [install.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-11-13");

    /* Abstimmung der Beteiligten (Sterne erfunden): BE Betreiber, AN1/AN2 Anbieter, BS Besucher */
    var S = [
      [mess.id, "Marktplatz", "BE", 5, 5], [mess.id, "Marktplatz", "AN1", 4, 5], [mess.id, "Marktplatz", "BS", 4, 4],
      [studio.id, "Pflege", "BE", 5, 5], [studio.id, "Pflege", "AN1", 3, 4],
      [eintragen.id, "Einreichen", "AN1", 4, 4], [eintragen.id, "Einreichen", "AN2", 5, 4], [eintragen.id, "Einreichen", "BE", 4, 5],
      [pruefer.id, "Prüfung", "AN1", 5, 5], [pruefer.id, "Prüfung", "AN2", 4, 5], [pruefer.id, "Prüfung", "BE", 5, 4],
      [detail.id, "Suchmaschinen", "BE", 4, 5], [detail.id, "Suchmaschinen", "BS", 3, 4],
      [wartung.id, "Pflege", "AN2", 5, 5], [wartung.id, "Pflege", "BE", 3, 4],
    ];
    S.forEach(function (z) {
      B.sterneDazu(v, { zeitpunkt: "bedarf", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[3], datum: "2026-08-08" });
      B.sterneDazu(v, { zeitpunkt: "abnahme", kennung: z[0], bereich: z[1], kuerzel: z[2], sterne: z[4], datum: "2026-11-13" });
    });

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 40.0, 2: 78.7, 3: 100.1, 4: 137.7 };
    return v;
  }

  WN.beispiel.registrieren({ id: "toolpoint", name: { de: "PWA Toolpoint (fertige App)", en: "PWA Toolpoint (finished app)" }, bauen: toolpoint,
    quelle: "PWA-Toolpoint af9fcd0, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
