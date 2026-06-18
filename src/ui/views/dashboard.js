// src/ui/views/dashboard.js — Übersicht mit echten Jahres-Kennzahlen.

import { el, mount } from '../dom.js';
import { t } from '../i18n.js';
import { formatEuro } from '../../domain/money.js';
import { navigate, getSettings } from '../../state.js';
import { zeigeFeature, FEATURE, zeigeAnsicht } from '../../domain/nutzungsmodus.js';
import { getMandantId } from '../../core/vault.js';
import { loadAccounts, listBuchungen, verifyAuditChain } from '../../domain/store.js';
import { listBelege } from '../../domain/documents.js';
import { listKunden, listAuftraege } from '../../domain/crm-store.js';
import { listEingangsrechnungen } from '../../domain/payables-store.js';
import { verzugReport, verzugAmpel, VERZUG_AMPEL } from '../../domain/eingangsverzug.js';
import { forderungReport, forderungAmpel, FORDERUNG_AMPEL } from '../../domain/mahnwesen.js';
import { dashboardKennzahlen } from '../../domain/summary.js';
import { wirtschaftsjahrVon, wjPeriode } from '../../domain/geschaeftsjahr.js';
import { MycelDivider } from '../mycel.js';
import { datensicherungKarte } from '../datensicherung.js';

