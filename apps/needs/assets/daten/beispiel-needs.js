/* Beispiel „Workflow Needs (Bedarfsanalyse)“ — die App über sich selbst, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus diesem Repo Workflow-Needs
   (Stand a5e561f, gelesen 2026-11-13; CLAUDE.md, git log origin/main). KUNDENDATEN ERFUNDEN (.example, kein echter Name).
   Fassungen nach der echten Geschichte (git log):
     F1 Bedarfsprotokoll, Schätzung, Fassungen, Angebot; Sicherung, Anhänge, Übergabe an WorkFloh; Rechtsblätter, Sterne bis 2026-10-07
     F2 Beispiele in „Vorgänge“, Ansicht der Anhänge, Chips erklären sich mit Preiswirkung, Kopfzeile nennt den Auftrag bis 2026-10-08
     F3 SBKIM-Knoten mit Netz-Einstellung, Prüfliste vor dem KI-Richter, Installieren-Knopf, Übergabe an BookLedgerPro bis 2026-10-31
     F4 fertige Apps als Beispiele, Rückwärtstest, Bauauftrag verdeckt Namensteile und nennt die Zuschläge bis 2026-11-13
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — Sage-Module, Modul 25 und die übernommenen Prüfer sind nicht mitgezählt.
   Sterne der Mitarbeiter ERFUNDEN (Rollenkürzel, keine Personen).
   Nicht gebaut und deshalb nicht erfunden: Mindestpreis je Auftrag (Klaus: „nicht jetzt“), Angebot als PDF in der
   Übergabe, Bedienungssperre in der Kunden-App (nur vereinbart), Versand von Mails durch die App. */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function needs(nr, einst) {
    var F = WN.fassungen, BD = WN.bedarf;
    var v = F.neuerVorgang(nr, einst, "2026-10-07");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Bedarf erfassen, Umfang schätzen und Angebot erstellen für Software-Aufträge";
    v.beispiel = true; v.bid = "needs";
    v.kunde.firma = "Softwarewerkstatt Beispiel";
    v.kunde.ansprechpartner = "Jana Beispiel";
    v.kunde.mail = "auftrag@werkstatt-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-10-07";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Gesprächsnotizen im Notizbuch, Preise im Kopf, Angebote als Textdatei");
    H.e(p, 2, "Kundenkontakt");
    H.e(p, 2, "Angebot");
    H.e(p, 3, "Inhaber (führt das Gespräch, schreibt das Angebot)", { anzahl: 1 });
    H.e(p, 3, "Mitarbeiter im Bau", { anzahl: 2 });
    H.e(p, 3, "Buchhaltung", { anzahl: 1 });
    H.e(p, 4, "Angebote dauern zu lange und sind schwer nachzuvollziehen");
    H.e(p, 4, "Änderungswünsche während des Baus sind nirgends sauber festgehalten");
    H.e(p, 5, "Bedarf und Lösung werden im Gespräch vermischt, der Kunde unterschreibt einen Preis ohne Begründung");
    var bedarf = H.bed(p, "Den Bedarf des Kunden lösungsneutral in festen Bereichen erfassen, ohne Preis", "muss", { h: 3, text: "nichts geht im Gespräch verloren" });
    var schaetzung = H.bed(p, "Den Umfang aus Bausteinen schätzen, mit Stunden, Preis und Kosten-Nutzen", "muss", { h: 4, text: "Angebot in einer Stunde statt einem Tag" });
    var angebot = H.bed(p, "Angebot mit Positionen und zwei Unterschriften, ohne interne Sätze", "muss", { h: 2 });
    var fassungen = H.bed(p, "Jede Änderung als neue Fassung mit Vergleich und Nachtrag zum Unterschreiben", "muss", { h: 2, text: "keine Streitfragen mehr" });
    var bauauftrag = H.bed(p, "Bauauftrag für die nächste Bausitzung, ohne Kundendaten (Platzhalter)", "muss", { h: 2 });
    var sichern = H.bed(p, "Alles bleibt auf dem Gerät und lässt sich verschlüsselt sichern", "muss", { text: "Kundendaten verlassen das Haus nicht" });
    var anhaenge = H.bed(p, "Anhänge am Vorgang (PDF, E-Mail, Bildschirmfoto)", "soll", { h: 1 });
    var weiter = H.bed(p, "Den Auftrag an die Auftragsverwaltung übergeben", "soll", { h: 1 });
    var recht = H.bed(p, "Verschwiegenheitserklärung, Vereinbarung zu Zahlung und Rechten, Wartungsvertrag", "soll", {});
    var sterne = H.bed(p, "Mitarbeiter bewerten die Bedarfe mit Sternen, beim Bedarf und bei der Abnahme", "kann", {});
    H.e(p, 7, "Ein Angebot entsteht in einer Stunde, jede Zahl lässt sich auf einen Bedarf zurückführen");
    H.e(p, 8, "Das System muss als installierbare Web-App im Browser laufen, ohne Build-Schritt und nach dem ersten Besuch ohne Internet");
    H.e(p, 8, "Das System muss den Bedarf in 18 festen Bereichen erfassen, mit Kennungen B-nn/O-nn, die nie neu vergeben werden");
    H.e(p, 8, "Das System muss aus Katalog-Bausteinen (Größe, Faktoren, Wiederverwendung) Stunden und Preis schätzen und eine Grenzlinie nach Kosten-Nutzen ziehen");
    H.e(p, 8, "Das System muss drei getrennte Ausdrucke liefern: Bedarfsprotokoll für den Kunden ohne Preis, Bedarfsanalyse intern, Angebot ohne Stundensatz");
    H.e(p, 8, "Das System muss beim Unterschreiben Satz und Umsatzsteuer einer Fassung einfrieren; Änderungen entstehen nur als neue Fassung");
    H.e(p, 8, "Das System muss den Stundensatz nie hinausgeben, mit einer einzigen Ausnahme: dem Wartungsvertrag");
    H.e(p, 8, "Das System muss einen Bauauftrag als Text erzeugen, in dem Kundendaten durch Platzhalter ersetzt sind, und ihn nach Rückkehr wieder aufdecken");
    H.e(p, 8, "Das System muss alle Daten im Browser des Geräts halten und eine verschlüsselte Sicherung schreiben, die beim Zurückholen nur ergänzt, nie überschreibt");
    H.e(p, 8, "Das System muss nichts selbst verschicken: Mail nur über das Mailprogramm, Übergabe nur als Datei");
    H.e(p, 9, "für den Inhaber am Tablet und am PC, Deutsch und Englisch");
    H.e(p, 10, "Tablet");
    H.e(p, 10, "offline");
    H.e(p, 11, "Textverarbeitung für Angebote (wird abgelöst)");
    var schnittWf = H.e(p, 12, "Auftragsverwaltung (WorkFloh) liest die Übergabedatei");
    H.e(p, 13, "Gesprächsnotizen, Angebote, Verträge, E-Mails und PDFs des Kunden");
    H.e(p, 14, "personenbezogene Daten: ja (Kundenkontakte)");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "kein Server, kein Konto, kein Zähldienst; Rechtstexte sind Entwürfe, kein Rechtsrat");
    H.e(p, 16, "Eigene Aufträge: Schätzung gegen Ist-Stunden vergleichen");
    H.e(p, 18, "Welche Faktoren gelten für Offline und KI?", { wer: "Inhaber", bis: "2026-10-08" });
    f.umfang.kundenStundenwertCent = 6000;
    H.bs(f, "neu", "Bedarfsprotokoll mit 18 Bereichen, Kennungen und Ausdrucken (Kunde / intern)", "gross", [bedarf.id], { faktoren: ["offline", "druck"] });
    H.bs(f, "neu", "Schätzung aus Bausteinen, Satz-Ebenen, USt, Kosten-Nutzen und Grenzlinie", "gross", [schaetzung.id]);
    H.bs(f, "rechnung", "Angebot mit Positionen, Unterschriften, Fassungen, Vergleich und Nachtrag", "mittel", [angebot.id, fassungen.id], { faktoren: ["druck"] });
    H.bs(f, "kipruef", "Bauauftrag mit Platzhaltern (Modul 25) und Aufdecken", "mittel", [bauauftrag.id]);
    H.bs(f, "datei", "Verschlüsselte Sicherung, Anhänge am Vorgang", "mittel", [sichern.id, anhaenge.id]);
    H.bs(f, "auftrag", "Übergabe als Auftragsdatei an WorkFloh", "klein", [weiter.id, schnittWf.id]);
    H.bs(f, "neu", "Erklärung, Vereinbarung und Wartungsvertrag mit Unterschriftsfeld; Sterne der Mitarbeiter", "mittel", [recht.id, sterne.id], { faktoren: ["druck"] });
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-07");

    /* F2 — Beispiele, Ansicht, Erklären an Ort und Stelle */
    var f2 = F.neueFassung(v, { anlass: "Im Sichttest am Tablet: Kennungen und Faktoren sollen sich erklären, Anhänge groß ansehen, Muster-Vorgänge gleich in „Vorgänge“", von: "kunde", datum: "2026-10-08" }).fassung;
    var p2 = f2.protokoll;
    var erklaeren = H.bed(p2, "Jeder Chip am Baustein erklärt sich und zeigt vorher, wie sich der Preis ändert, mit Zurück", "muss", { h: 1, text: "keine Überraschung im Angebot" });
    var ansicht = H.bed(p2, "Anhänge mit einem Tipp groß ansehen: Bilder, PDFs ganz, E-Mails mit Text und Anhängen", "soll", {});
    var beispiele = H.bed(p2, "Fertige Muster-Vorgänge zum Ausprobieren, gleich neben „Neuer Vorgang“", "kann", {});
    H.e(p2, 8, "Das System muss in einer unterschriebenen Fassung nur erklären und mit einem Tipp eine neue offene Fassung anlegen");
    H.e(p2, 8, "Das System muss in der Kopfzeile Kunde, Fassung und Titel des offenen Vorgangs nennen");
    H.bs(f2, "neu", "Erklär-Feld an jedem Chip mit vorgerechneter Preiswirkung, Zurück-Stände, neue Fassung im Banner", "mittel", [erklaeren.id]);
    H.bs(f2, "dateipruef", "Ansicht der Anhänge (Bild, PDF, E-Mail), nichts wird ausgeführt", "mittel", [ansicht.id]);
    H.bs(f2, "neu", "Muster-Vorgänge aus eigenen Aufträgen mit Ist-Stunden", "klein", [beispiele.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-10-08");

    /* F3 — Netz, Sicherheit, Installieren, Buchhaltung */
    var f3 = F.neueFassung(v, { anlass: "Die App soll im eigenen Firmennetz gefunden werden, sich installieren lassen und Angebote an die Buchhaltung geben", von: "kunde", datum: "2026-10-13" }).fassung;
    var p3 = f3.protokoll;
    var netz = H.bed(p3, "Die App ist ein Knoten im eigenen Netz mit Siegel und Lampen, ohne beim Laden etwas zu senden", "soll", {});
    var blp = H.bed(p3, "Angebot mit einem Tipp an die Buchhaltung übergeben", "muss", { h: 1, text: "kein Abtippen der Positionen" });
    var install = H.bed(p3, "Installieren-Knopf in den Einstellungen, verschwindet als installierte App", "kann", {});
    H.e(p3, 8, "Das System muss Antworten fremder Knoten vor einer KI auf Anweisungen prüfen und sie sonst ausschließen");
    H.e(p3, 8, "Das System muss an die Buchhaltung nur Positionen mit Netto und Steuersatz geben, nie Stunden oder Stundensatz");
    var schnittBlp = H.e(p3, 12, "Buchhaltung (BookLedgerPro) übernimmt das Angebot im Datenvertrag v1");
    H.bs(f3, "pinnwand", "SBKIM-Knoten: Lampen, Siegel, Mycel mit Netz-Einstellung, Prüfliste vor dem Richter", "mittel", [netz.id], { faktoren: ["nutzer"] });
    H.bs(f3, "rechnung", "Übergabe des Angebots an BookLedgerPro", "klein", [blp.id, schnittBlp.id]);
    H.bs(f3, "seite", "Installieren-Knopf und Manifest-Kennung", "klein", [install.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-10-31");

    /* F4 — fertige Apps als Beispiele, Rückwärtstest */
    var f4 = F.neueFassung(v, { anlass: "Die schon gebauten Apps sollen als Muster dienen; der Bauauftrag muss sich rückwärts an fertigen Apps bewähren", von: "betrieb", datum: "2026-11-13" }).fassung;
    var p4 = f4.protokoll;
    var fertig = H.bed(p4, "Fertige Apps als Muster-Vorgänge mit echten Fassungen und Ist-Stunden", "soll", { h: 1 });
    var verdeckt = H.bed(p4, "Der Bauauftrag verdeckt auch Namensteile des Ansprechpartners und nennt die Zuschläge der Summe", "muss", { text: "kein Vorname im Klartext" });
    H.e(p4, 8, "Das System muss für jeden Muss-Bedarf einen Baustein nachweisen und keinen Baustein auf einen fehlenden Bedarf zeigen lassen");
    H.bs(f4, "neu", "Vier fertige Apps als Muster-Vorgänge, Schlüssigkeitsprobe", "mittel", [fertig.id]);
    H.bs(f4, "kipruef", "Bauauftrag: Namensteile verdecken, Summe mit Zuschlägen", "klein", [verdeckt.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-11-13");

    /* Abstimmung der Mitarbeiter (Sterne erfunden, Kürzel sind Rollen) */
    function st(k, bereich, kz, n, zp, d) { BD.sterneDazu(v, { zeitpunkt: zp, kennung: k, bereich: bereich, kuerzel: kz, sterne: n, datum: d }); }
    st(schaetzung.id, "Leitung", "IN", 5, "bedarf", "2026-10-07"); st(schaetzung.id, "Bau", "MA1", 4, "bedarf", "2026-10-07"); st(schaetzung.id, "Buchhaltung", "BH", 4, "bedarf", "2026-10-07");
    st(schaetzung.id, "Leitung", "IN", 5, "abnahme", "2026-11-13"); st(schaetzung.id, "Bau", "MA1", 4, "abnahme", "2026-11-13");
    st(fassungen.id, "Leitung", "IN", 5, "bedarf", "2026-10-07"); st(fassungen.id, "Bau", "MA2", 4, "bedarf", "2026-10-07");
    st(fassungen.id, "Leitung", "IN", 5, "abnahme", "2026-11-13"); st(fassungen.id, "Bau", "MA2", 5, "abnahme", "2026-11-13"); st(fassungen.id, "Kunde", "KU", 4, "abnahme", "2026-11-13");
    st(bauauftrag.id, "Bau", "MA1", 5, "bedarf", "2026-10-07"); st(bauauftrag.id, "Bau", "MA2", 4, "bedarf", "2026-10-07");
    st(bauauftrag.id, "Bau", "MA1", 5, "abnahme", "2026-11-13"); st(bauauftrag.id, "Bau", "MA2", 5, "abnahme", "2026-11-13");
    st(angebot.id, "Leitung", "IN", 4, "bedarf", "2026-10-07"); st(angebot.id, "Buchhaltung", "BH", 3, "bedarf", "2026-10-07");
    st(angebot.id, "Leitung", "IN", 4, "abnahme", "2026-11-13"); st(angebot.id, "Kunde", "KU", 4, "abnahme", "2026-11-13");
    st(sterne.id, "Bau", "MA1", 2, "bedarf", "2026-10-07"); st(sterne.id, "Leitung", "IN", 3, "bedarf", "2026-10-07");
    st(sterne.id, "Bau", "MA1", 3, "abnahme", "2026-11-13"); st(sterne.id, "Leitung", "IN", 3, "abnahme", "2026-11-13");

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie. */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    v.ist = { 1: 5.7, 2: 9.0, 3: 19.7, 4: 20.4 };
    return v;
  }

  WN.beispiel.registrieren({ id: "needs", name: { de: "Workflow Needs (Bedarfsanalyse) (fertige App)", en: "Workflow Needs (Bedarfsanalyse) (finished app)" }, bauen: needs,
    quelle: "Workflow-Needs a5e561f, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
