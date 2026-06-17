# Datensicherung & Wiederherstellung — Anforderungs-Dokument

> **Status: ANFORDERUNG / DESIGN.** Datendurabilität ist **Pflicht-Feature #1** (CLAUDE.md Regel #2:
> „Niemals einen Pfad bauen, der Daten allein IndexedDB anvertraut."). Dieses Dokument hält die
> **verbindlichen** Sicherungs-Anforderungen fest (Nutzer-Gespräch 2026-06-17). Über Sitzungen pflegen.

## Leitsatz
Wenn die Datensicherung versagt, sind **alle Daten verloren — das darf nicht passieren.** Deshalb:
**mehrere unabhängige Sicherungs-Stellen (3-2-1-Prinzip), verschlüsselt, und eine Wiederherstellung,
die beweisbar getestet ist.**

## Was heute schon real existiert (`src/core/backup.js`, geprüft)
- **Verschlüsselte Backup-Datei** `bookledgerpro-backup-<datum>.blpr.json` — gesamter Bestand,
  passwortverschlüsselt (AES-GCM; Format „adaptiert aus Mein-Tresor"). `exportBackupFile(passwort)`.
- **Wiederherstellen:** `readBackup` + `importSnapshot` (Modus `replace` ersetzt / `merge` ergänzt, id-basiert).
- **Onboarding erzwingt das erste Backup** (`markBackupDone`); zusätzlich **Shamir 2-von-3** + `storage.persist()`.

## Sicherungs-Stellen (3-2-1-Prinzip) — Stelle 2/3 ausbauen
1. **BLP intern** — IndexedDB + `storage.persist()` (Live-Kopie, kein Backup für sich).
2. **Verschlüsselte Backup-Datei in einem gewählten Ordner** (re-importierbar) — existiert; auszubauen:
   prominenter Knopf, **gemerkter Ziel-Ordner** (File System Access auf Desktop/DeX; Tablet → Download-Ordner),
   **Drag-and-drop-Wiederherstellung** (Datei in die App ziehen → entschlüsseln → importieren).
3. **Server-Kopie** — der später geplante **eigene Server**; bis dahin ersetzbar durch einen
   **synchronisierten Ordner** (Netzlaufwerk/private Cloud) als Offsite-Kopie.

## ★ Nutzer-Entscheidung 2026-06-17 — Sicherungs-Strategie ist WÄHLBAR
Die Sicherung wird **nicht erzwungen-einheitlich**, sondern ist eine **freie Nutzer-Wahl** — beim
**Onboarding** abgefragt **und in den Einstellungen jederzeit änderbar** (gleiches Muster wie
`rechnungsstelle`/`nutzungsmodus`):
- **Setting (Vorschlag) `backupStrategie`** — frei kombinierbare Ziele, z. B. `{ datei: true,
  ordner: '<gewählt>', server: '<url|aus>', erinnerung: 'taeglich|woechentlich|aus' }`.
- Beispiele: der eine nutzt **nur die verschlüsselte Datei** + Erinnerung; der andere hat einen
  **Server** und bevorzugt den; ein dritter will **beides** (Datei-Ordner **und** Server).
- **Default sicher:** mindestens die verschlüsselte Datei + Onboarding-Erst-Backup (wie heute) —
  niemand startet ohne irgendeine Sicherung.
- Die **Prominenz/Anzahl der Knöpfe** richtet sich nach der Wahl (wer keinen Server hat, sieht keinen
  Server-Knopf). Sicht­barkeit der aktiven Sicherung bleibt immer deutlich.

## „Gegen jeden Zweifel getestet" — Backup→Restore-Roundtrip-Selbsttest
Damit „funktioniert die Rettung wirklich?" **bewiesen** ist (nicht behauptet):
- Die App baut ein Backup → entschlüsselt es → importiert in einen Probespeicher → **vergleicht
  byte-genau** mit dem Original → ✓/✗. Hängt sich an den vorhandenen **„Selbsttest"** (V10).
- **Build-frei + node-testbar.** (Reine Logik: build/read/import + Vergleich.)

## Ehrliche Grenzen (nicht beschönigen)
- **Redundanz ist die Garantie**, kein einzelner Knopf: mindestens **zwei unabhängige Kopien**, eine
  außer Haus. Sind **alle** Kopien zerstört, kann keine Software zaubern.
- **Passwort-Nuance:** ein altes Backup braucht das **damals gültige** Passwort (Hinweis beim Passwortwechsel).
- **Server-Stelle ist Zukunft** (eigener Server); bis dahin synchronisierter Ordner als Offsite.
- **Keine Hintertür:** Verlust von Datei **und** Gerät **und** Passwort/Shamir = Daten weg (gewollt, Krypto-Disziplin).

## Bau-Reihenfolge (Vorschlag, je eigener PR)
1. **Backup→Restore-Roundtrip-Selbsttest** (build-frei, node-getestet) — höchste Priorität (Pflicht #1).
2. **UX:** prominenter Backup-/Restore-Bereich, **gemerkter Zielordner**, Drag-and-drop-Restore.
3. **`backupStrategie`-Setting** (Onboarding + Einstellungen) — freie Wahl der Ziele/Erinnerung.
4. **Server-Ziel** (sobald eigener Server existiert) bzw. synchronisierter-Ordner-Ziel.

## Bezug
Ergänzt `docs/SAGE_BROWSER_LEHREN.md` (Browser-Lehre 2: Pages-`spore.json` ist KEIN Backup) und
`docs/KALKULATION_KATALOG.md` (gleiches „Wahl beim Onboarding + änderbar"-Muster wie `rechnungsstelle`).
