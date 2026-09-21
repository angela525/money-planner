// Dream Tree Stability 1.0: retire legacy PWA cache during stability testing.
self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))),
    self.registration.unregister(),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',()=>{});
