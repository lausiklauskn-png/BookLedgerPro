# BLP Design-Sammlung (Stand 2026-10-26)

**Status: nur gesammelt, nichts umgebaut.** Plansitzung mit Klaus.

⚠ **Korrektur am Sitzungsende:** Die ersten Bildschirmfotos und Befunde stammten von einem **alten Stand**
(Juni, `4ba49c8`), weil der Arbeitszweig 328 Commits hinter `main` lag. Nach dem Abgleich wurden die Ist-Bilder
durch Aufnahmen vom **aktuellen `main` (`b924a7a`, 2026-10-26)** ersetzt ([`ist-2026-10-26/`](ist-2026-10-26/),
Chromium 390 px / 1366 px) und Abschnitt B unten neu geprüft. **Die Entscheidungen von Klaus (A, D, E–H) gelten
unverändert.** Kein Gerätetest (Tablet/DeX).

Leitsatz (Klaus): **BLP ist ein Arbeitswerkzeug, keine Vorführung.** Die Funktionen
sind modern; das Design soll es auch werden, angelehnt an moderne
Buchhaltungsprogramme.

---

## A. Klaus' Vorgaben (verbindlich für den Umbau)

| # | Vorgabe | Was das am Ist-Stand bedeutet |
|---|---|---|
| A1 | **Strichsymbole** statt Emojis bei den Symbolen | Navigation, Knöpfe, Tabellenaktionen und Statusanzeigen bekommen Strichsymbole (heute: nur Text). **Die vorhandenen 3D-Bilder bleiben** (Klaus 2026-10-26: eigens generiert, passen zu App und Farbe): Sperrbildschirm, 3 Onboarding-Bilder, 7 Leerzustände. Sie sind Illustrationen, keine Symbole. |
| A2 | **Knöpfe flach** halten, soweit am Handy bedienbar | Heute ca. 40–44 px sichtbar hoch (`.btn` padding .55rem), Eingabefelder ebenso. Ziel wie PBP: sichtbar ~28–32 px, unsichtbare Trefferfläche ≥ 44 px bei Touch. Formulare, Segment-Schalter, Tabellenaktionen mitziehen. |
| A3 | **Vollbild**, Platz optimal nutzen (präzisiert 2026-10-26) | Heute auf `--maxw: 1200px` begrenzt und mittig. Ziel: **volle Breite**, der Inhalt passt sich immer der verfügbaren Breite an. **Seitenleiste einklappbar** (auf Symbole); im **Teilbild** (geteilter Bildschirm, schmales Fenster) klappt sie **selbst** ein. Am Handy ein **☰-Menü**, das die Leiste aufklappt, Einstellungen inklusive. |
| A4 | **Themen = Farbe × Hell/Dunkel** (Klaus 2026-10-26: Hell/Dunkel bleibt und gilt für jede Farbe) | Zwei getrennte Schalter: **Farbe** (Blau · Graphit · Petrol) und **Helligkeit** (Hell · Dunkel · wie Gerät). Ergibt sechs Kombinationen, siehe Tabelle unten. Ersetzt die heutige Wahl System/Hell/Dunkel nicht, sondern ergänzt sie um die Farbe. |

### A5 Schrift ohne Fehler (Klaus 2026-10-26: „ist immer wieder aufgetaucht“)
Bei jeder Breite (Handy, Teilbild, Tablet, Vollbild, große Schrift im System) gilt:
- Keine abgeschnittenen Wörter, keine Buchstaben unter Rändern, nichts überlappt.
- Knopf- und Menübeschriftungen brechen nicht mitten im Wort und werden nicht zweizeilig gequetscht
  (heute z. B. abgeschnittene Auswahlfelder im Journal, abgeschnittener Knopf „Schnellerfassung aus Te…“ am Handy, siehe B2).
- Statt Quetschen: Symbol + kurzer Name, oder Feld rutscht in die nächste Zeile; Tabellen scrollen waagerecht, Spalten bleiben lesbar.
- Abnahme je Umbau-Abschnitt: Bildschirmfotos bei 320, 390, 768, 1024, 1366 px und 200 % Schrift; jede Beschriftung
  automatisch auf Überlauf prüfen (Text breiter als sein Kasten = Fehler).

### A4 im Detail: Farbe × Helligkeit

