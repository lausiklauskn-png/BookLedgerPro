# Brief für die nächste Sitzung: gemeinsamer Tresorordner (Schritt B), dann C, C2, D

Stand 2026-10-26 abends. Schritt A (BookLedgerPro als Android-App ohne Ordner) und A2 (eigene Signatur) sind auf `main`;
Abschluss: `BRIEF_ABSCHLUSS_2026-10-26_ANDROID-SCHRITT-A.md`.

## Startauftrag zum Einfügen (Kurzfassung, Copy-Paste)

```
BookLedgerPro (lausiklauskn-png/BookLedgerPro), Tresorordner Schritt B. Lies zuerst CLAUDE.md, dann BRIEF_SITZUNG_TRESORORDNER-SCHRITT-B.md, BRIEF_SITZUNG_ANDROID-TRESORORDNER.md (meine fünf Antworten gelten) und Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md (§ 1, 2, 7). Stand: Android-Hülle und Signatur sind auf main (Zertifikat 7a6217eb…), noch ohne Tresorordner.
1. Gib mir zuerst den Termux-Block zum Löschen der offenen Freigabe-Kopie (ohne Erklärung, ich schicke die Ausgabe zurück).
2. Stell mir die eine Frage: wo wird das gemeinsame Paket de.familyprojekt.tresor gepflegt (deine Empfehlung: Workflow PDF Pro)?
3. Dann bau Schritt B (gemeinsamer Kopf mit Hauptschlüssel, ein Passwort, Ersatzschlüssel 5/3, verschlüsseltes Inhaltsverzeichnis je Fach), danach C, C2, D wie im Brief.
Termux-Befehle immer als ein Block ohne Erklärung, GitHub-Schritte als kurze Liste mit Links (meine Seite ist übersetzt: „hauptsächlich“ = main). Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat, nichts an meinen echten Tresoren ohne Kopie und Rückweg. Selbst mergen wenn CI grün. Am Ende: Abschluss, Forschungseinträge, Brief für die nächste Sitzung und die Kurzfassung als Copy-Paste-Block.
```

## Zuerst lesen (in dieser Reihenfolge)

1. `CLAUDE.md` (oben: Fahrplan, Android-Hülle)
2. `BRIEF_SITZUNG_ANDROID-TRESORORDNER.md` — **Klaus' fünf Antworten** (gelten, nicht neu fragen) und die Schritte B–D im Wortlaut
3. Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md — § 1–2 (zwei Ordnerschichten, Vorschlag Hauptschlüssel) und
   § 7 (Befunde aus Schritt A: Hauptzweig, Actions-Rechte, Netz im Behälter)
4. `docs/ANDROID.md` — was die Hülle kann und nicht kann
5. `docs/design/PLAN-TRESORORDNER-2026-10-26.md` — Fächer, Regeln, Passwort/Ersatzschlüssel

Klone daneben brauchen: `Privat-Brain-Pro` (Vault, VaultCrypto, VaultRecovery), `Workflow-PDF-Pro` (DocumentVault, Schlüssel-Plätze,
`upstream/`-Gleichstand, Rust-Zwilling), `BookLedger-Basic` (nach PWA-Merges nachziehen).

## Klaus' Arbeitsweise in dieser Reihe

