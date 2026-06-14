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

const CACHE_VERSION = 'v15';
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
  './assets/img/empty-journal.png',
  './assets/img/empty-documents.png',
  './assets/img/empty-customers.png',
  './assets/img/empty-orders.png',
  './assets/img/empty-employees.png',
  './assets/img/empty-reports.png',
  './src/main.js',
  './src/state.js',
  './src/core/crypto.js',
  './src/core/shamir.js',
  './src/core/db.js',
  './src/core/durability.js',
  './src/core/files.js',
  './src/core/vault.js',
  './src/core/backup.js',
  './src/ui/dom.js',
  './src/ui/i18n.js',
  './src/ui/theme.js',
  './src/ui/mycel.js',
  './src/ui/mycelCanvas.js',
  './src/ui/empty.js',
  './src/ui/lock.js',
  './src/ui/shell.js',
  './src/domain/summary.js',
  './src/ui/views/dashboard.js',
  './src/ui/views/accounts.js',
  './src/ui/views/journal.js',
  './src/ui/views/reports.js',
  './src/domain/money.js',
  './src/domain/accounts.js',
  './src/domain/audit.js',
  './src/domain/journal.js',
  './src/domain/taxes.js',
  './src/domain/store.js',
  './src/domain/documents.js',
  './src/ai/extract.js',
  './src/ai/categorize.js',
  './src/ai/suggest.js',
  './src/ai/provider.js',
  './src/domain/orders.js',
  './src/domain/invoicing.js',
  './src/domain/employees.js',
  './src/domain/costcenters.js',
  './src/domain/encstore.js',
  './src/domain/crm-store.js',
  './src/domain/export.js',
  './src/ai/taxAssist.js',
  './src/ui/views/documents.js',
  './src/ui/views/customers.js',
  './src/ui/views/orders.js',
  './src/ui/views/employees.js',
  './src/ui/views/legal.js',
  './src/ui/views/network.js',
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
