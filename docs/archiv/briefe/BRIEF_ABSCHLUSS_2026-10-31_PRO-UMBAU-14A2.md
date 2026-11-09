# Abschluss Pro-Umbau 14, Sitzung A2 (und Inventur A3) — 2026-10-31

## A2: Netz liest den ganzen Brief (Klaus: „Herr Meier am Ende wird nicht gefunden“)

| Repo | PR | Inhalt |
|---|---|---|
| BookLedgerPro | #436 (gemergt) | „Mit Ausschnitt antworten“ (nur eigenes Netz): jeder Beleg in Abschnitten (`zerlegen`), gleiche `anchorId`, Briefende immer dabei (≤ 60 je Beleg, ≤ 4000 gesamt), neueste zuerst; Antwort-Filter bündelt je Beleg, Ausschnitt aus dem ganzen Text (≤ 200 Zeichen); Korpus baut sich nach neuen/geänderten/gelöschten Belegen und nach dem Einspielen einer Sicherung selbst neu (3 s entprellt, ohne Aus/An, Vektoren wiederverwendet). Öffentlich weiter nur Titel · Datum · Betrag. |
| BookLedger-Basic | #30 (gemergt) | nachgezogen (Pro `6ab1d39`) |
| Privat-Brain-Pro | #119 | **Fund:** der Netz-Korpus gab Vektoren als Liste und Einträge ohne Vektor weiter — Modul 04 warf bei jeder Frage, die App antwortete anderen **nie**. Jetzt `Float32Array`, nur Einträge mit Vektor; der Katalog merkt sich das **Ende** langer Texte; nach dem Einschalten liest Modul 04 den Katalog live. |
| Privat-Brain-Pro-V3 | #32 | dasselbe (gleicher Katalog-Code) |

**Proben:** BLP `run.mjs` 2645/0 · `smoke_netzbrief` 11 (echter Tresor, echtes Modul 04) · `gegenprobe_netzbrief` 5 gefangen/0 durch (zwei zuerst blind, nachgeschärft) ·
`smoke_umbau13` 54 · `smoke_umbau11` 129 · Basic `run.mjs` 2641/0. PB/V3 `test-netzbrief` 9 · Gegenprobe von Hand 3/3.
**Grenzen:** nicht am Gerät, kein echtes Relais, kein echtes Modell (Zeit für 4000 Abschnitte am Tablet ungemessen). In Private Brain hat jede Datei weiter
EINEN Vektor (Anfang); das Ende wirkt über die Wortsuche. Dateien, die vor diesem Stand eingelesen wurden, haben kein gemerktes Ende (Mails schon).
**Workflow PDF und Workflow PDF Pro beantworten Netzfragen gar nicht** (kein Antwort-Korpus) — Frage 4 unten.

## A3: Inventur Tresorordner (nur gelesen, nichts gebaut)

| App | im Tresorordner | nur in der App |
|---|---|---|
| BookLedgerPro | `BookLedgerPro/Sicherung/` (ganzer Bestand, automatisch), `BookLedgerPro/Belege/` (Originale einzeln), legt in `Eingang-WorkflowPDF/`, liest `Eingang-BookLedgerPro/` | Arbeitsbestand (IndexedDB); gesichert wird nur der aktive Mandant |
| Private Brain Pro | `Private Brain/` (Mails, Anhänge, Originale, Katalog, Konten), Rechnungsmails nach `Eingang-BookLedgerPro/Mails/` | Bedeutungs-Vektoren (neu gerechnet), nie geöffnete Mails, Google-Freigaben |
| Workflow PDF Pro | `Workflow PDF Pro/` (Dokumente, Texte, Vektoren, Einstellungen), liest `Eingang-WorkflowPDF/` | Schlüssel, Einwilligungen, SBKIM-Identität, Modell-Downloads |
| Private Brain V3 | **nicht drin** (nur eigene Ablage, Ordnername wie PB: „Private Brain“) | alles |
| Familienakte | **nicht drin** (OPFS/IndexedDB oder eigener Ordner im Browser) | alles |

