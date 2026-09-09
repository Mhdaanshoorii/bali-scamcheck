const CACHE="bsc-admin-v10";
const SHELL=["./admin.html","./admin-manifest.json","./icon.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request).then(r=>{
   const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
 }).catch(()=>caches.match(e.request).then(r=>r||caches.match("./admin.html"))));
});
