# NAECHSTE_SITZUNG.md — Paste-fertiger Nachfolge-Brief

> **Zweck:** Diese Datei enthält den **kopierfertigen Brief** für die jeweils nächste Sitzung.
> Jede Sitzung MUSS diese Datei am Ende auf den dann nächsten Stand bringen (siehe Pflicht
> ganz unten). So entsteht eine **selbstfortschreibende Kette** ohne Reibungsverlust.
>
> **Bedienung:** Den Block zwischen den Markierungen `>>> COPY <<<` und `>>> END COPY <<<`
> komplett kopieren und als Auftrag in die neue Sitzung einfügen.

---

>>> COPY <<<

Projekt: BookLedgerPro (lausiklauskn-png/bookledgerpro).

START: Lies ZUERST `docs/PULS.md` ("START HIER") + `docs/BAUPLAN.md` + `docs/NACHFOLGE_PLAN.md` +
obersten `docs/SESSIONS.md`-Eintrag + `docs/OFFENE_PUNKTE.md`. Daraus ergibt sich alles.

AUFGABE DIESER SITZUNG: **Den `docs/BAUPLAN.md` abarbeiten** (mit dem Nutzer 2026-06-17 vereinbart). Reihenfolge
steht dort. **Block 1 (Vertrauen/Sicherheit) ist KOMPLETT** und die **Block-2-Kernkette (Schritte 4–11) ist KOMPLETT**
(Kalkulations-Kern → Produkt-Schemata → Angebote-Kern → Angebot→Rechnung-Logik → Nachkalkulation → Kalibrierung →
adaptiver Baukasten inkl. UI). **Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1
PR, jeder einzeln grün + gemergt; nie „halb" mergen, im Zweifel feiner schneiden). Stand: **Block 1 KOMPLETT** (Schritt
1 #116 · 2a #118 · 2b #120 · 2c #122 · 3 #124) · **Block 2: Schritt 4 `rechnungsstelle` ✅ #125 · 5 Kalkulations-Kern ✅
#126 · 6 Produkt-Schemata ✅ #127 · 7 Angebote-Kern ✅ #128 · 8 Angebot→Rechnung-Übernahme (rein) ✅ #129 · 9
Nachkalkulation ✅ #130 · 10 Kalibrierung ✅ #131 · 11a Adaptiver Baukasten — reine Logik ✅ #132 · 11b Adaptiver
Baukasten — UI ✅** (`ui/views/angebote.js` Angebots-Ansicht + `domain/angebote-store.js` verschlüsselte Store-Glue;
adaptive Karten je Leistungsart via `baukastenPalette`/`haeufigsteSchemata` + Nutzungsprofil gerätelokal in Settings
`baukastenNutzungsprofil` via `zaehleNutzung`; Drag-and-drop-Positionsliste `verschiebePosition` + Pfeile ↑/↓;
Live-Deckungsbeitrag `interneAuswertung` als „intern — nicht im Angebot"; Status-Workflow + Archiv; neutrales
Angebotsdokument nur über `externesAngebot`-Whitelist; SW `v116`, 1427/1427 grün, **DOM/IndexedDB statisch geprüft**).
Nächste offene Schritte:

1. **NÄCHSTER SCHRITT — Block 2/Schritt 8-UI: „Rechnung aus Angebot"** (`docs/KALKULATION_KATALOG.md` §4/§7a). Die UI
   über der bereits fertigen reinen Logik `domain/angebotUebernahme.js` (`angebotUebernahmeEntwurf`/
   `darfAngebotUebernehmen`/`uebernahmeNummer`/`validateAngebotUebernahme`): In der Angebots-Ansicht (`ui/views/angebote.js`)
   ein Knopf **„Rechnung aus Angebot"** an einem **angenommenen** Angebot → erzeugt einen Buchungs-**Entwurf** über den
   bestehenden Pfad (`crm-store.saveEntwurf`/`naechsteRechnungsnummer` bzw. analog), **Nummernpolitik je `rechnungsstelle`**
   (`blp` → echte §14-Nummer; `extern` → vorläufige Vorlage `ENT-JJJJ-NNNN`, keine §14-Nummer), **referenziert** die
   Angebotsnummer (benutzt sie nie wieder), setzt das Angebot danach auf **archiviert**. Festschreiben bleibt manuell
   (GoBD). Store-Glue ggf. in `domain/angebote-store.js` ergänzen (z. B. `rechnungAusAngebot(id)`), reine Logik bleibt in
   `angebotUebernahme.js`. **DOM/IndexedDB als „statisch geprüft" kennzeichnen.** Prime Directive: nur `externesAngebot`,
   keine interne Kalkulation im Entwurf.
