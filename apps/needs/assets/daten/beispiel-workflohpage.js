/* Beispiel „Werbetechnik-Website (Vorlage)“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Mein-Workfloh-Page
   (Stand c777459, gelesen 2026-11-13: CLAUDE.md, README.md, docs/PULS.md, docs/BRIEF_AN_SAGE_PROTOKOLL.md, git log).
   Die App ist eine firmenneutrale Vorlage „Muster Werbetechnik“: Website als installierbare PWA mit sechs Bereichen.
   KUNDENDATEN ERFUNDEN (.example, kein echter Name). STERNE ERFUNDEN (Rollenkürzel, keine Personen).
   Fassungen nach der echten Geschichte (git log origin/main):
     F1 Neutrale Vorlage: sechs Bereiche, Themen, Bilder per Ziehen, offline bis 2026-08-01
     F2 Ladezeit und Kontrast, SBKIM-Endknoten mit Netz-Fenster, Siegel und eigener Spore bis 2026-08-22
     F3 Netz-Bausteine aus dem Kanon nachgezogen, Englisch, Sicherheits-Erklärseite, Installieren-Knopf bis 2026-10-31
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — der UI-Klon vor dem Neustart (2026-07-09) ist mitgezählt, soweit er auf main liegt.
   Nicht gebaut und deshalb nicht erfunden: echte Firmendaten, Kontaktformular mit Versand, Karte/Anfahrt
   (nur Platzhalter), Shop, Angebotsrechner, Redaktionsoberfläche zum Ändern der Texte. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function workflohpage(nr, einst) {
    var F = WN.fassungen, BD = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-07-08");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Firmen-Website für einen Werbetechnik-Betrieb, als Vorlage wiederverwendbar";
    v.beispiel = true; v.bid = "workflohpage";
    v.kunde.firma = "Werbetechnik Beispiel";
    v.kunde.ansprechpartner = "Inhaberin Beispiel";
    v.kunde.mail = "info@werbetechnik-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-07-09";
    H.e(p, 1, "Website");
    H.e(p, 1, "eine alte Seite mit festen Firmendaten, Fotos und eingebundenem Instagram und Google Maps");
    H.e(p, 2, "Werbung");
    H.e(p, 2, "Anfrage");
    H.e(p, 3, "Inhaber", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiter in Werkstatt und Montage (pflegen Bilder)", { anzahl: 2 });
    H.e(p, 3, "Kunden und Interessenten (Besucher, nicht Nutzer)", { anzahl: 1 });
    H.e(p, 4, "Die Seite lädt langsam und sieht am Handy veraltet aus");
    H.e(p, 4, "Fremde Einbettungen (Karte, Instagram) geben Besucherdaten weiter");
    H.e(p, 5, "Die Seite ist an eine Firma gebunden und lässt sich nicht für einen zweiten Betrieb verwenden");
    var bereiche = H.bed(p, "Eine Website mit Start, Leistungen, Info zu Anlagen, Fragen und Antworten, Team und Kontakt", "muss", { text: "Kunden finden alles an einem Ort" });
    var neutral = H.bed(p, "Ohne echte Firmendaten: alle Namen, Adressen und Kontakte als Platzhalter, damit die Seite als Vorlage taugt", "muss", { text: "für mehrere Betriebe verwendbar" });
    var pwa = H.bed(p, "Installierbar und nach dem ersten Besuch ohne Internet lesbar", "muss", {});
    var bilder = H.bed(p, "Eigene Bilder ohne Programmierkenntnis auf jede Bildfläche ziehen, lokal gespeichert", "soll", { h: 1, text: "Fotos aus der Werkstatt selbst einsetzen" });
    var themen = H.bed(p, "Hell, Dunkel und ein Kontrast-Thema zum Umschalten", "soll", {});
    var effekte = H.bed(p, "Ein lebendiger Auftritt: Glas-Knöpfe und animierter Hintergrund", "kann", {});
    H.e(p, 7, "Ein Besucher findet am Handy in Sekunden Leistungen und Kontakt; die Vorlage lässt sich für einen neuen Betrieb in einer Stunde anpassen");
    H.e(p, 8, "Das System muss als eine selbst-enthaltende Seite mit sechs Bereichen laufen: Start, Leistungen, Anlagen, Fragen und Antworten, Team, Kontakt");
    H.e(p, 8, "Das System muss ohne Bilder ausgeliefert werden und fehlende Fotos durch neutrale Platzhalter ersetzen");
    H.e(p, 8, "Das System muss eigene Bilder per Ziehen oder Kamera-Symbol annehmen und nur im Browser des Geräts speichern");
    H.e(p, 8, "Das System muss sich installieren lassen und nach dem ersten Besuch offline funktionieren (Service Worker, Manifest)");
    H.e(p, 8, "Das System muss die Themen Hell, Dunkel und Kontrast anbieten und die Wahl merken");
    H.e(p, 8, "Das System darf keine echten Firmen- oder Personendaten enthalten; jede Angabe ist ein erkennbarer Platzhalter");
    H.e(p, 9, "für Inhaber ohne Technikwissen; Besucher auf Handy, Tablet und PC");
    H.e(p, 10, "Browser");
    H.e(p, 10, "offline");
    H.e(p, 11, "alte Website mit Fremd-Einbettungen (wird abgelöst)");
    H.e(p, 13, "Leistungen, Projekte, Team, Kontaktangaben, Fotos");
    H.e(p, 14, "personenbezogene Daten: nur Platzhalter, keine echten");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "kein Zähldienst, keine Karte und kein Instagram eines Fremdanbieters eingebunden");
    H.e(p, 15, "keine externen Bibliotheken aus fremden Quellen, alles mitgeliefert");
    H.e(p, 18, "Welche Leistungen und Projekte sollen als Muster dastehen?", { wer: "Inhaberin", bis: "2026-07-15" });
    f.umfang.kundenStundenwertCent = 3000;
    H.bs(f, "seite", "Website mit sechs Bereichen, neutralen Platzhaltern und Themen", "mittel", [bereiche.id, neutral.id, themen.id]);
    H.bs(f, "seite", "Installierbare Web-App mit Offline-Vorrat", "klein", [pwa.id], { faktoren: ["offline"] });
    H.bs(f, "neu", "Bilder per Ziehen auf jede Fläche, lokal gespeichert", "klein", [bilder.id]);
    H.bs(f, "neu", "Glas-Knöpfe und animierter Partikel-Hintergrund", "klein", [effekte.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-08-01");

    /* F2 — Ladezeit, SBKIM-Knoten */
    var f2 = F.neueFassung(v, { anlass: "Die Seite soll schneller laden und im Netz der eigenen Apps gefunden werden, mit nachprüfbarer Herkunft", von: "kunde", datum: "2026-08-14" }).fassung;
    var p2 = f2.protokoll;
    var tempo = H.bed(p2, "Schneller Seitenaufbau und lesbarer Kontrast am Handy", "muss", { text: "Besucher springen nicht ab" });
    var knoten = H.bed(p2, "Die Seite ist ein Knoten im Netz der eigenen Apps, mit Netz-Fenster und Gerätename", "soll", { h: 1 });
    var siegel = H.bed(p2, "Ein Siegel zeigt, wer die Seite betreibt, mit eigener unterschriebener Kennung", "soll", {});
    var rechte = H.bed(p2, "Rechte und Lizenz der Vorlage klar benannt", "muss", {});
    H.e(p2, 8, "Das System muss den animierten Hintergrund erst nach dem Laden starten, damit der erste Aufbau nicht wartet");
    H.e(p2, 8, "Das System muss als Netz-Endknoten eine eigene Ablage haben und beim Laden nichts ins Netz senden");
    H.e(p2, 8, "Das System muss die eigene Kennung (Spore) unterschrieben veröffentlichen und im Siegel prüfbar zeigen");
    var schnittNetz = H.e(p2, 12, "Netz der eigenen Apps (SBKIM, Mycel) über Relais");
    H.bs(f2, "seite", "Ladezeit und Kontrast: Hintergrund nach dem Laden, Schutzstufen", "klein", [tempo.id]);
    H.bs(f2, "schnitt", "Netz-Endknoten mit Netz-Fenster, Gerätename und eigener Ablage", "mittel", [knoten.id, schnittNetz.id], { wv: 0.8 });
    H.bs(f2, "neu", "Siegel mit Andock-Assistent und veröffentlichter Spore", "klein", [siegel.id], { wv: 0.8 });
    H.bs(f2, "neu", "Lizenz und Rechte-Erklärung", "klein", [rechte.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-08-22");

    /* F3 — Kanon, Englisch, Sicherheitsseite, Installieren */
    var f3 = F.neueFassung(v, { anlass: "Besucher aus dem Ausland, mehr Schutz im Netz und ein sichtbarer Weg zum Installieren", von: "kunde", datum: "2026-09-08" }).fassung;
    var p3 = f3.protokoll;
    var englisch = H.bed(p3, "Netz-Fenster und Siegel auch auf Englisch", "soll", {});
    var schutz = H.bed(p3, "Schutz im Netz: Sperrliste, Bürgen, Aufwand je Zettel, aktuell gehalten", "soll", {});
    var erklaer = H.bed(p3, "Eine Seite, die in einfachen Worten erklärt, was Netz, Siegel und Schutz dem Besucher nützen", "kann", {});
    var install = H.bed(p3, "Ein fester Installieren-Knopf oben, der als App verschwindet", "muss", { text: "mehr Besucher installieren die Seite" });
    var vorlage = H.bed(p3, "Die Seite sagt selbst, dass sie eine Vorlage ist", "muss", {});
    H.e(p3, 9, "Oberfläche Deutsch, Netz-Bausteine Deutsch und Englisch");
    H.e(p3, 8, "Das System muss die Netz-Bausteine unverändert aus der gemeinsamen Quelle übernehmen und per Prüfsumme bewachen");
    H.e(p3, 8, "Das System muss nur eigene Offline-Vorräte aufräumen, nie die anderer Apps auf derselben Adresse");
    H.bs(f3, "schnitt", "Netz-Bausteine nachgezogen: Englisch, Sperrliste, Bürgen, Rechenaufwand", "mittel", [englisch.id, schutz.id], { faktoren: ["sprachen"], wv: 0.8 });
    H.bs(f3, "seite", "Erklärseiten zu Netz, Siegel und Schutz", "klein", [erklaer.id]);
    H.bs(f3, "seite", "Installieren-Knopf und Vorlagen-Hinweis auf der Seite", "klein", [install.id, vorlage.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-10-31");

    /* Abstimmung der Mitarbeiter — Sterne erfunden, Kürzel sind Rollen */
    function st(e, z, bereich, kz, n, d) { BD.sterneDazu(v, { zeitpunkt: z, kennung: e.id, bereich: bereich, kuerzel: kz, sterne: n, datum: d }); }
    st(bereiche, "bedarf", "Geschäftsführung", "IN", 5, "2026-07-09"); st(bereiche, "bedarf", "Werkstatt", "MA1", 4, "2026-07-09");
    st(bereiche, "abnahme", "Geschäftsführung", "IN", 5, "2026-10-31"); st(bereiche, "abnahme", "Kunde", "KU", 4, "2026-10-31");
    st(bilder, "bedarf", "Werkstatt", "MA1", 4, "2026-07-09"); st(bilder, "bedarf", "Montage", "MA2", 3, "2026-07-09");
    st(bilder, "abnahme", "Werkstatt", "MA1", 5, "2026-10-31"); st(bilder, "abnahme", "Montage", "MA2", 4, "2026-10-31");
    st(pwa, "bedarf", "Geschäftsführung", "IN", 3, "2026-07-09"); st(pwa, "bedarf", "Montage", "MA2", 4, "2026-07-09");
    st(pwa, "abnahme", "Montage", "MA2", 5, "2026-10-31"); st(pwa, "abnahme", "Geschäftsführung", "IN", 4, "2026-10-31");
    st(tempo, "bedarf", "Geschäftsführung", "IN", 4, "2026-08-14"); st(tempo, "bedarf", "Kunde", "KU", 5, "2026-08-14");
    st(tempo, "abnahme", "Kunde", "KU", 5, "2026-10-31"); st(tempo, "abnahme", "Geschäftsführung", "IN", 5, "2026-10-31");
    st(install, "bedarf", "Geschäftsführung", "IN", 4, "2026-09-08"); st(install, "bedarf", "Werkstatt", "MA1", 3, "2026-09-08");
    st(install, "abnahme", "Geschäftsführung", "IN", 4, "2026-10-31"); st(install, "abnahme", "Kunde", "KU", 3, "2026-10-31");

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 1.7, 2: 9.3, 3: 26.3 };
    return v;
  }

  WN.beispiel.registrieren({ id: "workflohpage", name: { de: "Werbetechnik-Website (Vorlage) (fertige App)", en: "Signage company website (template) (finished app)" }, bauen: workflohpage,
    quelle: "Mein-Workfloh-Page c777459, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
