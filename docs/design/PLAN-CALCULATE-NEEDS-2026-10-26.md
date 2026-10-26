# Plan: Workflow Calculate (Angebote) und Workflow Needs (Bedarfsanalyse) in BookLedgerPro (Klaus 2026-10-26)

**Stand 2026-10-26 spät: GEBAUT nach E1.** Klaus' Antworten: D15b (Calculate/Needs ersetzen BLPs Angebote komplett), D16a
(BLP übernimmt den Datenbestand der Apps; keine Referenzen, keine Umwandlung alter BLP-Angebote). Abweichungen vom Plan: die
Fenster leben dauerhaft außerhalb der Shell (sonst Neuladen bei jeder Einstellung); der eigene Service Worker der App ist in der
Kopie entfernt; die Fassungsprüfung gegen die Einzel-PWA ist nicht gebaut (benannte Grenze). Bedienung/Grenzen:
`docs/APPS-CALCULATE-NEEDS.md`.

Klaus (2026-10-26): „Calculate … das können wir eins zu eins übernehmen. Wenn es irgendwelche Verbesserungen gibt, die ich in
Calculate mache, dann werden die auch in Bookledger Pro nachgezogen. Als Brücke … als 1 zu 1 Klon oder Kopie. So dass ein
separates Feld aufgeht oder separate Fenster aufgehen, wo wir dann genau die Funktionen haben von Calculate." · „Workflow
Needs, die Bedarfsanalyse. Die kann auch mit rein. Da kann man direkt von Bookledger Pro aus die Bedarfsanalyse starten." ·
„Die Emojis, die Bilder und alles kannst du mit übernehmen … eindeutig zu erkennen, dass es sich um Workflow Needs handelt
… genauso wie der Angebotsplaner." · „Der Farbstil … kann an Bookledger Pro angepasst werden."

## Was die beiden Apps sind (im Repo nachgesehen)

| | Workflow Calculate | Workflow Needs |
|---|---|---|
| Adresse | https://lausiklauskn-png.github.io/Workflow-Calculate/ | https://lausiklauskn-png.github.io/Workflow-Needs/ |
| Bauart | klassische Skripte (`window.WC`), kein Build, 90 Dateien, 3,6 MB Laufzeit | klassische Skripte (`window.WN`), 87 Dateien, 4,9 MB Laufzeit (pdf.js für die Ansicht) |
| Speicher | IndexedDB `WorkflowCalculate1`, localStorage `workflowcalculate_*` | localStorage `workflowneeds_*` + Sicherungsdatei |
| Eigener SBKIM-Knoten | ja (`SBKIM_DB_SUFFIX = "workflowcalculate"`, Module 01–23 byte-1:1) | ja (`"workflowneeds"`, Module 01–25) |
| Thema | `data-theme` light/dark, Akzent Blau/Petrol, Variablen `--bg --surface --ink --accent …` | dasselbe Gerüst, Akzent Messing |
| Übergabe | **schon heute** an BookLedgerPro: `?uebernahme=<base64url>` (Datenvertrag v1, `docs/UEBERNAHME_TOMY.md`) und Weiterleitungs-Bündel an WorkFloh | Weiterleitungs-Bündel an WorkFloh; keine Übergabe an Calculate |
| Tests | `node tests/alle.mjs` + Gegenprobe | `node tests/alle.mjs` + Gegenprobe |

BLP hat eine **eigene** Angebots-Ansicht (`src/ui/views/angebote.js`, Baukasten, Nummernkreis §14, Whitelist) und nimmt die
Übergabe aus Calculate bereits an (`src/domain/uebernahmeExtern.js`, `angebotUebernahme.js`).

## Einbettung — Varianten

**E1 (empfohlen): Kopie als eigene Unter-App im BLP-Ordner, byte-1:1 mit Herkunftsmanifest, im eigenen Rahmen geöffnet.**
- `apps/calculate/` und `apps/needs/` tragen **alle** Laufzeitdateien beider Repos bytegleich (wie `upstream/` in
  Workflow-PDF-Pro). `tools/apps-nachziehen.mjs` kopiert aus den Klonen und schreibt `apps/HERKUNFT.json` (Commit, Datei,
  SHA-256); `tests/run.mjs` prüft die Pins. **Brücke:** Klaus ändert nur in Calculate/Needs; eine Sitzung ruft das Skript,
  prüft, PR. Nichts wird hier von Hand geändert — genau eine Datei je App wird beim Kopieren **kontrolliert** angepasst:
  `index.html` bekommt eine Zeile für das BLP-Thema (`<link rel="stylesheet" href="../blp-thema.css">`) und den
  BLP-Klebstoff (`<script src="../blp-bruecke.js">`); das steht als Abweichung im Manifest (wie `prepare-web.mjs` in Pro).
