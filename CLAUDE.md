# CLAUDE.md — Leitfaden für Mehr-Sitzungs-Arbeit

Dieses Repo wird über viele Sitzungen hinweg gebaut. Lies das hier zuerst.

## Was BookLedgerPro ist
Offline-first, verschlüsselte Buchhaltungs-PWA (Deutschland zuerst), KI-gestützt,
ins Sage-Mycel eingebunden. Build-frei (native ES-Module), keine CDNs, GitHub Pages.
Familie: Mein-Tresor (Krypto), Mein-WorkFloh (Shell/Domäne), Sage-Protokol (SBKIM).

## Goldene Regeln
1. **Build-frei bleiben.** Native ES-Module, keine Bundler/npm-Runtime-Deps, keine CDNs.
   Alles muss von `file`-losem `http(s)://` (z.B. `python3 -m http.server`) laufen.
2. **Datendurabilität ist Pflicht-Feature #1.** Niemals einen Pfad bauen, der Daten allein
   IndexedDB anvertraut. `storage.persist()`, Backups, Shamir. Siehe
   `docs/SAGE_BROWSER_LEHREN.md` — diese Lehren sind verbindlich.
3. **DB-Suffix `bookledgerpro` nie ändern.** Gemeinsamer Origin auf GitHub Pages →
   sonst Kollision mit Geschwister-Apps.
4. **Krypto-Disziplin.** Sitzungs-Key nur im RAM; Klartext verlässt das Gerät nie ohne
   ausdrückliche Nutzer-Bestätigung. Externe KI strikt opt-in (BYOK).
5. **Recht ist Architektur.** GoBD-Festschreibung (Storno statt Löschen, Hash-Kette),
   DSGVO, USt/EÜR — nicht nachträglich aufpfropfen.
6. **Cache-Bust bei Shell-Änderungen.** `CACHE_VERSION` in `sw.js` erhöhen (oder Datei
   umbenennen). Sonst liefert der SW veraltete Logik.
7. **Design additiv.** Visuelle Effekte nie via `cursor: none` (DeX/Android ignoriert das).
8. **EU-KI, BYOK, opt-in.** Beleg-Texterkennung (OCR) ausschließlich über **Google Cloud
   Vision — EU-Endpoint** (`eu-vision.googleapis.com`); Textsortierung/Kontierung und
   Steuer-Assistent über **Mistral (EU)**. On-Device-Heuristik als Fallback. Schlüssel
   verschlüsselt lokal; Übertragung nur nach Bestätigung (Datenresidenz EU/DSGVO).

## Arbeitsvertrag — lückenlos & ehrlich (verbindlich)

Diese Regeln sichern, dass über Sitzungsgrenzen hinweg **nahtlos** weitergearbeitet werden
kann und nichts beschönigt wird.

**Ehrlichkeit (keine Tricks, keine sinnlosen Abkürzungen):**
- Was als „fertig/implementiert" gemeldet wird, **ist** real implementiert — keine Stubs,
  keine Fake-Logik, kein vorgetäuschtes Grün. Platzhalter werden ausdrücklich als solche
  benannt (`Phase X`, „coming soon").
- Tests müssen **wirklich laufen** (`node tests/run.mjs`); Ergebnisse werden wahrheitsgemäß
  berichtet (auch Fehlschläge). Nicht im Browser verifizierte Teile (DOM/IndexedDB) werden
  **klar gekennzeichnet** — nicht als „getestet" ausgegeben.
- Abkürzungen nur, wenn sie die Sache nicht entwerten. Im Zweifel den ehrlichen, etwas
  längeren Weg gehen.

**Definition of Done je Phase (alle Punkte):**
1. Funktion real implementiert (kein Fake), Kernlogik per Node-Test abgedeckt wo möglich.
2. `node tests/run.mjs` grün; CI grün.
3. `ROADMAP.md`-Checkliste der Phase abgehakt.
4. `docs/SESSIONS.md` fortgeschrieben: **Was getan · Stand · konkretes Nächstes · offene
   Grenzen/ungetestete Teile**.
5. PR mit ehrlicher Verifikations-Sektion (inkl. was NICHT geprüft wurde).

**Lückenloses Weiterarbeiten:** Eine neue Sitzung muss allein aus `CLAUDE.md` + `ROADMAP.md`
+ `docs/SESSIONS.md` (oberster Eintrag) genau wissen, wo es weitergeht. Diese drei immer
aktuell halten.

## Arbeitsweise
- Branch: `claude/general-discussion-x9xyk9` (bzw. der für die Sitzung vorgegebene).
- Pro Phase ein PR. **Freibrief für dieses Repo: mergen, wenn sinnvoll & nutzerfreundlich**
  (CI grün, in sich abgeschlossen). Beschreibung mit Verifikation.
- `node tests/run.mjs` vor dem Push laufen lassen.
- Nach jeder Sitzung `docs/SESSIONS.md` fortschreiben (was getan, was offen).

## Sage-Briefkasten-Ritual (ab Phase 5 Pflicht — netzweite Regel §11.6)
Sobald BookLedgerPro ein Sage-Knoten ist, gilt die **Synchronisationsvereinbarung**
(`docs/SAGE_SYNC_BRIEFKASTEN.md`):
- **Sitzungsstart (mit Andock-Bezug):** eigenes `sbkim/SIGNAL.json` + das jeder
  Gegenstelle (deren `raw/main`) lesen; bei `seq > ack[Gegenstelle]` deren `AUSTAUSCH`-Datei
  + `status.json` lesen, handeln, **quittieren** (`ack` hochsetzen, Datum stempeln).
- **Sitzungsende (wenn etwas gemeldet):** `seq` +1, `headline`/`lastBuild`/`forNodes`
  setzen, Bau-Protokoll-Zeile ins Postfach, pushen — **das Pushen IST das Signal.**

## Wo was liegt
Siehe `ARCHITECTURE.md`. Phasenstand in `ROADMAP.md`.

## Sage-Andock (Phase 5) — vorzubereitende Werte
`<ENDPOINT>` = `https://lausiklauskn-png.github.io/BookLedgerPro/`, `<DB_SUFFIX>` =
`bookledgerpro`, Domänen-Stichworte (Buchhaltung, Beleg, Konto, Rechnung, USt, EÜR,
Kostenstelle …), Peer-Spore eines Geschwister-Knotens für den ersten Handshake.
SBKIM-Module werden aus dem Sage-Repo **kopiert, nicht modifiziert** (Modul 09).
