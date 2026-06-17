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
abarbeiten. **Aktueller nächster Schritt: R3 — Verbindlichkeiten aus Foto/PDF-Belegen** + eigene
Verbindlichkeiten-Ansicht (A2-Rest); **Zahlungsziel je Rechnung** (A1-Rest).
Mehrmandantenfähigkeit (Abschnitt A: M1/M2a/M2b/M3) ist **abgeschlossen** (siehe `docs/MANDANTEN.md`);
**Abschnitt B (Bilanzierung) ist abgeschlossen + gemergt** (B1/B2/B3); **R1 (Verzugszinsen/Mahngebühren
buchen) ist abgeschlossen + gemergt**; **R2a (Skonto-Buchung §17 UStG) ist abgeschlossen + gemergt**;
**R2b (Sammelzahlungen — eine Bankzahlung auf mehrere offene Rechnungen) ist abgeschlossen + gemergt**
(`domain/zahlungsabgleich.js`: `findeSammelzuordnung`/`verteileSammelzahlung`/`sammelBuchungZeilen`, Knopf
„◫ Sammelzahlung (mehrere Rechnungen)" im Bankimport — siehe `docs/SESSIONS.md` oben).
R3: Heute werden Verbindlichkeiten nur aus **E-Rechnung-XML** erfasst (`payables.js`/`payables-store.js`).
Ziel: Verbindlichkeiten auch aus **Foto/PDF-Belegen** anlegen (Vision-OCR → `eingangsrechnungZeilen`) +
eine **eigene Verbindlichkeiten-Ansicht** zum manuellen Anlegen/Bearbeiten; dazu **Zahlungsziel je Rechnung**
(statt global, A1-Rest). Reine Logik (Erfassung/Validierung) **ZUERST node-getestet**, dann UI
(DOM/IndexedDB als „statisch geprüft" kennzeichnen). Plan-Details in `docs/NACHFOLGE_PLAN.md` Abschnitt R
(R3) + `docs/OFFENE_PUNKTE.md` (A1/A2). (Falls R3 zu groß ist: feiner schneiden und Plan fortschreiben —
nie „halb" mergen.)

MEHRERE PRs ERLAUBT (NEU): Wenn sich mehrere Plan-Punkte **sauber und in sich
abgeschlossen** in einer Sitzung erledigen lassen, dann tu das — **pro Punkt ein eigener
PR**, jeder einzeln grün und gemergt. Niemals einen Schritt „halb" mergen; im Zweifel
feiner schneiden (M2a/M2b …) und den Plan fortschreiben. Sauber/fehlerfrei VOR schnell.

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
DSGVO-Disziplin · EU-KI opt-in. „Vx/Mx/Bx" = Schritt aus dem Plan, KEINE Programm-Version.

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

**Stand dieses Briefes:** 2026-06-17 nach R2b (Abschnitt A Mehrmandanten abgeschlossen; Abschnitt B
Bilanzierung B1+B2+B3 abgeschlossen; R1 Verzugszinsen/Mahngebühren abgeschlossen; R2a Skonto-Buchung §17 UStG
abgeschlossen; R2b Sammelzahlungen abgeschlossen) · Tests **838/838** · SW **v89** · 93 JS-Module · nächster
Schritt **R3 (Verbindlichkeiten aus Foto/PDF-Belegen + eigene Ansicht; Zahlungsziel je Rechnung)**.
(Diese Zeile bei jeder Sitzung aktualisieren.)
