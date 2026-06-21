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

## ✅ Phase 3 — Aufträge, Kunden, Mitarbeiter, Kostenstellen
- [x] Kunden (CRM) — verschlüsselt (`domain/encstore.js`, `crm-store.js`), Ansicht
- [x] Aufträge mit Positionen + Status-Workflow (`domain/orders.js`), Ansicht
- [x] **Rechnung → automatische Buchung** (`domain/invoicing.js`): Ausgangsrechnung
      (Forderung an Erlöse + USt, mehrere Sätze) als Buchungs-Entwurf
- [x] Mitarbeiter + Zeiterfassung (`domain/employees.js`), Summen/Kosten, Ansicht
- [x] Kostenstellen: Seed + Zuordnung im Journal + **Auswertung** (`domain/costcenters.js`)
- [x] 85/85 Node-Tests grün. ⚠️ Browser-UI nicht headless E2E-getestet.

> Personenbezogene Daten (Kunden/Mitarbeiter/Zeiten) werden **verschlüsselt** gespeichert
> (DSGVO). Festschreiben der Rechnungsbuchung bleibt manuell (GoBD).

## ✅ Phase 4 — Steuer & Export
- [x] USt-Voranmeldung-Kennzahlen (Kz 81/86/66/83) + EÜR-Aufbereitung (`domain/export.js`)
- [x] Export: Journal-CSV, DATEV-orientierte CSV, USt-VA-CSV, EÜR-CSV; Drucken→PDF
- [x] Steuer-Assistent (`ai/taxAssist.js`, opt-in Claude, nur aggregierte Kennzahlen)
- [x] DSGVO/GoBD-Doku in-app (Ansicht „Recht & Doku") + `docs/legal/*` +
      Betroffenenrechte (Export / vollständiges Löschen)
- [x] 98/98 Node-Tests grün

> **Ehrlich offen:** DATEV-Export ist DATEV-*orientiert* (kein zertifiziertes EXTF +
> Steuerschlüssel-Mapping); **keine** ELSTER/ERiC-Einreichung (nur Datenpaket); „PDF"
> über Browser-Druck (keine PDF-Lib); Claude-Pfade nicht live getestet;
> Browser-UI nicht headless E2E-getestet.

## ◑ Phase 5 — Sage-Mycel-Symbiose (lokale Andock-Vorbereitung)
- [x] SBKIM-Protokoll byte-kompatibel: Ed25519-Identität, Spore-Bau/-Verifikation
      (kanonische Form §11.1, `id==SHA256(pubkey)`), gegen **echte Geschwister-Spore VALID**
- [x] `src/sbkim/*` (spore, identity, domainvector `_demo`, signal) + Ansicht „Mycel-Netz"
      (Identität erzeugen, spore.json/SIGNAL.json herunterladen, fremde Spore prüfen)
- [x] **Headless-Verifizierer** `tools/verify_remote_spore.mjs` (node:crypto, zero-dep) —
      Verifizierer-Paar (§11.2) im Test einig
- [x] Briefkasten/Sync verankert: `sbkim/README.md`, `SIGNAL.template.json`,
      `AUSTAUSCH-template.md` (+ `docs/SAGE_SYNC_BRIEFKASTEN.md`)
- [x] **Phase 5b — Schritt 1 (Knoten geboren):** echte, signierte `sbkim/spore.json` +
      `sbkim/SIGNAL.json` committet (headless gemintet via `tools/mint_spore.mjs`,
      eine Quelle der Wahrheit `src/sbkim/nodeProfile.js`); `node tools/verify_remote_spore.mjs
      sbkim/spore.json` → **VALID**. In-App-Import bestehender Identität (`importIdentity`)
      ergänzt → App kann denselben nodeId in den Tresor übernehmen
- [ ] **Phase 5b — Schritt 2 (menschlich vermittelt, fremde Repos):** im Hub-`status.json`
      registrieren, erster Handshake bei Geschwister-Knoten, `verified-spore`
- [x] **Phase 5c:** echter `domainVector` (Transformers.js) → **`verified-match` ERREICHT** 🏅
  (Vektor real erzeugt: `Xenova/multilingual-e5-small`, 384-dim, L2=1, kein `_demo`, Spore neu signiert &
  committet, headless VALID; **Sage bestätigt Cosinus = 0.810579 ≥ 0.80**, Sage `SIGNAL` seq 27,
  `ack[BookLedgerPro]=11`; Wert lokal unabhängig nachgerechnet → identisch). `SEAL_STAGE = 'verified-match'`
  (Gold), unsere `SIGNAL` seq → 13, `ack[Sage]=27`, Quittung AUSTAUSCH-Sage §10. SW `v159`.
- [◑] **Phase 5e — SBKIM Hybrid-Match-Richter** (Sage-Andock-Brief 2026-06-21): neue Ansicht „SBKIM-Suche"
  (Vorfilter `embed.js` + opt-in Richter Mistral EU/BYOK + Fail-soft). **BLP-native nach Sage-Spec** (OPTION 1,
  von Sage freigegeben — kein neuer CDN, Vertrags-Fläche 1:1). `src/sbkim/{match,hybridSearch,searchCorpus}.js`
  + View; node-getestet (1989/1989, alle 4 Modi + Fail-soft). **Offen:** erster echter Mistral-Richter-Lauf im
  Browser (Rück-Aktion an Sage).
- [ ] **Phase 5d:** Symbiose-Import (Belege aus Mein-Tresor, Aufträge aus WorkFloh → Buchungen)

> Diese Phase bereitet den Andock **lokal** vor (kein fremdes Repo verändert). Der
> Live-Schritt (Hub-Registrierung, Handshake) erfolgt menschlich vermittelt (Modul 09).
> Der `domainVector` ist noch `_demo` → ermöglicht `verified-spore`, nicht `verified-match`.

## ✅ Geheim-Fach (Tresor im Tresor)
- [x] `src/core/safebox.js`: unabhängig verschlüsselter Bereich mit EIGENEM Code (eigener
      PBKDF2/AES-GCM-Schlüssel, eigenes Salt), Fach-Key nur im RAM wenn offen (Defense-in-Depth)
- [x] Eigenes **Shamir-Backup** des Fach-Schlüssels + Recovery (vergessenen Code per Shares
      ersetzen, Inhalt bleibt) — Datendurabilität (#2)
- [x] Ansicht „Geheim-Fach": Einrichten/Entsperren/Recovery, Einträge (Schlüssel/Text/Datei)
      anlegen/anzeigen/laden/löschen; i18n DE/EN; SW `v27`
- [x] Kern node-getestet (Versiegeln/Öffnen, falscher Code, Shamir-Recovery, Validierung)

> Vorbild: Mein-Tresor („Tresorraum mit 20 Fächern — jedes Fach = echter AES-Tresor"),
> gleicher Krypto-Kern. Gedacht u.a. als sicherer Ablageort für den SBKIM-Schlüssel.

## ◑ Phase 6 — Design-Politur & Bilder
- [x] Dashboard mit echten Jahres-Kennzahlen (`domain/summary.js`, getestet) + KPI-Karten
- [x] Dezente **Mycel-Canvas**-Animation am Sperrbildschirm (additiv, **DeX-sicher**,
      `prefers-reduced-motion`-bewusst, self-stopping) — Browser-Lehre 8 beachtet
- [x] Barrierefreiheit: Skip-Link, `:focus-visible`, `aria-current`/`aria-live`,
      `role=main`, reduced-motion
- [x] Design-Token-Feinschliff (Fokus-Ring, KPI-/Elevation-Stile)
- [x] 121/121 Node-Tests grün
- [x] **Bild-Assets (3D-Render, Marke):** PWA-Icons (192/512/maskable/apple/favicon),
      Hero (Sperrbildschirm/Onboarding), 7 Leerzustände, kontextabhängige Onboarding-Bilder,
      og-image (+ OG/Twitter-Meta) — vom Nutzer generiert, eingebunden (Phase 6.1)
- [ ] **Offen:** Lighthouse/Performance-Messung (kein Headless-Browser hier) — manuell prüfen.

> Design-Effekte sind bewusst **additiv** (Canvas), nie über `cursor:none` — auf DeX/Android
> würde das ignoriert (siehe `docs/SAGE_BROWSER_LEHREN.md`, Lehre 8).
