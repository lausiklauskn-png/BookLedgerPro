# SBKIM-Suche — das mehrstufige semantische Such-Muster (wiederverwendbar)

> **Was das ist:** eine kleine, build-freie „Suchmaschine", die **Bedeutung** statt
> Stichwörter trifft — und zwar in **Stufen**, damit sie ehrlich, billig und robust ist.
> Sie ist bewusst so geschnitten, dass **derselbe Maschinenraum** in jede Schwester-App
> passt: man tauscht nur den **Korpus** (das Durchsuchte), nicht die Mechanik.
>
> Umgesetzt in BookLedgerPro als Ansicht **„SBKIM-Suche"**. Module:
> `src/sbkim/{embed,match,hybridSearch,searchCorpus}.js`, View `src/ui/views/sbkimsuche.js`.
> Herkunft: Sage-Andock-Brief 2026-06-21 (Hybrid-Match-Richter), **BLP-native nach Sage-Spec**.

## Die zwei Schichten (nicht verwechseln!)

| Schicht | Was sie tut | Womit | Kosten |
|---|---|---|---|
| **1 — Vektor-Vorfilter** | Text → Vektor → **Cosinus**-Vergleich mit dem Korpus; grobe Kandidaten | lokal, `embed.js` (e5-small, opt-in) | billig, offline |
| **2 — Richter** | **liest** die Bedeutungs-Texte der Kandidaten und **urteilt** (passt/nicht, Score, **Begründung**) | KI: Mistral EU (BYOK) | nur opt-in, nur für die ~5 Vorfilter-Treffer |

**Wichtig:** Der **Richter vergleicht keine Vektoren.** Schicht 1 macht den Vektor-Vergleich
(und erzeugt z. B. den Wert BLP↔Sage = 0.81). Schicht 2 ist die **KI, die liest und
entscheidet** — sie korrigiert genau das **Anisotropie-Rauschen** von Schicht 1 (bei kurzen
Texten ist Cosinus ~0.8 fast Grundrauschen, siehe Sages `LEHRE-EMBEDDING-MATCH-KALIBRIERUNG`).
Erst beide Stufen zusammen ergeben einen ehrlichen Treffer.

## Größeres Bild: Sages Erkennen hat DREI Schichten (nicht eine)

> **Status: GEBAUT (nicht mehr nur dokumentiert).** Der Drei-Schichten-Erkenner ist als
> echte, node-getestete Funktion in `src/sbkim/match.js` umgesetzt (`matchDimensions`,
> `schichtApoptose`, `queryLocalDimensions`) und in die Suche verdrahtet (`sbkimHybridSearch`
> mit `queryNode`). Sages volles Modul 04 (`SbkimMatch`, **Karte 04 § Drei-Schichten-Modell**)
> erkennt **feiner** als ein einzelner Cosinus — **bidirektional** über Angebot/Bedarf.

**(A) Drei orthogonale Schichten (Lanes):** `fachlich · prozess · skalierung`. Jede ist eine
eigene Bedeutungs-Achse; sie werden **getrennt** bewertet, nicht zu einer Zahl verschmolzen.

**(B) Bidirektional über `cap`/`needs` (Angebot ↔ Bedarf):** statt eines Vektors trägt ein
Knoten **zwei** — was er **bietet** (`cap`) und was er **sucht** (`needs`). Daraus zwei Lanes:

| Lane | Rechnung | Bedeutung |
|---|---|---|
| **Lane 1** | `cos(queryCap × passageNeeds)` | **ich biete → du suchst** |
| **Lane 2** | `cos(queryNeeds × passageCap)` | **ich suche ← du bietest** |

`Schicht-Score = Mittel der berechenbaren Lanes` (eine, beide oder `null`); `overall = Mittel
der nicht-null Schichten`. Fehlt einer Seite **beide** Vektoren → **Nur-Anbieter-Modus**
(alle Schichten `null`, Rückfall auf den `domainVector`-Cosinus). Bei uns: `queryLocalDimensions`
rechnet genau das je Korpus-Knoten und reicht den passenden `modus` (`schichten`/`domain`) mit.

