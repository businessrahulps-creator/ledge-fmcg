import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import type { AppRole } from "@/components/settings/team/jobs";

export interface InvitePreview {
  email: string;
  role: AppRole;
  status: "pending" | "accepted" | "expired";
  expires_at: string;
  company_name: string;
  inviter_name: string;
}

/**
 * Wraps the four invite RPCs with `handleSupabaseError`.
 * All mutations route through here so toasts stay user-actionable.
 */
export function useInvite() {
  const sendInvite = useCallback(
    async (email: string, role: AppRole): Promise<string | null> => {
      const { data, error } = await supabase.rpc("send_team_invite", {
        p_email: email,
        p_role: role,
      });
      if (error) {
        handleSupabaseError(error, {
          source: "rpc:send_team_invite",
          title: "Couldn't send invite",
        });
        return null;
      }
      return data as string;
    },
    [],
  );

  const resendInvite = useCallback(async (inviteId: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc("resend_team_invite", {
      p_invite_id: inviteId,
    });
    if (error) {
      handleSupabaseError(error, {
        source: "rpc:resend_team_invite",
        title: "Couldn't resend invite",
      });
      return null;
    }
    return data as string;
  }, []);

  const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    const { error } = await supabase.from("team_invites").delete().eq("id", inviteId);
    if (error) {
      handleSupabaseError(error, {
        source: "crud:team_invites.delete",
        title: "Couldn't cancel invite",
      });
      return false;
    }
    return true;
  }, []);

  const previewInvite = useCallback(
    async (token: string): Promise<InvitePreview | null> => {
      const { data, error } = await supabase.rpc("get_invite_by_token", {
        p_token: token,
      });
      if (error || !data || data.length === 0) return null;
      const row = data[0] as any;
      return {
        email: row.email,
        role: row.role,
        status: row.status,
        expires_at: row.expires_at,
        company_name: row.company_name ?? "",
        inviter_name: row.inviter_name ?? "",
      };
    },
    [],
  );

  /** Returns { ok: true, error?: string } so callers can format friendly UI. */
  const acceptInvite = useCallback(
    async (token: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      const { error } = await supabase.rpc("accept_team_invite", { p_token: token });
      if (error) {
        return { ok: false, message: error.message || "Couldn't accept invite" };
      }
      return { ok: true };
    },
    [],
  );

  return { sendInvite, resendInvite, cancelInvite, previewInvite, acceptInvite };
}
