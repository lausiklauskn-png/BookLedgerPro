# Abschluss 2026-10-27 (abends): Tresorordner Schritt D — Workflow PDF Pro und Private Brain Pro ziehen ein

## Was Klaus entschieden hat
- **Knopf „In den Tresorordner einziehen“:** keine Vorliebe → Empfehlung gebaut: im vorhandenen Tresor-Kasten der Einstellungen
  (Workflow PDF Pro: „Speicher und Dokumenttresor“, Private Brain Pro: „Speicherort und Verschlüsselung“), nur bei entsperrtem Tresor.
- **Probe-Kopie:** mit der Dateien-App („Private Brain“ → neuer Ordner „Tresor-Probe“).
- **Einzug wählt den Ordner selbst und prüft die Kennung** (Klaus: „Ja, so bauen“) — so geht die Probe an der Kopie, ohne die App
  auf die Kopie umzustellen.
- Termux-Probe `age -d ~/blp-freigabe.age | wc -c` (erwartet 64): **64** (Klaus, nach der Sitzung; alle drei `.age`-Dateien vorhanden). Ohne Hardware-Tastatur: vom linken Rand wischen → „KEYBOARD“.
- Klarstellung auf Klaus' Frage: Termux enthält nur die Signier-Freigaben (`*.age`), nicht den Dokumententresor; der liegt auf der SD-Karte
  und öffnet nur in der App.

## Was gebaut ist
| | Wo | Stand |
|---|---|---|
| D1 · Einzug + Inhaltsverzeichnis | Workflow-PDF-Pro#30, gemergt `6ce1570` | JVM 3/3, Browser 8/8, Gegenprobe 9/9 + 2 Kontrollen, `test:native-web` 41/41; CI grün (Bau, Lint, JVM, Windows) |
| D2 · Einzug + Inhaltsverzeichnis + Rechnungsmails ins `Eingang-BookLedgerPro/Mails/` | Privat-Brain-Pro#102 | JVM 4/4, Browser 21/21, Gegenprobe 12/12 + 2 Kontrollen; vorhandene Proben grün (test-web 126, mail-device 81, vault 34, share 12, design-26 71, live-mail 37, pages 24, drift-guard 22) |
| BookLedgerPro | dieses Repo | kein Code nötig: „Als Beleg übernehmen“ nimmt die `.eml` über den Teilen-Weg; Doku ergänzt |

Gemeinsames Paket `de.familyprojekt.tresor` **unverändert** (Pins wie `5009c95`), in Private Brain Pro jetzt byte-gleich gepinnt.
Schutzmodule beider Apps unverändert (Kern-Prüfung 200/0, Drift-Guard 22/0).

## Was nicht geprüft ist (ehrlich)
- **Nichts am Gerät.** Kein Tablet, keine SD-Karte, kein echter Passwort-Dialog, kein Einzug an der Kopie. Die Java-Plugins sind in
  GitHub gebaut und gelintet, nicht im Emulator mit einem Ordner gefahren.
- **Am Tablet lässt sich das erst prüfen, wenn neue APKs da sind** — das ist eine Veröffentlichung und braucht Klaus' Wort.
- Windows: keiner der beiden Einzüge (Lücke im Produktstand). Private Brain Pro V3: nicht nachgezogen.
- Ein sehr großer Katalog (Zehntausende Mails) geht als eine Nachricht über die Brücke — ungemessen.

## Funde
Forschung § 9 (`docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md`): Probe an der Kopie über die Kennung · verschiedene Köpfe der
Apps · `JSObject.fromJSONObject` im Lambda · Private Brains `www/` ohne OCR · Umlaute in der JVM · Teilen-Knopf im Klappmenü ·
Gegenproben brauchen Kontrollen (ein blinder Fall gefunden) · Verzeichnis nur bei Änderung · Windows-Engine mit fester Liste ·
Termux-Tresore ≠ SD-Tresor.

## Veröffentlicht
Nichts. Kein APK, kein Release.
