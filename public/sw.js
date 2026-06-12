const CACHE_NAME = 'lesbian-split-v1';
const ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  // Do not intercept or cache server API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // Cache new local assets dynamically if request succeeds
      if (
        networkResponse.status === 200 &&
        (event.request.url.startsWith(self.location.origin) ||
         event.request.url.includes('fonts.googleapis.com') ||
         event.request.url.includes('fonts.gstatic.com'))
      ) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // Offline fallback: check cache
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.match('/');
      });
    })
  );
});
