# Brief für die nächste Sitzung: BookLedgerPro als Android-App mit dem gemeinsamen Tresorordner

Geschrieben 2026-10-26 am Ende der Bau-Sitzung, auf Klaus' Wort: *„Stellt alles vor für die Android-Sitzung für BookLedgerPro.
Mach einen Brief … der Rest geht rüber in die Sitzung von BookLedgerPro."*

## Zuerst lesen (in dieser Reihenfolge)

1. `CLAUDE.md` (Regeln, Fahrplan Pro/Basic/Tresorordner)
2. `docs/design/PLAN-TRESORORDNER-2026-10-26.md` (Fächer, Regeln, Reihenfolge, Weg 2 Relais)
3. **Kimhub forschung/messungen/pro-apps-tresorordner-und-umbau-2026-10-26-bis-31.md** (was die Vorbild-Apps wirklich tun — mit einem Fund, der den
   Plan an einer Stelle berichtigt)
4. In Private Brain Pro: `docs/ANDROID.md`, `docs/SPEICHERORT-UND-TRESOR.md`, `docs/SIGNIERUNG-UND-GITHUB.md`,
   `docs/PRUEFSTAND-ANDROID.md`; in Workflow PDF Pro: `AGENTS.md` (dauerhafte Regeln, Gleichstand), `docs/SIGNIERUNG-UND-GITHUB.md`,
   `android/…/DocumentVault.java`, `VaultRecovery.java`.

Die Repos `Privat-Brain-Pro` und `Workflow-PDF-Pro` per `add_repo` dazunehmen, wenn sie fehlen.

## Wo es steht

