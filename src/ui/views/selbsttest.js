// src/ui/views/selbsttest.js — In-App-Selbstdiagnose: Kern-Engine offline prüfen (✓/✗).

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { runSelbsttest } from '../../domain/selbsttest.js';

let _host = null;

export async function mountSelbsttest(host) {
  _host = host;
  render(null, true);
  const ergebnis = await runSelbsttest().catch((e) => ({ gesamt: 0, bestanden: 0, ok: false, ergebnisse: [{ name: 'Selbsttest', ok: false, detail: String(e.message || e) }] }));
  render(ergebnis, false);
}

function render(ergebnis, laeuft) {
  mount(_host, el('section', { class: 'view' }, [
    el('h1', { text: t('selftest.title') }),
    el('p', { class: 'muted small', text: t('selftest.intro') }),
    laeuft ? el('p', { class: 'muted', text: '…' }) : zusammenfassung(ergebnis),
    !laeuft && ergebnis ? el('div', { class: 'card no-pad' }, [tabelle(ergebnis)]) : null,
    el('div', { class: 'btn-row no-print' }, [
      el('button', { class: 'btn', text: t('selftest.run'), onClick: () => mountSelbsttest(_host) }),
    ]),
    el('p', { class: 'muted small', text: t('selftest.note') }),
  ]));
}

function zusammenfassung(e) {
  if (!e) return null;
  const ok = e.ok;
  return el('div', { class: `card audit ${ok ? 'audit-ok' : 'audit-fail'}` }, [
    el('div', { class: 'audit-status' }, [
      el('span', { class: 'audit-dot' }),
      el('span', { class: 'strong', text: `${ok ? t('selftest.allOk') : t('selftest.someFail')} — ${e.bestanden}/${e.gesamt}` }),
    ]),
  ]);
}

function tabelle(e) {
  const rows = e.ergebnisse.map((r) => el('tr', { class: r.ok ? '' : 'audit-fail' }, [
    el('td', { text: r.ok ? '✓' : '✗' }),
    el('td', { text: r.name }),
    el('td', { class: 'muted small', text: r.detail || '' }),
  ]));
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, [
      el('th', { text: '' }), el('th', { text: t('selftest.check') }), el('th', { text: t('selftest.detail') }),
    ])),
    el('tbody', {}, rows),
  ]);
}
