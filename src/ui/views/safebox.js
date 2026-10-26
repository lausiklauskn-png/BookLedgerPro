// src/ui/views/safebox.js — Geheim-Fach ("Tresor im Tresor").
// Unabhängig verschlüsselter Bereich mit eigenem Code, getrennt vom Haupt-Tresor.
// Für besonders sensible Dinge: Schlüssel (z.B. SBKIM-Identität), Verträge, Codes.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { bytesToB64u, b64uToBytes } from '../../core/crypto.js';
import { readFileBytes, downloadBlob, downloadText, pickFile, formatBytes } from '../../core/files.js';
import {
  safeboxExists, isSafeOpen, setupSafebox, unlockSafebox, lockSafebox,
  recoverSafebox, listEntries, getEntry, addEntry, deleteEntry,
} from '../../core/safebox.js';

let _host = null;

export async function mountSafebox(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const exists = await safeboxExists();
  let card;
  if (!exists) card = setupCard();
  else if (!isSafeOpen()) card = unlockCard();
  else card = await manageCard();
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('safe.title') }),
    el('div', { class: 'banner banner-warn', text: t('safe.note') }),
    card,
  ]));
}

function sharesCard(shares) {
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('safe.sharesTitle') }),
    el('p', { class: 'form-error', text: t('safe.sharesWarn') }),
    el('div', {}, shares.map((s) => el('code', { class: 'mono small', style: 'display:block;margin:.2rem 0;word-break:break-all', text: s }))),
    el('div', { class: 'btn-row' }, [el('button', {
      class: 'btn', text: t('safe.sharesDownload'),
      onClick: () => downloadText('bookledgerpro-geheimfach-shares.txt', shares.join('\n') + '\n'),
    })]),
  ]);
}

function setupCard() {
  const pw = el('input', { type: 'password', autocomplete: 'new-password', placeholder: t('safe.codePlaceholder') });
  const pw2 = el('input', { type: 'password', autocomplete: 'new-password', placeholder: t('safe.codeRepeat') });
  const out = el('div', { class: 'muted small' });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('safe.setup') }),
    el('p', { class: 'muted small', text: t('safe.setupIntro') }),
    pw, pw2,
    el('div', { class: 'btn-row' }, [el('button', {
      class: 'btn btn-primary', text: t('safe.setupBtn'),
      onClick: async () => {
        out.replaceChildren();
        if (pw.value.length < 8) { out.textContent = t('safe.errShort'); return; }
        if (pw.value !== pw2.value) { out.textContent = t('safe.errMismatch'); return; }
        try {
          const { shares } = await setupSafebox(pw.value);
          mount(_host, el('section', { class: 'view' }, [
            el('h1', { text: t('safe.title') }),
            el('div', { class: 'banner banner-warn', text: t('safe.note') }),
            sharesCard(shares),
            el('div', { class: 'btn-row' }, [el('button', { class: 'btn btn-primary', text: t('safe.continue'), onClick: repaint })]),
          ]));
        } catch (e) { out.textContent = e.message; }
      },
    })]),
    out,
  ]);
}

function unlockCard() {
  const pw = el('input', { type: 'password', autocomplete: 'current-password', placeholder: t('safe.codePlaceholder') });
  const out = el('div', { class: 'muted small' });
  // Recovery (Shamir) — eingeklappt.
  const recShares = el('textarea', { class: 'beleg-text', rows: '3', placeholder: t('safe.recSharesPlaceholder') });
  const recPw = el('input', { type: 'password', autocomplete: 'new-password', placeholder: t('safe.recNewCode') });
  const recOut = el('div', { class: 'muted small' });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('safe.unlock') }),
    pw,
    el('div', { class: 'btn-row' }, [el('button', {
      class: 'btn btn-primary', text: t('safe.unlockBtn'),
      onClick: async () => {
        out.replaceChildren();
        try { await unlockSafebox(pw.value); await repaint(); }
        catch (e) { out.textContent = e.message; }
      },
    })]),
    out,
    el('h3', { class: 'card-title', style: 'margin-top:1rem', text: t('safe.recover') }),
    el('p', { class: 'muted small', text: t('safe.recoverIntro') }),
    recShares, recPw,
    el('div', { class: 'btn-row' }, [el('button', {
      class: 'btn', text: t('safe.recoverBtn'),
      onClick: async () => {
        recOut.replaceChildren();
        const shares = recShares.value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        if (shares.length < 2) { recOut.textContent = t('safe.errShares'); return; }
        try { await recoverSafebox(shares, recPw.value); await repaint(); }
        catch (e) { recOut.textContent = e.message; }
      },
    })]),
    recOut,
  ]);
}

