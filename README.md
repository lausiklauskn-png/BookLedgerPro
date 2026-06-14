# BookLedgerPro

**Offline-first, verschlüsselte Buchhaltung mit KI-Unterstützung — und einer dezenten
Mycel-Seele.** Teil der Familie offline-first PWAs unter `lausiklauskn-png.github.io`
(Mein-Tresor, Mein-WorkFloh, Sage-Protokol).

> Daten bleiben auf dem Gerät. Kein Server, kein Tracking, kein Build-Schritt, keine CDNs.
> Verschlüsselung mit `crypto.subtle` (AES-GCM-256 / PBKDF2). Deployment via GitHub Pages.

## Status

**Phase 0 — Fundament** (aktuell): Krypto, IndexedDB, Datendurabilität, Sperrbildschirm +
Onboarding, Modus-Framework (Einfach/Profi/Berater), KI-Autonomie-Schalter, Design-System.
Der Buchhaltungs-Kern (Konten, Buchungssätze, GoBD) folgt in Phase 1.

Siehe [`ROADMAP.md`](ROADMAP.md) für den Phasenplan und [`ARCHITECTURE.md`](ARCHITECTURE.md)
für den Aufbau.

## Lokal starten

Kein Build nötig — native ES-Module. Ein statischer Server genügt:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

> `file://` funktioniert **nicht** (ES-Module + Service-Worker brauchen `http(s)://`).

## Leitplanken (kurz)

- **Datendurabilität ist Pflicht-Feature #1.** `navigator.storage.persist()`, erzwungenes
  erstes Backup im Onboarding, Shamir-Schlüssel-Sicherung, Durabilitäts-Banner.
  Hintergrund: [`docs/SAGE_BROWSER_LEHREN.md`](docs/SAGE_BROWSER_LEHREN.md).
- **Eine PWA = eine Identität**, origin-/instanzgebunden. DB-Suffix `bookledgerpro`
  verhindert Kollision mit den Geschwister-Apps (gemeinsamer Origin auf GitHub Pages).
- **KI On-Device-first, externe KI strikt opt-in (BYOK).** Kein Klartext verlässt das
  Gerät ohne ausdrückliche Bestätigung.
- **Recht ist Architektur:** GoBD-Festschreibung, DSGVO, USt/EÜR (Deutschland zuerst).

## Tests

```bash
node tests/run.mjs
```

Prüft Krypto-Roundtrip und die GF(256)-Shamir-Wiederherstellung (reine Logik, ohne Browser).

## Lizenz

Noch festzulegen.
