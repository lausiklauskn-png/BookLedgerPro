# NÄCHSTE SITZUNG — konkreter Andockpunkt

> Kurzzettel für den schnellen Wiedereinstieg. Tiefer Kontext: `docs/PULS.md`
> (zentraler Nachfolge-Brief), oberster `docs/SESSIONS.md`-Eintrag, `ROADMAP.md`.

## START HIER
1. `docs/PULS.md` lesen (Stand-Schnappschuss).
2. Obersten `docs/SESSIONS.md`-Eintrag lesen.
3. `node tests/run.mjs` → **142/142 erwartet**.
4. `node tools/verify_remote_spore.mjs sbkim/spore.json` → **VALID erwartet**.

## STAND (2026-06-19)
**Phase-5-Andock Schritt 1 erledigt:** BookLedgerPro ist ein echter SBKIM-Knoten.
- Committet: `sbkim/spore.json` + `sbkim/SIGNAL.json` (headless gemintet, **VALID**).
- nodeId: `MyHVM7PdwEtNzOXiZNxfP_RcEXiTLjLpAls1oUm5-cQ`.
- Tools: `tools/mint_spore.mjs` (Minter) · `src/sbkim/nodeProfile.js` (eine Quelle der
  Wahrheit) · `importIdentity()` + UI „Identität importieren".

## ⚠ ZUERST ERLEDIGEN (Nutzer)
**Privaten Schlüssel sichern.** `sbkim/.node-secret.json` (gitignored) ist der einzige
Weg, den Knoten zu signieren/rotieren. Wege:
- In der App (Ansicht „Mycel-Netz" → „Bestehende Identität importieren") in den Tresor übernehmen.
- **NEU:** im **Geheim-Fach** ablegen (Ansicht „Geheim-Fach" → Eintrag Typ „Schlüssel") —
  separat mit zweitem Code verschlüsselt, mit eigenem Shamir-Backup.
- Sonst sicher verwahren (das per Chat übergebene ZIP).
Geht er verloren: `node tools/mint_spore.mjs --force` (nodeId wechselt → Mycel neu andocken).

## ⏭ NÄCHSTE SCHRITTE (Priorität)
1. **Schritt 2 — Hub-Registrierung + Handshake (menschlich vermittelt, fremde Repos):**
   `sbkim/spore.json` deployen (GitHub Pages / raw), bei einem Geschwister-Knoten über dessen
   `AUSTAUSCH`-Postfach um `verified-spore` bitten, im Sage-Hub `status.json` per PR
   registrieren lassen. Briefkasten-Ritual leben (`docs/SAGE_SYNC_BRIEFKASTEN.md`).
2. **Schritt 3 — WorkFloh-Pairing.**
3. **Schritt 4 (EU-Phase) — `verified-match`:** echter `domainVector` statt `_demo` via
   Mistral-EU-Embeddings (BYOK, opt-in); Schwelle `PROVIDER_MIN_MATCH=0.80` neu validieren.

## REGELN (CLAUDE.md)
build-frei · keine CDNs (#1) · EU-KI opt-in (#8) · DB-Suffix `bookledgerpro` nie ändern ·
Datendurabilität · GoBD/DSGVO. Freibrief: bei grün + sinnvoll squash-mergen.
