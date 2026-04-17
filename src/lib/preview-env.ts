/**
 * Detects if the app is running in a Lovable preview environment or any iframe.
 * Used to disable PWA / service-worker logic in non-production contexts.
 */
export const isInIframe = (() => {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

export const isPreviewHost = (() => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h.includes("id-preview--") ||
    h.includes("lovableproject.com")
  );
})();

export const isPreviewEnv = isPreviewHost || isInIframe;