| Farbe | Hell | Dunkel |
|---|---|---|
| **Blau** | PBP *Klarblau* (`#2563eb` auf `#f6f8fc`) | PBP *Nachtblau* (`#7ca7ff` auf `#111827`) |
| **Graphit** | PBP *Graphit* (`#475569` auf `#f7f8fa`) | **fehlt – neu ableiten**, Arbeitsname *Nachtgraphit* (dunkle Grauflächen, heller Grauakzent) |
| **Petrol** | PBP *Petrol* = heutiges BLP-Hell (`#0f766e`) | ***Nachtpetrol*** (Name von Klaus bestätigt) = heutiges BLP-Dunkel (`#2dd4bf` auf `#0b1120`, Werte aus `assets/tokens.css` unverändert) |

- „Wie Gerät" folgt der Hell/Dunkel-Einstellung des Geräts, die Farbe bleibt.
- Abweichung von PBP: Dort ist Nachtblau ein eigenes viertes Thema. Hier wird es die dunkle Seite von Blau.
  Für Klaus sieht es gleich aus; nur die Bedienung ist zweigeteilt.
- **Nachtpetrol-Knöpfe (Klaus 2026-10-26):** grüne BLP-Knöpfe behalten, **nicht** die blauen aus PBP-Nachtblau;
  **weiße Schrift** im Hauptknopf für besseren Kontrast.
  Gemessen (WCAG-Kontrast): Weiß auf dem heutigen hellen Dunkel-Grün `#2dd4bf` = **1,9 : 1** (zu schwach, schlechter
  als heute mit dunkler Schrift 8,9 : 1). Weiß auf dem BLP-Grün `#0f766e` (wie im hellen Petrol) = **5,5 : 1** ✓,
  Knopf gegen dunklen Hintergrund 3,4 : 1 ✓. → Vorschlag: Hauptknopf in Nachtpetrol `#0f766e` mit weißer Schrift,
  Hover `#0b5a54` (8,1 : 1). Das helle `#2dd4bf` bleibt für Akzente (aktiver Menüpunkt, Links, Fokusrahmen). **Von Klaus bestätigt 2026-10-26.**
- **Startwert (entschieden 2026-10-26):** genau wie Brain Pro – Gerät dunkel → Blau/Nachtblau, sonst Blau/Klarblau. Danach bleibt immer **das zuletzt gewählte Thema** erhalten (auch nach Neustart/Update). Hinweis für den Bau: Wer heute schon BLP nutzt, hat nur „System/Hell/Dunkel“ gespeichert, keine Farbe → bekommt beim ersten Start nach dem Update ebenfalls die Brain-Pro-Startfarbe.

