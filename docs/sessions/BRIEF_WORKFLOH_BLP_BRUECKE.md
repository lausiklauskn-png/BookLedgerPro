# BRIEF an die Nachfolgesitzung — WorkFloh ⇄ BookLedgerPro: Durchspielen · ISD-plus-Brücke · v2-Rückkanal

**Stand:** 2026-07-05 · Auftraggeber: Klaus · **Cross-Repo** (BookLedgerPro · Mein-WorkFloh · Tomys-Hub/workfloh)
**Freibrief gilt** (netzweiter Selbst-Merge, siehe Sage-CLAUDE.md § Freibrief): getestete, abgegrenzte,
nicht-zweifelhafte PRs selbstständig Draft→ready→squash mergen. Bei **echtem Zweifel**
(Richtungsentscheid, schwer umkehrbar) erst Klaus fragen. Immer gegen aktuelles `main` arbeiten.

## Worum es geht (Klaus' Wunsch, 2026-07-05)

Ein **fertig bearbeiteter WorkFloh-Auftrag** soll **ohne Datei-Export** direkt in BookLedgerPro (BLP)
zur Rechnung wandern — Angebots-Nr., Kunde, Position reisen per Link mit; in BLP entsteht die Rechnung
und bucht in **USt/EÜR**. Klaus hat alle drei Stränge unten ausdrücklich gewählt.

## Ist-Stand (ehrlich, im Code geprüft 2026-07-05)

