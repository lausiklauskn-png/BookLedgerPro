// windows/tools/build-web.mjs — Oberfläche der Windows-Hülle: dasselbe native Web-Paket wie Android (tools/native/prepare-web.mjs,
// nur Dateien aus git ls-files), dazu das eigene Dialog-Fenster der Hülle. Die Web-App selbst bleibt unverändert.
import {cp,rm,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),windows=join(root,'windows'),dist=join(windows,'dist');
execFileSync(process.execPath,[join(root,'tools/native/prepare-web.mjs')],{cwd:root,stdio:'inherit'});
await rm(dist,{recursive:true,force:true});await cp(join(root,'www'),dist,{recursive:true});
await mkdir(join(dist,'windows'),{recursive:true});
await cp(join(windows,'dialog'),join(dist,'windows/dialog'),{recursive:true});
console.log('Windows-Oberfläche aus dem gemeinsamen nativen Web-Paket vorbereitet.');
