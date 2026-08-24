const CACHE_NAME = "alberca-v2";
const urlsToCache = [
  "./",
  "./index.html",
  "./configuraciones.html",
  "./style.css",
  "./index.js",
  "./agenda.js",
  "./ui.js",
  "./firestore.js",
  "./manifest.json",
  "./regist_serviceWorker.js",
  "./pwa/images/icons/icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch((err) => console.log("Falló registro de cache", err))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Network-first para los recursos propios (evita servir versiones viejas de la app)
 * con respaldo en caché cuando no hay conexión. Las peticiones a Firestore y otros
 * orígenes se dejan pasar directo a la red.
 */
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(request)
      .then((response) => {
        const copia = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
        return response;
      })
      .catch(() =>
        caches.match(request).then((res) => res ?? caches.match("./index.html"))
      )
  );
});
