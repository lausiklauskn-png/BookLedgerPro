# Brief an die nächste Sitzung (nach der Planung vom 2026-11-09)

## Zuerst lesen
1. `docs/design/BAUPLAN-NEUAUSRICHTUNG-2026-11-09.md` (ganz) – liegt in PR #455 (Branch
   `claude/bookledger-pro-improvements-hgn8je`), falls noch nicht auf main.
2. `BRIEF_ABSCHLUSS_2026-11-09_PLANUNG-NEUAUSRICHTUNG.md`, dann `CLAUDE.md`, `docs/PULS.md`.

## Erste Schritte
1. Klaus kurz nach J3–J6 und F3–F5 fragen (eine Nachricht, Ja/Nein). Nichts bauen, was nicht entschieden ist.
2. **Entschieden und klein, daher zuerst bauen: Kasse & Tagesabschluss (Weg c).**
   - Repo `Alis-Moderaum`: in `kasse.html` die Zahlart „Bar“ entfernen, Satz „Bargeld in die Kassenlade, abends zählen“;
     Barverkauf senkt nur den Bestand (Warenausgang); „Alles zurücksetzen“ im Echtbetrieb sperren; `sw.js` Cache erhöhen;
     `npm test`. Kassen-Kern `kasse-core.js` sonst unverändert.
   - BookLedgerPro: Ansicht „Kasse & Shop“ = Kassenbuch + Shop-Buchung; neu **Tagesabschluss**: Anfangsbestand (gestern),
     gezählter Endbestand, Ausgaben, Bankeinzahlung, Privatentnahme/-einlage → Tageseinnahme rückgerechnet, 19 % USt
     herausgerechnet, Foto des Zählprotokolls, festschreiben; fehlende Tage melden; Eingabe auch per Sprache (vorhandenes
     Mikrofon, Satz → Felder, vor dem Festschreiben anzeigen); Quittungsvorlage (Kleinbetragsrechnung) zum Drucken.
     Reine Logik in `src/domain/` mit Node-Tests, Browser-Probe, Gegenprobe.
3. Wenn J3 = Ja: danach Ausmisten nach Bauplan Abschnitt 3.

## Was nicht passieren darf
- Nichts veröffentlichen ohne Klaus' Wort; kein Release erneut auslösen.
- Keine Daten löschen (Ausmisten = ausblenden, Daten bleiben).
- Keine Kassenfunktion für Bargeld bauen (keine TSE – Weg c heißt: Bargeld wird nicht elektronisch kassiert).
- Familienakte und Workflow PDF Pro nicht ändern, bevor die Geldkarte (Bauplan Abschnitt 4) mit Klaus abgestimmt ist.
- Keine Forschungseinträge in diesem Repo (Kimhub).

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/BookLedgerPro (Branch laut Sitzung) + Repo lausiklauskn-png/Alis-Moderaum.
Zuerst lesen: docs/design/BAUPLAN-NEUAUSRICHTUNG-2026-11-09.md (aus PR #455 / Branch
claude/bookledger-pro-improvements-hgn8je, falls nicht auf main), BRIEF_ABSCHLUSS_2026-11-09_PLANUNG-NEUAUSRICHTUNG.md,
BRIEF_SITZUNG_2026-11-09_NACH-PLANUNG.md, dann CLAUDE.md und docs/PULS.md.
Erst Klaus nach J3–J6 und F3–F5 fragen (eine Nachricht).
Dann bauen (entschieden, Weg c offene Ladenkasse):
1) Alis-Moderaum kasse.html: Zahlart „Bar“ raus, Hinweis „Bargeld in die Kassenlade, abends zählen“,
   Barverkauf nur Bestand, „Alles zurücksetzen“ im Echtbetrieb sperren, Cache erhöhen, npm test.
2) BookLedgerPro: „Kasse & Shop“ mit Tagesabschluss (Endbestand gezählt, Ausgaben, Bankeinzahlung,
   Privat → Tageseinnahme rückgerechnet, USt 19 % heraus, Foto, festschreiben, fehlende Tage melden,
   Eingabe auch per Sprache), Quittungsvorlage. Node-Tests + Browser-Probe + Gegenprobe; Basic nachziehen.
Nicht: nichts veröffentlichen, keine Daten löschen, keine Bargeld-Kassenfunktion/TSE bauen,
Familienakte/Workflow PDF Pro nicht ändern, keine Forschungseinträge hier.
```
