import { useEffect, useState } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Invoice } from "@/context/DataContext";
import type { InvoicePdfData } from "@/components/pdf/GstInvoicePdf";
import { logError } from "@/utils/errorLog";

export function invoiceToPdfData(inv: Invoice): InvoicePdfData {
  return {
    docType: inv.docType,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    buyerName: inv.buyerName,
    buyerAddress: inv.buyerAddress,
    buyerGstin: inv.buyerGstin,
    buyerStateCode: inv.buyerStateCode,
    sellerName: inv.sellerName,
    sellerAddress: inv.sellerAddress,
    sellerGstin: inv.sellerGstin,
    sellerPan: inv.sellerPan,
    sellerStateCode: inv.sellerStateCode,
    sellerPhone: inv.sellerPhone,
    sellerEmail: inv.sellerEmail,
    sellerBankName: inv.sellerBankName,
    sellerBankAccountName: inv.sellerBankAccountName,
    sellerBankAccount: inv.sellerBankAccount,
    sellerBankIfsc: inv.sellerBankIfsc,
    supplyType: inv.supplyType,
    gstRate: inv.gstRate,
    lines: inv.lines,
    subtotal: inv.subtotal,
    cgstAmount: inv.cgstAmount,
    sgstAmount: inv.sgstAmount,
    igstAmount: inv.igstAmount,
    totalTax: inv.totalTax,
    grandTotal: inv.grandTotal,
    roundOff: inv.roundOff,
    amountInWords: inv.amountInWords,
    notes: inv.notes,
    vehicle: inv.vehicle || "",
    driverName: inv.driverName || "",
  };
}

export async function buildInvoiceBlob(inv: Invoice): Promise<Blob> {
  const [{ GstInvoicePdf }, { pdf }] = await Promise.all([
    import("@/components/pdf/GstInvoicePdf"),
    import("@react-pdf/renderer"),
  ]);
  return pdf(<GstInvoicePdf data={invoiceToPdfData(inv)} />).toBlob();
}

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

/** Shows the actual bill on screen before it is sent to anyone. */
export function InvoicePreviewDialog({ invoice, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    if (invoice) {
      buildInvoiceBlob(invoice)
        .then(blob => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        })
        .catch(err => {
          logError({ source: "billing:preview", error: err, severity: "warning" });
          if (!cancelled) setFailed(true);
        });
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [invoice]);

  const download = () => {
    if (!url || !invoice) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.pdf`;
    a.click();
  };

  return (
    <Dialog open={!!invoice} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] rounded-md p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="text-base">{invoice?.invoiceNumber}</DialogTitle>
        </DialogHeader>
        <div className="h-[70vh] bg-muted/30">
          {failed ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Could not open this bill. Try downloading it instead.
            </p>
          ) : url ? (
            <iframe title="Bill preview" src={url} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Opening the bill…
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={download} disabled={!url}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
