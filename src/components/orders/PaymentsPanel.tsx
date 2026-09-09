import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IndianRupee, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { cn } from "@/lib/utils";

type PaymentRow = {
  id: string;
  amount: number;
  mode: string;
  paid_on: string;
  reference: string;
  note: string;
  status: string;
  void_reason: string;
};

const modes = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
];

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  invoiceTotal: number;
  /** Called after money moves so the page can refresh order/dealer figures. */
  onChanged?: () => void;
  canRecord?: boolean;
  /** Reports money received / balance up to the page so the hero band can show it. */
  onTotals?: (t: { received: number; balance: number }) => void;
}

/** Money actually received against one GST bill. Receipts are never edited or deleted — only cancelled. */
export function PaymentsPanel({ invoiceId, invoiceNumber, invoiceTotal, onChanged, canRecord = true }: Props) {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [mode, setMode] = useState("cash");
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [voidTarget, setVoidTarget] = useState<PaymentRow | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoice_payments")
      .select("id, amount, mode, paid_on, reference, note, status, void_reason")
      .eq("invoice_id", invoiceId)
      .order("paid_on", { ascending: false });
    setLoading(false);
    if (error) {
      handleSupabaseError(error, { source: "payments:list", title: "Couldn't load payments", context: { invoiceId } });
      return;
    }
    setRows((data || []) as PaymentRow[]);
  }, [invoiceId]);

  useEffect(() => { load(); }, [load]);

  const received = useMemo(
    () => rows.filter(r => r.status === "posted").reduce((s, r) => s + Number(r.amount || 0), 0),
    [rows],
  );
  const balance = Math.max(0, Math.round((invoiceTotal - received) * 100) / 100);

  const recordPayment = async () => {
    const value = Number(amount || 0);
    if (value <= 0) { toast.error("Enter the amount received"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("record_invoice_payment_atomic", {
      p_invoice_id: invoiceId,
      p_amount: value,
      p_mode: mode as "cash" | "bank_transfer" | "cheque" | "upi",
      p_paid_on: paidOn,
      p_reference: reference,
      p_note: note,
      p_idempotency_key: `${invoiceId}:${paidOn}:${value}:${reference || "-"}`,
    });
    setSaving(false);
    if (error) {
      handleSupabaseError(error, { source: "rpc:record_invoice_payment_atomic", title: "Couldn't record this payment", context: { invoiceId } });
      return;
    }
    toast.success(`${formatCurrency(value)} recorded against ${invoiceNumber}`);
    setOpen(false);
    setAmount(null); setReference(""); setNote("");
    await load();
    onChanged?.();
  };

  const cancelPayment = async () => {
    if (!voidTarget) return;
    if (!voidReason.trim()) { toast.error("Say why this payment is being cancelled"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("void_invoice_payment_atomic", {
      p_payment_id: voidTarget.id,
      p_reason: voidReason.trim(),
    });
    setSaving(false);
    if (error) {
      handleSupabaseError(error, { source: "rpc:void_invoice_payment_atomic", title: "Couldn't cancel this payment", context: { paymentId: voidTarget.id } });
      return;
    }
    toast.success("Payment cancelled — the record stays in the history");
    setVoidTarget(null); setVoidReason("");
    await load();
    onChanged?.();
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold md:text-base">Money received</h2>
          <p className="text-xs text-muted-foreground">Against bill {invoiceNumber}</p>
        </div>
        {canRecord && balance > 0 && (
          <Button size="sm" onClick={() => { setAmount(balance); setOpen(true); }}>
            <IndianRupee className="h-3.5 w-3.5" />
            Record payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: "Billed", value: invoiceTotal },
          { label: "Received", value: received },
          { label: "Still due", value: balance },
        ].map(cell => (
          <div key={cell.label} className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{cell.label}</p>
            <p className={cn(
              "num text-base font-semibold tabular-nums",
              cell.label === "Still due" && cell.value > 0 && "text-destructive",
              cell.label === "Still due" && cell.value === 0 && "text-success",
            )}>
              {formatCurrency(cell.value)}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">Loading payments…</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground/70">No payment recorded yet.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map(r => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-xs">
              <span className={cn("num font-semibold tabular-nums", r.status === "voided" && "line-through text-muted-foreground")}>
                {formatCurrency(Number(r.amount))}
              </span>
              <span className="capitalize text-muted-foreground">{r.mode.replace("_", " ")}</span>
              <span className="text-muted-foreground">{formatIndianDate(r.paid_on)}</span>
              {r.reference && <span className="font-mono text-muted-foreground">{r.reference}</span>}
              {r.status === "voided" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  Cancelled{r.void_reason ? ` — ${r.void_reason}` : ""}
                </span>
              )}
              {canRecord && r.status === "posted" && (
                <Button
                  variant="ghost" size="sm" className="ml-auto h-7 px-2 text-[11px]"
                  onClick={() => { setVoidTarget(r); setVoidReason(""); }}
                >
                  <Ban className="h-3 w-3" />
                  Cancel
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Record payment */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Record payment</DialogTitle>
            <DialogDescription>
              {formatCurrency(balance)} is still due on bill {invoiceNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount received (₹) *</Label>
              <NumberInput allowDecimal min={0} value={amount} onValueChange={setAmount} className="h-10 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Paid by</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {modes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date received</Label>
                <Input type="date" value={paidOn} max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setPaidOn(e.target.value)} className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reference (cheque or UPI number)</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" className="h-10 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" className="h-10 rounded-lg" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={recordPayment} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel payment */}
      <Dialog open={!!voidTarget} onOpenChange={o => !o && setVoidTarget(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Cancel this payment</DialogTitle>
            <DialogDescription>
              The receipt stays in the history, marked cancelled. The dealer's balance goes back up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Why is it being cancelled? *</Label>
            <Input value={voidReason} onChange={e => setVoidReason(e.target.value)} placeholder="e.g. Cheque bounced" className="h-10 rounded-lg" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setVoidTarget(null)}>Keep it</Button>
            <Button variant="destructive" onClick={cancelPayment} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Cancel payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
