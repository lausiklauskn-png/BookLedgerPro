# BLP Design-Sammlung (Stand 2026-10-26)

**Status: nur gesammelt, nichts umgebaut.** Plansitzung mit Klaus. Grundlage sind
Klaus' Vorgaben und echte Bildschirmfotos des aktuellen Stands (`main` 4ba49c8 +
PULS-Doku), aufgenommen lokal mit Chromium bei 390 px (Handy) und 1366 px (breit):
[`ist-2026-10-26/`](ist-2026-10-26/). Kein Gerätetest (Tablet/DeX) gemacht.

Leitsatz (Klaus): **BLP ist ein Arbeitswerkzeug, keine Vorführung.** Die Funktionen
sind modern; das Design soll es auch werden, angelehnt an moderne
Buchhaltungsprogramme.

---

## A. Klaus' Vorgaben (verbindlich für den Umbau)

| # | Vorgabe | Was das am Ist-Stand bedeutet |
|---|---|---|
| A1 | **Strichsymbole** statt Emojis bei den Symbolen | Navigation, Knöpfe, Tabellenaktionen und Statusanzeigen bekommen Strichsymbole (heute: nur Text). **Die vorhandenen 3D-Bilder bleiben** (Klaus 2026-10-26: eigens generiert, passen zu App und Farbe): Sperrbildschirm, 3 Onboarding-Bilder, 7 Leerzustände. Sie sind Illustrationen, keine Symbole. |
| A2 | **Knöpfe flach** halten, soweit am Handy bedienbar | Heute ca. 40–44 px sichtbar hoch (`.btn` padding .55rem), Eingabefelder ebenso. Ziel wie PBP: sichtbar ~28–32 px, unsichtbare Trefferfläche ≥ 44 px bei Touch. Formulare, Segment-Schalter, Tabellenaktionen mitziehen. |
| A3 | **Vollbild**, Platz optimal nutzen (präzisiert 2026-10-26) | Heute alles auf `--maxw: 880px` begrenzt und mittig, am breiten Schirm viel leer. Ziel: **volle Breite**, der Inhalt passt sich immer der verfügbaren Breite an. **Seitenleiste einklappbar** (auf Symbole); im **Teilbild** (geteilter Bildschirm, schmales Fenster) klappt sie **selbst** ein. Am Handy ein **☰-Menü**, das die Leiste aufklappt, Einstellungen inklusive. |
| A4 | **Themen = Farbe × Hell/Dunkel** (Klaus 2026-10-26: Hell/Dunkel bleibt und gilt für jede Farbe) | Zwei getrennte Schalter: **Farbe** (Blau · Graphit · Petrol) und **Helligkeit** (Hell · Dunkel · wie Gerät). Ergibt sechs Kombinationen, siehe Tabelle unten. Ersetzt die heutige Wahl System/Hell/Dunkel nicht, sondern ergänzt sie um die Farbe. |

### A5 Schrift ohne Fehler (Klaus 2026-10-26: „ist immer wieder aufgetaucht“)
Bei jeder Breite (Handy, Teilbild, Tablet, Vollbild, große Schrift im System) gilt:
- Keine abgeschnittenen Wörter, keine Buchstaben unter Rändern, nichts überlappt.
- Knopf- und Menübeschriftungen brechen nicht mitten im Wort und werden nicht zweizeilig gequetscht
  (heute z. B. „Jetzt sperren“ zweizeilig am Handy, Feldnamen „Einzelpreis (€)“ umgebrochen, USt-Auswahl abgeschnitten).
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

## B. Befunde am Ist-Stand (aus den Bildern)

