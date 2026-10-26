# Abschluss der Bau-Sitzung vom 2026-10-26

Eine lange Sitzung über den ganzen Bau-Brief (Design-Grundlage bis Rundlauf), danach die Kopie nach BookLedger Basic und die
Einträge in beiden Marktplätzen. **Alles auf `main`, nichts als App veröffentlicht** (BookLedgerPro ist noch eine PWA; die
PWAs liefert GitHub Pages aus).

## Was auf `main` steht (BookLedgerPro)

| PR | Inhalt |
|---|---|
| #346 | Design-Grundlage: Themen Farbe × Helligkeit, Strichsymbole, Seitenleiste mit Gruppen, Modus Privat/Kleinunternehmer/Selbstständig/Berater, Schrift-Regel A5 |
| #347 | Workflow-PDF-Einbindung: Teilen-Empfang, Textebene zuerst, eigene Scans, Knopf „Mit Workflow PDF scannen" |
| #348 | „Journal" heißt „Buchungen" |
| #349 | Namen nach Muster verdecken (C1), gelb sichtbar, per Tipp rücknehmbar |
| #350 | Privat-Modus zeigt Mycel/Siegel und SBKIM-Suche; Plan Calculate/Needs |
| #351 | Mikrofon an jeder Texteingabe, Sprachmarke je Feld, Wort-Speicher (B1) |
| #352 | Suche über Belege: Wörter und Bedeutung, Text verschlüsselt am Beleg (A1 + A2) |
| #353 | Frage an die Belege, nur pseudonymisiert (A3) |
| #354 | Workflow Calculate und Workflow Needs byte-1:1 eingebettet |
| #355 | Scanner-Kern von Workflow PDF bei den Belegen; Plan Steuer/ELSTER |
| #356, #357 | Rundlauf mit den WorkFlohs, Vertrag v2 „Vorgang" (R1, R2) |
| #359 | Mail an BookLedgerPro teilen: `.eml` als Beleg, Anhänge als Belege, Positionen |
| #360 | Fahrplan Pro/Basic/Tresorordner |
| #361 | D22: Needs → BookLedgerPro, Positionen anhängen |
| #362 | Workflow PDF im Rundlauf: PDF + Daten hin, unterschrieben zurück |
| #363 | Tresorordner-Plan: Weg 2 Relais |
| #364 | R3: Stand der Rechnung zurück an die WorkFlohs |
| #365, #366 | Kopie nach BookLedger Basic festgehalten |
| (dieser PR) | Forschung und Brief für die Android-Tresorordner-Sitzung, dieser Abschluss |

In den Nachbar-Repos (je eigener PR, gemergt): Workflow-PDF (Direktstart, Worker löscht nur eigene Vorräte), Workflow-PDF-Pro
(Gleichstand), Workflow-Needs #32, Mein-WorkFloh und Tomys-Hub (R1/R2/R3, BLP-Kachel), Private Brain Pro #91 (Sende-Knopf),
BookLedger-Basic #1–#3 (Kopie, Regal-Notiz), family-project #373 und PWA-Toolpoint #182 (BookLedger Basic im Marktplatz).

## Gemessen

`node tests/run.mjs` auf `main` vor diesem PR: **2567 bestanden · 0 fehlgeschlagen**; die Browser-Proben der einzelnen Schritte
stehen in `CLAUDE.md` je Abschnitt. Jeder neue Wächter ist in einer Wegwerf-Kopie gegengeprüft.

## Nicht gemessen

Kein Tablet, kein Samsung DeX, keine echte KI-Antwort, kein echtes Bedeutungsmodell (Netz im Behälter gesperrt), keine echte
Teilen-Auswahl von Android, der Pages-Host ist aus dem Behälter nicht erreichbar. **Klaus' Sichttest steht für alles aus.**

## Berichtigung an Klaus

BookLedgerPro ist **noch nicht** die Android-App. Es ist die PWA, aus der die Android-App in der nächsten Sitzung entsteht; danach
kommt Windows. BookLedger Basic ist die PWA, die bleibt.

## Offen bei Klaus

- Die fünf Fragen im Brief `BRIEF_SITZUNG_ANDROID-TRESORORDNER.md` (gemeinsamer Kopf, Daten-Weg, Paket/Signatur, Reihenfolge, Relais).
- Eigene Knoten-Identität für BookLedger Basic (Klaus: „wenn ich es benötige").
- Die WorkFlohs schicken „Rechnung in BLP" an die Pro-Adresse; für Basic-Nutzer bräuchte es ein einstellbares Ziel.
- Die Download-Seite für die Pro-Apps macht Klaus selbst.

## Nächste Sitzung

**Android-Tresorordner für BookLedgerPro:** `BRIEF_SITZUNG_ANDROID-TRESORORDNER.md`, Forschung
`docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md`.
