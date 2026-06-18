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
(Gegenseite) ✅ #140 (Mahnung prüfen § 288 BGB) + Buchung gezahlter Verzugskosten (Zinsaufwand) ✅ #141 +
Verzugsrisiko-Übersicht in der Verbindlichkeiten-Ansicht ✅ #142 + Dashboard-KPI überfällige **Verbindlichkeiten**
(eigene Zahlungsdisziplin) ✅ #143 + Dashboard-KPI überfällige **Forderungen (Mahnwesen)** ✅ #145 (Spiegel zu #143 aus
Gläubigersicht) + zuletzt (2026-06-18) **Dashboard-KPI: Liquiditätsvorschau (bald fällig) ✅ #147** — der vorausschauende
Gegenpol zu den beiden Überfälligkeits-KPIs: was wird in den **nächsten 7 Tagen fällig** (erwartete **Eingänge** = bald
fällige Forderungen gegen **Ausgänge** = bald fällige Verbindlichkeiten + **Netto**). Reine Logik
`domain/liquiditaet.js` **`baldFaellig(angereichertePosten, {heute, horizontTage})`** (Posten im Fenster
`[heute … heute+Horizont]`, **nicht überfällig** → keine Doppelzählung mit den Überfälligkeits-KPIs; liest
`offenCent`/`betragCent`) + **`liquiditaetsVorschau({forderungen, verbindlichkeiten, …})`** (eingehend/ausgehend/netto,
node-getestet); UI `ui/views/dashboard.js`: Karte „Liquiditätsvorschau (bald fällig)" am Kopf — gefüttert aus denselben
angereicherten Posten wie die Überfälligkeits-Karten (`forderungReport`/`verzugReport`), nur im Firmen-/Vereins-Kontext
(`zeigeAnsicht 'orders'`/`'payables'`, Privat ausgeblendet) UND wenn etwas bald fällig ist, Netto nur bei beiden Seiten;
**bucht nichts**. i18n de+en, SW `v128` (neues Modul precached), +14 → **1585/1585** grün, DOM/IndexedDB statisch geprüft.
**Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1 PR, jeder einzeln grün + gemergt;
nie „halb" mergen, im Zweifel feiner schneiden).

Nächste offene Schritte (alle optional):
1. **Browser-Sichttest durch den Nutzer** (kein Headless-Browser hier) — die DOM/IndexedDB-Pfade aller UIs bestätigen
   (zuletzt: Dashboard-Karten „Überfällige Forderungen (Mahnwesen)" + „Überfällige Verbindlichkeiten").
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 3 — Dashboard-KPI: Liquiditätsvorschau (bald fällig)**
(PR #147): reine Logik `domain/liquiditaet.js` `baldFaellig`/`liquiditaetsVorschau`; UI `ui/views/dashboard.js`: Karte
„Liquiditätsvorschau (bald fällig)" am Kopf der Übersicht. Tests **1585/1585** · SW **v128** · 117 JS-Module.
**Block 1 + Block 2 KOMPLETT; Block 3 ausgebaut (Eingangsrechnungs-Verzug inkl. Buchung + Verzugsrisiko-KPI in
Verbindlichkeiten-Ansicht + beidseitige Überfälligkeits-KPI — Verbindlichkeiten #143 + Forderungen #145 — auf dem
Dashboard + Liquiditätsvorschau #147).**
**Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
oder eine neue, mit dem Nutzer vereinbarte Idee.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
