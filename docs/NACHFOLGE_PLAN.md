# NACHFOLGE_PLAN.md — Geordneter Mehr-Sitzungs-Plan (eine PR pro Sitzung)

> **Brief an die nachfolgenden Sitzungen.** Jede Sitzung erledigt **genau einen** Schritt unten
> als **eine** PR, sauber und fehlerfrei, und endet mit einem **Abschlussbrief** (siehe Ritual),
> damit die nächste Sitzung **konfliktfrei** startet. Ergänzt `docs/PULS.md` (START HIER) und
> `docs/OFFENE_PUNKTE.md`. Stand: 2026-06-17. Tests-Basis: **651/651 grün**, SW `v79`.

## Sitzungs-Ritual (verbindlich, jede Sitzung)
1. `git fetch origin main && git reset --hard origin/main` (Branch `claude/v2-ox8bu7`).
2. **Genau einen** Schritt unten umsetzen — **reine Logik zuerst node-getestet**, dann UI.
   Lieber feiner schneiden als überstürzen; **keine halben/unschlüssigen Codepfade** hinterlassen.
3. `node tests/run.mjs` muss **grün** bleiben/werden. `CACHE_VERSION` in `sw.js` erhöhen, neue Module precachen.
4. **Draft-PR → ready → CI grün → squash-merge** (Freibrief), dann `git reset --hard origin/main`.
5. **Abschlussbrief:** `PULS.md` „START HIER" auf nächsten Schritt + Kopf-Status (v-Nr./Tests) aktualisieren;
   diese Datei: erledigten Schritt abhaken; `SESSIONS.md` obersten Eintrag schreiben; `OFFENE_PUNKTE.md` pflegen.
6. **Eine Sitzung = eine PR.** Danach Stopp.

> Sicherheit vor Tempo: Wenn ein Schritt größer wird als gedacht, **in Teil-PRs splitten** (z. B. M2a/M2b)
> und den Plan hier entsprechend fortschreiben — nie einen Schritt „halb" mergen.

---

## A) Mehrmandantenfähigkeit (Architektur: **mehrere getrennte Tresore**, 1 Mandant = 1 Tresor)
> Begründung: getrennte verschlüsselte Tresore statt Record-Namespacing → **keine Kreuz-Kontamination**,
> passt zum Krypto-Modell, schützt die Datendurabilität (Regel #2). **DB-Suffix `bookledgerpro` bleibt.**
> Trennung über einen **Mandanten-Präfix in den IndexedDB-Namen** bzw. eine Mandanten-Registry.

- [ ] **M1 — Fundament (rein + Design).** `docs/db.js`/`vault.js` analysieren. Neues `domain/mandanten.js`
  (rein, node-getestet): Registry-Datenmodell `{id, name, erstellt}`, `aktiverMandant`, Helfer für den
  **Speicher-Präfix je Mandant** (z. B. DB-/Store-Namensbildung) **ohne** das DB-Suffix `bookledgerpro`
  zu ändern. **Noch keine** Tresor-Umverdrahtung — nur die reine Schicht + Tests + kurzer Design-Abschnitt
  in dieser Datei. (Klein, sicher.)
- [ ] **M2 — Tresor je Mandant + Auswahl am Sperrbildschirm.** `lock.js`/`vault.js`: bestehenden Einzel-
  Tresor **migrationsfrei** als „Mandant 1" registrieren; Mandant **anlegen** (eigenes Passwort/Shamir/Backup)
  und **auswählen/wechseln**. Sorgfältig: Sitzungs-Key beim Wechsel sauber verwerfen. UI statisch geprüft.
- [ ] **M3 — Shell-Indikator + Verwaltung.** Aktiver Mandant sichtbar (Header), „Mandant wechseln" + in
  Einstellungen „Mandanten verwalten" (umbenennen/entfernen — Entfernen nur mit Bestätigung, Daten bleiben
  im jeweiligen Tresor). Doku `docs/MANDANTEN.md`.

## B) Bilanzierung (zweite Gewinnermittlungsart neben EÜR)
> Begründung: GmbH/OHG brauchen GuV + Bilanz (§4 Abs.1/§5 EStG). Modus-Schalter, Bestandskonten-Vortrag.

- [ ] **B1 — Modus + Kontengrundlage.** Setting `gewinnermittlung: 'euer'|'bilanz'` (Default `euer`,
  bestehende Nutzer unverändert). Konten-Seed um Bilanz-Grundkonten ergänzen falls nötig; Saldenvortrag/
  Eröffnungsbilanzkonto (z. B. 9000 vorhanden). Reine Klassifikation node-getestet. Minimale UI (Schalter).
- [ ] **B2 — GuV.** `domain/bilanz.js` (rein, node-getestet): `gewinnUndVerlust(buchungen, idx, periode)`
  → Erträge/Aufwendungen gegliedert, Jahresüberschuss; Ansicht + CSV.
- [ ] **B3 — Bilanz.** `bilanz(buchungen, idx, stichtag, eröffnungssalden)` → Aktiva/Passiva aus den
  Bestandskonten-Salden, Summengleichheit (Aktiva = Passiva), Eröffnungs-/Schlussbilanzkonto; Ansicht + CSV.
  Ehrlich: keine Konzernabschlüsse/E-Bilanz-Taxonomie — als Grenze dokumentieren.

## R) Rest-SOLL (nach A+B, Reihenfolge nach Bedarf)
- [ ] **R1** Verzugszinsen/Mahngebühren **buchen** (A1-Rest): Konto-Mapping + USt-Behandlung (manuell, kein Auto-Buchen).
- [ ] **R2** Skonto-Buchung mit **USt-/Vorsteuer-Korrektur §17 UStG** (A3-Rest); Sammelzahlungen (eine Zahlung, mehrere Rechnungen).
- [ ] **R3** Verbindlichkeiten aus **Foto/PDF-Belegen** + eigene Verbindlichkeiten-Ansicht (A2-Rest); Zahlungsziel je Rechnung (A1-Rest).
- [ ] **R4** A4 **Stufe 2**: Rechnungs-Übernahme (statt nur Auftrag) + optional API/Push; reziproke WorkFloh-Verlinkung schärfen.
- [ ] **R5** Bankformate härten (CAMT .052/.054, SWIFT-Validierung), NER (PII über Anker hinaus), dreistufiger Briefkasten (P7).
- [ ] **R6 [KANN]** ZUGFeRD-**Erzeugen** (nur falls build-frei lösbar), Lighthouse, lokales OCR, Privat-/Bürger-Modus, Sage 5b–d.

---

## Bereits erledigt (zur Orientierung, NICHT erneut bauen)
Profi-Readiness **V1–V10** · **A1–A3** · Entscheidungen 2026-06-17 (ELSTER-Link, AVV-Links, §19-Onboarding,
abw. Wirtschaftsjahr, Übergabe-Datenblatt, GoBD-Aufbewahrung, ZUGFeRD-Empfang+KoSIT, A4 offene Anbindung Stufe 1).
Details: `docs/OFFENE_PUNKTE.md` + `docs/SESSIONS.md`.
