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
- [x] **2. Test-Modus (Sandbox-Tresor)** ✅ (2a–2c gemergt) — wegwerfbarer Test-Tresor über die Mehrmandanten-Schicht;
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
  - [x] **2c. UI** ✅ (PR #122, 2026-06-18): „🧪 Tests"-Bereich am Sperrbildschirm + in den Einstellungen
    (`ui/lock.js`/`ui/shell.js`) — öffnen/leeren/löschen je Test, „Neuer Test", „Alle Tests löschen";
    verschlanktes Test-Onboarding (nur Test-Passwort, kein Shamir-/Backup-Gate); dauerhafter **TEST-MODUS-Banner**;
    **behalten/verwerfen-Dialog** beim Verlassen (`behalteUndVerlasseSandbox`/`loescheSandboxTresor`); aktiver Test
    wird beim Start direkt wieder geöffnet (Korrektur `initMandanten` → `aktiveDbName()`). Reine Helfer
    `aktiverSandbox`/`naechsterTestName` node-getestet. +9 Tests (1141/1141), SW `v106`. i18n de/en, CSS.
    DOM/IndexedDB statisch geprüft. **Offen (optional, Folgeschritt):** Demo-Vorbefüllung (`domain/demodaten.js`) —
    die Test-Modus-UI ist ohne sie vollständig nutzbar (man startet mit leerem Test).
- [x] **3. Datensicherungs-UX + `backupStrategie`** ✅ (PR #124, 2026-06-18): prominente Backup-/Restore-Karte
  (Dashboard + Durabilitäts-Banner + Einstellungen) mit **Drag-and-drop-Restore**; **gemerkter Zielordner**
  (File System Access, gerätelokal in eigener unverschl. kv-DB `core/backupOrdner.js`; Tablet/ohne API/ohne
  Ordner → **Download-Fallback**); Setting **`backupStrategie`** (`download`|`ordner`, Default `download`) im
  **Onboarding** wählbar + in den Einstellungen änderbar. Reine Logik node-getestet: `domain/backupStrategie.js`
  (`backupZiel`/`normalizeBackupStrategie`/`backupDateiname`/`istBackupDatei`), +17 Tests (**1158/1158**), SW
  `v107`. Gemeinsame Aktionen in `ui/datensicherung.js`; `core/backup.js exportBackupSmart`. DOM/IndexedDB/
  File-System-Access statisch geprüft (kein Headless-Browser). **Bewusst offen (`docs/DATENSICHERUNG.md` #4):**
  Server-Ziel + konfigurierbare Erinnerungs-Kadenz (Banner erinnert weiterhin wöchentlich). (`docs/DATENSICHERUNG.md`)

### Block 2 — Kalkulation/Angebote (das große Thema, fein geschnitten)
- [x] **4. Setting `rechnungsstelle` (`blp|extern`, Default `blp`)** ✅ (PR #125, 2026-06-18) — Enabler für Block 2.
  Reine Logik `domain/rechnungsstelle.js` (node-getestet, +23 → **1181/1181**): `RECHNUNGSSTELLE`/`normalizeRechnungsstelle`/
  `rechnungsstelleVon`/`istBlp|ExternRechnungsstelle`/`vergibtBlpNummern`, **vorläufige interne Nummer** `vorlaeufige-
  Rechnungsnummer`/`istVorlaeufigeNummer` (`ENT-JJJJ-NNNN`), **Wechsel-Hinweis** `rechnungsstelleWechselHinweis`
  (blp→extern mit vergebenen §14-Nummern → Warnung/Bestätigung, GoBD). Setting `rechnungsstelle` in `state.js` (Default
  `blp`), Onboarding-Schritt (`ui/lock.js`, nach §19) + Einstellungs-Umschalter mit Bestätigung (`ui/shell.js`,
  `vergebeneRechnungsnummern` aus `crm-store.js`). i18n de/en, SW `v108`. **Konsumiert** (Nummernvergabe/Beschriftung/
  Export) wird das in Schritt 7/8. UI/IndexedDB statisch geprüft. (`docs/KALKULATION_KATALOG.md` §7a)
- [x] **5. Kalkulations-Kern (rein)** ✅ (PR #126, 2026-06-18) — `domain/kalkulation.js` (rein, node-getestet,
  +34 → **1215/1215**): Kostenarten `KOSTENART` (material/maschine/arbeit/zukauf/montage); Bausteine
  `materialkosten` (pauschal **oder** m²-Formel `flaecheM2×preisProM2×(1+Verschnitt%)`), `zeitkosten`/
  `maschinenkosten`/`arbeitskosten`, `zukaufkosten` (EK×(1+Handelsaufschlag%)), `montagekosten`; **vorwärts**
  `kalkuliereVorwaerts` → Selbstkosten → Zuschlag Gemeinkosten% → Gewinn% → Netto → USt% → Brutto +
  Deckungsbeitrag (cent-genau, je Stufe `rundeCent`); USt-Umrechnung `bruttoVonNetto`/`nettoVonBrutto`;
  **rückwärts** `maxSelbstkosten`/`kalkuliereRueckwaerts` (Zielpreis/-marge → erlaubte Selbstkosten,
  Restbudget, max. Arbeitsstunden — konservativ `floor`, überschreitet das Ziel nie). SW `v109`. Rein —
  KEIN UI/Außendokument (Prime Directive); das kommt in Schritt 6/7. (`docs/KALKULATION_KATALOG.md` §2/§9)
- [x] **6. Produkt-Schemata** ✅ (PR #127, 2026-06-18) — `domain/produktschemata.js` (rein, node-getestet,
  +23 → **1238/1238**): die 6 Vorlagen Folierung (m²)/Schild/Gravur/Leuchtreklame/Druck-Zukauf/Montage als
  **kalibrierbare** Schemata, die den Kern (Schritt 5) füttern. Jedes Schema definiert nur seine Felder
  (`PRODUKT_ART`/`BASIS`/`FELD_TYP`-Enums) + ein `mapping` auf die Kostenarten (`material`/`maschine`/`arbeit`/
  `zukauf`/`montage`); `kalkuliereSchema` ruft `kalkuliereVorwaerts` — **keine** neue Formel, nur Zuordnung
  (m²→Material, Gravur-Minuten→Maschinen-Std). „Hotspot"-Felder (Katalog §1: Verschnitt/Verklebezeit/Fräszeit/
  Elektrik/Montage) sind `kalibrierbar` markiert + via `kalibrierteDefaults` überschreibbar (feste Felder unangetastet)
  → Andockpunkt für Schritt 9/10. `validateSchema`/`validateAlleSchemata` sichern die Definitionen. SW `v110`.
  Rein — **kein UI** (eigener Folgeschritt). Test u. a.: `kalkuliereSchema == direkter Kern-Aufruf`. (Katalog §1/§2)
- [x] **7. Angebote-Kern in BLP** ✅ (PR #128, 2026-06-18) — `domain/angebote.js` (rein, node-getestet, +60 →
  **1298/1298**): Angebots-Datenmodell mit **zwei Schichten** (extern: Positionen/Preise/USt; intern: `kalkulation`
  je Position) — **Prime Directive** durchgesetzt via `externesAngebot`/`externePosition` (**Whitelist** → nichts
  Internes kann lecken). Status-Lebenslauf `ANGEBOT_STATUS` (entwurf/offen/angenommen/abgelehnt/archiviert) +
  `ANGEBOT_STATUS_FLOW`/`darfAngebotWechseln`/`setzeAngebotStatus`/`archiviereAngebot` + Filter `aktiveAngebote`/
  `archivierteAngebote`/`angeboteNachStatus`. **Freier** Angebotsnummernkreis `AN-JJJJ-NNNN` (klar getrennt vom
  §14-Kreis): `formatAngebotsnummer`/`parseAngebotsnummer`/`istAngebotsnummer`/`naechsteAngebotsSeq` (pro Jahr
  fortlaufend)/`vergebeAngebotsnummer`. Positions-Aggregation `angebotSummen` nutzt denselben Kern wie Aufträge/
  Rechnungen (`orders.auftragSummen`, cent-genau). `positionAusSchema` koppelt die Produkt-Schemata (6) an den Kern
  (5): interne Kalkulation gespeichert, extern dringt **nur der Netto-Stückpreis**. `interneAuswertung`
  (Live-Deckungsbeitrag, rein intern). `neuesAngebot`/`validateAngebot`. SW `v111`. **Kein UI** (eigener Folgeschritt).
  (`docs/KALKULATION_KATALOG.md` §3/§4/§5)
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
