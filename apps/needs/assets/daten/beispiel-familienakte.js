/* Beispiel „Meine Familienakte“ — die fertige App, durchgespielt, als wäre sie ein Kundenauftrag gewesen
   (Klaus 2026-11-13: „die bereits gebauten Apps als Beispiele“). INHALT aus dem Repo Meine-Familienakte
   (Stand a10e96f, Fassung 2.28.66, gelesen 2026-11-13; Merkmalsliste Datei-Organizer
   rueckwaertstest/familienakte/REFERENZ.json). KUNDENDATEN ERFUNDEN (.example, kein echter Name).
   Fassungen nach der echten Geschichte (lib/fassungen.ts, git log):
     F1 Neuaufbau ohne Server, Android und Windows bis 2026-10-29 (2.28.1–2.28.3)
     F2 Eingang, Scanner, gemeinsamer verschlüsselter Ablageort bis 2026-11-04 (bis 2.28.25)
     F3 Kalender mit Erinnerung, Hilfe, Abgleich zwischen Geräten bis 2026-11-08 (bis 2.28.48)
     F4 Rückmeldungen vom Gerät, E-Mail-Wege, besseres Vorsortieren bis 2026-11-13 (bis 2.28.66)
   Ist-Stunden: Commit-Zeitstempel auf main (Lücke > 90 min = neuer Block, je Block 30 min Vorlauf),
   UNTERGRENZE, nur dieses Repo — die Vorgänger-App (family-project) ist nicht mitgezählt.
   Nicht gebaut und deshalb nicht erfunden: Abgleich über einen fremden Server, eigene iPhone-App,
   Microsoft-Postfach ohne die Freigabe in Entra (gebaut, aber dort noch nicht freigeschaltet). */
