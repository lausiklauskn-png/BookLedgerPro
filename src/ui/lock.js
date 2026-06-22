// src/ui/lock.js
// Sperrbildschirm + Ersteinrichtung (Onboarding).
// Onboarding-Reihenfolge erzwingt Datendurabilität:
//   Passwort → Shamir-Shares sichern → erstes verschlüsseltes Backup → fertig.

import { el, mount } from './dom.js';
import { t } from './i18n.js';
import { setupVault, unlockVault, vaultExists } from '../core/vault.js';
import { exportBackupSmart } from '../core/backup.js';
import { supportsDirectoryPicker, pickDirectory } from '../core/files.js';
import { merkeBackupOrdner } from '../core/backupOrdner.js';
import { BACKUP_STRATEGIEN, DEFAULT_BACKUP_STRATEGIE } from '../domain/backupStrategie.js';
import { RECHNUNGSSTELLE } from '../domain/rechnungsstelle.js';
import { updateSettings } from '../state.js';
import { MycelMark } from './mycel.js';
import { createMycelBackground } from './mycelCanvas.js';
import { ladeRegistry, registriereMandant, wechsleAktivenMandant } from '../core/mandantenStore.js';
import {
  erstelleSandboxTresor, wechsleZuSandbox, leereSandboxTresor,
  loescheSandboxTresor, loescheAlleSandboxes,
} from '../core/sandboxStore.js';
import { befuelleMitDemodaten } from '../domain/demodaten-store.js';
import {
  brauchtMandantenAuswahl, mandantenAuswahlListe, validateMandantName,
  aktiverSandbox, echteMandanten, sandboxAuswahlListe, naechsterTestName,
} from '../domain/mandanten.js';

/**
 * Rendert Lock/Onboarding in `container`.
 * @returns {Promise<void>} löst auf, sobald der Tresor entsperrt ist.
 *
 * Mehrmandanten (M2b): Liegen MEHRERE Mandanten vor, erscheint VOR dem Entsperren eine
 * Auswahlliste (jeder Mandant = eigener verschlüsselter Tresor). Bei genau einem (oder
 * keinem) Mandanten bleibt es beim direkten Entsperren/Onboarding — verhaltensneutral für
 * Bestandsnutzer. Die reine Entscheidungs-/Sortierlogik liegt node-getestet in
 * `domain/mandanten.js`; die Tresor-Umschaltung kapselt `core/mandantenStore.js`.
 */
export async function showLockScreen(container) {
  const registry = await ladeRegistry();
  return new Promise((resolve) => {
    // Test-Modus (docs/TEST_MODUS.md): steht ein Sandbox-Tresor aktiv (frisch angelegt oder
    // „behalten" + neu geladen) → direkt dort entsperren/onboarden, damit man im Test
    // weitermacht, wo man war. Ein klarer Rückweg führt zurück zur echten Welt.
    if (aktiverSandbox(registry)) {
      renderSandboxEinstieg(container, resolve, registry);
    } else if (brauchtMandantenAuswahl(registry)) {
      renderMandantenAuswahl(container, resolve);
    } else {
      // 0 Mandanten (frische Installation) oder genau 1 (Bestand): auf der aktiven DB
      // entweder entsperren oder onboarden. Bei 1 registriertem Mandanten kann von hier
      // aus auch ein weiterer angelegt werden (Bootstrap bis zum Shell-Trigger in M3).
      enterAktivenMandant(container, resolve, { kannHinzufuegen: registry.mandanten.length > 0 });
    }
  });
}

// Wiedereinstieg in den aktiven Test-Tresor (entsperren bzw. onboarden, falls geleert).
// „Zurück" führt zur echten Welt: bei mehreren echten Mandanten zur Auswahl, bei genau
// einem direkt dorthin (vorher aktiv umschalten), ohne echte Daten anzufassen.
function renderSandboxEinstieg(container, resolve, registry) {
  const sandbox = aktiverSandbox(registry);
  const zurueck = async () => {
    const echte = echteMandanten(registry);
    if (echte.length > 1) { renderMandantenAuswahl(container, resolve); }
    else if (echte.length === 1) { await wechsleAktivenMandant(echte[0].id); enterAktivenMandant(container, resolve, {}); }
    else { renderTestsAuswahl(container, resolve, null); }
  };
  enterAktivenMandant(container, resolve, { sandbox: true, mandantName: sandbox?.name, zurueck });
}

