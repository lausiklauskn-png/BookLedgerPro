# Sage-Synchronisationsvereinbarung & Briefkasten — verbindliche Referenz

Quelle: `Sage-Protokol/docs/INTERFACES.md` **§11 — Andock-Konventionen** (netzweit gültig,
Spec-Sitzung 2026-05-30/31) sowie gelebte Beispiele (`Mein-Tresor/sbkim/AUSTAUSCH.md`,
`.../SIGNAL.json`). **Netzweite Pflicht-Regel für JEDEN angeschlossenen Knoten — auch
BookLedgerPro.** Relevant ab **Phase 5** (Sage-Mycel-Symbiose); hier vorab dokumentiert,
damit der Andock später regelkonform läuft.

> Serverlos, **Empfangsmodus mit Antwortrecht** — kein Crawler, kein Daemon, kein
> Live-Socket. Austausch über **offene Dateien (Dead-Drop)** über die Repo-Grenze
> (`raw.githubusercontent.com`, CORS-fähig). Ein menschlicher Vermittler (Klaus) je
> Repo-Paar startet die Sitzungen. **„Das Pushen IST das Signal."**

---

## 1. Die Dateien, die BookLedgerPro führen muss (ab Phase 5)

| Datei | Zweck |
|---|---|
| `sbkim/spore.json` | **Identität** (Quelle der Wahrheit), Ed25519-signiert, 9 Pflichtfelder (§11.5) |
| `sbkim/SIGNAL.json` | **Briefkasten-Aushang** (maschinenlesbar): seq/ack-Herzschlag (§11.6) |
| `sbkim/AUSTAUSCH-<Knoten>.md` | **Postfach** je Gegenstelle: Status-Kopf + Briefe + Verlauf (§11.4) |
| `sbkim/<gegenseite>_inbox.json` | **signatur-reine 1:1-Kopie** der fremden Spore — kein Zusatzfeld (§11.3) |
| `sbkim/<gegenseite>_inbox.verify.md` | Verifikations-Beleg (Quelle, Datum, 4 Prüfpunkte, Identität, Manipulationsprobe) |
| `status.json` | **Status** (Quelle der Wahrheit) der eigenen Endknoten/Nachbarn |

Wahrheits-Karte des Gesamtnetzes liegt bei Sage: `sbkim/NETZ-STAND.md`.

---

## 2. `SIGNAL.json` — Pflicht-Schema (§11.6)

```json
{
  "node": "BookLedgerPro",
  "lastBuild": "YYYY-MM-DD",
  "seq": 1,                       // monoton +1 pro gemeldetem Bau (der Herzschlag)
  "headline": "ein Satz: was wurde gebaut",
  "sporeUrl": "https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json",
  "nodeId": "<base64url(SHA256(pubkey))>",
  "mailboxes": { "<Gegenseite>": "<URL der eigenen AUSTAUSCH-Datei für sie>" },
  "forNodes": ["*"],              // wen betrifft es; "*" = alle Knoten von Klaus
  "ack": { "<Gegenseite>": 0 }    // die seq, die WIR von der Gegenseite zuletzt quittiert haben
}
```

`seq` der Gegenseite > **unser** `ack[Gegenseite]` ⇒ es gibt Ungelesenes → Pflicht zu
lesen **und** zu quittieren. Optional erlaubt (gelebt bei Mein-Tresor): `_doc`, `history[]`.

---

## 3. Synchronisations-Vertrag — die 7 Regeln (§11.4)

1. **Prüf-Rhythmus:** bei jedem Sitzungsstart mit Andock-Bezug die `AUSTAUSCH.md` +
   `status.json` jeder Gegenseite lesen (Empfangsmodus, kein Daemon).
2. **Lese-Quittung Pflicht:** Datum in „zuletzt gelesen" + „wartet auf".
3. **Bau-Protokoll:** wer baut/ändert, trägt `Datum · Knoten · WAS · WO
   (Datei/Commit/PR) · real|demo` ins Postfach.
4. **Abgleich-Frage:** zu jedem gemeldeten Bau prüft die Gegenseite „kann/soll das bei uns
   rein?" → Ja / Nein / Wie, mit Datum.
