# Brief für die nächste Sitzung: Tresorordner Schritt E (Probe am Gerät)

Stand 2026-10-27 spät. Schritt D ist gebaut: Workflow-PDF-Pro#30 (gemergt) und Privat-Brain-Pro#102. Abschluss:
`BRIEF_ABSCHLUSS_2026-10-27_TRESORORDNER-D.md`, Funde: Forschung § 9.

## Startauftrag zum Einfügen (Kurzfassung, Copy-Paste)

```
BookLedgerPro (lausiklauskn-png/BookLedgerPro), Tresorordner Schritt E (Probe am Gerät). Lies zuerst CLAUDE.md, dann BRIEF_SITZUNG_TRESORORDNER-SCHRITT-E.md, BRIEF_ABSCHLUSS_2026-10-27_TRESORORDNER-D.md, docs/TRESORORDNER.md und die Forschung docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md (§ 9). Repos dazunehmen: Workflow-PDF-Pro und Privat-Brain-Pro (beide docs/TRESORORDNER.md).
1. Termux ist erledigt (Probe 2026-10-27: 64, alle drei .age-Dateien da) – nicht erneut fragen.
2. Stell mir die Fragen aus dem Brief: neue APKs zum Prüfen veröffentlichen (welche Apps)? Wo liegt mein Workflow-PDF-Tresor (gleicher Ordner wie „Private Brain“)?
3. Dann mit mir am Tablet: Probe an der Kopie „Tresor-Probe“ (Dateien-App), Einzug Private Brain Pro und Workflow PDF Pro, Öffnen mit BookLedgerPro, Rechnungsmail ins Eingangsfach und übernehmen, Rückweg. Erst danach der echte Ordner, nur auf mein Wort.
Termux-Befehle als ein Block ohne Erklärung, Passwort-Abfragen immer als einzelne Zeile. GitHub-Schritte als kurze Liste mit Links („hauptsächlich“ = main). Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat, nichts an meinen echten Tresoren ohne Kopie und Rückweg. Selbst mergen wenn CI grün. Am Ende: Abschluss, Forschung, Brief und Kurzfassung als Copy-Paste-Block.
```

## Zuerst lesen
1. `CLAUDE.md` (oben Fahrplan), `docs/TRESORORDNER.md` hier, in den beiden anderen Repos `docs/TRESORORDNER.md` (Abschnitt D1/D2).
2. Forschung § 9, besonders 1 (Probe über die Kennung), 11 (Termux ≠ SD-Tresor), 12 (gleicher Ordner), 13 (Ersatzschlüssel).

## Die Fragen an Klaus (mit Empfehlung, kurz)
1. **Neue APKs zum Prüfen am Tablet?** Ohne Veröffentlichung gibt es nichts zu installieren (Debug-Bauten haben eine andere Signatur und
   gehen nicht über die installierten Apps). *Empfehlung:* Workflow PDF Pro 1.0.6 und Private Brain Pro 1.0.41 als signierte Update-APKs
   (Android), BookLedgerPro als erste signierte APK — jeweils nur nach Klaus' Wort, Windows nicht.
2. **Stand 2026-10-27:** auf der SD-Karte liegen „Private Brain“ und ein Ablageordner, **kein „Workflow PDF Pro“**. **Geklärt:** es liegt in
   `SD-Karte/Privat Brain Pro Hauptablageordner/Private Brain/` → **dieser Oberordner wird der echte Tresorordner**, kein Verschieben, nicht
   umbenennen. Workflow PDF Pro bekommt später dort seinen Ordner („Ordner wählen“ → Hauptablageordner). Forschung § 9.14.
   **Früher:** Wo liegt der Workflow-PDF-Tresor? Der Tresorordner braucht „Private Brain“ und „Workflow PDF Pro“ unter **demselben** Ordner.
   *Empfehlung:* nachsehen (Dateien-App); liegt er woanders, in Workflow PDF Pro einen neuen Speicherort neben „Private Brain“ wählen
   (die App überträgt selbst), erst danach einziehen.

## Ablauf am Gerät (Probe)
1. Dateien-App: Ordner „Tresor-Probe“ auf der SD-Karte anlegen; „Private Brain“ (und „Workflow PDF Pro“, wenn daneben) hineinkopieren.
2. Private Brain Pro → Einstellungen → „Speicherort und Verschlüsselung“ → **In den Tresorordner einziehen …** → „Tresor-Probe“ wählen →
   neues Passwort für den Tresorordner (zweimal, Hinweis bestätigen).
3. Workflow PDF Pro hat noch keinen SD-Tresor: Einstellungen → „Speicher und Dokumenttresor“ → „Ordner wählen“ → „Tresor-Probe“
   (legt „Workflow PDF Pro“ an und überträgt die Daten, eigenes App-Passwort), dann → **In den Tresorordner einziehen …** → „Tresor-Probe“ → dasselbe
   Passwort (einmal).
4. BookLedgerPro → Menü → Tresorordner → „Tresor-Probe“ wählen → entsperren: Fächer „Private Brain“ und „Workflow PDF Pro“ zeigen ihre
   Zeilen. Ersatzschlüssel hier erzeugen (gilt für alle).
5. Private Brain Pro → eine Rechnungsmail → „An BookLedgerPro teilen“ → **In den Tresorordner legen** → BookLedgerPro → Eingang →
   „Als Beleg übernehmen“.
6. Rückweg: in „Tresor-Probe“ `tresorordner.json`, `Tresorordner/`, `Eingang-*` löschen — oder den ganzen Probe-Ordner.
7. Nur auf Klaus' Wort: dasselbe am echten Ordner (Ebene über dem echten „Private Brain“).

## Danach
- BookLedger Basic nachziehen (`tools/pro-nachziehen.mjs`); Nachträge Schritt A (Mikrofon nativ, Emulator-Probe in CI inkl.
  Tresorordner-Plugin, Release-Workflow ohne Auslösen, App-Links); Ersatzschlüssel-Knopf für den Tresorordner auch in den beiden anderen Apps;
  Private Brain Pro V3 gleichziehen; Windows-Sitzung; ganz zum Schluss Relais.

## Was nicht passieren darf
- Kein Einzug am echten Ordner ohne Probe an der Kopie und Klaus' Wort; keine Datei in einem Fach löschen oder überschreiben.
- Keine Veröffentlichung ohne Klaus' Wort; keine Schlüssel oder Passwörter in Git oder Chat.
- Das Paket nur in Workflow PDF Pro ändern (`node tools/tresor/pins.mjs --schreiben`), sonst überall nur kopieren.