- **Fenster:** zwei neue Ansichten in der Gruppe „Verkauf" — **„Angebot (Calculate)"** und **„Bedarfsanalyse (Needs)"** —
  mit den Original-Symbolen/Bildern der Apps (Klaus: erkennbar). Die Ansicht füllt den BLP-Inhalt mit einem `<iframe>`
  auf `apps/calculate/index.html` (gleicher Ursprung, kein `sandbox`-Verlust, ⟳/Zurück funktionieren). Am Handy Vollbild,
  Klaus' Knopf „← Zurück zu BookLedgerPro" oben.
- **Thema:** `blp-thema.css` bildet die sechs BLP-Themen auf die App-Variablen ab (`--bg`, `--surface`, `--ink`, `--accent` …);
  BLP reicht `data-farbe`/`data-theme` per `postMessage` in den Rahmen, der Klebstoff setzt sie am `<html>` der App.
  Die Bilder/Emojis der Apps bleiben.
- **Übergabe ohne Umweg:** Calculates „An BookLedgerPro" (`?uebernahme=`) wird im Rahmen abgefangen (`blp-bruecke.js`:
  `postMessage` statt `location`) → BLP nimmt es wie heute an und wechselt zu „Angebote/Buchungen". Needs → Calculate:
  Needs' Angebot (Stufe 3, Whitelist) als Übergabe in Calculate (neu, klein; braucht ein Lesen in Calculate — dort pflegen).
- **Offline:** die App-Dateien kommen in einen eigenen Vorrat `blpr-apps-v<n>` (nicht in die BLP-Schale), beim ersten Öffnen
  vollständig geholt, Fortschritt sichtbar; danach offline. In der nativen BLP-App liegen sie ohnehin im Paket.
- **Daten:** auf github.io teilen BLP und die Einzel-PWA denselben Ursprung → die Kopie in BLP sieht **dieselben** Angebote
  wie die installierte Calculate-PWA (gleiche IndexedDB). Das ist praktisch (ein Datenbestand), aber: läuft die Kopie in BLP
  auf einem älteren Stand als die PWA, darf sie deren Daten nicht verändern → `blp-bruecke.js` vergleicht die Fassung und
  öffnet bei Abweichung nur lesend mit Hinweis „BLP nachziehen". In der nativen App: eigener Datenbestand, Sicherung als Weg.
- Kosten: ~8,5 MB mehr Download beim ersten Öffnen der Ansichten (nicht beim BLP-Start), zwei Nachzieh-Skripte, SHA-Pins.

**E2: Nur Verknüpfung** — Knopf öffnet die PWA in einem neuen Fenster, Übergabe wie heute per `?uebernahme=`. Billig, aber
kein „separates Fenster in BLP", nicht offline aus BLP, kein Thema. Entspricht nicht Klaus' „1 zu 1 Kopie".

**E3: Einbau der Module in BLPs eigene Oberfläche** (Kern-Skripte `WC.kalkulation` … direkt nutzen, BLP zeichnet). Tiefste
Verzahnung, aber kein 1:1 mehr: jede Calculate-Verbesserung müsste nachgebaut werden. Widerspricht „Brücke".

Empfehlung: **E1**, Calculate zuerst (Übergabe steht), Needs danach mit demselben Gerüst.

## Fragen an Klaus

1. **BLPs eigene Angebots-Ansicht:** bleibt sie neben „Angebot (Calculate)" (D15a), oder wird sie in Kleinunternehmer/
   Selbstständig ausgeblendet und Calculate ist der einzige Angebotsweg (D15b)? Empfehlung: **D15b**, die alten BLP-Angebote
   bleiben lesbar unter „Weiteres" bis sie leer sind.
2. **Gemeinsamer Datenbestand** mit der installierten Calculate-/Needs-PWA auf github.io (D16a, Vorgabe in E1) oder getrennt
   (D16b: eigener Speicher-Präfix durch die Brücke, Austausch nur per Sicherung)? Empfehlung: **D16a** mit der Fassungsprüfung.

## Reihenfolge

Nach B1 (Mikrofon) und A1/A2 (Bedeutungssuche) oder davor? Klaus' Wort: „bis jetzt ist es ein sehr gutes Tool … wenn wir das
vollständig mit integrieren, wäre das gut." Vorschlag: **Calculate direkt nach B1**, Needs danach, dann A1/A2.
