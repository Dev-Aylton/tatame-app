const CACHE_PREFIX = "tatame-app-static-";
const APP_VERSION = "5.18";
const CACHE_NAME = `${CACHE_PREFIX}${APP_VERSION}`;
const SHELL_URL = new URL("./index.html", self.registration.scope);
const CONFIG_PATH = new URL("./js/config.js", self.registration.scope).pathname;
const STATIC_ASSETS = [
  "./index.html",
  "./demo.html",
  "./css/app.css",
  "./js/app.js",
  "./js/demo.js",
  "./js/exportar.js",
  "./js/offline.js",
  "./js/vendor/supabase-2.49.8.js",
  "./privacidade.html",
  "./manifest.webmanifest",
  "./assets/logos/google-g.svg",
  "./assets/logos/icon-192.png",
  "./assets/logos/tatame-icone-escudo-512.png",
  "./assets/logos/icon-maskable-512.png",
  "./assets/logos/apple-touch-icon.png",
  "./assets/logos/tatame-icone-escudo.svg"
];
const STATIC_URLS = new Set(
  STATIC_ASSETS.map((asset) => new URL(asset, self.registration.scope).href)
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("authorization")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin ||
      url.hostname === "supabase.co" || url.hostname.endsWith(".supabase.co") ||
      url.pathname === CONFIG_PATH) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cachedPage = await cache.match(request);
        if (cachedPage) return cachedPage;
        const cachedShell = await cache.match(SHELL_URL);
        if (cachedShell) return cachedShell;
        throw new Error("A página offline não está disponível no cache.");
      }
    })());
    return;
  }

  if (!STATIC_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
