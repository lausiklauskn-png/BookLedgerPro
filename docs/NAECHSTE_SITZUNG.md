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
steht dort. **Block 1 (Vertrauen/Sicherheit) ist KOMPLETT** und die **Block-2-Kernkette (Schritte 4–11) ist KOMPLETT**
(Kalkulations-Kern → Produkt-Schemata → Angebote-Kern → Angebot→Rechnung-Logik → Nachkalkulation → Kalibrierung →
adaptiver Baukasten inkl. UI). **Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1
PR, jeder einzeln grün + gemergt; nie „halb" mergen, im Zweifel feiner schneiden). Stand: **Block 1 KOMPLETT** (Schritt
1 #116 · 2a #118 · 2b #120 · 2c #122 · 3 #124) · **Block 2: Schritt 4 `rechnungsstelle` ✅ #125 · 5 Kalkulations-Kern ✅
#126 · 6 Produkt-Schemata ✅ #127 · 7 Angebote-Kern ✅ #128 · 8 Angebot→Rechnung-Übernahme (rein) ✅ #129 · 9
Nachkalkulation ✅ #130 · 10 Kalibrierung ✅ #131 · 11a Adaptiver Baukasten — reine Logik ✅ #132 · 11b Adaptiver
Baukasten — UI ✅** (`ui/views/angebote.js` + `domain/angebote-store.js`; SW `v116`) · **Schritt 8-UI „Rechnung aus
Angebot" ✅** (Knopf in `ui/views/angebote.js` + Store-Glue `domain/angebote-store.js rechnungAusAngebot(id)` über die
reine Logik `domain/angebotUebernahme.js`; Nummernpolitik je `rechnungsstelle` mit getrennten Zählern
`crm-store.naechsteRechnungSeq` (§14, lückenlos, geteilt mit `rechnungAusAuftrag`) bzw. `naechsteVorlaeufigeSeq`
(`ENT-…`, extern); Angebotsnummer nur referenziert; Angebot→archiviert; Festschreiben manuell; Prime Directive: nur
`externesAngebot`; SW `v117`). **Zuletzt (2026-06-18): UI „Nachkalkulation/Kostenträger + Kalibrierung" ✅** —
neue Ansicht `ui/views/nachkalkulation.js` (NAV „Nachkalkulation", privat/verein ausgeblendet) + I/O-Glue
`domain/nachkalkulation-store.js` über die fertige reine Logik `nachkalkulation.js`/`kalibrierung.js`: Soll/Ist je
Kostenträger + Deckungsbeitrag + Belege, Korrekturfaktoren-Tabelle + Trefferquote je Preisniveau; neuer reiner Helfer
`zeiteintraegeAusZeiten` node-getestet; rein anzeigend (kein Druck/Export/KI); SW `v118`. **Zuletzt (2026-06-18):
Demo-Vorbefüllung ✅ (BAUPLAN Schritt 2d)** — beim „Neuer Test" wahlweise leer oder mit Demo-Daten: reine Logik
`domain/demodaten.js` (`demoEntwuerfe`/`demoBefuellungsplan`, node-getestet), Store-Glue `domain/demodaten-store.js`
`befuelleMitDemodaten` (schreibt in den aktiven Sandbox-Tresor über den echten GoBD-Pfad `saveEntwurf`+`festschreiben`),
UI `ui/lock.js renderNeuerTest` (Radio-Wahl); SW `v119`, +10 → **1444/1444 grün**, Glue/DOM/IndexedDB statisch geprüft.
**Zuletzt (2026-06-18): Standard-konto→Kostenart-Zuordnung ✅** — die in der Nachkalkulation-UI als Grenze genannte
pauschale „alles = Material"-Vorbelegung verfeinert: reine Logik `domain/nachkalkulation.js` `kostenartFuerKonto`/
`standardKontoBlock` (SKR03-Kontenklassen: 3100–3199 Fremdleistungen→Zukauf, 3000–3999 Wareneingang/RHB→Material,
4100–4199 Personalaufwand→Arbeit; sonst Default Material), automatisch in `domain/nachkalkulation-store.js` aus dem
Kontenplan gebaut + in `kostentraegerAnalyse` durchgereicht; `opts.kontoBlock` (manuell) gewinnt; SW `v120`, +22 →
**1466/1466 grün**, Glue/IndexedDB statisch geprüft (Grenze: Heuristik nach Kontenklasse, keine exakte Einzelkosten-
Zuordnung; Class-4-Gemeinkosten bleiben unklassifiziert; MASCHINE nur über Zeiteinträge).
**Zuletzt (2026-06-18): Kalibrierte Vorwärtskalkulation im Angebots-Editor ✅** — die in Schritt 10 fertige reine Logik
(`kalkuliereKalibriert`) ist jetzt im Editor nutzbar: Anwendungs-Primitiven `kalibriereEingabe`/`kalkuliereKalibriert` in
den Kern `domain/kalkulation.js` verschoben (`domain/kalibrierung.js` re-exportiert → API stabil), neuer reiner
`domain/produktschemata.js kalkuliereSchemaKalibriert`, `domain/angebote.js positionAusSchema(opts.faktoren)` rechnet die
interne Kalkulation kalibriert + merkt `kalkulation.kalibriert`/`faktoren` (Außendokument NEUTRAL, Prime Directive), Glue
`domain/nachkalkulation-store.js ladeKalibrierungFaktoren()`, Setting `kalibrierungAnwenden` + UI-Schalter „Erfahrungswerte
anwenden (Kalibrierung aus N Aufträgen)" (nur mit Historie) + „kalibriert"-Badge; SW `v121`, +9 → **1475/1475 grün**,
DOM/IndexedDB statisch geprüft.
**Zuletzt (2026-06-18): Zeit-Zuordnungs-UI je Kostenträger ✅** — die echte **Zeiterfassung-/Beleg-Zuordnung je Auftrag**
umgesetzt, soweit GoBD es zulässt. **GoBD-Befund:** `kostenstelle` ist Teil der festgeschriebenen Buchungs-Hash-Kette
(`audit.hashedFields`) → Buchungen/Belege NICHT nachträglich umhängbar; saubere Zuordnung nur bei **Zeiteinträgen**
(mutable CRM-Records). Reine Logik `domain/nachkalkulation.js` `aufgeloesteKostenstelle(zeit, auftragIndex)` (explizite
`zeit.kostenstelle` vor Auftrags-Ableitung; '' → null), `zeiteintraegeAusZeiten` nutzt ihn (rückwärtskompatibel);
`crm-store.js` `saveZeit` persistiert `kostenstelle` + neue `setZeitKostenstelle`; Glue `domain/nachkalkulation-store.js`
`ladeZeitZuordnung()`/`zuordneZeit()`; UI-Karte „Zeiten zuordnen" in `ui/views/nachkalkulation.js` (Kostenträger-Select
je Zeile, Herkunft direkt/über Auftrag) + ehrlicher GoBD-Hinweis an der Beleg-Liste; SW `v122`, +8 → **1483/1483 grün**,
DOM/IndexedDB statisch geprüft.
**Zuletzt (2026-06-18): Eingangsrechnungs-Verzug (Gegenseite) ✅ — BAUPLAN Block 3 begonnen.** Spiegel zum Mahnwesen
aus **Schuldnersicht**. Reine Logik `domain/eingangsverzug.js` (node-getestet, +33 → **1516/1516**): `verzugsstufe`
(gestaffelte Überfälligkeit 1/14/42 Tage) + `verzugsstufeLabel`, `verzugsLage`, `berechtigteVerzugskosten` (§ 288-Zinsen
+ 40-€-Pauschale, wiederverwendet aus `mahnwesen.js`), **`pruefeErhalteneMahnung`** (geforderte vs. berechtigte
Verzugszinsen/Mahngebühren → `plausibel`/`ueberhoeht`/`kein_verzug`/`ohne_angabe`, Toleranz 5 Cent), `verzugUebersicht`.
UI `ui/views/payables.js`: Verzugsstufen-Badge je überfälligem Posten + Knopf „Mahnung prüfen" → Karte „Erhaltene
Mahnung prüfen (§ 288 BGB)" (Live-Vergleich + Bewertungs-Badge + § 286/§ 247-Disclaimer; **bucht nichts**). i18n de+en,
CSS `.badge-error`, SW `v123`. **Grenze:** Hilfs-Einordnung nach Tagen, keine Rechtsberatung; DOM/IndexedDB statisch geprüft.
**Zuletzt (2026-06-18): Buchung gezahlter Verzugskosten (Zinsaufwand) ✅ — BAUPLAN Block 3, PR #141.** Spiegel zu
`mahnwesen.mahnbuchungEntwurf` (R1) aus **Schuldnersicht**: zahlt man eine berechtigte Lieferanten-Mahnung, entsteht
Zins-/Gebühren-**AUFWAND**. Reine Logik `domain/eingangsverzug.js` (node-getestet, +20 → **1536/1536**):
`VERZUG_AUFWAND_KONTEN` (SKR03: 2100 Zinsaufwand, 4980 sonstiger Aufwand, 1200 Bank, 1600 Verbindlichkeit) +
`VERZUG_GEGENKONTO` (bank|verbindlichkeit); `verzugAufwandZeilen` (Soll 2100/4980 AN Haben Bank/Verbindlichkeit, **ohne
Vorsteuer** — Schadensersatz Abschn. 1.3 UStAE; ausgeglichen; Konto-Override); `verzugAufwandEntwurf` (Buchungs-Entwurf,
null bei 0/0). UI `ui/views/payables.js`: in der „Mahnung prüfen"-Karte neuer Abschnitt „Verzugskosten buchen
(Zinsaufwand)" — Gegenkonto-Wahl + Knopf → Buchungs-ENTWURF (`ensureSeedKonten`+`saveEntwurf`; Festschreiben manuell,
GoBD). i18n de+en, SW `v124`. **Grenze:** bucht die eingegebenen geforderten Beträge (keine Auto-Deckelung); DOM/IndexedDB
statisch geprüft.
**Damit ist Block 1 + Block 2 komplett; Block 3 ausgebaut (Eingangsrechnungs-Verzug inkl. Buchung erledigt).**
Nächste offene Schritte (alle optional):

1. **Browser-Sichttest durch den Nutzer** (kein Headless-Browser hier) — die DOM/IndexedDB-Pfade aller UIs bestätigen
   (zuletzt: „Verzugskosten buchen" in der Verbindlichkeiten-Ansicht).
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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 3 — Buchung gezahlter Verzugskosten (Zinsaufwand)** (PR #141)
(reine Logik `domain/eingangsverzug.js`: `VERZUG_AUFWAND_KONTEN`/`VERZUG_GEGENKONTO`/`verzugAufwandZeilen`/
`verzugAufwandEntwurf` — Spiegel zu `mahnwesen.mahnbuchungEntwurf` aus Schuldnersicht; UI `ui/views/payables.js`:
Abschnitt „Verzugskosten buchen" in der „Mahnung prüfen"-Karte, baut Buchungs-Entwurf). Tests **1536/1536** · SW **v124** ·
116 JS-Module. **Block 1 + Block 2 KOMPLETT; Block 3 ausgebaut (Eingangsrechnungs-Verzug inkl. Buchung erledigt).**
**Nächster Schritt (optional):** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte
oder eine neue, mit dem Nutzer vereinbarte Idee.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
