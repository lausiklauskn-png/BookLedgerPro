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
steht dort; **Block 1 zuerst (Vertrauen/Sicherheit)**. **Mehrere saubere, in sich abgeschlossene PRs pro Sitzung,
wo sinnvoll** (nicht zwingend 1/Sitzung; pro Schritt 1 PR, jeder einzeln grün + gemergt; nie „halb" mergen, im
Zweifel feiner schneiden). Stand Block 1: **Schritt 1 ✅ (PR #116, Roundtrip-Selbsttest)** · **Schritt 2a ✅
(PR #118, Test-Modus Sandbox-Kern, reine Schicht in `domain/mandanten.js`)** · **Schritt 2b ✅ (PR #120, Test-Modus
Store-Glue `core/sandboxStore.js`: anlegen/wechseln/leeren/löschen + Boot-Aufräumen, in `main.js` verdrahtet)**.
Nächste offene Schritte:
1. **NÄCHSTER SCHRITT — Test-Modus UI (Schritt 2c)** (`docs/TEST_MODUS.md`) — baut auf der Store-Glue
   (`core/sandboxStore.js`: `erstelleSandboxTresor`/`wechsleZuSandbox`/`leereSandboxTresor`/`loescheSandboxTresor`/
   `loescheAlleSandboxes`) + dem Kern (`domain/mandanten.js`: `sandboxAuswahlListe`/`istSandbox`): **„🧪 Tests"-Bereich**
   am Sperrbildschirm/in den Einstellungen (Neuer Test / wechseln / behalten / leeren / löschen / „Alle Tests löschen"),
   dauerhafter **TEST-MODUS-Banner** solange ein Sandbox-Tresor aktiv ist, **behalten/verwerfen-Dialog** beim Verlassen,
   optional **Demo-Vorbefüllung** (`domain/demodaten.js`). UI/DOM/IndexedDB → „statisch geprüft"; reine Helfer node-testen.
2. **Datensicherungs-UX + `backupStrategie`** (`docs/DATENSICHERUNG.md`) — prominente Backup-/Restore-Knöpfe,
   gemerkter Zielordner, Drag-and-drop-Restore; Setting `backupStrategie` (Onboarding + Einstellungen).
Danach **Block 2 (Kalkulation/Angebote)** fein geschnitten: `rechnungsstelle`-Setting → Kalkulations-Kern →
Produkt-Schemata → Angebote-Kern → Angebot→Rechnung → Auftrags-Kostenträger/Nachkalkulation → Kalibrierung/
Statistik → Baukasten-UX (Details + Abhängigkeiten in `docs/BAUPLAN.md`; Design in `docs/KALKULATION_KATALOG.md`).
**Prime Directive Angebote:** Kalkulation rein intern, Angebot/Rechnung neutral nach außen.
**Vermerk:** Auch **Mein-WorkFloh** soll einen **Test-Modus** nach `docs/TEST_MODUS.md` (⇄-Abschnitt) bekommen
(fremdes Repo, über den Nutzer).

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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 1/Schritt 2b (Test-Modus Store-Glue, PR #120)**.
Tests **1132/1132** · SW **v105** · 99 JS-Module. **Nächster Schritt: BAUPLAN Block 1/Schritt 2c — Test-Modus
UI** („🧪 Tests"-Bereich + TEST-MODUS-Banner + behalten/verwerfen-Dialog + optional Demo-Vorbefüllung), dann
Schritt 3 Backup-UX/`backupStrategie`, dann Block 2 (Kalkulation/Angebote). Mehrere PRs pro Sitzung erlaubt.
(Diese Zeile bei jeder Sitzung aktualisieren.)
