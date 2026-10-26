# 📧 Mail an BookLedgerPro teilen (Klaus 2026-10-26)

Klaus: „Mail an Bookledger Pro teilen, aber nur für die Ablage. Wenn ein Anhang eine Rechnung ist, muss die Rechnung
differenziert ausgelesen und im Bookledger Pro eingepflegt werden können in der Buchhaltung."

## Bedienung

1. In Private Brain Pro (oder einem Mailprogramm, das die Mail als Datei teilt) die Mail **als `.eml`** teilen → **BookLedgerPro** wählen.
   Am Rechner: die `.eml` über „Mehrere Belege hochladen" wählen oder auf die Belegseite ziehen.
2. BookLedgerPro öffnet sich (nach dem Entsperren) auf **Belege** und legt ab:
   - **die Mail selbst** als Beleg `Mail JJJJ-MM-TT – Betreff.eml` (verschlüsselt, Original bleibt byte-gleich). Ihr Text
     (Betreff, Absender, Datum, Textkörper; aus HTML wird lesbarer Text) steht **verschlüsselt am Beleg** und ist über
     „Belege durchsuchen" findbar (Wort und Bedeutung). Die Zeile zeigt „📧 Mail von … · N Anhänge".
   - **jeden PDF- und Bild-Anhang als eigenen Beleg** mit dem Namen aus der Mail und der Zeile „📎 aus Mail „Betreff" von …".
     Ein PDF-Anhang mit Textebene wird **sofort gelesen**: der Text steht verschlüsselt am Beleg, die Suche findet ihn.
3. **Rechnung differenziert:** aus dem Text werden die **Positionen** gelesen (Bezeichnung · Menge · Einzelpreis · Betrag ·
   USt-Satz/Kennzeichen; Netto-, USt- und Gesamtzeile erkannt). Am Beleg steht „N Positionen · Summe stimmt" (oder „weicht ab"),
   ein Tipp klappt die Tabelle auf. Die Positionen liegen verschlüsselt am Beleg (`positionenDaten`), offen nur Anzahl und Stand.
4. **In die Buchhaltung:** am Anhang „Text aus dem PDF übernehmen" → der gewohnte Buchungsvorschlag (Betrag, Datum, Lieferant,
   Konto-Heuristik) → „Als Buchung übernehmen". Nichts wird von selbst gebucht; GoBD-Festschreibung bleibt beim Buchen.

Die Statuszeile sagt „1 Mail(s) abgelegt (Text durchsuchbar), 1 Anhang/Anhänge als eigene Belege." Übergangene Anhänge
(fremde Dateiarten, eingebettete Bilder aus HTML-Signaturen, Mails in Mails) werden mit Namen genannt, nie still weggelassen.

## Was wo steht

| Datei | Aufgabe |
|---|---|
| `src/domain/mailEml.js` | reiner RFC-822/MIME-Leser (Kopfzeilen mit =?utf-8?…?=, quoted-printable, base64, RFC-2231-Namen, multipart beliebig tief, HTML → Text); `parseEml`, `mailAlsText`, `mailBelegName`, `absenderName` |
| `src/domain/belegPositionen.js` | reine Positionsrechnung (S1 des Steuer-Plans): `belegPositionen(text)` → `{positionen, summeCent, erkannteSummeCent, nettoCent, stimmt}` |
| `src/domain/documents.js` | `rec.mail = {von, betreff, datum, anhaenge, mailId}`; `setBelegPositionen`/`getBelegPositionen` (verschlüsselt) |
| `src/ui/views/documents.js` | `mailEinlesen` (Mail-Beleg + Anhänge + Textebene + Positionen), `mailZeile`, `positionenZeile` |
| `manifest.webmanifest` | `share_target` und `file_handlers` nehmen `message/rfc822` / `.eml` an |
| `sw.js` | v267, neue Dateien im Vorrat |

## Grenzen (benannt)

- Der Weg vom Mailprogramm hängt am Teilen als **Datei**: Private Brain Pro teilt das Original als `.eml` (dort gebaut, eigener
  PR); Gmail/Outlook am Handy teilen Mails oft nur als Text oder Link — dann kommt nichts an, und BookLedgerPro sagt das.
- Positionen kommen aus der **Textebene**; ein gescanntes PDF ohne Text braucht erst „Text aus dem PDF übernehmen" (OCR), danach
  stehen die Positionen noch nicht am Beleg (Folgeschritt S1b).
- Die Heuristik liest Zeilen „Bezeichnung … Betrag"; Tabellen mit Betrag in der Mitte, mehrzeilige Bezeichnungen und
  Fremdwährungen werden nicht oder falsch gelesen — „Summe weicht ab" sagt das. Ein Positions-Ein-/Ausschluss (S2) ist nicht gebaut.
- Mail-Belege haben keinen Prüfstand und keine Texterkennung (die Mail ist Ablage, keine Rechnung).
- ⚠ Am Tablet nicht gemessen; keine echte Mail aus Klaus' Alltag; `.eml` bis 50 Anhänge (`MAIL_MAX_ANHAENGE`), der Rest wird genannt.

## Proben

- `tests/run.mjs`: Abschnitte „Mail an BookLedgerPro teilen (.eml)" und „Positionen aus dem Belegtext" (+26).
- `tests/smoke_mail.mjs` (echter Browser, echter Tresor, erfundene Mail mit PDF-Rechnung aus pdf-lib + fremder Datei im Vorrat
  `blpr-geteilt`): **15 grün**. Gegenprobe in einer Wegwerf-Kopie (2026-10-26): „Anhänge ohne Verweis" 2 ROT · „übergangene
  Anhänge nicht genannt" 1 · „Textebene nicht gemerkt" 5 · „Menge × Einzelpreis nicht gelesen" 1 · „Netto zählt nicht" 2 ·
  „Mailtext nicht am Beleg" 1. Zwei erste Fälle waren **blind** (die Sabotage traf einen Zweig, den die Probe-Mail nicht
  nimmt: `MENGE_VORN` statt `MENGE_MAL`, `belegTyp` statt der Übergangen-Liste) — ersetzt, beide danach gefangen.
