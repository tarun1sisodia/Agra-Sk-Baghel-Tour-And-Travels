/**
 * Service Worker for SK Baghel Tour & Travels
 * Implements cache-first strategy for static assets & fonts with runtime caching for API
 */

const CACHE_NAME = 'skbaghel-v20261105';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/robots.txt',
    '/sitemap.xml',
    '/fonts/plus-jakarta-sans-latin.woff2',
    '/fonts/eb-garamond-latin.woff2',
    '/fonts/plus-jakarta-sans-latin-ext.woff2',
    '/fonts/eb-garamond-latin-ext.woff2',
    '/assets/brand/og-banner.webp',
    '/assets/brand/favicon.svg',
    '/assets/brand/agra-sk-baghel-logo.svg',
    '/assets/brand/agra-sk-baghel-mark.svg',
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

// Install event - cache static assets & critical fonts immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching static assets and critical fonts');
                // Cache individually so one missing asset (e.g. a removed file)
                // cannot fail the whole install.
                return Promise.allSettled(
                    STATIC_ASSETS.map((asset) => cache.add(asset).catch((err) => {
                        console.warn('[SW] Skipping uncacheable asset:', asset, err);
                    }))
                );
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

    // HTML navigations - network-first so the "no-cache" header on HTML keeps
    // serving fresh deploys; fall back to the cached shell only when offline.
    if (event.request.mode === 'navigate') {
        event.respondWith(networkFirstNavigate(event.request));
        return;
    }

    // Static assets & fonts - cache-first with network fallback
    event.respondWith(cacheFirst(event.request));
});

// Cache-first strategy for static assets and web fonts
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        // Cache successful responses and opaque responses (Google Fonts stylesheets and woff2 font files)
        if (response.ok || (response.type === 'opaque' && (request.destination === 'font' || request.destination === 'style' || request.url.includes('fonts.')))) {
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

// Network-first for HTML navigations, with the cached app shell as offline fallback
async function networkFirstNavigate(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match(request)) || (await cache.match('/index.html'));
        if (cached) return cached;
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
