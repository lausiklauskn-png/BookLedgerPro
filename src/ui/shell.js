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
import { ladeRegistry, speichereRegistry } from '../core/mandantenStore.js';
import { aktiverMandant, mandantenAuswahlListe, umbenenneMandant, entferneMandant, validateMandantName, istSandbox, sandboxAuswahlListe, naechsterTestName } from '../domain/mandanten.js';
import { erstelleSandboxTresor, wechsleZuSandbox, leereSandboxTresor, loescheSandboxTresor, loescheAlleSandboxes, behalteUndVerlasseSandbox } from '../core/sandboxStore.js';
import { durabilityStatus } from '../core/durability.js';
import { backupJetzt, restoreWaehlen, backupEinstellungen, onDatensicherungAktion } from './datensicherung.js';
import { mountAccounts } from './views/accounts.js';
import { mountAnlagen } from './views/anlagen.js';
import { mountKassenbuch } from './views/kassenbuch.js';
import { mountJournal } from './views/journal.js';
import { mountReports } from './views/reports.js';
import { mountBerichte } from './views/berichte.js';
import { mountSelbsttest } from './views/selbsttest.js';
import { getBuchungssperre, setBuchungssperre, ensureSeedKonten } from '../domain/store.js';
import { GEWINNERMITTLUNG, normalizeGewinnermittlung, BILANZ_GRUNDKONTO_NUMMERN } from '../domain/bilanzierung.js';
import { NUTZUNGSMODUS_LISTE, normalizeNutzungsmodus, zeigeAnsicht } from '../domain/nutzungsmodus.js';
import { RECHNUNGSSTELLE, normalizeRechnungsstelle, rechnungsstelleWechselHinweis } from '../domain/rechnungsstelle.js';
import { vergebeneRechnungsnummern } from '../domain/crm-store.js';
import { mountDocuments } from './views/documents.js';
import { mountPayables } from './views/payables.js';
import { mountCustomers } from './views/customers.js';
import { mountOrders } from './views/orders.js';
import { mountAngebote } from './views/angebote.js';
import { mountNachkalkulation } from './views/nachkalkulation.js';
import { mountLohn } from './views/lohn.js';
import { mountEmployees } from './views/employees.js';
import { mountLegal } from './views/legal.js';
import { mountNetwork } from './views/network.js';
import { mountDashboard } from './views/dashboard.js';
import { mountAnleitung } from './views/anleitung.js';
import { schluesselAbgleichSection } from './schluesselabgleich.js';
import { aboutContent } from './intro.js';
import { getAiConfig, saveAiConfig, MISTRAL_MODELS } from '../ai/aiConfig.js';
import { testVision } from '../ai/vision.js';
import { testMistral } from '../ai/mistral.js';
import { KI_MODI, erlaubteAnbieter, normalizeAnbieterWahl } from '../ai/anbieter.js';

const NAV = [
  ['dashboard', 'nav.dashboard'],
  ['journal', 'nav.journal'],
  ['kassenbuch', 'nav.kassenbuch'],
  ['accounts', 'nav.accounts'],
  ['anlagen', 'nav.anlagen'],
  ['documents', 'nav.documents'],
  ['payables', 'nav.payables'],
  ['orders', 'nav.orders'],
  ['angebote', 'nav.angebote'],
  ['nachkalkulation', 'nav.nachkalkulation'],
  ['customers', 'nav.customers'],
  ['employees', 'nav.employees'],
  ['lohn', 'nav.lohn'],
  ['reports', 'nav.reports'],
  ['berichte', 'nav.berichte'],
  ['network', 'nav.network'],
  ['legal', 'nav.legal'],
  ['anleitung', 'nav.anleitung'],
  ['selbsttest', 'nav.selbsttest'],
  ['about', 'nav.about'],
  ['settings', 'nav.settings'],
];

let _container = null;
let _onLock = () => {};
// Aktiver Mandant für den Header (Name + Gesamtzahl) — aus der unverschlüsselten
// Registry-kv-DB nachgeladen (vor dem Entsperren lesbar; getrennt von den Tresoren).
let _mandant = { id: null, name: null, count: 0, sandbox: false };

