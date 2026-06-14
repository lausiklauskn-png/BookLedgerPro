# Verfahrensdokumentation (GoBD)

Diese Dokumentation beschreibt, wie BookLedgerPro die **GoBD** (Grundsätze zur
ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in
elektronischer Form) technisch umsetzt. Sie ist Teil der App (Ansicht „Recht & Doku").

## 1. Unveränderbarkeit
- Eine Buchung durchläuft die Zustände **Entwurf → festgeschrieben**. Festgeschriebene
  Buchungen sind **unveränderlich**: Bearbeiten/Löschen ist gesperrt.
- Korrekturen erfolgen ausschließlich durch **Storno** (automatische Gegenbuchung mit
  vertauschten Soll-/Haben-Seiten). Das Original bleibt erhalten und wird als „storniert"
  markiert.

## 2. Nachvollziehbarkeit & Manipulationsschutz
- Jede festgeschriebene Buchung erhält eine **lückenlose, fortlaufende Nummer** (seq).
- Buchungen sind über eine **Hash-Kette (SHA-256)** verkettet: `hash = SHA256(kanonische
  Buchungsinhalte + prevHash)`. Die kanonische Form sortiert Objekt-Schlüssel rekursiv
  (Arrays bleiben in Reihenfolge).
- Die Prüfung (Ansicht „Auswertung → GoBD-Audit") erkennt **nachträgliche Änderungen**
  (Hash stimmt nicht mehr) und **Lücken/Sprünge** im Nummernkreis.
- Status-/Storno-Markierungen fließen bewusst **nicht** in den Hash ein, damit das Storno
  eines Originals dessen unveränderlichen Buchungsinhalt nicht berührt.

## 3. Vollständigkeit & Richtigkeit
- Buchungen folgen der **doppelten Buchführung**: Summe Soll = Summe Haben (erzwungen).
- Beträge werden **cent-genau** (Ganzzahl) geführt; USt wird brutto→netto+Steuer
  aufgeteilt.

## 4. Belegprinzip
- Belege (Bild/PDF) werden **verschlüsselt** archiviert und können mit Buchungen
  verknüpft werden.

## 5. Aufbewahrung & Datensicherheit
- Daten liegen **lokal** (IndexedDB), verschlüsselt mit AES-GCM-256 (Schlüssel aus
  Passwort via PBKDF2).
- Für die gesetzliche **Aufbewahrungsfrist** (i.d.R. 10 Jahre) sind **regelmäßige
  verschlüsselte Backups** zwingend. Browser-Speicher ist vergänglich (siehe
  `docs/SAGE_BROWSER_LEHREN.md`); die App fordert ein erstes Backup im Onboarding und
  überwacht den Durabilitätsstatus.

## 6. Maschinelle Auswertbarkeit
- Export als **Buchungsjournal-CSV** und **DATEV-orientierte CSV** (dokumentierte Spalten,
  kein zertifiziertes EXTF).
- **USt-Voranmeldung**: Aufbereitung der amtlichen Kennzahlen (Kz 81/86/66/83). Es erfolgt
  **keine** ELSTER-Einreichung — nur ein prüfbares Datenpaket.

## 7. Grenzen (ehrlich)
- DATEV-Export ist **DATEV-orientiert**, nicht zertifiziert (kein Steuerschlüssel-Mapping/
  EXTF-Header). Vor Übergabe an den Steuerberater prüfen.
- Keine elektronische ELSTER-Übermittlung (erfordert zertifizierte ERiC-Schnittstelle).
- Stand der Umsetzung: siehe `ROADMAP.md`.
