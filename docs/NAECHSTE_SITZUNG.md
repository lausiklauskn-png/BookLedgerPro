# NAECHSTE_SITZUNG.md — Paste-fertiger Nachfolge-Brief

> **Zweck:** Diese Datei enthält den **kopierfertigen Brief** für die jeweils nächste Sitzung.
> Jede Sitzung MUSS diese Datei am Ende auf den dann nächsten Stand bringen (siehe Pflicht
> ganz unten). So entsteht eine **selbstfortschreibende Kette** ohne Reibungsverlust.
>
> **Bedienung:** Den Block zwischen den Markierungen `>>> COPY <<<` und `>>> END COPY <<<`
> komplett kopieren und als Auftrag in die neue Sitzung einfügen.

---

>>> COPY <<<

Projekt: BookLedgerPro (lausiklauskn-png/bookledgerpro).

START: Lies ZUERST `docs/PULS.md` ("START HIER") + `docs/NACHFOLGE_PLAN.md` + obersten
`docs/SESSIONS.md`-Eintrag + `docs/OFFENE_PUNKTE.md`. Daraus ergibt sich alles.

AUFGABE DIESER SITZUNG: **Mit dem Nutzer abstimmen (AskUserQuestion), womit es weitergeht** — denn der
**build-freie Code-Korb ist im Wesentlichen LEER**: A+B fertig; **R1–R5 ✅** inkl. **R4-Rest ✅** (Austauschformat v3),
**R5a-Rest ✅** (SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-/Struktur-Validierung, `domain/bankschema.js`),
**R5c-Rest ✅** (NER-Scoping); **R6/P1 ✅** (Privat-/Bürger-Modus, PR #99); **R6/P2 ✅** (Feature-Gates ansichtsintern);
**A1-Rest ✅** (Zahlungsziel je Forderung — `mahnwesen.faelligAmVon`); **„zahlbar bis" ✅** (Fälligkeitsdatum auf der
gedruckten §14-Rechnung — `rechnung.baueRechnung` Feld `zahlbarBis`); **Zahlungsziel durabel + Austauschformat v4 ✅**
(Bugfix: `crm-store.saveAuftrag` persistiert `zahlungszielTage` jetzt — vorher fiel es aus der Whitelist, A1-Rest +
„zahlbar bis" waren faktisch wirkungslos; + `connect`/`importworkfloh`/`importWorkFloh` übertragen `rechnung.zahlungszielTage`
reziprok, SW v101, 1059 Tests); **Edit bestehender Aufträge ✅** (ein noch nicht berechneter Auftrag ist nachträglich
editierbar — `orders.darfAuftragBearbeiten` GoBD-Guard + `orders.anwendeAuftragEdit` rein/node-getestet,
`crm-store.updateAuftrag`, UI-„Bearbeiten"-Knopf + prefill-Formular; gesperrt sobald berechnet/bezahlt/Zahlung erfasst;
**SW v102, 1080 Tests**).
**Verbleibend nur noch umgebungs-/menschen-blockierte [KANN]-Punkte ODER ein Browser-Sichttest ODER eine neue,
mit dem Nutzer vereinbarte Feature-Idee.** Verbleibende kleine build-freie Folge-Idee (mit dem Nutzer abstimmen):
Eingangsrechnungs-Verzug (Gegenseite). Konkret:
(A) **R6/Rest [KANN] — umgebungs-/menschen-blockiert** (verifiziert): **Lighthouse/Perf** braucht Headless-Browser
(keiner hier); **lokales OCR** = Tesseract (wasm/npm-Runtime) ist **nicht build-frei** (Goldene Regel #1 verbietet
CDNs/npm-Runtime); **ZUGFeRD-Erzeugen** braucht PDF/A-3-Lib (nicht build-frei); **Sage 5b–d** sind fremde Repos
(menschlich vermittelt). → ohne Nutzer/Umgebung NICHT autonom lösbar.
(B) **Browser-Sichttest durch den Nutzer** (kein Headless hier): (a) WorkFloh-Austauschdatei MIT `rechnung`-Block
(inkl. optionalem `zahlungen[]`) importieren (Aufträge → „Aus WorkFloh importieren") → Buchungsentwurf (Forderung an
Erlöse + USt) prüfen, Auftrag „berechnet", je Zahlung ein Zahlungseingang-Entwurf (Bank an Forderung), Auto-„bezahlt"
bei Ausgleich; (b) OCR→Verbindlichkeit (Foto/PDF → Google Vision EU → „Verbindlichkeit aus diesem Beleg erfassen"
→ Zahlungsabgleich); (c) Pseudonym-Modus mit dreistufigem Briefkasten (Einstellungen → „Dreistufiger Briefkasten" an)
→ Belegtext an die KI → Maskierung/Token prüfen, inkl. `[[EXTERN_*]]`-Token für Fremd-PII; (d) Privat-/Verein-Modus
(Einstellungen → „Nutzungskontext") → NAV blendet geschäftliche Ansichten aus und USt-Felder/Mahn-/Kreditoren-Knöpfe/
KPIs je Modus verschwinden; (e) Bankauszug einlesen (Belege → „Bankauszug einlesen", MT940/CAMT) → den
**Schema-Hinweis** prüfen (grün „Struktur ok" / gelb Hinweise / rot Verstöße) zusätzlich zur Saldo-Plausibilität;
(f) **NEU: Zahlungsziel durabel** — Auftrag mit „Zahlungsziel (Tage)" anlegen → **speichern** → in Auswertungen/
Mahnwesen die Fälligkeit + auf der gedruckten Rechnung „zahlbar bis" prüfen (vor dem Bugfix ging das Ziel beim
Speichern verloren); danach eine WorkFloh-Austauschdatei mit `rechnung.zahlungszielTage` importieren → der Auftrag
soll dieselbe Fälligkeit erben (statt des globalen Defaults).
(g) **NEU: Edit bestehender Aufträge** — einen noch nicht berechneten Auftrag (Aufträge-Liste → „Bearbeiten")
öffnen, Titel/Kunde/Kostenstelle/Zahlungsziel/Positionen ändern → „Speichern" → Werte stimmen in Liste/Rechnung;
dann den Auftrag „berechnen" → der „Bearbeiten"-Knopf verschwindet (GoBD-Sperre); bei einem Auftrag mit erfasster
(Teil-)Zahlung ebenfalls kein „Bearbeiten".
(C) **Neue Feature-Idee** — falls der Nutzer eine Richtung vorgibt: sauber/fein schneiden, reine Logik ZUERST
node-getestet, dann UI, EINEN sauberen PR.
**Bewusst offen (keine reinen Code-Körbe mehr):** R4-Familie **API/Push** (Echtzeit) statt Datei; **echte XSD-/
SWIFT-Netzwerk-Konformität** der Bankformate (nicht build-frei); R5c-Rest **Clusterung verschiedener Drittparteien**
unter eigenen EXTERN_n-Scopes (heuristisch/FP-riskant). Plan-Details in `docs/NACHFOLGE_PLAN.md` Abschnitt R +
`docs/OFFENE_PUNKTE.md`. Reine Logik ZUERST node-getestet, dann UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen).
(Falls ein Schritt zu groß ist: feiner schneiden und Plan fortschreiben — nie „halb" mergen.)

MEHRERE PRs ERLAUBT: Wenn sich mehrere Plan-Punkte **sauber und in sich abgeschlossen** in einer
Sitzung erledigen lassen, dann tu das — **pro Punkt ein eigener PR**, jeder einzeln grün und gemergt.
Niemals einen Schritt „halb" mergen; im Zweifel feiner schneiden und den Plan fortschreiben.
Sauber/fehlerfrei VOR schnell.

RITUAL JE PR (verbindlich, automatisch durchziehen):
1) `git fetch origin main && git reset --hard origin/main`; pro PR einen eigenen
   Branch `claude/<kurzbeschreibung>` von `origin/main`.
2) Reine Logik ZUERST node-getestet (`node tests/run.mjs` muss grün bleiben/werden), dann
   UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen — kein Headless-Browser vorhanden).
3) `CACHE_VERSION` in `sw.js` erhöhen + neue Module precachen.
4) Draft-PR -> ready -> CI (smoke-test) abwarten -> **bei grün squash-mergen** (Freibrief)
   -> danach lokal `git reset --hard origin/main`.
