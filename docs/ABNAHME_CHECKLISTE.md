# ABNAHME_CHECKLISTE.md — Manueller Klickpfad (Browser-E2E)

> Die Kernlogik ist node-getestet (618 Tests) und in der App über **Selbsttest** offline prüfbar.
> Diese Liste deckt die **DOM-/IndexedDB-Pfade** ab, die nicht headless getestet werden können
> (kein Headless-Browser in der Bau-Umgebung). Zum Durchklicken vor einem echten Einsatz.
> Start: `python3 -m http.server 8000` → http://localhost:8000 (kein `file://`!).

## 0. Selbstdiagnose (zuerst)
- [ ] Navigation **Selbsttest** öffnen → Zusammenfassung **„Alle Prüfungen bestanden ✓"** (alle Zeilen ✓).

## 1. Ersteinrichtung / Durabilität
- [ ] Onboarding: Passwort setzen → Shamir-Shares anzeigen/sichern → **erzwungenes erstes Backup** lädt herunter.
- [ ] Nach Reload: Sperrbildschirm → Entsperren mit Passwort. Falsches Passwort wird abgelehnt.
- [ ] Durabilitäts-Banner erscheint bei fehlendem/altem Backup; „Jetzt sichern" funktioniert.

## 2. Konten & Buchen
- [ ] **Konten**: Liste zeigt SKR03-Auswahl; neues Konto anlegen/bearbeiten; benutzte Konten nicht löschbar.
- [ ] **Journal**: Buchung erfassen (Soll/Haben/Betrag/USt) → als Entwurf gespeichert; Hinweise erscheinen, blockieren nicht.
- [ ] Umsatzart **§13b/Reverse-Charge** wählen → Betrag=netto, Vorsteuer+USt werden gebucht.
- [ ] **Bewirtung 70/30**-Knopf → Entwurf mit 70/30-Split + Vorsteuer.
- [ ] **Festschreiben** → Buchung unveränderlich; Storno erzeugt Gegenbuchung.
- [ ] **Buchungssperre** (Einstellungen) setzen → Festschreiben in gesperrter Periode wird verweigert.

## 3. Belege (KI, opt-in EU)
- [ ] **Belege**: Foto/PDF hochladen (verschlüsselt gespeichert).
- [ ] „Texterkennung (Google Vision EU)" nur nach Bestätigung; Fehler werden im Klartext erklärt.
- [ ] Buchungsvorschlag (Mistral EU oder On-Device) → als Entwurf übernehmen.

## 4. Kunden / Aufträge / Rechnung
- [ ] **Kunden** anlegen (B2B/Verbraucher-Flag); **Auftrag** mit Positionen; Rechnung → Buchungsentwurf.
- [ ] **Mahnwesen** (Auswertung): überfällige Forderung → druckbares Mahnschreiben.

## 5. Auswertung & Berichte
- [ ] **Auswertung**: USt-VA-Kennzahlen, EÜR (Soll + Ist), USt-Verprobung, GoBD-Audit „lückenlos".
- [ ] **USt-VA je Zeitraum**: Monat/Quartal/Jahr wählen → ELSTER-Datenpaket-Export.
- [ ] **Berichte**: SuSa, Kontenblatt (Konto wählen), Anlage-EÜR-Gruppierung; je CSV-Export.
- [ ] **Anlagen**: Anlage erfassen → AfA-Plan; „AfA buchen" erzeugt Entwurf; AVEÜR-CSV.
- [ ] **Kassenbuch**: Anfangsbestand setzen; laufender Bestand; Negativ-Warnung; CSV.

## 6. Export / Datenhoheit / Portabilität
- [ ] **DATEV-CSV (EXTF)** exportieren; Header trägt Berater/Mandant aus Einstellungen.
- [ ] **GoBD-Datenpaket (ZIP)** exportieren; enthält index.xml + buchungen.csv + konten.csv.
- [ ] **Demo-/Test-Export** (klein/groß): ZIP mit allen Formaten → gegen `docs/TESTDATEN.md` prüfen.
- [ ] **Backup herunterladen** → App zurücksetzen/anderer Browser → **Wiederherstellen** ergibt identische Daten.

## 7. PWA / Offline / DeX
- [ ] Seite offline neu laden (Service-Worker) → App startet weiter.
- [ ] Auf Android/Samsung DeX: keine Cursor-Effekte nötig; Bedienung funktioniert (Browser-Lehre 8).

## 8. Ohne DATEV nutzbar (Kleinunternehmer/privat)
- [ ] Kompletter Durchlauf Beleg→Buchung→Auswertung→EÜR/USt-VA **ohne** DATEV-Bezug möglich.
- [ ] Einstellung **Kleinunternehmer (§19)** aktiv → USt-Hinweise/Ausweis unterdrückt; Warnung bei USt-Konto.

> Abweichungen bitte mit Datum/Schritt notieren. Für Steuer-/DATEV-/ELSTER-Inhalte gilt:
> vor echter Einreichung mit Berater/amtlichem Formular abgleichen (siehe TESTDATEN.md, DATEV_IMPORT.md).
