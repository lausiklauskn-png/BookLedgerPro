// tools/native/test-native.mjs — Probe der Android-Hülle ohne Android (Schritt A, Klaus 2026-10-26).
// Prüft: das Web-Paket (nur Laufzeit-Dateien, byte-gleich, eine benannte Abweichung), die Verdrahtung Manifest ⟷ PWA,
// die Namen der Brücke und den Klebstoff native/blp-native.js in einer gestellten WebView (vm, Plugins gestellt).
// Rückgabe 0 = alles grün, 1 = mindestens eine rote Zeile.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import vm from 'node:vm';
import { prepareWeb, indexAnpassen, istLaufzeit, root, ANKER, LAUFZEIT_DATEIEN, LAUFZEIT_ORDNER } from './prepare-web.mjs';

let gruen = 0, rot = 0;
const ok = (name, bed, info = '') => { if (bed) { gruen++; console.log('  ✓ ' + name); } else { rot++; console.log('  ✗ ' + name + (info ? '  → ' + info : '')); } };
const sha = (b) => createHash('sha256').update(b).digest('hex');
const lies = (p) => readFileSync(join(root, p));

console.log('— Web-Paket (tools/native/prepare-web.mjs)');
ok('istLaufzeit: App-Dateien ja, Tests/Doku/Briefe/Werkzeuge/Geheimnis nein',
  ['index.html', 'sw.js', 'src/main.js', 'assets/tokens.css', 'apps/calculate/index.html', 'vendor/pdfjs/pdf.min.js', 'sbkim/spore.json'].every(istLaufzeit)
  && ['tests/run.mjs', 'docs/PULS.md', 'BRIEF_SITZUNG_ANDROID-TRESORORDNER.md', 'tools/native/prepare-web.mjs', 'sbkim/.node-secret.json',
      'android/app/build.gradle', 'package.json', '.github/workflows/ci.yml', 'CLAUDE.md'].every((p) => !istLaufzeit(p)));
let wirft = false; try { indexAnpassen('<html></html>', 'x'); } catch { wirft = true; }
ok('indexAnpassen wirft ohne Anker (nicht raten)', wirft);
wirft = false; try { indexAnpassen(ANKER + ANKER, 'x'); } catch { wirft = true; }
ok('indexAnpassen wirft bei doppeltem Anker', wirft);
const beleg = await prepareWeb();
const www = join(root, 'www');
const html = readFileSync(join(www, 'index.html'), 'utf8');
const nativSha = sha(lies('native/blp-native.js')).slice(0, 16);
ok('index.html: Klebstoff genau einmal, vor der Service-Worker-Anmeldung, mit Fingerabdruck', html.split('native/blp-native.js').length === 2
  && html.indexOf('native/blp-native.js?v=' + nativSha) > 0 && html.indexOf('native/blp-native.js') < html.indexOf(ANKER)
  && html.indexOf('native/blp-native.js') < html.indexOf('src/main.js'));
ok('index.html: sonst byte-gleich mit der Quelle', html.replace(/<script src="native\/blp-native\.js\?v=[0-9a-f]{16}"><\/script>\n {2}/, '') === lies('index.html').toString('utf8'));
const alle = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? alle(p) : [p.slice(www.length + 1)]; });
const imPaket = alle(www).filter((p) => p !== 'native-bundle.json').sort();
const fremd = imPaket.filter((p) => !(LAUFZEIT_DATEIEN.includes(p) || LAUFZEIT_ORDNER.some((o) => p.startsWith(o)) || p === 'native/blp-native.js'));
ok('im Paket liegt nur Laufzeit (keine Tests, Doku, Briefe, Werkzeuge)', fremd.length === 0, fremd.slice(0, 5).join(', '));
ok('kein privater Knoten-Schlüssel, keine versteckte Datei im Paket', !imPaket.some((p) => /(^|\/)\./.test(p)));
const abweichend = imPaket.filter((p) => p !== 'index.html' && !p.startsWith('native/') && sha(readFileSync(join(www, p))) !== sha(lies(p)));
ok('jede übrige Datei byte-gleich mit dem Repo (' + (imPaket.length - 2) + ' Dateien)', abweichend.length === 0, abweichend.slice(0, 5).join(', '));
ok('Beleg native-bundle.json nennt jede Datei mit SHA-256 und genau eine Abweichung', beleg.dateien.length === imPaket.length
  && beleg.dateien.every((d) => sha(readFileSync(join(www, d.pfad))) === d.sha256) && beleg.abweichungen.length === 1);
ok('src/, assets/, apps/, vendor/, sbkim/ sind dabei', ['src/main.js', 'sw.js', 'manifest.webmanifest'].every((p) => imPaket.includes(p))
  && LAUFZEIT_ORDNER.every((o) => imPaket.some((p) => p.startsWith(o))));