export function renderShell(container, { onLock } = {}) {
  _container = container;
  _onLock = onLock || (() => {});
  subscribe(() => paint());
  paint();
  refreshDurability();
  refreshMandant();
}

// Lädt den aktiven Mandanten-Namen + die Mandantenzahl nach und zeichnet den Header neu.
// (DOM/IndexedDB-Pfad — statisch geprüft; die reine Registry-Logik ist node-getestet.)
async function refreshMandant() {
  try {
    const registry = await ladeRegistry();
    const akt = aktiverMandant(registry);
    _mandant = { id: akt?.id || null, name: akt?.name || null, count: registry.mandanten.length, sandbox: istSandbox(akt) };
  } catch { _mandant = { id: null, name: null, count: 0, sandbox: false }; }
  paint();
}

function paint() {
  const s = getSettings();
  const frame = el('div', { class: 'app', 'data-mode': s.mode }, [
    el('a', { class: 'skip-link', href: '#content' }, t('a11y.skip')),
    header(s),
    // Dauerhafter TEST-MODUS-Banner, solange ein Sandbox-/Test-Tresor aktiv ist (Spec).
    _mandant.sandbox ? testModusBanner() : null,
    el('div', { class: 'durability-slot', id: 'durability-slot' }),
    el('div', { class: 'app-body' }, [nav(), el('main', { class: 'content', id: 'content', role: 'main', tabindex: '-1' })]),
  ]);
  mount(_container, frame);
  renderRoute();
  refreshDurability();
}

function header(s) {
  // Bevorzugt den Mandanten-Namen aus der Registry; fällt auf die DB-ID zurück, solange
  // der asynchrone Nachlade-Schritt (refreshMandant) noch nicht zurück ist.
  const label = _mandant.name || getMandantId();
  return el('header', { class: 'app-header' }, [
    el('div', { class: 'brand' }, [MycelMark(28), el('span', { class: 'brand-name', text: t('app.name') })]),
    el('div', { class: 'header-right' }, [
      label ? el('span', { class: 'mandant', title: t('dashboard.mandant') }, [
        el('span', { class: 'mandant-dot' }),
        el('span', { class: 'mandant-id', text: label }),
      ]) : null,
      // „Mandant wechseln" nur, wenn es mehr als einen Mandanten gibt (sonst wäre der
      // Wechsel ein reines Sperren auf denselben Tresor).
      _mandant.count > 1 ? el('button', {
        class: 'btn btn-ghost btn-sm', text: t('mandant.switch'),
        onClick: mandantWechseln,
      }) : null,
      el('button', {
        class: 'btn btn-ghost btn-sm', text: t('settings.lock'),
        onClick: sperren,
      }),
    ]),
  ]);
}

// Mandant wechseln: Sitzungs-Key (DEK) verwerfen und neu booten. Der Boot zeigt bei
// mehr als einem Mandanten die Auswahl vor dem Entsperren (showLockScreen) — von dort
// wird der Ziel-Mandant gewählt und entsperrt. Aus einem Test-Tresor heraus erst der
// behalten/verwerfen-Dialog (nichts versehentlich liegen lassen).
function mandantWechseln() {
  if (_mandant.sandbox) { verlasseSandboxDialog(); return; }
  lockVault();
  _onLock();
}

// Sperren-Knopf: aus einem Test-Tresor heraus zuerst der behalten/verwerfen-Dialog,
// sonst direkt sperren + neu booten.
function sperren() {
  if (_mandant.sandbox) { verlasseSandboxDialog(); return; }
  lockVault();
  _onLock();
}