5) Git-Identität: `user.email noreply@anthropic.com` / `user.name Claude`.

UNVERRÜCKBARE REGELN: DB-Suffix `bookledgerpro` NIEMALS ändern · build-frei (native
ES-Module, keine Bundler/CDNs/npm-Runtime) · Datendurabilität (Regel #2) · Krypto-/GoBD-/
DSGVO-Disziplin · EU-KI opt-in. „Vx/Mx/Bx/Rx" = Schritt aus dem Plan, KEINE Programm-Version.

ABSCHLUSSBRIEF AM ENDE (PFLICHT — automatisch, ohne Rückfrage):
- `docs/PULS.md` „START HIER" auf den dann nächsten Schritt zeigen lassen + Kopf-Status
  (SW-Version/Testanzahl/Modulzahl) aktualisieren.
- In `docs/NACHFOLGE_PLAN.md` die erledigte(n) Zeile(n) abhaken (+ ggf. Plan fortschreiben).
- Obersten `docs/SESSIONS.md`-Eintrag schreiben (Was getan · Stand · Nächstes · offene Grenzen).
- `docs/OFFENE_PUNKTE.md` pflegen.
- **Diese Datei `docs/NAECHSTE_SITZUNG.md` neu schreiben**, sodass der COPY-Block auf den dann
  nächsten Schritt zeigt — und den Auftrag „ABSCHLUSSBRIEF AM ENDE (PFLICHT)" inkl. **dieser
  Selbst-Fortschreibungs-Anweisung beibehält** (die Kette darf nie abreißen).
- Den fertigen COPY-Block am Sitzungsende auch im Chat ausgeben, damit er direkt in die
  nächste Sitzung eingefügt werden kann.

>>> END COPY <<<

---

**Stand dieses Briefes:** 2026-06-17 nach **Edit bestehender Aufträge**
(Abschnitt A Mehrmandanten + Abschnitt B Bilanzierung + R1–R5 inkl. R4-Rest/R5a-Rest/R5c-Rest + R6/P1 PR #99 + R6/P2 +
A1-Rest + „zahlbar bis" + Zahlungsziel durabel v4 abgeschlossen + gemergt; **diese Sitzung:** ein noch nicht berechneter
Auftrag ist nachträglich editierbar — `orders.darfAuftragBearbeiten` (GoBD-Guard) + `orders.anwendeAuftragEdit`
(nur freigegebene Felder) rein/node-getestet, `crm-store.updateAuftrag`, UI-„Bearbeiten"-Knopf + prefill-Formular;
gesperrt sobald berechnet/bezahlt/Zahlung erfasst) ·
Tests **1080/1080** · SW **v102** · 98 JS-Module · **build-freier Rest-Korb LEER** · nächster Schritt:
**mit dem Nutzer abstimmen** (verbleibende kleine Folge-Idee: Eingangsrechnungs-Verzug der Gegenseite · ODER
Browser-Sichttest · ODER umgebungs-blockierte KANN-Punkte · ODER neue Feature-Idee). (Diese Zeile bei jeder Sitzung aktualisieren.)
