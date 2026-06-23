// Minimal service worker — exists to make DigDeep installable as a desktop PWA
// and to provide an offline app-shell fallback. It deliberately does NOT cache
// API or auth responses, so charges/receipts are always fetched fresh.

const SHELL_CACHE = 'digdeep-shell-v1'
// The SPA serves the same index.html for every route, so one cached shell
// covers any navigation (/dashboard, /widget/pet, …) when offline.
const SHELL_URL = '/'

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(SHELL_CACHE).then(cache => cache.add(SHELL_URL)).catch(() => {})
    )
    self.skipWaiting()
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k)))
        )
    )
    self.clients.claim()
})

self.addEventListener('fetch', event => {
    const { request } = event

    // Only handle same-origin page navigations; let everything else
    // (assets, /bi API calls, GraphQL auth) go straight to the network.
    if (request.mode !== 'navigate' || new URL(request.url).origin !== self.location.origin) {
        return
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                const copy = response.clone()
                caches.open(SHELL_CACHE).then(cache => cache.put(SHELL_URL, copy)).catch(() => {})
                return response
            })
            .catch(() => caches.match(SHELL_URL).then(cached => cached || caches.match(request)))
    )
})
