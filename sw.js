const CACHE='wesam-planner-v16-24';
const ASSETS=['./','index.html','app.js','patch-16.15.js','patch-16.16.js','patch-16.17.js','patch-16.18.js','patch-16.19.js','patch-16.20.js','patch-16.22.js','patch-16.24.js','tasks-16.15.js','cloud-16.22.js','firebase-config.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(x=>new Request(x,{cache:'reload'})))).catch(()=>{}))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET')return;
  const same=url.origin===self.location.origin;
  const appAsset=same&&(req.mode==='navigate'||/\.(?:html|js|json|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/'));
  if(appAsset){
    event.respondWith(fetch(new Request(req,{cache:'no-store'})).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(cached=>cached||fetch(req)));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c)return c.focus()}return clients.openWindow('./?screen=dashboard')}))});