**(C) Schwellen-Vertrag (Apoptose-Regel):** je Schicht `SCHICHT_MIN_MATCH = 0.60`, overall
`PROVIDER_MIN_MATCH = 0.80`. **Eine** Schicht unter 0.60 ist **erlaubt** (typischer
**Brücken**-Anlass, `BridgeProposal`); **zwei oder mehr** drunter → **Apoptose** im Aufrufer
(kein Match). So ist eine fehlende Achse Anlass für eine Brücke, zwei fehlende ein Veto.

**(D) Zwei Stufen wie bei uns:** **Stufe A** ist eine Heuristik (alle drei Schichten = derselbe
Lane-Cosinus über demselben Embedding-Raum); die **echte Differenzierung** der drei Achsen kommt
in **Stufe B** per LLM (`explainMatchLLM`, bei uns der Mistral-EU-Richter). Genau hier sitzt
unser Richter — er ist die Stufe B.

> **Ehrlicher Stand BLP (was läuft, was noch fehlt):**
> - ✅ **Engine gebaut & node-getestet:** `matchDimensions` (zwei Lanes, Schicht-Score, overall,
>   Nur-Anbieter-Modus, synchroner Wurf bei vier `null`), `schichtApoptose` (1 drunter erlaubt,
>   2+ → Apoptose), `queryLocalDimensions` (Apoptose wirkt, Rückfall auf `domainVector`).
> - ✅ **In die Suche verdrahtet:** `sbkimHybridSearch({ queryNode })` nimmt den Drei-Schichten-
>   Pfad statt des Freitext-Vorfilters; alle Modi/Fail-soft/Richter bleiben unverändert.
> - ✅ **Sporen-Schema:** `buildSpore` signiert optionale `capVector`/`needsVector` mit;
>   `nodeCorpusEntries` hebt echte (nicht-`_demo`) cap/needs als `capVec`/`needsVec`.
> - ⏳ **Aktivierung (offen):** unsere committete Spore trägt **noch keine** echten `cap`/`needs`
>   (dazu Spore mit `buildCapText`/`buildNeedsText` neu einbetten + **neu signieren** im Browser).
>   Bis dahin läuft der Knoten-Pfad im **Nur-Anbieter-Modus** (domainVector). Der **Freitext-UI-
>   Pfad** bleibt bewusst einschichtig (für getippte Anfragen richtig).
>
> Die Vertrags-Fläche (unten) bleibt durch all das **unberührt** — sie ist die Interop-Garantie,
> nicht die Zahl der Schichten.

## Vertrags-Fläche (1:1 zu Sage — sonst nicht interoperabel)

- **Verdict:** `{ label, anchorId, passt, score, begruendung }`
- **Rückgabe-Modi:** `vorfilter-leer` · `nur-vorfilter` · `fail-soft-vorfilter` · `richter`
- **Fail-soft (Kernregel):** der Richter ist **NIE eine Eintritts-Barriere** — fehlt der
  Schlüssel oder bricht das Netz, **gilt der Vorfilter** (kein Throw). Es wird **immer etwas
  Sinnvolles** gezeigt.
- **attestation** (signierbar, optional): `{ kind:"sbkim-hybrid-match-judgment", version,
  judgedAt, provider, model, region, queryLabel, verdicts[] }`

## Der Trick: der Korpus ist austauschbar

Die Suche kennt nur **Korpus-Einträge** der Form:

```js
{ label: "Anzeigename", text: "Bedeutungs-Text (für den Richter)",
  anchorId: "eindeutige-id", passageVec: Float32/number[](384) }
```

Damit ist **dieselbe Maschine** mehrfach nutzbar — in BLP heute **zwei Bereiche**:

| Bereich | Korpus | Anwendung | passageVec |
|---|---|---|---|
| **Konten** | deine Konten (`loadAccounts`) | passendes Buchungskonto finden | beim 1. Lauf eingebettet |
| **Knoten** | Peer-**Sporen** (`spore.json`, `*_inbox.json`) | **gleichwertige Mycel-Knoten finden** (der Ur-Gedanke) | **kommt fertig aus der Spore** (`domainVector`) → kein Korpus-Embedding nötig |

