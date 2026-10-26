# 📷 Scanner-Kern von Workflow PDF in BookLedgerPro (Klaus 2026-10-26)

Klaus: „Okay, der Scannerkern wird mit eingebaut. Wichtig nur, dass einfotografierte Bilder auch sofort in PDFs
umgewandelt werden können. Per Klick … Seitenpunkte festgelegt werden können oder das automatische Bestimmen der
Seite … Auslesen der Dateien per OCR und das entsprechende Vektorisieren … Suchen über Wortsuche und über
Bedeutungssuche." Dazu am selben Tag: „Auch die Qualität der eingefügten Bilder und danach erzeugten PDFs sollte
angepasst werden können, je nach Größe oder je nach Qualität der Vorlage."

## Bedienung

- **Belege → „📷 Scannen"** (erster Knopf der Knopfzeile, vor „Foto aufnehmen"). Es öffnet sich der Scanner von
  Workflow PDF über der App: Foto aufnehmen oder Bilder wählen → Blatt wird gefunden (Scanic-Modell + Kanten +
  blatt.js, „sicher" nur bei Übereinstimmung, sonst „bitte prüfen") → Ecken ziehen (Lupe) → gerade ziehen (A4 · A5 · A6 ·
  US Letter · wie das Blatt) → drehen → Filter, Helligkeit, Kontrast, Schärfe → Texterkennung (Tesseract auf dem Gerät,
  DE/EN/RU) → **„Als Beleg ablegen"**.
- **Das PDF ist ein eigener Scan** (Marke `Producer: Workfloh PDF`): Stand „eigen", keine Datei-Prüfung, von Hand prüfbar
  (wie beim Teilen aus Workflow PDF, `docs/WORKFLOW-PDF-EINBINDUNG.md`). **„Durchsuchbar" ist im BLP-Scanner immer an**
  — die Textebene ist der Zweck: der erkannte Text wird sofort verschlüsselt am Beleg gemerkt (`textMerken`), die
  Wortsuche findet ihn gleich, die Bedeutungssuche ordnet ihn ein, sobald sie an ist. Nichts verlässt das Gerät.