5. **Quelle der Wahrheit:** Identität = `spore.json`, Status = `status.json`, Verträge =
   ANDOCK ↔ INTERFACES; **Spec vor Code**.
6. **Heartbeat:** kein gemeldeter Schritt bleibt länger als eine Gegen-Sitzung unquittiert.
7. **Menschlicher Vermittler je Repo-Paar** (Klaus) startet die Sitzungen.

---

## 4. Ritual am Sitzungsstart (jeder Knoten mit Andock-Bezug)

1. Eigenes `sbkim/SIGNAL.json` lesen — wo steht das eigene Netz?
2. `SIGNAL.json` **jeder** Gegenstelle aus deren `raw/main` lesen (URLs aus `mailboxes`).
3. Für jede Gegenstelle mit `seq > ack[Gegenstelle]`: deren `AUSTAUSCH`-Datei +
   `status.json` lesen, handeln, **quittieren** (Datum stempeln + `ack` hochsetzen).

## 5. Ritual am Sitzungsende (wer etwas gemeldet hat)

1. `seq` +1, `lastBuild` + `headline` setzen, `forNodes` füllen.
2. Bau-Protokoll-Zeile ins betroffene `AUSTAUSCH`-Postfach (Regel 3 oben).
3. Committen/pushen — **das Pushen IST das Signal** (serverlos; mehr braucht es nicht).

**Quittungs-Symmetrie:** Wer liest, setzt `ack[Gegenstelle]` auf deren aktuelle `seq` und
stempelt Datum in der `AUSTAUSCH`-Datei — so sieht jede Seite, ob ihr letzter Bau gesehen
wurde (Heartbeat, Regel 6).

---

## 6. Identitäts-/Signatur-Norm (§11.1, §11.2, §11.5) — kurz

- **Kanonische Signier-Form:** UTF-8-Bytes des Spore-Objekts **ohne `signature`**, kompaktes
  JSON **ohne Whitespace**, **rekursiv alphabetisch sortierte Objekt-Schlüssel** (Arrays
  bleiben in Reihenfolge!). Signatur = **Ed25519**, base64url **ohne Padding**.
- **`id == base64url(SHA256(roher 32-Byte-Pubkey))`** — unabhängig nachrechenbar.
- **9 Pflicht-Spore-Felder:** `createdAt`, `domain`, `embeddingModel`, `endpoint`, `id`,
  `nodeType`, `protocolVersion`, `publicKey`, `signature`.
- **`domainVector`** (384-dim, L2-normalisiert, `Xenova/multilingual-e5-small`, `passage:`-
  Präfix, mean-pooled): optional für `verified-spore`, **Pflicht für `verified-match`**.
  Solange Stub: über `_demo: ["domainVector"]` markieren.
- **Verifizierer-Paar:** Browser (WebCrypto) **und** headless (`node:crypto`) müssen für
  dieselbe Spore dasselbe Urteil fällen. BookLedgerPro soll ein headless-Gegenstück
  bereitstellen.

---

## 7. Was das für BookLedgerPro heißt (Phase-5-Checkliste)

- [ ] `sbkim/spore.json` mit echtem `domainVector` aus Buchhaltungs-Stichworten erzeugen.
- [ ] `sbkim/SIGNAL.json` anlegen (Schema oben), `seq` ab 1, `forNodes` setzen.
- [ ] Pro Geschwister-Knoten ein `AUSTAUSCH-<Knoten>.md` (Status-Kopf + Brief + Verlauf).
- [ ] Nachbar-Sporen reziprok verifizieren → `<gegenseite>_inbox.json` + `.verify.md`.
- [ ] Headless-Verifizierer (`tools/verify_remote_spore.mjs`, `node:crypto`, zero-dep).
- [ ] Bei Sage im Hub-`status.json`/`NETZ-STAND.md` per PR registrieren lassen.
- [ ] Start-/End-Ritual (§§4–5) in den Mehr-Sitzungs-Workflow aufnehmen (siehe `CLAUDE.md`).

> Hinweis: SBKIM-Module werden aus dem Sage-Repo **kopiert, nicht modifiziert** (Modul 09).
> DB-Suffix bleibt `bookledgerpro` (Origin-Trennung, siehe `SAGE_BROWSER_LEHREN.md`).
