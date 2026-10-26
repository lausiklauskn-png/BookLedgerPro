# Plan: Rechnungen zeilenweise auslesen → ein-/ausschließen → Zweck → Steuerformular → ELSTER (2026-10-26)

**Nur Plan, nichts gebaut.** Klaus (2026-10-26, beim Scanner-Kern): „das automatische Einsortieren in die entsprechenden
Steuerformulare … einzelne Werte auslesen … Komponenten werden ausgeschlossen oder eingeschlossen. Zum Beispiel Kaffee,
Reinigungsmittel … Zweck bestimmen … dem entsprechenden Formular für die Steuer, was dann später in Elster 1 zu 1
übernommen werden muss. … ob es da eine Zuordnungsnummern gibt oder wie wir das dann in Elster importieren können.
Oder wir können uns Elster-Formular herunterladen. Das müssen wir noch entscheiden."

Was es schon gibt: Belegtext (Textebene/OCR/Vision) verschlüsselt am Beleg · `extractFromText` (Datum, Betrag, USt,
Lieferant) · `categorize` (Konto-Vorschlag) · Anlage EÜR / USt-VA als Kennzahlen und CSV (`domain/export.js`) ·
ELSTER-Recherche (`ELSTER-ERIC-RECHERCHE-2026-10-26.md`). Was fehlt: **Positionen** je Beleg, **Zweck** je Position,
die **Formular-Zeilen** für Privatpersonen, der **Jahresbogen** und der Weg nach ELSTER.

## Schritt S1 — Positionen aus dem Belegtext (ohne KI, auf dem Gerät)

