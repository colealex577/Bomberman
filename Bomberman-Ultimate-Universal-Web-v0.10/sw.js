const CACHE='bomberman-ultimate-v0131';
const CORE=[
 './','./index.html','./manifest.webmanifest',
 './files/css/style.css?v=0119','./files/css/bootstrap.css',
 './files/app.js?v=0119','./files/hotfix-0117.js?v=0119','./files/online.js?v=0119','./files/mobile.js?v=0119',
 './files/runtime-v0115.js?v=0116','./files/net-v0115-core.js?v=0116','./files/net-v0115-match.js?v=0116','./files/net-v0115-ui.js?v=0116',
 './files/runtime-v0116.js?v=0116','./files/runtime-v0116-fix.js?v=0118','./files/runtime-v0119.js?v=0119','./files/runtime-v0120.js?v=0120','./files/runtime-v0120-endfix.js?v=0120','./files/runtime-v0121.js?v=0121','./files/runtime-v0122.js?v=0122','./files/runtime-v0122-menufix.js?v=0122',
 './files/js/easeljs-0.8.1.min.js','./files/js/preloadjs-0.6.1.min.js','./files/js/soundjs-0.6.1.min.js',
 './files/js/core.js','./files/js/Utils.js','./files/js/Entity.js','./files/js/Player.js','./files/js/Bonus.js','./files/js/Tile.js','./files/js/Fire.js','./files/js/Bomb.js','./files/js/Menu.js','./files/js/InputEngine.js','./files/js/GameEngine.js?v=0119','./files/js/Bot.js?v=0119',
 './files/sound/game.mp3','./files/sound/bomb.mp3','./icons/icon192.png','./icons/icon512.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window'})).then(clients=>Promise.all(clients.map(client=>{try{return client.navigate(client.url)}catch(e){return null}}))))});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==location.origin||url.pathname.includes('__bomberman_'))return;
 const hot=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html')||/\/(online|mobile|app|hotfix-0117|runtime-v0116|runtime-v0116-fix|runtime-v0119|runtime-v0120|runtime-v0120-endfix|runtime-v0121|runtime-v0122|runtime-v0122-menufix|GameEngine|Bot|Menu)\.js$/.test(url.pathname)||url.pathname.endsWith('/files/css/style.css');
 if(hot){const fresh=new Request(req,{cache:'no-store'});event.respondWith(fetch(fresh).then(res=>{if(res&&res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res}).catch(()=>caches.match(req)));return}
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res&&res.ok)caches.open(CACHE).then(cache=>cache.put(req,res.clone()));return res})));
});