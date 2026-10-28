# Brief für die nächste Sitzung: Einstellungs-Umbau Schritt 2 (Workflow PDF Pro, dann BookLedgerPro)

## Startauftrag zum Einfügen (Kurzfassung, Copy-Paste)

```
BookLedgerPro (lausiklauskn-png/BookLedgerPro) + Workflow-PDF-Pro + Privat-Brain-Pro: Einstellungs-Umbau Schritt 2. Lies zuerst CLAUDE.md, dann BRIEF_SITZUNG_PRO-UMBAU-2.md, BRIEF_ABSCHLUSS_2026-10-28_PRO-UMBAU-1.md, docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md und die Forschung docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md (§ 10, § 11). Repos dazunehmen: Privat-Brain-Pro, Workflow-PDF-Pro (Workflow-PDF nur wenn der Kern dran ist).
1. Erledigt, nicht erneut fragen: Sperren-Fehler in allen drei Apps behoben (WPP #32, PB #106); PB #105 übernommen ohne Explorer; gemeinsame Bedien-Datei liegt in Private Brain Pro (native/pro-bedienung.js/.css, Pin + tools/native/pro-bedienung-pins.mjs), Kopie per tools/native/bedienung-nachziehen.mjs --quelle ../privat-brain-pro; PB hat „Tresor & Ablage“, keine Web-Reste, Version bei Updates (#107). 0.1.1 NICHT veröffentlichen ohne mein neues Wort.
2. Erledigt: Herausgeber-Schlüssel fest in Private Brain Pro (PB #108, nur PB prüft Codes). Zuerst: Workflow PDF Pro wie PB umbauen (Kasten „Tresor & Ablage“ mit „Ablage von Workflow PDF Pro“ + „Tresor (alle Pro-Apps)“, ● Zustand, Pfad + In Dateien öffnen, keine Web-Reste mit Probe, Version bei Updates), danach BookLedgerPro (Einstellungen → „Tresor & Ablage“, Tresorordner-Ansicht 1→2→4→3, Startseite ohne Willkommen, „Geschäftsjahr“ in die Kopfleiste). Je App ein PR, selbst mergen wenn CI grün.
Termux-Befehle als ein Block ohne Erklärung, Passwort-Abfragen immer als einzelne Zeile. GitHub-Schritte als kurze Liste mit Links („hauptsächlich“ = main). Nichts veröffentlichen ohne mein Wort, keine geheimen Schlüssel im Chat, nichts an meinen echten Tresoren ohne Kopie und Rückweg. Am Ende: Abschluss, Forschung, Brief und Kurzfassung als Copy-Paste-Block.
```

## Zuerst lesen
`CLAUDE.md`, Abschluss Umbau 1, Leitfaden, Forschung § 10–11. In Private Brain Pro: `native/pro-bedienung.js` (API: `knopf`, `hauptSetzen`,
`info`, `kasten`, `zustand`, `ordnerZeile`, `fortschritt`, `schritt`, `versionSatz`, `istOeffentlicherSchluessel`), `native/native-vault.js`
(wie der Kasten gebaut ist), `native/native-ohne-web.js` (Ersetzungs-Schicht), `tools/native/test-tresorordner.mjs` (Probe auf Web-Reste).

## Reihenfolge (Vorschlag)
1. (erledigt 2026-10-28) Herausgeber-Schlüssel fest in Private Brain Pro `native/license-keys.json`; am Tablet prüfen, dass alle Werkzeuge
   offen bleiben (Studio-Schlüssel = dieser Schlüssel).
2. **Workflow PDF Pro**: `bedienung-nachziehen.mjs --quelle ../privat-brain-pro` (Kopie liegt schon, falls #107 und die Kopie gemergt sind),
   in `prepare-web.mjs` laden; Tresor-Kasten (`native/native-vault.js` „Speicher und Dokumenttresor“ + `native-tresorordner.js`) wie PB;
   Sperren-Knopf nur bei offenem Ordner; Web-Reste-Probe (Workflow PDF hat „Browser“-Texte im Kern `upstream/` — dort NICHT ändern,
   Ersetzungs-Schicht in `native/` wie PB); Version bei „Updates prüfen“; Sicherung gestreamt (~50 MB Absturz) als eigener PR.
3. **BookLedgerPro**: Einstellungen in `src/ui/shell.js`/Views; „Tresor & Ablage“ (Ablage von BookLedgerPro = `BookLedgerPro/` im Ordner +
   Tresor); Web-Reste nur in der App (`window.BLPNative`), PWA/Basic unverändert; danach Tresorordner-Ansicht 1→2→4→3 und Startseite.
   Nach jedem PWA-Stand Basic nachziehen.
4. Offen gelassen, mit Klaus klären: ⓘ-Vorgabe der bestehenden Klapper in PB (offen vs. zugeklappt laut Leitfaden); Übernahme des alten
   Browser-Tresors in die Ablage; Belege → Buchhaltung (eigener Plan).

## Was nicht passieren darf
- Kein Explorer für die Einstellungen. Nichts veröffentlichen ohne Klaus' Wort. Keine Datei in einem Fach löschen.
- Den echten Tresorordner nicht verschieben oder umbenennen. Tresor-Paket nur in Workflow PDF Pro ändern; Bedien-Datei nur in Private Brain Pro.
- In der PWA (Basic, Workflow PDF, Private Brain PWA) „Browser“-Texte nicht ersetzen — dort stimmen sie.
