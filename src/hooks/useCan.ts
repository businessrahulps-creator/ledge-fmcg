import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

export type CapabilityKey = Database["public"]["Enums"]["capability_key"];

/**
 * Returns whether the current user has the given capability.
 * All capabilities load in ONE request (my_capabilities → has_capability per
 * key on the server, override beats role default) and are shared by every
 * caller. Returns false while loading or when unauthenticated.
 */
export function useCan(capability: CapabilityKey): boolean {
  return useCanState(capability).allowed;
}

/**
 * Same check, plus whether the answer has actually arrived. Route gates use
 * `ready` so nobody sees "no access" before their role is known.
 */
export function useCanState(capability: CapabilityKey): { allowed: boolean; ready: boolean } {
  const { user, companyId } = useAuth();
  const userId = user?.id ?? null;

  const { data, isFetched, isError } = useQuery({
    queryKey: ["capabilities", userId, companyId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_capabilities");
      if (error) throw error;
      return new Set<string>((data as string[] | null) ?? []);
    },
  });

  return { allowed: !!data?.has(capability), ready: !userId || isFetched || isError };
}
