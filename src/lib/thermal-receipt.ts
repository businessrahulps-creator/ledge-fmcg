import type { Invoice } from "@/context/data-types";
import type { Order } from "@/data/mock-data";

export interface ReceiptRow { name: string; qty: number; rate: number; amount: number }
export interface Receipt {
  title: string;
  isBill: boolean;
  number: string;
  date: string;
  orderNumber?: string;
  sellerName: string; sellerAddress: string; sellerPhone: string; sellerGstin: string;
  buyerName: string; buyerGstin: string;
  rows: ReceiptRow[];
  totals: { label: string; value: number; bold?: boolean }[];
  total: number;
  amountInWords: string;
  bank?: string;
}

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/** Receipt from a saved GST bill — figures copied as saved, never recalculated. */
export function receiptFromInvoice(inv: Invoice, orderNumber?: string): Receipt {
  const totals: Receipt["totals"] = [{ label: "Taxable value", value: r2(inv.subtotal) }];
  if (inv.supplyType === "inter_state") {
    totals.push({ label: "IGST", value: r2(inv.igstAmount) });
  } else {
    totals.push({ label: "CGST", value: r2(inv.cgstAmount) });
    totals.push({ label: "SGST", value: r2(inv.sgstAmount) });
  }
  if (r2(inv.roundOff) !== 0) totals.push({ label: "Round off", value: r2(inv.roundOff) });
  totals.push({ label: "TOTAL", value: r2(inv.grandTotal), bold: true });
  return {
    title: inv.docType === "gst_invoice" ? "TAX INVOICE" : inv.docType.toUpperCase().replace("_", " "),
    isBill: inv.docType === "gst_invoice",
    number: inv.invoiceNumber,
    date: inv.invoiceDate,
    orderNumber,
    sellerName: inv.sellerName, sellerAddress: inv.sellerAddress, sellerPhone: inv.sellerPhone, sellerGstin: inv.sellerGstin,
    buyerName: inv.buyerName, buyerGstin: inv.buyerGstin,
    rows: (inv.lines || []).map(l => ({
      name: l.productName, qty: l.quantity, rate: r2(l.unitPrice),
      amount: r2(l.lineTotal ?? l.taxableValue),
    })),
    totals,
    total: r2(inv.grandTotal),
    amountInWords: inv.amountInWords,
    bank: inv.sellerBankAccount ? `${inv.sellerBankName} A/c ${inv.sellerBankAccount} IFSC ${inv.sellerBankIfsc}` : undefined,
  };
}

export interface Seller { name: string; address: string; phone: string; gstin: string; bank?: string }

/** Order slip before a GST bill exists. Clearly not a bill. */
export function receiptFromOrder(order: Order, seller: Seller, buyerGstin = ""): Receipt {
  const savings = r2(order.schemeSavings || 0);
  const gross = r2(order.total);
  const total = r2(gross - savings);
  const totals: Receipt["totals"] = [{ label: "Items total", value: gross }];
  if (savings > 0) totals.push({ label: "Offers saved", value: -savings });
  totals.push({ label: "TOTAL (before GST)", value: total, bold: true });
  return {
    title: "ORDER SLIP — NOT A BILL",
    isBill: false,
    number: order.orderNumber,
    date: order.date,
    sellerName: seller.name, sellerAddress: seller.address, sellerPhone: seller.phone, sellerGstin: seller.gstin,
    buyerName: order.distributorName, buyerGstin,
    rows: order.lines.map(l => ({ name: l.productName, qty: l.quantity, rate: r2(l.unitPrice), amount: r2(l.lineTotal) })),
    totals,
    total,
    amountInWords: "",
    bank: seller.bank,
  };
}