> Die **Knoten-Suche** ist der ursprüngliche Gedanke: „über eine semantische KI-Suche
> gleichwertige Knoten/Apps finden." Da signierte Sporen ihren echten `domainVector` bereits
> tragen, braucht dieser Bereich **nur** die **Anfrage** einzubetten — der Korpus ist gratis.

## So baut man einen neuen Such-Bereich (Rezept)

1. **Korpus-Bauer** schreiben: Quelle → `[{label, text, anchorId, passageVec?}]`
   (`searchCorpus.js`: `accountCorpusEntries`, `nodeCorpusEntries` als Vorlagen).
2. Fehlt `passageVec`, mit dem **Opt-in-Embedder** nachfüllen
   (`loadEmbedder()` → `embedPassage`; `embedCorpus` / `embedMissingVectors`).
3. Suchen: `sbkimHybridSearch(text, corpus, { apiKey: cfg.mistralKey, provider:'mistral',
   euOnly:true, queryLabel:'<App>', model: cfg.mistralModel })`.
4. Ergebnis nach `mode` anzeigen (Richter-Urteil **mit Begründung** bzeigen; bei Fail-soft/
   nur-Vorfilter die Vorfilter-Treffer — **nie** eine leere Sackgasse).

## Spracheingabe — additive Eingabe-Schicht (optional, build-frei, mehrsprachig)

Die Suche nimmt **einen String** entgegen — woher der kommt, ist ihr egal. Darum ist die
**Spracheingabe eine reine Eingabe-Schicht obendrauf**: sie füllt nur das Textfeld, die
Pipeline (Vorfilter → Richter) bleibt **unberührt**. Modul: `src/ai/speech.js`.

**Zwei Engines (Nutzer schaltet um) — beide ohne Bundler/CDN:**