console.log('— Verdrahtung Hülle ⟷ PWA');
const cap = JSON.parse(lies('capacitor.config.json'));
const gradle = lies('android/app/build.gradle').toString('utf8');
ok('Paketname de.familyprojekt.bookledgerpro (Klaus: Frage 3), webDir www', cap.appId === 'de.familyprojekt.bookledgerpro' && cap.webDir === 'www'
  && gradle.includes('applicationId "de.familyprojekt.bookledgerpro"') && gradle.includes('namespace = "de.familyprojekt.bookledgerpro"'));
ok('Service-Worker in der Hülle erlaubt, kein Klartext-Netz, kein Fern-Debugging', cap.android.resolveServiceWorkerRequests === true && cap.android.allowMixedContent === false && cap.android.webContentsDebuggingEnabled === false);
const man = JSON.parse(lies('manifest.webmanifest'));
const pwaMime = new Set(man.share_target.params.files[0].accept.filter((a) => a.includes('/')));
const am = lies('android/app/src/main/AndroidManifest.xml').toString('utf8');
const send = am.slice(am.indexOf('android.intent.action.SEND"'), am.indexOf('android.intent.action.VIEW"'));
const sendMime = new Set([...send.matchAll(/android:mimeType="([^"]+)"/g)].map((m) => m[1]));
ok('Teilen-Arten nativ = share_target der PWA (' + [...pwaMime].join(', ') + ')', pwaMime.size === sendMime.size && [...pwaMime].every((m) => sendMime.has(m)), [...sendMime].join(', '));
ok('„Öffnen mit" (VIEW, nur content:) für dieselben Arten', /action\.VIEW"[\s\S]*?scheme="content"[\s\S]*?message\/rfc822/.test(am));
ok('keine Sicherung des App-Speichers durch Android (Buchhaltungsdaten), kein Klartext', am.includes('android:allowBackup="false"') && am.includes('android:usesCleartextTraffic="false"'));
const fp = lies('android/app/src/main/res/xml/file_paths.xml').toString('utf8');
ok('FileProvider gibt nur den Teilen-Zwischenspeicher frei', /<cache-path name="share" path="share\/"/.test(fp) && !/external-path|files-path|root-path/.test(fp));
const java = (n) => lies('android/app/src/main/java/de/familyprojekt/bookledgerpro/' + n + '.java').toString('utf8');
const mainA = java('MainActivity');
ok('MainActivity meldet beide Brücken an', mainA.includes('registerPlugin(BlpIncomingPlugin.class)') && mainA.includes('registerPlugin(BlpFilesPlugin.class)'));
ok('fremde Adressen nie im App-Fenster (Link-Schutz)', /"localhost"\.equals\(uri\.getHost\(\)\)/.test(mainA) && /return true;\s*}\s*}\);/.test(mainA));
const nativJs = lies('native/blp-native.js').toString('utf8');
ok('Namen der Brücken stimmen (BlpIncoming, BlpFiles)', java('BlpIncomingPlugin').includes('name="BlpIncoming"') && java('BlpFilesPlugin').includes('name = "BlpFiles"')
  && nativJs.includes('P.BlpIncoming') && nativJs.includes('P.BlpFiles'));
ok('Eingang nimmt nur content:-Adressen aus dem Intent (nie aus JS)', java('IncomingFiles').includes('"content".equals(uri.getScheme())') && !java('BlpIncomingPlugin').includes('getString("uri")'));

