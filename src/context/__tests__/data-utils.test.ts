import { describe, it, expect } from "vitest";
import {
  mapOrders, mapDistributor, mapSalesperson, mapProduct,
  mapGodown, mapStockItem, mapScheme, mapSecondarySale,
  mapTarget, mapClaim, mapInvoice,
} from "../data-utils";

describe("mapOrders", () => {
  it("maps a single order with lines and schemes", () => {
    const ordersData = [{
      id: "o1", order_number: "ORD-2026-0001", date: "2026-01-01",
      distributor_id: "d1", distributor_name: "Acme",
      salesperson_id: "s1", salesperson_name: "John",
      total: 5000, payment_mode: "cash", payment_status: "paid",
      dispatch_date: null, vehicle: "", driver_name: "",
      delivery_status: "pending", dispatch_remarks: "",
      godown_id: null, scheme_savings: 100,
    }];
    const lines = [
      { order_id: "o1", product_id: "p1", product_name: "Widget", quantity: 10, unit_price: 500, line_total: 5000 },
    ];
    const schemes = [
      { order_id: "o1", scheme_id: "sch1", scheme_name: "Diwali", scheme_label: "10% off", savings: 100 },
    ];

    const result = mapOrders(ordersData, lines, schemes);
    expect(result).toHaveLength(1);
    expect(result[0].orderNumber).toBe("ORD-2026-0001");
    expect(result[0].lines).toHaveLength(1);
    expect(result[0].lines[0].productId).toBe("p1");
    expect(result[0].appliedSchemes).toHaveLength(1);
    expect(result[0].schemeSavings).toBe(100);
  });

  it("returns empty array for empty input", () => {
    expect(mapOrders([], [], [])).toEqual([]);
  });

  it("handles orders with no matching lines", () => {
    const ordersData = [{
      id: "o2", order_number: "ORD-2", date: "2026-01-01",
      distributor_id: "d1", distributor_name: "X",
      salesperson_id: "s1", salesperson_name: "Y",
      total: 0, payment_mode: "upi", payment_status: "pending",
      dispatch_date: null, vehicle: "", driver_name: "",
      delivery_status: "pending", dispatch_remarks: "",
      godown_id: null, scheme_savings: 0,
    }];
    const result = mapOrders(ordersData, [], []);
    expect(result[0].lines).toEqual([]);
    expect(result[0].appliedSchemes).toEqual([]);
  });
});

describe("mapDistributor", () => {
  it("maps all fields with defaults", () => {
    const d = mapDistributor({ id: "d1", name: "Acme", location: "Delhi", contact: "9999" });
    expect(d.id).toBe("d1");
    expect(d.email).toBe("");
    expect(d.totalOrders).toBe(0);
    expect(d.creditLimit).toBe(0);
  });
});

describe("mapSalesperson", () => {
  it("maps fields", () => {
    const s = mapSalesperson({ id: "s1", name: "Ram", phone: "123", email: "r@x.com", region: "North", total_orders: 5, total_value: 10000 });
    expect(s.totalOrders).toBe(5);
    expect(s.totalValue).toBe(10000);
  });
});

describe("mapProduct", () => {
  it("maps fields with numeric conversion", () => {
    const p = mapProduct({ id: "p1", name: "Widget", sku: "W01", unit: "Pack", base_price: "250.5", total_sold: 42 });
    expect(p.basePrice).toBe(250.5);
    expect(p.totalSold).toBe(42);
  });
});

describe("mapGodown", () => {
  it("maps fields", () => {
    const g = mapGodown({ id: "g1", name: "Main", address: "123 St", is_active: true });
    expect(g.isActive).toBe(true);
  });
});

describe("mapStockItem", () => {
  it("resolves product and godown names", () => {
    const prods = [{ id: "p1", name: "Widget", sku: "W01", unit: "Pack", basePrice: 100, hsnCode: "", totalSold: 0 }];
    const gds = [{ id: "g1", name: "Main", address: "", isActive: true }];
    const si = mapStockItem({ id: "si1", product_id: "p1", godown_id: "g1", quantity: 50, threshold: 10, last_deducted_date: null }, prods, gds);
    expect(si.productName).toBe("Widget");
    expect(si.godownName).toBe("Main");
    expect(si.quantity).toBe(50);
  });

  it("handles missing product/godown gracefully", () => {
    const si = mapStockItem({ id: "si2", product_id: "pX", godown_id: "gX", quantity: 5, threshold: 0, last_deducted_date: null }, [], []);
    expect(si.productName).toBe("");
    expect(si.godownName).toBe("");
  });
});

