import { roundPaise } from "@/lib/money";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useCollections } from "@/hooks/useCollections";
import { todayKey } from "@/utils/dateKey";
import { toast } from "sonner";
import { IndianRupee, Ban } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { PaymentRecord } from "@/context/data-types";

type PaymentRow = PaymentRecord;

const EXTRA_CHOICES = [
  { value: "apply_other_bills", title: "Use it for their other unpaid bills", detail: "Oldest bills first. Anything left stays as dealer credit." },
  { value: "dealer_credit", title: "Keep it as dealer credit", detail: "It lowers what they owe on future bills." },
  { value: "refund", title: "Give the extra back", detail: "It shows as money to give back until you mark it given." },
] as const;

const STATUS_LABEL: Record<string, string> = {
  refund_due: "To give back",
  refunded: "Given back",
};

const modes = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
];

interface Props {
  /** Anchor: the bill once it exists, otherwise the order it was booked on. */
  invoiceId?: string | null;
  orderId?: string | null;
  /** Bill or order number, shown to the user. */
  docLabel: string;
  /** Total this money is being collected against. */
  docTotal: number;
  /** Called after money moves so the page can refresh order/dealer figures. */
  onChanged?: () => void;
  canRecord?: boolean;
  /** The order was cancelled — no new payments can be added. */
  cancelled?: boolean;
  /** Reports money received / balance up to the page so the hero band can show it. */
  onTotals?: (t: { received: number; balance: number }) => void;
  /** Hide the surrounding card chrome when embedded in a sheet. */
  bare?: boolean;
}

