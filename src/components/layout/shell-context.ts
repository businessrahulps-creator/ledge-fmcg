import { createContext } from "react";

// Lives in its own file so editing AppLayout.tsx (hot reload) never creates a
// second context instance, which made pages draw a nested frame.
export const ShellContext = createContext(false);

type ShellWindow = Window & { __ledgeShellMounted?: number };

export function shellMountedCount(): number {
  if (typeof window === "undefined") return 0;
  return (window as ShellWindow).__ledgeShellMounted ?? 0;
}

export function markShellMounted(delta: 1 | -1) {
  if (typeof window === "undefined") return;
  const w = window as ShellWindow;
  w.__ledgeShellMounted = Math.max(0, (w.__ledgeShellMounted ?? 0) + delta);
}
