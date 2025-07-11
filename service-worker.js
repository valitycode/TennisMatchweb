self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('tennis-match-cache').then(cache => {
      return cache.addAll([
        '/TennisMatchweb/',
        '/TennisMatchweb/index.html',
        '/TennisMatchweb/style.css',
        '/TennisMatchweb/app.js',
        '/TennisMatchweb/manifest.json',
        '/TennisMatchweb/icon-192.png',
        '/TennisMatchweb/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
