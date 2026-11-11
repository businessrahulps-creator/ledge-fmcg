import { useEffect, useState } from "react";
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
export function ProductUnitsEditor({ productId, mainUnit }: { productId: string; mainUnit: string }) {
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [name, setName] = useState("");
  const [factor, setFactor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const main = mainUnit.trim() || "main unit";

  const load = async () => {
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

  const archive = async (id: string) => {
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
