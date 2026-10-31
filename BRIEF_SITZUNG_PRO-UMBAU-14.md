# Sitzungsplan Pro-Umbau 14 ff. — Chef getrennt, Familienakte ins Netz, Hinweis im Sage-Protokoll, Briefkopf-Sortierung (Stand 2026-10-31)

Ersetzt den ersten Entwurf dieses Briefs. Grundlage: Klaus' Nachricht vom 2026-10-31 nach Umbau 13 (alle PRs gemergt: PB #116, WPP #46,
BLP #430, Basic #28). Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Workflow-PDF, Privat-Brain-Pro, Mein-WorkFloh,
**Meine-Familienakte**, **Sage-Protokol** (für den Hinweis; im Startauftrag anfordern). Branch wie vorgegeben.

Zuerst lesen: `CLAUDE.md` je Repo, `BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-13.md`, Forschung § 28, Private Brain Pro
`docs/UEBERALL-SUCHEN.md` (Abschnitt Chefcode), Familienakte `BRIEF_ABSCHLUSS_2026-10-29_FASSUNG-2.28.3-UND-ABGLEICH.md`.

## Klaus' Wünsche (2026-10-31, wörtlich gekürzt)

1. „Der Chef muss selber den Code eingeben können und das getrennt von den anderen.“
2. „Diese Funktion bitte mit in das Repo Familienakte einbauen.“ Dort noch offen: **Aktualisierungsknopf oben**, **programmübergreifende
   Suche** mit den anderen Programmen, die den Chefcode haben.
3. „Ein Hinweis im Sage-Protokoll … soll auch für mich funktionieren. Oder für ein eigenes Netzwerk, das man später selber bauen kann.
   Netzübergreifende Suche.“
4. **Sortierung nach Briefkopf**: beim Einlesen einer Akte, einer Datei, eines Briefs, einer Mail sollen erfasst werden: Datum des Briefs
   (abgeschickt), Absender (Firma/Person), Empfänger (wer in Familie/Betrieb), Kundennummer, Auftragsnummer und die anderen Nummern rechts
   im Briefkopf; danach (neben dem Inhalt) sortieren — „Eingangsdatum zuerst, dann die Firma, Absender … dann Kundennummer und Wichtigkeit“.
   Egal in welcher Reihenfolge eingelesen wird. In Private Brain Pro, BookLedgerPro, Workflow PDF (Pro), Familienakte, Mein WorkFloh und
   den PWAs — „bei PWA sieht man das am schnellsten“.
5. **Sortierung nach Thema** (Nachtrag 2026-10-31): „Versicherung, Urlaub oder sonst irgendetwas. Darüber muss es auch aufrufbar sein oder
   kategorisiert werden können.“ — In der Familienakte schon eingebaut, in den anderen Apps nachziehen.

## Geprüft am 2026-10-31 (was es schon gibt)

| | Stand |
|---|---|
| Chefcode | PB, WPP, BLP (nur App) — Feld ohne eigene Sperre: jeder am Gerät kann ihn ändern oder entfernen |
| Familienakte | kein Mycel/SBKIM, kein „Überall suchen“, kein Chefcode; Updates nur über Tipp auf die **Versionszeile unten** (`docs/UPDATES-EIGENER-SERVER.md`), kein Knopf oben; Internetschalter mit Lampe oben ist da (`app/netz-schalter.tsx`) |
| Themen/Kategorien | **Familienakte**: 18 Lebensbereiche mit Aliassen und Datenschutzstufe (`lib/family-categories.ts`: Versicherungen, Reisen & Freizeit, Gesundheit & Pflege, Steuern & Behörden …), Zuordnungsvorschlag beim Einlesen (`lib/document-intake.ts`) — das Vorbild. **PB**: Kategorien per Vorschlag im Explorer (`native/native-categories.js`, nur Ansicht). WPP, BLP, Mein WorkFloh: Ordner bzw. Belegart, kein Thema |
| Briefkopf-Erfassung | **nirgends.** Workflow PDF sortiert nach Name/geändert/erstellt/Größe/Seiten (`assets/app.js` `SORTIERUNG`), findet Kunden-/Auftragsnummern nur über die Wortsuche; PB kennt „Kundennummer“ nur als Wort für Kategorien (`native/native-categories.js`); BLP hat `belegDatum` und Positionen nur für Rechnungen; Familienakte hat `documentDate` (von Hand) und bei `.eml` Absender/Empfänger aus dem Mailkopf (`lib/central-intake.ts`); Mein WorkFloh sortiert Aufträge, nicht Briefe |

## Plan (eine Sitzung je Block, in dieser Reihenfolge)

