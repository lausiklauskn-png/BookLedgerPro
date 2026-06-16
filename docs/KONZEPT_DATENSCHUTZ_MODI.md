# KONZEPT — Datenschutz-Privatsphäre, Briefkasten/Pseudonymisierung & Modi/Profile

> **Master-Bauplan** für den Privatsphäre-Strang (P1–P13) und den Privat-/Bürger-Modus.
> Entstanden im Brainstorming 2026-06-16. Dieses Dokument ist die **verbindliche Quelle**
> für die Bau-Sitzungen dieses Strangs. Verweise: `CLAUDE.md` (Regeln), `docs/PULS.md`
> (Andockpunkt), `docs/AI.md` (KI-Konzept), `docs/TRANSPARENZ_ZWISCHENSTAND.html` (Außen-Doku).

## 0. Grundsatz (entschieden)

**EU-vorrangig, rechtskonform, einfach. Keine Verkreuzung.**
- **Aktiver Bedien-Pfad = ausschließlich EU:** Google Cloud **Vision (EU)** für OCR,
  **Mistral (EU)** für Kontierung/Steuer, On-Device-Heuristik als Fallback.
- **Claude / Nicht-EU ist NICHT gelöscht, sondern ruhend** — architektonisch optional,
  aber nicht im aktiven UI-/Konfig-Pfad. Grund: Datenresidenz/DSGVO + Bedien-Einfachheit.
- Doku-Altlast: `ROADMAP.md`/`ARCHITECTURE.md` beschreiben noch den früheren Claude-Stand;
  beide tragen einen Klarstellungs-Hinweis auf dieses Dokument.

## 1. Das zentrale Primitiv: Briefkasten / Token-Tresor (P7)

**Deterministische Pseudonymisierung mit lokaler Re-Identifikations-Tabelle.** Jede
personenbezogene Angabe bekommt einen **stabilen Token**; nur entpersonalisierter Text
verlässt das Gerät; die Rück-Zuordnung passiert lokal.

**Ablauf (P5 nutzt P7):**
1. **Erkennen** — personenbezogene Teile im Text (Name, Telefon, E-Mail, Firma, Steuer-/
   Kunden-Nr., IBAN).
2. **Tokenisieren** — `Max Mustermann → [KUNDE_007]`, `0171… → [TEL_3]`.
3. **Nur Neutrales sendet** — zur KI geht ausschließlich Token-Text; sie kennt keine Klarnamen.
4. **Re-Identifikation** — KI-Ergebnis enthält Token → App ersetzt **lokal** zurück.
5. **Tresor bleibt lokal** — Zuordnungstabelle verschlüsselt, verlässt das Gerät nie.

**Stabilität:** Ein Kunde = **ein dauerhafter Token** über alle Belege. Anker ist ein
**exakter Identifikator** (E-Mail → Telefon → Kunden-Nr. → IBAN), **nicht** der OCR-/
Handschrift-Name (zu fehleranfällig). Name nur sekundär.

### Dreistufige Struktur (entschieden)

| Ebene | Was | Rolle in der Buchhaltung |
|---|---|---|
| **Mandant** | getrennter Buchungskreis (Berater-Modus: je Klient) | vollständig isoliert |
| **Firma** | juristische Person (Kunde/Lieferant) | **Buchungs-Partner** (Debitor/Kreditor) |
| **Person** | Ansprechpartner/Besteller einer Firma | nur **Vermerk** „wer bestellte", nie ein Konto |

**Regeln (entschieden):**
- **Gebucht wird immer gegen die Firma**; die Person ist Metadaten an der Buchung.
- **Person = mehrere Kanäle** (persönliche + geteilte Firmen-E-Mail) → löst das
  Mitarbeiter-Szenario *ohne* n:m.
- **Person↔Firma: 1:n Default**, aber **Verknüpfungstabelle** macht n:m später möglich —
  **kein** struktureller Modus-Schalter (vermeidet Verwirrung).
