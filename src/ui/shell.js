// src/ui/shell.js
// App-Shell: Kopf (Marke + Identitäts-/Mandant-Indikator), Durabilitäts-Banner,
// Navigation, Inhaltsbereich. Phase 0 zeigt Übersicht + Einstellungen; die
// Buchhaltungs-Ansichten folgen in den nächsten Phasen.

import { el, mount, clear } from './dom.js';
import { t, setLang, LANGS } from './i18n.js';
import { applyTheme } from './theme.js';
import { MycelMark } from './mycel.js';
import { getSettings, updateSettings, navigate, getRoute, subscribe, MODES, AI_LEVELS } from '../state.js';
import { getMandantId, lockVault, changePassword } from '../core/vault.js';
import { durabilityStatus } from '../core/durability.js';
import { exportBackupFile, readBackup, importSnapshot } from '../core/backup.js';
import { pickFile, readFileText } from '../core/files.js';
import { mountAccounts } from './views/accounts.js';
import { mountJournal } from './views/journal.js';
import { mountReports } from './views/reports.js';
import { mountDocuments } from './views/documents.js';
import { mountCustomers } from './views/customers.js';
import { mountOrders } from './views/orders.js';
import { mountEmployees } from './views/employees.js';
import { mountLegal } from './views/legal.js';
import { mountNetwork } from './views/network.js';
import { mountDashboard } from './views/dashboard.js';
import { aboutContent } from './intro.js';
import { getAiConfig, saveAiConfig, MISTRAL_MODELS } from '../ai/aiConfig.js';
import { testVision } from '../ai/vision.js';
import { testMistral } from '../ai/mistral.js';

const NAV = [
  ['dashboard', 'nav.dashboard'],
  ['journal', 'nav.journal'],
  ['accounts', 'nav.accounts'],
  ['documents', 'nav.documents'],
  ['orders', 'nav.orders'],
  ['customers', 'nav.customers'],
  ['employees', 'nav.employees'],
  ['reports', 'nav.reports'],
  ['network', 'nav.network'],
  ['legal', 'nav.legal'],
  ['about', 'nav.about'],
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
    el('a', { class: 'skip-link', href: '#content' }, t('a11y.skip')),
    header(s),
    el('div', { class: 'durability-slot', id: 'durability-slot' }),
    el('div', { class: 'app-body' }, [nav(), el('main', { class: 'content', id: 'content', role: 'main', tabindex: '-1' })]),
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
  return el('nav', { class: 'app-nav', 'aria-label': t('a11y.nav') },
    NAV.map(([key, label]) => el('button', {
      class: 'nav-item' + (route === key ? ' active' : ''),
      text: t(label),
      'aria-current': route === key ? 'page' : null,
      onClick: () => navigate(key),
    }))
  );
}

function renderRoute() {
  const content = document.getElementById('content');
  if (!content) return;
  const route = getRoute();
  if (route === 'dashboard') return void mountDashboard(content);
  if (route === 'settings') return mount(content, viewSettings());
  if (route === 'accounts') return void mountAccounts(content);
  if (route === 'journal') return void mountJournal(content);
  if (route === 'reports') return void mountReports(content);
  if (route === 'documents') return void mountDocuments(content);
  if (route === 'orders') return void mountOrders(content);
  if (route === 'customers') return void mountCustomers(content);
  if (route === 'employees') return void mountEmployees(content);
  if (route === 'legal') return void mountLegal(content);
  if (route === 'about') return mount(content, el('section', { class: 'view' }, [aboutContent()]));
  if (route === 'network') return void mountNetwork(content);
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

  slot.appendChild(el('div', { class: `banner banner-${st.level === 'critical' ? 'critical' : 'warn'}`, role: 'status', 'aria-live': 'polite' }, [
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

    seg(t('settings.kleinunternehmer'), 'kleinunternehmer',
      [['nein', t('common.no')], ['ja', t('common.yes')]], s.kleinunternehmer ? 'ja' : 'nein',
      async (v) => { await updateSettings({ kleinunternehmer: v === 'ja' }); paint(); },
      t('settings.kleinunternehmer.hint')),

    seg(t('settings.theme'), 'theme',
      [['system', t('settings.theme.system')], ['light', t('settings.theme.light')], ['dark', t('settings.theme.dark')]],
      s.theme, async (v) => { applyTheme(v); await updateSettings({ theme: v }); }),

    seg(t('settings.lang'), 'lang',
      LANGS.map((l) => [l, l.toUpperCase()]), s.lang,
      async (v) => { setLang(v); await updateSettings({ lang: v }); paint(); }),

    aiConfigSection(),

    firmaSection(s),

    passwortSection(),

    el('div', { class: 'setting' }, [
      el('div', { class: 'setting-label', text: 'Backup' }),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn', text: t('settings.backup'), onClick: doBackup }),
        el('button', { class: 'btn', text: t('settings.restore'), onClick: doRestore }),
      ]),
    ]),
  ]);
}

