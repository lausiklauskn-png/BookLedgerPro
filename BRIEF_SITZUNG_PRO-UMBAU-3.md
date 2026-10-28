# Brief für die nächste Sitzung: Pro-Umbau Schritt 3 (Listen, Hintergrund, Sicherung)

## Startauftrag zum Einfügen (Kurzfassung, Copy-Paste)

```
BookLedgerPro (lausiklauskn-png/BookLedgerPro) + Workflow-PDF-Pro + Privat-Brain-Pro: Pro-Umbau Schritt 3. Lies zuerst CLAUDE.md, dann BRIEF_SITZUNG_PRO-UMBAU-3.md, BRIEF_ABSCHLUSS_2026-10-28_PRO-UMBAU-2.md, docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md und die Forschung docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md (§ 11, § 12). Repos dazunehmen: Privat-Brain-Pro, Workflow-PDF-Pro, BookLedger-Basic (nachziehen nach jedem PWA-Stand).
1. Erledigt, nicht erneut fragen: „Tresor & Ablage“, keine Web-Reste, Version in allen drei Apps (PB #107, WPP #34, BLP #386); BLP Startseite ohne Willkommen, Geschäftsjahr in der Kopfleiste, Tresorordner-Ansicht 1→2→4→3. Nichts veröffentlicht.
2. Zuerst Workflow PDF Pro: Sicherung gestreamt (Absturz ~50 MB), Einordnen/Prüfen nie von selbst beim Öffnen (Knöpfe „Prüfen“/„Einordnen“, Hintergrund, Datei für Datei), durchgereichten Tipp nachstellen. Danach BookLedgerPro: Belegliste für Hunderte (flache Zeilen, Mail → Anhänge aufklappbar, ⋯-Menü), Bedeutungs-Schalter an der Suche, Strichgrafiken statt Emojis, Leistengriff mittig. Je App ein PR, selbst mergen wenn CI grün; Basic nachziehen.
Termux-Befehle als ein Block ohne Erklärung, Passwort-Abfragen immer als einzelne Zeile. GitHub-Schritte als kurze Liste mit Links („hauptsächlich“ = main). Nichts veröffentlichen ohne mein Wort, keine geheimen Schlüssel im Chat, nichts an meinen echten Tresoren ohne Kopie und Rückweg. Am Ende: Abschluss, Forschung, Brief und Kurzfassung als Copy-Paste-Block.
```

## Zuerst lesen
`CLAUDE.md` (Abschnitt „Einstellungs-Umbau Schritt 2“), Abschluss Umbau 2, Leitfaden § 3 und § 5, Forschung § 10–12. In Workflow PDF Pro:
`native/native-vault.js`, `native/vault-*.js` (Sicherung, Journal), Kern `upstream/workflow-pdf/assets/sicherung.js` (dort NICHT ändern — Ersatz in `native/`).

## Mit Klaus klären (offen aus Umbau 1/2)
- Test-APKs mit dem neuen Stand veröffentlichen? (Workflow PDF Pro 1.0.7, BookLedgerPro 0.1.1, Private Brain Pro 1.0.42) — nur auf sein Wort.
- ⓘ-Vorgabe der bestehenden Klapper in Private Brain Pro (offen vs. zugeklappt laut Leitfaden).
- Übernahme des alten Browser-Tresors in die Ablage; Belege → Buchhaltung (eigener Plan).

## Was nicht passieren darf
- Kein Explorer für die Einstellungen. Nichts veröffentlichen ohne Klaus' Wort. Keine Datei in einem Fach löschen.
- Den echten Tresorordner nicht verschieben oder umbenennen. Tresor-Paket nur in Workflow PDF Pro ändern; Bedien-Datei nur in Private Brain Pro.
- Kern `upstream/` (Workflow PDF) in der Pro nicht von Hand ändern; in den PWAs „Browser“-Texte nicht ersetzen.
