// sw.js - Service Worker for PWA (offline caching)
const CACHE_NAME = "mis-citas-v1";
const urlsToCache = [
  "index.html",
  "assets/css/style.css",
  "assets/js/security.js",
  "assets/js/app.js",
  "assets/js/main.js",
  "manifest.json",
  "assets/icons/icon-72.png",
  "assets/icons/icon-96.png",
  "assets/icons/icon-128.png",
  "assets/icons/icon-144.png",
  "assets/icons/icon-152.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-384.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).then(fetchRes => {
        if (!fetchRes || fetchRes.status !== 200) return fetchRes;
        const copy = fetchRes.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (event.request.url.startsWith("http")) cache.put(event.request, copy);
        });
        return fetchRes;
      });
    }).catch(() => {
      if (event.request.mode === "navigate") return caches.match("index.html");
      return new Response("Offline content not available", { status: 404 });
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  self.clients.claim();
});
