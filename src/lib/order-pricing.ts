import { roundPaise } from "@/lib/money";
/**
 * Centralized Order Pricing Engine
 * ─────────────────────────────────
 * Single source of truth for all scheme calculations, gross/net totals,
 * and applied-scheme metadata across order creation, editing, PDFs, and billing.
 */

import type { Scheme } from "@/data/mock-data";
import { formatCurrency } from "@/data/mock-data";
import { todayKey } from "@/utils/dateKey";

export interface PricingLineInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface AppliedScheme {
  scheme: Scheme;
  savings: number;
  label: string;
}

export interface OrderPricing {
  /** Sum of all line totals (before scheme discounts) */
  grossTotal: number;
  /** Total scheme savings */
  totalSchemeSavings: number;
  /** Net total after scheme savings (never < 0) */
  netTotal: number;
  /** Detailed breakdown of each applied scheme */
  appliedSchemes: AppliedScheme[];
}

/**
 * Computes all commercial totals for an order given its lines, active schemes,
 * the selected dealer, and an optional reference date.
 *
 * This function is deterministic: same inputs → same outputs.
 * Both NewOrder and OrderDetail must call this instead of duplicating logic.
 */
export function computeOrderPricing(
  lines: PricingLineInput[],
  allSchemes: Scheme[],
  dealerId: string,
  referenceDate?: string,
): OrderPricing {
  // Mirrors public.book_order_atomic exactly — the server is authoritative,
  // this is the preview. Keep the two in step.
  const today = referenceDate || todayKey();
  const validLines = lines.filter(l => l.productId && l.quantity > 0);
  const r2 = roundPaise;
  const lineAmount = (l: PricingLineInput) => r2(l.quantity * l.unitPrice);
  const grossTotal = r2(validLines.reduce((sum, l) => sum + lineAmount(l), 0));
  const totalQty = validLines.reduce((sum, l) => sum + l.quantity, 0);
  // Order-wide "buy X get Y": free items are valued at the cheapest product (matches book_order_atomic).
  const topPrice = validLines.length ? validLines.reduce((m, l) => Math.min(m, l.unitPrice), Infinity) : 0;

  const activeSchemes = allSchemes.filter(
    s => s.isActive && s.validFrom <= today && (!s.validUntil || s.validUntil >= today),
  );

  const stacked: AppliedScheme[] = [];
  let best: AppliedScheme | null = null;

  for (const s of activeSchemes) {
    if (s.dealerId && s.dealerId !== dealerId) continue;
    if (s.minOrderValue > 0 && grossTotal < s.minOrderValue) continue;

    // Every line of the product counts (the same product can appear twice).
    const productLines = s.productId ? validLines.filter(l => l.productId === s.productId) : [];
    if (s.productId) {
      if (productLines.length === 0) continue;
      const q = productLines.reduce((sum, l) => sum + l.quantity, 0);
      if (s.minQty > 0 && q < s.minQty) continue;
    } else if (s.minQty > 0 && totalQty < s.minQty) {
      continue;
    }

    let savings = 0;
    let label = "";
    switch (s.schemeType) {
      case "percentage": {
        const base = s.productId ? productLines.reduce((sum, l) => sum + lineAmount(l), 0) : grossTotal;
        savings = (base * s.discountPercent) / 100;
        label = `${s.discountPercent}% off`;
        break;
      }
      case "buy_x_get_y": {
        if (s.buyQty > 0) {
          if (s.productId) {
            const q = productLines.reduce((sum, l) => sum + l.quantity, 0);
            const price = productLines.reduce((m, l) => Math.max(m, l.unitPrice), 0);
            savings = Math.floor(q / s.buyQty) * s.freeQty * price;
          } else {
            savings = Math.floor(totalQty / s.buyQty) * s.freeQty * topPrice;
          }
        }
        label = `Buy ${s.buyQty} Get ${s.freeQty} Free`;
        break;
      }
      case "flat_discount": {
        savings = s.flatAmount;
        label = `${formatCurrency(s.flatAmount)} off`;
        break;
      }
    }
    savings = r2(Math.max(savings, 0));
    if (savings <= 0) continue;

    const applied = { scheme: s, savings, label };
    if (s.isCombinable !== false) stacked.push(applied);
    else if (!best || savings > best.savings) best = applied;
  }

  const appliedSchemes = best ? [...stacked, best] : stacked;
  const lineDiscounts = allocateLineDiscounts(validLines, appliedSchemes);
  const totalSchemeSavings = r2(lineDiscounts.reduce((a, b) => a + b, 0));

  return {
    grossTotal,
    totalSchemeSavings,
    netTotal: Math.max(0, r2(grossTotal - totalSchemeSavings)),
    appliedSchemes,
  };
}

/**
 * Per-line discounts, same rule as the server: a product offer is spread only
 * over that product's lines, an order-wide offer over every line; the leftover
 * paisa goes to the largest line in the group; each line is capped at its own
 * amount. Returned in the same order as `lines` (after dropping empty lines).
 */
export function allocateLineDiscounts(lines: PricingLineInput[], applied: AppliedScheme[]): number[] {
  const valid = lines.filter(l => l.productId && l.quantity > 0);
  const r2 = roundPaise;
  const amounts = valid.map(l => r2(l.quantity * l.unitPrice));
  const disc = valid.map(() => 0);
  for (const a of applied) {
    const idx = valid.map((l, i) => i).filter(i => !a.scheme.productId || valid[i].productId === a.scheme.productId);
    const tot = idx.reduce((s, i) => s + amounts[i], 0);
    if (idx.length === 0) continue;
    const shares = idx.map(i => (tot > 0 ? r2((a.savings * amounts[i]) / tot) : 0));
    const largest = idx.reduce((bi, i, k) => (amounts[i] > amounts[idx[bi]] ? k : bi), 0);
    shares[largest] = r2(shares[largest] + a.savings - shares.reduce((s, x) => s + x, 0));
    idx.forEach((i, k) => { disc[i] = r2(disc[i] + shares[k]); });
  }
  return disc.map((d, i) => Math.min(Math.max(d, 0), amounts[i]));
}

/**
 * Serializes applied schemes for persistence in order_schemes table.
 */
export function serializeAppliedSchemes(applied: AppliedScheme[]) {
  return applied.map(a => ({
    schemeId: a.scheme.id,
    schemeName: a.scheme.name,
    schemeLabel: a.label,
    savings: a.savings,
  }));
}
