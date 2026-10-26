# Plan: ein Tresorordner für alle Pro-Apps (Klaus 2026-10-26)

Klaus' Entscheidung im Gespräch (2026-10-26, abends), wörtlich zusammengefasst:

- „Können wir das nicht als einen Tresorordner machen, auf den beide zugreifen? … dieselbe Verschlüsselung."
- „Workflow-PDF kann denselben Ordner benutzen … genauso wie Needs und so weiter … niemand hat Zugriff auf diesen Ordner, außer die Führung."
- Alle nativen Android-Apps, alle Windows-Apps gekoppelt; je Plattform eine Bausitzung.
- **Repos:** „Wenn wir mit diesem BookLedgerPro hier fertig sind, kopieren wir das einmal komplett rüber in BookLedger-Basic, und dann
  wandeln wir das hier um als die Pro-Version Nativ-App inklusive Windows-Version." Der Name der nativen App ist **BookLedgerPro**
  (nicht „Pro Pro"); die PWA heißt **BookLedger Basic** (Repo `BookLedger-Basic`, DB-Endung `bookledgerbasic`). Dieses Repo wird
  **nicht umbenannt** (Pages-Adresse, Hub-Kachel, WorkFloh-Brücke, DB-Endung `bookledgerpro` hängen daran).

## Was der Tresorordner ist

Der Speicherort von Private Brain Pro (Tablet oder SD-Karte, Android-Ordnerauswahl; Windows: Ordnerpfad) wird der gemeinsame
Tresorordner. **Ein Passwort, ein Schloss (PBV1: PBKDF2-SHA256 600k → AES-256-GCM), mehrere Apps.** Der Schlosscode wird aus
Private Brain Pro **byte-gleich kopiert** (Android: `VaultCrypto`/`Vault`/`ProVaultPlugin`; Windows: der dortige Tresor mit DPAPI)
und per SHA gepinnt. Nie zwei Fassungen desselben Schlosses.

## Fächer

| Fach | schreibt | liest |
|---|---|---|
| `PrivateBrain/` (heute: Anhänge, Originale, Katalogsicherung, Schutzlisten) | Private Brain Pro | alle |
| `BookLedgerPro/` (Belege, Buchungen-Sicherung, Angebote aus Needs/Calculate) | BookLedgerPro | alle |
| `WorkflowPDF/` (Bibliothek, Sicherung) | Workflow PDF Pro | alle |
| `Eingang-BookLedgerPro/` (Rechnungsmails als `.eml`, verschlüsselt, plus Liste „neu") | Private Brain Pro | BookLedgerPro |
| `Eingang-WorkflowPDF/` (Angebots-/Auftrags-PDFs zum Ausfüllen) | BookLedgerPro, WorkFlohs später | Workflow PDF Pro |

Regeln: jede App schreibt nur in ihr Fach und in Übergabefächer an andere; der Leser setzt eine Marke „übernommen" (eigene
Datei), löscht nie fremde Dateien. Needs und Calculate bekommen keinen eigenen Zugang: BookLedgerPro legt ihre Daten in sein Fach
(Klaus' D16a: BLP übernimmt den Datenbestand der Apps).

## Passwort und Ersatzschlüssel

- Ein Passwort für den Kreis der Berechtigten („die Führung"). Wer es kennt, sieht alles im Ordner; scheidet jemand aus, bekommen
  alle Apps ein neues Passwort (Passwortwechsel = alle Dateien neu verschlüsseln; heute in Private Brain Pro noch offen).
- Das Speicherort-Passwort hat heute **keinen Ersatzschlüssel** (der Fünf-Teile-Schlüssel gilt nur fürs Herausgeber-Studio).
  Trägt der Ordner alles, braucht er einen: **fünf Teile, drei holen es zurück**, nach dem Muster `native/native-recovery.js`.
- Die SD-Karte darf jeder kopieren; ohne Passwort sind es nur verschlüsselte Dateien.

## Was PWAs können

PWAs können nicht in den Tresorordner: Android-Browser lesen keinen Ordner dauerhaft, Desktop-Browser nur mit Nachfrage je Start.
BookLedger Basic, Workflow PDF (Web) und Private Brain (V3) bleiben bei Teilen und Links (`?uebernahme=`, `?vorgang=`,
`share_target`). Das ist die Trennlinie Basic/Pro.

## Reihenfolge

1. **Hier fertig werden** (offen: D22 „Positionen anhängen" + Needs-Übergabe, Workflow PDF im Rundlauf „beides", R3).
2. **Kopie nach BookLedger-Basic**: gemeinsamer App-Kern byte-gleich mit Pins und Nachzieh-Werkzeug (wie `upstream/` bei
   Workflow PDF / `tools/apps-nachziehen.mjs`), Name „BookLedger Basic", DB-Endung `bookledgerbasic`, ohne native Teile.
   Vorher ansehen, was im Repo liegt; nichts ungesehen ersetzen.
3. **Sitzung Android**: Private Brain Pro Schreibseite (Marke „Rechnung für BookLedgerPro" je Mail/Absender, verschlüsselte
   Ablage im Eingangsfach, Liste „neu", Probe mit gestelltem Ordner) → BookLedgerPro nativ (`android/`, Capacitor, Tresor
   byte-gleich, Ordnerwahl, Einlesen aus dem Eingangsfach mit Marke „übernommen", eigene Signatur/CI) → Workflow PDF Pro
   (Tresor, Fach, Eingangsfach) → Ersatzschlüssel fürs Ordner-Passwort.
4. **Sitzung Windows**: dieselben drei Apps mit dem Windows-Schloss; BookLedgerPro und Workflow PDF Pro bekommen dort ihre
   Windows-Fassung.
5. Danach: gemeinsame Sicherung aller Apps im Ordner.

Offene Entscheidungen für Schritt 3 (vor dem Bau an Klaus): Paketname und Signatur von BookLedgerPro nativ, Veröffentlichungsweg
(Release-APK wie Private Brain Pro), ob der Ordner-Ersatzschlüssel zuerst in Private Brain Pro gebaut wird (dort liegt das Muster).
