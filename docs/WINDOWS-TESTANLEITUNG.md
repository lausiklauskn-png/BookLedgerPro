# BookLedgerPro für Windows — kurze Anleitung zum Testen

Für einen Tester an seinem eigenen Windows-PC mit eigenen Daten (Klaus 2026-10-29). Zum Weitergeben, so wie sie ist.

## Vorher

- Windows 10 oder 11, 64 Bit. Kein Konto, kein Internet nötig außer für den Download.
- **Nur mit Kopien testen.** Belege, Rechnungen, Kontoauszüge: eine Kopie in einen neuen Ordner legen und nur diese verwenden.
  Die App ändert keine Originale, aber zum Testen gilt: nichts Einmaliges hineingeben.
- Ein **neues Passwort** ausdenken und aufschreiben. Ohne Passwort kommt niemand an die Daten — auch kein Entwickler.

## Installieren

1. Setup laden: `https://family-projekt.de/updates/bookledgerpro/BookLedgerPro-Windows-0.1.5-x64-setup.exe`
   (der Link gilt, sobald Klaus die Windows-Fassung freigibt).
2. Doppelklick. Windows zeigt **„Der Computer wurde durch Windows geschützt“** (SmartScreen), weil das Setup nicht mit einem gekauften
   Zertifikat unterschrieben ist. → **„Weitere Informationen“** → **„Trotzdem ausführen“**.
3. Installiert wird nur für den angemeldeten Benutzer, ohne Administrator. Fehlt WebView2, lädt das Setup es selbst nach.

## Erster Start

1. Passwort festlegen (zweimal, mindestens 8 Zeichen) → „Tresor erstellen“. Danach fragt die App: Kleinunternehmer ja/nein, wer
   Rechnungen ausstellt, zeigt die **Schlüssel-Sicherung** (Teile getrennt aufbewahren) und verlangt ein **erstes Backup** (Speichern-Fenster
   von Windows). Dann öffnet sich die Übersicht.
   - Wer nur schauen will: auf der Anmeldeseite **„Test-Modus“** → „Neuer Test“. Das ist ein eigener Tresor mit eigenem Passwort,
     getrennt von allem anderen, und lässt sich am Ende spurlos verwerfen.
2. **Einstellungen → „Tresor & Ablage“**: einen **neuen, leeren Ordner** als Tresorordner wählen (z. B. `Dokumente\BLP-Test`) und anlegen.
   Das Passwort dafür fragt ein eigenes kleines Fenster ab. Keinen Ordner wählen, den schon eine andere App benutzt.
3. Belege: Datei ins Fenster ziehen, über „Mehrere Belege hochladen“ oder im Explorer Rechtsklick → „Öffnen mit → BookLedgerPro“.

## Was bitte ausprobieren

| Was | Worauf achten |
|---|---|
| Belege hineinziehen, öffnen, suchen | kommt alles an, stimmt die Vorschau |
| Buchung, Kunde, Rechnung anlegen | lässt sich speichern und wiederfinden |
| Schrift „A··A“ oben | Schrift größer, Knöpfe bleiben gleich hoch |
| ⓘ neben dem Titel eines Kastens | ein Tipp zeigt alle Erklärungen des Kastens, ein zweiter blendet sie aus |
| Version oben unter „BookLedgerPro“ (`v0.1.5`) | Tipp prüft auf Updates: „aktuelle Version“ |
| Mikrofon und „DE ▾“ rechts im Suchfeld (auch SBKIM-Suche) | Windows-Spracherkennung, ohne Internet; „DE ▾“ wählt die Sprache |
| Scannen (falls ein Scanner da ist) | Belege → Scannen → „Scanner oder Kamera …“ |
| Schließen und wieder öffnen | Passwort, dann ist alles noch da |

## Was melden

Kurz aufschreiben: **was getan, was erwartet, was passiert** — am besten mit Bildschirmfoto (Windows-Taste + Umschalt + S).
Keine echten Belege, Passwörter oder Kontonummern mitschicken.

## Entfernen

Windows-Einstellungen → Apps → „BookLedgerPro“ → Deinstallieren. Der Tresorordner und die App-Daten
(`%LOCALAPPDATA%\de.familyprojekt.bookledgerpro\`) bleiben stehen; wer alles weghaben will, löscht beide Ordner von Hand.
