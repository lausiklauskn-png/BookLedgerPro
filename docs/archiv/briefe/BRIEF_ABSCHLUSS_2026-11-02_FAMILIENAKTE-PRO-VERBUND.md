# Abschluss: BookLedgerPro im Familienakte-Pro-Verbund

Stand: 2. November 2026. Der Produktbau aus #445 und #446 ist auf main. Android und
Windows tragen **0.1.8**. Die Veröffentlichung ist erfolgt; die zusätzliche vollständige
Android-App-Paar-Abnahme mit Familienakte bleibt offen.

## Gebaut und geprüft

Ausgewählte Originale verwenden das kanonische FPT1-Paket, stabile Übergabekennungen,
Prüfsummen und Quellbezug. BookLedger bestätigt erst nach verschlüsselter Ablage und
Wiederlesen des Originals. Wiederholung erhält bestehende Buchungsverknüpfungen; Rechnung
und zugehörige Zahlung sind keine zwei Ausgaben allein wegen zweier Belege.
Android und Windows behalten ihre Kennungen, Tresorformate und Signier-/Updateidentitäten.
BookLedger Basic ist nachgezogen (Basic #39, Produktpin 3ca7bb9). Dieser Abschluss ändert
keinen PWA- oder nativen Produktcode und benötigt deshalb keinen neuen Basic-Produktpin.

Die regulären Android- und Logikprüfungen des veröffentlichten Quellstands sind grün
(41463070521 / 41463070537). Die tatsächliche Windows-Paarprobe mit Familienakte besteht
mit zwei Originalen, Kalt-/Warmstart, Neustart, Wiederholung, echter dauerhafter Quittung,
bearbeiteter Rückgabe und Ablehnung einer verfälschten Bestätigung:
Familienakte-Lauf 41506243317, Job 125490024327. Das ist ein installierter Prüfaufbau auf CI,
kein persönlicher Rechner.

## Tatsächlich veröffentlichte Downloads

- [BookLedgerPro-0.1.8.apk](https://github.com/lausiklauskn-png/BookLedgerPro/releases/download/v0.1.8/BookLedgerPro-0.1.8.apk), 28,360,730 Byte; SHA-256 `c72928b5c79268b3290b341eb14b52ee363ca7e1b4ad3b65c85f312df36a4460`. Lauf [41526886410](https://github.com/lausiklauskn-png/BookLedgerPro/actions/runs/41526886410).
- [BookLedgerPro-Windows-0.1.8-x64-setup.exe](https://family-projekt.de/updates/bookledgerpro/BookLedgerPro-Windows-0.1.8-x64-setup.exe), 41,055,678 Byte; SHA-256 `b3936cd3308af9e078dc33a31b85947689033b07b1fb96af6cbb477f68872b5a`. Lauf [41509273086](https://github.com/lausiklauskn-png/BookLedgerPro/actions/runs/41509273086).

Beide Pakete stammen aus `3ca7bb919245bb0ff7a293fe93beee92fbd28f61`. Die Android-
Veröffentlichung installiert die signierte Produktions-APK, legt einen erfundenen Tresor
an und prüft Datenerhalt beim Überinstallieren. Die APK wurde zusätzlich ohne Anmeldung
heruntergeladen: 28.360.730 Byte und SHA-256 stimmen mit dem veröffentlichten Asset überein.
Beide Server-Feeds sind mit der bestehenden Ed25519-Identität unterschrieben; CI hat die
öffentlichen Feeds, Unterschriften und Pakete erneut geladen und verglichen. Der lokale
Cloudzugang zu family-projekt.de ist gesperrt; kein lokaler Serverabruf behauptet.
Der Windows-Installer bleibt wie bisher unsigniert; die Feed-Unterschrift ist eine andere
Prüfung als eine Windows-Programmsignatur.

## Offen und nächster Schritt

Android mit Familienakte wurde nicht vollständig abgenommen. Im letzten gezielten Lauf
41514065036, Job 125515602769, war der Emulator während der nativen Ordnerwahl nicht mehr
erreichbar; zusätzlich zwei Family-Seitenfehler zu triggerEvent. Keine belegte Ursache,
kein bestandener Produktweg. Familienakte-PR #59 bleibt Entwurf; seine Zusicherungen
werden nicht abgeschaltet. Die regulären Produktprüfungen sind davon getrennt zu lesen.

Nächster Schritt: vorhandene Testreihe 04/08 mit erfundenen Dateien auf einem persönlichen
Android-Gerät ausführen oder die VM-Ursache gezielt klären. Neue Rückmeldungen eingrenzen,
keine allgemeine Endlostestreihe. Scanner, SD/USB und eigene Geräte sind noch nicht
geprüft. Kleine bekannte Anzeigeprobleme (roher Vertragstext, Datum 01.01.1970 bei einer
fehlenden Übergabezeit) bleiben für eine Folgefassung; kein verändertes Originaldatum.

## Stundennachweis

Gemeinsame, belegte Zeitfenster der repoübergreifenden Sitzung: 1. November 2026
14:09:02–16:32:52 Uhr MEZ (13:09:02–15:32:52 UTC); 2. November 2026 ab 08:06:21 Uhr
MEZ (07:06:21 UTC) bis zur Aufzeichnung 22:28:23 Uhr MEZ (21:28:23 UTC).
Das sind Obergrenzen einschließlich Bau-, CI- und Wartezeit, keine gemessenen aktiven
Arbeitsstunden und keine Messung von Klaus' Anwesenheit. Die Nachtpause bleibt ausgenommen.
Überlappende Zeiten von Familienakte, Workflow PDF Pro, Private Brain Pro und BookLedger
werden nicht addiert. Der gemeinsame endgültige Eintrag wird in Kimhub geführt.

## Startauftrag zum Einfügen

```text
Repository lausiklauskn-png/BookLedgerPro, aktuelles main laden.
Zuerst CLAUDE.md, docs/PULS.md und BRIEF_ABSCHLUSS_2026-11-02_FAMILIENAKTE-PRO-VERBUND.md lesen.
Android und Windows 0.1.8 sind veröffentlicht; nicht erneut dieselben Versionen bauen.
Windows-App-Paar mit Familienakte vollständig geprüft; Android-Paar nicht vollständig geprüft
(Testmaschine bricht ab, Familienakte-PR #59 bleibt Entwurf). Keine vollständige Gesamtabnahme behaupten.
Als Nächstes eine konkrete Nutzer-Rückmeldung mit den vorhandenen erfundenen Testdateien auswerten
oder die VM-Ursache gezielt klären. Keine allgemeine neue Testserie. Quellen und Originale erhalten,
Bestätigung erst nach dauerhafter Aufnahme. Basic steht auf dem geprüften Produktquellstand 3ca7bb9.
Forschung nur in Kimhub; Stundennachweis im Abschluss und docs/STUNDENNACHWEIS.md fortschreiben.
```
