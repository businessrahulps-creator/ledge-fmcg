/**
 * Centralized Order Pricing Engine
 * ─────────────────────────────────
 * Single source of truth for all scheme calculations, gross/net totals,
 * and applied-scheme metadata across order creation, editing, PDFs, and billing.
 */

import type { Scheme } from "@/data/mock-data";
import { formatCurrency } from "@/data/mock-data";

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
  const today = referenceDate || new Date().toISOString().split("T")[0];
  const validLines = lines.filter(l => l.productId && l.quantity > 0);
  const grossTotal = validLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  const activeSchemes = allSchemes.filter(
    s => s.isActive && s.validFrom <= today && (!s.validUntil || s.validUntil >= today),
  );

  const appliedSchemes: AppliedScheme[] = [];

  for (const s of activeSchemes) {
    // Dealer filter
    if (s.dealerId && s.dealerId !== dealerId) continue;

    // Min order value filter
    if (s.minOrderValue > 0 && grossTotal < s.minOrderValue) continue;

    // Product / quantity filter
    if (s.productId) {
      const matchingLine = validLines.find(l => l.productId === s.productId);
      if (!matchingLine) continue;
      if (s.minQty > 0 && matchingLine.quantity < s.minQty) continue;
    } else if (s.minQty > 0) {
      const totalQty = validLines.reduce((sum, l) => sum + l.quantity, 0);
      if (totalQty < s.minQty) continue;
    }

    let savings = 0;
    let label = "";

    switch (s.schemeType) {
      case "percentage": {
        if (s.productId) {
          const line = validLines.find(l => l.productId === s.productId);
          savings = line ? (line.quantity * line.unitPrice * s.discountPercent) / 100 : 0;
        } else {
          savings = (grossTotal * s.discountPercent) / 100;
        }
        label = `${s.discountPercent}% off`;
        break;
      }
      case "buy_x_get_y": {
        if (s.productId) {
          const line = validLines.find(l => l.productId === s.productId);
          if (line && line.quantity >= s.buyQty) {
            const sets = Math.floor(line.quantity / s.buyQty);
            savings = sets * s.freeQty * line.unitPrice;
            label = `Buy ${s.buyQty} Get ${s.freeQty} Free`;
          }
        } else {
          const sorted = [...validLines].sort((a, b) => b.unitPrice - a.unitPrice);
          if (sorted.length > 0) {
            const totalQty = validLines.reduce((sum, l) => sum + l.quantity, 0);
            if (totalQty >= s.buyQty) {
              const sets = Math.floor(totalQty / s.buyQty);
              savings = sets * s.freeQty * sorted[0].unitPrice;
            }
          }
          label = `Buy ${s.buyQty} Get ${s.freeQty} Free`;
        }
        break;
      }
      case "flat_discount": {
        savings = s.flatAmount;
        label = `${formatCurrency(s.flatAmount)} off`;
        break;
      }
    }

    if (savings > 0) {
      appliedSchemes.push({ scheme: s, savings, label });
    }
  }

  const totalSchemeSavings = appliedSchemes.reduce((sum, a) => sum + a.savings, 0);

  return {
    grossTotal,
    totalSchemeSavings,
    netTotal: Math.max(0, grossTotal - totalSchemeSavings),
    appliedSchemes,
  };
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
