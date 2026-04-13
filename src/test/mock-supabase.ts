import { vi } from "vitest";

/** Creates a chainable mock that mirrors the Supabase PostgREST builder pattern. */
export function createChainMock(resolvedValue: { data: any; error: any } = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  const methods = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "is", "order", "range", "limit",
    "filter", "match", "not", "or", "contains",
  ];
  methods.forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue);
  // For non-single terminators, resolve the same value
  chain.then = undefined; // Prevent auto-thenable — callers must call .single() or await the builder
  // Allow awaiting the chain directly (e.g. .insert(...) without .single())
  const promise = Promise.resolve(resolvedValue);
  // Make the chain thenable so `await supabase.from(...).insert(...)` works
  chain.then = promise.then.bind(promise);
  chain.catch = promise.catch.bind(promise);
  return chain;
}

export function createMockSupabase(overrides?: {
  fromFn?: (...args: any[]) => any;
  rpcFn?: (...args: any[]) => any;
}) {
  const defaultChain = createChainMock();
  return {
    from: overrides?.fromFn ?? vi.fn().mockReturnValue(defaultChain),
    rpc: overrides?.rpcFn ?? vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
  };
}

/** Convenience: create DomainDeps for testing */
export function createMockDeps(companyId = "company-1") {
  return {
    companyId,
    persistEntityToCache: vi.fn(),
    log: vi.fn(),
  };
}
