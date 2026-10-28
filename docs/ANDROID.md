# BookLedgerPro als Android-App (Schritt A, 2026-10-26)

Klaus' Wort (2026-10-26): Paket `de.familyprojekt.bookledgerpro`, eigene Signatur einmal per `init`, Reihenfolge
(a) App ohne Ordner → (b) gemeinsame Ordnerschicht → (c) Private Brain Pro schreibt ins Eingangsfach → (d) Workflow PDF Pro
zieht ein; der Relais-Weg ganz zum Schluss. Dieser Stand ist **(a)**. Brief: `BRIEF_SITZUNG_ANDROID-TRESORORDNER.md`.

## Was die App ist

Dieselbe Web-App wie die PWA, **unverändert**, in einer Capacitor-Hülle (8.5.3, wie Workflow PDF Pro). Die Hülle lädt die
Dateien aus dem App-Paket (`https://localhost`), nicht aus dem Netz. Die Daten liegen wie in der PWA verschlüsselt in der
IndexedDB der App (eigener Speicher, getrennt von Chrome; Android-Sicherung des App-Speichers ist aus).

| Teil | Datei |
|---|---|
| Web-Paket (nur Laufzeit, byte-gleich) | `tools/native/prepare-web.mjs` → `www/` + Beleg `native-bundle.json` |
| Klebstoff (nur in der App aktiv) | `native/blp-native.js` |
| Android-Projekt | `android/` (Java in `android/app/src/main/java/de/familyprojekt/bookledgerpro/`) |
| Probe ohne Android | `tools/native/test-native.mjs` |
| Bau in GitHub | `.github/workflows/android.yml` (debug-APK als Artefakt) · Veröffentlichen: `android-release.yml` (unten) |

## Was die Hülle der Web-App ergänzt

1. **Teilen an BookLedgerPro und „Öffnen mit"** (PDF, Bilder, `.eml`): Android legt die Dateien zuerst in einen privaten
   Eingangskorb der App (`IncomingInbox`, angepasst aus Workflow PDF Pro), dann übergibt `blp-native.js` sie über
   `launchQueue` — derselbe Weg, auf dem die PWA „Öffnen mit" bekommt (`src/ui/shell.js` → Belege). Nach der Übergabe wird
   der Eingang archiviert, nicht gelöscht; nach 14 Tagen räumt die App die Empfangskopie weg. Nur `content:`-Adressen aus dem
   Intent, nie eine Adresse aus JavaScript.
2. **Speichern** (Datensicherung, Exporte, PDFs): die WebView kann `<a download>` nicht. Ein Tipp darauf — auch das
   unsichtbare `a.click()` aus `downloadBlob` — öffnet Androids „Speichern unter"; gespeichert wird nur dorthin, wo man zeigt.
3. **Teilen hinaus** (z. B. Angebot an Workflow PDF): `navigator.share` mit einer Datei geht an Androids Teilen-Auswahl
   (FileProvider gibt nur den Ordner `share/` im Zwischenspeicher frei; ältere Teilen-Kopien werden nach einem Tag gelöscht).
4. **Link-Schutz**: Seiten außerhalb `https://localhost` öffnen nie im App-Fenster. Ein Tipp auf einen Link geht an den
   Browser bzw. die zuständige App; Klaus' eigene Apps (`lausiklauskn-png.github.io`, z. B. der WorkFloh-Rundlauf) auch
   ohne Tipp.

## Tresorordner (Schritt C, 2026-10-27)

Gemeinsamer Ordner aller Pro-Apps: Ansicht „Tresorordner“, automatische Sicherung ins Fach, Eingangsfach. Bedienung und
Grenzen: [`docs/TRESORORDNER.md`](TRESORORDNER.md).

## Bauen

```bash
npm ci
npm run sync:android                       # www/ bauen und in android/ legen
cd android && ./gradlew assembleDebug      # braucht ein Android-SDK; hier im Behälter nicht erreichbar → GitHub Actions
node tools/native/test-native.mjs          # Probe ohne Android
```

## Eigene Signatur (Schritt A2) — einmalige Schritte für Klaus

