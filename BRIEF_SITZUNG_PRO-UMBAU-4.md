# Brief für die nächste Sitzung: Pro-Umbau Schritt 4 (Hintergrund am Gerät, Teilen, Rest-Emojis)

## Startauftrag zum Einfügen (Kurzfassung, Copy-Paste)

```
BookLedgerPro (lausiklauskn-png/BookLedgerPro) + Workflow-PDF-Pro + Privat-Brain-Pro + BookLedger-Basic: Pro-Umbau Schritt 4. Lies zuerst CLAUDE.md, dann BRIEF_SITZUNG_PRO-UMBAU-4.md, BRIEF_ABSCHLUSS_2026-10-28_PRO-UMBAU-3.md, docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md und die Forschung docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md (§ 12, § 13).
1. Erledigt, nicht erneut fragen: WPP #35 (Sicherung gestreamt .wfps, Einordnen/Prüfen nur auf Knopf, Tipp-Schutz), BLP #389 (Belegliste für Hunderte, Bedeutungs-Schalter am Suchfeld, Strichgrafiken auf der Belegseite, Leistengriff mittig), Basic nachgezogen. Nichts veröffentlicht.
2. Test-APKs sind veröffentlicht (BookLedgerPro 0.1.1, Workflow PDF Pro 1.0.7, Private Brain Pro 1.0.42 — Links in docs/PULS.md); zuerst fragen, was Klaus am Tablet gefunden hat. Dann: echte Hintergrundaufgabe in Android (Sichern/Prüfen/Einordnen laufen weiter, wenn die App im Hintergrund ist), „An Pro-App geben …“ sichtbar in der Knopfzeile (Leitfaden § 5), Rest-Emojis in den übrigen BLP-Ansichten, Bildbeschreibung in WPP nicht von selbst starten. Je App ein PR, selbst mergen wenn CI grün; Basic nachziehen.
Termux-Befehle als ein Block ohne Erklärung, Passwort-Abfragen immer als einzelne Zeile. GitHub-Schritte als kurze Liste mit Links („hauptsächlich“ = main). Nichts veröffentlichen ohne mein Wort, keine geheimen Schlüssel im Chat, nichts an meinen echten Tresoren ohne Kopie und Rückweg. Am Ende: Abschluss, Forschung, Brief und Kurzfassung als Copy-Paste-Block.
```

## Zuerst lesen
`CLAUDE.md` (Abschnitt „Pro-Umbau 3“), Abschluss Umbau 3, Leitfaden § 3 und § 5, Forschung § 13. In Workflow PDF Pro: `docs/SICHERUNG-UND-HINTERGRUND.md`,
`native/native-sicherung.js`, `native/native-hintergrund.js`. In BookLedgerPro: `src/ui/views/documents.js` (`belegListe`, `zeilenMenue`), `src/ui/strich.js`.

## Am Tablet zu prüfen (Test-APKs vom 2026-10-28 sind draußen)
- WPP: Sicherung einer Bibliothek mit einem ≥ 50-MB-PDF (läuft durch? Datei `.wfps` lesbar zurückholbar?), Einordnen startet nicht beim Öffnen, „Alle prüfen“ fragt.
- BLP: Belegliste mit vielen Belegen (Rollen flüssig?), Mail-Gruppe auf/zu, ⋯-Menü am Tablet/DeX, Schalter neben dem Suchfeld, Griff mittig.

## Mit Klaus klären (offen)
- ⓘ-Vorgabe der Klapper in Private Brain Pro · Übernahme des alten Browser-Tresors · Belege → Buchhaltung.
- Einordnen in WPP auf eine Auswahl begrenzen braucht einen Kern-Eingriff (`vektorenNachholen` plant alle) — mit Varianten fragen (AGENTS.md Regel 3).

## Was nicht passieren darf
- Kein Explorer für die Einstellungen. Nichts veröffentlichen ohne Klaus' Wort. Keine Datei in einem Fach löschen.
- Den echten Tresorordner nicht verschieben oder umbenennen. Tresor-Paket nur in Workflow PDF Pro ändern; Bedien-Datei nur in Private Brain Pro.
- Kern `upstream/` (Workflow PDF) in der Pro nicht von Hand ändern; in den PWAs „Browser“-Texte nicht ersetzen.
