# Abschluss: Sitzung „Android-Tresorordner", Schritte A und A2 (2026-10-26, abends)

Vorgänger: `BRIEF_SITZUNG_ANDROID-TRESORORDNER.md` (Klaus' fünf Antworten stehen dort). Nachfolger:
`BRIEF_SITZUNG_TRESORORDNER-SCHRITT-B.md`. Forschungseinträge: Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md § 7.

## Was gebaut und auf `main` ist

| | PR | Stand |
|---|---|---|
| Klaus' Antworten im Brief, Schritt C2 neu | #368 | gemergt |
| **Schritt A:** Android-Hülle ohne Tresorordner | #368 | gemergt, CI „Android-Hülle" zweimal grün |
| **Schritt A2:** Signier-Werkzeuge `tools/signing/` + Lauf „Dauerhafte BookLedgerPro-Signieridentität" | #368 | gemergt |
| **Signieridentität** (verschlüsselt) `signing/android-release.enc.json` + `signing/android-certificate.json` | #369 | gemergt |
| BookLedger Basic zieht native Teile nicht mit | Basic #4 | gemergt |

- **Paket** `de.familyprojekt.bookledgerpro`, `versionCode 1`, `versionName 0.1.0`, Capacitor 8.5.3 (wie Workflow PDF Pro).
- **Zertifikat** SHA-256 `7a6217eb2c3a3c9ad49b9ac73e33a1e6560a4530181ff3afdb2f0d7aa8737f0b` (öffentlich, in
  `signing/android-certificate.json`). Erzeugt von Lauf #2 (`initialize`), geprüft von Lauf #3 (`check`, grün).
- **Freigabe** `BLP_SIGNING_UNLOCK` (64 Hex) liegt im Environment `android-production` und bei Klaus in Termux als
  `~/blp-freigabe.age` (age, Passwort). Nie im Chat, nie in Git.
- **GitHub-Hauptzweig** von BookLedgerPro ist jetzt `main` (vorher der alte Zweig `claude/general-discussion-x9xyk9` vom
  2026-06-14, 39 Commits zurück; Klaus hat umgestellt).

Bedienung, Klaus' Schritte, Grenzen: `docs/ANDROID.md`.

## Gemessen

- `node tools/native/test-native.mjs` **30 grün · 0 ROT**; Gegenproben (Quittung löscht · Speichern nicht in der Erfassungsphase ·
  Doku im Paket · Mail nicht teilbar · Browser-Schalter weg) je eigene rote Zeile.
- `node --test tools/signing/test-identity.mjs tools/signing/test-unlock-file.mjs` **10/10** (Wegwerf-Schlüssel).
- `node tests/run.mjs` **2567/0** unverändert. In GitHub: `assembleDebug`, `lintDebug`, `testDebugUnitTest` grün.
- Debug-APK als Bau-Ergebnis `bookledgerpro-android-debug` (Lauf 40388831296, bis 2026-11-09) — **unsigniert, kein Update**.

## Nicht gemessen / offen

- **Kein Gerät, kein Emulator.** Teilen-Eingang, Speichern-Dialog, Teilen hinaus und Link-Schutz sind nur gebaut und in Node am
  gestellten WebView geprüft.
- **Termux:** ob `~/blp-freigabe.txt` (offene Kopie) gelöscht ist, hat Klaus noch nicht zurückgemeldet. Block steht im nächsten Brief.
- **Keine signierte APK, kein Release-Lauf** — es gibt noch keinen Release-Workflow in BookLedgerPro (Vorlage:
  `Workflow-PDF-Pro/.github/workflows/release-request.yml`). Veröffentlichen nur auf Klaus' Wort.
- Mikrofon nativ, App-Links für den WorkFloh-Rundlauf, Kamera im Scanner: offen (siehe nächster Brief).
- Der alte Zweig `claude/general-discussion-x9xyk9` liegt noch im Repo (1 Commit nicht auf `main`, nur Doku vom Juni). Löschen nur
  nach Klaus' Wort.

## Nichts veröffentlicht

Keine APK, kein Release, keine Windows-Ausgabe. Die PWA unter GitHub Pages ist unverändert.
