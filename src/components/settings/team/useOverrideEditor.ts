import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

import type { RosterMember, DefaultsMap } from "./useTeamRoster";
import { TOGGLEABLE_CAPS, type CapabilityKey } from "./accessCopy";

export type CapState = Partial<Record<CapabilityKey, boolean>>;

interface UseOverrideEditorOpts {
  member: RosterMember | null;
  defaults: DefaultsMap;
  onSaved?: () => void;
}

function defaultsForRole(defaults: DefaultsMap, role: RosterMember["role"]): CapState {
  const out: CapState = {};
  for (const { key } of TOGGLEABLE_CAPS) {
    const roles = defaults.get(key);
    out[key] = !!roles?.has(role);
  }
  return out;
}

function firstName(full: string): string {
  return (full || "").trim().split(/\s+/)[0] || "Their";
}

export function useOverrideEditor({ member, defaults, onSaved }: UseOverrideEditorOpts) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initial, setInitial] = useState<CapState>({});
  const [current, setCurrent] = useState<CapState>({});

  const roleDefaults = useMemo(
    () => (member ? defaultsForRole(defaults, member.role) : {}),
    [member, defaults],
  );

  useEffect(() => {
    let alive = true;
    if (!member) return;
    setLoading(true);
    supabase
      .from("user_capability_overrides")
      .select("capability, granted")
      .eq("user_id", member.userId)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          handleSupabaseError(error, {
            source: "team:overrides.load",
            title: "Couldn't load access settings",
          });
        }
        const overrides: CapState = {};
        (data || []).forEach((row) => {
          overrides[row.capability as CapabilityKey] = row.granted;
        });
        const effective: CapState = { ...roleDefaults };
        for (const k of Object.keys(overrides) as CapabilityKey[]) {
          effective[k] = overrides[k];
        }
        setInitial(effective);
        setCurrent(effective);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [member, roleDefaults]);

  const setCap = useCallback((key: CapabilityKey, value: boolean) => {
    setCurrent((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setCurrent(initial), [initial]);

  const dirty = useMemo(() => {
    for (const { key } of TOGGLEABLE_CAPS) {
      if (!!current[key] !== !!initial[key]) return true;
    }
    return false;
  }, [current, initial]);

  const save = useCallback(async () => {
    if (!member || saving) return;
    setSaving(true);
    try {
      const toUpsert: Array<{ user_id: string; capability: CapabilityKey; granted: boolean }> = [];
      const toDelete: CapabilityKey[] = [];

      for (const { key } of TOGGLEABLE_CAPS) {
        const desired = !!current[key];
        const def = !!roleDefaults[key];
        if (desired === def) {
          toDelete.push(key);
        } else {
          toUpsert.push({ user_id: member.userId, capability: key, granted: desired });
        }
      }

      const ops: Promise<{ error: unknown }>[] = [];
      if (toDelete.length > 0) {
        ops.push(
          supabase
            .from("user_capability_overrides")
            .delete()
            .eq("user_id", member.userId)
            .in("capability", toDelete) as unknown as Promise<{ error: unknown }>,
        );
      }
      if (toUpsert.length > 0) {
        ops.push(
          supabase
            .from("user_capability_overrides")
            .upsert(toUpsert, { onConflict: "user_id,capability" }) as unknown as Promise<{ error: unknown }>,
        );
      }

      const results = await Promise.all(ops);
      const failure = results.find((r) => r.error);
      if (failure?.error) {
        handleSupabaseError(failure.error, {
          source: "team:overrides.save",
          title: "Couldn't update access",
        });
        return false;
      }

      toast.success(`${firstName(member.name)}'s access updated.`);
      setInitial(current);
      onSaved?.();
      return true;
    } catch (err) {
      handleSupabaseError(err, {
        source: "team:overrides.save",
        title: "Couldn't update access",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [member, current, roleDefaults, saving, onSaved]);

  return { loading, saving, current, initial, roleDefaults, setCap, reset, dirty, save };
}
