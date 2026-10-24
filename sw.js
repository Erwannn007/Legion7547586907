/* Légion Pixel — service worker cache-first */
const CACHE = 'legion-pixel-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png',
  './css/style.css', './js/art.js', './js/core.js', './js/battle.js', './js/modes.js', './js/meta.js',
  './fonts/pixelify-400.woff2', './fonts/pixelify-700.woff2', './fonts/press-start-2p.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('legion-pixel-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : undefined);
    })
  );
});
