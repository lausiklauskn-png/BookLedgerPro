# BookLedgerPro für Windows (Pro-Umbau 5, Klaus 2026-10-28)

Vorbild: Private Brain Pro `windows/` (Tauri 2 / WebView2, Java-Engine als privater Kindprozess, eigenes Dialog-Fenster).
Dieselbe Oberfläche wie die Android-App: `tools/native/prepare-web.mjs` baut das Web-Paket (nur `git ls-files`), die Hülle
stellt dieselben Capacitor-Plugins bereit (`windows/bridge/capacitor-tauri.js`), `native/blp-native.js` erkennt `getPlatform() === 'windows'`.

## Was drin ist

| Teil | Windows | Android (zum Vergleich) |
|---|---|---|
| Tresorordner | Paket `de.familyprojekt.tresor` **byte-gleich** (Pins `native/tresor-herkunft.json`, `windows/engine/build.mjs` bricht bei Abweichung ab), `DateiAblage` | `SafAblage` |
| Ordnerwahl, „In Dateien öffnen“ | Windows-Ordnerdialog, Explorer | Android-Ordnerauswahl, Dateien-App |
| Passwort | eigenes Fenster der Hülle (`windows/dialog/`), geht über die Hülle direkt an die Engine, nie durch die Seite | nativer Android-Dialog |
| „Merken“ | DPAPI des angemeldeten Windows-Benutzers, an Kennung des Ordners gebunden | Android-Schlüsselspeicher |
| Speichern / „Teilen“ | Speichern unter … (Windows hat keine Teilen-Liste) | Speichern-Fenster / Teilen-Auswahl |
| Eingang | Hineinziehen ins Fenster, „Öffnen mit → BookLedgerPro“ (PDF, EML, PNG, JPG, XML), zweiter Programmstart reicht an die laufende App | Teilen, Öffnen mit |
| Mikrofon | Windows-Spracherkennung (SAPI, lokal, ohne Internet; `speech.rs` aus Private Brain Pro) | Androids Sprachfenster |
| „In ‹App› öffnen“ | startet `%LOCALAPPDATA%\Private Brain Pro\private-brain-pro.exe` bzw. `…\Workflow PDF Pro\workflow-pdf-pro.exe`, sonst „nicht installiert“ | Paketname |
| Hintergrundaufgabe | läuft in der Seite; Schließen fragt bei laufender Aufgabe und sichert vorher (höchstens 20 s; zweites Schließen innerhalb 15 s schließt immer) | Vordergrund-Dienst mit Mitteilung |
| Version unter „Über“ | aus `windows/src-tauri/tauri.conf.json` | versionName |

Daten: WebView-Daten und Engine-Einstellungen unter `%LOCALAPPDATA%\de.familyprojekt.bookledgerpro\`; die Einstellungsdatei der Engine ist DPAPI-verschlüsselt.
Deinstallieren lässt Tresorordner und Daten stehen.

## Prüfen

```bash
node windows/engine/test.mjs           # Engine mit gestellter Hülle (44 Zeilen)
node windows/engine/protocol-test.mjs  # echter Kindprozess über stdio
node tests/smoke_windows.mjs           # Klebstoff im Windows-Modus (Chromium, gestellte Brücke)
```

GitHub `windows.yml`: Engine (Linux und Windows), eigene Java-Laufzeit (jlink), Prüfbau mit Prüf-Schnittstelle installiert und zweimal gestartet
(`windows/pruefung/installed.mjs`: Tresorordner anlegen im eigenen Passwort-Fenster, ablegen, lesen, Speichern, „Öffnen mit“, nach Neustart öffnet
echte DPAPI den gemerkten Schlüssel), Deinstallieren, dann Auslieferungsbau ohne Prüf-Schnittstelle. Artefakt `windows-installer-unsigniert`.

## Noch nicht drin / Grenzen

- **Scanner-Auswahl (WIA) und Kamera-Scan:** Klaus' Wunsch 2026-10-28 (USB/WLAN-Scanner wählbar, Webcam/Digitalkamera). Kommt als gemeinsamer
  Baustein mit Quelle in Workflow PDF Pro (Klaus' Wahl), danach hier nachgezogen.
- **Updates:** über eigenen Server (Hetzner, SFTP), signiert; GitHub lädt nach Klaus' Wort hoch (Klaus' Wahl 2026-10-28). Noch nicht gebaut.
- Unsigniertes Setup (SmartScreen warnt). Nicht an einem echten Windows-PC gemessen, nur auf dem GitHub-Rechner.
