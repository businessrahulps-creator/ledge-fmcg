/**
 * Single source of truth for code-split route imports.
 *
 * Each value is a thunk that triggers the dynamic import for a page chunk.
 * `App.tsx` wraps these in `React.lazy()`. After login, `<RoutePrefetcher />`
 * walks this map on `requestIdleCallback` and warms every chunk in the
 * background, so subsequent navigations feel instant.
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
  "/settings": () => import("@/pages/Settings"),
  "/billing": () => import("@/pages/Billing"),
  "/help": () => import("@/pages/Help"),
  "/company": () => import("@/pages/Company"),
  "/claims": () => import("@/pages/Claims"),
} as const;

export type RoutePath = keyof typeof routeImporters;

const warmed = new Set<string>();

/** Trigger a chunk download (no-op if already warmed). */
export function prefetchRoute(path: string): void {
  // Try exact match first, then strip params
  const importer =
    (routeImporters as Record<string, () => Promise<unknown>>)[path] ??
    (routeImporters as Record<string, () => Promise<unknown>>)[
      path.replace(/\/[^/]+$/, "/:id")
    ];
  if (!importer) return;
  if (warmed.has(path)) return;
  warmed.add(path);
  // Fire-and-forget; failures are not user-visible
  importer().catch(() => warmed.delete(path));
}

type IdleCb = (cb: () => void, opts?: { timeout: number }) => number;

const ric: IdleCb =
  (typeof window !== "undefined" && (window as any).requestIdleCallback) ||
  ((cb: () => void) => window.setTimeout(cb, 1));

/**
 * Warm every authenticated route chunk on idle, one at a time,
 * so we never block interaction or saturate the network.
 */
export function prefetchAllRoutes(): void {
  const paths = Object.keys(routeImporters);
  let i = 0;
  const step = () => {
    if (i >= paths.length) return;
    prefetchRoute(paths[i++]);
    ric(step, { timeout: 2000 });
  };
  ric(step, { timeout: 2000 });
}
