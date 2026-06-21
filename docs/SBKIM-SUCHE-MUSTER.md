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

## Offen / ehrlich ungetestet

Der **erste echte Mistral-Richter-Lauf** und das Modell-Laden brauchen **Browser + Netz** —
in der Bau-Umgebung nicht ausführbar. Node-getestet sind: Korpus-Bauer (Konten + Knoten),
Vorfilter-Schwelle, Richter-Parsing, **alle 4 Modi**, **Fail-soft ohne Throw**, Score-Clamp.
