# Brief: Tresor-Übersicht und „falscher Tresor“ in der Familienakte (für die nächste Sitzung)

Klaus 2026-11-03: „Ich habe den Überblick verloren“ über die vielen Tresore (Festplatte, SD-Karte, temporär). Er wünscht eine
bildliche Darstellung als Baumverzeichnis mit Pfaden: welcher Tresor gehört zu welcher App, welchen Ordner gebe ich wo ein.
Außerdem soll geprüft werden, ob in der Familienakte für eine Funktion ein falscher Tresor erklärt oder verbunden ist.
Seine Bildschirmfotos der SD-Karte (Hauptablageordner, `Tresorordner/`, `verzeichnis/`, `marken/`) gehören zu dieser Aufgabe.

## Was schon da ist

- **Tresor-Karte (HTML, Entwurf):** https://claude.ai/artifact/Gp65AdKtqk7wf3wiwxdnaK — Baum der SD-Karte, je App der Menüweg
  und welcher Ordner zu wählen ist, Auffälligkeiten aus den Fotos, Befund „falscher Tresor“. Aus dem Code gelesen, **am Gerät
  nicht nachgefahren**; Windows-Beschriftungen von PB und BLP nicht einzeln geprüft.
- Gelesene Stände: WPP `448c158`, BLP `9b7a69c`, Familienakte `d7f9703`, Private Brain Pro `752a9cf`.

## Befunde (aus dem Code)

1. **Eine Regel:** gemeinsamer Tresor = immer der Ordner mit `tresorordner.json` (`SD-Karte/Privat Brain Pro Hauptablageordner`),
   nie `Tresorordner/`. `Workflow PDF Pro/` und `Private Brain/` darin sind Arbeitsablage UND Fach zugleich, kein zweiter Tresor.
2. **Neun Fächer** im Code (`Fach.java`), nicht acht: `eingang-private-brain` kam am 01.11. dazu. Die CLAUDE.md-Zeilen „acht Fächer“ nachziehen.
3. **Uneinheitliche Ordnerwahl:** WPP-Ablage = Ebene darüber wählen (legt sonst neuen leeren „Workflow PDF Pro“ an) · PB-Speicherort =
   den Ordner „Private Brain“ selbst · Tresorordner = Wurzel · BLP bietet bei falschem Ordner „Tresorordner anlegen“ (zweiter, leerer Tresor).
4. **Familienakte „falscher Tresor“:** kein dokumentierter Befund, keine falsche Zuweisung im Code. Zwei Meldungen passen:
   `app/pro-tresor.ts:66` (Kennung ≠ `proTresorId` im Akten-Register) und `FA_TRESOR_FREMDE_KENNUNG`
   (`FamilienakteTresorPlugin.java:70`), die in der Oberfläche irreführend „Nicht erreichbar …“ heißt statt „anderer Tresor“.
   Die FA hat die WPP-Sendung vom 03.11. noch nicht übernommen (kein `marken/familienakte/`).
5. **Auf der SD-Karte:** `PRIVATE-BRAIN-ERSATZSCHLUESSEL.txt` (alle 5 Teile im Klartext neben dem Tresor) · `*.workfloh.json`
   unverschlüsselt · BLP-Sicherungen mit 0 Byte (Hypothese: „Speichern unter“ legt die Datei an, Schreiben scheitert,
   `BlpFilesPlugin.java:42-62` räumt nicht auf) · alter `Privat Brain Pro Ablageordner` (PB-Kopien, unverschlüsselt).

## Fragen an Klaus (vor dem Bau)

1. Reicht die Karte so, oder soll sie in jede App (Hilfe-Seite „Wo liegt was?“) eingebaut werden?
2. Ersatzschlüssel-Datei, `workfloh.json`, 0-Byte-Sicherungen, alter Ablageordner: entfernen?
3. Soll die Familienakte „Neue Originale in diesem Pro-Tresor ablegen“ nutzen?

## Vorschlag zum Bau (nur nach Klaus' Ja)

- FA: `FA_TRESOR_FREMDE_KENNUNG` als „Anderer Tresor verbunden – bitte den Ordner mit tresorordner.json wählen“ anzeigen.
- BLP: 0-Byte-Datei nach gescheitertem „Speichern unter“ löschen und den Fehler melden.
- Alle Ordnerdialoge: derselbe Hinweissatz „Wähle den Ordner, in dem tresorordner.json liegt“; BLP „Tresorordner anlegen“ nur nach Rückfrage.
- PB: Warnung, wenn die Ersatzschlüssel-Datei im Tresorordner gespeichert wird.

## Startauftrag zum Einfügen

```
Repos: BookLedgerPro (Brief), Meine-Familienakte, Workflow-PDF-Pro, Privat-Brain-Pro. Jeweils frisch von origin/main.
Zuerst lesen: BookLedgerPro/BRIEF_SITZUNG_2026-11-03_TRESOR-UEBERSICHT.md und die Tresor-Karte
https://claude.ai/artifact/Gp65AdKtqk7wf3wiwxdnaK.
Erste Schritte: Klaus die drei Fragen aus dem Brief stellen. Danach die Karte nach seinen Antworten nachziehen
(dieselbe Adresse) und die gewählten Bau-Vorschläge je Repo als eigenen PR bauen, mit Probe und Gegenprobe.
Nicht: nichts veröffentlichen ohne Klaus' Wort, keine Passwörter/PINs/Ersatzschlüssel in Dateien oder Chat,
Tresor-Paket nur in Workflow-PDF-Pro ändern und byte-gleich nachziehen, keine Dateien auf Klaus' SD-Karte löschen lassen,
ohne dass er es entschieden hat. Forschung nur in Kimhub.
```
