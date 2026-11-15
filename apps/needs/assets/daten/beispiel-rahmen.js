/* Rahmen für die Beispiele aus den fertigen Apps (Klaus 2026-11-14: „die Beispiele … aus meinen gebauten Apps testen“).
   Seit Rahmen 1/2 (Klaus 2026-11-13) fragt Needs Geräte, Abgleich, ohne Internet, eigene Programme, Datenort, Sicherung,
   Ort der KI, „Nicht gewünscht“ und „schlägt vor / macht es selbst“. Die Angaben hier stehen so in den CLAUDE.md der Repos
   (gelesen 2026-11-14), nicht geraten; Budget nur dort, wo ein Beispiel den Hinweis „über dem Budget“ zeigen soll (erfunden).
   Lädt NACH allen beispiel-*.js. */
(function (g) {
  "use strict";
  var WN = g.WN; if (!WN || !WN.beispiel || !WN.beispiel.rahmenSetzen) return;
  var setze = WN.beispiel.rahmenSetzen;
  var pro = { offline: "immer", eigene: ["ablageort", "hinher", "suche"], datenort: ["geraet", "ordner"], ki: "wahl" };
  function m(a, b) { return Object.assign({}, a, b); }

  setze("familienakte", {
    rahmen: m(pro, { geraete: ["android", "tablet", "windows", "browser"], abgleich: "abundzu", datenort: ["geraet", "ordner", "cloud"],
      sicherung: ["verschluesselt", "zweiterort", "allein"],
      eigeneText: "Gemeinsamer Pro-Tresor mit BookLedgerPro, Workflow PDF Pro und Private Brain Pro; Kalender von Google und Microsoft" }),
    nicht: ["Nichts wird ohne Bestätigung in die Akte abgelegt", "Mails werden nur als Entwurf vorbereitet, nie selbst versendet",
      "Keine Nutzungsdaten an den Hersteller"],
    handeln: [["Frist|Termin|Erinner", "vorschlagen"], ["Sicherung", "selbst"], ["einordn|zuordn|sortier", "vorschlagen"]],
  });
  setze("bookledgerpro", {
    rahmen: m(pro, { geraete: ["android", "windows", "browser"], abgleich: "eins", sicherung: ["verschluesselt", "zweiterort", "allein"],
      eigeneText: "Belege aus Workflow PDF Pro und Mails aus Private Brain Pro; Angebote aus Workflow Calculate und Needs" }),
    nicht: ["Keine Registrierkasse mit TSE", "Kein Kassengerät — die offene Ladenkasse wird nur als Kassenbuch mit Tagesabschluss geführt", "Keine Buchung ohne Bestätigung"],
    handeln: [["Konto|buch|Beleg", "vorschlagen"], ["Sicherung", "selbst"]],
  });
  setze("workflowpdfpro", {
    muss: [
      "Das System muss eine Bibliothek mit Ordnern haben, in der Dokumente abgelegt, verschoben, als Vorlage dupliziert und gelöscht werden",
      "Das System muss einen Formular-Editor haben, in dem Felder gesetzt, verschoben, vergrößert und auf der Seite ausgefüllt werden",
      "Das System muss PDF und Bilder einlesen, auch ganze Ordner, per Ziehen auf die Seite oder als angehängte Seiten",
      "Das System muss Fotos in PDF wandeln: Blatt finden, Ecken mit Lupe korrigieren, entzerren, auf A4 oder US Letter gerade ziehen",
      "Das System muss vorhandene Formularfelder samt Wert übernehmen und neue Felder ohne Netz aus Linien, Rahmen und Kästchen erkennen",
      "Das System muss als festes PDF, als ausfüllbares PDF und als leere Vorlage ausgeben sowie ansehen und drucken",
      "Das System muss PDFs zwischen Deutsch, Russisch und Englisch übersetzen, Seite für Seite in der Lage des Originals",
      "Das System muss die Hauptablage als verschlüsselten Tresor in einem selbst gewählten Ordner führen (Gerätespeicher, SD-Karte, anderer Datenträger)",
      "Das System muss Tresor und Sicherungen mit Passwort verschlüsseln (PBKDF2-SHA256 mit 600 000 Runden, AES-256-GCM); das Passwort bleibt nur im Arbeitsspeicher",
    ],
    rahmen: m(pro, { geraete: ["android", "windows", "browser"], abgleich: "eins", sicherung: ["verschluesselt", "selbst"],
      eigeneText: "Scanner-Direktstart aus BookLedgerPro; gemeinsamer Tresorordner der Pro-Apps" }),
    nicht: ["Prüfen und Einordnen starten nie von selbst", "Kein Hochladen von Dokumenten an fremde Dienste ohne Bestätigung"],
    handeln: [["prüf|einordn|beschreib", "vorschlagen"]],
  });
  setze("privatebrainpro", {
    rahmen: m(pro, { geraete: ["android", "windows", "browser"], abgleich: "eins", sicherung: ["verschluesselt", "selbst"],
      eigeneText: "Mails an die Familienakte und an BookLedgerPro teilen; eigenes Postfach über IMAP/SMTP" }),
    nicht: ["Originale werden nie verändert oder verschoben", "Keine Mail geht ohne Tipp hinaus"],
    handeln: [["aufräum|Newsletter|abmeld", "vorschlagen"], ["Sicherung", "selbst"]],
  });
  setze("proverbund", {
    rahmen: m(pro, { geraete: ["android", "tablet", "windows", "browser"], abgleich: "abundzu", datenort: ["geraet", "ordner"],
      sicherung: ["verschluesselt", "zweiterort", "selbst", "allein"],
      eigeneText: "Ein Tresor und ein Passwort für alle vier Apps; Dateien gehen zwischen den Apps hin und her" }),
    nicht: ["Nichts wird ohne Bestätigung abgelegt oder gebucht", "Keine Mail geht ohne Tipp hinaus", "Keine Nutzungsdaten an den Hersteller"],
    handeln: [["Frist|Termin|Konto|buch|prüf|einordn", "vorschlagen"], ["Sicherung", "selbst"]],
  });
  setze("rezeptbuch", {
    muss: [
      "Das System muss fünf Hauptbereiche in der unteren Leiste haben: Rezepte, Menü, Ordner, Tresor, Einstellungen",
      "Das System muss Rezepte in Kategorien für Speisen (Vorspeisen, Suppen, Fleisch, Fisch, Vegetarisch, Kuchen, Desserts) und für Getränke ordnen",
      "Das System muss je Rezept Name, Bild, Zutaten mit Mengen und Einheiten, Arbeitsschritte, Portionen, Zubereitungszeit und Geschmacks-Merkmale führen",
      "Das System muss einen Wochen-Menüplaner haben, in dem Rezepte auf Tage und Gänge gelegt werden, auch über mehrere Wochen",
      "Das System muss aus dem Menüplan eine Einkaufsliste nach Kategorien mit Sammelliste zum Abhaken machen",
      "Das System muss ein Rezept über eine Internetadresse laden, die Rezeptdaten der Seite lesen und das Bild übernehmen; KI nur als Rückfall",
      "Das System muss einzelne Rezepte drucken und das ganze Buch als PDF, als E-Book (EPUB) und als Blätterbuch (HTML) ausgeben",
      "Das System muss alles im Browser speichern und dauerhaften Speicher anfordern",
      "Das System muss den ganzen Bestand als Datei sichern und laden; beim Laden wählt man Ersetzen oder Hinzufügen, Doppelte werden erkannt",
      "Das System muss in einem Tresor auf dem Gerät von selbst Sicherungsstände anlegen und das Zurückholen erlauben",
      "Das System muss für KI wahlweise Claude, Mistral (EU, auch Texterkennung) und für Bilder OpenAI nutzen, jeweils mit eigenem Schlüssel",
    ],
    rahmen: { geraete: ["android", "iphone", "tablet", "browser"], offline: "immer", abgleich: "eins", eigene: ["hinher"],
      eigeneText: "Rezepte zwischen Mein Rezeptbuch, Muttis Rezeptbuch und Mein Mixarium austauschen", datenort: ["geraet"],
      sicherung: ["selbst", "allein"], ki: "dienst" },
    nicht: ["Kein Konto und keine Anmeldung beim Hersteller"],
    handeln: [["Kategorie|einordn", "vorschlagen"]],
  });
  setze("mixarium", {
    muss: [
      "Das System muss als installierbare Web-App in einer einzigen Datei ohne Bau-Schritt laufen und nach dem ersten Öffnen ganz ohne Internet",
      "Das System muss die Oberfläche in acht Sprachen zeigen: Deutsch, Englisch, Russisch, Chinesisch, Spanisch, Französisch, Italienisch, Portugiesisch",
      "Das System muss die Getränke in feste Kategorien einteilen (Smoothies und Shakes, Mocktails, alkoholfreie Cocktails, Limonaden, Tees und Kaffees, Cocktails, Bowlen), umbenennbar",
      "Das System muss von selbst Sicherungsstände in einem Tresor auf dem Gerät anlegen, aus dem man frühere Stände zurückholen, exportieren oder löschen kann",
      "Das System muss die Sammlung als Datei exportieren und wieder einlesen, wahlweise ersetzend oder ergänzend, mitsamt Ordnern",
      "Das System muss KI nur mit dem eigenen Schlüssel des Nutzers nutzen (Claude, Mistral oder OpenAI); ohne Schlüssel läuft alles andere weiter",
    ],
    rahmen: { geraete: ["android", "iphone", "tablet", "browser"], offline: "immer", abgleich: "eins", eigene: ["hinher"],
      eigeneText: "Rezepte mit Mein Rezeptbuch austauschen", datenort: ["geraet"], sicherung: ["selbst", "allein"], ki: "dienst" },
    nicht: ["Kein Konto und keine Anmeldung beim Hersteller"],
  });
  setze("mixariumpage", {
    rahmen: { geraete: ["browser"], offline: "nein", abgleich: "eins", datenort: ["geraet"], ki: "keine" },
    nicht: ["Keine fremden Dienste beim Laden der Seite"],
  });
  setze("calculate", {
    rahmen: { geraete: ["browser", "tablet", "android"], offline: "immer", abgleich: "eins", eigene: ["hinher"],
      eigeneText: "Angebote an Mein WorkFloh, Tomys Hub und BookLedgerPro", datenort: ["geraet"], sicherung: ["verschluesselt", "selbst"],
      ki: "dienst", budgetEuro: 2500 },
    nicht: ["Keine Live-Versandtarife", "Kein Marktpreis zählt, bevor er von Hand bestätigt ist"],
    handeln: [["Preis|Recherche|Lieferant", "vorschlagen"]],
  });
  setze("kimsync", {
    muss: [
      "Das System muss als installierbare Web-App aus einer einzigen Seite laufen, ohne Bau-Schritt",
      "Das System muss einladen können: Link oder Raum-Code zum Kopieren oder Teilen",
      "Das System muss alle Räume in einem Tresor mit Passwort (mindestens 8 Zeichen) verschlüsselt halten; das Passwort wird beim Öffnen einmal abgefragt",
      "Das System muss Nachrichten als signierte Zettel über mehrere Relais gleichzeitig verschicken (Nostr)",
      "Das System muss Bilder vor dem Senden verkleinern und Videos unverändert in Teilen schicken, mit Fortschrittsanzeige beim Empfänger",
      "Das System muss eine verschlüsselte Sicherungsdatei schreiben, die Räume, Nachrichten, Bilder und den Geräteschlüssel enthält; Einspielen ergänzt nur und erlaubt den Umzug auf ein neues Gerät",
    ],
    rahmen: { geraete: ["android", "iphone", "tablet", "windows", "browser"], offline: "unterwegs", abgleich: "sofort", eigene: ["hinher"],
      eigeneText: "Große Dateien über Datei-Post; Nachrichten reisen verschlüsselt über Relais, gespeichert wird nur auf den Geräten", datenort: ["geraet"], sicherung: ["verschluesselt", "selbst", "zweiterort"],
      ki: "geraet", budgetMonatEuro: 49, budgetMonate: 24, budgetWartung: true },
    nicht: ["Kein Konto und keine Telefonnummer", "Kein Klartext auf dem Relais"],
  });
  setze("workflohpage", {
    muss: [
      "Das System muss als eine einzige Seite ohne eigenen Server und ohne Bau-Schritt laufen",
      "Das System muss acht Leistungen als Karten zeigen (z. B. Fahrzeugfolierung, Fahrzeugbeschriftung, Digitaldruck, 3D-Schilder, Lichtwerbung, Leuchtbuchstaben)",
      "Das System muss die Leistungen nach Kategorie filtern (Alle, Fahrzeug, Druck und Folie, Schilder und Gravur, Lichtwerbung) und über ein Suchfeld finden lassen",
      "Das System muss Anschrift, Telefon, E-Mail, Social Media, Öffnungszeiten je Wochentag und einen Platz für die Anfahrt zeigen",
      "Das System muss ein Anfrageformular (Name oder Firma, E-Mail oder Telefon, Betreff, Nachricht) mit Prüfung der Pflichtfelder haben",
      "Das System muss die Anfrage ohne Server verschicken: es öffnet das eigene E-Mail-Programm mit vorausgefülltem Betreff und Text",
      "Das System muss oben ein festes Band zeigen, dass es eine Muster-Seite ist und kein Betrieb dahintersteht",
    ],
    rahmen: { geraete: ["browser"], offline: "unterwegs", abgleich: "eins", datenort: ["geraet"], ki: "keine" },
    nicht: ["Keine echten Firmendaten in der Vorlage"],
  });
  setze("dateiorganizer", {
    rahmen: { geraete: ["browser", "tablet", "windows", "android"], offline: "immer", abgleich: "eins", eigene: ["ablageort", "hinher"],
      eigeneText: "Der sortierte Ordner wird in die Familienakte übernommen", datenort: ["geraet", "ordner"], sicherung: ["selbst"], ki: "geraet" },
    nicht: ["Originale werden nie verändert oder verschoben"],
    handeln: [["sortier|einordn|Archivnummer", "vorschlagen"]],
  });
  setze("needs", {
    muss: [
      "Das System muss den Bedarf in 18 feste Bereiche gliedern, von der Ausgangssituation bis zu offenen Fragen",
      "Das System muss den Rahmen erfragen: Geräte, ohne Internet, Abgleich zwischen Geräten, eigene Programme, Datenort, Sicherung, Ort der KI, Budget und was ausdrücklich nicht gewollt ist",
      "Das System muss Kosten und Nutzen über einen Zeitraum (Vorgabe 24 Monate) rechnen und eine Grenzlinie ziehen: Bausteine darunter stehen im Angebot nur als Wahl",
      "Das System muss jedes Kundenblatt nach einer festen Liste erlaubter Felder bauen; Stundensatz, Stunden und interne Notizen kommen nie hinein",
      "Das System muss einen Bauauftrag als Markdown mit den Zeilen NEU BAUEN, ANPASSEN, ENTFERNEN, UNVERÄNDERT und NOCH NICHT GESCHÄTZT schreiben, Kundendaten als Platzhalter",
      "Das System muss eine mit Passwort verschlüsselte Sicherungsdatei aller Vorgänge mit Anhängen, Einstellungen und Tabellen schreiben; Zurückholen ergänzt nur",
      "Das System muss ein Angebot als Auftragsdatei an die Auftragsverwaltung WorkFloh übergeben, mit fester Kennung je Vorgang und Fassung, samt Anhängen",
    ],
    rahmen: { geraete: ["browser", "tablet", "windows"], offline: "immer", abgleich: "eins", eigene: ["hinher"],
      eigeneText: "Aufträge an Mein WorkFloh und Tomys Hub, Angebote an BookLedgerPro", datenort: ["geraet"],
      sicherung: ["verschluesselt", "selbst"], ki: "dienst" },
    nicht: ["Der Stundensatz steht auf keinem Kundenblatt — außer im Wartungsvertrag"],
  });
  setze("toolpoint", {
    rahmen: { geraete: ["browser"], offline: "unterwegs", abgleich: "eins", eigene: ["suche"], datenort: ["server"], ki: "wahl" },
    nicht: ["Keine Preise und keine Provision (Stufe 1)", "Keine geschönten Messwerte"],
  });
})(typeof window !== "undefined" ? window : globalThis);