/** Entsperrt den aktiven Mandanten oder startet dessen Onboarding (frische Tresor-DB). */
async function enterAktivenMandant(container, resolve, opts = {}) {
  const exists = await vaultExists();
  if (exists) renderUnlock(container, resolve, opts);
  else renderOnboarding(container, resolve, opts);
}

// ---- Mandanten-Auswahl (M2b) ------------------------------------------------

function renderMandantenAuswahl(container, resolve) {
  ladeRegistry().then((registry) => {
    const zurueck = () => renderMandantenAuswahl(container, resolve);

    const onSelect = async (id) => {
      // DEK verwerfen + DB-Wechsel sind in wechsleAktivenMandant gekapselt.
      await wechsleAktivenMandant(id);
      await enterAktivenMandant(container, resolve, { zurueck });
    };

    const items = mandantenAuswahlListe(registry).map((m) => el('button', {
      class: 'btn mandant-item' + (m.aktiv ? ' is-active' : ''),
      type: 'button',
      onClick: () => onSelect(m.id),
    }, [
      el('span', { class: 'mandant-name', text: m.name }),
      m.aktiv ? el('span', { class: 'mandant-badge', text: t('mandant.active') }) : null,
    ]));

    const neu = el('button', {
      class: 'btn', type: 'button', text: t('mandant.new'),
      onClick: () => renderNeuerMandant(container, resolve, zurueck),
    });

    const tests = el('button', {
      class: 'btn btn-link test-link', type: 'button', text: t('test.open'),
      onClick: () => renderTestsAuswahl(container, resolve, zurueck),
    });

    mount(container, shell([
      el('h1', { text: t('mandant.selectTitle') }),
      el('p', { class: 'muted', text: t('mandant.selectIntro') }),
      el('div', { class: 'mandant-list' }, items),
      neu,
      el('p', { class: 'muted small', text: t('mandant.dsgvo') }),
      tests,
    ]));
  });
}

/**
 * Legt einen NEUEN Mandanten an: Name erfassen → Registry-Eintrag (`registriereMandant`)
 * → auf die neue, leere Tresor-DB umschalten (`wechsleAktivenMandant`) → Onboarding-Fluss
 * (eigenes Passwort/Shamir/Backup) in dieser DB. `zurueck` (optional) führt zur Auswahl.
 */
function renderNeuerMandant(container, resolve, zurueck) {
  const err = el('p', { class: 'form-error', role: 'alert' });
  const name = el('input', { type: 'text', placeholder: t('mandant.name'), autocomplete: 'organization' });
  const btn = el('button', { class: 'btn btn-primary', type: 'submit', text: t('mandant.create') });

  const form = el('form', {
    class: 'lock-form',
    onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const fehler = validateMandantName(name.value);
      if (fehler) { err.textContent = fehler; return; }
      btn.setAttribute('disabled', '');
      try {
        const { mandant } = await registriereMandant(name.value);
        await wechsleAktivenMandant(mandant.id); // DEK verwerfen + auf neue, leere DB schalten
        // Die neue DB hat noch keinen Tresor → Onboarding legt Passwort/Shamir/Backup an.
        renderOnboarding(container, resolve, { mandantName: mandant.name });
      } catch (ex) {
        err.textContent = ex?.message || String(ex);
        btn.removeAttribute('disabled');
      }
    },
  }, [
    el('h1', { text: t('mandant.newTitle') }),
    el('p', { class: 'muted', text: t('mandant.newIntro') }),
    el('label', { class: 'field' }, [el('span', { text: t('mandant.name') }), name]),
    err, btn,
    el('p', { class: 'muted small', text: t('mandant.dsgvo') }),
    zurueck ? el('button', { class: 'btn btn-link', type: 'button', text: t('common.back'), onClick: zurueck }) : null,
  ]);

  mount(container, shell([form], './assets/img/onboard-key.png'));
  name.focus();
}

// ---- Test-Modus (Sandbox-Tresore, docs/TEST_MODUS.md) -----------------------
// „🧪 Tests"-Bereich am Sperrbildschirm: vorhandene Tests öffnen/leeren/löschen, neuen Test
// anlegen, „Alle Tests löschen". Die reine Lebenszyklus-Logik liegt node-getestet im Kern
// (domain/mandanten.js) + der Store-Glue (core/sandboxStore.js); dieser DOM-Pfad ist
// „statisch geprüft" (kein Headless-Browser). Echte Daten bleiben unberührt (eigene DBs).

