export interface GodownLocation {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  godownId: string;
  godownName: string;
  quantity: number;
  threshold: number;
  basePrice: number;
  lastDeductedDate: string | null;
}

export interface StockDeduction {
  id: string;
  productId: string;
  godownId: string;
  orderId: string;
  orderNumber: string;
  distributorName: string;
  quantityDeducted: number;
  date: string;
}

export type StockHealth = "healthy" | "low" | "critical";

export function getStockHealth(quantity: number, threshold: number): StockHealth {
  if (quantity <= threshold) return "critical";
  if (quantity <= threshold * 1.2) return "low";
  return "healthy";
}
