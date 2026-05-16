// Kill-switch service worker.
// Replaces the previous vite-plugin-pwa service worker. On install it claims
// every client, deletes every cache, navigates open windows once to drop the
// old cached shell, then unregisters itself. Keep this file shipped for at
// least one release cycle so installed devices have a chance to visit and
// self-clean. See mem://features/offline-mode-paused.
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        await Promise.all(
          clients.map((c) => {
            try {
              const url = new URL(c.url);
              url.searchParams.set("sw-cleanup", Date.now().toString());
              return c.navigate(url.toString());
            } catch {
              return Promise.resolve();
            }
          })
        );
      } finally {
        await self.registration.unregister();
      }
    })()
  )
);
