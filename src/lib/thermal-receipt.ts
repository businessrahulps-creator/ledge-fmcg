import type { Invoice } from "@/context/data-types";
import type { Order } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";

export interface ReceiptRow { name: string; qty: number; rate: number; amount: number; hsn?: string; gstRate?: number | null }
export interface Receipt {
  title: string;
  isBill: boolean;
  number: string;
  date: string;
  orderNumber?: string;
  sellerName: string; sellerAddress: string; sellerPhone: string; sellerGstin: string;
  buyerName: string; buyerGstin: string; buyerAddress?: string; buyerStateCode?: string;
  placeOfSupply?: string;
  rows: ReceiptRow[];
  totals: { label: string; value: number; bold?: boolean }[];
  total: number;
  amountInWords: string;
  bank?: string;
  signatory?: boolean;
}

const GST_STATES: Record<string, string> = {
  "01":"Jammu & Kashmir","02":"Himachal Pradesh","03":"Punjab","04":"Chandigarh","05":"Uttarakhand","06":"Haryana","07":"Delhi","08":"Rajasthan","09":"Uttar Pradesh","10":"Bihar","11":"Sikkim","12":"Arunachal Pradesh","13":"Nagaland","14":"Manipur","15":"Mizoram","16":"Tripura","17":"Meghalaya","18":"Assam","19":"West Bengal","20":"Jharkhand","21":"Odisha","22":"Chhattisgarh","23":"Madhya Pradesh","24":"Gujarat","26":"Dadra & Nagar Haveli and Daman & Diu","27":"Maharashtra","29":"Karnataka","30":"Goa","31":"Lakshadweep","32":"Kerala","33":"Tamil Nadu","34":"Puducherry","35":"Andaman & Nicobar","36":"Telangana","37":"Andhra Pradesh","38":"Ladakh",
};
export const placeOfSupply = (code?: string) => {
  if (!code) return undefined;
  const c = code.trim().padStart(2, "0");
  return GST_STATES[c] ? `${GST_STATES[c]} (${c})` : `State code ${code}`;
};

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export class EmptyBillError extends Error {
  constructor() { super("Couldn't load the bill items, try again"); }
}

/** Receipt from a saved GST bill — figures copied as saved, never recalculated. */
export function receiptFromInvoice(inv: Invoice, orderNumber?: string): Receipt {
  if (!inv.lines || inv.lines.length === 0) throw new EmptyBillError();
  const totals: Receipt["totals"] = [{ label: "Taxable value", value: r2(inv.subtotal) }];
  if (inv.supplyType === "inter_state") {
    totals.push({ label: "IGST", value: r2(inv.igstAmount) });
  } else {
    totals.push({ label: "CGST", value: r2(inv.cgstAmount) });
    totals.push({ label: "SGST", value: r2(inv.sgstAmount) });
  }
  if (r2(inv.roundOff) !== 0) totals.push({ label: "Round off", value: r2(inv.roundOff) });
  totals.push({ label: "TOTAL", value: r2(inv.grandTotal), bold: true });
  const draft = inv.status === "draft";
  const isBill = inv.docType === "gst_invoice" && !draft;
  const pos = inv.buyerStateCode || inv.sellerStateCode;
  return {
    title: draft ? "DRAFT — NOT A BILL" : isBill ? "TAX INVOICE" : inv.docType.toUpperCase().replace(/_/g, " "),
    isBill,
    number: inv.invoiceNumber,
    date: formatIndianDate(inv.invoiceDate),
    orderNumber,
    sellerName: inv.sellerName, sellerAddress: inv.sellerAddress, sellerPhone: inv.sellerPhone, sellerGstin: inv.sellerGstin,
    buyerName: inv.buyerName, buyerGstin: inv.buyerGstin, buyerAddress: inv.buyerAddress, buyerStateCode: inv.buyerStateCode,
    placeOfSupply: placeOfSupply(pos),
    rows: inv.lines.map(l => ({
      name: l.productName, qty: l.quantity, rate: r2(l.unitPrice),
      amount: r2(l.taxableValue), hsn: l.hsnCode || undefined, gstRate: l.gstRate ?? inv.gstRate,
    })),
    totals,
    total: r2(inv.grandTotal),
    amountInWords: inv.amountInWords,
    bank: inv.sellerBankAccount ? `${inv.sellerBankName} A/c ${inv.sellerBankAccount} IFSC ${inv.sellerBankIfsc}` : undefined,
    signatory: isBill,
  };
}

export interface Seller { name: string; address: string; phone: string; gstin: string; bank?: string }

/** Order slip before a GST bill exists. Clearly not a bill. */
export function receiptFromOrder(order: Order, seller: Seller, buyerGstin = "", opts: { cancelled?: boolean; buyerAddress?: string } = {}): Receipt {
  const savings = r2(order.schemeSavings || 0);
  const gross = r2(order.total);
  const total = r2(gross - savings);
  const totals: Receipt["totals"] = [{ label: "Items total", value: gross }];
  if (savings > 0) totals.push({ label: "Offers saved", value: -savings });
  totals.push({ label: "TOTAL (before GST)", value: total, bold: true });
  return {
    title: opts.cancelled ? "CANCELLED ORDER — NOT A BILL" : "ORDER SLIP — NOT A BILL",
    isBill: false,
    number: order.orderNumber,
    date: formatIndianDate(order.date),
    sellerName: seller.name, sellerAddress: seller.address, sellerPhone: seller.phone, sellerGstin: seller.gstin,
    buyerName: order.distributorName, buyerGstin, buyerAddress: opts.buyerAddress,
    rows: order.lines.map(l => ({ name: l.productName, qty: l.quantity, rate: r2(l.unitPrice), amount: r2(l.lineTotal) })),
    totals,
    total,
    amountInWords: "",
    bank: seller.bank,
  };
}
