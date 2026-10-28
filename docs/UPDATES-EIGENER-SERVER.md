# Updates vom eigenen Server (Klaus 2026-10-28) — Vorlage für alle Apps

Klaus: „Update auf den Server legen … alte Update weg, neue Update drauf … wenn er auf Update drückt, dass er das dann greifen kann.“
Gebaut zuerst in **BookLedgerPro (Windows)**. Gedacht als Vorlage für jede weitere App (z. B. Meine Familienakte), auch für private Repos,
deren GitHub-Releases von außen nicht lesbar sind (Private Brain Pro liest GitHub direkt — das geht nur, weil das Repo öffentlich ist).

## Wie es läuft

| Teil | Ort | Was |
|---|---|---|
| Server | `167.233.204.72` (Hetzner, Caddy), Ordner `/srv/family-project/updates/<app>/`, von außen `https://family-projekt.de/updates/<app>/` | je Plattform `aktuell-windows.json` / `aktuell-android.json` mit `.sig`, dazu Setup bzw. APK. Nichts sonst. |
| Hochladen | GitHub-Lauf „Windows-Update veröffentlichen“ (nur von Hand, Feld „ja“) | rsync mit Schlüssel `…_UPLOAD_KEY`; der darf auf dem Server **nur** in `/srv/family-project/updates` schreiben (`rrsync`, `restrict`). Server-Kennung im Lauf fest. |
| Unterschrift | GitHub-Geheimnis `…_SIGNING_KEY` (Ed25519) | die Feed-Datei wird unterschrieben; der Lauf prüft die Unterschrift gegen den **in der App eingebauten** öffentlichen Schlüssel, bevor er hochlädt. |
| App | z. B. `windows/engine/src/DesktopUpdates.java` | holt `aktuell-<plattform>.json` + `.sig`, glaubt nur der Unterschrift, nimmt nur eine **neuere** Version, baut die Setup-Adresse selbst (feste Basis + geprüfter Name), prüft Größe und SHA-256, startet das Setup und schließt sich. |
| Bedienung | „Über“ (Leitfaden § 6) | „Auf Updates prüfen“ → „Du verwendest die aktuelle Version …“ oder „Neu: … (du hast …)“ + ein farbiger Knopf „Laden und installieren“ mit MB-Stand. Nichts startet von selbst. |

`aktuell-windows.json` (Format 1; Android gleich mit Abschnitt `android` und `versionCode`):

```json
{ "format": 1, "app": "bookledgerpro", "version": "0.1.2", "datum": "2026-10-29", "quelle": "<commit>",
  "windows": { "datei": "BookLedgerPro-Windows-0.1.2-x64-setup.exe", "groesse": 40123456, "sha256": "<64 hex>" } }
```

`aktuell-windows.json.sig` = Base64 der Ed25519-Unterschrift über genau die Bytes der Feed-Datei (`openssl pkeyutl -sign -rawin`).

Warum so: Ein geknackter Server kann kein fremdes Programm unterschieben (Unterschrift fehlt), einen alten echten Stand nicht als neu
ausgeben (Version muss steigen) und auf keine fremde Adresse umleiten (die App setzt die Adresse selbst zusammen).

## Eingerichtet für BookLedgerPro (2026-10-28, Klaus' Termux)

- Ordner `/srv/family-project/updates/bookledgerpro/` angelegt, von außen erreichbar.
- Hochlade-Schlüssel `github-blp-updates` auf dem Server mit `command="/usr/bin/rrsync /srv/family-project/updates",restrict`; Probe: Hochladen geht,
  `ls /` wird abgelehnt.
- Signatur-Schlüssel in Termux erzeugt (`~/blp-update/`), öffentlicher Teil in `DesktopUpdates.java` (`SCHLUESSEL`).
- Geheimnisse in GitHub: `BLP_UPDATE_UPLOAD_KEY`, `BLP_UPDATE_SIGNING_KEY` (per `gh secret set` aus Termux, nie im Chat). Sicherung verschlüsselt
  `~/blp-update-schluessel.age`.

## Für eine weitere App (z. B. Meine Familienakte)

1. **Ist es eine PWA?** Dann braucht sie das nicht: GitHub Pages + Service Worker liefern neue Stände von selbst. Diese Vorlage gilt für
   **installierte** Fassungen (Windows-Setup, Android-APK).
2. **Termux (Klaus), ein Block** — Ordner `<app>` und eigener Signatur-Schlüssel; der Hochlade-Schlüssel von BookLedgerPro darf schon in
   `/srv/family-project/updates` schreiben und kann wiederverwendet werden:

   ```
   A=<app>; R=lausiklauskn-png/<Repo>; S=root@167.233.204.72
   ssh $S "mkdir -p /srv/family-project/updates/$A && echo '{\"probe\":1}' > /srv/family-project/updates/$A/probe.json"
   curl -s https://family-projekt.de/updates/$A/probe.json; echo
   mkdir -p ~/$A-update && cd ~/$A-update
   [ -f signatur.pem ] || openssl genpkey -algorithm ed25519 -out signatur.pem; chmod 600 signatur.pem
   gh secret set UPDATE_SIGNING_KEY -R $R < signatur.pem
   gh secret set UPDATE_UPLOAD_KEY -R $R < ~/blp-update/upload
   gh secret list -R $R | grep UPDATE_
   echo "== öffentlicher Schlüssel:"; openssl pkey -in signatur.pem -pubout | sed -n 2p
   ```

3. **In der App** (Sitzung dort): `DesktopUpdates`-Muster übernehmen (Basis `https://family-projekt.de/updates/<app>/`, Dateiname-Muster der
   App, öffentlicher Schlüssel aus Schritt 2), Knopf unter „Über“, Proben wie in `windows/engine/tests/EngineTests.java` (fremde Unterschrift,
   veränderte Angaben, alter Stand, abgeschnittenes Setup, fremder Dateiname, openssl-Gegenprobe). Lauf wie
   `.github/workflows/windows-release.yml` (Server-Kennung und rsync-Ziel `<app>/`).
4. **Android**: in BookLedgerPro gebaut (`UpdateFeed.java` + `BlpUpdatesPlugin.java`, JVM-Probe `UpdateFeedTest`). Feed
   `aktuell-android.json` mit `android: {datei, groesse, sha256, versionCode}`, gleicher Signatur-Schlüssel. Weil Android Ed25519 erst ab 13 selbst
   prüft (Tab S6: Android 12), prüft die kleine Bibliothek `net.i2p.crypto:eddsa:0.3.0`. Vor dem Installieren: gleiches Paket, gleiches
   Signier-Zertifikat, höherer versionCode — dann Androids Installieren-Fenster (`REQUEST_INSTALL_PACKAGES`, beim ersten Mal führt die App in
   „Apps installieren erlauben“). Hochgeladen vom Lauf `android-release.yml` nach der GitHub-Veröffentlichung (nur Android-Dateien).

## Grenzen

- Nicht an einem echten Windows-PC gemessen; der erste echte Lauf kommt mit der ersten Veröffentlichung (nur auf Klaus' Wort).
- Unsigniertes Setup: Windows SmartScreen warnt beim Start (das betrifft die Code-Signatur des Setups, nicht die Update-Unterschrift).
- Der Hochlade-Schlüssel darf alle Apps unter `updates/` beschreiben; die Unterschrift je App verhindert trotzdem, dass eine App das Setup
  einer anderen annimmt.
