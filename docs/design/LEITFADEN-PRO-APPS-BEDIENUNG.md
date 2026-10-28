# Leitfaden: Bedienung und Einstellungen der Pro-Apps (Klaus 2026-10-28)

Gilt **gleich** für Private Brain Pro, Workflow PDF Pro, BookLedgerPro und **jede App, die später zur Pro-App wird** (baugleich übernehmen).
Entstanden aus der Probe am Tablet (Tresorordner Schritt E). Netzweit verankert in `Sage-Protokol/docs/NETZWEIT.md` („Pro-Apps“).
Klaus: „Weil nicht jeder hat nebenbei eine KI laufen, der ihnen erklärt, was er als nächstes klicken muss … das muss selbsterklärend sein.“

## 0 · Geltung: Pro-Apps UND ihre PWAs (Klaus 2026-10-28)
„Genau das gleiche in grün“: dieselben Regeln gelten in den **PWA-Fassungen** (BookLedger Basic, Workflow PDF, Private Brain/V3 …) und in jeder
Pro-App, die später eine **Windows-Fassung** bekommt. Je Fassung erscheinen **nur die Knöpfe, die dort funktionieren**; leere Kästen verschwinden
(z. B. kein Tresorordner in der PWA, kein Installieren in der App). Wer einen PWA-Stand ändert, zieht ihn in die Geschwister nach
(Basic: `tools/pro-nachziehen.mjs`; Workflow PDF Pro: `upstream/`). Ablauf der Pflege: Änderung in der Quelle → nachziehen → je Fassung prüfen.

## 1 · Einstellungen
1. **Knöpfe wie heute**, jeder öffnet sein eigenes Fenster (so wie „Speicher und Dokumenttresor“ in Workflow PDF Pro). **Kein Explorer**,
   keine Seitenleiste mit Gruppen (Vorschlag vom Vormittag, von Klaus verworfen).
2. **Weniger Knöpfe, wenig Text.** Erklärungen nur hinter **ⓘ**, zugeklappt (Zustand gemerkt).
3. **Flache Knöpfe**, etwa 28–32 px hoch (wie Private Brain Pro), auch am Handy.
4. **Führung:** in jedem Fenster genau **ein farbiger Knopf** = der nächste Schritt; Erledigtes und Unnötiges verschwindet
   (z. B. kein „sperren“ bei gesperrtem Ordner). Mehrstufige Abläufe (Einzug) zeigen „Schritt x von y“.
5. **Themenverwandtes nebeneinander** (Tresor + Ablage; Suche + Bedeutung + Bildbeschreibung).
6. **In allen Pro-Apps gleich:** gleiche Knöpfe, Namen, Reihenfolge. Knopf, ⓘ-Klapper und Fortschritt kommen aus **einer gemeinsamen Datei**,
   byte-gleich in alle Pro-Apps kopiert und per SHA gepinnt (Muster wie das Tresor-Paket `de.familyprojekt.tresor`). Nur die Inhalte sind app-eigen.
   **Gepflegt in Private Brain Pro** (Klaus 2026-10-28): `native/pro-bedienung.js`/`.css`, Pin `native/pro-bedienung-herkunft.json`
   (`tools/native/pro-bedienung-pins.mjs --schreiben`), Kopie in die anderen Apps mit `tools/native/bedienung-nachziehen.mjs --quelle ../privat-brain-pro`.

