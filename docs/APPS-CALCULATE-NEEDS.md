# Workflow Calculate und Workflow Needs in BookLedgerPro (Klaus 2026-10-26)

**Stand: gebaut, im Chromium der Sitzung gemessen; am Tablet nicht geprüft.** Plan und Klaus' Antworten:
`docs/design/PLAN-CALCULATE-NEEDS-2026-10-26.md`. Klaus: „Calculate Needs soll Angebotsplaner komplett ersetzen" (D15b) ·
„BookLedgerPro kann den Datenbestand übernehmen, da ich keine Referenzen habe" (D16a) · „die Art, wie sie aufgebaut war,
auch die Buttongröße und alles war perfekt. Auch das Suchfeld am Anfang … Wäre gut, wenn das so halten bleibt."

## Bedienung
- **Menü → Verkauf:** **Angebotsplaner** (Bild von Workflow Calculate) und **Bedarfsanalyse** (Bild von Workflow Needs). Die
  Ansicht zeigt die App **1:1** — Aufbau, Knöpfe, Suchfeld, Bilder und Emojis sind die der App, nichts ist umgebaut.
  Nur die Akzentfarbe folgt dem BLP-Thema (Graphit, Petrol; bei „Blau" bleibt der eigene Akzent der App), hell/dunkel folgt mit.
- **Leiste über der App:** Vollbild (die App füllt den Schirm; noch einmal tippen = zurück) · Eigenes Fenster (die Kopie in einem
  neuen Browserfenster) · **Offline bereitlegen** (holt alle Dateien der App einmal in den Vorrat; danach läuft sie ohne Netz) ·
  bei Calculate: „N alte BLP-Angebote", wenn es welche gibt (öffnet die alte BLP-Angebotsansicht unter „Weiteres").
- **Angebot → Rechnung:** In Calculate wie gewohnt „🧾 An BookLedgerPro". In der Einbettung springt die Seite nicht mehr nach
  github.io, sondern BLP öffnet sofort sein Angebotsformular mit den übergebenen Positionen (Datenvertrag v1 wie bisher);
  von dort „annehmen" → Rechnungsentwurf. Nichts wird automatisch gespeichert.
- **Seitenwechsel verliert nichts:** die App bleibt geladen (nur verborgen), Eingaben stehen beim Zurückkommen noch da.
- **Daten:** auf lausiklauskn-png.github.io sieht die Einbettung **dieselben** Angebote/Vorgänge wie die installierte
  Calculate-/Needs-PWA (gleicher Ursprung, gleiche IndexedDB `WorkflowCalculate1` / `WorkflowNeeds1`, gleiches localStorage).
  BLPs eigene Angebotsansicht ist aus dem Menü genommen; alte BLP-Angebote bleiben lesbar (Knopf oben), werden nicht
  umgewandelt (Klaus: keine Referenzen).
- **Privat-Modus:** beide Ansichten ausgeblendet (unternehmerisch), wie Aufträge/Kunden.

## Brücke (Nachziehen)
Klaus ändert nur in den Original-Repos. Eine Sitzung ruft
```
node tools/apps-nachziehen.mjs            # Klone unter ../lausiklauskn-png/<repo>; sonst WC_KLON=… WN_KLON=…
node tests/run.mjs && node tests/smoke_apps.mjs
```
`apps/calculate/` und `apps/needs/` sind **byte-1:1** (62 + 66 Dateien, 8,4 MB; ohne sw.js, tests, tools, docs, package*),
jede Datei mit SHA-256 und der Commit in `apps/HERKUNFT.json` gepinnt (`tests/run.mjs` prüft: keine Datei ohne Pin, kein Pin ohne
Datei). **Genau eine kontrollierte Abweichung:** `index.html` (reine Funktion `tools/apps-patch.mjs`, Quelle-SHA im Manifest):
1. `<script src="../blp-bruecke.js">` direkt nach der SBKIM-Schublade, vor jedem Modul der App,
2. `<link rel="stylesheet" href="../blp-thema.css">` als letztes Stylesheet,
3. die Anmeldung des **eigenen Service Workers der App ist entfernt** — ihr Worker hätte unter dem gemeinsamen Ursprung denselben
   Vorratsnamen wie die installierte Einzel-PWA; eine ältere Kopie in BLP würde beim Aktivieren deren Vorrat löschen (Lehre aus
   Workflow PDF 2026-10-26). Die App-Dateien liegen stattdessen im BLP-Vorrat `blpr-apps` (sw.js, überlebt ein neues CACHE_VERSION;
   `index.html` der App netz-zuerst, alles andere Vorrat-zuerst mit Auffrischung).

