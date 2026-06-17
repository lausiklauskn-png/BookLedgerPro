# Kalkulation & Angebotserstellung — Design-Katalog (Werbetechnik)

> **Status: DESIGN-ENTWURF (noch kein Code).** Diese Datei ist die verbindliche Bau-Grundlage
> für den späteren Bereich „Angebote & Kalkulation" in BLP. Sie wird **erst gebaut, nachdem die
> laufenden BLP-Schritte abgeschlossen sind** (App läuft). Entstanden im Gespräch mit dem Nutzer
> (Werbetechnik-Betrieb), 2026-06-17. Über Sitzungen hinweg pflegen.

## Prime Directive — intern vs. extern STRIKT trennen
- **Kalkulation = rein intern.** Verschnitt, interner Stundenkostensatz, Maschinensatz, Marge,
  Gemeinkosten, Korrekturfaktoren, Entstehungs-Notiz → **verlassen das Haus NIE**.
- **Angebotsdokument / Rechnung = neutral nach außen.** Nur Positionen + Preise + USt, wie ein
  Angebot/eine Rechnung aussehen soll. **Kein Kunde sieht je die Kalkulationssystematik/Marge.**
- Datenmodell speichert **beide** Schichten, **druckt/exportiert aber nur die externe**.
  (DSGVO/GoBD-sauber.)

## 1. Kalkulations-Katalog (Kostentreiber-Matrix)
„Zukauf/Handel" = eingekauft & weiterverkauft (EK + Handelsaufschlag). ✓ = Kostenart fließt ein.

| Leistung | Art | Basis | Material | Maschine | Arbeit | Zukauf/Handel | Montage/Anfahrt | Korrektur-Hotspot |
|---|---|---|---|---|---|---|---|---|
| Fahrzeug-Vollfolierung | Eigen | m² | ✓ +Verschnitt | – | ✓ Verklebung | – | ✓ | Verschnitt + Verklebezeit |
| Teil-/Logobeschriftung Kfz | Eigen | m²/Stk | ✓ | ✓ Plot | ✓ Entgittern | – | ✓ | Entgitter-Zeit |
| Folienplot / Schriftzüge / Aufkleber | Eigen | m²/lfm/Stk | ✓ +Applifolie | ✓ Plot | ✓ Entgittern | – | – | Klein-/Rüstanteil |
| Fenster-/Glasdekor (Milchglas) | Eigen | m² | ✓ | ✓ Plot | ✓ | – | ✓ | Montagezeit vor Ort |
| Digitaldruck Banner/Plane | Eigen | m² | ✓ +Saum/Ösen | ✓ Druck | ✓ Konfekt. | – | (✓) | Ösen/Saum-Aufwand |
| Roll-up / Display | Misch | Stk | – | ✓ Druck | ✓ | ✓ Hardware | – | Hardware-EK aktuell? |
| Schild (Dibond/Acryl) | Misch | Stk/m² | ✓ Platte | ✓ Fräse/Druck | ✓ | (✓) | ✓ | Zuschnitt/Fräszeit |
| Leuchtkasten / Leuchtreklame | Misch | Stk | ✓ Profil/Acryl | ✓ | ✓ Elektrik | ✓ LED/Netzteil | ✓ | Elektrik+Montage+Genehmigung/Statik |
| Pylon / Stele | Misch | Stk | ✓ | ✓ | ✓ | ✓ | ✓ Fundament | Tiefbau/Statik |
| Gravur (Laser/Fräse) | Eigen | Stk/min | ✓ | ✓ Maschinenzeit | ✓ Vorlage | – | – | Vorlagen-/Rüstzeit |
| Textildruck/Stick | Misch | Stk | ✓ Transfer | ✓ | ✓ | ✓ Textil | – | Mindestmengen/Rüsten |
| Werbeartikel | Handel | Stk | – | – | (✓) | ✓ reine Ware | – | Handelsspanne |
| Visitenkarten/Flyer/Drucksachen | Handel | Stk/Aufl. | – | – | ✓ Layout | ✓ Druckpartner | – | Layoutzeit vs. Pauschale |
| Grafik/Layout/Datenaufbereitung | Eigen | Std/pausch. | – | – | ✓ Designsatz | – | – | Korrekturschleifen |
| Montage/Service vor Ort | Eigen | Std | (✓ Klein) | – | ✓ | – | ✓ +km/Hubsteiger | Anfahrt unterschätzt |
| Demontage/Altfolie entfernen | Eigen | Std | – | – | ✓ | – | ✓ | fast immer zu niedrig geschätzt |
| Stundenlohn/Reparatur | Eigen | Std | (✓) | – | ✓ | – | (✓) | – |

