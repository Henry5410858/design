/**
 * Service Worker for DiseñoPro PWA
 * Offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'diseñopro-v1759227469813';
const STATIC_CACHE = 'diseñopro-static-v1759227469813';
const DYNAMIC_CACHE = 'diseñopro-dynamic-v1759227469813';

// Assets to cache immediately (HTML routes removed)
const STATIC_ASSETS = [
  // Do NOT cache any HTML routes like '/', '/templates', '/editor', etc.
  '/manifest.json',
  '/favicon.ico',
  '/assets/img/logo.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/templates/,
  /\/api\/auth\/validate/,
  /\/api\/brand-kit/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // EMERGENCY: Block all example.com requests immediately
  if (url.hostname === 'cdn.example.com' || url.hostname.includes('example.com')) {
    console.log('Service Worker: BLOCKING example.com request', url.href);
    event.respondWith(new Response('Blocked by Service Worker', { 
      status: 204,
      statusText: 'No Content - Blocked CDN Request'
    }));
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle different types of requests
async function handleRequest(request) {
  const url = new URL(request.url);

  // Double-check for example.com requests
  if (url.hostname === 'cdn.example.com' || url.hostname.includes('example.com')) {
    console.log('Service Worker: Blocking example.com request in handler', url.href);
    return new Response('Blocked', { status: 403 });
  }

  try {
    // HTML navigations: network-only, do not cache
    if (isHtmlRequest(request) || request.mode === 'navigate') {
      return await fetch(request);
    }

    // Static assets - cache first
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE);
    }

    // API requests - network first with cache fallback
    if (isApiRequest(url)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }

    // Images and other assets - stale while revalidate
    return await staleWhileRevalidate(request, DYNAMIC_CACHE);

  } catch (error) {
    // Silently handle fetch errors for non-critical resources
    console.warn('Service Worker: Fetch error (non-critical)', error.message);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await getOfflinePage();
    }

    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    // Clone immediately to avoid "Response body is already used" when caching later
    const responseClone = networkResponse.clone();
    if (networkResponse.ok) {
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone).catch((err) => {
          console.error('Service Worker: Cache put failed', err);
        });
      });
    }
    return networkResponse;
  }).catch((err) => {
    console.error('Service Worker: Network fetch failed', err);
    // Fall back to cached if available
    return cachedResponse || Promise.reject(err);
  });

  return cachedResponse || fetchPromise;
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/);
}

// Check if request is for API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for HTML
function isHtmlRequest(request) {
  return request.headers.get('accept').includes('text/html');
}

// Get offline page
async function getOfflinePage() {
  const offlinePage = await caches.match('/offline.html');
  
  if (offlinePage) {
    return offlinePage;
  }
  
  // Return a basic offline page
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sin Conexión - DiseñoPro</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 40px 20px;
          background: #f8fafc;
          color: #334155;
          text-align: center;
        }
        .container {
          max-width: 400px;
          margin: 0 auto;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 16px;
          color: #1e293b;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
        }
        .button:hover {
          background: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>Sin Conexión</h1>
        <p>No tienes conexión a internet. Algunas funciones pueden estar limitadas.</p>
        <a href="/" class="button">Intentar de Nuevo</a>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de DiseñoPro',
    icon: '/assets/img/logo.png',
    badge: '/assets/img/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/assets/img/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/assets/img/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('DiseñoPro', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Perform background sync
async function doBackgroundSync() {
  try {
    // Sync offline data when connection is restored
    console.log('Service Worker: Performing background sync');
    
    // Get pending offline actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await syncAction(action);
        await removePendingAction(action.id);
      } catch (error) {
        console.error('Service Worker: Sync action failed', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Get pending actions from IndexedDB
async function getPendingActions() {
  // Implementation for getting pending actions
  return [];
}

// Sync individual action
async function syncAction(action) {
  // Implementation for syncing individual actions
  console.log('Service Worker: Syncing action', action);
}

// Remove pending action from IndexedDB
async function removePendingAction(actionId) {
  // Implementation for removing pending actions
  console.log('Service Worker: Removing pending action', actionId);
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

// Sync content periodically
async function syncContent() {
  try {
    console.log('Service Worker: Performing periodic content sync');
    
    // Update cached content
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (shouldUpdateContent(request)) {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse);
          }
        } catch (error) {
          console.error('Service Worker: Failed to update content', error);
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Periodic sync failed', error);
  }
}

// Check if content should be updated
function shouldUpdateContent(request) {
  const url = new URL(request.url);
  
  // Update API responses more frequently
  if (url.pathname.startsWith('/api/')) {
    return true;
  }
  
  // Update static content less frequently
  return false;
}

console.log('Service Worker: Loaded successfully');
