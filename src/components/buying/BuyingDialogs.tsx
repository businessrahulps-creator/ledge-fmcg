import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumberInput } from "@/components/ui/number-input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { formatCurrency } from "@/data/mock-data";
import { todayKey } from "@/utils/dateKey";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATE_CODES } from "@/utils/validators";
import { useData } from "@/context/DataContext";
import { buyingRpc, useBuying, type Supplier } from "@/hooks/useBuying";

const GSTIN_RE = /^[0-9]{2}[A-Z0-9]{13}$/;

/** Add or edit a supplier. */
export function SupplierDialog({ open, onOpenChange, supplier, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; supplier?: Supplier | null; onSaved?: (id: string) => void;
}) {
  const { companyId } = useAuth();
  const { reload, bills, payments } = useBuying();
  const { companyInfo } = useData();
  const homeState = companyInfo?.stateCode || "";
  const [f, setF] = useState({ name: "", phone: "", gstin: "", state: "", address: "", opening: 0 as number | null });
  useEffect(() => {
    if (open) setF({ name: supplier?.name || "", phone: supplier?.phone || "", gstin: supplier?.gstin || "", state: supplier?.stateCode || homeState, address: supplier?.address || "", opening: supplier?.openingBalance ?? 0 });
  }, [open, supplier, homeState]);
  const locked = !!supplier && (bills.some(b => b.supplierId === supplier.id) || payments.some(p => p.supplierId === supplier.id));

  const save = async () => {
    const name = f.name.trim();
    const gstin = f.gstin.trim().toUpperCase();
    if (!name) { toast.error("Supplier name needed"); return; }
    if (gstin && !GSTIN_RE.test(gstin)) { toast.error("GSTIN doesn't look right", { description: "It should be 15 letters and numbers, starting with the 2-digit state code." }); return; }
    const row: any = { name, phone: f.phone.trim(), gstin, state_code: gstin ? gstin.slice(0, 2) : (f.state || ""), address: f.address.trim() };
    if (!locked) row.opening_balance = Math.max(0, f.opening || 0);
    const q = supplier
      ? supabase.from("suppliers").update(row).eq("id", supplier.id).select("id").single()
      : supabase.from("suppliers").insert({ ...row, company_id: companyId }).select("id").single();
    const { data, error } = await q;
    if (error) { handleSupabaseError(error, { source: "buying:supplier.save", title: "Couldn't save this supplier" }); return; }
    await reload();
    toast.success(supplier ? "Supplier updated" : "Supplier added");
    onOpenChange(false);
    onSaved?.(data!.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "Add supplier"}</DialogTitle>
          <DialogDescription>The business you buy raw materials or goods from.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={e => e.preventDefault()}>
          <div className="space-y-1.5"><Label>Supplier name *</Label><Input aria-label="Supplier name *" autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Sri Lakshmi Packaging" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Phone</Label><Input aria-label="Phone" inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>GSTIN</Label><Input aria-label="GSTIN" value={f.gstin} onChange={e => setF({ ...f, gstin: e.target.value.toUpperCase() })} className="font-mono" maxLength={15} /></div>
          </div>
          {!f.gstin.trim() && (
            <div className="space-y-1.5">
              <Label>Supplier's state</Label>
              <Select value={f.state || undefined} onValueChange={v => setF({ ...f, state: v })}>
                <SelectTrigger aria-label="Supplier's state"><SelectValue placeholder="Pick a state" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Object.entries(INDIAN_STATE_CODES).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Decides the GST split: same state as you = CGST + SGST, other state = IGST.</p>
            </div>
          )}
          <div className="space-y-1.5"><Label>Address</Label><Textarea aria-label="Address" rows={2} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Money you already owe them (₹)</Label>
            <NumberInput aria-label="Money you already owe them (₹)" value={f.opening} onValueChange={v => setF({ ...f, opening: v })} min={0} allowDecimal disabled={locked} />
            <p className="text-[11px] text-muted-foreground">{locked ? "Can't be changed after bills or payments are added." : "From before you started using Ledge. Leave 0 if nothing."}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" onClick={save}>{supplier ? "Save changes" : "Add supplier"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const MODES = [["cash", "Cash"], ["upi", "UPI"], ["bank_transfer", "Bank"], ["cheque", "Cheque"]] as const;

/** Pay a supplier (partial allowed, never more than owed). */
export function PaySupplierDialog({ open, onOpenChange, supplier }: { open: boolean; onOpenChange: (v: boolean) => void; supplier: Supplier | null }) {
  const { balances, reload } = useBuying();
  const owed = supplier ? balances.get(supplier.id) || 0 : 0;
  const [amount, setAmount] = useState<number | null>(null);
  const [mode, setMode] = useState<string>("cash");
  const [date, setDate] = useState(todayKey());
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [key, setKey] = useState("");
  useEffect(() => { if (open) { setAmount(owed > 0 ? owed : null); setMode("cash"); setDate(todayKey()); setReference(""); setNote(""); setKey(crypto.randomUUID()); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!supplier) return;
    if (!amount || amount <= 0) { toast.error("Enter the amount paid"); return; }
    if (amount > owed) { toast.error(`You owe ${supplier.name} only ${formatCurrency(owed)}`); return; }
    const res = await buyingRpc("record_supplier_payment_atomic", {
      p_supplier_id: supplier.id, p_amount: amount, p_mode: mode, p_paid_on: date,
      p_reference: mode === "cash" ? "" : reference, p_note: note, p_idempotency_key: key,
    }, "Couldn't save this payment");
    if (!res) return;
    await reload();
    toast.success(`Paid ${formatCurrency(amount)} to ${supplier.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay supplier</DialogTitle>
          <DialogDescription>{supplier?.name} · You owe {formatCurrency(owed)}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={e => e.preventDefault()}>
          <div className="space-y-1.5"><Label>Amount paid (₹) *</Label><NumberInput aria-label="Amount paid (₹) *" value={amount} onValueChange={setAmount} min={0} max={owed} allowDecimal allowEmpty /></div>
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <div role="radiogroup" className="grid grid-cols-4 gap-2">
              {MODES.map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)}
                  className={`min-h-[44px] rounded-md border text-sm ${mode === k ? "border-foreground bg-foreground text-background" : "border-border"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Date paid</Label><Input aria-label="Date paid" type="date" value={date} max={todayKey()} onChange={e => setDate(e.target.value)} /></div>
            {mode !== "cash" && <div className="space-y-1.5"><Label>{mode === "cheque" ? "Cheque number" : "Reference no."}</Label><Input aria-label={mode === "cheque" ? "Cheque number" : "Reference no."} value={reference} onChange={e => setReference(e.target.value)} /></div>}
          </div>
          <div className="space-y-1.5"><Label>Note</Label><Input aria-label="Note" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" onClick={save} disabled={owed <= 0}>Save payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Ask for a reason, then run an action (cancel bill / cancel payment). */
export function ReasonDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string; confirmLabel: string; onConfirm: (reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);
  const go = async () => {
    if (!reason.trim()) { toast.error("Give a reason"); return; }
    if (await onConfirm(reason.trim())) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label>Reason *</Label><Textarea aria-label="Reason *" rows={2} value={reason} onChange={e => setReason(e.target.value)} autoFocus /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Keep it</Button>
          <Button variant="destructive" onClick={go}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
