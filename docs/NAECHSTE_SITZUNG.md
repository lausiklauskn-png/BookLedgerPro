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

AUFGABE DIESER SITZUNG: **`docs/BAUPLAN.md` Block 4 — V-Lohn (Lohn-Buchungskern) weiterbauen.** Block 1 + Block 2
KOMPLETT; Block 3 (Liquidität) ausgebaut. **Neuer finiter Track V-Lohn** (Nutzer-Entscheidung 2026-06-18, Scope
„Lohn-Buchungskern"): BLP **bucht** Lohn/Gehalt GoBD-sicher (Brutto-Methode), **berechnet aber KEINE** Lohnsteuer/SV
(kein ELStAM/DEÜV/amtl. Tabellen — die Beträge kommen aus der Entgeltabrechnung des Lohnbüros/Beraters). **Erledigt:**
**L1 ✅ #158** reine Logik `domain/lohnbuchung.js` (`lohnBuchungZeilen`/`lohnBuchungEntwurf`/`validateLohnlauf`: Soll 4120
Brutto + 4130 AG-SV, Haben 1200/1740 Netto + 1741 Steuern + 1742 SV) + Seed-Konten 4110/1740/1741/1742; **L2 ✅ #159**
Store `domain/lohn-store.js` (verschlüsselt; `bucheLohnlauf` → `saveEntwurf`) + reine `normalizeLohnlauf`/
`lohnkontoAggregat`/`lohnlaufBuchungsdatum`; **L3 ✅ #160** UI `ui/views/lohn.js` (NAV „Lohn", privat/verein ausgeblendet)
— end-to-end bedienbar. **SW `v138`, Tests `1735/1735` grün, 120 JS-Module.**

**⏭ NÄCHSTER SCHRITT: V-Lohn L4** — monatliche **Lohnsteuer-Anmeldung als Kennzahlen-Datenpaket** (LSt+SolZ+KiSt je
Monat aus den Lohnläufen aggregiert → strukturiertes Übergabe-Datenpaket, analog USt-VA `export.buildElsterVaPaket`;
**kein** ERiC-Direktversand). Reine Logik zuerst node-getestet, dann UI/Karte. Danach **L5** SV-/LSt-Zahlungsübersicht
(offene Verbindlichkeiten 1741/1742) und **L6** Doku `docs/LOHN.md` + Abschluss. Plan: `docs/BAUPLAN.md` Block 4 (L1–L6).

**Danach (ausdrücklicher Nutzer-Wunsch, eigene Sitzung/fremdes Repo):** Befehl an **Mein-WorkFloh** —
**Test-Modus (Sandbox) nach `docs/TEST_MODUS.md`** (⇄-Abschnitt „Übertrag an Mein-WorkFloh").

**Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1 PR, jeder einzeln grün +
gemergt; reine Logik ZUERST node-getestet, dann UI „statisch geprüft"). **Hinweis:** Ist die Sitzung an genau einen
Branch gebunden, dürfen Feature + Abschlussbrief in einer PR liegen.

Nächste offene Schritte (Reihenfolge):
1. **V-Lohn L4–L6** (siehe oben) — der finite Lohn-Track zu Ende bauen.
2. **Mein-WorkFloh Test-Modus** (über den Nutzer, fremdes Repo).
3. **Browser-Sichttest durch den Nutzer** (kein Headless-Browser hier) — u. a. die neue **Lohn-Ansicht** (Lohnlauf
   erfassen → Live-Vorschau → speichern → „Buchen (Entwurf)" → im Journal festschreiben; Lohnkonto je Mitarbeiter).
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 4 — V-Lohn L1–L3 (Lohn-Buchungskern)**: reine Logik
`domain/lohnbuchung.js` (Brutto-Methode, +Store/Aggregat) + UI `ui/views/lohn.js` — Lohnbuchhaltung end-to-end
bedienbar (erfassen → Live-Vorschau → speichern → „Buchen (Entwurf)" → Lohnkonto). Tests **1735/1735** · SW **v138** ·
120 JS-Module. **⏭ Nächster Schritt: V-Lohn L4** (monatliche Lohnsteuer-Anmeldung als Kennzahlen-Datenpaket), dann L5
(SV-/LSt-Zahlungsübersicht), L6 (Doku `docs/LOHN.md`). **Danach (Nutzer-Wunsch):** Mein-WorkFloh Test-Modus
(`docs/TEST_MODUS.md`).
**Block 1 + Block 2 KOMPLETT; Block 3 (Liquidität) ausgebaut inkl. Treiber #157; Block 4 (V-Lohn) L1 #158 + L2 #159 +
L3 #160 erledigt, L4–L6 offen.**
**Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
oder eine neue, mit dem Nutzer vereinbarte Idee.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
