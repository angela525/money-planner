const CACHE_NAME='dream-tree-v7-beta-1';
const ASSETS=[
  './','./index.html','./css/app.css','./js/app.js','./js/firebase-cloud.js','./js/firebase-config.js',
  './manifest.json','./assets/images/brand-logo.png','./favicon-16.png','./favicon-32.png',
  './apple-touch-icon.png','./icon-192.png','./icon-512.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(!['http:','https:'].includes(url.protocol))return;
  if(url.origin!==self.location.origin){event.respondWith(fetch(event.request));return;}
  event.respondWith(fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
