/* Beispiel „Perfect Skin Beauty“ — die Internetseite eines Kosmetikstudios, durchgespielt,
   als wäre sie ein Kundenauftrag gewesen. INHALT aus dem Repo Perfect-Skin-Beauty (privat,
   Stand aba5429, gelesen 2026-10-07). KUNDENDATEN ERFUNDEN (.example, kein echter Name).
   Fassungen nach der echten Geschichte:
     F1 Internetseite bis 2026-07-18 (Seite, Sprachen, Preislisten, Buchungsdienst-Verweise)
     F2 Selbst pflegen, Recht und Auffindbarkeit bis 2026-08-09 (Bild-Import, Studio-Modus,
        Pflichtseiten, Suchmaschinen, Karte auf Knopfdruck, Umzug weg von der Agentur)
     F3 Anbindung an das Knotennetz der Geschwister-Apps bis 2026-09-30
   Ist-Stunden: Commit-Zeitstempel (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, vom ersten Commit bis zum Ende der Stufe. Nicht im Repo gefunden und deshalb
   nicht erfunden: Shop, eigene Terminbuchung, Offline-Betrieb. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function psb(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-07-10");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Internetseite für ein Kosmetikstudio";
    v.beispiel = true; v.bid = "psb";
    v.kunde.firma = "Perfect Skin Beauty";
    v.kunde.ansprechpartner = "Erika Beispiel";
    v.kunde.mail = "studio@perfect-skin-beauty.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-07-10";
    H.e(p, 1, "Seite bei einer Agentur, monatlich bezahlt, ohne eigenen Zugriff");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 2, "Termin");
    H.e(p, 3, "Inhaberin", { anzahl: 1 });
    H.e(p, 3, "Kundinnen und Kursinteressierte", { anzahl: 1 });
    H.e(p, 4, "Inhalte lassen sich nur über die Agentur ändern");
    H.e(p, 4, "Die deutsche Fassung der alten Seite war praktisch leer");
    H.e(p, 5, "Seite und Domain gehörten technisch der Agentur");
    var eigen = H.bed(p, "Eine eigene Seite, ohne Agentur-Abo und mit vollem Zugriff", "muss", { text: "keine monatliche Agentur-Gebühr mehr" });
    var sprachen = H.bed(p, "Die Seite in vier Sprachen: Russisch, Deutsch, Englisch, Polnisch", "muss", { text: "mehrsprachige Kundschaft" });
    var preise = H.bed(p, "Leistungen, Preislisten und Kursprogramm zeigen", "muss", {});
    var termin = H.bed(p, "Termine über den Buchungsdienst oder per Telefon", "soll", { h: 2, text: "weniger Rückfragen (Beispielwert)" });
    H.e(p, 7, "Kundinnen finden das Studio, seine Leistungen und den Weg zum Termin in ihrer Sprache");
    H.e(p, 8, "Das System muss jede Sprache unter einer eigenen Adresse zeigen");
    H.e(p, 10, "Handy zuerst");
    H.e(p, 10, "zwei Farbthemen (hell und dunkel)");
    H.e(p, 11, "Buchungsdienst mit Bewertungen");
    var schnittBuch = H.e(p, 12, "Buchung und Bewertungen beim Buchungsdienst");
    H.e(p, 13, "Texte, Bilder, Zertifikate, Preislisten (PDF)");
    H.e(p, 14, "personenbezogene Daten: nein");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "Die Domain zieht ohne Ausfall von der Agentur um");
    H.e(p, 18, "Gutscheine online verkaufen — gewünscht?", { wer: "Inhaberin", bis: "2026-07-20" });
    var u = f.umfang;
    u.kundenStundenwertCent = 4000;
    H.bs(f, "seite", "Internetseite des Studios: Leistungen, Kurse, Zertifikate, Bewertungen, FAQ", "gross", [eigen.id, sprachen.id], { faktoren: ["sprachen"] });
    H.bs(f, "seite", "Preislisten und Kursprogramm", "klein", [preise.id]);
    H.bs(f, "schnitt", "Verweise auf den Buchungsdienst (Termin und Bewertungen)", "klein", [termin.id, schnittBuch.id]);
    H.bs(f, "altdaten", "Umzug von der Agentur (Domain, Inhalte)", "klein", [eigen.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-07-11");

    /* F2 — selbst pflegen, Recht, Auffindbarkeit */
    var f2 = F.neueFassung(v, { anlass: "Die Inhaberin will Bilder und Texte selbst pflegen; Pflichtseiten und Auffindbarkeit", von: "kunde", datum: "2026-07-19" }).fassung;
    var p2 = f2.protokoll;
    var pflege = H.bed(p2, "Texte, Farben und Bilder selbst pflegen, ohne Entwickler", "soll", { h: 3, text: "keine Wartezeit auf Änderungen (Beispielwert)" });
    var recht = H.bed(p2, "Rechtssichere Pflichtseiten (Impressum, Datenschutz)", "muss", {});
    var finden = H.bed(p2, "Im Netz in der Nähe gefunden werden", "soll", { eur: 150, text: "mehr Neukundinnen (Beispielwert)" });
    H.e(p2, 14, "Die Karte lädt erst nach einem Klick (Datenschutz)");
    H.bs(f2, "neu", "Studio-Modus: Texte und Farben in der Seite bearbeiten", "mittel", [pflege.id]);
    H.bs(f2, "datei", "Bild-Import: Bilder tauschen, ausrichten und speichern", "mittel", [pflege.id]);
    H.bs(f2, "seite", "Impressum, Datenschutz, AGB", "klein", [recht.id]);
    H.bs(f2, "seite", "Auffindbarkeit: Suchmaschinen, strukturierte Daten, Ladezeit", "klein", [finden.id]);
    H.bs(f2, "schnitt", "Karte erst auf Knopfdruck", "klein", [finden.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-08-09");

    /* F3 — Netz der Geschwister-Apps */
    var f3 = F.neueFassung(v, { anlass: "Anbindung an das Knotennetz der Geschwister-Apps", von: "betrieb", datum: "2026-08-16" }).fassung;
    var netz = H.bed(f3.protokoll, "Das Studio ist im Netz der Geschwister-Apps zu finden", "kann", {});
    H.bs(f3, "schnitt", "Anbindung an das Knotennetz (Siegel, Andock-Assistent, Erklärseite)", "mittel", [netz.id], { wv: 0.8 });
    F.unterschreiben(v, f3, einst && einst.ust, "2026-09-30");

    v.ist = { 1: 3.5, 2: 18.1, 3: 35.3 };
    return v;
  }

  WN.beispiel.registrieren({ id: "psb", name: { de: "Perfect Skin Beauty (Internetseite)", en: "Perfect Skin Beauty (website)" }, bauen: psb,
    quelle: "Perfect-Skin-Beauty aba5429, gelesen 2026-10-07" });
})(typeof window !== "undefined" ? window : globalThis);
