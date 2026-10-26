// src/ui/datensicherung.js
// Gemeinsame Datensicherungs-UX (BAUPLAN Block 1/Schritt 3): prominente Backup-/
// Restore-Aktionen, Drag-and-drop-Restore und die Einstellungs-Sektion für die
// `backupStrategie` (Download vs. gemerkter Zielordner). Wird von der App-Shell, dem
// Dashboard (prominente Karte) und den Einstellungen genutzt — eine Quelle, kein Duplikat.
//
// Datendurabilität ist Pflicht-Feature #1 (CLAUDE.md Regel #2). Die reine Ziel-/
// Strategie-Logik liegt node-getestet in `domain/backupStrategie.js`; dieses Modul ist
// die DOM-/IndexedDB-Verdrahtung (statisch geprüft, kein Headless-Browser).

import { el } from './dom.js';
import { t } from './i18n.js';
import { getSettings, updateSettings } from '../state.js';
import { exportBackupSmart, readBackup, importSnapshot } from '../core/backup.js';
import { pickFile, readFileText, supportsDirectoryPicker, pickDirectory } from '../core/files.js';
import { merkeBackupOrdner, ladeBackupOrdner, vergissBackupOrdner } from '../core/backupOrdner.js';
import { BACKUP_STRATEGIEN, normalizeBackupStrategie, istBackupDatei } from '../domain/backupStrategie.js';

// Nach einer Sicherung/Wiederherstellung aufzurufen (z. B. Durabilitäts-Banner/Ansicht
// auffrischen). Die Shell registriert ihren refreshDurability hier.
let _onAfter = () => {};
export function onDatensicherungAktion(fn) { _onAfter = typeof fn === 'function' ? fn : () => {}; }

// ---- Aktionen ---------------------------------------------------------------

/** Backup jetzt: Passwort abfragen → strategie-bewusst exportieren → Ergebnis melden. */
export async function backupJetzt() {
  const pwd = prompt(t('lock.password'));
  if (!pwd) return;
  try {
    const r = await exportBackupSmart(pwd, getSettings().backupStrategie);
    if (r.ziel === 'ordner') {
      alert(t('backup.savedFolder').replace('{ordner}', r.ordner).replace('{name}', r.name));
    } else {
      alert(t('backup.savedDownload').replace('{name}', r.name));
    }
    _onAfter();
  } catch (e) { alert(String((e && e.message) || e)); }
}

/** Wiederherstellen aus einer konkreten Datei (auch per Drag-and-drop). */
export async function restoreAusDatei(file) {
  if (!file) return;
  let text;
  try { text = await readFileText(file); }
  catch (e) { alert(String((e && e.message) || e)); return; }

  // Freundlicher Vorfilter, BEVOR das Passwort abgefragt wird (reine Heuristik).
  if (!istBackupDatei({ name: file.name, text }) && !confirm(t('backup.notBackupConfirm'))) return;

  const pwd = prompt(t('lock.password'));
  if (!pwd) return;
  try {
    const snap = await readBackup(pwd, text);
    const res = await importSnapshot(snap, 'merge');
    alert(t('backup.restoreOk').replace('{records}', String(res.records)).replace('{files}', String(res.files)));
    _onAfter();
  } catch (e) { alert(String((e && e.message) || e)); }
}

/** Wiederherstellen über Dateiauswahl. */
export async function restoreWaehlen() {
  const file = await pickFile('.json,.blpr.json,application/json');
  if (file) await restoreAusDatei(file);
}

// ---- Prominente Karte (Dashboard) + Drag-and-drop ---------------------------

/**
 * Prominente „Datensicherung"-Karte: gut sichtbare Backup-/Restore-Knöpfe plus eine
 * Drag-and-drop-Zone für Restore (eine Sicherungsdatei hineinziehen). Gibt ein DOM-
 * Element zurück; mehrfach instanziierbar.
 */
export function datensicherungKarte() {
  const zone = el('div', {
    class: 'card backup-card', 'data-dropzone': '1',
    'aria-label': t('backup.cardTitle'),
  }, [
    el('div', { class: 'backup-card-head' }, [
      el('strong', { text: '🛟 ' + t('backup.cardTitle') }),
      el('span', { class: 'muted small', text: t('backup.cardHint') }),
    ]),
    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-primary', text: t('backup.now'), onClick: backupJetzt }),
      el('button', { class: 'btn', text: t('backup.restore'), onClick: restoreWaehlen }),
    ]),
    el('p', { class: 'muted small backup-drop-hint', text: t('backup.dropHint') }),
  ]);

  // Drag-and-drop-Restore: eine Datei in die Karte ziehen → wiederherstellen.
  const enter = (e) => { e.preventDefault(); zone.classList.add('drag-over'); };
  const leave = (e) => { e.preventDefault(); zone.classList.remove('drag-over'); };
  zone.addEventListener('dragover', enter);
  zone.addEventListener('dragenter', enter);
  zone.addEventListener('dragleave', leave);
  zone.addEventListener('drop', async (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) await restoreAusDatei(file);
  });
  return zone;
}

// ---- Einstellungs-Sektion (Strategie + gemerkter Ordner) --------------------

/**
 * Einstellungs-Sektion für die Datensicherung: Strategie (Download/Ordner),
 * Zielordner-Wahl (nur wenn File System Access verfügbar) und die Standard-Knöpfe.
 */
export function backupEinstellungen() {
  const host = el('div', { class: 'setting' });
  const apiDa = supportsDirectoryPicker();

  const seg = (current, onPick) => el('div', { class: 'segmented' },
    BACKUP_STRATEGIEN.map((val) => el('button', {
      class: 'seg' + (current === val ? ' active' : ''),
      text: t('backup.strategie.' + val),
      onClick: () => onPick(val),
    })));

  const render = async () => {
    const s = getSettings();
    const strategie = normalizeBackupStrategie(s.backupStrategie);
    let ordnerName = null;
    try { const h = await ladeBackupOrdner(); ordnerName = h ? h.name : null; } catch { ordnerName = null; }

    const kinder = [
      el('div', { class: 'setting-label', text: t('settings.backup.title') }),
      seg(strategie, async (v) => { await updateSettings({ backupStrategie: v }); render(); }),
      el('p', { class: 'muted small', text: t('settings.backup.hint') }),
    ];

    // Ordner-Strategie gewählt: Zielordner-Verwaltung bzw. Fallback-Hinweis.
    if (strategie === 'ordner') {
      if (!apiDa) {
        kinder.push(el('p', { class: 'muted small', text: t('backup.noApiHint') }));
      } else {
        kinder.push(el('div', { class: 'backup-folder' }, [
          el('span', { class: 'muted small', text: ordnerName
            ? t('backup.folderCurrent').replace('{ordner}', ordnerName)
            : t('backup.folderNone') }),
          el('div', { class: 'btn-row' }, [
            el('button', {
              class: 'btn btn-sm', text: ordnerName ? t('backup.folderChange') : t('backup.folderPick'),
              onClick: async () => {
                const h = await pickDirectory();
                if (h) { await merkeBackupOrdner(h); render(); }
              },
            }),
            ordnerName ? el('button', {
              class: 'btn btn-sm btn-ghost', text: t('backup.folderForget'),
              onClick: async () => { await vergissBackupOrdner(); render(); },
            }) : null,
          ]),
        ]));
      }
    }

    kinder.push(el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn', text: t('backup.now'), onClick: backupJetzt }),
      el('button', { class: 'btn', text: t('backup.restore'), onClick: restoreWaehlen }),
    ]));

    host.replaceChildren(...kinder.filter(Boolean));
  };

  render();
  return host;
}