export async function mountDashboard(host) {
  mount(host, el('section', { class: 'view' }, [el('h1', { text: t('dashboard.welcome') }), el('p', { class: 'muted', text: '…' })]));

  const s = getSettings();
  const wjBeginn = s.wirtschaftsjahrBeginn || '01-01';
  const heute = new Date().toISOString().slice(0, 10);
  const jahr = wirtschaftsjahrVon(heute, wjBeginn);
  const zeigePayables = zeigeAnsicht(s, 'payables');
  const [konten, buchungen, belege, kunden, auftraege, audit, eingangsrechnungen] = await Promise.all([
    loadAccounts(), listBuchungen(), listBelege().catch(() => []),
    listKunden().catch(() => []), listAuftraege().catch(() => []), verifyAuditChain().catch(() => ({ ok: true, count: 0 })),
    zeigePayables ? listEingangsrechnungen().catch(() => []) : Promise.resolve([]),
  ]);
  const idx = {};
  for (const k of konten) idx[k.nummer] = k;
  const k = dashboardKennzahlen(buchungen, idx, jahr, wjBeginn);
  const wjLabel = wjBeginn === '01-01' ? String(jahr) : `${wjPeriode(jahr, wjBeginn).von} – ${wjPeriode(jahr, wjBeginn).bis}`;

  const kpi = (label, value, cls) => el('div', { class: 'kpi ' + (cls || '') }, [
    el('div', { class: 'kpi-value', text: value }),
    el('div', { class: 'kpi-label', text: label }),
  ]);

  // Überfällige FORDERUNGEN (Mahnwesen) auf einen Blick — Spiegel zur Verbindlichkeiten-
  // KPI, aber aus Gläubigersicht (dokumentierte Dashboard-Intention A1: „Kennzahl
  // überfällige Forderungen, Summe + Anzahl"). Reine Logik mahnwesen.forderungReport/
  // forderungAmpel (node-getestet). Nur sichtbar, wenn das Mahnwesen im Nutzungskontext
  // aktiv ist (Privat blendet es aus) UND etwas überfällig ist. Klick → Berichte
  // (Mahnwesen-Karte). Bucht nichts.
  const forderungKarte = () => {
    if (!zeigeFeature(s, FEATURE.MAHNWESEN)) return null;
    const { uebersicht } = forderungReport(auftraege, {
      zielTage: s.zahlungszielTage,
      basiszinsProzent: s.verzugBasiszinsProzent,
    });
    if (!uebersicht.ueberfaelligAnzahl) return null;
    const ampel = forderungAmpel(uebersicht);
    const ampelCls = ampel === FORDERUNG_AMPEL.KRITISCH ? 'kpi-neg' : '';
    return el('div', { class: 'card' }, [
      el('h2', { class: 'card-title', text: t('dashboard.overdueReceivablesTitle') }),
      el('div', { class: 'kpi-grid small-kpi' }, [
        kpi(t('dashboard.overdueReceivablesCount'), `${uebersicht.ueberfaelligAnzahl} / ${uebersicht.anzahl}`, ampelCls),
        kpi(t('dashboard.overdueReceivablesSum'), formatEuro(uebersicht.ueberfaelligCent), ampelCls),
        kpi(t('dashboard.overdueReceivablesClaim'), formatEuro(uebersicht.zinsRisikoCent)),
      ]),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn', text: t('nav.reports'), onClick: () => navigate('reports') }),
      ]),
    ]);
  };

  // Block 3 — eigene Zahlungsdisziplin: überfällige Verbindlichkeiten auf einen Blick.
  // Reine Logik eingangsverzug.verzugReport/verzugAmpel (node-getestet). Nur sichtbar im
  // Firmen-/Vereins-Kontext (FEATURE/Ansicht „payables") UND wenn etwas überfällig ist —
  // sonst kein Lärm auf der Übersicht. Klick → Verbindlichkeiten-Ansicht. Bucht nichts.
  const verzugKarte = () => {
    if (!zeigePayables) return null;
    const { uebersicht } = verzugReport(eingangsrechnungen, {
      basiszinsProzent: s.verzugBasiszinsProzent,
    });
    if (!uebersicht.ueberfaelligAnzahl) return null;
    const ampel = verzugAmpel(uebersicht);
    const ampelCls = ampel === VERZUG_AMPEL.KRITISCH ? 'kpi-neg' : '';
    return el('div', { class: 'card' }, [
      el('h2', { class: 'card-title', text: t('dashboard.overduePayablesTitle') }),
      el('div', { class: 'kpi-grid small-kpi' }, [
        kpi(t('dashboard.overduePayablesCount'), `${uebersicht.ueberfaelligAnzahl} / ${uebersicht.anzahl}`, ampelCls),
        kpi(t('dashboard.overduePayablesSum'), formatEuro(uebersicht.ueberfaelligCent), ampelCls),
        kpi(t('dashboard.overduePayablesRisk'), formatEuro(uebersicht.zinsRisikoCent)),
      ]),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn', text: t('nav.payables'), onClick: () => navigate('payables') }),
      ]),
    ]);
  };

  mount(host, el('section', { class: 'view' }, [
    el('div', { class: 'dash-head' }, [
      el('h1', { text: t('dashboard.welcome') }),
      el('span', { class: 'muted small', text: `${t('dashboard.year')} ${wjLabel}` }),
    ]),
    el('p', { class: 'muted', text: t('app.tagline') }),

    // R6/P2: USt-Zahllast-KPI nur bei USt-Ausweis; Kunden/Aufträge-KPIs nur, wenn die
    // jeweilige Ansicht im Nutzungskontext sichtbar ist (Privat blendet beide aus).
    el('div', { class: 'kpi-grid' }, [
      kpi(t('reports.surplus'), formatEuro(k.ueberschuss), k.ueberschuss >= 0 ? 'kpi-pos' : 'kpi-neg'),
      zeigeFeature(s, FEATURE.UMSATZSTEUER) ? kpi(t('reports.zahllast'), formatEuro(k.ustZahllast)) : null,
      kpi(t('reports.income'), formatEuro(k.ertrag)),
      kpi(t('reports.expense'), formatEuro(k.aufwand)),
    ]),

    el('div', { class: 'kpi-grid small-kpi' }, [
      kpi(t('dashboard.posted'), String(k.festgeschrieben)),
      kpi(t('dashboard.drafts'), String(k.entwuerfe)),
      kpi(t('nav.documents'), String(belege.length)),
      zeigeAnsicht(s, 'customers') ? kpi(t('nav.customers'), String(kunden.length)) : null,
      zeigeAnsicht(s, 'orders') ? kpi(t('nav.orders'), String(auftraege.length)) : null,
    ]),

    forderungKarte(),
    verzugKarte(),

    MycelDivider(),

    el('div', { class: 'card' }, [
      el('div', { class: 'report-line' }, [
        el('span', { text: t('reports.audit') }),
        el('span', { class: audit.ok ? 'badge badge-ok' : 'badge badge-storno', text: (audit.ok ? t('reports.auditOk') : t('reports.auditFail')) + ` (${audit.count})` }),
      ]),
      getMandantId() ? el('div', { class: 'report-line' }, [
        el('span', { text: t('dashboard.mandant') }),
        el('code', { class: 'mono small', text: getMandantId() }),
      ]) : null,
    ]),

    el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn btn-primary', text: t('journal.new'), onClick: () => navigate('journal') }),
      el('button', { class: 'btn', text: t('docs.quickEntry'), onClick: () => navigate('documents') }),
      el('button', { class: 'btn', text: t('nav.reports'), onClick: () => navigate('reports') }),
    ]),

    // Prominente Datensicherung (Schritt 3): Backup/Restore + Drag-and-drop —
    // Datendurabilität ist Pflicht-Feature #1, also gut sichtbar auf der Übersicht.
    datensicherungKarte(),
  ]));
}
