/* Beispiel „Alis Moderaum“ — Boutique mit Schaufenster, Warenwirtschaft und Ladenkasse,
   durchgespielt, als wäre die App ein Kundenauftrag gewesen. Aus dieser Geschichte ist der
   Testfall „Boutique“ erfunden; „Boutique“ bleibt daneben (die Proben brauchen ihn).
   INHALT aus dem Repo Alis-Moderaum (privat, Stand 3563d45, gelesen 2026-10-07).
   KUNDENDATEN ERFUNDEN (.example, kein echter Name).
   Fassungen nach der echten Geschichte:
     F1 Schaufenster UND Warenwirtschaft bis 2026-07-16 — beide im selben ersten Commit
        angelegt; der Vorschlag „F1 Schaufenster · F2 + Lager“ aus dem Brief trug nicht
     F2 Pflege, Medien, KI bis 2026-07-25
     F3 Ladenkasse und Übergabe an die Buchhaltung bis 2026-07-27
     F4 (offen) mehrere Geräte, ein Bestand — im Repo nur geplant, deshalb NOCH NICHT GESCHÄTZT
   Ist-Stunden: Commit-Zeitstempel (Lücke > 90 min = neuer Block, 30 min Vorlauf), UNTERGRENZE.
   F1 zeigt nur 1,5 h, weil der Grundstock in einem einzigen Commit kam — die Arbeit davor
   hinterließ keine Zeitstempel. Das steht so da, statt geschönt zu werden. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function alis(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-07-15");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Boutique: Schaufenster, Warenwirtschaft und Ladenkasse";
    v.beispiel = true; v.bid = "alis";
    v.kunde.firma = "Alis Moderaum";
    v.kunde.ansprechpartner = "Anna Beispiel";
    v.kunde.mail = "laden@alis-moderaum.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-07-15";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Bestand im Kopf und auf Zetteln");
    H.e(p, 2, "Lager");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 3, "Inhaberin", { anzahl: 1 });
    H.e(p, 3, "Kundinnen im Netz und im Laden", { anzahl: 1 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Was online verkauft wird, fehlt im Laden — und umgekehrt");
    H.e(p, 5, "Shop und Laden führen keinen gemeinsamen Bestand");
    var shop = H.bed(p, "Ein Online-Schaufenster, das die Inhaberin selbst pflegt", "muss", { eur: 300, text: "mehr Verkäufe (Beispielwert)" });
    var bestand = H.bed(p, "Ein Bestand für Online-Shop und Laden", "muss", { h: 6, text: "kein Doppelverkauf (Beispielwert)" });
    var russ = H.bed(p, "Bedienung auch auf Russisch", "muss", {});
    H.e(p, 7, "Jeder Artikel steht einmal im Lager und erscheint richtig im Shop");
    H.e(p, 8, "Das System muss Wareneingang, Warenausgang und Retouren buchen");
    H.e(p, 9, "Gebrauchsanleitung für die Inhaberin");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "Laptop und Handy");
    H.e(p, 10, "Shop in vier Sprachen (DE, EN, RU, ES)");
    H.e(p, 13, "Artikel, Bestand, Bewegungen, Bilder und Videos");
    H.e(p, 14, "personenbezogene Daten: nein");
    H.e(p, 15, "Kein Server, keine laufenden Kosten");
    p.bereiche[4].notiz = "Beispiel: Die Inhaberin pflegt lieber selbst, als zu warten.";
    var u = f.umfang;
    u.kundenStundenwertCent = 3000;
    H.bs(f, "shop", "Schaufenster mit Warenkorb, Galerie und Video", "mittel", [shop.id], { faktoren: ["sprachen"] });
    H.bs(f, "lager", "Warenwirtschaft: Eingang, Ausgang, Stammdaten, Journal", "gross", [bestand.id, russ.id], { faktoren: ["offline", "sprachen"] });
    H.bs(f, "seite", "Impressum, Versand, AGB", "klein", []);
    F.unterschreiben(v, f, einst && einst.ust, "2026-07-16");

    /* F2 — Pflege, Medien, KI */
    var f2 = F.neueFassung(v, { anlass: "Die Inhaberin will Bilder, Texte und Kategorien selbst pflegen; Produktfotos mit KI", von: "kunde", datum: "2026-07-17" }).fassung;
    var p2 = f2.protokoll;
    var pflege = H.bed(p2, "Bilder, Texte und Kategorien in der Seite selbst ändern", "soll", { h: 3 });
    var fotos = H.bed(p2, "Produktfotos mit KI erzeugen", "kann", { h: 2, text: "Beispielwert" });
    var scan = H.bed(p2, "Artikel per Barcode finden (freiwillig)", "kann", {});
    var backup = H.bed(p2, "Eine Sicherung aller Eingaben, mit Erinnerung", "muss", {});
    H.bs(f2, "datei", "Bild-Import und Texte im Studio-Modus", "mittel", [pflege.id]);
    H.bs(f2, "neu", "KI-Produktfotos und Prompt-Generator", "mittel", [fotos.id], { faktoren: ["ki"] });
    H.bs(f2, "neu", "Barcode-Scan (freiwillig)", "klein", [scan.id]);
    H.bs(f2, "datei", "Sicherung (Backup-Tresor)", "klein", [backup.id]);
    H.bs(f2, "seite", "Gebrauchsanleitung Deutsch und Russisch", "klein", [russ.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-07-25");

    /* F3 — Kasse und Buchhaltung */
    var f3 = F.neueFassung(v, { anlass: "Kasse im Laden; Summen an die Buchhaltung", von: "kunde", datum: "2026-07-26" }).fassung;
    var p3 = f3.protokoll;
    var kasse = H.bed(p3, "Verkäufe im Laden kassieren und vom Bestand abziehen", "muss", { h: 4 });
    var buch = H.bed(p3, "Summen ohne Abtippen an die Buchhaltung übergeben", "soll", { h: 2 });
    H.e(p3, 11, "BookLedgerPro (Buchhaltung)");
    var sBuch = H.e(p3, 12, "Summen eines Zeitraums an BookLedgerPro");
    H.bs(f3, "rechnung", "Ladenkasse mit Freiverkauf und Kartenzahlung", "mittel", [kasse.id], { faktoren: ["offline"] });
    H.bs(f3, "schnitt", "Summen an BookLedgerPro übergeben", "klein", [buch.id, sBuch.id]);
    H.bs(f3, "schnitt", "Shop veröffentlichen (freigegebene Artikel)", "klein", [shop.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-07-27");

    /* F4 — offen: mehrere Geräte, ein Bestand */
    var f4 = F.neueFassung(v, { anlass: "Mehrere Geräte sollen denselben Bestand sehen", von: "kunde", datum: "2026-08-09" }).fassung;
    var p4 = f4.protokoll;
    var geraete = H.bed(p4, "Laptop und Handy sehen denselben Bestand", "muss", { h: 2 });
    H.e(p4, 10, "mehrere Standorte");
    H.e(p4, 18, "Eigene Domain statt der github.io-Adresse?", { wer: "Inhaberin", bis: "2026-08-23" });
    H.bs(f4, "neu", "Offline-Betrieb und Sicherungs-Erinnerung", "klein", [backup.id]);
    H.bs(f4, null, "Gemeinsamer Bestand über mehrere Geräte", null, [geraete.id]);

    v.ist = { 1: 1.5, 2: 16.0, 3: 18.9 };
    return v;
  }

  WN.beispiel.registrieren({ id: "alis", name: { de: "Alis Moderaum (Boutique mit Lager und Kasse)", en: "Alis Moderaum (boutique with stock and till)" }, bauen: alis,
    quelle: "Alis-Moderaum 3563d45, gelesen 2026-10-07" });
})(typeof window !== "undefined" ? window : globalThis);
