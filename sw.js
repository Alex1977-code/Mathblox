// Service Worker: speichert alle Spieldateien, damit Mathblox auch offline läuft.
const CACHE = 'mathblox-v3';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/main.js',
  'js/math.js',
  'js/level.js',
  'js/avatar.js',
  'js/controls.js',
  'js/audio.js',
  'js/blocks.js',
  'js/world.js',
  'js/worlds.js',
  'js/animals.js',
  'js/rides.js',
  'vendor/three.module.min.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Netzwerk zuerst und am Browser-Cache vorbei (immer neueste Version), offline aus dem Cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    fetch(e.request, sameOrigin ? { cache: 'no-cache' } : undefined)
      .then((res) => {
        if (res.ok && sameOrigin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
