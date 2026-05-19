import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { toast } from "sonner";
import type { CommandPeriod } from "@/lib/command-signals";

export interface SavedViewParams {
  period: CommandPeriod;
  from?: string;
  to?: string;
  tab?: string;
}

export interface SavedView {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  params: SavedViewParams;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_VIEWS: { name: string; params: SavedViewParams }[] = [
  { name: "All business · 30d", params: { period: "30d", tab: "overview" } },
  { name: "This week", params: { period: "7d", tab: "overview" } },
  { name: "At-risk dealers", params: { period: "30d", tab: "people" } },
];

export function useSavedViews() {
  const { companyId, user } = useAuth();
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViews = useCallback(async () => {
    if (!companyId || !user) {
      setViews([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("command_saved_views")
      .select("*")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) {
      handleSupabaseError(error, { source: "saved-views.fetch", title: "Failed to load saved views" });
      return;
    }
    setViews((data ?? []) as unknown as SavedView[]);
    setLoading(false);
  }, [companyId, user]);

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  const save = useCallback(
    async (name: string, params: SavedViewParams) => {
      if (!companyId || !user) return null;
      const trimmed = name.trim();
      if (!trimmed) {
        toast.error("Please give the view a name");
        return null;
      }
      const { data, error } = await supabase
        .from("command_saved_views")
        .insert({ company_id: companyId, user_id: user.id, name: trimmed, params: params as never })
        .select()
        .single();
      if (error) {
        handleSupabaseError(error, { source: "saved-views.save", title: "Failed to save view" });
        return null;
      }
      toast.success(`Saved “${trimmed}”`);
      await fetchViews();
      return data as unknown as SavedView;
    },
    [companyId, user, fetchViews],
  );

  const togglePin = useCallback(
    async (view: SavedView) => {
      const { error } = await supabase
        .from("command_saved_views")
        .update({ is_pinned: !view.is_pinned })
        .eq("id", view.id);
      if (error) {
        handleSupabaseError(error, { source: "saved-views.pin", title: "Failed to pin view" });
        return;
      }
      toast.success(view.is_pinned ? "Unpinned" : "Pinned to top");
      await fetchViews();
    },
    [fetchViews],
  );

  const remove = useCallback(
    async (view: SavedView) => {
      const { error } = await supabase.from("command_saved_views").delete().eq("id", view.id);
      if (error) {
        handleSupabaseError(error, { source: "saved-views.delete", title: "Failed to delete view" });
        return;
      }
      toast.success(`Deleted “${view.name}”`);
      await fetchViews();
    },
    [fetchViews],
  );

  return { views, loading, save, togglePin, remove, defaults: DEFAULT_VIEWS };
}

export function paramsToSearchString(params: SavedViewParams): string {
  const sp = new URLSearchParams();
  sp.set("period", params.period);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.tab) sp.set("tab", params.tab);
  return sp.toString();
}
