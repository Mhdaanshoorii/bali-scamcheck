const CACHE="bsc-admin-v12";
const SHELL=["./admin.html","./admin-manifest.json","./icon.png","./login-fix.js"];

async function patch(r){
  if(!r||!r.ok)return r;
  let t=await r.text();
  if(!t.includes("login-fix.js"))t=t.replace("</body>",'<script src="./login-fix.js?v=12"></script></body>');
  return new Response(t,{status:r.status,statusText:r.statusText,headers:{"Content-Type":"text/html; charset=utf-8"}});
}
self.addEventListener("install",e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  for(const u of SHELL)try{
    const r=await fetch(u,{cache:"no-store"});
    await c.put(u,u.endsWith("admin.html")?await patch(r.clone()):r.clone());
  }catch(_){}
  await self.skipWaiting();
})()));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>k.startsWith("bsc-admin-")&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin||e.request.method!=="GET")return;
  if(u.pathname.endsWith("/admin.html")){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request,{cache:"no-store"});
        const x=await patch(r.clone());
        const c=await caches.open(CACHE); await c.put("./admin.html",x.clone());
        return x;
      }catch(_){return caches.match("./admin.html")}
    })());
  }
});
