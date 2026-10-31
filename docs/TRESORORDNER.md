# Tresorordner in BookLedgerPro (Schritt C + C2, Klaus 2026-10-27)

Der gemeinsame Ordner aller Pro-Apps (Private Brain Pro, Workflow PDF Pro, BookLedgerPro) mit **einem Passwort** und **einem
Ersatzschlüssel** (5 Teile, 3 genügen). Die Ordnerschicht ist das Paket `de.familyprojekt.tresor`, gepflegt in **Workflow PDF Pro**
(Klaus' Wahl 2026-10-27, Format: `Workflow-PDF-Pro/docs/TRESORORDNER.md`), hier byte-gleich kopiert:
`node tools/native/tresor-nachziehen.mjs --quelle ../workflow-pdf-pro` (Pins in `native/tresor-herkunft.json`, nie von Hand ändern).

## Was die App damit tut

| | Wo | Wie |
|---|---|---|
| Ordner wählen | Menü → Weiteres → **Tresorordner** (Android- und Windows-App) | Android: Androids Ordnerwahl, dauerhafte Freigabe (SD-Karte oder Tablet). Windows: Ordner-Dialog, jedes Laufwerk (auch USB-Stick), ganzer Pfad in „Tresor & Ablage“ (`windows/engine/src/DesktopTresor.java`). Den Ordner **über** „Private Brain“ wählen, nicht diesen selbst — die App warnt. |
| Anlegen / Entsperren | Knöpfe in der Ansicht | Passwort nur im **Fenster von Android** (nie in der WebView). „Auf diesem Gerät entsperrt lassen“ merkt den Hauptschlüssel im Android-Schlüsselspeicher. |
| Automatische Sicherung | `BookLedgerPro/Sicherung/` | Der ganze Bestand der App (`dumpAll`, Buchungen schon mit dem App-Schlüssel verschlüsselt) als PBV1-Datei mit dem Fach-Schlüssel — beim Gang in den Hintergrund, alle 15 Minuten, 20 s nach dem Start, aber nur wenn sich etwas geändert hat und höchstens alle 10 Minuten. „Jetzt sichern“ sichert sofort (wenn etwas geändert ist). Fehler stehen als Hinweis da. |
| Beleg-Originale | `BookLedgerPro/Belege/` | Nach jeder Sicherung (bei entsperrter App) bzw. per Knopf „Belege ins Fach legen“: jedes neue Original einzeln, mit Textauszug im Inhaltsverzeichnis — so finden die anderen Apps sie. Kein Doppel (SHA-256). |
| Eingangsfach | `Eingang-BookLedgerPro/` | Was Private Brain Pro / Workflow PDF Pro dorthin legen, steht offen in der Ansicht; „Als Beleg übernehmen“ geht den Teilen-Weg (`dateienEinlesen`) und setzt die Marke „übernommen“. Die Datei bleibt liegen. |
| Fremde Fächer | `Private Brain/`, `Workflow PDF Pro/`, `Eingang-WorkflowPDF/` | Nur lesen. Dateien im gemeinsamen Format: ansehen/teilen und übernehmen; App-eigene Dateien (z. B. Private Brains HMAC-Namen): nur die Zeile, „Öffnet nur in ihrer eigenen App“. |
| Suchen | Suchfeld oben | Wortsuche über alle Inhaltsverzeichnisse (wie bei den Belegen: Umlaute, Daten); Bedeutungssuche zusätzlich, wenn sie in den Einstellungen an ist (Vektoren nur im Speicher dieser Sitzung). |
| Einspielen | an jeder Sicherung | „Einspielen (ergänzen)“ = `importSnapshot(…, 'merge')`; „…mit Einstellungen“ = `replace` (dann gilt das App-Passwort aus der Sicherung). |
| Ersatzschlüssel | Knopf | fünf Teile `FPT1-…`, als Datei speicherbar; ein neuer Satz macht den alten ungültig. Mit drei Teilen öffnen und neues Passwort setzen. |

Teile: `android/…/BlpTresorPlugin.java` (Brücke), `native/blp-native.js` (`BLPNative.tresor`, automatische Sicherung),
`src/domain/tresorordner.js` (rein), `src/core/tresorBelege.js`, `src/ui/views/tresorordner.js`. Die PWA sieht die Ansicht nicht.

## Proben

```bash
node tests/run.mjs                       # Abschnitt „Tresorordner“ (14): Format, Fälligkeit, Fingerabdruck, Suche, Verdrahtung
node tools/native/test-native.mjs        # Pins des Pakets, Plugin: kein Passwort aus der WebView, kein Löschen
node tests/smoke_tresorordner.mjs        # echter Browser, gestellte Brücke: 30 grün
node tests/gegenprobe_tresorordner.mjs   # 11 eingebaute Fehler, je eigene rote Zeile
cd android && ./gradlew testDebugUnitTest   # TresorOrdnerTest (Paket) — in GitHub
```

## Grenzen (benannt)

- **Nicht am Gerät gemessen** — kein Tablet, keine echte SD-Karte, kein echter Passwort-Dialog. Die Browser-Probe stellt die
  Brücke; das Java-Plugin ist nur gebaut und gelintet (GitHub), nicht im Emulator gefahren.
- **Zwei Passwörter bis auf Weiteres** (Klaus' Antwort 2, Weg A): das App-Passwort von BookLedgerPro bleibt, der Tresorordner hat sein
  eigenes (gemeinsam mit den anderen Pro-Apps). Wiederherstellen aus der Sicherung braucht beide (oder Shamir der App).
- Gesichert wird der Bestand des **aktiven Mandanten**.
- Sicherungen werden nicht ausgedünnt (in einem Fach wird nichts gelöscht); sie wachsen nur, wenn sich etwas ändert.
- **Schritt D (2026-10-27):** Workflow PDF Pro (#30) und Private Brain Pro (#102) ziehen ein und führen ihr Inhaltsverzeichnis
  (`verschluesselung: "app"` → hier nur die Zeile). Private Brain legt Rechnungsmails auf Wunsch als `.eml` nach
  `Eingang-BookLedgerPro/Mails/`; „Als Beleg übernehmen“ nimmt sie über denselben Weg wie geteilte Mails (Mail-Beleg + Anhänge),
  ohne Code-Änderung hier. ⚠ Mit echtem Eingang am Gerät noch nicht gefahren.
