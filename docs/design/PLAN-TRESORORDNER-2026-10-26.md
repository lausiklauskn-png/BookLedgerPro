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


## Weg 2 — Relais (Klaus 2026-10-26: „BookLedgerPro über mein privates Relais laufen lassen, so wie Kim“)

Klaus' privates Relais läuft: **`relay-privat.family-projekt.de`** (🟢; nostr-rs-relay mit Zulassungsliste, davor der
Zulassungsdienst aus Kim-sync `server/zulassung`). Nachgelesen in Kim-sync (Stand `1a7f111`), nicht angenommen:

| Kim-sync macht | so |
|---|---|
| Transport | offenes Nostr-Protokoll über `wss://`-Relais; signierte Zettel (kind 1, Tags `m`/`x`/`k`/`p`), Signatur mit `modules/echtheit.js` + `noble-secp256k1.js` (byte-1:1 aus Kimboard), jedes Gerät hat einen Geräteschlüssel |
| Verschlüsselung | **auf dem Gerät**, AES-GCM; Raumschlüssel `rs` (32 Zufallsbytes) je Raum, Briefe an EIN Gerät per ECDH secp256k1 (`umzugSchluessel`, AAD je Zweck); das Relais sieht nur Geheimtext und eine Raum-Marke |
| Dateien | in Teilen zu 90 000 Zeichen (60 000 auf öffentlichen Relais), bis 200 MB; Quittungen; Löschen vom Relais, wenn alle abgeholt haben |
| Zugang zum privaten Relais | Zulassungsliste der Geräteschlüssel; Einladungs-Token im Link, das neue Gerät meldet sich mit einem signierten Zettel `beitreten`; Kim-sync hat dafür ein Feld „Schlüssel aus einer anderen App“ |
| Was es NICHT ist | kein Speicher, kein Hintergrunddienst in der PWA: abgeholt wird, wenn die App offen ist |

**Für BookLedgerPro (und Private Brain Pro, Workflow PDF Pro) heißt das:**

- **Dieselben Verträge, anderer Transport.** Eine Übergabe (Rechnungsmail `.eml`, Angebot v1/v2, Arbeitsstand `*.workfloh.json`,
  unterschriebenes PDF) wird ein Zettel `typ: 'uebergabe'` mit `an: <App>` und `vertrag: <Name>`; große Nutzlasten in Teilen wie
  bei Kim. Der Empfänger legt sie in sein Fach, als käme sie aus dem Tresorordner (gleicher Einleseweg: `dateienEinlesen`,
  `uebernahmeAusAdresse`, Arbeitsstand-Import).
- **Ein „Verbund-Raum“ für die eigenen Apps**, wie ein Kim-Raum: ein Raum-Code, ein Raumschlüssel, alle Apps auf allen Geräten
  von Klaus sind Mitglieder (oder je Person ein Raum: Klaus, Jens). Alternative wäre Paarung je Gerätepaar über die
  Geräteschlüssel (genauer, aber mehr Tipparbeit) — **Entscheidung von Klaus.**
- **Krypto byte-1:1 aus Kim-sync** (`modules/krypto.js` aus Datei-Post, `echtheit.js`, `noble-secp256k1.js`), SHA-gepinnt; der
  Geräteschlüssel: Kim-sync nimmt **nicht** den Schlüssel seines SBKIM-Knotens, sondern einen eigenen secp256k1-Schlüssel
  (`localStorage` `kimsync_schluessel`, nachgelesen in `index.html`). BookLedgerPro täte es gleich (eigener Relais-Schlüssel,
  **verschlüsselt im Tresor**, nicht im localStorage) — das Siegel bleibt das Siegel, der Relais-Schlüssel ist der Zugang zur
  Zulassungsliste.
- **Zulassung:** jede App meldet sich mit dem signierten Zettel `beitreten` + Einladungs-Token an, wie ein neues Kim-Gerät; bis
  dahin trägt Klaus die Schlüssel von Hand ein (Kim-sync: „Schlüssel aus einer anderen App“).
- **Das geht auch in der PWA.** Der Relais-Weg braucht keinen Ordnerzugriff (Kim-sync ist eine PWA). Damit könnte die
  Übergabe zwischen Geräten **vor** der nativen Fassung laufen — ob Basic ihn bekommt oder nur Pro, ist **Klaus' Entscheidung**
  (bisher: Basic = Teilen/Links, Pro = Tresorordner).

**Reihenfolge-Vorschlag:** Tresorordner bleibt Weg 1 (gleiches Gerät, Speicher, Sicherung). Weg 2 kommt als eigene Sitzung:
zuerst in BookLedgerPro Empfang + Senden eines Zettels `uebergabe` an einen Raum (Probe mit gestelltem Relais wie in Kim-sync),
dann Private Brain Pro (Rechnungsmail hinaus) und Workflow PDF Pro (Arbeitsstand hinein, PDF zurück). Nichts geht ohne Klaus'
Wort an das echte Relais; die Proben stellen es.

**Offene Fragen an Klaus:** (1) ein Verbund-Raum für alle eigenen Apps oder Paarung je Gerät? (2) Relais-Weg nur in Pro oder
auch in Basic? (3) Reihenfolge: Weg 2 vor oder nach der Android-Tresorordner-Sitzung?
