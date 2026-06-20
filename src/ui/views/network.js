// src/ui/views/network.js — Mycel-Netzwerk (SBKIM). Lokale Andock-Vorbereitung:
// Identität erzeugen, Spore & SIGNAL.json herunterladen, fremde Spore verifizieren.
// Die LIVE-Registrierung im Hub + Handshake sind der menschlich vermittelte Schritt
// (Modul 09) — dabei werden fremde Repos NICHT von hier aus verändert.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { downloadJson } from '../../core/files.js';
import { identityExists, createIdentity, loadIdentity, importIdentity, replaceIdentity } from '../../sbkim/identity.js';
import { buildSpore, verifySpore } from '../../sbkim/spore.js';
import { demoVector } from '../../sbkim/domainvector.js';
import { buildSignal } from '../../sbkim/signal.js';
import { NODE_PROFILE, KEYWORDS, CANONICAL_NODE_ID } from '../../sbkim/nodeProfile.js';

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
    toolsCard(),
    verifyCard(),
  ]));
}

// Verweise auf die vollständigen, eigenständigen SBKIM-Seiten (im Repo unter sbkim/,
// auf GitHub Pages direkt erreichbar). Bewusst getrennt von der App-Shell.
function toolsCard() {
  const link = (href, label) => el('a', {
    class: 'btn', href, target: '_blank', rel: 'noopener',
  }, label);
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('net.tools') }),
    el('p', { class: 'muted small', text: t('net.toolsIntro') }),
    el('div', { class: 'btn-row' }, [
      link('./sbkim/mycelknoten.html', t('net.openNode')),
      link('./sbkim/andock.html', t('net.openAndock')),
    ]),
    el('p', { class: 'muted small', text: t('net.toolsWarn') }),
  ]);
}

function identityCard(ident) {
  if (!ident) {
    const importTa = el('textarea', { class: 'beleg-text', rows: '5', placeholder: t('net.importPlaceholder') });
    const importOut = el('div', { class: 'muted small' });
    return el('div', { class: 'card' }, [
      el('h2', { class: 'card-title', text: t('net.identity') }),
      el('img', { class: 'empty-illu', src: './assets/img/empty-network.png', alt: '', loading: 'lazy' }),
      el('p', { class: 'muted small', text: t('net.intro') }),
      el('div', { class: 'btn-row' }, [el('button', {
        class: 'btn btn-primary', text: t('net.create'),
        onClick: async () => { await createIdentity(); await repaint(); },
      })]),
      el('h3', { class: 'card-title', style: 'margin-top:1rem', text: t('net.import') }),
      el('p', { class: 'muted small', text: t('net.importIntro') }),
      importTa,
      el('div', { class: 'btn-row' }, [el('button', {
        class: 'btn', text: t('net.importBtn'),
        onClick: async () => {
          importOut.replaceChildren();
          let parsed;
          try { parsed = JSON.parse(importTa.value); } catch { importOut.textContent = 'JSON?'; return; }
          try {
            await importIdentity({ privJwk: parsed.privJwk, pubJwk: parsed.pubJwk });
            await repaint();
          } catch (e) { importOut.textContent = t('net.importErr') + e.message; }
        },
      })]),
      importOut,
    ]);
  }
  const canonical = ident.id === CANONICAL_NODE_ID;
  const children = [
    el('h2', { class: 'card-title', text: t('net.identity') }),
    el('div', { class: 'report-line' }, [el('span', { text: t('net.nodeId') }), el('code', { class: 'mono small', text: ident.id })]),
    el('div', { class: 'report-line' }, [el('span', { text: 'publicKey.x' }), el('code', { class: 'mono small', text: ident.x })]),
  ];
  if (canonical) {
    children.push(el('p', { class: 'muted small', text: t('net.idCanonical') }));
  } else {
    // Diese App-Identität weicht von der registrierten/committeten Spore ab → der Knoten
    // „wandert". Anbieten, den kanonischen Schlüssel (sbkim/.node-secret.json) zu importieren.
    const replaceTa = el('textarea', { class: 'beleg-text', rows: '5', placeholder: t('net.importPlaceholder') });
    const replaceOut = el('div', { class: 'muted small' });
    children.push(
      el('div', { class: 'banner banner-warn', text: t('net.idMismatch').replace('%ID%', CANONICAL_NODE_ID) }),
      el('h3', { class: 'card-title', style: 'margin-top:1rem', text: t('net.replace') }),
      el('p', { class: 'muted small', text: t('net.replaceIntro') }),
      replaceTa,
      el('div', { class: 'btn-row' }, [el('button', {
        class: 'btn btn-primary', text: t('net.replaceBtn'),
        onClick: async () => {
          replaceOut.replaceChildren();
          let parsed;
          try { parsed = JSON.parse(replaceTa.value); } catch { replaceOut.textContent = 'JSON?'; return; }
          try {
            const res = await replaceIdentity({ privJwk: parsed.privJwk, pubJwk: parsed.pubJwk });
            if (res.id !== CANONICAL_NODE_ID) { replaceOut.textContent = t('net.replaceWrong'); }
            await repaint();
          } catch (e) { replaceOut.textContent = t('net.importErr') + e.message; }
        },
      })]),
      replaceOut,
    );
  }
  return el('div', { class: 'card' }, children);
}

function deployCard(ident) {
  const status = el('p', { class: 'muted small' });
  const sporeBtn = el('button', {
    class: 'btn', text: t('net.downloadSpore'),
    onClick: async () => {
      const spore = await buildSpore(ident.keys, {
        ...NODE_PROFILE,
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