console.log('— Klebstoff native/blp-native.js in einer gestellten WebView');
function welt({ nativ = true, batch = null, chunk = 4, webviewQueue = false } = {}) {
  const log = [];
  const listener = [];
  const daten = new Map();
  if (batch && batch.files) for (const f of batch.files) daten.set(f.id, Buffer.from(f.inhalt));
  let gelesen = new Map();
  const Eingang = {
    pending: async () => { log.push('pending'); const b = batch; return b ? { id: b.id, files: b.files?.map(({ id, name, mime }) => ({ id, name, mime })), problem: b.problem } : { empty: true }; },
    read: async ({ batch: id, id: fid, offset }) => {
      const roh = daten.get(fid); const stueck = roh.subarray(offset, offset + chunk);
      gelesen.set(fid, offset + stueck.length);
      return { data: stueck.toString('base64'), done: offset + stueck.length >= roh.length };
    },
    acknowledge: async (a) => { log.push('ack:' + a.id + ':' + a.discard); batch = null; },
    history: async () => ({ receipts: [] }), discardArchived: async () => {},
    addListener: (n, f) => { listener.push(f); },
  };
  const Dateien = { save: async (a) => { log.push(['save', a]); return { saved: true }; }, share: async (a) => { log.push(['share', a]); return { shared: true }; } };
  const angehaengt = [];
  const doc = {
    documentElement: { setAttribute: (k, v) => log.push('attr:' + k + '=' + v) },
    body: { appendChild: (d) => angehaengt.push(d) },
    createElement: () => ({ setAttribute() {}, style: {}, remove() {} }),
    _klick: [], addEventListener(t, f, cap) { if (t === 'click') this._klick.push([f, cap]); },
  };
  class FR { readAsDataURL(b) { b.arrayBuffer().then((ab) => { this.result = 'data:' + (b.type || '') + ';base64,' + Buffer.from(ab).toString('base64'); this.onload(); }); } }
  const ctx = {
    console, Promise, Uint8Array, Date, Error, JSON, Object, String, Array, Math,
    File, Blob, FileReader: FR, DOMException,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    setTimeout: () => 0,
    navigator: {}, document: doc,
    fetch: async (href) => ({ blob: async () => new Blob([Buffer.from('Sicherung ' + href)], { type: 'application/json' }) }),
    Capacitor: nativ ? { isNativePlatform: () => true, Plugins: { BlpIncoming: Eingang, BlpFiles: Dateien } } : undefined,
  };
  ctx.window = ctx;
  // Wie neuere Android-WebViews: ein eigenes launchQueue, das nie etwas liefert (nur lesbar, wie in Chromium).
  if (webviewQueue) Object.defineProperty(ctx, 'launchQueue', { get: () => ({ setConsumer() { /* liefert nie */ } }), configurable: true, enumerable: true });
  vm.createContext(ctx);
  vm.runInContext(nativJs, ctx);
  return { ctx, log, listener, doc, angehaengt, gelesen };
}
const warte = () => new Promise((r) => setTimeout(r, 20));

const aus = welt({ nativ: false });
ok('im Browser (ohne Capacitor) tut der Klebstoff nichts', !('launchQueue' in aus.ctx) && !aus.ctx.navigator.share && aus.doc._klick.length === 0 && !aus.ctx.BLPNative);

const inhaltA = 'Rechnung %PDF-1.7 ' + 'x'.repeat(10), inhaltB = 'From: a@b\r\n\r\nHallo';
const w = welt({ batch: { id: 'B1', files: [{ id: 'f1', name: 'Rechnung.pdf', mime: 'application/pdf', inhalt: inhaltA }, { id: 'f2', name: 'Mail.eml', mime: 'message/rfc822', inhalt: inhaltB }] } });
ok('in der App: launchQueue steht bereit, bevor src/ui/shell.js es fragt', 'launchQueue' in w.ctx && typeof w.ctx.launchQueue.setConsumer === 'function');
let erhalten = null;
w.ctx.launchQueue.setConsumer(async (p) => { erhalten = await Promise.all(p.files.map((h) => h.getFile())); });
await warte(); await warte();
ok('Teilen: beide Dateien kommen als File an (Name, Art, Inhalt Byte für Byte, in Stücken gelesen)', erhalten && erhalten.length === 2
  && erhalten[0].name === 'Rechnung.pdf' && erhalten[0].type === 'application/pdf' && erhalten[1].name === 'Mail.eml'
  && Buffer.from(await erhalten[0].arrayBuffer()).toString() === inhaltA && Buffer.from(await erhalten[1].arrayBuffer()).toString() === inhaltB);
const ackIdx = w.log.findIndex((x) => x === 'ack:B1:false');
ok('erst übergeben, dann quittiert — archiviert, nicht gelöscht (Rückweg)', ackIdx > 0 && !w.log.includes('ack:B1:true'));

// Befund am Tablet (2026-10-28): die WebView hatte ein eigenes, totes launchQueue — der Klebstoff schaltete sich ab.
const wv = welt({ webviewQueue: true, batch: { id: 'B3', files: [{ id: 'f3', name: 'Mail.eml', mime: 'message/rfc822', inhalt: inhaltB }] } });
let wvErhalten = null;
wv.ctx.launchQueue.setConsumer(async (q) => { wvErhalten = await Promise.all(q.files.map((h) => h.getFile())); });
await warte(); await warte();
ok('WebView mit eigenem launchQueue: der App-Eingang gilt trotzdem, die geteilte Mail kommt an und wird quittiert',
  wvErhalten && wvErhalten.length === 1 && wvErhalten[0].name === 'Mail.eml' && wv.log.includes('ack:B3:false'));

const p = welt({ batch: { id: 'B2', problem: true } });
let gerufen = false;
p.ctx.launchQueue.setConsumer(() => { gerufen = true; });
await warte(); await warte();
ok('kaputte Übergabe: nichts eingelesen, Hinweis gezeigt, Eintrag verworfen', !gerufen && p.log.includes('ack:B2:true') && p.angehaengt.length === 1);

