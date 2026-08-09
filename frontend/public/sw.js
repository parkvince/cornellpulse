const CACHE_VERSION = "cornellpulse-shell-v2"
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.png", "/icon-192.png"]

async function precacheShell() {
  const cache = await caches.open(CACHE_VERSION)
  const response = await fetch("/", { cache: "no-store" })
  if (!response.ok) throw new Error("App shell unavailable during service-worker install")
  const html = await response.clone().text()
  await cache.put("/", response)
  const localAssets = [...html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)]
    .map(match => match[1])
    .filter(path => !path.startsWith("//"))
  await cache.addAll([...new Set([...APP_SHELL.slice(1), ...localAssets])])
}

self.addEventListener("install", event => {
  event.waitUntil(precacheShell())
  self.skipWaiting()
})

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener("fetch", event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== "GET") return
  if (url.pathname.startsWith("/api/")) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) void caches.open(CACHE_VERSION).then(cache => cache.put("/", response.clone()))
          return response
        })
        .catch(() => caches.match("/").then(cached => cached || Response.error())),
    )
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) void caches.open(CACHE_VERSION).then(cache => cache.put(request, response.clone()))
        return response
      })),
    )
  }
})