Klaus (2026-10-26): Befehle für Termux als **ein Block ohne Erklärung**, er gibt die Antwort per Kopieren zurück, dann der nächste
Block. GitHub-Schritte als kurze Liste mit Links. Die GitHub-Oberfläche ist bei ihm **automatisch übersetzt** („hauptsächlich" =
`main`, „Workflow ausführen" = Run workflow). Die Sitzung darf PRs anlegen und mergen, aber **keine Läufe per `workflow_dispatch`
starten** (404) — das tippt Klaus.

## Gleich zu Beginn (klein)

1. **Termux-Gegenprobe der Freigabe** (Klaus hat sie noch nicht zurückgemeldet):
   ```
   cd ~ && age -d blp-freigabe.age | wc -c && rm -f blp-freigabe.txt && ls -l blp-freigabe.*
   ```
   Erwartet: `64` und nur noch `blp-freigabe.age`.
2. **Eine Frage an Klaus vor Schritt B** (Brief A ließ sie offen): Wo wird das gemeinsame Java-Paket `de.familyprojekt.tresor`
   gepflegt? *Empfehlung:* in **Workflow PDF Pro** (dort liegt die reifere Schicht: Schlüssel-Plätze, Ersatzschlüssel 5/3,
   Satz-Index, Windows-Zwilling in Rust; das Muster `upstream/` + SHA-Pins gibt es dort schon). Die anderen zwei Apps kopieren
   byte-gleich und pinnen.

## Schritt B — gemeinsame Ordnerschicht (`de.familyprojekt.tresor`)

- Kopf `tresorordner.json` (Format `familyprojekt-tresorordner`, Version 1): **Hauptschlüssel**, verpackt in Plätzen (Passwort ·
  Ersatzschlüssel 5/3). Fach-Schlüssel der Apps werden nur **zusätzlich** mit dem Hauptschlüssel verpackt — keine Datei wird neu
  verschlüsselt (Klaus' echte SD-Karte mit Private Brain Pro!).
- **Verschlüsseltes Inhaltsverzeichnis je Fach**, gleiches Format für alle Apps (Name, Art, Datum, Größe, kurzer Textauszug, Verweis)
  — Voraussetzung für C2, weil Private Brain Pro Dateien unter HMAC-Namen ablegt.
- Fächer: `Private Brain/`, `Workflow PDF Pro/`, `BookLedgerPro/`, Übergabefächer `Eingang-BookLedgerPro/`, `Eingang-WorkflowPDF/`.
  Eigenes Fach schreiben, fremde nur lesen, **nie löschen**; „übernommen" ist eine eigene Marke-Datei.
- `VaultCrypto` (PBV1) bleibt byte-gleich (nur `package` unterscheidet sich heute) — beim Umzug ins gemeinsame Paket zuerst
  die SHA-Gleichheit beweisen.
- Proben: JVM/Robolectric wie `VaultCryptoTest`, gestellter Ordner. **Gegenproben:** falsches Passwort ändert nichts ·
  Ersatzschlüssel öffnet · fremdes Fach lesbar, nie gelöscht · Umzug eines vorhandenen Tresors lässt jede Datei byte-gleich.
- **Nichts an Klaus' echten Tresoren** ohne Probe an einer Kopie und Rückweg.

## Schritt C — BookLedgerPro im Ordner

Ordnerwahl (SAF, dauerhafte Freigabe), **automatische verschlüsselte Sicherung** ins Fach (Vorgabe `src/domain/backupStrategie.js`;
die Buchhaltungsdaten bleiben in der App, Weg A), Beleg-Originale ins Fach, Eingangsfach lesen mit Marke „übernommen".
Brücke in `native/blp-native.js` + eigenes Plugin; die Web-App bekommt nur einen schmalen Haken (`window.BLPNative`).

## Schritt C2 — Tresorordner in BookLedgerPro öffnen und durchsuchen (Klaus' Wort)

Solange entsperrt: Ansicht „Tresorordner" mit allen Fächern (eigenes schreibend, fremde lesend), Suche über die Inhaltsverzeichnisse
mit Wort- und Bedeutungssuche (`src/domain/belegsuche.js`, Vektoren nur auf dem Gerät), Treffer öffnen oder als Beleg übernehmen
(Kopie, Marke „übernommen").

## Schritt D — Private Brain Pro und Workflow PDF Pro ziehen ein

Eigene PRs in deren Repos, deren Regeln gelten (Workflow PDF Pro: Gleichstand aller Fassungen, Kern nie von Hand; Private Brain Pro:
Schutzmodule unverändert). Private Brain Pro schreibt Rechnungsmails ins `Eingang-BookLedgerPro/`.

## Nachträge zu Schritt A (wenn Zeit ist, eigene kleine PRs)

- **Mikrofon nativ:** Androids Sprachfenster (Vorlage `ProSpeechPlugin` / `native/native-speech.js` in Private Brain Pro), an
  `src/ui/mikro.js` über `ai/speech.js` angebunden — die WebView-Erkennung ist in Apps meist gesperrt.
- **Emulator-Probe in CI** (Vorlage `native-acceptance.yml` in Workflow PDF Pro): Start, Teilen-Eingang, Speichern-Dialog.
- **Release-Workflow** (Vorlage `release-request.yml`/`workflow-pdf-release.yml` in Workflow PDF Pro): signierte APK aus dem
  verschlüsselten Schlüssel, Updateprobe. **Bauen und prüfen ja, auslösen nur auf Klaus' Wort.**
- **App-Links** für `?uebernahme=`/`?vorgang=`: braucht `assetlinks.json` an der Wurzel von `lausiklauskn-png.github.io` — klären,
  wem diese Wurzel gehört, bevor etwas gebaut wird.
- Alten Zweig `claude/general-discussion-x9xyk9` löschen — nur auf Klaus' Wort.

## Was nicht passieren darf

- Keine Veröffentlichung ohne Klaus' Wort (kein APK-Release, kein Windows-Release).
- Keine Schlüssel, Freigaben, Passwörter in Git oder Chat. Kein zweites `initialize` (der Lauf bricht ab, wenn eine Identität da ist —
  so lassen).
- DB-Endung `bookledgerpro` nie ändern; byte-1:1-Kopien (SBKIM, `apps/`, `assets/wfpdf/`, `pb-icons.svg`) nie von Hand.
- Emulator ist nicht Tablet — ehrlich trennen. Nach jedem Schritt `docs/PULS.md`, `docs/SESSIONS.md`, `CLAUDE.md` nachziehen;
  nach PWA-Änderungen BookLedger Basic nachziehen.

## Danach

Windows-Sitzung (dieselben drei Apps; Private Brain Pro: Java-Engine mit DPAPI, Workflow PDF Pro: Rust-Kern). Ganz zum Schluss:
**Weg 2 Relais** (Klaus: „der letzte Akt").
