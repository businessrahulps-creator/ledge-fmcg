import { describe, it, expect } from "vitest";
import { validCreditDays, dueDateFor, daysLateFor, dealerCreditDays } from "../credit-terms";
import { buildReceivables, sumDue } from "../receivables";
import { collectQueue } from "../intelligence";
import type { Invoice } from "@/context/data-types";
import type { Order, Distributor } from "@/data/mock-data";

const invoice = { id: "i", invoiceNumber: "B1", invoiceDate: "2026-10-01", grandTotal: 1000, docType: "gst_invoice", status: "posted", sourceOrderId: "o", buyerName: "Dealer" } as unknown as Invoice;
const order = { id: "o", distributorId: "d", distributorName: "Dealer" } as Order;
const dealer = { id: "d", name: "Dealer", creditDays: 15, creditMode: "unlimited" } as Distributor;
const input = { invoices: [invoice], orders: [order], distributors: [dealer], receivedByInvoice: new Map<string, number>(), creditedByInvoice: new Map<string, number>(), today: new Date("2026-11-01T06:00:00Z") };

describe("Internal credit days", () => {
  it.each([15, 30, 45, 60, 1, 365])("accepts %i whole days", days => expect(validCreditDays(days)).toBe(true));
  it.each([0, -1, 366, 15.5, NaN, Infinity])("rejects invalid duration %s", days => expect(validCreditDays(days)).toBe(false));
  it("allows blank terms", () => expect(validCreditDays(null)).toBe(true));
  it("adds credit time to bill date across a year", () => expect(dueDateFor("2026-12-20", 30)).toBe("2027-01-19"));
  it("handles leap days", () => expect(dueDateFor("2028-02-14", 15)).toBe("2028-02-29"));
  it("is not late on the due date", () => expect(daysLateFor("2026-10-16", 1000, "2026-10-16")).toBe(0));
  it("is late the next day", () => expect(daysLateFor("2026-10-16", 1000, "2026-10-17")).toBe(1));
  it("follows midnight in India", () => expect(daysLateFor("2026-10-16", 1000, new Date("2026-10-16T18:31:00Z"))).toBe(1));
  it("paid-off bills are never late", () => expect(daysLateFor("2026-10-16", 0, "2026-11-01")).toBe(0));
  it("blank days give no due date", () => expect(dueDateFor("2026-10-01", null)).toBeNull());
  it("no fixed days never marks a bill late", () => expect(buildReceivables({ ...input, distributors: [{ ...dealer, creditDays: null }] })[0].daysLate).toBe(0));
  it("cash-only dealers have no fixed days", () => expect(dealerCreditDays({ creditMode: "cash_only", creditDays: 30 })).toBeNull());
  it("invalid dates give no due date", () => expect(dueDateFor("2026-02-30", 15)).toBeNull());
  it("terms never change balances or age buckets", () => {
    const withTerms = buildReceivables(input);
    const withoutTerms = buildReceivables({ ...input, distributors: [] });
    expect(sumDue(withTerms)).toBe(1000);
    expect(sumDue(withTerms)).toBe(sumDue(withoutTerms));
    expect(withTerms[0].bucket).toBe(withoutTerms[0].bucket);
    expect(withTerms[0].dueDate).toBe("2026-10-16");
    expect(withTerms[0].daysLate).toBe(16);
  });
  it("payments plus credit notes clear a bill before lateness", () => {
    expect(buildReceivables({ ...input, receivedByInvoice: new Map([["i", 600]]), creditedByInvoice: new Map([["i", 400]]) })).toHaveLength(0);
  });
  it("dealer credit clears oldest bills before lateness", () => {
    const rows = buildReceivables({ ...input, invoices: [invoice, { ...invoice, id: "new", invoiceDate: "2026-10-25" }], dealerCreditByDealer: new Map([["d", 1000]]) });
    expect(rows.map(r => r.invoiceId)).toEqual(["new"]);
    expect(rows[0].daysLate).toBe(0);
    expect(rows[0].due).toBe(1000);
  });
  it("changing current dealer days updates old bill timing", () => {
    expect(buildReceivables({ ...input, distributors: [{ ...dealer, creditDays: 60 }] })[0].dueDate).toBe("2026-11-30");
  });
  it("Today's work uses each dealer's duration", () => {
    const rows = buildReceivables(input);
    const queue = (days: number | null) => collectQueue({ rows, distributors: [{ ...dealer, creditDays: days }], orders: [], receipts: [], today: "2026-11-01" });
    expect(queue(15)[0].meta?.over30).toBe(1000);
    expect(queue(60)[0].meta?.over30).toBe(0);
    expect(queue(null)[0].meta?.over30).toBe(1000);
  });
  it("collection preview clears oldest late money with an advance without changing balances", () => {
    const rows = buildReceivables({ ...input, invoices: [{ ...invoice, grandTotal: 100 }, { ...invoice, id: "new", invoiceNumber: "B2", invoiceDate: "2026-10-25", grandTotal: 900 }] });
    const cards = collectQueue({ rows, distributors: [dealer], orders: [], receipts: [], today: "2026-11-01", advances: new Map([["d", 100]]) });
    expect(cards[0].meta?.over30).toBe(0);
    expect(cards[0].meta?.due).toBe(900);
    expect(cards[0].meta?.oldest).toBe(7);
    expect(sumDue(rows)).toBe(1000);
  });
});