import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle, Info } from "lucide-react";
import { formatCurrency } from "@/data/mock-data";
import type { Distributor, Order } from "@/data/mock-data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Title of the blast (e.g. "Chase dormant dealers"). */
  title: string;
  description: string;
  /** Dealers to message. */
  dealers: Distributor[];
  /** Orders array — used to look up last order date per dealer. */
  orders: Order[];
  /** Default message template — use {dealer_name}, {outstanding}, {last_order_date} merge fields. */
  defaultTemplate: string;
}

function lastOrderDate(orders: Order[], dealerId: string): string | null {
  let latest: string | null = null;
  for (const o of orders) {
    if (o.distributorId !== dealerId) continue;
    if (!latest || o.date > latest) latest = o.date;
  }
  return latest;
}

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key) => vars[key] ?? `{${key}}`);
}

export function WhatsAppBlastSheet({ open, onClose, title, description, dealers, orders, defaultTemplate }: Props) {
  const [template, setTemplate] = useState(defaultTemplate);

  const rendered = useMemo(() => {
    return dealers.map((d) => {
      const last = lastOrderDate(orders, d.id);
      const vars = {
        dealer_name: d.name,
        outstanding: formatCurrency(d.outstandingAmount || 0),
        last_order_date: last
          ? new Date(last).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "no order on record",
      };
      const phone = (d.contact || "").replace(/\D/g, "");
      return {
        id: d.id,
        name: d.name,
        phone,
        message: render(template, vars),
        hasPhone: phone.length >= 10,
      };
    });
  }, [dealers, orders, template]);

  const reachable = rendered.filter((r) => r.hasPhone);

  const sendOne = (r: (typeof rendered)[number]) => {
    const url = `https://wa.me/${r.phone}?text=${encodeURIComponent(r.message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sendAll = async () => {
    if (reachable.length === 0) {
      toast.error("No dealers with valid phone numbers");
      return;
    }
    // Open the first three immediately, queue the rest staggered to avoid popup-blockers.
    reachable.forEach((r, i) => {
      setTimeout(() => sendOne(r), i * 400);
    });
    toast.success(`Opening WhatsApp for ${reachable.length} dealer${reachable.length === 1 ? "" : "s"}`, {
      description: "Tabs open one at a time. Allow pop-ups if blocked.",
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Message template
            </label>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={6}
              className="mt-1.5 font-mono text-sm"
            />
            <p className="mt-1.5 flex items-start gap-1 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Merge fields: <code className="rounded bg-muted px-1">{"{dealer_name}"}</code>,{" "}
              <code className="rounded bg-muted px-1">{"{outstanding}"}</code>,{" "}
              <code className="rounded bg-muted px-1">{"{last_order_date}"}</code>
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Preview · first {Math.min(3, rendered.length)} of {rendered.length}
            </p>
            <div className="mt-2 space-y-2">
              {rendered.slice(0, 3).map((r) => (
                <div key={r.id} className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    {!r.hasPhone && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-destructive">
                        No phone
                      </span>
                    )}
                  </div>
                  <pre className="mt-1.5 whitespace-pre-wrap text-xs text-foreground/80">{r.message}</pre>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{reachable.length}</span> of {rendered.length} dealer
            {rendered.length === 1 ? "" : "s"} have a valid phone number.{" "}
            {rendered.length - reachable.length > 0 && (
              <span>{rendered.length - reachable.length} will be skipped.</span>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={sendAll} disabled={reachable.length === 0}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send WhatsApp to {reachable.length} dealer{reachable.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
