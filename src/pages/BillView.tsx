import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2, ArrowLeft } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildInvoiceBlob } from "@/components/billing/InvoicePreviewDialog";
import { shareInvoiceOnWhatsApp } from "@/utils/shareWhatsApp";
import { mapInvoiceRow } from "@/context/domains/useBillingDomain";
import type { Invoice } from "@/context/data-types";
import { logError } from "@/utils/errorLogger";
import { formatCurrency } from "@/utils/formatters";

/**
 * A bill on its own page, opened in a new tab as a normal link.
 * The file is built here, in this document, so there is no hand-off
 * between windows for the browser to block.
 */
export default function BillView() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      if (!invoiceId) return;
      try {
        const { data, error: dbError } = await supabase
          .from("invoices")
          .select("*, invoice_lines(*)")
          .eq("id", invoiceId)
          .maybeSingle();
        if (dbError) throw dbError;
        if (!data) {
          if (!cancelled) setError("This bill could not be found.");
          return;
        }
        const inv = mapInvoiceRow(data);
        if (cancelled) return;
        setInvoice(inv);
        document.title = `${inv.invoiceNumber} — Bill`;
        const blob = await buildInvoiceBlob(inv);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (err) {
        logError({ source: "billing:bill-page", error: err, severity: "warning" });
        if (!cancelled) setError("This bill could not be prepared. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [invoiceId]);

  const fileName = useMemo(
    () => (invoice ? `${invoice.invoiceNumber.replace(/[^\w-]+/g, "-")}.pdf` : "bill.pdf"),
    [invoice],
  );

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  };

  const print = () => {
    const frame = document.getElementById("bill-frame") as HTMLIFrameElement | null;
    try {
      frame?.contentWindow?.focus();
      frame?.contentWindow?.print();
    } catch {
      download();
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-muted/30">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{invoice?.invoiceNumber || "Bill"}</h1>
          {invoice && (
            <p className="truncate text-xs text-muted-foreground">
              {invoice.buyerName} · {formatCurrency(invoice.grandTotal)}
            </p>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => window.close()}>
            <ArrowLeft className="h-3.5 w-3.5" /> Close
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={print} disabled={!url}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-success"
            onClick={() => invoice && shareInvoiceOnWhatsApp(invoice)}
            disabled={!invoice}
          >
            <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
          </Button>
          <Button size="sm" className="gap-1.5" onClick={download} disabled={!url}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : url ? (
          <iframe id="bill-frame" title="Bill" src={url} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing the bill…
          </div>
        )}
        {url && (
          <p className="sr-only">
            If the bill does not appear, use the Download button above.
          </p>
        )}
      </main>
    </div>
  );
}
