/** Match the server's GST-rate gate; no-GST bills and saved bills need no check. */
export function pendingOrderGstProducts(
  gstin: string | null | undefined,
  hasBill: boolean,
  lines: readonly { productId: string }[],
  products: readonly {
    id: string;
    name: string;
    gstRate?: number | null;
    gstRateConfirmed?: boolean;
  }[],
): string[] {
  if (hasBill || !gstin?.trim()) return [];

  return Array.from(new Set(lines.map(line => line.productId))).flatMap(id => {
    const product = products.find(p => p.id === id);
    return product && (product.gstRate == null || !product.gstRateConfirmed)
      ? [product.name]
      : [];
  });
}