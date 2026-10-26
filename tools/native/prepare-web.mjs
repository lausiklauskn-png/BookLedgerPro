// tools/native/prepare-web.mjs — baut das Web-Paket für die native Android-Hülle (Schritt A, Klaus 2026-10-26).
//
// Grundsatz wie in Private Brain Pro und Workflow PDF Pro: eine AUSDRÜCKLICHE Liste, kein rekursives Kopieren des Repos.
// Genommen werden nur Dateien, die Git kennt (git ls-files) — so kann nie ein ungesicherter Schlüssel
// (sbkim/.node-secret.json ist .gitignore), ein Test, ein Brief oder Signiermaterial in die APK geraten.
// Die Web-App bleibt byte-gleich; einzige Abweichung ist index.html: davor hängt die Hülle ihren Klebstoff
// (native/blp-native.js), sonst nichts. Jede Anpassung bricht ab, wenn ihr Anker fehlt (nicht raten).

import { readFile, writeFile, mkdir, rm, lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname, resolve } from 'node:path';

export const root = fileURLToPath(new URL('../../', import.meta.url));
/** Was die laufende App braucht. */
export const LAUFZEIT_DATEIEN = ['index.html', 'manifest.webmanifest', 'sw.js', 'impressum.html', 'datenschutz.html',
  'sicherheit.html', 'LICENSE', 'RECHTE.md', 'THIRD_PARTY.md'];
export const LAUFZEIT_ORDNER = ['src/', 'assets/', 'apps/', 'vendor/', 'sbkim/'];
/** Was nie hinein darf, auch wenn es unter einem Laufzeit-Ordner liegt. */
export const NIE = [/(^|\/)\.node-secret\.json$/, /(^|\/)\.[^/]+$/];
/** Der Klebstoff der Hülle (Repo-Ordner native/). */
export const NATIV = ['blp-native.js'];
export const ANKER = '<script>if (\'serviceWorker\' in navigator) {';

export const sha256 = (b) => createHash('sha256').update(b).digest('hex');

export function istLaufzeit(p) {
  if (NIE.some((re) => re.test(p))) return false;
  return LAUFZEIT_DATEIEN.includes(p) || LAUFZEIT_ORDNER.some((o) => p.startsWith(o));
}

/** Hängt den Klebstoff genau einmal vor die Service-Worker-Anmeldung. Rein, in Node prüfbar. */
export function indexAnpassen(html, nativUrl) {
  const teile = html.split(ANKER);
  if (teile.length !== 2) throw new Error('Anker für den nativen Klebstoff fehlt oder steht mehrfach: ' + ANKER);
  if (html.includes('native/blp-native.js')) throw new Error('index.html trägt den Klebstoff schon');
  return teile[0] + '<script src="' + nativUrl + '"></script>\n  ' + ANKER + teile[1];
}

export function gitDateien(wurzel = root) {
  return execFileSync('git', ['-C', wurzel, 'ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
}

export async function prepareWeb({ wurzel = root, aus = join(root, 'www') } = {}) {
  aus = resolve(aus);
  if (aus !== join(resolve(wurzel), 'www')) throw new Error('Ausgabe nur nach www/');
  const auswahl = gitDateien(wurzel).filter(istLaufzeit).sort();
  if (!auswahl.includes('index.html') || !auswahl.some((p) => p.startsWith('src/'))) throw new Error('Laufzeit-Auswahl unvollständig');
  const inhalt = new Map();
  for (const p of auswahl) {
    if ((await lstat(join(wurzel, p))).isSymbolicLink()) throw new Error('Verweis statt Datei: ' + p);
    inhalt.set(p, await readFile(join(wurzel, p)));
  }
  const nativ = new Map();
  for (const n of NATIV) nativ.set(n, await readFile(join(wurzel, 'native', n)));
  const url = 'native/blp-native.js?v=' + sha256(nativ.get('blp-native.js')).slice(0, 16);
  const html = indexAnpassen(inhalt.get('index.html').toString('utf8'), url);
  inhalt.set('index.html', Buffer.from(html, 'utf8'));

  await rm(aus, { recursive: true, force: true });
  await mkdir(aus, { recursive: true });
  const beleg = { quelle: 'BookLedgerPro', abweichungen: ['index.html: <script> für native/blp-native.js vor der Service-Worker-Anmeldung'], dateien: [] };
  for (const [p, b] of inhalt) {
    await mkdir(dirname(join(aus, p)), { recursive: true });
    await writeFile(join(aus, p), b);
    beleg.dateien.push({ pfad: p, sha256: sha256(b) });
  }
  for (const [n, b] of nativ) {
    await mkdir(join(aus, 'native'), { recursive: true });
    await writeFile(join(aus, 'native', n), b);
    beleg.dateien.push({ pfad: 'native/' + n, sha256: sha256(b) });
  }
  try { beleg.commit = execFileSync('git', ['-C', wurzel, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* ohne Git-Kopf */ }
  await writeFile(join(aus, 'native-bundle.json'), JSON.stringify(beleg, null, 2) + '\n');
  console.log('Natives Web-Paket: ' + beleg.dateien.length + ' Dateien nach www/');
  return beleg;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await prepareWeb();
