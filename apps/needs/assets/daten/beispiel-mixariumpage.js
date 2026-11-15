/* Beispiel „Mein Mixarium – Internetseite“ — die fertige Landing-Page, durchgespielt, als wäre sie ein Kundenauftrag
   gewesen (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Mein-Mixarium-Page
   (Stand 050c662 auf origin/main, gelesen 2026-11-13: README, CLAUDE.md, index.html, git log). KUNDENDATEN ERFUNDEN
   (.example, kein echter Name). Kleines Vorhaben, deshalb nur zwei Fassungen nach der echten Geschichte (git log):
     F1 Landing-Page mit Demo-Video, Themen, DE/EN, Umbau-Bereich, Galerie bis 2026-07-06 (#1–#7)
     F2 Feinschliff: neues Icon, Rechte/Copyright, Ladezeit und Barrierefreiheit, Mikrofon-Sprache,
        Versprechen an die App angeglichen bis 2026-10-31 (#8–#20)
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — die App Mein Mixarium selbst und die übernommene Optik aus family-project sind
   nicht mitgezählt. Sterne der Mitarbeiter ERFUNDEN (plausibel, keine Bewertung echter Personen).
   Nicht gebaut und deshalb nicht erfunden: eigener Shop/Bezahlweg, Kontaktformular, Anmeldung, Zähldienst,
   eigene Übersetzung über DE/EN hinaus (die App selbst kann 8 Sprachen, die Seite 2). */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function mixariumpage(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-07-02");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Werbe- und Landingpage für eine Getränke-App";
    v.beispiel = true; v.bid = "mixariumpage";
    v.kunde.firma = "Getränkelabor Beispiel";
    v.kunde.ansprechpartner = "Inhaberin Beispiel";
    v.kunde.mail = "kontakt@getraenkelabor-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-07-02";
    H.e(p, 1, "nichts");
    H.e(p, 1, "die App gibt es schon, aber niemand findet sie; Verweise gehen direkt auf die App ohne Erklärung");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 2, "neue Nutzer gewinnen und ihnen zeigen, was die App kann");
    H.e(p, 3, "Inhaber", { anzahl: 1 });
    H.e(p, 3, "Besucher der Seite (Interessenten, nicht selbst Nutzer der Seitenpflege)", { anzahl: 1 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Interessenten verstehen nicht, was die App kann, bevor sie sie öffnen");
    H.e(p, 5, "Die App öffnet direkt im Werkzeug, eine Vorstellung fehlt");
    var seite = H.bed(p, "Eine eigene Internetseite, die die App vorstellt und mit einem Knopf zur App führt", "muss", { h: 2, text: "mehr Besucher finden zur App" });
    var video = H.bed(p, "Ein Demo-Video, das die App in Aktion zeigt (Buch, Suche, Wischen, KI-Labor, Themen)", "muss", { h: 1, text: "Erklären ohne Text" });
    var look = H.bed(p, "Derselbe Auftritt wie die Schwester-Seiten des Familien-Verbunds: Themen Dunkel/Neon/Hell, Deutsch und Englisch", "soll", {});
    var umbau = H.bed(p, "Zeigen, dass die App zu einer eigenen Bar oder Theke umgebaut werden kann (Rezept-Paket hereinladen)", "soll", { text: "spricht Gastronomie an" });
    var galerie = H.bed(p, "Bilder aus dem echten Buch als Beleg", "kann", {});
    H.e(p, 7, "Wer die Seite öffnet, weiß nach einer Minute, was die App kann, und ist mit einem Tipp in der App");
    H.e(p, 8, "Das System muss die App vorstellen: Zweck (persönliches Getränke-Labor), Besonderheiten, Tauschen und Sichern, Umbau zur eigenen Bar");
    H.e(p, 8, "Das System muss als statische Seite ohne Server und ohne Build-Schritt laufen (GitHub Pages, Auslieferung von main)");
    H.e(p, 8, "Das System muss ein Demo-Video und ein Intro-Video in Bildschirmhöhe zeigen");
    H.e(p, 8, "Das System muss zwischen Deutsch und Englisch und zwischen drei Themen (Dunkel, Neon, Hell) umschalten");
    H.e(p, 8, "Das System muss mit einem Knopf „App öffnen“ zur App Mein Mixarium führen und auf den Familien-Verbund verweisen");
    H.e(p, 8, "Das System muss alle Bibliotheken mitliefern (three.js unter vendor/) und darf kein CDN laden");
    H.e(p, 9, "Pflege durch den Inhaber selbst, keine Schulung nötig");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "Handy, Tablet und Rechner, Handy-Ansicht zuerst");
    H.e(p, 11, "App Mein Mixarium (eigene Adresse, bleibt unverändert)");
    var schnittApp = H.e(p, 12, "Verweis zur App und zu Impressum/Datenschutz der App");
    H.e(p, 13, "Videos, Bilder aus dem Buch, Texte in zwei Sprachen");
    H.e(p, 14, "personenbezogene Daten: nein");
    H.e(p, 14, "kein Formular, keine Anmeldung, kein Zähldienst");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "Optik aus der Schwester-Seite übernehmen, nicht neu erfinden");
    H.e(p, 18, "Welche Bilder aus dem Buch dürfen gezeigt werden?", { wer: "Inhaberin", bis: "2026-07-05" });
    f.umfang.kundenStundenwertCent = 3000;
    H.bs(f, "seite", "Landing-Page im Verbund-Look: Themen, DE/EN, Abschnitte, Knopf zur App", "mittel", [seite.id, look.id, schnittApp.id], { faktoren: ["sprachen"] });
    H.bs(f, "neu", "Demo-Video und Intro-Video, Container in Bildschirmhöhe", "klein", [video.id]);
    H.bs(f, "neu", "Abschnitt „Bau dir deine eigene Bar“ mit Bildern und Galerie aus dem echten Buch", "klein", [umbau.id, galerie.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-07-06");

    /* F2 — Feinschliff, Ladezeit, Rechte, Ehrlichkeit */
    var f2 = F.neueFassung(v, { anlass: "Die Seite lädt am Handy zu langsam, Rechte und Copyright fehlen, und ein Versprechen stimmt nicht mit der App überein", von: "kunde", datum: "2026-07-23" }).fassung;
    var p2 = f2.protokoll;
    var schnell = H.bed(p2, "Die Seite lädt am Handy schnell und ist barrierefrei (gemessen, nicht geschätzt)", "muss", { h: 1, text: "Besucher springen nicht ab" });
    var rechte = H.bed(p2, "Rechte klar: Copyright-Kasten mit Kontakt, Lizenz und Rechte-Erklärung, neues App-Icon", "muss", {});
    var mikro = H.bed(p2, "Das Mikrofon im Demo hört die gesprochene Sprache, nicht die Sprache der Seite", "kann", {});
    var ehrlich = H.bed(p2, "Die Seite verspricht nur, was die App wirklich kann", "muss", { text: "keine Enttäuschung nach dem Öffnen" });
    H.e(p2, 8, "Das System muss den animierten Hintergrund erst nach dem Laden holen und auf schwachen Grafikchips abschalten");
    H.e(p2, 8, "Das System muss jede Funktion, die es nennt, gegen die laufende App prüfen lassen; ein Satz ohne Gegenstück in der App wird gestrichen");
    H.e(p2, 15, "keine Werbung für Funktionen, die es nicht gibt");
    H.bs(f2, "seite", "Ladezeit und Barrierefreiheit: Hintergrund nachgeladen, fragt nach dem Grafikchip, Fuß-Block folgt der Seite", "mittel", [schnell.id], { wv: 0.3 });
    H.bs(f2, "neu", "Rechte: LICENSE, RECHTE.md, Copyright-Kasten, Wasserzeichen, neues Icon", "klein", [rechte.id]);
    H.bs(f2, "neu", "Texte an die App angeglichen, Mikrofon-Sprache wählbar", "klein", [ehrlich.id, mikro.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-31");

    /* Die Seite ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 3.9, 2: 10.2 };

    /* Abstimmung der Beteiligten (Sterne ERFUNDEN): Rollen, keine Namen. */
    var S = WN.bedarf.sterneDazu;
    [[seite, 5, 4, 5, 5], [video, 4, 5, 5, 4], [umbau, 3, 4, 4, 5], [look, 3, 3, 4, 4]].forEach(function (z) {
      S(v, { zeitpunkt: "bedarf", kennung: z[0].id, bereich: "Inhaber", kuerzel: "IN", sterne: z[1], datum: "2026-07-02" });
      S(v, { zeitpunkt: "bedarf", kennung: z[0].id, bereich: "Werbung", kuerzel: "MA1", sterne: z[2], datum: "2026-07-02" });
      S(v, { zeitpunkt: "abnahme", kennung: z[0].id, bereich: "Inhaber", kuerzel: "IN", sterne: z[3], datum: "2026-07-06" });
      S(v, { zeitpunkt: "abnahme", kennung: z[0].id, bereich: "Besucher", kuerzel: "KU", sterne: z[4], datum: "2026-07-06" });
    });
    [[schnell, 4, 5, 5, 5], [ehrlich, 4, 3, 5, 4]].forEach(function (z) {
      S(v, { zeitpunkt: "bedarf", kennung: z[0].id, bereich: "Inhaber", kuerzel: "IN", sterne: z[1], datum: "2026-07-23" });
      S(v, { zeitpunkt: "bedarf", kennung: z[0].id, bereich: "Werbung", kuerzel: "MA1", sterne: z[2], datum: "2026-07-23" });
      S(v, { zeitpunkt: "abnahme", kennung: z[0].id, bereich: "Inhaber", kuerzel: "IN", sterne: z[3], datum: "2026-10-31" });
      S(v, { zeitpunkt: "abnahme", kennung: z[0].id, bereich: "Besucher", kuerzel: "KU", sterne: z[4], datum: "2026-10-31" });
    });
    return v;
  }

  WN.beispiel.registrieren({ id: "mixariumpage", name: { de: "Mein Mixarium – Internetseite (fertige App)", en: "Mein Mixarium – website (finished app)" }, bauen: mixariumpage,
    quelle: "Mein-Mixarium-Page 050c662, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
