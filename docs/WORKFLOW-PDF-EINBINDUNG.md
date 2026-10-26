# Workflow-PDF-Einbindung (Bau-Brief 2026-10-26, Schritt 2 — V1 + V2)

**Stand: gebaut, im Chromium der Sitzung gemessen, am Gerät (Tablet/Handy) nicht geprüft.**
Plan und Klaus' Antworten: `docs/design/WORKFLOW-PDF-EINBINDUNG-PLAN-2026-10-26.md`. Klaus (2026-10-26): V1 + V2 bauen;
eigene Scans ohne Datei-Prüfung, **aber mit** OCR-Textprüfung; Workflow PDF darf für den Direktstart angefasst werden
(PWA, Android, Windows gleich).

## Bedienung

**Weg 1 — aus Workflow PDF teilen (V1):** In Workflow PDF Pro (oder der Web-Fassung, installiert) ein Dokument scannen,
„Durchsuchbar" anhaken, 📤 Teilen → **BookLedgerPro** wählen. BookLedgerPro öffnet sich (nach dem Entsperren) auf
„Belege" und legt die Dateien verschlüsselt ab; die Statuszeile sagt „N Datei(en) aus „Teilen" übernommen".
Dasselbe gilt für jedes PDF und Bild, das eine andere App teilt, und für „Öffnen mit" am PC (Chrome).

**Weg 2 — aus BookLedgerPro heraus scannen (V2):** Belege → Beleg-Archiv → **„Mit Workflow PDF scannen"**.
Android: öffnet Workflow PDF Pro (wenn sie den Link annimmt), sonst die Web-Fassung; am PC die Web-Fassung in einem
neuen Fenster. Dort geht der Scanner sofort auf, „Durchsuchbar" ist vorbelegt, ein Hinweis nennt den Rückweg:
nach „PDF erstellen" 📤 Teilen → BookLedgerPro (Android) oder das PDF herunterladen und mit „Mehrere Belege hochladen"
einlesen (PC).

**Eigener Scan (Marke):** Ein PDF mit dem Kopf „Producer: Workfloh PDF · Creator: Workfloh PDF · Scannen" gilt als
eigener Scan: in der Liste steht „📷 Eigener Scan (Workflow PDF) · ohne Prüfung", er zählt nicht zu „Alle ungeprüften
prüfen", der Halt „noch nie geprüft" entfällt bei der Texterkennung. Ein Tipp auf die Marke prüft ihn trotzdem von Hand;
das Ergebnis gilt dann.

**Textebene statt Vision:** „Text aus dem PDF übernehmen" (ohne Vision-Schlüssel) bzw. „Texterkennung" (mit) liest
zuerst die **Textebene** des PDFs mit pdf.js — bei einem Workflow-PDF-Scan mit „Durchsuchbar" ist das der dort erkannte
Text. Nichts wird gezeichnet, nichts gesendet. Erst wenn das PDF keinen lesbaren Text trägt (unter 40 Buchstaben), geht
es den bisherigen Weg (Reinigung → Google Vision EU nach Bestätigung); ohne Vision-Schlüssel sagt die App das.
Gilt für jedes PDF mit Textebene, auch Rechnungen aus einem Programm.

**Textprüfung bleibt:** Der Text (aus Textebene oder OCR) geht wie bisher durch die Prüfung auf Anweisungen an eine KI
(`kiTextFreigabe`): mit Mistral-Schlüssel hält die App einmal an („Ohne diese Zeilen" / „Trotzdem" / „Nur auf dem
Gerät"). Das gilt ausdrücklich auch für eigene Scans (Klaus 2026-10-26).

## Technik
- `manifest.webmanifest`: `share_target` (POST multipart, Feld `dateien`, PDF + Bilder) und `file_handlers`;
  `sw.js`: `teilenEmpfangen()` legt die Dateien im Vorrat `blpr-geteilt` ab (überlebt ein neues `CACHE_VERSION`) und
  leitet auf `./?geteilt=1|0|fehler`; `index.html` meldet den Worker im Kopf an (405-Lehre aus Workflow PDF).
- `src/domain/workflowPdf.js` (reine Logik, node-getestet): Marke, Herkunft, Textebene → Text, Teilen-Parameter,
  Adressen (`intent://` mit Rückfall). `src/domain/teilenEmpfang.js`: Vorrat abholen. `src/ai/kiVorbereitung.js`:
  `pdfKopf`, `pdfTextebene`. `src/ui/shell.js`: `?geteilt` und `launchQueue` merken → Belege. `src/ui/views/documents.js`:
  `dateienEinlesen` (Mehrfach, Ordner, Teilen), Herkunft beim Ablegen, Stand „eigen", Textebene zuerst, Knopf.
- Workflow PDF (PWA `lausiklauskn-png/Workflow-PDF`, 1.1.1, Cache v106): `./?scan=1&von=<App>` öffnet den Scanner
  sofort mit „Durchsuchbar" (nur für diesen Scan), putzt die Adresse, zeigt den Rückweg. `tests/direktstart.mjs` dort.
  Workflow PDF Pro (Android/Windows) bekommt denselben Kern über `upstream/` (Gleichstand).

## Nachweise
- `node tests/run.mjs` **2368 bestanden, 0 fehlgeschlagen** (+22: Marke, Textebene, Parameter, Adressen, Prüfstand
  „eigen", Manifest ⟷ Worker ⟷ Konstanten, Vorrat, i18n, Verdrahtung).
- `node tests/smoke_teilen.mjs` **26 grün, 0 ROT** (echter sw.js, echter POST wie von Android, Vorrat, Abholen; echte
  Belegseite mit Tresor: drei geteilte PDFs, Herkunft/Quelle, Stand „eigen"/„offen", Zähler „Alle ungeprüften", Knopf,
  Textebene ohne Vision-Anfrage, Halt beim fremden PDF, Textprüfung hält beim eigenen Scan mit KI-Anweisung an).
- `node tests/smoke_design.mjs` 90 grün (unverändert). Workflow PDF: `direktstart` 16, `teilen-empfang` 23,
  `version` 12, `sprache` 49, `syntax` 75, `scan` 119, `bibliothek` 90, `e2e` 78 — alle 0 ROT (Chromium des Behälters);
  Gegenprobe Direktstart: Vorbelegung entfernt → 2 rote Zeilen mit Namen.
- Cache `sw.js` v257.

## Benannte Grenzen / nicht geprüft
- **Kein Gerät:** ob Android die installierte BLP-PWA in die Teilen-Liste nimmt (sie muss nach diesem Stand neu
  installiert werden, damit Android das Manifest liest), ob der `intent://`-Link die Pro-App öffnet (dafür muss
  Workflow PDF Pro https-Links ihrer Adresse annehmen — App-Link, in diesem Schritt nicht gebaut; Chrome fällt sonst auf
  die Web-Fassung zurück, der Scan geht dort genauso), echtes Teilen am Tablet.
- Die Marke „Workfloh PDF" ist kein Beweis: jedes Programm kann sie schreiben. Sie entscheidet nur über die
  Datei-Prüfung; die Textprüfung vor der KI bleibt immer.
- Die Textebene enthält auch versteckten Text (weiß, winzig) — genau deshalb bleibt die Textprüfung; eine
  Sichtbarkeitsprüfung wie bei der Reinigung vor Vision läuft auf diesem Weg nicht (benannte Grenze).
- Windows: Workflow PDF Pro (Tauri) hat keinen Link-Empfang; der Knopf öffnet die Web-Fassung. Rückweg am PC über
  Herunterladen + Hochladen.
- iPhone: Web Share Target gibt es dort nicht.
