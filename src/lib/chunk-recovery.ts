/**
 * Recovery for "the screen won't open" failures.
 *
 * When a new version is deployed, the old hashed JS files disappear from the
 * server. A browser (or an installed home-screen app) still holding the old
 * page will fail to load the screen's file and throw a dynamic-import error —
 * the user sees an error card instead of, say, the order they tapped.
 *
 * Fix: recognise that specific failure, drop every cached copy + service
 * worker, and reload once. The one-shot guard means a genuinely broken build
 * can never put the app in a reload loop.
 */

const RELOAD_FLAG = "ledge:chunk-reload";

export function isChunkLoadError(error: unknown): boolean {
  const msg = typeof error === "string" ? error : (error as any)?.message || "";
  const name = (error as any)?.name || "";
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /ChunkLoadError/i.test(name) ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /'text\/html' is not a valid JavaScript MIME type/i.test(msg)
  );
}

/** Returns true when a reload was triggered (caller should stop rendering fallbacks). */
export function recoverFromChunkError(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    return false;
  }

  void (async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations()) || [];
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    } catch {
      /* ignore */
    }
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
      }
    } catch {
      /* ignore */
    }
    window.location.reload();
  })();

  return true;
}

/** Clears the guard once the app has rendered successfully again. */
export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* ignore */
  }
}
