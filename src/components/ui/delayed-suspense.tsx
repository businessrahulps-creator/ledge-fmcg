import { Suspense, useEffect, useState, type ReactNode } from "react";

/**
 * Renders nothing for `delayMs` after first mount, then `fallback`.
 * Most code-split chunks arrive in <150 ms when the asset is already in
 * the browser cache (hover-prefetched), so showing any loader at all just
 * creates a visible flicker. The delay hides the loader for fast loads
 * and only shows it for genuinely slow chunks.
 */
function DelayedFallback({
  delayMs,
  fallback,
}: {
  delayMs: number;
  fallback: ReactNode;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);
  return show ? <>{fallback}</> : null;
}

interface DelayedSuspenseProps {
  children: ReactNode;
  fallback: ReactNode;
  delayMs?: number;
}

export function DelayedSuspense({
  children,
  fallback,
  delayMs = 180,
}: DelayedSuspenseProps) {
  return (
    <Suspense fallback={<DelayedFallback delayMs={delayMs} fallback={fallback} />}>
      {children}
    </Suspense>
  );
}