function nav() {
  const route = getRoute();
  const s = getSettings();
  // Privat-/Bürger-Modus (P1): geschäftliche Ansichten je Nutzungsmodus ausblenden.
  // Firma (Default) zeigt alles → Bestandsverhalten unverändert. Reine Gating-Politik
  // liegt node-getestet in domain/nutzungsmodus.js; hier nur die NAV-Filterung.
  return el('nav', { class: 'app-nav', 'aria-label': t('a11y.nav') },
    NAV.filter(([key]) => zeigeAnsicht(s, key)).map(([key, label]) => el('button', {
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
  if (route === 'anlagen') return void mountAnlagen(content);
  if (route === 'kassenbuch') return void mountKassenbuch(content);
  if (route === 'journal') return void mountJournal(content);
  if (route === 'reports') return void mountReports(content);
  if (route === 'berichte') return void mountBerichte(content);
  if (route === 'selbsttest') return void mountSelbsttest(content);
  if (route === 'documents') return void mountDocuments(content);
  if (route === 'payables') return void mountPayables(content);
  if (route === 'orders') return void mountOrders(content);
  if (route === 'angebote') return void mountAngebote(content);
  if (route === 'nachkalkulation') return void mountNachkalkulation(content);
  if (route === 'customers') return void mountCustomers(content);
  if (route === 'employees') return void mountEmployees(content);
  if (route === 'lohn') return void mountLohn(content);
  if (route === 'legal') return void mountLegal(content);
  if (route === 'about') return mount(content, el('section', { class: 'view' }, [aboutContent()]));
  if (route === 'anleitung') return void mountAnleitung(content);
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
    el('button', { class: 'btn btn-sm', text: t('durability.backupNow'), onClick: backupJetzt }),
  ]));
}

// Datensicherungs-Aktionen (Modul ui/datensicherung.js) frischen nach Backup/Restore
// das Durabilitäts-Banner auf.
onDatensicherungAktion(refreshDurability);

// ---- Test-Modus (Sandbox-Tresore, docs/TEST_MODUS.md) -----------------------

// Dauerhafter Banner, solange ein Test-Tresor aktiv ist: macht den Test-Modus unübersehbar
// und bietet den Ausstieg (behalten/verwerfen). „TEST-MODUS · Test „{name}" — echte Daten unberührt."
function testModusBanner() {
  return el('div', { class: 'banner banner-test', role: 'status', 'aria-live': 'polite' }, [
    el('span', { class: 'banner-text' }, [
      el('strong', { text: t('test.bannerTag') }),
      el('span', { text: ' ' + t('test.bannerText').replace('{name}', _mandant.name || '') }),
    ]),
    el('button', { class: 'btn btn-sm', text: t('test.verlassen'), onClick: verlasseSandboxDialog }),
  ]);
}

// „Test behalten oder verwerfen?" beim Verlassen (Sperren/Wechseln). Behalten → Eingaben
// bleiben für nächstes Mal; Verwerfen → der Test wird spurlos gelöscht (eigene DB). In
// beiden Fällen wird der Sitzungs-Key verworfen und neu gebootet. Echte Daten unberührt.
function verlasseSandboxDialog() {
  const id = _mandant.id;
  const name = _mandant.name || '';
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const schliessen = () => overlay.remove();

  const behalten = el('button', {
    class: 'btn btn-primary', text: t('test.behalten'),
    onClick: async () => {
      behalten.setAttribute('disabled', '');
      // Test bleibt erhalten; aktiver Tresor zurück auf einen echten Mandanten → nächster
      // Start landet in der echten Welt (der Test ist über „🧪 Tests" wieder erreichbar).
      try { await behalteUndVerlasseSandbox(); }
      catch (e) { alert(String(e.message || e)); }
      lockVault(); _onLock();
    },
  });
  const verwerfen = el('button', {
    class: 'btn btn-danger', text: t('test.verwerfen'),
    onClick: async () => {
      verwerfen.setAttribute('disabled', '');
      try { await loescheSandboxTresor(id); }
      catch (e) { alert(String(e.message || e)); }
      lockVault(); _onLock();
    },
  });
  const abbrechen = el('button', { class: 'btn', text: t('common.cancel'), onClick: schliessen });

  overlay.addEventListener('click', (e) => { if (e.target === overlay) schliessen(); });
  overlay.appendChild(el('div', { class: 'modal' }, [
    el('h2', { text: t('test.verlassenTitle') }),
    el('p', { class: 'muted', text: t('test.verlassenIntro').replace('{name}', name) }),
    el('div', { class: 'btn-row' }, [behalten, verwerfen, abbrechen]),
  ]));
  document.body.appendChild(overlay);
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

    // Privat-/Bürger-Modus (P1): Nutzungskontext (Firma/Privat/Verein). Steuert,
    // welche Ansichten in der Navigation erscheinen. paint() → NAV neu filtern.
    seg(t('settings.nutzung'), 'nutzungsmodus',
      NUTZUNGSMODUS_LISTE.map((m) => [m, t('settings.nutzung.' + m)]),
      normalizeNutzungsmodus(s.nutzungsmodus),
      async (v) => { await updateSettings({ nutzungsmodus: v }); paint(); },
      t('settings.nutzung.hint')),

    seg(t('settings.ai'), 'aiAutonomy',
      AI_LEVELS.map((a) => [a, t('settings.ai.' + a)]), s.aiAutonomy,
      (v) => updateSettings({ aiAutonomy: v }), t('settings.ai.hint')),

    seg(t('settings.kleinunternehmer'), 'kleinunternehmer',
      [['nein', t('common.no')], ['ja', t('common.yes')]], s.kleinunternehmer ? 'ja' : 'nein',
      async (v) => { await updateSettings({ kleinunternehmer: v === 'ja' }); paint(); },
      t('settings.kleinunternehmer.hint')),

    gewinnermittlungSection(s),

    rechnungsstelleSection(s),

    seg(t('settings.datenschutz'), 'datenschutzModus',
      [['aus', t('settings.datenschutz.aus')], ['pseudonym', t('settings.datenschutz.pseudonym')]],
      s.datenschutzModus || 'aus',
      async (v) => { await updateSettings({ datenschutzModus: v }); paint(); }, t('settings.datenschutz.hint')),

    // NER-Zusatz: nur im Pseudonym-Modus sinnvoll → konditional eingeblendet.
    s.datenschutzModus === 'pseudonym'
      ? seg(t('settings.datenschutz.ner'), 'nerPii',
          [['nein', t('common.no')], ['ja', t('common.yes')]], s.nerPii === false ? 'nein' : 'ja',
          (v) => updateSettings({ nerPii: v === 'ja' }), t('settings.datenschutz.nerHint'))
      : null,

    // Dreistufiger Briefkasten (Mandant ⊃ Firma ⊃ Person) — nur im Pseudonym-Modus.
    s.datenschutzModus === 'pseudonym'
      ? seg(t('settings.datenschutz.briefkasten'), 'briefkastenScopes',
          [['nein', t('common.no')], ['ja', t('common.yes')]], s.briefkastenScopes === true ? 'ja' : 'nein',
          (v) => updateSettings({ briefkastenScopes: v === 'ja' }), t('settings.datenschutz.briefkastenHint'))
      : null,

    // P9: Datei-Import mit exaktem Schlüssel-Abgleich (Pseudonymisieren ↔ Re-Identifizieren
    // über Dateien hinweg). Reine Logik node-getestet; dieser Glue ist statisch geprüft.
    schluesselAbgleichSection(),

    seg(t('settings.theme'), 'theme',
      [['system', t('settings.theme.system')], ['light', t('settings.theme.light')], ['dark', t('settings.theme.dark')]],
      s.theme, async (v) => { applyTheme(v); await updateSettings({ theme: v }); }),

    seg(t('settings.lang'), 'lang',
      LANGS.map((l) => [l, l.toUpperCase()]), s.lang,
      async (v) => { setLang(v); await updateSettings({ lang: v }); paint(); }),

    aiConfigSection(),

    firmaSection(s),

    datevSection(s),

    geschaeftsjahrSection(s),

    partnerSection(s),

    buchungssperreSection(),

    mandantenSection(),

    testModusSection(),

    passwortSection(),

    backupEinstellungen(),
  ]);
}

