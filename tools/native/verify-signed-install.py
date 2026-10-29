#!/usr/bin/env python3
"""Echte signierte Erstinstallation von BookLedgerPro im Emulator, nur über die sichtbare Oberfläche:
Tresor mit einem Wegwerf-Passwort anlegen, dieselbe APK darüber installieren, danach muss die App
„Entsperren" statt der Ersteinrichtung zeigen (der Tresor blieb erhalten). Kein Debug-Zugang, kein JS.
Vorbild: Workflow PDF Pro tools/native/verify-signed-install.py.
"""
import hashlib, json, re, secrets, subprocess, sys, time
from pathlib import Path
import xml.etree.ElementTree as ET

apk = Path(sys.argv[1]).resolve()
package = 'de.familyprojekt.bookledgerpro'
ERSTEINRICHTUNG = ['Tresor erstellen', 'Create vault']
SHAMIR = ['Schlüssel-Sicherung (Shamir)', 'Key backup (Shamir)']
ENTSPERREN = ['Entsperren', 'Unlock']
DECKBLATT = ['Zur Anmeldung', 'Continue to login']

def adb(*args):
    r = subprocess.run(['adb', *map(str, args)], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    if r.returncode: raise RuntimeError('ADB ' + str(args[:3]) + ': ' + (r.stdout + r.stderr)[-3000:])
    return r.stdout

def _dump():
    adb('shell', 'uiautomator', 'dump', '--compressed', '/sdcard/blp-release-probe.xml')
    return ET.fromstring(adb('exec-out', 'cat', '/sdcard/blp-release-probe.xml'))

anr_gesehen = []

def hierarchy():
    # 2026-10-29 (Läufe 40799662485/40802541184): über der App lag „Pixel Launcher isn't responding“ — der langsame Emulator.
    # Wegtippen mit „Warten“ traf einmal die App (Siegel-Fenster ging auf). Darum blendet die Probe Fehlerdialoge im Wegwerf-
    # Emulator vorab aus (hide_error_dialogs, unten) und tippt hier nichts mehr; ein Dialog wird nur vermerkt, und reagiert
    # BookLedgerPro selbst nicht, bricht die Probe ab.
    root = _dump()
    anr = [n.get('text', '') for n in root.iter('node') if "isn't responding" in n.get('text', '') or 'reagiert nicht' in n.get('text', '')]
    if anr:
        if any('bookledger' in t.lower() for t in anr): raise RuntimeError('Die App selbst reagiert nicht: ' + repr(anr))
        if anr[0] not in anr_gesehen: anr_gesehen.append(anr[0]); print('Systemdialog gesehen:', anr[0], flush=True)
    return root

def texte(node): return {node.get('text', '').strip(), node.get('content-desc', '').strip()}

def wait_node(predicate, seconds=90):
    deadline = time.monotonic() + seconds; root = ET.Element('hierarchy')
    while time.monotonic() < deadline:
        try:
            root = hierarchy()
            for node in root.iter('node'):
                if predicate(node.attrib): return node.attrib
        except (ET.ParseError, RuntimeError): pass
        time.sleep(.5)
    sichtbar = [n.get('text', '') for n in root.iter('node') if n.get('text')]
    raise RuntimeError('Erwartetes Element fehlt; sichtbar: ' + repr(sichtbar)[-3000:])

def hat(woerter): return lambda a: bool(texte(a) & set(woerter))

def rahmen(node):
    return list(map(int, re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node['bounds']).groups()))

