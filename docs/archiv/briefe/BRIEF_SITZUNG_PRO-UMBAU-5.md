# Brief für die nächste Sitzung: Pro-Umbau 5 (geschrieben 2026-10-28)

Repos: BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Workflow-PDF-Pro, später Workflow-PDF (Kern) und Privat-Brain-Pro-V3.
Branch: der im ersten Prompt vorgegebene. Zuerst lesen: `CLAUDE.md` (je Repo), `BRIEF_ABSCHLUSS_2026-10-28_PRO-UMBAU-4.md`,
`docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`, Forschung § 14–15.

## Reihenfolge (Klaus 2026-10-28)

1. **BookLedgerPro für Windows** — „wenn du mit Bookledger Pro fertig bist, die Windows-Variante gleich mitmachen“.
   Vorbild ist Private Brain Pro (`windows/`: Tauri-Hülle, Java-Engine, `windows/bridge/contracts.json`, Updateprobe,
   `windows-app.yml`) und Workflow PDF Pro (`windows/`, Installer). Erst einen kurzen Plan an Klaus: was übernommen wird
   (Hülle, Tresorordner über das gemeinsame Paket, Belege/Teilen, Sprachfenster → SAPI wie PB), was in Windows fehlt.
   Danach bauen, CI in GitHub (`windows`-Lauf), Basic betrifft das nicht.
2. **Private Brain Pro: zweites Bedeutungs-Modell verdrahten** (nur App-Suche, Mycel/Modul 03 bleibt e5-small):
   Muster `ProCaptionPlugin` + `BundledLibrary` (eigene Ordner `meaning-mittel`/`meaning-gross`, Pins aus
   `tools/native/meaning-models.json`), MainActivity-Routen, Windows `DesktopModel` + `resources.rs` + `contracts.json`;
   Seite: Gerätecheck-Empfehlung (`ProGeraet` `bedeutungMittel`/`bedeutungGross`), Ladebalken, Katalog im Hintergrund
   neu einordnen (`ProHintergrund`), Suche nutzt die zweiten Vektoren. Später größeres Diktat (Whisper) unter Windows.
3. **Pro-Bausteine Fassung 3** (`pro-geraet.js`) nach WPP und BLP nachziehen (`tools/native/bedienung-nachziehen.mjs`).
4. **Workflow PDF Kern** (eigenes Repo, `add_repo`): Einordnen nicht automatisch, Knöpfe „Prüfen“/„Einordnen“ mit
   Auswahl, Hintergrund Datei für Datei, flache Start-Kacheln, kleinere Knöpfe, Strichgrafiken statt Emojis, Bibliothek
   lädt nur Vorschaubilder, Bildbeschreibung nicht automatisch. Dann in WPP `upstream/` nachziehen und die Umwege der
   Pro-Schicht entfernen. Dazu WPP: Intent „Scanner direkt“ (für BLP), Fach `Eingang-WorkflowPDF` anzeigen.
5. **Private Brain V3** (später): Mikrofon-Regel, Gerätecheck, zweites Modell, Hintergrund.

Kleinere offene Punkte: „KI-Begründung vorschlagen“ als Vorschlag mit Annehmen und Markierung; Eingangsfach für PB im
Tresor-Paket (nur in WPP ändern).

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort. Keine Schlüssel im Chat. Nichts an echten Tresoren ohne Kopie und Rückweg.
Tresor-Paket nur in WPP ändern, Bedien-Bausteine nur in PB. Kopien (`apps/`, `assets/wfpdf/`, `upstream/`, Modul 03,
`assets/pb-icons.svg`) nie von Hand. Keine Emojis. In PWAs Browser-Sätze nicht ersetzen. Termux-Befehle als ein Block,
Passwort-Abfragen als eigene Zeile; GitHub-Schritte als kurze Liste mit Links.

## Startauftrag zum Einfügen

```
Pro-Umbau 5. Repos: BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Workflow-PDF-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-5.md und BRIEF_ABSCHLUSS_2026-10-28_PRO-UMBAU-4.md,
docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md.
Reihenfolge: 1) BookLedgerPro für Windows (Vorbild Private Brain Pro windows/, erst kurzer Plan an mich),
2) zweites Bedeutungs-Modell in Private Brain Pro verdrahten (nur App-Suche, Mycel bleibt e5-small),
3) pro-geraet.js nach WPP und BLP nachziehen, 4) Workflow-PDF-Kern: Einordnen/Prüfen nur auf Knopf mit Auswahl,
flache Kacheln, Strichgrafiken, nur Vorschaubilder; dann in WPP nachziehen, 5) später Private Brain V3.
Ein PR je App, bei grüner CI selbst mergen, Basic nachziehen.
Nichts veröffentlichen ohne mein Wort, keine Schlüssel im Chat, nichts an echten Tresoren ohne Kopie und Rückweg.
```