**Rahmen / Navigation**
- B1 Elf Navigationspunkte ohne Symbole, ohne Gruppen. Am Handy eine waagerechte
  Laufleiste, rechts abgeschnitten („Auf…") – man sieht nicht, dass es weitergeht.
- B2 Kopfleiste am Handy: „Jetzt sperren" bricht in zwei Zeilen, Mandanten-Kennung
  drängt an den Namen. Vorschlag: Sperren als Schloss-Symbol.
- B3 Mandanten-Anzeige ist eine kryptische Kennung (`NQRQZq…`). Für Arbeit besser:
  Firmenname + Geschäftsjahr, Kennung nur im Tooltip/Einstellungen.
- B4 Hinweis „Speicher nicht als dauerhaft zugesichert" steht als breiter Balken
  dauerhaft oben und nimmt Platz. Wichtig (Durabilität ist Pflicht), aber kompakter:
  z. B. Statuspunkt in der Kopfleiste + Klick öffnet Hinweis; Balken nur bei „kritisch".

**Übersicht (Dashboard)**
- B5 Begrüßung „Willkommen bei BookLedgerPro" + Werbesatz „Buchhaltung, die mitdenkt …
  schön." wirkt wie Vorführung. Weg damit; Seite heißt einfach „Übersicht".
- B6 Neun gleich große Kacheln, alle 0 – keine Gewichtung. Modern: 3–4 Kennzahlen oben
  (Überschuss, Einnahmen, Ausgaben, USt-Zahllast) mit Zeitraum, darunter „Zu erledigen"
  (offene Entwürfe, unverbuchte Belege, offene Rechnungen) und letzte Buchungen.
- B7 GoBD-Audit-Karte gut, aber als kleiner Statuspunkt reicht es im Alltag.

**Journal / Formulare**
- B8 Formular „Neue Buchung" steht immer offen über der Liste und schiebt sie nach unten.
  Modern: Liste/Tabelle zuerst, „+ Buchung" öffnet ein Seitenfenster (rechts) bzw.
  am Handy ein Vollbild-Blatt.
- B9 Leere Tabellen: Bild bleibt (A1). Darüber trotzdem Tabellen-Kopfzeile und direkt eine passende Aktion („+ Buchung“), damit man gleich loslegen kann.
- B10 Auftrag am Handy: Positionszeile (Beschreibung/Menge/Preis/USt) viel zu eng,
  Feldnamen brechen um, USt-Auswahl abgeschnitten. Positionen am Handy untereinander
  (Karte je Position).

**Belege**
- B11 Zwei getrennte Karten (Text einfügen / Foto-Upload). Modern: ein **Beleg-Eingang**
  (Inbox) mit Ablegefläche, Kamera, Upload; danach Liste mit Status
  (neu → erkannt → gebucht) und Vorschau neben dem Buchungsvorschlag.

**Einstellungen**
- B12 Eine lange Seite ohne Gliederung (Modus, KI-Autonomie, Aussehen, Sprache,
  KI-Schlüssel, Backup …). Gliedern in Abschnitte/Reiter: Allgemein · Aussehen ·
  KI (EU) · Sicherheit & Backup · Firma.
- B13 Segment-Schalter „KI-Autonomie" sehr breit, am Handy zu lang.

**Sperrbildschirm / Einrichtung**
- B14 Sperrbildschirm: 3D-Bild bleibt (A1). Nur prüfen, dass es am Handy das Passwortfeld nicht unter den Rand schiebt.
- B15 Shamir-Schritt: Knopf heißt „Speichern", speichert aber nichts (geht nur weiter).
  Ehrlicher: „Weiter – ich habe die Teile notiert" plus „Kopieren"/„Drucken" je Teil.

**Texte (nebenbei gefunden, kein Design – aber falsch)**
- B16 Alte Texte nennen noch **Claude/Anthropic**, obwohl die KI auf Mistral/Google EU
  umgestellt ist: `docs.confirmAi` und `reports.taxAssistHint` (DE und EN) in
  `src/ui/i18n.js`. Muss beim Umbau korrigiert werden.

---

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
| **Privat** (entschieden 2026-10-26) | Arbeitnehmer, Arbeitslose – **private Einkommensteuererklärung**, kein Gewerbe. Andere Gesetze als Kleinunternehmer (EStG: Werbungskosten, Sonderausgaben, außergewöhnliche Belastungen, haushaltsnahe Dienstleistungen – kein UStG, keine EÜR, keine GoBD-Buchführungspflicht) | Belege sammeln und den Steuer-Kategorien zuordnen, Jahresübersicht für die Steuererklärung | alles Unternehmerische: USt, Journal/Soll-Haben, Konten-Rahmen, Aufträge, Kunden, Mitarbeiter, Kostenstellen, EÜR, DATEV. **Eigener fachlicher Bauabschnitt**, nicht nur Ausblenden |
| **Kleinunternehmer** (§ 19 UStG) | Nebengewerbe, kleine Selbstständige | Belege, Journal, Rechnungen/Aufträge, Kunden, EÜR | USt-Satz in Formularen (fest 0 % + Hinweis § 19), USt-Voranmeldung, Zahllast-Kachel, Mitarbeiter, Kostenstellen |
| **Selbstständig / Unternehmen** (regelbesteuert) | Freiberufler, GmbH-klein | alles für EÜR + USt-VA, Mitarbeiter, Kostenstellen | Mandanten-Wechsel, Berater-Export |
| **Berater** | betreut mehrere Mandanten | alles, dazu Mandantenwechsel, DATEV-Export, Prüfansichten | – |

Regeln dazu:
- F1 Ausblenden gilt für **Einstellungen, Navigation, Formularfelder und Kacheln** gleichermaßen.
- F2 Ausgeblendet heißt nicht gelöscht: Daten bleiben, beim Moduswechsel ist alles wieder da.
- F3 Ein kleiner Schalter „Alle Einstellungen zeigen" für Sonderfälle, damit nichts versteckt unerreichbar ist.
- F4 Moduswechsel mit kurzer Rückfrage, wenn er Steuerliches ändert (z. B. Kleinunternehmer → regelbesteuert).
- F5 Einstellungen ohnehin gliedern (siehe B12), dann bleibt je Modus nur eine kurze Seite.
- F6 Recht: Kleinunternehmer-Modus muss wirklich § 19 abbilden (keine USt ausweisen, Pflichthinweis
  auf Rechnungen, Umsatzgrenze beobachten). Das ist **Funktion, nicht nur Design** – eigener Bauabschnitt.

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
- ~~D6 Alter Schalter~~ **entschieden:** Der neue Modus ersetzt Einfach/Profi/Berater ganz.

## E. Nächste Schritte (wenn Klaus freigibt)
1. Offene Fragen D1–D4 klären, Sammlung ergänzen.
2. Danach Umbauplan in Abschnitten (Rahmen/Themen → Symbole → Knöpfe/Formulare →
   Seiten einzeln). Jeder Abschnitt mit Bildern vorher/nachher, Cache-Bump in `sw.js`.
