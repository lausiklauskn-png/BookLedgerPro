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
abarbeiten. **Abschnitt R bis R5 ist komplett** (R1–R4 ✅; R5a/R5b/R5c ✅); **R6/P1 (Privat-/Bürger-Modus:
`domain/nutzungsmodus.js`, NAV-Gating, Setting `nutzungsmodus`) ✅ + gemergt (PR #99)**. **Aktueller nächster
Schritt: R6-Rest [KANN]** — **Empfehlung R6/P2: die Feature-Gates ansichtsintern konsumieren** (`zeigeFeature`
aus `domain/nutzungsmodus.js` ist bereits definiert + node-getestet, wird aber noch NICHT in den Views gelesen
→ im Privat-/Verein-Modus USt-Felder im Journal, Rechnungs-/Mahn-Knöpfe, Anlagen-/Lohn-Bezüge je Modus
ausblenden; reine Politik liegt schon node-getestet vor, also UI/Glue + ggf. kleine Helfer-Logik). Alternativ
weiterhin offen im R6-Korb: **Lighthouse/Perf** (braucht Headless-Browser), **lokales OCR** (nur build-frei-
sauber), ZUGFeRD-Erzeugen (PDF-Lib → nicht build-frei), **Sage 5b–d** (fremde Repos, menschlich vermittelt).
**Alternativ/zuerst sinnvoll: Browser-Sichttest** — (a) eine WorkFloh-Austauschdatei MIT `rechnung`-Block
importieren (Aufträge → „Aus WorkFloh importieren") → Buchungsentwurf (Forderung an Erlöse + USt) prüfen,
Auftrag „berechnet"; (b) OCR→Verbindlichkeit-Klickpfad (Foto/PDF → Google Vision EU → „Verbindlichkeit aus
diesem Beleg erfassen" → Zahlungsabgleich); (c) **Pseudonym-Modus mit dreistufigem Briefkasten** (Einstellungen
→ „Dreistufiger Briefkasten" an) → Belegtext an die KI → Maskierung/Token prüfen; (d) **Privat-/Verein-Modus**
(Einstellungen → „Nutzungskontext") → prüfen, dass die NAV die geschäftlichen Ansichten ausblendet — kein
Headless-Browser hier, daher echter Nutzer-Sichttest.
Mehrmandantenfähigkeit (Abschnitt A: M1/M2a/M2b/M3) ist **abgeschlossen** (siehe `docs/MANDANTEN.md`);
**Abschnitt B (Bilanzierung) ist abgeschlossen + gemergt** (B1/B2/B3); **R1–R4 ✅** (Verzugszinsen/
Mahngebühren · Skonto §17 UStG · Sammelzahlungen · Verbindlichkeiten aus Foto/PDF · Rechnungs-Übernahme
aus WorkFloh, PR #95); **R5a/R5b/R5c ✅** (Bankformate härten · NER · dreistufiger Briefkasten);
**R6/P1 ✅** (Privat-/Bürger-Modus). **Bewusst offen** (eigene Schritte, falls gewünscht): R6/P2
(Feature-Gates ansichtsintern); R4-Rest **API/Push** (Echtzeit) + Übernahme von **Zahlungsstatus/Teilzahlungen**;
R5a-Rest **echte SWIFT-/ISO-20022-Schema-Validierung**; R5c-Rest **Person-Attribut-Bindung pro Personen-Token**
+ **NER-Scoping**. Plan-Details in `docs/NACHFOLGE_PLAN.md` Abschnitt R + `docs/OFFENE_PUNKTE.md`. Reine Logik
**ZUERST node-getestet**, dann UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen). (Falls ein Schritt zu
groß ist: feiner schneiden und Plan fortschreiben — nie „halb" mergen.)

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

**Stand dieses Briefes:** 2026-06-17 nach **R6/P1** (Abschnitt A Mehrmandanten + Abschnitt B Bilanzierung +
R1–R5 abgeschlossen + gemergt; **R6/P1 Privat-/Bürger-Modus** — Nutzungskontext `firma|privat|verein`,
`domain/nutzungsmodus.js`, NAV-Gating in `shell.js`, Setting `nutzungsmodus`, PR #99) · Tests **972/972** ·
SW **v94** · 97 JS-Module · **R bis R5 komplett, R6/P1 ✅** · nächster Schritt **R6/P2** (Feature-Gates
ansichtsintern) bzw. R6-Rest/Browser-Sichttest. (Diese Zeile bei jeder Sitzung aktualisieren.)
