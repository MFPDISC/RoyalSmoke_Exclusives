self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open('royalsmoke-v1').then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;

      const res = await fetch(req);
      if (res && res.status === 200 && (req.destination === 'document' || req.destination === 'script' || req.destination === 'style' || req.destination === 'image')) {
        cache.put(req, res.clone());
      }
      return res;
    })
  );
});
