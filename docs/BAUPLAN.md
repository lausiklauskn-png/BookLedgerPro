# BAUPLAN — nächste Phase (Vertrauen → Kalkulation/Angebote)

> **Der vorausschauende Bau-Fahrplan** für die mit dem Nutzer vereinbarten Themen (Gespräch 2026-06-17).
> Ergänzt `docs/NACHFOLGE_PLAN.md` (Ritual/erledigte Tracks) und die Design-Dokumente. Reihenfolge ist
> **konstruktiv** gewählt (Abhängigkeiten + „Vertrauen/Sicherheit zuerst"). Über Sitzungen pflegen:
> erledigte Schritte abhaken.

## Arbeitsweise (Nutzer-Entscheidung 2026-06-17)
- **Nicht zwingend 1 PR pro Sitzung** — **so viele saubere, in sich abgeschlossene PRs pro Sitzung wie
  sinnvoll** (pro Schritt 1 PR, jeder einzeln grün + gemergt). Nie „halb" mergen; im Zweifel feiner schneiden.
- Ritual je PR unverändert (`docs/NACHFOLGE_PLAN.md`): `git reset --hard origin/main` → eigener Branch →
  **reine Logik zuerst node-getestet** → UI „statisch geprüft" → `CACHE_VERSION`↑ + Module precachen →
  Draft→ready→CI grün→squash-merge → reset. Unverrückbar: DB-Suffix `bookledgerpro`, build-frei,
  Datendurabilität, Krypto/GoBD/DSGVO, EU-KI opt-in.
- **Design-Grundlagen:** `docs/KALKULATION_KATALOG.md`, `docs/DATENSICHERUNG.md`, `docs/TEST_MODUS.md`.

## Reihenfolge (mit Begründung)

### Block 1 — Vertrauen/Sicherheit zuerst (klein, build-frei, hoher Nutzen)
- [x] **1. Backup→Restore-Roundtrip-Selbsttest** — ✅ (PR #116, 2026-06-18). `core/backup.js`
  `backupRoundtripSelbsttest`/`buildBackupFromSnapshot`/`importProbe`/`snapshotBytes` (rein, kein IndexedDB):
  Snapshot → verschlüsseltes Backup → entschlüsseln → In-Memory-Probespeicher → **byte-genauer** Vergleich →
  ✓/✗, angehängt an den „Selbsttest" (V10, `domain/selbsttest.js`, +2 Prüfungen). +15 Tests (**1095/1095**),
  SW `v103`. Grenze: echter `dumpAll`/IndexedDB-Pfad nur statisch geprüft (kein Headless-Browser).
  (`docs/DATENSICHERUNG.md`)
- [~] **2. Test-Modus (Sandbox-Tresor)** — wegwerfbarer Test-Tresor über die Mehrmandanten-Schicht;
  mehrere getrennte Tests, behalten/verwerfen/aufräumen, optional Demo-vorbefüllt; echte Daten unberührt.
  *Warum früh:* macht das **manuelle Testen aller folgenden Features** gefahrlos. (`docs/TEST_MODUS.md`)
  - [x] **2a. Sandbox-Kern (rein, node-getestet)** ✅ (PR #118, 2026-06-18): `domain/mandanten.js` —
    `SANDBOX_INFIX`/`dbNameFuer({sandbox})`/`dbNameVon`/`istSandboxDbName`, `erstelleSandbox`/`istSandbox`,
    `echteMandanten`/`sandboxMandanten`, Sandbox-Ausblendung am Sperrbildschirm + `sandboxAuswahlListe`,
    `entferneAlleSandboxes`, `verwaisteSandboxDbs`. +28 Tests (1123/1123), SW `v104`.
  - [x] **2b. Store-Glue** `core/sandboxStore.js` ✅ (PR #120, 2026-06-18): `erstelleSandboxTresor`/
    `wechsleZuSandbox`/`leereSandboxTresor`/`loescheSandboxTresor`/`loescheAlleSandboxes` +
    `raeumeVerwaisteSandboxesAuf` (Boot-Aufräumen via `indexedDB.databases()`, in `main.js` verdrahtet) +
    `deleteDatabase`/`vorhandeneDbNamen`. Reine Helfer `sandboxDbNamen`/`aktiveDbName` in `domain/mandanten.js`
    node-getestet; `wechsleAktivenMandant` nutzt jetzt `dbNameVon` (Sandbox-Flag). +9 Tests (1132/1132), SW `v105`.
    IndexedDB/Glue statisch geprüft.
  - [ ] **2c. UI** — „🧪 Tests"-Bereich (Sperrbildschirm/Einstellungen), dauerhafter **TEST-MODUS-Banner**,
    behalten/verwerfen-Dialog, optional Demo-Vorbefüllung (`domain/demodaten.js`).
- [ ] **3. Datensicherungs-UX + `backupStrategie`** — prominenter Backup-/Restore-Bereich, **gemerkter
  Zielordner** (File System Access; Tablet→Download), **Drag-and-drop-Restore**; Setting `backupStrategie`
  (Onboarding + Einstellungen, frei wählbare Ziele/Erinnerung, Default sicher). (`docs/DATENSICHERUNG.md`)

### Block 2 — Kalkulation/Angebote (das große Thema, fein geschnitten)
- [ ] **4. Setting `rechnungsstelle` (`blp|extern`, Default `blp`)** — kleiner Enabler für Block 2; Onboarding
  + Einstellungen; steuert §14-Nummernvergabe vs. interne Vorlage. (`docs/KALKULATION_KATALOG.md` §7a)
- [ ] **5. Kalkulations-Kern (rein)** — Kostenarten + Zuschlags-/Maschinenstundensatz-/m²-Formel, **vorwärts**
  (Selbstkosten→Preis) **und rückwärts** (erlaubtes Zeit-/Kostenbudget), cent-genau, node-getestet.
- [ ] **6. Produkt-Schemata** — Folierung (m²)/Schild/Gravur/Leuchtreklame/Druck-Zukauf/Montage … als
  kalibrierbare Vorlagen auf dem Kern. (Katalog §1/§2)
- [ ] **7. Angebote-Kern in BLP** — Angebots-Dokument (Positionen/Preise/USt) **+ interne Kalkulationsschicht**
  (Prime Directive: intern bleibt intern!), eigener **Angebotsnummernkreis**, Status (Entwurf/offen/angenommen/
  abgelehnt/archiviert), **Archiv**. Nutzt Kern (5) + `rechnungsstelle` (4).
- [ ] **8. Angebot → Rechnung-Übernahme** — angenommenes Angebot → bestehender Rechnungs-/Buchungspfad;
  je nach `rechnungsstelle` echte §14-Nummer (blp) oder vorläufige Vorlage (extern); referenziert Angebotsnr.
- [ ] **9. Auftrags-Kostenträger + Nachkalkulation** — Material/Belege/Zeit je Auftrag sammeln (nutzt
  `payables`/`costcenters`/Belege/`belegRef`) → Soll/Ist-Vergleich.
- [ ] **10. Kalibrierung + Statistik/Vergleich** — Korrekturfaktoren aus eigener Historie (Vor→Nachkalkulation),
  Angebots-Vergleich/Trefferquote; optional KI-Analyse (Mistral EU, opt-in, pseudonym).
- [ ] **11. Adaptiver Baukasten-UX** — Positions-Baukasten, **häufig genutzte nach oben** (Nutzungszähler),
  Drag-and-drop. (Katalog §3)

### Block 3 — später / umgebungs-blockiert
- [ ] **Server-Backup-Ziel** (sobald eigener Server existiert) — Stelle 3 der 3-2-1-Sicherung.
- [ ] **Eingangsrechnungs-Verzug (Gegenseite)** [SOLL] — Spiegel zum Mahnwesen.
- [ ] **WorkFloh-Gegenstücke** (fremdes Repo, über den Nutzer): **Test-Modus** (`docs/TEST_MODUS.md` ⇄-Abschnitt),
  BLP-Format-Exporter für die Rechnungsstelle, optional Symbiose-Import (Sage 5d).
- [ ] **Bekannt blockiert:** Lighthouse/Perf (Headless), lokales OCR (Tesseract = nicht build-frei),
  ZUGFeRD-Erzeugen (PDF/A-3-Lib), Sage 5b–d (fremde Repos).

## Abhängigkeiten (kurz)
8 braucht 7+4 · 7 braucht 5(+4) · 9 braucht 7 · 10 braucht 9 · 11 ist Präsentation (nach 7).
Block 1 ist unabhängig und kommt zuerst (Sicherheit/Vertrauen).
