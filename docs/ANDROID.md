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
| Bau in GitHub | `.github/workflows/android.yml` (debug-APK als Artefakt, keine Veröffentlichung) |

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

## Grenzen (benannt)

- **Nicht am Gerät gemessen**, kein Emulator-Lauf in diesem Schritt; nur Bau, Lint, JVM-Proben und die Node-Probe.
- **Mikrofon**: die App nutzt noch die Spracherkennung der WebView; in Android-Apps ist sie meist gesperrt (Befund aus Private
  Brain Pro). Der native Weg (Androids Sprachfenster, `ProSpeechPlugin` als Vorlage) kommt in einem eigenen Schritt.
- **Kamera im Scanner**: über die Dateiwahl der WebView; ob „Foto aufnehmen" angeboten wird, hängt vom Gerät ab.
- **Rundlauf-Adressen** (`?uebernahme=`, `?vorgang=` von den WorkFlohs) öffnen weiter die PWA-Adresse im Browser; ein
  App-Link braucht `assetlinks.json` an der Wurzel von `lausiklauskn-png.github.io` (offen).
- Die PWA unter GitHub Pages bleibt bestehen; BookLedger Basic zieht `android/`, `native/`, `signing/` nicht mit
  (`BookLedger-Basic/tools/basic-regeln.mjs`).
