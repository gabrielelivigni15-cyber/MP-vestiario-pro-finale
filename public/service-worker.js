self.addEventListener("install", (e) => {
  console.log("Service Worker installato");
  e.waitUntil(
    caches.open("mp-vestiario-v1").then((cache) => {
      return cache.addAll(["/", "/index.html", "/manifest.json"]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