**Tomy-Verbund (`Tomys-Hub/workfloh`) ⇄ BLP ist BEREITS gebaut — beide Richtungen:**
- **Senden:** `ykBlpInvoice()` (Knopf „🧾 Rechnung in BLP", nur bei fertigem Auftrag) baut v1-Payload
  `{v:1, quelle:'tomy-workfloh', titel, kundeName, auftragNr, angebotsNr, positionen[]}` →
  `location.href = https://lausiklauskn-png.github.io/BookLedgerPro/?uebernahme=<base64url>`.
  Zusätzlich „💶 Angebot erstellen" (`ykJump('bookledger')`) mit Rücksprung.
- **Empfangen (BLP):** `src/ui/shell.js` importiert `parseUebernahmeParam` und fängt `?uebernahme=`
  beim Laden ein; `src/domain/uebernahmeExtern.js` härtet (Whitelist `UEBERNAHME_QUELLEN=['tomy-workfloh']`,
  v===1, Kappungen, ≤20 Positionen, USt 0/7/19, >20 kB→null), säubert URL (replaceState), Route → Angebote,
  Formular vorbefüllt; `src/domain/angebotUebernahme.js` Angebot→Rechnungs-Entwurf. Node-getestet in `tests/run.mjs`.
- **Rücksprung BLP → WorkFloh:** `ykHandleUrl()` liest `?auftrag=&angebot=&status=` bzw. `?angebotNeu=`
  (Status + Angebots-Nr. reisen zurück).
- **Spec-of-Truth:** `BookLedgerPro/docs/UEBERNAHME_TOMY.md` (Datenvertrag v1).

**Offen:** Klaus' Browser-Sichttest am Tablet (headless grün, echter Klick-Weg unbestätigt).
**Mein-WorkFloh (ISD plus) hat diese Brücke NICHT** — nur der Tomy-Verbund.

## Pflichtlektüre (vor dem Bauen, in Reihenfolge)

1. `BookLedgerPro/CLAUDE.md` + `BookLedgerPro/docs/UEBERNAHME_TOMY.md` (Datenvertrag v1).
2. BLP: `src/domain/uebernahmeExtern.js` + `src/ui/shell.js` (`?uebernahme=`-Einfang) +
   `src/domain/angebotUebernahme.js` + `src/ui/views/angebote.js` (Vorbefüllung).
3. `Tomys-Hub/workfloh/index.html`: `ykBlpInvoice()` (~Z.4192), `ykHandleUrl()` (~Z.4208),
   Knöpfe (~Z.1558–1559).
4. `Mein-WorkFloh/CLAUDE.md` + im `index.html` die Auftrag-/Katalog-Struktur (Auftrag-Nr., Kunde,
   Angebotsnr, Katalog-Position, „fertig"-Status).
5. `BookLedgerPro/tests/run.mjs` (bestehende Uebernahme-Tests als Vorlage).

**Repo-Scope-Hinweis:** `Tomys-Hub` und ggf. `Mein-WorkFloh` müssen in der Session freigeschaltet sein —
sonst mit `add_repo` dazuholen.

## Aufgabe — 3 Stränge

### Strang 1 — Tomy-Verbund durchspielen + Feinschliff (Test-first, KEIN Neubau)

- **Ziel:** End-to-End beweisen: fertiger Tomy-Auftrag → „🧾 Rechnung in BLP" → BLP-Angebot vorbefüllt
  → Rechnung → USt/EÜR; Angebots-Nr. reist zurück.
- Wo möglich **headless** (node) nachstellen: Payload bauen → `parseUebernahmeParam` → erwartete Felder
  prüfen. Danach **Klaus-Sichttest-Anleitung** (benannte Knöpfe, keine Konsole).
- **Feinschliff NUR bei Reibung** im Sichttest: Banner-Text, Kunde-Zuordnung, Mapping der Katalog-Position
  (aktuell **genau eine** Position aus `katalogProdukt` — prüfen ob mehrere Positionen nötig), USt-Default.
- **Akzeptanz:** Klaus bestätigt den vollen Kreis am Tablet. Datenvertrag v1 unverändert.

### Strang 2 — Brücke auch in ISD-plus (Mein-WorkFloh) bauen (Neubau)

- **Spec vor Code:** `BookLedgerPro/docs/UEBERNAHME_TOMY.md` erweitern → zweite Quelle. In
  `uebernahmeExtern.js` `UEBERNAHME_QUELLEN` um `'isd-workfloh'` ergänzen (nur additiv); Node-Test in
  `tests/run.mjs` dazu.
- **Mein-WorkFloh** (`index.html`): Sende-Knopf „🧾 Rechnung in BLP" am fertigen Auftrag (analog
  `ykBlpInvoice`, aber ISD-plus-Felder) mit `quelle:'isd-workfloh'`; Rücksprung-Handler (analog `ykHandleUrl`).
  **SW-Cache-Bump** (`isd-workfloh-vNNN`), `node --check` auf `<script>`-Block + `sw.js`.
- **Datenvertrag:** gleicher v1, nur andere `quelle`. Positionen aus ISD-plus-Katalog.
- **Akzeptanz:** Node-Tests grün (BLP-Parser akzeptiert `isd-workfloh`), Klaus-Sichttest.

### Strang 3 — v2: Rechnungs-Nr. zurück (Rückkanal schließen)

- **Spec vor Code:** `UEBERNAHME_TOMY.md` auf **v2** heben (Datei zuerst, **abwärtskompatibel** — v1 weiter
  akzeptiert).
- **BLP:** nach erstellter/festgeschriebener Rechnung Knopf „↩ zurück an WorkFloh" → öffnet die
  WorkFloh-Herkunft mit `?auftrag=<id>&rechnung=<nr>&status=berechnet`.
- **WorkFloh** (Tomy + ISD-plus, falls Strang 2 fertig): Rücksprung-Handler erweitern → Auftrag zeigt
  „berechnet" + Rechnungs-Nr.
- **Offene Design-Frage (mit Klaus klären, s.u.):** BLP muss wissen, WOHIN zurück (Tomy-URL vs
  ISD-plus-URL). Vorschlag: Hinreise-Payload um `rueckUrl` erweitern ODER aus `quelle` eine feste URL
  ableiten. Spec-Entscheidung **vor** Code.

## Reihenfolge & Abhängigkeiten

1. **Strang 1 zuerst** — blockiert nichts, beweist die Basis (Klaus-Sichttest).
2. **Strang 2** unabhängig (Neubau ISD-plus), kann parallel spec'd werden.
3. **Strang 3 zuletzt** — setzt stabile Hinreise (Strang 1) voraus; `rueckUrl`-Entscheidung erst mit Klaus.

## TABU

- `bookledgerpro`-DB-Suffix, Persistenz-Keys, bestehende `tomy-workfloh`-Whitelist — **nicht ändern**
  (nur additiv `isd-workfloh` ergänzen).
- **GoBD:** kein Auto-Speichern, keine Nummernvergabe, kein Festschreiben ohne Mensch.
- Keine echten personenbezogenen Daten in Tests (anonyme Test-Aufträge).
- Single-File-Geist der WorkFloh-Apps wahren.

## Beweis-Pflicht je PR (headless)

`node --check` auf geänderte JS/SW · `node tests/run.mjs` (BLP) grün · WorkFloh-Änderungen: `node --check`
+ wo möglich jsdom-Smoke. **Erst mergen, dann Klaus-Sichttest** am Tablet (Hard-Reload; SW-Cache-Bump beachtet).

## Offene Fragen an Klaus

1. **Strang 3 `rueckUrl`:** fest aus `quelle` ableiten (tomy→Tomys-Hub, isd→Mein-WorkFloh) ODER explizit
   im Payload mitschicken?
2. **Strang 1:** reicht EINE Position pro Übergabe, oder sollen mehrere Katalog-Positionen eines Auftrags
   rüber?

## Abschluss-Pflicht

Je Repo `docs/PULS.md`/`SESSIONS.md` fortschreiben, diesen Brief bei Fortschritt aktualisieren, den
nächsten Brief als Codeblock im Chat ausgeben. Freibrief mitnehmen (siehe Kopf).