### Sitzung A — Chef getrennt (PB → WPP, BLP), Fassung 6 der Bausteine
- **Chef-PIN** in `native/pro-chefcode.js` (Quelle PB): beim ersten Setzen legt der Chef eine Chef-PIN fest (mind. 6 Ziffern, PBKDF2 im
  Speicher der App, nie im Klartext). Ohne PIN zeigt der Kasten nur „Eigenes Netz aktiv“ — **kein Feld, kein Entfernen**. Mit PIN: Code
  setzen, ändern, entfernen, PIN ändern. Vorbild Mein WorkFloh „Chef-Code“ (dort 1234 als Vorgabe, Aufforderung zum Ändern — hier keine
  Vorgabe-PIN).
- **Zweiter Weg für Mitarbeiter**: der Chef erzeugt an seinem Gerät einen **Beitritts-Zettel** (Text oder QR) mit dem Netz-Code; ein Mitarbeiter
  gibt ihn einmal ein, sieht ihn danach nie wieder und kann ihn ohne PIN nicht ändern. (Klaus fragen: so, oder setzt der Chef den Code an
  jedem Gerät selbst? Empfehlung: Beitritts-Zettel.)
- Grenze benennen: wer die App bedient, kann sie immer deinstallieren oder die Daten löschen — die PIN schützt die Einstellung, nicht das Gerät.
- Proben wie `test-chefcode` (echtes Modul 23) + Gegenprobe; nachziehen nach WPP und BLP; Versionen erhöhen (nicht veröffentlichen).

### Sitzung B — Familienakte: Aktualisieren oben, Mycel, Chefcode, „Überall suchen“
- **Aktualisieren oben**: Knopf in der Kopfleiste neben dem Internetschalter (gleiche Prüfung wie die Versionszeile, nur bei Internet an);
  Wortlaut und Design des Freundes bleiben, nur nach Klaus' Ja je sichtbarer Änderung (Regel dort).
- **SBKIM/Mycel** (Module 01, 02, 03, 04, 05b, 23, 23-UI byte-1:1 aus Sage, Schublade eigen, z. B. `familienakte`) — Familienakte ist
  React/Vite: Module als statische Dateien unter `public/sbkim/`, Klebstoff in `public/native/`. Siegel nach Klaus' Wunsch.
- **Chefcode und „Überall suchen“** über die gemeinsamen Bausteine (`pro-bedienung`, `pro-ueberall`, `pro-chefcode`, Fassung aus Sitzung A)
  per Nachzieh-Werkzeug wie in den Pro-Apps; Quellen der Familienakte: Dokumente, Memory, Vorgänge; Tresorordner-Fach nur, wenn Klaus die
  Familienakte in den Tresorordner aufnimmt (Frage).
- Wichtig: Familienakte hat eigene Regeln (Oberfläche des Freundes bleibt, Beispieldaten erfunden) — dort zuerst lesen.

### Sitzung C — Hinweis im Sage-Protokoll: netzübergreifende Suche und Chefcode
- In Sage (`docs/INTERFACES.md` § Modul 23, `docs/NETZWEIT.md`) ein Abschnitt „Netzübergreifende Suche“: wie eine App antwortet
  (`configure({prepareCorpus, match})`, Korpus nur Titel · Datum · Betrag im öffentlichen Netz), was im eigenen Netz zusätzlich darf
  (Ausschnitt ≤ 200 Zeichen, Filter je Frage, Vorbild BLP `antwortFilter`), der Chefcode als Bedienung vor `saveNetwork`/`applyNetwork`,
  und der **Float32Array-Fallstrick** (Forschung § 28). Dazu ein Hinweis für ein **eigenes Relais** („später selber bauen“):
  `checkNetSetting` nimmt `wss://…` — Chefcode + eigenes Relais = ganz eigenes Netz.
- Kein Kanon-Modul ändern ohne Klaus' Wort; der Hinweis ist Doku.

### Sitzung D — Briefkopf lesen und danach sortieren (zuerst Workflow PDF als PWA)
- Neuer reiner Baustein **`briefkopf.js`** (ohne DOM, in Node geprüft), Quelle **Workflow-PDF** (`assets/`), weil WPP, Mein WorkFloh und BLP
  von dort byte-1:1 kopieren und die PWA am schnellsten zu sehen ist; PB und Familienakte kopieren ihn ebenso.
- Liest aus Textebene/Texterkennung bzw. Mailkopf: **Briefdatum** (auch „Datum:“, „Bremen, den …“), **Absender** (Firma/Person aus dem Kopf,
  Fußzeile, Mail „Von“), **Empfänger** (Anschriftfeld, Mail „An“; Abgleich mit Familie/Mitarbeitern), **Nummern** rechts im Kopf
  (Kundennummer, Kunden-Nr., Auftragsnummer, Rechnungsnummer, Vertragsnummer, Aktenzeichen, Unser/Ihr Zeichen, Versicherungsschein-Nr.),
  **Betreff**, **Wichtigkeit** (Frist, Mahnung, letzte Erinnerung, Zahlungsziel, Kündigung → Stufe). Jede Angabe mit Fundstelle; unsicher → leer,
  nie geraten; von Hand änderbar.
