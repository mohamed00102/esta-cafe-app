/* ═══════════════════════════════════════════
   ريستا كافيه — Service Worker
   Offline Support + Cache
   ═══════════════════════════════════════════ */

const CACHE_NAME = 'resta-cafe-v2';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/store.js',
  './js/utils.js',
  './js/components.js',
  './js/app.js',
  './js/dashboard.js',
  './js/sessions.js',
  './js/bar.js',
  './js/accounting.js',
  './js/inventory.js',
  './js/reservations.js',
  './js/customers.js',
  './js/tournaments.js',
  './js/instagram.js',
  './js/settings.js',
  './manifest.json',
];

// Install — cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache first, then network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // For Google Fonts, use network first
  if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // For app assets, cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (event.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
