# MANDANTEN.md — Mehrmandantenfähigkeit

> Wie BookLedgerPro mehrere Mandanten (Firmen) je Installation trennt — und warum so.
> Ergänzt `docs/NACHFOLGE_PLAN.md` (Abschnitt A, verbindlicher Design-Abschnitt) und
> `ARCHITECTURE.md`. Stand: M3 (Shell-Indikator + Verwaltung) abgeschlossen.

## Grundprinzip: 1 Mandant = 1 eigener, getrennt verschlüsselter Tresor
Statt die Datensätze eines einzigen Tresors per „Namespace" zu trennen, bekommt **jeder
Mandant einen eigenen, eigenständig verschlüsselten Tresor** (eigener DEK, eigenes Passwort,
eigene Shamir-Sicherung, eigenes Backup). Begründung:

- **Keine Kreuz-Kontamination.** Es gibt keinen gemeinsamen Klartext-Pfad zwischen Mandanten.
- **Passt zum Krypto-Modell** (Sitzungs-Key nur im RAM, je Tresor ein DEK).
- **Schützt die Datendurabilität** (Regel #2): Backups/Shamir sind je Mandant getrennt.

## Speichertrennung über DB-Namens-Präfix — Suffix bleibt
Die Trennung geschieht über einen **Mandanten-Präfix im IndexedDB-Namen**. Das app-weite
Suffix `bookledgerpro` bleibt dabei **unverändert** (Regel #3 → keine Origin-Kollision mit
Geschwister-Apps auf GitHub Pages).

| Mandant | DB-Name (`dbNameFuer(id)`) | Hinweis |
|---|---|---|
| Legacy/Default (ID `standard`) | `blpr_bookledgerpro` | unverändert → **migrationsfrei** |
| weiterer Mandant `<id>` | `blpr_<id>_bookledgerpro` | `<id>` = 8 Hex-Zeichen |

Jeder Name endet auf `bookledgerpro`. Der bestehende Einzel-Tresor von Bestandsnutzern
behält exakt seinen alten DB-Namen und wird beim ersten Boot migrationsfrei als „Mandant 1"
(ID `standard`) in die Registry aufgenommen.

## Die Registry (Mandanten-Liste)
Die Liste der Mandanten muss **vor** dem Entsperren lesbar sein (Auswahl am Sperrbildschirm).
Sie liegt deshalb in einer **eigenen, UNVERSCHLÜSSELTEN** kv-DB:
`blpr_mandanten_bookledgerpro` (`REGISTRY_DB_NAME`), getrennt von den verschlüsselten
Tresor-DBs.

Datenmodell: `{ mandanten: [{ id, name, erstellt }], aktiv }`.

> **DSGVO-Hinweis:** Weil die Registry unverschlüsselt ist, sind die **Mandanten-Namen**
> unverschlüsselt auf dem Gerät. Die App weist im UI darauf hin und erzwingt keine
> personenbezogenen Pflichtangaben im Namen. Die **Tresor-Inhalte** jedes Mandanten bleiben
> verschlüsselt.

## Bedienung (Nutzer-Sicht)
- **Auswählen / Anlegen (Sperrbildschirm):** Bei mehr als einem Mandanten erscheint vor dem
  Entsperren eine Auswahlliste. „+ Neuer Mandant" legt einen Namen an und startet das
  Onboarding (eigenes Passwort/Shamir/Backup) in einer neuen, leeren Tresor-DB.
- **Aktiver Mandant im Header (M3):** Der Kopf zeigt den **Namen** des geöffneten Mandanten
  (nicht mehr die DB-ID).
- **Mandant wechseln (M3):** Knopf im Kopf (nur sichtbar bei > 1 Mandant). Verwirft den
  Sitzungs-Key (DEK) und bootet neu — der Boot zeigt dann die Auswahl, von der aus der
  Ziel-Mandant gewählt und entsperrt wird.
- **Verwalten (Einstellungen → „Mandanten verwalten", M3):**
  - **Umbenennen** — ändert nur den Anzeigenamen in der Registry.
  - **Entfernen** — nur mit Bestätigung; nimmt den Mandanten **aus der Liste**, **löscht aber
    die Tresor-DB NICHT** (kein Datenverlust). Der **aktuell geöffnete** Mandant kann nicht
    entfernt werden (erst wechseln).

## Code-Landkarte
- `src/domain/mandanten.js` — **reine** Schicht (node-getestet): Registry-Datenmodell,
  `aktiverMandant`, immutable Ops (`addMandant`/`umbenenneMandant`/`entferneMandant`/
  `setzeAktiv`/`findeMandant`), `validateMandantName`, `neueMandantId`, `dbNameFuer`,
  `mitLegacyMandant`, `brauchtMandantenAuswahl`, `mandantenAuswahlListe`.
- `src/core/db.js` — aktive Tresor-DB konfigurierbar (`getActiveDbName`/`setActiveDbName`/
  `closeDb`), Default = Legacy, Suffix-Schutz.
- `src/core/mandantenStore.js` — IndexedDB-Glue (statisch geprüft): `ladeRegistry`/
  `speichereRegistry`/`initMandanten`/`registriereMandant`/`wechsleAktivenMandant`.
- `src/ui/lock.js` — Auswahl/Anlage/Wechsel am Sperrbildschirm (M2b).
- `src/ui/shell.js` — Header-Indikator (Name), „Mandant wechseln", Einstellungs-Sektion
  „Mandanten verwalten" (M3).

## Ehrlich offen / Grenzen
- **Glue-/UI-Pfade (DOM/IndexedDB) sind statisch geprüft**, nicht headless-E2E getestet
  (kein Headless-Browser in der Bau-Umgebung). Die reine Registry-Logik ist node-getestet.
- **Entfernen ist „aus der Liste nehmen", kein Löschen.** Es gibt (noch) keine UI, um eine
  nicht mehr gelistete, aber vorhandene Tresor-DB wieder zu importieren/auswählen. Ohne
  gesicherte Schlüssel (Shamir/Backup) ist ein entfernter Mandant danach ggf. nicht wieder
  zugänglich. Echtes Löschen der Tresor-Daten ist bewusst nicht Teil von M3.
- **Settings/Stammdaten sind pro Tresor** (Firmenprofil, DATEV-Nr., USt-Einstellungen liegen
  verschlüsselt im jeweiligen Mandanten-Tresor) — also je Mandant getrennt, wie gewünscht.
