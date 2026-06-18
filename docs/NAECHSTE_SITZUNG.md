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
steht dort. **Block 1 (Vertrauen/Sicherheit) ist KOMPLETT** — wir sind mitten in **Block 2 (Kalkulation/Angebote)**.
**Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (nicht zwingend 1/Sitzung; pro Schritt 1 PR,
jeder einzeln grün + gemergt; nie „halb" mergen, im Zweifel feiner schneiden). Stand: **Block 1 KOMPLETT** (Schritt 1 #116 ·
2a #118 · 2b #120 · 2c #122 · 3 #124) · **Block 2/Schritt 4 Setting `rechnungsstelle` ✅ (PR #125)** · **Schritt 5
Kalkulations-Kern ✅ (PR #126:** `domain/kalkulation.js`) · **Schritt 6 Produkt-Schemata ✅ (PR #127:**
`domain/produktschemata.js`) · **Schritt 7 Angebote-Kern ✅ (PR #128:** `domain/angebote.js`) · **Schritt 8 Angebot →
Rechnung-Übernahme ✅ (PR #129:** `domain/angebotUebernahme.js`) · **Schritt 9 Auftrags-Kostenträger + Nachkalkulation ✅
(PR #130:** `domain/nachkalkulation.js`) · **Schritt 10 Kalibrierung + Statistik/Vergleich ✅ (PR #131:**
`domain/kalibrierung.js`) · **Schritt 11a Adaptiver Baukasten — reine Sortier-/Zähl-Logik ✅ (PR #132:**
`domain/baukasten.js` — **(1) Nutzungszähler je Leistungsart** `leeresNutzungsprofil`/`normalizeNutzung`/`nutzungVon`/
`anzahlVon`/`istGenutzt`/`zaehleNutzung` (immutabel, Zeitstempel injizierbar, `um:` für Mehrfach); **(2) adaptive Palette**
`baukastenPalette`/`sortiereSchemata`/`haeufigsteSchemata` (Sortierung **häufig → zuletzt → Katalog-Reihenfolge**, stabil;
ungenutzte behalten ihre Reihenfolge); **(3) Umsortieren (Drag-and-drop)** `verschiebePosition`/`verschiebeNachOben`/
`verschiebeNachUnten` (immutabel, klemmt das Ziel, behält Element-Referenz → interne `kalkulation` unberührt); rein
node-getestet, **kein UI**)**.** Nächste offene Schritte:
1. **NÄCHSTER SCHRITT — Block 2/Schritt 11b: Adaptiver Baukasten-UI** — `docs/KALKULATION_KATALOG.md` §3. Die **UI** über
   der bereits fertigen reinen Logik `domain/baukasten.js` (PR #132) + dem Angebote-Kern (`domain/angebote.js`) + den
   Produkt-Schemata (`domain/produktschemata.js`): Angebots-Ansicht mit **Karten je Leistungsart** (häufig genutzte oben
   via `baukastenPalette`/`haeufigsteSchemata` + lokal persistiertes Nutzungsprofil, beim Hinzufügen `zaehleNutzung`),
   wachsende **Positionsliste mit Drag-and-drop**-Umsortierung (`verschiebePosition`/`verschiebeNachOben`/`-Unten`),
   **Live-Deckungsbeitrag** (`interneAuswertung`). **Braucht zuvor** eine Angebots-Ansicht + **verschlüsselte Store-Glue**
   (crm-store) — ggf. **feiner schneiden** (erst Angebots-Ansicht/Store-Glue als eigener PR, dann der Baukasten darüber).
   DOM/IndexedDB als „statisch geprüft" kennzeichnen (kein Headless-Browser). **Prime Directive bleibt:** Kalkulation rein
   intern, Angebot/Rechnung neutral nach außen (über `externesAngebot`-Whitelist).
2. **Optional, offener Folgeschritt zu Schritt 8/9/10:** **UI „Rechnung aus Angebot"** (Knopf + Store-Glue, Zähler je
   Kreis, `saveEntwurf`, Angebot→archiviert) **und/oder** **UI „Nachkalkulation/Kostenträger + Kalibrierung"**
   (Zeiterfassung je Auftrag, Beleg-/Buchungs-Zuordnung, Soll/Ist-Anzeige, Korrekturfaktoren-Pflege, Trefferquote-Statistik)
   — die reine Logik (`angebotUebernahme.js`/`nachkalkulation.js`/`kalibrierung.js`) steht bereits.
3. **Optional, kleiner Folgeschritt zu Schritt 2c:** **Demo-Vorbefüllung** für neue Tests (`domain/demodaten.js`) —
   ein neuer Test wahlweise leer **oder** mit Demo-Daten starten. (Die Test-Modus-UI ist ohne sie bereits
   vollständig nutzbar; daher bewusst abgegrenzt.)
4. **Optional, Schritt 4 der Datensicherung (`docs/DATENSICHERUNG.md` #4):** Server-/Offsite-Ziel (eigener Server)
   + konfigurierbare Erinnerungs-Kadenz — **blockiert/zurückgestellt**, solange kein eigener Server existiert.

RITUAL JE PR (verbindlich, automatisch durchziehen):
1) `git fetch origin main && git reset --hard origin/main`; pro PR einen eigenen
   Branch `claude/<kurzbeschreibung>` von `origin/main`.
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 2/Schritt 11a (Adaptiver Baukasten — reine Sortier-/Zähl-Logik, PR #132)**.
Tests **1427/1427** · SW **v115** · 110 JS-Module. **Block 1 KOMPLETT** (Schritt 1 + 2a–2c + 3); **Block 2/Schritt 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11a ✅**.
**Nächster Schritt: BAUPLAN Block 2/Schritt 11b — Adaptiver Baukasten-UI** (`docs/KALKULATION_KATALOG.md` §3; UI über der
fertigen reinen Logik `domain/baukasten.js` + `angebote.js` + `produktschemata.js` — Karten je Leistungsart „häufig oben",
Drag-and-drop-Positionsliste, Live-Deckungsbeitrag; braucht zuvor Angebots-Ansicht + verschlüsselte Store-Glue, ggf. feiner schneiden).
Optional: Schritt-8/9/10-Folgeschritt **UI „Rechnung aus Angebot"** / **UI „Nachkalkulation/Kostenträger + Kalibrierung"** + Store-Glue;
2c-Folgeschritt Demo-Vorbefüllung (`domain/demodaten.js`). Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