- **Scan-Qualität** (Einstellungen → „Scan-Qualität (Fotos → PDF)"): **Hoch** (Vorgabe, 300 dpi · 92 %, der gemessene
  Weg vom 2026-10-14) · **Nach Vorlage** (so scharf, wie das Foto es hergibt: 150–300 dpi, nie hochgerechnet) · **Normal**
  (200 dpi) · **Klein** (150 dpi, für viele Belege). Gilt für Fotos, die beim Ablegen still zum Scan-PDF werden
  (`fotoZuScan`), und als Vorgabe im Scanner-Fenster (dort je Scan im Feld „Qualität" änderbar; der Kern kennt
  hoch 200 · normal 150 · klein 110 dpi, BLPs „Hoch"/„Nach Vorlage" nehmen dort „Hoch").
- Der bisherige Weg bleibt: „Foto aufnehmen"/„Datei wählen" legt ein Foto weiter still als Scan-PDF ab (Blatt
  automatisch, Original verschlüsselt dabei), „Mit Workflow PDF scannen" öffnet weiter die Workflow-PDF-App.

## Bauweise

- **Byte-1:1 aus Workflow PDF** (`lausiklauskn-png/Workflow-PDF`, Commit in `assets/wfpdf/HERKUNFT.json`):
  `assets/wfpdf/scanner.js`, `scan-bild.js`, `blatt.js`, `zip.js`, `pdf-lib.min.js`, `fontkit.umd.min.js`,
  `fonts/NotoSans-Regular.ttf` (+ Lizenzen) und `vendor/scanic/` (Modell + ORT-Wasm). Kopiert mit
  `node tools/wfpdf-nachziehen.mjs` (Klon daneben, `WFPDF_KLON`), Pins je Datei; `tests/run.mjs` prüft SHA-256 und dass
  die Pins **dieselben** sind wie in Mein-WorkFloh (`scripts/wfpdf_kanon.mjs`). **Nie von Hand ändern** — in Workflow
  PDF pflegen, hier neu kopieren. Tesseract liegt schon unter `vendor/tesseract/` (byte-gleich mit Workflow PDF).
- **BLP-eigen:** `assets/wfpdf/scanner.css` (nach Mein-WorkFloh, BLP-Tokens umgelenkt: `--line`, `--ink`, `--accent-d` …;
  Scanner z 100000 über allem, Dialoge darüber) · `src/ui/scanner.js` (Klebstoff: `scannen(opt)` öffnet den Kern mit
  denselben Rückrufen wie Workflow PDF — `toast`, `dialog`, `frage`, `fortschritt`, `laden`; `ablegen: null`; `fertig`
  macht aus den Bytes eine `File` und gibt sie an `dateienEinlesen(…, { quelle: 'scanner' })`) · `src/core/scanPdf.js`
  (`scannerLaden` lädt pdf-lib, zip, blatt, scan-bild, scanner **lokal** und setzt `pfade({vendor, scanic, ocr})`;
  `scanStufe(qualitaet, langeKantePx)` ist die reine Rechnung der Qualität).
- **Vorrat:** Kern und `scanner.css` in der Schale (`sw.js` v265); pdf-lib, fontkit, Noto, Scanic und Tesseract legt der
  Worker beim ersten Scannen ab (zusammen ~27 MB, nicht im Installations-Vorrat).

## Beweis (2026-10-26, Chromium im Behälter)

- `node tests/run.mjs` **2502 bestanden · 0 fehlgeschlagen** (+21: Pins, Pfade, Klebstoff, Verdrahtung, Scan-Qualität).
- `node tests/smoke_scanner.mjs` **13 grün · 0 ROT**: echter Kern, echtes Scanic-Modell, echter Tesseract; ein
  erfundenes Foto „RECHNUNG 4711 · 128,50 EUR" → „📷 Scannen" → „Als Beleg ablegen" → ein Beleg, Stand „eigen",
  Text am Beleg (verschlüsselt), Wortsuche „4711" mit Fundstelle, keine Skriptfehler.
- Gegenprobe (Wegwerf-Kopie, von Hand): „Durchsuchbar" nicht gesetzt → 5 ROT · Text eigener Scans nicht gemerkt → 4 ROT ·
  „Nach Vorlage" rechnet doch hoch → 2 ROT · ein Byte in `scan-bild.js` → Pin ROT. Jede Sabotage mit eigener Zeile.
- `smoke_design` 90 · `smoke_teilen` 26 · `smoke_belegsuche` 18 · `smoke_frage` 16 · `smoke_mikro` 19 · `smoke_apps` 19,
  alle 0 ROT. `smoke_belege` 46 grün · 14 ROT — **dieselben 14 Zeilen sind auf `main` rot** (Abschnitt D „Texterkennung:
  auffällig → gereinigt", in diesem Behälter; nicht von diesem Umbau berührt, nicht untersucht).

## ⚠ Grenzen, benannt

- Am Tablet nicht gemessen: Kamera, Zeit und Speicher des Scanic-Modells und von Tesseract, echte Belege.
- Die Textebene eines Scans ist die Texterkennung — jedes Wort wird gemerkt, auch wenn Tesseract sich irrt; „Text aus
  dem PDF übernehmen" liest sie noch einmal, Vision (EU) bleibt der Weg für schwierige Belege.
- Die Qualitätsstufen 300/200/150 dpi sind gewählt; gemessen ist nur „Hoch" (Sage, 20 blasse Zeilen, 0 falsch gelesen).
- Der Kern merkt sich Filter/Format/Sprache in `localStorage` `wfpdf_scan_v1` — unverschlüsselt, keine Belegdaten.
- Gescannte Seiten kommen als Bild + unsichtbarer Text ins PDF; der Text ist nicht markierbar wie in einem Text-PDF.
