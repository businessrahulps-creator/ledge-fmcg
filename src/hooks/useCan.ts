import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type CapabilityKey = Database["public"]["Enums"]["capability_key"];

/**
 * Returns whether the current user has the given capability.
 * Reads from has_capability() RPC (override beats role default).
 * Returns false while loading or when unauthenticated.
 */
export function useCan(capability: CapabilityKey): boolean {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data } = useQuery({
    queryKey: ["capability", userId, capability],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_capability", {
        _user_id: userId!,
        _capability: capability,
      });
      if (error) throw error;
      return !!data;
    },
  });

  return data === true;
}
