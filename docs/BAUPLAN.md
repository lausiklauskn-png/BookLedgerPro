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
    DOM/IndexedDB statisch geprüft.
  - [x] **2d. Demo-Vorbefüllung** ✅ (2026-06-18) — beim „Neuer Test" wahlweise **leer** oder **mit Demo-Daten**
    (Radio-Wahl, Default leer). Reine Logik in `domain/demodaten.js`: `demoEntwuerfe(mandant)` (Buchungen →
    chronologische Entwurfs-Form, immutabel, jede `validateBuchung`-gültig + ausgeglichen) + `demoBefuellungsplan(groesse)`
    (bündelt Konten/Anfangsbestände/Anlagen/Buchungs-Entwürfe). Store-Glue `domain/demodaten-store.js`
    `befuelleMitDemodaten(groesse)` schreibt in den **aktiven** (Sandbox-)Tresor über die bestehenden Stores +
    den **echten GoBD-Pfad** (`ensureAccountsSeeded` → `setAnfangsbestand` → `addAnlage` → `saveEntwurf`+`festschreiben`
    chronologisch → lückenlose seq + Hash-Kette). UI: `ui/lock.js renderNeuerTest` reicht `demo:'klein'` ins
    Sandbox-Onboarding; nach `setupVault` (DEK aktiv) wird befüllt (Fehler → Test startet leer, kein Block).
    i18n de+en (`test.inhalt*`), CSS `.test-inhalt`, SW `v119`, neues Modul precached. +10 Tests (**1444/1444**).
    Glue/DOM/IndexedDB statisch geprüft. (`docs/TEST_MODUS.md`)
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
- [x] **8. Angebot → Rechnung-Übernahme (rein)** ✅ (PR #129, 2026-06-18) — `domain/angebotUebernahme.js`
  (rein, node-getestet, +28 → **1326/1326**): angenommenes Angebot (`ANGEBOT_STATUS.ANGENOMMEN`) → bestehender
  Rechnungs-/Buchungspfad (`invoicing.rechnungZeilen`, Soll Forderung / Haben Erlöse+USt — selber Kern wie
  `rechnungAusAuftrag`). **Nummern-Politik** `uebernahmeNummer` je `rechnungsstelle` (Schritt 4): `blp` → echte
  §14-Nummer (`formatRechnungsnummer`), `extern` → vorläufige Vorlage `ENT-JJJJ-NNNN` (`vorlaeufigeRechnungsnummer`,
  `vorlaeufig=true`). **`angebotUebernahmeEntwurf`** referenziert die Angebotsnummer (`angebotsnummer`), benutzt sie
  aber NIE wieder (zwei getrennte Kreise, GoBD). **Prime Directive:** baut ausschließlich auf `externesAngebot`
  (Whitelist) → die interne Kalkulation gelangt nie in den Entwurf (Test prüft das JSON). `validateAngebotUebernahme`/
  `darfAngebotUebernehmen` (nur `angenommen` + gültige AN-Nummer + Positionen). SW `v112`. **Rein, kein UI** —
  UI/Store-Glue (Zähler je Kreis, `saveEntwurf`, Angebot→archiviert) sind ein eigener Folgeschritt. (Katalog §4/§7a)
- [x] **8-UI. „Rechnung aus Angebot" (UI + Store-Glue)** ✅ (2026-06-18) — Knopf **„Rechnung aus Angebot"** an einem
  angenommenen, gültigen Angebot (`ui/views/angebote.js`, sichtbar via `darfAngebotUebernehmen`) → Store-Glue
  `domain/angebote-store.js rechnungAusAngebot(id)` über die fertige reine Logik `domain/angebotUebernahme.js`
  (`validateAngebotUebernahme`/`angebotUebernahmeEntwurf`) → Buchungs-**Entwurf** via `store.saveEntwurf` (Soll
  Forderung / Haben Erlöse+USt). **Nummernpolitik je `rechnungsstelle`:** `blp` → echte §14-Nummer aus dem
  **lückenlosen** Zähler `crm-store.naechsteRechnungSeq` (DERSELBE Zähler wie `rechnungAusAuftrag` → ein einziger
  §14-Kreis), `extern` → vorläufige Vorlage `ENT-JJJJ-NNNN` aus eigenem Zähler `naechsteVorlaeufigeSeq` (getrennt,
  GoBD-neutral). Die Angebotsnummer wird nur **referenziert** (`entwurf.angebotsnummer`/Beschreibung), nie als
  Rechnungsnummer wiederverwendet (zwei getrennte Kreise). Angebot danach automatisch **→ archiviert**
  (`angenommen → archiviert`); **Festschreiben bleibt manuell (GoBD)** — Banner verweist aufs Journal. **Prime
  Directive:** baut ausschließlich auf `externesAngebot` → keine interne Kalkulation im Entwurf. i18n de+en, SW
  `v117`. Tests bleiben **1427/1427** grün (reine Logik war #129; dieser Schritt ist UI/Glue). **DOM/IndexedDB/
  kv-Zähler statisch geprüft** (kein Headless-Browser). (Katalog §4/§7a)
- [x] **9. Auftrags-Kostenträger + Nachkalkulation** ✅ (PR #130, 2026-06-18) — `domain/nachkalkulation.js`
  (rein, node-getestet, +29 → **1355/1355**): ein **Kostenträger** = Auftrag/Projekt über seine `kostenstelle`.
  **IST** aus den vorhandenen Bausteinen — `istkostenAusBuchungen` (Aufwands-Zeilen FESTGESCHRIEBENER Buchungen je
  `kostenstelle`, Aggregationsweg wie `costcenters.js`; `belegRef`/`buchungId` je Buchung mitgeführt; konto→Kostenart
  über `opts.kontoBlock`, Default Material) + `istZeitkosten` (Zeiteinträge `{dauerMin}` aus dem `employees.js`-Modell
  × interner Stundenkostensatz, Arbeit/Maschine getrennt) + `istkosten` (beides zusammengeführt). **SOLL** aus der
  Vorkalkulation: `sollkostenAusAngebot` aggregiert die interne `kalkulation` je Position × Menge nach Kostenart
  (Σ Blöcke = Selbstkosten; Netto/DB wie `interneAuswertung`). **Vergleich** `nachkalkulation(soll, ist, {nettoCent?})`
  → je Kostenart + gesamt Abweichung (IST − SOLL) + Prozent, Deckungsbeitrag SOLL gegen IST (Erlös − Ist-Kosten);
  `kostentraegerAnalyse` als Komfort-Einstieg. SW `v113`. **Rein, kein UI/Store** (eigener Folgeschritt). Prime
  Directive: Nachkalkulation rein intern. (`docs/KALKULATION_KATALOG.md` §5.1/§6)
- [x] **10. Kalibrierung + Statistik/Vergleich** ✅ (PR #131, 2026-06-18) — `domain/kalibrierung.js`
  (rein, node-getestet, +39 → **1394/1394**): **(1) Korrekturfaktoren je Kostenart** aus der eigenen
  Historie (Vor→Nachkalkulation): `korrekturFaktoren(vergleiche)` aggregiert die Soll/Ist-Vergleiche
  vieler Aufträge (Form `nachkalkulation().perBlock`) je Kostenart zu `faktor` (ΣIST/ΣSOLL, geldgewichtet)
  + `medianFaktor` (robust) + `abweichungProzent` + `anzahl`; `faktorWerte` verdichtet zu Multiplikatoren
  (konservativ: `minAnzahl`/`min`/`max`-Schranken, null→1 neutral, Quelle gewichtet|median). **Rückfluss
  in den Kern:** `kalibriereEingabe`/`kalkuliereKalibriert` skalieren je Kostenart den Mengen-/Geld-Treiber
  (analog produktschemata „füttert nur den Kern" — keine neue Formel). **(2) Angebots-Trefferquote je
  Preisniveau:** `angebotErgebnis` (gewonnen/verloren/offen aus Status; `archiviert` mehrdeutig→offen, per
  opts überschreibbar), `angebotMargeProzent` (DB/Netto aus `interneAuswertung`), `preisniveau`
  (niedrig/mittel/hoch, Grenzen konfigurierbar), `trefferquote`/`trefferquoteJePreisniveau`. **(3)**
  `kalibrierungsDigest` = PII-FREIE Aggregat-Zusammenfassung (nur Kostenart-Faktoren + Margen-Kübel) als
  möglicher Payload-Kandidat für eine **spätere, STRIKT opt-in + BYOK** pseudonyme KI-Analyse (Mistral EU,
  CLAUDE.md §8) — diese Schicht SENDET NICHTS. SW `v114`. **Rein, kein UI** (eigener Folgeschritt). Prime
  Directive: Faktoren/Margen/Quoten bleiben intern. (`docs/KALKULATION_KATALOG.md` §5.1/§5.3)
- [x] **11a. Adaptiver Baukasten — reine Sortier-/Zähl-Logik** ✅ (PR #132, 2026-06-18) — `domain/baukasten.js`
  (rein, node-getestet, +33 → **1427/1427**): die build-freie Logik UNTER der späteren Angebots-UI (Katalog §3).
  **(1) Nutzungszähler je Leistungsart:** Profil `{ schemaId: {anzahl, zuletzt} }`; `leeresNutzungsprofil`/
  `normalizeNutzung` (säubert persistierte Profile, verwirft Müll/leere) / `nutzungVon`/`anzahlVon`/`istGenutzt` /
  `zaehleNutzung(profil, schemaId, {jetzt, um})` (immutabel, Zeitstempel injizierbar). **(2) Adaptive Palette:**
  `baukastenPalette(schemata, profil)` reichert je Schema `{anzahl, zuletzt, genutzt}` an und sortiert **häufig
  → zuletzt → Katalog-Reihenfolge** (stabil; ungenutzte behalten ihre Reihenfolge); `sortiereSchemata` (nur
  Schemata) + `haeufigsteSchemata(…, n)` (Schnellzugriff, nur genutzte). **(3) Umsortieren (Drag-and-drop):**
  `verschiebePosition(positionen, von, nach)` (immutabel, klemmt das Ziel, behält Element-Referenz → interne
  `kalkulation` unberührt) + `verschiebeNachOben`/`verschiebeNachUnten`. SW `v115`. **Rein, kein UI** — die UI
  (Schritt 11b) sitzt darüber. Prime Directive: kennt nur IDs/Zähler/Reihenfolge, keine Marge. (Katalog §3)
- [x] **11b. Adaptiver Baukasten — UI** ✅ (2026-06-18) — neue Angebots-Ansicht `ui/views/angebote.js`
  (NAV „Angebote", zwischen Aufträge/Kunden; in privat/verein ausgeblendet wie `orders`) über der reinen Logik
  `domain/angebote.js` + `produktschemata.js` + `baukasten.js`. **Store-Glue** `domain/angebote-store.js`
  (verschlüsselt via encstore: `saveAngebot`/`listAngebote`/`getAngebot`/`deleteAngebot`/`setzeAngebotStatusStore`;
  Positionen behalten ihre interne `kalkulation` → Live-DB überlebt Speichern; freier Nummernkreis `AN-JJJJ-NNNN`
  beim ersten Speichern via `vergebeAngebotsnummer`). **UI:** adaptive **Karten je Leistungsart** (Sortierung
  `baukastenPalette` + Schnellzeile `haeufigsteSchemata`), Karte tippen → Schema-Felder ausfüllen → `positionAusSchema`
  → Position; beim Hinzufügen `zaehleNutzung` → Nutzungsprofil gerätelokal in den (verschlüsselten) Settings
  (`state.js` `baukastenNutzungsprofil`). Wachsende **Positionsliste mit Drag-and-drop** (`verschiebePosition`) +
  Pfeil-Knöpfen ↑/↓ (`verschiebeNachOben`/`-Unten`, DeX/Touch-tauglich, additiv). **Live-Deckungsbeitrag**
  (`interneAuswertung`, als „intern — nicht im Angebot" markiert) neben den neutralen Summen. Status-Workflow
  (`ANGEBOT_STATUS_FLOW`/`setzeAngebotStatusStore`), Archiv-Liste, **neutrales Angebotsdokument** (Druck) ausschließlich
  über `externesAngebot` (Whitelist → Prime Directive). i18n de+en, SW `v116`, neue Module precached. Tests bleiben
  **1427/1427** grün (NAV-Gating-Assertions für `angebote` ergänzt); **DOM/IndexedDB statisch geprüft** (kein
  Headless-Browser). (Katalog §3/§4/§5.2)

- [x] **9/10-UI. „Nachkalkulation/Kostenträger + Kalibrierung" (UI + I/O-Glue)** ✅ (2026-06-18) — neue Auswertungs-
  Ansicht `ui/views/nachkalkulation.js` (NAV „Nachkalkulation", in privat/verein ausgeblendet) über der fertigen
  reinen Logik `domain/nachkalkulation.js` (#130) + `domain/kalibrierung.js` (#131). **I/O-Glue** `domain/nachkalkulation-store.js`
  sammelt die vorhandenen Daten (festgeschriebene Buchungen + Konten-Index, Zeiteinträge, Angebote) und reicht sie an
  die Logik durch: je **Kostenträger** (Angebot mit `kostenstelle`) `kostentraegerAnalyse` (Soll aus interner
  Vorkalkulation, Ist aus Buchungen/Zeit), daraus `korrekturFaktoren`/`faktorWerte` (konservativ 0,5–2,0 gedeckelt)
  + `trefferquote`/`trefferquoteJePreisniveau`. **Neuer reiner Helfer** `nachkalkulation.zeiteintraegeAusZeiten`
  (Zeit `{auftragId,mitarbeiterId}` → `{kostenstelle,kostensatzCentProStd}`) node-getestet (+7 → **1434/1434**).
  **UI:** Kostenträger-Auswahl → Soll/Ist-Tabelle je Kostenart (Abweichung €/%, rot/grün) + Deckungsbeitrag Soll/Ist
  + Belege/Stunden; Kalibrierungs-Karte (Korrekturfaktoren-Tabelle + Trefferquote gesamt/je Preisniveau). **Prime
  Directive:** rein anzeigend — kein Druck/Export/KI (Digest ungenutzt). SW `v118`, neue Module precached. **DOM/
  IndexedDB statisch geprüft.** **Ehrliche Grenzen:** kontoBlock-Default → alle Aufwands-Buchungen zählen als Material;
  `stundenlohnCent` als interner Kostensatz (kein AG-Gemeinkostenaufschlag); reine Anzeige (Zeiterfassung-/Beleg-
  Zuordnungs-UND kalibrierte Vorwärtskalkulation im Editor als Folgeschritt). (`docs/KALKULATION_KATALOG.md` §5.1/§5.3/§6)

- [x] **Folgeschritt: feinere konto→Kostenart-Zuordnung** ✅ (2026-06-18) — die in der Nachkalkulation-UI als ehrliche
  Grenze genannte „alles = Material"-Vorbelegung verfeinert. Reine Logik `domain/nachkalkulation.js`
  **`kostenartFuerKonto(nummer)`** (SKR03-Kontenklasse → Kostenart: **3100–3199 Fremdleistungen → ZUKAUF**,
  **3000–3999 Wareneingang/RHB → MATERIAL**, **4100–4199 Personalaufwand → ARBEIT**; alles übrige → null →
  bisheriger Default Material) + **`standardKontoBlock(konten)`** (Map nur aus AUFWAND-Konten mit sicherer Zuordnung);
  `domain/nachkalkulation-store.js` baut die Map automatisch aus dem Kontenplan und reicht sie in `kostentraegerAnalyse`
  durch. `opts.kontoBlock` (manuell) gewinnt weiterhin. +22 Tests (**1466/1466**), SW `v120`. **Ehrliche Grenze:**
  Heuristik nach Kontenklasse (keine exakte Einzelkosten-Zuordnung); Class-4-Gemeinkosten bleiben unklassifiziert;
  MASCHINE kommt nur über die Zeiteinträge. Glue/IndexedDB statisch geprüft. (`docs/KALKULATION_KATALOG.md` §6)

- [x] **Folgeschritt: kalibrierte Vorwärtskalkulation im Angebots-Editor** ✅ (2026-06-18) — die in
  Schritt 10 fertige reine Logik (`kalkuliereKalibriert`) ist jetzt im Angebots-Editor nutzbar. Die
  Anwendungs-Primitiven `kalibriereEingabe`/`kalkuliereKalibriert` wandern in den **Kern**
  (`domain/kalkulation.js`, reine Kern-Operation; `domain/kalibrierung.js` re-exportiert → API stabil);
  neuer reiner `produktschemata.js` **`kalkuliereSchemaKalibriert`** (Schema-Eingabe → `kalibriereEingabe` →
  Kern); `angebote.js positionAusSchema(opts.faktoren)` rechnet die interne Kalkulation kalibriert und merkt
  `kalkulation.kalibriert`/`faktoren` (Außendokument bleibt neutral — Prime Directive). Glue
  `nachkalkulation-store.js ladeKalibrierungFaktoren()` (gedeckelte `faktorWerte` + Stichprobengröße); UI
  `ui/views/angebote.js`: Schalter **„Erfahrungswerte anwenden (Kalibrierung aus N Aufträgen)"** (Setting
  `kalibrierungAnwenden`, nur sichtbar mit Historie), kalibrierte Positionen tragen ein „kalibriert"-Badge,
  Live-Deckungsbeitrag spiegelt die Kalibrierung. +9 Tests (**1475/1475**), SW `v121`. **Ehrliche Grenze:**
  Faktoren skalieren Mengen-/Geld-Treiber (lineare Korrektur, keine neue Formel); DOM/IndexedDB statisch
  geprüft (kein Headless-Browser). (`docs/KALKULATION_KATALOG.md` §5.1)

- [x] **Folgeschritt: Zeit-Zuordnungs-UI je Kostenträger** ✅ (2026-06-18) — die in der Nachkalkulation-UI
  als Folgeschritt offene **echte Zeiterfassung-/Beleg-Zuordnung je Auftrag** umgesetzt, soweit GoBD es zulässt.
  **GoBD-Befund:** `kostenstelle` ist Teil der festgeschriebenen Buchungs-Hash-Kette (`audit.hashedFields`) →
  Buchungen/Belege lassen sich nicht nachträglich umhängen; saubere Zuordnung nur bei **Zeiteinträgen** (mutable
  CRM-Records). Reine Logik `domain/nachkalkulation.js` **`aufgeloesteKostenstelle(zeit, auftragIndex)`** (explizite
  `zeit.kostenstelle` vor Auftrags-Ableitung; '' = bewusst keiner → null), `zeiteintraegeAusZeiten` nutzt ihn
  (rückwärtskompatibel). `crm-store.js`: `saveZeit` persistiert `kostenstelle`, neue `setZeitKostenstelle(id, ks)`.
  Glue `nachkalkulation-store.js` `ladeZeitZuordnung()` + `zuordneZeit()`. UI `ui/views/nachkalkulation.js`: Karte
  **„Zeiten zuordnen"** (Kostenträger-Select je Zeile, Herkunft „direkt"/„über Auftrag") + ehrlicher GoBD-Hinweis an
  der Beleg-Liste. +8 Tests (**1483/1483**), SW `v122`. **Ehrliche Grenze:** nur Zeit (re)zuordbar; Buchungs-
  /Beleg-Zuordnung GoBD-fix; alle Zeiten = ARBEIT; DOM/IndexedDB statisch geprüft. (`docs/KALKULATION_KATALOG.md` §6)

### Block 3 — später / umgebungs-blockiert
- [x] **Liquiditäts-Treiber (größte anstehende Bewegungen)** [Folgeschritt zur Reichweite] ✅ (2026-06-18) — die
  Liquiditäts-Karte zeigte bisher nur SUMMEN/Salden (wie viel bald fällig, wie tief der Saldo sinkt, bis wann das Geld
  reicht), aber nicht die naheliegende Anschlussfrage „woran liegt das?" — welche einzelne Forderung sich einzutreiben
  lohnt, welche Verbindlichkeit groß ansteht. Reine Logik `domain/liquiditaet.js` (node-getestet, +14 → **1689/1689**):
  **`groessteFaellige({forderungen, verbindlichkeiten, heute, horizontTage, limit})`** — die nach offenem Betrag
  absteigend sortierten bald fälligen Posten aus DEMSELBEN Fenster wie `baldFaellig` (Fälligkeit ab heute … heute+Horizont,
  nicht überfällig), je Eintrag `{richtung:'ein'|'aus', betragCent, faelligAm, name, referenz}`, auf `limit` (Default 3,
  Konstante `LIQUIDITAET_TREIBER_DEFAULT`) gekürzt; Posten ohne offenen Betrag (≤0) fallen heraus; deterministische
  Sortierung (Betrag → früheste Fälligkeit → Name). UI `ui/views/dashboard.js`: kleine Liste „Größte anstehende
  Bewegungen" in der Liquiditäts-Karte (Wer/Referenz/Datum links, vorzeichenbehafteter Betrag rechts — Eingang +/grün,
  Ausgang −/rot) über das bestehende `report-line`-Layout, gefüttert aus denselben angereicherten Posten wie die Summen.
  i18n de+en (`dashboard.liquidityDriversLabel`/`…DriverIn`/`…DriverOut`), SW `v135` (kein neues Modul). **bucht nichts.**
  **Ehrliche Grenze:** reine Anzeige/Auswahl, keine Finanzberatung; nur über bald fällige, bekannte Posten; DOM/IndexedDB
  statisch geprüft.
- [x] **Liquiditäts-Reichweite („Runway" — bis wann reicht das Geld?)** [Folgeschritt zu #154] ✅ (2026-06-18) — die
  Liquiditäts-Karte zeigte Tiefpunkt (tiefster Stand) und Deckungslücke (fehlender Betrag), aber nicht die intuitivste
  Antwort auf die im Karten-Code selbst gestellte Frage „reicht das Geld?": **bis wann**. Der Tiefpunkt nennt den *tiefsten*
  Tag, die Reichweite den *frühesten* Engpass (kann VOR dem Tiefpunkt liegen: Saldo rutscht früh unter die Schwelle, erholt
  sich kurz, fällt später noch tiefer). Reine Logik `domain/liquiditaet.js` (node-getestet, +12 → **1675/1675**):
  **`liquiditaetsReichweite(verlauf, {reserveCent, heute})`** — erster Tag, an dem der laufende Saldo
  (`liquiditaetsVerlauf.punkte[].saldoCent`) unter die Schwelle (Mindestreserve, Default 0 → echtes Minus; konsistent via
  `normalizeReserveCent`) fällt → `{bekannt, reicht, sofort, datum, tageBis, reserveCent, negativ}` (ohne Bestand
  `bekannt:false` abwärtskompatibel; `sofort` = schon heute unter Schwelle; `negativ` = echtes Minus vs. nur
  Reserve-Unterschreitung). UI `ui/views/dashboard.js`: Klartext-Bilanz „reicht über N Tage" bzw. „reicht bis {datum}"
  (rot bei echtem Minus), nur wenn es Ausgänge gibt und der Bestand bekannt ist; der `sofort`-Fall bleibt Ampel/Deckungslücke.
  i18n de+en (`dashboard.liquidityRunwayOk`/`…RunwayUntil`), SW `v134` (kein neues Modul). **bucht nichts.** **Ehrliche
  Grenze:** einfache Planung nach Fälligkeitsdatum, keine Finanzberatung; nur über bald fällige, bekannte Posten (kein
  Forecast wiederkehrender Kosten); DOM/IndexedDB statisch geprüft.
- [x] **Liquiditäts-Mindestreserve (Puffer)** [Folgeschritt zu #153] ✅ (2026-06-18, PR #154) — die Deckungslücke (#153)
  warnte bisher erst bei echtem Minus; viele Betriebe wollen das Geld aber nicht bis auf null herunterfahren, sondern einen
  Sicherheitspuffer halten. Reine Logik `domain/liquiditaet.js` (node-getestet, +17 → **1663/1663**): `normalizeReserveCent`
  (klemmt persistierten Reservebetrag auf ganze, nicht-negative Cent) + `deckungsluecke(verlauf, {reserveCent})` mit optionaler
  **Mindestreserve als Schwelle** (Default 0 → identisch/abwärtskompatibel; Lücke greift, sobald der Tiefpunkt unter die
  Schwelle fällt, `lueckeCent` = Schwelle − Tiefpunkt; neue Felder `reserveCent` + `negativ`). Setting `liquiditaetReserveCent`
  (`state.js`, Default 0). UI `ui/views/dashboard.js`: Euro-Eingabefeld „Mindestreserve (Puffer)"; Lücken-Hinweis rot
  (`hint-error`) bei echtem Minus, mild (`muted small`) bei reiner Reserve-Unterschreitung. i18n de+en, SW `v133` (kein neues
  Modul). **bucht nichts.** **Ehrliche Grenze:** einfache Planung nach Fälligkeitsdatum, keine Finanzberatung; DOM/IndexedDB
  statisch geprüft.
- [x] **Liquiditäts-Deckungslücke (Unterdeckung im Fenster)** [Folgeschritt zu #152] ✅ (2026-06-18) — der Tiefpunkt-Hinweis
  (#152) zeigt den tiefsten Stand auch dann, wenn er positiv bleibt. Wenn der laufende Saldo aber zwischendurch echt ins
  Minus rutscht und sich bis zum Fenster-Ende wieder erholt, bleibt der Engpass von der End-Saldo-Ampel
  (`liquiditaetsAmpel`, projiziert<0) unentdeckt — und es fehlt der konkrete Finanzierungs-Betrag. Reine Logik
  `domain/liquiditaet.js` **`deckungsluecke(verlauf)`** (node-getestet, +8 → **1646/1646**): nimmt das `liquiditaetsVerlauf`-
  Ergebnis und liefert `{unterdeckung, lueckeCent, datum}` — greift nur bei `tiefpunktCent < 0` (`lueckeCent` =
  −`tiefpunktCent`, `datum` = `tiefpunktDatum`), sonst keine Unterdeckung (abwärtskompatibel). UI `ui/views/dashboard.js`:
  warnfarbener Hinweis (CSS `.hint-error`) „Unterdeckung: Bis zum {datum} fehlen … {betrag}" — unabhängig vom End-Saldo;
  **bucht nichts**. i18n de+en (`dashboard.liquidityGapHint`), SW `v132` (kein neues Modul). **Ehrliche Grenze:** einfache
  Planung nach Fälligkeitsdatum, keine Finanzberatung; DOM/IndexedDB statisch geprüft.
- [x] **Liquiditäts-Tiefpunkt (laufender Saldo im Fenster)** [Folgeschritt zu #149] ✅ (2026-06-18) — die Projektion (#149)
  prüfte nur den Saldo am **Fenster-ENDE**; der kann positiv sein, obwohl der laufende Saldo zwischendurch ins Minus
  rutscht (große Verbindlichkeit früh, ausgleichende Forderung spät). Reine Logik `domain/liquiditaet.js`
  **`liquiditaetsVerlauf({forderungen, verbindlichkeiten, heute, horizontTage, geldbestandCent})`** (node-getestet, +17 →
  **1638/1638**): bündelt bald fällige Bewegungen je Fälligkeits-Tag, addiert sie chronologisch ab dem Geldbestand auf →
  `punkte[]` (Saldo nach jedem Tag) + `startCent`/`endeCent` + **`tiefpunktCent`/`tiefpunktDatum`** (tiefster Stand +
  wann; startet beim heutigen Bestand). Ohne Bestand → Saldo-Felder `null` (abwärtskompatibel). UI `ui/views/dashboard.js`:
  Tiefpunkt-Hinweis in der Liquiditäts-Karte — nur, wenn der laufende Saldo zwischendurch UNTER den End-Saldo fällt (sonst
  keine neue Info); **bucht nichts**. i18n de+en, SW `v131` (kein neues Modul). **Ehrliche Grenze:** einfache Planung nach
  Fälligkeitsdatum, Bündelung je Tag (kein Intraday); DOM/IndexedDB statisch geprüft.
- [x] **Liquiditätsvorschau: wählbares Zeitfenster** [Folgeschritt zu #149] ✅ (2026-06-18) — die Liquiditäts-Karte
  rechnete bisher fest mit 7 Tagen. Jetzt kann der Nutzer das Fenster **7 / 14 / 30 / 90 Tage** umschalten (Segment-Wahl
  in der Karte, Setting `liquiditaetHorizontTage`, gerätelokal/verschlüsselt). Reine Logik `domain/liquiditaet.js`
  `LIQUIDITAET_HORIZONT_OPTIONEN` + `normalizeHorizont(value)` (klemmt persistierte/ungültige Werte auf eine kuratierte
  Option, Default 7), node-getestet (+11 → **1621/1621**). UI `ui/views/dashboard.js`: `.segmented`-Umschalter über den
  KPI-Kacheln → `updateSettings` + Dashboard-Neuzeichnung; `liquiditaetsVorschau`/`baldFaellig` rechnen mit dem gewählten
  Horizont (die reine Logik nahm `horizontTage` schon entgegen). i18n de+en, SW `v130` (kein neues Modul). **Ehrliche
  Grenze:** weiterhin einfache Planung nach Fälligkeitsdatum (keine Forecast-Modellierung); DOM/IndexedDB statisch geprüft.
- [x] **Liquiditätsvorschau: Geldbestand + projizierter Saldo** [Folgeschritt zu #147] ✅ (2026-06-18, PR #149) — die
  reine Eingänge-vs-Ausgänge-Sicht beantwortete noch nicht „reicht das Geld?". Jetzt zieht die Karte den **aktuellen
  Geldbestand (Kasse + Bank)** heran und projiziert den Saldo am Fenster-Ende (Bestand + Eingänge − Ausgänge). Reine Logik
  `domain/liquiditaet.js` (node-getestet, +25 → **1610/1610**): `GELDKONTO_BEREICHE`+`istGeldkonto` (AKTIV 1000–1099 Kasse /
  1200–1299 Bank), `geldbestand(buchungen, konten, {stichtag})` (Saldo je Geldkonto Soll−Haben aus den festgeschriebenen
  Buchungen, Entwürfe zählen nicht), `liquiditaetsVorschau(opts.geldbestandCent)` → `geldbestandCent`/`projiziertCent`
  (ohne Bestand `null` → abwärtskompatibel), `LIQUIDITAET_AMPEL`+`liquiditaetsAmpel` (kritisch < 0 / Warnung knapp / ok).
  UI `ui/views/dashboard.js`: Karte zeigt „Kontostand (Kasse + Bank)" + „voraussichtlich in N Tagen" (ampelgefärbt) +
  ehrlichen Hinweis; **bucht nichts**. i18n de+en, SW `v129` (kein neues Modul). **Ehrliche Grenze:** einfache Planung nach
  Fälligkeitsdatum, keine Forecast-Modellierung; Geldkonto-Erkennung über die 4-stelligen SKR03-Bereiche; DOM/IndexedDB
  statisch geprüft.
- [x] **Dashboard-KPI: Liquiditätsvorschau (bald fällig)** [Folgeschritt zu #143/#145] ✅ (2026-06-18, PR #147) —
  vorausschauender Gegenpol zu den Überfälligkeits-KPIs: was wird in den **nächsten 7 Tagen fällig** — erwartete
  **Eingänge** (bald fällige Forderungen) gegen **Ausgänge** (bald fällige Verbindlichkeiten) + **Netto**. Reine Logik
  `domain/liquiditaet.js` (node-getestet, +14 → **1585/1585**): `baldFaellig(angereichertePosten, {heute, horizontTage})`
  (Posten im Fenster `[heute … heute+Horizont]`, **nicht überfällig** → keine Doppelzählung mit den Überfälligkeits-KPIs;
  liest `offenCent`/`betragCent`) + `liquiditaetsVorschau({forderungen, verbindlichkeiten, …})` (eingehend/ausgehend/netto).
  UI `ui/views/dashboard.js`: Karte „Liquiditätsvorschau (bald fällig)" am Kopf — gefüttert aus denselben angereicherten
  Posten wie die Überfälligkeits-Karten (`forderungReport`/`verzugReport`); nur im Firmen-/Vereins-Kontext (Forderungen via
  Ansicht `orders`, Verbindlichkeiten via `payables`; Privat blendet beide aus) UND wenn etwas bald fällig ist; Netto nur,
  wenn beide Seiten sichtbar; **bucht nichts**. i18n de+en, SW `v128` (neues Modul precached). **Ehrliche Grenze:** einfache
  Planung nach Fälligkeitsdatum, keine Forecast-Modellierung; DOM/IndexedDB statisch geprüft.
- [ ] **Server-Backup-Ziel** (sobald eigener Server existiert) — Stelle 3 der 3-2-1-Sicherung.
- [x] **Eingangsrechnungs-Verzug (Gegenseite)** [SOLL] ✅ (2026-06-18) — Spiegel zum Mahnwesen aus
  **Schuldnersicht**. Reine Logik `domain/eingangsverzug.js` (node-getestet, +33 → **1516/1516**):
  `verzugsstufe`/`verzugsstufeLabel` (gestaffelte Überfälligkeit 1/14/42 Tage), `verzugsLage`,
  `berechtigteVerzugskosten` (§ 288-Zinsen + 40-€-Pauschale, wiederverwendet aus `mahnwesen.js`),
  **`pruefeErhalteneMahnung`** (geforderte vs. berechtigte Verzugszinsen/Mahngebühren → `plausibel`/
  `ueberhoeht`/`kein_verzug`/`ohne_angabe`, Toleranz 5 Cent), `verzugUebersicht` (Kennzahlen + Zinsrisiko).
  UI `ui/views/payables.js`: Verzugsstufen-Badge je überfälligem Posten + Knopf „Mahnung prüfen" → Karte
  „Erhaltene Mahnung prüfen (§ 288 BGB)" (Live-Vergleich + Bewertungs-Badge + § 286/§ 247-Disclaimer; bucht
  nichts). i18n de+en, CSS `.badge-error`, SW `v123`. **Ehrliche Grenze:** Hilfs-Einordnung nach Tagen, keine
  Rechtsberatung; Buchung gezahlter Verzugskosten (Zinsaufwand) als Folgeschritt erledigt (siehe unten).
  DOM/IndexedDB statisch geprüft.
- [x] **Buchung gezahlter Verzugskosten (Zinsaufwand)** [Folgeschritt] ✅ (2026-06-18, PR #141) — Spiegel zu
  `mahnwesen.mahnbuchungEntwurf` (R1) aus Schuldnersicht. Reine Logik `domain/eingangsverzug.js` (node-getestet,
  +20 → **1536/1536**): `VERZUG_AUFWAND_KONTEN` (SKR03: 2100 Zinsaufwand, 4980 sonstiger Aufwand, 1200 Bank,
  1600 Verbindlichkeit) + `VERZUG_GEGENKONTO` (bank|verbindlichkeit); `verzugAufwandZeilen` (Soll 2100/4980 AN
  Haben Bank/Verbindlichkeit, **ohne Vorsteuer** — Schadensersatz Abschn. 1.3 UStAE; ausgeglichen; Konto-Override);
  `verzugAufwandEntwurf` (Buchungs-Entwurf, null bei 0/0). UI `ui/views/payables.js`: in der „Mahnung prüfen"-Karte
  neuer Abschnitt „Verzugskosten buchen (Zinsaufwand)" — Gegenkonto-Wahl + Knopf → Buchungs-ENTWURF
  (`ensureSeedKonten`+`saveEntwurf`; Festschreiben manuell, GoBD). i18n de+en, SW `v124`. **Ehrliche Grenze:** bucht
  die eingegebenen geforderten Beträge (keine Auto-Deckelung); DOM/IndexedDB statisch geprüft.
- [x] **Verzugsrisiko-Übersicht (eigene Zahlungsdisziplin)** [Folgeschritt zu #140] ✅ (2026-06-18) — die in #140
  angelegte, node-getestete KPI-Logik `verzugUebersicht` war in keiner UI sichtbar. Reine Logik
  `domain/eingangsverzug.js` **`verzugReport(rechnungen, opts)`** (Ein-Aufruf-Einstieg: `offeneVerbindlichkeiten`
  → `anreichereVerbindlichkeiten` → `verzugUebersicht`; Pfad Roh-Rechnung → Kennzahl node-testbar, +7 →
  **1543/1543**). UI `ui/views/payables.js`: Karte **„Verzugsrisiko (eigene Zahlungsdisziplin)"** am Kopf
  (überfällige Anzahl/Summe + § 288-Zinsrisiko + kritisch), nur sichtbar wenn etwas überfällig ist; **bucht
  nichts**. i18n de+en, SW `v125`. **Ehrliche Grenze:** Hilfs-Einordnung, keine Rechtsberatung; DOM/IndexedDB
  statisch geprüft.
- [x] **Dashboard-KPI: überfällige Verbindlichkeiten (eigene Zahlungsdisziplin)** [Folgeschritt zu #142] ✅ (2026-06-18,
  PR #143) — die node-getestete Verzugs-KPI (`verzugReport`/`verzugUebersicht`) war nur in der Verbindlichkeiten-Ansicht
  sichtbar; jetzt auch **auf dem Dashboard** (Liquiditäts-/Verzugsrisiko auf einen Blick, spiegelt die für die
  Forderungsseite dokumentierte Dashboard-Intention). Reine Logik `domain/eingangsverzug.js` **`verzugAmpel(uebersicht)`**
  (+ `VERZUG_AMPEL`, node-getestet, +8 → **1551/1551**): Ampel ok|warnung|kritisch für die KPI-Färbung (kritisch ab einer
  Verbindlichkeit ≥ 14 Tage überfällig). UI `ui/views/dashboard.js`: Karte „Überfällige Verbindlichkeiten (eigene
  Zahlungsdisziplin)" am Kopf — nur im Firmen-/Vereins-Kontext (`zeigeAnsicht 'payables'`) UND wenn etwas überfällig ist;
  Klick → Verbindlichkeiten-Ansicht; **bucht nichts**. i18n de+en, SW `v126` (keine neuen Module). DOM/IndexedDB statisch geprüft.
- [x] **Dashboard-KPI: überfällige Forderungen (Mahnwesen)** [Folgeschritt zu #143] ✅ (2026-06-18, PR #145) — Spiegel
  zur Verbindlichkeiten-KPI (#143), aber aus **Gläubigersicht**: die in `docs/OFFENE_PUNKTE.md` (A1) dokumentierte
  Dashboard-Intention „Kennzahl überfällige Forderungen, Summe + Anzahl". Damit sind beide Seiten (Forderungen ⇄
  Verbindlichkeiten) symmetrisch auf der Übersicht. Reine Logik `domain/mahnwesen.js` (node-getestet, +20 →
  **1571/1571**): **`forderungUebersicht`** (Spiegel zu `verzugUebersicht`: überfällige Anzahl/Summe + Σ §-288-Zins-
  Potenzial + kritisch ab 1. Mahnung/≥14 Tage), **`FORDERUNG_AMPEL`/`forderungAmpel`** (Spiegel zu `verzugAmpel`) und
  **`forderungReport(auftraege, opts)`** (Ein-Aufruf-Einstieg `offenePosten` → `anreicherePosten` →
  `forderungUebersicht`; Import zyklenfrei). UI `ui/views/dashboard.js`: Karte „Überfällige Forderungen (Mahnwesen)" am
  Kopf — nur sichtbar bei aktivem Mahnwesen (`zeigeFeature MAHNWESEN`, in Privat ausgeblendet) UND wenn etwas überfällig
  ist; Klick → Berichte; **bucht nichts**. i18n de+en, SW `v127` (keine neuen Module). **Ehrliche Grenze:** Hilfs-
  Einordnung, keine Rechtsberatung; aggregiertes Zins-Potenzial mit konservativem B2B-Aufschlag; DOM/IndexedDB statisch geprüft.
- [ ] **WorkFloh-Gegenstücke** (fremdes Repo, über den Nutzer): **Test-Modus** (`docs/TEST_MODUS.md` ⇄-Abschnitt),
  BLP-Format-Exporter für die Rechnungsstelle, optional Symbiose-Import (Sage 5d).
- [ ] **Bekannt blockiert:** Lighthouse/Perf (Headless), lokales OCR (Tesseract = nicht build-frei),
  ZUGFeRD-Erzeugen (PDF/A-3-Lib), Sage 5b–d (fremde Repos).

### Block 4 — V-Lohn: Lohn-Buchungskern (build-frei, FINIT — Nutzer-Entscheidung 2026-06-18)
> **Scope bewusst eng (vom Nutzer gewählt: „Lohn-Buchungskern").** BLP ist die **prüfungssichere
> Buchhaltungsschicht** für die Lohnabrechnung, **NICHT die Abrechnung selbst**: Es berechnet **keine**
> Lohnsteuer/SV, kein ELStAM, keine SV-Meldungen (DEÜV), keine amtlichen Tabellen. Du gibst die
> bereits berechneten Beträge ein (aus der Entgeltabrechnung des Lohnbüros/Beraters/Lohnprogramms);
> BLP kontiert sie GoBD-sicher. **Klares Ende:** 6 Schritte, je 1 PR, je node-getestet.
- [x] **L1. Reine Buchungslogik + Lohn-Konten** ✅ (2026-06-18) — `domain/lohnbuchung.js` (rein, node-getestet,
  +23): **Brutto-Methode** (SKR03) `lohnBuchungZeilen(e, opts)` / `lohnBuchungEntwurf` / `validateLohnlauf` /
  `lohnNettoCent` + `LOHN_KONTEN`/`LOHN_AUSZAHLUNG`. Aus {brutto, lohnsteuer, solz, kirchensteuer, svAn, svAg}
  die ausgeglichene Buchung: **Soll** 4120 Gehälter (Brutto) + 4130 Gesetzl. soziale Aufwendungen (AG-Anteil);
  **Haben** 1200 Bank (Netto; „auf Ziel" → 1740) + 1741 Verb. Lohn-/Kirchensteuer + 1742 Verb. soziale
  Sicherheit (AN+AG). Neue Seed-Konten **4110/1740/1741/1742** (`domain/accounts.js`). Entwurf gegen die
  Seed-Kontenliste `validateBuchung`-gültig. SW `v136`, neues Modul precached. **Rein, kein UI/Store.**
- [x] **L2. Lohnlauf-Store + Lohnkonto** ✅ (2026-06-18) — Store-Glue `domain/lohn-store.js` (verschlüsselt via
  encstore: `saveLohnlauf`/`listLohnlaeufe`/`getLohnlauf`/`deleteLohnlauf` + `bucheLohnlauf(id)` → Buchungs-Entwurf
  über `saveEntwurf`, Datum = Monatsletzter, `buchungId` verknüpft). **Reine Logik** in `domain/lohnbuchung.js`
  (node-getestet, +22): `normalizeLohnlauf` (abgeleitete Summen frisch + konsistent gerechnet, Monat → `YYYY-MM`),
  `lohnkontoAggregat(laeufe, {jahr})` (je Mitarbeiter Jahressummen + Monate + Gesamtsumme, nach Brutto sortiert),
  `lohnlaufBuchungsdatum(monat, heute)` (Monatsletzter, schaltjahr-sicher). SW `v137`, neues Modul precached.
  IndexedDB/Krypto statisch geprüft. **Kein UI** (L3).
- [x] **L3. UI „Lohn"** ✅ (2026-06-18) — neue Ansicht `ui/views/lohn.js` (NAV „Lohn", in privat/verein
  ausgeblendet wie `employees`) über `domain/lohn-store.js` + reiner Logik `domain/lohnbuchung.js`. Formular:
  Mitarbeiter-Auswahl (aus `crm-store.listMitarbeiter`) + Abrechnungsmonat + Brutto/Lohnsteuer/SolZ/KiSt/
  SV-AN/SV-AG + Auszahlung (Bank/„auf Ziel") mit **Live-Vorschau** (Netto + Soll=Haben über `lohnBuchungZeilen`,
  kein Rechnen im DOM). Lohnlauf-Liste mit **„Buchen (Entwurf)"** (`bucheLohnlauf` → `saveEntwurf`, Festschreiben
  manuell/GoBD, Banner verweist aufs Journal) + Löschen; **Lohnkonto-Karte** je Mitarbeiter (`lohnkontoAggregat`).
  Ehrlicher Hinweis im UI: „BLP berechnet KEINE Lohnsteuer/SV". i18n de+en, SW `v138`, neues View-Modul precached.
  NAV-Gating-Assertion ergänzt (+1 → **1735/1735**). DOM/IndexedDB statisch geprüft (kein Headless-Browser).
- [x] **L4. Monatliche Lohnsteuer-Anmeldung (Datenpaket)** ✅ (2026-06-18) — reine Logik `domain/lohnbuchung.js`
  `lohnsteuerAnmeldung(laeufe, {monat})` (summiert LSt+SolZ+KiSt je Abrechnungsmonat → Kennzahlen) + Export
  `domain/export.js buildLohnsteuerAnmeldungPaket(anm, meta)` (CSV-Datenpaket, Kz 42/47/61/62, **NICHT amtlich**,
  kein ELSTER-Direktversand — analog `buildElsterVaPaket`). UI-Karte in `ui/views/lohn.js`: Monatswahl → LSt/SolZ/
  KiSt/Summe + „Datenpaket herunterladen" (`downloadText`) + ELSTER-Link + ehrlicher Hinweis. i18n de+en, SW `v139`
  (+10 → **1746/1746**). **Ehrliche Grenze:** keine Konfessions-Aufteilung, Kennzahlen am Formular/mit Berater prüfen.
- [x] **L5. SV-/LSt-Zahlungsübersicht** ✅ (2026-06-18) — reine Logik `domain/lohnbuchung.js`
  `offeneLohnabgaben(buchungen, {stichtag})` (offener Saldo der Verbindlichkeitskonten 1741 Steuer + 1742 SV aus den
  **festgeschriebenen** Buchungen, Passiv-Saldo Haben−Soll) + `lohnabgabeZahlungZeilen`/`lohnabgabeZahlungEntwurf`
  (Soll 1741/1742 an Bank). Store-Glue `domain/lohn-store.js bucheLohnabgaben`. UI-Karte „Abzuführende Lohnabgaben
  (offen)" in `ui/views/lohn.js` (LSt/SV/Summe + „Als bezahlt buchen (Entwurf)" → `saveEntwurf`, GoBD). i18n de+en,
  SW `v140` (+8 → **1754/1754**). DOM/IndexedDB statisch geprüft.
- [x] **L6. Doku `docs/LOHN.md` + Abschluss** ✅ (2026-06-18) — `docs/LOHN.md` (Architektur, Buchungslogik,
  Workflow, Konten-Referenz, ehrliche Grenzen, Test-Modus-Hinweis); PULS/SESSIONS/OFFENE_PUNKTE/NAECHSTE_SITZUNG
  fortgeschrieben. **→ Block 4 (V-Lohn) KOMPLETT (L1–L6).**

### Block 5 — P-Sprint (5 Sitzungen, EINER pro Sitzung, danach Besprechung — Nutzer 2026-06-19)
> Vom Nutzer am 2026-06-19 vereinbart: die folgenden P-Punkte (aus dem Transparenzbericht §8) in genau
> dieser Reihenfolge, **eine Sitzung = ein Punkt**, **danach Besprechung** (nicht selbstständig
> weiterlaufen). Arbeitsauftrag: selbstständig nach Logik + Nutzen; **größere Konflikte/Unklarheiten über
> `AskUserQuestion` eskalieren**, Kleines selbst entscheiden. Paste-fertiger Auftrag: `docs/NAECHSTE_SITZUNG.md`.
- [x] **S1 · P9 — Datei-Import mit exaktem Schlüssel-Abgleich ✅ (2026-06-19):** reine Logik `src/ai/schluesselabgleich.js`
  (node-getestet, +38 → **1810/1810**): `gleicheAb` (exakter Token↔Klartext-Abgleich, verlustfrei + Bericht
  `ersetzt`/`fehlend`/`ungenutzt`/`vollstaendig` — Token ohne Schlüssel bleiben sichtbar, nichts erfunden),
  `serialisiereSchluessel`/`parseSchluessel` (Schlüssel-Datei „Anker-Tresor", JSON `blp-schluessel` v1), `tokenVorkommen`/
  `typAusToken`/`schluesselAusMap`/`abgleichBericht`/`pruefeRoundtrip`. UI `src/ui/schluesselabgleich.js` (Einstellungs-Karte
  unter „Datenschutz bei KI": pseudonymisieren+Schlüssel sichern · Datei importieren+abgleichen). i18n de+en, SW `v143`.
  DOM/Datei-Picker statisch geprüft.
- [x] **S2 · P10 — handelnde Person als Besteller ✅ (2026-06-19):** additives Datenmodell + UI-Feld. Reine Logik
  `src/domain/besteller.js` (node-getestet, +26 → **1836/1836**): `normalizeBesteller` (String/Objekt → `{name,funktion,
  email,telefon}` getrimmt, null ohne Name), `validateBesteller` (optional; Name-Pflicht nur bei Restangaben, E-Mail
  formal, Längen-Cap), `bestellerLabel`, `bestellerKontaktzeile` („z. Hd. Name (Funktion)", OHNE E-Mail/Telefon →
  Prime Directive). Verdrahtet: `orders.js` (`validateAuftrag` + `AUFTRAG_EDIT_FELDER`), `crm-store.saveAuftrag`
  (persistiert normalisiert) + `importWorkFloh` (Durchreichen), `rechnung.baueRechnung` (Dokumentfeld `besteller`),
  `importworkfloh.normalizeImport` (roh durchreichen). UI `ui/views/orders.js`: 4 Formularfelder + Liste-Label +
  „z. Hd."-Zeile im Empfängerblock der Rechnung. i18n de+en, SW `v144`, 124 Module. DOM/IndexedDB statisch geprüft.
- [x] **S3 · P3 + P4 — Aufklärungstexte ✅ (2026-06-19):** reine Daten + Selektoren `src/domain/aufklaerung.js`
  (node-getestet, +22 → **1858/1858**): `AUTONOMIE_STUFEN` (suggest/draft/auto — je Titel/Kurztext/Punkte),
  `AUTONOMIE_GRENZEN` (Festschreiben bleibt manuell, Storno statt Löschen, kein Datenabfluss ohne Bestätigung,
  Endverantwortung beim Nutzer), `KLEINUNTERNEHMER_DRITTDATEN` (§ 19 UStG befreit NUR von USt, nicht von DSGVO/
  Aufbewahrung — Punkte zu Art. 6/13/14/28/32 DSGVO, § 147 AO/§ 257 HGB) + Selektoren `autonomieStufe`,
  `aktiveAutonomieStufe` (Fallback suggest), `drittdatenHinweisRelevant`. UI: zwei neue Karten in „Recht & Doku"
  (`src/ui/views/legal.js`) — Autonomiestufen mit Markierung der aktiv eingestellten Stufe + Grenzen; Drittdaten-Karte
  mit AVV-Betonung, wenn EU-KI konfiguriert. i18n de+en, CSS, SW `v145`, 125 Module. DOM statisch geprüft.
- [x] **S4 · P2 — KI-Anbieterwahl je Modus ✅ (2026-06-19)**, strikt innerhalb der EU (Nicht-EU bleibt geschlossen/
  dormant). Reine Logik `src/ai/anbieter.js` (node-getestet, +28 → **1886/1886**): `KI_MODI` (ocr|kontierung|steuer),
  `KI_REGION`/`ERLAUBTE_REGIONEN` (eu+lokal; Nicht-EU dormant), Registry `KI_ANBIETER` (vision/mistral/heuristik/aus,
  KEIN neuer Anbieter), `STANDARD_WAHL` (verhaltensgleich) + Selektoren `normalizeAnbieterWahl`/`erlaubteAnbieter`/
  `aktiverAnbieter`/`istAus`/`istLokal`/`istEuCloud`. Persistiert verschlüsselt in `aiConfig.anbieterWahl` (normalisiert).
  Netz-Rand: `vision.ocr`, `mistral.categorize`, `berater.begruendeBuchung`, Steuer-Assistent (reports.js), OCR-Bereitschaft
  (documents.js). UI: drei Anbieter-Selects + EU-Hinweis (`ui/shell.js`), i18n de+en, SW `v146`, 126 Module. Setting + UI,
  kein Datenmodell-/GoBD-Eingriff. DOM statisch geprüft.
- [x] **S5 · P8 — QR-Einzelteilen (lokal erzeugt) ✅ (2026-06-19):** build-frei gelöst — vendored, reiner JS-QR-Encoder
  `src/core/qr.js` (eigenes ES-Modul, keine npm/CDN-Runtime), Algorithmus portiert aus der **MIT**-lizenzierten
  „QR Code generator library" von Project Nayuki (Lizenz + Attribution im Kopf); Byte-Modus/UTF-8, Versionen 1–40,
  EC L/M/Q/H, automatische Maskenwahl. node-getestet (+40 → **1926/1926**) gegen unabhängige Spezifikations-Anker
  (Kapazität, Format-/Versions-Info-BCH-Ground-Truth, RS-Teiler, GF-Reduktion, Ausrichtungspositionen, Matrix-Struktur).
  UI: „Als QR anzeigen (lokal)" für das pseudonyme Dokument (Inline-SVG, kein Netz) in der Schlüssel-Abgleich-Karte.
  SW `v147`, 127 Module. **Ehrliche Grenze:** physischer Scan-Test braucht ein echtes Gerät (kein Scanner in der Umgebung).
- [x] **Danach: BESPRECHUNG mit dem Nutzer** (Bilanz + neue Richtung) — **erledigt 2026-06-19.**

### Block 6 — Sage-Mycel-Andock (Phase 5) — Nutzer-Entscheidung 2026-06-19
**Abgestimmtes Thema + Reihenfolge: ZUERST Sage/Hub, DANN Mein-WorkFloh** (Sage hält die Spec-Hoheit; „Spec vor Code").
Verbindliche Referenz: `docs/SAGE_SYNC_BRIEFKASTEN.md`. Hintergrund/E2E-Brief: `docs/SAGE_E2E_ANFRAGE.md`.
**E2E-Befund (aus `Sage-Protokol/docs/INTERFACES.md`, gelesen 2026-06-19):** das Mycel ist heute **signatur-only**
(Ed25519), **keine** Nutzlast-Verschlüsselung, kein X25519, `protocolVersion 0.1`. → **Grad B (sensible Daten)**
heute build-frei **pseudonym** (P9, keine Spec-Änderung); **E2E (X25519)** wäre eine **additive** Spec-Erweiterung,
die **Sage netzweit entscheidet**.
**✅ SAGE-ANTWORT (2026-06-19, menschlich vermittelt):** 1 **JA** (Briefkasten in 0.1 bewusst öffentlich/signiert,
nicht verschlüsselt — Vertraulichkeit = lokale Knoten-Sache) · 2 **JA** (Grad-B-Pseudonymisierung = freigegebener
**Sofortpfad**, kein Bump/Bau) · 3 **JA mit Wie** (X25519 „sealed box" `{v,epk,iv,ct}` = ECDH→HKDF-SHA256→AES-GCM-256,
optionales Feld `encryptionPublicKey`, an libsodium `crypto_box_seal` angelehnt; additiv `0.1→0.2`) · 4 Reihenfolge
**bestätigt**. Formaler `protocolVersion`-Bump bleibt **Sage-Hoheit** und kommt erst **nach** Knoten-Deploy + Knoten-Go.
Sage hat seine Seite als Entwurf abgelegt (deren PR #302, kein netzweites Signal/kein INTERFACES-Bump).
- [ ] **6.1 — BLP wird SBKIM-Knoten** (erste PR): Ed25519-Identität (WebCrypto, in-app) + `sbkim/spore.json`
  (9 Pflichtfelder, kanonische Signatur, `id=base64url(SHA256(rawPub))`, `domainVector` vorerst `_demo`) +
  `sbkim/SIGNAL.json` (seq 1). **Headless-Beweis** `node tools/verify_remote_spore.mjs sbkim/spore.json` = VALID;
  Krypto-/Kanon-Helfer node-getestet. **Schritt 4 dabei:** `docs/SAGE_E2E_ANFRAGE.md` dem Nutzer zum Relayen geben.
- [x] **6.2 — Sage/Hub-Registrierung + erster Handshake** → `verified-spore` ✅ (2026-06-19): Sage hat unsere
  Spore VALID (4/4) verifiziert + `verified-spore` vergeben + im Hub registriert (Sage PR #303, wir = 6. Peer).
  Gegenstelle = Sage (`nysOZE3VuKqZA23i5G2XL67s41JIIykI58zXMtJkYfA`); reziprok verifiziert (VALID) →
  `sbkim/Sage_inbox.json` + `.verify.md`; `ack[Sage]=22`, `SIGNAL.seq`=3, `forNodes`=`["*"]`. Andock beidseitig besiegelt.
- [ ] **6.3 — WorkFloh-Pairing vom Hub aus:** Angebote ⇄ E-Mail-/Lead-Aufbereitung über den Briefkasten
  (Nutzlast = vorhandenes Austauschformat v4 `domain/connect.js`; sensible Teile pseudonym/P9).
- [ ] **6.4 — echter `domainVector`** (Transformers.js `Xenova/multilingual-e5-small`) → `verified-match`
  (build-frei prüfen — WASM/CDN-Frage; sonst ehrlich als blockiert melden).
  **WICHTIG (Wunsch von Sage + SB·KIMTool·Point, 2026-06-19):** den **Verschlüsselungs-/E2E-Aspekt**
  (AES-GCM-Familie, E2E/X25519-Perspektive, Tresor-Symbiose) ausdrücklich in den **eingebetteten
  Domänen-Text** (`domainKeywords`/`domainDescription` in `src/sbkim/nodeProfile.js`) aufnehmen, sonst
  bleibt die Nähe zu den Tresor-Knoten im Vektor unsichtbar. **Rück-Quittung ans Netz**, wann das
  Embedding kommt. **Achtung:** Re-Signatur mit dem BESTEHENDEN Schlüssel (nodeId `MyHVM7…` MUSS
  erhalten bleiben — kein neues Keypair, sonst brechen alle Andocks).
- [ ] **6.5 — X25519-Erweiterung (Sage hat E2E bejaht, „mit Wie"):** nach Sages 0.2-Spec umsetzen —
  **erst nach** Knoten-Deploy (6.1) + netzweitem Knoten-Go (Sage setzt den formalen `protocolVersion`-Bump).

**Abhängigkeiten Block 6:** 6.1 ist Voraussetzung für alles · 6.2 braucht 6.1 · 6.3 braucht 6.2 · 6.4/6.5 nach Bedarf.
**Mensch-/umgebungs-blockiert:** 6.2/6.3 berühren fremde Repos (Klaus vermittelt) — **nie selbst fremde Repos anfassen.**

## Abhängigkeiten (kurz)
8 braucht 7+4 · 7 braucht 5(+4) · 9 braucht 7 · 10 braucht 9 · 11 ist Präsentation (nach 7).
Block 1 ist unabhängig und kommt zuerst (Sicherheit/Vertrauen).
**Block 4 (V-Lohn):** L2 braucht L1 · L3 braucht L2 · L4/L5 brauchen L2 · L6 zuletzt.
**Block 5 (P-Sprint):** strikt sequenziell S1→S5, je 1 Sitzung, danach Besprechung.
