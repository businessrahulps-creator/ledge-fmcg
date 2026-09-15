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

/** True when a recovery reload has already been attempted this session. */
export function chunkRecoveryAlreadyTried(): boolean {
  try {
    return sessionStorage.getItem(RELOAD_FLAG) === "1";
  } catch {
    return false;
  }
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
    // Cache-busted navigation: a plain reload can re-serve the same stale
    // document from the HTTP cache, which would repeat the failure.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("_r", Date.now().toString(36));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
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

/**
 * Last-resort screen shown when recovery already ran once and the app still
 * cannot load its files. Rendered with inline styles only, because the very
 * failure it reports may be the missing stylesheet.
 */
export function renderUnrecoverableScreen(message = "Ledge couldn't load its files.") {
  if (typeof document === "undefined") return;
  if (document.getElementById("ledge-fatal")) return;
  const el = document.createElement("div");
  el.id = "ledge-fatal";
  el.setAttribute("role", "alert");
  el.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;background:#0F1F3A;color:#F5F1EA;font-family:system-ui,-apple-system,sans-serif;text-align:center;";
  const title = document.createElement("div");
  title.textContent = "Ledge";
  title.style.cssText = "font-size:28px;letter-spacing:0.02em;font-weight:600;";
  const body = document.createElement("p");
  body.textContent = `${message} Check your connection and try again.`;
  body.style.cssText = "margin:0;max-width:22rem;font-size:15px;line-height:1.5;opacity:0.75;";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Retry";
  btn.style.cssText =
    "min-height:44px;padding:0 24px;border:0;border-radius:6px;background:#F5F1EA;color:#0F1F3A;font-size:15px;font-weight:600;cursor:pointer;";
  btn.addEventListener("click", () => {
    clearChunkReloadFlag();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("_r", Date.now().toString(36));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  });
  el.append(title, body, btn);
  document.body.appendChild(el);
  try {
    (window as any).__ledgeSplash?.done?.();
  } catch {
    /* ignore */
  }
}

/** Handles a suspected stale-asset failure: recover once, otherwise show the fallback. */
export function handleAssetFailure(message?: string) {
  if (recoverFromChunkError()) return true;
  renderUnrecoverableScreen(message);
  return false;
}

