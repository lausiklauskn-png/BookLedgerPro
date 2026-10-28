# Abschluss 2026-10-28 (Nachmittag): Reparaturen nach der Tablet-Probe und Einstellungs-Umbau, Schritt 1

## Ergebnis
Die drei Fehler aus der Probe sind behoben und gemergt; die gemeinsame Bedien-Datei aller Pro-Apps steht (Quelle Private Brain Pro);
Private Brain Pro hat als erste App den Kasten **„Tresor & Ablage“**, keine Web-Reste mehr in den Einstellungen und die Version bei
„Auf Updates prüfen“. Veröffentlicht wurde **nichts** (Klaus: 0.1.1 jetzt nicht).

## Klaus' Antworten (2026-10-28)
| Frage | Antwort |
|---|---|
| (a) BookLedgerPro 0.1.1 jetzt veröffentlichen? | **Nein** |
| (b) Wo wird die gemeinsame Bedien-Datei gepflegt? | **Private Brain Pro** (`native/pro-bedienung.js`/`.css`) |
| (c) Öffentlicher Herausgeber-Schlüssel `fb6cd374…709ee2f` fest in die Apps? | **Ja** — aber der volle Schlüssel steht nirgends im Repo (nur gekürzt in den Unterlagen). Klaus kopiert ihn im Herausgeber-Studio (langer Druck auf „© 2026“ → „Öffentlicher Schlüssel“ → Kopieren) und gibt ihn der nächsten Sitzung. Er ist nicht geheim. |

## Gebaut und gemergt
| Repo | PR | Was |
|---|---|---|
| Workflow PDF Pro | **#32** | „Tresorordner sperren“ bleibt gesperrt (`vonHandGesperrt` in `ProTresorordner`, wie BookLedgerPro #382); „Entsperren“ von Hand darf den gemerkten Schlüssel wieder nehmen. web-core einmal rot an einer Kern-Probe („Unable to capture screenshot“), Neustart grün. |
| Private Brain Pro | **#106** (ersetzt #105, geschlossen) | #105 übernommen **ohne Explorer-Teil**; Sperren auf der Java-Seite gelöst statt „Passwort merken“ zu vergessen; **Teilen „An BookLedgerPro“ fragt bei gesperrtem Ordner** „Entsperren und hineinlegen“ / „Normal teilen …“; dazu ein Absturz behoben, den CI fand: `tresorZustand` nach dem Schließen der Activity (`RejectedExecutionException`) — jetzt Ablehnung `NATIVE_ACTIVITY_CLOSED`. |
| Private Brain Pro | **#107** | Einstellungen Schritt 1 (siehe unten). |

## Einstellungen Schritt 1 (Private Brain Pro #107)
- **Gemeinsame Bedien-Bausteine** `native/pro-bedienung.js`/`.css` (Fassung 1, Pin `native/pro-bedienung-herkunft.json`, Werkzeug
  `tools/native/pro-bedienung-pins.mjs`, Probe `tools/native/test-pro-bedienung.mjs` 21): Knopf (flach, ein farbiger nächster Schritt),
  ⓘ (zugeklappt, gemerkt), Kasten, Fortschritt (Drehkreis/Balken, „läuft – du kannst weiterarbeiten“, Fertig/Abgebrochen), Zustand ●,
  Pfad + „In Dateien öffnen“, Versionssatz, Erkennung des öffentlichen Schlüssels. DE/EN/RU/PL/AR. Kopier-Werkzeug für die anderen Apps:
  `tools/native/bedienung-nachziehen.mjs --quelle ../privat-brain-pro` (in BookLedgerPro und Workflow PDF Pro).
- **„Tresor & Ablage“**: „Ablage von Private Brain“ und „Tresor (alle Pro-Apps)“ untereinander, je ● Entsperrt/Gesperrt, ganzer Pfad,
  „In Dateien öffnen“ (`ProVault.ordnerOeffnen`, ACTION_VIEW auf den Ordner).
- **Alter Browser-Datei-Tresor** in der App ausgeblendet, solange nie eingerichtet.
- **Keine Web-Reste** (`native/native-ohne-web.js`, nur mit App-Brücke): „Browser“-Wendungen → Gerät/App/Android, „Speicher dauerhaft“
  und Installieren weg; Probe in `test-tresorordner` (Gegenprobe ohne die Schicht rot).
- **Version** bei „Auf Updates prüfen“.

## Nicht gemacht / offen (ehrlich)
- **Workflow PDF Pro und BookLedgerPro**: nur die gemeinsame Datei kopiert (Pins), der Kasten „Tresor & Ablage“, Web-Reste und Version dort
  **noch nicht** — nächste Sitzung (Reihenfolge laut Klaus: PB → WPP → BLP).
- Übernahme des alten Browser-Tresors in die Ablage (wenn er eingerichtet ist): nicht gebaut.
- ⓘ-Vorgabe „zugeklappt“ für die **bestehenden** Klapper in Private Brain Pro (`native-help.js`, byte-gleich mit V3, Sitzung 3 sagte
  „anfangs offen“): nicht umgestellt — Klaus fragen oder gemeinsam mit V3 ändern.
- „In Dateien öffnen“: ob Androids Dateien-App einen Ordner per ACTION_VIEW zeigt, ist **nicht am Gerät gemessen**; ohne passende App sagt
  die App den Pfad.
- Herausgeber-Schlüssel: wartet auf den vollen Schlüssel.
- Aus dem Brief noch offen: Durchgereichter Tipp (Workflow PDF), Sicherung gestreamt (~50 MB), Workflow-PDF-Kern (Einordnen nicht automatisch),
  BookLedgerPro-Belegliste/Startseite/Tresorordner-Ansicht 1→2→4→3, Belege→Buchhaltung (Plan mit Klaus).
- Nichts am Tablet. `npm run build:web` in Private Brain Pro scheitert im Behälter an der OCR-Beschaffung (Proben gegen das Teilbündel).

## Veröffentlicht
Nichts.