- **Thema** (Klaus' Nachtrag): derselbe Baustein schlägt ein Thema vor; Liste = die 18 Lebensbereiche der Familienakte mit ihren Aliassen
  (dort `lib/family-categories.ts` die Quelle, für Betriebe eine zweite Liste, z. B. Kunden, Lieferanten, Versicherungen, Steuern, Personal —
  Klaus fragen). Von Hand änderbar; in PB an die vorhandenen Kategorien anschließen, nicht doppelt bauen.
- Am Dokument gespeichert (verschlüsselt, wo die App verschlüsselt). **Sortierung**: Briefdatum (sonst Eingangsdatum) → Absender → Kundennummer
  → Wichtigkeit; dazu **Gruppieren und Aufrufen nach Thema** und nach Absender. Neue Wahl im vorhandenen Sortieren-Menü jeder App, Thema
  auch als Filter („nur Versicherungen“).
- Reihenfolge: Workflow PDF (PWA) → WPP (Kern nachziehen) → Mein WorkFloh (Anhänge) → BLP/Basic (Belege) → PB → Familienakte.
- Proben mit **erfundenen** Briefen (DIN 5008 Form A/B, Rechnung, Behördenbrief, Arztbrief, Mail), auch in falscher Einlesereihenfolge;
  Gegenprobe. Grenzen benennen: Handschrift, schräge Scans, Briefe ohne Kopf.

### Sitzung E — Geschenk-Seite: alle Apps, alle Fassungen, eine HTML (Klaus 2026-10-31)
- Nach dem Umbau **eine** HTML-Seite, wenig Text: je App eine Karte mit einem Satz „wofür“ und Knöpfen **Browser (PWA) · Android (APK) ·
  Windows** — nur die Fassungen, die es wirklich gibt. Vorbild und Ausgangspunkt: Private Brain Pro `docs/geschenk/geschenk-jens.html`
  (Artefakt „Geschenk für Jens“, Fassung 26: kurz, keine „Neu“-Listen, keine Emojis, Filme dazu).
- Apps (Stand heute): Private Brain Pro, Private Brain V3 Pro, Workflow PDF Pro, Workflow PDF (PWA), BookLedgerPro, BookLedger Basic (PWA),
  Familienakte, Mein WorkFloh (PWA), dazu Workflow Calculate/Needs, wenn Klaus will.
- **Geprüft am 2026-10-31, was dafür zu klären ist:** Downloads aus **privaten** Repos (Familienakte, Mein WorkFloh, Tomys-Hub, Kimhub …) sind
  nur angemeldet ladbar, und private Repos haben ohne Bezahlplan keine öffentliche PWA-Adresse. Für ein Geschenk müssen die Dateien öffentlich
  liegen: eigener Server `family-projekt.de/updates/<app>/` (wie BookLedgerPro), öffentliche Releases oder das Repo öffentlich machen. Jede
  Verknüpfung vor dem Veröffentlichen **unabhängig laden und SHA-256 mit der Veröffentlichung vergleichen** (wie bisher).
- Nur mit Klaus' Wort veröffentlichen (Artefakt aktualisieren, nicht neu anlegen — die Adresse von Jens' Geschenk bleibt).

## Vorschläge für weitere Apps aus dem Pool (Klaus 2026-10-31: „prüft, wo ähnliche Funktionen sinnvoll wären“)

Gelesen wurde die Repo-Liste und, wo vorhanden, die CLAUDE.md; gebaut wird nichts davon ohne Klaus' Ja je Zeile.

