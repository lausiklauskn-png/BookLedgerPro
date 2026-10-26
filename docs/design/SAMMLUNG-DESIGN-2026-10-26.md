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
| A1 | **Strichsymbole** statt Bilder und Emojis | Alle 3D-Bilder raus: Sperrbildschirm-Hero, 3 Onboarding-Bilder, 7 Leerzustände (Buch, Klemmbrett, Diagramm, Kugel …). Leerzustand = Strichsymbol + kurzer Satz + passende Aktion. Navigation und Knöpfe bekommen Strichsymbole (heute: nur Text). |
| A2 | **Knöpfe flach** halten, soweit am Handy bedienbar | Heute ca. 40–44 px sichtbar hoch (`.btn` padding .55rem), Eingabefelder ebenso. Ziel wie PBP: sichtbar ~28–32 px, unsichtbare Trefferfläche ≥ 44 px bei Touch. Formulare, Segment-Schalter, Tabellenaktionen mitziehen. |
| A3 | **Vollbild**, Platz optimal nutzen | Heute ist alles auf `--maxw: 880px` begrenzt und mittig: am breiten Schirm bleibt links/rechts viel leer (siehe `wide-*.png`). Ziel: volle Breite, Seitenleiste links fest, Inhalt füllt den Rest; Tabellen nutzen die Breite. |
| A4 | **Themenwahl**: Hell, Dunkel und die vier Themen aus Private Brain Pro (1.0.38) | Heute nur System/Hell/Dunkel in Teal. Übernehmen: **Klarblau** (`#2563eb` auf `#f6f8fc`), **Graphit** (`#475569`), **Petrol** (`#0f766e`, entspricht dem heutigen BLP-Teal), **Nachtblau** (dunkel, `#7ca7ff` auf `#111827`). Quelle: `Privat-Brain-Pro/native/design-tokens.css`, Namen DE/EN in `native/native-theme.js`. Offen: siehe D1. |

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
- B9 Leere Tabellen zeigen große Bilder statt Kopfzeile + kurzem Satz.
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
- B14 Großes 3D-Bild + Mycel-Hintergrund. Ruhiger: Logo-Strichsymbol, Formular, fertig.
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

## D. Offene Fragen an Klaus

- D1 **Themen:** Sechs Einträge (Hell, Dunkel + Klarblau, Graphit, Petrol, Nachtblau)
  oder genau die vier PBP-Themen, bei denen *Klarblau* = Hell und *Nachtblau* = Dunkel ist?
  Petrol entspricht schon fast dem heutigen BLP-Hell. Vorschlag: **die vier PBP-Themen**
  plus „Wie System" (hell → Klarblau, dunkel → Nachtblau) – dann gleich wie PBP.
- D2 Soll BLP den PBP-Symbolsatz **gemeinsam** nutzen (eine Quelle, kopiert wie bei
  Sage-Modulen) oder eine eigene Kopie, die BLP-Symbole ergänzt?
- D3 Seitenleiste am breiten Schirm: dauerhaft mit Namen, oder einklappbar auf Symbole?
- D4 Handy: untere Leiste (Hauptwege) oder ☰-Menü wie bei PBP?

## E. Nächste Schritte (wenn Klaus freigibt)
1. Offene Fragen D1–D4 klären, Sammlung ergänzen.
2. Danach Umbauplan in Abschnitten (Rahmen/Themen → Symbole → Knöpfe/Formulare →
   Seiten einzeln). Jeder Abschnitt mit Bildern vorher/nachher, Cache-Bump in `sw.js`.
