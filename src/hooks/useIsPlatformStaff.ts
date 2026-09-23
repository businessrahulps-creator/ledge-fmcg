import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Platform staff = Ledge's own team, a completely separate identity plane
 * from customer roles. A customer being "super_admin" of their workspace
 * gives them zero reach here.
 *
 * Returns `ready` so route gates never flash a denial before the answer
 * has arrived.
 */
export function useIsPlatformStaff(): { isStaff: boolean; ready: boolean } {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isFetched, isError } = useQuery({
    queryKey: ["platform-staff", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_platform_staff", {
        _user_id: userId!,
      });
      if (error) throw error;
      return !!data;
    },
  });

  return { isStaff: data === true, ready: !userId || isFetched || isError };
}
