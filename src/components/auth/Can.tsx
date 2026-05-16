import type { ReactNode } from "react";
import { useCan, type CapabilityKey } from "@/hooks/useCan";

interface CanProps {
  do: CapabilityKey;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Capability guard. Renders children only when the current user has the capability.
 * Use the `useCan` hook directly when the gate is part of a larger expression.
 */
export function Can({ do: capability, children, fallback = null }: CanProps) {
  const allowed = useCan(capability);
  return <>{allowed ? children : fallback}</>;
}
