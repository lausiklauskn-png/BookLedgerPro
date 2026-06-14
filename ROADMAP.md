# Roadmap

Jede Phase ist ein eigener PR. Auto-Merge, sobald die Checks grün sind.

## ✅ Phase 0 — Fundament (aktuell)
- [x] Build-freie ES-Modul-Shell, PWA-Manifest, App-Service-Worker (versionierter Cache)
- [x] Krypto (`crypto.js`), Shamir (`shamir.js`), IndexedDB (`db.js`)
- [x] **Datendurabilität #1**: `storage.persist()`, Quota-Überwachung, Durabilitäts-Banner
- [x] Sperrbildschirm + Onboarding (Passwort → Shamir-Shares → erzwungenes erstes Backup)
- [x] Tresor (`vault.js`): Setup/Unlock, verschlüsselte Settings, Mandant-Indikator
- [x] Backup bauen/wiederherstellen (`backup.js`)
- [x] Modus-Framework (Einfach/Profi/Berater) + KI-Autonomie-Schalter (Settings)
- [x] Design-System (Tokens, hell/dunkel, dezente Mycel-Marke)
- [x] Node-Smoke-Test (Krypto + Shamir), CI-Workflow
- [x] Docs: README, ARCHITECTURE, ROADMAP, CLAUDE/AGENTS, SESSIONS, SAGE_BROWSER_LEHREN

## ✅ Phase 1 — Buchhaltungs-Kern
- [x] Kontenplan (SKR03-Auswahl), Konten-Typen, Salden (`domain/accounts.js`)
- [x] Buchungssätze (doppelte Buchführung, mehrzeilig, Soll/Haben, autom. USt-Aufteilung)
      (`domain/journal.js`, `domain/money.js` cent-genau)
- [x] Journal-/Konten-Ansichten + Auswertung (EÜR + USt-Voranmeldung, Periodenfilter)
      (`ui/views/*`, `domain/taxes.js`)
- [x] **GoBD**: Festschreibung, Storno statt Löschen, Audit-Hash-Kette (`domain/audit.js`),
      lückenloser Nummernkreis; Buchungen verschlüsselt gespeichert (`domain/store.js`)
- [x] 45/45 Node-Tests grün (Kernlogik). ⚠️ Browser-UI nicht headless E2E-getestet.

> Offen/Teil-Phase-4: strenge Zufluss-/Abfluss-EÜR (§4 Abs.3 EStG); Kostenstellen-Feld
> ist im Modell vorgesehen, UI-Zuordnung folgt mit Phase 3.

## ✅ Phase 2 — Belege & Erkennung (Kern)
- [x] Verschlüsselter Beleg-Store (Foto/PDF), `domain/documents.js` (AES-GCM)
- [x] Heuristische Extraktion Text→Felder (`ai/extract.js`) + Kategorisierung
      (`ai/categorize.js`) + Buchungsvorschlag (`ai/suggest.js`) — rein & getestet
- [x] Externe KI **opt-in BYOK Claude-Vision** (`ai/provider.js`, neueste Modelle),
      Daten verlassen Gerät nur nach Bestätigung
- [x] **KI-Autonomie-Schalter wirksam**: Vorschlag (nur anzeigen) / Auto-Entwurf+Review /
      Autonom (still Entwurf) — Festschreiben bleibt bewusst manuell (GoBD)
- [x] UI: Belege-Ansicht (Upload, Schnellerfassung, KI-Extraktion); KI-Settings (BYOK)
- [x] 65/65 Node-Tests grün (Extraktion/Kategorisierung/Vorschlag)

> **Ehrlich offen (Phase 2.x):** lokales OCR (Tesseract.js) ist NICHT eingebunden —
> Bild→Text läuft derzeit über Claude-Vision (BYOK) oder eingefügten Text. Semantische
> On-Device-Embeddings (Transformers.js) stehen aus; bis dahin Schlüsselwort-Heuristik.
> Claude-API-Pfad ist korrekt implementiert, aber **nicht live getestet**. Siehe `docs/AI.md`.

## Phase 3 — Aufträge, Kunden, Mitarbeiter, Kostenstellen
- [ ] WorkFloh-Domänenmodell (Kunden/Aufträge/Status), Rechnung → automatische Buchung
- [ ] Mitarbeiter + Zeiterfassung; Kostenstellen-Auswertung

## Phase 4 — Steuer & Export
- [ ] Steuer-Assistent (`ai/taxAssist.js`, opt-in), USt-Voranmeldung/EÜR-Aufbereitung
- [ ] Export (PDF/CSV, DATEV-CSV, ELSTER/ERiC-Datenpakete)
- [ ] DSGVO/GoBD-Doku in-app + `docs/legal`

## Phase 5 — Sage-Mycel-Symbiose
- [ ] SBKIM-Client + `sbkim-sw.js` (Modul-09-Pfad), Ed25519-Identität, `domainVector`
- [ ] `sbkim/spore.json` deployen, im Hub-`status.json` registrieren, erster Handshake
- [ ] **Synchronisationsvereinbarung & Briefkasten** (`docs/SAGE_SYNC_BRIEFKASTEN.md`,
      INTERFACES §11): `sbkim/SIGNAL.json` (seq/ack), `AUSTAUSCH-<Knoten>.md`-Postfächer,
      `<gegenseite>_inbox.json`/`.verify.md`, headless-Verifizierer (`node:crypto`)
- [ ] Symbiose: Belege aus Mein-Tresor, Aufträge aus WorkFloh → Buchungen

## Phase 6 — Design-Politur & Bilder
- [ ] Design verfeinern (Motion, Barrierefreiheit), promptgenerierte Bilder
- [ ] Dezente Mycel-Effekte (Canvas-additiv, DeX-sicher), Lighthouse/Performance
