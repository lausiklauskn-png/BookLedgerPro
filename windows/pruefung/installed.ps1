# Installiert den Prüfbau, startet ihn zweimal (erste, neustart) und entfernt ihn wieder. Nur auf dem GitHub-Windows-Rechner.
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'Diese Probe läuft nur auf dem abgeschotteten GitHub-Rechner.' }
$appDir = Join-Path $env:LOCALAPPDATA 'BookLedgerPro'
$exe = Join-Path $appDir 'bookledgerpro.exe'
$env:BLP_WINDOWS_TEST_EXE = $exe
$env:BLP_WINDOWS_TEST_FOLDER = Join-Path $env:RUNNER_TEMP 'BLP Tresorordner Probe'
$env:BLP_WINDOWS_TEST_SAVE_FOLDER = Join-Path $env:RUNNER_TEMP 'blp-speichern-probe'
New-Item -ItemType Directory -Force $env:BLP_WINDOWS_TEST_FOLDER, $env:BLP_WINDOWS_TEST_SAVE_FOLDER, 'windows/pruef-out' | Out-Null
$setup = (Get-ChildItem windows/src-tauri/target/release/bundle/nsis -Filter '*-setup.exe' | Select-Object -First 1).FullName
function Run-Setup($file) {
  $process = Start-Process -FilePath $file -ArgumentList '/S' -PassThru
  if (!$process.WaitForExit(180000)) { $process | Stop-Process -Force; throw 'Installer hängt.' }
  if ($process.ExitCode -ne 0) { throw "Installer fehlgeschlagen: $($process.ExitCode)" }
}
function Phase($name) {
  $app = Start-Process -FilePath $exe -PassThru
  node windows/pruefung/installed.mjs $name "windows/pruef-out/$name.json"
  $code = $LASTEXITCODE
  $java = @(Get-CimInstance Win32_Process -Filter "name='java.exe'" | Where-Object ParentProcessId -eq $app.Id | ForEach-Object ProcessId)
  $engineSeen = $java.Count -ge 1
  Get-Process bookledgerpro -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 3
  if ($java.Count -and (Get-Process -Id $java -ErrorAction SilentlyContinue)) { throw 'Die Engine lief nach dem Schließen der App weiter.' }
  if ($code -ne 0) { throw "Abnahme fehlgeschlagen: $name" }
  if (!$engineSeen) { throw 'Die Java-Engine war nicht als Kindprozess der App zu sehen.' }
}
Run-Setup $setup
if (!(Test-Path (Join-Path $appDir 'runtime/jre/bin/java.exe'))) { throw 'Die mitgelieferte Java-Laufzeit fehlt in der Installation.' }
$registration = Get-ItemProperty 'HKCU:\Software\Classes\Applications\bookledgerpro.exe\shell\open\command'
if (!$registration.'(default)'.Contains('bookledgerpro.exe')) { throw '„Öffnen mit“ ist nicht eingetragen.' }
Phase 'erste'
Phase 'neustart'
Run-Setup (Join-Path $appDir 'uninstall.exe')
# NSIS startet den Deinstaller als Kopie im Temp-Ordner: das Ende des Starters heißt noch nicht, dass er fertig ist
# (gleiche Lehre wie Private Brain Pro, pruefung/uninstall.ps1). Gewartet wird auf Programm UND Eintrag.
$deadline = [DateTime]::UtcNow.AddSeconds(60)
while (((Test-Path $exe) -or (Test-Path 'HKCU:\Software\Classes\Applications\bookledgerpro.exe')) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 250 }
if (Test-Path $exe) { throw 'Die Deinstallation hat das Programm nicht entfernt.' }
if (Test-Path 'HKCU:\Software\Classes\Applications\bookledgerpro.exe') { throw '„Öffnen mit“ blieb nach der Deinstallation eingetragen.' }
if (!(Test-Path (Join-Path $env:BLP_WINDOWS_TEST_FOLDER 'tresorordner.json'))) { throw 'Die Deinstallation hat den Tresorordner angefasst.' }
Write-Output 'PASS Installieren, zweimal starten, Tresorordner, Deinstallieren (Tresorordner bleibt)'
