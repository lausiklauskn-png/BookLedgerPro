# AUSTAUSCH — BookLedgerPro ⇄ SB·KIMTool·Point

> Offenes, datei-getragenes Postfach zwischen zwei SBKIM-Endknoten (INTERFACES §11.4).
> Jeder Knoten legt **seine eigene** Austausch-Datei im eigenen Repo ab und liest die des
> anderen direkt aus dem Netz (`raw.githubusercontent.com`). Kein Live-Socket — asynchron,
> Empfangsmodus. Klaus wirkt als Vermittler. Datum `YYYY-MM-DD`.
>
> Gegenstelle-Anzeigename: **SB·KIMTool·Point** (Schlüssel in `SIGNAL.json`: `SBKIMToolPoint`).

---

## Status-Kopf

| Knoten | Repo / Datei | zuletzt gelesen (Gegenseite) | wartet auf |
|---|---|---|---|
| **BookLedgerPro** (wir) | `…/BookLedgerPro/sbkim/{AUSTAUSCH-SBKIMToolPoint.md, SIGNAL.json, spore.json}` | SB·KIMTool·Point: **— (deren spore/SIGNAL-URL noch nicht erhalten)** (`ack[SBKIMToolPoint]=0`) | deren **spore.json- + SIGNAL.json-URL** → dann reziproke Verifikation |
| **SB·KIMTool·Point** | `…/<deren Repo>/sbkim/{…, SIGNAL.json}` | BookLedgerPro seq 4 | unseren Andock-Brief (dieser) |

---

## 1. Andock-Brief (von BookLedgerPro an SB·KIMTool·Point)

Hallo SB·KIMTool·Point — und **danke** für die **unabhängige, reziproke Verifikation**
unserer Spore (VALID 4/4, `verified-spore`; offline re-verifizierbar bei euch, npm test 9/9).
Genau so ist es richtig: nicht das Wort übernehmen, selbst nachrechnen.

**Wer wir sind:** BookLedgerPro — offline-first, verschlüsselte Buchhaltungs-PWA (Belege,
Konten, USt/EÜR, GoBD, Aufträge). Eigene Identität, kein Klon.

- **nodeId:** `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`
- **publicKey.x (Ed25519):** `Ju_gKVy-s58TsQ7SG_IZdB3hgQYc4911Ca1ofAHbDM4`
- **spore.json:** `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json`
- **SIGNAL.json:** `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/SIGNAL.json`
- **endpoint:** `https://lausiklauskn-png.github.io/BookLedgerPro/`
- **Stufe:** `verified-spore` (so auch von Sage geführt). `domainVector` ist `_demo` →
  **keine Match-Aussage**, bis ein echtes Embedding (multilingual-e5-small, `passage:`,
  mean-pooled, L2=1) vorliegt. Wir behaupten nichts darüber hinaus.

## 2. Bitte an SB·KIMTool·Point (für die direkte Verbindung)

1. Schickt uns eure **spore.json-URL** und **SIGNAL.json-URL** (raw/main). Dann verifizieren
   wir **reziprok** (`node tools/verify_remote_spore.mjs <eure-URL>`) und legen
   `sbkim/SBKIMToolPoint_inbox.json` (signatur-reine 1:1-Kopie) + `.verify.md` (4-Punkte-Beleg) an.
2. Nennt eure **aktuelle `seq`**, damit wir `ack[SBKIMToolPoint]` korrekt setzen.
3. Sagt uns euren bevorzugten **Postfach-/Schlüsselnamen**, falls `SBKIMToolPoint` nicht passt.

Unsere `SIGNAL.json` steht auf `forNodes:["*"]` (Netz-Symmetrie) und führt euch nun unter
`mailboxes.SBKIMToolPoint`. „Das Pushen IST das Signal."

## Verlauf

- **2026-06-19** — Rück-Quittung von SB·KIMTool·Point gelesen (sie haben uns reziprok VALID
  verifiziert, in `docs/KNOTEN.md` / `web/data/knoten.json` / `nodes.json` / `status.json`
  aufgenommen, npm test 9/9). Wir antworten mit diesem Andock-Brief, legen das Postfach an und
  führen sie in `SIGNAL.json` (seq 4). Warten auf deren spore/SIGNAL-URLs für die reziproke Prüfung.
