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

## 9 · Befunde aus Schritt D (2026-10-27, gemessen)

1. **Die Probe an einer Kopie braucht keine Umstellung der App.** Statt den Tresorordner aus dem aktiven Speicherort abzuleiten, wählt
   Klaus den Ordner selbst; die App prüft nur, ob darin **ihr** Tresor liegt (gleiche Kennung im Kopf). Eine byte-gleiche Kopie hat
   dieselbe Kennung und denselben Datenschlüssel → der Einzug geht an „Tresor-Probe/“, während die App weiter in den echten Ordner
   schreibt. Klaus hat diesen Weg bestätigt (Abweichung vom Brief, der „Ebene über dem aktiven Ort“ vorsah).
2. **Die Köpfe der beiden Apps sind verschieden gebaut:** Workflow PDF Pro `{"app":"workflow-pdf-pro-vault","id":…}`, Private Brain
   `{"format":"private-brain-vault","id":…}` (eingerückt). Die Ordnerprüfung liest je App das eigene Feld; die JVM-Probe nimmt den
   jeweils anderen Kopf als „fremd“.
3. **`JSObject.fromJSONObject` wirft eine geprüfte Ausnahme.** In einem `runOnUiThread`-Lambda hätte das den Android-Bau gebrochen —
   hier ohne SDK nicht zu sehen, beim Lesen des eigenen Diffs gefunden. Regel: das Ergebnis vor dem Lambda bauen.
4. **Ohne SDK sind Lint und Übersetzung nur in GitHub.** Workflow PDF Pro #30: Bau, Lint, `testReleaseUnitTest` beim ersten Push grün.
5. **Private Brains `www/` lässt sich im Behälter nicht ganz bauen** (OCR-Beschaffung braucht Netz). Der Rest der Dateien liegt vorher
   schon in `www/`; fehlende kleine Dateien von Hand nachgelegt. Die Proben laufen gegen dieses `www/`.
6. **Umlaute in Dateinamen und die JVM:** `Anhänge/` scheitert in der JVM-Probe mit `InvalidPathException`, wenn die Locale nicht UTF-8
   ist (`sun.jnu.encoding`). Mit `LANG=C.UTF-8` grün; der GitHub-Läufer hat UTF-8.
7. **Der Teilen-Knopf liegt im Klappmenü** (`.mail-message-tools`): eine Probe muss es öffnen, sonst ist der Knopf „hidden“.
8. **Gegenproben brauchen eine Kontrolle ohne Fehler.** Sonst kann jeder Fall aus dem falschen Grund rot sein (z. B. scheitert der Bau
   in der Wegwerf-Kopie). Beide Gegenproben haben jetzt je eine Kontrolle pro Art (JVM, Browser). In Private Brain war ein Fall zuerst
   blind („Hintergrund schreibt in fremden Ordner“) — die Browser-Probe prüfte den Hintergrund nicht; ergänzt.
9. **Das Inhaltsverzeichnis darf nicht bei jedem Verlassen wachsen.** Die App vergleicht in Java mit dem eigenen Stand und schreibt nur bei
   einer Änderung (sonst drei Stände in wenigen Minuten verbraucht). Workflow PDF Pro holt Größe und SHA-256 aus dem Satz-Index, ohne die
   Datei zu lesen.
10. **Private Brains Windows-Engine übersetzt eine feste Liste von Java-Dateien** (`windows/engine/build.mjs`) — das Paket kommt dort nicht
    mit, und die Seite tut ohne Brücke nichts. Windows bleibt eine benannte Lücke.
11. **Termux-Tresore ≠ SD-Tresor.** Klaus fragte, ob der Ordner in Termux angelegt wurde. Nein: in Termux liegen nur die mit `age -p`
    verschlüsselten Signier-Freigaben (`pbpro-`/`wfpdf-freigabe-neu.age`, `blp-freigabe.age`); der Dokumententresor liegt auf der SD-Karte
    und öffnet nur in der App. Für den Brief: das gleich zu Anfang klarstellen.
12. **Beide App-Ordner müssen unter demselben Ordner liegen.** Der Tresorordner ist die Ebene über „Private Brain“ **und** über „Workflow PDF
    Pro“. Liegt der Workflow-Tresor woanders (andere Karte, anderer Ordner), passt dort kein gemeinsamer Kopf. Weg: in Workflow PDF Pro
    „Ordner wählen / vorhandenen Tresor öffnen“ auf einen neuen Ordner neben „Private Brain“ (die App überträgt ihre Daten selbst,
    `VaultLocations`/Migration), dann einziehen. Für die Probe beide Ordner nach „Tresor-Probe/“ kopieren. Am Gerät zu klären.
13. **Ersatzschlüssel des Tresorordners** erzeugt bisher nur BookLedgerPro (Ansicht „Tresorordner“). Er gilt für alle Apps; Workflow PDF Pro
    und Private Brain Pro haben dafür noch keinen eigenen Knopf (ihre eigenen Ersatzschlüssel gelten weiter für den App-Tresor).