- **BookLedgerPro ist heute noch eine PWA.** Es gibt kein `android/`, keine Signatur, keine APK. Die Web-App ist fertig für den
  Umzug (D22, Workflow PDF „beides", R3 sind gebaut; `tests/run.mjs` 2567/0 auf `main`).
- **BookLedger Basic** (`lausiklauskn-png/BookLedger-Basic`) ist die PWA-Fassung, Stand `c52523f`, steht in beiden Marktplätzen
  (family-projekt.de #373, PWA Toolpoint #182). Nach jedem PWA-Merge hier: `node tools/pro-nachziehen.mjs --pro ../BookLedgerPro`
  dort.
- **Schloss:** `VaultCrypto.java` ist in Private Brain Pro und Workflow PDF Pro schon gleich (bis auf `package`). Die
  **Ordnerschicht** darüber gibt es zweimal und verschieden; die bessere Vorlage (Schlüssel-Plätze, Ersatzschlüssel 5/3,
  allgemeiner Satz-Index, Windows-Zwilling in Rust) ist die von **Workflow PDF Pro**. Details in der Forschung.

## ✅ Klaus' Antworten (2026-10-26, abends) — gelten, nicht neu fragen

1. **Ein gemeinsamer Kopf, ein Passwort, ein Ersatzschlüssel** für alle Pro-Apps: *„eins gemeinsames Passwort, deine Empfehlung
   umsetzen."* Umzug seiner echten SD-Karte nur mit Probe an einer Kopie und Rückweg.
2. **Buchhaltungsdaten bleiben in der App** (Weg A); der Tresorordner bekommt die **automatische verschlüsselte Sicherung**.
   **Neu dazu:** *„wenn der Schlüssel aufgeschlossen ist, dann soll auch in den Ordnern in dem Tresor gesucht werden können.
   Also der Ordner soll im BookLedgerPro auch geöffnet werden können."* → BookLedgerPro zeigt den entsperrten Tresorordner
   (alle Fächer, nur lesend bei fremden) und durchsucht ihn (siehe Schritt C2).
3. **Paket und Signatur:** `de.familyprojekt.bookledgerpro`, Produktionskanal, neue Identität einmal per `init` — *„3 ist auch okay."*
4. **Reihenfolge wie vorgeschlagen:** (a) BookLedgerPro als installierbare App ohne Ordner → (b) gemeinsame Ordnerschicht →
   (c) Private Brain Pro schreibt ins Eingangsfach → (d) Workflow PDF Pro zieht ein.
5. **Relais (Weg 2) ganz zum Schluss:** *„den machen wir zum Schluss. Das ist der letzte Akt."* — nach Android **und** Windows.

## Die fünf Fragen (beantwortet, oben) — Wortlaut zur Nachvollziehbarkeit

Jede mit Empfehlung; die Antworten kommen als kurze Wahl, nicht als Technik.

1. **Ein Kopf über allen Fächern** (Hauptschlüssel, ein Passwort, ein Ersatzschlüssel für alle Apps; vorhandene Tresore ziehen
   ein, ohne neu verschlüsselt zu werden). *Empfehlung: ja.* Berührt Klaus' echte SD-Karte mit Private Brain Pro — Umzug nur mit
   Probe an einer Kopie und mit Rückweg.
2. **BookLedgerPros Daten:** App-Tresor im Browser bleibt (GoBD-Kette unberührt), der Ordner bekommt die **automatische
   verschlüsselte Sicherung**, die Beleg-Originale und das Eingangsfach. *Empfehlung: ja (Weg A).* Zwei Passwörter bis auf Weiteres.
3. **Paket und Signatur:** `de.familyprojekt.bookledgerpro`, Produktionskanal, neue Identität einmal per `init` wie bei Workflow PDF
   Pro; Klaus legt das Environment und das Freigabe-Geheimnis selbst an (Schrittfolge mit Knöpfen, nie im Chat). *Empfehlung: ja.*
4. **Reihenfolge:** (a) BookLedgerPro zuerst als installierbare App ohne Ordner → (b) gemeinsame Ordnerschicht → (c) Private Brain Pro
   schreibt Rechnungsmails ins Eingangsfach → (d) Workflow PDF Pro zieht in den Kopf ein. *Empfehlung: so.* Der Plan hatte
   Private Brain Pro zuerst; (a) liefert früher etwas, das Klaus anfassen kann, und braucht keine Entscheidung zu 1.
5. **Weg 2 (Relais)** davor, danach oder gar nicht? (aus dem Plan, weiter offen)

## Bauschritte (Antworten liegen vor)

**Schritt A — die App selbst (ohne Ordner):**
- `capacitor.config.json` (`appId` aus Frage 3, `webDir: "www"`, `androidScheme: "https"`, `resolveServiceWorkerRequests: true`,
  `CapacitorHttp` aus), `android/` per Capacitor (Versionen wie in Workflow PDF Pro), `tools/native/prepare-web.mjs` mit
  **ausdrücklicher** Dateiliste und Ankerprüfungen (Vorbild Private Brain Pro).
- Eingang nativ: `ACTION_SEND`/`SEND_MULTIPLE`/`ACTION_VIEW` für PDF, Bilder, `.eml` → derselbe Weg wie `share_target`
  (`teilen-empfang` → `dateienEinlesen`, Mail-Leser). Mikrofon über Androids Sprachfenster. Teilen hinaus über FileProvider.
- Signatur: `tools/signing/` aus Workflow PDF Pro übernehmen (Namen auf BookLedgerPro), `init` **einmal**, danach nur `check`.
- CI: Android-Bau + Emulator-Probe in eigenem Workflow; `tests/run.mjs` bleibt die Web-Probe.
- **BookLedger Basic darf `android/`, `native/`, `signing/` nicht mitbekommen:** in `BookLedger-Basic/tools/basic-regeln.mjs` eine
  Ausschlussliste ergänzen, **bevor** der erste native Merge nachgezogen wird.

**Schritt B — gemeinsame Ordnerschicht:** eigenes Java-Paket `de.familyprojekt.tresor` an **einer** Stelle gepflegt (Vorschlag:
Private Brain Pro, weil dort der Tresor zuerst lebte — oder Workflow PDF Pro, weil dort die bessere Schicht liegt; mit Klaus
entscheiden), byte-gleich kopiert und per SHA gepinnt. Probe mit gestelltem Ordner (Robolectric/JVM wie `VaultCryptoTest`), Gegenprobe:
falsches Passwort ändert nichts, Ersatzschlüssel öffnet, fremdes Fach wird gelesen, nie gelöscht.

**Schritt C — BookLedgerPro im Ordner:** Ordnerwahl, Sicherung automatisch ins Fach (Vorgabe aus `domain/backupStrategie.js`),
Beleg-Originale, Eingangsfach lesen mit Marke „übernommen".

**Schritt C2 — Tresorordner in BookLedgerPro öffnen und durchsuchen (Klaus' Zusatz zu Frage 2):** solange entsperrt, eine
Ansicht „Tresorordner" mit allen Fächern (eigenes Fach schreibend, fremde nur lesend, nie löschen) und eine Suche darüber.
⚠ Vorher klären, was dafür fehlt: Private Brain Pro legt Dateien unter **verschlüsselten Namen** ab (HMAC, `nameKey`) und führt
seine eigenen Verzeichnisse (Anhänge-/Original-Index, Katalog); Workflow PDF Pro hat einen eigenen Satz-Index. Ohne gemeinsames
Format kann BookLedgerPro fremde Fächer nicht sinnvoll auflisten. Vorschlag für Schritt B: **jedes Fach führt ein verschlüsseltes
Inhaltsverzeichnis** im selben Format (Name, Art, Datum, Größe, kurzer Textauszug, Verweis auf die Datei), das jede App für ihr Fach
schreibt; BookLedgerPro liest es, sucht mit Wort- und Bedeutungssuche (`domain/belegsuche.js`, Vektoren nur auf dem Gerät) und
öffnet Treffer lesend bzw. übernimmt sie als Beleg (Kopie, Marke „übernommen"). Das Inhaltsverzeichnis gehört in die gemeinsame
Schicht, nicht in eine App.

**Schritt D — Private Brain Pro und Workflow PDF Pro** ziehen in den Kopf ein (eigene PRs in deren Repos, deren Regeln gelten —
Workflow PDF Pro: Gleichstand aller Fassungen, Kern nie von Hand).

## Was nicht passieren darf

- **Keine Veröffentlichung ohne Klaus' Wort.** Kein APK-Release, kein Windows-Release. Ein grüner Lauf ist keine Veröffentlichung.
- Keine Schlüssel, Freigaben, Passwörter in Git oder Chat. Keine Private-Brain-Signatur für BookLedgerPro.
- DB-Endung `bookledgerpro` nie ändern; nichts an Klaus' echten Tresoren ohne Kopie und Rückweg.
- Schutzmodule und byte-1:1-Kopien (SBKIM, `apps/`, `assets/wfpdf/`, `pb-icons.svg`) nie von Hand ändern.
- Ehrlich trennen: Emulator ist nicht Tablet. Am Ende jedes Schritts `docs/PULS.md`, `docs/SESSIONS.md` und `CLAUDE.md` nachziehen.

## Danach

Zum Schluss, nach Android und Windows: **Weg 2 Relais** (Klaus: „der letzte Akt").

Windows-Sitzung (dieselben drei Apps; Achtung: Private Brain Pro nutzt eine Java-Engine mit DPAPI, Workflow PDF Pro einen Rust-Kern —
auch dort zwei Fassungen derselben Schicht). Die Download-Seite für die Pro-Apps macht Klaus selbst.
