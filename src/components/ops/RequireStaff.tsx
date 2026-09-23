import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsPlatformStaff } from "@/hooks/useIsPlatformStaff";

/**
 * Ops route gate. Waits until the staff answer has actually arrived, then
 * either renders or sends the visitor to the 404 page — an internal tool
 * should not advertise its own existence.
 *
 * This is convenience only: the real boundary is inside the database, where
 * every Ops RPC re-checks `is_platform_staff(auth.uid())`.
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { user, loading, authReady } = useAuth();
  const { isStaff, ready } = useIsPlatformStaff();

  if (loading || !authReady || (user && !ready)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6" role="status">
        <span className="text-sm text-muted-foreground">Checking access…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/404" replace />;

  return <>{children}</>;
}