// Merkt sich kurz, dass das Firmenprofil gespeichert wurde (überlebt das Re-Render
// nach updateSettings, das sonst die „Gespeichert ✓"-Meldung sofort verwerfen würde).
let _firmaSaved = false;

// Mehrmandanten-Verwaltung (M3): umbenennen + entfernen. Die Registry liegt in einer
// eigenen, UNVERSCHLÜSSELTEN kv-DB (siehe core/mandantenStore.js) — daher async geladen.
// Reine Registry-Logik (umbenenneMandant/entferneMandant/…) ist node-getestet; dieser
// Glue-Pfad (DOM/IndexedDB) ist statisch geprüft (kein Headless-Browser).
function mandantenSection() {
  const host = el('div', { class: 'setting' });
  const render = async () => {
    let registry;
    try { registry = await ladeRegistry(); }
    catch {
      host.replaceChildren(
        el('div', { class: 'setting-label', text: t('settings.mandanten') }),
        el('p', { class: 'muted small', text: '—' }),
      );
      return;
    }
    const rows = mandantenAuswahlListe(registry).map((m) => mandantRow(m, registry, render));
    host.replaceChildren(
      el('div', { class: 'setting-label', text: t('settings.mandanten') }),
      el('p', { class: 'muted small', text: t('settings.mandantenHint') }),
      el('div', { class: 'mandant-admin' }, rows),
    );
  };
  render();
  return host;
}