14. **Klaus' SD-Karte (2026-10-27):** dort liegen „Private Brain“ und ein Ablageordner, **kein „Workflow PDF Pro“** (Workflow PDF Pro
    speichert noch im Tablet). **Android 11+ erlaubt keine Ordnerfreigabe der obersten Ebene einer SD-Karte** (Ordnerwahl sperrt die
    Wurzel jedes Speichers und „Download“). Liegt „Private Brain“ direkt oben auf der Karte, braucht der Tresorordner einen Oberordner
    (z. B. `Tresor/`), in den „Private Brain“ zuerst verschoben wird (danach in Private Brain Pro „Vorhandenen Ordner öffnen“). Die Probe-
    Kopie „Tresor-Probe/“ ist so ein Oberordner und geht in jedem Fall. **Geklärt (Klaus' Bildschirmfotos):**
    `SD-Karte/Privat Brain Pro Hauptablageordner/Private Brain/` (6 Objekte) — der Oberordner ist da, **kein Verschieben nötig**; er wird
    der echte Tresorordner. Daneben `SD-Karte/Privat Brain Pro Ablageordner/` = Zusatzablage mit offenen Kopien, gehört nicht dazu.
    Nicht umbenennen (die Freigabe hängt am Pfad).

## 10 · Befunde aus Schritt E (Probe am Tablet, 2026-10-28, gemessen)

**Bestanden am Gerät (Galaxy Tab, DeX, SD-Karte):** Private Brain Pro 1.0.41 zog in `SD-Karte/Privat Brain Pro Hauptablageordner/` ein
(31 Einträge) · Workflow PDF Pro 1.0.6 legte dort seinen Dokumenttresor an (51 Datensätze übertragen) und zog mit demselben Passwort ein (6) ·
BookLedgerPro 0.1.0 entsperrte den Ordner und zeigte beide Fächer (nur lesen) · automatische Sicherung `BookLedgerPro/Sicherung/*.fpt`
(10:52, 11:29) · Private Brain Pro legte eine Rechnungsmail ins `Eingang-BookLedgerPro/Mails/` · „Als Beleg übernehmen“ machte daraus
Mail-Beleg + 2 PDF-Anhänge als eigene Belege. Der Einzug lief **gleich am echten Ordner** (nicht an „Tresor-Probe“); Klaus: „echt behalten“.

1. **„Ordner wählen“ in Workflow PDF Pro ist ein Umzug, kein Kopieren** (`vault-migration.js`: danach ist die interne DB nur Index).
   Eine Probe-Kopie als Ordner der App wäre nicht mehr gefahrlos löschbar. Der Brief E hatte das falsch; richtig ist: Ablage der App am echten
   Ort, Kopie nur für den Einzug.
2. **BookLedgerPro: Teilen kam nicht an.** `blp-native.js` stellte seinen Eingang nur bereit, wenn `window.launchQueue` fehlte; die WebView
   hat ein eigenes (totes). Behoben in #381 (immer `defineProperty`), Probe mit gestelltem WebView-launchQueue. ⚠ Ursache aus dem Code
   geschlossen, am Gerät mit 0.1.1 noch zu bestätigen.
3. **„Tresorordner sperren“ öffnete sofort wieder** (`zustand()` nahm den gemerkten Schlüssel) — in allen drei Apps. BookLedgerPro behoben (#382,
   `vonHandGesperrt`), Private Brain Pro in Entwurf #105 (Parallel-Sitzung, `sperren({vergessen:true})`), **Workflow PDF Pro offen**.
4. **Englische Rechnung** (Anthropic/Stripe): „Subtotal“, „VAT“, „Amount paid/due“ als Positionen gelesen → 34,31 statt 12,08 €. Behoben (#382).
5. **Teilen aus Private Brain Pro nahm still den Android-Weg**, als der Tresorordner (vermutlich) gesperrt war — keine Frage, keine Meldung.
6. **Drei Dinge heißen „Tresor“** (Speicherort, Tresorordner, alter Browser-Datei-Tresor) — Klaus konnte sie nicht auseinanderhalten.
   Entscheidung: alter Kasten weg in der Pro-App, Namen „Ablage von …“ / „Tresor (alle Pro-Apps)“ (Leitfaden).
7. **Durchgereichter Tipp (Vermutung):** „Alle prüfen“ in Workflow PDF Pro startete, ohne dass Klaus es tippte; im Code nur per Klick
   erreichbar → vermutlich ein Tipp, der beim Schließen eines Fensters an den Knopf darunter ging. Nicht nachgestellt.
8. **Sicherung in Workflow PDF Pro stürzt bei ~50 MB PDFs ab** (alles als Text im Speicher; die Grenze stand als „ungemessen“ in den Unterlagen).
9. **Einordnen (Bedeutung) startet bei jedem Öffnen** und kostet Minuten (5,5 s je Seite am Tablet, 6 Dokumente ≈ 10 min).
10. **Web-Reste in den Apps:** Installieren-Knöpfe, „Browser-Speicher“, „Browserdaten“, „nur in diesem Browser“, „Speicher dauerhaft: nein“.
11. **Web-App und App verwechselt:** das Startbildschirm-Symbol „BookLedger“ war die PWA (Kurzname), die App heißt „BookLedgerPro“; „Über“
    nennt keine Version. Die PWA zeigt keinen Tresorordner (richtig so) — erst nach Installieren der APK ging es weiter.
12. **Freischalt-Code:** Klaus kopierte den öffentlichen Schlüssel ins Code-Feld („passt nicht“); auf seinem Gerät sind ohnehin alle
    Werkzeuge frei. Öffentlicher Schlüssel (nicht geheim) `fb6cd374…709ee2f` — fest in die Apps: offen, Klaus' Wort.
13. Bedienbefunde gesammelt im **Leitfaden** `docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md` (Fortschritt, Ladeanzeigen, flache Knöpfe,
    Strichgrafiken, Listen für Hunderte, Pfad + Link, Version bei „Updates prüfen“, lesbare Dateinamen, Leistengriff mittig).

## 11 · Befunde aus der Umbau-Sitzung 1 (2026-10-28, Nachmittag, gemessen)

1. **Sperren in Private Brain Pro:** Entwurf #105 löste es mit `tresorSperren({vergessen:true})` — das hätte „Passwort merken“ bei jedem
   Sperren gelöscht. Gelöst ist es jetzt wie in BookLedgerPro und Workflow PDF Pro auf der Java-Seite (`vonHandGesperrt`); alle drei Apps
   verhalten sich gleich. Die Probe stellt jetzt Javas Verhalten nach (gemerkter Schlüssel öffnet beim Zustand von selbst, außer nach Sperren).
2. **Absturz beim Schließen (CI-Fund, Private Brain Pro):** `tresorZustand` kam nach `handleOnDestroy` an; der geschlossene Arbeits-Thread warf
   `RejectedExecutionException` auf dem Capacitor-Thread → Prozess beendet, sichtbar als rote Übersetzungs-Tests. Zweimal gleich, also kein
   Zufall. Jetzt lehnen `tresorWork`/`work` mit `NATIVE_ACTIVITY_CLOSED` ab. Andere direkte `execute`-Stellen (Dialoge nach Nutzertipp) sind
   unverändert — dort kommt kein später Aufruf.
3. **Workflow PDF Pro web-core:** einmal rot an einer Kern-Probe („page.screenshot: Unable to capture screenshot“), Neustart grün; der Diff
   berührte den Kern nicht.
4. **Web-Reste messen:** die Design-Probe läuft ohne App-Brücke — also wie die PWA, in der „Browser“ richtig ist. Die Probe auf Web-Reste
   gehört deshalb in eine Probe mit gestellter App-Brücke (`test-tresorordner`). Gefunden: 11 Stellen in Einstellungen und Einlesen.
   Zwei davon sind Probe-Artefakte (in der App setzen `native-folders.js` bzw. `pb-bildbeschreibung.js` eigene App-Texte).
5. **Ping-Pong:** `pb-bildbeschreibung.js` setzt seinen Absatz bei jeder Auffrischung, sobald der Text abweicht; eine Ersetzung darin
   erzeugte DOM-Änderungen ohne Ende (`test-help` „keine Änderungen nach Auffrischen“ fing es). Solche Absätze nie umschreiben.
6. **Zeilen idempotent bauen:** Zustand-/Pfad-Zeilen nur neu bauen, wenn sich etwas ändert (Signatur am Element) — sonst ist jedes
   Neuzeichnen eine DOM-Änderung.
7. **Öffentlicher Herausgeber-Schlüssel:** im Repo stand er nur gekürzt; Klaus gab den vollen Wert, jetzt fest in Private Brain Pro (PR #108). Nur PB prüft
   Codes. Mit festem Schlüssel vertraut jede Kopie nur noch ihm (vorher: jedes Gerät seinem eigenen Studio-Schlüssel) — Klaus' Gerät bleibt
   Herausgeber, solange sein Studio-Schlüssel dieser ist; ein anderes Studio auf einem anderen Gerät öffnet nichts mehr. Die Probe stellte
   „vor dem Einbau“ über die echte Datei nach und wurde dadurch rot; jetzt mit leerer Liste gestellt.
   Dieselbe Folge traf die Windows-Abnahme (Studio aus dem CI öffnete die Pinnwand nicht mehr): Lehre — ein fester Vertrauensanker
   macht jede Probe rot, die sich bisher selbst vertraut hat; alle Proben mit eigenem Studio vor dem Einbau suchen (`grep createKey`).
8. **`page.route` greift auch in der installierten Windows-App:** die Abnahme fängt per CDP die Anfrage an `https://tauri.localhost/license-keys.json`
   ab (gemessen in Private Brain Pro #108, Windows-Lauf grün mit den Zeilen „test-only empty publisher list is read“ und „fixed publisher key is read
   again“). Damit lassen sich mitgelieferte Dateien nur für eine Prüfung stellen, ohne das Installationspaket zu ändern.
9. **native-smoke starb vor dem ersten Test** (Emulator-SDK „Error on ZipFile unknown archive“) — Infrastruktur, kein Code; ein Neustart war erst nach
   dem Ende des Laufs möglich (vorher 403 „already running“). Derselbe Stand war im zweiten Lauf grün.
10. **Lokale Proben gegen ein altes Bündel:** `test-tools` liest `www/`, nicht `native/`; nach einer Änderung in `native/` war die Probe rot, bis die
    Datei nach `www/` kopiert war (`build:web` scheitert im Behälter an der OCR-Beschaffung). Vor jeder lokalen Probe geänderte `native/`-Dateien nach `www/`.

## 12 · Befunde aus der Umbau-Sitzung 2 (2026-10-28, Abend, gemessen)

1. **Sprachschicht und Ersatzschicht (Workflow PDF Pro):** Der Kern übersetzt im DOM (`sprache.js`, Deutsch ist der Schlüssel). Eine Schicht,
   die deutsche Sätze vorher ersetzt, nähme ihr den Schlüssel. Deshalb ersetzt `native-ohne-web.js` je Sprache und erst im Mikrotask nach dem
   Beobachter der Sprachschicht. Die Probe misst danach 1,2 s lang null DOM-Änderungen (kein Hin und Her).
2. **Satz mit Auszeichnung:** Sätze mit `<b>` stehen in mehreren Textknoten; eine Wendung über die Grenze („diesen</b> Browser“) trifft nie.
   Dort ersetzt die App ohnehin den ganzen Absatz (`native-vault.js`), die Probe bestätigt es.
3. **Platzhalter an Eingabefeldern:** die Ausnahme „input“ galt zuerst auch für Attribute — „nur in diesem Browser gespeichert“ blieb. Die Probe fand es.
4. **Ein Python-Ersatz zerbrach Java** (`old[:-2]` schnitt die Klammer ab). Im Behälter gibt es kein Android-SDK; erst CI fand es. Lehre: Java-Stellen
   mit festem Ersatztext ändern, nicht mit Schnitten; reine Logik (`UpdateRegel`) separat mit javac + org.json prüfen.
5. **Windows-Abnahme las „den ersten Absatz“** des Fensters; jetzt steht dort die (zugeklappte) Erklärung hinter ⓘ. Proben auf Kennungen
   (`#nativeAblageZeile`) statt Positionen stellen.
6. **BookLedgerPro: Unterordner im Fach** versteckten die Sicherungen eine Ebene tiefer — `smoke_tresorordner` fand den nicht sichtbaren Knopf.
   Unterordner sind jetzt offen, solange nicht „Alle zu“ gewählt ist.
7. **Brücke ohne Methode:** `appOeffnen` darf nur angeboten werden, wenn die Hülle die Methode hat (ältere APK ohne sie zeigt weiter „nur in der App“).
8. **BookLedgerPro-Repo ist privat** → keine Updateprüfung in der App ohne Token; „Über“ nennt nur die Version.

## 13 · Befunde aus der Umbau-Sitzung 3 (2026-10-28, spät, gemessen)

1. **Warum die Sicherung bei ~50 MB starb:** der Kern legt jede PDF als base64 in ein JSON, verschlüsselt den ganzen Text in einem Stück, kodiert das
   Ergebnis erneut und baut daraus noch einmal Bytes. Gemessen an 60 MB: **+≈ 900 MB JS-Speicher** in der Spitze. Gestreamt (192-KB-Stücke, je AES-GCM, sofort
   über `WorkflowFiles.append` in die Datei): kein messbarer Zuwachs. AES-GCM in WebCrypto kann nicht strömen — deshalb viele kleine Pakete mit Nummer und Kopf
   als Zusatzdaten (AAD) und einem Schluss-Stück; Umstellen, Abschneiden, Anhängen fallen auf.
2. **Format-Wechsel ohne Kerneingriff:** der Dialog des Kerns bleibt; seine zwei Knöpfe werden im Fang-Abschnitt (`click`, capture) übernommen. Für alte
   `.json`-Sicherungen gibt die Schicht den Klick an den Kern zurück (Kennzeichen am Dateianfang). `accept` der Dateiwahl kennt jetzt `.wfps`.
3. **Einordnen anhalten, ohne den Kern zu ändern:** angehalten wird an der einen Stelle, an der gerechnet wird (`SbkimEmbedding.embedPassageBatch`, über einen
   Setter auf `window`, weil Modul 03 erst später lädt); die Frage (`embedQuery`) läuft frei, Suchen geht also sofort.
4. **Durchgereichter Tipp, nachgestellt:** auf Touch landet der Klick nach dem Loslassen dort, wo der Finger jetzt ist. Schließt sich beim Antippen ein Fenster
   (oder rutscht die Liste), trifft er den Knopf darunter — als PWA startete so „Alle prüfen“ ohne Zutun. Schutz: Start-Knöpfe nur, wenn der `pointerdown`
   auf ihnen war; Tastatur (detail 0) bleibt erlaubt. Ob genau das am Tablet passierte, ist nicht bewiesen.
5. **Chromium: Inhalt eines geschlossenen `<details>`** hat (neuer Rendering-Weg mit content-visibility) trotzdem `getClientRects()` — die Probe meldete den Knopf
   als sichtbar. Sichtbarkeit mit `checkVisibility()` messen.
6. **BookLedgerPro: das Suchfeld war 90 px hoch** — `.beleg-text` (für Textfelder gedacht, `min-height: 90px`) galt auch für das `<input>` der Suche. Gefunden
   erst durch die neue Probe „Schalter in derselben Zeile“.
7. **Wettlauf in `smoke_belegsuche`:** „Suchkarte … + .mikro“ prüfte, bevor der Beobachter das Mikrofon angehängt hatte (einmal rot, danach 2× grün). Die Probe
   wartet jetzt darauf.
8. **Playwright** reicht `setInputFiles` mit Puffer nur bis 50 MB — größere Dateien als Pfad übergeben. `crypto.getRandomValues` nimmt höchstens 65 536 Bytes.
9. **BookLedgerPro hatte dasselbe Auto-Einordnen** wie Workflow PDF Pro (bei jedem Öffnen der Belege); jetzt erst nach „Einordnen“ je Sitzung, das Modell lädt
   sonst bei der ersten Frage.

## 14 · Befunde aus der Umbau-Sitzung 4, BookLedgerPro (2026-10-28, Nacht, gemessen)

1. **Emoji-Ersatz je Ansicht reichte nicht:** Umbau 3 hängte `strich.js` nur an die Belegseite; Dialoge und Hinweise hängen am `<body>`, Lampen-/Knopf-Titel
   tragen Emojis in Attributen, `<option>` kann kein SVG. Jetzt ein Beobachter am `<body>` (je Wurzel einer), der nur die geänderten Knoten ansieht — bei
   Hunderten Belegzeilen würde ein Gang über die ganze Seite je Änderung teuer. Wo kein Symbol stehen kann, fällt das Emoji weg.
2. **Wächter-Regel übernommen** aus Private Brain Pro (`test-design-26`): `\p{Extended_Pictographic}` ohne ↗©™®↔↕↺↻ — sonst wäre ⚠ ℹ ✉ ⬇ ☰ unerkannt
   (✓ → ✗ sind keine Bildzeichen und zählen nicht).
3. **Probe stürzte am Zeitablauf ab, statt rot zu melden** (Gegenprobe „ohne Aufgabe“/„ohne Knopf“): `waitForFunction`/`click` werfen. Jetzt fangen alle
   Wartestellen ab und jede fehlende Stelle wird eine eigene rote Zeile (Lehre aus Workflow PDF, „Probe stolperte, statt zu melden“).
4. **Übergabefächer im Tresor-Paket:** nur `Eingang-BookLedgerPro` und `Eingang-WorkflowPDF` (Fach.java). Private Brain hat keins — ein Fach dafür wäre
   ein Eingriff ins gemeinsame Paket (nur in Workflow PDF Pro). `darfSchreiben` erlaubt jeder Pro-App das Ablegen in Übergabefächern, ohne Java-Änderung hier.
5. **Hintergrund beim Wechsel in den Hintergrund:** die automatische Sicherung startet bei `visibilitychange: hidden`. Android 12+ verbietet dann oft den
   Start eines Vordergrund-Dienstes; das Plugin fängt das ab (`geschuetzt: false`) und die Sicherung läuft wie bisher. Am Gerät nicht gemessen.

## 15 · Befunde vom Tablet (Klaus, 2026-10-28, geteilte Ansicht) und ihre Ursachen

1. **Kamera öffnete nur die Dateiwahl:** Capacitors `BridgeWebChromeClient.onShowFileChooser` nimmt bei `accept=image/*` + `capture` die Kamera, legt das
   Foto aber unter `getExternalFilesDir(Pictures)` an und holt die Adresse über den FileProvider. BLPs `file_paths.xml` kannte nur `cache/share/`
   → `getUriForFile` warf, `showImageCapturePicker` gab false, und Capacitor fiel **ohne Meldung** auf die Dateiwahl zurück. Workflow PDF Pro hatte den
   Eintrag schon. Lehre: ein stiller Rückfall im Rahmenwerk sieht aus wie „Kamera kaputt“.
2. **„Sprachfehler: not-allowed“ und hängendes blaues Feld:** gleicher Befund wie Private Brain Pro .24 — die WebView meldet `webkitSpeechRecognition`,
   verweigert sie aber; `onend` kam nicht, der Knopf blieb an. Androids Sprachfenster (`RecognizerIntent`) braucht kein Mikrofon-Recht.
3. **Positionszeile verrutschte:** nicht das Raster, sondern die Mikrofon-Leisten waren zusätzliche Rasterzellen. `display: contents` für die
   Leiste ohne Mikrofon behält den Wort-Speicher und nimmt keinen Platz.
4. **„Modell lädt“ ohne Bewegung:** transformers.js meldet Datei-Fortschritt nur, wenn man `progress_callback` mitgibt; BLP gab es nicht mit.
5. **Eingebettete Apps:** byte-1:1 heißt, nur über BLP-eigene Dateien gestalten (Thema-CSS, Brücke). Die Brücke lädt `strich.js` aus BLP und
   hängt die Sprites selbst ein (`<use href>` sucht im eigenen Dokument). Der App-Vorrat ist „Vorrat zuerst, im Hintergrund frisch“ — eine neue
   Thema-Datei wirkt erst beim zweiten Öffnen.
6. **Probe maß Oberkanten:** bei unterschiedlich hohen Feldern (Knopf 28, Feld 30 px) ergeben gleiche Zeilen verschiedene Oberkanten; gemessen
   wird jetzt die Mittellinie (± 4 px). Lange Kontonamen brechen richtigerweise um — gemessen wird die Zeilenzahl des Texts in der Spalte „Art“.


## 16 · Befunde aus der Umbau-Sitzung 4, Private Brain Pro und Workflow PDF Pro (2026-10-28, Nacht, gemessen)

1. **Hintergrundaufgabe:** Vordergrund-Dienst `dataSync` mit Mitteilung ist der einzige erlaubte Weg, eine WebView-Arbeit am Leben zu halten
   (Capacitor `KeepRunning=true` pausiert die WebView nicht; Android würgt aber den Prozess ohne Dienst ab). Regeln aus dem Bau: nie `stopService`
   vor `startForeground` (Absturz), sondern der Dienst hält sich selbst an (`stopForeground(REMOVE)` + `stopSelf`); Android 15 begrenzt `dataSync` auf
   6 Stunden → `onTimeout` bricht alle Aufgaben mit Grund „zeit“ ab; `WebView.setRendererPriorityPolicy(IMPORTANT, false)` hält den Renderer vorn.
   Die Erlaubnis für Mitteilungen wird nur nach einem Tipp gefragt (`navigator.userActivation.isActive`), unter Instrumentierung nie.
2. **Workflow PDF Pro: Einordnen war nicht zu erkennen**, weil der Kern im Zustand „bereit“ neu einordnet. Erkannt wird es jetzt an laufenden
   Rechnungen des Modells (in den letzten 2,5 s), nicht am Zustand. Lehre: Zustandswörter des Kerns sagen nicht, ob gerechnet wird.
3. **Gerätecheck:** Windows-Laufzeit ist mit jlink ohne `java.management` gebaut → Arbeitsspeicher, Prozessor und Grafik kommen aus CIM über
   PowerShell (8 s Höchstdauer, Ausgabe über eine Temp-Datei, ISO-8859-1 gelesen, damit die Konsolen-Codepage nie scheitert); `AdapterRAM` ist bei
   4 GB gedeckelt, der genaue Wert steht beim Treiber (`qwMemorySize`). Android: `ActivityManager.MemoryInfo`, `StatFs`, `SOC_MODEL`.
   Stufe nie „groß“ ohne RAM-Wert. Am echten Rechner nicht gemessen.
4. **Zweites Bedeutungs-Modell nur für die App-Suche:** Modul 03 (Sage-Kanon) ist fest auf e5-small (384 Dimensionen) — das Mycel braucht dieselben
   Vektoren auf allen Knoten. Ein größeres Modell darf deshalb nur die eigene Suche bedienen. Lernlauf 40758382311 (headless Chromium, erfundene Texte):
   klein 129 MB · 54 ms je Abschnitt · 762 MB Renderer-Spitze; mittel (e5-base) 282 MB · 144 ms · 1332 MB; groß (e5-large) 552 MB · 470 ms · 2252 MB;
   alle 10/10 Treffer. ⚠ Die kleine Probe trennt die Stufen in der Güte nicht — ob „groß“ besser findet, zeigt erst ein größerer Prüfsatz.
5. **Mikrofon-Regel in allen Pro-Apps gleich:** nur Suchfelder, Freitext (textarea) und Felder mit `data-dictate`; Eingabesprache und Rechtschreibung
   bleiben an allen Textfeldern. Proben, die Mikrofone an jedem Feld erwarteten, wurden auf die Regel umgestellt.
6. **main war rot nach #109** (nur Android-Version gesetzt): die Windows-Prüfung verlangt gleiche Versionsangaben in `build.gradle`, `package.json`,
   `Cargo.toml` und `tauri.conf.json`, und die Updateprobe zeigt auf den zuletzt veröffentlichten Installer (jetzt 1.0.41 → 1.0.42). Lehre: Versions-
   anhebung immer für beide Plattformen in einem PR.

## 17 · Stundennachweis: Klaus' Arbeitszeit wurde nicht aufgeschrieben (2026-10-28, gemessen aus Commits)

**Befund:** Einen Stundennachweis führte nur der Workflow-PDF-Kern in seinen Abschlussberichten, zuletzt am 2026-10-11. In BookLedgerPro, Private Brain
Pro, Workflow PDF Pro und BookLedger Basic stand seit dem 2026-10-12 **keiner** — Klaus hat das bemerkt („ihr schreibt meine Arbeitsstunden nicht auf").
**Ursache:** Die Regel stand nur in den Sitzungsbriefen des Kerns, nicht in den `CLAUDE.md` der Pro-Repos; neue Sitzungen lasen sie nie.

**Nachgetragen** (`docs/STUNDENNACHWEIS.md`, aus 600 Commits auf `main` der vier Repos, Ortszeit Berlin):

| Zeitraum | Arbeitstage | sicher (Commit-Blöcke, ≤ 60 min Abstand) | höchstens (erste → letzte Spur je Tag) |
|---|---|---|---|
| 2026-10-12 bis 2026-10-28 | 15 | 86,3 h | 174,3 h |
| davon 2026-10-28 (diese Sitzung eingeschlossen) | 1 | 8,8 h | 12,4 h (09:34 → 21:56), Abschluss bis etwa 22:10 |

Längste Tage: 26.10. (13,4 h sicher), 21.10. (12,3 h), 24.10. (9,6 h), 25.10. (9,2 h).

**Grenzen:** GitHub kennt Klaus' Zeit nicht. Am Tablet prüfen, Bilder machen, lesen und mit Claude sprechen hinterlassen keinen Commit; die sichere Zahl ist
deshalb zu klein. Andere Repos (Private Brain V3, Workflow-PDF-Kern, WorkFlohs, Sage, Meine Familienakte) und die Zeit vor dem 12.10. sind nicht geprüft.
Klaus' eigene Angabe geht vor.

**Lehre und Regel:** Was eine Sitzung über Repos hinweg tun soll, gehört in jede `CLAUDE.md`, die eine Sitzung liest — nicht nur in einen Brief. Seit
2026-10-28 steht in BookLedgerPros `CLAUDE.md`: jeder Abschluss bekommt den Abschnitt „Stundennachweis“ und eine Zeile in `docs/STUNDENNACHWEIS.md`.

## 18 · Befunde aus der Umbau-Sitzung 5: Windows, Scanner, Updates vom eigenen Server (2026-10-28, Nacht, gemessen)

1. **BookLedgerPro unter Windows nach dem Vorbild Private Brain Pro** (#399): Tauri 2 + WebView2 als Hülle, die Arbeit in einem Java-21-Kindprozess
   über stdio (je Zeile ein JSON). So bleibt das Tresor-Paket `de.familyprojekt.tresor` byte-gleich mit Android; nur die Ablage (`SafAblage` →
   `DateiAblage`) ist ausgetauscht. Das Passwort fragt nur die Hülle in einem eigenen Fenster, „Merken“ über DPAPI mit Entropie je Bindung.
   Gemessen auf dem GitHub-Windows-Rechner: Installieren, Starten, Entfernen. ⚠ Nicht an einem echten Windows-PC.
2. **Lehre aus der Abnahme:** nach dem Entfernen durch NSIS steht der Registry-Eintrag noch kurz da; die Probe wartet jetzt auf beides (Programmdatei
   weg **und** Eintrag weg). Dieselbe Falle hatte Private Brain Pro.
3. **Scanner und Kamera unter Windows** (WPP #39, gemeinsamer Baustein, Pin `native/pro-scanner-herkunft.json`): WIA über ein eingebettetes
   PowerShell-Skript (`-EncodedCommand`, Auftrag als Base64-JSON in einer Umgebungsvariable — keine Anführungszeichen-Falle in der Befehlszeile);
   mehrere Scanner (USB, WLAN/Netz) wählbar, Glas oder Einzug, dpi, Farbe; Kamera (Webcam, angeschlossene Digitalkamera als Webcam) als Livebild.
   Gemessen auf dem GitHub-Rechner: Geräteliste (0 Geräte), „unbekanntes Gerät → SCANNER_FEHLT“, „kaputter Auftrag → SCANNER_AUFTRAG“.
   ⚠ **Kein echter Scanner, keine echte Kamera gemessen.** Die Probe für „Kamera aus“ war zuerst blind (sah nur das Fenster); jetzt zählt sie die
   Spuren aus `getUserMedia` und verlangt, dass alle beendet sind.
4. **Prüfung aller Pro-Varianten auf Updates** (echte GitHub-Daten, nicht nur Code gelesen): Private Brain Pro Android 1.0.40/1.0.41 → 1.0.42 und
   Windows 1.0.40 → 1.0.41 funktionieren (Windows 1.0.42 ist nicht veröffentlicht). Workflow PDF Pro Android funktioniert (→ 1.0.7).
   **Workflow PDF Pro Windows war nie eingerichtet:** `windows/signing/updater.pub` leer, keine `latest.json` — der Knopf meldete „nicht eingerichtet“.
   Behoben wie Android (#40): die Brücke liest die öffentlichen Veröffentlichungen `windows-vX.Y.Z` mit Setup, „Herunterladen“ öffnet die feste
   Release-Seite. BookLedgerPro hatte keine Updateprüfung (Repo privat → GitHub-Releases von außen nicht lesbar).
5. **Updates vom eigenen Server** (#400, Klaus' Wahl): `https://family-projekt.de/updates/bookledgerpro/`, je Plattform eine Feed-Datei
   (`aktuell-windows.json`, `aktuell-android.json`) mit Ed25519-Unterschrift (`.sig`, Base64). Die App glaubt nur der Unterschrift, nimmt nur eine
   **neuere** Version, baut die Download-Adresse selbst (feste Basis + Dateiname nach festem Muster) und prüft Größe und SHA-256. Hochladen: GitHub-Lauf
   nur von Hand, rsync mit einem Schlüssel, der auf dem Server über `rrsync` nur in `/srv/family-project/updates` schreiben darf; die Server-Kennung steht
   fest im Lauf. Eingerichtet in Klaus' Termux und dort gemessen: Probe von außen lesbar, Hochladen mit dem GitHub-Schlüssel geht, `ls /` wird abgelehnt
   („SSH_ORIGINAL_COMMAND does not run rsync“), Server-Kennung und öffentlicher Schlüssel stimmen mit Lauf und App überein, Geheimnisse
   `BLP_UPDATE_UPLOAD_KEY` und `BLP_UPDATE_SIGNING_KEY` in GitHub, Sicherung `~/blp-update-schluessel.age`. ⚠ Der ganze Weg (Lauf → Server → App lädt
   und installiert) ist erst mit der ersten Veröffentlichung gemessen; die gibt es nur auf Klaus' Wort.
6. **Eine Feed-Datei je Plattform, nicht eine gemeinsame:** mit einer gemeinsamen Datei hätte eine Android-Veröffentlichung die Windows-Angaben
   überschrieben (oder umgekehrt), solange beide Läufe getrennt sind. Der Windows-Lauf gleicht nur Windows-Dateien ab (rsync mit Filter).
7. **Android prüft Ed25519 erst ab Version 13 selbst** (API 33); das Tab S6 hat Android 12, die App läuft ab 7 (minSdk 24). Deshalb die kleine
   Prüfbibliothek `net.i2p.crypto:eddsa:0.3.0` und ein eigener Base64-Leser (`java.util.Base64` gibt es erst ab Android 8). Vor dem Installieren:
   gleiches Paket, gleiches Signier-Zertifikat, höherer versionCode — sonst wird nichts installiert. JVM-Probe `UpdateFeedTest` 11 grün mit echten
   openssl-Unterschriften. ⚠ Androids Installieren-Fenster und die Erlaubnis „Apps installieren“ sind am Gerät nicht gemessen.
8. **Die eingebaute Java-Laufzeit war zu klein** (rot in CI, Lauf 40779862754): jlink nahm nur `java.base,java.logging`; `DesktopUpdates` braucht
   `java.net.http`, und Ed25519 liegt in Java 21 noch in `jdk.crypto.ec` (erst ab 22 in `java.base`). Folge: der Kindprozess startete gar nicht
   (`NoClassDefFoundError` → `APP_RUNTIME_UNAVAILABLE`). Lokal mit jlink nachgestellt: ohne die Module rot, mit grün; `KeyFactory.getInstance("Ed25519")`
   meldet mit `jdk.crypto.ec` „SunEC version 21“, ohne wirft es. Die Engine-Proben liefen mit dem vollen JDK und sahen es nicht. Lehre: jede neue
   Java-Klasse aus einem anderen Modul braucht einen Blick auf die jlink-Liste; die Protokoll-Probe gegen die **gebündelte** Laufzeit ist der Wächter
   und nennt jetzt den Startfehler.
9. **Zweites Bedeutungs-Modell verdrahtet** (Private Brain Pro #114): Stufe Mittel/Groß nur für die App-Suche, eigene Werte (IndexedDB `pb_meaning_v1`),
   Mycel/Siegel/Modul 03 bleiben e5-small. Die Suche nutzt das große Modell nur, wenn alles eingeordnet ist, sonst Modul 03. Proben `test-meaning` 34,
   Gegenprobe 12/12. ⚠ Echtes Modell in der App und am Gerät nicht gemessen (siehe § 16.4 für die Lernlauf-Zahlen).
10. **`pro-geraet.js` (Fassung 3) nachgezogen** nach Workflow PDF Pro und BookLedgerPro, byte-gleich über die Pins. In Workflow PDF Pro musste er in die
   Liste der Bedien-Dateien (`bedienFiles`), sonst lud ihn die App nicht.
11. **Basic** zweimal nachgezogen (#13 auf `26a25fc`, #14 auf `1127038`); für die PWA wirkt jeweils nur der Cache-Bump, alles Neue hängt an
   `window.BLPNative`.

## 19 · Befunde aus Schritt 4: Workflow-PDF-Kern 1.1.4 und Workflow PDF Pro 1.0.8 (2026-10-29, Nacht, gemessen)

Kern-PR Workflow-PDF #136 (main `2ac96d4`), Pro-App Workflow-PDF-Pro #41 (`upstream/` = Kern `1937478`, 203 Dateien, 0 Abweichung).

1. **Die Arbeitsleiste zeichnete sich endlos neu:** `pruefLeiste` verglich mit `innerHTML`, das der Browser normalisiert (und `strich.js` ersetzt
   Emojis darin) — nie gleich. Jetzt Vergleich mit dem erzeugten HTML (`l._html`). Lehre: nie gegen die Serialisierung des DOM vergleichen.
2. **`einordnenLauf` las seinen eigenen Lauf vor der Zuweisung (TDZ):** das Versprechen wurde in `BED.einLauf` gemerkt, während der asynchrone Rumpf
   schon synchron lief. Jetzt `await Promise.resolve()` als erste Zeile. Lehre: ein asynchroner Selbstbezug braucht erst einen Mikrotakt.
3. **Nach dem Zurückschalten auf Deutsch stand das Emoji kurz als Text da:** `sprache.js` schrieb das Original zurück, nachdem `strich.js` schon lief.
   Jetzt ruft der Satz-Aufbau selbst `Strich.ersetzen`; ein `svg[data-strich]` zählt im Schlüssel als sein Emoji, die Wörterbücher bleiben unverändert.
4. **Kopfzeile bei 320 px nur in CI abgeschnitten:** die CI-Schrift ist breiter; sechs Knöpfe zu 32 statt 31 px machten die Gruppe 5 px breiter. Die
   flachen Kopf-Maße gelten erst ab 521 px. Lehre: Kopfzeile mit der CI-Schrift messen (`kopfzeile-schrift.mjs`, DejaVu).
5. **Echter Fehler, in CI gefunden: die erste Suche nach dem Neuladen fand nichts.** Seitentext wird jetzt erst beim Suchen geladen; kam er aus IndexedDB
   statt neu gerechnet, galt er nicht als „neu“ und die Liste wurde nicht neu gezeichnet. Jetzt zählt auch Text aus dem Speicher als neu. Derselbe Fehler
   machte WPP `web-core` rot.
6. **Probe B12b war zweimal blind:** die Bedeutungssuche zeichnet die Liste von selbst neu und deckte den Fehler zu; erst ein eigener Kontext ohne
   Bedeutungssuche fängt ihn (Fall 16). Lehre: eine Probe braucht einen Kontext, in dem kein anderer Weg dieselbe Arbeit tut.
7. **`window.ProHintergrund` gibt es in der Pro-App immer** — eine Probe auf sein Dasein misst nichts; geprüft wird `verfuegbar()`.
8. **Bibliothek lädt nur Vorschaubilder (gemessen):** beim Öffnen 0 Lesezugriffe auf Dateien, 0 auf Seitentext, 0 × `getDocument`. Ausnahme: Sortieren
   nach Dateigröße liest die Dateien weiter.
9. **Scanner direkt aus BookLedgerPro (Android):** Workflow PDF Pro versteht jetzt den Intent `de.familyprojekt.workflowpdf.pro.SCANNEN` (Paket fest,
   Zusatz `von`, höchstens 40 Zeichen), beim Kaltstart und in der laufenden App; „Durchsuchbar“ gilt nur für diesen Scan. Rückweg „Teilen“ →
   BookLedgerPro (Android erlaubt keine Vorauswahl). JVM-Probe `ScanDirektTest` 2. ⚠ BookLedgerPro ruft den Intent **noch nicht** auf (heute
   `BlpTresor.appOeffnen`); Windows hat keinen solchen Weg.
10. **Fach `Eingang-WorkflowPDF`** wird in „Tresor & Ablage“ und als Hinweis über den Karten gezeigt, in 192-KB-Stücken gelesen, über `importDateien`
    eingelesen und danach „übernommen“ markiert; das Tresor-Paket ist unverändert. ⚠ Nur mit gestellter Brücke gemessen.
11. Proben: Kern `npm test` 0 · neu `tests/arbeit.mjs` 40 · Gegenprobe `gegenprobe_arbeit.mjs` 16/16 gefangen · drei tote Gegenprobe-Anker, schon auf
    main kaputt, nebenbei repariert. WPP `verify-upstream` 203/0 · `test:native-web` 57/0. ⚠ Kein Tablet; echtes Sprach- und Bildmodell, echte
    Android-Mitteilung und echter Ordner nicht gemessen; die SBKIM-Mycel-Pille (byte-1:1) trägt weiter ihr Zeichen.

## 20 · Befunde aus der Umbau-Sitzung 6: Scanner-Intent und Test-APKs (2026-10-29, Nacht, gemessen)

PRs: BLP #402 (Intent), #403 (0.1.2), #404–#408 (Release-Probe), Basic #16/#17, WPP #41 (aus Umbau 5 übernommen), WPP #42 (Doku).

1. **Ein Abschluss kann „alles auf main“ sagen, wenn zwei PRs noch offen sind.** BLP #401 und WPP #41 standen offen, CI lief noch. Lehre: am
   Sitzungsbeginn den Stand der PRs der Vorsitzung selbst lesen, nicht dem Abschluss glauben.
2. **Der Brief nannte „BookLedgerPro 0.1.1“ als neue Veröffentlichung — 0.1.1 war seit dem 28.10. abends draußen.** Erst die Liste der Releases zeigte es.
   Lehre: vor jedem Veröffentlichungslauf `releases` lesen; Version und Buildnummer erhöhen, sonst lehnt die Probe ab oder die App aktualisiert nicht.
3. **Intent mit Rückfall in Stufen:** `resolveActivity` auf den Intent `SCANNEN` (Paket fest, `<queries>` nennt das Paket schon) → sonst
   `getLaunchIntentForPackage` → sonst `APP_FEHLT`. Damit läuft BookLedgerPro 0.1.2 auch neben Workflow PDF Pro ≤ 1.0.7 (die Antwort `weg: "app"`
   wählt den alten Satz). Die Seite fällt bei fehlender Methode (Windows-Hülle, ältere Android-Hülle) auf `appOeffnen` zurück — drei Proben dafür in
   `smoke_befunde` A2, Gegenprobe (Direktweg weg) genau eine rote Zeile.
4. **Die Ereignisse der PR-Überwachung meldeten „success“, während GitHub die Läufe noch als „in_progress“ führte; auch zwei Weckrufe kamen vor ihrer
   Zeit.** Nur die Lauf-Abfrage (`actions/runs/<id>`) zählt. Lehre: bei Freigaben und Merges immer den Lauf selbst lesen.
5. **Emulator-Probe der Veröffentlichung, acht Anläufe für zwei APKs.** WPP Versuch 1 — nach Enter im Ordner-Dialog stand der Startbildschirm da (Ursache
   offen, im Browser fehlerfrei nachgespielt, Versuch 2 bestanden, beides API 31; die „API 35“ im Protokoll ist nur die Quelle des WebView-Pakets).
   BookLedgerPro brauchte sechs Anläufe, jeder zeigte eine neue Schicht:
   (1) „Passwortfeld 2 ließ sich nicht sicher füllen“ → #404 (drei Wege, Lage ins Protokoll); (2) Systemabbild-Download kaputt („Error on ZipFile“), Probe lief
   nicht; (3) sichtbar nur **„Pixel Launcher isn't responding“** → #405 tippte „Warten“; (4) das Deckblatt ist seit #400 (Version, „Auf Updates prüfen“) länger,
   „Zur Anmeldung“ fehlte im Baum → #406 wischt weiter; (5) Siegel-/LEBT-Fenster offen: ein „Warten“-Tipp traf die App, als der Dialog schon weg war →
   #407 blendet Fehlerdialoge im Wegwerf-Emulator aus (`settings put global hide_error_dialogs 1`) und tippt nichts blind; (6) Erstinstallation bestanden,
   aber nach dem Überinstallieren traf der Tipp in die Mitte von „Zur Anmeldung“ die **schwebende SBKIM-Leiste** (LEBT-Fenster) → #408 tippt eine freie Stelle
   des Knopfes; danach grün (Lauf 40811612794). Lehren: eine Probe muss ihre Lage selbst ins Protokoll schreiben (Artefakte sind aus der Sitzung nicht
   ladbar, Speicherhost gesperrt); nie blind auf einen Dialog tippen, der verschwinden kann; schwebende Leisten über Knöpfen sind auch für Menschen am
   kleinen Bildschirm eine Falle (für Klaus' Gegenprobe vermerkt). Der Versionssprung 0.1.1 → 0.1.2 brachte die längeren Deckblatt-Zeilen, die die alte
   Probe nicht kannte — eine Änderung am Deckblatt verlangt einen Blick in `verify-signed-install.py`.
6. **Gradle fand Maven-Central-Pakete nicht** (WPP Freigabeprüfung, `android-product (35)`), bevor ein Test lief → einmal neu gestartet, grün.
7. **Zwei Sitzungen gleichzeitig:** die Vorsitzung übernahm Basic #15 während dieser Sitzung; Basic #16 bekam dadurch einen Konflikt in `CLAUDE.md` und
   `HERKUNFT-PRO.json`. Gelöst durch Zusammenführen und **neues Nachziehen** (der Pin wird geschrieben, nie von Hand gemischt).
8. **Erster Lauf über den eigenen Server:** BookLedgerPro 0.1.2 — Update-Datei gebaut, unterschrieben, gegen den Schlüssel der App geprüft, nach
   `family-projekt.de/updates/bookledgerpro/` hochgeladen und von außen geprüft (alles im Lauf grün; aus der Sitzung ist der Host gesperrt).
9. ⚠ Nicht gemessen: der Intent zwischen zwei echten signierten Apps, am Tablet; „Auf Updates prüfen“ 0.1.2 → nächste Fassung erst mit der nächsten
   Veröffentlichung. Windows nicht veröffentlicht (Klaus: später).
