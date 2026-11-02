/* ZK Ajanda: internetsiz açılış. Sayfa önce internetten istenir (yeni sürüm gelsin), olmazsa saklanan kopya açılır. */
const CACHE = 'zk-ajanda-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // Google'a giden istekler olduğu gibi geçer
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(e.request, { signal: ctl.signal, cache: 'no-cache' }); clearTimeout(t);
      if (r.ok) c.put(e.request.mode === 'navigate' ? './index.html' : e.request, r.clone());
      return r;
    } catch {
      return (await c.match(e.request.mode === 'navigate' ? './index.html' : e.request, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error();
    }
  })());
});
