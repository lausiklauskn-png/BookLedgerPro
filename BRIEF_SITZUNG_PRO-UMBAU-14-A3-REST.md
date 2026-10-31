# Sitzungsplan Pro-Umbau 14 A3 (Rest) und danach B–E (Stand 2026-10-31, nach Teil 1)

Grundlage: `BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A3.md` (Teil 1), `BRIEF_SITZUNG_PRO-UMBAU-14-NACH-A2.md` (Klaus' Antworten 1–7),
`BRIEF_SITZUNG_PRO-UMBAU-14.md` (Plan B–E).

## Schon erledigt (2026-10-31, 16:25)
PB #121, BLP #440/#441, PB #122, WPP #50, Basic #35, Kimhub #419 gemergt. Bausteine Fassung 7 in PB/WPP/BLP, Tresor-Paket mit `Umzug.java` in WPP/BLP/PB,
Forschung Teil 1 in Kimhub.

## Dann A3-Rest (Klaus' Antworten)
- **3 „Ort ändern“: den Knopf bauen.** Der Kern `de.familyprojekt.tresor.Umzug` steht (WPP `docs/TRESORORDNER.md`, letzter Abschnitt). Zuerst in
  Workflow PDF Pro (Android): Knopf im Kasten „Tresor (alle Pro-Apps)“, neuer Ordner per SAF (nicht derselbe, nicht darin), `Umzug.kopieren` im
  Hintergrund mit Stand, danach `Umzug.vermerken` am alten Ort und den neuen Ort merken, gemerkter Schlüssel bleibt (gleiche Kennung). Heikel:
  WPPs Dokumenttresor liegt in „Workflow PDF Pro/“ und hat einen eigenen Ort — er muss auf den neuen Ort umgestellt werden (`WFPVaultMigration.reconnect`).
  Die anderen Apps lesen `Umzug.vermerk` und bitten um den neuen Ort. Dann Windows, dann BLP/PB.
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
Pro-Umbau 14 A3 Rest. Erledigt sind Bausteine Fassung 7 überall, Forschung Teil 1 in Kimhub und der Kern für „Ort ändern“ (Umzug.java im Tresor-Paket, in WPP/BLP/PB).
Nach meinen Antworten weiter: 3 „Ort ändern“ — den Knopf bauen, zuerst Workflow PDF Pro Android (Ordnerwahl, Umzug im Hintergrund, Vermerk am alten Ort, Dokumenttresor umstellen), dann Windows, dann BLP/PB, 4 Windows-Tresorordner in Private Brain Pro und Workflow PDF Pro (Vorlage BLP DesktopTresor.java, byte-gleich), V3 und Familienakte ziehen das Tresor-Paket ein, Workflow-PDF (PWA) antwortet im Netz wie WPP.
Danach B Familienakte, C Sage-Hinweis, D Briefkopf, E Geschenk-Seite.
Repos: BookLedgerPro, BookLedger-Basic, Privat-Brain-Pro, Privat-Brain-Pro-V3, Workflow-PDF-Pro, Workflow-PDF, Meine-Familienakte, Sage-Protokol, Mein-WorkFloh, Kimhub (Branch wie vorgegeben).
Zuerst lesen: CLAUDE.md je Repo, BookLedgerPro/BRIEF_SITZUNG_PRO-UMBAU-14-A3-REST.md, BRIEF_ABSCHLUSS_2026-10-31_PRO-UMBAU-14A3.md, BRIEF_SITZUNG_PRO-UMBAU-14.md (Plan B–E).
Familienakte: erst prüfen, ob eine andere Sitzung dort noch arbeitet.
Nichts veröffentlichen ohne mein Wort; vorher Releases lesen, Version und Buildnummer erhöhen. Keine Schlüssel, PINs oder Chefcodes in Dateien oder im Chat. Kanon-Module byte-1:1. Bausteine nur in ihrer Quelle ändern. Keine Versionssprünge der Datenbank von außen.
Ein PR je App, bei grüner CI selbst mergen, Basic nachziehen. Forschung nur in Kimhub. Abschluss mit Stundennachweis, Brief mit Startauftrag.
```
