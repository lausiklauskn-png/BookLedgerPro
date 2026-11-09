# Abschluss 2026-10-28 (Abend): Einstellungs-Umbau Schritt 2 (Workflow PDF Pro, BookLedgerPro)

## Ergebnis
Workflow PDF Pro und BookLedgerPro haben jetzt dieselben Einstellungen wie Private Brain Pro: Kasten **„Tresor & Ablage“** mit
**Ablage** und **Tresor (alle Pro-Apps)**, je ● Zustand, ganzer Pfad und „In Dateien öffnen“, keine Web-Reste in der App,
Version sichtbar. BookLedgerPro dazu: Startseite ohne „Willkommen“, „Geschäftsjahr“ in der Kopfleiste und die Tresorordner-Ansicht in der
Reihenfolge 1 → 2 → 4 → 3. Veröffentlicht wurde **nichts**.

## Gebaut
| Repo | PR | Was |
|---|---|---|
| Workflow PDF Pro | **#34** | „Tresor & Ablage“ (Ablage von Workflow PDF Pro + Tresor, ●, Pfad, „In Dateien öffnen“ = `WorkflowVault.ordnerOeffnen`), ein farbiger Knopf, Sperren nur bei offenem Ordner, Balken bei der Übernahme · keine Web-Reste (`native/native-ohne-web.js`, Kern `upstream/` unverändert) · „Auf Updates prüfen“ (neu `WorkflowUpdates`, öffentliche Releases, nennt die Version; „Herunterladen“ öffnet nur die Release-Seite) · Windows nennt die Version ebenso |
| BookLedgerPro | **#386** | „Tresor & Ablage“ oben in den Einstellungen (nur App) · App-Texte statt Browser-Sätzen (`APP_STRINGS`), kein Installieren, kein „nicht dauerhaft“ · Version unter „Über“ · Startseite „Übersicht“ ohne Gruß/Werbesatz · „Geschäftsjahr 2026“ in der Kopfleiste · Tresorordner: 1 „Neu im Tresorordner: N“ (Belege, Einstellungen, Ansicht), 2 Fächer-Baum mit Unterordnern + „Alle auf / Alle zu“, 4 Mehrfach-Übernahme (Häkchen), 3 „In ‹App› öffnen“ |
| BookLedger Basic | Nachzug | Startseite und Kopfleiste (PWA-wirksam); alles Übrige ist nur in der App sichtbar |

## Gemessen
- Workflow PDF Pro: `npm run test:native-web` 50 grün (neu `test-ohne-web.mjs`: Rundgang DE + EN, keine DOM-Unruhe, Kasten, Updates; Gegenprobe:
  Schicht leer → rot) · JVM `UpdateRegelTest` 5 (lokal mit javac) · `windows/tools/test-update-ui.mjs` 5 · CI: siehe PR.
- BookLedgerPro: `run.mjs` 2592/0 · `smoke_ohne_web` 28/0 (Gegenprobe als PWA) · `test-native` 41 · `smoke_tresorordner` 30 · `smoke_design` 90 ·
  weitere Browser-Proben grün; `smoke_belege` 46/14 **wie auf main** (vorbestehend, gegengeprüft).

## Nicht gemacht / offen (ehrlich)
- Nichts am Tablet. Ob Androids Dateien-App einen Ordner per ACTION_VIEW zeigt, ob BookLedgerPro die anderen Pro-Apps starten darf
  (`<queries>`), ob die Update-Prüfung von Workflow PDF Pro am Gerät GitHub erreicht: ungemessen.
- Workflow PDF Pro: **Sicherung gestreamt** (Absturz ~50 MB), **Einordnen nicht automatisch beim Öffnen**, **durchgereichter Tipp** — nicht in diesem Umbau.
- BookLedgerPro: **Belegliste für Hunderte** (flache Zeilen, Mail-Gruppen, ⋯), Bedeutungs-Schalter direkt an der Suche, Strichgrafiken statt Emojis,
  Leistengriff mittig — offen. Keine Updateprüfung (Repo privat).
- Mit Klaus zu klären: ⓘ-Vorgabe der bestehenden Klapper in Private Brain Pro; Übernahme des alten Browser-Tresors; Belege → Buchhaltung; ob die
  neuen Stände als Test-APKs raus sollen (Workflow PDF Pro 1.0.7, BookLedgerPro 0.1.1, Private Brain Pro 1.0.42).

## Veröffentlicht
Nichts.