// Eine Zeile der Mandanten-Verwaltung: Name bearbeiten + speichern, entfernen (nur mit
// Bestätigung; die Tresor-DB bleibt erhalten — kein Datenverlust). Der aktuell geöffnete
// Mandant kann nicht entfernt werden (man arbeitet gerade in ihm → erst wechseln).
function mandantRow(m, registry, rerender) {
  const status = el('span', { class: 'muted small' });
  const input = el('input', { type: 'text', value: m.name, maxlength: '60' });
  input.addEventListener('input', () => { status.textContent = ''; status.classList.remove('form-error'); });

  const save = el('button', {
    class: 'btn btn-sm', text: t('common.save'),
    onClick: async () => {
      const fehler = validateMandantName(input.value);
      if (fehler) { status.textContent = fehler; status.classList.add('form-error'); return; }
      try {
        await speichereRegistry(umbenenneMandant(registry, m.id, input.value));
        status.classList.remove('form-error');
        status.textContent = t('settings.saved');
        if (m.aktiv) refreshMandant(); // Header sofort mitziehen
      } catch (e) { status.textContent = String(e.message || e); status.classList.add('form-error'); }
    },
  });

  const remove = el('button', {
    class: 'btn btn-sm btn-danger', text: t('common.delete'),
    onClick: async () => {
      if (!confirm(t('mandant.confirmRemove').replace('{name}', m.name))) return;
      try {
        await speichereRegistry(entferneMandant(registry, m.id));
        refreshMandant(); // Header (Mandantenzahl) aktualisieren
        rerender();       // Liste neu zeichnen
      } catch (e) { status.textContent = String(e.message || e); status.classList.add('form-error'); }
    },
  });
  if (m.aktiv) { remove.setAttribute('disabled', ''); remove.title = t('mandant.removeActiveHint'); }

  return el('div', { class: 'mandant-admin-row' }, [
    input,
    m.aktiv ? el('span', { class: 'mandant-badge', text: t('mandant.current') }) : null,
    save, remove, status,
  ]);
}