## 2 · Namen für Tresore (nur EIN Ding heißt „Tresor“)
| Name | Was | Zeile |
|---|---|---|
| **Ablage von ‹App›** | eigener verschlüsselter Ordner der App („Private Brain/“, „Workflow PDF Pro/“, „BookLedgerPro/“) | Pfad · „In Dateien öffnen“ · ● Entsperrt / ● Gesperrt |
| **Tresor (alle Pro-Apps)** | gemeinsamer Tresorordner (Ebene darüber), ein Passwort + ein Ersatzschlüssel | Pfad · „In Dateien öffnen“ · ● Entsperrt / ● Gesperrt |
| ~~Tresor — Verschlüsselung (Browser)~~ | alter Web-Datei-Tresor | **in der Pro-App entfernt** (Klaus 2026-10-28); Inhalt vorher in die Ablage, mit Meldung |
- Beide stehen in **einem** Kasten „Tresor & Ablage“, untereinander; ⓘ: „Der Tresor umschließt die Ablagen aller Pro-Apps. Ein Passwort für alle.“
- Ersatzschlüssel-Knöpfe sagen, wofür: „Ersatzschlüssel für die Ablage“ / „… für den Tresor (alle Pro-Apps)“.
- Ordnerwahl: die App **schlägt den vorhandenen Tresorordner vor** („Hier einziehen?“) statt einer leeren Ordnerwahl.

## 3 · Fortschritt und Hintergrund
- Jeder Vorgang > 1 s: **Drehkreis oder Balken**, Satz „läuft – du kannst weiterarbeiten“ bzw. „nicht schließen“, am Ende **Fertig / Abgebrochen**.
  Nie „dauert einige Sekunden“, wenn es Minuten sein können. Keine Meldungen, die erst 30 s später aufpoppen.
- **Prüfen, Einordnen (Bedeutung), Sichern laufen im Hintergrund**, Datei für Datei (Speicher immer nur mit einem Stück belastet), in der
  Android-App als native Hintergrundaufgabe. **Nichts startet von selbst** beim Öffnen; Knöpfe „Prüfen“ und „Einordnen“ nebeneinander,
  wirken auf die Auswahl (langer Druck), ohne Auswahl „Alle N?“.
- Sicherungen schreiben **gestreamt** in die Datei (Workflow PDF Pro stürzte bei ~50 MB ab).

## 4 · Keine Web-Reste in der App
- Weg in der App: Installieren-Knöpfe, „Browser-Speicher“, „dauerhafter Speicher“, „Browserdaten“, „nur in diesem Browser/localStorage“-Sätze.
- **Probe je App** öffnet jede Ansicht im App-Modus und schlägt an bei sichtbaren Wörtern wie „Browser“, „installieren“, „localStorage“.
- Startseiten ohne Werbesatz/„Willkommen“; Kopfzeile trägt Kontext (z. B. „Geschäftsjahr 2026“).

## 5 · Listen, Ordner, Teilen
- **Listen für Hunderte:** eine flache Zeile je Eintrag (gekürzter Name, Datum, Betrag/Größe, kleines Zustandssymbol ○ ✓ ⚠),
  Gruppen (Mail → Anhänge) aufklappbar, „alle zu“, Knöpfe einer Zeile im ⋯-Menü, Erklärungen hinter ⓘ.
- **Wo ein Ordner genannt wird: ganzer Pfad + „In Dateien öffnen“.**
- **Teilen sichtbar** in der Knopfzeile (nicht nur im ⋯), Name „An Pro-App geben …“ mit Auswahl der Pro-Apps (jede hat ein Eingangsfach);
  ist der Tresor gesperrt: fragen „entsperren oder normal teilen?“, nie still den anderen Weg.
- **Strichgrafiken statt Emojis** (`pb-icons.svg`-Stil), in allen Pro-Apps gleich.
- Linke Leiste: Griff zum Ein-/Ausklappen in halber Höhe, immer sichtbar.

## 6 · Sonstiges
- „Über“ und „Auf Updates prüfen“ nennen immer die Version: „Du verwendest die aktuelle Version 1.0.41“ / „Neu: 1.0.42 (du hast 1.0.41)“.
- Freischalt-Feld erkennt den öffentlichen Schlüssel („Das ist der öffentliche Schlüssel, kein Freischalt-Code“).
- Lesbare Dateinamen im Tresorordner (`BookLedgerPro-Sicherung-2026-10-28-1129.fpt`), Kennung innen.
