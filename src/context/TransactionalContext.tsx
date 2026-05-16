import { createContext, useContext, type ReactNode } from "react";
import type { TransactionalContextType } from "./data-types";

const TransactionalContext = createContext<TransactionalContextType | null>(null);

/**
 * Inert defaults returned during transient signed-out states, mirroring
 * DataContext's NOOP_DATA_STUB policy.
 */
const NOOP_TRANSACTIONAL_STUB = new Proxy({} as any, {
  get(_t, prop) {
    if (
      typeof prop === "string" &&
      /^(orders|invoices|claims|locations|stockItems|secondarySales|targets|salespersons)$/.test(prop)
    ) {
      return [];
    }
    if (prop === "nextOrderNumber" || prop === "previewOrderNumber") return () => "";
    if (prop === "setStockItems") return () => undefined;
    return async () => undefined;
  },
}) as TransactionalContextType;

export function TransactionalProvider({
  value,
  children,
}: {
  value: TransactionalContextType;
  children: ReactNode;
}) {
  return (
    <TransactionalContext.Provider value={value}>{children}</TransactionalContext.Provider>
  );
}

export function useTransactional(): TransactionalContextType {
  const ctx = useContext(TransactionalContext);
  if (ctx) return ctx;
  if (typeof window !== "undefined") return NOOP_TRANSACTIONAL_STUB;
  throw new Error("useTransactional must be used within TransactionalProvider");
}

export { TransactionalContext };
