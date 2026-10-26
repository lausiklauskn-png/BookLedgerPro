# Befund: Übersetzung in der App, offline (Klaus 2026-10-26)

Klaus: „Google gibt die Übersetzung neuerdings frei für eingebaute Apps oder für Apps, die über den Browser laufen …
Übersetzungsmöglichkeiten innerhalb der App nutzen und später in der Pro-Version direkt installieren … so, dass die
Übersetzung dann noch offline läuft. Klär das mal bitte."

## Was Google freigegeben hat (Stand der Suche 2026-10-26, Netz des Behälters erreicht developer.chrome.com nicht direkt)

- **Translator API und Language Detector API** sind seit **Chrome 138** fest eingebaut („built-in AI"), auch Edge (148).
  Das Sprachmodell wird beim ersten Gebrauch einer Sprachrichtung **einmal geladen**, danach läuft die Übersetzung
  **auf dem Gerät und offline**. Zugriff aus jeder Webseite/PWA per `Translator.create({sourceLanguage, targetLanguage})`,
  Verfügbarkeit vorher mit `Translator.availability()`; braucht eine Nutzergeste.
- **Grenze, die zählt:** Googles Doku sagt ausdrücklich, dass diese APIs **nur in Chrome auf dem Desktop** laufen —
  **nicht auf Android, nicht auf iOS**, also auch nicht in der Android-WebView einer Capacitor-App. Für die Pro-Apps auf
  dem Tablet bringt die Freigabe deshalb (noch) nichts; für den PC sehr wohl.
- Workflow PDF nutzt genau das schon: `assets/uebersetzung.js` übersetzt am PC mit der Translator-API (offline nach dem
  ersten Laden) und bietet auf Android den Umweg „Mit Chrome übersetzen" (Teilen → Chrome, ⋮ Übersetzen).
- Private Brain Pro übersetzt auf Android **ohne Google** offline: eigene Modelle (transformers.js 2.17.2 + ONNX, aus
  `tools/native/translation-models.json`, sichtbarer Download je Richtung, Worker im App-Speicher; `ProTranslation` /
  `PBTranslationDevice`; DE/EN/RU/PL). Dort steht auch begründet, warum **kein ML Kit**: dessen Modell-Download lässt sich
  nicht abbrechen und könnte den App-Internetschalter umgehen.

## Was das für BookLedgerPro heißt

| Fassung | Weg | offline nach dem ersten Laden |
|---|---|---|
| PWA am PC (Chrome 138+, Edge) | Translator API (wie Workflow PDF) | ja |
| PWA auf Android/iPhone | keine Translator API; Umweg „Mit Chrome übersetzen" (Workflow-PDF-Weg) | nein (Chrome braucht Netz) |
| Pro-App Android (Capacitor) | eigener Modell-Worker wie Private Brain Pro (`ProTranslation`), Modelle aus dem App-Speicher | ja |
| Pro-App Windows (Tauri/WebView2) | WebView2 hat die Translator-API nicht; derselbe Modell-Worker wie Android (transformers.js läuft dort) | ja |

**Empfehlung (Variante Ü1):** eine gemeinsame kleine Schicht `src/ai/uebersetzen.js`: zuerst Translator-API (wenn da),
sonst der lokale Modell-Worker aus Private Brain Pro (Dateien byte-1:1 übernehmen, SHA-Pins), sonst der Chrome-Umweg;
Modelle nur auf Knopf laden, Größe vorher nennen, Internetschalter beachten. Erste Anwendung in BLP: **Belegtext und
E-Mail-/Angebotstexte übersetzen** (unter dem Original, wie in PBP), später Oberflächentexte.
**Ü2:** nur Translator-API (PC) + Hinweis auf dem Handy — klein, aber auf dem Tablet nichts offline.
**Ü3:** Mistral (EU, Schlüssel) — nicht offline, nur pseudonymisiert; passt nicht zu „offline".

Frage an Klaus: Ü1 bauen (Reihenfolge: nach Calculate/Needs oder davor)? Welche Texte zuerst — Belege, Angebote, Mails?

Quellen: Chrome for Developers „Translation with built-in AI" und „Client-side translation with AI"
(developer.chrome.com/docs/ai/translator-api, …/translate-on-device), MDN „Translator and Language Detector APIs",
Google ML Kit „Translation" (developers.google.com/ml-kit/language/translation), Private Brain Pro
`docs/NATIVE-LOKALE-UEBERSETZUNG.md`, Workflow-PDF `CLAUDE.md` Abschnitt „🌐 Übersetzen".
