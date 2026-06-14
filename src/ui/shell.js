// src/ui/shell.js
// App-Shell: Kopf (Marke + Identitäts-/Mandant-Indikator), Durabilitäts-Banner,
// Navigation, Inhaltsbereich. Phase 0 zeigt Übersicht + Einstellungen; die
// Buchhaltungs-Ansichten folgen in den nächsten Phasen.

import { el, mount, clear } from './dom.js';
import { t, setLang, LANGS } from './i18n.js';
import { applyTheme } from './theme.js';
import { MycelMark } from './mycel.js';
import { getSettings, updateSettings, navigate, getRoute, subscribe, MODES, AI_LEVELS } from '../state.js';
import { getMandantId, lockVault } from '../core/vault.js';
import { durabilityStatus } from '../core/durability.js';
import { exportBackupFile, readBackup, importSnapshot } from '../core/backup.js';
import { pickFile, readFileText } from '../core/files.js';
import { mountAccounts } from './views/accounts.js';
import { mountJournal } from './views/journal.js';
import { mountReports } from './views/reports.js';
import { mountDocuments } from './views/documents.js';
import { getAiConfig, saveAiConfig, AI_MODELS } from '../ai/provider.js';

const NAV = [
  ['dashboard', 'nav.dashboard'],
  ['accounts', 'nav.accounts'],
  ['journal', 'nav.journal'],
  ['reports', 'nav.reports'],
  ['documents', 'nav.documents'],
  ['settings', 'nav.settings'],
];

let _container = null;
let _onLock = () => {};

export function renderShell(container, { onLock } = {}) {
  _container = container;
  _onLock = onLock || (() => {});
  subscribe(() => paint());
  paint();
  refreshDurability();
}

function paint() {
  const s = getSettings();
  const frame = el('div', { class: 'app', 'data-mode': s.mode }, [
    header(s),
    el('div', { class: 'durability-slot', id: 'durability-slot' }),
    el('div', { class: 'app-body' }, [nav(), el('main', { class: 'content', id: 'content' })]),
  ]);
  mount(_container, frame);
  renderRoute();
  refreshDurability();
}

function header(s) {
  const mandant = getMandantId();
  return el('header', { class: 'app-header' }, [
    el('div', { class: 'brand' }, [MycelMark(28), el('span', { class: 'brand-name', text: t('app.name') })]),
    el('div', { class: 'header-right' }, [
      mandant ? el('span', { class: 'mandant', title: t('dashboard.mandant') }, [
        el('span', { class: 'mandant-dot' }),
        el('span', { class: 'mandant-id', text: mandant }),
      ]) : null,
      el('button', {
        class: 'btn btn-ghost btn-sm', text: t('settings.lock'),
        onClick: () => { lockVault(); _onLock(); },
      }),
    ]),
  ]);
}

function nav() {
  const route = getRoute();
  return el('nav', { class: 'app-nav' },
    NAV.map(([key, label]) => el('button', {
      class: 'nav-item' + (route === key ? ' active' : ''),
      text: t(label),
      onClick: () => navigate(key),
    }))
  );
}

function renderRoute() {
  const content = document.getElementById('content');
  if (!content) return;
  const route = getRoute();
  if (route === 'dashboard') return mount(content, viewDashboard());
  if (route === 'settings') return mount(content, viewSettings());
  if (route === 'accounts') return void mountAccounts(content);
  if (route === 'journal') return void mountJournal(content);
  if (route === 'reports') return void mountReports(content);
  if (route === 'documents') return void mountDocuments(content);
  return mount(content, viewPlaceholder(route));
}

// ---- Durabilitäts-Banner ----------------------------------------------------

async function refreshDurability() {
  const slot = document.getElementById('durability-slot');
  if (!slot) return;
  const st = await durabilityStatus();
  clear(slot);
  if (st.level === 'ok') return;

  const msgs = [];
  if (st.issues.includes('persist-denied')) msgs.push(t('durability.persistDenied'));
  if (st.issues.includes('quota-pressure')) msgs.push(t('durability.quotaPressure'));
  if (st.issues.includes('no-backup')) msgs.push(t('durability.noBackup'));
  else if (st.issues.includes('backup-stale')) msgs.push(t('durability.backupStale'));

  slot.appendChild(el('div', { class: `banner banner-${st.level === 'critical' ? 'critical' : 'warn'}`, role: 'status' }, [
    el('span', { class: 'banner-text', text: msgs.join(' ') }),
    el('button', { class: 'btn btn-sm', text: t('durability.backupNow'), onClick: doBackup }),
  ]));
}

// ---- Aktionen ---------------------------------------------------------------

async function doBackup() {
  const pwd = prompt(t('lock.password'));
  if (!pwd) return;
  try { await exportBackupFile(pwd); refreshDurability(); }
  catch (e) { alert(String(e.message || e)); }
}

