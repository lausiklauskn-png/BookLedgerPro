// src/domain/selbsttest.js
// In-App-Selbstdiagnose: prüft die Kern-Engine OFFLINE (ohne Netz, ohne Tresor-Entsperrung,
// ohne IndexedDB) anhand deterministischer Demo-/Prüfdaten und meldet je Prüfung ✓/✗.
// Ziel: „in die Hand nehmen und sehen, ob es funktioniert." Spiegelt die Node-Tests im Browser.

import { randomBytes, encryptWithPassword, decryptWithPassword } from '../core/crypto.js';
import { splitSecret, combineShares, encodeShare, decodeShare } from '../core/shamir.js';
import { hashBuchung, verifyChain, GENESIS } from './audit.js';
import { parseEuroToCents, formatCents } from './money.js';
import { computeEUR } from './taxes.js';
import { summenSaldenliste, anlageEUR } from './berichte.js';
import { buildUstVa } from './export.js';
import { gdpduCsvBuchungen } from './gdpdu.js';
import { demoMandant, demoExportDateien } from './demodaten.js';
import { zipFiles } from '../core/zip.js';
import { backupRoundtripSelbsttest, buildBackupFromSnapshot, readBackup } from '../core/backup.js';

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Führt alle Selbsttests aus.
 * @returns {Promise<{gesamt:number, bestanden:number, ok:boolean, ergebnisse:Array<{name,ok,detail}>}>}
 */
