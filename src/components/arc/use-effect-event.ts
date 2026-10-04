import { useCallback, useInsertionEffect, useRef } from "react";
/** React 18 stand-in for React 19's useEffectEvent: a stable callback that always sees the latest props. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useEffectEvent<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useInsertionEffect(() => { ref.current = fn; });
  return useCallback(((...args) => ref.current(...args)) as T, []);
}
