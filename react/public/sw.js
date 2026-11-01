/**
 * Service Worker for SK Baghel Tour & Travels
 * Implements cache-first strategy for static assets with runtime caching for API
 */

const CACHE_NAME = 'skbaghel-v20261101';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/assets/brand/og-banner.webp',
    '/assets/brand/favicon.svg',
    '/assets/brand/logos/01-roadline-lockup-light.svg',
    '/assets/brand/logos/02-signet-lockup-light.svg',
    '/assets/brand/logos/03-arch-lockup-light.svg',
    '/assets/brand/logos/04-compass-lockup-light.svg',
    '/assets/brand/logos/05-milestone-lockup-light.svg',
    '/assets/packages/taj-dawn.webp',
    '/assets/packages/agra-fort.webp',
    '/assets/packages/golden-triangle.webp',
    '/assets/trust/driver.webp',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // API requests - network-first with cache fallback
    if (event.request.url.includes('/api/')) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // Static assets - cache-first with network fallback
    event.respondWith(cacheFirst(event.request));
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline fallback for HTML pages
        if (request.headers.get('accept')?.includes('text/html')) {
            return cache.match('/index.html');
        }
        throw error;
    }
}

// Network-first strategy for API requests
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

// Background sync for failed requests (future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-bookings') {
        event.waitUntil(syncBookings());
    }
});

async function syncBookings() {
    // Future implementation for offline booking sync
    console.log('[SW] Syncing bookings...');
}
