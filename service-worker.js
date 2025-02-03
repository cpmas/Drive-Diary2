const CACHE_NAME = 'drive-diary-cache-v1';
const urlsToCache = [
  '/', // Ensure this caches the index.html
  '/index.html',
  '/log-summary.html',
  '/login.html',
  '/register.html',
  '/style.css',
  '/global.css',
  '/log_style.css',
  '/scripts.js',
  '/log-summary.js',
  '/firebase-config.js',
  '/manifest.json',
  '/logo.png'
];

// Install event: Open a cache and add the specified resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Serve cached content when available
self.addEventListener('fetch', event => {
  // You can add conditions to exclude certain requests if needed.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached file if found; otherwise, fetch from the network.
        return response || fetch(event.request);
      })
  );
});

// Activate event: Clean up outdated caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});

