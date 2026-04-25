const CACHE_NAME = 'mis-citas-v3';

// Files to cache
const urlsToCache = [
  'index.html',
  'assets/css/style.css',
  'assets/js/app.js',
  'manifest.json'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Fetch event - network first, then cache (better for privacy)
self.addEventListener('fetch', event => {
  // Skip cross-origin requests for privacy
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Don't cache non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Cache the fetched response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Only use cache if network fails
        return caches.match(event.request);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});
