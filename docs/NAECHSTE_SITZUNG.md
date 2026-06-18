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

AUFGABE DIESER SITZUNG: **Den `docs/BAUPLAN.md` abarbeiten** (mit dem Nutzer 2026-06-17 vereinbart). **Block 1
(Vertrauen/Sicherheit) und Block 2 (Kalkulation/Angebote) sind KOMPLETT.** Block 3 ist ausgebaut: Eingangsrechnungs-Verzug
(Gegenseite) ✅ #140 … + Dashboard-KPI überfällige **Verbindlichkeiten** ✅ #143 + **Forderungen (Mahnwesen)** ✅ #145 +
**Liquiditätsvorschau (bald fällig) ✅ #147** + **Geldbestand + projizierter Saldo ✅ #149** + **wählbares Zeitfenster ✅** +
**Liquiditäts-Tiefpunkt ✅ #152** + **Deckungslücke ✅ #153** + **Mindestreserve (Puffer) ✅ #154** + **Reichweite („Runway"
— bis wann reicht das Geld?) ✅ #156** + zuletzt (2026-06-18) **Liquiditäts-Treiber (größte anstehende Bewegungen) ✅** — die
Liquiditäts-Karte beantwortete *wie viel* bald fällig ist, *wie tief* der Saldo sinkt, *wie viel fehlt* und *bis wann* das
Geld reicht (alles über Summen/Salden), aber nicht die naheliegende Anschlussfrage „**woran** liegt das?": welche einzelne
Forderung sich einzutreiben lohnt, welche Verbindlichkeit groß ansteht. Reine Logik `domain/liquiditaet.js` (node-getestet):
**`groessteFaellige({forderungen, verbindlichkeiten, heute, horizontTage, limit})`** + `LIQUIDITAET_TREIBER_DEFAULT` (3) —
die nach offenem Betrag absteigend sortierten bald fälligen Posten aus DEMSELBEN Fenster wie `baldFaellig` (nicht
überfällig), je Eintrag `{richtung:'ein'|'aus', betragCent, faelligAm, name, referenz}`, auf `limit` gekürzt, ≤0-Beträge
raus, deterministische Sortierung (Betrag → früheste Fälligkeit → Name). UI `ui/views/dashboard.js`: Liste „Größte
anstehende Bewegungen" in der Liquiditäts-Karte (Wer/Referenz/Datum links, vorzeichenbehafteter Betrag rechts — Eingang
+/grün, Ausgang −/rot) über das bestehende `report-line`-Layout. **bucht nichts**. i18n de+en
(`dashboard.liquidityDriversLabel`/`…DriverIn`/`…DriverOut`), SW `v135` (kein neues Modul), +14 → **1689/1689** grün,
DOM/IndexedDB statisch geprüft. **Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1 PR,
jeder einzeln grün + gemergt; nie „halb" mergen, im Zweifel feiner schneiden). **Hinweis:** Ist die Sitzung an genau einen
Branch gebunden, dürfen Feature + Abschlussbrief in einer PR liegen.

Nächste offene Schritte (alle optional):
1. **Browser-Sichttest durch den Nutzer** (kein Headless-Browser hier) — die DOM/IndexedDB-Pfade aller UIs bestätigen
   (zuletzt: Dashboard-Karte „Liquiditätsvorschau" mit Reichweite-Bilanz + Tiefpunkt-Hinweis + Deckungslücken-Warnung + Mindestreserve-Eingabe + umschaltbarem Zeitfenster 7/14/30/90 Tage + Treiber-Liste „Größte anstehende Bewegungen").
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 3 — Liquiditäts-Treiber (größte anstehende Bewegungen)**
(Folgeschritt zur Reichweite): reine Logik `domain/liquiditaet.js` **`groessteFaellige({forderungen, verbindlichkeiten,
heute, horizontTage, limit})`** + `LIQUIDITAET_TREIBER_DEFAULT` (3) — die nach offenem Betrag absteigend sortierten bald
fälligen Posten je Eintrag `{richtung, betragCent, faelligAm, name, referenz}`, auf `limit` gekürzt; UI
`ui/views/dashboard.js`: Liste „Größte anstehende Bewegungen" in der Liquiditäts-Karte. Tests **1689/1689** · SW **v135** ·
117 JS-Module.
**Block 1 + Block 2 KOMPLETT; Block 3 ausgebaut (Eingangsrechnungs-Verzug inkl. Buchung + Verzugsrisiko-KPI in
Verbindlichkeiten-Ansicht + beidseitige Überfälligkeits-KPI #143/#145 + Liquiditätsvorschau #147 + Geldbestand/
Projektion #149 + wählbares Zeitfenster + Tiefpunkt #152 + Deckungslücke #153 + Mindestreserve #154 + Reichweite #156 +
Treiber).**
**Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
oder eine neue, mit dem Nutzer vereinbarte Idee.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
