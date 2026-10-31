# Abschluss Pro-Umbau 14, Sitzung A — Chef getrennt (2026-10-31)

## Klaus' Antworten auf die vier Fragen (2026-10-31)
1. Mitarbeiter treten über einen **Beitritts-Zettel** bei. 2. Die Familienakte kommt in den gemeinsamen Tresorordner (**eigenes Fach**).
3. Briefkopf-Baustein mit Quelle in **Workflow-PDF**. 4. Themen für Betriebe: **Vorschlag übernehmen** (Kunden, Lieferanten, Versicherungen,
Steuern & Finanzamt, Personal, Bank & Kredite, Fahrzeuge, Miete & Räume, Verträge, Behörden, Werbung).

Nachträge in der Sitzung: (a) „Funktion bei Private Brain V3 nachziehen, PWA-App und native App, auch Private Brain Basic“ — es gibt kein Repo
„Private Brain Basic“; die alte PWA `Privat-Brain` ist stillgelegt und leitet zu V3, deshalb in V3 gebaut (eine Quelle für App und Pages).
(b) „Speicherort des Tresors selber festlegen (SD-Karte, externe Speicher) — alles soll hinein, damit gemeinsam gesucht werden kann.“
(c) „Herr Meier am Briefende wird nicht gefunden“ — nachgemessen, Forschung § 29.5.

## Was gebaut ist
| Repo | PR | Inhalt | Version |
|---|---|---|---|
| Privat-Brain-Pro | #117 | Quelle: `native/pro-chefcode.js` Fassung 2, Bedien-Bausteine Fassung 6; Probe `test-chefcode` 46, Gegenprobe `gegenprobe-chefcode` 8/8 | 1.0.44/44 |
| Workflow-PDF-Pro | #47 | nachgezogen, `test-ueberall` auf den Chef-Ablauf | 1.0.11/12 |
| BookLedgerPro | #433 | nachgezogen, `smoke_umbau13` 57, `run.mjs` 2638/0, `test-native` 52 | 0.1.8/9 |
| Privat-Brain-Pro-V3 | #30 | neu: Chefcode in App und Webfassung, eigenes Nachzieh-Werkzeug `pro-bausteine-nachziehen.mjs`; `test-chefcode` 44, `test-pages` 12 | 3.0.0-preview.9/9 |
| BookLedger-Basic | (nach BLP-Merge) | nachgezogen; die PWA zeigt den Chefcode-Kasten nicht (nur App), wirksam nur der neue Pin | – |

**Bedienung:** Einstellungen bzw. Mycel-Seite → Chefcode. Chef: „Ich bin der Chef“ → Chef-PIN (6–12 Ziffern) zweimal + Code → 5 Minuten entsperrt:
neuer Code, „Beitritts-Zettel“ (Text `CHEF1-…` kopieren/teilen), Chef-PIN ändern, Entfernen, Sperren. Mitarbeiter: „Mit Zettel beitreten“ —
Code nie sichtbar, ändern nur mit Chef-PIN, ein neuer Zettel des Chefs geht ohne PIN. Nach 5 falschen PINs Wartezeit (30 s, doppelt, ≤ 1 h).
Ausführlich: Private Brain Pro `docs/UEBERALL-SUCHEN.md` „Chef getrennt“.

**Grenzen (benannt):** Die PIN schützt die Einstellung, nicht das Gerät (deinstallieren/Daten löschen geht immer; mit Entwickler-Werkzeugen ist der
Code im Speicher lesbar). Der Zettel ist der Code in gepackter Form. Kurze PINs sind mit dem Prüfwert im Zettel mit Rechenzeit erratbar. Neue
Chef-PIN gilt an Mitarbeiter-Geräten erst mit neuem Zettel. Kein QR-Code. Nicht am Gerät, kein echtes Relais. Im Behälter scheitern Downloads
(OCR, Modell, Film) — Proben, die das brauchen, fährt die CI.

## Zu den Nachträgen
- **Tresor-Speicherort:** in den Android-Apps ist der Ort schon frei wählbar (Androids Ordnerwahl: SD-Karte, Tablet, USB-Speicher — was Android
  anbietet; `docs/TRESORORDNER.md`). Offen und in den nächsten Brief übernommen: eine Inventur je App, **was** hineingeht (BLP: Sicherung,
  Beleg-Originale; PB/WPP: ihre Fächer), was noch fehlt (V3, Familienakte — Klaus: eigenes Fach, Mail-Anhänge?), und wie Windows den Ort wählt.
- **Herr Meier:** Netz-Antworten lesen je Beleg nur die ersten 1500 Zeichen, höchstens 300 Belege, und der Korpus wird nur beim Einschalten gebaut
  (Forschung § 29.5). Vorschlag als Sitzung A2 im nächsten Brief.

## Stundennachweis
Erste Spur 31.10. 12:14 (Uhr des Behälters; Brief, Fragen an Klaus), PB-Baustein und Proben bis 12:30, WPP 12:32, BLP 12:33, V3 12:41,
Abschluss/Doku bis ≈ 12:55; CI, Merge und Basic im Anschluss. Ein Block; ≈ 0,7 h bis zu den PRs (Obergrenze mit CI ≈ 1,1 h).
Zeile in `docs/STUNDENNACHWEIS.md`. Klaus' eigene Angabe geht vor.

## Nächste Sitzung
`BRIEF_SITZUNG_PRO-UMBAU-14B.md`.