function renderTestsAuswahl(container, resolve, zurueck) {
  ladeRegistry().then((registry) => {
    const rerender = () => renderTestsAuswahl(container, resolve, zurueck);
    const tests = sandboxAuswahlListe(registry);

    const oeffne = async (id) => {
      await wechsleZuSandbox(id);  // DEK verwerfen + auf die Sandbox-DB schalten
      await enterAktivenMandant(container, resolve, { sandbox: true, zurueck: rerender });
    };
    const leeren = async (m) => {
      if (!confirm(t('test.confirmLeeren').replace('{name}', m.name))) return;
      await leereSandboxTresor(m.id); rerender();
    };
    const loeschen = async (m) => {
      if (!confirm(t('test.confirmLoeschen').replace('{name}', m.name))) return;
      await loescheSandboxTresor(m.id); rerender();
    };

    const rows = tests.map((m) => el('div', { class: 'mandant-admin-row' }, [
      el('button', { class: 'btn test-open', type: 'button', onClick: () => oeffne(m.id) }, [
        el('span', { class: 'mandant-name', text: m.name }),
        m.aktiv ? el('span', { class: 'mandant-badge', text: t('test.active') }) : null,
      ]),
      el('button', { class: 'btn btn-sm', type: 'button', text: t('test.leeren'), onClick: () => leeren(m) }),
      el('button', { class: 'btn btn-sm btn-danger', type: 'button', text: t('common.delete'), onClick: () => loeschen(m) }),
    ]));

    const alleLoeschen = tests.length ? el('button', {
      class: 'btn btn-sm btn-danger', type: 'button', text: t('test.alleLoeschen'),
      onClick: async () => { if (!confirm(t('test.confirmAlle'))) return; await loescheAlleSandboxes(); rerender(); },
    }) : null;

    mount(container, shell([
      el('h1', { text: t('test.title') }),
      el('p', { class: 'muted', text: t('test.intro') }),
      tests.length
        ? el('div', { class: 'mandant-admin' }, rows)
        : el('p', { class: 'muted small', text: t('test.empty') }),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-primary', type: 'button', text: t('test.neu'), onClick: () => renderNeuerTest(container, resolve, rerender) }),
        alleLoeschen,
      ]),
      el('p', { class: 'muted small', text: t('test.hinweis') }),
      zurueck ? el('button', { class: 'btn btn-link', type: 'button', text: t('common.back'), onClick: zurueck }) : null,
    ], './assets/img/onboard-key.png'));
  });
}

// Legt einen NEUEN, leeren Test-Tresor an (eigene Sandbox-DB) und führt anschließend in
// dessen verschlanktes Onboarding (nur Passwort — ein Test ist kein Backup, vgl. Spec).
function renderNeuerTest(container, resolve, zurueck) {
  ladeRegistry().then((registry) => {
    const err = el('p', { class: 'form-error', role: 'alert' });
    const name = el('input', { type: 'text', value: naechsterTestName(registry), placeholder: t('test.name') });
    const btn = el('button', { class: 'btn btn-primary', type: 'submit', text: t('test.create') });
    // Inhalt: leer ODER mit deterministischen Demo-Daten vorbefüllt (docs/TEST_MODUS.md) —
    // so kann man sofort mit realistischem Journal/EÜR/USt-VA/Anlagen üben.
    const inhaltLeer = el('input', { type: 'radio', name: 'test-inhalt', value: 'leer', checked: '' });
    const inhaltDemo = el('input', { type: 'radio', name: 'test-inhalt', value: 'demo' });
    const inhaltQuartal = el('input', { type: 'radio', name: 'test-inhalt', value: 'quartal' });

    const form = el('form', {
      class: 'lock-form',
      onSubmit: async (e) => {
        e.preventDefault();
        err.textContent = '';
        const fehler = validateMandantName(name.value);
        if (fehler) { err.textContent = fehler; return; }
        btn.setAttribute('disabled', '');
        try {
          const { mandant } = await erstelleSandboxTresor(name.value);
          renderOnboarding(container, resolve, {
            mandantName: mandant.name, sandbox: true,
            demo: inhaltQuartal.checked ? 'quartal' : inhaltDemo.checked ? 'klein' : null,
          });
        } catch (ex) {
          err.textContent = ex?.message || String(ex);
          btn.removeAttribute('disabled');
        }
      },
    }, [
      el('h1', { text: t('test.newTitle') }),
      el('p', { class: 'muted', text: t('test.newIntro') }),
      el('label', { class: 'field' }, [el('span', { text: t('test.name') }), name]),
      el('fieldset', { class: 'test-inhalt' }, [
        el('legend', { text: t('test.inhalt') }),
        el('label', { class: 'radio-row' }, [inhaltLeer, el('span', { text: t('test.inhaltLeer') })]),
        el('label', { class: 'radio-row' }, [inhaltDemo, el('span', { text: t('test.inhaltDemo') })]),
        el('label', { class: 'radio-row' }, [inhaltQuartal, el('span', { text: t('test.inhaltQuartal') })]),
      ]),
      err, btn,
      el('button', { class: 'btn btn-link', type: 'button', text: t('common.back'), onClick: zurueck }),
    ]);

    mount(container, shell([form], './assets/img/onboard-key.png'));
    name.focus(); name.select();
  });
}

