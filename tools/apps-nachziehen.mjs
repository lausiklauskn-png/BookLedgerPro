#!/usr/bin/env node
// tools/apps-nachziehen.mjs — Workflow Calculate und Workflow Needs byte-1:1 nach apps/ kopieren (Klaus 2026-10-26:
// „eins zu eins übernehmen … Verbesserungen, die ich in Calculate mache, werden auch in BookLedgerPro nachgezogen").
// Die Brücke: Klaus ändert nur in den Original-Repos; eine Sitzung ruft dieses Skript, prüft (node tests/run.mjs,
// node tests/smoke_apps.mjs), PR. Hier wird NICHTS von Hand geändert — nur index.html bekommt die kontrollierte
// Abweichung aus tools/apps-patch.mjs. Pins (SHA-256 je Datei, Commit) stehen in apps/HERKUNFT.json.
//
//   node tools/apps-nachziehen.mjs                 # Klone unter ../lausiklauskn-png/<repo> (Vorgabe)
//   WC_KLON=/pfad/zu/Workflow-Calculate WN_KLON=/pfad/zu/Workflow-Needs node tools/apps-nachziehen.mjs
//   node tools/apps-nachziehen.mjs --nur calculate
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { patchIndex } from './apps-patch.mjs';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const APPS = {
  calculate: { repo: 'lausiklauskn-png/Workflow-Calculate', env: 'WC_KLON', vorgabe: '../lausiklauskn-png/workflow-calculate', name: 'Workflow Calculate' },
  needs: { repo: 'lausiklauskn-png/Workflow-Needs', env: 'WN_KLON', vorgabe: '../lausiklauskn-png/workflow-needs', name: 'Workflow Needs' },
};
// Nicht kopiert: Entwicklung (tests, tools, docs, .github, package*), Repo-Papiere, der eigene Service Worker.
const AUSGENOMMEN_ORDNER = new Set(['.git', 'node_modules', 'tests', 'tools', 'docs', '.github']);
const AUSGENOMMEN_DATEI = new Set(['package.json', 'package-lock.json', 'README.md', 'CLAUDE.md', 'AGENTS.md', 'sw.js', '.gitignore', '.gitattributes']);

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
function dateien(dir, basis = dir) {
  const out = [];
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!AUSGENOMMEN_ORDNER.has(n)) out.push(...dateien(p, basis)); }
    else if (!AUSGENOMMEN_DATEI.has(n)) out.push(relative(basis, p).split('\\').join('/'));
  }
  return out;
}

export function nachziehen(app, quelle) {
  const a = APPS[app];
  if (!a) throw new Error('unbekannte App ' + app);
  if (!existsSync(join(quelle, 'index.html'))) throw new Error(`${a.name}: ${quelle} ist kein Klon (keine index.html)`);
  let commit = '';
  try { commit = execSync('git rev-parse HEAD', { cwd: quelle, encoding: 'utf8' }).trim(); } catch { commit = ''; }
  const ziel = join(WURZEL, 'apps', app);
  rmSync(ziel, { recursive: true, force: true });
  const eintrag = { repo: a.repo, name: a.name, commit, ordner: 'apps/' + app, dateien: {}, abweichungen: {} };
  for (const rel of dateien(quelle)) {
    const roh = readFileSync(join(quelle, rel));
    let out = roh;
    if (rel === 'index.html') {
      const { html, aenderungen } = patchIndex(roh.toString('utf8'));
      out = Buffer.from(html, 'utf8');
      eintrag.abweichungen[rel] = { quelle: sha(roh), aenderungen };
    }
    mkdirSync(join(ziel, dirname(rel)), { recursive: true });
    writeFileSync(join(ziel, rel), out);
    eintrag.dateien[rel] = sha(out);
  }
  return eintrag;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const nur = (() => { const i = process.argv.indexOf('--nur'); return i > -1 ? process.argv[i + 1] : null; })();
  const pfad = join(WURZEL, 'apps', 'HERKUNFT.json');
  const herkunft = existsSync(pfad) ? JSON.parse(readFileSync(pfad, 'utf8')) : { apps: {} };
  herkunft.hinweis = 'Byte-1:1-Kopien von Workflow Calculate / Workflow Needs; nur index.html trägt die kontrollierte Abweichung (tools/apps-patch.mjs). Nachziehen mit node tools/apps-nachziehen.mjs — nie von Hand ändern.';
  herkunft.stand = new Date().toISOString().slice(0, 10);
  for (const app of Object.keys(APPS)) {
    if (nur && nur !== app) continue;
    const quelle = resolve(WURZEL, process.env[APPS[app].env] || APPS[app].vorgabe);
    const e = nachziehen(app, quelle);
    herkunft.apps[app] = e;
    console.log(`${APPS[app].name}: ${Object.keys(e.dateien).length} Dateien aus ${quelle} (${e.commit.slice(0, 7) || 'ohne Commit'}) → apps/${app}/`);
  }
  writeFileSync(pfad, JSON.stringify(herkunft, null, 2) + '\n');
  console.log('apps/HERKUNFT.json geschrieben.');
}
