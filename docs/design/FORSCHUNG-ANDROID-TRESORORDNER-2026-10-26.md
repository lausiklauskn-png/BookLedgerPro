# Forschung: BookLedgerPro als native Android-App mit dem gemeinsamen Tresorordner (2026-10-26)

Vorbereitung für die Bausitzung „Android-Tresorordner" (Plan: `PLAN-TRESORORDNER-2026-10-26.md`, Schritt 3).
**Nachgelesen, nicht gebaut.** Quellen sind die Klone im Behälter, Stand `origin/main` am 2026-10-26:
Private Brain Pro `9dc77c9` (PR #93), Workflow PDF Pro `0055c6b`, BookLedgerPro `8418cb7`.
Nichts davon ist am Gerät gemessen.

## 1 · Der wichtigste Fund: es gibt heute ZWEI Ordnerschichten über EINEM Schloss

| | Private Brain Pro | Workflow PDF Pro |
|---|---|---|
| Schloss (Datei-Format PBV1) | `VaultCrypto.java`, 257 Zeilen | `VaultCrypto.java`, 257 Zeilen — **bis auf die `package`-Zeile byte-gleich** (gemessen mit `diff`, ohne Zeile 1: leer) |
| Ordnerschicht | `Vault.java` (734 Zeilen): Ordner `Private Brain`, Kopf `tresor.json`, Format `private-brain-vault`, **ein** mit dem Passwort verpackter Datenschlüssel, Unterordner `Mails`, `Anhänge`, `Originale`, `Katalog`, `Schutzlisten` | `DocumentVault.java`: Ordner `Workflow PDF Pro`, Kopf `workflow-pdf-pro.tresor.json`, Format `workflow-pdf-pro-vault`, **Commit-Marken mit Revision**, allgemeiner Satz-Index für die Speicher `folders, docs, files, texte, vektoren, settings` |
| Ersatzschlüssel | **keiner** fürs Speicherort-Passwort (der Fünf-Teile-Schlüssel in `native/native-recovery.js` gilt nur dem Studio) | **vorhanden**: `VaultRecovery.java`, Shamir 5 Teile / 3 genügen, Teile `WFP1-…`, eigene **Schlüssel-Plätze** (`workflow-pdf-pro.kennwort-…`, `workflow-pdf-pro.ersatz-…`) |
| Gerät merkt sich den Schlüssel | AndroidKeyStore, je App eigener Alias | AndroidKeyStore, Alias `workflow-pdf-pro-vault-remember-v1` |
| Windows | Java-Engine (`windows/engine`, Adapter `vault-remember.java`) mit DPAPI | **Rust-Kern** (`windows/core/src/crypto.rs`, `vault.rs`, `recovery.rs`), „gleiches Format wie VaultRecovery" |

**Folge für den Plan:** Der Satz „ein Schloss (PBV1), byte-gleich kopiert" stimmt für die **Dateiverschlüsselung** schon heute.
Was fehlt, ist eine **gemeinsame Ordnerschicht**: wer den Ordner anlegt, wo der Kopf liegt, wie der Schlüssel verpackt ist,
wie ein Ersatzschlüssel daneben steht. Heute legt jede App ihren eigenen Kopf mit eigenem Datenschlüssel an — zwei Apps im selben
Ordner hätten zwei Passwörter, auch wenn man zweimal dasselbe eintippt (verschiedene Salze, verschiedene Datenschlüssel).

**Die bessere Vorlage ist die von Workflow PDF Pro**, nicht die von Private Brain Pro: sie hat Schlüssel-Plätze (Passwort und
Ersatzschlüssel öffnen denselben Schlüssel), einen allgemeinen Satz-Index ohne Mail-Teile und einen Windows-Zwilling im selben
Format. Der Plan nannte `native/native-recovery.js` als Muster; das ist das Studio-Muster, nicht das Ordner-Muster.

## 2 · Vorschlag für die gemeinsame Schicht (zur Entscheidung, nicht gebaut)

Ein Kopf **über** den Fächern, mit Schlüssel-Hierarchie:

```
<gewählter Ordner>/
  tresorordner.json              ← Format „familyprojekt-tresorordner", Version 1, Kennung
                                    Hauptschlüssel, verpackt in Plätzen: Passwort · Ersatzschlüssel (5/3)
  Private Brain/   tresor.json    ← bisheriger Kopf; dessen Datenschlüssel wird zusätzlich
                                    mit dem Hauptschlüssel verpackt (kein Neuverschlüsseln der Dateien)
  Workflow PDF Pro/ …tresor.json  ← ebenso
  BookLedgerPro/   …tresor.json   ← neu, eigener Datenschlüssel, mit dem Hauptschlüssel verpackt
  Eingang-BookLedgerPro/           ← Übergabefach (schreibt Private Brain Pro, liest BookLedgerPro)
  Eingang-WorkflowPDF/
```

- **Warum Hauptschlüssel + Fach-Schlüssel:** vorhandene Tresore (Klaus' echte SD-Karte mit Private Brain Pro!) ziehen um, ohne
  dass eine einzige Datei neu verschlüsselt wird — nur ihr Datenschlüssel wird zusätzlich verpackt.
- **Passwortwechsel wird billig:** nur der Hauptschlüssel wird in einen neuen Passwort-Platz gelegt. Der Plan sagte „alle Dateien
  neu verschlüsseln"; das ist nur nötig, wenn jemand **ausgeschieden** ist und den alten Schlüssel kopiert haben könnte. Benannte
  Grenze: Ein neues Passwort sperrt niemanden aus, der den entsperrten Schlüssel schon hatte; echtes Aussperren heißt neue
  Fach-Schlüssel und neu verschlüsseln.
- **Ersatzschlüssel:** derselbe Weg wie `VaultRecovery` (5 Teile, 3 genügen), aber für den Hauptschlüssel — dann gilt er für alle
  Apps zugleich.
- **Lesen fremder Fächer:** jede App kann jedes Fach entschlüsseln (ein Hauptschlüssel), schreibt aber nur ihr Fach und die
  Übergabefächer; „übernommen" ist eine eigene Marke-Datei, nie ein Löschen fremder Dateien (Regel aus dem Plan).
- **Gemeinsamer Code:** Java-Dateien tragen ihre `package`-Zeile. Byte-gleich über drei Apps geht nur, wenn die gemeinsame Schicht
  ein **eigenes Paket** bekommt (Vorschlag `de.familyprojekt.tresor`, Klassen `public`), gepflegt an **einer** Stelle und per
  SHA gepinnt kopiert — so wie `upstream/workflow-pdf` und `verify-upstream.mjs` in Workflow PDF Pro. Die App-eigenen Teile (Mails,
  Katalog, Satz-Index) bleiben in den App-Paketen.

## 3 · Was BookLedgerPro nativ mitbringt und was es braucht

**BookLedgerPro hat schon ein eigenes Schloss im Browser** (`src/core/crypto.js`: PBKDF2-SHA256 600 000 → AES-GCM, Sitzungsschlüssel
nur im Speicher), eine verschlüsselte Sicherung (`src/core/backup.js`, Marke `BLPR-BACKUP`), Shamir (`src/core/shamir.js`) und
einen gemerkten Sicherungsordner (`src/core/backupOrdner.js`, File System Access — **geht auf Android-Chrome nicht**).

Zwei Wege für die Daten der App:

| | A · IndexedDB bleibt, Tresorordner trägt Sicherung und Originale | B · Datensätze in den Tresorordner (wie Workflow PDF Pro) |
|---|---|---|
| GoBD-Hash-Kette, Festschreibung | unberührt | muss in die neue Ablage umziehen |
| Datendurabilität (Regel #2) | **besser als heute:** automatische verschlüsselte Sicherung ins Fach statt Download | gut, aber großer Umbau |
| Passwörter | zwei (App-Tresor + Ordner), später vereinbar | eins |
| Aufwand | klein | groß |

**Empfehlung A** für die erste Android-Sitzung: die Web-App läuft unverändert, nur der Sicherungsweg bekommt ein natives Ziel
(Fach `BookLedgerPro/Sicherung/`), dazu Beleg-Originale und das Lesen aus `Eingang-BookLedgerPro/`.

**Was sonst nativ nachgebaut werden muss** (Vorlagen in Klammern):

| PWA heute | nativ | Vorlage |
|---|---|---|
| `share_target` (PDF, Bilder, `.eml`) | Intent-Filter `ACTION_SEND`/`SEND_MULTIPLE`, Eingangskorb → derselbe Weg `dateienEinlesen` | Private Brain Pro `ProSharePlugin`/`ShareInbox`; Workflow PDF Pro `IncomingInbox`/`ProIncomingPlugin` |
| `file_handlers` („Öffnen mit") | Intent-Filter `ACTION_VIEW` | Workflow PDF Pro `IncomingFiles` |
| Service-Worker | Capacitor `resolveServiceWorkerRequests: true` | Workflow PDF Pro `capacitor.config.json` |
| `?uebernahme=` / `?vorgang=` von den WorkFlohs | App-Link auf `https://lausiklauskn-png.github.io/BookLedgerPro/` braucht `/.well-known/assetlinks.json` an der **Wurzel** von `lausiklauskn-png.github.io` (ein Benutzer-Seiten-Depot); bis dahin bleibt der Weg über die PWA bzw. Teilen | offen auch in Workflow PDF Pro |
| Mikrofon (`SpeechRecognition`) | in der WebView verweigert → Androids Sprachfenster | Private Brain Pro `ProSpeechPlugin`, `native/native-speech.js` |
| Kamera/Scanner | `<input capture>` geht in der WebView über den Dateiwähler | Workflow PDF Pro (Scanner läuft nativ) |
| Teilen hinaus (Angebots-PDF an Workflow PDF) | `navigator.share` → FileProvider + ACTION_SEND | Private Brain Pro `openOriginal`-Weg |

**Web-Paket:** das Repo ist 46 MB ohne `.git`/`tests`/`docs` (`vendor` 26 MB, `apps` 8,4 MB, `assets` 7,8 MB). Das native Paket
wird wie in Private Brain Pro mit einer **ausdrücklichen Liste** gebaut (`tools/native/prepare-web.mjs`: jede Anpassung bricht ab,
wenn ihr Anker fehlt), nicht durch Kopieren des ganzen Repos.

## 4 · Signatur und Veröffentlichung

- Private Brain Pro: Vorschau-Kanal `de.familyprojekt.privatebrain.pro.preview`, Signierer **verschlüsselt im Repo**
  (`signing/android-release.enc.json` + öffentlicher Pin), Freigabe nur `PB_SIGNING_UNLOCK` im Environment `android-preview`,
  **kein** `init` (der Schlüssel war schon da).
- Workflow PDF Pro: Produktion `de.familyprojekt.workflowpdf.pro`, Werkzeuge `tools/signing/` **mit einmaligem `init`**
  (neue Identität entsteht in Actions, wird verschlüsselt eingecheckt), Freigabe `WF_PDF_SIGNING_UNLOCK` im Environment
  `android-production`, `request-release.mjs vX.Y.Z` nach grünem `native-acceptance`, danach öffentlicher Download per SHA-256.
- **Für BookLedgerPro passt der Weg von Workflow PDF Pro:** neue Identität einmal per `init`, Freigabe-Geheimnis in einem
  Environment, das Klaus selbst anlegt (eine Schrittfolge mit Knöpfen, **nie** im Chat). Nach dem ersten veröffentlichten APK
  ist der Schlüssel unersetzlich: wer ihn verliert, kann keine Updates mehr ausliefern.

## 5 · Was am Repo selbst hängt

- **Dieses Repo bleibt Quelle der Web-App** und wird zugleich die native App (Klaus: kein Umbenennen). Die GitHub-Pages-Adresse
  `…/BookLedgerPro/` hat Benutzer: Tomys-Hub-Kachel, „Rechnung in BLP" aus beiden WorkFlohs, die Calculate/Needs-Brücke.
  Empfehlung: Pages läuft weiter, bis die WorkFlohs ein einstellbares Ziel haben; BookLedger Basic zieht nach jedem PWA-Merge nach
  (`tools/pro-nachziehen.mjs`).
- Native Teile kommen **neben** die Web-App (`android/`, `capacitor.config.json`, `native/`, `tools/native/`, `signing/`), nicht in
  `src/`. `tests/run.mjs` bleibt die Probe der Web-App; die native Probe läuft in eigenem Workflow (Emulator, wie
  `android.yml` in Private Brain Pro).
- BookLedger Basic zieht `android/` & Co. **nicht** mit: `tools/pro-nachziehen.mjs` nimmt `git ls-files` — die Regeln dort
  brauchen beim ersten nativen Merge eine Ausschlussliste (sonst landen native Teile in der PWA-Kopie).

## 6 · Offene Fragen an Klaus (gesammelt im Brief)

1. Gemeinsame Ordnerschicht nach Abschnitt 2 (Hauptschlüssel über den Fächern, Vorlage Workflow PDF Pro) — ja?
2. BookLedgerPro-Daten nach Weg A (App-Tresor bleibt, Ordner trägt Sicherung/Originale/Eingang) — ja?
3. Paketname `de.familyprojekt.bookledgerpro`, Produktionskanal, neue Signatur per `init` — ja?
4. Reihenfolge: zuerst BookLedgerPro als installierbare App ohne Ordner, dann die Ordnerschicht, dann Private Brain Pros
   Eingangsfach — oder wie im Plan zuerst Private Brain Pro?
5. Weg 2 (Relais) vor oder nach dieser Sitzung (Frage aus dem Plan, weiter offen).

## 7 · Befunde aus Schritt A und A2 (2026-10-26, abends, gemessen)

1. **GitHubs Hauptzweig war ein alter Zweig.** `claude/general-discussion-x9xyk9` (2026-06-14, 39 Commits hinter `main`) stand als
   Standard. Folge: ein Lauf mit `workflow_dispatch` erscheint nur, wenn seine Datei auf dem **Hauptzweig** liegt — die
   Signier-Identität stand auf `main` und war in GitHub unsichtbar. Klaus hat auf `main` umgestellt. **Andere Repos prüfen**, bevor
   dort ein `workflow_dispatch`-Lauf gebaut wird (`git remote show origin | grep "HEAD branch"`).
2. **Die Sitzung darf keine Läufe starten** (`workflow_dispatch` → 404 über das Werkzeug), PRs anlegen und mergen schon. Läufe tippt
   Klaus. **GitHub Actions darf keine PRs anlegen** („not permitted to create or approve pull requests") — der Signier-Lauf schob
   den Zweig `signing/android-identity` trotzdem, die Sitzung hat PR #369 angelegt. So lassen oder in den Repo-Einstellungen
   erlauben — Klaus' Entscheidung.
3. **„check" vor „initialize" ist rot, nicht kaputt** (Lauf #1: `ENOENT signing/android-release.enc.json`). Die Vorgabe der Auswahl ist
   `check`; in der übersetzten Oberfläche leicht zu übersehen.
4. **Im Behälter kein Android-SDK erreichbar** (`dl.google.com` HTTP 000; `maven.google.com` und Gradle erreichbar). Java bauen nur in
   GitHub; vor dem Push alles prüfen, was ohne Android geht (`tools/native/test-native.mjs`, JVM-Logik als reine Klassen).
5. **`concurrency: cancel-in-progress`** im Android-Lauf bricht beim nächsten Push den alten Lauf ab — kein Befund, aber beim Lesen
   der Liste „abgebrochen" nicht für rot halten.
6. **WebView-Lücken, die eine PWA nicht hat:** `<a download>` tut nichts (auch `a.click()` aus `downloadBlob`) → ohne Abfangen ginge
   jede Datensicherung still verloren (Regel #2); `launchQueue` fehlt → ein Ersatz in `blp-native.js` speist den vorhandenen
   Verbraucher in `src/ui/shell.js`, die Web-App bleibt unverändert; `navigator.share` mit Dateien fehlt → FileProvider-Weg.
7. **`package.json` ohne `"type": "module"`** — sonst bricht `tests/run.mjs` (lädt `vendor/pdf-lib.min.js` über `createRequire`).
   Werkzeuge daher als `.mjs`.
8. **Web-Paket nur aus `git ls-files`**: `sbkim/.node-secret.json` (gitignored) kann so nie in die APK. 408 Dateien, ~46 MB, Beleg
   `native-bundle.json` mit SHA je Datei.
9. **Freigabe ohne Zeilenende erzeugen** (`openssl rand -hex 32 | tr -d '\n'`): die Prüfung verlangt genau 64 Hex; Termux hat ohne
   Termux:API kein `termux-clipboard-set`, Klaus kopiert vom Schirm.

## 8 · Befunde aus Schritt B und C (2026-10-27, gemessen)

1. **Ordnernamen passen schon zusammen.** `DocumentVault.FOLDER` = „Workflow PDF Pro“ und `Vault.ROOT` = „Private Brain“ sind genau die
   Fach-Ordner des gemeinsamen Formats. Beide Apps legen ihren Ordner **unter** dem gewählten Ordner an, wenn der nicht leer ist —
   der Tresorordner-Kopf gehört dann an die Wurzel des gewählten Ordners. Hat jemand den App-Ordner **selbst** freigegeben, sieht die
   App die Ebene darüber nicht: für den Einzug braucht es eine neue Freigabe des Ordners darüber (BookLedgerPro warnt bei
   `tresor.json` im gewählten Ordner: `TRESOR_ORDNER_IST_FACH`).
2. **Beide Fach-Schlüssel sind 32-Byte-Datenschlüssel** (Private Brain `dataKey`, Workflow PDF Pro `Place.key`). Der Einzug ist also
   ein einziger Aufruf `fachEinziehen(slug, schluessel)` bei entsperrter App — keine Datei im Fach wird angefasst (JVM-Probe:
   Fingerabdruck aller Dateien vor/nach gleich).
3. **Private Brains Dateinamen sind HMAC-Namen** (`nameKey` aus dem Datenschlüssel). Mit dem Fach-Schlüssel kann eine andere App die
   Dateien entschlüsseln, aber nicht zuordnen. Deshalb führt jedes Fach ein Inhaltsverzeichnis; Private Brains Zeilen sind
   `verschluesselung: "app"` (nur Anzeige), lesbare Kopien für andere Apps gehen über `ablegen` (z. B. Rechnungsmails ins Eingangsfach).
4. **Ein Fingerabdruck darf nicht vom eigenen Merker abhängen.** Die automatische Sicherung rechnete den Fingerabdruck über den ganzen
   Bestand — samt `lastBackupAt`, das die Sicherung selbst setzt. Folge wäre gewesen: jede Sicherung löst nach 10 Minuten die nächste aus.
   Gefunden hat es die Browser-Probe („unverändert: keine zweite Datei“), nicht das Nachdenken. Jetzt `FLUECHTIG`.
5. **Doppelte Sicherung macht eine Gegenprobe blind.** Das Zurückspielen eines alten Verzeichnis-Stands ist zweifach gesichert (Nummer in
   der Verschlüsselung gebunden und im Inhalt). Nimmt die Gegenprobe nur eine weg, bleibt die Probe grün — kein Fehler im Code, sondern
   in der Gegenprobe. Sie nimmt jetzt beide weg.
6. **Basic hat kein `native/`.** Eine Zeile in `tests/run.mjs`, die `native/blp-native.js` liest, wäre in BookLedger Basic rot. Proben, die
   die Hülle brauchen, gehören in `tools/native/test-native.mjs` oder prüfen das Vorhandensein (Basic-fest).
7. **Termux: Einfügen beantwortet die Passwort-Abfrage.** Ein eingefügter Block mit Zeilenende gibt `age -d` eine leere Passphrase
   („passphrase can't be empty“). Befehle mit Passwort-Abfrage als **eine** Zeile einfügen, das Passwort danach von Hand tippen.
   Die Löschung im selben Block lief trotzdem (Rückgabe von `wc`), die offene Kopie ist weg.
8. **JVM-Proben gehen im Behälter auch ohne Gradle:** `javac` + `junit-4.13.2.jar`/`hamcrest-core-1.3.jar` von `repo1.maven.org`
   (einmal 429, beim zweiten Versuch da). Android-SDK bleibt gesperrt; `SafAblage` und Plugins nur in GitHub gebaut.
9. **Das Repo heißt jetzt `Workflow-PDF-Pro`** (Groß-/Kleinschreibung; Push meldet „This repository moved“) — Klone mit dem alten
   Namen funktionieren weiter.
