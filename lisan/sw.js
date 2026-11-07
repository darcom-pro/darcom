/* لِسان — عامل الخدمة: يجعل التطبيق يعمل دون إنترنت بعد أول زيارة */
const CACHE = 'lisan-v1';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './course-en.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); const same = url.origin === location.origin; const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  // الشبكة أولاً للملفات المحلية (للحصول على التحديثات)، ثم النسخة المحفوظة عند انقطاع الإنترنت
  e.respondWith(fetch(req).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
    .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
