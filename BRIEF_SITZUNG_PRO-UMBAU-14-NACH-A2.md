# Sitzungsplan Pro-Umbau 14 nach A2 (Stand 2026-10-31, mit Klaus' Antworten)

Grundlage: `BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A2.md` (A2 gebaut, Inventur A3), `BRIEF_SITZUNG_PRO-UMBAU-14B.md`, `BRIEF_SITZUNG_PRO-UMBAU-14.md` (B–E).
Forschung zu A2 mit Zeiten je Abschnitt und CI-Dauer je Job: Kimhub `forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md` § 31–32.

## Stand beim Übergeben

- Gemergt: BLP #436/#437, Basic #30, **PB #119** (13:46Z), BLP #433 (Sitzung A, 0.1.8, von der anderen Sitzung).
- **Offen: V3 #32** (A2 in V3). `validate` war auf dem PR in 2 von 3 Läufen rot an `tools/native/test-ki-tresor.mjs` („Der Speicher dieses Browsers war gerade
  beschäftigt“, IndexedDB Versionswechsel/Schließen), lokal 9/9 grün (4 davon mit verlangsamtem Browser). Erst seit #30 (Chefcode) auf V3-main. V3-main selbst zweimal grün.

## Klaus' Antworten (2026-10-31): 1–6 bauen, 7 erst die Ursache

| Nr | Was | Wie |
|---|---|---|
| 1 | **V3 bekommt ein eigenes Fach** „Private Brain V3“ im Tresorordner | `Fach.java` im Tresor-Paket der Quelle Workflow PDF Pro ergänzen, `node tools/tresor/pins.mjs --schreiben`, dann `tools/native/tresor-nachziehen.mjs` in BLP/PB; V3 zieht das Paket erstmals ein (bisher eigener Vault-ROOT „Private Brain“, gleicher Name wie PB — umbenennen ohne Datenverlust, alter Ordner bleibt) |
| 2 | **Familienakte ins Tresorordner**: Fächer „Familienakte“ und „Eingang-Familienakte“ | Fächer in derselben Paketänderung wie 1; Anbindung in der Familienakte (React/Vite, Capacitor/Tauri-Hüllen) nach `docs/POSTFACH-UND-WERKZEUGE-PLAN.md` dort. Vorher prüfen, ob eine andere Sitzung in der Familienakte arbeitet |
| 3 | **„Ort ändern“ mit Umzug** für den gemeinsamen Tresor | In der Quelle Workflow PDF Pro, Vorlage `native/vault-migration.js` (kopieren → prüfen → umschalten; alter Ort bleibt, bis der Nutzer ihn löscht; nie überschreiben). Android (SAF) und Windows. Danach nachziehen in BLP/PB |
| 4 | **Windows-Tresorordner in PB und WPP** | Vorlage BLP `windows/engine/src/DesktopTresor.java` + Tauri-Ordnerwahl (jedes Laufwerk, auch USB, ganzer Pfad sichtbar). Byte-gleich aus der Quelle, nicht nachbauen |
| 5 | **WPP (und Workflow-PDF) antworten im Netz** wie BLP | Öffentlich nur der Dateiname, im eigenen Netz mit Ausschnitt; Korpus mit `Float32Array`, ganzer Text in Abschnitten (Briefende immer dabei), eine Zeile je Dokument, Korpus live (`setLocalCorpus(function)`). Probe gegen das echte Modul 04 nach `tests/smoke_netzbrief.mjs` |
| 6 | **Vektoren und Schlüssel bleiben in der App** | Nichts bauen; in `docs/TRESORORDNER.md` je App benennen, was im Tresor liegt und was nicht |
| 7 | **V3 #32 erst mergen, wenn die Ursache von `test-ki-tresor` klar ist** | Lauflogs der roten Läufe lesen, Zeitpunkt des Fehlers in der Probe finden, IndexedDB-Öffnen/Schließen in `assets/ki-tresor.js` gegen das Upgrade aus #30 halten. Eine Wiederholung bis grün ist keine Messung |

Danach: B Familienakte (Rest), C Sage-Hinweis, D Briefkopf (Quelle Workflow-PDF), E Geschenk-Seite — nach `BRIEF_SITZUNG_PRO-UMBAU-14.md`.

Vorschlag aus den Zeiten (nicht beauftragt, Klaus fragen): in Private Brain Pro einen Pfadfilter für die CI, damit eine reine Web-Änderung nicht 16 min auf
den Windows-Bau wartet.

## Was nicht passieren darf
Nichts veröffentlichen ohne Klaus' Wort (vorher Releases lesen, Version/Build erhöhen). Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module
byte-1:1. Bausteine nur in ihrer Quelle (Bedienung/Chefcode: Private Brain Pro; Tresor/Scanner: Workflow PDF Pro; Briefkopf: Workflow-PDF). Keine Emojis, kein
Force-Push. Gegenprobe erst ohne Sabotage grün. Tresorordner-Umzug: nie Daten löschen oder überschreiben. Abschluss mit Stundennachweis.

## Startauftrag zum Einfügen

```
Pro-Umbau 14 nach A2. Zuerst V3 #32: Ursache der roten test-ki-tresor-Läufe klären (Logs lesen, nicht nur wiederholen), erst dann mergen.
Dann A3 bauen nach meinen Antworten (alle ja): 1 eigenes Fach „Private Brain V3“, 2 Fächer „Familienakte“ und „Eingang-Familienakte“, 3 „Ort ändern“ mit Umzug (kopieren, prüfen, umschalten, alter Ort bleibt), 4 Windows-Tresorordner in Private Brain Pro und Workflow PDF Pro, 5 Workflow PDF Pro antwortet im Netz wie BookLedgerPro, 6 Vektoren und Schlüssel bleiben in der App (nur dokumentieren). Tresor-Paket nur in Workflow PDF Pro ändern, dann nachziehen.
Danach B Familienakte, C Sage-Hinweis, D Briefkopf, E Geschenk-Seite.
Repos: BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Privat-Brain-Pro-V3, Workflow-PDF-Pro, Workflow-PDF, Meine-Familienakte, Sage-Protokol, Mein-WorkFloh, Kimhub (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14-NACH-A2.md, BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A2.md (Inventur), BRIEF_SITZUNG_PRO-UMBAU-14.md (Plan B–E).
Familienakte: erst prüfen, ob eine andere Sitzung dort noch arbeitet.
Nichts veröffentlichen ohne mein Wort; vorher Releases lesen, Version und Buildnummer erhöhen. Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle ändern.
Ein PR je App, bei grüner CI selbst mergen, Basic nachziehen. Forschung nur in Kimhub, mit Zeiten für Arbeit und CI-Läufe. Abschluss mit Stundennachweis, Brief mit Startauftrag.
```
