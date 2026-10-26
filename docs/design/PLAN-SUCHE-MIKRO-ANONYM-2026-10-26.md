# Plan: Bedeutungssuche über Belege · Mikrofon überall · Anonymisierung unklarer Namen (Klaus 2026-10-26)

**Stand 2026-10-26 abends: Klaus hat geantwortet — A1, A2, A3, B1, C1 genehmigt.** Änderungen gegenüber dem Plan: B1 **ohne**
langen Druck (schwer zu entdecken) → sichtbare Sprachmarke „DE ▾" neben dem Mikrofon, Tipp öffnet die Liste, **Wahl je Feld
gemerkt**; dazu ein **Wort-Speicher** (Wortergänzung beim Tippen), in den Einstellungen löschbar. **C1 gebaut** (PR „Namen nach
Muster", `CLAUDE.md`). Reihenfolge: B1 → A1+A2 → A3.

**Stand 2026-10-26 nachts: alles gebaut** — C1 (Namen nach Muster), B1 (Mikrofon mit Sprachmarke, Wort-Speicher), A1+A2 (Suche
über Belege, Text/Vektoren verschlüsselt am Beleg) und A3 (Frage an die Belege, nur pseudonymisiert, Vorschau, Halt). Abschnitte
in `CLAUDE.md`; Proben `smoke_handnamen` 21 · `smoke_mikro` 19 · `smoke_belegsuche` 18 · `smoke_frage` 16 · `run.mjs` 2458/0.

Klaus (2026-10-26): „wir machen noch eine Embedding-integrierte Suche innerhalb von BLP, ohne KI. Und wenn mit KI, dann
mit Anonymisierung … Wenn ich innerhalb von Bookledger Pro Dateien suche, dann auch die Embedding-Suche, also die
Bedeutungssuche, Vektorsuche und ähnliches. Dann überall, wo Texte eingegeben werden können, auch ein Mikrofon zum
Texte einsprechen und die entsprechende Sprache.“ Und: „bei der Anonymisierung noch Namen mit einfügen, die nicht
klar definiert sind.“

## Was schon da ist (im Repo nachgesehen)

- **Modell:** `sbkim/03_embedding.js` (byte-1:1 aus Sage, e5-small, 384 Zahlen, 118 MB) und `src/sbkim/embed.js`
  (`loadEmbedder`, `cosineSimilarity`). Das Modell wird heute nur **opt-in** fürs SBKIM-Andocken und den
  Konten-Richter geladen (`src/sbkim/hybridSearch.js`: Vorfilter lokal, Richter = Mistral nur mit Schlüssel).
- **Belege:** `src/domain/documents.js` speichert Datei, Original, Herkunft, Stand — **aber keinen erkannten Text**.
  Der Text aus Textebene/OCR lebt nur im Vorschlag (`documents.js` Ansicht) und ist danach weg. Eine Suche braucht
  ihn gespeichert (verschlüsselt, wie alles im Tresor).
- **Mikrofon:** heute **nur** in der SBKIM-Suche (`src/ui/views/sbkimsuche.js`, `src/ai/speech.js`): Browser-Engine
  (Audio geht an den Browser-Hersteller, nicht EU) oder EU-Engine (Google Speech-to-Text EU, eigener Schlüssel),
  Sprachen de/en/ru, EU-Politik „frei“/„bindend“ in den KI-Einstellungen. Sonst ~67 Textfelder ohne Mikrofon.
- **Anonymisierung vor der KI:** exakte Anker aus Stammdaten (`src/ai/anker.js`: Kunden, Mitarbeiter, Firma,
  „Weitere Namen“, „Nie verdecken“), Muster für E-Mail/IBAN/USt-IdNr/Steuernummer/Telefon (`src/ai/ner.js`),
  **Namensvorschläge** aus Anrede/Begrüßung/Grußformel (Modul 25, `src/ai/namensvorschlag.js`) — die verdecken
  heute **nichts von selbst**, erst ein Tipp auf „＋ Name“ (Klaus 2026-10-02: „gut, solange es ein Vorschlag bleibt“).

## Teil A — Bedeutungssuche über Belege (ohne KI)

**A1 (empfohlen): Suchfeld in „Belege“, Treffer nach Bedeutung, alles auf dem Gerät.**
- Beim Ablegen und bei jeder Texterkennung wird der erkannte Text **verschlüsselt am Beleg** gespeichert
  (`rec.textV` als verschlüsselter Block wie `originalDaten`; nie im Klartext in IndexedDB).
- Ist das Modell geladen (einmaliger Opt-in-Knopf „Bedeutungssuche einschalten“, 118 MB, wie heute beim Andocken),
  rechnet BLP je Beleg einen Vektor (`embedPassage`, Schnipsel je ~500 Zeichen) und speichert ihn **verschlüsselt** mit.
  Suchfrage → `embedQuery` → Cosinus über alle Beleg-Vektoren → Liste „am ähnlichsten“, dazu die Wortsuche (Name,
  Betrag, Datum, Lieferant) als zweiter Weg. Ohne Modell: nur Wortsuche, ehrlich beschriftet.
- Keine KI, kein Netz (das Modell kommt einmal von jsDelivr/Hugging Face, wie heute; Sage-Weg `SBKIM_MODEL_ROOT`
  bleibt). Zeit je Beleg am PC gemessen zu melden; am Handy voraussichtlich mehrere Sekunden je Beleg → Vektor
  wird **im Hintergrund** nachgerechnet, Suche geht trotzdem sofort mit Wörtern.
- Grenze: Text, der nie erkannt wurde (Beleg ohne OCR/Textebene), findet die Suche nicht; die Liste sagt
  „N Belege ohne Text“.

**A2: Dieselbe Suche zusätzlich über Buchungen, Kunden, Aufträge** (Buchungstext, Notiz, Kundenname).
Kleiner Zusatz, wenn A1 steht; eigener Schalter „auch in Buchungen suchen“.

**A3: Mit KI (nur wenn Mistral-Schlüssel gesetzt): „Frage an die Belege“** — die k ähnlichsten Belegtexte gehen
**pseudonymisiert** (Anker + Muster + Namen aus Teil C) mit einer Frage an Mistral EU, Antwort mit Belegverweisen.
Immer erst Vorschau „Das sieht die KI“, Halt bei KI-Anweisung im Text (wie heute `kiTextFreigabe`). Später, nach A1.

Empfehlung: **A1 jetzt, A2 gleich dazu, A3 als eigener Schritt danach.**

## Teil B — Mikrofon an allen Texteingaben, mit Sprachwahl

**B1 (empfohlen): ein gemeinsamer Mikro-Knopf für jedes Textfeld, eine Sprachwahl für die ganze App.**
- `src/ui/mikro.js`: hängt an jedes `input[type=text|search]` und `textarea` (nicht an Passwort, Zahl, Datum, IBAN)
  rechts einen flachen 🎙-Knopf (28 px, A5-Regel: schneidet nichts ab, auch bei 200 %). Erkannter Text wird **an der
  Cursorstelle eingefügt**, nicht ersetzt.
- Sprache: ein Feld in den Einstellungen „Sprache fürs Einsprechen“ (Deutsch · English · Русский · Polski ·
  automatisch = App-Sprache) **plus** langer Druck/Rechtsklick auf den Knopf zum einmaligen Wechsel. Gleiche
  Engines wie heute: Browser (sofort) oder EU (Schlüssel); EU-Politik „bindend“ sperrt die Browser-Engine wie bisher.
- Ehrlich im Hinweis beim ersten Druck: bei der Browser-Engine geht die Aufnahme an den Browser-Hersteller.
- Fail-soft: kein Mikrofon/kein Recht → Hinweis, Feld bleibt tippbar.

**B2: nur die wichtigsten Felder** (Buchungstext, Notiz, Belegsuche, Kundenname). Weniger Arbeit, aber Klaus sagte
„überall“.

Empfehlung: **B1.** Frage: soll die Sprachwahl **pro Feld gemerkt** werden (z. B. Notizen russisch, Buchungstext
deutsch) oder reicht eine App-weite Wahl mit Einmal-Wechsel?

## Teil C — Anonymisierung auch für Namen, die nicht klar definiert sind

Heute werden nur Namen verdeckt, die BLP kennt (Stammdaten, „Weitere Namen“). Ein Name mitten im Belegtext
(„Rechnung an Thomas Berger“) ohne Anrede bleibt stehen.

**C1 (empfohlen): Namensmuster verdecken automatisch — aber sichtbar und rücknehmbar.**
- Erkennung ohne Modell, nur Muster (`src/ai/ner.js` erweitern): Anrede + Name (Herr/Frau/Dr./Hr./Fr.), Vorname +
  Nachname (zwei großgeschriebene Wörter, nicht am Satzanfang, nicht in der Stoppliste „Rechnung Nr“, „Lieferung
  Frei Haus“, Monatsnamen, Konto-/Steuerwörter), Zeilen nach „z. Hd.“, „Ansprechpartner“, „Kontakt“, „Inhaber“,
  „Kunde“, Namen vor „GmbH/UG/e.K./KG“ bleiben FIRMA (werden heute schon verdeckt, wenn bekannt — neu auch unbekannt).
- Alles Erkannte wird **als `[[PERSON_n]]` verdeckt** und in der Vorschau „Das sieht die KI“ **gelb markiert**: ein
  Tipp nimmt die Verdeckung für genau diesen Treffer zurück („ist kein Name“) und legt ihn unter „Nie verdecken“;
  Sorte und Rückname wie im Sende-Prüfer. Die Richtung ist „im Zweifel verdecken“ (Datenschutz-Lehre von `ner.js`).
- Kontierung leidet kaum: Mistral braucht Lieferant/Produkt/Betrag, nicht den Namen. Verdeckte Firmen bleiben als
  `[[FIRMA_n]]` erkennbar „ein Lieferant“.
- Gegenprobe mit echten Fehlerfällen: „Müller-Thurgau“ (Wein, kein Name), „Berliner Sparkasse“, „Hans Riegel
  Bonn“ (Haribo, Firma), Straßennamen „Goethestraße“.

**C2: Vorschlagsliste ausbauen, weiter nichts automatisch verdecken** (Status quo plus mehr Muster). Sicher gegen
Falsch-Treffer, aber ein übersehener Name geht hinaus. Widerspricht Klaus' Satz „mit einfügen“.

**C3: lokales Namens-Modell** (NER mit transformers.js, ~100 MB mehr). Besser bei Namen ohne Muster, aber ein
zweites Modell, langsamer am Handy, und auch nicht sicher. Später, falls C1 zu oft daneben liegt.

Empfehlung: **C1.**

## Reihenfolge und Fragen an Klaus

1. **C1** zuerst (kleinster PR, schützt sofort jeden KI-Weg, auch A3 später).
2. **B1** (ein PR).
3. **A1 + A2** (ein PR), dann **A3** (eigener PR).

Fragen: (1) Sprachwahl pro Feld merken oder App-weit? (2) Soll das Modell für die Bedeutungssuche beim ersten
Öffnen von „Belege“ **angeboten** werden (ein Knopf, 118 MB, nur WLAN) oder nur in den Einstellungen stehen?
(3) Verdeckte Namen in der Vorschau gelb mit Rücknahme — reicht das, oder soll vor dem **ersten** Senden immer ein
Halt kommen, auch ohne Fund?
