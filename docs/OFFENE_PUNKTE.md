# OFFENE PUNKTE — unbedingt beachten · nacharbeiten · verbessern

> **Lebende Merkliste.** Hier wird festgehalten, was wichtig ist, noch fehlt, nachgearbeitet
> oder verbessert werden muss — damit über Sitzungen hinweg nichts verloren geht. Ergänzt
> `ROADMAP.md` (Phasen), `docs/PULS.md` (Stand/Leitbild) und `docs/SESSIONS.md` (Verlauf).
> Erledigte Punkte abhaken und ins SESSIONS-Log verschieben. Letzte Pflege: **2026-06-19** (**Sprint S5: P8 — QR-Einzelteilen (vendored reiner JS-Encoder, build-frei, lokal/kein Netz)**: der QR-Teil von P8 („Datei-Kanal (Masse) + QR (Einzel-Teilen)") — der Datei-Kanal war P9. **Build-frei lösbar (nicht blockiert):** vendored reiner JS-QR-Encoder als eigenes ES-Modul `src/core/qr.js` (keine npm/CDN-Runtime), Algorithmus portiert aus der **MIT**-lizenzierten „QR Code generator library" von Project Nayuki (Lizenz + Attribution im Kopf), neu als ES-Modul: Byte-Modus/UTF-8, Versionen 1–40, EC L/M/Q/H, automatische Maskenwahl. Kein Online-QR-Dienst → keine Datenübertragung. node-getestet (+40 → **1926/1926**) gegen unabhängige Spezifikations-Anker (Kapazität v1=19/16/13/9 + v7-L=156, Rohmodul-Formel 208/359/1568, Format-Info-BCH Ground-Truth `0x5412`, Versions-Info-BCH v7=`0x07C94`, RS-Teiler `[3,2]`, GF-Reduktion `gfMul(2,128)=29`, Ausrichtungspositionen v7=[6,22,38], Matrix-Struktur, Determinismus, `QR_ZU_LANG`, SVG ohne Klartext-Leck). UI `src/ui/schluesselabgleich.js`: „Als QR anzeigen (lokal)" rendert das **pseudonyme Dokument** (nie der Schlüssel!) als Inline-SVG; „QR speichern (SVG)"; zu langer Text → ehrlicher Hinweis auf den Datei-Kanal. CSS `.qr-img`, i18n de+en. SW `v147`, 127 Module. **Ehrliche Grenze:** physischer Scan-Test braucht ein echtes Gerät (kein QR-Scanner/SVG-Renderer in der Umgebung — Nutzer-Sichttest offen). **⏭ 5-Sitzungs-Sprint abgeschlossen → BESPRECHUNG mit dem Nutzer.** Davor: **Sprint S4: P2 — KI-Anbieterwahl je Modus, strikt EU**: je KI-Funktion (Modus) ein wählbarer Anbieter, **strikt innerhalb der EU**, **KEIN neuer Anbieter** — Nicht-EU bleibt geschlossen/dormant (nie wählbar). Reine Logik `src/ai/anbieter.js` (node-getestet, +28 → **1886/1886**): `KI_MODI` (ocr|kontierung|steuer), `KI_REGION`/`ERLAUBTE_REGIONEN` (`eu`+`lokal`), Registry `KI_ANBIETER` (vision EU/mistral EU/On-Device-Heuristik/aus), `STANDARD_WAHL` (verhaltensgleich vision/mistral/mistral) + Selektoren `regionErlaubt`/`istAnbieterErlaubt`/`erlaubteAnbieter`/`istWahlGueltig`/`normalizeAnbieterWahl` (unzulässige/Nicht-EU-Werte → Standard)/`aktiverAnbieter`/`istAus`/`istLokal`/`istEuCloud`. Persistenz `aiConfig.anbieterWahl` (verschlüsselt, immer normalisiert) + Helfer `aktiverKiAnbieter`/`isOcrAktiv`/`isSteuerAssistentAktiv`/`nutzeMistralFuerKontierung`. Netz-Rand: `vision.ocr` (wirft bei OCR=aus), `mistral.categorize` + `berater.begruendeBuchung` (`nutzeMistralFuerKontierung` → „heuristik" erzwingt On-Device, kein Versand), Steuer-Assistent (`isSteuerAssistentAktiv`, reports.js), OCR-Bereitschaft (`isOcrAktiv`, documents.js). UI `ui/shell.js`: drei Anbieter-Selects (je Modus, nur erlaubte EU/lokale Anbieter) + EU-Hinweis; i18n de+en (`settings.aiProviderTitle`/`aiMode.*`/`aiProv.*`). SW `v146`, 126 Module. **GoBD/Krypto:** kein Datenmodell-Eingriff, nur Gating ausgehender KI-Aufrufe. **Ehrliche Grenze:** Modus „kontierung" bündelt Kontierung + Begründung (beide Mistral-Textfunktionen mit On-Device-Fallback), Steuer-Assistent eigen (mistral ↔ aus); DOM/IndexedDB statisch geprüft. **Sprint-Pointer → S5 (P8 — QR-Einzelteilen, vendored reiner JS-Encoder; build-frei prüfen, sonst blockiert melden).** Davor: **Sprint S3: P3 + P4 — Aufklärungstexte (KI-Autonomiestufen + Kleinunternehmer/Drittdaten)**: reine Daten + Selektoren `src/domain/aufklaerung.js` (node-getestet, +22 → **1858/1858**): `AUTONOMIE_STUFEN` (suggest/draft/auto, je Titel/Kurztext/3 Punkte — deckungsgleich mit `state.AI_LEVELS`), `AUTONOMIE_GRENZEN` (Festschreiben bleibt manuell/GoBD, Storno statt Löschen, kein Datenabfluss ohne Bestätigung, Endverantwortung beim Nutzer), `KLEINUNTERNEHMER_DRITTDATEN` (§ 19 UStG befreit NUR von USt, nicht von DSGVO/Aufbewahrung — Art. 6/13/14/28/32 DSGVO, Art. 30 Abs. 5 Schwelle, § 147 AO/§ 257 HGB) + Selektoren `autonomieStufe`/`aktiveAutonomieStufe` (Fallback suggest)/`drittdatenHinweisRelevant`. UI `src/ui/views/legal.js`: zwei neue Karten in „Recht & Doku" — Autonomiestufen mit Markierung der aktuell eingestellten Stufe + Grenzen; Drittdaten-Karte mit AVV-Betonung wenn EU-KI konfiguriert (`getAiConfig()` async). i18n de+en (`legal.autonomie*`/`legal.drittdaten*`), neue CSS (`legal-stufe`/`legal-liste`/`.note`), SW `v145`, **125 Module**. **Ehrliche Grenze:** Karten-Texte bewusst deutsch (wie die bestehenden GOBD/DSGVO-Blöcke), nur Titel/Hinweise i18n; DOM statisch geprüft (kein Headless-Browser); keine Rechtsberatung. **Sprint-Pointer → S4 (P2 — KI-Anbieterwahl je Modus, strikt EU).** Davor: **Sprint S2: P10 — handelnde Person als Besteller**: additives Datenmodell + UI-Feld. Reine Logik `src/domain/besteller.js` (node-getestet, +26 → **1836/1836**): `normalizeBesteller` (String/Objekt → `{name,funktion,email,telefon}` getrimmt, null ohne Name), `validateBesteller` (optional; Name-Pflicht nur bei Restangaben, E-Mail formal, Längen-Cap), `bestellerLabel`, `bestellerKontaktzeile` („z. Hd. Name (Funktion)" — OHNE E-Mail/Telefon → Prime Directive). Verdrahtet: `domain/orders.js` (`validateAuftrag` + `AUFTRAG_EDIT_FELDER`), `domain/crm-store.js saveAuftrag` (persistiert normalisiert) + `importWorkFloh` (Durchreichen), `domain/rechnung.js baueRechnung` (Dokumentfeld `besteller`), `domain/importworkfloh.js normalizeImport` (roh durchreichen). UI `ui/views/orders.js`: 4 optionale Formularfelder (Name/Funktion/E-Mail/Telefon) + Hinweis + Besteller-Label in der Liste + „z. Hd."-Zeile im Empfängerblock der Rechnung. i18n de+en, SW `v144`, **124 Module**. **GoBD:** Besteller ist mutable CRM-Metadaten (kein Eingriff in die festgeschriebene Buchungs-Hash-Kette); die **Buchung trägt keinen Besteller**. **Ehrliche Grenze:** DOM/IndexedDB statisch geprüft (kein Headless-Browser); Besteller fließt bewusst NICHT in die XRechnung (CII-Käuferkontakt) — möglicher Folgeschritt; „z. Hd."-Präfix fest deutsch. **Sprint-Pointer → S3 (P3+P4 — Aufklärungstexte).** Davor: **Sprint S1: P9 — Datei-Import mit exaktem Schlüssel-Abgleich**: reine Logik `src/ai/schluesselabgleich.js` (node-getestet, +38 → **1810/1810**) — `gleicheAb` (exakter Token↔Klartext-Abgleich, verlustfrei + Bericht `ersetzt`/`fehlend`/`ungenutzt`/`vollstaendig`; Token OHNE Schlüssel bleiben sichtbar stehen, nichts erfunden), `serialisiereSchluessel`/`parseSchluessel` (Schlüssel-Datei „Anker-Tresor", JSON `blp-schluessel` v1, robust ggü. map-Liste/`{token:wert}`-Objekt/Fehlerfällen), `tokenVorkommen`/`typAusToken`/`istToken`/`schluesselAusMap`/`abgleichBericht` (Zähler ohne Klartext)/`pruefeRoundtrip` (Selbsttest, auch mit Briefkasten-Scopes). UI `src/ui/schluesselabgleich.js` als zusammenklappbare Karte in den Einstellungen unter „Datenschutz bei KI": **1.** Klartext → pseudonymes Dokument (Download) + Schlüssel-Datei (Anker-Tresor, gerätelokal) via `ladeAnker`+`tokenize`; **2.** Antwort-Dokument + Schlüssel-Datei laden → `gleicheAb` → re-identifizierter Text + ehrlicher Bericht. SW `v143`, **123 Module**, i18n de+en. **Ehrliche Grenze:** DOM/Datei-Picker/Download statisch geprüft (kein Headless-Browser); die Schlüssel-Datei wird bewusst **unverschlüsselt** als lokaler Download abgelegt (UI-Warnhinweis: nie zusammen mit dem pseudonymen Dokument weitergeben) — verschlüsselte Tresor-Ablage ist ein möglicher Folgeschritt. **Sprint-Pointer → S2 (P10 — handelnde Person als Besteller).** Davor: **P6 CSV/vCard-Kundenimport #167** + **Transparenzbericht in der App verlinkt #166** + HTML-Update #165; **mit dem Nutzer vereinbart: 5-Sitzungs-Sprint** P9→P10→P3+P4→P2→P8, EINER pro Sitzung, danach Besprechung — Plan in `docs/BAUPLAN.md` Block 5 / `docs/NAECHSTE_SITZUNG.md`; Arbeitsauftrag: selbstständig nach Logik/Nutzen, größere Konflikte über `AskUserQuestion` eskalieren. Tests **1772/1772**, SW **v142**, 121 Module). Davor: BAUPLAN Block 4 — **V-Lohn Lohn-Buchungskern KOMPLETT L1–L6**: BLP **bucht** Lohn/Gehalt GoBD-sicher (Brutto-Methode), **berechnet aber KEINE** Lohnsteuer/SV. L1 #158 Logik+Konten · L2 #159 Store/Aggregat · L3 #160 UI · L4 #162 Lohnsteuer-Anmeldung-Datenpaket · L5 #163 SV-/LSt-Zahlungsübersicht · L6 Doku `docs/LOHN.md`. Tests **1754/1754**, SW **v140**, 120 Module. **Nächstes (Nutzer-Wunsch):** Mein-WorkFloh Test-Modus (`docs/TEST_MODUS.md`, eigenes Repo); sonst Browser-Sichttest der Lohn-Ansicht oder neue abgestimmte Idee. Davor (BAUPLAN Block 3) — **Liquiditäts-Treiber (größte anstehende Bewegungen)** #157, Folgeschritt zur Reichweite: die Liquiditäts-Karte zeigte nur Summen/Salden (wie viel bald fällig, wie tief, wie viel fehlt, bis wann), aber nicht die naheliegende Anschlussfrage „**woran** liegt das?". Reine Logik `domain/liquiditaet.js` (node-getestet, +14 → **1689/1689**): **`groessteFaellige({forderungen, verbindlichkeiten, heute, horizontTage, limit})`** + `LIQUIDITAET_TREIBER_DEFAULT` (3) — die nach offenem Betrag absteigend sortierten bald fälligen Posten aus DEMSELBEN Fenster wie `baldFaellig` (nicht überfällig), je Eintrag `{richtung:'ein'|'aus', betragCent, faelligAm, name, referenz}`, auf `limit` gekürzt, ≤0-Beträge raus, deterministische Sortierung (Betrag → früheste Fälligkeit → Name). UI `ui/views/dashboard.js`: Liste „Größte anstehende Bewegungen" in der Liquiditäts-Karte (Wer/Referenz/Datum links, vorzeichenbehafteter Betrag rechts, Eingang +/grün, Ausgang −/rot) über das bestehende `report-line`-Layout; i18n de+en (`dashboard.liquidityDriversLabel`/`…DriverIn`/`…DriverOut`), SW `v135` (kein neues Modul); bucht nichts; DOM/IndexedDB statisch geprüft; Grenze: reine Anzeige/Auswahl, keine Finanzberatung, nur über bald fällige bekannte Posten. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Liquiditäts-Reichweite („Runway" — bis wann reicht das Geld?)**, Folgeschritt zu #154: die Liquiditäts-Karte zeigte Tiefpunkt (tiefster Stand) und Deckungslücke (fehlender Betrag), aber nicht die intuitivste Antwort auf die im Karten-Code selbst gestellte Frage „reicht das Geld?": **bis wann**. Der Tiefpunkt nennt den *tiefsten* Tag, die Reichweite den *frühesten* Engpass (kann VOR dem Tiefpunkt liegen: Saldo rutscht früh unter die Schwelle, erholt sich kurz, fällt später noch tiefer). Reine Logik `domain/liquiditaet.js` (node-getestet, +12 → **1675/1675**): **`liquiditaetsReichweite(verlauf, {reserveCent, heute})`** — erster Tag, an dem der laufende Saldo (`liquiditaetsVerlauf.punkte[].saldoCent`) unter die Schwelle (Mindestreserve, Default 0 → echtes Minus; konsistent via `normalizeReserveCent`) fällt → `{bekannt, reicht, sofort, datum, tageBis, reserveCent, negativ}` (ohne Bestand `bekannt:false` abwärtskompatibel; `sofort` = schon heute unter Schwelle; `negativ` = echtes Minus vs. nur Reserve-Unterschreitung). UI `ui/views/dashboard.js`: Klartext-Bilanz „reicht über N Tage" bzw. „reicht bis {datum}" (rot bei echtem Minus), nur wenn es Ausgänge gibt und der Bestand bekannt ist; der `sofort`-Fall bleibt Ampel/Deckungslücke. i18n de+en (`dashboard.liquidityRunwayOk`/`…RunwayUntil`), SW `v134` (kein neues Modul); bucht nichts; DOM/IndexedDB statisch geprüft; Grenze: einfache Planung nach Fälligkeitsdatum, keine Finanzberatung, kein Forecast wiederkehrender Kosten. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Liquiditäts-Mindestreserve (Puffer) in der Deckungslücke**, PR #154: die Deckungslücke #153 warnte bisher erst bei echtem Minus; viele Betriebe wollen ihr Geld aber nicht bis auf null herunterfahren, sondern einen Sicherheitspuffer (Mindestreserve) halten. Reine Logik `domain/liquiditaet.js` (node-getestet, +17 → **1663/1663**): `normalizeReserveCent(value)` (klemmt persistierten Reservebetrag auf ganze, nicht-negative Cent; ungültig/negativ → 0) + `deckungsluecke(verlauf, {reserveCent})` mit optionaler **Mindestreserve als Schwelle** — Default 0 → identisch/abwärtskompatibel; Lücke greift, sobald der Tiefpunkt unter die Schwelle fällt (`lueckeCent` = Schwelle − Tiefpunkt), neue Felder `reserveCent` + `negativ` (Tiefpunkt < 0 = echte Illiquidität vs. nur Reserve-Unterschreitung). Setting `liquiditaetReserveCent` (`state.js`, Default 0). UI `ui/views/dashboard.js`: Euro-Eingabefeld „Mindestreserve (Puffer)"; Lücken-Hinweis rot (`hint-error`) bei echtem Minus, mild (`muted small`) bei reiner Reserve-Unterschreitung; i18n de+en, SW `v133` (kein neues Modul); bucht nichts; DOM/IndexedDB statisch geprüft; Grenze: einfache Planung nach Fälligkeitsdatum, keine Finanzberatung. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Liquiditäts-Deckungslücke (Unterdeckung im Fenster)**: der Tiefpunkt-Hinweis #152 zeigt den tiefsten Stand auch dann, wenn er positiv bleibt; wenn der laufende Saldo aber zwischendurch ECHT ins Minus rutscht und sich bis zum Fenster-Ende wieder erholt (große Verbindlichkeit früh, ausgleichende Forderung spät), bleibt der Engpass von der End-Saldo-Ampel (`liquiditaetsAmpel`, projiziert<0) unentdeckt und der konkrete Finanzierungs-Betrag fehlt. Reine Logik `domain/liquiditaet.js` **`deckungsluecke(verlauf)`** (node-getestet, +8 → **1646/1646**): nimmt das `liquiditaetsVerlauf`-Ergebnis und liefert `{unterdeckung, lueckeCent, datum}` — greift nur bei `tiefpunktCent < 0` (`lueckeCent` = −`tiefpunktCent`, `datum` = `tiefpunktDatum`), sonst keine Unterdeckung (abwärtskompatibel). UI `ui/views/dashboard.js`: warnfarbener Hinweis (CSS `.hint-error`) „Unterdeckung: Bis zum {datum} fehlen … {betrag}" — unabhängig vom End-Saldo; i18n de+en (`dashboard.liquidityGapHint`), SW `v132` (kein neues Modul); bucht nichts; DOM/IndexedDB statisch geprüft; Grenze: einfache Planung nach Fälligkeitsdatum, keine Finanzberatung. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Liquiditäts-Tiefpunkt (laufender Saldo im Fenster)**: die Projektion #149 prüfte nur den Saldo am **Fenster-ENDE**; der kann positiv sein, obwohl der laufende Saldo zwischendurch ins Minus rutscht (große Verbindlichkeit früh, ausgleichende Forderung spät). Reine Logik `domain/liquiditaet.js` **`liquiditaetsVerlauf(opts)`** (node-getestet, +17 → **1638/1638**): bündelt bald fällige Bewegungen je Fälligkeits-Tag, addiert sie chronologisch ab dem Geldbestand auf → `punkte[]` (Saldo nach jedem Tag) + `startCent`/`endeCent` + **`tiefpunktCent`/`tiefpunktDatum`** (startet beim heutigen Bestand; ohne Bestand → null, abwärtskompatibel). UI `ui/views/dashboard.js`: Tiefpunkt-Hinweis in der Liquiditäts-Karte, nur wenn der laufende Saldo zwischendurch UNTER den End-Saldo fällt; i18n de+en (`dashboard.liquidityLow`/`…LowHint`), SW `v131` (kein neues Modul); bucht nichts; DOM/IndexedDB statisch geprüft; Grenze: einfache Planung nach Fälligkeitsdatum, Bündelung je Tag (kein Intraday). **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Liquiditätsvorschau: wählbares Zeitfenster**: die Liquiditäts-Karte rechnete fest mit 7 Tagen; jetzt **7/14/30/90 Tage** umschaltbar — reine Logik `domain/liquiditaet.js` `LIQUIDITAET_HORIZONT_OPTIONEN` + `normalizeHorizont(value)` (klemmt persistierte/ungültige Werte auf eine kuratierte Option, Default 7; node-getestet, +11 → **1621/1621**), Setting `liquiditaetHorizontTage` (`state.js`, Default 7), UI `ui/views/dashboard.js` `.segmented`-Umschalter über den KPI-Kacheln → `updateSettings` + Dashboard-Neuzeichnung; i18n de+en (`dashboard.liquidityHorizonLabel`/`…HorizonDays`), SW `v130` (kein neues Modul); bucht nichts; DOM/IndexedDB statisch geprüft; Grenze: einfache Planung nach Fälligkeitsdatum, kuratierte Optionen (kein Freitext). **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Liquiditätsvorschau um Geldbestand + projizierten Saldo**, PR #149: Folgeschritt zu #147 — die reine Eingänge-vs-Ausgänge-Sicht beantwortete noch nicht „reicht das Geld?"; jetzt zieht die Karte den **aktuellen Geldbestand (Kasse + Bank)** heran und projiziert den Saldo am Fenster-Ende (Bestand + Eingänge − Ausgänge). Reine Logik `domain/liquiditaet.js` `GELDKONTO_BEREICHE`/`istGeldkonto` (AKTIV 1000–1099 Kasse / 1200–1299 Bank), `geldbestand(buchungen, konten, {stichtag})` (Saldo je Geldkonto Soll−Haben aus den **festgeschriebenen** Buchungen, Entwürfe zählen nicht), `liquiditaetsVorschau(opts.geldbestandCent)` → `geldbestandCent`/`projiziertCent` (ohne Bestand null → abwärtskompatibel), `LIQUIDITAET_AMPEL`/`liquiditaetsAmpel` (kritisch < 0 / Warnung knapp / ok); node-getestet +25 → **1610/1610**; UI `ui/views/dashboard.js` zeigt „Kontostand (Kasse + Bank)" + „voraussichtlich in N Tagen" (ampelgefärbt) + ehrlichen Hinweis, bucht nichts; i18n de+en, SW `v129` (kein neues Modul); DOM/IndexedDB statisch geprüft; Grenze: einfache Planung nach Fälligkeitsdatum, keine Forecast-Modellierung, Geldkonto-Erkennung über 4-stellige SKR03-Bereiche. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Dashboard-KPI: Liquiditätsvorschau (bald fällig)**, PR #147: vorausschauender Gegenpol zu den beiden Überfälligkeits-KPIs (#143/#145) — was wird in den **nächsten 7 Tagen fällig** (erwartete Eingänge gegen Ausgänge + Netto). Reine Logik `domain/liquiditaet.js` `baldFaellig`/`liquiditaetsVorschau` (node-getestet, +14 → **1585/1585**; Fenster `[heute … heute+Horizont]`, **nicht überfällig** → keine Doppelzählung; liest `offenCent`/`betragCent`); UI `ui/views/dashboard.js` Karte „Liquiditätsvorschau (bald fällig)" — gefüttert aus denselben angereicherten Posten wie die Überfälligkeits-Karten, nur im Firmen-/Vereins-Kontext (`zeigeAnsicht 'orders'`/`'payables'`, Privat ausgeblendet) UND wenn etwas bald fällig ist, Netto nur bei beiden Seiten, bucht nichts; i18n de+en, SW `v128` (neues Modul precached); DOM/IndexedDB statisch geprüft; Grenze: einfache Planung nach Fälligkeitsdatum, keine Forecast-Modellierung. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Dashboard-KPI: überfällige Forderungen (Mahnwesen)**, PR #145: Spiegel zur Verbindlichkeiten-KPI #143, aber aus **Gläubigersicht** — die in A1 dokumentierte Dashboard-Intention „Kennzahl überfällige Forderungen, Summe + Anzahl". Reine Logik `domain/mahnwesen.js` `forderungUebersicht`/`FORDERUNG_AMPEL`+`forderungAmpel`/`forderungReport(auftraege, opts)` (node-getestet, +20 → **1571/1571**, Spiegel zu `eingangsverzug.verzugUebersicht`/`verzugAmpel`/`verzugReport`; Import `mahnwesen → zahlungsabgleich` zyklenfrei); UI `ui/views/dashboard.js` Karte „Überfällige Forderungen (Mahnwesen)" — nur bei aktivem Mahnwesen (`zeigeFeature MAHNWESEN`, Privat ausgeblendet) UND wenn etwas überfällig ist, Klick → Berichte, bucht nichts; i18n de+en, SW `v127`; DOM/IndexedDB statisch geprüft; Grenze: konservativer B2B-Aufschlag, keine Rechtsberatung. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 3 — **Dashboard-KPI: überfällige Verbindlichkeiten (eigene Zahlungsdisziplin)**, PR #143: die node-getestete Verzugs-KPI `verzugReport`/`verzugUebersicht` war nur in der Verbindlichkeiten-Ansicht sichtbar (#142); jetzt auch **auf dem Dashboard**. Reine Logik `domain/eingangsverzug.js` `verzugAmpel(uebersicht)` (+ `VERZUG_AMPEL`, node-getestet, +8 → **1551/1551**): Ampel ok|warnung|kritisch für die KPI-Färbung (kritisch ab einer Verbindlichkeit ≥ 14 Tage überfällig; defensiv geklemmt). UI `ui/views/dashboard.js`: Karte „Überfällige Verbindlichkeiten (eigene Zahlungsdisziplin)" am Kopf — nur im Firmen-/Vereins-Kontext (`zeigeAnsicht 'payables'`) UND wenn etwas überfällig ist; Klick → Verbindlichkeiten-Ansicht; bucht nichts; SW `v126`, keine neuen Module; DOM/IndexedDB statisch geprüft. **Verbleibend optional:** Browser-Sichttest durch den Nutzer; sonst umgebungs-/menschen-blockierte Block-3-Punkte. Davor: BAUPLAN Block 2 Folgeschritt — **Zeit-Zuordnungs-UI je Kostenträger**: die echte Zeiterfassung-/Beleg-Zuordnung je Auftrag umgesetzt, soweit GoBD es zulässt. GoBD-Befund: `kostenstelle` ist Teil der festgeschriebenen Buchungs-Hash-Kette (`audit.hashedFields`) → Buchungen/Belege NICHT nachträglich umhängbar; saubere Zuordnung nur bei **Zeiteinträgen** (mutable CRM-Records). Reine Logik `domain/nachkalkulation.js` `aufgeloesteKostenstelle(zeit, auftragIndex)` (explizite `zeit.kostenstelle` vor Auftrags-Ableitung; '' → null), `zeiteintraegeAusZeiten` nutzt ihn (rückwärtskompatibel); `crm-store.js` `saveZeit` persistiert `kostenstelle` + neue `setZeitKostenstelle`; Glue `domain/nachkalkulation-store.js` `ladeZeitZuordnung()`/`zuordneZeit()`; UI-Karte „Zeiten zuordnen" in `ui/views/nachkalkulation.js` (Kostenträger-Select je Zeile, Herkunft direkt/über Auftrag) + ehrlicher GoBD-Hinweis an der Beleg-Liste; +8 → **1483/1483**, SW `v122`; DOM/IndexedDB statisch geprüft. Ehrliche Grenze: nur Zeit (re)zuordbar; alle Zeiten = ARBEIT; `stundenlohnCent` als Kostensatz. **Verbleibend optional:** Schritt 4 der Datensicherung (Server-/Offsite-Ziel, blockiert) bzw. Browser-Sichttest. Davor: BAUPLAN Block 2 Folgeschritt — **Kalibrierte Vorwärtskalkulation im Angebots-Editor**: die in Schritt 10 fertige reine Logik `kalkuliereKalibriert` ist jetzt im Editor nutzbar — Anwendungs-Primitiven `kalibriereEingabe`/`kalkuliereKalibriert` in den Kern `domain/kalkulation.js` verschoben (`domain/kalibrierung.js` re-exportiert → API stabil), neuer reiner `domain/produktschemata.js kalkuliereSchemaKalibriert`, `domain/angebote.js positionAusSchema(opts.faktoren)` rechnet die interne Kalkulation kalibriert + merkt `kalkulation.kalibriert`/`faktoren` (Außendokument neutral, Prime Directive), Glue `domain/nachkalkulation-store.js ladeKalibrierungFaktoren()`, Setting `kalibrierungAnwenden` + UI-Schalter „Erfahrungswerte anwenden" (nur mit Historie) + „kalibriert"-Badge; +9 → **1475/1475**, SW `v121`; DOM/IndexedDB statisch geprüft. **Verbleibend optional:** echte Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag. Davor: BAUPLAN Block 2 Folgeschritt — **Standard-konto→Kostenart-Zuordnung** in der Nachkalkulation: reine Logik `domain/nachkalkulation.js` `kostenartFuerKonto`/`standardKontoBlock` (SKR03-Kontenklassen: 3100–3199 Fremdleistungen→Zukauf, 3000–3999 Wareneingang/RHB→Material, 4100–4199 Personalaufwand→Arbeit; sonst Default Material), automatisch in `domain/nachkalkulation-store.js` aus dem Kontenplan gebaut + in `kostentraegerAnalyse` durchgereicht; `opts.kontoBlock` manuell gewinnt; +22 → **1466/1466**, SW `v120`; Glue/IndexedDB statisch geprüft. Ehrliche Grenze: Heuristik nach Kontenklasse, keine exakte Einzelkosten-Zuordnung; Class-4-Gemeinkosten bleiben unklassifiziert; MASCHINE nur über Zeiteinträge. **Verbleibend optional:** Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag, kalibrierte Vorwärtskalkulation im Editor). Davor: BAUPLAN Schritt 2d — **Demo-Vorbefüllung für Test-Tresore**: reine Logik `domain/demodaten.js` `demoEntwuerfe`/`demoBefuellungsplan` (node-getestet) + Store-Glue `domain/demodaten-store.js befuelleMitDemodaten` (schreibt in den aktiven Sandbox-Tresor über den echten GoBD-Pfad `saveEntwurf`+`festschreiben`) + UI `ui/lock.js renderNeuerTest` (Radio leer/Demo); SW `v119`, +10 → **1444/1444**; Glue/DOM/IndexedDB statisch geprüft). Davor: BAUPLAN Block 2 — **UI „Nachkalkulation/Kostenträger + Kalibrierung"**: neue Ansicht `ui/views/nachkalkulation.js` + I/O-Glue `domain/nachkalkulation-store.js` über die fertige reine Logik `nachkalkulation.js`/`kalibrierung.js`; Soll/Ist je Kostenträger + Deckungsbeitrag + Belege, Korrekturfaktoren-Tabelle + Trefferquote je Preisniveau; neuer reiner Helfer `nachkalkulation.zeiteintraegeAusZeiten` (+7 → 1434/1434); **rein anzeigend** (kein Druck/Export/KI); SW `v118`, DOM/IndexedDB statisch geprüft; Grenzen: kontoBlock-Default = Material, `stundenlohnCent` als interner Kostensatz; Folgeschritte offen: Zeiterfassung-/Beleg-Zuordnungs-UI je Auftrag, kalibrierte Vorwärtskalkulation im Editor, Demo-Vorbefüllung). Davor: BAUPLAN Block 2/Schritt 8-UI — **„Rechnung aus Angebot"**: Knopf in `ui/views/angebote.js` + Store-Glue `domain/angebote-store.js rechnungAusAngebot` über die reine Logik `domain/angebotUebernahme.js`; Nummernpolitik je `rechnungsstelle` (`crm-store.naechsteRechnungSeq`/`naechsteVorlaeufigeSeq`), Angebot→archiviert, Festschreiben manuell; SW `v117`, 1427/1427, DOM/IndexedDB/kv-Zähler statisch geprüft. Davor: Schritt 11b — Adaptiver Baukasten **UI**: Angebots-Ansicht `ui/views/angebote.js` + Store-Glue `domain/angebote-store.js`; SW `v116`, 1427/1427, DOM statisch geprüft. Davor: Schritt 11a — Adaptiver Baukasten reine Sortier-/Zähl-Logik `domain/baukasten.js` (PR #132; SW `v115`, 1427/1427). Davor: Schritt 10 — Kalibrierung + Statistik/Vergleich `domain/kalibrierung.js` (PR #131; SW `v114`, 1394/1394). Davor: Schritt 9 — Auftrags-Kostenträger + Nachkalkulation `domain/nachkalkulation.js` (PR #130, SW `v113`, 1355/1355). Davor: Schritt 8 — Angebot → Rechnung-Übernahme `domain/angebotUebernahme.js` (PR #129, SW `v112`, 1326/1326). Davor: Schritt 7 — Angebote-Kern `domain/angebote.js` (PR #128, SW `v111`, 1298/1298). Davor: Schritt 6 — Produkt-Schemata `domain/produktschemata.js` (PR #127, SW `v110`, 1238/1238). Davor: Schritt 5 — Kalkulations-Kern `domain/kalkulation.js` (PR #126, SW `v109`, 1215/1215). Davor: Block 2/Schritt 4 — Setting `rechnungsstelle` (PR #125, SW `v108`, 1181/1181). Davor: Block 1 komplett — Schritt 3 Datensicherungs-UX + `backupStrategie` (PR #124), 2c Test-Modus UI (PR #122), 2b Store-Glue (PR #120), 2a Sandbox-Kern (PR #118), Schritt 1 Roundtrip-Selbsttest (PR #116).

Legende: **[MUSS]** wichtig/rechtlich oder für Kernnutzen · **[SOLL]** deutlicher Mehrwert ·
**[KANN]** später/optional.

---

## ★ Nutzer-Entscheidung (2026-06-19) — neues Thema: Sage-Mycel-Andock (Phase 5)
Nach der Besprechungs-Sitzung abgestimmt: **Sage-Andock, Reihenfolge ZUERST Sage/Hub, DANN Mein-WorkFloh.**
Plan = `docs/BAUPLAN.md` **Block 6** (6.1–6.5); Brief an Sage = `docs/SAGE_E2E_ANFRAGE.md`; Referenz =
`docs/SAGE_SYNC_BRIEFKASTEN.md`. **E2E-Befund (Sage-Quelle):** Mycel heute signatur-only (Ed25519), keine
Nutzlast-Verschlüsselung, `protocolVersion 0.1` → Grad-B-Daten heute **pseudonym (P9, keine Spec-Änderung)**;
**E2E/X25519 = additive Spec-Erweiterung, Sage entscheidet**. **✅ SAGE HAT GEANTWORTET (2026-06-19, menschlich
vermittelt): 1 JA / 2 JA / 3 JA mit Wie / 4 bestätigt** → Grad-B-Pseudonymisierung ist der freigegebene **Sofortpfad**
(kein Bump/Bau); echte E2E (X25519 „sealed box") = **Entwurf 0.2**, formaler Bump erst nach Knoten-Deploy + Go
(Sage-Hoheit, deren PR #302). 6.5 ist damit von „nur falls Sage bejaht" auf **bejaht (nach Knoten-Go)** präzisiert.
**Nächster Bauschritt: 6.1 — BLP zum SBKIM-Knoten machen** (Spore/SIGNAL, headless VALID; `domainVector` vorerst
`_demo`). **Mensch-blockiert:**
6.2/6.3 (Hub-Registrierung, WorkFloh-Pairing) berühren fremde Repos → nie selbst anfassen.

## ★ Nutzer-Entscheidungen (2026-06-17) — verbindlich für den weiteren Bau
Der Profi-Readiness-Fahrplan **V1–V10 ist abgeschlossen.** Folgende Richtungs-Entscheidungen
gelten ab jetzt (Reihenfolge der Umsetzung legt die jeweilige Sitzung fest; **Freibrief: je Punkt
ein PR, bei grüner CI selbstständig mergen**):
- **ELSTER: JA — „Download oder Weiterleiten per Link".** Kein eingebauter ERiC-Direktversand
  (nicht build-frei). Stattdessen: ELSTER-Datenpaket herunterladen **+ Weiterleitungs-Link auf die
  Anbieter-Seite (elster.de)**. ✅ erste Stufe umgesetzt (Link in „USt-VA je Zeitraum").
- **Mehrmandantenfähigkeit: JA** — eigener großer PR (DB-Suffix `bookledgerpro` NICHT ändern →
  Mandanten-Namespace innerhalb des Tresors / pro Tresor; sauber trennen).
- **Bilanzierung (GmbH/OHG, GuV + Bilanz): JA** — eigener großer PR (V-Bilanz).
- **AVV-Verträge: abschließen/umsetzen** — ✅ In-App-Links zu Google-/Mistral-DPA in „Recht & Doku"
  (Vertragsabschluss selbst bleibt organisatorische Nutzer-Aufgabe).
- **Angebote & Kalkulation (Werbetechnik): JA, geplant — Design steht.** Eigener großer Bereich,
  **NACH** den laufenden BLP-Schritten zu bauen. Verbindliche Bau-Grundlage: **`docs/KALKULATION_KATALOG.md`**
  (Kostentreiber-Matrix, Rechenformel, adaptiver Baukasten-UX, Nummernkreis-Bridge Angebot→Rechnung,
  selbstlernende Vor-/Nachkalkulation, BLP als Vorbereitungs-/Kontrollschicht für DATEV, Mehrrechner/Sync).
  **Prime Directive:** Kalkulation rein intern, Angebot/Rechnung neutral nach außen. Offene Entscheidung
  vor Baubeginn: **Nummernkreis-Hoheit** (stellt BLP die Rechnung aus oder DATEV/Steuerberater?) — gelöst
  als **Onboarding-Setting `rechnungsstelle` `blp|extern`** (Default `blp`), Katalog §7a. ✅ **Setting umgesetzt
  (PR #125, BAUPLAN Block 2/Schritt 4):** `domain/rechnungsstelle.js` (rein, node-getestet) + Onboarding +
  Einstellungen (Wechsel-Bestätigung bei vergebenen §14-Nummern). **Konsumtion** (echte vs. vorläufige
  Nummernvergabe/Beschriftung/Export) folgt in Block 2/Schritt 7+8.
  ✅ **Kalkulations-Kern umgesetzt (PR #126, BAUPLAN Block 2/Schritt 5):** `domain/kalkulation.js` (rein,
  cent-genau, node-getestet) — Kostenarten + m²-/Maschinenstundensatz-/Zuschlags-Formel, **vorwärts**
  `kalkuliereVorwaerts` (Selbstkosten→Netto→Brutto + Deckungsbeitrag) **und rückwärts** `kalkuliereRueckwaerts`/
  `maxSelbstkosten` (Zielpreis/-marge → erlaubte Kosten/Zeit, konservativ).
  ✅ **Produkt-Schemata umgesetzt (PR #127, BAUPLAN Block 2/Schritt 6):** `domain/produktschemata.js` (rein,
  node-getestet) — die 6 kalibrierbaren Vorlagen (Folierung m²/Schild/Gravur/Leuchtreklame/Druck-Zukauf/Montage),
  die den Kern füttern (Enums + `mapping`→Kostenarten + `kalkuliereSchema`, „Hotspots" kalibrierbar via
  `kalibrierteDefaults`).
  ✅ **Angebote-Kern umgesetzt (PR #128, BAUPLAN Block 2/Schritt 7):** `domain/angebote.js` (rein, node-getestet) —
  Angebots-Datenmodell mit **zwei Schichten** (extern Positionen/Preise/USt, intern `kalkulation` je Position; Prime
  Directive via `externesAngebot`/`externePosition`-**Whitelist**), Status entwurf/offen/angenommen/abgelehnt/archiviert
  (`darfAngebotWechseln`/`setzeAngebotStatus` + Archiv-Filter), **freier** Nummernkreis `AN-JJJJ-NNNN`
  (`naechsteAngebotsSeq`/`vergebeAngebotsnummer`), Aggregation `angebotSummen` (= `orders.auftragSummen`),
  `positionAusSchema` (koppelt Schemata + Kern), `interneAuswertung` (Live-Deckungsbeitrag).
  ✅ **Angebot → Rechnung-Übernahme umgesetzt (PR #129, BAUPLAN Block 2/Schritt 8):** `domain/angebotUebernahme.js`
  (rein, node-getestet) — angenommenes Angebot → bestehender Rechnungs-/Buchungspfad (`invoicing.rechnungZeilen`),
  Nummern-Politik `uebernahmeNummer` je `rechnungsstelle` (blp → §14-Nummer, extern → vorläufige Vorlage `ENT-…`),
  `angebotUebernahmeEntwurf` referenziert die Angebotsnummer (nicht wiederverwendet, zwei getrennte Kreise/GoBD),
  baut nur auf `externesAngebot` (Prime Directive), `validateAngebotUebernahme`/`darfAngebotUebernehmen`. **Rein, kein UI.**
  ✅ **Auftrags-Kostenträger + Nachkalkulation umgesetzt (PR #130, BAUPLAN Block 2/Schritt 9):** `domain/nachkalkulation.js`
  (rein, node-getestet) — Kostenträger = Auftrag über `kostenstelle`; **IST** `istkostenAusBuchungen` (Aufwand
  festgeschriebener Buchungen je `kostenstelle`, Aggregationsweg wie `costcenters.js`, `belegRef`/`buchungId` mitgeführt,
  konto→Kostenart über `kontoBlock`) + `istZeitkosten` (`employees.js`-`{dauerMin}` × interner Stundenkostensatz) +
  `istkosten`; **SOLL** `sollkostenAusAngebot` (interne `kalkulation` je Position × Menge nach Kostenart); **Vergleich**
  `nachkalkulation` (Abweichung IST−SOLL je Kostenart + Prozent + Deckungsbeitrag Soll/Ist) + `kostentraegerAnalyse`.
  **Rein, kein UI/Store.**
  ✅ **Kalibrierung + Statistik/Vergleich umgesetzt (PR #131, BAUPLAN Block 2/Schritt 10):** `domain/kalibrierung.js`
  (rein, node-getestet) — **(1)** Korrekturfaktoren je Kostenart aus der Historie Vor→Nachkalkulation `korrekturFaktoren`
  (`faktor` ΣIST/ΣSOLL + `medianFaktor` + `abweichungProzent` + `anzahl`) → `faktorWerte` (Multiplikatoren mit
  `minAnzahl`/`min`/`max`-Schranken), **Rückfluss in den Kern** `kalibriereEingabe`/`kalkuliereKalibriert` (skaliert
  je Kostenart den Mengen-/Geld-Treiber, keine neue Formel); **(2)** Angebots-Trefferquote je Preisniveau
  `angebotErgebnis`/`angebotMargeProzent`/`preisniveau`/`trefferquote`/`trefferquoteJePreisniveau`; **(3)**
  `kalibrierungsDigest` = **PII-freie** Aggregat-Zusammenfassung als Payload-Kandidat für eine spätere, **strikt
  opt-in + BYOK** pseudonyme KI-Analyse (Mistral EU) — sendet NICHTS. **Rein, kein UI/Store** (eigener Folgeschritt).
  ✅ **Adaptiver Baukasten — reine Sortier-/Zähl-Logik umgesetzt (PR #132, BAUPLAN Block 2/Schritt 11a):**
  `domain/baukasten.js` (rein, node-getestet, +33 → 1427/1427) — **(1)** Nutzungszähler je Leistungsart
  (`leeresNutzungsprofil`/`normalizeNutzung`/`nutzungVon`/`anzahlVon`/`istGenutzt`/`zaehleNutzung`, immutabel,
  Zeitstempel injizierbar); **(2)** adaptive Palette `baukastenPalette`/`sortiereSchemata`/`haeufigsteSchemata`
  (Sortierung häufig → zuletzt → Katalog-Reihenfolge, stabil); **(3)** Umsortieren `verschiebePosition`/
  `verschiebeNachOben`/`verschiebeNachUnten` (immutabel, behält Element-Referenz → interne `kalkulation` unberührt).
  SW `v115`. **Rein, kein UI.**
  ✅ **Adaptiver Baukasten — UI umgesetzt (BAUPLAN Block 2/Schritt 11b, 2026-06-18):** neue Angebots-Ansicht
  `ui/views/angebote.js` (NAV „Angebote", in privat/verein ausgeblendet) + verschlüsselte Store-Glue
  `domain/angebote-store.js` (`saveAngebot`/`listAngebote`/`getAngebot`/`deleteAngebot`/`setzeAngebotStatusStore`;
  Nummernkreis `AN-JJJJ-NNNN`; Positionen behalten interne `kalkulation` → Live-DB überlebt Speichern). UI: adaptive
  Karten je Leistungsart (`baukastenPalette`/`haeufigsteSchemata`, Nutzungsprofil gerätelokal in Settings via
  `zaehleNutzung`), Schema-Felder→`positionAusSchema`, Drag-and-drop-Positionsliste (`verschiebePosition` + ↑/↓),
  Live-Deckungsbeitrag (`interneAuswertung`, „intern — nicht im Angebot"), Status-Workflow + Archiv, neutrales
  Angebotsdokument (Druck) nur über `externesAngebot`-Whitelist. SW `v116`, 1427/1427 grün; **DOM/IndexedDB statisch
  geprüft** (kein Headless-Browser → Browser-Sichttest des Nutzers steht aus). Damit **Block-2-Kernkette (4–11) komplett.**
  ⏭ **Nächster Schritt: Block 2/Schritt 8-UI „Rechnung aus Angebot"** (reine Logik `angebotUebernahme.js` steht):
  Knopf am angenommenen Angebot → Buchungs-Entwurf über bestehenden Pfad (`saveEntwurf`), Nummernpolitik je
  `rechnungsstelle`, danach Angebot→archiviert. Katalog §4/§7a.
  **Nächster Schritt: Schritt 10 Kalibrierung + Statistik/Vergleich** (Korrekturfaktoren aus eigener Historie
  Vor→Nachkalkulation, Trefferquote; optional KI Mistral EU opt-in/pseudonym), dann 11 Baukasten-UX. **Offene
  Folgeschritte:** UI „Rechnung aus Angebot" + Store-Glue (Zähler je Kreis); UI „Nachkalkulation/Kostenträger" +
  Zeiterfassung je Auftrag + Beleg-/Buchungs-Zuordnung (Store-Glue).
- **Datensicherung — wählbare 3-2-1-Strategie (Pflicht #1): JA, Anforderung steht.** Verbindliches Doku:
  **`docs/DATENSICHERUNG.md`** (Stellen: BLP intern · verschlüsselter gewählter Ordner re-importierbar ·
  Server/Offsite; **freie Nutzer-Wahl `backupStrategie`** beim Onboarding + in Einstellungen änderbar;
  **Backup→Restore-Roundtrip-Selbsttest** als beweisbare Prüfung). Backup-Kern existiert bereits
  (`core/backup.js`, verschlüsselte `.blpr.json`, Shamir, persist).
  ✅ **Schritt 1 (Roundtrip-Selbsttest) erledigt + gemergt (PR #116, 2026-06-18):** `core/backup.js`
  `backupRoundtripSelbsttest` (byte-genauer Vergleich Original↔wiederhergestellt), in den „Selbsttest" (V10)
  gehängt; +15 Node-Tests (1095/1095), SW `v103`.
  ✅ **Schritt 3 (Datensicherungs-UX + `backupStrategie`) erledigt + gemergt (PR #124, 2026-06-18):** prominente
  „Datensicherung"-Karte (Dashboard + Banner + Einstellungen) mit **Drag-and-drop-Restore**; **gemerkter Zielordner**
  (File System Access, `core/backupOrdner.js`; Tablet/ohne API/ohne Ordner → **Download-Fallback**); Setting
  **`backupStrategie`** (`download`|`ordner`) im Onboarding + Einstellungen. `domain/backupStrategie.js` (rein,
  node-getestet), `core/backup.js exportBackupSmart`, `ui/datensicherung.js`; +17 Tests (1158/1158), SW `v107`.
  **Verbleibend (Schritt 4, `docs/DATENSICHERUNG.md` #4):** Server-/Offsite-Ziel (eigener Server existiert noch
  nicht) + konfigurierbare Erinnerungs-Kadenz. **→ BAUPLAN Block 1 komplett (Schritt 1 + 2a–2c + 3).**
- **Test-Modus (Sandbox-Tresor): JA, Spec steht.** Verbindliches Doku: **`docs/TEST_MODUS.md`** (wegwerfbarer
  Test-Tresor über die Mehrmandanten-Schicht; mehrere getrennte Tests, behalten/verwerfen/aufräumen, optional
  Demo-vorbefüllt; echte Daten unberührt; build-frei/node-testbar). **WICHTIG:** Auch **Mein-WorkFloh** soll
  einen Test-Modus nach dieser Spec bekommen (⇄-Abschnitt im Doku; eigenes Repo, über den Nutzer).
  ✅ **2a Sandbox-Kern (rein) erledigt + gemergt (PR #118, 2026-06-18):** `domain/mandanten.js`
  (`erstelleSandbox`/`dbNameFuer({sandbox})`/`istSandboxDbName`/`echteMandanten`/`sandboxMandanten`/
  `entferneAlleSandboxes`/`verwaisteSandboxDbs` …).
  ✅ **2b Store-Glue erledigt + gemergt (PR #120, 2026-06-18):** `core/sandboxStore.js`
  (`erstelleSandboxTresor`/`wechsleZuSandbox`/`leereSandboxTresor`/`loescheSandboxTresor`/`loescheAlleSandboxes`
  + `raeumeVerwaisteSandboxesAuf` Boot-Aufräumen via `indexedDB.databases()`, in `main.js` verdrahtet); reine
  Helfer `sandboxDbNamen`/`aktiveDbName` node-getestet; `wechsleAktivenMandant` nutzt jetzt `dbNameVon`.
  SW `v105`, 1132/1132.
  ✅ **2c UI erledigt + gemergt (PR #122, 2026-06-18):** „🧪 Tests"-Bereich am Sperrbildschirm + in den
  Einstellungen (`ui/lock.js`/`ui/shell.js`: öffnen/leeren/löschen je Test, „Neuer Test", „Alle Tests löschen",
  verschlanktes Test-Onboarding nur Passwort); dauerhafter **TEST-MODUS-Banner**; **behalten/verwerfen-Dialog**
  beim Verlassen (`behalteUndVerlasseSandbox`/`loescheSandboxTresor`); reine Helfer `aktiverSandbox`/
  `naechsterTestName` node-getestet; Korrektur `initMandanten`→`aktiveDbName()`. SW `v106`, 1141/1141.
  **★ Test-Modus (2a–2c) damit KOMPLETT.**
  ✅ **2d Demo-Vorbefüllung erledigt (2026-06-18, BAUPLAN Schritt 2d):** beim „Neuer Test" wahlweise leer oder mit
  Demo-Daten. Reine Logik `domain/demodaten.js` (`demoEntwuerfe`/`demoBefuellungsplan`, node-getestet); Store-Glue
  `domain/demodaten-store.js befuelleMitDemodaten` schreibt in den aktiven Sandbox-Tresor über den echten GoBD-Pfad
  (`ensureAccountsSeeded`→`setAnfangsbestand`→`addAnlage`→`saveEntwurf`+`festschreiben`); UI `ui/lock.js renderNeuerTest`
  (Radio-Wahl). SW `v119`, +10 Tests (**1444/1444**). Glue/DOM/IndexedDB statisch geprüft.
- **★ GESAMT-BAUPLAN nächste Phase:** **`docs/BAUPLAN.md`** — geordnete Reihenfolge aller vereinbarten Themen
  (Block 1 Vertrauen/Sicherheit: Roundtrip-Selbsttest → Test-Modus → Backup-UX/`backupStrategie`; Block 2
  Kalkulation/Angebote fein geschnitten; Block 3 später/blockiert). **Arbeitsweise:** mehrere saubere PRs pro
  Sitzung wo sinnvoll (nicht zwingend 1/Sitzung).

**Festgelegte Bau-Reihenfolge (je eigener PR, Freibrief-Merge):**
1. ✅ ELSTER-Weiterleitungs-Link + AVV-Anbieterlinks (klein) — *diese Sitzung*.
2. ✅ §19-Kleinunternehmer-Abfrage im Onboarding (Punkt 27) — *erledigt*.
3. ✅ Abweichendes Wirtschaftsjahr (Punkt 28) — *erledigt*.
4. ✅ Steuerberater-Übergabe-/Datenblatt (Punkt 31) — *erledigt*.
5. ✅ Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung (Punkt 29) — *erledigt*.
6. ✅ ZUGFeRD-Empfang (PDF→CII) + KoSIT-Pflichtfeld-Precheck — *erledigt* (ZUGFeRD-Erzeugen offen, PDF-Lib).
7. ✅ A4 (erweitert) **Stufe 1 + Stufe 2 erledigt:** offenes Austauschformat (`domain/connect.js`) —
   **Import UND Export** (Aufträge-Ansicht) + **verbundene-App-Link** (Einstellungen, reziprok zu
   WorkFloh) + `docs/CONNECT.md`. **Stufe 2 (R4, PR #95):** **Rechnungs-Übernahme** (fertige Rechnung →
   Forderung/Buchung) über `rechnung`-Block (Format v2), `invoicing.rechnungsUebernahmeEntwurf`.
   **R4-Rest ✅:** **Zahlungs-/Teilzahlungs-Übernahme** über `rechnung.zahlungen[]` (Format v3),
   `invoicing.zahlungsUebernahmeEntwurf` (Bank an Forderung) + (Teil-)Zahlung am Auftrag. **Offen:** API/Push-Echtzeit.
8. Mehrmandantenfähigkeit (groß).
9. Bilanzierung / V-Bilanz (groß).
10. ELSTER-Stufe 2 / Restpunkte B/C nach Bedarf.

### Neu aufgenommene Klein-/Folgepunkte (aus Brainstorming-Abgleich)
- [x] **27 — §19-Kleinunternehmer-Abfrage im Onboarding** ✅ (Schritt zwischen Shamir &amp; Backup,
      `lock.js stepProfil`, speichert `kleinunternehmer`; in Einstellungen weiter änderbar). [erledigt]
- [x] **28 — Abweichendes Wirtschaftsjahr** ✅ (`domain/geschaeftsjahr.js`: `wjPeriode`/
      `wirtschaftsjahrVon`/`wjBeginnYYYYMMDD`; Setting `wirtschaftsjahrBeginn` MM-TT; Dashboard +
      DATEV-EXTF-WJ-Beginn nutzen es; USt-VA bleibt bewusst kalendarisch). 10 Tests. [erledigt]
- [x] **29 — Beleg↔Buchung-Verknüpfung + GoBD-Aufbewahrung** ✅ (`domain/aufbewahrung.js`:
      `aufbewahrungBis`/`istAufbewahrungspflichtig`/`darfBelegLoeschen`, §147 AO 10 J.; `belegRef`
      wird beim Beleg→Entwurf in die Buchung (Hash-Kette) gesetzt + `linkBeleg` rückwärts; Belege-
      Liste zeigt „aufbewahren bis", Löschen verknüpfter Belege blockiert, Frist-Warnung). 7 Tests. [erledigt]
- [x] **31 — Steuerberater-Übergabe-Datenblatt** ✅ (`export.buildUebergabeText`; Karte „Übergabe an
      den Steuerberater" in „Berichte": Firmenprofil/Zeitraum/USt-VA/EÜR + mitzugebende Dateien; Druck→PDF / TXT). [erledigt]

---

## V. PROFI-READINESS — Vollständigkeits-Fahrplan (echte Buchhaltung)

> **Ziel (Nutzer 16.06.):** Die Buchhaltung soll für eine **echte Firma** taugen, ohne dass ein
> Steuerberater/Buchhalter/Betriebsprüfer sie wegen **fehlender Pflicht-Bausteine sofort ablehnt**.
> Daher: lückenlos, Schritt für Schritt, nichts auslassen. Diese Liste ist der **verbindliche
> Master-Plan**; sie wird oben in `PULS.md §7` als oberste Priorität referenziert.
>
> **Annahmen (Scope, explizit — sonst ändern!):** primär **EÜR** (Freiberufler/Kleinunternehmer/
> Einzelunternehmer, §4 Abs.3 EStG), **Kalenderjahr**, **1 Mandant**. **Bilanzierung (GmbH, GuV/
> Bilanz)** und **Lohnbuchhaltung** sind **bewusst eigene große Spuren** (V-Bilanz / V-Lohn) — für
> eine EÜR-Firma nicht zwingend; Lohn macht i. d. R. separate Software/der Berater.
>
> Status aus Audit (2026-06-16): ✅ vorhanden · ◑ teilweise · ❌ fehlt.

**Bereits solide vorhanden (Fundament):** doppelte Buchführung mehrzeilig + USt-Split
(`journal.js`), **GoBD**-Festschreibung/Hash-Kette/Storno/lückenloser Nummernkreis (`store.js`,
`audit.js`), USt-VA-Kern (Kz 81/86/66/83), **EÜR Soll + Ist** (§4 Abs.3, `taxes.js`), Rechnung
§14-Pflichtangaben (`rechnung.js`), E-Rechnung XRechnung-CII (`erechnung.js`), Bankimport MT940/
CAMT + Zahlungsabgleich, **Offene Posten Debitoren/Kreditoren + Mahnwesen** (§288). Firmenstammdaten
verschlüsselt (`state.js firma`).

### Abzuarbeiten (Reihenfolge = Bau-Priorität)

- [x] **V1 — Kontenrahmen vollständiger + Konten anlegen/bearbeiten [MUSS] — erledigt (2026-06-16).**
      Seed von 18 → **57 gängige SKR03-Konten** (Anlagevermögen/GWG, Privat, Kfz/Reise/Werbung/
      Bewirtung, AfA, Beratung/Buchführung, steuerfreie Erlöse …). **UI „Konto anlegen/bearbeiten/
      löschen"** (`views/accounts.js`): `addKonto`/`updateKonto`/`deleteKonto` in `store.js`
      (Nummer unveränderlich, Löschen nur wenn unbenutzt), `validateKonto`/`normalizeKonto`
      (rein, node-getestet). Hinweis im Formular: vor DATEV-Export mit Berater abgleichen.
      Offen/später: vollständiger SKR03/SKR04-Profil.
- [x] **V2 — Vorsteuer §13b / Reverse-Charge + EU/Ausland [MUSS].** ✅ Umgesetzt:
      `baueReverseChargeZeilen` (journal.js) bucht bei §13b/innergem. Erwerb Vorsteuer **und**
      geschuldete USt gleichzeitig (Netto an den Lieferanten); neue Konten 1577/1787 (§13b) +
      1574/1772 (ig Erwerb) + 8120/8125 (steuerfreie Ausfuhr/ig Lieferung) mit `rolle`-Markern;
      `buildUstVa` erweitert um **Kz 46/47/67** (§13b), **Kz 89/93/61** (ig Erwerb), **Kz 41/43**
      (steuerfrei) inkl. korrekter Zahllast (RC neutralisiert sich); Umsatzart-Auswahl im
      Journal-Formular; node-getestet (28 Tests). **Offen/ehrlich:** §13b modelliert für 19 %
      (Hauptfall Cloud/Software); exakte Kz-Zuordnung am ELSTER-Formular/mit Berater verifizieren;
      noch nicht im E-Rechnungs-Empfang automatisch erkannt (manuelle Umsatzart-Wahl).
- [x] **V3 — Anlagevermögen + AfA + Anlagenverzeichnis [MUSS].** ✅ Umgesetzt: `domain/anlagen.js`
      (rein, node-getestet) mit **GWG-Sofortabschreibung (§6 Abs.2)**, **Sammelposten (§6 Abs.2a,
      5 J.)**, **lineare AfA (§7 Abs.1, pro rata temporis monatsgenau)**; `anlagen-store.js`
      (Stammdaten-CRUD), Ansicht **„Anlagen"** (Erfassen/Bearbeiten, Anlagenverzeichnis je
      Wirtschaftsjahr, **AfA-Buchung als Entwurf**, **Anlagenverzeichnis/AVEÜR-CSV**). 25 Tests.
      **Offen/ehrlich:** AVEÜR-CSV ist AVEÜR-*orientiert* (kein amtliches Formular); GWG-Aufzeichnungs-
      untergrenze (250 €), degressive AfA, Sonderabschreibungen, Abgang/Verkauf nicht modelliert.
- [x] **V4 — Eröffnungs-/Anfangsbestände + Kassenbuch [MUSS].** ✅ Umgesetzt: `domain/kassenbuch.js`
      (rein, node-getestet) — `kassenbuchEintraege` (chronologisch aus festgeschriebenen Buchungen),
      `kassenbericht` (Anfangsbestand + Einnahmen − Ausgaben = Endbestand, **laufender Bestand**,
      **GoBD-Prüfung „nie negativ"**), `anfangsbestandZeilen` (Soll Geldkonto an Saldenvortrag 9000;
      neues Konto 9000). `anfangsbestand-store.js` (je Konto/Jahr), Ansicht **„Kassenbuch"**
      (Konto-/Jahr-Wahl, Anfangsbestand speichern + als Buchungsentwurf, Kassenbericht,
      Negativ-Warnung, Kassenbuch-CSV). 13 Tests. **Offen/ehrlich:** offenes Kassenbuch — KEINE
      zertifizierte TSE/Kassensicherungsverordnung (elektronische Registrierkasse).
- [x] **V5 — USt-VA komplett: Periodentyp + Dauerfristverlängerung + ELSTER-Datenpaket [MUSS].**
      ✅ Umgesetzt: `domain/umsatzsteuer.js` (rein, node-getestet) — `voranmeldungsperioden`
      (monatlich/vierteljährlich/jährlich, ELSTER-Zeitraum-Codes 01–12/41–44, schaltjahr-sicher),
      `periodeIndexFuer`, **`sondervorauszahlung` (1/11 Vorjahres-Zahllast)**, `jahresZahllast`.
      `export.buildElsterVaPaket` (Kennzahlen + Steuernummer/Zeitraum, mit Disclaimer).
      Auswertungen: Karte **„USt-VA je Zeitraum"** (Typ/Jahr/Periode wählbar, Zahllast,
      Sondervorauszahlung-Hinweis, **ELSTER-Datenpaket-Export** + Perioden-CSV). Setting
      `vaZeitraum`. 16 Tests. **Offen/ehrlich:** „ELSTER-Datenpaket" = strukturierte Übergabedatei,
      **KEIN ERiC-XML/-Direktversand**; Jahres-USt-Erklärung (eigenes Formular) nicht abgebildet.
- [x] **V6 — Anlage EÜR (Zeilenschema) + Kontenblätter + SuSa [MUSS/SOLL].** ✅ Umgesetzt:
      `domain/berichte.js` (rein, node-getestet) — `summenSaldenliste` (SuSa mit Summen),
      `kontenblatt` (Kontoauszug je Konto, chronologisch, laufender Saldo, Entwürfe ausgeschlossen),
      `anlageEUR` (Erfolgskonten → **Anlage-EÜR-Gruppen**, netto, Überschuss wie computeEUR) +
      `eurGruppeFuer`. Export `buildSusaCsv`/`buildKontenblattCsv`/`buildAnlageEURCsv`. Neue
      Ansicht **„Berichte"** (Anlage-EÜR-Gruppierung, SuSa-Tabelle, Kontenblatt mit Konto-Auswahl;
      je CSV). 17 Tests. **Offen/ehrlich:** Anlage-EÜR ist an der Formularstruktur *orientiert* —
      exakte amtliche **Zeilennummern** (jahresabhängig) sind am Formular/mit Berater zu prüfen.
- [x] **V7 — Betriebsprüfer-Export GoBD (GDPdU, „Z3"/IDEA) [MUSS].** ✅ Umgesetzt:
      `core/zip.js` (zero-dep ZIP-Writer, store + CRC-32) + `domain/gdpdu.js` (rein,
      node-getestet): `buildGdpduIndexXml` (Beschreibungsstandard, DOCTYPE → `gdpdu-01-09-2004.dtd`),
      `gdpduCsvBuchungen` (nur festgeschrieben) / `gdpduCsvKonten`, `buildGdpduPaket`.
      Export-Karte in **„Berichte"** → ZIP-Datenpaket (index.xml + buchungen.csv + konten.csv +
      info). 16 Tests. **Offen/ehrlich:** GDPdU-*orientiert* — DTD wird bewusst NICHT mitgepackt
      (Prüfsoftware liefert sie), vor echter Prüfung mit IDEA testen; **kein DSFinV-K** (Kasse).
- [x] **V8 — DATEV-EXTF berater-fest [SOLL].** ✅ Vorbereitet & node-getestet: vollständiger
      EXTF-Header aus Einstellungen (**Berater-/Mandanten-Nr., Sachkontenlänge, WJ-Beginn**),
      SKR03-Standard-**BU-Schlüssel** (Vorsteuer 9/8, USt 3/2) bei einfachen Sätzen, **korrekter
      zeilenweiser Split ohne BU** bei §13b/innergem. Erwerb/Mehrfach-Splits (keine Doppelsteuer);
      Doku **`docs/DATEV_IMPORT.md`** („so importieren" + Prüf-Checkliste). 13 Tests. **Offen/ehrlich:**
      endgültige „Berater-Festigkeit" = **realer DATEV-Testimport** (privat/Steuerberater) — mit dem
      Demo-Export (`docs/TESTDATEN.md`) jetzt vorbereitbar; kein zertifiziertes 116-Spalten-EXTF.
- [x] **V9 — Korrektheit/Validierung & Kleinfälle [SOLL].** ✅ Umgesetzt: `domain/kleinfaelle.js`
      (rein, node-getestet) — `kleinbetragsrechnung` (§33 UStDV, ≤250 €), `geschenkAbzug`
      (§4 Abs.5 Nr.1, 50 € netto → Konto/VSt-Abzug), `bewirtungAufteilung` (§4 Abs.5 Nr.2,
      **rechnender** 70/30-Split, Vorsteuer 100% → Buchungsentwurf im Journal). Konten 4654/4635.
      **Periodensperre:** `pruefung.istGesperrt` + harte Sperre in `store.festschreiben` +
      Einstellung „Buchungssperre". **Kleinunternehmer-Konsistenz** (§19): Warnung bei
      USt-/Vorsteuer-Konto. **Plus Simulations-Testharness** (`domain/demodaten.js` + `docs/TESTDATEN.md`):
      deterministischer Demo-Mandant (klein/groß) → echte Export-Dateien (Berichte „Demo-Export")
      mit dokumentierten Vergleichswerten. 33 Tests.
- [x] **V10 — Browser-E2E der Buchungs-Kernpfade [SOLL].** ✅ Umgesetzt: **In-App-Selbstdiagnose**
      (`domain/selbsttest.js` + Ansicht „Selbsttest"): prüft die Kern-Engine OFFLINE (AES-GCM-
      Roundtrip + Ablehnung falsches PW, Shamir 2-von-3, GoBD-Hash-Kette + Manipulationserkennung,
      Geldrundung, doppelte Buchführung/USt-VA/EÜR/GDPdU an Demo-Daten, Export-ZIP) → ✓/✗,
      node-gespiegelt (13 Tests). **Manuelle Klickpfad-Abnahme** in `docs/ABNAHME_CHECKLISTE.md`
      (DOM/IndexedDB-Pfade, da kein Headless-Browser in der Bau-Umgebung).

### Bewusst eigene große Spuren (nur falls Rechtsform es verlangt)
- [x] **V-Bilanz — Bilanzierung (GmbH/OHG, GuV + Bilanz, §4 Abs.1/§5) [BESCHLOSSEN 2026-06-17] — ABGESCHLOSSEN.** In Teil-PRs (B1/B2/B3).
      **B1 ✅ (2026-06-17, PR #87):** Modus `gewinnermittlung` (euer|bilanz, Default euer) + Konten-Klassifikation
      (`src/domain/bilanzierung.js`, node-getestet) + Bilanz-Grundkonten 0800/0840/0860/0970 im SKR03-Seed +
      Modus-Schalter in den Einstellungen (zieht Grundkonten via `ensureSeedKonten` nach).
      **B2 ✅ (2026-06-17):** `domain/bilanz.js gewinnUndVerlust(buchungen, idx, periode)` (rein, node-getestet) +
      `buildGuvCsv` + GuV-Karte in „Auswertung" (nur Bilanz-Modus, Perioden-Filter, CSV/Druck), SW `v85`, 739/739.
      **B3 ✅ (2026-06-17):** `domain/bilanz.js bilanz(buchungen, idx, stichtag, eröffnungssalden)` (rein, node-getestet)
      → Aktiva/Passiva aus den Bestandskonten-Salden zum Stichtag, Ergebnis (Jahresüberschuss/-fehlbetrag) ins
      Eigenkapital, **Aktiva = Passiva (inkl. Ergebnis)** geprüft (`ausgeglichen`/`differenz`), Eröffnungssalden
      (Saldenvortrag 9000 ODER Parameter); `buildBilanzCsv` + Bilanz-Karte in „Auswertung" (nur Bilanz-Modus), SW `v86`,
      760/760. **Grenze:** Bilanz im Konten-Sinn, keine §266-HGB-Gliederung, keine Konzernabschlüsse/E-Bilanz-Taxonomie;
      Konten nach Kontoart, nicht nach Saldovorzeichen umgegliedert. **Rest-Idee (KANN):** Eröffnungsbilanz-Eingabemaske.
- [x] **V-Lohn — Lohn-Buchungskern ✅ KOMPLETT (2026-06-18, BAUPLAN Block 4 L1–L6).** Bewusst eng: BLP **bucht**
      Lohn/Gehalt GoBD-sicher (Brutto-Methode), **berechnet aber keine** Lohnsteuer/SV (kein ELStAM/DEÜV/amtl.
      Tabellen — die Beträge kommen aus der Entgeltabrechnung des Lohnbüros/Beraters). Finiter 6-Schritte-Plan
      siehe `docs/BAUPLAN.md` Block 4 (L1–L6). **L1 ✅ (#158):** reine Logik `domain/lohnbuchung.js`
      (`lohnBuchungZeilen`/`lohnBuchungEntwurf`/`validateLohnlauf`) + Seed-Konten 4110/1740/1741/1742. **L2 ✅ (#159):**
      Store `domain/lohn-store.js` (verschlüsselt; `bucheLohnlauf`) + reine `normalizeLohnlauf`/`lohnkontoAggregat`/
      `lohnlaufBuchungsdatum`. **L3 ✅ (#160):** UI `ui/views/lohn.js` (NAV „Lohn", privat/verein ausgeblendet) — Lohnlauf
      erfassen → Live-Vorschau → speichern → „Buchen (Entwurf)" → Lohnkonto je Mitarbeiter; **end-to-end bedienbar.**
      **L4 ✅ (#162):** Lohnsteuer-Anmeldung-Datenpaket (`lohnsteuerAnmeldung` + `buildLohnsteuerAnmeldungPaket`).
      **L5 ✅ (#163):** SV-/LSt-Zahlungsübersicht (`offeneLohnabgaben` + `bucheLohnabgaben`). **L6 ✅:** `docs/LOHN.md`.
      Endstand SW `v140`, Tests **1754/1754**. **Verbleibend optional:** Browser-Sichttest der Lohn-Ansicht.
      **Bewusst außen vor (eigenes, zertifiziertes Produkt):** vollautomatische Brutto→Netto-Berechnung,
      SV-Meldungen, ELStAM, Beitragsnachweise.
- [x] **V-Multi — Mehrmandantenfähigkeit ✅ abgeschlossen (2026-06-17).** M1 ✅ (reine Schicht
      `src/domain/mandanten.js`). M2a ✅ (Core: `core/db.js` aktive DB konfigurierbar + `core/mandantenStore.js`
      Registry/`initMandanten`/`wechsleAktivenMandant`). M2b ✅ (Sperrbildschirm-UI: Auswahlliste, „Neuer
      Mandant" → eigener Tresor-Onboarding, Wechsel, DSGVO-Hinweis). **M3 ✅** (`ui/shell.js`: aktiver
      Mandanten-Name im Header + „Mandant wechseln"; Einstellungen „Mandanten verwalten": umbenennen/entfernen
      — Entfernen nur mit Bestätigung, Tresor-DB bleibt; Doku **`docs/MANDANTEN.md`**). **Grenze:** Entfernen =
      aus Liste nehmen, kein Löschen + keine Re-Import-UI; Glue/UI statisch geprüft (kein Headless-Browser).

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

**Persistente Mahnstufe + manuelle Zins-/Gebühren-Erfassung erledigt (2026-06-16):** Auftrag führt
`mahnungen[]` (Verlauf je gesendeter Mahnung mit Datum/Stufe/Zinsen/Gebühren);
`mahnwesen.letzteMahnstufe`/`vorschlagNaechsteStufe`/`mahnVerlaufSumme`/`mahnStufeLabel` (rein,
node-getestet). UI: Karte zeigt „zuletzt gemahnt: …", die nächste Stufe zählt hoch (nicht nur aus
Tagen abgeleitet); im Mahnschreiben **editierbare** Verzugszinsen/Mahngebühren (vorbelegt mit §288)
+ „Als gesendet vermerken". `crm-store.mahnungErfassen()`. SW `v62`.
**Buchung von Zinsen/Gebühren erledigt (R1, 2026-06-17):** `mahnwesen.mahnbuchungZeilen`/`mahnbuchungEntwurf`
(rein, node-getestet) buchen **Forderung 1400 an Zinserträge 2650 / sonstige betr. Erträge 2700 — ohne USt**
(nicht steuerbarer Schadensersatz §288 BGB / Abschn. 1.3 UStAE, ehrlich dokumentiert). Knopf
**„Als Buchungsentwurf übernehmen"** im Mahnschreiben (`reports.js`) → `saveEntwurf`, **manuell/kein
Auto-Festschreiben** (GoBD). SW `v87`, 783/783 Tests.
**Zahlungsziel je Rechnung erledigt (2026-06-17, R3):** Eingangsrechnungen tragen jetzt ein Feld
`zahlungszielTage`; `payables.berechneFaelligAm(rechnung, defaultZielTage)` (explizites `faelligAm` →
Datum + rechnungseigenes Ziel → Datum + Default 30) wird in `offeneVerbindlichkeiten`/
`anreichereVerbindlichkeiten`/der OP-Liste genutzt, validiert (ganzzahlig ≥ 0), node-getestet.
**Zahlungsziel je Forderung erledigt (2026-06-17, A1-Rest):** Aufträge tragen jetzt ein optionales
`zahlungszielTage`; `mahnwesen.faelligAmVon(posten, defaultZielTage)` (explizites `faelligAm` → Rechnungsdatum +
posten-eigenes Ziel → Default) wird von `anreicherePosten`/`mahnschreibenDaten` genutzt, `payables.berechneFaelligAm`
delegiert daran (Duplikat entfernt). `zahlungsabgleich.offenePosten` reicht `faelligAm`/`zahlungszielTage` des Auftrags
durch; `orders.validateAuftrag` validiert das Ziel; UI-Feld „Zahlungsziel (Tage)" im Auftragsformular. node-getestet
(+16 → 1045/1045), SW `v99`.
**„zahlbar bis" auf der §14-Rechnung erledigt (2026-06-17):** Das auftragseigene `zahlungszielTage` erscheint jetzt als
Fälligkeitsdatum **„zahlbar bis JJJJ-MM-TT"** auf dem gedruckten Rechnungsdokument. `rechnung.baueRechnung` bekam
Parameter `defaultZielTage` + Feld `zahlbarBis` (= `mahnwesen.faelligAmVon`, auftragseigenes Ziel vor globalem Default;
ohne Rechnungsdatum leer), `pflichtangaben` unverändert (Fälligkeit ist keine §14-Pflichtangabe); UI-Kopfzeile +
i18n `orders.payableUntil`. SW `v100`, +6 Tests (1051/1051).
**Zahlungsziel durabel + im Austauschformat (v4) erledigt (2026-06-17):** **(1)** Bugfix — `crm-store.saveAuftrag`
hatte `zahlungszielTage` aus seiner Feld-Whitelist **fallen gelassen**, sodass A1-Rest + „zahlbar bis" nach dem
Speichern faktisch wirkungslos waren (immer globaler Default); jetzt persistiert. **(2)** `connect.buildAustauschPaket`
trägt `rechnung.zahlungszielTage` reziprok mit (v4), `importworkfloh.normalizeRechnung` übernimmt es konservativ,
`crm-store.importWorkFloh` setzt es auf den Auftrag → Gegenstelle erbt die Fälligkeit. +8 Tests (1059/1059), SW `v101`.
**Edit bestehender Aufträge erledigt (2026-06-17):** ein noch nicht berechneter Auftrag (Status angelegt/
in_arbeit/erledigt, keine Rechnung gebucht, keine Zahlung erfasst) ist jetzt **nachträglich editierbar**
(Titel/Kunde/Kostenstelle/Zahlungsziel/Positionen). `orders.darfAuftragBearbeiten` (GoBD-Guard) +
`orders.anwendeAuftragEdit` (nur freigegebene Felder, `AUFTRAG_EDIT_FELDER`) rein/node-getestet;
`crm-store.updateAuftrag` (Guard + Validierung + `encPut`); UI: „Bearbeiten"-Knopf + prefill-fähiges Formular
(`_editAuftrag`). +21 Tests (1080/1080), SW `v102`.
**Eingangsrechnungs-Verzug (Gegenseite) erledigt (2026-06-18, BAUPLAN Block 3):** Spiegel zum Mahnwesen aus
**Schuldnersicht**. Reine Logik `src/domain/eingangsverzug.js` (node-getestet, +33 → **1516/1516**): `verzugsstufe`
(gestaffelte Überfälligkeit 1/14/42 Tage) + `verzugsstufeLabel`, `verzugsLage`, `berechtigteVerzugskosten`
(§ 288-Zinsen + 40-€-Pauschale, wiederverwendet aus `mahnwesen.js`), **`pruefeErhalteneMahnung`** (geforderte vs.
berechtigte Verzugszinsen/Mahngebühren → `plausibel`/`ueberhoeht`/`kein_verzug`/`ohne_angabe`, Toleranz 5 Cent),
`verzugUebersicht`. UI `ui/views/payables.js`: Verzugsstufen-Badge je überfälligem Posten + Knopf „Mahnung prüfen" →
Karte „Erhaltene Mahnung prüfen (§ 288 BGB)" (Live-Vergleich + Bewertungs-Badge + § 286/§ 247-Disclaimer; bucht
nichts). i18n de+en, CSS `.badge-error`, SW `v123`. **Grenze:** Hilfs-Einordnung nach Tagen, keine Rechtsberatung;
Buchung gezahlter Verzugskosten (Zinsaufwand) als Folgeschritt — siehe unten. DOM/IndexedDB statisch geprüft.
**Buchung gezahlter Verzugskosten (Zinsaufwand) erledigt (2026-06-18, BAUPLAN Block 3, PR #141):** Spiegel zu
`mahnwesen.mahnbuchungEntwurf` (R1) aus Schuldnersicht. Reine Logik `src/domain/eingangsverzug.js` (node-getestet,
+20 → **1536/1536**): `VERZUG_AUFWAND_KONTEN` (SKR03: 2100 Zinsaufwand / 4980 sonstiger Aufwand / 1200 Bank /
1600 Verbindlichkeit) + `VERZUG_GEGENKONTO` (bank|verbindlichkeit); `verzugAufwandZeilen` (Soll 2100/4980 AN Haben
Bank/Verbindlichkeit, **ohne Vorsteuer** — Schadensersatz Abschn. 1.3 UStAE; ausgeglichen; Konto-Override);
`verzugAufwandEntwurf` (Buchungs-Entwurf, null bei 0/0). UI `ui/views/payables.js`: in der „Mahnung prüfen"-Karte
neuer Abschnitt „Verzugskosten buchen (Zinsaufwand)" — Gegenkonto-Wahl + Knopf → Buchungs-ENTWURF (`ensureSeedKonten`
+`saveEntwurf`; Festschreiben manuell, GoBD). i18n de+en, SW `v124`. **Grenze:** bucht die eingegebenen geforderten
Beträge (keine Auto-Deckelung); DOM/IndexedDB statisch geprüft.
**Verzugsrisiko-Übersicht in der Verbindlichkeiten-Ansicht erledigt (2026-06-18, BAUPLAN Block 3 — Folgeschritt zu #140):**
Die in #140 angelegte node-getestete KPI-Logik `verzugUebersicht` war in keiner UI sichtbar. Reine Logik
`src/domain/eingangsverzug.js` **`verzugReport(rechnungen, opts)`** (node-getestet, +7 → **1543/1543**): Ein-Aufruf-
Einstieg von den gespeicherten Eingangsrechnungen zur KPI (`offeneVerbindlichkeiten` → `anreichereVerbindlichkeiten`
→ `verzugUebersicht`; Import zyklenfrei). UI `ui/views/payables.js`: Karte „Verzugsrisiko (eigene Zahlungsdisziplin)"
am Kopf (überfällige Anzahl/Summe + § 288-Zinsrisiko + kritisch ≥ 14 Tage), nur sichtbar wenn etwas überfällig ist;
bucht nichts. i18n de+en, SW `v125`. **Grenze:** Hilfs-Einordnung, keine Rechtsberatung; DOM/IndexedDB statisch geprüft.
**Dashboard-KPI: überfällige Forderungen (Mahnwesen) erledigt (2026-06-18, BAUPLAN Block 3 — Folgeschritt zu #143, PR #145):**
Spiegel zur Verbindlichkeiten-KPI (#143), aber aus **Gläubigersicht** — die hier (A1, „nachzuarbeiten") dokumentierte
Dashboard-Intention „sichtbar in Dashboard: Kennzahl überfällige Forderungen, Summe + Anzahl". Reine Logik
`src/domain/mahnwesen.js` (node-getestet, +20 → **1571/1571**): **`forderungUebersicht(angereichertePosten, opts)`**
→ `{anzahl, ueberfaelligAnzahl, ueberfaelligCent, zinsRisikoCent, kritischAnzahl}` (Spiegel zu
`eingangsverzug.verzugUebersicht`; kritisch ab 1. Mahnung/≥14 Tage; Zins-Potenzial = Σ §-288-Zinsen, b2b-Default true);
**`FORDERUNG_AMPEL`/`forderungAmpel`** (Spiegel zu `verzugAmpel`); **`forderungReport(auftraege, opts)`**
(Ein-Aufruf-Einstieg `offenePosten` → `anreicherePosten` → `forderungUebersicht`; Import `mahnwesen → zahlungsabgleich`
zyklenfrei). UI `ui/views/dashboard.js`: Karte „Überfällige Forderungen (Mahnwesen)" am Kopf — nur bei aktivem Mahnwesen
(`zeigeFeature(s, FEATURE.MAHNWESEN)`, in Privat ausgeblendet) UND wenn etwas überfällig ist; Klick → Berichte
(Mahnwesen-Karte); bucht nichts. i18n de+en (`dashboard.overdueReceivables*`), SW `v127`. **Grenze:** Hilfs-Einordnung,
keine Rechtsberatung; aggregiertes Zins-Potenzial mit konservativem B2B-Aufschlag (kein per-Kunde-B2B); DOM/IndexedDB statisch geprüft.
**[Sichttest]** `saveAuftrag`/`updateAuftrag`-Persistenz (IndexedDB) ist nur statisch geprüft → im Browser bestätigen.

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

**Foto/PDF + eigene Ansicht erledigt (2026-06-17, R3):** `payables.extraktionZuEingangsrechnung(ex, opts)`
bildet aus einem OCR-/Extraktions-Ergebnis (Vision EU → `ai/extract`) einen Eingangsrechnungs-Entwurf
(Netto cent-genau aus Brutto+USt, 0-%-Fallback, fehlende Felder nicht erfunden); node-getestet.
UI: **neue Ansicht „Verbindlichkeiten"** (`ui/views/payables.js`, Nav nach „Belege") zum **manuellen
Anlegen/Bearbeiten/Stornieren/Löschen** + optional „auf Ziel" buchen; im Beleg-OCR (`documents.js`)
zusätzlich **„Verbindlichkeit aus diesem Beleg erfassen"**. SW `v90`, +25 Tests (863/863).
**Noch offen [SOLL]:** Verzug der Gegenseite (Eingangsrechnungs-Mahnung erhalten/prüfen) — Teilzahlung/
Skonto/Sammelzahlung sind über A3/R2a/R2b bereits abgedeckt.

### A3. Teilzahlungen & unscharfes Matching — **Kern erledigt ✓ (Verbindlichkeiten), Rest offen**
**Erledigt (2026-06-16):** `zahlungsabgleich.findeKandidaten()` (rein, node-getestet) liefert
**gerankte** Kandidaten mit Art `exakt` / `toleranz` (Rundungs-Cent) / `skonto` (Zahlung knapp
unter offen, ≤ skontoProzent — als **Hinweis**) / `teilzahlung` (Rest bleibt offen);
Überzahlungen werden konservativ nicht zugeordnet, Mehrdeutigkeit über Score (Referenz/Name/
Datumsnähe). **UI** (Bankimport): bei Verbindlichkeiten ohne exakten Treffer Knopf
**„◑ Teilzahlung verbuchen"** → bucht den gezahlten Betrag (Verbindlichkeit an Bank) + vermerkt
die Teilzahlung; Skonto wird als Hinweis gezeigt. `findeOffenePosten` (exakt) bleibt unverändert.

**Forderungs-Teilzahlung erledigt (2026-06-16):** Aufträge führen jetzt `zahlungen[]`;
`orders.auftragOffen()`/`auftragGezahlt()` (rein, node-getestet) + `zahlungsabgleich.offenePosten`
liefert den **offenen Rest** (statt Brutto). `crm-store.auftragZahlungHinzufuegen()` erfasst
(Teil-)Zahlungen und markiert bei Ausgleich automatisch „bezahlt". **UI** (Bankimport): die
„◑ Teilzahlung verbuchen"-Aktion gilt jetzt **auch für Forderungen** (Bank an Forderung, Rest
bleibt offen); exakte Zahlungen werden ebenfalls als Zahlung erfasst (Zahlungshistorie).

**Skonto-Buchung mit USt-/Vorsteuer-Korrektur (§17 UStG) erledigt (R2a, 2026-06-17):**
`domain/skonto.js` (rein, node-getestet): `skontoSplit`/`skontoBuchungZeilen`/`skontoEntwurf` +
`SKONTO_KONTEN` (SKR03 8730/8731/8736 gewährt, 3730/3731/3736 erhalten, USt 1776/1771,
Vorsteuer 1576/1571). Gleicht den offenen Posten **komplett** aus und korrigiert das **Entgelt nach
§17 UStG** (Einnahme→USt mindern; Ausgabe→Vorsteuer mindern); **gemischte USt-Sätze** proportional je
Brutto-Anteil (`posten.saetze` in `offenePosten`/`offeneVerbindlichkeiten`). UI: Knopf **„Skonto buchen
(§17 UStG)"** im Bankimport (`documents.js`) → `saveEntwurf` (manuell, GoBD). SW `v88`, 816/816 Tests.
**Bewusst manuell** (kein Auto-Festschreiben — Korrektheit vor Bequemlichkeit).

**Sammelzahlungen erledigt (R2b, 2026-06-17):** Eine Bankzahlung deckt **mehrere** offene Rechnungen ab.
`zahlungsabgleich.findeSammelzuordnung` (rein, node-getestet) schlägt **Kombinationen** gleichgerichteter offener
Posten vor (tiefen-/kandidatenbeschränkte Subset-Summe, Summe == Zahlung ± Toleranz, **≥2 Teile**, Score nach
Referenz/Name/Datumsnähe); `verteileSammelzahlung` verteilt den Zahlbetrag der Reihe nach auf die **explizit
gewählten** Posten (Restbildung beim letzten, Überschuss bleibt `unverteiltCent`); `sammelBuchungZeilen` baut **eine
Zeile je Rechnung** (Bank an Forderung/Verbindlichkeit, ausgeglichen). UI: Knopf **„◫ Sammelzahlung (mehrere
Rechnungen)"** im Bankimport (`documents.js`) → Checkbox-Auswahl (Vorschlag vorausgewählt, laufende Summe/Status) →
`saveEntwurf` (manuell, GoBD) + Zahlung je Posten. SW `v89`, 838/838 Tests.

**Noch offen [SOLL]:** —

### A4. App-Anbindung / WorkFloh-Integration **[SOLL] — Stufe 1 + 2 + R4-Rest erledigt ✓, nur API/Push offen**
**Stufe 2 erledigt (R4, 2026-06-17, PR #95):** Rechnungs-Übernahme — ein Auftrag im Austauschformat
darf einen `rechnung`-Block `{nummer, datum, leistungsdatum?}` tragen (Format **v2**, abwärtskompatibel).
`importworkfloh.normalizeImport` normalisiert/verwirft unvollständige Rechnungen; `invoicing.rechnungs-
UebernahmeEntwurf`/`validateRechnungsUebernahme` (rein, node-getestet) bauen den Buchungs-Entwurf
(Forderung an Erlöse + USt) mit der **WorkFloh-Nummer/-Datum** (keine neue BLP-Nummer);
`crm-store.importWorkFloh` bucht ihn als Entwurf + setzt den Auftrag „berechnet" (Festschreiben manuell,
GoBD); `connect.buildAustauschPaket` trägt die Rechnung reziprok mit. SW `v91`, +22 Tests (885/885).
**R4-Rest erledigt (2026-06-17):** Zahlungs-/Teilzahlungs-Übernahme — die `rechnung` darf zusätzlich ein
`zahlungen[]` `{datum, betragCent|betrag, ref?}` tragen (Format **v3**, abwärtskompatibel).
`importworkfloh.normalizeZahlungen` (rein, node-getestet) normalisiert konservativ (ISO-Datum + positiver
Betrag, Euro/Cent; unvollständig → verworfen + Warnung); `invoicing.zahlungsUebernahmeEntwurf`/
`validateZahlungsUebernahme` bauen je Zahlung einen Zahlungseingang-ENTWURF (**Soll Bank 1200 / Haben
Forderung 1400**); `crm-store.importWorkFloh` bucht je Zahlung den Entwurf + vermerkt die (Teil-)Zahlung am
Auftrag (Auto-„bezahlt" bei `auftragOffen <= 0`) und meldet `zahlungenUebernommen`; `connect.buildAustauschPaket`
trägt die Zahlungen reziprok mit. SW `v97`, +18 Tests (1001/1001). UI/Glue statisch geprüft.
**Noch offen [SOLL/KANN]:** API/Push (Echtzeit) statt Datei. **Grenze:** Überzahlung nicht gesondert behandelt
(faithful gebucht, manuell korrigierbar); Festschreiben bleibt manuell (GoBD).

**Vision (Nutzer):** Funktionierende Apps sollen sich an BookLedgerPro **anbinden** können bzw.
BookLedgerPro bietet die Anbindung an. Konkretes Beispiel **Mein-WorkFloh**: Angebote → umgesetzte
Arbeiten werden dort in eine **Rechnung** übergeführt; diese Rechnung wird dann **kombiniert in
BookLedgerPro weiterverarbeitet** (Forderung/Buchung, Zahlungsabgleich, EÜR/USt). Soll **als Option**
möglich sein, nicht erzwungen.
**Heutiger Stand (Seam vorhanden):** `domain/importworkfloh.js` (Parser/Normalisierung) +
`crm-store.importWorkFloh()` (Dedupe Kunden/Aufträge, Aufträge kommen als „angelegt" herein →
Rechnung/USt-Buchung erfolgt in BLP). Damit ist der **Datei-Import** bereits der erste Andockpunkt.
**Für die spätere Umsetzung sauber vorzubereiten:**
- Stabiles **Austauschformat/Schema** (Angebot/Auftrag/Rechnung) versionieren; klare Feld-Map
  WorkFloh→BLP (inkl. Kunde, Positionen, USt-Sätze, Rechnungsnummer, Datum, Fälligkeit).
- **Anbindungs-Option** in der UI (Import-Knopf vorhanden) → ggf. „Verbindung/Quelle"-Einstellung;
  Richtung BLP-als-Empfänger zuerst (Datei/JSON), später optional API/Push.
- **Idempotenz/Dedupe** härten (externId/externNummer — teils vorhanden), Konflikt-/Update-Fälle.
- **Rechnung statt nur Auftrag** importieren können (WorkFloh erzeugt bereits Rechnung) → direkter
  Forderungs-Posten inkl. Zahlungsabgleich; GoBD-Festschreibung bleibt in BLP manuell.
- Build-frei/offline-first + Krypto-Disziplin wahren; **opt-in**, kein Zwang.
> Bewusst **noch nicht umgesetzt** — erst nach Freigabe/Bedarf (eigene Sitzung). Hier nur als
> verbindlicher Andockpunkt festgehalten, damit die Richtung nicht verloren geht.

---

## B. MITTEL — Mehrwert / Härtung

- **[TEILWEISE 2026-06-17] E-Rechnung KoSIT:** ✅ **KoSIT-orientierter Pflichtfeld-Precheck**
  (`zugferd.kostPflichtfelder`, EN16931-Kernfelder) beim Empfang. **Offen:** echter KoSIT-Validator
  (Java) ist nicht build-frei → externer/CI-Check; keine Konformität behaupten, die nicht belegt ist.
- **[TEILWEISE 2026-06-17] ZUGFeRD:** ✅ **Empfang** — eingebettete CII/UBL aus **PDF** best-effort
  auspacken (`zugferd.extrahiereZugferdXml`, native `DecompressionStream` für FlateDecode) → bestehender
  Buchungsvorschlag. **Offen:** ZUGFeRD *erzeugen* (XML in PDF/A-3 einbetten) braucht PDF-Lib → nicht build-frei.
- **[ERLEDIGT 2026-06-17] Bankformate härten (R5a + R5a-Rest):** ✅ CAMT-Varianten **.052 (`<Rpt>`)/.054
  (`<Ntfctn>`)** zusätzlich zu .053, **Saldo-Integritätsprüfung** (`pruefeBankauszug`: Anfang ± Umsätze
  vs. Schlusssaldo) und **strukturierte RmtInf** (`CdtrRefInf`/`EndToEndId` → Beleg-Referenz). **R5a-Rest ✅:**
  echte **SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-/Struktur-Validierung** in `src/domain/bankschema.js` (rein,
  node-getestet): `validiereMT940` (SWIFT-FIN-Feldformate + Pflichtfelder + Reihenfolge), `validiereCAMT`
  (ISO-20022-Nachrichten-Struktur camt.052/.053/.054: Pflicht-Container, `<Amt Ccy>`, `CdtDbtInd`, Status/Datum),
  `validiereBankauszug` (Format-Weiche); UI-Hinweis im Bankimport. SW `v98`, +28 Tests (1029/1029).
  **Grenze (ehrlich):** Struktur-/Feldformat-Prüfung nach den dokumentierten Specs — **KEINE zertifizierte
  XSD-Validierung** (nicht build-frei) und **KEINE** SWIFT-Netzwerk-Konformität; klare Verstöße = Fehler,
  dialekt-strittige Punkte = Warnungen (konservativ). Reale Bank-Dialekte weiter mit echten Auszügen testen.
- **[SOLL] DATEV-EXTF:** „EXTF-orientiert", **nicht** das zertifizierte 116-Spalten-Format;
  Steuerschlüssel-Mapping nur Standardsätze → mit Berater/DATEV verifizieren.
- **[ERLEDIGT 2026-06-17] PII-Erkennung über Anker hinaus (NER) (R5b):** ✅ `ai/ner.js` erkennt
  konservativ E-Mail/IBAN/USt-IdNr/Steuernr/Telefon **Dritter** im Belegtext und ergänzt sie als
  zusätzliche Anker für `pseudonym.tokenize` (Setting `nerPii`, Default an, nur im Pseudonym-Modus).
  Exakte Stammdaten-Anker behalten Typ-Vorrang; node-getestet. **Grenze:** kein BIC/Namens-NER (FP-Risiko).
- **[ERLEDIGT 2026-06-17] Dreistufiger Briefkasten** (Mandant ⊃ Firma ⊃ Person) für Pseudonymisierung/CRM
  (P7, **R5c**): ✅ `ai/briefkasten.js` ordnet die exakten Stammdaten-Anker in die Hierarchie ein (eigene Firma =
  `FIRMA_1`/eigen, Mitarbeiter = deren Personen; Firmenkunden = `FIRMA_n`; Privatkunden = Personen am Mandanten) und
  vergibt **scope-präfixierte** Typen → `tokenize` erzeugt gruppierende Token (`[[FIRMA_2_IBAN_1]]`,
  `[[FIRMA_1_PERSON_1]]`). Setting `briefkastenScopes` (Default aus, opt-in), `ladeAnker` routet dann darüber + liest
  den aktiven Mandanten aus der Registry; node-getestet (+26), SW `v93`. **Grenze:** Person-Attribute hängen am
  Parent-Scope (Firma/Mandant), nicht am einzelnen Personen-Token.
- **[ERLEDIGT 2026-06-17] NER-Scoping (R5c-Rest):** ✅ Im Briefkasten-Modus (`briefkastenScopes`) tragen jetzt auch
  die im Belegtext erkannten **Fremd-PII** (NER: IBAN/E-Mail/USt-IdNr/Steuernr/Telefon Dritter) einen Scope —
  den externen Scope **`EXTERN`** (`EXTERN_IBAN`, `EXTERN_EMAIL` … → Token `[[EXTERN_IBAN_1]]`) statt flacher Typen.
  So sieht die KI sie als externe, gruppierte Dritt-Identifikatoren, sichtbar getrennt von den bekannten Mandant-/
  Firmen-Entitäten; exakte (gescopte) Stammdaten-Anker behalten bei gleichem Wert weiter Typ-Vorrang. `ai/ner.js`
  (`piiAnker(text,{scope})`/`kombiniereAnker(…,{scope})`, `EXTERN_SCOPE`), `ai/anker.js` reicht den Scope nur im
  Briefkasten-Modus durch; flacher Pseudonym-Modus unverändert. Plus: Transparenz-Badge (`documents.js`) zeigt
  scope-präfixierte Typen jetzt lesbar (i18n-`tOpt`-Fallback statt roher Schlüssel). node-getestet (+11), SW `v96`.
  **Grenze:** EIN gemeinsamer `EXTERN`-Scope — verschiedene Drittparteien werden NICHT geclustert (aus flachem
  Belegtext nur heuristisch/FP-riskant trennbar → bewusst konservativ).
- **[SOLL] UI end-to-end testen:** kein Headless-Browser in der Bau-Umgebung → DOM-/IndexedDB-Pfade
  sind nur statisch geprüft. Manuelle Sichttests dokumentieren oder Headless-E2E einführen.

---

## C. NIEDRIG / SPÄTER

- **[BESCHLOSSEN 2026-06-17] ELSTER:** Datenpaket-Download **+ Weiterleitungs-Link** zur Anbieter-Seite
  (elster.de) — **kein** ERiC-Direktversand (nicht build-frei). Stufe 1 (Link) ✅ umgesetzt.
- **[KANN] Lokales Offline-OCR** (z. B. Tesseract.js) als Vision-Alternative/Fallback.
- **[ERLEDIGT 2026-06-17] Privat-/Bürger-Modus** (vereinfachte Oberfläche für Privatpersonen/Vereine):
  ✅ **R6/P1 (PR #99)** — `domain/nutzungsmodus.js` (rein, node-getestet) führt den Nutzungskontext
  `firma|privat|verein` (Default `firma`) ein und blendet geschäftliche NAV-Ansichten je Kontext aus
  (`zeigeAnsicht`/`sichtbareAnsichten`, in `shell.js` konsumiert; Setting `nutzungsmodus`, Schalter
  „Nutzungskontext"). ✅ **R6/P2** — die **fachlichen Feature-Gates** (`zeigeFeature`) werden jetzt
  **ansichtsintern** gelesen: `journal.js` (USt-Satz/Umsatzart/Reverse-Charge + Bewirtungs-Split nur bei
  `UMSATZSTEUER`, Kostenstelle nur bei `KOSTENSTELLEN`, Submit erzwingt im Privat-Modus 0 %/Inland),
  `reports.js` (USt-Karten/Mahnwesen/Kreditoren-OP/Kostenstellen + DATEV-/USt-VA-Export je Modus),
  `documents.js` (Kreditoren-OP aus E-Rechnung/OCR nur bei `VERBINDLICHKEITEN`), `dashboard.js`
  (USt-Zahllast-KPI nur bei USt; Kunden-/Aufträge-KPI nach Ansichts-Sichtbarkeit). SW `v95`, 972/972.
  Gating ist eine **Anzeige-Vereinfachung, keine rechtliche Sperre** (im Zweifel „Firma" zeigt alles).
  **Bewusst belassen:** Verein behält per Politik USt/Verbindlichkeiten/Anlagen als Feature (nur deren
  dedizierte NAV-Ansichten sind im Verein ausgeblendet) — Policy unverändert, da node-getestet/gewollt.
- **[KANN] Sage-Mycel 5b–d:** echte Spore deployen, Hub-Registrierung, Handshake, Symbiose-Import.
- **[KANN] Performance/Lighthouse** messen.
- **[BESCHLOSSEN 2026-06-17] Mehrmandantenfähigkeit** (mehrere Firmen je Installation) — eigener großer PR.

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
