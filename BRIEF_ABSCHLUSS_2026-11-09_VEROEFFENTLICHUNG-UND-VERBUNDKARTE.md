# Abschluss 2026-11-09 (Abend): Veröffentlichungen, Buchhaltung statt Mandant, Startseite für Betriebe, Verbund-Karte

## Was getan

**BookLedgerPro**
- #456 Kasse & Shop, Ausmisten, Brücken zur Familienakte (0.1.10).
- #457 „Buchhaltung“ statt „Mandant“, kein „+ Neuer Mandant“ auf dem Startbild, Anlegen in den Einstellungen (0.1.11).
- #458 Startseite für Betriebe mit drei Kacheln (Umsatzsteuer mit Fälligkeit, Rücklage nach Faustregel, Kasse heute) und Eingang aus dem Tresor übernehmen (0.1.12).
  Der zuletzt gewählte Modus, z. B. Privat, bleibt erhalten.
- #459–#461 Vorschau-Hilfe „Pro-App-Verbund“: Die Karte steht in der Anleitung und unter „Über“.
  - Die Karte liegt byte-gleich in `assets/pro-verbund.html`, gepinnt in `assets/pro-verbund.herkunft.json`.
  - Sie wird nur hier gepflegt; die anderen Apps ziehen sie mit `tools/verbund-nachziehen.mjs` nach.

**Die Karte in den anderen Apps** (alle gemergt, nichts veröffentlicht):
- BookLedger Basic #44
- Private Brain Pro #132: Einstellungen
- Workflow PDF Pro #69: Einstellungen, nur in der App
- Familienakte #146: Hilfe-Thema „Pro-App-Verbund (Vorschau)“

Basic-Varianten sind in der Karte ab Werk verdeckt.

**Veröffentlicht** (Klaus' Wort „APK, PWA … und Windows“). Jeder Download wurde unabhängig geladen und sein SHA-256 gegen den veröffentlichten verglichen.

| App | Android | Windows |
| --- | --- | --- |
| BookLedgerPro | 0.1.10 (`3895b990…b78e`), 0.1.12 (28.402.208 B, `d879c646…3d0`) | 0.1.11 und 0.1.12 über family-projekt.de (Lauf 42675452937 grün) |
| Familienakte | 2.28.50 (`a0a80591…1612`) | 2.28.50 Setup (`53f36d40…170f`). ⚠ Der Update-Server family-projekt.de hat 2.28.50 nicht; die Prüfung in der App findet das Update nicht |
| Private Brain Pro | 1.0.46 (Lauf 42678578879, zweiter Versuch; 61.084.509 B, `e2e84deb…e353`) | 1.0.46 (`87ed55a4…c7e6`) |

Beim ersten Versuch des Android-Laufs von Private Brain Pro scheiterte die Probe `test-help` („Repeated help refreshes …“); auf main war sie grün. Der zweite Versuch lief vollständig grün.

## Stand
- Alles ist gemergt. Die oben genannten Fassungen sind veröffentlicht und dürfen nicht erneut ausgelöst werden.
- Die Verbund-Karte ist in keiner App veröffentlicht; sie kommt mit der nächsten Fassung.

## Offen / ungeprüft
- Kein Tablet, kein Gerät.
  - Die Karte im Vollbild-Rahmen ist nur im Browser geprüft; Android-Zurück nur über die gestellte JavaScript-Stelle.
  - Unter Windows ist offen, ob die Inline-Skripte der Karte im iframe laufen (Tauri-CSP).
- Familienakte: Windows 2.28.50 fehlt auf dem Update-Server.
- Workflow PDF Pro: `gegenprobe-pro-verbund` „partially ready dialog exposes incoming controls“ ist lokal rot, auch auf main; die CI ist grün. Ursache nicht untersucht.
- Herkunfts-Pins der Karte in Familienakte, Private Brain Pro und Workflow PDF Pro: den BookLedgerPro-Commit `d6dcacd` noch eintragen.
- J3–J6 aus dem Bauplan: Klaus' Ja steht aus.

## Stundennachweis
- Erste Spur dieses Blocks: nach dem Kasse-Abschluss, ≈ 14:45 UTC.
- Letzte Spur: ≈ 20:10 UTC (Merge Familienakte #146 um 20:05).
- Ein Block, Obergrenze ≈ 5 h 25 min. Darin steckt viel Warten auf die CI und auf Klaus; die aktive Zeit ist nicht gemessen.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/BookLedgerPro, Branch: der für die Sitzung vorgegebene, frisch von origin/main.
Zuerst lesen: CLAUDE.md, docs/PULS.md (oben), BRIEF_ABSCHLUSS_2026-11-09_VEROEFFENTLICHUNG-UND-VERBUNDKARTE.md.
Erste Schritte:
1. Klaus' Rückmeldung zur Verbund-Karte am Gerät abholen (BLP Anleitung/Über, PB/WPP Einstellungen, Familienakte Hilfe).
2. Herkunfts-Pins der Karte in Familienakte, PB und WPP um den BLP-Commit ergänzen; Karte nur in BLP ändern und mit tools/verbund-nachziehen.mjs verteilen.
3. Familienakte Windows 2.28.50 auf den Update-Server bringen oder mit der nächsten Fassung nachholen.
4. J3–J6 aus dem Bauplan mit Klaus klären.
Nicht: veröffentlichte Fassungen erneut auslösen (BLP 0.1.10–0.1.12, FA 2.28.50, PB 1.0.46), ohne Klaus' Wort veröffentlichen, Forschung ins Repo schreiben.
```
