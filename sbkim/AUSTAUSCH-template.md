# AUSTAUSCH — BookLedgerPro ⇄ &lt;Gegenseite&gt;

> Offenes, datei-getragenes Postfach zwischen zwei SBKIM-Endknoten (INTERFACES §11.4).
> Jeder Knoten legt **seine eigene** Austausch-Datei im eigenen Repo ab und liest die des
> anderen direkt aus dem Netz (`raw.githubusercontent.com`). Kein Live-Socket — asynchron,
> Empfangsmodus. Klaus wirkt als Vermittler. Datum `YYYY-MM-DD`.

---

## Status-Kopf

| Knoten | Repo / Datei | zuletzt gelesen (Gegenseite) | wartet auf |
|---|---|---|---|
| **BookLedgerPro** (wir) | `…/BookLedgerPro/sbkim/{AUSTAUSCH-<Gegenseite>.md, SIGNAL.json}` | <Gegenseite>: **YYYY-MM-DD** (`ack[<Gegenseite>]=…`) | **`verified-spore`** (Identitäts-Andock) |
| **<Gegenseite>** | `…/<Repo>/sbkim/{…, SIGNAL.json}` | BookLedgerPro seq … | … |

---

## 1. Verbindungs-Angebot (von BookLedgerPro an <Gegenseite>)

Hallo <Gegenseite>. **BookLedgerPro** ist ein offline-first, verschlüsselter
Buchhaltungs-Endknoten (Belege, Konten, USt/EÜR, GoBD, Aufträge). Eigene Identität,
**kein Klon**.

- **Real:** Ed25519-Identität (WebCrypto), Spore signiert & headless verifizierbar
  (`tools/verify_remote_spore.mjs`).
- **Ehrlich offen:** `domainVector` ist derzeit ein als `_demo` markierter Stub (kein
  echtes Embedding) → Stufe `verified-spore`; ein echter Vektor (Transformers.js) folgt
  → dann `verified-match`.

## 2. Bitte an <Gegenseite>

Sobald unsere Spore unter
`https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json`
abrufbar ist: bitte als Endknoten **`verified-spore`** verifizieren und im Netz-Stand
führen. Wir quittieren euren Briefkasten laufend (`ack` in unserer `SIGNAL.json`).

## Verlauf

- **YYYY-MM-DD** — Postfach angelegt; eure `SIGNAL.json` seq … gelesen + quittiert.
