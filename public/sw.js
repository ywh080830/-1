/* 智能记账 · Service Worker（手写，运行时缓存）
 * - 静态资源：Cache First（/assets/*、/icons/*、manifest、index.html）
 * - 导航请求：Network First，离线回退缓存 index.html（SPA 可离线打开）
 * - 数据一致性由 IndexedDB + syncEngine 保证，SW 不缓存 API/Storage 数据
 */
const CACHE_NAME = 'smart-bookkeeping-v1';
const STATIC_CACHE = 'sb-static-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 不缓存 Supabase API / Storage / 第三方
  if (url.hostname.includes('supabase.co')) return;
  if (url.origin !== self.location.origin) return;

  // 静态资源：Cache First（命中即返回，否则回源并缓存）
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // 导航（SPA 路由）：Network First，离线回退缓存 index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put('/index.html', clone));
          }
          return res;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  // 其余同源 GET：Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