2. **Optional, Folgeschritt zu Schritt 9/10:** **UI „Nachkalkulation/Kostenträger + Kalibrierung"** (Zeiterfassung je
   Auftrag, Beleg-/Buchungs-Zuordnung, Soll/Ist-Anzeige `nachkalkulation`, Korrekturfaktoren-Pflege/Trefferquote
   `kalibrierung`) — die reine Logik (`nachkalkulation.js`/`kalibrierung.js`) steht bereits.
3. **Optional, kleiner Folgeschritt zu Schritt 2c:** **Demo-Vorbefüllung** für neue Tests (`domain/demodaten.js`) — ein
   neuer Test wahlweise leer **oder** mit Demo-Daten starten.
4. **Optional, Schritt 4 der Datensicherung (`docs/DATENSICHERUNG.md` #4):** Server-/Offsite-Ziel (eigener Server) +
   konfigurierbare Erinnerungs-Kadenz — **blockiert/zurückgestellt**, solange kein eigener Server existiert.

RITUAL JE PR (verbindlich, automatisch durchziehen):
1) `git fetch origin main && git reset --hard origin/main`; pro PR einen eigenen
   Branch `claude/<kurzbeschreibung>` von `origin/main` (bzw. den für die Sitzung vorgegebenen Branch).
2) Reine Logik ZUERST node-getestet (`node tests/run.mjs` muss grün bleiben/werden), dann
   UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen — kein Headless-Browser vorhanden).
3) `CACHE_VERSION` in `sw.js` erhöhen + neue Module precachen.
4) Draft-PR -> ready -> CI (smoke-test) abwarten -> **bei grün squash-mergen** (Freibrief)
   -> danach lokal `git reset --hard origin/main`.
5) Git-Identität: `user.email noreply@anthropic.com` / `user.name Claude`.

UNVERRÜCKBARE REGELN: DB-Suffix `bookledgerpro` NIEMALS ändern · build-frei (native
ES-Module, keine Bundler/CDNs/npm-Runtime) · Datendurabilität (Regel #2) · Krypto-/GoBD-/
DSGVO-Disziplin · EU-KI opt-in.

ABSCHLUSSBRIEF AM ENDE (PFLICHT — automatisch, ohne Rückfrage):
- `docs/PULS.md` „START HIER" auf den dann nächsten Schritt zeigen lassen + Kopf-Status
  (SW-Version/Testanzahl/Modulzahl) aktualisieren.
- In `docs/BAUPLAN.md` die erledigte(n) Schritt(e) abhaken (+ ggf. Plan fortschreiben);
  `docs/NACHFOLGE_PLAN.md` bei Bedarf pflegen.
- Obersten `docs/SESSIONS.md`-Eintrag schreiben (Was getan · Stand · Nächstes · offene Grenzen).
- `docs/OFFENE_PUNKTE.md` pflegen.
- **Diese Datei `docs/NAECHSTE_SITZUNG.md` neu schreiben**, sodass der COPY-Block auf den dann
  nächsten Schritt zeigt — und den Auftrag „ABSCHLUSSBRIEF AM ENDE (PFLICHT)" inkl. **dieser
  Selbst-Fortschreibungs-Anweisung beibehält** (die Kette darf nie abreißen).
- Den fertigen COPY-Block am Sitzungsende auch im Chat ausgeben, damit er direkt in die
  nächste Sitzung eingefügt werden kann.

>>> END COPY <<<

---

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 2/Schritt 11b (Adaptiver Baukasten — UI: Angebots-Ansicht
`ui/views/angebote.js` + verschlüsselte Store-Glue `domain/angebote-store.js`)**. Tests **1427/1427** · SW **v116** ·
112 JS-Module. **Block 1 KOMPLETT**; **Block-2-Kernkette (Schritte 4–11) KOMPLETT.**
**Nächster Schritt: Block 2/Schritt 8-UI — „Rechnung aus Angebot"** (UI/Glue über der fertigen reinen Logik
`domain/angebotUebernahme.js`; Knopf am angenommenen Angebot → Buchungs-Entwurf, Nummernpolitik je `rechnungsstelle`,
Angebot→archiviert). Optional: UI „Nachkalkulation/Kostenträger + Kalibrierung"; Demo-Vorbefüllung (`domain/demodaten.js`).
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
