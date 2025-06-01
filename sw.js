// 定义缓存名称和版本（更新版本号可强制刷新缓存）
const CACHE_NAME = 'sakino-homepage-v1';
// 需要缓存的资源列表（根据实际文件修改路径！）
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/Sakino.JPG',
  '/haikei1.JPG',
  '/haikei2.JPG',
  '/haikei3.JPG',
  '/icon-192.png',
  '/icon-512.png'
];

// ===== 安装阶段：预缓存关键资源 =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 缓存静态资源');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => console.error('缓存失败:', err))
  );
});

// ===== 激活阶段：清理旧缓存 =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// ===== 拦截网络请求 =====
self.addEventListener('fetch', (event) => {
  // 忽略非GET请求和Chrome扩展请求
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 返回缓存或网络请求
        return cachedResponse || fetch(event.request)
          .then((response) => {
            // 动态缓存新请求（可选）
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
            return response;
          })
          .catch(() => {
            // 离线时显示备用内容（需自行创建offline.html）
            return caches.match('/offline.html');
          });
      })
  );
});
