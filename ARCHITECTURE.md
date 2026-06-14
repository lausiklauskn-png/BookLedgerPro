# Architektur

## Prinzipien

1. **Offline-first, build-frei.** Schlanke `index.html`-Shell + native ES-Module unter
   `src/`. Kein Bundler, kein npm-Runtime-Dependency, keine CDNs. Läuft auf GitHub Pages
   und im Flugmodus.
2. **Lokal & verschlüsselt.** Alle Daten in IndexedDB, sensible Inhalte mit AES-GCM-256
   (Schlüssel aus Passwort via PBKDF2-SHA256, 600.000 Runden). Klartext verlässt das
   Gerät nie ohne ausdrückliche Bestätigung.
3. **Recht ist Architektur, kein Feature.** GoBD-Festschreibung (Unveränderbarkeit,
   Storno statt Löschen, Hash-Kette), DSGVO, USt/EÜR — von Anfang an mitgedacht.
4. **KI On-Device-first, extern opt-in (BYOK).** Embeddings/OCR lokal; hochwertige
   Vision/Steuer-Assistenz über Claude-API mit eigenem Schlüssel, datenminimiert.
5. **Symbiose statt Insel.** Anbindung an das Sage-Mycel (SBKIM) für P2P-Austausch mit
   den Geschwister-Apps.

## Verzeichnisbaum (Soll)

```
index.html · manifest.webmanifest · sw.js · status.json (Phase 5)
(Phase 5) sbkim-sw.js · sbkim/{spore.json, SIGNAL.json, AUSTAUSCH-<Knoten>.md,
          <gegenseite>_inbox.json, <gegenseite>_inbox.verify.md}
assets/        tokens.css · app.css · icon.svg · (Phase 6: Bilder)
src/
  core/        crypto · shamir · db · durability · files · vault · backup
  domain/      money · accounts · journal · audit · taxes · store · documents
               orders · invoicing · employees · costcenters · encstore · crm-store (Phase 3)
  ai/          extract · categorize · suggest · provider  (Phase 2, real)
               (Phase 2.x: ocr lokal, embeddings; Phase 4: taxAssist)
  ui/views/    accounts · journal · reports · documents · customers · orders · employees
  sbkim/       (Phase 5) identity · spore · anastomose · membrane · siegel
  ui/          dom · i18n · theme · mycel · lock · shell · (Phase 1+: views/)
  state.js · main.js
docs/          ROADMAP · SESSIONS · SAGE_BROWSER_LEHREN · (Phase 4: legal/)
tests/         run.mjs (Node-Smoke-Test reiner Logik)
```

## Datenfluss (Phase 0)

```
main.js → requestPersistence() → SW registrieren → showLockScreen()
   ├─ kein Tresor → Onboarding: Passwort → Shamir-Shares → erstes Backup (Pflicht)
   └─ Tresor da   → Unlock (Passwort verifiziert gegen check-Chiffre)
→ hydrateSettings() (entschlüsselt) → applyTheme/setLang → renderShell()
```

## Speicher-Schichten

- **`crypto.subtle`** — AES-GCM-256, PBKDF2, SHA-256. Sitzungs-Key nur im RAM.
- **IndexedDB** (`blpr_bookledgerpro`) — Stores: `kv` (Settings/Meta), `records`
  (Buchhaltung, Index `type`), `files` (verschlüsselte Belege). DB-Suffix verhindert
  Origin-Kollision mit Geschwister-Apps.
- **Shamir (GF(256))** — der rohe AES-Key wird in N Teile gesplittet (K nötig), als
  Schutz vor IndexedDB-Verlust.
- **Backup-Bundle** — passwortverschlüsseltes JSON des gesamten Bestands (Download).

## Module (Phase 0, real implementiert)

| Modul | Aufgabe |
|---|---|
| `core/crypto.js` | AES-GCM/PBKDF2/SHA-256, base64url, Key-Ableitung/-Export |
| `core/shamir.js` | Shamir Secret Sharing über GF(256), Share-Kodierung |
| `core/db.js` | IndexedDB-Wrapper, KV/Records/Files, Dump/Wipe |
| `core/durability.js` | `storage.persist()`, Quota-Schätzung, Backup-Status |
| `core/files.js` | Datei lesen/herunterladen/auswählen |
| `core/vault.js` | Tresor: Setup/Unlock, Sitzungs-Key, Settings, Mandant-ID |
| `core/backup.js` | Backup bauen/lesen/importieren |
| `state.js` | App-Zustand + Settings (Modus, Theme, Sprache, KI-Autonomie) |
| `ui/*` | DOM-Helfer, i18n, Theme, Mycel-Mark, Sperrbildschirm, Shell |

## Browser-Realität (verbindlich)

Siehe [`docs/SAGE_BROWSER_LEHREN.md`](docs/SAGE_BROWSER_LEHREN.md). Kurz:
- **Datendurabilität** aktiv überwachen (IndexedDB ist vergänglich).
- **DB-Suffix** zwingend (gemeinsamer Origin auf GitHub Pages).
- **Cache-Bust per Version/Datei-Rename** (`CACHE_VERSION` in `sw.js`).
- **Design-Effekte additiv** (kein `cursor: none` — auf DeX/Android ignoriert).
