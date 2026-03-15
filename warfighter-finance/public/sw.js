/* ═══════════════════════════════════════════════════════════
   Financial Readiness Navigator — Service Worker
   Cache-first with network fallback for offline capability
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'finred-nav-v8';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate: Clean up old caches when new version deploys
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // Take control of all pages
  );
});

// Fetch: Cache-first for assets, network-first for API calls
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for Google Fonts (they update)
  if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (app shell, icons)
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          // Cache successful responses for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
      )
      .catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});