| App | Chefcode / Netz | Überall suchen | Briefkopf + Thema | Begründung |
|---|---|---|---|---|
| **Mein WorkFloh** und **Tomys-Hub / WorkFloh** | ja — dort gibt es schon einen **Chef-Code** (Zeiten korrigieren); mit der Chef-PIN aus Sitzung A zu **einem** Chef-Zugang zusammenführen | ja: Aufträge, Kunden, Anhänge | ja: Anhänge und Posteingang; Kundennummer mit der vorhandenen Kundenkartei (`k.nr`) abgleichen | Betrieb mit Mitarbeitern — genau der Fall „Chef und Arbeitsplätze“; beide WorkFlohs immer parallel (Regel dort) |
| **Workflow PDF** (PWA) | nur über das Mycel-Fenster „Netz“ (Kanon) | ja, ohne Tresorordner | **ja, zuerst hier** (Quelle des Bausteins) | PWA zeigt es am schnellsten; WPP und die WorkFlohs ziehen den Kern nach |
| **Company-Brain** | ja | ja | ja | Firmen-Gegenstück zu Private Brain; dort ist „Chef und Belegschaft“ der Normalfall |
| **papas-aktenschrank** | nein (Familie, ein Gerät) | ja | **ja, mit den Lebensbereichen der Familienakte** | ein Aktenschrank lebt von Datum, Absender und Thema |
| **Mein-In-and-Out-Book** | nein | ja | ja: Rechnungsnummer, Datum, Absender | Ein- und Ausgänge sind Belege — Sortierung wie bei BookLedgerPro |
| **Sende-Prüfer** | nein | nein | ja für eingehende Mails (Absender, Datum, Wichtigkeit) | sortiert dann Post nach Dringlichkeit, bevor geprüft wird |
| **Kim-sync** / **Datei-Post** | **ja**: der Chefcode als Schlüssel für Räume bzw. Empfänger im eigenen Netz | – | – | beide schicken schon zwischen Geräten; ein gemeinsamer Code statt eigener Raumcodes |
| **Kimhub / kim-hub-company** | ja (Firmen-Hub) | ja, als Startpunkt der Suche über alle Apps | – | der Hub ist der natürliche Ort für „Überall suchen“ in einer Firma |
| Rezeptbücher, Mixarium, Küchenzettel, Kochfreunde | nein | höchstens innerhalb der App | nein | keine Briefe, kein Betrieb — nicht sinnvoll |

Empfohlene Reihenfolge nach Sitzung D: (1) beide WorkFlohs (Chef-Zugang vereinen, Briefkopf für Anhänge), (2) Company-Brain, (3) papas-aktenschrank,
(4) Kim-sync/Datei-Post mit Chefcode, (5) der Rest nach Bedarf.

### Danach (wie gehabt, nur auf Klaus' Wort)
Veröffentlichen (BLP 0.1.7, PB 1.0.43, WPP 1.0.10 und Folgende), Probe über drei Orte mit Chefcode (Abhakliste im Abschluss 13 / Brief 13).

## Fragen an Klaus (zu Beginn der Sitzung stellen, wenn nicht schon beantwortet)

1. Mitarbeiter treten über einen **Beitritts-Zettel** bei (Empfehlung) — oder setzt der Chef den Code an jedem Gerät selbst?
2. Kommt die Familienakte in den **gemeinsamen Tresorordner** (Fach „Familienakte“)?
3. Briefkopf-Baustein mit Quelle in **Workflow-PDF** (Empfehlung) — einverstanden?
4. Themenliste: privat die 18 Lebensbereiche der Familienakte — welche Themen für Betriebe (BLP, WorkFloh)?

## Was nicht passieren darf

Nichts veröffentlichen ohne Klaus' Wort. Keine Schlüssel, Passwörter, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module (Sage) byte-1:1.
Bausteine nur in ihrer Quelle ändern (Bedienung/Chefcode/Überall: Private Brain Pro; Tresor/Scanner: WPP; Briefkopf: Workflow-PDF), Kopien nie
von Hand. Familienakte: Oberfläche des Freundes nur mit Klaus' Ja je Punkt. Keine Emojis. Kein Force-Push. Abschluss mit Stundennachweis und
Forschungseintrag.

## Startauftrag zum Einfügen

```
Pro-Umbau 14: Chef getrennt (Chef-PIN, Beitritts-Zettel), Familienakte ins Netz (Aktualisieren oben, Mycel, Chefcode, Überall suchen),
Hinweis im Sage-Protokoll (netzübergreifende Suche, eigenes Netz), dann Briefkopf lesen und danach sortieren (Datum, Absender, Nummern, Wichtigkeit, Thema).
Repos: BookLedgerPro, BookLedger-Basic, Workflow-PDF-Pro, Workflow-PDF, Privat-Brain-Pro, Mein-WorkFloh, Meine-Familienakte, Sage-Protokol (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14.md (Plan Sitzung A–D), BRIEF_ABSCHLUSS_2026-10-30_PRO-UMBAU-13.md, Forschung § 28.
Meine Antworten auf die vier Fragen im Brief: [1: … 2: … 3: … 4: …]
Beginne mit Sitzung A (danach B, C, D, E Geschenk-Seite, dann die Vorschläge für weitere Apps); was nicht in diese Sitzung passt, mit neuem Brief und Startauftrag übergeben.
Nichts veröffentlichen ohne mein Wort. Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle ändern.
Ein PR je App, bei grüner CI selbst mergen. Abschluss mit Stundennachweis, Forschungseintrag, Brief mit Startauftrag.
```
