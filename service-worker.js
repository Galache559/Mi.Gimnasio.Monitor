/* MI GIMNASIO PRO MONITOR v10.25 · caché sin conexión */
const CACHE_NAME = 'gym-monitor-offline-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).catch(() => cache.add('./')))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation: try the latest page, then fall back to the saved app.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)).catch(() => {});
        }
        return response;
      }).catch(() =>
        caches.match(request).then(cached => cached || caches.match('./index.html') || caches.match('./'))
      )
    );
    return;
  }

  // Cache same-origin files and exercise GIFs/images fetched from external hosts.
  if (url.origin === self.location.origin ||
      /\.(gif|png|jpe?g|webp|svg|woff2?|ttf)(\?.*)?$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
          }
          return response;
        });
      }).catch(() => caches.match(request))
    );
  }
});
