# Abschluss 2026-10-28 (spät): Pro-Umbau Schritt 3 (Workflow PDF Pro, BookLedgerPro, Basic)

## Ergebnis
Workflow PDF Pro stürzt bei großen Bibliotheken nicht mehr an der Sicherung ab (gestreamt), ordnet und prüft nichts mehr von selbst, und ein
durchgereichter Tipp startet keinen Lauf mehr. BookLedgerPro hat eine Belegliste für Hunderte (flache Zeilen, Mail-Gruppen, ⋯), den
Bedeutungs-Schalter direkt am Suchfeld, Strichgrafiken statt Emojis auf der Belegseite und den Leistengriff in halber Höhe. Basic ist
nachgezogen. Veröffentlicht wurde **nichts**.

## Gebaut
| Repo | PR | Was |
|---|---|---|
| Workflow PDF Pro | **#35** (gemergt) | `native/native-sicherung.js`: Sicherung Dokument für Dokument, 192-KB-Stücke einzeln AES-GCM (PBKDF2 600 000), sofort in die Datei `Workflow-PDF-Pro-Sicherung-JJJJ-MM-TT-HHMM.wfps`; Zurückholen über die Rechnung des Kerns; alte `.json` weiter über den Kern · `native/native-hintergrund.js`: Einordnen wartet auf „Einordnen“, „Alle prüfen“ fragt vorher, „N gewählte prüfen“ in der Auswahl-Leiste, Start-Knöpfe nur bei einem Tipp, der auf ihnen begann · Kern `upstream/` unverändert |
| BookLedgerPro | **#389** | Belegliste: Zustandssymbol, gekürzter Name, Datum, Größe, Verknüpfung, ⋯-Menü; Mail → Anhänge aufklappbar, „Alle zu/auf“ gemerkt (`src/domain/belegListe.js`) · Bedeutung als `role=switch` neben dem jetzt flachen Suchfeld; Einordnen nie von selbst · `src/ui/strich.js` (Emojis → Sprites) · Leistengriff mittig · `sw.js` v274 |
| BookLedger Basic | Nachzug | Belegliste, Schalter, Strichgrafiken, Griff (alles PWA-wirksam) |

## Gemessen
- **Workflow PDF Pro:** `npm run test:native-web` **53 grün** (neu `test-sicherung.mjs` 2, `test-hintergrund.mjs` 1); CI auf #35: web-core, android-foundation,
  windows, kern-und-format grün. 60-MB-Dokument im Chromium des Behälters: neuer Weg **kein messbarer Zuwachs** am JS-Speicher (Stand vorher 190 MB, darin das
  Probedokument), **Kern-Weg +≈ 895–901 MB** (dreimal gemessen) — das ist der Absturz. Zurückholen Byte für Byte gleich, zweites Mal nichts doppelt, falsches
  Passwort/abgeschnitten/vertauscht/verändert je eigene Meldung. Gegenprobe als PWA in der Probe (Kern ordnet beim Öffnen ein; durchgereichter Tipp startet
  „Alle prüfen“) und von Hand 4/4 rot.
- **BookLedgerPro:** `run.mjs` **2602/0** · `smoke_belegliste` **23 grün** (Gegenprobe 3/3 rot) · `smoke_belegsuche` 18 · `smoke_design` 90 · `smoke_mail` 15 ·
  `smoke_teilen` 26 · `smoke_frage` 16 · `smoke_ohne_web` 28 · `smoke_tresorordner` 30 · `smoke_handnamen` 21 · `smoke_mikro` 19 · `test-native` 41 ·
  `smoke_belege` 46/14 **wie auf main**.

## Nicht gemacht / offen (ehrlich)
- Nichts am Tablet, nichts unter Windows am echten PC. Ob die WebView am Tablet ein 60-MB-Dokument beim Sichern verkraftet (es liegt dabei einmal ganz im
  Speicher), ist offen. **Keine native Hintergrundaufgabe** (Android-Dienst): die App muss beim Sichern/Prüfen/Einordnen offen bleiben.
- Workflow PDF Pro: Einordnen nicht auf eine Auswahl begrenzbar (der Kern plant selbst); die **Bildbeschreibung** startet weiter von selbst, wenn sie an ist.
  Dass der nachgestellte Mechanismus (Fenster schließt beim Antippen, Klick landet darunter) genau Klaus' Fall war, ist nicht bewiesen.
- BookLedgerPro: andere Ansichten tragen noch Emojis; 300+ Zeilen werden auf einmal gezeichnet (keine seitenweise Liste); „Teilen sichtbar / An Pro-App
  geben …“ (Leitfaden § 5) nicht gebaut.
- Private Brain Pro: in dieser Sitzung nicht geändert.
- Mit Klaus zu klären (unverändert): Test-APKs (WPP 1.0.7, BLP 0.1.1, PB 1.0.42)? · ⓘ-Vorgabe der Klapper in PB · Übernahme des alten Browser-Tresors ·
  Belege → Buchhaltung.

## Veröffentlicht (Klaus' Wort am Abend: „kannst du mir dann die Updates zur Verfügung stellen?“)
Nur Android, je Versions-PR (BLP #390, WPP #36, PB #109) und signierter Release-Lauf vom main-Commit:
| App | Version | Link | Größe | SHA-256 |
|---|---|---|---|---|
| BookLedgerPro | 0.1.1 (Code 2) | https://github.com/lausiklauskn-png/BookLedgerPro/releases/download/v0.1.1/BookLedgerPro-0.1.1.apk | 28.211.801 B | `0641bb7526a111ca9aa55563e635cb564a3a99a2ca09476a899a5f3af2d7654d` |
| Workflow PDF Pro | 1.0.7 (Code 8) | https://github.com/lausiklauskn-png/Workflow-PDF-Pro/releases/download/v1.0.7/Workflow-PDF-Pro-1.0.7.apk | 83.213.283 B | `160bf7b0603216b49116e667d8c9e99f6bc4852f15ab50f34c48f71891ce9d79` |
| Private Brain Pro | 1.0.42 (Code 42) | https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.42/Private-Brain-Pro-1.0.42.apk | 60.985.093 B | `847e8b87a40dbe33fa3f6f96d3ddfe995789424d180f1375c9c0b17693b99ba9` |

Läufe: BLP 40748351965 (Emulator-Installationsprobe) · WPP 40751284149 (nach `native-acceptance` 40748352137) · PB 40751288404 (signiertes Update 1.0.41 → 1.0.42).
WPP und PB hier unabhängig geladen: Größe und SHA-256 gleich Asset-Digest bzw. `SHA256SUMS`. BLP (Repo privat) nur über Asset-Digest und den Lauf geprüft.
Windows nicht veröffentlicht (WPP-Windows trägt 1.0.7 nur im Quelltext; PB-Windows bleibt 1.0.41). Basic #10 gemergt (PWA über Pages). Nicht erneut auslösen.
⚠ Am Tablet noch nicht geprüft.
