# Abschluss Pro-Umbau 5 (2026-10-28 abends bis 2026-10-29 Nacht)

Repos: BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Workflow-PDF-Pro, Workflow-PDF (Kern). **Nichts veröffentlicht.**

## Erledigt (alles auf main, CI grün)

| Schritt | PR | Inhalt |
|---|---|---|
| 1 BookLedgerPro für Windows | BLP #399 | Tauri-Hülle + Java-Engine (Vorbild Private Brain Pro), Tresor-Paket byte-gleich, Passwort im eigenen Fenster, Merken über DPAPI, Speichern unter/Hineinziehen/„Öffnen mit“, SAPI-Mikrofon, Installer geprüft |
| Scanner und Kamera Windows | WPP #39, BLP #400 | gemeinsamer Baustein (Quelle WPP): WIA-Scanner (USB/WLAN, mehrere wählbar, Glas/Einzug, dpi, Farbe), Kamera als Livebild |
| Updates vom eigenen Server | BLP #400 | `family-projekt.de/updates/bookledgerpro/`, Ed25519-unterschrieben, Windows **und** Android, Hochladen nur von Hand (`windows-release.yml`, `android-release.yml`) |
| Updates geprüft in allen Pro-Varianten | WPP #40 | WPP-Windows war nie eingerichtet → jetzt wie Android über GitHub-Veröffentlichungen |
| 2 zweites Bedeutungs-Modell | PB #114 | Mittel/Groß nur für die App-Suche, Mycel bleibt e5-small |
| 3 `pro-geraet.js` | WPP #40, BLP #400 | Gerätecheck (Fassung 3) nachgezogen |
| 4 Workflow-PDF-Kern 1.1.4 | Kern #136, WPP #41 | nichts startet von selbst, Prüfen/Einordnen für die Auswahl, Strichgrafiken, flach, nur Vorschaubilder; WPP 1.0.8: Intent „Scanner direkt“, Fach `Eingang-WorkflowPDF` |
| Basic | Basic #13, #14 | nachgezogen auf Pro `26a25fc` und `1127038` |
| Forschung | BLP #401 | § 18 (Windows, Scanner, Updates) und § 19 (Kern) |

Server (in Klaus' Termux, gemessen): Ordner, Hochlade-Schlüssel nur für `updates/` (rrsync, `ls /` abgelehnt), Signatur-Schlüssel, GitHub-Geheimnisse
`BLP_UPDATE_UPLOAD_KEY` und `BLP_UPDATE_SIGNING_KEY`, Sicherung `~/blp-update-schluessel.age`.

## Nicht gemessen / offen

- Kein Tablet, kein echter Windows-PC, kein echter Scanner, keine echte Kamera; echte Modelle (Bedeutung, Bild) nicht gelaufen.
- Der Update-Weg Lauf → Server → App ist erst mit der ersten Veröffentlichung gemessen (nur auf Klaus' Wort).
- BookLedgerPro ruft den neuen Intent `SCANNEN` von Workflow PDF Pro noch nicht auf.
- Workflow PDF Pro Windows: Tresorordner fehlt dort noch; Windows-Download steht bei 1.0.5. Private Brain Pro Windows 1.0.42 nicht veröffentlicht.
- Schritt 5 (Private Brain V3) nicht begonnen.

## Stundennachweis

Sitzungsbeginn 21:47 (Ortszeit Berlin), Commits 22:01 → 00:54 in einem Block (42 Commits in fünf Repos), Abschluss bis etwa 01:10.
Summe der Blöcke 2,9 h, Spanne 3,4 h. Dazu Klaus' Zeit in Termux und am Bildschirm ohne Commit. Zeile in `docs/STUNDENNACHWEIS.md`.
Klaus' eigene Angabe geht vor.

Nächste Sitzung: `BRIEF_SITZUNG_PRO-UMBAU-6.md`.
