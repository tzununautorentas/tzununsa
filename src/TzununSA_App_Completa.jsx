const CACHE = "tzununsa-v1";
const ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes("supabase.co")) {
    e.respondWith(fetch(e.request).catch(()=>new Response(JSON.stringify({error:"Sin conexión"}),{headers:{"Content-Type":"application/json"}})));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{
    if(r.status===200){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));}
    return r;
  }).catch(()=>caches.match(e.request).then(c=>c||caches.match("/index.html"))));
});