### Was es aus Private Brain Pro schon gibt (wiederverwendbar)
- **Strichsymbol-Satz:** `Privat-Brain-Pro/docs/design/umbau-2026-10-24/design-kit/icons.svg`,
  29 eigene Symbole, 24×24, Strich 1,75, keine Fremdbibliothek (passt zu „keine CDNs").
  Für BLP fehlen fachliche Symbole: Journal/Buchung, Konto, Beleg/Quittung, Auftrag,
  Kunde, Mitarbeiter, Auswertung/Diagramm, Mycel, Recht/Paragraf, Festschreiben (Siegel/Schloss),
  Storno, Kamera, Euro. Im gleichen Strichstil neu zeichnen.
- **Regeln aus dem PBP-Design-Kit:** Symbol + sichtbarer Name gehören zusammen (nur Suche/Zahnrad
  dürfen allein stehen); Farbe nie allein als Information; 28 px sichtbar / 44 px Touch.
- **Themenwahl-Bedienung:** Palette-Knopf in der Kopfleiste + Auswahl in den Einstellungen.

---

## B. Befunde am aktuellen Stand (`main` b924a7a, neu geprüft)

**Was es inzwischen schon gibt (nicht neu bauen):**
- Am Handy bereits ein **☰-Menü** (Kopfleiste), Installieren-Knopf ⬇, Lampen LEBT/VERKEHR/FREMD, Mycel- und
  Siegel-Leiste unten, Fußzeile mit Impressum/Datenschutz.
- Inhaltsbreite schon auf **1200 px** erweitert (`--maxw`), aber weiter mittig begrenzt → Vollbild (A3) noch offen.
- Einrichtung fragt schon **Kleinunternehmer ja/nein** (`kleinunternehmer`, § 19) und die Rechnungsstelle.
- Veraltete Claude/Anthropic-Texte sind **behoben**.
- Viele neue Bereiche: Kassenbuch, Anlagen, Verbindlichkeiten, Angebote, Shop-Übernahme, Nachkalkulation, Lohn,
  Berichte, SBKIM-Suche, Geheim-Fach, Anleitung, Selbsttest, Über; Belege mit XRechnung und Bankauszug-Import.

**Weiterhin offen / neu gefunden:**
- B1 **24 Menüpunkte** ohne Symbole und ohne Gruppen – am breiten Schirm muss man scrollen. Gruppierung (C1)
  und Ausblenden je Modus (F) sind dringender als gedacht.
- B2 **Schriftfehler (A5) sichtbar:** Auswahlfelder schneiden Text ab („0400 · Betriebsau…", „Inland (USt im Bet…"
  im Journal); am Handy ist „Schnellerfassung aus Te…" rechts abgeschnitten; der Speicher-Hinweis rutscht am
  Handy halb unter die Kopfleiste.
- B3 **Schwebende Mycel-/Siegel-Leisten** liegen über Inhalten (Handy: über der GoBD-Karte; breit: über Formular/Menü).
  Platz dafür einplanen oder andocken.
- B4 Übersicht wie früher: „Willkommen…" + Werbesatz + 9 gleich große Kacheln, alle 0 (siehe B5–B7 alt → bleibt gültig).
- B5 Journal: Formular „Neue Buchung" steht oben fest und schiebt die Liste nach unten (C4/Seitenfenster).
- B6 Modus-Schalter Einfach/Profi/Berater **wirkt weiterhin nirgends** (nur `data-mode`).
- B7 Shamir-Schritt: Knopf heißt weiter „Speichern", geht nur weiter.
- B8 Startseite vor der Anmeldung: großes Bild + Zielgruppen-Chips („Laien, Kleinunternehmen, Profis, Berater")
  → an die neuen Modi angleichen (Privat statt „Laien").
- B9 Themen weiterhin nur System/Hell/Dunkel in Teal; Knöpfe ~40 px hoch.

## C. Ideen angelehnt an moderne Buchhaltungsprogramme
(Orientierung an gängigen Mustern wie Lexware Office, sevDesk, BuchhaltungsButler,
Xero – Anregung, keine Kopie.)

- C1 **Seitenleiste mit Gruppen** und Symbolen, einklappbar auf reine Symbole:
  *Übersicht* · **Buchen:** Belege, Journal, Konten · **Verkauf:** Aufträge/Rechnungen,
  Kunden · **Team:** Mitarbeiter, Kostenstellen · **Auswerten:** Auswertung, Steuer/Export ·
  unten: Mycel, Recht & Doku, Einstellungen.
  Handy: untere Leiste mit 4–5 Hauptwegen + „Mehr".
- C2 **Kopfleiste**: globale Suche (Buchungen, Belege, Kunden), „+ Neu"-Knopf (Buchung,
  Beleg, Auftrag, Kunde), Themenwahl, Sperren-Symbol, Mandant/Geschäftsjahr.
- C3 **Dichte Tabellen** als Kern: Filterzeile (Zeitraum, Konto, Status), sortierbare
  Spalten, Status-Chips (Entwurf/festgeschrieben/Storno), Beträge rechtsbündig in
  Tabellenziffern, Zeilenaktionen beim Überfahren. Optional Dichte-Schalter (kompakt/normal).
- C4 **Liste + Detail nebeneinander** (am breiten Schirm), am Handy nacheinander.
- C5 **Zeitraum-Wahl** einheitlich oben (Monat/Quartal/Jahr), gilt für Übersicht und Auswertung.
- C6 **Tastatur**: z. B. `N` neue Buchung, `/` Suche – für Arbeit am Rechner/DeX.
- C7 **Einfach/Profi/Berater-Modus** sichtbar wirken lassen (weniger Spalten/Menüpunkte
  im Einfach-Modus) – heute kaum Unterschied zu sehen.

---

## F. Modus nach Nutzerart – Einstellungen und Menü kürzen (Klaus 2026-10-26)

Klaus: Die Einstellungen sollen sich nach dem gewählten Modus richten (privat,
Kleinunternehmer, Berater o. ä.). Was ich nicht brauche, muss ich nicht sehen und
nicht wegscrollen.

**Ist-Stand (im Code nachgesehen):** Der Schalter Einfach/Profi/Berater wird gespeichert
und als `data-mode` an die Seite gehängt, **wirkt aber nirgends** – kein CSS, keine
Ansicht fragt ihn ab. Eine Kleinunternehmer-Einstellung (§ 19 UStG) gibt es nicht.

**Vorschlag:** Der Modus beschreibt, *wer* BLP nutzt, nicht *wie schwierig* es ist.
Er wird bei der Einrichtung gefragt und ist in den Einstellungen änderbar.

| Modus | Für wen | Sichtbar | Ausgeblendet |
|---|---|---|---|
| **Privat** (entschieden 2026-10-26) | Arbeitnehmer, Arbeitslose und **besonders Rentner** (müssen oft Steuererklärung abgeben; Renten, Kranken-/Pflegeversicherung, Anlage R) – **private Einkommensteuererklärung**, kein Gewerbe. Andere Gesetze als Kleinunternehmer (EStG: Werbungskosten, Sonderausgaben, außergewöhnliche Belastungen, haushaltsnahe Dienstleistungen – kein UStG, keine EÜR, keine GoBD-Buchführungspflicht) | Belege sammeln und den Steuer-Kategorien zuordnen, Jahresübersicht für die Steuererklärung | alles Unternehmerische: USt, Journal/Soll-Haben, Konten-Rahmen, Aufträge, Kunden, Mitarbeiter, Kostenstellen, EÜR, DATEV. **Eigener fachlicher Bauabschnitt**, nicht nur Ausblenden |
| **Kleinunternehmer** (§ 19 UStG) | Nebengewerbe, kleine Selbstständige | Belege, Journal, Rechnungen/Aufträge, Kunden, EÜR | USt-Satz in Formularen (fest 0 % + Hinweis § 19), USt-Voranmeldung, Zahllast-Kachel, Mitarbeiter, Kostenstellen |
| **Selbstständig / Unternehmen** (regelbesteuert) | Freiberufler, GmbH-klein | alles für EÜR + USt-VA, Mitarbeiter, Kostenstellen | Mandanten-Wechsel, Berater-Export |
| **Berater** | betreut mehrere Mandanten | alles, dazu Mandantenwechsel, DATEV-Export, Prüfansichten | – |

**Privat im Detail (Klaus 2026-10-26):** Privat deckt alle Anlagen der privaten Einkommensteuererklärung ab,
die man braucht; man schaltet nur ein, was auf einen zutrifft (Rest bleibt verborgen, siehe F1):
- Grundlage: Hauptvordruck, Sonderausgaben, Vorsorgeaufwand, außergewöhnliche Belastungen, haushaltsnahe
  Aufwendungen (§ 35a), Kinder, Unterhalt.
- **Arbeitnehmer** (Anlage N), **Rentner** (Anlage R), **Arbeitslose** (Lohnersatzleistungen/Progressionsvorbehalt),
  Kapitalerträge (Anlage KAP), sonstige Einkünfte (Anlage SO).
- **Vermieter** (Anlage V, je Objekt): Mieteinnahmen, Reparaturen, Zinsen, Abschreibung, Nebenkosten, Grundsteuer.
  Wohnungsvermietung ist umsatzsteuerfrei (§ 4 Nr. 12 UStG) → gehört zu Privat. Sonderfall später: Ferienwohnung
  (7 % USt, ggf. Kleinunternehmer) bzw. gewerbliche Vermietung → Unternehmer-Modi.
- **Ehrenamt** als Person (Übungsleiter-/Ehrenamtspauschale, § 3 Nr. 26/26a EStG) gehört ebenfalls hierher.
- **Verein selbst** ist eine eigene Steuerperson (eigene Erklärungen, Gemeinnützigkeit, Körperschaftsteuer) –
  passt nicht in Privat. Vorschlag: späterer eigener Modus „Verein" (D13).
Allgemeine Rechtslage, keine Steuerberatung; fachliche Prüfung beim Bau.

Regeln dazu:
- F1 Ausblenden gilt für **Einstellungen, Navigation, Formularfelder und Kacheln** gleichermaßen.
- F2 Ausgeblendet heißt nicht gelöscht: Daten bleiben, beim Moduswechsel ist alles wieder da.
- F3 Ein kleiner Schalter „Alle Einstellungen zeigen" für Sonderfälle, damit nichts versteckt unerreichbar ist.
- F4 Moduswechsel mit kurzer Rückfrage, wenn er Steuerliches ändert (z. B. Kleinunternehmer → regelbesteuert).
- F5 Einstellungen ohnehin gliedern (siehe B12), dann bleibt je Modus nur eine kurze Seite.
- F6 Recht: Kleinunternehmer-Modus muss wirklich § 19 abbilden (keine USt ausweisen, Pflichthinweis
  auf Rechnungen, Umsatzgrenze beobachten). Das ist **Funktion, nicht nur Design** – eigener Bauabschnitt.

## G. Produktplan und ELSTER (Klaus 2026-10-26)

**Zwei Apps aus einer Quelle:**
1. Design und Verbesserungen werden **hier** fertig gebaut (noch PWA).
2. Dann wird dieser Stand in ein **neues Repo geklont** → bleibt PWA. Name noch offen
   (Ideen: „Bookledger PWA", „Bookledger Standard", „BLP"). Klaus legt ihn fest.
3. **Dieses Repo wird danach die native App** und heißt weiter **BookLedgerPro**.

⚠ **Wichtig beim Klonen (CLAUDE.md, Regel 3):** Beide liegen auf demselben GitHub-Pages-Ursprung
`lausiklauskn-png.github.io`. Hätte der Klon dieselbe Datenbank-Endung `bookledgerpro`, teilen sich beide
Apps im Browser **dieselben Daten** → Kollision. Der Klon braucht eine **eigene Endung** (z. B. `bookledger`),
und vorhandene Daten ziehen nur per Backup/Wiederherstellen um. Vor dem Klonen festlegen (D10).

**ELSTER direkt aus BLP (vor allem Modus Privat/Rentner):**
- Ziel: BLP baut die Einkommensteuererklärung und sendet sie **direkt an ELSTER**, mit Internetverbindung
  (nur nach Bestätigung, wie bei der EU-KI).
- Ist-Stand: BLP kann **nicht** an ELSTER senden (PULS.md: „keine ELSTER/ERiC-Einreichung, nur Datenpaket").
- Technischer Weg (noch zu prüfen, nicht gemessen): Offiziell geht Übermittlung über die Programmbibliothek
  **ERiC** der Finanzverwaltung. Dafür braucht der Hersteller eine **Hersteller-ID** (Antrag bei ELSTER) und der
  Nutzer sein **ELSTER-Zertifikat**. ERiC ist eine native Bibliothek → das passt zur **nativen Pro-App**, im
  Browser (PWA) geht es so nicht. Welche Plattformen ERiC unterstützt (Windows sicher; Android/iOS fraglich)
  muss vor dem Bau geprüft werden.
- **Recherche-Ergebnis** (Details: [ELSTER-ERIC-RECHERCHE-2026-10-26.md](ELSTER-ERIC-RECHERCHE-2026-10-26.md)):
  ERiC gibt es für Windows, Linux x64, macOS – **nicht für Android/iOS** (soweit belegbar). Hersteller-ID nötig, auch
  zum Testen; Registrierung kann Wochen dauern. → Direkt senden geht sicher in der **Windows-App**; auf Android nur
  über einen eigenen Server (Steuerdaten verlassen das Gerät – Entscheidung D14).
- Für die PWA-Fassung bleibt realistisch: Formularwerte vorbereiten und zum Übertragen in „Mein ELSTER" anzeigen.
- Eigener großer Bauabschnitt (Recht + Technik), nicht Teil des Design-Umbaus.

## H. Haushaltsbuch im Modus Privat (Klaus 2026-10-26)

**Ziel:** Rechnung oder Kassenbon abfotografieren, scannen oder hineinkopieren → BLP trägt ihn
**automatisch ins Haushaltsbuch** ein → die Einträge fließen in die passenden Punkte für die
**Steuererklärung** (und bei Unternehmer-Modi in die Buchhaltung).

**Wege hinein (alle landen im selben Beleg-Eingang):**
- H1 **Kamera / Foto** direkt in BLP (gibt es schon: „Foto aufnehmen", „Beleg hochladen").
- H2 **Aus Workflow PDF**: vorher dort gescannte Dokumente übernehmen, oder aus BLP heraus Workflow PDF
  zum Scannen öffnen und das Ergebnis zurückbekommen. Nativ über Androids **Teilen** (BLP erscheint in
  der Teilen-Liste, wie Private Brain Pro es schon kann); in der PWA über Datei wählen / „Teilen an" (Web Share Target).
  Welche Übergabe Workflow PDF Pro heute anbietet, ist beim Bau in dessen Repo zu prüfen (nicht in dieser Sitzung).
- H3 **Digitaler Bon** aus Händler-Apps (z. B. Lidl Plus): als Bild/PDF teilen oder Text einfügen.
- H4 **Einfügen** aus der Zwischenablage (Text oder Bild).

**Arbeitsteilung mit Workflow PDF (Klaus 2026-10-26):** Workflow PDF hat Scannen und **Texterkennung (OCR)**
schon (laut Klaus; beim Bau in dessen Repo nachsehen). BLP nutzt diese Werkzeuge, statt sie doppelt zu bauen:
Workflow PDF scannt und erkennt den Text, BLP übernimmt Dokument **und** erkannten Text und trägt ein.
Für **selbst eingescannte** Dokumente entfällt die Prüfung auf Fehler/versteckte KI-Befehle – sie stammen
direkt vom Papier. Dateien **von außen** (heruntergeladene PDF, Bon aus einer Händler-App, Zwischenablage) werden **weiter geprüft**
(entschieden D12).

**Automatisch eintragen:**
- Texterkennung bevorzugt aus Workflow PDF; sonst Google Vision (EU) wie heute bei Belegen; Händler, Datum, Betrag, ggf. Einzelposten.
- Kategorie per Mistral (EU) oder On-Device-Heuristik (Lebensmittel, Wohnen, Mobilität, Gesundheit, Versicherung …).
- Wie eigenständig, regelt der vorhandene Schalter **KI-Autonomie** (nur Vorschlag / Entwurf + Prüfen / automatisch
  bei hoher Sicherheit). Übertragung an EU-KI nur nach Bestätigung (Regel 8).

**Haushaltsbuch-Ansicht (Design):**
- Monatsübersicht: Einnahmen, Ausgaben, Rest; Ausgaben nach Kategorie (Balken), optional Monatsbudget je Kategorie.
- Liste der Einträge mit Bild des Bons daneben (Liste + Detail, siehe C4), Filter nach Monat/Kategorie.

**Übertrag in die Steuer (Privat):** Jeder Eintrag kann einem Steuerpunkt zugeordnet werden, Vorschlag automatisch:
Werbungskosten (Arbeitsmittel, Fahrten), Sonderausgaben (Versicherungen, Spenden, Kirchensteuer),
außergewöhnliche Belastungen (Krankheit), haushaltsnahe Dienstleistungen und Handwerkerleistungen (§ 35a EStG),
Renten/Kranken-/Pflegeversicherung für Rentner. Jahresübersicht je Anlage → Grundlage für ELSTER (Abschnitt G).
Bei Unternehmer-Modi: Trennung privat/betrieblich (Privatentnahme/-einlage) statt doppelter Erfassung.

⚠ Funktion, nicht nur Design: eigener Bauabschnitt; steuerliche Zuordnung muss fachlich geprüft werden.

## D. Offene Fragen an Klaus

- ~~D1 Themen~~ **entschieden:** PBP-Farben + heutiges BLP-Dunkel, Hell/Dunkel gilt für jede Farbe (siehe A4).
- ~~D8 Farbe × Hell/Dunkel, Graphit-Dunkel, Startwert~~ **entschieden:** Zuordnung passt, „Nachtgraphit“ wird neu gemacht, Start wie Brain Pro + letztes Thema merken (siehe A4).
- ~~D9 Nachtpetrol-Hauptknopf~~ **entschieden:** `#0f766e` + weiße Schrift (siehe A4).
- ~~D2 Gemeinsamer Symbolsatz~~ **entschieden (Klaus 2026-10-26):** BLP nutzt dieselben Strichsymbole wie
  Private Brain Pro, wo sie übertragbar sind – eine App-Familie, keine Irritation. Gleiche Aktion = gleiches
  Symbol (Suchen, Einstellungen, Löschen, Speichern, Herunterladen, Sperren …). Nur fachliche BLP-Symbole
  (Buchung, Konto, Beleg, Euro, Festschreiben …) kommen neu dazu, im selben Stil (24×24, Strich 1,75).
  Übernahme als Kopie aus `Privat-Brain-Pro/docs/design/umbau-2026-10-24/design-kit/icons.svg`, nicht abwandeln;
  neue BLP-Symbole möglichst auch an PBP zurückgeben, damit der Satz einer bleibt.
- ~~D3 Seitenleiste~~ **entschieden:** einklappbar; Inhalt nutzt immer die volle verfügbare Breite; im Teilbild klappt die Leiste selbst ein (siehe A3).
- ~~D4 Handy-Menü~~ **entschieden:** ein ☰-Menü, das die Leiste aufklappt, Einstellungen inklusive.
- ~~D5 Modi~~ **entschieden:** Privat = Arbeitnehmer/Arbeitslose, private Steuererklärung (siehe Tabelle F); Kleinunternehmer, Selbstständig, Berater bleiben.
- D7 Die Bilder sind in Teal/Smaragd. Zu Petrol passen sie genau; bei Klarblau, Graphit und Nachtblau beim Umbau ansehen, ob sie noch stimmig wirken (nur prüfen, nicht ändern).
- ~~D10 Name des PWA-Klons~~ **entschieden (Klaus 2026-10-26):** **BookLedger Basic** (Repo `BookLedger-Basic`, https://lausiklauskn-png.github.io/BookLedger-Basic/), BLB; Datenbank-Endung `bookledgerbasic` (Vorschlag), geklont nach dem Design-Umbau. BookLedgerPro wird die native App.
- ~~D12 Prüfung~~ **entschieden:** eigene Scans aus Workflow PDF ohne Prüfung; Dateien von außen werden geprüft.
- D13 Verein: eigener Modus „Verein" später (nach Privat und Unternehmer-Modi)? Ehrenamt als Person ist schon in Privat.
- ~~D11 ELSTER-Recherche~~ **erledigt** (siehe G und Recherche-Datei).
- D14 ELSTER-Weg: (a) überall zuerst Ausfüllhilfe, (b) direktes Senden in Windows, (c) Android-Server ja/nein? Entwickler-Registrierung schon jetzt beantragen?
- ~~D6 Alter Schalter~~ **entschieden:** Der neue Modus ersetzt Einfach/Profi/Berater ganz.

## E. Reihenfolge (Klaus 2026-10-26)

**Privat kommt zuerst.** Kleinunternehmer, Selbstständig und Berater folgen erst, wenn Privat funktioniert.

1. **Design-Grundlage** (A1–A5): Themen Farbe × Hell/Dunkel, Strichsymbole (PBP-Satz), flache Knöpfe,
   Vollbild mit einklappbarer Leiste/☰-Menü, Schrift ohne Fehler. Modus-Schalter mit Privat als erstem Modus.
2. **Workflow-PDF-Einbindung** – ausdrücklich wichtigster Funktionspunkt: Dokumente aus Workflow PDF
   übernehmen und aus BLP heraus Workflow PDF zum Scannen öffnen (H2). Zuerst prüfen, welche Übergabe
   Workflow PDF Pro heute anbietet; Plan dafür vor dem Bau mit Klaus abstimmen.
3. **Haushaltsbuch** (H): Beleg-Eingang, automatisches Eintragen, Monatsübersicht.
4. **Steuer-Zuordnung Privat** inkl. Rentner, Jahresübersicht je Anlage.
5. **ELSTER** (G): nach Recherche-Ergebnis, eher in der nativen Pro-App.
6. Danach Kleinunternehmer → Selbstständig → Berater; PWA-Klon gemäß G.

Jeder Abschnitt: eigener PR, Bilder vorher/nachher, Schrift-Prüfung (A5), Cache-Bump in `sw.js`.
