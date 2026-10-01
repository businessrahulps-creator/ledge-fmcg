import { describe, it, expect } from "vitest";
import { buildTallyXml, taxEntries, DEFAULT_LEDGERS, tallyWarnings, xmlEscape, type TaxDoc } from "../tally";

const bill: TaxDoc = {
  id: "1", number: "INV/25-26/0001", date: "2026-10-01", party: "Aryan & Sons",
  byRate: [{ rate: 18, taxable: 1000 }, { rate: 5, taxable: 200 }],
  cgst: 95, sgst: 95, igst: 0, roundOff: 0.0, total: 1390,
};

const sum = (es: { debit: number }[]) => Math.round(es.reduce((s, e) => s + e.debit, 0) * 100) / 100;

describe("tally export", () => {
  it("sale voucher balances and debits the party", () => {
    const e = taxEntries(bill, DEFAULT_LEDGERS, "sale");
    expect(sum(e)).toBe(0);
    expect(e[0]).toEqual({ ledger: "Aryan & Sons", debit: 1390 });
    expect(e.find(x => x.ledger === "Sales @18%")?.debit).toBe(-1000);
  });

  it("round-off balances a rupee-rounded total", () => {
    const e = taxEntries({ ...bill, total: 1390.4 + 0 }, DEFAULT_LEDGERS, "sale");
    expect(sum(e)).toBe(0);
    expect(e.find(x => x.ledger === "Round Off")?.debit).toBeCloseTo(-0.4, 2);
  });

  it("purchase voucher credits the supplier and debits input tax", () => {
    const e = taxEntries(bill, DEFAULT_LEDGERS, "purchase");
    expect(sum(e)).toBe(0);
    expect(e[0].debit).toBe(-1390);
    expect(e.find(x => x.ledger === "Input CGST")?.debit).toBe(95);
  });

  it("builds escaped XML with vouchers and masters", () => {
    const xml = buildTallyXml({
      companyName: "Demo <Co>", ledgers: DEFAULT_LEDGERS, sales: [bill],
      receipts: [{ id: "r", date: "2026-10-02", party: "Aryan & Sons", amount: 500, mode: "upi" }],
      parties: [{ name: "Aryan & Sons", kind: "dealer" }], items: [{ name: "Juice", unit: "Box" }],
    });
    expect(xml).toContain("<SVCURRENTCOMPANY>Demo &lt;Co&gt;</SVCURRENTCOMPANY>");
    expect(xml).toContain('VCHTYPE="Sales"');
    expect(xml).toContain("<DATE>20261001</DATE>");
    expect(xml).toContain("<LEDGERNAME>Bank Account</LEDGERNAME>");
    expect(xml).toContain("Aryan &amp; Sons");
    expect(xml).toContain("<GSTREGISTRATIONTYPE>Unregistered</GSTREGISTRATIONTYPE>");
  });

  it("warns in plain words", () => {
    const w = tallyWarnings({ companyName: "", ledgers: DEFAULT_LEDGERS, parties: [{ name: "A", kind: "dealer" }], items: [{ name: "X", unit: "Nos" }] });
    expect(w[0]).toMatch(/1 dealer has no GSTIN/);
    expect(xmlEscape("a'b")).toBe("a&apos;b");
  });
});
