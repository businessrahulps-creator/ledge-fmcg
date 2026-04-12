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
      const text = buildOrderSummary(order, companyInfo.name);
      await navigator.share({ files: [file], text });
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
