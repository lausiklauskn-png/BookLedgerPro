// src/ui/lock.js
// Sperrbildschirm + Ersteinrichtung (Onboarding).
// Onboarding-Reihenfolge erzwingt Datendurabilität:
//   Passwort → Shamir-Shares sichern → erstes verschlüsseltes Backup → fertig.

import { el, mount } from './dom.js';
import { t } from './i18n.js';
import { setupVault, unlockVault, vaultExists } from '../core/vault.js';
import { exportBackupFile } from '../core/backup.js';
import { updateSettings } from '../state.js';
import { MycelMark } from './mycel.js';
import { createMycelBackground } from './mycelCanvas.js';
import { ladeRegistry, registriereMandant, wechsleAktivenMandant } from '../core/mandantenStore.js';
import { brauchtMandantenAuswahl, mandantenAuswahlListe, validateMandantName } from '../domain/mandanten.js';

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
    if (brauchtMandantenAuswahl(registry)) {
      renderMandantenAuswahl(container, resolve);
    } else {
      // 0 Mandanten (frische Installation) oder genau 1 (Bestand): auf der aktiven DB
      // entweder entsperren oder onboarden. Bei 1 registriertem Mandanten kann von hier
      // aus auch ein weiterer angelegt werden (Bootstrap bis zum Shell-Trigger in M3).
      enterAktivenMandant(container, resolve, { kannHinzufuegen: registry.mandanten.length > 0 });
    }
  });
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

    mount(container, shell([
      el('h1', { text: t('mandant.selectTitle') }),
      el('p', { class: 'muted', text: t('mandant.selectIntro') }),
      el('div', { class: 'mandant-list' }, items),
      neu,
      el('p', { class: 'muted small', text: t('mandant.dsgvo') }),
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
    el('h1', { text: t('lock.title') }),
    el('label', { class: 'field' }, [el('span', { text: t('lock.password') }), pwd]),
    err, btn,
    // Zur Mandanten-Auswahl zurück (wenn aus der Auswahl gekommen) bzw. weiteren
    // Mandanten anlegen (Bootstrap bei genau einem Mandanten, bis M3 den Shell-Trigger bringt).
    opts.zurueck
      ? el('button', { class: 'btn btn-link', type: 'button', text: t('mandant.switch'), onClick: opts.zurueck })
      : (opts.kannHinzufuegen
        ? el('button', { class: 'btn btn-link', type: 'button', text: t('mandant.new'),
            onClick: () => renderNeuerMandant(container, resolve, () => enterAktivenMandant(container, resolve, opts)) })
        : null),
  ]);

  mount(container, shell([form]));
  pwd.focus();
}

// ---- Onboarding -------------------------------------------------------------

function renderOnboarding(container, resolve, opts = {}) {
  const state = { password: null, backupDone: false };
  // Beim Anlegen eines weiteren Mandanten zeigt eine Kopfzeile, für welchen Mandanten
  // dieser eigene Tresor (Passwort/Shamir/Backup) gerade eingerichtet wird.
  const mandantNote = opts.mandantName
    ? el('p', { class: 'muted small mandant-context', text: t('mandant.onboardFor').replace('{name}', opts.mandantName) })
    : null;

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
        stepShamir(shares);
      },
    }, [
      mandantNote,
      el('h1', { text: t('onboard.title') }),
      el('p', { class: 'muted', text: t('onboard.intro') }),
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
      stepBackup();
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

  function stepBackup() {
    const status = el('p', { class: 'muted' });
    const finish = el('button', { class: 'btn btn-primary', text: t('onboard.finish'), disabled: true });
    finish.setAttribute('disabled', '');

    const dl = el('button', {
      class: 'btn',
      text: t('onboard.backupDownload'),
      onClick: async () => {
        await exportBackupFile(state.password);
        state.backupDone = true;
        status.textContent = t('onboard.backupDone');
        finish.removeAttribute('disabled');
      },
    });

    finish.addEventListener('click', () => { if (state.backupDone) resolve(); });

    mount(container, shell([
      el('h1', { text: t('onboard.backupTitle') }),
      el('p', { class: 'muted', text: t('onboard.backupIntro') }),
      dl, status, finish,
    ], './assets/img/onboard-backup.png'));
  }

  stepPassword();
}