| Engine | Womit | Schlüssel? | Datenschutz |
|---|---|---|---|
| **Browser** | Web Speech API (`makeBrowserRecognizer({lang})`) | nein | Gerät/Browser-Hersteller — EU-Vorbehalt, darum als Hinweis ausgewiesen |
| **EU (BYOK)** | Google **Cloud Speech-to-Text**, **EU-Endpoint** (`eu-speech.googleapis.com`) via `startRecording()` → `recognizeEU()` | ja, lokal verschlüsselt | EU-Datenresidenz, opt-in (Regel #8) |

> **Fail-soft-Geist wie beim Richter:** Die Spracheingabe ist **nie Pflicht** — Tippen geht
> immer. Fehlt Mikro/Schlüssel oder bricht das Netz, bleibt das Textfeld bedienbar
> (`speechFehlerHinweis()` gibt einen klaren Hinweis statt eines Throws).

**Mehrsprachig (ein Wähler, derselbe Maschinenraum):** ein `<select>` setzt `languageCode`
(`de-DE` / `en-US` / `ru-RU` …). Die EU-Engine bekommt zusätzlich
`alternativeLanguageCodes` (die übrigen Sprachen) → tolerant gegenüber gemischten Sätzen.
Die **Such-Logik selbst war schon mehrsprachig** (multilingual-e5-small + Mistral) — der Wähler
betrifft nur die **Erkennung** des gesprochenen Worts. Reines Daten-Array, beliebig erweiterbar:

```js
const SPEECH_LANGS = [['de-DE','Deutsch'], ['en-US','English'], ['ru-RU','Русский']];
const alt = SPEECH_LANGS.map(([c]) => c).filter((c) => c !== gewählt);
recognizeEU(audio, { apiKey, languageCode: gewählt, alternativeLanguageCodes: alt });
```

**UX-Lehre (teuer gelernt): erkannten Text NICHT wegwerfen.** Wer die Ansicht bei jedem
Ergebnis neu zeichnet, darf das Eingabefeld **nicht** mit `value:''` neu bauen — sonst
verschwindet die (gesprochene!) Frage, sobald das Urteil erscheint. Lösung: die Eingabe in
**einem Zustand** halten (`_query`), beim Neuzeichnen daraus vorbelegen, **nur beim Schließen/
Neu-Öffnen** der Ansicht zurücksetzen. So bleibt die Frage stehen, bis der Nutzer neu eingibt.

## Schwelle / `minScore` — wichtige Kalibrierungs-Lehre

Der Vektor-Vorfilter hat eine Untergrenze `minScore` (Default `PROVIDER_MIN_MATCH = 0.80`,
Sage-Vertrag für **strenges Knoten-Matching**). **Für eine SUCHE ist 0.80 zu hoch:** ein kurzer
Korpus-Eintrag („Bewirtungskosten") gegen einen ganzen Satz („Ich habe mein Team zum Essen
eingeladen") liegt bei e5-small oft bei ~0.75–0.79 → der Vorfilter würde **alles verwerfen**
(`vorfilter-leer`) und der Richter käme nie dran. Die SBKIM-Suche übergibt darum **`minScore: 0`**:
der Vorfilter reicht **immer die besten Top-k** durch, **der Richter** trifft die Auswahl. Das ist
dieselbe Lehre wie bei Sage (0.80 ist mal zu hoch, mal zu tief — eine feste Schwelle taugt nicht
als Tor; sie ist nur ein Signal).

## Goldene-Regeln-Konformität

- **Regel #1 (build-frei, kein CDN):** Das e5-Modell wird **nur opt-in einmalig** geladen
  (kein Betriebs-CDN) und danach wiederverwendet (`loadEmbedder`-Singleton). Im Offline-Shell
  lädt nichts von selbst.
- **Regel #8 (EU/BYOK/opt-in):** Der Richter läuft ausschließlich über **Mistral (EU)** mit
  dem **lokal verschlüsselten** Schlüssel; die Anfrage verlässt das Gerät nur, wenn ein
  Schlüssel da ist — sonst bleibt alles lokal (Vorfilter).
- **Halluzinations-Schutz (Buchhaltung!):** Der Richter referenziert Kandidaten NUR über ihre
  **Nummer (`id`)**; angezeigt wird **immer das kanonische Label/Konto aus dem Korpus**, nie das
  Modell-Echo. Verdicts ohne Treffer in der Liste werden **verworfen**. (Echter Befund: das Modell
  gab „6800" — SKR04 — statt des Korpus-Kontos „4630" — SKR03 — zurück; jetzt unmöglich.)
- **Ehrlichkeit:** BLP-native Umsetzung **nach** Sage-Spec, **nicht** als verbatim Kopie
  ausgegeben. Interoperabilität entsteht über die **Vertrags-Fläche**, nicht über byte-gleichen
  Quelltext.

## Verifikations-Stand (ehrlich)

**Im Browser vom Nutzer real verifiziert (2026-06-21):**
- Richter-Lauf `available:true` (mistral-large, eu), sinnvolle Urteile + Fail-soft bei WLAN-aus.
- **Spracheingabe BEIDE Engines:** Browser **und** EU/BYOK (Cloud Speech-to-Text EU). Der EU-Weg
  ist **end-to-end** bestätigt: 🎤 → EU-STT → Text → Vorfilter → Richter → **dasselbe Urteil wie
  beim Tippen** (gleicher Text ⇒ gleiches Verdict — der Beweis, dass Sprache nur eine
  Eingabe-Schicht ist).

**Node-getestet** (in der Bau-Umgebung ausführbar): Korpus-Bauer (Konten + Knoten),
Vorfilter-Schwelle, Richter-Parsing, **alle 4 Modi**, **Fail-soft ohne Throw**, Score-Clamp,
`buildSpeechRequest` (Encoding, `languageCode`, `alternativeLanguageCodes`).

**Bleibt browser-/netzgebunden** (nicht in Node ausführbar, daher nur per Nutzer prüfbar):
Modell-Laden (e5, opt-in), Mikrofon-Aufnahme, die realen Cloud-Antworten selbst.