(function (g) {
  "use strict";
  var WN = g.WN = g.WN || {};

  function familienakte(nr, einst) {
    var F = WN.fassungen;
    var v = F.neuerVorgang(nr, einst, "2026-10-27");
    var H = WN.beispiel.hilfen(v);
    v.titel = "Familienunterlagen privat auf den eigenen Geräten führen";
    v.beispiel = true; v.bid = "familienakte";
    v.kunde.firma = "Familie Beispiel";
    v.kunde.ansprechpartner = "Sabine Beispiel";
    v.kunde.mail = "familie@akte-beispiel.example";
    var f = v.fassungen[0], p = f.protokoll;
    f.angebot.datum = "2026-10-27";
    H.e(p, 1, "Papier");
    H.e(p, 1, "Ordner im Schrank, Fotos auf dem Handy, Termine im Kopf");
    H.e(p, 1, "eine ältere Web-App, die an einem fremden Server hängt");
    H.e(p, 2, "Dokumente");
    H.e(p, 2, "Termin");
    H.e(p, 3, "Eltern", { anzahl: 2 });
    H.e(p, 3, "Kinder und pflegebedürftige Großmutter (betroffen, nicht selbst Nutzer)", { anzahl: 3 });
    H.e(p, 4, "fehlende Übersicht");
    H.e(p, 4, "Fristen (Versicherung, Arzt, TÜV) werden verpasst");
    H.e(p, 4, "Unterlagen sind beim Arzt oder Amt nicht greifbar");
    H.e(p, 5, "Alles liegt verstreut an verschiedenen Orten und Geräten");
    H.e(p, 5, "Die bisherige App hängt an einem Anbieter und seinem Server");
    var akte = H.bed(p, "Alle Familienunterlagen an einem Ort, nach Lebensbereichen geordnet (Gesundheit, Familie, Wohnen, Fahrzeuge, Käufe und Garantien)", "muss", { h: 4, text: "kein Suchen mehr im Schrank" });
    var privat = H.bed(p, "Die Daten bleiben auf den eigenen Geräten, ohne Konto und ohne fremden Server", "muss", { text: "Gesundheitsdaten verlassen das Haus nicht" });
    var geraete = H.bed(p, "Vor allem am Android-Handy, dazu am Windows-PC und im Browser", "muss", {});
    var sichern = H.bed(p, "Sicherung als Datei und Weg zurück auf ein neues Gerät", "muss", { text: "nichts geht verloren" });
    var fristen = H.bed(p, "Fristen und Termine der Familie im Blick", "soll", { h: 1, text: "keine verpassten Termine" });
    var probe = H.bed(p, "Zum Ausprobieren eine erfundene Beispielfamilie, die sich mit einem Klick entfernen lässt", "kann", {});
    H.e(p, 7, "Jede Unterlage ist in Sekunden gefunden, jede Frist meldet sich rechtzeitig");
    H.e(p, 8, "Das System muss ohne Internet und ohne Anmeldung laufen");
    H.e(p, 8, "Das System muss Unterlagen, Personen, Fristen und Notizen nach Bereichen führen");
    H.e(p, 8, "Das System muss alles als Datei sichern und wieder einlesen können");
    H.e(p, 8, "Das System muss Bereiche führen: Gesundheit & Arbeit (Befunde, Krankmeldungen, Krankenkasse, Arbeitgeber, Anträge, Bescheide), Familie & Personen (Personen, Organisationen, Objekte), Wohnen, Fahrzeuge, Käufe & Garantien, Termine & Aufgaben (Übersicht, Fristen, Kalender, Tagebuch)");
    H.e(p, 8, "Das System muss alle Unterlagen in einer Bibliothek zeigen, als Zeile mit Vorschau, mit Filter und Suche");
    H.e(p, 8, "Das System muss Alltagswörter, Monatsnamen, Datumsangaben und Synonyme in der Suche verstehen");
    H.e(p, 8, "Das System muss Fristen und Aufgaben mit Fälligkeit führen; die Erinnerung gehört zur Aufgabe, Erledigtes lässt sich rückgängig machen");
    H.e(p, 9, "für Familien ohne Technikwissen, Oberfläche und Texte auf Deutsch");
    H.e(p, 9, "Schulung: kurze Erklärungen hinter einem Fragezeichen statt Handbuch");
    H.e(p, 10, "Geräte");
    H.e(p, 10, "offline");
    H.e(p, 11, "ältere Web-App mit Serveranbindung (wird abgelöst)");
    var schnittAlt = H.e(p, 12, "Daten aus der alten App übernehmen");
    H.e(p, 13, "Briefe, Arztbriefe, Rechnungen, Garantiescheine, Fotos, Termine");
    H.e(p, 14, "personenbezogene Daten: ja");
    H.e(p, 14, "Gesundheitsdaten — besonders schutzwürdig");
    H.e(p, 15, "Vorgaben");
    H.e(p, 15, "kein Abo, keine Werbung, kein Zähldienst");
    H.e(p, 18, "Wer außer den Eltern soll mitlesen dürfen?", { wer: "Familie", bis: "2026-11-01" });
    f.umfang.kundenStundenwertCent = 2500;
    H.bs(f, "neu", "Akte nach Lebensbereichen: Unterlagen, Personen, Fristen, Notizen, Suche", "gross", [akte.id, fristen.id], { faktoren: ["offline"] });
    H.bs(f, "datei", "Ablage im Gerät oder in einem gewählten Ordner, Sicherung und Export als Datei", "mittel", [privat.id, sichern.id]);
    H.bs(f, "neu", "Android-App und Windows-App mit Updates vom eigenen Server, dazu die Web-App", "gross", [geraete.id]);
    H.bs(f, "altdaten", "Übernahme aus der alten App", "klein", [schnittAlt.id]);
    H.bs(f, "neu", "Beispielfamilie zum Ausprobieren, per Knopf entfernbar", "klein", [probe.id]);
    F.unterschreiben(v, f, einst && einst.ust, "2026-10-28");

    /* F2 — Eingang, Scanner, gemeinsamer Ablageort */
    var f2 = F.neueFassung(v, { anlass: "Papierpost soll ohne Abtippen in die Akte, die Originale verschlüsselt dort, wo auch die anderen Apps ablegen", von: "kunde", datum: "2026-10-30" }).fassung;
    var p2 = f2.protokoll;
    var eingang = H.bed(p2, "Brief abfotografieren, Text wird gelesen, Einordnung und Frist werden vorgeschlagen, ich bestätige", "muss", { h: 3, text: "kein Abtippen mehr" });
    var tresor = H.bed(p2, "Originale verschlüsselt auf SD-Karte oder Gerätespeicher, mit einem Passwort für alle meine Apps", "soll", {});
    var bedeutung = H.bed(p2, "Suchen mit Alltagswörtern und nach Bedeutung, auf dem Gerät", "soll", { h: 1 });
    H.e(p2, 10, "SD-Karte im Tablet");
    H.e(p2, 8, "Das System muss nichts ohne Bestätigung ablegen; Vorschläge bleiben Vorschläge, mehrere Eingänge lassen sich gesammelt bestätigen");
    H.e(p2, 8, "Das System muss Fristen in eingegangenen Schreiben erkennen und als Termin vorschlagen");
    var schnittApps = H.e(p2, 12, "gemeinsamer Ablageort mit der Buchhaltungs-, PDF- und Mail-App des Haushalts");
    H.bs(f2, "scan", "Eingang: Fotografieren mit Scanner, Text lesen, Einordnung vorschlagen, Stapel", "gross", [eingang.id], { faktoren: ["druck"] });
    H.bs(f2, "schnitt", "Gemeinsamer verschlüsselter Ablageort mit den Schwester-Apps", "mittel", [tresor.id, schnittApps.id]);
    H.bs(f2, "suche", "Private Bedeutungssuche auf dem Gerät", "mittel", [bedeutung.id]);
    F.unterschreiben(v, f2, einst && einst.ust, "2026-11-04");

    /* F3 — Kalender, Hilfe, Abgleich */
    var f3 = F.neueFassung(v, { anlass: "Erinnerungen sollen wirklich melden; mehrere Familiengeräte sollen dieselbe Akte führen, ohne fremden Server", von: "kunde", datum: "2026-11-05" }).fassung;
    var p3 = f3.protokoll;
    var kalender = H.bed(p3, "Eigener Kalender mit Erinnerungston, auch bei geschlossener App", "muss", { h: 1 });
    var abgleich = H.bed(p3, "Zwei Handys und der PC führen dieselbe Akte (Festplatte, eigenes Netz oder Paket)", "soll", { h: 2 });
    var vollsich = H.bed(p3, "Verschlüsselte Vollsicherung mit Notfallblatt, Erinnerung wenn lange nicht gesichert", "muss", {});
    var hilfe = H.bed(p3, "Hilfe als Bilder und eine Landkarte der App", "kann", {});
    H.e(p3, 12, "Google- und Microsoft-Kalender in beide Richtungen");
    H.e(p3, 18, "Welche Geräte gehören zur Familie?", { wer: "Familie", bis: "2026-11-10" });
    H.bs(f3, "neu", "Kalender mit Erinnerung und Android-Benachrichtigung, Abgleich mit Google/Microsoft", "mittel", [kalender.id]);
    H.bs(f3, "datei", "Abgleich zwischen Geräten ohne fremden Server, verschlüsselte Vollsicherung", "gross", [abgleich.id, vollsich.id], { faktoren: ["nutzer"] });
    H.bs(f3, "seite", "Hilfe-Themen als Bild, Landkarte der App", "klein", [hilfe.id]);
    F.unterschreiben(v, f3, einst && einst.ust, "2026-11-08");

    /* F4 — Rückmeldungen vom Gerät, E-Mail, Vorsortieren */
    var f4 = F.neueFassung(v, { anlass: "Der Gerätetest zeigte Bedienhürden; E-Mails und Cloud-Ordner sollen direkt in die Akte, der Eingang soll besser vorsortieren", von: "kunde", datum: "2026-11-09" }).fassung;
    var p4 = f4.protokoll;
    var tagebuch = H.bed(p4, "Tagebuch mit Stimmung und Person, Briefe mit Hilfe einer KI beantworten, ohne dass Namen hinausgehen", "kann", {});
    var mail = H.bed(p4, "E-Mails mit Anhängen und Cloud-Ordner hereinholen, Sicherung an einem zweiten Ort", "soll", { h: 1 });
    var sortieren = H.bed(p4, "Der Eingang schlägt Bereich und Frist aus dem gelesenen Text zuverlässiger vor", "soll", { h: 1 });
    var bedienung = H.bed(p4, "Papierkorb mit Zurückholen, Schriftgröße, Tooltips, Geräte benennen", "soll", {});
    H.e(p4, 18, "Rechte für das Microsoft-Postfach freischalten", { wer: "Familie", bis: "2026-11-20" });
    H.e(p4, 8, "Das System muss persönliche Angaben verdecken, bevor ein Text an eine KI geht, und sie in der Antwort auf dem Gerät wieder einsetzen");
    H.e(p4, 8, "Das System muss Antworten nur als Entwurf erstellen und nie selbst verschicken");
    H.bs(f4, "kipruef", "Tagebuch und Briefantwort über die eigene KI mit verdeckten Angaben", "mittel", [tagebuch.id], { faktoren: ["ki"] });
    H.bs(f4, "schnitt", "E-Mail-Wege, Cloud-Ordner, zweiter Sicherungsort", "gross", [mail.id]);
    H.bs(f4, "suche", "Vorschlag für Bereich und Frist aus dem Text (Sortier-Kern)", "mittel", [sortieren.id], { wv: 0.7 });
    H.bs(f4, "neu", "Rückmeldungen vom Gerät: Papierkorb, Schriftgröße, Tooltips, Meine Geräte", "mittel", [bedienung.id]);
    F.unterschreiben(v, f4, einst && einst.ust, "2026-11-13");

    /* Die App ist fertig gebaut: alles beauftragt, keine Grenzlinie (wie Tomys Hub gesamt). */
    v.fassungen.forEach(function (fx) { fx.umfang.grenzeManuell = "keine"; });
    /* Abstimmung der Mitarbeiter (erfunden, nur Rollenkürzel, keine Namen). */
    [["bedarf", akte.id, "Familie", "IN", 5],
     ["bedarf", akte.id, "Familie", "FA", 4],
     ["abnahme", akte.id, "Familie", "IN", 5],
     ["abnahme", akte.id, "Familie", "FA", 4],
     ["bedarf", privat.id, "Familie", "IN", 5],
     ["abnahme", privat.id, "Familie", "IN", 5],
     ["bedarf", fristen.id, "Familie", "FA", 4],
     ["abnahme", fristen.id, "Familie", "FA", 3],
     ["bedarf", sichern.id, "Familie", "IN", 4],
     ["abnahme", sichern.id, "Familie", "IN", 4]
    ].forEach(function (s) { WN.bedarf.sterneDazu(v, { zeitpunkt: s[0], kennung: s[1], bereich: s[2], kuerzel: s[3], sterne: s[4], datum: s[0] === "bedarf" ? "2026-10-27" : "2026-11-13" }); });
    v.ist = { 1: 11.3, 2: 61.8, 3: 96.0, 4: 142.3 };
    return v;
  }

  WN.beispiel.registrieren({ id: "familienakte", name: { de: "Meine Familienakte (fertige App)", en: "Meine Familienakte (finished app)" }, bauen: familienakte,
    quelle: "Meine-Familienakte a10e96f, gelesen 2026-11-13" });
})(typeof window !== "undefined" ? window : globalThis);
