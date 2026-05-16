import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Guard that pushes users without a company to /welcome.
 * The actual setup UI now lives at /welcome (multi-step, branded experience).
 */
export function NoCompanyGuard({ children }: { children: ReactNode }) {
  const { user, companyId, authReady, profileLoaded } = useAuth();

  if (!authReady || !profileLoaded || !user) return <>{children}</>;
  if (!companyId) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}