// Merkt sich kurz, dass das Firmenprofil gespeichert wurde (überlebt das Re-Render
// nach updateSettings, das sonst die „Gespeichert ✓"-Meldung sofort verwerfen würde).
let _firmaSaved = false;

// Passwort ändern (Envelope: wickelt nur den Daten-Schlüssel neu ein).
function passwortSection() {
  const alt = el('input', { type: 'password', placeholder: t('pw.current'), autocomplete: 'current-password' });
  const neu = el('input', { type: 'password', placeholder: t('pw.new'), autocomplete: 'new-password' });
  const neu2 = el('input', { type: 'password', placeholder: t('pw.repeat'), autocomplete: 'new-password' });
  const status = el('p', { class: 'muted small' });
  const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('pw.title') }),
    el('div', { class: 'pw-row' }, [
      el('img', { class: 'pw-key', src: './assets/img/onboard-key.png', alt: '', loading: 'lazy' }),
      el('div', { class: 'pw-form' }, [
        el('p', { class: 'muted small', text: t('pw.hint') }),
        el('div', { class: 'form-grid' }, [
          field(t('pw.current'), alt),
          field(t('pw.new'), neu),
          field(t('pw.repeat'), neu2),
        ]),
        el('div', { class: 'btn-row' }, [
          el('button', {
            class: 'btn btn-sm btn-primary', text: t('pw.change'),
            onClick: async () => {
              status.classList.remove('form-error');
              if (neu.value !== neu2.value) { status.textContent = t('onboard.mismatch'); status.classList.add('form-error'); return; }
              if (neu.value.length < 8) { status.textContent = t('onboard.tooShort'); status.classList.add('form-error'); return; }
              try {
                await changePassword(alt.value, neu.value);
                alt.value = neu.value = neu2.value = '';
                status.textContent = t('pw.done');
              } catch (e) { status.textContent = String(e.message || e); status.classList.add('form-error'); }
            },
          }),
          status,
        ]),
      ]),
    ]),
  ]);
}

// Firmenprofil (Rechnungssteller-Stammdaten, §14 UStG) — verschlüsselt in Settings.
function firmaSection(s) {
  const f = s.firma || {};
  const inp = (val, ph) => {
    const e = el('input', { type: 'text', value: val || '', placeholder: ph });
    e.addEventListener('input', () => { _firmaSaved = false; status.textContent = ''; });
    return e;
  };
  const status = el('span', { class: 'muted small', text: _firmaSaved ? t('settings.saved') : '' });
  const name = inp(f.name, t('settings.firma.name'));
  const anschrift = inp(f.anschrift, t('settings.firma.anschrift'));
  const steuernummer = inp(f.steuernummer, t('settings.firma.steuernummer'));
  const ustId = inp(f.ustId, t('settings.firma.ustId'));
  const iban = inp(f.iban, t('settings.firma.iban'));
  const field = (label, input) => el('label', { class: 'field' }, [el('span', { text: label }), input]);
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.firma') }),
    el('p', { class: 'muted small', text: t('settings.firma.hint') }),
    el('div', { class: 'form-grid' }, [
      field(t('settings.firma.name'), name),
      field(t('settings.firma.anschrift'), anschrift),
      field(t('settings.firma.steuernummer'), steuernummer),
      field(t('settings.firma.ustId'), ustId),
      field(t('settings.firma.iban'), iban),
    ]),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn-sm btn-primary', text: t('settings.save'),
        onClick: async () => {
          await updateSettings({ firma: {
            name: name.value.trim(), anschrift: anschrift.value.trim(),
            steuernummer: steuernummer.value.trim(), ustId: ustId.value.trim(), iban: iban.value.trim(),
          } });
          _firmaSaved = true;     // überlebt das durch updateSettings ausgelöste Re-Render
          paint();
        },
      }),
      status,
    ]),
  ]);
}

