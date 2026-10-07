const CACHE_NAME = 'cbc-revision-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js'
];

// Install Event - caching core files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Fetch Event - serve from cache if offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});