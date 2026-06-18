/* sw.js — App-Service-Worker (Offline-Shell-Cache).
 *
 * Browser-Lehre 4 ("SW-Cache + Updates brauchen File-Rename / Version-Bump"):
 * Der Cache-Name trägt eine VERSION. Bei jedem Deploy, der Shell-Logik ändert,
 * MUSS CACHE_VERSION erhöht werden (oder die betroffene Datei umbenannt, z.B.
 * journal.js -> journal-v2.js). Sonst liefert der SW veraltete Buchungslogik —
 * bei einer Buchhaltung inakzeptabel.
 *
 * Strategie:
 *  - install: Kern-Shell precachen, sofort aktiv werden (skipWaiting).
 *  - activate: alte Cache-Versionen löschen, Clients übernehmen.
 *  - fetch: Navigation -> network-first (fällt offline auf index.html zurück);
 *           statische Assets -> stale-while-revalidate (frisch beim nächsten Load).
 */

const CACHE_VERSION = 'v113';
const CACHE_NAME = `blpr-shell-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/tokens.css',
  './assets/app.css',
  './assets/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
  './assets/img/hero-lock.png',
  './assets/img/cover.png',
  './assets/img/iso-iec.jpg',
  './assets/img/empty-journal.png',
  './assets/img/empty-documents.png',
  './assets/img/empty-customers.png',
  './assets/img/empty-orders.png',
  './assets/img/empty-employees.png',
  './assets/img/empty-reports.png',
  './assets/img/empty-network.png',
  './assets/img/onboard-key.png',
  './assets/img/onboard-shamir.png',
  './assets/img/onboard-backup.png',
  './src/main.js',
  './src/state.js',
  './src/core/crypto.js',
  './src/core/shamir.js',
  './src/core/db.js',
  './src/core/mandantenStore.js',
  './src/core/sandboxStore.js',
  './src/core/durability.js',
  './src/core/files.js',
  './src/core/vault.js',
  './src/core/backup.js',
  './src/core/backupOrdner.js',
  './src/domain/backupStrategie.js',
  './src/ui/datensicherung.js',
  './src/ui/dom.js',
  './src/ui/i18n.js',
  './src/ui/theme.js',
  './src/ui/mycel.js',
  './src/ui/mycelCanvas.js',
  './src/ui/empty.js',
  './src/ui/lock.js',
  './src/ui/intro.js',
  './src/ui/shell.js',
  './src/domain/summary.js',
  './src/domain/geschaeftsjahr.js',
  './src/ui/views/dashboard.js',
  './src/ui/views/accounts.js',
  './src/ui/views/anlagen.js',
  './src/ui/views/kassenbuch.js',
  './src/ui/views/journal.js',
  './src/ui/views/reports.js',
  './src/ui/views/berichte.js',
  './src/domain/money.js',
  './src/domain/mandanten.js',
  './src/domain/accounts.js',
  './src/domain/bilanzierung.js',
  './src/domain/nutzungsmodus.js',
  './src/domain/rechnungsstelle.js',
  './src/domain/kalkulation.js',
  './src/domain/produktschemata.js',
  './src/domain/angebote.js',
  './src/domain/angebotUebernahme.js',
  './src/domain/nachkalkulation.js',
  './src/domain/bilanz.js',
  './src/domain/audit.js',
  './src/domain/journal.js',
  './src/domain/pruefung.js',
  './src/domain/rechtsregeln.js',
  './src/domain/taxes.js',
  './src/domain/store.js',
  './src/domain/documents.js',
  './src/domain/aufbewahrung.js',
  './src/ai/extract.js',
  './src/ai/categorize.js',
  './src/ai/suggest.js',
  './src/ai/aiConfig.js',
  './src/ai/vision.js',
  './src/ai/mistral.js',
  './src/ai/berater.js',
  './src/ai/pseudonym.js',
  './src/ai/anker.js',
  './src/ai/ner.js',
  './src/ai/briefkasten.js',
  './src/domain/orders.js',
  './src/domain/invoicing.js',
  './src/domain/rechnung.js',
  './src/domain/erechnung.js',
  './src/domain/erechnungLesen.js',
  './src/domain/zugferd.js',
  './src/domain/bankimport.js',
  './src/domain/bankschema.js',
  './src/domain/zahlungsabgleich.js',
  './src/domain/skonto.js',
  './src/domain/payables.js',
  './src/domain/payables-store.js',
  './src/domain/anlagen.js',
  './src/domain/anlagen-store.js',
  './src/domain/kassenbuch.js',
  './src/domain/anfangsbestand-store.js',
  './src/domain/umsatzsteuer.js',
  './src/domain/berichte.js',
  './src/domain/gdpdu.js',
  './src/domain/kleinfaelle.js',
  './src/domain/demodaten.js',
  './src/domain/selbsttest.js',
  './src/ui/views/selbsttest.js',
  './src/core/zip.js',
  './src/domain/mahnwesen.js',
  './src/domain/employees.js',
  './src/domain/costcenters.js',
  './src/domain/encstore.js',
  './src/domain/crm-store.js',
  './src/domain/importworkfloh.js',
  './src/domain/connect.js',
  './src/domain/export.js',
  './src/ai/taxAssist.js',
  './src/ui/views/documents.js',
  './src/ui/views/payables.js',
  './src/ui/views/customers.js',
  './src/ui/views/orders.js',
  './src/ui/views/employees.js',
  './src/ui/views/legal.js',
  './src/ui/views/network.js',
  './src/ui/views/anleitung.js',
  './src/sbkim/spore.js',
  './src/sbkim/identity.js',
  './src/sbkim/domainvector.js',
  './src/sbkim/signal.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // nur eigene Assets

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => null);
      return cached || (await network) || new Response('', { status: 504 });
    })
  );
});
