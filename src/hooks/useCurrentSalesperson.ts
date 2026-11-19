import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/services/api";
import { resolveCurrentSalesperson } from "@/lib/salesperson-identity";

/** The sales team entry linked to the signed-in login, or null if not linked. */
export function useCurrentSalesperson() {
  const { user } = useAuth();
  const roster = useApi().salespersons.list();
  return useMemo(() => resolveCurrentSalesperson(user?.id, roster), [user?.id, roster]);
}
