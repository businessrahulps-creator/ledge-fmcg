import type { Invoice } from "@/context/data-types";

type ReturnBill = Pick<Invoice, "docType" | "supplyType" | "sourceOrderId"> & {
  // Accept persisted status strings so unknown/cancelled documents fail closed.
  status: string;
};

/** Both GST invoices and Bills of Supply use gst_invoice as their document type. */
export function isReturnableBill(bill: ReturnBill): boolean {
  return bill.docType === "gst_invoice"
    && ["final", "posted", "partial", "paid"].includes(bill.status)
    && Boolean(bill.sourceOrderId)
    && (bill.supplyType === "intra_state"
      || bill.supplyType === "inter_state"
      || bill.supplyType === "bill_of_supply");
}