**Ort wählen:** Android in allen drei Pro-Apps über Androids Ordnerwahl (SD-Karte, Tablet, USB, was Android anbietet), Pfad mit „SD-Karte/…“ sichtbar.
Windows: **nur BookLedgerPro hat den Tresorordner** (Ordner-Dialog, jedes Laufwerk, auch USB-Stick, ganzer Pfad in „Tresor & Ablage“).
Private Brain Pro und Workflow PDF Pro haben unter Windows nur ihre eigene Ablage, nicht den gemeinsamen Ordner.
**„Ort ändern“ mit Umzug** gibt es für den gemeinsamen Ordner in keiner App (nur „Anderen Tresorordner wählen“ — nichts wird kopiert).
Einen echten Umzug ohne Datenverlust hat nur Workflow PDF Pro für seine eigene Ablage (`native/vault-migration.js`) — Vorlage.
Korrigiert: `docs/TRESORORDNER.md` sagte „nur in der Android-App“.

## Fragen an Klaus (vor dem Bau)
1. **V3 in den Tresorordner?** Vorschlag: ja, eigenes Fach „Private Brain V3“ (nicht dasselbe wie Pro, sonst schreiben zwei Apps in ein Fach).
2. **Familienakte:** Fach „Familienakte“ ist entschieden; dazu ein Eingang „Eingang-Familienakte“? Vorschlag: ja (andere Apps legen dort Briefe ab).
3. **„Ort ändern“ mit Umzug** für den gemeinsamen Ordner (alles hinüberkopieren, prüfen, erst dann den neuen Ort nehmen; der alte bleibt liegen, bis du ihn löschst)?
   Vorschlag: ja, im Tresor-Paket in Workflow PDF Pro, nach Vorlage `vault-migration.js`.
4. **Windows:** gemeinsamer Tresorordner auch in Private Brain Pro und Workflow PDF Pro unter Windows? Vorschlag: ja (heute nur BookLedgerPro).
5. **Workflow PDF (Pro) im Netz antworten lassen** wie BookLedgerPro (öffentlich nur Dateiname, im eigenen Netz mit Ausschnitt)? Vorschlag: ja.
6. **„Alles hinein“:** heute bleiben Vektoren, Schlüssel und Einwilligungen bewusst in der App. Vorschlag: so lassen (Vektoren werden neu gerechnet,
   Schlüssel gehören nicht in einen geteilten Ordner).

## Nicht gemacht (benannt)
- Sitzung B (Familienakte) nicht begonnen: eine andere Sitzung arbeitet heute am selben Repo (Kopf, Aktualisieren, „Mit KI arbeiten“) — kein Doppelbau.
- V3 #32 nicht gemergt: `test-ki-tresor` in der CI 2 von 3 Läufen rot, Ursache offen (Klaus: erst prüfen).
- Nichts veröffentlicht, keine Version erhöht (0.1.8 aus #433 ist noch offen).

## Forschung
In Kimhub: `forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md` § 31 (Befunde) und § 32 (Zeiten je Abschnitt, CI-Dauer je Job), Eintrag `2026-10-31-pro-umbau-14a2-netzbrief` (Kimhub #417).

## Stundennachweis
Erste Spur 31.10. 12:49 (Uhr des Behälters; Briefe, Stand der Repos), BLP-Bau und Proben bis ≈ 13:05, PB/V3 13:00–13:06, PRs 13:07, Merge BLP 13:08,
Basic 13:10, Inventur (Hintergrund) bis 13:11, Abschluss bis ≈ 13:16; CI von PB/V3 im Anschluss. Danach CI beobachten und Konflikte lösen bis 13:48 (PB #119 gemergt), Suche nach der Ursache in V3 #32 13:55–14:10, Kimhub-Eintrag und Brief bis ≈ 14:25. Ein Block 12:49–14:25, ≈ 1,6 h (davon ≈ 0,5 h Wartezeit auf CI).
Klaus' eigene Angabe geht vor.

## Nächste Sitzung
`BRIEF_SITZUNG_PRO-UMBAU-14-NACH-A2.md`.
