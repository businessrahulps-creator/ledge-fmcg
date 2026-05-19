import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { toast } from "sonner";

export interface SignalAck {
  id: string;
  company_id: string;
  signal_key: string;
  snoozed_until: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  actor: string;
  created_at: string;
  updated_at: string;
}

export interface TeammateOption {
  user_id: string;
  full_name: string;
  email: string;
}

/**
 * Live signal acknowledgements for the workspace. Realtime-subscribed.
 * Returns active acks only (snoozed-and-not-expired OR unresolved-assigned OR resolved).
 */
export function useSignalAcks() {
  const { companyId, user } = useAuth();
  const [acks, setAcks] = useState<SignalAck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAcks = useCallback(async () => {
    if (!companyId) {
      setAcks([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("signal_acknowledgements")
      .select("*")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false });
    if (error) {
      handleSupabaseError(error, "signal-acks.fetch");
      return;
    }
    setAcks((data ?? []) as SignalAck[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchAcks();
    if (!companyId) return;
    const channel = supabase
      .channel(`signal-acks-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signal_acknowledgements", filter: `company_id=eq.${companyId}` },
        () => fetchAcks(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchAcks]);

  const snooze = useCallback(
    async (signalKey: string, days: number) => {
      if (!companyId || !user) return;
      const snoozedUntil = new Date(Date.now() + days * 86400_000).toISOString();
      // Upsert: clear resolved + assigned, set snooze.
      const existing = acks.find((a) => a.signal_key === signalKey);
      const payload = {
        company_id: companyId,
        signal_key: signalKey,
        snoozed_until: snoozedUntil,
        assigned_to: null,
        resolved_at: null,
        actor: user.id,
      };
      const { error } = existing
        ? await supabase.from("signal_acknowledgements").update(payload).eq("id", existing.id)
        : await supabase.from("signal_acknowledgements").insert(payload);
      if (error) {
        handleSupabaseError(error, "signal-acks.snooze");
        return;
      }
      toast.success(`Snoozed for ${days} day${days === 1 ? "" : "s"}`);
    },
    [companyId, user, acks],
  );

  const assign = useCallback(
    async (signalKey: string, assigneeId: string, assigneeName: string) => {
      if (!companyId || !user) return;
      const existing = acks.find((a) => a.signal_key === signalKey);
      const payload = {
        company_id: companyId,
        signal_key: signalKey,
        snoozed_until: null,
        assigned_to: assigneeId,
        resolved_at: null,
        actor: user.id,
      };
      const { error } = existing
        ? await supabase.from("signal_acknowledgements").update(payload).eq("id", existing.id)
        : await supabase.from("signal_acknowledgements").insert(payload);
      if (error) {
        handleSupabaseError(error, "signal-acks.assign");
        return;
      }
      toast.success(`Assigned to ${assigneeName}`);
    },
    [companyId, user, acks],
  );

  const resolve = useCallback(
    async (signalKey: string) => {
      if (!companyId || !user) return;
      const existing = acks.find((a) => a.signal_key === signalKey);
      const payload = {
        company_id: companyId,
        signal_key: signalKey,
        snoozed_until: null,
        assigned_to: null,
        resolved_at: new Date().toISOString(),
        actor: user.id,
      };
      const { error } = existing
        ? await supabase.from("signal_acknowledgements").update(payload).eq("id", existing.id)
        : await supabase.from("signal_acknowledgements").insert(payload);
      if (error) {
        handleSupabaseError(error, "signal-acks.resolve");
        return;
      }
      toast.success("Marked resolved");
    },
    [companyId, user, acks],
  );

  const clear = useCallback(
    async (signalKey: string) => {
      const existing = acks.find((a) => a.signal_key === signalKey);
      if (!existing) return;
      const { error } = await supabase
        .from("signal_acknowledgements")
        .delete()
        .eq("id", existing.id);
      if (error) {
        handleSupabaseError(error, "signal-acks.clear");
        return;
      }
      toast.success("Cleared");
    },
    [acks],
  );

  return { acks, loading, snooze, assign, resolve, clear };
}

/**
 * Active = snooze unexpired OR has assignee with no resolution OR resolved within last 30 days.
 * Returns map keyed by signal_key for cheap lookup.
 */
export function activeAcksMap(acks: SignalAck[]): Map<string, SignalAck> {
  const now = Date.now();
  const out = new Map<string, SignalAck>();
  for (const a of acks) {
    const snoozeActive = a.snoozed_until && new Date(a.snoozed_until).getTime() > now;
    const assigned = !!a.assigned_to && !a.resolved_at;
    const resolved = !!a.resolved_at;
    if (snoozeActive || assigned || resolved) out.set(a.signal_key, a);
  }
  return out;
}

/** Returns signals to hide entirely (snoozed + unexpired, or resolved). */
export function shouldHideSignal(ack: SignalAck | undefined): boolean {
  if (!ack) return false;
  if (ack.resolved_at) return true;
  if (ack.snoozed_until && new Date(ack.snoozed_until).getTime() > Date.now()) return true;
  return false;
}

/** Fetch teammates (other company profiles) for the assignment picker. */
export function useTeammates() {
  const { companyId, user } = useAuth();
  const [teammates, setTeammates] = useState<TeammateOption[]>([]);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("company_id", companyId);
      if (error) {
        handleSupabaseError(error, "teammates.fetch");
        return;
      }
      if (cancelled) return;
      setTeammates(
        (data ?? [])
          .filter((p) => p.user_id !== user?.id)
          .map((p) => ({ user_id: p.user_id, full_name: p.full_name || p.email, email: p.email })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, user?.id]);

  return teammates;
}
