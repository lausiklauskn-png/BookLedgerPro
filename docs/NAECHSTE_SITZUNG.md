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
`domain/produktschemata.js`) · **Schritt 7 Angebote-Kern ✅ (PR #128:** `domain/angebote.js` — zwei Schichten extern/intern,
Prime Directive via `externesAngebot`-Whitelist, Status-Lebenslauf, freier Nummernkreis `AN-JJJJ-NNNN`, `positionAusSchema`,
`interneAuswertung`) · **Schritt 8 Angebot → Rechnung-Übernahme ✅ (PR #129:** `domain/angebotUebernahme.js` — angenommenes
Angebot → bestehender Rechnungs-/Buchungspfad; Nummern-Politik je `rechnungsstelle`; referenziert die Angebotsnummer, benutzt
sie NIE wieder; baut nur auf `externesAngebot`) · **Schritt 9 Auftrags-Kostenträger + Nachkalkulation ✅ (PR #130:**
`domain/nachkalkulation.js` — Kostenträger = Auftrag über `kostenstelle`; **IST** `istkostenAusBuchungen` (Aufwand
festgeschriebener Buchungen je `kostenstelle`, Aggregationsweg wie `costcenters.js`, `belegRef`/`buchungId` mitgeführt,
konto→Kostenart über `kontoBlock`) + `istZeitkosten` (`employees.js`-`{dauerMin}` × interner Stundenkostensatz) +
`istkosten`; **SOLL** `sollkostenAusAngebot` (interne `kalkulation` je Position × Menge nach Kostenart); **Vergleich**
`nachkalkulation` (Abweichung IST−SOLL je Kostenart + Prozent + Deckungsbeitrag Soll/Ist) + `kostentraegerAnalyse`; rein
node-getestet, **kein UI**)**.** Nächste offene Schritte:
1. **NÄCHSTER SCHRITT — Block 2/Schritt 10: Kalibrierung + Statistik/Vergleich** — `docs/KALKULATION_KATALOG.md` §5.1.
   Korrekturfaktoren aus der eigenen Historie (Vor→Nachkalkulation, nutzt `domain/nachkalkulation.js`): wo lag der IST
   real über/unter dem SOLL (z. B. Demontage real 1,4×, Verschnitt +12 %) → kalibrierbare Faktoren, die in den
   Kalkulations-Kern/die Produkt-Schemata zurückfließen (`kalibrierteDefaults`); Angebots-Trefferquote/Vergleich je
   Preisniveau. **Optional KI-Analyse** (Mistral EU, opt-in, pseudonym) — strikt EU/BYOK, nur nach Bestätigung. ZUERST
   reine Logik node-getestet, UI ggf. eigener Folgeschritt. Danach Schritt 11 (adaptiver Baukasten-UX,
   Nutzungssortierung, Drag-and-drop). **Prime Directive bleibt:** Kalkulation rein intern, Rechnung neutral nach außen.
2. **Optional, offener Folgeschritt zu Schritt 8/9:** **UI „Rechnung aus Angebot"** (Knopf + Store-Glue, Zähler je Kreis,
   `saveEntwurf`, Angebot→archiviert) **und/oder** **UI „Nachkalkulation/Kostenträger"** (Zeiterfassung je Auftrag,
   Beleg-/Buchungs-Zuordnung, Soll/Ist-Anzeige) — die reine Logik (`angebotUebernahme.js`/`nachkalkulation.js`) steht bereits.
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 2/Schritt 9 (Auftrags-Kostenträger + Nachkalkulation, PR #130)**.
Tests **1355/1355** · SW **v113** · 108 JS-Module. **Block 1 KOMPLETT** (Schritt 1 + 2a–2c + 3); **Block 2/Schritt 4 + 5 + 6 + 7 + 8 + 9 ✅**.
**Nächster Schritt: BAUPLAN Block 2/Schritt 10 — Kalibrierung + Statistik/Vergleich** (`docs/KALKULATION_KATALOG.md` §5.1;
Korrekturfaktoren aus der Historie Vor→Nachkalkulation über `domain/nachkalkulation.js`, Trefferquote; optional KI Mistral
EU opt-in/pseudonym); danach Block-2-Schritt 11 (Baukasten-UX).
Optional: Schritt-8/9-Folgeschritt **UI „Rechnung aus Angebot"** / **UI „Nachkalkulation/Kostenträger"** + Store-Glue;
2c-Folgeschritt Demo-Vorbefüllung (`domain/demodaten.js`). Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
