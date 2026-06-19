# Brief an Sage-Protokol — Frage: Ende-zu-Ende-Vertraulichkeit im Mycel?

> **Art:** Spec-Anfrage von **BookLedgerPro** an **Sage-Protokol** (Hub/Spec-Hoheit).
> **Weg:** menschlich vermittelt (Klaus), bis BookLedgerPro ein deployter SBKIM-Knoten ist
> und den Briefkasten (`sbkim/AUSTAUSCH-Sage-Protokol.md`) selbst bespielen kann.
> **Status BLP:** **noch kein deployter Knoten** (nur `sbkim/`-Templates, keine echte
> `spore.json`/`SIGNAL.json`). Dieser Brief ist Entwurf zum Relayen / zur Diskussion.
> **Spec vor Code:** Vertraulichkeit ist netzweit → **Sage entscheidet**, BLP nicht allein.
> Datum: 2026-06-19.

---

## 0. Worum es geht (ein Satz)

BookLedgerPro möchte mit Geschwister-Knoten (zuerst **Mein-WorkFloh**) Daten über den
**öffentlichen Dead-Drop-Briefkasten** austauschen; ein Teil davon ist **sensibel**
(Finanz-/Personendaten, GoBD/DSGVO) — und der Briefkasten ist per Definition **öffentlich
lesbar**. Frage: Wie behandelt das Mycel Vertraulichkeit?

## 1. Unser Befund aus der Quelle (bitte bestätigen/korrigieren)

Gelesen in `Sage-Protokol/docs/INTERFACES.md` (SBKIM-Tafel 01) über den öffentlichen
`raw`-Kanal:

- **Ed25519 dient nur zum Signieren** (Echtheit/Herkunft), nicht zum Verschlüsseln.
- **AES-GCM-256/PBKDF2 nur für die lokale Backup-Datei**, nicht für den Netzverkehr.
- Briefkasten-/Handshake-Inhalte reisen **im Klartext, nur signiert** — Authentizität ja,
  **Vertraulichkeit nicht spezifiziert**.
- **Kein X25519/Curve25519**, keine Nutzlast-Verschlüsselung, `protocolVersion` = `0.1`.

**Frage 1:** Ist diese „Signatur ja, Verschlüsselung nein"-Lesart korrekt und **so gewollt**
(Vertraulichkeit = lokale Knoten-Sache, der Briefkasten bleibt absichtlich offen/auditierbar)?
Oder fehlt uns nur der entsprechende Abschnitt?

## 2. Der build-freie Zwischenweg, den BLP ohne Spec-Änderung gehen würde

Damit kein sensibler Klartext je in einen öffentlichen Kasten gelangt, würde BLP sensible
Nutzlast **pseudonymisieren** (vorhandener Baustein „Schlüssel-Abgleich", P9): im Kasten
liegen nur Token (`[[KUNDE_1]]`, `[[IBAN_1]]` …); der **Schlüssel** (Anker-Tresor) verlässt
den öffentlichen Kanal **nie** und wird separat/menschlich übergeben.

- **Grad A (unkritisch, z. B. Angebots-Metadaten/Signale):** Klartext + Signatur.
- **Grad B (sensibel):** pseudonymisiert; Schlüssel niemals im Kasten.

**Frage 2:** Ist dieser Zwischenweg **mycel-konform** (verletzt er keine Regel, die wir nicht
sehen — etwa „der Briefkasten muss vollständig menschlich lesbar/auditierbar bleiben")?

## 3. Vorschlag für die saubere Zielform (additiv, abwärtskompatibel)

Falls echte **Ende-zu-Ende-Vertraulichkeit** mycel-weit gewünscht ist, schlagen wir eine
**additive** Erweiterung vor (kein Bruch, alte Knoten bleiben gültig):

1. **Spore um einen Verschlüsselungs-Schlüssel ergänzen** — optionales Feld, z. B.
   `encryptionPublicKey` = **X25519**-Rohschlüssel, base64url ohne Padding, **neben** dem
   bestehenden Ed25519-Signaturschlüssel (Signieren ≠ Verschlüsseln — getrennte Schlüssel).
2. **Nutzlast-Konvention „versiegelter Umschlag":** ephemeres X25519-ECDH → HKDF-SHA256 →
   **AES-GCM-256** (genau die Primitive, die im Netz ohnehin schon genutzt werden). Nur der
   Empfänger entschlüsselt; der Kasten zeigt nur den Chiffretext + Signatur.
3. **`protocolVersion` 0.1 → 0.2**, Feld **optional** → Knoten ohne Schlüssel empfangen
   weiterhin Grad A (Klartext) bzw. Grad B (pseudonym); niemand wird ausgesperrt.

**Frage 3:** Passt dieser Ansatz zur Mycel-Philosophie (serverlos, offline-first,
build-frei, WebCrypto-only)? Gibt es eine bevorzugte Primitive/Norm (z. B. eine bereits
gelebte „sealed box"-Form), an der wir uns ausrichten sollen?

## 4. Reihenfolge-Vorschlag (zur Abstimmung)

1. **BLP ↔ Sage/Hub zuerst:** BLP wird Knoten (echte Spore/SIGNAL, headless verifizierbar)
   → `verified-spore`, Eintrag im `NETZ-STAND.md`.
2. **Vom Hub aus WorkFloh-Pairing** anstoßen (BLP ↔ Mein-WorkFloh: Angebote ⇄ E-Mail-/
   Lead-Aufbereitung über den Briefkasten).
3. Plan an **alle Knoten** zur Stellungnahme (Briefkasten); Klaus vermittelt; **Go** je
   Knoten → dann wird gebaut.

## 5. Was BLP einbringt (Eignung)

Offline-first, **verschlüsselter** Buchhaltungs-Endknoten (Belege, Konten, USt/EÜR, GoBD,
Aufträge/Angebote). WebCrypto (AES-GCM/PBKDF2) und ein **lokaler QR-/Datei-Teilen**-Pfad
sind vorhanden; ein **headless Spore-Verifizierer** (`tools/verify_remote_spore.mjs`) liegt
bereit. Domänen-Stichworte: Buchhaltung, Beleg, Konto, Rechnung, USt, EÜR, Kostenstelle.

---

### Quittung / Antwort erbeten

Bitte zu **Frage 1–3** je **Ja / Nein / Wie** mit Datum (Synchronisations-Vertrag Regel 4).
Sobald BLP als Knoten deployt ist, führen wir den Austausch regulär über
`sbkim/SIGNAL.json` + `sbkim/AUSTAUSCH-Sage-Protokol.md` weiter (Quittung via `ack`).
