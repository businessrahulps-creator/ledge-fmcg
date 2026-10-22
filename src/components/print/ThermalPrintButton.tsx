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
import { receiptFromInvoice, receiptFromOrder, type Seller } from "@/lib/thermal-receipt";
import { useThermalPrintPrefs } from "@/hooks/useThermalPrintPrefs";
import { printThermal, receiptHtml } from "./printThermal";

interface Props {
  order: Order;
  invoice?: Invoice;
  seller: Seller;
  buyerGstin?: string;
  /** Only pass once payment figures have loaded. */
  paid?: { paid: number; balance: number } | null;
}

export function ThermalPrintButton({ order, invoice, seller, buyerGstin, paid }: Props) {
  const { prefs, update } = useThermalPrintPrefs();

  const print = async () => {
    try {
      const receipt = invoice
        ? receiptFromInvoice(await withInvoiceLines(invoice), order.orderNumber)
        : receiptFromOrder(order, seller, buyerGstin);
      printThermal(receiptHtml(receipt, prefs, paid));
    } catch {
      toast.error("Couldn't open printing", { description: "Try again in a moment." });
    }
  };

  return (
    <div className="inline-flex">
      <Button variant="outline" size="sm" className="rounded-r-none touch-target" onClick={print}
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
