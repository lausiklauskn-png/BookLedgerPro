// src/ui/views/sbkimsuche.js — Ansicht „SBKIM-Suche" (Hybrid-Match-Richter).
// Vorfilter (lokal, embed.js) + Richter (opt-in, Mistral EU/BYOK) + Fail-soft.
// Eigener, neutraler Menüpunkt — der Richter ist NIE eine Eintritts-Barriere.
//
// EHRLICHER HINWEIS: Modell-Laden (~30 MB, opt-in) und der echte Mistral-Richter-Lauf
// brauchen Netz + Browser — in der Bau-Umgebung NICHT testbar. Die Vertrags-/Modus-/
// Fail-soft-Logik (match.js/hybridSearch.js) ist node-getestet.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { loadAccounts } from '../../domain/store.js';
import { getAiConfig } from '../../ai/aiConfig.js';
import { loadEmbedder } from '../../sbkim/embed.js';
import { accountCorpusEntries, embedCorpus } from '../../sbkim/searchCorpus.js';
import { sbkimHybridSearch } from '../../sbkim/hybridSearch.js';

let _host = null;
let _corpus = null;     // gecachter, eingebetteter Korpus (Session)
let _busy = false;

export async function mountSbkimSuche(host) {
  _host = host;
  repaint();
}

function repaint(result, status) {
  const input = el('input', { type: 'text', class: 'beleg-text', placeholder: t('sbkimsuche.placeholder'), value: '' });
  const statusP = el('p', { class: 'muted small', text: status || '' });
  const out = el('div', { class: 'sbkimsuche-out' });
  if (result) out.appendChild(renderResult(result));

  const run = async () => {
    const q = (input.value || '').trim();
    if (!q || _busy) return;
    _busy = true;
    btn.setAttribute('disabled', '');
    try {
      const setStatus = (s) => { statusP.textContent = s; };
      if (!_corpus) {
        setStatus(t('sbkimsuche.loadingModel'));
        const embedder = await loadEmbedder({ onStatus: setStatus });
        const konten = await loadAccounts();
        const entries = accountCorpusEntries(konten);
        setStatus(t('sbkimsuche.buildingCorpus').replace('%N%', String(entries.length)));
        _corpus = await embedCorpus(entries, embedder.embedPassage,
          (done, total) => setStatus(t('sbkimsuche.embedding').replace('%D%', String(done)).replace('%T%', String(total))));
      }
      const cfg = await getAiConfig();
      setStatus(cfg.mistralKey ? t('sbkimsuche.judging') : t('sbkimsuche.prefiltering'));
      const res = await sbkimHybridSearch(q, _corpus, {
        apiKey: cfg.mistralKey, provider: 'mistral', euOnly: true,
        queryLabel: 'BookLedgerPro', model: cfg.mistralModel, k: 5,
      });
      repaint(res, '');
    } catch (e) {
      repaint(null, t('sbkimsuche.error').replace('%E%', String((e && e.message) || e)));
    } finally { _busy = false; }
  };

  const btn = el('button', { class: 'btn btn-primary', text: t('sbkimsuche.run'), onClick: run });
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); run(); } });

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('sbkimsuche.title') }),
    el('p', { class: 'muted', text: t('sbkimsuche.intro') }),
    el('div', { class: 'banner banner-info', text: t('sbkimsuche.optinNote') }),
    el('div', { class: 'card' }, [
      el('label', { class: 'field' }, [el('span', { text: t('sbkimsuche.label') }), input]),
      el('div', { class: 'btn-row' }, [btn]),
      statusP,
    ]),
    out,
  ]));
}

function pct(x) { return `${Math.round((Number(x) || 0) * 100)}%`; }

function trefferListe(treffer, withReason) {
  if (!treffer || treffer.length === 0) return el('p', { class: 'muted small', text: t('sbkimsuche.noneJudged') });
  return el('ul', { class: 'sbkimsuche-list' }, treffer.map((v) => el('li', {}, [
    el('strong', { text: v.label }),
    el('span', { class: 'muted small', text: ` · ${t('sbkimsuche.score')} ${pct(v.score)}` }),
    withReason && v.begruendung ? el('p', { class: 'muted small', text: v.begruendung }) : null,
  ].filter(Boolean))));
}

function renderResult(res) {
  if (res.mode === 'vorfilter-leer') {
    return el('div', { class: 'card' }, [el('p', { class: 'muted', text: t('sbkimsuche.empty') })]);
  }
  if (res.mode === 'nur-vorfilter') {
    return el('div', { class: 'card' }, [
      el('div', { class: 'banner banner-info', text: t('sbkimsuche.modeNoKey') }),
      trefferListe(res.treffer, false),
    ]);
  }
  if (res.mode === 'fail-soft-vorfilter') {
    return el('div', { class: 'card' }, [
      el('div', { class: 'banner banner-warn', text: t('sbkimsuche.modeFailsoft').replace('%R%', res.reason || '') }),
      trefferListe(res.treffer, false),
    ]);
  }
  // mode === 'richter'
  const att = res.attestation || {};
  return el('div', { class: 'card' }, [
    el('h2', { class: 'card-title', text: t('sbkimsuche.modeJudge') }),
    el('p', { class: 'muted small', text: t('sbkimsuche.judgeMeta').replace('%P%', att.provider || 'mistral').replace('%R%', att.region || 'eu').replace('%M%', att.model || '') }),
    trefferListe(res.treffer, true),
  ]);
}
