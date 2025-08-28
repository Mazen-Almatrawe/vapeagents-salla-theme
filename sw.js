/**
 * Service Worker for Vaperelax Theme
 * Optimized for performance and offline functionality
 */

const CACHE_NAME = 'vaperelax-v1.0.0';
const STATIC_CACHE = 'vaperelax-static-v1';
const DYNAMIC_CACHE = 'vaperelax-dynamic-v1';
const IMAGE_CACHE = 'vaperelax-images-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/assets/css/main.css',
    '/assets/js/main.js',
    '/assets/fonts/arabic-font.woff2',
    '/assets/images/logo.png',
    '/assets/images/placeholder-product.jpg',
    '/offline.html'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
    // Cache first for static assets
    static: [
        '/assets/',
        '/fonts/'
    ],
    
    // Network first for API calls
    networkFirst: [
        '/api/',
        '/search'
    ],
    
    // Cache first for images
    cacheFirst: [
        '/images/',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.svg'
    ],
    
    // Stale while revalidate for pages
    staleWhileRevalidate: [
        '/products/',
        '/categories/',
        '/brands/'
    ]
};

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
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static assets', error);
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
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== IMAGE_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(handleRequest(request));
});

// Handle request with appropriate caching strategy
async function handleRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
        // Static assets - Cache First
        if (isStaticAsset(pathname)) {
            return await cacheFirst(request, STATIC_CACHE);
        }
        
        // Images - Cache First with longer TTL
        if (isImage(pathname)) {
            return await cacheFirst(request, IMAGE_CACHE);
        }
        
        // API calls - Network First
        if (isApiCall(pathname)) {
            return await networkFirst(request, DYNAMIC_CACHE);
        }
        
        // Pages - Stale While Revalidate
        if (isPage(pathname)) {
            return await staleWhileRevalidate(request, DYNAMIC_CACHE);
        }
        
        // Default - Network First
        return await networkFirst(request, DYNAMIC_CACHE);
        
    } catch (error) {
        console.error('Service Worker: Request failed', error);
        return await handleOffline(request);
    }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Return cached version immediately
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First: Network failed', error);
        throw error;
    }
}

// Network First strategy
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network First: Network failed, trying cache');
        
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch from network in background
    const networkResponsePromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('Stale While Revalidate: Network update failed', error);
        });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cache, wait for network
    return await networkResponsePromise;
}

// Handle offline scenarios
async function handleOffline(request) {
    const url = new URL(request.url);
    
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
        const cache = await caches.open(STATIC_CACHE);
        return await cache.match('/offline.html');
    }
    
    // For images, return placeholder
    if (isImage(url.pathname)) {
        const cache = await caches.open(STATIC_CACHE);
        return await cache.match('/assets/images/placeholder-product.jpg');
    }
    
    // For other requests, return a generic offline response
    return new Response(
        JSON.stringify({
            error: 'Offline',
            message: 'لا يوجد اتصال بالإنترنت'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

// Helper functions to determine request type
function isStaticAsset(pathname) {
    return CACHE_STRATEGIES.static.some(pattern => pathname.includes(pattern));
}

function isImage(pathname) {
    return CACHE_STRATEGIES.cacheFirst.some(pattern => 
        pathname.includes(pattern) || pathname.endsWith(pattern)
    );
}

function isApiCall(pathname) {
    return CACHE_STRATEGIES.networkFirst.some(pattern => pathname.includes(pattern));
}

function isPage(pathname) {
    return CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => pathname.includes(pattern));
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('Service Worker: Background sync triggered');
    
    // Retry failed requests stored in IndexedDB
    try {
        const db = await openDB();
        const transaction = db.transaction(['failed-requests'], 'readonly');
        const store = transaction.objectStore('failed-requests');
        const requests = await store.getAll();
        
        for (const requestData of requests) {
            try {
                await fetch(requestData.url, requestData.options);
                
                // Remove successful request from storage
                const deleteTransaction = db.transaction(['failed-requests'], 'readwrite');
                const deleteStore = deleteTransaction.objectStore('failed-requests');
                await deleteStore.delete(requestData.id);
                
                console.log('Background sync: Request retried successfully', requestData.url);
            } catch (error) {
                console.log('Background sync: Request still failing', requestData.url);
            }
        }
    } catch (error) {
        console.error('Background sync: Failed to process requests', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) {
        return;
    }
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/assets/images/icon-192.png',
        badge: '/assets/images/badge-72.png',
        data: data.data,
        actions: [
            {
                action: 'view',
                title: 'عرض',
                icon: '/assets/images/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'إغلاق',
                icon: '/assets/images/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        const url = event.notification.data?.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Check if window is already open
                    for (const client of clientList) {
                        if (client.url === url && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Open new window
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

// Cache management utilities
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            cacheUrls(event.data.urls)
        );
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            clearCache(event.data.cacheName)
        );
    }
});

// Cache specific URLs
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log('Service Worker: Cached URL', url);
            }
        } catch (error) {
            console.error('Service Worker: Failed to cache URL', url, error);
        }
    }
}

// Clear specific cache
async function clearCache(cacheName) {
    try {
        await caches.delete(cacheName);
        console.log('Service Worker: Cache cleared', cacheName);
    } catch (error) {
        console.error('Service Worker: Failed to clear cache', cacheName, error);
    }
}

// IndexedDB helper for storing failed requests
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('vaperelax-sw', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('failed-requests')) {
                const store = db.createObjectStore('failed-requests', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
    // Track cache hit/miss rates
    const startTime = performance.now();
    
    event.respondWith(
        handleRequest(event.request).then((response) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Log performance metrics
            console.log(`SW: ${event.request.url} - ${duration.toFixed(2)}ms`);
            
            return response;
        })
    );
});

console.log('Service Worker: Script loaded');

