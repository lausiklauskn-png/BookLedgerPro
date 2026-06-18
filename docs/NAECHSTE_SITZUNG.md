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
**Damit ist die Block-2-Kernkette (4–11) inkl. aller UIs + Test-Modus inkl. Demo-Vorbefüllung komplett.**
Nächste offene Schritte (alle optional):

1. **NÄCHSTER SCHRITT (optional), Folgeschritt zur Nachkalkulation:** echte **Zeiterfassung-/Beleg-Zuordnungs-UI je
   Auftrag** (heute werden vorhandene Zeiten/Buchungen nur angezeigt) + **kalibrierte Vorwärtskalkulation**
   (`kalkuliereKalibriert`, reine Logik steht) im Angebots-Editor anbieten. (Die feinere konto→Kostenart-Zuordnung ist
   inzwischen erledigt — `domain/nachkalkulation.js` `standardKontoBlock`.)
2. **Optional, Schritt 4 der Datensicherung (`docs/DATENSICHERUNG.md` #4):** Server-/Offsite-Ziel (eigener Server) +
   konfigurierbare Erinnerungs-Kadenz — **blockiert/zurückgestellt**, solange kein eigener Server existiert.

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

**Stand dieses Briefes:** 2026-06-18 nach **BAUPLAN Block 2 Folgeschritt — Standard-konto→Kostenart-Zuordnung**
(reine Logik `domain/nachkalkulation.js` `kostenartFuerKonto`/`standardKontoBlock` nach SKR03-Kontenklassen + Glue
`domain/nachkalkulation-store.js` baut die Map automatisch aus dem Kontenplan + reicht sie in `kostentraegerAnalyse`
durch). Tests **1466/1466** · SW **v120** · 115 JS-Module. **Block 1 KOMPLETT (inkl. Test-Modus 2a–2d)**; **Block-2-
Kernkette (Schritte 4–11) inkl. aller UIs KOMPLETT.**
**Nächster Schritt (optional, verbleibend):** Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag + kalibrierte
Vorwärtskalkulation (`kalkuliereKalibriert`) im Angebots-Editor.
Mehrere PRs pro Sitzung erlaubt. (Diese Zeile bei jeder Sitzung aktualisieren.)
