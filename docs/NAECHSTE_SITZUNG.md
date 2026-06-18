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
(eigene Zahlungsdisziplin) ✅ #143 + zuletzt (2026-06-18) **Dashboard-KPI: überfällige Forderungen (Mahnwesen) ✅ #145** —
der Spiegel zu #143, aber aus **Gläubigersicht** (die in `docs/OFFENE_PUNKTE.md` A1 dokumentierte Dashboard-Intention
„Kennzahl überfällige Forderungen, Summe + Anzahl"). Damit sind beide Seiten (Forderungen ⇄ Verbindlichkeiten)
symmetrisch auf der Übersicht. Reine Logik `domain/mahnwesen.js` **`forderungUebersicht`** (Spiegel zu
`verzugUebersicht`: überfällige Anzahl/Summe + Σ §-288-Zins-Potenzial + kritisch ab 1. Mahnung/≥14 Tage),
**`FORDERUNG_AMPEL`/`forderungAmpel`** (Spiegel zu `verzugAmpel`) und **`forderungReport(auftraege, opts)`**
(Ein-Aufruf-Einstieg `offenePosten` → `anreicherePosten` → `forderungUebersicht`; Import zyklenfrei, node-getestet);
UI `ui/views/dashboard.js`: Karte „Überfällige Forderungen (Mahnwesen)" am Kopf — nur bei aktivem Mahnwesen
(`zeigeFeature MAHNWESEN`, in Privat ausgeblendet) UND wenn etwas überfällig ist; Klick → Berichte; **bucht nichts**.
i18n de+en, SW `v127` (keine neuen Module), +20 → **1571/1571** grün, DOM/IndexedDB statisch geprüft. **Mehrere saubere,
in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1 PR, jeder einzeln grün + gemergt; nie „halb"
mergen, im Zweifel feiner schneiden).

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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 3 — Dashboard-KPI: überfällige Forderungen (Mahnwesen)**
(PR #145): reine Logik `domain/mahnwesen.js` `forderungUebersicht`/`FORDERUNG_AMPEL`+`forderungAmpel`/`forderungReport`
(Spiegel zu `eingangsverzug.verzugUebersicht`/`verzugAmpel`/`verzugReport`); UI `ui/views/dashboard.js`: Karte
„Überfällige Forderungen (Mahnwesen)" am Kopf der Übersicht. Tests **1571/1571** · SW **v127** · 116 JS-Module.
**Block 1 + Block 2 KOMPLETT; Block 3 ausgebaut (Eingangsrechnungs-Verzug inkl. Buchung + Verzugsrisiko-KPI in
Verbindlichkeiten-Ansicht UND beidseitige Verzugs-KPI — Verbindlichkeiten #143 + Forderungen #145 — auf dem Dashboard erledigt).**
**Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
oder eine neue, mit dem Nutzer vereinbarte Idee.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
