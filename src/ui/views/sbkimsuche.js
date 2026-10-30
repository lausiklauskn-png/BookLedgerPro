// src/ui/views/sbkimsuche.js — Ansicht „SBKIM-Suche" (mehrstufige semantische Suche).
// Zwei Such-BEREICHE über denselben Maschinenraum (austauschbarer Korpus):
//   • Konten  — passendes Buchungskonto finden (Korpus = Konten)
//   • Knoten  — gleichwertige Mycel-Knoten finden (Korpus = Peer-Sporen)   ← Ur-Gedanke
// Pipeline je Bereich: Vorfilter (lokal, embed.js) → Richter (opt-in, Mistral EU/BYOK)
// → Fail-soft. Der Richter ist NIE eine Eintritts-Barriere. Muster: docs/SBKIM-SUCHE-MUSTER.md.
//
// EHRLICHER HINWEIS: Modell-Laden (~30 MB, opt-in) und der echte Mistral-Richter-Lauf
// brauchen Netz + Browser — in der Bau-Umgebung NICHT testbar. Vertrags-/Modus-/Fail-soft-
// und Korpus-Logik (match.js/hybridSearch.js/searchCorpus.js) ist node-getestet.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { loadAccounts } from '../../domain/store.js';
import { getAiConfig } from '../../ai/aiConfig.js';
import { loadEmbedder, EMBED_DIM } from '../../sbkim/embed.js';
import { accountCorpusEntries, embedCorpus, fetchNodeSpores, nodeCorpusEntries, embedMissingVectors } from '../../sbkim/searchCorpus.js';
import { sbkimHybridSearch } from '../../sbkim/hybridSearch.js';
import { testMarke } from '../testmarke.js';

let _host = null;
let _busy = false;
let _bereich = 'konten';        // 'konten' | 'knoten'
let _corpusKonten = null;       // gecachte, eingebettete Korpora (Session)
let _corpusKnoten = null;
let _query = '';                // aktuelle Eingabe — bleibt über Neuzeichnen (Ergebnis) erhalten

export async function mountSbkimSuche(host) {
  _host = host;
  _query = '';   // frisch geöffnet → leeres Feld (geschlossen = zurückgesetzt)
  repaint();
}

function bereichBtn(id, label) {
  const active = _bereich === id;
  return el('button', {
    class: 'btn btn-sm' + (active ? ' btn-primary' : ''),
    text: label,
    onClick: () => { if (_bereich !== id && !_busy) { _bereich = id; repaint(); } },
  });
}

// Spracheingabe (Klaus 2026-10-30: „Das Mikrofon ist wieder nicht in dem Stichwort … drin. Genauso die Wahl der Sprache“): Mikrofon und
// Sprachmarke sitzen wie an jedem Suchfeld rechts IM Feld (src/ui/mikro.js, data-mikro). Engines und EU-Politik gelten dort genauso
// (Browser-Erkennung / EU-Schlüssel, „bindend“ sperrt den Browser; in der App Androids Sprachfenster bzw. Windows-Spracherkennung).

function repaint(result, status) {
  const input = el('input', { type: 'text', class: 'beleg-text', placeholder: t('sbkimsuche.placeholder'), value: _query, 'data-mikro': '', 'data-mikro-key': 'sbkimsuche' });
  input.addEventListener('input', () => { _query = input.value; });
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
      setStatus(t('sbkimsuche.loadingModel'));
      const embedder = await loadEmbedder({ onStatus: setStatus });   // Anfrage-Einbettung (+ ggf. Korpus)
      const corpus = await ensureCorpus(embedder, setStatus);
      if (!corpus || corpus.length === 0) { repaint(null, t('sbkimsuche.noCorpus')); return; }
      const cfg = await getAiConfig();
      setStatus(cfg.mistralKey ? t('sbkimsuche.judging') : t('sbkimsuche.prefiltering'));
      const res = await sbkimHybridSearch(q, corpus, {
        apiKey: cfg.mistralKey, provider: 'mistral', euOnly: true,
        queryLabel: 'BookLedgerPro', model: cfg.mistralModel, k: 10,
        minScore: 0,   // Suche: Vorfilter reicht IMMER Top-k durch; der Richter wählt aus.
      });
      repaint(res, '');
    } catch (e) {
      repaint(null, t('sbkimsuche.error').replace('%E%', String((e && e.message) || e)));
    } finally { _busy = false; }
  };

  const btn = el('button', { class: 'btn btn-primary', text: t('sbkimsuche.run'), onClick: run });
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); run(); } });

  // Knoten↔Knoten-Match (Drei-Schichten-Erkennen): unsere EIGENE Spore ist die Anfrage.
  // Heute (ohne cap/needs in den Sporen) läuft es im domain-Modus; mit cap/needs → schichten.
  const runNodeMatch = async () => {
    if (_busy) return;
    _busy = true; nodeBtn.setAttribute('disabled', '');
    try {
      const setStatus = (s) => { statusP.textContent = s; };
      setStatus(t('sbkimsuche.loadingNodes'));
      const [self] = await fetchNodeSpores(['./sbkim/spore.json']);
      if (!self) { repaint(null, t('sbkimsuche.noSelf')); return; }
      const vec = (v) => (Array.isArray(v) && v.length === EMBED_DIM) ? v : undefined;
      const queryNode = { queryVec: vec(self.domainVector), queryCapVec: vec(self.capVector), queryNeedsVec: vec(self.needsVector) };
      const embedder = await loadEmbedder({ onStatus: setStatus });
      const full = await ensureCorpus(embedder, setStatus);
      const selbst = self.id || self.nodeName;
      const corpus = (full || []).filter((e) => (e.anchorId || e.label) !== selbst);   // ohne mich selbst
      if (corpus.length === 0) { repaint(null, t('sbkimsuche.noCorpus')); return; }
      const cfg = await getAiConfig();
      setStatus(cfg.mistralKey ? t('sbkimsuche.judging') : t('sbkimsuche.prefiltering'));
      const res = await sbkimHybridSearch('', corpus, {
        apiKey: cfg.mistralKey, provider: 'mistral', euOnly: true,
        queryLabel: 'BookLedgerPro', model: cfg.mistralModel, k: 10, queryNode,
      });
      repaint(res, '');
    } catch (e) {
      repaint(null, t('sbkimsuche.error').replace('%E%', String((e && e.message) || e)));
    } finally { _busy = false; }
  };
  const nodeBtn = el('button', { class: 'btn', text: t('sbkimsuche.nodeMatch'), onClick: runNodeMatch });

  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('sbkimsuche.title') }),
    el('p', { class: 'muted', text: t('sbkimsuche.intro') }),
    el('div', { class: 'banner banner-info', text: t('sbkimsuche.optinNote') }),
    el('div', { class: 'card' }, [
      el('div', { class: 'field' }, [
        el('span', { text: t('sbkimsuche.bereich') }),
        el('div', { class: 'btn-row' }, [
          bereichBtn('konten', t('sbkimsuche.bereichKonten')),
          bereichBtn('knoten', t('sbkimsuche.bereichKnoten')),
        ]),
      ]),
      el('p', { class: 'muted small', text: t(_bereich === 'knoten' ? 'sbkimsuche.hintKnoten' : 'sbkimsuche.hintKonten') }),
      el('label', { class: 'field' }, [el('span', { text: t('sbkimsuche.label') }), input]),
      el('div', { class: 'btn-row' }, _bereich === 'knoten' ? [btn, nodeBtn] : [btn]),
      // TEMPORÄR: Browser-Test-Marken (co-located → fehlt der Knopf, fehlt die Marke).
      el('div', { class: 'btn-row' }, _bereich === 'knoten'
        ? [testMarke('sbkim-knoten', '🜲 mein Knoten ↔ Netz')]
        : [testMarke('sbkim-konten', 'SBKIM-Suche: Konten')]),
      statusP,
    ]),
    out,
  ]));
}

