const CACHE='wesam-planner-v16-6';
const ASSETS=['./','index.html','app.js','cloud.js','firebase-config.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.mode==='navigate'||url.pathname.endsWith('/app.js')||url.pathname.endsWith('/index.html')){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match(request).then(r=>r||caches.match('./'))));return}event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}))) });

self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c)return c.focus()}return clients.openWindow('./?screen=dashboard')}))});
