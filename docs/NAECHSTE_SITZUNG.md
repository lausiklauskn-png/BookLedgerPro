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
(Gegenseite) ✅ #140 + Buchung gezahlter Verzugskosten (Zinsaufwand) ✅ #141 + Verzugsrisiko-Übersicht in der
Verbindlichkeiten-Ansicht ✅ #142 + Dashboard-KPI überfällige **Verbindlichkeiten** ✅ #143 + Dashboard-KPI überfällige
**Forderungen (Mahnwesen)** ✅ #145 + **Dashboard-KPI: Liquiditätsvorschau (bald fällig) ✅ #147** + **Liquiditätsvorschau
um Geldbestand + projizierten Saldo ✅ #149** + **Liquiditätsvorschau: wählbares Zeitfenster ✅** + **Liquiditäts-Tiefpunkt
(laufender Saldo im Fenster) ✅ #152** + **Liquiditäts-Deckungslücke (Unterdeckung im Fenster) ✅ #153** + **Liquiditäts-
Mindestreserve (Puffer) ✅ #154** + zuletzt (2026-06-18) **Liquiditäts-Reichweite („Runway" — bis wann reicht das Geld?) ✅**
— die Liquiditäts-Karte zeigte Tiefpunkt (tiefster Stand) und Deckungslücke (fehlender Betrag), aber nicht die intuitivste
Antwort auf die im Karten-Code selbst gestellte Frage „reicht das Geld?": **bis wann**. Der Tiefpunkt nennt den *tiefsten*
Tag, die Reichweite den *frühesten* Engpass (kann VOR dem Tiefpunkt liegen: Saldo rutscht früh unter die Schwelle, erholt
sich kurz, fällt später noch tiefer). Reine Logik `domain/liquiditaet.js` (node-getestet): **`liquiditaetsReichweite(verlauf,
{reserveCent, heute})`** — erster Tag, an dem der laufende Saldo (`liquiditaetsVerlauf.punkte[].saldoCent`) unter die
Schwelle (Mindestreserve, Default 0 → echtes Minus; konsistent via `normalizeReserveCent`) fällt → `{bekannt, reicht,
sofort, datum, tageBis, reserveCent, negativ}` (ohne Bestand `bekannt:false` abwärtskompatibel; `sofort` = schon heute unter
Schwelle; `negativ` = echtes Minus vs. nur Reserve-Unterschreitung). UI `ui/views/dashboard.js`: Klartext-Bilanz „reicht
über N Tage" bzw. „reicht bis {datum}" (rot bei echtem Minus), nur wenn es Ausgänge gibt und der Bestand bekannt ist; der
`sofort`-Fall bleibt Ampel/Deckungslücke. **bucht nichts**. i18n de+en, SW `v134` (kein neues Modul), +12 → **1675/1675**
grün, DOM/IndexedDB statisch geprüft. **Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt
1 PR, jeder einzeln grün + gemergt; nie „halb" mergen, im Zweifel feiner schneiden).

Nächste offene Schritte (alle optional):
1. **Browser-Sichttest durch den Nutzer** (kein Headless-Browser hier) — die DOM/IndexedDB-Pfade aller UIs bestätigen
   (zuletzt: Dashboard-Karte „Liquiditätsvorschau" mit Reichweite-Bilanz + Tiefpunkt-Hinweis + Deckungslücken-Warnung + Mindestreserve-Eingabe + umschaltbarem Zeitfenster 7/14/30/90 Tage).
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 3 — Liquiditäts-Reichweite („Runway")** (Folgeschritt zu #154):
reine Logik `domain/liquiditaet.js` **`liquiditaetsReichweite(verlauf, {reserveCent, heute})`** — erster Tag, an dem der
laufende Saldo unter die Schwelle (Mindestreserve, Default 0) fällt → `{bekannt, reicht, sofort, datum, tageBis,
reserveCent, negativ}`; UI `ui/views/dashboard.js`: Klartext-Bilanz „reicht über N Tage" / „reicht bis {datum}" (rot bei
echtem Minus), gated auf Ausgänge + bekannten Bestand. Tests **1675/1675** · SW **v134** · 117 JS-Module.
**Block 1 + Block 2 KOMPLETT; Block 3 ausgebaut (Eingangsrechnungs-Verzug inkl. Buchung + Verzugsrisiko-KPI in
Verbindlichkeiten-Ansicht + beidseitige Überfälligkeits-KPI #143/#145 + Liquiditätsvorschau #147 + Geldbestand/
Projektion #149 + wählbares Zeitfenster + Tiefpunkt #152 + Deckungslücke #153 + Mindestreserve #154 + Reichweite).**
**Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
oder eine neue, mit dem Nutzer vereinbarte Idee.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
