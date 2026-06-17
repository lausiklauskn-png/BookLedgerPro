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
`docs/SESSIONS.md`-Eintrag + `docs/OFFENE_PUNKTE.md`. Daraus ergibt sich alles — danach
OHNE Rückfragen loslegen.

AUFGABE DIESER SITZUNG: Den/die nächsten offenen Schritt(e) aus `docs/NACHFOLGE_PLAN.md`
abarbeiten. **Abschnitt R bis R5 ist komplett** (R1–R4 ✅; R5a/R5b/R5c ✅; **R5c-Rest NER-Scoping ✅** — Fremd-PII
trägt im Briefkasten-Modus den `EXTERN`-Scope); **R6/P1 ✅** (Privat-/Bürger-Modus, PR #99); **R6/P2 ✅** (Feature-Gates
ansichtsintern konsumiert). **R6/Rest [KANN] ist umgebungs-/menschen-blockiert** (verifiziert): **Lighthouse/Perf**
braucht Headless-Browser (keiner hier); **lokales OCR** = Tesseract (wasm/npm-Runtime) ist **nicht build-frei**
(Goldene Regel #1 verbietet CDNs/npm-Runtime); **ZUGFeRD-Erzeugen** braucht PDF/A-3-Lib (nicht build-frei); **Sage 5b–d**
sind fremde Repos (menschlich vermittelt). **Daher zwei gleichwertige Wege — mit dem Nutzer abstimmen, sonst Empfehlung
nehmen:**
(A) **Browser-Sichttest durch den Nutzer** (kein Headless hier): (a) WorkFloh-Austauschdatei MIT `rechnung`-Block
importieren (Aufträge → „Aus WorkFloh importieren") → Buchungsentwurf (Forderung an Erlöse + USt) prüfen, Auftrag
„berechnet"; (b) OCR→Verbindlichkeit (Foto/PDF → Google Vision EU → „Verbindlichkeit aus diesem Beleg erfassen" →
Zahlungsabgleich); (c) **Pseudonym-Modus mit dreistufigem Briefkasten** (Einstellungen → „Dreistufiger Briefkasten" an)
→ Belegtext an die KI → Maskierung/Token prüfen, **inkl. neuer `[[EXTERN_*]]`-Token für Fremd-PII**; (d) **Privat-/
Verein-Modus** (Einstellungen → „Nutzungskontext") → NAV blendet geschäftliche Ansichten aus **und (P2) USt-Felder im
Journal, Mahn-/Kreditoren-Knöpfe und KPIs je Modus verschwinden**.
(B) **build-freier Code-Korb (EMPFOHLEN für eine reine Code-Sitzung):** **R4-Rest** — Zahlungsstatus/Teilzahlungen aus
WorkFloh übernehmen (Austauschformat **v3**: optionale `zahlungen[]` je Rechnung → in BLP als Zahlung/Teilzahlung +
Zahlungsabgleich; reine Logik in `importworkfloh`/`invoicing`/`crm-store`/`connect`, **zuerst node-getestet**) — höherer
Geschäftswert. **Alternativ R5a-Rest** — echte SWIFT-(MT940)/ISO-20022-(CAMT)-Schema-Validierung (schwerer/spröder).
Wenn unklar, welcher Korb: **kurz mit dem Nutzer abstimmen** (AskUserQuestion), dann EINEN sauber umsetzen.
Mehrmandanten (Abschnitt A: M1/M2a/M2b/M3) **abgeschlossen** (`docs/MANDANTEN.md`); **Abschnitt B (Bilanzierung)
abgeschlossen** (B1/B2/B3); **R1–R4 ✅** (PR #95); **R5a/R5b/R5c ✅** + **R5c-Rest ✅**; **R6/P1 ✅**; **R6/P2 ✅**.
**Bewusst offen:** R4-Rest **API/Push** (Echtzeit) + **Zahlungsstatus/Teilzahlungen**; R5a-Rest **SWIFT-/ISO-20022-
Schema-Validierung**; R5c-Rest **Person-Attribut-Bindung pro Personen-Token** (das **NER-Scoping** ist jetzt erledigt;
offen bleibt die **Clusterung verschiedener Drittparteien** unter eigenen EXTERN_n-Scopes — heuristisch/FP-riskant).
Plan-Details in `docs/NACHFOLGE_PLAN.md` Abschnitt R + `docs/OFFENE_PUNKTE.md`. Reine Logik **ZUERST node-getestet**,
dann UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen). (Falls ein Schritt zu groß ist: feiner schneiden und Plan
fortschreiben — nie „halb" mergen.)

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

**Stand dieses Briefes:** 2026-06-17 nach **R5c-Rest NER-Scoping** (Abschnitt A Mehrmandanten + Abschnitt B
Bilanzierung + R1–R5 abgeschlossen + gemergt; R6/P1 PR #99; R6/P2 Feature-Gates ansichtsintern; **R5c-Rest:**
Fremd-PII trägt im Briefkasten-Modus den `EXTERN`-Scope → `[[EXTERN_IBAN_1]]`, exakte Stammdaten behalten Vorrang) ·
Tests **983/983** · SW **v96** · 97 JS-Module · **R bis R5 komplett inkl. R5c-Rest, R6/P1 ✅, R6/P2 ✅** · nächster
Schritt: **R6/Rest blockiert (Umgebung/Mensch)** → **R4-Rest** (Zahlungsstatus/Teilzahlungen aus WorkFloh, empfohlen)
oder **R5a-Rest** (Bank-Schema-Validierung) bzw. **Browser-Sichttest**. (Diese Zeile bei jeder Sitzung aktualisieren.)
