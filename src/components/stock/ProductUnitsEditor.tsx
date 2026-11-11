import { useEffect, useState } from "react";
import type React from "react";
import { Plus, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatQty } from "@/lib/quantity";

interface UnitRow { id: string; unit_name: string; conversion_factor: number }

/**
 * Other units a product can be counted in for returns (e.g. 24 Bottle = 1 Case).
 * Saves straight away. Units already used in a return can only be archived —
 * the database refuses edits and deletes so saved returns never change.
 */
export interface DraftUnit { unit_name: string; conversion_factor: number }

/** Saves units typed on the Add Product form once the product exists. */
export async function saveDraftUnits(productId: string, drafts: DraftUnit[]): Promise<boolean> {
  if (!drafts.length) return true;
  const { data: companyId, error: cErr } = await supabase.rpc("get_company_id");
  if (cErr || !companyId) return false;
  const { error } = await supabase.from("product_units").insert(
    drafts.map(d => ({ company_id: companyId as string, product_id: productId, ...d })),
  );
  return !error;
}

export function ProductUnitsEditor({ productId, mainUnit, drafts, onDraftsChange, commitRef }: {
  productId?: string; mainUnit: string;
  /** Parent calls this on Save so a typed-but-not-added unit is never lost. Returns drafts incl. pending. */
  commitRef?: React.MutableRefObject<(() => Promise<DraftUnit[] | false>) | null>;
  /** Add Product mode: no product yet, units are held here and saved after. */
  drafts?: DraftUnit[]; onDraftsChange?: (d: DraftUnit[]) => void;
}) {
  const isDraft = !productId;
  const [saved, setUnits] = useState<UnitRow[]>([]);
  const units: UnitRow[] = isDraft ? (drafts || []).map((d, i) => ({ id: `draft-${i}`, ...d })) : saved;
  const [name, setName] = useState("");
  const [factor, setFactor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const main = mainUnit.trim() || "main unit";

  const load = async () => {
    if (!productId) return;
    const { data, error } = await supabase.from("product_units")
      .select("id, unit_name, conversion_factor")
      .eq("product_id", productId).eq("is_archived", false).order("created_at");
    if (error) { handleSupabaseError(error, { source: "product_units:list", title: "Could not load other units" }); return; }
    setUnits((data || []).map(u => ({ ...u, conversion_factor: Number(u.conversion_factor) })));
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [productId]);

  const trimmed = name.trim();
  const clash = units.some(u => u.unit_name.trim().toLowerCase() === trimmed.toLowerCase())
    || trimmed.toLowerCase() === main.toLowerCase();
  const canAdd = trimmed.length > 0 && trimmed.length <= 40 && !clash && !!factor && factor > 0 && !busy;

  const add = async () => {
    if (!canAdd) return;
    if (isDraft) {
      onDraftsChange?.([...(drafts || []), { unit_name: trimmed, conversion_factor: factor! }]);
      setName(""); setFactor(null); return;
    }
    setBusy(true);
    const { data: companyId, error: cErr } = await supabase.rpc("get_company_id");
    if (cErr || !companyId) { setBusy(false); handleSupabaseError(cErr, { source: "product_units:add", title: "Could not add this unit" }); return; }
    const { error } = await supabase.from("product_units").insert({
      company_id: companyId as string, product_id: productId, unit_name: trimmed, conversion_factor: factor!,
    });
    setBusy(false);
    if (error) { handleSupabaseError(error, { source: "product_units:add", title: "Could not add this unit" }); return; }
    setName(""); setFactor(null); load();
  };

  if (commitRef) commitRef.current = async () => {
    const list = drafts || [];
    if (!trimmed && !factor) return list;
    if (!canAdd) return false;
    if (isDraft) { const next = [...list, { unit_name: trimmed, conversion_factor: factor! }]; onDraftsChange?.(next); setName(""); setFactor(null); return next; }
    await add(); return list;
  };

  const archive = async (id: string) => {
    if (isDraft) { onDraftsChange?.((drafts || []).filter((_, i) => `draft-${i}` !== id)); return; }
    setBusy(true);
    const { error } = await supabase.from("product_units").update({ is_archived: true }).eq("id", id);
    setBusy(false);
    if (error) { handleSupabaseError(error, { source: "product_units:archive", title: "Could not remove this unit" }); return; }
    load();
  };

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div>
        <Label className="text-xs">Other units for returns (optional)</Label>
        <p className="text-[11px] text-muted-foreground">
          Lets dealers return in another unit. Returns are still saved in whole {main}.
        </p>
      </div>
      {units.map(u => (
        <div key={u.id} className="flex items-center justify-between gap-2 text-sm">
          <span className="num">{formatQty(u.conversion_factor)} {u.unit_name} = 1 {main}</span>
          <Button type="button" variant="ghost" size="sm" className="touch-target" disabled={busy}
            onClick={() => archive(u.id)} aria-label={`Remove ${u.unit_name}`}>
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <NumberInput allowDecimal min={0} value={factor} onValueChange={v => setFactor(v ?? null)}
          placeholder="24" className="h-9 w-20 text-sm" aria-label="How many" />
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Bottle" maxLength={40}
          className="h-9 flex-1 text-sm" aria-label="Unit name" />
        <span className="shrink-0 text-xs text-muted-foreground">= 1 {main}</span>
        <Button type="button" variant="outline" size="sm" className="touch-target" disabled={!canAdd} onClick={add} aria-label="Add unit">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {clash && trimmed && <p className="text-[11px] text-destructive">This product already has a unit with that name.</p>}
    </div>
  );
}

/** Small inline form to add a unit from the Return screen. */
export function QuickAddUnit({ productId, mainUnit, onAdded }: { productId: string; mainUnit: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [factor, setFactor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();
  const ok = trimmed.length > 0 && trimmed.toLowerCase() !== mainUnit.trim().toLowerCase() && !!factor && factor > 0 && !busy;
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className="touch-target text-xs font-medium text-primary underline-offset-2 hover:underline">
      + Add another unit
    </button>
  );
  const save = async () => {
    if (!ok) return;
    setBusy(true);
    const done = await saveDraftUnits(productId, [{ unit_name: trimmed, conversion_factor: factor! }]);
    setBusy(false);
    if (!done) { handleSupabaseError({ message: "Could not add this unit" } as any, { source: "product_units:quick_add", title: "Could not add this unit" }); return; }
    setOpen(false); setName(""); setFactor(null); onAdded();
  };
  return (
    <div className="flex items-center gap-2">
      <NumberInput allowDecimal min={0} value={factor} onValueChange={v => setFactor(v ?? null)} placeholder="24" className="h-9 w-16 text-sm" aria-label="How many" />
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Bottle" maxLength={40} className="h-9 flex-1 text-sm" aria-label="Unit name" />
      <span className="shrink-0 text-xs text-muted-foreground">= 1 {mainUnit}</span>
      <Button type="button" size="sm" className="touch-target" disabled={!ok} onClick={save}>Add</Button>
      <Button type="button" size="sm" variant="ghost" className="touch-target" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