## 2. Rechenformel (gilt für alle Zeilen, cent-genau)
```
Selbstkosten = Material(+Verschnitt%) + Maschinenzeit×Maschinensatz
             + Arbeitszeit×interner-Std-Kostensatz
             + Zukauf×(1+Handelsaufschlag%) + Montage/Anfahrt
Angebotspreis(netto) = Selbstkosten × (1+Gemeinkosten%) × (1+Gewinn%)
Brutto = Angebotspreis × (1+USt)
```
Rückwärts gelöst = „**wie viel Zeit/Kosten darf rein**" bei gegebenem Zielpreis/Marge.
Reine Logik → **build-frei, node-testbar**, GoBD-neutral (Angebot ist keine Buchung).

## 3. UX — adaptiver Positions-Baukasten (kein starres Formular)
- Karten/Buttons je Leistungsart; Tippen fügt eine Position hinzu (klappt ihr Schema auf).
- **Häufig/zuletzt genutzte Leistungsarten rutschen automatisch nach oben** (Nutzungszähler je
  Art, lokal persistiert) — passt sich dem Nutzer an. Build-frei.
- Darunter wächst die Positionsliste → das wird das Angebot; Drag-and-drop zum Umsortieren.

## 4. Nummernkreise & Angebot → Rechnung
- **Eigener Angebotskreis** (z. B. `AN-2026-0001`) — frei, nicht GoBD-relevant.
- **Strikter §14-Rechnungskreis** (z. B. `2026-0001`) — lückenlos (BLP hat ihn: `naechsteRechnungsnummer`).
- Angebot **„angenommen"** → Knopf **„Rechnung aus Angebot"** zieht Positionen in den bestehenden
  Rechnungs-/Buchungspfad, vergibt **neue** §14-Nummer, **referenziert** die Angebotsnummer (benutzt
  sie nicht wieder). Abgelehnte Angebote → **Archiv** (für Vergleich). **Zwei parallele Kreise, kein Konflikt.**

## 5. Alleinstellungsmerkmale („da steckt Logik dahinter")
1. **Selbstlernende Kalkulation:** Vor- vs. Nachkalkulation je fertigem Auftrag → Korrekturfaktoren
   aus der **eigenen Historie** (Demontage real 1,4×, Verschnitt +12 %). Kern-USP.
