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

## Phase 1 — Buchhaltungs-Kern
- [ ] Kontenplan (SKR03/04-light), Konten-Typen, Salden
- [ ] Buchungssätze (doppelte Buchführung, Soll/Haben, USt-Satz, Kostenstelle)
- [ ] Journal-/Konten-Ansichten, EÜR- + USt-Berechnung
- [ ] **GoBD**: Festschreibung, Storno statt Löschen, Audit-Hash-Kette (`core/audit.js`),
      lückenlose Nummernkreise

## Phase 2 — Belege & Erkennung
- [ ] Verschlüsselter Beleg-Store (Foto/PDF)
- [ ] OCR lokal (`ai/ocr.js`), Extraktion → Buchungsvorschlag (`ai/extract.js`, opt-in Vision)
- [ ] On-Device-Auto-Kategorisierung (`ai/embeddings.js`)
- [ ] KI-Autonomie-Schalter wirksam (Vorschlag / Auto-Entwurf+Review / Autonom)

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
- [ ] Symbiose: Belege aus Mein-Tresor, Aufträge aus WorkFloh → Buchungen

## Phase 6 — Design-Politur & Bilder
- [ ] Design verfeinern (Motion, Barrierefreiheit), promptgenerierte Bilder
- [ ] Dezente Mycel-Effekte (Canvas-additiv, DeX-sicher), Lighthouse/Performance
