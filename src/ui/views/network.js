// src/ui/views/network.js — Mycel-Netzwerk (SBKIM). Lokale Andock-Vorbereitung:
// Identität erzeugen, Spore & SIGNAL.json herunterladen, fremde Spore verifizieren.
// Die LIVE-Registrierung im Hub + Handshake sind der menschlich vermittelte Schritt
// (Modul 09) — dabei werden fremde Repos NICHT von hier aus verändert.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { downloadJson } from '../../core/files.js';
import { identityExists, createIdentity, loadIdentity } from '../../sbkim/identity.js';
import { buildSpore, verifySpore } from '../../sbkim/spore.js';
import { demoVector } from '../../sbkim/domainvector.js';
import { buildSignal, ENDPOINT } from '../../sbkim/signal.js';

const KEYWORDS = ['Buchhaltung', 'Beleg', 'Konto', 'Rechnung', 'USt', 'EÜR', 'Kostenstelle', 'GoBD', 'Mitarbeiter', 'Auftrag'];

let _host = null;

export async function mountNetwork(host) {
  _host = host;
  await repaint();
}

async function repaint() {
  const exists = await identityExists();
  const ident = exists ? await loadIdentity() : null;
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('net.title') }),
    el('div', { class: 'banner banner-warn', text: t('net.andockNote') }),
    identityCard(ident),
    ident ? deployCard(ident) : null,
    verifyCard(),
  ]));
}

function identityCard(ident) {
  if (!ident) {
    return el('div', { class: 'card' }, [
      el('h2', { class: 'card-title', text: t('net.identity') }),
      el('img', { class: 'empty-illu', src: './assets/img/empty-network.png', alt: '', loading: 'lazy' }),
      el('p', { class: 'muted small', text: t('net.intro') }),
      el('div', { class: 'btn-row' }, [el('button', {
        class: 'btn btn-primary', text: t('net.create'),
        onClick: async () => { await createIdentity(); await repaint(); },
      })]),
    ]);
  }
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('net.identity') }),
    el('div', { class: 'report-line' }, [el('span', { text: t('net.nodeId') }), el('code', { class: 'mono small', text: ident.id })]),
    el('div', { class: 'report-line' }, [el('span', { text: 'publicKey.x' }), el('code', { class: 'mono small', text: ident.x })]),
  ]);
}

function deployCard(ident) {
  const status = el('p', { class: 'muted small' });
  const sporeBtn = el('button', {
    class: 'btn', text: t('net.downloadSpore'),
    onClick: async () => {
      const spore = await buildSpore(ident.keys, {
        domain: 'BookLedgerPro-Buchhaltung',
        domainDescription: 'Offline-first, verschlüsselte Buchhaltung: Belege, Konten, USt/EÜR, GoBD, Aufträge.',
        domainKeywords: KEYWORDS,
        endpoint: ENDPOINT,
        nodeName: 'BookLedgerPro',
        domainVector: demoVector(KEYWORDS),
      });
      downloadJson('spore.json', spore);
      status.textContent = t('net.deployHint');
    },
  });
  const signalBtn = el('button', {
    class: 'btn', text: t('net.downloadSignal'),
    onClick: () => {
      downloadJson('SIGNAL.json', buildSignal({ nodeId: ident.id, seq: 1, headline: 'BookLedgerPro-Knoten vorbereitet (verified-spore-Andock).', forNodes: ['*'] }));
      status.textContent = t('net.deployHint');
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('net.spore') }),
    el('p', { class: 'muted small', text: t('net.deployIntro') }),
    el('div', { class: 'btn-row' }, [sporeBtn, signalBtn]),
    status,
  ]);
}

function verifyCard() {
  const ta = el('textarea', { class: 'beleg-text', rows: '5', placeholder: t('net.verifyPlaceholder') });
  const out = el('div', { class: 'muted small' });
  const btn = el('button', {
    class: 'btn', text: t('net.verifyBtn'),
    onClick: async () => {
      out.replaceChildren();
      let spore;
      try { spore = JSON.parse(ta.value); } catch { out.textContent = 'JSON?'; return; }
      const res = await verifySpore(spore);
      const line = (label, ok) => el('div', { text: `${ok ? '✔' : '✗'} ${label}` });
      out.appendChild(el('strong', { text: res.valid ? t('net.valid') : t('net.invalid') }));
      out.appendChild(line('Pflichtfelder', res.checks.fields));
      out.appendChild(line('id == SHA256(pubkey)', res.checks.id));
      out.appendChild(line('Signatur', res.checks.signature));
      out.appendChild(line('Manipulationsprobe', res.checks.tamper));
      if (res.errors.length) out.appendChild(el('p', { class: 'form-error', text: res.errors.join(' · ') }));
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('net.verify') }),
    ta,
    el('div', { class: 'btn-row' }, [btn]),
    out,
  ]);
}
