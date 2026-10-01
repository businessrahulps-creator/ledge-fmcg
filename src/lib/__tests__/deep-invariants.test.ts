import { describe, it, expect } from "vitest";
import { bucketize } from "@/lib/aging";
import { addDaysToKey, istDateKey } from "@/utils/dateKey";
import { buildTallyXml, DEFAULT_LEDGERS, type TaxDoc } from "@/lib/reports/tally";
import { periodRange } from "@/lib/reports/periods";

// Small deterministic random generator so failures are reproducible.
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

describe("age-of-bill boundaries", () => {
  it("days 30/31, 60/61, 90/91 land in the right box", () => {
    expect(bucketize(0)).toBe("b0");
    expect(bucketize(30)).toBe("b0");
    expect(bucketize(31)).toBe("b31");
    expect(bucketize(60)).toBe("b31");
    expect(bucketize(61)).toBe("b61");
    expect(bucketize(90)).toBe("b61");
    expect(bucketize(91)).toBe("b90");
  });
});

describe("India time cut-offs", () => {
  it("23:59:59 IST and 00:00:01 IST are different days", () => {
    expect(istDateKey(new Date("2026-03-31T18:29:59Z"))).toBe("2026-03-31");
    expect(istDateKey(new Date("2026-03-31T18:30:01Z"))).toBe("2026-04-01");
  });
  it("day keys cross month, year and leap day cleanly", () => {
    expect(addDaysToKey("2026-03-31", 1)).toBe("2026-04-01");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysToKey("2026-04-01", -1)).toBe("2026-03-31");
  });
  it("'This year' starts on 1 April, including on 31 March and 1 April", () => {
    expect(periodRange("fy", "2027-03-31").from).toBe("2026-04-01");
    expect(periodRange("fy", "2027-04-01").from).toBe("2027-04-01");
  });
});

describe("Tally: every voucher adds up to exactly zero (fuzzed)", () => {
  const RATES = [0, 0.25, 3, 5, 12, 18, 28];
  const r = rng(42);
  const docs: TaxDoc[] = [];
  for (let i = 0; i < 400; i++) {
    const inter = r() < 0.3;
    const byRate = RATES.filter(() => r() < 0.4).map(rate => ({ rate, taxable: Math.round(r() * 1e7) / 1000 }));
    if (!byRate.length) byRate.push({ rate: 18, taxable: 0.01 });
    const tax = byRate.reduce((s, b) => s + (b.taxable * b.rate) / 100, 0);
    const half = Math.round((tax / 2) * 1000) / 1000;
    const sub = byRate.reduce((s, b) => s + b.taxable, 0);
    const raw = sub + (inter ? tax : half * 2);
    const total = Math.round(raw);
    docs.push({
      id: String(i), number: `B${i}`, date: "2026-04-01", party: i % 3 ? "ശ്രീ ട്രേഡേഴ്സ് & Co <A>" : "Dealer",
      byRate, cgst: inter ? 0 : half, sgst: inter ? 0 : half, igst: inter ? Math.round(tax * 1000) / 1000 : 0,
      roundOff: total - raw, total,
    });
  }
  const xml = buildTallyXml({ companyName: "Test", ledgers: DEFAULT_LEDGERS, sales: docs, creditNotes: docs, purchases: docs });
  const vouchers = xml.split("<VOUCHER ").slice(1);

  it("produces one voucher per document", () => expect(vouchers.length).toBe(1200));
  it("printed amounts balance to the paisa", () => {
    for (const v of vouchers) {
      const paise = [...v.matchAll(/<AMOUNT>(-?[\d.]+)<\/AMOUNT>/g)].reduce((s, m) => s + Math.round(Number(m[1]) * 100), 0);
      expect(paise).toBe(0);
    }
  });
  it("keeps regional-language names and escapes XML characters", () => {
    expect(xml).toContain("ശ്രീ ട്രേഡേഴ്സ് &amp; Co &lt;A&gt;");
    expect(xml).not.toMatch(/NaN|Infinity/);
  });
});
