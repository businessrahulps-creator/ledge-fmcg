import React from "react";
import { toast } from "sonner";
import type { Order } from "@/data/mock-data";

interface CompanyInfo {
  name: string;
  address: string;
  gstin: string;
  logoUrl: string;
}

function buildOrderSummary(order: Order, companyName: string): string {
  const lines = order.lines
    .map((l) => `  • ${l.productName} × ${l.quantity} = Rs. ${l.lineTotal.toLocaleString("en-IN")}`)
    .join("\n");

  return [
    `📄 *Invoice ${order.orderNumber}*`,
    companyName ? `From: ${companyName}` : "",
    "",
    `👤 Dealer: ${order.distributorName}`,
    `📅 Date: ${new Date(order.date).toLocaleDateString("en-IN")}`,
    `🧾 Sales: ${order.salesperson}`,
    "",
    `*Items:*`,
    lines,
    "",
    `💰 *Total: Rs. ${order.total.toLocaleString("en-IN")}*`,
    `💳 Payment: ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} (${order.paymentMode.replace("_", " ")})`,
    `🚚 Delivery: ${order.deliveryStatus.charAt(0).toUpperCase() + order.deliveryStatus.slice(1)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function shareOrderOnWhatsApp(
  order: Order,
  companyInfo: CompanyInfo
) {
  const loadingToast = toast.loading("Generating invoice…");

  try {
    // Dynamically import to keep bundle small
    const [{ pdf }, { OrderInvoicePdf }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/OrderInvoicePdf"),
    ]);

    const doc = React.createElement(OrderInvoicePdf, {
      order,
      companyName: companyInfo.name,
      companyAddress: companyInfo.address,
      gstin: companyInfo.gstin,
      logoUrl: companyInfo.logoUrl,
    });

    const blob = await (pdf(doc as any).toBlob());
    const file = new File(
      [blob],
      `Invoice_${order.orderNumber}.pdf`,
      { type: "application/pdf" }
    );

    toast.dismiss(loadingToast);

    // Try Web Share API with file attachment (works on mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: `Invoice ${order.orderNumber}` });
      toast.success("Invoice shared");
      return;
    }

    // Fallback: open wa.me with text summary
    const msg = buildOrderSummary(order, companyInfo.name);
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp opened", {
      description: "Invoice text copied to WhatsApp. PDF download starting…",
    });

    // Also trigger a PDF download so the user can manually attach
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `Invoice_${order.orderNumber}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  } catch (err: any) {
    toast.dismiss(loadingToast);
    // User cancelled share sheet — not an error
    if (err?.name === "AbortError") return;
    console.error("WhatsApp share failed", err);
    toast.error("Share failed", { description: "Please try again." });
  }
}

export interface InvoiceShareData {
  invoiceNumber: string;
  docType: string;
  invoiceDate: string;
  buyerName: string;
  buyerGstin: string;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  supplyType: string;
  gstRate: number;
  lines: { productName: string; quantity: number; unit: string; unitPrice: number; taxableValue: number; hsnCode: string }[];
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerPan: string;
  sellerStateCode: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerBankName: string;
  sellerBankAccountName: string;
  sellerBankAccount: string;
  sellerBankIfsc: string;
  buyerAddress: string;
  buyerStateCode: string;
  roundOff: number;
  amountInWords: string;
  notes: string;
}

function buildInvoiceSummary(inv: InvoiceShareData): string {
  const docLabel: Record<string, string> = {
    gst_invoice: "Tax Invoice",
    estimate: "Estimate",
    proforma: "Proforma Invoice",
    credit_note: "Credit Note",
  };
  const lines = inv.lines
    .map((l) => `  • ${l.productName} × ${l.quantity} = ₹${l.taxableValue.toLocaleString("en-IN")}`)
    .join("\n");

  const isIntra = inv.supplyType === "intra_state";
  const taxLines = inv.totalTax > 0
    ? isIntra
      ? `  CGST: ₹${inv.cgstAmount.toLocaleString("en-IN")}\n  SGST: ₹${inv.sgstAmount.toLocaleString("en-IN")}`
      : `  IGST: ₹${inv.igstAmount.toLocaleString("en-IN")}`
    : "";

  return [
    `📄 *${docLabel[inv.docType] || "Invoice"} ${inv.invoiceNumber}*`,
    inv.sellerName ? `From: ${inv.sellerName}` : "",
    "",
    `👤 Buyer: ${inv.buyerName}`,
    `📅 Date: ${inv.invoiceDate}`,
    "",
    `*Items:*`,
    lines,
    "",
    `💰 Subtotal: ₹${inv.subtotal.toLocaleString("en-IN")}`,
    taxLines,
    `💰 *Grand Total: ₹${inv.grandTotal.toLocaleString("en-IN")}*`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function shareInvoiceOnWhatsApp(inv: InvoiceShareData) {
  const loadingToast = toast.loading("Generating invoice…");

  try {
    const [{ pdf }, { GstInvoicePdf }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/GstInvoicePdf"),
    ]);

    const doc = React.createElement(GstInvoicePdf, {
      data: {
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
        vehicle: inv.vehicle || "",
        driverName: inv.driverName || "",
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
      },
    });

    const blob = await (pdf(doc as any).toBlob());
    const file = new File([blob], `${inv.invoiceNumber}.pdf`, { type: "application/pdf" });

    toast.dismiss(loadingToast);

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: `Invoice ${inv.invoiceNumber}` });
      toast.success("Invoice shared");
      return;
    }

    const msg = buildInvoiceSummary(inv);
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp opened", {
      description: "Invoice text copied to WhatsApp. PDF download starting…",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${inv.invoiceNumber}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  } catch (err: any) {
    toast.dismiss(loadingToast);
    if (err?.name === "AbortError") return;
    console.error("WhatsApp share failed", err);
    toast.error("Share failed", { description: "Please try again." });
  }
}

export function shareDealerOnWhatsApp(dealer: {
  name: string;
  location: string;
  contact: string;
  totalOrders: number;
  totalValue: number;
}) {
  const msg = [
    `👤 *Dealer: ${dealer.name}*`,
    `📍 Location: ${dealer.location}`,
    `📞 Contact: ${dealer.contact}`,
    `📦 Orders: ${dealer.totalOrders}`,
    `💰 Total Value: Rs. ${dealer.totalValue.toLocaleString("en-IN")}`,
  ].join("\n");

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  toast.success("WhatsApp opened");
}
