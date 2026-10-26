// tools/mint_spore.mjs
// Headless-Minter einer ECHTEN SBKIM-Identität + Spore (INTERFACES §11), zero-dep,
// nutzt EXAKT dieselbe Logik wie die In-App-Erzeugung (src/sbkim/spore.js,
// nodeProfile.js) → byte-identische, kanonisch signierte Spore. Nur der Ort der
// Schlüssel-Erzeugung unterscheidet sich von der App (dort: Browser, Tresor).
//
// Erzeugt:
//   sbkim/spore.json        (öffentlich, committen — VALID gegen verify_remote_spore.mjs)
//   sbkim/SIGNAL.json       (öffentlich, committen — Briefkasten-Aushang §11.6)
//   sbkim/.node-secret.json (PRIVATER Schlüssel als JWK — NIE committen, .gitignore)
//
// WICHTIG (Krypto-Disziplin, CLAUDE.md #4): der private Schlüssel ist die Identität
// des Knotens. .node-secret.json ist der einzige Weg, ihn später zu rotieren oder in
// den App-Tresor zu importieren. Sichern und aus der Hand des Containers nehmen!
//
// Nutzung:
//   node tools/mint_spore.mjs            # mintet, verweigert Überschreiben bestehender Spore
//   node tools/mint_spore.mjs --force    # überschreibt vorhandene sbkim/spore.json

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { webcrypto as crypto } from 'node:crypto';

// node:crypto-WebCrypto global verfügbar machen, damit src/core/crypto.js läuft.
if (!globalThis.crypto) globalThis.crypto = crypto;

const { generateKeyPair, buildSpore, verifySpore, nodeId } = await import('../src/sbkim/spore.js');
const { demoVector } = await import('../src/sbkim/domainvector.js');
const { buildSignal } = await import('../src/sbkim/signal.js');
const { NODE_PROFILE, KEYWORDS } = await import('../src/sbkim/nodeProfile.js');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SBKIM = join(ROOT, 'sbkim');
const SPORE_PATH = join(SBKIM, 'spore.json');
const SIGNAL_PATH = join(SBKIM, 'SIGNAL.json');
const SECRET_PATH = join(SBKIM, '.node-secret.json');

async function main() {
  const force = process.argv.includes('--force');
  if (existsSync(SPORE_PATH) && !force) {
    console.error('✗ sbkim/spore.json existiert bereits. Mit --force überschreiben (Identität wechselt!).');
    process.exit(2);
  }

  const keys = await generateKeyPair();
  const spore = await buildSpore(keys, { ...NODE_PROFILE, domainVector: demoVector(KEYWORDS) });
  const id = await nodeId(keys.publicKey);
  const signal = buildSignal({
    nodeId: id, seq: 1,
    headline: 'BookLedgerPro-Knoten geboren (verified-spore-Andock).', forNodes: ['*'],
  });

  // Privaten Schlüssel exportierbar sichern (JWK) — NUR lokal, gitignored.
  const privJwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
  const pubJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);

  writeFileSync(SPORE_PATH, JSON.stringify(spore, null, 2) + '\n');
  writeFileSync(SIGNAL_PATH, JSON.stringify(signal, null, 2) + '\n');
  writeFileSync(SECRET_PATH, JSON.stringify({ nodeId: id, privJwk, pubJwk, _warn: 'PRIVATER SBKIM-Schlüssel — NIE committen. In den App-Tresor importieren oder sicher verwahren.' }, null, 2) + '\n');

  // Selbst-Beweis: eigene Spore muss VALID sein.
  const v = await verifySpore(JSON.parse(readFileSync(SPORE_PATH, 'utf8')));
  console.log('nodeId   :', id);
  console.log('endpoint :', spore.endpoint);
  console.log('Spore     →', SPORE_PATH);
  console.log('SIGNAL    →', SIGNAL_PATH);
  console.log('Secret    →', SECRET_PATH, '(gitignored — sichern!)');
  console.log(v.valid ? '\n✔ Selbst-Verifikation VALID' : '\n✗ Selbst-Verifikation UNGÜLTIG: ' + v.errors.join(', '));
  process.exit(v.valid ? 0 : 1);
}

main();