function shell(children, hero = './assets/img/hero-lock.png') {
  return el('div', { class: 'lock-screen' }, [
    createMycelBackground(),
    el('div', { class: 'lock-card' }, [
      el('div', { class: 'brand' }, [MycelMark(40), el('span', { class: 'brand-name', text: t('app.name') })]),
      el('img', { class: 'lock-hero', src: hero, alt: '', loading: 'eager' }),
      ...children,
    ]),
  ]);
}

// ---- Entsperren -------------------------------------------------------------

function renderUnlock(container, resolve, opts = {}) {
  const err = el('p', { class: 'form-error', role: 'alert' });
  const pwd = el('input', { type: 'password', id: 'pwd', autocomplete: 'current-password', placeholder: t('lock.password') });
  const btn = el('button', { class: 'btn btn-primary', type: 'submit', text: t('lock.unlock') });

  const form = el('form', {
    class: 'lock-form',
    onSubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      btn.setAttribute('disabled', '');
      try {
        await unlockVault(pwd.value);
        resolve();
      } catch {
        err.textContent = t('lock.wrongPassword');
        btn.removeAttribute('disabled');
        pwd.select();
      }
    },
  }, [
    // Test-Modus: deutlich kennzeichnen, dass hier ein Test-Tresor entsperrt wird (echte Daten unberührt).
    opts.sandbox
      ? el('p', { class: 'muted small mandant-context', text: t('test.unlockNote').replace('{name}', opts.mandantName || '') })
      : null,
    el('h1', { text: t('lock.title') }),
    el('label', { class: 'field' }, [el('span', { text: t('lock.password') }), pwd]),
    err, btn,
    ...unlockLinks(container, resolve, opts),
  ]);

  mount(container, shell([form]));
  pwd.focus();
}

// Fußzeilen-Links des Entsperr-Bildschirms — je nach Kontext: im Test-Tresor zurück zur
// echten Welt + Tests verwalten; sonst Mandanten wechseln/anlegen + Einstieg in den Test-Modus.
function unlockLinks(container, resolve, opts) {
  if (opts.sandbox) {
    return [
      el('button', { class: 'btn btn-link', type: 'button', text: t('test.manage'),
        onClick: () => renderTestsAuswahl(container, resolve, () => enterAktivenMandant(container, resolve, opts)) }),
      opts.zurueck
        ? el('button', { class: 'btn btn-link', type: 'button', text: t('test.backToReal'), onClick: opts.zurueck })
        : null,
    ];
  }
  // Zur Mandanten-Auswahl zurück (wenn aus der Auswahl gekommen) bzw. weiteren Mandanten
  // anlegen (Bootstrap bei genau einem Mandanten); zusätzlich Einstieg in den Test-Modus.
  return [
    opts.zurueck
      ? el('button', { class: 'btn btn-link', type: 'button', text: t('mandant.switch'), onClick: opts.zurueck })
      : (opts.kannHinzufuegen
        ? el('button', { class: 'btn btn-link', type: 'button', text: t('mandant.new'),
            onClick: () => renderNeuerMandant(container, resolve, () => enterAktivenMandant(container, resolve, opts)) })
        : null),
    el('button', { class: 'btn btn-link test-link', type: 'button', text: t('test.open'),
      onClick: () => renderTestsAuswahl(container, resolve, () => enterAktivenMandant(container, resolve, opts)) }),
  ];
}