export async function runSelbsttest() {
  const ergebnisse = [];
  const add = (name, ok, detail = '') => ergebnisse.push({ name, ok: !!ok, detail });

  // 1) Verschlüsselung (AES-GCM): Klartext → Chiffre → Klartext.
  try {
    const klar = 'Beleg 1.234,56 € — vertraulich';
    const pkg = await encryptWithPassword('Test-Passwort-123', klar);
    const zurueck = await decryptWithPassword('Test-Passwort-123', pkg);
    add('Verschlüsselung (AES-GCM Roundtrip)', zurueck === klar);
    // Falsches Passwort darf NICHT entschlüsseln.
    let abgelehnt = false;
    try { await decryptWithPassword('falsch', pkg); } catch { abgelehnt = true; }
    add('Verschlüsselung lehnt falsches Passwort ab', abgelehnt);
  } catch (e) { add('Verschlüsselung (AES-GCM Roundtrip)', false, String(e.message || e)); }

  // 2) Schlüssel-Sicherung (Shamir 2-von-3): aus 2 Teilen rekonstruierbar.
  try {
    const secret = randomBytes(32);
    const shares = splitSecret(secret, 3, 2).map((s) => encodeShare(s, 2));
    const wieder = combineShares([shares[0], shares[2]].map(decodeShare));
    add('Schlüssel-Sicherung (Shamir 2-von-3)', bytesEqual(secret, wieder));
  } catch (e) { add('Schlüssel-Sicherung (Shamir 2-von-3)', false, String(e.message || e)); }

  // 3) GoBD-Hash-Kette: zwei verkettete Buchungen verifizieren.
  try {
    const b1 = { datum: '2026-01-01', seq: 1, zeilen: [{ konto: '1200', seite: 'S', betrag: 100 }, { konto: '8200', seite: 'H', betrag: 100 }] };
    b1.prevHash = GENESIS; b1.hash = await hashBuchung(b1, GENESIS);
    const b2 = { datum: '2026-01-02', seq: 2, zeilen: [{ konto: '4980', seite: 'S', betrag: 50 }, { konto: '1200', seite: 'H', betrag: 50 }] };
    b2.prevHash = b1.hash; b2.hash = await hashBuchung(b2, b1.hash);
    const v = await verifyChain([b1, b2]);
    add('GoBD-Hash-Kette (lückenlos & unverändert)', v.ok);
    // Manipulation muss auffallen.
    const manipuliert = { ...b2, zeilen: [{ konto: '4980', seite: 'S', betrag: 999 }, { konto: '1200', seite: 'H', betrag: 999 }] };
    const v2 = await verifyChain([b1, manipuliert]);
    add('GoBD-Hash-Kette erkennt Manipulation', !v2.ok);
  } catch (e) { add('GoBD-Hash-Kette', false, String(e.message || e)); }

  // 4) Geld/Rundung: deutsche Eingabe ↔ Cent.
  try {
    const ok = parseEuroToCents('1.234,56') === 123456 && parseEuroToCents('0,07') === 7 && formatCents(123456) === '1.234,56';
    add('Geldbeträge cent-genau (de-Format)', ok);
  } catch (e) { add('Geldbeträge cent-genau (de-Format)', false, String(e.message || e)); }

  // 5) Buchhaltungs-Engine an Demo-Daten (Konsistenz, deckt USt/EÜR/SuSa/GDPdU ab).
  try {
    const m = demoMandant('klein');
    const idx = {}; for (const k of m.konten) idx[k.nummer] = k;
    const p = { von: '2026-01-01', bis: '2026-12-31' };
    const susa = summenSaldenliste(m.buchungen, idx, p);
    add('Doppelte Buchführung (SuSa Soll = Haben)', susa.summen.soll === susa.summen.haben && susa.summen.soll > 0, `Soll/Haben ${formatCents(susa.summen.soll)}`);
    const va = buildUstVa(m.buchungen, idx, p);
    add('USt-VA Zahllast (Demo „klein") = 159,00 €', va.kz83 === 15900, `Kz83 ${formatCents(va.kz83)}`);
    const eur = computeEUR(m.buchungen, idx, p);
    const aeur = anlageEUR(m.buchungen, idx, p);
    add('EÜR == Anlage-EÜR (Überschuss)', eur.ueberschuss === aeur.ueberschuss, `Überschuss ${formatCents(eur.ueberschuss)}`);
    const zeilen = gdpduCsvBuchungen(m.buchungen, idx, p).split('\r\n').length;
    add('GoBD/GDPdU-Tabelle vollständig (24 Zeilen)', zeilen === 24, `${zeilen} Zeilen`);
  } catch (e) { add('Buchhaltungs-Engine (Demo)', false, String(e.message || e)); }

  // 6) Export-Pipeline: Demo-Paket als ZIP baubar (alle Formate).
  try {
    const zip = zipFiles(demoExportDateien(demoMandant('klein')));
    add('Export-Pipeline (Demo-ZIP, alle Formate)', zip[0] === 0x50 && zip[1] === 0x4b && zip.length > 500, `${zip.length} Bytes`);
  } catch (e) { add('Export-Pipeline (Demo-ZIP)', false, String(e.message || e)); }

  // 7) Datensicherung: Backup→Restore-Roundtrip BYTE-GENAU — Pflicht #1 (Datendurabilität).
  // Beweist, dass die Rettung wirklich funktioniert: Snapshot → verschlüsseltes Backup →
  // entschlüsseln → Probespeicher-Import → byte-genauer Vergleich mit dem Original.
  try {
    const probeSnapshot = {
      kv: {
        mode: 'profi', gewinnermittlung: 'euer', nutzungsmodus: 'firma',
        firma: { name: 'Muster GmbH', anschrift: 'Weg 1, 12345 Berlin', iban: 'DE00 0000 0000 0000 0000 00' },
      },
      records: [
        { id: 'k-1200', type: 'konto', nummer: '1200', name: 'Bank', art: 'aktiv' },
        { id: 'b-1', type: 'buchung', seq: 1, datum: '2026-01-01', beschreibung: 'Beleg „Ä/Ö/Ü ß €" ✓',
          zeilen: [{ konto: '1200', seite: 'S', betrag: 11900 }, { konto: '8400', seite: 'H', betrag: 10000 }, { konto: '1776', seite: 'H', betrag: 1900 }] },
      ],
      files: [
        { id: 'f-1', name: 'beleg.pdf', sealed: { v: 1, iv: 'AAAAAAAAAAAAAAAA', ct: 'QkxQUi1CQUNLVVA' } },
      ],
    };
    const rt = await backupRoundtripSelbsttest(probeSnapshot, 'Selbsttest-Backup-Passwort-123');
    add('Datensicherung: Backup→Restore-Roundtrip (byte-genau)', rt.ok,
      rt.fehler || `${rt.bytesOriginal} Byte identisch wiederhergestellt`);
    // Restore mit falschem Passwort muss scheitern (Krypto-Schutz auch bei der Rettung).
    let restoreAbgelehnt = false;
    try {
      const txt = await buildBackupFromSnapshot(probeSnapshot, 'Passwort-A');
      await readBackup('Passwort-B', txt);
    } catch { restoreAbgelehnt = true; }
    add('Datensicherung: Restore lehnt falsches Passwort ab', restoreAbgelehnt);
  } catch (e) { add('Datensicherung: Backup→Restore-Roundtrip', false, String(e.message || e)); }

  const bestanden = ergebnisse.filter((r) => r.ok).length;
  return { gesamt: ergebnisse.length, bestanden, ok: bestanden === ergebnisse.length, ergebnisse };
}
