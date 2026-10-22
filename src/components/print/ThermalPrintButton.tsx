import { Printer, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice } from "@/context/data-types";
import type { Order } from "@/data/mock-data";
import { withInvoiceLines } from "@/lib/invoice-lines";
import { EmptyBillError, receiptFromInvoice, receiptFromOrder, type Seller } from "@/lib/thermal-receipt";
import { useThermalPrintPrefs } from "@/hooks/useThermalPrintPrefs";
import { openThermalPrint, receiptHtml } from "./printThermal";
import { useRef, useState } from "react";

interface Props {
  order: Order;
  invoice?: Invoice;
  seller: Seller;
  buyerGstin?: string;
  buyerAddress?: string;
  cancelled?: boolean;
  /** Only pass once payment figures have loaded. */
  paid?: { paid: number; balance: number } | null;
}

export function ThermalPrintButton({ order, invoice, seller, buyerGstin, buyerAddress, cancelled, paid }: Props) {
  const { prefs, update } = useThermalPrintPrefs();

  const busy = useRef(false);
  const [working, setWorking] = useState(false);

  if (cancelled && !invoice) return null;

  const print = async () => {
    if (busy.current) return;
    busy.current = true; setWorking(true);
    const write = openThermalPrint();
    try {
      const receipt = invoice
        ? receiptFromInvoice(await withInvoiceLines(invoice), order.orderNumber)
        : receiptFromOrder(order, seller, buyerGstin, { buyerAddress });
      write(receiptHtml(receipt, prefs, paid));
    } catch (e) {
      write("<p style='font:14px sans-serif;padding:16px'>Couldn't load the bill. Close this and try again.</p>");
      toast.error(e instanceof EmptyBillError ? e.message : "Couldn't open printing", { description: "Check your internet and try again." });
    } finally {
      setTimeout(() => { busy.current = false; setWorking(false); }, 1500);
    }
  };

  return (
    <div className="inline-flex">
      <Button variant="outline" size="sm" className="rounded-r-none touch-target" onClick={print} disabled={working}
        title={invoice ? "Print bill on receipt printer" : "Print order slip on receipt printer"}>
        <Printer className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Print receipt</span>
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-l-none border-l-0 px-2 touch-target" aria-label="Receipt printer settings">
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-3">
          <p className="text-sm font-medium">Receipt printer (this device)</p>
          <div className="space-y-1">
            <Label className="text-xs">Paper width</Label>
            <div className="flex gap-2">
              {([80, 58] as const).map(w => (
                <Button key={w} size="sm" variant={prefs.width === w ? "default" : "outline"} onClick={() => update({ width: w })}>{w} mm</Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Copies</Label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(c => (
                <Button key={c} size="sm" variant={prefs.copies === c ? "default" : "outline"} onClick={() => update({ copies: c })}>{c}</Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs" htmlFor="th-bank">Show bank details</Label>
            <Switch id="th-bank" checked={prefs.showBank} onCheckedChange={v => update({ showBank: v })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs" htmlFor="th-foot">Message at the bottom</Label>
            <Input id="th-foot" value={prefs.footer} maxLength={80} onChange={e => update({ footer: e.target.value })} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
