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

STAND: Block 1 + 2 KOMPLETT · Block 3 (Liquidität) ausgebaut · Block 4 (V-Lohn) KOMPLETT (L1–L6,
`docs/LOHN.md`) · P6 (#167) · **5-Sitzungs-Sprint (Block 5) ABGESCHLOSSEN:** S1·P9 ✅ (#169) · S2·P10 ✅ (#170) ·
S3·P3+P4 ✅ (#171) · S4·P2 ✅ (#172) · **S5·P8 ✅ — QR-Einzelteilen (vendored reiner JS-QR-Encoder
`src/core/qr.js`, build-frei, lokal/kein Netz; UI „Als QR anzeigen (lokal)" in der Schlüssel-Abgleich-Karte).**
**SW `v147`, Tests `1926/1926` grün, 127 JS-Module.**

⏭ AUFGABE DIESER SITZUNG — **BESPRECHUNG mit dem Nutzer (KEIN neuer Sprint von selbst!):** Der mit dem Nutzer
vereinbarte 5-Sitzungs-Sprint (P9 → P10 → P3+P4 → P2 → P8) ist **vollständig erledigt**. **NICHT selbstständig den
nächsten Bauschritt starten.** Stattdessen:
1. **Bilanz im Chat** ziehen: was in den fünf Sitzungen entstanden ist (P9/P10/P3+P4/P2/P8), aktueller Stand
   (Tests/SW/Module), und welche **ehrlichen Grenzen** offen bleiben (v. a.: **physischer QR-Scan-Test braucht ein
   echtes Gerät**; diverse Browser-Sichttests; umgebungs-/menschen-blockierte [KANN]-Punkte in `docs/OFFENE_PUNKTE.md`).
2. **Neue Richtung mit dem Nutzer abstimmen** (über `AskUserQuestion`, wenn mehrere sinnvolle Optionen bestehen):
   z. B. Browser-Sichttests abarbeiten, einen offenen Punkt aus `docs/OFFENE_PUNKTE.md` / `docs/BAUPLAN.md` aufgreifen,
   oder ein neues Thema. **Erst nach Abstimmung** einen neuen, fein geschnittenen Arbeitsplan beginnen.

**🤝 ARBEITSAUFTRAG (weiterhin gültig):** selbstständig nach Logik + Nutzen handeln, Kleines selbst entscheiden;
**bei GRÖSSEREN Konflikten/Unklarheiten INNEHALTEN und über `AskUserQuestion` rückfragen** (Datenmodell/GoBD/Krypto,
Mehrdeutigkeit, nicht build-frei/blockiert, echter Merge-Konflikt). Merge-Konflikte zuerst selbst lösen
(`git fetch origin main && git reset --hard origin/main`, neu aufsetzen); nur den *inhaltlichen* Konflikt eskalieren.
**Solange noch kein neues Thema abgestimmt ist, ist die einzige Aufgabe die Besprechung — nicht bauen.**

RITUAL JE PR (sobald wieder gebaut wird, verbindlich):
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
  nächsten Schritt zeigt. **Solange der Sprint abgeschlossen und noch kein neues Thema abgestimmt ist, bleibt der
  COPY-Block auf „BESPRECHUNG mit dem Nutzer".** Sobald mit dem Nutzer ein neues Thema/ein neuer Sprint vereinbart
  ist, den COPY-Block auf den ersten Schritt davon setzen. Den Auftrag „ABSCHLUSSBRIEF AM ENDE (PFLICHT)" inkl.
  **dieser Selbst-Fortschreibungs-Anweisung beibehalten** (die Kette darf nie abreißen).
- Den fertigen COPY-Block am Sitzungsende auch im Chat ausgeben, damit er direkt in die
  nächste Sitzung eingefügt werden kann.

>>> END COPY <<<

---

**Stand dieses Briefes:** 2026-06-19 nach **Sprint S5: P8 — QR-Einzelteilen** (vendored reiner JS-QR-Encoder
`src/core/qr.js`, build-frei/lokal; UI „Als QR anzeigen (lokal)" für das pseudonyme Dokument in der
Schlüssel-Abgleich-Karte). **Der 5-Sitzungs-Sprint P9 → P10 → P3+P4 → P2 → P8 ist vollständig abgeschlossen.**
**Nächste Sitzung = BESPRECHUNG mit dem Nutzer** (Bilanz + neue Richtung abstimmen) — **NICHT selbstständig den
nächsten Sprint starten.** Tests **1926/1926** · SW **v147** · 127 JS-Module. **Block 1 + 2 KOMPLETT; Block 3
(Liquidität) ausgebaut; Block 4 (V-Lohn) KOMPLETT (#158–#164); P6 ✓ (#167); P9 ✓ (#169); P10 ✓ (#170); P3+P4 ✓
(#171); P2 ✓ (#172); P8 ✓.** (Diese Zeile + den COPY-Block bei jeder Sitzung aktualisieren.)
