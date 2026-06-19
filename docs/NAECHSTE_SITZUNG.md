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

AUFGABE DIESER SITZUNG: **Eine mit dem Nutzer abgestimmte, in sich abgeschlossene Verbesserung bauen.** Block 1 + 2
KOMPLETT; Block 3 (Liquidität) ausgebaut; **Block 4 (V-Lohn — Lohn-Buchungskern) KOMPLETT (L1–L6, #158–#163 + Doku
`docs/LOHN.md`).** BLP **bucht** Lohn/Gehalt GoBD-sicher (Brutto-Methode), **berechnet aber KEINE** Lohnsteuer/SV (kein
ELStAM/DEÜV/amtl. Tabellen — die Beträge kommen aus der Entgeltabrechnung). **SW `v140`, Tests `1754/1754` grün, 120
JS-Module.**

**⏭ NÄCHSTE SCHRITTE (Reihenfolge, mit Nutzer abstimmen):**
1. **Mein-WorkFloh — Test-Modus (Sandbox)** nach `docs/TEST_MODUS.md` (⇄-Abschnitt „Übertrag an Mein-WorkFloh"):
   wegwerfbarer Sandbox-Speicher getrennt vom echten Bestand (eigener Schlüssel-Präfix `wf_sandbox_*` ODER separate
   IndexedDB), Behalten/Verwerfen + mehrere Tests + „alle aufräumen", dauerhafter TEST-Banner, optional Demo-Vorbefüllung.
   **Eigenes Repo `lausiklauskn-png/Mein-WorkFloh`** — ggf. via `list_repos`/`add_repo` in die Sitzung holen.
2. **Browser-Sichttest durch den Nutzer** (kein Headless-Browser hier) — u. a. die **Lohn-Ansicht** (Lohnlauf erfassen →
   Live-Vorschau → speichern → „Buchen (Entwurf)" → im Journal festschreiben; Lohnsteuer-Anmeldung-Download; offene
   Lohnabgaben; Lohnkonto).
3. **Sonst:** umgebungs-/menschen-blockierte Punkte (Server-/Offsite-Backup; WorkFloh-Format-Exporter; Sage 5b–d) oder
   eine neue, mit dem Nutzer vereinbarte Idee. Bekannt blockiert: Lighthouse/Perf, lokales OCR, ZUGFeRD-Erzeugen.

**Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1 PR, jeder einzeln grün +
gemergt; reine Logik ZUERST node-getestet, dann UI „statisch geprüft"). **Hinweis:** Ist die Sitzung an genau einen
Branch gebunden, dürfen Feature + Abschlussbrief in einer PR liegen.
2. **Sonst:** umgebungs-/menschen-blockierte Block-3-Punkte (Server-/Offsite-Backup-Ziel — blockiert ohne eigenen Server;
   WorkFloh-Gegenstücke — fremde Repos, über den Nutzer) oder eine neue, mit dem Nutzer vereinbarte Idee. **Bekannt
   blockiert:** Lighthouse/Perf, lokales OCR (nicht build-frei), ZUGFeRD-Erzeugen, Sage 5b–d.

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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 4 — V-Lohn KOMPLETT (L1–L6)**: Lohn-Buchungskern voll
bedienbar (erfassen → Live-Vorschau → buchen → Lohnsteuer-Anmeldung-Datenpaket → offene Lohnabgaben → Lohnkonto), Doku
`docs/LOHN.md`. Tests **1754/1754** · SW **v140** · 120 JS-Module. **⏭ Nächstes (Nutzer-Wunsch):** Mein-WorkFloh
Test-Modus nach `docs/TEST_MODUS.md` (eigenes Repo); sonst Browser-Sichttest der Lohn-Ansicht oder neue abgestimmte Idee.
**Block 1 + Block 2 KOMPLETT; Block 3 (Liquidität) ausgebaut inkl. Treiber #157; Block 4 (V-Lohn) KOMPLETT (#158–#163).**
**Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
oder eine neue, mit dem Nutzer vereinbarte Idee.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
