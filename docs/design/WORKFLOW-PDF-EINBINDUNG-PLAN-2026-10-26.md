# Workflow-PDF-Einbindung — Plan mit Varianten (Schritt 2, 2026-10-26)

**Status: Klaus hat entschieden (2026-10-26): V1 + V2 bauen · eigene Scans ohne Datei-Prüfung, aber mit OCR-Textprüfung · Workflow PDF darf für den Direktstart angefasst werden (PWA/Android/Windows gleich) · V4 später. Gebaut: `docs/WORKFLOW-PDF-EINBINDUNG.md`.** Brief: `docs/BRIEF_NACHFOLGE_2026-10-26_BAU-PRIVAT.md`,
Schritt 2 („wichtigster Funktionspunkt"). Sammlung H2 und D12.

## 1. Was Workflow PDF Pro heute übergeben kann (im Repo nachgesehen, Stand `10f7325`, 1.0.3)

Geprüft in `lausiklauskn-png/Workflow-PDF-Pro` (Android/Windows-Hülle um die PWA `Workflow-PDF`, Klon unter `upstream/`).

| Weg | Gibt es? | Wo im Code | Was ankommt |
|---|---|---|---|
| **Hinaus per Teilen** (Android-Teilen-Fenster) | **ja** | `native/native-files.js` (`navigator.share` → nativer `WorkflowFiles.share` mit FileProvider); Knöpfe „📤 Teilen …" in `upstream/workflow-pdf/assets/app.js` (Scan, Export, Übersetzung) | **eine oder mehrere Dateien**: PDF (`application/pdf`), HTML, Bilder-ZIP. Keine Zustellbestätigung („Zustellung an andere Apps wird nicht bestätigt"). |
| **OCR-Text im Scan-PDF** | **ja, wenn „Durchsuchbar" angehakt** | `upstream/workflow-pdf/assets/scanner.js` `pdfBauen()`: unsichtbare Textebene je Zeile (Tesseract auf dem Gerät, `s.ocr.zeilen` mit Lage/Sicherheit) | Textebene liegt **im PDF**; jeder PDF-Leser (auch BLPs pdf.js) kann sie auslesen. Produzent-Marke `Producer: Workfloh PDF`, `Creator: Workfloh PDF · Scannen`. Ausgabe „Kopie" = Seite als echter Text (kein Bild). |
| **OCR als eigene Datei** (JSON/Text neben dem PDF) | **nein** | `s.ocr.zeilen` existiert nur im Speicher; `window.__wfpdfScan` ist eine Prüf-Hilfe | — |
| **Hinein per Teilen / Öffnen** | ja | `AndroidManifest.xml`: `SEND`, `SEND_MULTIPLE`, `VIEW` für `application/pdf`, `image/*`, `application/json`; `native/native-incoming.js` | BLP → Workflow PDF: Bilder/PDFs lassen sich hinschicken |
| **Eigener Aufruf-Link** (z. B. „Scanner öffnen, danach zurück zu BLP") | **nein** | kein `android:scheme`, keine `?scan=1`-Auswertung; vorhandene Parameter nur `?geteilt`, `?rueck`, `?ue` (Übersetzer-Rückweg) | — |
| Paketname der Android-App | `de.familyprojekt.workflowpdf.pro` | `capacitor.config.json`, `android/app/build.gradle` | zum Öffnen aus einer anderen App |
| PWA-Fassung | `share_target` + `file_handlers` im Manifest, `./teilen-empfang` im `sw.js` | `upstream/workflow-pdf/manifest.webmanifest`, `sw.js` | Vorbild für BLPs eigenen Teilen-Empfang |

**Was BLP heute schon hat:** Belege einlesen (Datei, Ordner, Foto), pdf.js liest die Textebene eines PDFs
(`src/ai/kiVorbereitung.js`), Prüfung auf Knopfdruck (`src/domain/belegPruefung.js`, Prüfkern byte-1:1 aus Workflow
PDF), Foto → Scan-PDF über Workflow PDFs Blatterkennung (`src/core/scanPdf.js`, lädt `/Workflow-PDF/assets/…` von
github.io). **Kein** `share_target` im BLP-Manifest — BLP steht heute **nicht** in Androids Teilen-Liste.

**Folge:** Ein in Workflow PDF Pro gescanntes Dokument mit „Durchsuchbar" bringt seinen OCR-Text **schon heute im
PDF mit**. BLP muss ihn nur annehmen und lesen — Google Vision braucht es dafür nicht.

## 2. Varianten

### V1 — Teilen-Empfang in BLP (PWA), OCR-Text aus dem PDF lesen  — *empfohlen als erster Schritt*
- BLP bekommt wie Workflow PDF ein `share_target` (+ `file_handlers`) und im `sw.js` den Empfang `./teilen-empfang`;
  die App holt die Dateien ab und schickt sie in den vorhandenen Beleg-Eingang.
- Beim Einlesen liest BLP die **Textebene** des PDFs (pdf.js, schon da) → OCR-Text ohne Vision; fehlt sie, bleibt der
  bisherige Weg (Vision EU nach Bestätigung).
- **Eigener Scan ohne Prüfung (D12):** erkannt an der Marke `Producer: Workfloh PDF` + Textebene. ⚠ Ehrlich: die Marke
  ist kein Beweis — jedes Programm kann sie schreiben. Vorschlag: Marke → **Datei-Prüfung** (Schadcode/Format)
  überspringen, aber die billige **Text-Prüfung auf KI-Anweisungen** vor einem KI-Versand behalten (sie kostet nichts
  und schützt genau den Weg zur KI). Alle anderen Dateien: volle Prüfung wie heute.
- Bedienung: In Workflow PDF Pro „📤 Teilen …" → BookLedgerPro wählen → BLP öffnet sich mit dem Beleg im Eingang.
- Braucht: nur BLP-Änderungen. Funktioniert auf Android (installierte PWA) und Windows (Chrome „Teilen"/„Öffnen mit").
  Auf dem iPhone geht Web Share Target nicht (benannte Grenze).
- Aufwand: klein. Risiko: klein (Muster aus Workflow PDF übernommen).

### V2 — Aus BLP heraus Workflow PDF Pro zum Scannen öffnen (Android)
- Knopf „Mit Workflow PDF scannen" im Beleg-Eingang. Öffnet die App über ihren Paketnamen
  (`intent://…#Intent;package=de.familyprojekt.workflowpdf.pro;end` aus der PWA in Chrome; in der späteren nativen
  BLP-App direkt). Ist sie nicht installiert → Hinweis mit dem Download-Link (wie Private Brain Pro es macht).
- Der Rückweg ist **Teilen** (V1): Workflow PDF kennt keinen „Ergebnis zurückgeben"-Weg; der Nutzer tippt dort
  „Teilen" und wählt BLP. Android erlaubt keine Vorauswahl des Ziels.
- Optional kleine Änderung in Workflow PDF (Gleichstandsregel: PWA, Android, Windows): Parameter `?scan=1` startet
  den Scanner sofort, und „Durchsuchbar" ist bei diesem Aufruf vorbelegt — sonst kommt ein Scan ohne Textebene.
- Braucht: BLP (Knopf) + kleine Änderung in Workflow PDF für den Direktstart. Aufwand: klein.

### V3 — Gemeinsamer Ordner statt App-zu-App (Windows, Tablet mit Dateiordner)
- Workflow PDF speichert/lädt den Scan in einen Ordner (Herunterladen bzw. Tresor-Ordner); BLP liest ihn mit
  „📁 Ganzen Ordner einlesen" (gibt es). Mit V1-Marke gilt dieselbe Prüfregel.
- Kein Code für die Verbindung nötig, aber zwei Handgriffe für den Nutzer. Sinnvoll als Rückfall auf dem PC.

### V4 — Echte Brücke mit OCR-Daten (später, für Haushaltsbuch-Einzelposten)
- Workflow PDF Pro bekommt eine Ausgabe „für BookLedgerPro": neben dem PDF eine zweite Datei (JSON) mit den OCR-Zeilen
  (Text, Lage, Sicherheit, Seite) und einer Herkunftsangabe; geteilt als zwei Dateien (`SEND_MULTIPLE`). BLP nimmt beide
  und kann Einzelposten eines Kassenbons zeilengenau zuordnen (Sammlung H: „ggf. Einzelposten").
- Braucht einen **Datenvertrag** (Format, Version) in beiden Repos (wie `docs/UEBERNAHME_TOMY.md`), Änderung in
  Workflow PDF Pro (alle Fassungen), später die native BLP-App. Aufwand: mittel. Lohnt erst, wenn Schritt 3
  Einzelposten wirklich braucht; für Händler/Datum/Summe reicht die Textebene (V1).

## 3. Empfehlung
**V1 jetzt bauen, V2 dazu** (ein Knopf + Direktstart-Parameter), **V3 dokumentieren** (Rückfall PC), **V4 nach
Schritt 3 entscheiden**. Reihenfolge innerhalb des PRs: Teilen-Empfang → Textebene lesen → Marke/Prüfregel D12 →
Knopf „Mit Workflow PDF scannen" → Probe im Browser (Teilen simuliert über `./teilen-empfang`-POST, Marke, Prüfregel).

## 4. Fragen an Klaus (bitte beantworten, dann baue ich)
1. **V1 + V2 so bauen?** Oder nur V1?
2. **Prüfregel D12:** Marke „Workfloh PDF" = eigener Scan → Datei-Prüfung aus, Text-Prüfung vor KI-Versand **an**
   (mein Vorschlag) — oder wirklich gar keine Prüfung?
3. **Workflow PDF anfassen** (Direktstart `?scan=1` mit „Durchsuchbar" vorbelegt, Gleichstand PWA/Android/Windows)
   — ja, oder vorerst nur BLP ändern?
4. V4 (JSON mit OCR-Zeilen) jetzt schon vormerken oder erst nach Schritt 3?

## Nicht geprüft
- Kein Gerät: Teilen-Fenster, installierte PWA in Androids Teilen-Liste, Intent-Start aus Chrome. Die Aussagen oben
  stammen aus dem Code beider Repos, nicht aus einem Gerätetest.