`apps/blp-bruecke.js` (klassisches Skript, nur eingebettet aktiv): Thema per `postMessage` hinein (`data-theme`, `data-blp-farbe`),
Calculates Proben-Haken `__wcSprungAbfangen`/`__wcSprung` → `{typ:'blp-uebernahme', url}` an BLP statt `location.assign`,
Bereit-Meldung (sofort und nach `load`). `apps/blp-thema.css`: Akzente je Farbe, Installieren-Knopf der App im Rahmen aus.
`src/ui/views/apps.js`: Rahmen, dauerhafte Fenster in `#blp-app-frames` am `<body>` (position: fixed über dem Platzhalter; die
Shell zeichnet sich bei jeder Einstellung neu — ein `<iframe>` in ihr lud jedes Mal neu, gemessen), Übergabe-Empfang (nur von
eigenen Fenstern, gleicher Ursprung), Offline-Vorrat aus HERKUNFT.json. Reine Helfer in `src/domain/eingebettet.js`.

## Nachweise
- `node tests/run.mjs` **2481/0** (+23: Patch wirft/erkennt, Pins beider Apps, Helfer, Gating, Verdrahtung, i18n, .nojekyll).
- `node tests/smoke_apps.mjs` **19 grün** (echter Tresor, beide Kopien im Rahmen: WC/WN laufen, Brücke, kein eigener Worker,
  Thema hell/blau → dunkel/petrol mit gemessenem Akzent `#2dd4bf`, Fenster lädt beim Neuzeichnen nicht neu und liegt
  pixelgenau über dem Platzhalter, Übergabe ohne Sprung → BLP-Formular „Banner 2 m", Seitenwechsel behält das Fenster,
  Offline-Vorrat mit 66 Needs-Dateien, Vollbild).
- Gegenprobe (Wegwerf-Kopie): ein Byte in `apps/calculate/assets/app.js` · Datei ohne Pin · Brücke ohne Sprung-Haken ·
  Fenster wieder in der Shell · Patch lässt die Worker-Anmeldung stehen → je eigene rote Zeile.
- `smoke_design` 90 grün (25 Ansichten statt 24: Calculate/Needs statt BLP-Angebote).

## Benannte Grenzen
- Kein Tablet, kein echtes github.io (die Proben bedienen einen lokalen Server; dass beide Kopien dort dieselbe IndexedDB wie
  die Einzel-PWAs sehen, folgt aus dem gleichen Ursprung, ist aber nicht am Gerät gemessen).
- Die Kopie trägt den **Stand des Klons zum Zeitpunkt des Nachziehens** (Calculate `7ba175c`, Needs `c956967`); neuere Stände
  in den Original-Repos kommen erst mit dem nächsten Nachziehen. Läuft die Kopie älter als die Einzel-PWA, können beide dieselben
  Daten unterschiedlich lesen — die geplante Fassungsprüfung (E1) ist **nicht** gebaut.
- Die Apps speichern **unverschlüsselt** in IndexedDB/localStorage (ihre eigene Bauart); BLPs Tresor umfasst sie nicht.
- Jede App bleibt ein eigener SBKIM-Knoten (Schublade unverändert): im Rahmen stehen Lampen/Siegel der App zusätzlich zu
  BLPs eigenen. Nichts geht beim Laden ins Netz.
- Needs → Calculate (Bedarfsanalyse als Angebot) ist nicht gebaut (braucht ein Lesen in Calculate — dort pflegen).
- Die native BLP-App (später) bekommt die Kopien im Paket und einen eigenen Datenbestand; Austausch dann per Sicherung.