- **Merge-Regel beim Import:** geteilte Firmen-E-Mail ≠ Personen-Merge. Neuer Name unter
  bekannter Firma → **neue Person** unter derselben Firma (Persona-Isolation, Vorbild Sage
  Multi-Identität Brief 04). Nur Firma **und** Person exakt gleich → zusammenführen; sonst
  Nutzer-Rückfrage (Variante C).

**Ehrliche Grenzen:** Erkennung nie 100 % (→ Vorschau-/Bestätigungsschritt); pseudonym ≠
anonym (bleibt rechtlich personenbezogen, aber risikoarm); der **OCR-Schritt** ist die
Ausnahme — das Beleg-*Bild* muss zur KI, vollständige Schwärzung der Kette braucht **lokale
OCR** (Tesseract, vorgemerkt).

## 2. Import & Kanäle (P6/P8/P9)

- **Massen-Import = Datei** (CSV/vCard/JSON). Einziger tragfähiger Weg für viele Kunden +
  Bilder. **CSV zuerst** (jeder kann es aus Excel/Altsystem erzeugen).
- **Deutsche CSV-Fallen zwingend abfangen:** Trennzeichen `;` (nicht `,`), Kodierung
  Windows-1252/Latin-1 vs. UTF-8 (sonst Umlaut-Müll), BOM.
- **Idempotenz:** exakter-Schlüssel-Abgleich **vor** dem Schreiben → keine Dubletten bei
  Doppel-Import.
- **GoBD-Grenze:** Kundenstamm importieren = unkritisch; alte **Buchungen** als
  **Eröffnungs-/Referenzbestand** kennzeichnen, nicht als hier originär festgeschrieben.
- **QR = nur Einzel-Datensatz teilen**, offline, **lokal erzeugt** (qrcode-generator, kein
  externer Dienst), mit hartem „zu groß → Datei"-Fallback. (Beleg aus Mein-Rezeptbuch-Analyse.)
- **Import läuft komplett lokal, ohne KI/Netz** → datenschutz-harmlos.

## 3. Modi & Privat-/Bürger-Modus (P2/P11/P12)

**Zwei Zielgruppen, eine Engine.** Geschäfts-Buchhaltung (SKR03/Soll-Haben/USt/EÜR) **und**
Privatbürger-Steuer (Überschuss-Einkünfte, Anlagen). Scan-/Krypto-/KI-/Export-Engine wird
wiederverwendet; nur „Gesicht" (Kategorien/Sprache/Formulare) unterscheidet sich.

- **Einfach-Modus zeigt NIE** Soll/Haben, SKR03, „Doppelbuchung".
- **Lebenslagen-Profile = Steuer-Anlagen:** Vermieter→**Anlage V**, Pflege→**außergew.
  Belastungen / Pflege-Pauschbetrag**, Arbeitnehmer→**Anlage N**, Haushalt→**haushaltsnahe
  Dienste/Handwerker** … Profil wählt relevante Kategorien + **Alltagssprache**
  („Mieteinnahme", „Reparatur").
- **Modus-Onboarding** „Was möchtest du tun?": Privat-Steuer / Geschäfts-Buchhaltung /
  Für andere (Berater) → **nur die gewählte Welt sichtbar**.
- **Anbieterwahl je Modus:** Einfach = frei **mit einmaliger informierter Einwilligung**;
  Profi = PII-Filter vorausgewählt; Berater = **PII-Filter Pflicht** (Mandantendaten).

**Ehrliche Realitäts-Checks (verbindlich für Außenkommunikation):**
- **Kein „ein Klick ans Finanzamt".** Übermittlung braucht **ELSTER/ERiC** (zertifiziert);
  die App macht das **nicht**. Heute: **fertiges, geprüftes Paket** → Steuerberater/Bank /
  ELSTER-Übernahme. Echte ELSTER-Anbindung = eigener großer Brocken (**P13**).
