import { useDelayedShow } from "@/hooks/use-delayed-show";

/**
 * Compact, layout-preserving skeleton for route-level Suspense fallbacks.
 * Used instead of the full-screen splash so navigation feels continuous
 * (sidebar/topbar stay mounted around it).
 *
 * Guarded by useDelayedShow(180) — fast prefetched navigations never see
 * the loader; only genuinely slow chunks render it.
 */
export function RouteSkeleton() {
  const show = useDelayedShow(180);
  if (!show) return null;
  return (
    <div
      className="w-full px-4 py-6 sm:px-6 sm:py-8 animate-in fade-in duration-200"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-7 w-48 rounded-md bg-muted/60 animate-pulse" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted/40 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted/30 animate-pulse" />
      </div>
    </div>
  );
}
