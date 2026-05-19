/**
 * Single source of truth for code-split route imports.
 *
 * Each value is a thunk that triggers the dynamic import for a page chunk.
 * `App.tsx` wraps these in `React.lazy()`. `<NavLink>` calls `prefetchRoute`
 * on hover/touch/focus so the chunk is already in the browser cache by the
 * time the user clicks. `prefetchLikelyNext` warms a tiny set of "next
 * likely" destinations on idle — never the whole app, which used to
 * saturate slow mobile connections and make navigation feel glitchy.
 */

export const routeImporters = {
  "/dashboard": () => import("@/pages/Dashboard"),
  "/orders": () => import("@/pages/Orders"),
  "/orders/new": () => import("@/pages/NewOrder"),
  "/orders/:id": () => import("@/pages/OrderDetail"),
  "/distributors": () => import("@/pages/Distributors"),
  "/distributors/:id": () => import("@/pages/DealerDetail"),
  "/salespersons": () => import("@/pages/Salespersons"),
  "/salespersons/:id": () => import("@/pages/SalespersonDetail"),
  "/stock": () => import("@/pages/Stock"),
  "/schemes": () => import("@/pages/Schemes"),
  "/targets": () => import("@/pages/Targets"),
  "/reports": () => import("@/pages/Reports"),
  "/performance": () => import("@/pages/Performance"),
  "/command": () => import("@/pages/Command"),
  "/settings": () => import("@/pages/Settings"),
  "/billing": () => import("@/pages/Billing"),
  "/help": () => import("@/pages/Help"),
  "/company": () => import("@/pages/Company"),
  "/claims": () => import("@/pages/Claims"),
} as const;

export type RoutePath = keyof typeof routeImporters;

const warmed = new Set<string>();

function resolveImporter(path: string): (() => Promise<unknown>) | undefined {
  const map = routeImporters as Record<string, () => Promise<unknown>>;
  // Exact match first
  if (map[path]) return map[path];
  // Only collapse the trailing segment to ":id" when there's a known
  // collection route AND the trailing segment is NOT a static sub-route
  // (e.g. "/orders/new" must not collapse to "/orders/:id").
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return undefined;
  const parent = path.slice(0, lastSlash);
  const tail = path.slice(lastSlash + 1);
  // Skip if the parent route doesn't exist or the tail is itself a static page
  if (!map[parent]) return undefined;
  const collapsed = `${parent}/:id`;
  if (!map[collapsed]) return undefined;
  // Heuristic: only treat as id when tail looks like an id (not "new"/"edit")
  if (/^(new|edit|create|add)$/i.test(tail)) return undefined;
  return map[collapsed];
}

/** Trigger a chunk download (no-op if already warmed). */
export function prefetchRoute(path: string): void {
  if (warmed.has(path)) return;
  const importer = resolveImporter(path);
  if (!importer) return;
  warmed.add(path);
  // Fire-and-forget; failures are not user-visible
  importer().catch(() => warmed.delete(path));
}

type IdleCb = (cb: () => void, opts?: { timeout: number }) => number;

const ric: IdleCb =
  (typeof window !== "undefined" && (window as any).requestIdleCallback) ||
  ((cb: () => void) => window.setTimeout(cb, 1));

/**
 * For each page, the 1–2 most likely next destinations. Used to gently
 * warm only what the user is most likely to click — never the whole app.
 */
const likelyNext: Record<string, string[]> = {
  "/dashboard": ["/orders", "/distributors"],
  "/orders": ["/orders/new", "/billing"],
  "/orders/new": ["/orders"],
  "/distributors": ["/orders/new"],
  "/billing": ["/orders"],
  "/stock": ["/orders/new"],
  "/salespersons": ["/command"],
  "/reports": ["/command"],
  "/performance": ["/command"],
  "/command": ["/distributors", "/orders"],
};

/** Warm the 1–2 likely next routes from the current path, on idle. */
export function prefetchLikelyNext(currentPath: string): void {
  // Normalise dynamic segments back to the registered key form
  const key = currentPath in likelyNext
    ? currentPath
    : currentPath.replace(/\/[^/]+$/, "/:id") in likelyNext
      ? currentPath.replace(/\/[^/]+$/, "/:id")
      : currentPath;
  const next = likelyNext[key];
  if (!next || next.length === 0) return;
  let i = 0;
  const step = () => {
    if (i >= next.length) return;
    prefetchRoute(next[i++]);
    ric(step, { timeout: 2000 });
  };
  ric(step, { timeout: 2000 });
}

/** @deprecated kept for backwards compat — now a no-op. */
export function prefetchAllRoutes(): void {
  // Intentionally empty. Blanket prefetch saturated slow mobile networks
  // and caused the very "glitchy navigation" we were trying to prevent.
  // Per-link hover + prefetchLikelyNext are used instead.
}