async function doRestore() {
  const file = await pickFile('.json,.blpr.json,application/json');
  if (!file) return;
  const pwd = prompt(t('lock.password'));
  if (!pwd) return;
  try {
    const text = await readFileText(file);
    const snap = await readBackup(pwd, text);
    const res = await importSnapshot(snap, 'merge');
    alert(`OK: ${res.records} Datensätze, ${res.files} Belege`);
    refreshDurability();
  } catch (e) { alert(String(e.message || e)); }
}

// ---- Views ------------------------------------------------------------------

function viewDashboard() {
  const s = getSettings();
  return el('section', { class: 'view' }, [
    el('h1', { text: t('dashboard.welcome') }),
    el('p', { class: 'muted', text: t('app.tagline') }),
    el('div', { class: 'card' }, [
      el('p', { text: t('dashboard.phase0') }),
      el('p', { class: 'muted small', text: `${t('settings.mode')}: ${t('settings.mode.' + s.mode)}` }),
    ]),
  ]);
}

function viewSettings() {
  const s = getSettings();

  const seg = (label, key, options, current, onPick, hint) => el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: label }),
    el('div', { class: 'segmented' },
      options.map(([val, lab]) => el('button', {
        class: 'seg' + (current === val ? ' active' : ''),
        text: lab,
        onClick: () => onPick(val),
      }))
    ),
    hint ? el('p', { class: 'muted small', text: hint }) : null,
  ]);

  return el('section', { class: 'view' }, [
    el('h1', { text: t('settings.title') }),

    seg(t('settings.mode'), 'mode',
      MODES.map((m) => [m, t('settings.mode.' + m)]), s.mode,
      (v) => updateSettings({ mode: v }), t('settings.mode.hint')),

    seg(t('settings.ai'), 'aiAutonomy',
      AI_LEVELS.map((a) => [a, t('settings.ai.' + a)]), s.aiAutonomy,
      (v) => updateSettings({ aiAutonomy: v }), t('settings.ai.hint')),

    seg(t('settings.theme'), 'theme',
      [['system', t('settings.theme.system')], ['light', t('settings.theme.light')], ['dark', t('settings.theme.dark')]],
      s.theme, async (v) => { applyTheme(v); await updateSettings({ theme: v }); }),

    seg(t('settings.lang'), 'lang',
      LANGS.map((l) => [l, l.toUpperCase()]), s.lang,
      async (v) => { setLang(v); await updateSettings({ lang: v }); paint(); }),

    aiConfigSection(),

    el('div', { class: 'setting' }, [
      el('div', { class: 'setting-label', text: 'Backup' }),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn', text: t('settings.backup'), onClick: doBackup }),
        el('button', { class: 'btn', text: t('settings.restore'), onClick: doRestore }),
      ]),
    ]),
  ]);
}

// BYOK-Claude-Konfiguration. Lädt die (verschlüsselte) Config asynchron nach.
function aiConfigSection() {
  const host = el('div', { class: 'setting' });
  (async () => {
    const cfg = await getAiConfig().catch(() => ({ enabled: false, model: 'claude-sonnet-4-6', apiKey: '' }));
    const enable = el('input', { type: 'checkbox' });
    if (cfg.enabled) enable.setAttribute('checked', '');
    const model = el('select', {}, AI_MODELS.map((m) => el('option', { value: m.id }, m.label)));
    model.value = cfg.model;
    const apiKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'sk-ant-…', value: cfg.apiKey || '' });
    const status = el('p', { class: 'muted small' });
    const save = el('button', {
      class: 'btn', text: t('settings.aiSave'),
      onClick: async () => {
        await saveAiConfig({ enabled: enable.checked, model: model.value, apiKey: apiKey.value.trim() });
        status.textContent = t('settings.aiSaved');
      },
    });
    host.replaceChildren(
      el('div', { class: 'setting-label', text: t('settings.aiExternal') }),
      el('label', { class: 'checkbox-row' }, [enable, el('span', { text: t('settings.aiEnable') })]),
      el('label', { class: 'field' }, [el('span', { text: t('settings.aiModel') }), model]),
      el('label', { class: 'field' }, [el('span', { text: t('settings.aiKey') }), apiKey]),
      el('p', { class: 'muted small', text: t('settings.aiPrivacy') }),
      el('div', { class: 'btn-row' }, [save]), status,
    );
  })();
  return host;
}

function viewPlaceholder(route) {
  const labelKey = (NAV.find(([k]) => k === route) || [null, 'nav.dashboard'])[1];
  return el('section', { class: 'view' }, [
    el('h1', { text: t(labelKey) }),
    el('div', { class: 'card placeholder' }, [
      el('p', { class: 'muted', text: t('common.comingSoon') }),
    ]),
  ]);
}
