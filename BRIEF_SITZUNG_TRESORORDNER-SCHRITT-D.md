# Brief für die nächste Sitzung: Tresorordner Schritt D (Private Brain Pro und Workflow PDF Pro ziehen ein)

Stand 2026-10-27 abends. Schritt B (Paket in Workflow PDF Pro, #29) und C/C2 (BookLedgerPro, #371) sind gebaut.
Abschluss: `BRIEF_ABSCHLUSS_2026-10-27_TRESORORDNER-B-C.md`.

## Startauftrag zum Einfügen (Kurzfassung, Copy-Paste)

```
BookLedgerPro (lausiklauskn-png/BookLedgerPro), Tresorordner Schritt D. Lies zuerst CLAUDE.md, dann BRIEF_SITZUNG_TRESORORDNER-SCHRITT-D.md, BRIEF_ABSCHLUSS_2026-10-27_TRESORORDNER-B-C.md, docs/TRESORORDNER.md und die Forschung docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md (§ 2, 8). Repos dazunehmen: Workflow-PDF-Pro (dort wird das Paket de.familyprojekt.tresor gepflegt, docs/TRESORORDNER.md) und Privat-Brain-Pro.
1. Termux-Probe der Freigabe als EINE Zeile (Passwort danach von Hand): age -d ~/blp-freigabe.age | wc -c  → erwartet 64.
2. Stell mir die zwei Fragen aus dem Brief (wo der Knopf „In den Tresorordner einziehen“ steht; Probe-Kopie meiner SD-Karte per Dateien-App oder Termux).
3. Dann D1 Workflow PDF Pro (Einzug + Inhaltsverzeichnis, eigener PR, Gleichstand-Regeln dort), D2 Private Brain Pro (Einzug + Inhaltsverzeichnis + Rechnungsmails ins Eingang-BookLedgerPro, eigener PR, Schutzmodule unverändert), danach BookLedgerPro/Basic nachziehen.
Termux-Befehle als ein Block ohne Erklärung, Passwort-Abfragen immer als einzelne Zeile. GitHub-Schritte als kurze Liste mit Links („hauptsächlich“ = main). Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat, nichts an meinen echten Tresoren ohne Kopie und Rückweg. Selbst mergen wenn CI grün. Am Ende: Abschluss, Forschung, Brief und Kurzfassung als Copy-Paste-Block.
```

## Zuerst lesen
1. `CLAUDE.md` (oben Fahrplan, unten Abschnitt „Tresorordner: Schritt B … C/C2“)
2. `docs/TRESORORDNER.md` (was BookLedgerPro schon kann) und in Workflow PDF Pro `docs/TRESORORDNER.md` (Format, Regeln, Proben)
3. Forschung § 2 und § 8
4. Workflow PDF Pro: `AGENTS.md` (Gleichstand, Kern nie von Hand, **vorher fragen** bei komplexer Umstellung), `DocumentVault.java`,
   `ProVaultPlugin.java`, `native/native-vault.js`. Private Brain Pro: `Vault.java`, `ProVaultPlugin.java`, `native/native-vault.js`,
   `docs/SPEICHERORT-UND-TRESOR.md`.

## Die zwei Fragen an Klaus (mit Empfehlung, kurz)
1. **Wo steht „In den Tresorordner einziehen“?** *Empfehlung:* in beiden Apps im vorhandenen Tresor-Kasten der Einstellungen
   („Speicherort und Verschlüsselung“), sichtbar nur, wenn der App-Tresor entsperrt ist und neben dem App-Ordner noch kein
   `tresorordner.json` liegt — sonst „Mit dem Tresorordner verbunden“.
2. **Probe-Kopie der SD-Karte:** *Empfehlung:* mit der Dateien-App den Ordner „Private Brain“ in einen neuen Ordner „Tresor-Probe“ auf
   derselben Karte kopieren, dort zuerst einziehen und mit BookLedgerPro öffnen; erst danach den echten Ordner.
   **Rückweg** beim echten Ordner: der Einzug legt nur `tresorordner.json` und den Ordner `Tresorordner/` neben „Private Brain“ an —
   diese zwei löschen = Ausgangszustand (Private Brains eigene Dateien werden nicht angefasst; JVM-Probe beweist das am Nachbau).

## D1 · Workflow PDF Pro
- Paket ist schon da. Neu: Plugin-Methoden (oder `ProVaultPlugin` erweitern) `tresorZustand`, `tresorEinziehen` (nativer
  Passwort-Dialog des Tresorordners: anlegen, wenn kein Kopf da ist, sonst entsperren; dann `fachEinziehen("workflow-pdf-pro", place.key)`),
  `tresorVerzeichnis` (aus dem Satz-Index: `docs`/`files` → `Eintrag` mit `verschluesselung:"app"`, Name, Art, Datum, Größe, Auszug aus `texte`).
- Wurzel = Baum-URI des aktiven Ortes, wenn der App-Ordner darunter liegt; liegt er direkt an der Wurzel → neue Freigabe der Ebene darüber.
- Mehrere Speicherorte (`VaultLocations`): nur der aktive zieht ein.
- Gleichstand: Windows-Fassung (Rust) bekommt eine Lücke in `docs/PRODUKTSTAND.md` mit Grund, bis die Windows-Sitzung kommt.

## D2 · Private Brain Pro
- Paket byte-gleich kopieren (Werkzeug wie `tools/native/tresor-nachziehen.mjs` hier, Pins), Einzug mit `dataKey` (`fachEinziehen("private-brain", …)`).
- Inhaltsverzeichnis aus dem Katalog (Mails, Originale; `verschluesselung:"app"`, Auszug kurz, keine Mail-Texte über 1000 Zeichen).
- **Rechnungsmails ins `Eingang-BookLedgerPro/`:** der vorhandene Knopf „An BookLedgerPro teilen“ bekommt in der Pro-App den Weg
  „in den Tresorordner legen“ (`ablegen("eingang-bookledgerpro", "Mails", …)` mit der `.eml`), BookLedgerPro liest sie im Eingang.
- Schutzmodule und byte-1:1-Module unverändert (Drift-Guard).

## Danach
- BookLedgerPro: Probe mit echtem Eingang (nach D2), `docs/TRESORORDNER.md` ergänzen; BookLedger Basic nachziehen.
- Nachträge Schritt A (Mikrofon nativ, Emulator-Probe in CI inkl. Tresorordner-Plugin, Release-Workflow ohne Auslösen, App-Links).
- Windows-Sitzung, ganz zum Schluss Relais.

## Was nicht passieren darf
- Kein Einzug am echten SD-Ordner ohne vorherige Probe an der Kopie und Klaus' Wort; keine Datei in einem Fach löschen oder überschreiben.
- Keine Veröffentlichung ohne Klaus' Wort; keine Schlüssel oder Passwörter in Git oder Chat.
- Das Paket nur in Workflow PDF Pro ändern (`node tools/tresor/pins.mjs --schreiben`), sonst überall nur kopieren.