- **Keine volle KI-Autonomie beim Versand.** Für die Richtigkeit haftet der Bürger →
  **Mensch bestätigt** vor Versand. KI bereitet vor (95 %), Mensch nickt ab.

## 4. Recht/Aufklärung (P1/P3/P4)

- **P1** AVV/DPA-Dokumente (Google, Mistral) in-app verlinkt/zugänglich + Nutzer-Belehrung.
- **P3** KI-Autonomiestufen erklärt (was geht wann wohin).
- **P4** Kleinunternehmer-Aufklärung: Weiterleiten von **Drittdaten** erzeugt Pflichten —
  auch für Kleine. Klarstellen.

## 5. Punkte-Übersicht P1–P13 (Status)

| # | Inhalt | Status |
|---|---|---|
| P1 | Rechts-Mindestcheckliste + AVV/DPA-Dokumente in-app | geplant |
| P2 | KI-Anbieterwahl je Modus (Einfach frei+Einwilligung / Berater streng) | geplant |
| P3 | KI-Autonomiestufen in der Aufklärung erklären | geplant |
| P4 | Kleinunternehmer-Aufklärung (Drittdaten = Pflichten) | geplant |
| P5 | Automatischer PII-Filter / Pseudonymisierung vor KI-Versand | geplant |
| P6 | Import vorhandener Kundendaten (CSV/vCard/JSON) | geplant |
| P7 | Briefkasten / Token-Tresor (Mandant ⊃ Firma ⊃ Person) | geplant |
| P8 | Datei-Kanal (Masse) + QR (Einzel, lokal erzeugt) | geplant |
| P9 | Datei-Import-Ablauf mit exaktem Schlüssel-Abgleich | geplant |
| P10 | Auftrag/Rechnung führt handelnde Person als Besteller mit | vorgemerkt |
| P11 | Lebenslagen-Profile im Einfach-Modus = Steuer-Anlagen | geplant |
| P12 | Modus-Onboarding „Was möchtest du tun?" + andere Welten ausblenden | Idee |
| P13 | ELSTER/ERiC-Anbindung (echte Finanzamt-Übermittlung) | Idee (großer Brocken) |

## 6. Empfohlene Bau-Reihenfolge (entschieden: „B mit einem Fuß in A")

Erst Fundament (worauf der Privat-Modus ohnehin steht), Privat-Modus als Vision dokumentiert.

1. **P7-Kern + P5 als reines Logik-Modul** — `tokenize/reidentify` (deterministisch, stabile
   Token, exakter-Schlüssel-Anker). **Node-testbar** → erster, ehrlicher Schritt ohne Browser.
2. **P7-Datenmodell dreistufig** (Mandant ⊃ Firma ⊃ Person, verschlüsselt, Verknüpfungstabelle).
3. **P6/P9 Import** (CSV zuerst, exakter Abgleich → Briefkasten, deutsche CSV-Fallen).
4. **P5-Integration in die KI-Pipeline** (Vorschau „das wird gesendet/geschwärzt").
5. **P1–P4 Recht & Anbieterwahl je Modus** (UI + Belehrung + AVV-Links).
6. **P11/P12 Privat-Modus + Profile** (Anlagen, Onboarding, Komplexität ausblenden).
7. **P8 QR** (optional), **P10** (Besteller an Buchung), **P13 ELSTER** (Fernziel).

Parallel offen (vorhandene Roadmap): durchgehender Beleg→Vorschlag-Klickpfad im Browser
verifizieren; Privat-Modell rechnet **Überschuss-Einkünfte**, nicht Doppik mit versteckten Knöpfen.

## 7. Definition of Done je Punkt (aus CLAUDE.md)

Real implementiert (kein Fake) · `node tests/run.mjs` grün · ROADMAP/PULS/SESSIONS
fortgeschrieben · Transparenz-Doku-Status von „geplant" → „fertig" nachziehen · PR mit
ehrlicher Verifikation (inkl. was NICHT geprüft wurde, v. a. Browser-/DOM-Pfade).
