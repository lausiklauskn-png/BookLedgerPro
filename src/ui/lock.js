// src/ui/lock.js
// Sperrbildschirm + Ersteinrichtung (Onboarding).
// Onboarding-Reihenfolge erzwingt Datendurabilität:
//   Passwort → Shamir-Shares sichern → erstes verschlüsseltes Backup → fertig.

import { el, mount } from './dom.js';
import { t } from './i18n.js';
import { setupVault, unlockVault, vaultExists } from '../core/vault.js';
import { exportBackupFile } from '../core/backup.js';
import { MycelMark } from './mycel.js';
import { createMycelBackground } from './mycelCanvas.js';

/**
 * Rendert Lock/Onboarding in `container`.
 * @returns {Promise<void>} löst auf, sobald der Tresor entsperrt ist.
 */
export async function showLockScreen(container) {
  const exists = await vaultExists();
  return new Promise((resolve) => {
    if (exists) renderUnlock(container, resolve);
    else renderOnboarding(container, resolve);
  });
}

function shell(children) {
  return el('div', { class: 'lock-screen' }, [
    createMycelBackground(),
    el('div', { class: 'lock-card' }, [
      el('div', { class: 'brand' }, [MycelMark(40), el('span', { class: 'brand-name', text: t('app.name') })]),
      el('img', { class: 'lock-hero', src: './assets/img/hero-lock.png', alt: '', loading: 'eager' }),
      ...children,
    ]),
  ]);
}

// ---- Entsperren -------------------------------------------------------------

function renderUnlock(container, resolve) {
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
  ]);

  mount(container, shell([form]));
  pwd.focus();
}

// ---- Onboarding -------------------------------------------------------------

function renderOnboarding(container, resolve) {
  const state = { password: null, backupDone: false };

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
      el('h1', { text: t('onboard.title') }),
      el('p', { class: 'muted', text: t('onboard.intro') }),
      el('label', { class: 'field' }, [el('span', { text: t('onboard.password') }), p1]),
      el('label', { class: 'field' }, [el('span', { text: t('onboard.passwordRepeat') }), p2]),
      err, btn,
    ]);
    mount(container, shell([form]));
    p1.focus();
  }

  function stepShamir(shares) {
    const list = el('div', { class: 'shares' },
      shares.map((s, i) => el('div', { class: 'share' }, [
        el('span', { class: 'share-no', text: `#${i + 1}` }),
        el('code', { class: 'share-code', text: s }),
      ]))
    );
    const next = el('button', { class: 'btn btn-primary', text: t('common.save'), onClick: () => stepBackup() });
    mount(container, shell([
      el('h1', { text: t('onboard.shamirTitle') }),
      el('p', { class: 'muted', text: t('onboard.shamirIntro') }),
      list,
      next,
    ]));
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
    ]));
  }

  stepPassword();
}