describe("mapScheme", () => {
  it("maps scheme type and nullables", () => {
    const s = mapScheme({
      id: "sch1", name: "Diwali", description: "Festive", scheme_type: "percentage",
      discount_percent: 10, buy_qty: 0, free_qty: 0, flat_amount: 0,
      min_order_value: 1000, min_qty: 0, product_id: null, dealer_id: null,
      is_active: true, valid_from: "2026-01-01", valid_until: null,
    });
    expect(s.schemeType).toBe("percentage");
    expect(s.discountPercent).toBe(10);
    expect(s.validUntil).toBeNull();
  });
});

describe("mapSecondarySale", () => {
  it("maps fields", () => {
    const s = mapSecondarySale({ id: "ss1", distributor_id: "d1", product_id: "p1", product_name: "W", retailer_name: "R", quantity: 5, date: "2026-01-01", remarks: "" });
    expect(s.distributorId).toBe("d1");
  });
});

describe("mapTarget", () => {
  it("maps fields with numeric conversion", () => {
    const t = mapTarget({ id: "t1", entity_type: "salesperson", entity_id: "s1", entity_name: "Ram", period_type: "monthly", period_start: "2026-01-01", target_revenue: "50000", target_orders: 20 });
    expect(t.targetRevenue).toBe(50000);
    expect(t.entityType).toBe("salesperson");
  });
});

describe("mapClaim", () => {
  it("maps claim with lines filtered by claim_id", () => {
    const c = { id: "c1", order_id: "o1", order_number: "ORD-1", distributor_id: "d1", distributor_name: "Acme", claim_type: "return", status: "open", reason: "Damaged", resolution_notes: "", restore_stock: true, total_claim_value: 500, created_at: "2026-01-01", resolved_at: null };
    const lines = [
      { claim_id: "c1", product_id: "p1", product_name: "W", quantity: 2, unit_price: 250, line_total: 500 },
      { claim_id: "c2", product_id: "p2", product_name: "X", quantity: 1, unit_price: 100, line_total: 100 },
    ];
    const result = mapClaim(c, lines);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].productId).toBe("p1");
    expect(result.restoreStock).toBe(true);
  });
});

describe("mapInvoice", () => {
  it("maps invoice with lines filtered by invoice_id", () => {
    const inv = {
      id: "inv1", doc_type: "gst_invoice", invoice_number: "INV-2026-0001",
      invoice_date: "2026-01-01", source_order_id: null,
      buyer_name: "Buyer", buyer_address: "Addr", buyer_gstin: "GSTIN", buyer_state_code: "07",
      seller_name: "Seller", seller_address: "SAddr", seller_gstin: "SGSTIN", seller_pan: "PAN",
      seller_state_code: "07", seller_phone: "123", seller_email: "s@x.com",
      seller_bank_name: "SBI", seller_bank_account_name: "Acc", seller_bank_account: "1234", seller_bank_ifsc: "SBIN",
      seller_logo_url: "", supply_type: "intra_state", gst_rate: 18,
      subtotal: 1000, cgst_amount: 90, sgst_amount: 90, igst_amount: 0,
      total_tax: 180, grand_total: 1180, round_off: 0,
      amount_in_words: "One Thousand", notes: "", status: "draft", created_at: "2026-01-01",
    };
    const lines = [
      { invoice_id: "inv1", product_name: "W", hsn_code: "1234", quantity: 10, unit: "Pack", unit_price: 100, taxable_value: 1000 },
    ];
    const result = mapInvoice(inv, lines);
    expect(result.invoiceNumber).toBe("INV-2026-0001");
    expect(result.lines).toHaveLength(1);
    expect(result.grandTotal).toBe(1180);
  });
});
