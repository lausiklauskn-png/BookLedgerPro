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
import { PEERS, checkAllPeers } from '../../sbkim/peers.js';
import { buildPassageText, buildCapText, buildNeedsText, embedTexts, EMBED_MODEL } from '../../sbkim/embed.js';

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
    ident ? embeddingCard(ident) : null,
    briefkastenCard(),
    toolsCard(),
    verifyCard(),
  ]));
}

// Briefkasten/Verkehr: prüft live, ob die angeschlossenen Knoten erreichbar sind
// (deren öffentliche SIGNAL.json). Opt-in per Knopf (kein Auto-Netz). Offline-first:
// Fehler → „nicht erreichbar", nie ein Absturz. Nur Lesen, keine Geheimnisse.
function briefkastenCard() {
  const out = el('div', { class: 'report-line-group' });
  const summary = el('p', { class: 'muted small' });
  const check = async (btn) => {
    summary.textContent = t('net.bkChecking');
    out.replaceChildren();
    if (btn) btn.disabled = true;
    try {
      const { rows, summary: sum } = await checkAllPeers();
      summary.textContent = t('net.bkSummary').replace('%R%', sum.reachable).replace('%T%', sum.total);
      out.replaceChildren(...rows.map((r) => el('div', { class: 'report-line' }, [
        el('span', {}, [
          el('span', { class: 'mycel-dot', style: `display:inline-block;margin-right:.4rem;background:${r.reachable ? '#2ecc71' : 'var(--text-muted)'}` }),
          el('strong', { text: r.name }),
        ]),
        el('span', { class: 'muted small', text: r.reachable ? `seq ${r.seq ?? '—'} · ${r.headline || t('net.bkReachable')}` : t('net.bkOffline') }),
      ])));
    } catch {
      summary.textContent = t('net.bkOffline');
    } finally { if (btn) btn.disabled = false; }
  };
  const btn = el('button', { class: 'btn', text: t('net.bkCheck'), onClick: () => check(btn) });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('net.briefkasten') }),
    el('p', { class: 'muted small', text: t('net.bkIntro').replace('%N%', PEERS.length) }),
    el('div', { class: 'btn-row' }, [btn]),
    summary,
    out,
  ]);
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

// Echter Domänen-Vektor → verified-match. Opt-in (Sage-gesegnet: einmaliges Modell-Laden
// ≠ Betriebs-CDN): lädt transformers.js + e5-small EINMALIG, bettet den passage:-Text ein
// (mean-pool + L2=1), baut + RE-SIGNIERT die Spore mit dem echten Vektor (ohne _demo) und
// bietet sie zum Download. Nichts wird automatisch geladen; Modell-Gewichte nie ins Repo.
function embeddingCard(ident) {
  const passage = buildPassageText(NODE_PROFILE);
  const status = el('p', { class: 'muted small' });
  const out = el('div', { class: 'muted small' });
  const btn = el('button', {
    class: 'btn', text: t('net.embedBtn'),
    onClick: async () => {
      if (!window.confirm(t('net.embedConfirm'))) return;
      btn.setAttribute('disabled', '');
      out.replaceChildren();
      try {
        // Drei Vektoren in EINEM Modell-Laden: Domäne + Angebot (cap) + Bedarf (needs).
        const onStatus = (s) => { status.textContent = s; };
        const [dom, cap, needs] = await embedTexts(
          [buildPassageText(NODE_PROFILE), buildCapText(NODE_PROFILE), buildNeedsText(NODE_PROFILE)],
          { onStatus },
        );
        const spore = await buildSpore(ident.keys, {
          ...NODE_PROFILE, embeddingModel: EMBED_MODEL,
          domainVector: dom.vector, capVector: cap.vector, needsVector: needs.vector,
        });
        const v = await verifySpore(spore);
        if (!v.valid) { status.textContent = t('net.embedInvalid'); return; }
        downloadJson('spore.json', spore);
        status.textContent = t('net.embedDone').replace('%L2%', dom.l2.toFixed(4));
        out.appendChild(el('p', { class: 'mono small', text: `domain L2 ${dom.l2.toFixed(4)} · cap L2 ${cap.l2.toFixed(4)} · needs L2 ${needs.l2.toFixed(4)} (3 Schichten signiert)` }));
        out.appendChild(el('p', { class: 'muted small', text: t('net.embedNext') }));
      } catch (e) {
        status.textContent = t('net.embedFail').replace('%E%', String((e && e.message) || e));
      } finally { btn.removeAttribute('disabled'); }
    },
  });
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('net.embedTitle') }),
    el('p', { class: 'muted small', text: t('net.embedIntro') }),
    el('p', { class: 'mono small', text: passage }),
    el('div', { class: 'btn-row' }, [btn]),
    status,
    out,
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
