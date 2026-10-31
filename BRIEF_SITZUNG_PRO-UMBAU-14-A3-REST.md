# Sitzungsplan Pro-Umbau 14 A3 (Rest) und danach B–E (Stand 2026-10-31, nach Teil 1)

Grundlage: `BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A3.md` (Teil 1), `BRIEF_SITZUNG_PRO-UMBAU-14-NACH-A2.md` (Klaus' Antworten 1–7),
`BRIEF_SITZUNG_PRO-UMBAU-14.md` (Plan B–E).

## Zuerst
1. PB #121 und den BLP-PR „Tresor-Paket und Bausteine Fassung 7“ prüfen; bei grüner CI mergen, Basic nachziehen.
2. Workflow PDF Pro: Bausteine Fassung 7 aus Private Brain Pro nachziehen (`tools/native/bedienung-nachziehen.mjs --quelle ../Privat-Brain-Pro`).
3. Kimhub `forschung/messungen/`: Befunde aus Teil 1 eintragen (Abschluss-Brief, Abschnitt Forschung).

## Dann A3-Rest (Klaus' Antworten)
- **3 „Ort ändern“ mit Umzug** — Quelle Workflow PDF Pro, Vorlage `native/vault-migration.js` (kopieren → prüfen → umschalten; alter Ort bleibt,
  bis der Nutzer ihn löscht; nie überschreiben). Android (SAF) und Windows. Danach nachziehen in BLP/PB.
- **4 Windows-Tresorordner in PB und WPP** — Vorlage BLP `windows/engine/src/DesktopTresor.java` + Tauri-Ordnerwahl (jedes Laufwerk, auch USB,
  ganzer Pfad sichtbar). Byte-gleich aus der Quelle, nicht nachbauen.
- V3 und Familienakte: Tresor-Paket einziehen (eigene Fächer gibt es seit WPP #49).
- Workflow-PDF (PWA): „Im Netz antworten“ wie in WPP (`native/native-netz.js` als Vorlage; Kern-Datenbank nur lesend, ohne Version).

Danach B Familienakte (vorher prüfen, ob eine andere Sitzung dort arbeitet), C Sage-Hinweis, D Briefkopf (Quelle Workflow-PDF), E Geschenk-Seite.

## Was nicht passieren darf
Nichts veröffentlichen ohne Klaus' Wort (vorher Releases lesen, Version/Build erhöhen). Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat.
Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle (Bedienung/Chefcode: Private Brain Pro; Tresor/Scanner: Workflow PDF Pro; Briefkopf: Workflow-PDF).
Keine Versionssprünge der Datenbank von außen (Lehre V3 #34). Tresorordner-Umzug: nie Daten löschen oder überschreiben. Keine Emojis, kein Force-Push.

## Startauftrag zum Einfügen

```
Pro-Umbau 14 A3 Rest. Zuerst: PB #121 und den BLP-PR „Tresor-Paket und Bausteine Fassung 7“ prüfen und bei grüner CI mergen, Basic nachziehen; Workflow PDF Pro bekommt Bausteine Fassung 7 aus Private Brain Pro; Befunde aus Teil 1 in Kimhub forschung/messungen eintragen.
Dann nach meinen Antworten: 3 „Ort ändern“ mit Umzug (kopieren, prüfen, umschalten, alter Ort bleibt; Quelle Workflow PDF Pro, Android und Windows), 4 Windows-Tresorordner in Private Brain Pro und Workflow PDF Pro (Vorlage BLP DesktopTresor.java, byte-gleich), V3 und Familienakte ziehen das Tresor-Paket ein, Workflow-PDF (PWA) antwortet im Netz wie WPP.
Danach B Familienakte, C Sage-Hinweis, D Briefkopf, E Geschenk-Seite.
Repos: BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Privat-Brain-Pro-V3, Workflow-PDF-Pro, Workflow-PDF, Meine-Familienakte, Sage-Protokol, Mein-WorkFloh, Kimhub (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14-A3-REST.md, BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A3.md, BRIEF_SITZUNG_PRO-UMBAU-14.md (Plan B–E).
Familienakte: erst prüfen, ob eine andere Sitzung dort noch arbeitet.
Nichts veröffentlichen ohne mein Wort; vorher Releases lesen, Version und Buildnummer erhöhen. Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle ändern. Keine Versionssprünge der Datenbank von außen.
Ein PR je App, bei grüner CI selbst mergen, Basic nachziehen. Forschung nur in Kimhub. Abschluss mit Stundennachweis, Brief mit Startauftrag.
```
