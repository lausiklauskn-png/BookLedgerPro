# Brief für die nächste Sitzung: Reparaturen und Bedien-Umbau nach der Tablet-Probe (Schritt E)

## Startauftrag zum Einfügen (Kurzfassung, Copy-Paste)

```
BookLedgerPro (lausiklauskn-png/BookLedgerPro) + Privat-Brain-Pro + Workflow-PDF-Pro: Reparaturen und Bedien-Umbau nach der Tablet-Probe. Lies zuerst CLAUDE.md, dann BRIEF_SITZUNG_PRO-UMBAU-NACH-PROBE-E.md, BRIEF_ABSCHLUSS_2026-10-28_TRESORORDNER-E.md, docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md und die Forschung docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md (§ 10). Repos dazunehmen: Privat-Brain-Pro, Workflow-PDF-Pro, Workflow-PDF.
1. Erledigt, nicht erneut fragen: Tresorordner läuft am echten Ordner (SD-Karte/Privat Brain Pro Hauptablageordner), alle drei Apps eingezogen; Einstellungen = Knöpfe wie heute, KEIN Explorer; alter Browser-Tresor in der Pro-App weg; Reihenfolge Tresorordner-Ansicht 1→2→4→3.
2. Zuerst fragen: (a) BookLedgerPro 0.1.1 jetzt veröffentlichen (enthält #381 Teilen, #382 englische Rechnung + Sperren)? (b) Wo wird die gemeinsame Bedien-Datei gepflegt (Empfehlung: Private Brain Pro)? (c) Öffentlicher Herausgeber-Schlüssel fb6cd374…709ee2f fest in die Apps?
3. Dann: „Sperren“-Fehler in Workflow PDF Pro beheben; Private Brain Pro #105 übernehmen OHNE Explorer-Teil; Umbau Einstellungen nach Leitfaden, Private Brain Pro zuerst, dann Workflow PDF Pro, dann BookLedgerPro.
Termux-Befehle als ein Block ohne Erklärung, Passwort-Abfragen immer als einzelne Zeile. GitHub-Schritte als kurze Liste mit Links („hauptsächlich“ = main). Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat, nichts an meinen echten Tresoren ohne Kopie und Rückweg. Selbst mergen wenn CI grün. Am Ende: Abschluss, Forschung, Brief und Kurzfassung als Copy-Paste-Block.
```

## Zuerst lesen
`CLAUDE.md` (oben), Abschluss E, Leitfaden, Forschung § 10. In Private Brain Pro: Entwurf **#105** (Parallel-Sitzung: Sperren-Fix,
„Tresor entsperren“-Knopf, settingsOrder; CI rot nur an `tools/native/test-protect.mjs` Z. 92 → Erwartung `'#vaultPlace + #tresorNote + #schutzPlace'`).
**Den Explorer-Teil daraus nicht bauen** (Klaus hat ihn verworfen).

## Reihenfolge (Vorschlag)
1. **Fehler zuerst** (klein, je eigener PR):
   - Workflow PDF Pro `native/native-tresorordner.js`: Sperren öffnet sofort wieder (wie in BookLedgerPro #382 / PB #105).
   - Private Brain Pro: Teilen „An BookLedgerPro“ fragt nicht, wenn der Tresor gesperrt ist → fragen „entsperren oder normal teilen?“.
   - Workflow PDF: durchgereichter Tipp beim Schließen eines Fensters (vermutet, „Alle prüfen“ startete ohne Tipp) — erst im Browser nachstellen.
   - Workflow PDF: Sicherung gestreamt (Absturz bei ~50 MB).
2. **Veröffentlichen nur auf Klaus' Wort** (BookLedgerPro 0.1.1; danach die anderen, wenn sie Fixes tragen).
3. **Gemeinsame Bedien-Datei** (Knopf flach, ⓘ-Klapper, Fortschritt/Drehkreis, Zustand ●) byte-gleich in alle Pro-Apps, Pins wie beim Tresor-Paket.
4. **Umbau Einstellungen** nach Leitfaden: Private Brain Pro → Workflow PDF Pro → BookLedgerPro. Je App: „Tresor & Ablage“-Kasten,
   Web-Reste weg + Probe auf verbotene Wörter, Version bei „Updates prüfen“, Pfad + „In Dateien öffnen“.
5. **BookLedgerPro:** Tresorordner-Ansicht 1→2→4→3; Belegliste für Hunderte (flache Zeilen, Mail-Gruppen aufklappbar, ⋯-Menü);
   Startseite ohne Willkommen/Werbesatz, „Geschäftsjahr“ in die Kopfleiste; Bedeutungs-Schalter direkt an der Suche; Strichgrafiken;
   Leistengriff mittig; lesbare Sicherungsnamen; „Über“ mit Version.
6. **Workflow PDF (Kern, eigene Sitzung):** Einordnen nicht automatisch, Knöpfe „Prüfen“ / „Einordnen“ mit Auswahl, Hintergrund Datei für Datei,
   flache Start-Kacheln, Strichgrafiken, Bibliothek lädt nur Vorschaubilder.
7. **Belege → Buchhaltung (eigener Bauabschnitt, Klaus' Frage 2026-10-28):** heute: Mail wird Mail-Beleg, jeder PDF-/Bild-Anhang ein eigener
   Beleg, Positionen aus der Textebene (S1); der Weg in die Buchung ist der **Buchungsvorschlag auf Tipp**. Nicht gebaut: S2 (Positionen
   ein-/ausschließen, Zweck je Position), Positionen nach OCR (Scans), automatische Zuordnung zu Konto/Anlage/Steuer/Haushaltsbuch,
   Erkennen „Rechnung oder nicht“ beim Eingang, Fremdwährung. Plan mit Klaus abstimmen, bevor gebaut wird.
8. Danach: Basic nachziehen (bei jedem PWA-Stand), Windows-Sitzung (Einzug in allen Apps), Relais.

## Was nicht passieren darf
- Kein Explorer für die Einstellungen. Nichts veröffentlichen ohne Klaus' Wort. Keine Datei in einem Fach löschen.
- Den echten Tresorordner nicht verschieben oder umbenennen (Freigaben hängen am Pfad).
- Das Tresor-Paket nur in Workflow PDF Pro ändern (`tools/tresor/pins.mjs --schreiben`), sonst nur kopieren.
