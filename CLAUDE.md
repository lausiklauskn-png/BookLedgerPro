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
+ `docs/PULS.md` (Nachfolge-Brief/Stand-Schnappschuss) + `docs/SESSIONS.md` (oberster Eintrag)
genau wissen, wo es weitergeht. Diese vier immer aktuell halten — **`docs/PULS.md` ist der
zentrale Andockpunkt** (oben „Letzter Stand" + „Nächste konkrete Schritte" pflegen).

## Arbeitsweise
- Branch: der **für die Sitzung vorgegebene** (steht im ersten Prompt). Bis
  2026-08-22 stand hier zusätzlich ein fester Name aus einer alten Sitzung.
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

---

## ⬇ Installieren-Knopf in den Einstellungen (2026-10-18)

Klaus: *„Den Installieren-Button überall fest einbauen … unter Einstellungen, Installier-Button hinten."*
`assets/installieren.js` ist byte-1:1 aus Sage-Protokol (SHA-256 `e0644084…c3c3`) — dort pflegen, hier neu kopieren.
Eingebunden mit `data-in="[data-einstellungen]"` (Marke an der Einstellungen-Seite in `src/ui/shell.js`), Klasse `btn`:
der Knopf hängt hinten an der Seite, auch nach jedem Neuzeichnen. Als installierte App verschwindet er. Er spricht
nach `<html lang>` (immer Deutsch; die App-Sprache setzt `lang` nicht). Im Vorrat, Cache `v254`.
Gemessen im Browser (echte `index.html`, Tresor gestellt): letztes Element der Einstellungen · als App versteckt ·
Meldung lesbar · keine Installierbarkeits-Fehler. `node tests/run.mjs` 2284/0 · `smoke_belege` 92 · `smoke_handnamen` 19.
⚠ Benannt, vorbestehend auf `main`: `tests/smoke_a5_antwortpfad.mjs` FAIL („BLP_QUERY_SYNONYMS nicht in 15_membran.js") ·
die Kopfleiste (`.header-right`) läuft bei 360 px um 1 px über. ⚠ Am Tablet/Handy nicht gemessen.

## 🏷️ Gerätename · netzweite Regeln

Der Gerätename gehört **ins Verbinden-Panel**, hineingehängt vom app-eigenen Glue
— **nie** in eine byte-kopierte Panel-Datei. Jedes Feld trägt
`data-sbkim-geraetename`; der Name geht **nur** an Anzeige und Anmeldung, **nie** an
`generateOwnSpore`. Er ist ein Hinweis, kein Vertrauens-Beweis: immer mit der Kennung
zusammen anzeigen.

Diese und die übrigen netzweiten Regeln — Selbst-Merge-Freibrief, frisch von
`origin/main`, Ton, kein PII, Ehrlichkeit — stehen seit 2026-08-22 **einmal** in
**[`Sage-Protokol/docs/NETZWEIT.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/NETZWEIT.md)** statt wortgleich in bis zu
20 Repos. Verträge: **[`INTERFACES.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/INTERFACES.md)** · die Fallen beim
Abzweigen und Veröffentlichen: **[`LEHREN.md`](https://github.com/lausiklauskn-png/Sage-Protokol/blob/main/docs/LEHREN.md)** · alte Fassung dieser
Datei: [`docs/archiv/CLAUDE-2026-08-22.md`](docs/archiv/CLAUDE-2026-08-22.md).
