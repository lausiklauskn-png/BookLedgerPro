# LOHN.md — Lohn-Buchungskern (V-Lohn, BAUPLAN Block 4)

> Stand 2026-06-18 · SW `v140` · Tests `1754/1754` grün. Nutzer-Entscheidung 2026-06-18:
> Scope = **„Lohn-Buchungskern"** (nicht volle Lohnabrechnung).

## Was es ist — und was es NICHT ist

**BookLedgerPro ist die prüfungssichere Buchhaltungsschicht für die Lohnabrechnung, NICHT die
Abrechnung selbst.** Du gibst die **bereits berechneten** Beträge ein (aus der Entgeltabrechnung
des Lohnbüros/Steuerberaters/Lohnprogramms); BLP **bucht** sie GoBD-sicher (Brutto-Methode),
führt ein **Lohnkonto** je Mitarbeiter, bündelt die **Lohnsteuer-Anmeldung** je Monat und zeigt
die **noch abzuführenden** Lohnabgaben.

**Bewusst NICHT enthalten** (eigenes, zertifizierungspflichtiges Produkt — nicht build-frei):
- automatische **Brutto→Netto-Berechnung** (amtliche Lohnsteuertabellen, SV-Beitragssätze),
- **ELStAM**-Abruf, **SV-Meldungen (DEÜV)**, **Beitragsnachweise**,
- ELSTER/ERiC-**Direktversand** (nur Datenpaket zum Download).

## Buchungslogik (Brutto-Methode, SKR03)

`domain/lohnbuchung.js` (rein, node-getestet). Ein Lohnlauf wird so gebucht:

| Seite | Konto | Betrag |
|------|-------|--------|
| Soll | 4120 Gehälter (bzw. 4110 Löhne) | Bruttoarbeitslohn |
| Soll | 4130 Gesetzliche soziale Aufwendungen | Arbeitgeber-Anteil SV |
| Haben | 1200 Bank (oder 1740 „auf Ziel") | Netto-Auszahlung |
| Haben | 1741 Verb. Lohn-/Kirchensteuer | Lohnsteuer + SolZ + Kirchensteuer |
| Haben | 1742 Verb. soziale Sicherheit | SV Arbeitnehmer- + Arbeitgeber-Anteil |

Rechnerisch ausgeglichen: `Soll = Brutto + AG-Anteil = Haben` (cent-genau, da
`Netto = Brutto − Steuern − AN-Anteil`).

**Seed-Konten** (`domain/accounts.js`): 4110, 4120, 4130, 1740, 1741, 1742, 1200.

## Workflow (Ansicht „Lohn", nur Firmen-/Vereinsmodus)

1. **Lohnlauf erfassen** — Mitarbeiter, Abrechnungsmonat, Brutto + Lohnsteuer/SolZ/KiSt +
   SV-Anteile (AN/AG), Auszahlungsweg. Live-Vorschau zeigt Netto + Soll=Haben.
2. **„Buchen (Entwurf)"** — erzeugt den Buchungs-Entwurf (Datum = Monatsletzter). **Festschreiben
   bleibt manuell im Journal (GoBD).**
3. **Lohnsteuer-Anmeldung (je Monat)** — summiert LSt+SolZ+KiSt → **Datenpaket-Download** (CSV,
   Kennzahlen-orientiert) + ELSTER-Link. Kein Direktversand.
4. **Abzuführende Lohnabgaben (offen)** — offener Saldo 1741 (Finanzamt) + 1742 (SV-Träger) aus den
   **festgeschriebenen** Buchungen; „Als bezahlt buchen (Entwurf)" bucht Soll 1741/1742 an Bank.
5. **Lohnkonto** — Jahressummen je Mitarbeiter (Brutto/Netto, Anzahl, Monate).

## Reine Logik (node-getestet) — Übersicht

`domain/lohnbuchung.js`:
- `lohnBuchungZeilen` / `lohnBuchungEntwurf` / `validateLohnlauf` / `lohnNettoCent`
- `normalizeLohnlauf` / `lohnkontoAggregat` / `lohnlaufBuchungsdatum`
- `lohnsteuerAnmeldung`
- `offeneLohnabgaben` / `lohnabgabeZahlungZeilen` / `lohnabgabeZahlungEntwurf`

`domain/lohn-store.js` (verschlüsselt via encstore, DSGVO): `saveLohnlauf` / `listLohnlaeufe` /
`getLohnlauf` / `deleteLohnlauf` / `bucheLohnlauf` / `bucheLohnabgaben`.

`domain/export.js`: `buildLohnsteuerAnmeldungPaket`.

UI: `ui/views/lohn.js` (NAV „Lohn"; in privat/verein ausgeblendet).

## Test-Modus

Lohn nutzt den normalen verschlüsselten Speicherweg (`encstore`/`store`). Damit funktioniert das
Feature **automatisch im Test-Modus** (Sandbox-Tresor) mit — ohne Extra-Verdrahtung
(siehe `docs/TEST_MODUS.md`).

## Ehrliche Grenzen

- Beträge werden **wie eingegeben** gebucht (keine Plausibilisierung gegen Tabellen/Beitragssätze).
- Kirchensteuer wird **nicht nach Konfession (ev/rk)** aufgeteilt; die genauen amtlichen Kennzahlen
  und der Anmeldungszeitraum sind am ELSTER-Formular bzw. mit dem Berater zu verifizieren.
- DOM/IndexedDB-Pfad der UI ist **statisch geprüft** (kein Headless-Browser); die Kernlogik ist
  node-getestet.

## Status

BAUPLAN Block 4 (V-Lohn) **L1–L6 abgeschlossen**: L1 Buchungslogik+Konten (#158) · L2 Store/Aggregat
(#159) · L3 UI (#160) · L4 Lohnsteuer-Anmeldung-Datenpaket (#162) · L5 SV-/LSt-Zahlungsübersicht
(#163) · L6 Doku/Abschluss.
