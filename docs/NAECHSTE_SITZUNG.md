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
Zweifel feiner schneiden). Stand Block 1: **Schritt 1 ✅ (PR #116, Roundtrip-Selbsttest)** · **Schritt 2 Test-Modus
KOMPLETT** — 2a Sandbox-Kern ✅ (PR #118), 2b Store-Glue `core/sandboxStore.js` ✅ (PR #120), 2c UI ✅ (PR #122:
„🧪 Tests"-Bereich am Sperrbildschirm/in den Einstellungen, TEST-MODUS-Banner, behalten/verwerfen-Dialog,
verschlanktes Test-Onboarding; reine Helfer `aktiverSandbox`/`naechsterTestName` node-getestet; Korrektur
`initMandanten`→`aktiveDbName()`). Nächste offene Schritte:
1. **NÄCHSTER SCHRITT — Datensicherungs-UX + `backupStrategie` (Schritt 3)** (`docs/DATENSICHERUNG.md`): prominente
   Backup-/Restore-Knöpfe (nicht nur im Durabilitäts-Banner), **gemerkter Zielordner** (File System Access; auf
   Tablet/ohne API → Download-Fallback), **Drag-and-drop-Restore**; neues Setting **`backupStrategie`** (im
   Onboarding wählbar + in den Einstellungen änderbar). Reine Helfer/Logik ZUERST node-testen; UI/DOM/IndexedDB
   als „statisch geprüft" kennzeichnen. Datendurabilität ist Pflicht-Feature #1 (CLAUDE.md Regel #2).
2. **Optional, kleiner Folgeschritt zu Schritt 2c:** **Demo-Vorbefüllung** für neue Tests (`domain/demodaten.js`) —
   ein neuer Test wahlweise leer **oder** mit Demo-Daten starten. (Die Test-Modus-UI ist ohne sie bereits
   vollständig nutzbar; daher bewusst abgegrenzt.)
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 1/Schritt 2c (Test-Modus UI, PR #122)**.
Tests **1141/1141** · SW **v106** · 99 JS-Module. **Test-Modus (2a–2c) komplett.** **Nächster Schritt:
BAUPLAN Block 1/Schritt 3 — Datensicherungs-UX + `backupStrategie`** (prominente Backup-/Restore-Knöpfe,
gemerkter Zielordner, Drag-and-drop-Restore, Setting `backupStrategie`); optional kleiner 2c-Folgeschritt
Demo-Vorbefüllung (`domain/demodaten.js`); danach Block 2 (Kalkulation/Angebote). Mehrere PRs pro Sitzung erlaubt.
(Diese Zeile bei jeder Sitzung aktualisieren.)
