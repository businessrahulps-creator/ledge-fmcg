import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/** Server check: does this signed-in person (with no business) have a waiting team invite? */
export async function fetchMyPendingInvite(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("my_pending_invite");
    if (error) return null;
    return (data as string | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Pushes users without a company to their pending invite if one exists,
 * otherwise to /welcome (business setup).
 */
export function NoCompanyGuard({ children }: { children: ReactNode }) {
  const { user, companyId, authReady, profileLoaded } = useAuth();
  const needsCheck = authReady && profileLoaded && !!user && !companyId;
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!needsCheck) return;
    let alive = true;
    fetchMyPendingInvite().then((token) => {
      if (alive) setTarget(token ? `/invite/${token}` : "/welcome");
    });
    return () => { alive = false; };
  }, [needsCheck]);

  if (!needsCheck) return <>{children}</>;
  if (!target) return null;
  return <Navigate to={target} replace />;
}
