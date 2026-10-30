# Brief für die nächste Sitzung: Pro-Umbau 13 — Befunde, Chefcode nach Klaus' Plan, Probe über drei Orte (geschrieben 2026-10-30)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben). Zuerst lesen: `CLAUDE.md` je Repo,
`BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-12.md`, Forschung § 27 (`docs/design/FORSCHUNG-ANDROID-TRESORORDNER-2026-10-26.md`),
Private Brain Pro `docs/UEBERALL-SUCHEN.md`, `docs/design/LEITFADEN-PRO-APPS-BEDIENUNG.md`.

## Ausgangslage

Umbau 12: „Überall suchen“ ist ein gemeinsamer Baustein (Private Brain Pro `native/pro-ueberall.*`, Bedien-Bausteine Fassung 4) und läuft in
**Private Brain Pro 1.0.43** und **Workflow PDF Pro 1.0.10** (beide nicht veröffentlicht). Dazu Schriftgröße „A··A“, textZoom 100, Version im Kopf (WPP).
Klaus' Gegenprobe 0.1.6 und Befunde des Windows-Testers **lagen in Umbau 12 nicht vor**.

## Aufgaben (in dieser Reihenfolge)

1. **Klaus' Befunde** (Gegenprobe BookLedgerPro 0.1.6, Windows-Tester, ggf. PB/WPP) aufnehmen und beheben.
2. **Chefcode** — nur, wenn Klaus den Plan im Abschluss 12 § 4 freigibt (Wer vergibt? Länge? Wechsel? Für alle drei Apps?). Sonst nichts bauen.
3. **BookLedgerPro auf den gemeinsamen Baustein** `pro-ueberall.js` umstellen (dieselbe Liste in allen drei Apps; BLP-eigene Quellen Belege/Buchungen/
   Kunden/Aufträge und Angebotsplaner/Bedarfsanalyse als `app`-Funktion), Basic nachziehen.
4. **Probe über drei Orte** (Klaus' Rechner, der des Bekannten, ein dritter) mit dieser Abhakliste:
   - [ ] alle drei: dieselbe Fassung (BLP 0.1.6 oder neuer; PB/WPP nach Veröffentlichung), Internet an
   - [ ] je Ort einen Gerätenamen setzen (Mycel-Kasten), „Verbinden“
   - [ ] „Wer ist im Raum?“ zeigt die zwei anderen Orte
   - [ ] an einem Ort „Anderen antworten“ an (BLP), an einem anderen „Überall suchen“ mit Haken „Netz“ → Zeile „von <Gerätename>“
   - [ ] Gegenrichtung
   - [ ] (nach Chefcode) mit Code: nur die Orte mit demselben Code sehen einander; ohne Code nicht
   - [ ] Befunde mit Uhrzeit und Bildschirmfoto an Claude
5. **„Kein Titel oben“ in WPP:** braucht eine Änderung im Kern (Workflow-PDF, Untertitel im Kopf) — nur nach Rückfrage.

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort (vorher `releases` lesen, Version + Buildnummer erhöhen). Keine Schlüssel oder Passwörter in Dateien oder im Chat.
Kanon-Module (Sage) byte-1:1. Bedien-Bausteine (auch `pro-ueberall.*`) nur in Private Brain Pro, Tresor-Paket/Scanner nur in WPP, Kopien nie von Hand.
Keine Emojis. Kein Force-Push. CI sparsam. Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 13: Befunde, Chefcode nach Plan, BookLedgerPro auf den gemeinsamen Baustein „Überall suchen“, Probe über drei Orte.
Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-13.md und BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-12.md, Forschung § 27,
Private Brain Pro docs/UEBERALL-SUCHEN.md.
Erst meine Befunde aufnehmen, Chefcode nur nach meinem Ja zum Plan, dann BookLedgerPro auf pro-ueberall.js (Quelle Private Brain Pro), Basic nachziehen.
Nichts veröffentlichen ohne mein Wort; vorher releases lesen, Version + Buildnummer erhöhen. Keine Schlüssel in Dateien oder im Chat. Kanon-Module byte-1:1.
Ein PR je App, bei grüner CI selbst mergen. Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Startauftrag.
```
