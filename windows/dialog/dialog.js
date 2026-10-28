/* Eigenes Fenster der Hülle für Passwort und Spracheingabe (Muster Private Brain Pro). Die Seite der App sieht weder
   dieses Fenster noch das Passwort: es geht von hier über die Hülle direkt an die Engine. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id), invoke = window.__TAURI_INTERNALS__.invoke;
  const token = window.__BLP_DIALOG_SESSION; delete window.__BLP_DIALOG_SESSION;
  const W = {
    de: { cancel: 'Abbrechen', submit: 'Weiter', password: 'Passwort', repeat: 'Passwort wiederholen',
      notice: 'Ohne dieses Passwort oder die Ersatzschlüssel ist der Tresorordner verloren. Niemand kann es wiederherstellen.',
      short: 'Die Passwörter stimmen nicht überein oder sind kürzer als 10 Zeichen.', missing: 'Bitte das Passwort eingeben.',
      speak: 'Sprich jetzt', speakHelp: 'Windows-Spracherkennung auf diesem Rechner, ohne Internet. Ende nach einem Satz oder spätestens nach einer Minute.' },
    en: { cancel: 'Cancel', submit: 'Continue', password: 'Password', repeat: 'Repeat password',
      notice: 'Without this password or the recovery keys the vault folder is lost. Nobody can recover it.',
      short: 'The passwords do not match or have fewer than 10 characters.', missing: 'Please enter the password.',
      speak: 'Speak now', speakHelp: 'Windows speech recognition on this computer, without internet. Ends after one phrase or at most one minute.' },
  };
  let config = {}, w = W.de;
  const call = (action, fields) => invoke('blp_dialog', { action, fields: fields || null }, { headers: { 'x-blp-session': token } });
  $('cancel').onclick = () => call('cancel');
  addEventListener('keydown', (e) => { if (e.key === 'Escape') void call('cancel'); });
  $('form').onsubmit = async (e) => {
    e.preventDefault(); $('status').textContent = '';
    if (config.kind !== 'password') return;
    const password = $('password').value, repeat = $('repeat').value;
    if (!password) { $('status').textContent = w.missing; return; }
    if (config.zweimal && (password.length < 10 || password !== repeat || (config.mode === 'create' && !$('notice').checked))) { $('status').textContent = w.short; return; }
    $('submit').disabled = true;
    try { await call('submit', { password, repeat: config.zweimal ? repeat : '' }); $('password').value = $('repeat').value = ''; }
    catch { $('submit').disabled = false; }
  };
  void call('config').then((value) => {
    config = value || {}; w = W[config.language] || W.de; document.documentElement.lang = config.language || 'de';
    $('cancel').textContent = w.cancel; $('submit').textContent = w.submit;
    $('password-caption').textContent = w.password; $('repeat-caption').textContent = w.repeat; $('notice-caption').textContent = w.notice;
    if (config.kind === 'speech') {
      $('title').textContent = w.speak; $('help').textContent = w.speakHelp;
      for (const id of ['password-label', 'repeat-label', 'notice-label', 'submit']) $(id).hidden = true;
      return;
    }
    $('title').textContent = config.titel || 'BookLedgerPro';
    $('help').textContent = config.text || ''; $('help').hidden = !config.text;
    $('repeat-label').hidden = !config.zweimal; $('notice-label').hidden = config.mode !== 'create';
    $('password').focus();
  });
})();