✅ **Erledigt am 2026-10-26:** Identität angelegt (PR #369), Zertifikat SHA-256
`7a6217eb2c3a3c9ad49b9ac73e33a1e6560a4530181ff3afdb2f0d7aa8737f0b`, Lauf `check` grün. Die Schritte unten bleiben als
Nachweis und für den Fall, dass die Freigabe je neu hinterlegt werden muss (nie neu `initialize`).

Ohne Signatur gibt es nur Prüf-Bauten (debug). Für eine installierbare App mit Updates braucht BookLedgerPro **einen eigenen,
dauerhaften Schlüssel** (nie den von Private Brain Pro oder Workflow PDF Pro). Er entsteht **in GitHub Actions** und liegt nur
verschlüsselt im Repo; die Freigabe dazu kennt nur Klaus.

1. **Freigabe erzeugen** (Termux): `openssl rand -hex 32 > ~/blp-signing-freigabe.txt` — und wie die anderen Freigaben
   verschlüsselt sichern (`age -p`), die offene Datei danach löschen. **Nie in den Chat.**
2. **GitHub → BookLedgerPro → Settings → Environments → New environment** `android-production` → **Add environment secret**
   Name `BLP_SIGNING_UNLOCK`, Wert = der Inhalt der Datei.
3. **Actions → „Dauerhafte BookLedgerPro-Signieridentität" → Run workflow** auf `main`, Operation **initialize**.
   Der Lauf erzeugt den Schlüssel, verschlüsselt ihn, prüft die Wiederherstellung und legt einen PR
   `signing/android-identity` an (nur verschlüsseltes Paket + öffentlicher Fingerabdruck). Darf Actions keinen PR anlegen,
   liegt der Zweig trotzdem da; die Sitzung übernimmt ihn.
4. Danach jederzeit **Operation check**: grün heißt, Freigabe und Schlüssel passen zusammen.

⚠ Wer die Freigabe verliert, kann nach der ersten Veröffentlichung keine Updates mehr ausliefern. Veröffentlicht wird nichts
ohne Klaus' Wort.

## Veröffentlichen (Klaus 2026-10-27: „veröffentliche die Test-APKs für Android“)

`.github/workflows/android-release.yml`, nur von `main`, nur von Hand (Actions → „BookLedgerPro Android veröffentlichen“ →
Tag `v0.1.0` und der volle main-Commit). Ablauf wie bei Workflow PDF Pro:

1. **Bauen:** Commit muss der main-Kopf sein und den Check `android` grün haben; Tag = `versionName` in
   `android/app/build.gradle`. `tests/run.mjs`, `test-native`, Signier-Proben, dann `assembleRelease lintRelease testReleaseUnitTest`.
2. **Signieren** (Umgebung `android-production`, `BLP_SIGNING_UNLOCK`): `tools/signing/cli.mjs sign-apk` → `apk.mjs` prüft mit dem
   echten apksigner das Zertifikat gegen den Pin (`7a6217eb…`), Paketname, Version, kein Debug-Flag; Nachweis `*.apk.json` + `.sha256`.
3. **Probe im Emulator** (`tools/native/verify-signed-install.py`, API 35 mit aktuellem WebView; unter API 31 blieb die Anmeldeseite leer (WebView zu alt), das Abbild für API 34 ließ sich am 2026-10-27 nicht laden; bei Fehlern Bildschirmfoto und WebView-Konsole als Artefakt): signierte APK frisch installieren, über die sichtbare
   Oberfläche einen Tresor mit Wegwerf-Passwort anlegen, dieselbe APK darüber installieren — danach muss „Entsperren“ statt der
   Ersteinrichtung stehen (`*.installation.json`). Kein Debug-Zugang.
4. **Veröffentlichen** (`publish-release.mjs`): Tag darf es noch nicht geben; ab der zweiten Fassung müssen Signatur gleich und
   Version/Buildnummer höher sein; Release erst als Entwurf, dann öffentlich, danach Download bytegleich geprüft (sonst zurück auf Entwurf). Das Repo ist **privat**: geprüft wird mit Anmeldung, herunterladen kann nur, wer bei GitHub angemeldet ist und Zugriff hat. Bleibt ein geprüfter Entwurf liegen, gibt ihn derselbe Ablauf mit „entwurf_freigeben“ frei (prüft APK, Nachweis und Installationsprobe des Entwurfs, kein neuer Bau).

Für jede weitere Fassung `versionName` und `versionCode` in `android/app/build.gradle` erhöhen. `tools/signing/test-apk.mjs` läuft in
`android.yml` mit dem echten apksigner an einer künstlichen APK (Wegwerf-Schlüssel); lokal ohne `BLP_ANDROID_SDK` übersprungen.

## Grenzen (benannt)

- **Nicht am Gerät gemessen**, kein Emulator-Lauf in diesem Schritt; nur Bau, Lint, JVM-Proben und die Node-Probe.
- **Mikrofon**: die App nutzt noch die Spracherkennung der WebView; in Android-Apps ist sie meist gesperrt (Befund aus Private
  Brain Pro). Der native Weg (Androids Sprachfenster, `ProSpeechPlugin` als Vorlage) kommt in einem eigenen Schritt.
- **Kamera im Scanner**: über die Dateiwahl der WebView; ob „Foto aufnehmen" angeboten wird, hängt vom Gerät ab.
- **Rundlauf-Adressen** (`?uebernahme=`, `?vorgang=` von den WorkFlohs) öffnen weiter die PWA-Adresse im Browser; ein
  App-Link braucht `assetlinks.json` an der Wurzel von `lausiklauskn-png.github.io` (offen).
- Die PWA unter GitHub Pages bleibt bestehen; BookLedger Basic zieht `android/`, `native/`, `signing/` nicht mit
  (`BookLedger-Basic/tools/basic-regeln.mjs`).
