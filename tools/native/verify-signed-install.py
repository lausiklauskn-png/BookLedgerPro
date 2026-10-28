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

def hierarchy():
    adb('shell', 'uiautomator', 'dump', '--compressed', '/sdcard/blp-release-probe.xml')
    return ET.fromstring(adb('exec-out', 'cat', '/sdcard/blp-release-probe.xml'))

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
        for a in knoten:
            if hat(DECKBLATT)(a):
                b = list(map(int, re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', a['bounds']).groups()))
                if b[3] - b[1] > 4: tap(a)
                else: adb('shell', 'input', 'swipe', 500, 1500, 500, 400, 300)
                break
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
  for i in range(2):
      for versuch in range(4):
          feld = passwortfelder()[i]; tap(feld); time.sleep(1.5)
          adb('shell', 'input', 'keyevent', 'KEYCODE_MOVE_END')
          adb('shell', 'input', 'keyevent', *(['67'] * 30))
          for k in range(0, len(pw), 3):
              adb('shell', 'input', 'text', pw[k:k + 3]); time.sleep(.4)
          time.sleep(.8)
          t = passwortfelder()[i].get('text', '')
          if t == pw or (len(t) == len(pw) and set(t) <= set('•●*')): break
      else:
          raise RuntimeError('Passwortfeld %d ließ sich nicht sicher füllen' % (i + 1))
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
         'developmentProbe': False,
         'probe': 'sichtbare WebView-Oberfläche; Tresor mit Wegwerf-Passwort angelegt; nach Überinstallieren derselben signierten APK „Entsperren" statt Ersteinrichtung; kein Debug-Zugang'}
Path(str(apk) + '.installation.json').write_text(json.dumps(proof, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(proof, ensure_ascii=False))