// ---- Onboarding -------------------------------------------------------------

function renderOnboarding(container, resolve, opts = {}) {
  const state = { password: null, backupDone: false };
  // Beim Anlegen eines weiteren Mandanten zeigt eine Kopfzeile, für welchen Mandanten
  // dieser eigene Tresor (Passwort/Shamir/Backup) gerade eingerichtet wird. Test-Tresore
  // bekommen einen eigenen Hinweis (wegwerfbarer Spielplatz, eigenes Test-Passwort).
  const mandantNote = opts.sandbox
    ? el('p', { class: 'muted small mandant-context', text: t('test.onboardFor').replace('{name}', opts.mandantName || '') })
    : (opts.mandantName
      ? el('p', { class: 'muted small mandant-context', text: t('mandant.onboardFor').replace('{name}', opts.mandantName) })
      : null);

  function stepPassword() {
    const err = el('p', { class: 'form-error', role: 'alert' });
    const p1 = el('input', { type: 'password', autocomplete: 'new-password', placeholder: t('onboard.password'), minlength: '8' });
    const p2 = el('input', { type: 'password', autocomplete: 'new-password', placeholder: t('onboard.passwordRepeat'), minlength: '8' });
    const btn = el('button', { class: 'btn btn-primary', type: 'submit', text: t('onboard.create') });

    const form = el('form', {
      class: 'lock-form',
      onSubmit: async (e) => {
        e.preventDefault();
        err.textContent = '';
        if (p1.value.length < 8) { err.textContent = t('onboard.tooShort'); return; }
        if (p1.value !== p2.value) { err.textContent = t('onboard.mismatch'); return; }
        btn.setAttribute('disabled', '');
        state.password = p1.value;
        const { shares } = await setupVault(state.password);
        // Test-Tresor: verschlankt — nur ein Test-Passwort, kein Shamir-/Backup-Gate
        // (ein Test ist ausdrücklich KEIN Backup, docs/TEST_MODUS.md) → direkt in die App.
        if (opts.sandbox) {
          // Optionale Demo-Vorbefüllung: schreibt den deterministischen Demo-Mandanten in den
          // gerade entsperrten Sandbox-Tresor (echte Daten unberührt — eigene DB). Scheitert das
          // Befüllen, startet der Test trotzdem (leer) statt zu blockieren.
          if (opts.demo) {
            try { await befuelleMitDemodaten(opts.demo); }
            catch (ex) { console.warn('Demo-Vorbefüllung fehlgeschlagen:', ex); }
          }
          resolve(); return;
        }
        stepShamir(shares);
      },
    }, [
      mandantNote,
      el('h1', { text: opts.sandbox ? t('test.onboardTitle') : t('onboard.title') }),
      el('p', { class: 'muted', text: opts.sandbox ? t('test.onboardIntro') : t('onboard.intro') }),
      el('label', { class: 'field' }, [el('span', { text: t('onboard.password') }), p1]),
      el('label', { class: 'field' }, [el('span', { text: t('onboard.passwordRepeat') }), p2]),
      err, btn,
    ]);
    mount(container, shell([form], './assets/img/onboard-key.png'));
    p1.focus();
  }

  function stepShamir(shares) {
    const list = el('div', { class: 'shares' },
      shares.map((s, i) => el('div', { class: 'share' }, [
        el('span', { class: 'share-no', text: `#${i + 1}` }),
        el('code', { class: 'share-code', text: s }),
      ]))
    );
    const next = el('button', { class: 'btn btn-primary', text: t('common.save'), onClick: () => stepProfil() });
    mount(container, shell([
      el('h1', { text: t('onboard.shamirTitle') }),
      el('p', { class: 'muted', text: t('onboard.shamirIntro') }),
      list,
      next,
    ], './assets/img/onboard-shamir.png'));
  }

  // §19-Kleinunternehmer-Abfrage (steuert global, ob USt ausgewiesen wird).
  function stepProfil() {
    const waehle = async (klein) => {
      try { await updateSettings({ kleinunternehmer: klein }); } catch { /* Backup-Schritt bleibt der Gate */ }
      stepRechnungsstelle();
    };
    mount(container, shell([
      el('h1', { text: t('onboard.kleinTitle') }),
      el('p', { class: 'muted', text: t('onboard.kleinIntro') }),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-primary', text: t('onboard.kleinJa'), onClick: () => waehle(true) }),
        el('button', { class: 'btn', text: t('onboard.kleinNein'), onClick: () => waehle(false) }),
      ]),
      el('p', { class: 'muted small', text: t('onboard.kleinHint') }),
    ], './assets/img/onboard-key.png'));
  }

  // Nummernkreis-Hoheit (§14, Katalog §7a): Stellt BLP die Rechnungen aus (blp) oder
  // ein externes Programm/der Steuerberater (extern)? Default blp. In den Einstellungen
  // jederzeit änderbar.
  function stepRechnungsstelle() {
    const waehle = async (rs) => {
      try { await updateSettings({ rechnungsstelle: rs }); } catch { /* Backup-Schritt bleibt der Gate */ }
      stepBackup();
    };
    mount(container, shell([
      el('h1', { text: t('onboard.rechnungsstelleTitle') }),
      el('p', { class: 'muted', text: t('onboard.rechnungsstelleIntro') }),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn btn-primary', text: t('onboard.rechnungsstelleBlp'), onClick: () => waehle(RECHNUNGSSTELLE.BLP) }),
        el('button', { class: 'btn', text: t('onboard.rechnungsstelleExtern'), onClick: () => waehle(RECHNUNGSSTELLE.EXTERN) }),
      ]),
      el('p', { class: 'muted small', text: t('onboard.rechnungsstelleHint') }),
    ], './assets/img/onboard-key.png'));
  }

  function stepBackup() {
    const status = el('p', { class: 'muted' });
    const finish = el('button', { class: 'btn btn-primary', text: t('onboard.finish'), disabled: true });
    finish.setAttribute('disabled', '');

    // Sicherungs-Strategie schon im Onboarding wählbar (Schritt 3) — in den Einstellungen
    // änderbar. Default Download (überall verfügbar); „Ordner" braucht File System Access.
    let strategie = DEFAULT_BACKUP_STRATEGIE;
    const apiDa = supportsDirectoryPicker();

    const ordnerBtn = el('button', { class: 'btn btn-sm', text: t('backup.folderPick') });
    const ordnerHinweis = el('p', { class: 'muted small' });
    const ordnerZeile = el('div', { class: 'backup-folder', style: 'display:none' }, [ordnerBtn, ordnerHinweis]);
    ordnerBtn.addEventListener('click', async () => {
      const h = await pickDirectory();
      if (h) { await merkeBackupOrdner(h); ordnerHinweis.textContent = t('backup.folderCurrent').replace('{ordner}', h.name); }
    });

    const segWrap = el('div', { class: 'segmented' });
    const renderSeg = () => {
      segWrap.replaceChildren(...BACKUP_STRATEGIEN.map((val) => el('button', {
        class: 'seg' + (strategie === val ? ' active' : ''),
        text: t('backup.strategie.' + val),
        onClick: async () => {
          strategie = val;
          await updateSettings({ backupStrategie: val });
          ordnerZeile.style.display = (val === 'ordner') ? '' : 'none';
          if (val === 'ordner') {
            ordnerBtn.style.display = apiDa ? '' : 'none';
            if (!apiDa) ordnerHinweis.textContent = t('backup.noApiHint');
          }
          renderSeg();
        },
      })));
    };
    renderSeg();

    const dl = el('button', {
      class: 'btn',
      text: t('onboard.backupDownload'),
      onClick: async () => {
        try {
          const r = await exportBackupSmart(state.password, strategie);
          state.backupDone = true;
          status.textContent = r.ziel === 'ordner'
            ? t('backup.savedFolder').replace('{ordner}', r.ordner).replace('{name}', r.name)
            : t('onboard.backupDone');
          finish.removeAttribute('disabled');
        } catch (e) { status.textContent = String((e && e.message) || e); }
      },
    });

    finish.addEventListener('click', () => { if (state.backupDone) resolve(); });

    mount(container, shell([
      el('h1', { text: t('onboard.backupTitle') }),
      el('p', { class: 'muted', text: t('onboard.backupIntro') }),
      el('div', { class: 'setting-label small', text: t('settings.backup.title') }),
      segWrap, ordnerZeile,
      dl, status, finish,
    ], './assets/img/onboard-backup.png'));
  }

  stepPassword();
}
