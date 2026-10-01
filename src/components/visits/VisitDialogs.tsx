import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumberInput } from "@/components/ui/number-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addDaysToKey, todayKey } from "@/utils/dateKey";
import { OUTCOME_LABEL, useShopVisits, type VisitOutcome } from "@/hooks/useShopVisits";

const OUTCOMES: VisitOutcome[] = ["gave_order", "paid", "promised_payment", "promised_order", "enough_stock", "owner_away", "shop_closed", "other"];

/** Two taps: pick what happened, then Save. Promises ask for a date (and amount for money). */
export function AddVisitDialog({ open, onOpenChange, dealerId, dealerName }: {
  open: boolean; onOpenChange: (v: boolean) => void; dealerId: string | null; dealerName: string;
}) {
  const { addVisit } = useShopVisits();
  const [outcome, setOutcome] = useState<VisitOutcome | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(addDaysToKey(todayKey(), 3));
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setOutcome(null); setNote(""); setDate(addDaysToKey(todayKey(), 3)); setAmount(0); setSaving(false); }
  }, [open]);

  const isPromise = outcome === "promised_payment" || outcome === "promised_order";
  const save = async () => {
    if (!dealerId || !outcome || saving) return;
    if (isPromise && (!date || date < todayKey())) { toast.error("Pick today or a later date for the promise."); return; }
    if (outcome === "promised_payment" && !(amount > 0)) { toast.error("Enter how much they promised to pay."); return; }
    if (outcome === "other" && !note.trim()) { toast.error("Write a short note."); return; }
    setSaving(true);
    const ok = await addVisit({ distributorId: dealerId, outcome, note, promiseDate: date, promiseAmount: amount });
    setSaving(false);
    if (ok) { toast.success("Visit saved"); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add visit</DialogTitle>
          <DialogDescription>What happened at {dealerName || "this shop"}?</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="What happened">
          {OUTCOMES.map(o => (
            <button
              key={o} type="button" role="radio" aria-checked={outcome === o}
              onClick={() => setOutcome(o)}
              className={cn(
                "min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                outcome === o ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted",
              )}
            >{OUTCOME_LABEL[o]}</button>
          ))}
        </div>
        {isPromise && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="visit-promise-date">{outcome === "promised_payment" ? "Will pay on" : "Will order on"}</Label>
              <Input id="visit-promise-date" type="date" min={todayKey()} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {outcome === "promised_payment" && (
              <div className="space-y-1.5">
                <Label htmlFor="visit-promise-amount">Amount (₹)</Label>
                <NumberInput id="visit-promise-amount" value={amount} onValueChange={v => setAmount(v ?? 0)} min={0} />
              </div>
            )}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="visit-note">Note {outcome === "other" ? "" : "(optional)"}</Label>
          <Textarea id="visit-note" rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. Wants the new price list" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!outcome} loading={saving}>Save visit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddShopDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addProspect } = useShopVisits();
  const blank = { name: "", ownerName: "", phone: "", area: "", shopType: "", note: "" };
  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(blank); setSaving(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (saving) return;
    if (!f.name.trim()) { toast.error("Enter the shop name."); return; }
    if (f.phone && !/^[0-9+\-\s]{6,15}$/.test(f.phone.trim())) { toast.error("Check the phone number."); return; }
    setSaving(true);
    const ok = await addProspect(f);
    setSaving(false);
    if (ok) { toast.success("Shop added"); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new shop</DialogTitle>
          <DialogDescription>A shop that doesn't buy from you yet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label htmlFor="ns-name">Shop name</Label><Input id="ns-name" value={f.name} onChange={set("name")} maxLength={120} autoFocus /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="ns-owner">Owner name</Label><Input id="ns-owner" value={f.ownerName} onChange={set("ownerName")} /></div>
            <div className="space-y-1.5"><Label htmlFor="ns-phone">Phone</Label><Input id="ns-phone" inputMode="tel" value={f.phone} onChange={set("phone")} /></div>
            <div className="space-y-1.5"><Label htmlFor="ns-area">Area / town</Label><Input id="ns-area" value={f.area} onChange={set("area")} /></div>
            <div className="space-y-1.5"><Label htmlFor="ns-type">Type of shop</Label><Input id="ns-type" value={f.shopType} onChange={set("shopType")} placeholder="e.g. Hardware, Chemist" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ns-note">Note (optional)</Label><Textarea id="ns-note" rows={2} maxLength={500} value={f.note} onChange={set("note")} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save shop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
