const CACHE_NAME = 'sakino-assets-v2'; // 更新版本号
const ASSETS_TO_CACHE = [
  '/Sakino.JPG',
  '/haikei1.JPG',
  '/haikei2.JPG',
  '/haikei3.JPG',
  '/icon-192.png',
  '/icon-512.png'
  // 注意：不再缓存 index.html
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  // 不缓存HTML文件
  if (event.request.url.endsWith('.html')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});


