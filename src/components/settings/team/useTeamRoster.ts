import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./jobs";
import type { PendingInvite } from "./PendingInviteCard";

export interface RosterMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  roleId: string;
  updatedAt: string | null;
  hasOverrides: boolean;
}

/** capability_key -> set of roles that have it by default */
export type DefaultsMap = Map<string, Set<AppRole>>;

export function rolesDefaultCaps(defaults: DefaultsMap, role: AppRole): Set<string> {
  const out = new Set<string>();
  defaults.forEach((roles, cap) => {
    if (roles.has(role)) out.add(cap);
  });
  return out;
}

export function useTeamRoster(companyId: string | null) {
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [defaults, setDefaults] = useState<DefaultsMap>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) {
      setMembers([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: profiles }, { data: invites }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, full_name, email, phone, updated_at")
          .eq("company_id", companyId),
        supabase
          .from("team_invites")
          .select("id, email, role, token, created_at, expires_at, status")
          .eq("company_id", companyId)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false }),
      ]);

      if (!profiles || profiles.length === 0) {
        setMembers([]);
      } else {
        const userIds = profiles.map((p) => p.user_id);
        const [{ data: roles }, { data: overrides }] = await Promise.all([
          supabase.from("user_roles").select("id, user_id, role").in("user_id", userIds),
          supabase.from("user_capability_overrides").select("user_id").in("user_id", userIds),
        ]);

        const roleMap = new Map<string, { roleId: string; role: AppRole }>(
          (roles || []).map((r) => [r.user_id, { roleId: r.id, role: r.role as AppRole }]),
        );
        const overrideSet = new Set<string>((overrides || []).map((o) => o.user_id));

        const list: RosterMember[] = profiles
          .filter((p) => roleMap.has(p.user_id))
          .map((p) => {
            const r = roleMap.get(p.user_id)!;
            return {
              id: p.id,
              userId: p.user_id,
              name: p.full_name || "",
              email: p.email || "",
              phone: p.phone || "",
              role: r.role,
              roleId: r.roleId,
              updatedAt: p.updated_at ?? null,
              hasOverrides: overrideSet.has(p.user_id),
            };
          });
        setMembers(list);
      }

      setPendingInvites(
        (invites || []).map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role as AppRole,
          token: i.token,
          created_at: i.created_at,
          expires_at: i.expires_at,
        })),
      );

      const { data: defaultRows } = await supabase
        .from("role_capabilities_default")
        .select("role, capability");
      const map: DefaultsMap = new Map();
      (defaultRows || []).forEach((row) => {
        const cap = row.capability as string;
        if (!map.has(cap)) map.set(cap, new Set());
        map.get(cap)!.add(row.role as AppRole);
      });
      setDefaults(map);
    } catch {
      // silent
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { members, pendingInvites, defaults, loading, refresh: load };
}
