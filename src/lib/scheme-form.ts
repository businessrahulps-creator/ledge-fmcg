import type { Scheme } from "@/data/mock-data";

export type SchemeForm = Omit<Scheme, "id">;

/** Products an offer is limited to (empty = all products). Reads the new list, falls back to the old single product. */
export function schemeProductIds(s: Pick<Scheme, "productIds" | "productId">): string[] {
  if (s.productIds && s.productIds.length > 0) return s.productIds;
  return s.productId ? [s.productId] : [];
}

/** The product given free (Buy X Get Y). Empty = same product as the one bought. */
export function schemeFreeProductId(s: Pick<Scheme, "freeProductId" | "productId">): string | null {
  return s.freeProductId || s.productId || null;
}

export type SchemeFormError = string | null;

export function validateSchemeForm(f: SchemeForm): SchemeFormError {
  if (!f.name.trim()) return "Please enter an offer name.";
  if (f.schemeType === "buy_x_get_y") {
    if (!f.productId) return "Pick the product to buy.";
    if (!(f.buyQty >= 1)) return "Buy quantity must be at least 1.";
    if (!(f.freeQty >= 1)) return "Free quantity must be at least 1.";
  }
  if (f.schemeType === "percentage" && !(f.discountPercent > 0 && f.discountPercent <= 100)) return "Discount must be between 1 and 100%.";
  if (f.schemeType === "flat_discount" && !(f.flatAmount > 0)) return "Discount amount must be more than ₹0.";
  return null;
}

/**
 * Cleans a form before saving so each offer type stores only the fields it uses:
 * - Buy X Get Y: one bought product, an optional different free product, no minimums, no product list.
 * - Percentage / Flat: an optional product list, no free product, no minimum quantity.
 *   The old single `productId` is kept as the first picked product so older readers never widen the offer.
 */
export function normalizeSchemeForm(f: SchemeForm): SchemeForm {
  if (f.schemeType === "buy_x_get_y") {
    const free = f.freeProductId && f.freeProductId !== f.productId ? f.freeProductId : null;
    return { ...f, minOrderValue: 0, minQty: 0, productIds: null, freeProductId: free };
  }
  const ids = Array.from(new Set(f.productIds ?? (f.productId ? [f.productId] : [])));
  return {
    ...f,
    minQty: 0,
    freeProductId: null,
    productIds: ids.length ? ids : null,
    productId: ids[0] ?? null,
  };
}

export function buyXGetYSummary(
  f: Pick<Scheme, "buyQty" | "freeQty" | "productId" | "freeProductId">,
  nameOf: (id: string) => string | undefined,
): string {
  const buy = f.productId ? nameOf(f.productId) : undefined;
  if (!buy) return "Pick the product to buy to see the summary.";
  const freeId = f.freeProductId || f.productId!;
  const free = nameOf(freeId) ?? buy;
  return `For every ${f.buyQty} ${buy} bought, the dealer gets ${f.freeQty} ${free} free (₹0).`;
}
