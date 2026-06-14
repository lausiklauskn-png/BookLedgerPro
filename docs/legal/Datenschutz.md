# Datenschutz (DSGVO)

BookLedgerPro ist eine **offline-first**-Anwendung, die vollständig im Browser auf Ihrem
Gerät läuft. Es gibt **keinen Server**, kein Tracking, keine Cookies, keine Analyse.

## Verantwortlichkeit
Verantwortlich für die Verarbeitung sind **Sie** als Nutzer/in. Der Anbieter der Software
erhält keine Daten.

## Verarbeitete Daten & Speicherung
- Buchhaltungsdaten, Belege, Kunden, Mitarbeiter, Zeiten werden **ausschließlich lokal**
  (IndexedDB) gespeichert.
- Verschlüsselung: **AES-GCM-256**, Schlüssel abgeleitet aus Ihrem Passwort
  (**PBKDF2-SHA256**, 600.000 Runden). Personenbezogene Daten (Kunden/Mitarbeiter/Zeiten)
  werden zusätzlich als verschlüsselte Records abgelegt.
- Der Schlüssel verlässt das Gerät nie; eine optionale Shamir-Sicherung schützt vor
  Speicherverlust.

## Externe KI (optional, opt-in)
- Standardmäßig **deaktiviert**. Nur mit eigenem Anthropic-API-Schlüssel (BYOK) nutzbar.
- Eine Übertragung an Anthropic erfolgt **ausschließlich nach ausdrücklicher Bestätigung**.
- **Datenminimierung**: Der Steuer-Assistent sendet nur **aggregierte Kennzahlen** (keine
  Einzelbelege, keine Personendaten). Die Belegerkennung sendet das jeweils ausgewählte
  Beleg-Bild — nur auf Ihre Bestätigung hin.
- Der API-Schlüssel wird verschlüsselt lokal gespeichert.

## Betroffenenrechte
- **Auskunft / Datenübertragbarkeit**: vollständiger, verschlüsselter Export aller Daten
  (Ansicht „Recht & Doku" → „Alle Daten exportieren" bzw. Einstellungen → Backup).
- **Löschung**: „Alle Daten auf diesem Gerät löschen" entfernt sämtliche lokalen Daten
  unwiderruflich.
- Da keine Server-Verarbeitung stattfindet, gibt es keine weiteren Empfänger.

## Hinweis
Dies ist eine technische Datenschutz-Dokumentation der App, **keine** Rechtsberatung. Für
eine vollständige Datenschutzerklärung Ihres Unternehmens (z. B. gegenüber Kunden) ist ggf.
zusätzlicher Text nötig.