// Test-Modus-Verwaltung in den Einstellungen (docs/TEST_MODUS.md). Innerhalb eines Tests:
// Test verlassen (behalten/verwerfen). Außerhalb (echter Mandant): Tests öffnen/leeren/
// löschen, neuen Test anlegen, „Alle Tests löschen". Öffnen/Anlegen verwirft den Sitzungs-
// Key und bootet neu (Passwort des Tests am Sperrbildschirm). Reine Lebenszyklus-Logik ist
// node-getestet; dieser DOM-/IndexedDB-Pfad ist statisch geprüft. Echte Daten bleiben unberührt.
function testModusSection() {
  const host = el('div', { class: 'setting' });
  const render = async () => {
    const kopf = [
      el('div', { class: 'setting-label', text: t('settings.test') }),
      el('p', { class: 'muted small', text: t('settings.testHint') }),
    ];

    if (_mandant.sandbox) {
      host.replaceChildren(
        ...kopf,
        el('p', { class: 'muted small', text: t('test.inTestNote').replace('{name}', _mandant.name || '') }),
        el('div', { class: 'btn-row' }, [
          el('button', { class: 'btn btn-sm', text: t('test.verlassen'), onClick: verlasseSandboxDialog }),
        ]),
      );
      return;
    }

    let registry;
    try { registry = await ladeRegistry(); }
    catch { host.replaceChildren(...kopf, el('p', { class: 'muted small', text: '—' })); return; }

    const tests = sandboxAuswahlListe(registry);
    const rows = tests.map((m) => el('div', { class: 'mandant-admin-row' }, [
      el('span', { class: 'mandant-name', text: m.name }),
      el('button', { class: 'btn btn-sm', text: t('test.oeffnen'), onClick: async () => { await wechsleZuSandbox(m.id); _onLock(); } }),
      el('button', { class: 'btn btn-sm', text: t('test.leeren'), onClick: async () => { if (!confirm(t('test.confirmLeeren').replace('{name}', m.name))) return; await leereSandboxTresor(m.id); render(); } }),
      el('button', { class: 'btn btn-sm btn-danger', text: t('common.delete'), onClick: async () => { if (!confirm(t('test.confirmLoeschen').replace('{name}', m.name))) return; await loescheSandboxTresor(m.id); render(); } }),
    ]));

    host.replaceChildren(
      ...kopf,
      tests.length ? el('div', { class: 'mandant-admin' }, rows) : el('p', { class: 'muted small', text: t('test.empty') }),
      el('div', { class: 'btn-row' }, [
        el('button', {
          class: 'btn btn-sm btn-primary', text: t('test.neu'),
          onClick: async () => {
            const name = prompt(t('test.name'), naechsterTestName(registry));
            if (name == null) return;
            const fehler = validateMandantName(name);
            if (fehler) { alert(fehler); return; }
            await erstelleSandboxTresor(name);
            _onLock(); // neu booten → Test-Onboarding (Passwort) am Sperrbildschirm
          },
        }),
        tests.length ? el('button', {
          class: 'btn btn-sm btn-danger', text: t('test.alleLoeschen'),
          onClick: async () => { if (!confirm(t('test.confirmAlle'))) return; await loescheAlleSandboxes(); render(); },
        }) : null,
      ]),
    );
  };
  render();
  return host;
}

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

// DATEV-EXTF-Stammdaten (Berater-/Mandantennummer) für den Buchungsstapel-Header.
function datevSection(s) {
  const d = s.datev || {};
  const status = el('span', { class: 'muted small' });
  const beraterNr = el('input', { type: 'text', value: d.beraterNr || '', placeholder: 'Berater-Nr.' });
  const mandantNr = el('input', { type: 'text', value: d.mandantNr || '', placeholder: 'Mandanten-Nr.' });
  const skl = el('input', { type: 'number', value: String(d.sachkontenlaenge || 4), style: 'width:6rem' });
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.datev') }),
    el('div', { class: 'form-grid' }, [
      el('label', { class: 'field' }, [el('span', { text: t('settings.datev.berater') }), beraterNr]),
      el('label', { class: 'field' }, [el('span', { text: t('settings.datev.mandant') }), mandantNr]),
      el('label', { class: 'field' }, [el('span', { text: t('settings.datev.skl') }), skl]),
    ]),
    el('div', { class: 'btn-row' }, [
      el('button', {
        class: 'btn btn-sm', text: t('common.save'),
        onClick: async () => {
          await updateSettings({ datev: { beraterNr: beraterNr.value.trim(), mandantNr: mandantNr.value.trim(), sachkontenlaenge: Number(skl.value) || 4 } });
          status.textContent = t('settings.saved');
        },
      }),
      status,
    ]),
    el('p', { class: 'muted small', text: t('settings.datev.hint') }),
  ]);
}

// Verbundene App (z.B. Mein-WorkFloh, public) — reziproke Verlinkung + offenes Austauschformat.
function partnerSection(s) {
  const status = el('span', { class: 'muted small' });
  const input = el('input', { type: 'text', value: s.partnerAppUrl || '', placeholder: 'https://…' });
  const openBtn = el('a', { class: 'btn btn-sm', target: '_blank', rel: 'noopener noreferrer', text: t('settings.partnerOpen') });
  const syncOpen = () => { const u = input.value.trim(); if (/^https?:\/\//.test(u)) { openBtn.href = u; openBtn.style.display = ''; } else { openBtn.style.display = 'none'; } };
  input.addEventListener('input', syncOpen); syncOpen();
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.partner') }),
    el('div', { class: 'btn-row' }, [
      input,
      el('button', { class: 'btn btn-sm', text: t('common.save'), onClick: async () => { await updateSettings({ partnerAppUrl: input.value.trim() }); status.textContent = t('settings.saved'); } }),
      openBtn, status,
    ]),
    el('p', { class: 'muted small', text: t('settings.partnerHint') }),
  ]);
}

