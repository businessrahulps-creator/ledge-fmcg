import { createContext, useContext, type ReactNode } from "react";
import type { CatalogContextType } from "./data-types";

const CatalogContext = createContext<CatalogContextType | null>(null);

/**
 * Inert defaults returned during transient signed-out states, mirroring
 * DataContext's NOOP_DATA_STUB policy. Throwing here would surface a
 * PageErrorBoundary toast for ~1 frame during sign-out.
 */
const NOOP_CATALOG_STUB = new Proxy({} as any, {
  get(_t, prop) {
    if (prop === "products" || prop === "schemes" || prop === "distributors") return [];
    return async () => undefined;
  },
}) as CatalogContextType;

export function CatalogProvider({
  value,
  children,
}: {
  value: CatalogContextType;
  children: ReactNode;
}) {
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextType {
  const ctx = useContext(CatalogContext);
  if (ctx) return ctx;
  if (typeof window !== "undefined") return NOOP_CATALOG_STUB;
  throw new Error("useCatalog must be used within CatalogProvider");
}

export { CatalogContext };
