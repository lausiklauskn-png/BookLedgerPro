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

START: Lies ZUERST `docs/PULS.md` ("START HIER") + `docs/BAUPLAN.md` + `docs/NACHFOLGE_PLAN.md` +
obersten `docs/SESSIONS.md`-Eintrag + `docs/OFFENE_PUNKTE.md`. Daraus ergibt sich alles.

STAND: Block 1 + 2 KOMPLETT · Block 3 (Liquidität) ausgebaut · Block 4 (V-Lohn — Lohn-Buchungskern) KOMPLETT
(L1–L6, `docs/LOHN.md`) · P6 (CSV/vCard-Kundenimport) erledigt (#167) · Transparenzbericht in der App verlinkt
(„Recht & Doku", stets aktuell) · **Sprint S1 → P9 (Datei-Import mit exaktem Schlüssel-Abgleich) ✅** · **Sprint S2 →
P10 (handelnde Person als Besteller) ✅ erledigt** (`src/domain/besteller.js` + Verdrahtung Auftrag→Rechnung + UI in
`src/ui/views/orders.js`). **SW `v144`, Tests `1836/1836` grün, 124 JS-Module.**

AUFGABE — **5-Sitzungs-Sprint (mit dem Nutzer vereinbart 2026-06-19): genau diese Punkte abarbeiten, EINER pro
Sitzung, in dieser Reihenfolge; danach BESPRECHUNG.** Bearbeite in DIESER Sitzung den ERSTEN noch offenen Punkt der
Liste (Reihenfolge unten) und stelle den Sprint-Pointer am Ende eine Stufe weiter.

**🏃 SPRINT-PLAN (eine Sitzung = ein Punkt) — Pointer steht jetzt auf Sitzung 3 → P3+P4:**
- **[x] Sitzung 1 → P9 — Datei-Import mit exaktem Schlüssel-Abgleich ✅ (2026-06-19):** reine Logik
  `src/ai/schluesselabgleich.js` (+38 → 1810/1810) + UI `src/ui/schluesselabgleich.js` (Einstellungs-Karte
  „Datenschutz bei KI"). SW `v143`.
- **[x] Sitzung 2 → P10 — handelnde Person als Besteller ✅ (2026-06-19):** additives Datenmodell + UI-Feld. Reine
  Logik `src/domain/besteller.js` (node-getestet, +26 → **1836/1836**): `normalizeBesteller` (String/Objekt →
  `{name,funktion,email,telefon}`, null ohne Name), `validateBesteller` (optional; E-Mail formal; Längen-Cap),
  `bestellerLabel`, `bestellerKontaktzeile` („z. Hd. Name (Funktion)" — OHNE E-Mail/Telefon → Prime Directive).
  Verdrahtet: `domain/orders.js` (`validateAuftrag` + `AUFTRAG_EDIT_FELDER`), `domain/crm-store.js saveAuftrag` +
  `importWorkFloh`, `domain/rechnung.js baueRechnung` (Dokumentfeld `besteller`), `domain/importworkfloh.js`. UI
  `ui/views/orders.js`: 4 Formularfelder + Liste-Label + „z. Hd."-Zeile im Empfängerblock. GoBD: Buchung trägt keinen
  Besteller (mutable CRM-Metadaten). SW `v144`. (Folgeschritt offen: Besteller in die XRechnung als CII-Käuferkontakt.)
- **[ ] Sitzung 3 → P3 + P4 — Aufklärungstexte:** KI-**Autonomiestufen** (P3) + **Kleinunternehmer**-Pflichten bei
  Drittdaten (P4) als In-App-Texte in „Recht & Doku"/Einstellungen. Klein, build-frei.
- **[ ] Sitzung 4 → P2 — KI-Anbieterwahl je Modus:** **strikt innerhalb der EU** (Vision EU / Mistral EU; Nicht-EU
  bleibt geschlossen/dormant). Setting + UI; KEIN neuer Anbieter.
- **[ ] Sitzung 5 → P8 — QR-Einzelteilen (lokal erzeugt, kein Netz):** braucht einen **vendored, reinen JS-QR-Encoder**
  (build-frei: eigene Datei, keine npm/CDN-Runtime; Lizenz prüfen). Geht das NICHT sauber build-frei → ehrlich als
  blockiert melden statt zu tricksen (dann beim Nutzer rückfragen).
- **[ ] DANACH: BESPRECHUNG mit dem Nutzer** — NICHT selbstständig den nächsten Sprint starten. COPY-Block auf
  „Sprint abgeschlossen → Besprechung" stellen, Bilanz im Chat ausgeben, neue Richtung abstimmen.

**🤝 ARBEITSAUFTRAG (Nutzer 2026-06-19): selbstständig handeln nach Logik + Nutzen für App und Nutzer.** Kleinere
Entscheidungen (Benennung, UI-Detail, Konto-/Feldwahl, Test-Fälle, Reihenfolge innerhalb eines Punkts) selbst treffen
und durchziehen. **Bei GRÖSSEREN Konflikten/Unklarheiten INNEHALTEN und über `AskUserQuestion` rückfragen** — nämlich
wenn: ein Eingriff ins **Datenmodell/GoBD/Krypto** nötig wird; eine Anforderung **mehrdeutig** ist; etwas der bestehenden
Logik oder den **unverrückbaren Regeln** widerspricht; ein Punkt sich als **nicht build-frei/blockiert** erweist; oder ein
**echter Architektur-/Merge-Konflikt** auftritt, den ein Rebase nicht sauber löst. Lieber einmal kurz fragen als eine
große, schwer rückbaubare Sache raten. **Merge-Konflikte** zuerst selbst lösen (`git fetch origin main && git reset
--hard origin/main`, neu aufsetzen); nur den *inhaltlichen* Konflikt eskalieren.

**Mehrere saubere, in sich abgeschlossene PRs pro Sitzung, wo sinnvoll** (pro Schritt 1 PR, jeder einzeln grün +
gemergt; reine Logik ZUERST node-getestet, dann UI „statisch geprüft"). **Hinweis:** Ist die Sitzung an genau einen
Branch gebunden, dürfen Feature + Abschlussbrief in einer PR liegen.

RITUAL JE PR (verbindlich, automatisch durchziehen):
1) `git fetch origin main && git reset --hard origin/main`; pro PR einen eigenen
   Branch `claude/<kurzbeschreibung>` von `origin/main` (bzw. den für die Sitzung vorgegebenen Branch).
2) Reine Logik ZUERST node-getestet (`node tests/run.mjs` muss grün bleiben/werden), dann
   UI (DOM/IndexedDB als „statisch geprüft" kennzeichnen — kein Headless-Browser vorhanden).
3) `CACHE_VERSION` in `sw.js` erhöhen + neue Module precachen.
4) Draft-PR -> ready -> CI (smoke-test) abwarten -> **bei grün squash-mergen** (Freibrief)
   -> danach lokal `git reset --hard origin/main`.
5) Git-Identität: `user.email noreply@anthropic.com` / `user.name Claude`.

UNVERRÜCKBARE REGELN: DB-Suffix `bookledgerpro` NIEMALS ändern · build-frei (native
ES-Module, keine Bundler/CDNs/npm-Runtime) · Datendurabilität (Regel #2) · Krypto-/GoBD-/
DSGVO-Disziplin · EU-KI opt-in.

ABSCHLUSSBRIEF AM ENDE (PFLICHT — automatisch, ohne Rückfrage):
- `docs/PULS.md` „START HIER" auf den dann nächsten Schritt zeigen lassen + Kopf-Status
  (SW-Version/Testanzahl/Modulzahl) aktualisieren.
- In `docs/BAUPLAN.md` die erledigte(n) Schritt(e) abhaken (+ ggf. Plan fortschreiben);
  `docs/NACHFOLGE_PLAN.md` bei Bedarf pflegen.
- Obersten `docs/SESSIONS.md`-Eintrag schreiben (Was getan · Stand · Nächstes · offene Grenzen).
- `docs/OFFENE_PUNKTE.md` pflegen.
- **Diese Datei `docs/NAECHSTE_SITZUNG.md` neu schreiben**, sodass der COPY-Block auf den dann
  nächsten Schritt zeigt — **den erledigten Sprint-Punkt oben abhaken (`[x]`) und den Sprint-Pointer
  eine Stufe weiterstellen**; nach Sitzung 5 den COPY-Block auf **„BESPRECHUNG mit dem Nutzer"**
  setzen (innehalten, NICHT weiterbauen). Den Auftrag „ABSCHLUSSBRIEF AM ENDE (PFLICHT)" inkl.
  **dieser Selbst-Fortschreibungs-Anweisung beibehalten** (die Kette darf nie abreißen).
- Den fertigen COPY-Block am Sitzungsende auch im Chat ausgeben, damit er direkt in die
  nächste Sitzung eingefügt werden kann.

>>> END COPY <<<

---

**Stand dieses Briefes:** 2026-06-19 nach **Sprint S2: P10 — handelnde Person als Besteller** (reine Logik
`src/domain/besteller.js` + Verdrahtung Auftrag→Rechnung + UI `src/ui/views/orders.js`). Mit dem Nutzer vereinbart:
**5-Sitzungs-Sprint** P9 → P10 → P3+P4 → P2 → P8, **EINER pro Sitzung**, **danach Besprechung**. Selbstständig nach
Logik/Nutzen handeln; **größere Konflikte/Unklarheiten über `AskUserQuestion` eskalieren**, Kleines selbst entscheiden.
Tests **1836/1836** · SW **v144** · 124 JS-Module. **Block 1 + 2 KOMPLETT; Block 3 (Liquidität) ausgebaut; Block 4
(V-Lohn) KOMPLETT (#158–#164); P6 ✓ (#167); P9 ✓; P10 ✓.** Sprint-Pointer steht jetzt auf **Sitzung 3 → P3+P4**.
(Diese Zeile + die Sprint-Checkboxen bei jeder Sitzung aktualisieren.)
