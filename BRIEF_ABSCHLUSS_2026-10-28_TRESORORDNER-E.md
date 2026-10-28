# Abschluss 2026-10-28: Tresorordner Schritt E — Probe am Tablet

## Ergebnis
**Der gemeinsame Tresorordner läuft am echten Gerät mit allen drei Pro-Apps.** Ordner: `SD-Karte/Privat Brain Pro Hauptablageordner/`
(Klaus: echt behalten, keine Probe-Kopie nötig). Darin jetzt „Private Brain/“, „Workflow PDF Pro/“, `tresorordner.json`, „Tresorordner/“,
„BookLedgerPro/“, „Eingang-BookLedgerPro/“.

| Schritt | Stand |
|---|---|
| Private Brain Pro 1.0.41 zieht ein | ✓ 31 Einträge (lief schon vor der Sitzung am echten Ordner) |
| Workflow PDF Pro 1.0.6: Ablage auf SD + Einzug | ✓ 51 Datensätze übertragen, 6 Einträge, dasselbe Passwort |
| BookLedgerPro 0.1.0 öffnet den Ordner | ✓ Fächer „Private Brain · 31“ und „Workflow PDF Pro · 6“ (nur lesen) |
| Automatische Sicherung von BookLedgerPro | ✓ `BookLedgerPro/Sicherung/` 10:52 und 11:29 |
| Rechnungsmail → Eingang → Beleg | ✓ Mail + 2 PDF-Anhänge als Belege |
| Teilen über Android → BookLedgerPro | ✗ kam nicht an → behoben in #381 (am Gerät erst mit 0.1.1) |
| Ersatzschlüssel Tresor (alle Pro-Apps) | offen (noch keiner erzeugt — in BookLedgerPro → Tresorordner) |

## Gebaut und gemergt (BookLedgerPro)
- **#381** Teilen-Eingang gilt immer, auch wenn die WebView ein eigenes `launchQueue` hat (test-native 38, Gegenprobe rot).
- **#382** Englische Rechnungen (Subtotal/VAT/Amount paid) · „Tresorordner sperren“ bleibt gesperrt · `sw.js` v272
  (run.mjs 2582/0, test-native 39/0; Java-Teil nur gebaut, nicht am Gerät).

## Entschieden (Klaus)
- Einzug am echten Ordner behalten. Workflow PDF Pro ohne Sicherung (Testdaten).
- Alter Kasten „Tresor — Verschlüsselung“ (Browser-Datei-Tresor) **kommt in der Pro-App weg**.
- Einstellungen: **Knöpfe wie heute, kein Explorer**; weniger Text, ⓘ, flache Knöpfe, ein farbiger Knopf für den nächsten Schritt;
  **in allen Pro-Apps gleich**, gemeinsame Datei byte-gleich, auch für künftige Pro-Apps → `docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`.
- Tresorordner-Ansicht in BookLedgerPro: Reihenfolge **1 → 2 → 4 → 3** (1 „Neu im Tresorordner“ bei den Belegen + Einstellungen → Tresor,
  2 Explorer der Fächer mit alle auf/zu, 4 Mehrfach-Übernahme, 3 „In ‹App› öffnen“).

## Nicht geprüft / offen (ehrlich)
- #381/#382 nicht am Gerät (keine neue APK; Veröffentlichung nur auf Klaus' Wort).
- „Sperren“-Fehler in **Workflow PDF Pro** nicht behoben; in Private Brain Pro nur im Entwurf #105 (Parallel-Sitzung, Explorer-Teil dort verworfen).
- Durchgereichter Tipp in Workflow PDF Pro nur vermutet. Teilen-ohne-Frage in Private Brain Pro nicht nachgestellt.
- Windows: kein Einzug in irgendeiner App; BookLedgerPro-Windows gibt es noch nicht.
- Basic: nachgezogen in dieser Sitzung (siehe SESSIONS).

## Veröffentlicht
Nichts.