async function manageCard() {
  const entries = await listEntries();
  const out = el('div', { class: 'muted small' });

  // Eintrag hinzufügen
  const typeSel = el('select', {}, [
    el('option', { value: 'schluessel', text: t('safe.typeKey') }),
    el('option', { value: 'text', text: t('safe.typeText') }),
    el('option', { value: 'datei', text: t('safe.typeFile') }),
  ]);
  const nameInp = el('input', { placeholder: t('safe.entryName') });
  const valTa = el('textarea', { class: 'beleg-text', rows: '4', placeholder: t('safe.entryValue') });
  let pickedFile = null;
  const fileInfo = el('span', { class: 'muted small' });
  const fileBtn = el('button', {
    class: 'btn', text: t('safe.pickFile'),
    onClick: async () => { pickedFile = await pickFile(); fileInfo.textContent = pickedFile ? `${pickedFile.name} (${formatBytes(pickedFile.size)})` : ''; },
  });
  const fileRow = el('div', { class: 'btn-row', style: 'display:none' }, [fileBtn, fileInfo]);
  typeSel.addEventListener('change', () => {
    const isFile = typeSel.value === 'datei';
    fileRow.style.display = isFile ? '' : 'none';
    valTa.style.display = isFile ? 'none' : '';
  });

  const addBtn = el('button', {
    class: 'btn btn-primary', text: t('safe.addBtn'),
    onClick: async () => {
      out.replaceChildren();
      if (!nameInp.value.trim()) { out.textContent = t('safe.errName'); return; }
      try {
        if (typeSel.value === 'datei') {
          if (!pickedFile) { out.textContent = t('safe.errNoFile'); return; }
          const bytes = await readFileBytes(pickedFile);
          await addEntry({ type: 'datei', name: nameInp.value.trim(), value: bytesToB64u(bytes), fileName: pickedFile.name, mime: pickedFile.type || 'application/octet-stream' });
        } else {
          await addEntry({ type: typeSel.value, name: nameInp.value.trim(), value: valTa.value });
        }
        await repaint();
      } catch (e) { out.textContent = e.message; }
    },
  });

  // Drag-and-drop: Datei(en) direkt ins Fach ziehen → je Datei ein verschlüsselter
  // 'datei'-Eintrag (umgeht das Typ-Menü). Ordner sind ein Datei-Baum, kein einzelner
  // Wert — daher abgewiesen mit Hinweis (als ZIP ablegen). Name = Dateiname, bzw. die
  // eingetippte Bezeichnung bei genau einer Datei.
  async function addFilesAsEntries(files) {
    out.replaceChildren();
    const arr = Array.from(files || []);
    if (!arr.length) return;
    try {
      for (const f of arr) {
        const bytes = await readFileBytes(f);
        const name = (arr.length === 1 && nameInp.value.trim()) ? nameInp.value.trim() : f.name;
        await addEntry({ type: 'datei', name, value: bytesToB64u(bytes), fileName: f.name, mime: f.type || 'application/octet-stream' });
      }
      await repaint();
    } catch (e) { out.textContent = e.message; }
  }
  const dropZone = el('div', { class: 'safe-dropzone', text: t('safe.dropHint') });
  dropZone.addEventListener('dragover', (ev) => { ev.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', async (ev) => {
    ev.preventDefault();
    dropZone.classList.remove('dragover');
    const dt = ev.dataTransfer;
    if (!dt) return;
    // Ordner-Erkennung (webkitGetAsEntry) → freundlich abweisen.
    if (dt.items && dt.items.length) {
      for (const it of dt.items) {
        const entry = it.webkitGetAsEntry && it.webkitGetAsEntry();
        if (entry && entry.isDirectory) { out.replaceChildren(); out.textContent = t('safe.dropFolder'); return; }
      }
    }
    if (dt.files && dt.files.length) await addFilesAsEntries(dt.files);
  });

  const list = entries.length
    ? el('ul', { style: 'list-style:none;padding:0;margin:0' }, entries.map((e) => entryRow(e)))
    : el('p', { class: 'muted small', text: t('safe.empty') });

  return el('div', { class: 'card' }, [
    el('div', { class: 'report-line' }, [
      el('h2', { class: 'card-title', text: t('safe.open') }),
      el('button', { class: 'btn', text: t('safe.lock'), onClick: () => { lockSafebox(); repaint(); } }),
    ]),
    list,
    el('h3', { class: 'card-title', style: 'margin-top:1rem', text: t('safe.add') }),
    dropZone,
    typeSel, nameInp, valTa, fileRow,
    el('div', { class: 'btn-row' }, [addBtn]),
    out,
  ]);
}

function entryRow(e) {
  const reveal = el('div', { class: 'muted small' });
  const revealBtn = el('button', {
    class: 'btn', text: t('safe.reveal'),
    onClick: async () => {
      const full = await getEntry(e.id);
      if (!full) return;
      if (e.type === 'datei') {
        downloadBlob(full.fileName || e.name, b64uToBytes(full.value), full.mime || 'application/octet-stream');
        reveal.textContent = t('safe.downloaded');
      } else {
        reveal.replaceChildren(el('code', { class: 'mono small', style: 'word-break:break-all;white-space:pre-wrap', text: full.value || '' }));
      }
    },
  });
  const delBtn = el('button', {
    class: 'btn btn-danger', text: t('safe.delete'),
    onClick: async () => { await deleteEntry(e.id); await repaint(); },
  });
  const label = { schluessel: t('safe.typeKey'), text: t('safe.typeText'), datei: t('safe.typeFile') }[e.type] || e.type;
  return el('li', {}, [
    el('div', { class: 'report-line' }, [
      el('span', {}, [el('strong', { text: e.name }), el('span', { class: 'muted small', text: ` · ${label} · ${formatBytes(e.size)}` })]),
      el('span', { class: 'btn-row' }, [revealBtn, delBtn]),
    ]),
    reveal,
  ]);
}
