self.addEventListener("install", (event) => {
  console.log("📦 [SW] Installazione completata");
  event.waitUntil(
    caches.open("mp-vestiario-cache-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/app-icons/icon-192.png",
        "/app-icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", () => {
  console.log("🚀 [SW] Attivo e in ascolto");
});