// BYOK-EU-KI-Konfiguration (Google Vision EU + Mistral EU). Lädt verschlüsselt nach.
function aiConfigSection() {
  const host = el('div', { class: 'setting' });
  (async () => {
    const cfg = await getAiConfig().catch(() => ({ visionKey: '', mistralKey: '', mistralModel: 'mistral-small-latest' }));
    const visionKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'AIza… (Google Vision EU)', value: cfg.visionKey || '' });
    const mistralKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'Mistral API-Key (EU)', value: cfg.mistralKey || '' });
    const model = el('select', {}, MISTRAL_MODELS.map((m) => el('option', { value: m.id }, m.label)));
    model.value = cfg.mistralModel;
    const status = el('p', { class: 'muted small' });

    const save = el('button', {
      class: 'btn', text: t('settings.aiSave'),
      onClick: async () => {
        await saveAiConfig({ visionKey: visionKey.value.trim(), mistralKey: mistralKey.value.trim(), mistralModel: model.value });
        status.textContent = t('settings.aiSaved') + ' ' + t('settings.aiPersistHint');
      },
    });

    // Test-Knopf: speichert erst, dann ruft die Live-API minimal an.
    const testRow = (label, runTest, getVal) => {
      const out = el('div', { class: 'test-status muted small' });
      const btn = el('button', {
        class: 'btn btn-sm', text: t('settings.aiTest'),
        onClick: async () => {
          await saveAiConfig({ visionKey: visionKey.value.trim(), mistralKey: mistralKey.value.trim(), mistralModel: model.value });
          if (!getVal()) { out.textContent = '—'; return; }
          out.textContent = '…';
          const r = await runTest();
          out.className = 'test-status small ' + (r.ok ? 'ok' : 'fail');
          out.replaceChildren(el('span', { text: r.ok ? t('settings.aiTestOk') : (t('settings.aiTestFail') + ' ' + r.message) }));
          if (!r.ok && r.hinweis) out.appendChild(el('div', { class: 'muted small', text: '→ ' + r.hinweis }));
        },
      });
      return el('div', { class: 'test-row' }, [el('span', { class: 'muted small', text: label }), btn, out]);
    };

    const keyLink = (href) => el('a', { class: 'provider-link small', href, target: '_blank', rel: 'noopener', text: t('settings.aiGetKey') });
    const fieldWithLink = (label, input, href) => el('label', { class: 'field' }, [
      el('span', {}, [el('span', { text: label }), el('span', { text: ' · ' }), keyLink(href)]),
      input,
    ]);

    host.replaceChildren(
      el('div', { class: 'setting-label', text: t('settings.aiExternal') }),
      fieldWithLink(t('settings.aiVisionKey'), visionKey, 'https://console.cloud.google.com/apis/credentials'),
      el('p', { class: 'muted small' }, [
        el('span', { text: t('settings.aiVisionHint') + ' ' }),
        el('a', { class: 'provider-link', href: 'https://console.cloud.google.com/apis/library/vision.googleapis.com', target: '_blank', rel: 'noopener', text: t('settings.aiVisionEnable') }),
      ]),
      fieldWithLink(t('settings.aiMistralKey'), mistralKey, 'https://console.mistral.ai/api-keys'),
      el('p', { class: 'muted small', text: t('settings.aiMistralHint') }),
      el('label', { class: 'field' }, [el('span', { text: t('settings.aiModel') }), model]),
      el('div', { class: 'btn-row' }, [save]),
      testRow('Google Vision', testVision, () => visionKey.value.trim()),
      testRow('Mistral', testMistral, () => mistralKey.value.trim()),
      el('p', { class: 'muted small', text: t('settings.aiPrivacy') }),
      el('p', { class: 'muted small', text: t('settings.aiPersistHint') }),
      status,
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
