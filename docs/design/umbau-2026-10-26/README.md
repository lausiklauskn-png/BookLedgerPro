# Design-Grundlage (Schritt 1 des Bau-Briefs 2026-10-26)

**Stand: gebaut, im Chromium der Sitzung gemessen, am Gerät (Tablet/Handy/DeX) nicht geprüft.**
Grundlage: `docs/design/SAMMLUNG-DESIGN-2026-10-26.md` (Klaus' Entscheidungen A1–A5, B, F) und
`docs/BRIEF_NACHFOLGE_2026-10-26_BAU-PRIVAT.md`, Schritt 1.

## Was sich ändert (Bedienung)

### Themen: Farbe × Helligkeit (A4)
- Zwei Schalter: **Farbe** (Blau · Graphit · Petrol) und **Helligkeit** (Wie Gerät · Hell · Dunkel). Sechs Themen:
  Klarblau · Nachtblau · Graphit · Nachtgraphit (neu) · Petrol · Nachtpetrol (= bisheriges BLP-Dunkel).
- Bedienung: **Palette-Knopf** in der Kopfleiste (öffnet die Wahl als kleines Fenster) und derselbe Abschnitt
  „Erscheinungsbild" in den Einstellungen.
- **Start wie Private Brain Pro:** ohne gespeicherte Wahl Blau, Helligkeit wie das Gerät. Danach bleibt immer die
  **letzte Wahl**, auch nach Neustart und Update. Sie liegt verschlüsselt im Tresor (Einstellungen) **und** als reine
  Farb-/Helligkeitsangabe im `localStorage` (`blpr_thema`), damit schon Deckblatt und Sperrbildschirm im gewählten
  Thema stehen und nichts aufblitzt (`index.html` liest sie vor dem Stylesheet).
- Wer bisher nur Hell/Dunkel gewählt hatte, behält die Helligkeit und bekommt die Farbe Blau (Sammlung A4, Hinweis).
- **Nachtpetrol-Hauptknopf:** `#0f766e` mit weißer Schrift (5,5 : 1), Hover `#0b5a54` (Klaus 2026-10-26). Das helle
  `#2dd4bf` bleibt für Akzente (aktiver Menüpunkt, Fokus).
- Kontraste gemessen (WCAG, alle sechs Themen): Text ≥ 14 : 1, gedämpfter Text ≥ 5,5 : 1, Akzent auf Grund ≥ 4,8 : 1,
  Schrift auf dem Hauptknopf ≥ 5,1 : 1, Hauptknopf gegen Fläche ≥ 3,1 : 1.

### Strichsymbole (A1, D2)
- `assets/pb-icons.svg` ist **byte-1:1** `Privat-Brain-Pro/docs/design/umbau-2026-10-24/design-kit/icons.svg`
  (SHA-256 `a75e7c8f…ea2e`, in `tests/run.mjs` genagelt — nie hier abwandeln).
- `assets/blp-icons.svg`: 35 BLP-Fachsymbole im selben Stil (24 × 24, Strich 1,75): Übersicht, Journal, Beleg, Konto,
  Kasse, Anlagen, Verbindlichkeit, Angebot, Auftrag, Shop, Waage, Kunde, Team, Lohn, Diagramm, Bericht, Mycel,
  Geheim-Fach, Paragraf, Hilfe, Prüfung, Festschreiben, Storno, Kamera, Euro, Haus, Steuer, Mandant, Palette, Sonne,
  Mond, Gerät, Ein-/Ausklappen, Neu. Möglichst an PBP zurückgeben, damit der Satz einer bleibt.
- `src/ui/icons.js` hängt beide Sprites einmal versteckt ein; jedes Symbol ist `<svg><use href="#id"/></svg>`.
  Symbol + sichtbarer Name gehören zusammen (eingeklappt steht der Name im `title`). **Die 3D-Bilder bleiben.**

### Kopfleiste ohne Rätsel (Klaus 2026-10-26, Bild vom Tablet)
- Die Pille mit der Tresor-Kennung („LCxGYb7e") ist weg: sie erklärte nichts. Nur bei **mehr als einem Mandanten** und
  vorhandenem Namen steht dort „Mandant: Name" mit Symbol — dann sagt sie, welcher offen ist. Die Kennung steht
  weiterhin auf der Übersicht in der GoBD-Karte („Aktive Identität"), weil sie Sicherungen zuordnet.

### Flache Knöpfe (A2)
- Sichtbar ~30 px (`--control-h`), kein Schatten, Symbol + Name. Bei Touch (`pointer: coarse`) legt ein unsichtbares
  `::before` 7 px über und unter Knöpfe, Segmente und Menüpunkte → ≥ 44 px Trefferfläche, ohne Platz zu kosten.
- Eingabefelder und Auswahlfelder ebenso ~30 px; Karten ohne Schatten, kleinere Radien.

### Vollbild, Seitenleiste, ☰ (A3, C1, B3)
- Keine 1200-px-Grenze mehr: der Inhalt nutzt die ganze Breite.
- **Seitenleiste mit Gruppen:** Übersicht · **Buchen** (Belege, Journal, Kassenbuch, Konten, Anlagen,
  Verbindlichkeiten) · **Verkauf** (Angebote, Aufträge, Kunden, Shop-Übernahme, Nachkalkulation) · **Team**
  (Mitarbeiter, Lohn) · **Auswerten** (Auswertung, Berichte) · **Netz** (Mycel-Netz, SBKIM-Suche) · **Weiteres**
  (Geheim-Fach, Recht & Doku, Anleitung, Selbsttest, Über) · Einstellungen. Eine Gruppe ohne sichtbare Punkte
  verschwindet samt Überschrift.
- **Einklappen** auf Symbole über den Knopf unten in der Leiste (Wahl wird gemerkt, `blpr_leiste`). Im **Teilbild**
  (Fenster bis 1024 px) klappt sie selbst ein, darüber selbst auf — solange nicht von Hand gestellt.
- **Handy (bis 640 px):** ☰ öffnet die Leiste als Schublade von links mit allen Namen, Einstellungen inklusive;
  Tipp auf einen Punkt oder neben die Schublade schließt sie.
- **Schwebende Mycel-/Siegel-Leisten verdecken nichts:** Inhalt und Leiste halten unten 76 px frei (`--leisten-platz`).

### Schrift ohne Fehler (A5)
- Automatische Überlauf-Prüfung `tests/smoke_design.mjs`: 320 · 390 · 768 · 1024 · 1366 px × 100 % / 200 % Schrift ×
  Übersicht, Belege, Journal, Einstellungen (+ Schublade). Fehler = Text breiter als sein Kasten, etwas läuft über den
  rechten Rand, die Seite scrollt waagerecht, ein Auswahlfeld schneidet seinen gewählten Eintrag ab, eine Überschrift
  rutscht unter die Kopfleiste. **Ergebnis: 0 Fehler** (`fotos/ueberlauf-befunde.txt`).
- Dafür geändert: Kopfleiste bricht um und zeigt bei wenig Platz (auch bei großer Schrift, Behälter-Abfrage in rem)
  nur Lampen-Punkte und das Sperren-Symbol; Raster in rem statt px (`minmax(min(100%, …rem), 1fr)`); Journal-Spalten
  breiter (Befund B2 „0400 · Betriebsau…" behoben); Eingaben nie breiter als ihr Kasten; Überschriften brechen ein
  zu langes Einzelwort als letzten Ausweg; lange Knopfwörter tragen weiche Trennstellen (Klein­unternehmer,
  Selbst­ständig, Fest­geschrieben, Schnell­erfassung, Nach­kalkulation, Verbind­lichkeiten, Ein­stellungen,
  Pseudo­nymisieren, Wieder­herstellen); „Extern (Steuerberater / Programm)" mit Leerzeichen um den Schrägstrich.
- ⚠ **Benannte Grenze:** Bei 200 % Schrift auf 320/390 px kann ein Auswahlfeld, das schon die ganze Zeile einnimmt,
  einen Eintrag wie „0400 · Betriebsausstattung" oder „Mistral Small (günstig, EU)" nicht vollständig zeigen — die
  Schrift ist dann breiter als die Zeile; das Feld selbst steht richtig. Die Probe meldet diese Fälle als Grenze, nicht
  als Fehler. Abhilfe später: kürzere Anzeigenamen oder eigene Auswahlliste statt `<select>`.

### Modus-Schalter (F): Privat · Kleinunternehmer · Selbstständig · Berater
- Ersetzt Einfach/Profi/Berater **und** Firma/Privat/Verein ganz (D6). Alte Einstellungen werden beim Laden
  nachgezogen, nichts geht verloren (F2): privat → Privat · firma + Berater → Berater · firma + § 19 → Kleinunternehmer ·
  sonst → Selbstständig · verein → bleibt als Altwert wählbar, solange gesetzt (D13 offen).
- Wirkung (`src/domain/nutzungsmodus.js`, node-getestet):

  | Modus | Menü | Formulare/Kacheln | Einstellungen |
  |---|---|---|---|
  | **Privat** | Übersicht, Belege, Geheim-Fach, Recht & Doku, Anleitung, Selbsttest, Über, Einstellungen | kein Journal, keine USt, keine Rechnungen/Mahnungen/Anlagen/Mitarbeiter/Verbindlichkeiten/Export/Mandanten | ohne § 19, Gewinnermittlung, Rechnungsstelle, Firmenprofil, DATEV, Wirtschaftsjahr, Partner-App, Buchungssperre, Mandanten |
  | **Kleinunternehmer** | ohne Mitarbeiter, Lohn | keine USt (§ 19 fest), keine Mitarbeiter/Kostenstellen, kein Berater-Export/Mandanten | ohne § 19-Schalter (fest), Gewinnermittlung, DATEV, Mandanten |
  | **Selbstständig** | alles | kein Berater-Export, keine Mandanten | ohne § 19-Schalter (regelbesteuert fest), DATEV, Mandanten |
  | **Berater** | alles | alles | alles (§ 19 als eigene Einstellung) |

- **F3** „Alle Einstellungen zeigen" holt die ausgeblendeten Abschnitte zurück. **F4:** Wechsel, der § 19 ändert
  (Kleinunternehmer ↔ Selbstständig), fragt kurz nach.
- Einrichtung: statt der § 19-Frage kommt die **Modus-Frage**; Kleinunternehmer setzt § 19, Selbstständig nimmt es
  weg, Berater bekommt die § 19-Frage danach, Privat überspringt die Rechnungsstelle. Der Shamir-Knopf heißt jetzt
  „Anteile gesichert – weiter" statt „Speichern" (B7). Das Deckblatt nennt „Privat" statt „Laien" (B8).
- ⚠ **Ehrlich:** Im Modus Privat sind heute Belege sammeln, Geheim-Fach und Anleitung da; Haushaltsbuch und
  Steuer-Zuordnung sind Schritt 3 und 4 des Briefs. Ein Hinweis in den Einstellungen sagt das.

## Nachweise
- `node tests/run.mjs` — **2346 bestanden, 0 fehlgeschlagen** (neu: Modus-Werte/Migration/§ 19-Wirkung,
  Ansichten-/Feature-/Einstellungs-Gating, Themen-Logik, Symbol-Pin und -Vollständigkeit, Gruppen decken alle 24
  Ansichten genau einmal, Vorrat, i18n DE/EN).
- `node tests/smoke_design.mjs` — **89 grün, 0 ROT** (echte Shell mit echtem Tresor/IndexedDB; Leiste, Teilbild,
  Schublade, sechs Themen samt Merkzettel und `index.html` vor dem Entsperren, Palette-Knopf, Modus-Schalter mit
  Menü-/Einstellungs-Kürzung und F3, A5-Überlauf 5 × 2 × 4 Ansichten, Einrichtung im echten `index.html` bis zur
  Shell im Modus Privat). `FOTOS=1` legt die Bilder unter `fotos/` ab.
- Cache `sw.js` v255 → **v256**; neue Dateien im Vorrat.

## Fotos (`fotos/`, Chromium der Sitzung)
`thema-<name>-1366.png` (sechs Themen) · `<ansicht>-<breite>-<schrift>.png` für dashboard/documents/journal/settings
bei 320/390/768/1024/1366 px und 100/200 % · `schublade-390-*.png` · `phone-390-schublade.png` ·
`privat-uebersicht-1366.png`, `privat-einstellungen-1366.png` · `einrichtung-shamir/-modus/-fertig-privat-1024.png` ·
`deckblatt-nachtpetrol-1366.png`.

## Nicht geprüft / offen
- Kein Gerät: Tablet, Handy, DeX, Touch-Halo nur per CSS-Regel, nicht gefühlt.
- D7 (3D-Bilder bei Klarblau/Graphit/Nachtblau): angesehen in den Themenfotos; die teal/smaragdfarbenen Bilder stehen
  neben Blau und Graphit sichtbar „grüner" als der Akzent — Klaus entscheidet, ob das stört (nur Prüfen, nicht Ändern).
- Die Lampen-Leiste (Modul 17) und der Mycel-Knopf (Modul 23) sind Kanon-Module und wurden nicht angefasst; sie
  tragen weiterhin ihr eigenes dunkles Aussehen in allen Themen.
- Deckblatt (`intro.js`) und Sperrbildschirm tragen die Themenfarben, aber noch ihre bisherigen Knopfgrößen; die
  Überlauf-Probe deckt sie nicht ab (nur die Einrichtung funktional).