2. **Live-Deckungsbeitrag/Zeit-Budget** beim Erstellen (max. Std bei Zielpreis, DB €/Std).
3. **Szenarien:** dasselbe Angebot in 3 Margen + historische Trefferquote je Preisniveau.
4. **Material-Preispflege aus eigenen Lieferscheinen/Eingangsrechnungen** (koppelt an Belege/payables).
5. **Angebots-Archiv mit Soll/Ist + Lessons** („welche Angebote gingen nach hinten los").

**Ehrlich:** 1/4/5 sind nur so gut wie die eingepflegten Sätze + die Disziplin der Nachkalkulation.
Die Maschine erfindet nichts — sie rechnet und kalibriert mit den eigenen Zahlen.

## 6. Auftrags-Kostenträger (Material/Lieferschein je Auftrag)
Wiederverwendet vorhandene BLP-Bausteine: **Belege** (verschlüsselt, OCR Vision EU) für Lieferschein-/
Materialrechnungs-Kopien, **payables.js** (Eingangsrechnungen), **costcenters.js** (Kostenstellen/
Kostenträger), **belegRef** (Beleg↔Buchung). → Material + Zeit + Fremdleistung je Auftrag sammeln →
**Nachkalkulation** (Soll/Ist) → Kosten-Nutzen-Analyse.

## 7. Architektur-Entscheidung — BLP als Vorbereitungs-/Kontrollschicht für externe Software (z. B. DATEV)
Offen, mit dem Nutzer zu entscheiden, BEVOR gebaut wird:
- **Modell „BLP bereitet vor → DATEV/Steuerberater stellt aus":** BLP liefert die **geprüfte, feste
  Grundlage** (Angebot steht, Rechnung vorbereitet) → Übernahme in das Zielprogramm → „alte Wege".
  Sicherheitsgewinn: **keine Rechnung ohne Prüfung** (BLP-Entwurf → Review → Festschreiben/Übergabe).
- **Entscheidende Regel — Nummernkreis-Hoheit:** Genau **EIN** System vergibt die verbindliche
  §14-Nummer. Stellt DATEV aus → **DATEV besitzt den §14-Kreis**, BLPs Nummer bleibt interne
  Vorbereitungs-/Angebots-Referenz. Stellt BLP aus → BLP besitzt ihn, DATEV bekommt nur Buchungssätze.
  **Nie beide Kreise gleichzeitig** (GoBD-Lückenlosigkeit).
- **Vorhandene Übergabe-Wege in BLP:** DATEV-EXTF-Export (V8, „EXTF-orientiert", **nicht** zertifiziertes
  116-Spalten-Format), Steuerberater-Übergabe-Datenblatt, GDPdU-Paket, CSVs.
- **Ehrliche Grenze:** „Buchungssätze nach DATEV (EXTF)" + „neutrales Rechnungs-Dokument/Datenpaket"
  sind verlässlich; ein **vollautomatischer DATEV-Rechnungs-*Dokument*-Import** ist nicht garantiert
  (hängt an DATEVs Importfähigkeit/Rechnungsdatenservice) → **am Zielprogramm real testen**, keine
  Konformität behaupten, die nicht belegt ist.

## 8. BLP auf mehreren Rechnern (Mehrrechner/Sync)
BLP ist **offline-first, verschlüsselt, IndexedDB pro Gerät** — **kein** Client-Server-Mehrbenutzer-DB.
- Mehrere PCs = getrennte Tresore, außer man synchronisiert (Datei/Backup, privater synchronisierter
  Ordner, oder der später geplante **eigene Server**). DB-Suffix `bookledgerpro` bleibt; Mehrmandanten
  existiert bereits.
- **Eleganter im „BLP bereitet vor"-Modell:** nur **EINE** BLP-Instanz (Büro/Produktion) als Vorbereitungs-
  Hub; der Buchhaltungs-Rechner fährt DATEV und bekommt nur BLPs **Dateien** (Dead-Drop/Ablageordner,
  wie bei WorkFloh). Damit entfällt das Mehrrechner-BLP-Problem ganz.

## 9. Bau-Reihenfolge (je eigener PR, NACH den laufenden BLP-Schritten)
1. **Kalkulations-Kern** (rein, node-getestet): Kostenarten + Zuschlags-/Maschinenstundensatz-/m²-Formel,
   vorwärts (Preis) **und** rückwärts (erlaubte Zeit/Kosten).
2. **Produkt-Schemata** (Folierung/Schild/Gravur/Leuchtreklame …) als kalibrierbare Vorlagen.
3. **Angebot in BLP** nutzt den Kern (Vorkalkulation → neutrales Angebotsdokument, Archiv, Angebotskreis).
4. **Auftrags-Kostenträger** + **Nachkalkulation** (Soll/Ist) über payables/costcenters/Belege.
5. **Kalibrierung** (Korrekturfaktoren aus Historie) + Statistik/Vergleich; optional KI (Mistral EU, opt-in, pseudonym).
6. **Adaptiver Baukasten-UX** + Drag-and-drop + Nutzungs-Sortierung.

## 10. Bezug zu WorkFloh
WorkFloh = Feld/Doku/Zeit + Lieferschein-Fotos (Dead-Drop in Ordner existiert). BLP = Angebot/Kalkulation/
Rechnung. Brücke build-frei: lokale Datei/Copy-Paste (Split-Screen), DSGVO-trivial. Kundenwunsch (E-Mail/
Arbeitsmappe) bleibt in WorkFloh; die strukturierten kaufmännischen Daten entstehen in BLP.
