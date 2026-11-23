/* ZK Ajanda: internetsiz açılış. Sayfa önce internetten istenir (yeni sürüm gelsin), olmazsa saklanan kopya açılır. */
const CACHE = 'zk-ajanda-v2';
const FILES = ['./', './index.html', './hesap.html', './manifest.webmanifest', './icon.png'];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';   // Hesap'ın Excel parçası: ilk açılışta saklanır, sonra internetsiz de çalışır
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method === 'GET' && u.href === XLSX_URL) { e.respondWith(caches.open(CACHE).then(async c => (await c.match(XLSX_URL)) || fetch(e.request).then(r => { c.put(XLSX_URL, r.clone()); return r; }))); return; }
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // Google'a giden istekler olduğu gibi geçer
  const key = e.request.mode === 'navigate' ? (u.pathname.endsWith('/hesap.html') ? './hesap.html' : './index.html') : e.request;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(e.request, { signal: ctl.signal, cache: 'no-cache' }); clearTimeout(t);
      if (r.ok) c.put(key, r.clone());
      return r;
    } catch {
      return (await c.match(key, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error();
    }
  })());
});
