const CACHE_NAME = 'andora-v1';
const ASSETS = [
  '/Andora-store/',
  '/Andora-store/index.html'
];

// Install - cache core assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', function(e){
  // Skip non-GET and external requests
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith(self.location.origin)) return;
  
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache successful responses
        if(response && response.status === 200){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, copy);
          });
        }
        return response;
      }).catch(function(){
        // Offline fallback
        return caches.match('/Andora-store/index.html');
      });
    })
  );
});

// Push notification handler (future use)
self.addEventListener('push', function(e){
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'ANDORA Store', {
      body: data.body || 'มีการอัปเดตใหม่',
      icon: '/Andora-store/icon-192.png',
      badge: '/Andora-store/icon-192.png',
      data: data.url || '/Andora-store/'
    })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data));
});