const s = welt();
const datei = new File([Buffer.from('%PDF angebot')], 'Angebot.workfloh.json', { type: 'application/json' });
ok('Teilen hinaus: canShare nur für genau eine Datei', s.ctx.navigator.canShare({ files: [datei] }) && !s.ctx.navigator.canShare({ files: [datei, datei] }) && !s.ctx.navigator.canShare({ text: 'x' }));
await s.ctx.navigator.share({ files: [datei], title: 'Angebot' });
const geteilt = s.log.find((x) => Array.isArray(x) && x[0] === 'share');
ok('… navigator.share gibt Name, Art, Titel und den Inhalt an Androids Teilen', geteilt && geteilt[1].name === 'Angebot.workfloh.json' && geteilt[1].mime === 'application/json'
  && geteilt[1].title === 'Angebot' && Buffer.from(geteilt[1].data, 'base64').toString() === '%PDF angebot');

let verhindert = false, gestoppt = false;
const a = { href: 'blob:https://localhost/123', getAttribute: (k) => (k === 'download' ? 'BLP-Sicherung-2026-10-26.json' : null) };
const ereignis = { target: { closest: (sel) => (sel === 'a[download]' ? a : null) }, preventDefault() { verhindert = true; }, stopImmediatePropagation() { gestoppt = true; } };
ok('Speichern: ein Zuhörer in der Erfassungsphase (fängt auch a.click() aus downloadBlob)', s.doc._klick.length === 1 && s.doc._klick[0][1] === true);
s.doc._klick[0][0](ereignis);
await warte(); await warte();
const gespeichert = s.log.find((x) => Array.isArray(x) && x[0] === 'save');
ok('… Tipp auf <a download> geht an Androids Speichern-Dialog (Name, Art, Inhalt), der Browser-Weg ist gesperrt', verhindert && gestoppt && gespeichert
  && gespeichert[1].name === 'BLP-Sicherung-2026-10-26.json' && gespeichert[1].mime === 'application/json'
  && Buffer.from(gespeichert[1].data, 'base64').toString() === 'Sicherung blob:https://localhost/123');
const ohne = { target: { closest: () => null }, preventDefault() { throw new Error('nein'); }, stopImmediatePropagation() {} };
let ruhig = true; try { s.doc._klick[0][0](ohne); } catch { ruhig = false; }
ok('… gewöhnliche Tipps bleiben unberührt', ruhig);

console.log('— Tresorordner (Schritt C): gemeinsames Paket und Brücke');
const { pruefen: tresorPruefen } = await import('./tresor-nachziehen.mjs');
const tresorFehler = tresorPruefen();
ok('Paket de.familyprojekt.tresor byte-gleich mit Workflow PDF Pro (Herkunft gepinnt, VaultCrypto-Rumpf)', tresorFehler.length === 0, tresorFehler.join('; '));
const plugin = lies('android/app/src/main/java/de/familyprojekt/bookledgerpro/BlpTresorPlugin.java').toString('utf8');
const mainAct = lies('android/app/src/main/java/de/familyprojekt/bookledgerpro/MainActivity.java').toString('utf8');
ok('MainActivity meldet BlpTresorPlugin an', mainAct.includes('registerPlugin(BlpTresorPlugin.class);'));
ok('Passwort nur im nativen Dialog: das Plugin liest kein Passwort aus der WebView', !/getString\("pass/i.test(plugin) && !/getString\("kennwort/i.test(plugin) && /InputType\.TYPE_TEXT_VARIATION_PASSWORD/.test(plugin));
ok('Plugin löscht nichts im Ordner (kein deleteDocument/loeschen), schreibt nur über TresorOrdner', !/deleteDocument|\.loeschen\(/.test(plugin) && /offen\.ablegen\(/.test(plugin));
ok('App schreibt als bookledgerpro; Merken im Android-Schlüsselspeicher (AES-GCM, an Kennung gebunden)', /APP = Fach\.BOOKLEDGER_APP/.test(plugin) && /AndroidKeyStore/.test(plugin) && /geraetAad\(t\.id\(\)\)/.test(plugin));
const nat = lies('native/blp-native.js').toString('utf8');
ok('Klebstoff: kein Passwort geht durch JavaScript (anlegen/entsperren/ändern ohne Passwort-Feld)', !/passwort\s*:/i.test(nat) && /T\.anlegen\(\{ merken: !!merken \}\)/.test(nat) && /T\.entsperren\(\{ merken: !!merken \}\)/.test(nat));
const w4 = welt();
ok('ohne Tresor-Plugin: BLPNative.tresor ist null (Web-App zeigt die Ansicht nicht)', w4.ctx.BLPNative && w4.ctx.BLPNative.tresor === null);

console.log(`\n${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
