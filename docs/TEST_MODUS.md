# Test-Modus (Sandbox-Tresor) — Spezifikation

> **Status: SPEC / geplant (build-frei).** Sicheres Ausprobieren der ganzen App, ohne die echten
> Daten zu berühren — am Ende wahlweise spurlos weg. Nutzer-Gespräch 2026-06-17. Über Sitzungen pflegen.

## Ziel
Die **gesamte echte App** gefahrlos durchtesten (jedes Feld, jeder Ablauf, echte Logik: Buchung,
Festschreiben, Kalkulation, Export) — die **echten Daten bleiben unberührt**, und Testdaten lassen
sich **behalten oder spurlos verwerfen**.

## Architektur — wegwerfbarer Test-Tresor (NICHT eine Feld-Maske)
- Jeder Test ist ein **eigener, eigenständig verschlüsselter Tresor** (eigene IndexedDB), markiert als
  **`sandbox`** — technisch ein Mandant über die **vorhandene Mehrmandanten-Schicht** (`core/db.js`
  konfigurierbare aktive DB, `core/mandantenStore.js`, `domain/mandanten.js`). DB-Suffix `bookledgerpro`
  bleibt (z. B. `blpr_sandbox_<id>_bookledgerpro`).
- **Warum kein Feld-Overlay:** eine Maske, die „keine echten Eingaben macht", würde die App-Logik gar
  nicht ausführen → man testet nichts Echtes. Der Test-Tresor testet **das echte Programm** und wirft
  danach **alles** weg. Einfacher (kein DOM-Overlay über dynamische Felder), sicherer, aussagekräftiger.

## Mehrere unabhängige Tests + Behalten/Verwerfen (Nutzer-Wunsch 2026-06-17)
- **Löschen ist eine Wahl, kein Zwang.** Beim Verlassen fragt die App: **„Test behalten oder verwerfen?"**
  Behalten → Eingaben sind beim nächsten Mal noch da (weitertesten, wo man war).
- **Mehrere getrennte Tests nebeneinander:** **„Neuer Test"** startet einen **leeren** Sandbox-Tresor, während
  bestehende Tests erhalten bleiben → eine **neue Funktion auf sauberer Basis** prüfen, ohne alte Testdaten
  anzufassen.
- **Pro Test:** behalten / leeren / löschen; dazu **„Alle Tests löschen"** (Aufräumen, kein Datenmüll).
- **Optional vorbefüllt:** neuer Test wahlweise **leer** oder **mit Demo-Daten** (`domain/demodaten.js`).

## Sicherheit (Risiko rundum abgesichert)
- **Echte Daten unberührt — garantiert:** Tests sind **eigene DBs**, getrennt vom echten Tresor →
  Schreiben in echte Daten technisch ausgeschlossen.
- **Klar getrennt:** eigener Bereich „🧪 Tests" (nicht mit echten Mandanten gemischt) + dauerhafter
  Banner **„TEST-MODUS"**, solange aktiv.
- **GoBD sauber:** Test-Buchungen/Nummernkreise (auch §14) leben im Test-Tresor, mischen sich **nie** mit
  dem echten Journal.
- **Aufräum-Sicherheit (belt & suspenders):** verworfene Tests werden gelöscht **und** verwaiste Sandbox-DBs
  beim nächsten Start vorsorglich entfernt (falls die App mal abstürzt).

## Ehrliche Grenzen
- Test-Tresore sind **kein Backup** und nicht das echte Buch — nur ein sicherer Spielplatz (klar markiert).
- Sie brauchen Speicher → einfacher „löschen/aufräumen"-Weg ist Pflicht.

## Build-frei + Testbarkeit
- Nutzt die vorhandene Mehrmandanten-/DB-Schicht → **build-frei**.
- **Node-testbar:** Lebenszyklus-Logik (Sandbox anlegen/wechseln/verwerfen/auflisten, `sandbox`-Flag, Guards
  gegen Schreiben in echte DB, „alle aufräumen"). UI/IndexedDB „statisch geprüft" (kein Headless-Browser).

## Bezug zu vorhandenem
Ergänzt den **In-App-„Selbsttest"** (V10, `domain/selbsttest.js`, automatische Engine-Prüfung) und die
**Demo-Daten** (`domain/demodaten.js`) um **freies manuelles Ausprobieren**. Zusammen mit dem geplanten
**Backup→Restore-Roundtrip-Selbsttest** (`docs/DATENSICHERUNG.md`) ergibt das ein rundes Vertrauens-Paket.

## ⇄ Übertrag an Mein-WorkFloh (WICHTIG, Nutzer-Wunsch 2026-06-17)
**Auch das Repo `lausiklauskn-png/Mein-WorkFloh` soll einen Test-Modus nach DIESER Spezifikation erhalten**,
damit WorkFloh ebenso problemlos getestet werden kann. Hinweise für die WorkFloh-Umsetzung (eigenes Repo,
hier nur als Vermerk — nicht von BLP aus baubar):
- Gleiches Prinzip: **wegwerfbarer Sandbox-Speicher getrennt vom echten Datenbestand**, nicht eine Feld-Maske.
- WorkFloh speichert in `localStorage`/IndexedDB (Schlüssel `wf_auftraege`/`wf_kunden`/… , vgl. `dataBundle()`).
  Sandbox = eigener Namespace/Schlüssel-Präfix (z. B. `wf_sandbox_*`) ODER eine separate IndexedDB; beim
  Test-Modus liest/schreibt die App nur dort.
- **Behalten/Verwerfen + mehrere Tests + „alle aufräumen"** wie oben; deutlicher TEST-Banner; echte Daten
  unberührt.
- Optional Demo-Vorbefüllung (WorkFloh hat bereits eine Standard-Vorlage/Seed).
- Übertragungsweg dieser Info an WorkFloh: über den Nutzer (oder später den Sage-Briefkasten für
  **nicht-personenbezogene** Entwicklungs-Meta — niemals echte Kundendaten, vgl. `docs/SAGE_SYNC_BRIEFKASTEN.md`).
