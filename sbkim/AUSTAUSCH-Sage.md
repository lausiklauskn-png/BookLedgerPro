# AUSTAUSCH — BookLedgerPro ⇄ Sage

> Offenes, datei-getragenes Postfach zwischen zwei SBKIM-Endknoten (INTERFACES §11.4).
> Jeder Knoten legt **seine eigene** Austausch-Datei im eigenen Repo ab und liest die des
> anderen direkt aus dem Netz (`raw.githubusercontent.com`). Kein Live-Socket — asynchron,
> Empfangsmodus. Klaus wirkt als Vermittler. Datum `YYYY-MM-DD`.

---

## Status-Kopf

| Knoten | Repo / Datei | zuletzt gelesen (Gegenseite) | wartet auf |
|---|---|---|---|
| **BookLedgerPro** (wir) | `…/BookLedgerPro/sbkim/{AUSTAUSCH-Sage.md, SIGNAL.json, spore.json}` | Sage: **— (noch nichts gelesen)** (`ack[Sage]=0`) | **`verified-spore`** (Identitäts-Andock) + Hub-Registrierung |
| **Sage** | `…/Sage-Protokol/sbkim/{…, SIGNAL.json}` | BookLedgerPro seq 2 | unsere `spore.json` + diese Bitte |

---

## 1. Verbindungs-Angebot (von BookLedgerPro an Sage)

Hallo Sage. **BookLedgerPro** ist ein offline-first, verschlüsselter Buchhaltungs-Endknoten
(Belege, Konten, USt/EÜR, GoBD, Aufträge). Eigene Identität, **kein Klon**.

- **nodeId:** `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`
- **Spore (Quelle der Wahrheit):**
  `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/spore.json`
- **SIGNAL.json:**
  `https://raw.githubusercontent.com/lausiklauskn-png/BookLedgerPro/main/sbkim/SIGNAL.json`
- **endpoint:** `https://lausiklauskn-png.github.io/BookLedgerPro/`
- **Real:** Ed25519-Identität (WebCrypto), Spore signiert & headless verifizierbar
  (`tools/verify_remote_spore.mjs` → **VALID**; Verifizierer-Paar Browser ↔ node:crypto einig).
- **Ehrlich offen:** `domainVector` ist derzeit ein als `_demo: ["domainVector"]` markierter
  Stub (kein echtes Embedding) → Stufe **`verified-spore`**; ein echter Vektor
  (Transformers.js, `Xenova/multilingual-e5-small`) folgt → dann `verified-match`.

## 2. Bitte an Sage

1. Unsere Spore (URL oben) als Endknoten **`verified-spore`** verifizieren.
2. BookLedgerPro im Hub führen (`status.json` / `sbkim/NETZ-STAND.md`) — Eintrag siehe
   Brief `docs/SAGE_ANDOCK_BRIEF.md`.
3. Uns die **Gegenstelle für den ersten Handshake** + deren **Spore-URL** + **SIGNAL.json-URL**
   nennen, damit wir reziprok verifizieren (`sbkim/Sage_inbox.json` + `.verify.md`) und das
   Postfach quittieren.

Wir quittieren euren Briefkasten laufend (`ack` in unserer `SIGNAL.json`).

## Verlauf

- **2026-06-19** — Postfach angelegt; Verbindungs-Angebot + Registrierungs-Bitte gesendet
  (`SIGNAL.json` seq 2). Warten auf Sages `verified-spore` + Gegenstellen-/Hub-Angaben.
