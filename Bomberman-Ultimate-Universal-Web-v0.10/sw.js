const CACHE = 'bomberman-ultimate-v0112';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './files/css/style.css?v=0111', './files/css/bootstrap.css',
  './files/app.js?v=0111', './files/online.js?v=0111', './files/mobile.js?v=0111',
  './files/js/easeljs-0.8.1.min.js', './files/js/preloadjs-0.6.1.min.js', './files/js/soundjs-0.6.1.min.js',
  './files/js/core.js', './files/js/Utils.js', './files/js/Entity.js', './files/js/Player.js', './files/js/Bot.js',
  './files/js/Bonus.js', './files/js/Tile.js', './files/js/Fire.js', './files/js/Bomb.js', './files/js/Menu.js',
  './files/js/InputEngine.js', './files/js/GameEngine.js',
  './files/sound/game.mp3', './files/sound/bomb.mp3',
  './icons/icon192.png', './icons/icon512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type: 'window'}))
      .then(clients => Promise.all(clients.map(client => {
        try { return client.navigate(client.url); } catch (e) { return null; }
      })))
  );
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('__bomberman_')) return;
  const hot = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || /\/(online|mobile|app)\.js$/.test(url.pathname) || url.pathname.endsWith('/files/css/style.css');
  if (hot) {
    event.respondWith(fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE).then(cache => cache.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
    }
    return res;
  })));
});
