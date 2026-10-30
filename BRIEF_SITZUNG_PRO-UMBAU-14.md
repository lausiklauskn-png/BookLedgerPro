# Brief für die nächste Sitzung: Pro-Umbau 14 — Probe über drei Orte mit Chefcode, Befunde, Veröffentlichen nur auf Wort (geschrieben 2026-10-30)

Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben). Zuerst lesen: `CLAUDE.md` je Repo,
`BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-13.md`, Forschung § 28, Private Brain Pro `docs/UEBERALL-SUCHEN.md` (Abschnitt Chefcode).

## Ausgangslage

Chefcode (Schritt 1+2) in allen drei Pro-Apps, BookLedgerPro nutzt in der App den gemeinsamen Kasten „Überall suchen“. Versionen: **BLP 0.1.7**/8,
**PB 1.0.43**/43, **WPP 1.0.10**/11 — alle **nicht veröffentlicht**. „Anderen antworten“ war in 0.1.6 still leer (behoben in 0.1.7).

## Aufgaben (in dieser Reihenfolge)

1. **Klaus' Befunde** aufnehmen (Ja/Nein-Liste, Mails, Issues; sonst nachfragen).
2. **Veröffentlichen nur auf Klaus' Wort** (BLP 0.1.7 Android + Windows, PB 1.0.43, WPP 1.0.10): vorher `releases` lesen; Actions-Minuten des Kontos
   beachten (Mail 29.10.: 100 % verbraucht — private Repos bauen dann womöglich nicht).
3. **Probe über drei Orte** (Klaus' Rechner, der des Bekannten, ein dritter):
   - [ ] alle drei: dieselbe Fassung (nach Veröffentlichung), Internet an
   - [ ] je Ort einen Gerätenamen setzen (Mycel-Kasten), „Verbinden“
   - [ ] „Wer ist im Raum?“ zeigt die zwei anderen Orte
   - [ ] an einem Ort „Anderen antworten“ an (BLP), an einem anderen „Überall suchen“ mit Haken „Netz“ → Zeile „von <Gerätename>“
   - [ ] Gegenrichtung
   - [ ] Chefcode an zwei Orten gleich, am dritten keiner: nur die zwei sehen einander
   - [ ] mit Chefcode „Mit Ausschnitt antworten“ an → Treffer mit Ausschnitt; Chefcode entfernen → keine Ausschnitte mehr
   - [ ] Befunde mit Uhrzeit und Bildschirmfoto an Claude
4. **Chefcode Schritt 3** (Datei auf Anfrage öffnen) nur nach Klaus' Wort.
5. **„Kein Titel oben“ in WPP** (Kern-Änderung in Workflow-PDF) nur nach Rückfrage.
6. Optional: `smoke_umbau11` Gruppe B entflattern (alte PWA-Ansicht zeichnet sich bei jedem Status neu).

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort. Keine Schlüssel, Passwörter oder Chefcodes in Dateien oder im Chat. Kanon-Module (Sage) byte-1:1.
Bedien-Bausteine (auch `pro-ueberall.*`, `pro-chefcode.js`) nur in Private Brain Pro, Tresor-Paket/Scanner nur in WPP, Kopien nie von Hand.
Keine Emojis. Kein Force-Push. CI sparsam. Abschluss mit Stundennachweis und Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 14: Befunde, Veröffentlichen nur auf mein Wort, Probe über drei Orte mit Chefcode.
Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Privat-Brain-Pro (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14.md und BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-13.md, Forschung § 28,
Private Brain Pro docs/UEBERALL-SUCHEN.md (Chefcode).
Erst meine Befunde aufnehmen; veröffentlichen (BLP 0.1.7, PB 1.0.43, WPP 1.0.10) nur nach meinem Wort, vorher releases lesen.
Keine Schlüssel oder Chefcodes in Dateien oder im Chat. Kanon-Module byte-1:1. Bausteine nur in Private Brain Pro ändern.
Ein PR je App, bei grüner CI selbst mergen. Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Startauftrag.
```
