const CACHE_NAME = "lb-orders-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/display.html",
  "/css/style.css",
  "/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