// Gewinnermittlungsart (B1): EÜR (§4 Abs.3) oder Bilanzierung (§4 Abs.1/§5 EStG).
// Beim Wechsel auf „Bilanz" werden die Bilanz-Grundkonten (Eigenkapital/Rückstellungen)
// in älteren Tresoren nachgezogen (ensureSeedKonten); neue Tresore haben sie schon im Seed.
// Reine Logik (bilanzierung.js) ist node-getestet; dieser Glue-/UI-Pfad ist statisch geprüft.
// EHRLICH: GuV/Bilanz-Auswertungen folgen (B2/B3) — hier wird nur Modus + Kontengrundlage gesetzt.
function gewinnermittlungSection(s) {
  const aktuell = normalizeGewinnermittlung(s.gewinnermittlung);
  const status = el('p', { class: 'muted small' });
  const segmented = el('div', { class: 'segmented' },
    [[GEWINNERMITTLUNG.EUER, t('settings.gewinn.euer')], [GEWINNERMITTLUNG.BILANZ, t('settings.gewinn.bilanz')]]
      .map(([val, lab]) => el('button', {
        class: 'seg' + (aktuell === val ? ' active' : ''),
        text: lab,
        onClick: async () => {
          if (val === aktuell) return;
          await updateSettings({ gewinnermittlung: val });
          if (val === GEWINNERMITTLUNG.BILANZ) {
            try {
              const n = await ensureSeedKonten([...BILANZ_GRUNDKONTO_NUMMERN]);
              status.textContent = n > 0 ? t('settings.gewinn.seeded').replace('{n}', String(n)) : t('settings.saved');
            } catch (e) { status.textContent = String(e.message || e); }
          }
          paint();
        },
      })));
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.gewinn') }),
    segmented,
    el('p', { class: 'muted small', text: t('settings.gewinn.hint') }),
    status,
  ]);
}

// Rechnungsstelle (§14-Nummernkreis-Hoheit, Katalog §7a): BLP stellt aus (blp)
// vs. externes Programm/Steuerberater (extern → BLP nur Vorlage). Wechsel weg von
// BLP wird mit Bestätigung abgesichert, sobald BLP schon §14-Nummern vergeben hat
// (GoBD-Lückenlosigkeit).
function rechnungsstelleSection(s) {
  const aktuell = normalizeRechnungsstelle(s.rechnungsstelle);
  const status = el('p', { class: 'muted small' });
  const segmented = el('div', { class: 'segmented' },
    [[RECHNUNGSSTELLE.BLP, t('settings.rechnungsstelle.blp')], [RECHNUNGSSTELLE.EXTERN, t('settings.rechnungsstelle.extern')]]
      .map(([val, lab]) => el('button', {
        class: 'seg' + (aktuell === val ? ' active' : ''),
        text: lab,
        onClick: async () => {
          if (val === aktuell) return;
          let vergeben = 0;
          try { vergeben = await vergebeneRechnungsnummern(); } catch { /* Zähler unlesbar → 0 (kein Block) */ }
          const hinweis = rechnungsstelleWechselHinweis(aktuell, val, { vergebeneNummern: vergeben });
          if (hinweis.warnen && !confirm(t('settings.rechnungsstelle.warnWechsel').replace('{n}', String(vergeben)))) return;
          await updateSettings({ rechnungsstelle: val });
          status.textContent = t('settings.saved');
          paint();
        },
      })));
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.rechnungsstelle') }),
    segmented,
    el('p', { class: 'muted small', text: t('settings.rechnungsstelle.hint') }),
    status,
  ]);
}

