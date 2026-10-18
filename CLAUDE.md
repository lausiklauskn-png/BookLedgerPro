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

## ⬇ Installieren auch OBEN in der Kopfleiste (Klaus 2026-10-18)

Klaus: *„da, wo der Installationsbutton in den Einstellungen zu finden ist, vermutet keiner, dass er die App installieren
kann … setze den Installationsbutton oben in die Navi-Leiste zusätzlich. Da soll er aber verschwinden, wenn die App
installiert ist."*

- Die Kopfleiste baut `paint()` in `src/ui/shell.js` bei jedem Neuzeichnen neu — ein von `installieren.js` direkt
  eingehängter Knopf ginge verloren. Deshalb: `data-vor="install-anker"` legt den Kanon-Knopf `#installieren` in den
  **verborgenen** Behälter `#install-quelle` (index.html), und `#install-kopf` (⬇, `installKopfKnopf()`) neben dem Namen
  gibt den Tipp dorthin weiter. **Eine Klick-Logik** (Angebot → Dialog des Browsers, sonst die Meldung der Kanon-Datei).
  Fehlt sie, führt der Tipp in die Einstellungen. `installieren.js` bleibt byte-1:1.
- Weg als App (CSS `display-mode:standalone`, `alsAppLaeuft()`) und nach `appinstalled`: `html.app-installiert` blendet
  Kopf- **und** Einstellungen-Knopf aus (die Kanon-Datei selbst kennt nur display-mode).
- Kopfleiste: bis 640 px darf `.header-right` umbrechen (vorher lief sie bei 320 px auf 361 px Seite hinaus, bei 360 px
  um 1 px); 641–780 px nur die Lampen-Punkte (sonst 650 px Seite bei 641). Gemessen: 320/360 px 127 px hoch (vorher 91,
  aber aus dem Fenster gelaufen), 412 px 91 · 641–1280 px 57 (641 px vorher 77). Cache `v255`.
- Gemessen (Playwright, echte `index.html`, Tresor gestellt, `beforeinstallprompt` geschluckt): Kopf-Knopf sichtbar und
  obenauf bei 320 · 360 · 412 · 1280 px · kein Querlaufen · Tipp zeigt die Meldung (`data-lesbar="seite"`) ·
  `getInstallabilityErrors` leer · nach `appinstalled` und als App weg, Einstellungen-Knopf ebenso.
  `node tests/run.mjs` 2284/0 · `smoke_belege` 92 · `smoke_handnamen` 19. ⚠ Vor dem Entsperren gibt es keine Kopfleiste.
  ⚠ Am Tablet nicht gemessen.

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