def tap(node):
    b = list(map(int, re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', node['bounds']).groups()))
    adb('shell', 'input', 'tap', (b[0] + b[2]) // 2, (b[1] + b[3]) // 2)

def launch():
    r = adb('shell', 'am', 'start', '-W', '-n', package + '/.MainActivity')
    if 'Status: ok' not in r: raise RuntimeError('App startet nicht')
    if not adb('shell', 'pidof', package).strip(): raise RuntimeError('App-Prozess fehlt')

def deckblatt_weg(ziel, seconds=120):
    # Vor Ersteinrichtung/Entsperren steht das Deckblatt; „Zur Anmeldung“ steht unten, notfalls hinscrollen.
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        try: knoten = [n.attrib for n in hierarchy().iter('node')]
        except (ET.ParseError, RuntimeError): time.sleep(.5); continue
        if any(hat(ziel)(a) for a in knoten): return
        # 2026-10-29 (Lauf 40808448264): die schwebende SBKIM-Leiste (LEBT/VERKEHR/…) liegt unten über „Zur Anmeldung“; der Tipp
        # in die Knopfmitte öffnete das LEBT-Fenster. Ein offenes SBKIM-Fenster wird geschlossen, getippt wird eine Stelle des
        # Knopfes außerhalb der Leiste, sonst ein Stück weiter gewischt.
        if any(t.startswith('LEBT — Page-Status') for a in knoten for t in texte(a)):
            zu = next((a for a in knoten if hat(['Schließen', 'Close'])(a) and rahmen(a)[3] - rahmen(a)[1] > 4), None)
            if zu: tap(zu); time.sleep(1); continue
        LEISTE = ('SBKIM Live-Status-Widget', 'LEBT —', 'VERKEHR —', 'FREMD —', 'SBKIM-Siegel —', 'Widget ', '🌐 Mycel')
        leiste = [rahmen(a) for a in knoten if any(t.startswith(LEISTE) for t in texte(a)) and rahmen(a)[3] > rahmen(a)[1]]
        for a in knoten:
            if hat(DECKBLATT)(a):
                b = rahmen(a)
                if b[3] - b[1] > 4:
                    frei = [y for y in range(b[1] + 2, b[3] - 1, 4) if not any(l[0] <= (b[0] + b[2]) // 2 <= l[2] and l[1] <= y <= l[3] for l in leiste)]
                    if frei: adb('shell', 'input', 'tap', (b[0] + b[2]) // 2, frei[len(frei) // 2])
                    else:
                        # 2026-10-29 (0.1.3, Lauf 40840596381): die ausgeklappte Leiste deckte den Knopf auch ganz unten ab, zwei
                        # Minuten Wischen ins Leere. Im Wegwerf-Emulator die Leiste über ihren eigenen Knopf schließen, dann tippen.
                        schliessen = next((a for a in knoten if any(t.startswith('Widget schließen') for t in texte(a)) and rahmen(a)[3] - rahmen(a)[1] > 4), None)
                        if schliessen: print('SBKIM-Leiste über „Zur Anmeldung“ — geschlossen', flush=True); tap(schliessen)
                        else: adb('shell', 'input', 'swipe', 500, 1300, 500, 900, 300)
                else: adb('shell', 'input', 'swipe', 500, 1500, 500, 400, 300)
                break
        else:
            # 2026-10-29 (0.1.2): seit Version und „Auf Updates prüfen“ auf dem Deckblatt (#400) liegt „Zur Anmeldung“ unter dem
            # sichtbaren Bereich und fehlt im Baum ganz. Steht das Deckblatt da (App-Name sichtbar), nach unten wischen.
            if any('BookLedgerPro' in texte(a) for a in knoten):
                adb('shell', 'input', 'swipe', 500, 1500, 500, 400, 300)
        time.sleep(1)
    wait_node(hat(ziel), 5)

def passwortfelder():
    root = hierarchy()
    return [n.attrib for n in root.iter('node') if n.get('class') == 'android.widget.EditText' and n.get('password') == 'true']

digest = hashlib.sha256(apk.read_bytes()).hexdigest()
receipt = json.loads(Path(str(apk) + '.json').read_text())
assert receipt['apkSha256'] == digest and receipt['applicationId'] == package
if 'package:' + package in adb('shell', 'pm', 'list', 'packages', package).splitlines():
    raise RuntimeError('Erstinstallation braucht einen frischen Emulator; vorhandene Daten bleiben unberührt')

def diagnose():
    # Bei Fehlern Bildschirmfoto und WebView-Konsole neben die APK legen (keine Geheimnisse: nur Emulator-Wegwerfdaten).
    ziel = apk.parent
    try: (ziel / 'probe-bildschirm.png').write_bytes(subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=subprocess.PIPE, timeout=60).stdout)
    except Exception: pass
    try: (ziel / 'probe-logcat.txt').write_text(subprocess.run(['adb', 'logcat', '-d', '-v', 'brief', 'chromium:V', 'Capacitor:V', 'Capacitor/Console:V', 'AndroidRuntime:E', '*:S'], text=True, stdout=subprocess.PIPE, timeout=60).stdout)
    except Exception: pass

# Nur im Wegwerf-Emulator: Androids „… reagiert nicht“-Dialoge fremder Apps ausblenden (Launcher hängt beim Start).
adb('shell', 'settings', 'put', 'global', 'hide_error_dialogs', '1')
try:
  adb('install', apk); launch()
  deckblatt_weg(ERSTEINRICHTUNG)
  # Wegwerf-Passwort nur für diesen Emulator (nur Buchstaben/Ziffern: „input text" kennt keine Sonderzeichen).
  pw = 'Probe' + secrets.token_hex(3)
  deadline = time.monotonic() + 30
  while len(passwortfelder()) < 2:
      if time.monotonic() > deadline: raise RuntimeError('Passwortfelder der Ersteinrichtung fehlen')
      time.sleep(.5)
  # Der Emulator verliert bei langem „input text“ Zeichen: in kleinen Stücken tippen und jedes Feld nachlesen.
  # 2026-10-29 (0.1.2, erster Versuch): Feld 2 ließ sich viermal nicht füllen, Feld 1 schon; den Nachweis gab es nur als
  # Artefakt. Jetzt drei Wege im Wechsel — Tippen aufs Feld, Tastatur weg und erneut tippen, Tab aus dem Feld davor —
  # und bei Fehlern die Lage aller Felder (Länge, Fokus, Lage) im Protokoll selbst.
  def lage():
      try:
          return [{'laenge': len(n.get('text', '')), 'fokus': n.get('focused'), 'bounds': n.get('bounds')} for n in passwortfelder()]
      except Exception as e:
          return repr(e)
  def gefuellt(i):
      t = passwortfelder()[i].get('text', '')
      return t == pw or (len(t) == len(pw) and set(t) <= set('•●*'))
  protokoll = []
  for i in range(2):
      for versuch in range(6):
          weg = ('tippen', 'tastatur-weg', 'tab')[versuch % 3]
          if weg == 'tastatur-weg':
              adb('shell', 'input', 'keyevent', 'KEYCODE_ESCAPE'); time.sleep(1)
          if weg == 'tab' and i > 0:
              tap(passwortfelder()[i - 1]); time.sleep(1); adb('shell', 'input', 'keyevent', 'KEYCODE_MOVE_END')
              adb('shell', 'input', 'keyevent', 'KEYCODE_TAB'); time.sleep(1)
          else:
              tap(passwortfelder()[i]); time.sleep(1.5)
          adb('shell', 'input', 'keyevent', 'KEYCODE_MOVE_END')
          adb('shell', 'input', 'keyevent', *(['67'] * 30))
          for k in range(0, len(pw), 3):
              adb('shell', 'input', 'text', pw[k:k + 3]); time.sleep(.4)
          time.sleep(.8)
          if gefuellt(i) and (i == 0 or gefuellt(0)): break
          protokoll.append({'feld': i + 1, 'versuch': versuch + 1, 'weg': weg, 'lage': lage()})
      else:
          print('Passwortfelder:', json.dumps(protokoll, ensure_ascii=False), flush=True)
          raise RuntimeError('Passwortfeld %d ließ sich nicht sicher füllen; Lage: %s' % (i + 1, json.dumps(lage())))
  if protokoll: print('Passwortfelder (gefüllt nach Umwegen):', json.dumps(protokoll, ensure_ascii=False), flush=True)
  adb('shell', 'input', 'keyevent', 'KEYCODE_ENTER')
  try:
      wait_node(hat(SHAMIR), 60)
  except RuntimeError:
      # Tastatur fing Enter: den sichtbaren Knopf tippen.
      tap(wait_node(hat(ERSTEINRICHTUNG), 10)); wait_node(hat(SHAMIR), 120)
  adb('shell', 'am', 'force-stop', package)
  adb('install', '-r', apk); launch()
  deckblatt_weg(ENTSPERREN)
  if any(hat(ERSTEINRICHTUNG)(n.attrib) for n in hierarchy().iter('node')):
      raise RuntimeError('Nach dem Überinstallieren erscheint wieder die Ersteinrichtung: Tresor verloren')
except Exception:
    diagnose(); raise
proof = {'applicationId': package, 'apkSha256': digest, 'commit': receipt['commit'], 'versionCode': receipt['versionCode'],
         'api': int(adb('shell', 'getprop', 'ro.build.version.sdk').strip()), 'firstInstall': True, 'reinstallPreservesData': True,
         'developmentProbe': False, 'systemdialogeGesehen': anr_gesehen,
         'probe': 'sichtbare WebView-Oberfläche; Tresor mit Wegwerf-Passwort angelegt; nach Überinstallieren derselben signierten APK „Entsperren" statt Ersteinrichtung; kein Debug-Zugang'}
Path(str(apk) + '.installation.json').write_text(json.dumps(proof, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(proof, ensure_ascii=False))
