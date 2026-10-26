# ELSTER / ERiC – Recherche (2026-10-26)

**Nur gelesen, nichts gebaut.** Wichtig vorab: elster.de und die ERiC-Handbücher waren aus der
Sitzungsumgebung **nicht direkt abrufbar** (Proxy/DNS). Belege daher nur über
**(S)** Suchmaschinen-Auszüge zu elster.de-Seiten und **(G)** Open-Source-Projekte, die ERiC wirklich nutzen
(`digitalservicebund/erica`, `quambene/eric-rs`, `firsttris/haben`). Vor jeder Entscheidung im
ELSTER-Entwicklerbereich bestätigen (Zugang erst nach Registrierung).

## Gesichert (soweit S/G reichen)
- **ERiC** = kostenlose, fertig übersetzte C-Bibliothek der Steuerverwaltung; prüft und sendet verschlüsselt.
  Keine Web-Schnittstelle. Lizenzvertrag mit dem Freistaat Bayern (Klick-Annahme).
- **Plattformen offiziell:** Windows x64, Linux x64 (+ IBM Power), macOS Intel und ARM, AIX.
  Linux ARM: alles außer Übermittlung. **Android/iOS: keine Ausgabe gefunden** (aber auch nicht ausdrücklich verneint).
- **Hersteller-ID nötig, auch schon zum Testen** (frühere Test-ID 74931 gesperrt). Ablauf: online als Entwickler
  registrieren → Prüfung durch Bayerisches Landesamt für Steuern → Zugang per Mail → ERiC laden → Hersteller-ID
  unter „Anträge und Formulare" beantragen. Testübermittlung mit Testmerker an Testfinanzämter.
- **Nutzer-Anmeldung:** ELSTER-Zertifikatsdatei (.pfx + PIN) funktioniert (seit ERiC 44 auch aus dem Speicher).
  ElsterSecure geht **nicht** mit Drittsoftware. Sicherheitsstick über PKCS#11 (am Handy kaum praktikabel).
- **Keine öffentliche REST-API** für die Einkommensteuer gefunden.
- Verfahren laut Erica-Code: `ElsterErklaerung`/`ESt` (Senden), `ElsterBRM` (Belegabruf freischalten,
  Code kommt per Post), `ElsterDatenabholung`/`ElsterVaStDaten` (vorausgefüllte Daten abholen).
- Behörden-App **MeinELSTER+** (Android 14+/iOS 18+) kann seit 1.7.2026 die vorausgefüllte ESt 2025 für einfache
  Fälle (ledig, kinderlos, Arbeitnehmer bzw. Rentner ohne weitere Einkünfte). Keine Schnittstelle für Dritte.

## Unklar
- Darf ERiC mit der App weitergegeben werden? (Quellen widersprechen sich – aktuelle `lizenz.pdf` prüfen.)
- Kosten der Hersteller-ID, Pflicht-Testfälle/Zertifizierung, Bearbeitungsdauer (Forum: Wochen bis Monate).
- Reicht der Personalausweis in Drittsoftware für die ESt-Übermittlung?
- Gilt die „komprimierte Erklärung" (senden ohne Anmeldung + Papierunterschrift) noch?
- Aktuelle ERiC-Version Okt. 2026 (gefunden: 44.2.4.0).
- Pflichten: Abholung aus dem Postfach binnen 24 h bestätigen, sonst Sperre der Hersteller-ID (laut haben).

## Folgen für BookLedgerPro
| Fassung | Direkt senden möglich? | Weg |
|---|---|---|
| **Windows (nativ)** | **ja** (gesicherter Weg) | ERiC lokal, eigene Hersteller-ID, .pfx des Nutzers. Daten bleiben auf dem Gerät. |
| **Android (nativ)** | **nicht auf dem Gerät** (keine ERiC-Ausgabe gefunden) | Nur über eigenen Übermittlungs-Server (Linux x64 mit ERiC), wie Taxfix. Dann gehen Steuerdaten im Klartext an den Server → bricht BLP-Regel „Klartext verlässt das Gerät nie ohne Bestätigung", DSGVO-Auftragsverarbeitung, Server-Betrieb. Bewusste Entscheidung nötig. |
| **PWA** | nein | Ausfüllhilfe: BLP rechnet und zeigt Zeile für Zeile, was in Mein ELSTER / MeinELSTER+ einzutragen ist. |

Empfehlung (vorläufig): Für alle Fassungen zuerst die **Ausfüllhilfe** bauen (funktioniert überall, keine ID nötig).
Direktes Senden zuerst in der **Windows-App**; Android-Server nur nach eigener Entscheidung von Klaus.
Parallel früh die **Entwickler-Registrierung** beantragen, weil sie lange dauern kann.

Quellen (Auswahl): elster.de/eportal/infoseite/entwickler · github.com/quambene/eric-rs · github.com/digitalservicebund/erica ·
github.com/firsttris/haben · finanzamt.nrw.de/app-mein-elster · forum.elster.de (Hersteller-ID, REST-API).