/** Baut (und cached) den Korpus des aktiven Bereichs. */
async function ensureCorpus(embedder, setStatus) {
  if (_bereich === 'knoten') {
    if (_corpusKnoten) return _corpusKnoten;
    setStatus(t('sbkimsuche.loadingNodes'));
    const spores = await fetchNodeSpores();
    let entries = nodeCorpusEntries(spores);
    if (entries.some((e) => e.needsEmbed)) entries = await embedMissingVectors(entries, embedder.embedPassage);
    _corpusKnoten = entries;
    return _corpusKnoten;
  }
  if (_corpusKonten) return _corpusKonten;
  const konten = await loadAccounts();
  const entries = accountCorpusEntries(konten);
  setStatus(t('sbkimsuche.buildingCorpus').replace('%N%', String(entries.length)));
  _corpusKonten = await embedCorpus(entries, embedder.embedPassage,
    (done, total) => setStatus(t('sbkimsuche.embedding').replace('%D%', String(done)).replace('%T%', String(total))));
  return _corpusKonten;
}

function pct(x) { return `${Math.round((Number(x) || 0) * 100)}%`; }

function trefferListe(treffer, withReason) {
  if (!treffer || treffer.length === 0) return el('p', { class: 'muted small', text: t('sbkimsuche.noneJudged') });
  // Sage 04.J: ein ausgeschlossener Treffer ging nicht an die KI — kein Score, ein ⚠.
  return el('ul', { class: 'sbkimsuche-list' }, treffer.map((v) => el('li', v.ausgeschlossen ? { 'data-ausgeschlossen': v.ausgeschlossen } : {}, [
    el('strong', { text: (v.ausgeschlossen ? '⚠ ' : '') + v.label }),
    el('span', { class: 'muted small', text: v.ausgeschlossen ? ` · ${t('sbkim.ausgeschlossen')}` : ` · ${t('sbkimsuche.score')} ${pct(v.score)}` }),
    v.modus ? el('span', { class: 'muted small', text: ` · ${t(v.modus === 'schichten' ? 'sbkimsuche.modusSchichten' : 'sbkimsuche.modusDomain')}` }) : null,
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
  const kinder = [
    el('h2', { class: 'card-title', text: t('sbkimsuche.modeJudge') }),
    el('p', { class: 'muted small', text: t('sbkimsuche.judgeMeta').replace('%P%', att.provider || 'mistral').replace('%R%', att.region || 'eu').replace('%M%', att.model || '') }),
    trefferListe(res.treffer, true),
  ];
  // Transparenz: IMMER die geprüften Kandidaten (vom Vorfilter vorgelegt) zeigen — so sieht man,
  // ob ein „keiner passt" am Recall (Schicht 1) oder am Urteil (Schicht 2) liegt.
  if (Array.isArray(res.geprueft) && res.geprueft.length) {
    kinder.push(el('details', { class: 'sbkimsuche-geprueft' }, [
      el('summary', { class: 'muted small', text: t('sbkimsuche.geprueft').replace('%N%', String(res.geprueft.length)) }),
      el('ul', { class: 'sbkimsuche-list' }, res.geprueft.map((c) => el('li', {}, [el('span', { class: 'muted small', text: c.label })]))),
    ]));
  }
  return el('div', { class: 'card' }, kinder);
}
