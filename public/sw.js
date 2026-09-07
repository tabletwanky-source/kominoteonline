const CACHE_NAME = 'kominote-static-v1';
const OFFLINE_URL = '/offline.html';

// Core static assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/icon.svg'
];

// Sensitive or dynamic paths that MUST NEVER be cached
const NEVER_CACHE_PATTERNS = [
  /\/api\//,
  /\/admin/,
  /\/dashboard/,
  /\/instructor/,
  /\/checkout/,
  /\/invoice/,
  /\/orders/,
  /supabase\.co/,
  /api\.stripe\.com/,
  /checkout\.stripe\.com/
];

// Check if request is sensitive or non-cacheable
function isNonCacheable(request) {
  if (request.method !== 'GET') return true;
  const url = request.url;
  for (const pattern of NEVER_CACHE_PATTERNS) {
    if (pattern.test(url)) return true;
  }
  return false;
}

// Install Event: precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache skipped for some optional assets:', err);
      });
    })
  );
  // Don't auto-activate yet; wait for update prompt or explicit skipWaiting
});

// Activate Event: clean up obsolete cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event: support manual SKIP_WAITING from PWA update toast
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: strictly safeguard sensitive data, cache safe static assets only
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept non-GET or sensitive API / Auth / Stripe / Supabase requests
  if (isNonCacheable(request)) {
    return;
  }

  // Handle page navigations (HTML document requests)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL).then((cached) => {
          return cached || fetch(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // Handle static assets (scripts, styles, images, fonts)
  const isStaticAsset = 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-while-revalidate for static assets
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
