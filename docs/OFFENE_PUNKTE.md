# OFFENE PUNKTE — unbedingt beachten · nacharbeiten · verbessern

> **Lebende Merkliste.** Hier wird festgehalten, was wichtig ist, noch fehlt, nachgearbeitet
> oder verbessert werden muss — damit über Sitzungen hinweg nichts verloren geht. Ergänzt
> `ROADMAP.md` (Phasen), `docs/PULS.md` (Stand/Leitbild) und `docs/SESSIONS.md` (Verlauf).
> Erledigte Punkte abhaken und ins SESSIONS-Log verschieben. Letzte Pflege: **2026-06-16**.

Legende: **[MUSS]** wichtig/rechtlich oder für Kernnutzen · **[SOLL]** deutlicher Mehrwert ·
**[KANN]** später/optional.

---

## A. HOCH — unbedingt beachten / als Nächstes

### A1. Mahnwesen & überfällige Forderungen — **Kern erledigt ✓, Rest offen**
**Erledigt (PR #53):** `src/domain/mahnwesen.js` (rein, node-getestet): Fälligkeit
(Rechnungsdatum + Zahlungsziel), Überfälligkeit, Mahnstufen, Verzugszinsen (§288 BGB),
40-€-Pauschale, `mahnschreibenDaten()`. Sichtbar in **Auswertungen** → Karte „Offene Forderungen
& Mahnwesen" (überfällig-Badge + Summe) inkl. **druckbarem Mahnschreiben**. Einstellungen
`zahlungszielTage` (14) + `verzugBasiszinsProzent` (§247 BGB, aktuell halten!).
**B2B/Verbraucher je Kunde erledigt (2026-06-16):** Kunden-Flag `istVerbraucher` (crm-store +
Kundenformular/-liste); `mahnwesen.kundeIstB2B()` (rein, node-getestet); das Mahnschreiben nutzt
nun den Aufschlag je Kunde (Unternehmer +9, Verbraucher +5 %-Punkte) und die 40-€-Pauschale nur
bei Unternehmern. Default konservativ B2B. SW `v60`.
**Noch offen [SOLL]:** **Mahnstufe persistent** je Forderung (statt nur abgeleitet), **Buchung**
von Zinsen/Gebühren als Ertrag (Konto-Mapping + USt-Behandlung), Eingangsrechnungs-Verzug
(Gegenseite), Zahlungsziel je Rechnung statt global.

**Warum (Ausgangslage):** Eine offene Rechnung mit abgelaufener Frist muss sofort sichtbar sein,
damit man nachmahnen kann — siehe jetzt Auswertungen.

Konkret nachzuarbeiten:
- **Fälligkeit je Rechnung:** Zahlungsziel (z. B. 14 Tage) → `faelligAm = rechnungDatum + Ziel`.
  Pro Firmenprofil/Auftrag konfigurierbar; Default hinterlegen.
- **Überfälligkeit automatisch erkennen & markieren:** offene Forderung mit `faelligAm < heute`
  → Status/Badge **„überfällig (N Tage)"** — sichtbar in **Dashboard** (Kennzahl „überfällige
  Forderungen", Summe + Anzahl), in der **Auftrags-/Forderungsliste** und idealerweise als
  **Offene-Posten-Liste (OP-Liste)**.
- **Mahnstufen** (branchenüblich): Zahlungserinnerung → 1. Mahnung → 2. Mahnung → 3. Mahnung
  (ggf. „letzte Mahnung/Inkasso-Androhung"). Stufe + Datum je Forderung mitführen.
- **Mahngebühren & Verzugszinsen** korrekt nach Recht:
  - Verzugszinsen **§ 288 BGB**: B2B (kein Verbraucher) **9 Prozentpunkte über Basiszinssatz**,
    Verbraucher **5 Prozentpunkte**; Basiszinssatz veränderlich → konfigurierbar/datierbar.
  - Pauschale **40 € (§ 288 Abs. 5 BGB)** bei B2B-Verzug möglich (Option).
  - Mahngebühren maßvoll/ortsüblich; transparent ausweisen.
- **Mahnschreiben erzeugen** (druckbar/PDF, analog zur §14-Rechnung): Bezug auf Rechnung(en),
  offener Betrag, neue Frist, ggf. Zinsen/Gebühren, Pflicht-/Höflichkeitstext je Stufe.
- **Buchung:** Mahngebühren/Verzugszinsen als sonstige Erträge buchen (Konto-Mapping SKR03,
  z. B. Zinserträge/sonstige betriebliche Erträge); USt-Behandlung beachten (Verzugszinsen
  i. d. R. nicht steuerbar, Mahngebühren als Schadenersatz strittig → konservativ + Hinweis
  „im Zweifel Berater").
- **Reine, node-testbare Kernlogik** zuerst: `faelligkeit()`, `istUeberfaellig()`,
  `mahnstufeVorschlag()`, `verzugszinsen(betrag, tage, basiszins, b2b)`, `mahnschreibenDaten()`.
  Danach UI (Dashboard-Kennzahl, OP-Liste, Mahnung-Button) — UI als nicht-headless-E2E kennzeichnen.

### A2. Verbindlichkeiten als Posten-Quelle für den Zahlungsabgleich — **erledigt ✓**
**Erledigt (2026-06-16):** `src/domain/payables.js` (rein, node-getestet) + `payables-store.js`
(verschlüsselt via `encstore`):
- `eingangsrechnungZeilen()` — Eingangsrechnung „auf Ziel" buchen: Aufwand + abziehbare
  Vorsteuer **an** Verbindlichkeiten aus L+L (1600), mehrere USt-Sätze/Aufwandskonten, ausgeglichen.
- **`offeneVerbindlichkeiten()`** — leitet offene Kreditoren-Posten ab (Brutto − Zahlungen,
  Stichtag-fähig, nach Fälligkeit sortiert) **im selben Posten-Format wie**
  `zahlungsabgleich.offenePosten()`, aber `richtung:'ausgabe'` + `kind:'verbindlichkeit'`;
  `betragCent` = offener Rest (Teilzahlung-tauglich). Damit greifen `findeOffenePosten()` und
  `zahlungsBuchungZeilen()` (Verbindlichkeit an Bank) direkt.
- `rechnungStatus` (offen/teilbezahlt/bezahlt/storniert), Zahlungen, Storno, Validierung.
- **UI** (`documents.js`): E-Rechnung-Empfang bietet **„+ Als offene Verbindlichkeit erfassen"**
  (speichert Kreditorenrechnung + bucht „auf Ziel" als Entwurf); der **Bankimport** lädt jetzt
  Forderungen **und** Verbindlichkeiten als Posten → Ausgangszahlungen werden offenen
  Verbindlichkeiten zugeordnet und als „Verbindlichkeit an Bank" gebucht + Zahlung vermerkt.
- 40 Node-Tests; `node tests/run.mjs` **393/393 grün**. SW-Cache `v57`.

**OP-Liste erledigt (2026-06-16):** Auswertungen-Karte **„Offene Verbindlichkeiten (Kreditoren)"**
(`reports.js` + `payables.anreichereVerbindlichkeiten`/`verbindlichkeitenSummen`): offene Posten
mit Fälligkeit (rechnungseigene `faelligAm`, sonst Datum + Zahlungsziel), **Überfällig-Badge**,
Summe + überfällige Summe, **CSV-Export der OP-Liste** (`export.buildOffeneVerbindlichkeitenCsv`).
Node-getestet; SW `v58`.

**Noch offen [SOLL]:** **Skonto** (Zahlungsbedingungen je Rechnung), Verzug der Gegenseite
(Eingangsrechnungs-Mahnung erhalten/prüfen); Teilzahlungs-Matching (siehe A3); Erfassung von
Verbindlichkeiten auch aus **Foto/PDF-Belegen** (heute aus E-Rechnung-XML); eigene
**Verbindlichkeiten-Ansicht** zum manuellen Anlegen/Bearbeiten (heute nur via E-Rechnung-Import).

### A3. Teilzahlungen & unscharfes Matching — **Kern erledigt ✓ (Verbindlichkeiten), Rest offen**
**Erledigt (2026-06-16):** `zahlungsabgleich.findeKandidaten()` (rein, node-getestet) liefert
**gerankte** Kandidaten mit Art `exakt` / `toleranz` (Rundungs-Cent) / `skonto` (Zahlung knapp
unter offen, ≤ skontoProzent — als **Hinweis**) / `teilzahlung` (Rest bleibt offen);
Überzahlungen werden konservativ nicht zugeordnet, Mehrdeutigkeit über Score (Referenz/Name/
Datumsnähe). **UI** (Bankimport): bei Verbindlichkeiten ohne exakten Treffer Knopf
**„◑ Teilzahlung verbuchen"** → bucht den gezahlten Betrag (Verbindlichkeit an Bank) + vermerkt
die Teilzahlung; Skonto wird als Hinweis gezeigt. `findeOffenePosten` (exakt) bleibt unverändert.

**Noch offen [SOLL]:**
- **Teilzahlungen bei Forderungen** (Aufträge führen bisher nur Status, keinen Rest) — dafür
  Restbetrags-Tracking je Auftrag/Forderung nötig.
- **Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG)** — bewusst NICHT automatisiert
  (Korrektheit vor Bequemlichkeit); heute nur Hinweis, manuelle Buchung.
- **Sammelzahlungen** (eine Zahlung auf mehrere Rechnungen), Score-Schwelle mit expliziter
  Mehrfach-Auswahl in der UI.

---

## B. MITTEL — Mehrwert / Härtung

- **[SOLL] E-Rechnung gegen KoSIT validieren:** aktuell „XRechnung-/EN16931-**orientiert**", nicht
  validiert. Vor produktivem Versand extern (KoSIT-Validator/Schematron) prüfen; ggf. Validierung
  in CI/als Hinweis verankern. **Keine** Konformität behaupten, die nicht belegt ist.
- **[SOLL] ZUGFeRD:** eingebettete CII-XML aus **PDF/A-3** auspacken (Empfang) bzw. einbetten
  (Versand). Braucht PDF-Handling → prüfen, ob build-frei machbar.
- **[SOLL] Bankformate härten:** keine vollständige **SWIFT-(MT940)/ISO-20022-(CAMT)**-Validierung;
  reale Bank-Dialekte testen; weitere CAMT-Varianten (.052/.054), Strukturierte RmtInf.
- **[SOLL] DATEV-EXTF:** „EXTF-orientiert", **nicht** das zertifizierte 116-Spalten-Format;
  Steuerschlüssel-Mapping nur Standardsätze → mit Berater/DATEV verifizieren.
- **[SOLL] PII-Erkennung über Anker hinaus (NER):** heute anker-basiert (nur bekannte Stammdaten).
  Unbekannte Dritt-Namen in Fremdbelegen werden nicht erkannt → optionale lokale NER vormerken.
- **[SOLL] Dreistufiger Briefkasten** (Mandant ⊃ Firma ⊃ Person) für Pseudonymisierung/CRM
  (P7); heute flache Anker, 1 Tresor = 1 Mandant.
- **[SOLL] UI end-to-end testen:** kein Headless-Browser in der Bau-Umgebung → DOM-/IndexedDB-Pfade
  sind nur statisch geprüft. Manuelle Sichttests dokumentieren oder Headless-E2E einführen.

---

## C. NIEDRIG / SPÄTER

- **[KANN] ELSTER/ERiC-Einreichung** der USt-VA (heute nur Datenpaket; nicht build-frei →
  Architekturentscheidung).
- **[KANN] Lokales Offline-OCR** (z. B. Tesseract.js) als Vision-Alternative/Fallback.
- **[KANN] Privat-/Bürger-Modus** (vereinfachte Oberfläche für Privatpersonen/Vereine) — baut auf
  dem Pseudonymisierungs-Enabler auf.
- **[KANN] Sage-Mycel 5b–d:** echte Spore deployen, Hub-Registrierung, Handshake, Symbiose-Import.
- **[KANN] Performance/Lighthouse** messen.
- **[KANN] Mehrmandantenfähigkeit** (mehrere Firmen je Installation).

---

## D. Disziplin / Architektur — beim Bauen immer beachten (aus CLAUDE.md)

- **Build-frei bleiben** (native ES-Module, keine Bundler/CDNs/npm-Runtime-Deps).
- **DB-Suffix `bookledgerpro` nie ändern** (gemeinsamer Origin auf GitHub Pages).
- **`CACHE_VERSION` in `sw.js` erhöhen** bei jeder Shell-Änderung; neue Module ins Precache.
- **Krypto-Disziplin:** Sitzungs-Key nur im RAM; Klartext nie ohne Bestätigung; **aktive KI strikt
  EU** (Vision EU + Mistral EU), **Nicht-EU bleibt dormant/nicht auswählbar**.
- **Recht ist Architektur** (GoBD-Festschreibung/Hash-Kette, DSGVO, USt/EÜR) — nicht aufpfropfen.
- **Ehrlichkeit:** keine vorgetäuschte Konformität; „orientiert/nicht zertifiziert" klar benennen;
  ungetestete (DOM/IndexedDB) Teile kennzeichnen; `node tests/run.mjs` muss grün sein.