- `src/domain/belegPositionen.js` (rein, Node-prüfbar): aus dem Text eines Bons oder einer Rechnung die Zeilen
  „Bezeichnung · Menge · Einzelpreis · Betrag · USt-Satz" lesen. Erkennung über Zahlenmuster am Zeilenende
  (`12,99`, `3 x 1,49`, `A`/`B`-Steuerkennzeichen von Kassenbons), Summenzeile („Summe", „Gesamt", „zu zahlen") als
  Kontrolle: Positionen müssen die Summe ergeben (± 2 Cent), sonst steht am Beleg „Positionen unvollständig".
- Jede Position bekommt eine feste Kennung am Beleg (`beleg.positionen[]`, verschlüsselt mit dem Belegtext), damit
  Entscheidungen (ein/aus, Zweck) am Beleg bleiben und bei erneuter Erkennung nicht verloren gehen.
- Anzeige: unter dem Beleg eine Tabelle; jede Zeile hat einen Schalter **drin / draußen** und ein Feld **Zweck**.
  Grenzen, benannt: mehrzeilige Positionen, Rabattzeilen, Pfand, Trinkgeld — zuerst nur erkennen, was klar ist;
  der Rest bleibt als Zeile ohne Betrag stehen und ist von Hand setzbar.
- Optional (nur mit Mistral-Schlüssel, pseudonymisiert wie A3): „Positionen mit KI nachlesen" für schwierige Bons.

## Schritt S2 — Ein-/Ausschließen und Zweck, lernend ohne KI

- **Regeln je Wort** (`settings.zweckRegeln`, verschlüsselt): „Kaffee → draußen (privat)", „Reinigungsmittel → Arbeitszimmer",
  „Druckerpapier → Arbeitsmittel". Beim ersten Mal setzt Klaus die Entscheidung von Hand; BLP schlägt beim nächsten
  Beleg mit demselben Wort dieselbe Entscheidung vor (gelber Chip wie bei den Namen, ein Tipp nimmt sie zurück).
  Vergleich nach Wortstamm und ohne Groß/Klein; kein Modell, keine Übertragung.
- **Zweck** = ein Eintrag aus dem Katalog (S3), nicht freier Text (freier Text nur als Notiz). So weiß BLP, in welche
  Formular-Zeile der Betrag geht.
- Ein Beleg kann gemischt sein (Bon mit Kaffee und Druckerpapier): drinnen zählt nur die Summe der eingeschlossenen
  Positionen; der Beleg bleibt als Ganzes im Archiv (GoBD, nichts wird gelöscht).

## Schritt S3 — Katalog der Steuer-Zeilen (der „Zuordnungsschlüssel")

- `src/domain/steuerzeilen.js`: Katalog `{ kennung, formular, zeile, name, art, hinweis, ab, bis }` — je Steuerjahr
  versioniert, weil ELSTER die Zeilennummern jedes Jahr verschiebt. Erster Umfang (Modus Privat, dann Kleinunternehmer):
  - **Anlage N:** Arbeitsmittel, Arbeitszimmer/Homeoffice-Pauschale, Fahrten (Entfernungspauschale), Fortbildung,
    Bewerbung, Reisekosten, Telefon/Internet (Anteil).
  - **Haushaltsnahe Dienstleistungen / Handwerker (§ 35a):** Lohnanteil, nicht Material — die Position muss den
    Lohnanteil trennen (Rechnung), sonst Rückfrage.
  - **Sonderausgaben:** Spenden, Kirchensteuer, Versicherungen (Vorsorge), Kinderbetreuung, Schulgeld.
  - **Außergewöhnliche Belastungen:** Krankheit, Pflege, Behinderung (mit Zumutbarkeitsgrenze nur als Hinweis).
  - **Anlage EÜR / USt (Kleinunternehmer, Selbstständig):** Wareneinkauf, Bürobedarf, Fahrzeugkosten, Fremdleistungen …
    — dort gibt es schon Kontenrahmen und EÜR-Zeilen (`export.js`), der Katalog verweist darauf.
- **Zuordnungsnummern** (Klaus' Frage): ELSTER kennt intern Feldkennungen (z. B. in der ERiC-XML je Formular eine
  `<Kz>`-Nummer oder ein XPath wie `E_Anl_N/…`). Öffentlich dokumentiert sind sie nur im ERiC-Entwicklerpaket (nach
  Registrierung). Für die Anzeige „was trage ich wo ein" reichen **Formular + Zeilennummer**; die Feldkennungen braucht
  nur das direkte Senden (S5). Der Katalog hat ein leeres Feld `elsterFeld`, das später gefüllt wird.

## Schritt S4 — Jahresbogen („Steuerbuch") und Ausfüllhilfe

- Ansicht „Steuer" im Modus Privat: je Steuerjahr die Summen je Katalog-Zeile, darunter die Belege (Positionen),
  die hineinzählen; ein Tipp öffnet den Beleg. Export als PDF/CSV „Übertragungsliste": **Formular · Zeile · Betrag ·
  Belege** — das, was Klaus in **Mein ELSTER** oder **MeinELSTER+** eintippt. Funktioniert überall (PWA, Android,
  Windows), ohne Hersteller-ID, ohne dass Steuerdaten das Gerät verlassen.
- Plausibilität: fehlende Lohnanteile (§ 35a), Positionen ohne Zweck, Belege ohne Datum, Doppelte (gleicher
  Lieferant, Betrag, Datum) — als Liste „Vor dem Eintragen prüfen".

## Schritt S5 — ELSTER (nach Klaus' Entscheidung)

| Weg | Was | Für wen | Stand |
|---|---|---|---|
| **A Übertragungsliste** (S4) | BLP rechnet, Klaus tippt in Mein ELSTER / MeinELSTER+ | alle Fassungen | sicher machbar, keine Registrierung |
| **B ERiC in der Windows-App** | direkt senden mit Klaus' ELSTER-Zertifikat (.pfx + PIN) | Windows-Pro | braucht Hersteller-ID (Wochen), ERiC-Lizenz prüfen; Daten bleiben auf dem Gerät |
| **C Server mit ERiC** | senden aus Android über eigenen Server | Android-Pro | Steuerdaten verlassen das Gerät → bricht Regel 4; nur nach ausdrücklicher Entscheidung |
| **D „ELSTER-Formular herunterladen"** (Klaus' Idee) | ein Formular-PDF vorausfüllen | — | ELSTER bietet **keine** ausfüllbaren Import-PDFs mehr (ElsterFormular 2020 eingestellt); ein selbst gebautes PDF akzeptiert ELSTER nicht als Import. Nur als Druck-/Kontrollblatt sinnvoll (= A als PDF) |

Es gibt nach heutigem Stand **keinen Import-Weg für Privatpersonen** (keine Datei, die Mein ELSTER einliest);
Import gibt es nur über ERiC (B/C). Deshalb: **A zuerst bauen, B vorbereiten** (Registrierung früh beantragen).

## Fragen an Klaus (Entscheidungen)

- **D17 ELSTER-Weg:** A zuerst (Übertragungsliste, überall) und B später in Windows-Pro — einverstanden? C (Server) nein?
  Soll die ELSTER-Entwickler-Registrierung jetzt schon beantragt werden (du musst das als Hersteller selbst tun)?
- **D18 Welche Formulare zuerst:** Anlage N + § 35a + Sonderausgaben (Privat/Rentner) — oder EÜR zuerst (Kleinunternehmer)?
- **D19 KI-Hilfe beim Positionen-Lesen:** nur ohne KI (Regeln) — oder zusätzlich „mit KI nachlesen" (Mistral, pseudonymisiert,
  wie Frage an die Belege)?
- **D20 Reihenfolge:** S1–S4 vor oder nach Ü1 (Übersetzung) und Schritt 3 (Haushaltsbuch)? Vorschlag: Haushaltsbuch und
  S1/S2 zusammen (der Beleg-Eingang ist derselbe), dann S3/S4, Ü1 dazwischen, wenn du es eher brauchst.

## Grenzen, vorab benannt

- Kassenbons sind schwer: Abkürzungen („KAFF.CREMA"), Rabatte, Pfand, Steuerkennzeichen je Land. Die Regeln lernen aus
  deinen Entscheidungen, nicht aus einem Modell; am Anfang ist viel von Hand.
- Zeilennummern ändern sich jedes Jahr; der Katalog muss je Steuerjahr nachgezogen werden (ein kleiner PR pro Jahr).
- BLP gibt keine Steuerberatung: die Ausfüllhilfe nennt Zeilen und Summen, die Entscheidung bleibt bei dir (Hinweis in der Ansicht).