// Wirtschaftsjahr-Beginn (MM-TT) — Kalenderjahr (01-01) oder abweichend.
function geschaeftsjahrSection(s) {
  const status = el('span', { class: 'muted small' });
  const input = el('input', { type: 'text', value: s.wirtschaftsjahrBeginn || '01-01', placeholder: 'MM-TT' });
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.wj') }),
    el('div', { class: 'btn-row' }, [
      input,
      el('button', {
        class: 'btn btn-sm', text: t('common.save'),
        onClick: async () => {
          const v = input.value.trim();
          if (!/^\d{2}-\d{2}$/.test(v)) { status.textContent = t('settings.wjError'); return; }
          await updateSettings({ wirtschaftsjahrBeginn: v }); status.textContent = t('settings.saved');
        },
      }),
      status,
    ]),
    el('p', { class: 'muted small', text: t('settings.wjHint') }),
  ]);
}

// Buchungssperre (Periodenabschluss): bis zu diesem Datum kann nicht mehr festgeschrieben werden.
function buchungssperreSection() {
  const input = el('input', { type: 'text', placeholder: 'YYYY-MM-DD' });
  const status = el('span', { class: 'muted small' });
  getBuchungssperre().then((d) => { input.value = d || ''; }).catch(() => {});
  return el('div', { class: 'setting' }, [
    el('div', { class: 'setting-label', text: t('settings.sperre') }),
    el('div', { class: 'btn-row' }, [
      input,
      el('button', { class: 'btn btn-sm', text: t('common.save'), onClick: async () => { await setBuchungssperre(input.value.trim()); status.textContent = t('settings.saved'); } }),
      el('button', { class: 'btn btn-sm', text: t('settings.sperreClear'), onClick: async () => { input.value = ''; await setBuchungssperre(''); status.textContent = t('settings.saved'); } }),
      status,
    ]),
    el('p', { class: 'muted small', text: t('settings.sperreHint') }),
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
    const cfg = await getAiConfig().catch(() => ({ visionKey: '', mistralKey: '', mistralModel: 'mistral-small-latest', anbieterWahl: undefined }));
    const visionKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'AIza… (Google Vision EU)', value: cfg.visionKey || '' });
    const mistralKey = el('input', { type: 'password', autocomplete: 'off', placeholder: 'Mistral API-Key (EU)', value: cfg.mistralKey || '' });
    const model = el('select', {}, MISTRAL_MODELS.map((m) => el('option', { value: m.id }, m.label)));
    model.value = cfg.mistralModel;
    const status = el('p', { class: 'muted small' });

    // KI-Anbieter je Funktion (strikt EU). Ein Select je Modus, nur erlaubte (EU/lokale) Anbieter.
    const wahl = normalizeAnbieterWahl(cfg.anbieterWahl);
    const wahlSelects = {};
    const anbieterFeld = (modus) => {
      const sel = el('select', {}, erlaubteAnbieter(modus).map((a) => el('option', { value: a.id }, t('settings.aiProv.' + a.id))));
      sel.value = wahl[modus];
      wahlSelects[modus] = sel;
      return el('label', { class: 'field' }, [el('span', { text: t('settings.aiMode.' + modus) }), sel]);
    };
    const aktuelleWahl = () => { const w = {}; for (const m of KI_MODI) w[m] = wahlSelects[m].value; return w; };

    const aktuelleConfig = () => ({
      visionKey: visionKey.value.trim(), mistralKey: mistralKey.value.trim(),
      mistralModel: model.value, anbieterWahl: aktuelleWahl(),
    });

    const save = el('button', {
      class: 'btn', text: t('settings.aiSave'),
      onClick: async () => {
        await saveAiConfig(aktuelleConfig());
        status.textContent = t('settings.aiSaved') + ' ' + t('settings.aiPersistHint');
      },
    });

    // Test-Knopf: speichert erst, dann ruft die Live-API minimal an.
    const testRow = (label, runTest, getVal) => {
      const out = el('div', { class: 'test-status muted small' });
      const btn = el('button', {
        class: 'btn btn-sm', text: t('settings.aiTest'),
        onClick: async () => {
          await saveAiConfig(aktuelleConfig());
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
      el('div', { class: 'setting-label', text: t('settings.aiProviderTitle') }),
      el('p', { class: 'muted small', text: t('settings.aiProviderHint') }),
      ...KI_MODI.map((m) => anbieterFeld(m)),
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
