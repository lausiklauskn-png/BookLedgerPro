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
**build-freie Code-Korb ist LEER**: A+B fertig; **R1–R5 ✅** inkl. **R4-Rest ✅** (Austauschformat v3),
**R5a-Rest ✅** (SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-/Struktur-Validierung, `domain/bankschema.js`),
**R5c-Rest ✅** (NER-Scoping); **R6/P1 ✅** (Privat-/Bürger-Modus, PR #99); **R6/P2 ✅** (Feature-Gates ansichtsintern);
**A1-Rest ✅** (Zahlungsziel je Forderung — `mahnwesen.faelligAmVon`, Feld im Auftragsformular, SW v99, 1045 Tests).
**Verbleibend nur noch umgebungs-/menschen-blockierte [KANN]-Punkte ODER ein Browser-Sichttest ODER eine neue,
mit dem Nutzer vereinbarte Feature-Idee.** Mögliche kleine build-freie Folge-Ideen (mit dem Nutzer abstimmen): „zahlbar
bis" auf dem gedruckten §14-Dokument, Edit bestehender Aufträge, WorkFloh-`rechnung`-Block überträgt das Zahlungsziel,
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
KPIs je Modus verschwinden; (e) **NEU: Bankauszug einlesen** (Belege → „Bankauszug einlesen", MT940/CAMT) → den
**Schema-Hinweis** prüfen (grün „Struktur ok" / gelb Hinweise / rot Verstöße) zusätzlich zur Saldo-Plausibilität.
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

**Stand dieses Briefes:** 2026-06-17 nach **A1-Rest Zahlungsziel je Forderung** (Abschnitt A Mehrmandanten +
Abschnitt B Bilanzierung + R1–R5 inkl. R4-Rest/R5a-Rest/R5c-Rest + R6/P1 PR #99 + R6/P2 abgeschlossen + gemergt;
**A1-Rest:** `mahnwesen.faelligAmVon` macht das auftragsindividuelle `zahlungszielTage` in Mahnwesen/Fälligkeit
wirksam, `payables.berechneFaelligAm` delegiert daran, Feld „Zahlungsziel (Tage)" im Auftragsformular) ·
Tests **1045/1045** · SW **v99** · 98 JS-Module · **build-freier Rest-Korb LEER** · nächster Schritt:
**mit dem Nutzer abstimmen** (R6/Rest blockiert / Browser-Sichttest / neue Feature-Idee). (Diese Zeile bei jeder
Sitzung aktualisieren.)