/** Money actually received against one order or bill. Receipts are never edited or deleted — only cancelled. */
export function PaymentsPanel({
  invoiceId, orderId, docLabel, docTotal, onChanged, canRecord = true, cancelled = false, onTotals, bare = false,
}: Props) {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [mode, setMode] = useState("cash");
  const [paidOn, setPaidOn] = useState(() => todayKey());
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [voidTarget, setVoidTarget] = useState<PaymentRow | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [submitKey, setSubmitKey] = useState(() => crypto.randomUUID());
  // True after an unconfirmed save: reopening the box must reuse the same save ID.
  const keepKey = useRef(false);
  const lastPayload = useRef("");
  const [extraAction, setExtraAction] = useState<"apply_other_bills" | "dealer_credit" | "refund" | null>(null);

  const api = useApi();
  const anchorId = invoiceId || orderId || "";
  const anchorRef = useRef(anchorId);
  anchorRef.current = anchorId;
  // Hold the stable function itself — `api` is a fresh object every render.
  const listPayments = api.payments.list;

  const { companyId } = useAuth();
  const { creditedByInvoice, reload: reloadCollections } = useCollections(companyId);
  // Credit notes lower what a bill can still collect — same rule as the server.
  const credited = invoiceId ? (creditedByInvoice.get(invoiceId) || 0) : 0;

  // Only the newest request for the current bill/order may fill the list.
  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    if (!anchorId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const data = await listPayments({ invoiceId, orderId });
    if (seq !== loadSeq.current) return;
    setLoading(false);
    setRows(data);
  }, [anchorId, invoiceId, orderId, listPayments]);

  useEffect(() => {
    // A different bill or order: drop anything typed for the previous one.
    setRows([]); setOpen(false); setVoidTarget(null); setAmount(null); setExtraAction(null);
    load();
  }, [load]);

  const received = useMemo(
    () => rows.filter(r => r.status === "posted").reduce((s, r) => s + Number(r.amount || 0), 0),
    [rows],
  );
  const balance = Math.max(0, roundPaise(docTotal - credited - received));

  useEffect(() => { onTotals?.({ received, balance }); }, [received, balance, onTotals]);
  const extraAmount = Math.max(0, roundPaise(Number(amount || 0) - balance));

  const giveBack = async (row: PaymentRow) => {
    setSaving(true);
    const ok = await api.payments.markGivenBack(row.id);
    setSaving(false);
    if (!ok) return;
    toast.success(`${formatCurrency(Number(row.amount))} marked as given back`);
    await load();
    void reloadCollections();
    onChanged?.();
  };

  const recordPayment = async () => {
    const value = Number(amount || 0);
    if (value <= 0) { toast.error("Enter the amount received"); return; }
    // More than the balance: the owner decides where the extra goes — the app never guesses.
    const extra = roundPaise(value - balance);
    if (extra > 0 && !extraAction) {
      toast.error("Choose what to do with the extra money");
      return;
    }
    // A retry may reuse the save ID only for the exact same payment; any change is a new payment.
    const payload = JSON.stringify([value, mode, paidOn, mode === "cash" ? "" : reference, note, extra > 0 ? extraAction : null]);
    let key = submitKey;
    if (keepKey.current && lastPayload.current !== payload) {
      key = crypto.randomUUID(); setSubmitKey(key);
    }
    lastPayload.current = payload;
    const anchorAtSave = anchorId;
    setSaving(true);
    const ok = await api.payments.record({
      invoiceId,
      orderId,
      amount: value,
      mode: mode as "cash" | "bank_transfer" | "cheque" | "upi",
      paidOn,
      reference: mode === "cash" ? "" : reference,
      note,
      // One key per open dialog: a double click can't double-post, but two
      // genuine same-day payments of the same amount are still allowed.
      idempotencyKey: `${anchorId}:${key}`,
      extraAction: extra > 0 ? extraAction : null,
    });
    setSaving(false);
    if (!ok) {
      // The save may have gone through even though the reply was lost. Keep the
      // same save ID for the next try (the server then returns the same payment)
      // and reload so a payment that did save shows up straight away.
      keepKey.current = true;
      if (anchorRef.current === anchorAtSave) await load();
      return;
    }
    // The person moved to another bill while this saved: don't reload this panel with old data.
    if (anchorRef.current !== anchorAtSave) { keepKey.current = false; return; }
    keepKey.current = false;
    toast.success(`${formatCurrency(value)} recorded against ${docLabel}`);
    setOpen(false);
    setAmount(null); setReference(""); setNote(""); setSubmitKey(crypto.randomUUID()); setExtraAction(null);
    await load();
    void reloadCollections();
    onChanged?.();
  };

  const cancelPayment = async () => {
    if (!voidTarget) return;
    if (!voidReason.trim()) { toast.error("Say why this payment is being cancelled"); return; }
    setSaving(true);
    const ok = await api.payments.void(voidTarget.id, voidReason.trim());
    setSaving(false);
    if (!ok) return;
    toast.success("Payment cancelled — the record stays in the history");
    setVoidTarget(null); setVoidReason("");
    await load();
    void reloadCollections();
    onChanged?.();
  };

  return (
    <div className={bare ? "" : "glass-card overflow-hidden"}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold md:text-base">Money received</h2>
          <p className="text-xs text-muted-foreground">
            {invoiceId ? `Against bill ${docLabel}` : `Against order ${docLabel} — carries over to the bill`}
          </p>
        </div>
        {cancelled ? (
          <p className="text-xs text-muted-foreground">This order was cancelled, so payments can't be added.</p>
        ) : canRecord && balance > 0 && (
          <Button size="sm" onClick={() => { setAmount(balance); if (!keepKey.current) setSubmitKey(crypto.randomUUID()); setExtraAction(null); setOpen(true); }}>
            <IndianRupee className="h-3.5 w-3.5" />
            Record payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: invoiceId ? "Billed" : "Order total", value: docTotal },
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
              <span className={cn("num font-semibold tabular-nums", (r.status === "voided" || r.status === "refunded") && "line-through text-muted-foreground")}>
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
              {r.extra_kind === "other_bill" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Extra from another payment</span>
              )}
              {STATUS_LABEL[r.status] && (
                <span className={cn("rounded-full px-2 py-0.5 text-[10px]", r.status === "refund_due" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>
                  {STATUS_LABEL[r.status]}
                </span>
              )}
              {canRecord && r.status === "refund_due" && (
                <Button variant="outline" size="sm" className="ml-auto h-7 px-2 text-[11px]" disabled={saving} onClick={() => giveBack(r)}>
                  Mark given back
                </Button>
              )}
              {canRecord && r.status === "posted" && r.extra_kind !== "other_bill" && (
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
              {formatCurrency(balance)} is still due on {invoiceId ? "bill" : "order"} {docLabel}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount received (₹) *</Label>
              <NumberInput
                allowDecimal min={0} value={amount}
                onValueChange={v => { setAmount(v); if ((v ?? 0) <= balance) setExtraAction(null); }}
                className="h-10 rounded-lg"
              />
              {extraAmount > 0 && (
                <div className="space-y-2 pt-1" role="radiogroup" aria-label="What to do with the extra money">
                  <p className="text-xs font-medium">
                    That is {formatCurrency(extraAmount)} more than what is due. What should happen to the extra?
                  </p>
                  {EXTRA_CHOICES.map(opt => (
                    <button
                      key={opt.value} type="button" role="radio" aria-checked={extraAction === opt.value}
                      onClick={() => setExtraAction(opt.value)}
                      className={cn(
                        "touch-target w-full rounded-md border px-3 py-2 text-left text-xs transition-colors",
                        extraAction === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                      )}
                    >
                      <span className="block text-sm font-medium">{opt.title}</span>
                      <span className="block text-muted-foreground">{opt.detail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Payment method</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {modes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date received</Label>
                <Input type="date" value={paidOn} max={todayKey()}
                  onChange={e => setPaidOn(e.target.value)} className="h-10 rounded-lg" />
              </div>
            </div>
            {mode !== "cash" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Reference (cheque or UPI number)</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" className="h-10 rounded-lg" />
            </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" className="h-10 rounded-lg" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={recordPayment} loading={saving}>
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
            <Button variant="destructive" onClick={cancelPayment} loading={saving}>
              Cancel payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
