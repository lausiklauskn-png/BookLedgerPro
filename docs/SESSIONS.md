# Sitzungs-Log

Chronologische Notizen über Sitzungen hinweg. Neueste oben. Pflicht-Felder:
**Datum · Was getan · Stand · Offen/Nächstes.**

---

## 2026-06-16 — Strategie verankert: Pseudonymisierung als Schlüssel-Enabler

**Was getan (auf Nutzerwunsch, „sehr wichtig"):** Den strategischen Kern festgehalten und
priorisiert — *Komfort UND Datenschutz zugleich* als Wettbewerbsvorteil; Vertrauen durch
technischen Beleg statt Reputation. Pseudonymisierung = **Schlüssel-Enabler (Bau-Schritt 1,
bereits gebaut)**, der freie Anbieterwahl im Einfach-Modus, einen Privat-/Bürger-Modus und das
Vertrauen freischaltet. Verankert in `docs/PULS.md` (neues §0★ Leitbild/Priorität) und in
`docs/TRANSPARENZ_ZWISCHENSTAND.html` (neuer Abschnitt §0a). 
**Offen/Entscheidung:** P2 (KI-Anbieterwahl je Modus) berührt die strenge EU-KI-Regel
(CLAUDE.md §8) → Produktentscheidung des Nutzers nötig, bevor gebaut wird.

---

## 2026-06-16 — Doku: Transparenz-/Zwischenstands-HTML aktualisiert

**Was getan:** Die kanonische, druckbare Transparenz-Doku `docs/TRANSPARENZ_ZWISCHENSTAND.html`
(vom Nutzer bereitgestellt, war veraltet: 134 Tests, Pseudonymisierung/AVV „geplant") ehrlich auf
den aktuellen Stand gebracht: **314/314 Tests**; Pseudonymisierung (§6) als **gebaut** markiert und
**wahrheitsgemäß als anker-basiert** beschrieben (nicht NER — diese Klarstellung war wichtig);
AVV (Art. 28/32) ✓; neuer §7 **E-Rechnung (erzeugen+empfangen) + Bankimport MT940**; P-Liste
(P1 ✓, P5 ✓, P7 teilweise) und §9-Stand aktualisiert. Druck-Button → PDF. Build-frei, keine
externen Ressourcen. Meine zwischenzeitlich erstellte `STATUS.html` wieder entfernt (konsolidiert).

**Ehrlich:** reines Doku-Artefakt; Statusangaben gespiegelt aus PULS/SESSIONS/ROADMAP, kein Test.

---

## 2026-06-16 — Bankimport (Schritt 1): MT940-Parser → Buchungsvorschläge

**Was getan**
- **`src/domain/bankimport.js`** (neu, rein/getestet): `parseMT940(text)` liest SWIFT-MT940
  (:25: Konto, :61: Umsatzzeile inkl. C/D/RC/RD-Vorzeichen + Valuta, :86: Verwendungszweck
  inkl. mehrzeiliger Fortsetzung + ?32/?33-Gegenname) → normalisierte Umsätze
  {valuta, betragCent, richtung, zweck, gegen}. `umsatzExtraktion()` mappt aufs
  `ai/extract`-Format (Richtung kommt verbindlich aus dem Auszug, USt-Satz offen).
- **UI:** Karte „Bankauszug importieren (MT940)" in Belegen (`documents.js`): Datei wählen →
  Umsatzliste → je Umsatz „→ Buchungsentwurf" (categorize auf Zweck, Richtung aus Auszug
  überschreibt, `buildVorschlag`, Vorschlagskarte). i18n de/en, CSS, SW `v52→v53`.
- **+11 Tests** (Lastschrift/Gutschrift, IBAN, Valuta, Zweck/Gegenname, mehrzeiliger :86:,
  Extraktion, leerer Auszug) → **314/314 grün**.

**Ehrlich offen / NICHT geprüft:** übliche MT940-Felder abgedeckt, KEINE vollständige
SWIFT-Validierung (exotische Bank-Dialekte können abweichen); UI nicht headless-E2E. USt-Satz
aus reinem Zahlungsfluss nicht ableitbar (Nutzer/Heuristik ergänzt). **Folgeschritte:**
CAMT.053 (XML, via vorhandenes block/tag-Muster), **echter Zahlungsabgleich** auf offene
Forderungen/Verbindlichkeiten (macht Ist-EÜR §4(3) + offene Posten komplett).

---

## 2026-06-16 — E-Rechnung (Schritt 2): Empfang/Einlesen (CII + UBL) → Vorschlag

**Was getan**
- **`src/domain/erechnungLesen.js`** (neu, rein/getestet): `parseEingangsrechnung(xml)` liest
  eine eingehende XRechnung in **beiden** Syntaxen (UN/CEFACT **CII** und OASIS **UBL**),
  namespace-tolerant über lokale Element-Namen + Block-Scoping (Verkäufer/Summen/Steuer).
  Extrahiert Nummer, Datum (102→ISO), Lieferant, Netto/USt/Brutto (Cent), USt-Satz, Format,
  Confidence. `eingangsrechnungExtraktion()` mappt aufs `ai/extract`-Format →
  bestehender `buildVorschlag` nutzbar. `erkenneFormat()`.
- **UI:** Karte „E-Rechnung empfangen (XRechnung XML)" in Belegen (`documents.js`): .xml wählen
  → parsen → Lieferant via `categorize` → Buchungsvorschlag (Vorschlagskarte, Autonomie/
  Datenschutz-Modus greifen mit). i18n de/en. SW `v51→v52` (+ `erechnungLesen.js` precached).
- **+15 Tests** → **303/303 grün**, darunter **CII Round-Trip** (eigene Erzeugung wieder
  eingelesen) und ein handgeschriebenes **UBL**-Beispiel + Unbekannt-Format-Fall.

**Ehrlich offen / NICHT geprüft:** best-effort Text-/Regex-Extraktion (kein Schema-Parsing,
kein CDATA/Kommentar-Handling), **nicht KoSIT-validiert**; **ZUGFeRD-PDF wird nicht ausgepackt**
(nur reine XML); UI nicht headless-E2E. Mehrsatz-Eingangsrechnungen werden auf einen
USt-Satz/Vorschlag vereinfacht (Entwurf, Nutzer prüft). **Folgeschritte:** ZUGFeRD-PDF-Extraktion
(PDF/A-3, evtl. nicht build-frei); Bankimport (CAMT/MT940) + Zahlungsabgleich.

---

## 2026-06-16 — E-Rechnung (Schritt 1): XRechnung/CII-Erzeugung aus Rechnung

**Was getan**
- **`src/domain/erechnung.js`** (neu, rein/getestet): `baueXRechnungCII(rechnung)` erzeugt aus
  dem vorhandenen Rechnungs-Dokument (`baueRechnung`) eine **UN/CEFACT CII-XML**, Profil
  EN16931/XRechnung 3.0 — mit Kern-Pflichtfeldern (Rechnungsnr. BT-1, Datum BT-2, Leistungs-
  datum, Verkäufer/Käufer + Adressen, USt-IdNr. BT-31, IBAN BT-84, Steueraufschlüsselung je
  Satz, Summen). `splitAdresse()` zerlegt Freitext-Adressen best-effort; XML-Escaping;
  Kleinunternehmer → Kategorie „E" + §19-Befreiungsgrund. `xRechnungDateiname()`.
- **UI:** Download-Knopf „XRechnung (XML)" im Rechnungs-Dokument (`orders.js`, `downloadText`).
  i18n de/en. SW `v50→v51` (+ `erechnung.js` precached).
- **+19 Tests** (Adress-Split, Regelfall 19%+7% inkl. Tag-Balance/Wohlgeformtheit & Escaping,
  Kleinunternehmer) → **288/288 grün**.

**Ehrlich offen / NICHT geprüft:** **NICHT gegen den KoSIT-Validator/Schematron geprüft**
(kein Validator in der Bau-Umgebung) — daher „XRechnung-**orientiert**", vor echtem Versand
validieren. Freitext-Adress-Split ist heuristisch (PLZ/Ort). UI-Download nicht headless-E2E.
**Folgeschritte:** ZUGFeRD (CII in PDF/A-3 einbetten — braucht PDF-Lib, evtl. nicht build-frei);
XRechnung-**Empfang** (eingehende XML parsen → Buchungsvorschlag); Bankimport (CAMT/MT940).

---

## 2026-06-16 — Datenschutz-Modi: AVV-Hinweis (Art. 28/32 DSGVO) — Topic abgeschlossen

**Was getan:** „Recht & Doku" (`ui/views/legal.js`) DSGVO-Sektion um zwei Punkte ergänzt:
**Auftragsverarbeitung (Art. 28)** — Anbieter (Google Cloud Vision, Mistral AI) sind bei
aktiver EU-KI Auftragsverarbeiter; Nutzer muss vor produktiver Nutzung mit Personendaten den
AVV/DPA abschließen, bleibt Verantwortliche/r. **Pseudonymisierung als techn. Maßnahme
(Art. 32)** — beschreibt den Datenschutz-Modus. SW `v49→v50`. Tests unverändert **269/269**
(reine Doku-Strings, keine Logik). **Datenschutz-Modi damit funktional rund** (KONZEPT §6.3).

**Ehrlich:** reine in-App-Doku, kein automatischer Test; AVV/DPA-Abschluss liegt beim Nutzer.

---

## 2026-06-16 — Datenschutz-Modi: Transparenz (§6.3) — Bericht + Vorschau

**Was getan**
- **`pseudonym.maskierungsBericht(map)`** (rein, getestet): fasst zusammen, wie viele
  Identifikatoren ersetzt wurden, aufgeschlüsselt nach Typ — **ohne Klartextwerte** (nur
  Zähler; Typ notfalls aus der Token-Form `[[TYP_N]]` abgeleitet).
- **Transparenz-Vorschau in Belegen** (`documents.js`): bei aktivem Datenschutz-Modus zeigt
  die Vorschlagskarte ein aufklappbares „🛡 N Identifikatoren pseudonymisiert an die EU-KI
  gesendet (2× Person, 1× Firma …)" samt **Vorschau des tatsächlich gesendeten Textes**
  (deterministisch dieselbe Maskierung wie der Versand). i18n de/en, CSS, SW `v48→v49`.
- **+5 Tests** → **269/269 grün**.

**Ehrlich offen / NICHT geprüft:** `maskierungsBericht` node-getestet; die UI-Vorschau
(documents.js) ist **nicht headless-E2E** geklickt. Vorschau gilt für den Kontierungs-
Belegtext (Hauptversand); die Berater-Begründung maskiert separat (kein eigener Badge).
Folgeschritte (KONZEPT §6.3): AVV-Hinweis im Datenblatt; Vision/Bild-Pfad bleibt außen vor.

---

## 2026-06-16 — Datenschutz-Modi, Bau-Schritt 2: Pipeline-Verdrahtung + Modus

**Was getan**
- **Kritische Review von `src/ai/pseudonym.js`** → gehärtet (alle Round-Trips waren schon
  korrekt): opt-in **Wortgrenzen-Modus** (`{wortgrenze:true}`, Unicode-`\p{L}` korrekt für
  ä/ö/ü/ß) gegen Teilwort-Treffer (z.B. „Anna" in „Annahme"); **First-Char-Index** (Perf statt
  O(Text×Anker)); gemeinsames **`ANKER_TYP`**-Vokabular. Standard bleibt exakt (datenschutz-
  sicherste Richtung). +7 Tests.
- **`src/ai/anker.js`** (neu): `baueAnker({kunden,mitarbeiter,firma})` (rein, getestet) baut
  typisierte Anker (PERSON/FIRMA/EMAIL/IBAN/USTID/STEUERNR/ADRESSE), entdoppelt, < 3 Zeichen
  verworfen; `ladeAnker()` zieht CRM + Firmenprofil (Browser/IndexedDB).
- **Verdrahtung:** `mistral.categorize(text, idx, {anker})` maskiert den GESENDETEN Belegtext
  (Antwort `{konto,richtung}` → kein reidentify); `berater.begruendeBuchung(kontext, {anker})`
  maskiert Beschreibung/Belegtext und **re-identifiziert** die formulierte Antwort.
  Lokale Extraktion/Vorschlag laufen weiter auf dem ECHTEN Text.
- **Setting** `datenschutzModus` (`aus`|`pseudonym`, Default `aus`) in `state.js`; Umschalter in
  Einstellungen (`shell.js`) + i18n de/en; `documents.js` lädt Anker nur bei `pseudonym` und
  reicht sie an beide KI-Aufrufe. SW-Cache `v47→v48` (+ `pseudonym.js`/`anker.js` precached).
- **Konzept nachgereicht:** `docs/KONZEPT_DATENSCHUTZ_MODI.md` (Modi + Bau-Reihenfolge §6).
- **+11 Tests** (baueAnker, Wortgrenze, Belegtext-Komposition) → **264/264 grün**.

**Ehrlich offen / NICHT geprüft:** reine Logik node-getestet; `ladeAnker()`, Settings-Schalter
und documents.js-Verdrahtung **nicht headless-E2E**, Mistral nicht live getestet. Over-Masking-
Restrisiko bei sehr kurzen/gängigen Namen (Wortgrenze mildert, Round-Trip bleibt verlustfrei).
Folgeschritte (KONZEPT §6.3): maskierten Text vor Senden anzeigen (Transparenz), AVV-Hinweis,
Vision/Bild-Pfad bleibt außen vor.

---

## 2026-06-16 — Datenschutz-Modi, Bau-Schritt 1: Pseudonym-Logik

**Was getan**
- Reines Logik-Modul **`src/ai/pseudonym.js`** angelegt (Datenschutz-Modi, Bau-Schritt 1):
  `tokenize()` ersetzt **exakte** bekannte Identifikatoren (Anker) durch **stabile** Token
  `[[TYP_N]]`, `reidentify()` macht es verlustfrei rückgängig. Longest-Match (überlappende
  Anker), Sonderzeichen-/Regex-sicher (Links-nach-rechts-Scan, kein Regex), Token-Nummern
  je Typ in Reihenfolge des ersten Auftretens, optionales `createRegistry()` für
  aufrufsübergreifend stabile Token, `normalizeAnchors()` (entdoppelt, Typ-Normalisierung).
  Kein Netz, keine Krypto im Modul — reine Abbildung; Übertragung bleibt opt-in.
- **23 Node-Tests** in `tests/run.mjs` ergänzt; nach Merge mit main → **246/246 grün**
  (Round-Trip, stabile Token, Longest-Match, Sonderzeichen, Register-Stabilität inkl.
  Präfix-Sicherheit `_1` vs `_11`, Objekt-Map in `reidentify`).
- main war beim PR-Merge weit voraus (223 Tests, SW v47, neue Module rechnung/pruefung/
  rechtsregeln/berater/importworkfloh); sauber zurückgemergt, alle Tests beider Seiten erhalten.

**Hinweis zur Vorlage:** `docs/KONZEPT_DATENSCHUTZ_MODI.md` (§6 Bau-Reihenfolge) existiert im
Repo (noch) nicht — gebaut wurde strikt nach der selbsttragenden Aufgaben-Spezifikation.
(`PULS.md §0 Brainstorming` existiert inzwischen auf main.) Diese Lücke ehrlich offen lassen.

**Offen / Nächstes:** Konzept-Doku `docs/KONZEPT_DATENSCHUTZ_MODI.md` nachreichen (Modi +
Bau-Reihenfolge festschreiben); Bau-Schritt 2 = Anker-Quelle aus CRM/verschl. Speicher
(`crm-store`) + Verdrahtung in die KI-Pipeline **vor** `ai/mistral.js` (Kontierung) und
`ai/berater.js` (Steuer-Assistent), mit opt-in/Bestätigung; reidentify auf die KI-Antwort.
**Nicht im Browser E2E getestet** — Kernlogik node-getestet.

---

## 2026-06-14 — EÜR nach Zufluss/Abfluss (§4 Abs.3 EStG, Ist-Prinzip)

**Was getan**
- `src/domain/taxes.js`: NEU `computeEURIst(buchungen, idx, periode, opts)` — Betriebseinnahmen/
  -ausgaben beim **Geldfluss** (§11 EStG, brutto), gerechnet aus Geldkonten-Bewegungen
  (Kasse/Bank). Erfasst direkte Barbuchungen **und Zahlungen früher gebuchter Rechnungen**
  (Forderung/Verbindlichkeit) zum Zahlungszeitpunkt; Privateinlagen/-entnahmen (Eigenkapital)
  zählen nicht. Reine, node-getestete Funktion.
- Reports: zusätzliche Karte „EÜR nach Zufluss/Abfluss (§4 Abs.3)"; bestehende periodengerechte
  EÜR bleibt als Soll-Sicht. i18n de/en. SW-Cache `v32→v33`.
- `tests/run.mjs`: +5 (Abfluss-Ausgabe, Rechnung zählt nicht, Zahlung als Einnahme, Privateinlage
  ausgeschlossen, Entwurf/Periode). **Gesamt 208/208 grün**.

**Verifiziert:** `node tests/run.mjs` → 208/0; `node --check`.
**EHRLICH:** vereinfachtes Ist-Modell für die üblichen Buchungsstile; Sonderfälle (durchlaufende
Posten, Anzahlungen, Sachentnahmen) nicht abgebildet — im Zweifel Berater. Geldkonten-Set
(1000/1200) und Forderung/Verbindlichkeit (1400/1600) per opts konfigurierbar.

---

## 2026-06-14 — DATEV-EXTF formkonform gehärtet (Konto/Gegenkonto + Steuerschlüssel)

**Was getan**
- `src/domain/export.js`: NEU `buildDatevExtf()` — **EXTF-Envelope** (Header `"EXTF";700;21;
  "Buchungsstapel";…` + Spaltenüberschriften) + Datenzeilen im **Konto/Gegenkonto-Brutto-Modell**.
  NEU `datevBuchungssatz()` (rein, testbar) verdichtet USt-Split-Buchungen zu EINEM Brutto-Satz
  mit **BU-/Steuerschlüssel** (SKR03: Vorsteuer 9/8, Umsatzsteuer 3/2), Belegdatum als TTMM.
- Reports-Export-Button nutzt jetzt EXTF (`EXTF_Buchungsstapel_*.csv`), Label „DATEV (EXTF)".
  Altes `buildDatevCsv` bleibt erhalten.
- SW-Cache `v31→v32`. `tests/run.mjs`: +7. **Gesamt 203/203 grün**.

**Verifiziert:** `node tests/run.mjs` → 203/0; `node --check`.
**EHRLICH (wichtig):** KEIN vollständig zertifiziertes 116-Spalten-EXTF. Steuerschlüssel-Mapping
deckt Standardsätze (0/7/19 %) ab und ist Kontenrahmen-/Versionsabhängig — **vor Übergabe mit
Berater/DATEV verifizieren**.

---

## 2026-06-14 — WorkFloh-Import (Empfangsseite) + Anleitung + ISO/IEC-Beleg + PW-Layout

**Was getan (mehrere PRs):**
- **Gebrauchsanleitung** als Menüpunkt „Anleitung" (Installations- + Schritt-für-Schritt-Teil)
  mit **Copy-Buttons** für Splitscreen. Hinweis „Beispieltexte…" in App-Grün/fett.
- **ISO/IEC-Beleg** im Siegel — korrekt als **Anbieter**-Zertifizierung (Google Cloud/Mistral),
  nicht als Eigen-Zertifikat. „Passwort ändern"-Layout (einspaltig + Abstand).
- **WorkFloh-Import (Empfangsseite)**: `src/domain/importworkfloh.js` (rein, node-getestet)
  + `crm-store.importWorkFloh` (Dedupe über externId/externNummer, USt-Ergänzung, Status
  „angelegt"); UI-Karte in Aufträgen („Aus WorkFloh importieren", JSON). Felder `externId`
  (Kunde) / `externNummer` (Auftrag) ergänzt. **Schema-Vertrag**: `docs/WORKFLOH_IMPORT.md`
  (WorkFloh exportiert dorthin — „Verknüpfung mit Buchhaltungssoftware"). +7 Node-Tests.

**Ehrlich offen:** WorkFloh-Repo war in dieser Sitzung nicht zugänglich (Scope + 403) → Schema
unilateral von BookLedgerPro definiert; WorkFloh-Seite muss darauf exportieren (oder Repo/Beispiel
nächste Sitzung). Import-Persistenz (IndexedDB) nur UI-testbar; Mapping node-getestet. SW `v47`,
Tests **223/223**.

---

## 2026-06-14 — Deckblatt/Siegel, neue 3D-Assets & „Passwort ändern" (Envelope-Krypto)

**Was getan (mehrere PRs):**
- **Deckblatt/Datenblatt** vor dem Login + Menüpunkt „Über" + **Konformitäts-Siegel** (nur
  nachprüfbare Aussagen: EU-Datenresidenz Vision EU/Mistral EU, AES-GCM-256 lokal, DSGVO/GoBD,
  Links zu echten Compliance-Programmen — KEIN erfundenes Zertifikat). Siegel auch in Recht & Doku.
- **Neue 3D-Assets:** ornamentaler Schlüssel (`onboard-key.png`) beim Passwort-Festlegen;
  Mycel-Buch-**Titelbild** (`cover.png`) oben aufs Deckblatt.
- **Tresor auf Envelope-Verschlüsselung umgestellt** (`src/core/vault.js`): zufälliger DEK
  verschlüsselt alle Daten, Passwort-KEK „wickelt" nur den DEK ein. **„Passwort ändern"** in
  den Einstellungen wickelt den DEK neu ein → **keine Daten-Neuverschlüsselung, Mandant-ID &
  Shamir bleiben stabil**. Alt-Tresore (v1) werden beim Entsperren **transparent migriert**
  (Daten unberührt, gleiche Mandant-ID). +6 Node-Tests (Envelope wrap/unwrap/PW-Wechsel).

**Ehrlich offen:** Bilder sind groß (~2 MB, optional optimieren). Envelope: bestehende v1-Migration
ist im Code node-getestet auf Krypto-Ebene; die DB-/Browser-Migration selbst nicht headless-E2E.
SW-Cache → `v42`, Tests **216/216**.

---

## 2026-06-14 — Geführter Browser-Sichttest (DeX/Chrome) + 5 Live-Fixes

**Was getan:** Kompletter, gemeinsam mit dem Nutzer durchgeführter Sichttest der neuen Features
auf der deployten PWA. **Bestätigt:** Beleg→Buchung-Pipeline end-to-end (Erkennung→Kontierung
4930/1576/1200, Konf. 90 %, Auto-Entwurf), Plausibilität/Spielraum, Entwurf-Lebenszyklus
(speichern/bearbeiten/löschen/festschreiben/storno), KI-Begründung mit §-Bezug (Mistral EU),
§14-Rechnung druckbar (Nr. 2026-0001), USt-Verprobung/EÜR-Ist/USt-VA/Audit/DATEV-EXTF,
Zeiterfassung (Std-Summe + Kosten korrekt).

**Im Test gefunden & sofort behoben (gemergt #23–#27):**
1. Storno-Endlos-Kaskade → Storno-Gegenbuchung nicht erneut stornierbar (#23).
2. KI-Begründung nannte Konto-Namen falsch → echte Kontierung mit Namen an Mistral (#24).
3. Firmenprofil „Gespeichert ✓" erschien nicht (Re-Render) → Flag überlebt Re-Render (#25).
4. Auftrag: Position entfernen fehlte + Status-Etikett umgebrochen (#26).
5. „Steuer-Assistent (Claude)/Anthropic" veraltet → **Mistral (EU)**; tote Claude-Keys raus (#27).

**Erkenntnis (kein Bug):** „0 h/0 €" beim Mitarbeiter war ein **Duplikat** „Klaus Nitzsche";
der korrekte zeigt 41h 40m / 1.250 € — Summen/Kosten rechnen korrekt.

**Verifiziert:** alles live im Browser bestätigt; `node tests/run.mjs` → 210/210; SW `v38`.
**Offen:** EXTF/EÜR-Ist sind vereinfacht (nicht zertifiziert); ELSTER-Einreichung weiterhin nur
Datenpaket; Sage 5b–d. Optional: Kleinbetrag-`betragCent` an KI-Begründung der UI verdrahten.

---

## 2026-06-14 — Rechtsregel-Set erweitert (mehr §-Grundlagen für KI-Berater)

**Was getan**
- `src/domain/rechtsregeln.js`: +7 kuratierte Regeln — Arbeitszimmer/Homeoffice (§4(5) 6b/6c),
  Fortbildung (§4(4)), Anlagevermögen/AfA >800 € (§7), Betriebsveranstaltung 110 € (§19(1)1a),
  nicht abziehbar: Bußgelder/privat (§4(5)8 / §12), Kleinbetragsrechnung ≤250 € (§33 UStDV,
  betragsbasiert). Bessere Grounding-Abdeckung für `begruendeBuchung`.
- `tests/run.mjs`: +5 (Fortbildung, Arbeitszimmer, Bußgeld, Kleinbetrag-Grenze). **196/196 grün**.

**Verifiziert:** `node tests/run.mjs` → 196/0; `node --check`.
**Hinweis:** UI reicht aktuell `betragCent` nicht an `begruendeBuchung` → Kleinbetragsregel greift
nur, wenn der Betrag mitgegeben wird (Logik vorhanden, optionale UI-Verdrahtung später).

---

## 2026-06-14 — Rechnungsdokument mit §14-UStG-Pflichtangaben (ausstellbare Rechnung)

**Was getan** (wichtige Produkt-Lücke: bisher nur Buchung, kein Rechnungsdokument)
- NEU `src/domain/rechnung.js` (rein, node-getestet): `baueRechnung({auftrag,kunde,firma,nummer,
  datum,leistungsdatum,kleinunternehmer})` → strukturiertes Dokument (Positionen mit Netto,
  Steuerzeilen je Satz, Summen, Kleinunternehmer-Variante ohne USt); `pflichtangaben(rechnung)`
  prüft § 14 Abs. 4 UStG (Aussteller-Name/Anschrift, Steuernr./USt-IdNr., Empfänger, Datum,
  fortlaufende Nummer, Leistungsbeschreibung, Leistungsdatum, Steuerausweis); `formatRechnungsnummer`.
- `crm-store`: **fortlaufende Rechnungsnummer** (`naechsteRechnungsnummer`, kv `rechnungSeq`,
  Format JAHR-NNNN) — bei `rechnungAusAuftrag` vergeben + `rechnungNummer`/`rechnungDatum` am Auftrag.
- **Firmenprofil** (`settings.firma`: name, anschrift, steuernummer, ustId, iban) — Formular in
  den Einstellungen (verschlüsselt gespeichert).
- **Orders-UI:** Knopf „Rechnung anzeigen" → druckbares Rechnungs-Dokument (window.print),
  §14-Lücken als Hinweis, Kleinunternehmer-Hinweis. Print-/Layout-CSS.
- i18n de/en; SW-Cache `v30→v31`, `rechnung.js` in CORE_ASSETS.
- `tests/run.mjs`: +11 (Aufbau, Summen mehrerer Sätze, Pflichtangaben vollständig/unvollständig,
  Kleinunternehmer, Nummern-Format). **Gesamt 191/191 grün**.

**Verifiziert:** `node tests/run.mjs` → 191/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert:** Rechnungs-UI/Druck nicht headless-E2E geklickt; `naechsteRechnungsnummer`/
Firmenprofil-Persistenz nutzen IndexedDB/Vault (nicht node-getestet, Logik minimal).

**Offen / Nächstes:** EÜR §4(3) Zufluss/Abfluss; DATEV-EXTF zertifizieren; Regel-Set erweitern.
**Details: `docs/PULS.md`.**

---

## 2026-06-14 — Entwurf bearbeiten & löschen (geschlossene Lücke im Bedien-Lebenszyklus)

**Was getan** (Feinschliff: wichtige Bedien-Lücke)
- Entwürfe konnten angelegt, aber weder **gelöscht** noch **bearbeitet** werden (durch die
  „immer speicherbar"-Änderung verschärft). Jetzt:
  - `store.deleteEntwurf(id)` — löscht nur Entwürfe (festgeschrieben → nur Storno).
  - `journal.formularAusBuchung(buchung, idx)` — **reine, node-getestete** Rekonstruktion der
    Formularfelder (Soll/Haben/Brutto/USt) aus den Zeilen, inkl. USt-Split-Erkennung.
  - Journal-Tabelle: pro Entwurf Knöpfe **Bearbeiten** (Formular vorbefüllen, speichert per id
    in-place) und **Löschen**; Formular-Titel/Button passen sich an; **Abbrechen** im Edit-Modus.
- i18n de/en; SW-Cache `v29→v30`.
- `tests/run.mjs`: +6 `formularAusBuchung` (Ausgabe/Einnahme mit USt, ohne USt, Notizfelder).
  **Gesamt 180/180 grün**.

**Verifiziert:** `node tests/run.mjs` → 180/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert:** Journal-UI (Edit/Delete-Knöpfe) nicht headless-E2E geklickt; `deleteEntwurf`
nutzt IndexedDB (nicht node-getestet) — Logik ist aber minimal und analog zu bestehenden Pfaden.

**Offen / Nächstes:** EÜR §4(3) + DATEV-EXTF; Regel-Set erweitern. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Berater im Beleg-Vorschlag (documents.js) konsistent

**Was getan** (Abrundung des KI-Berater-Features)
- Beleg-Vorschlag (Foto/PDF & Schnellerfassung) zeigt jetzt ebenfalls ein **Begründungs-
  Feld mit §-Bezug**: on-device aus `rechtsregeln.js` vorbefüllt (kein Netz), per Knopf
  „KI-Begründung" über Mistral (EU, opt-in) verfeinerbar; wird mit dem Entwurf gespeichert
  (`saveEntwurf({begruendung})`). Quelltext (OCR/Eingabe) fließt als Kontext ein.
- SW-Cache `v28→v29`. Keine neuen Module/Logik → bestehende **174/174 Tests** weiter grün.

**Verifiziert:** `node tests/run.mjs` → 174/0; `node --check src/ui/views/documents.js`.
**Nicht verifiziert:** UI nicht headless-E2E geklickt (reine Wiring-Änderung; genutzte Logik
`onDeviceBegruendung`/`begruendeBuchung` ist node-getestet).

**Offen / Nächstes:** Regel-Set erweitern; EÜR §4(3) + DATEV-EXTF (eigener PR). **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Berater mit Rechts-Grundlage (Begründung/Notiz mit §-Bezug)

**Was getan** (eigener PR nach Merge von #15)
- **Grounding statt Halluzination:** NEU `src/domain/rechtsregeln.js` — kuratiertes lokales
  Regel-Set (Bewirtung §4(5)2, Geschenke §4(5)1, GWG §6(2), Kfz-Privatnutzung §6(1)4,
  Telekommunikation, Reisekosten, Kleinunternehmer §19) mit Paragraph + Kurzregel +
  Doku-Hinweis. `findeRechtsregeln(kontext)` + `onDeviceBegruendung(kontext)`.
- **KI-Berater:** NEU `src/ai/berater.js` — `begruendeBuchung(kontext)` schlägt eine kurze
  Begründung MIT §-Bezug vor (Eigenbeleg/Notiz, „parat fürs Finanzamt"). Über Mistral (EU,
  BYOK) wird nur FORMULIERT, gegroundet auf die Regeln; ohne Mistral On-Device-Fallback aus
  den Regeln. `buildBegruendungMessages`/`parseBegruendung` rein & node-getestet. Disclaimer
  „keine Steuerberatung". Nutzer entscheidet/editiert.
- **Datenmodell:** `begruendung`-Feld an der Buchung (`store.js saveEntwurf`); in die GoBD-
  Hash-Kette aufgenommen, aber **rückwärtskompatibel** (nur gehasht wenn vorhanden →
  Altbestände behalten ihren Hash). `audit.js hashedFields` entsprechend angepasst.
- **UI Journal:** Begründungs-Textfeld + Knopf „KI-Begründung vorschlagen" (zeigt Quelle
  Mistral/on-device), Anzeige 📝 in der Tabelle. i18n de/en. SW-Cache `v27→v28`,
  `rechtsregeln.js`+`berater.js` in CORE_ASSETS, 56 JS-Module.
- `tests/run.mjs`: +12 (Rechtsregeln, Prompt/Parser, On-Device-Fallback). **174/174 grün**.

**Verifiziert:** `node tests/run.mjs` → 174/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert (ehrlich):** Live-Mistral-Begründung im Browser; das neue Journal-UI
(Begründungsfeld/KI-Knopf) nicht headless-E2E geklickt. Regel-Set ist bewusst kompakt
(erweiterbar), KEINE abschließende Rechtsberatung/Aktualitätsgarantie.

**Offen / Nächstes:** Regel-Set erweitern; Begründung auch im Beleg-Vorschlag (documents);
EÜR §4(3) Zufluss/Abfluss + zertifiziertes DATEV-EXTF. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — USt-Verprobung + Kleinunternehmer-Schalter (Berater-Substanz)

**Was getan** (Folge-Batch zur Profi-Härtung, gleiche PR-Branch)
- **USt-Verprobung** (`src/domain/taxes.js` → `verprobeUSt`): reiner Berater-Check, der die
  GEBUCHTE Vor-/Umsatzsteuer mit der aus Netto×Satz ERWARTETEN vergleicht (pro Buchung/Satz
  gerundet → keine Rundungs-Fehlalarme). Deckt vergessene/falsch gerechnete USt auf. In den
  Auswertungen als grün/rot-Karte (`verprobungCard`) mit „gebucht / erwartet (Abweichung)".
- **Kleinunternehmer-Schalter (§19 UStG)**: `kleinunternehmer` in den Einstellungen
  (Ja/Nein-Segment), `state.js`-Default `false`. Wird an `pruefeBuchung`/`buildVorschlag`
  durchgereicht → unterdrückt die USt-„vergessen"-Hinweise für §19-Nutzer.
- **Audit-Kette war bereits sichtbar** (Dashboard-Badge + Reports `auditCard` via
  `verifyAuditChain`) — nichts dupliziert.
- i18n de/en (reports.verprobung*, settings.kleinunternehmer, common.yes/no). SW-Cache `v26→v27`.
- `tests/run.mjs`: +6 `verprobeUSt`. **Gesamt 162/162 grün**.

**Verifiziert:** `node tests/run.mjs` → 162/0; `node --check` aller geänderten Dateien.
**Nicht verifiziert (ehrlich):** neue UI (Verprobungs-Karte, Kleinunternehmer-Segment) nicht
headless-E2E geklickt. **EÜR §4(3)/DATEV** und **KI-Berater mit Rechts-Grundlage** sind als
eigene Folge-PRs geplant (zu groß für diesen Batch — Ehrlichkeits-Vertrag).

**Offen / Nächstes:** KI-Berater (Begründung/Notiz-Feld + kuratiertes Regel-Set
`rechtsregeln.js` + Prompt + UI); EÜR §4(3) Zufluss/Abfluss; DATEV-EXTF zertifiziert.
**Details: `docs/PULS.md`.**

---

## 2026-06-14 — Profi-Härtung mit Spielraum: Kontoart-Richtung + Plausibilitäts-Hinweise

**Was getan**
- `src/ai/mistral.js`: neue reine, node-testbare Funktion **`resolveKategorie(parsed, kontoIndex)`**.
  Die Buchungs-**Richtung** (einnahme/ausgabe) wird jetzt VERBINDLICH aus der Kontoart
  abgeleitet (ERTRAG→einnahme, AUFWAND→ausgabe) statt der Modell-Antwort blind zu trauen.
  Folge: ein vom Modell falsch gelabeltes Erlöskonto („ausgabe") kann **keine falsche
  Soll/Haben-Buchung** mehr erzeugen. Nicht-Erfolgskonten (z.B. Bank 1200) werden
  abgelehnt → On-Device-Heuristik greift. `categorize()` nutzt jetzt diese Funktion.
- **Profi-Substanz mit Spielraum** (Leitlinie des Nutzers: „hart wie Diamant, aber
  bedienerfreundlich, mit Spielraum — keine Haken beim Eintragen, trotzdem Berater-tauglich"):
  - NEU `src/domain/pruefung.js` — reine `pruefeBuchung(buchung, idx, opts)` trennt **harte
    Fehler** (validateBuchung, nur festschreibe-relevant) von **nicht-blockierenden Hinweisen**:
    USt vergessen (nur Erlös/Output-VAT, low-noise), Zukunftsdatum, Datum vor letzter
    Festschreibung (zeitgerecht), fehlender Buchungstext, Soll=Haben-Konto;
    `opts.kleinunternehmer` unterdrückt USt-Hinweise. Plus `istFestschreibbar()`.
  - **Haken entfernt:** Journal-Formular speichert Entwürfe jetzt IMMER (vorher blockierte
    `validateBuchung` das Speichern); `buildVorschlag()` liefert IMMER einen Vorschlag (mit
    `fehler`/`warnungen` als Metadaten) statt `ok:false`. Streng bleibt nur `festschreiben()`.
  - **Hinweise sichtbar, Profi entscheidet:** Journal zeigt gelbe Hinweis-Karte nach dem
    Speichern; Festschreiben fragt bei Warnungen nach („… Trotzdem festschreiben?"); Beleg-
    Vorschlagskarte zeigt Hinweise. i18n (de/en) + `.hinweis`-Style. SW-Cache `v25 → v26`,
    `pruefung.js` in CORE_ASSETS, 54 JS-Module.
- `tests/run.mjs`: +6 `resolveKategorie`, +4 Vorschlag-Spielraum, +13 `pruefeBuchung`/
  Plausibilität. **Gesamt 156/156 grün** (vorher 134).

**Verifiziert:** `node tests/run.mjs` → 156 bestanden, 0 fehlgeschlagen; `node --check` für alle
geänderten UI-Dateien.
**Nicht verifiziert (ehrlich):** Live-Mistral im Browser; die neuen UI-Hinweise (Journal-Karte,
Festschreib-Dialog, Beleg-Karte) sind **nicht headless-E2E** geklickt — nur Logik node-getestet.
Kein Kleinunternehmer-Schalter in den Einstellungen (opts vorhanden, UI-Toggle offen).

**Offen / Nächstes:** Browser-Sichttest der Pipeline + neuer Hinweise; optional Kleinunternehmer-
Schalter in Einstellungen; Sage 5b. **Details: `docs/PULS.md`.**

---

## 2026-06-14 — KI-Setup-Politur + Nachfolge-Brief

**Was getan**
- KI-Einstellungen: **„Verbindung testen"**-Knöpfe (Vision/Mistral), Direktlinks zur
  Schlüssel-Erstellung, Schritt-Anleitung + „Vision-API aktivieren"-Link, Persistenz-Hinweis,
  **Klartext-Fehlerhinweise** (`visionFehlerHinweis`: Vertex/Agent-Key, Referrer, API nicht
  aktiv, Abrechnung, Key ungültig). SW bis `v25`.
- **`docs/PULS.md` angelegt** — zentraler Nachfolge-Brief/Stand-Schnappschuss; in `CLAUDE.md`
  als Pflicht-Andockpunkt verankert.

**Live verifiziert (Nutzer-Sichttest):** Vision (EU) **aktiv ✓** + Mistral (EU) **aktiv ✓**.
Gelöst: Vertex/Agent-Express-Key taugt nicht für Vision → Standard-Cloud-Vision-Key nötig.

**Offen / Nächstes:** Beleg→Buchung-Pipeline im Browser durchklicken; Sage 5b (Spore in-app
erzeugen + Hub-Registrierung). **Details: `docs/PULS.md`.**

---

## 2026-06-14 — EU-KI-Umstellung (Google Vision EU + Mistral EU)

**Was getan (auf Nutzerwunsch, Vorbild Mein-WorkFloh)**
- **Beleg-Texterkennung nur noch über Google Cloud Vision — EU-Endpoint** (`ai/vision.js`,
  `eu-vision.googleapis.com`): Bild → `images:annotate`, PDF → `files:annotate`,
  `DOCUMENT_TEXT_DETECTION`. **Kamera/Foto/Scanner/PDF** im Belege-Upload (`pickFile` mit
  `capture`).
- **Textsortierung/Kontierung + Steuer-Assistent über Mistral (EU)** (`ai/mistral.js`,
  `api.mistral.ai/v1`, OpenAI-kompatibel), mit **On-Device-Heuristik-Fallback**.
- Claude-Provider entfernt (`ai/provider.js` gelöscht); neue verschlüsselte Config
  `ai/aiConfig.js` (Vision-Key + Mistral-Key + Modell). Settings, documents- und reports-
  View angepasst. `taxAssist.js` nutzt jetzt Mistral.
- Tests **134/134** (Vision-Request/Parser, Mistral-Prompt/Parser). SW-Cache `v21`.
- CLAUDE.md Regel 8 + `docs/AI.md` auf EU-Stack umgestellt.

**Offen / Grenzen (ehrlich)**
- Vision-/Mistral-Pfade nicht gegen Live-APIs getestet (kein Schlüssel/Netz); reine
  Logik node-getestet. CORS/Live erst im echten Browser mit Schlüssel prüfen.

---

## 2026-06-14 — Phase 6.1: Bild-Assets / Branding

**Was getan**
- Vom Nutzer generierte 3D-Render-Bilder eingebunden (Teal/Mint-Marke):
  - **PWA-Icons**: `icon-192/512`, `maskable-512`, `apple-touch-icon`, `favicon-32`
    (Manifest + `index.html` + SW-Cache).
  - **Hero** `hero-lock.png` (transparent) am Sperrbildschirm; `shell()` nimmt jetzt ein
    **kontextabhängiges** Hero-Bild → Onboarding zeigt `onboard-key/-shamir/-backup`.
  - **7 Leerzustände** (`empty-*`) via neuer `emptyState`-Komponente in Journal/Belege/
    Kunden/Aufträge/Mitarbeiter/Auswertung/Mycel-Netz.
  - **`og-image.png`** (opak, Wortmarke als echter Text) + OG/Twitter-Meta-Tags.
- Bild-Aufbereitung mit Pillow (Alpha-Erhalt, Flood-Fill/weiche Matte gegen weiße/
  eingebackene Karo-Hintergründe). SW-Cache bis `v20`.

**Stand**
- Vollständiges, konsistentes Marken-Bildset; alle referenzierten Bilder vorhanden,
  121/121 Tests grün, i18n vollständig.

**Offen / Grenzen (ehrlich)**
- Lighthouse/Performance ungemessen (kein Headless-Browser); Browser-UI nicht E2E-getestet
  → **Sichttest** als nächster Schritt.

---

## 2026-06-14 — Phase 6: Design-Politur & Bilder

**Was getan**
- `domain/summary.js` (rein, getestet): Dashboard-Jahres-Kennzahlen (Ertrag/Aufwand/
  Überschuss/USt-Zahllast/festgeschrieben/Entwürfe).
- `ui/views/dashboard.js`: KPI-Karten + Zähler (Belege/Kunden/Aufträge) + Audit-Status +
  Schnellaktionen. Ersetzt das statische Dashboard.
- `ui/mycelCanvas.js`: dezente, animierte Mycel-Fäden am Sperrbildschirm — **additiv**
  (Browser-Lehre 8), `prefers-reduced-motion`-bewusst, beendet sich beim Entfernen aus DOM.
- Barrierefreiheit: Skip-Link, `:focus-visible`, `aria-current`/`aria-live`, `role=main`,
  Fokus-Ring-Token.
- Tests **121/121**; i18n-Vollständigkeit ok; SW-Cache `v7`.

**Stand**
- Visuell deutlich aufgewertet; Dashboard zeigt echte Zahlen; A11y-Grundlagen vorhanden.

**Offen / Grenzen (ehrlich)**
- **Echte promptgenerierte Bilder** (KI-Bildgenerierung) sind in dieser Umgebung nicht
  möglich → Hero/Illustrations-Assets bleiben offen (Phase 6.x).
- **Lighthouse/Performance** nicht gemessen (kein Headless-Browser).
- **Mycel-Canvas + alle UI** nicht headless E2E-getestet — nur statisch geprüft.

**Nächstes** — offene Sage-Schritte (5b/c/d, menschlich vermittelt) und/oder
Bild-Assets/Performance (6.x); ein manueller Browser-Durchlauf bleibt empfohlen.

---

## 2026-06-14 — Phase 5: Sage-Mycel-Symbiose (lokale Andock-Vorbereitung)

**Was getan**
- SBKIM-Protokoll `src/sbkim/`: `spore.js` (Ed25519-Keygen, Spore-Bau, Verifikation §11.2,
  kanonische Form §11.1, `id==base64url(SHA256(pubkey))`), `identity.js` (verschlüsselte
  Identität), `domainvector.js` (deterministischer `_demo`-Vektor 384-dim, §11.5),
  `signal.js` (SIGNAL.json §11.6).
- **Headless-Verifizierer** `tools/verify_remote_spore.mjs` (node:crypto, zero-dep).
- Ansicht „Mycel-Netz": Identität erzeugen, spore.json/SIGNAL.json herunterladen, fremde
  Spore prüfen. `sbkim/README.md` + Templates (SIGNAL, AUSTAUSCH).
- Tests **113/113** inkl. Verifizierer-Paar-Einigkeit (Browser ↔ headless) und
  Manipulationsprobe. SW-Cache `v6`.

**Wichtig (extern, gegenkontrolliert):** Mein nodeId-Derivat und die §11.1-Signatur wurden
gegen eine **echte Geschwister-Spore (Mein-Tresor)** geprüft → **VALID**. Format ist also
byte-kompatibel zum Netz.

**Stand**
- Andock ist **lokal vorbereitet**; kein fremdes Repo verändert.

**Offen / Grenzen (ehrlich)**
- **Keine echte `spore.json` im Repo** — sie wird in-app mit dem privaten Schlüssel erzeugt
  und vom Nutzer committet (kein erfundenes Signatur-File).
- `domainVector` ist `_demo` → nur `verified-spore`, nicht `verified-match` (echtes
  Embedding/Transformers.js = Phase 5c).
- Hub-Registrierung + Handshake = menschlich vermittelter Schritt (Phase 5b, fremde Repos).
- Symbiose-Import (Tresor/WorkFloh → Buchungen) = Phase 5d.
- Browser-UI nicht headless E2E-getestet.

**Nächstes** — Phase 5b/c/d (s.o.) bzw. Phase 6 (Design-Politur & Bilder).

---

## 2026-06-14 — Phase 4: Steuer & Export

**Was getan**
- `domain/export.js` (rein, getestet): Journal-CSV, DATEV-orientierte CSV, USt-VA-Kennzahlen
  (Kz 81/86/66/83), EÜR-CSV; CSV-Escaping + Cent→Komma.
- `ai/taxAssist.js`: Steuer-Assistent (opt-in Claude), sendet nur aggregierte Kennzahlen
  (Datenminimierung). Nicht live getestet.
- UI `reports.js`: USt-VA-Kennzahlen-Karte, Export-Buttons (CSV/DATEV/USt-VA/EÜR),
  Drucken→PDF (Print-CSS), Steuer-Assistent (wenn Claude konfiguriert).
- `ui/views/legal.js` + Nav „Recht & Doku": GoBD-Verfahrensdokumentation + DSGVO in-app,
  Betroffenenrechte (verschlüsselter Export, vollständiges Löschen).
- `docs/legal/Verfahrensdokumentation.md` + `docs/legal/Datenschutz.md`.
- Tests **98/98**; i18n-Vollständigkeit ok; SW-Cache `v5`.

**Stand**
- Steuerliche Aufbereitung (USt-VA-Kennzahlen, EÜR) + Exporte + Recht/Doku vorhanden.
  Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- DATEV = orientiert, kein zertifiziertes EXTF; **keine** ELSTER-Einreichung (nur Datenpaket).
- „PDF" = Browser-Druck (keine PDF-Bibliothek).
- Claude-Pfade (Belegerkennung, Steuer-Assistent) nicht live getestet.
- Browser-UI nicht headless E2E-getestet.

**Nächstes (Phase 5)** — Sage-Mycel-Symbiose: SBKIM-Client (Modul 09 kopieren),
Ed25519-Identität, `spore.json`, Synchronisationsvereinbarung/Briefkasten
(`docs/SAGE_SYNC_BRIEFKASTEN.md`), Symbiose (Belege aus Tresor, Aufträge aus WorkFloh).

---

## 2026-06-14 — Phase 3: Aufträge, Kunden, Mitarbeiter, Kostenstellen

**Was getan**
- Domäne (rein, getestet): `orders.js` (Positionen, Summen über mehrere USt-Sätze,
  Status-Flow), `invoicing.js` (Ausgangsrechnung → Buchungszeilen, mehrere Sätze),
  `employees.js` (Zeit-Summen/Kosten), `costcenters.js` (Auswertung je Kostenstelle).
- Verschlüsselter generischer Store `encstore.js` + `crm-store.js` (Kunden, Aufträge,
  Mitarbeiter, Zeiten verschlüsselt = DSGVO; Kostenstellen als Klartext-Stammdaten).
- Rechnung → automatische Buchung (`rechnungAusAuftrag` → Buchungs-Entwurf, Auftrag
  „berechnet"); Festschreiben bleibt manuell (GoBD).
- UI: Ansichten Kunden / Aufträge (Positionen-Editor, Status, Rechnung→Buchung) /
  Mitarbeiter+Zeiterfassung; Kostenstelle-Auswahl im Journal; Kostenstellen-Auswertung
  in der Auswertung. Nav erweitert.
- Tests **85/85**; i18n-Vollständigkeit ok; SW-Cache `v4`.

**Stand**
- Voller Auftrags-/CRM-Kreis: Kunde → Auftrag → Rechnung → Buchung; Zeiterfassung;
  Kostenstellen-Auswertung. Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- **Browser-UI nicht headless E2E-getestet** (kein Headless-Browser): alle Phase-1–3-
  Ansichten sind statisch geprüft, aber nicht klickend verifiziert → einmal manuell
  durchgehen.
- Rechnung erzeugt bisher kein PDF-Dokument (nur Buchung); PDF-Rechnung später.

**Nächstes (Phase 4)** — Steuer & Export: Steuer-Assistent (opt-in), USt-VA/EÜR-
Aufbereitung, Export (PDF/CSV, DATEV-CSV, ELSTER/ERiC-Datenpakete), DSGVO/GoBD-Doku in-app.

---

## 2026-06-14 — Phase 2: Belege & Erkennung (Kern)

**Was getan**
- Verschlüsselter Beleg-Store `domain/documents.js` (AES-GCM, Bild/PDF, Metadaten +
  Verknüpfung zu Buchungen).
- On-Device-Pipeline (rein, getestet): `ai/extract.js` (Betrag/Datum/USt/Vendor aus Text),
  `ai/categorize.js` (Schlüsselwort → SKR03-Konto + Richtung), `ai/suggest.js`
  (ausgeglichener Buchungssatz inkl. USt-Aufteilung).
- Externe KI `ai/provider.js`: Claude-Vision per BYOK (neueste Modelle), opt-in,
  verschlüsselter Schlüssel, Bestätigung vor Versand.
- UI `ui/views/documents.js`: Upload, Schnellerfassung aus Text, KI-Extraktion; **Autonomie-
  Schalter wirksam** (Vorschlag/Entwurf/auto). KI-Settings (BYOK) in Shell.
- Bugfix: doppelte Cent-Konvertierung in `baueBuchungZeilen` (nimmt jetzt `bruttoCents`).
- Tests **65/65**; i18n-Vollständigkeit geprüft; SW-Cache `v3`.
- `docs/AI.md` (KI-Konzept + ehrliche Grenzen).

**Stand**
- Beleg→Buchungsvorschlag funktioniert on-device (Text) und via Claude-Vision (BYOK).
  Kernlogik echt getestet.

**Offen / Grenzen (ehrlich)**
- **Lokales OCR (Tesseract.js) NICHT eingebunden** — Bild→Text nur via Claude-Vision/Text.
- **Embeddings (Transformers.js) ausstehend** — derzeit Schlüsselwort-Heuristik.
- **Claude-API-Pfad nicht live getestet** (kein Schlüssel/Netz).
- **Browser-UI nicht headless E2E-getestet.**

**Nächstes (Phase 3)** — Aufträge/Kunden/Mitarbeiter/Kostenstellen (WorkFloh-Domänenmodell),
Rechnung → automatische Buchung.

---

## 2026-06-14 — Phase 1: Buchhaltungs-Kern

**Was getan**
- Domänenlogik (rein, node-getestet): `domain/money.js` (Cent-genau, dt. Format),
  `domain/accounts.js` (SKR03-Auswahl, Konto-Arten, Saldo-Logik), `domain/journal.js`
  (doppelte Buchführung mehrzeilig, USt-Aufteilung brutto→netto+USt, Storno-Spiegelung),
  `domain/audit.js` (kanonische Form wie Sage §11.1, Hash-Kette, `verifyChain`),
  `domain/taxes.js` (Saldenliste, USt-Voranmeldung, EÜR vereinfacht, Periodenfilter).
- Persistenz `domain/store.js`: Konten-Seed, **verschlüsselte** Buchungen (AES-GCM mit
  Sitzungs-Key), **GoBD-Festschreibung** (lückenloser Nummernkreis + Hash-Kette),
  unveränderlich, Korrektur nur per `storno()`.
- UI: Ansichten Konten/Journal/Auswertung (`ui/views/*`), Neue-Buchung-Formular mit
  autom. USt-Konto-Wahl, Festschreiben/Storno, Audit-Status. In Shell + Nav verdrahtet.
- Tests erweitert auf **45/45** (inkl. Integration Festschreiben+Storno+Kette).
- SW-Cache auf `v2` gebumpt + neue Module precached (Browser-Lehre 4).

**Stand**
- Voll funktionsfähiger Buchhaltungs-Kern (Konten, Buchen, USt/EÜR, GoBD-Audit), Kernlogik
  echt getestet.

**Offen / Grenzen (ehrlich)**
- **Browser-UI nicht headless E2E-getestet** (kein Headless-Browser in der Umgebung):
  DOM/IndexedDB/Verschlüsselungs-Pfad ist sorgfältig gebaut + statisch geprüft, aber nicht
  klickend verifiziert. Erste reale Sitzung: Onboarding → Buchung → Festschreiben → Storno
  → Auswertung manuell durchklicken.
- Strenge §4-Abs.3-EStG-EÜR + Kostenstellen-UI später (Phase 3/4).

**Nächstes (Phase 2)** — Belege & Erkennung (verschlüsselter Beleg-Store, OCR lokal,
Extraktion → Buchungsvorschlag, KI-Autonomie-Schalter wirksam).

---

## 2026-06-14 — Phase 0: Fundament

**Was getan**
- Repo-Gerüst angelegt (build-frei, native ES-Module, PWA-Manifest, App-SW mit
  versioniertem Cache).
- Krypto (`src/core/crypto.js`): AES-GCM-256, PBKDF2 (600k), SHA-256, base64url.
- Shamir GF(256) (`src/core/shamir.js`): Split/Combine + Share-Kodierung.
- IndexedDB (`src/core/db.js`): KV/Records/Files, DB-Suffix `bookledgerpro`, Dump/Wipe.
- Datendurabilität (`src/core/durability.js`): `storage.persist()`, Quota, Backup-Status.
- Tresor (`src/core/vault.js`): Setup/Unlock, Sitzungs-Key, verschlüsselte Settings,
  Mandant-ID. Backup (`src/core/backup.js`): bauen/lesen/importieren.
- UI: DOM-Helfer, i18n (de/en), Theme (hell/dunkel/system), Mycel-Marke, Sperrbildschirm
  + Onboarding (Passwort → Shamir → erzwungenes erstes Backup), App-Shell mit Modus- und
  KI-Autonomie-Schaltern + Durabilitäts-Banner + Mandant-Indikator.
- Node-Smoke-Test (`tests/run.mjs`) für Krypto + Shamir, CI-Workflow.
- Docs: README, ARCHITECTURE, ROADMAP, CLAUDE/AGENTS, SAGE_BROWSER_LEHREN.

**Stand**
- App bootet, Onboarding/Unlock/Settings funktionieren lokal. Buchhaltungs-Kern noch leer
  (Ansichten Konten/Journal/Belege sind Platzhalter).

**Nachtrag (gleiche Sitzung)**
- Sage-**Synchronisationsvereinbarung & Briefkasten** analysiert (INTERFACES §11) und als
  `docs/SAGE_SYNC_BRIEFKASTEN.md` verankert (SIGNAL.json seq/ack, AUSTAUSCH-Postfächer,
  Inbox-Konvention, Signier-Norm, Start-/End-Ritual). In CLAUDE/ROADMAP/ARCHITECTURE/README
  verlinkt. Wird ab Phase 5 Pflicht.

**Offen / Nächstes (Phase 1)**
- Kontenplan + Buchungssätze (doppelte Buchführung), Journal, EÜR/USt.
- GoBD: Festschreibung, Storno, Audit-Hash-Kette (`core/audit.js`), Nummernkreise.
