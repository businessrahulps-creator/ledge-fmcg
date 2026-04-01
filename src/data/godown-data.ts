import { products } from "./mock-data";

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

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  fromGodownId: string;
  fromGodownName: string;
  toGodownId: string;
  toGodownName: string;
  quantity: number;
  date: string;
  remarks: string;
}

export type StockHealth = "healthy" | "low" | "critical";

export function getStockHealth(quantity: number, threshold: number): StockHealth {
  if (quantity <= threshold) return "critical";
  if (quantity <= threshold * 1.2) return "low";
  return "healthy";
}

export const godownLocations: GodownLocation[] = [
  { id: "g1", name: "Main Warehouse — Thrissur", address: "Industrial Area, Thrissur, Kerala 680001", isActive: true },
  { id: "g2", name: "North Hub — Delhi", address: "Okhla Industrial Estate, Delhi 110020", isActive: true },
  { id: "g3", name: "West Depot — Ahmedabad", address: "Naroda GIDC, Ahmedabad, Gujarat 382330", isActive: true },
];

export const stockItems: StockItem[] = [
  // Main Warehouse — Thrissur
  { id: "si1", productId: "p1", productName: "Premium Basmati Rice 5kg", sku: "RIC-BAS-5K", unit: "Pack", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 420, threshold: 50, basePrice: 450, lastDeductedDate: "2026-03-31" },
  { id: "si2", productId: "p2", productName: "Sunflower Oil 1L", sku: "OIL-SUN-1L", unit: "Bottle", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 280, threshold: 80, basePrice: 180, lastDeductedDate: "2026-03-30" },
  { id: "si3", productId: "p3", productName: "Wheat Flour 10kg", sku: "FLR-WHT-10", unit: "Bag", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 35, threshold: 40, basePrice: 380, lastDeductedDate: "2026-03-29" },
  { id: "si4", productId: "p4", productName: "Sugar 5kg", sku: "SUG-WHT-5K", unit: "Pack", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 190, threshold: 60, basePrice: 240, lastDeductedDate: "2026-03-28" },
  { id: "si5", productId: "p5", productName: "Toor Dal 1kg", sku: "DAL-TOR-1K", unit: "Pack", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 520, threshold: 100, basePrice: 160, lastDeductedDate: "2026-03-31" },
  { id: "si6", productId: "p6", productName: "Tea Powder 500g", sku: "TEA-PRM-500", unit: "Pack", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 15, threshold: 30, basePrice: 320, lastDeductedDate: "2026-03-27" },
  { id: "si7", productId: "p7", productName: "Washing Powder 1kg", sku: "WSH-PWD-1K", unit: "Pack", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 340, threshold: 80, basePrice: 95, lastDeductedDate: "2026-03-29" },
  { id: "si8", productId: "p8", productName: "Bath Soap 100g (Pack of 4)", sku: "SOP-BTH-4P", unit: "Pack", godownId: "g1", godownName: "Main Warehouse — Thrissur", quantity: 72, threshold: 60, basePrice: 140, lastDeductedDate: "2026-03-28" },

  // North Hub — Delhi
  { id: "si9", productId: "p1", productName: "Premium Basmati Rice 5kg", sku: "RIC-BAS-5K", unit: "Pack", godownId: "g2", godownName: "North Hub — Delhi", quantity: 180, threshold: 50, basePrice: 450, lastDeductedDate: "2026-03-31" },
  { id: "si10", productId: "p2", productName: "Sunflower Oil 1L", sku: "OIL-SUN-1L", unit: "Bottle", godownId: "g2", godownName: "North Hub — Delhi", quantity: 95, threshold: 80, basePrice: 180, lastDeductedDate: "2026-03-30" },
  { id: "si11", productId: "p3", productName: "Wheat Flour 10kg", sku: "FLR-WHT-10", unit: "Bag", godownId: "g2", godownName: "North Hub — Delhi", quantity: 220, threshold: 40, basePrice: 380, lastDeductedDate: "2026-03-28" },
  { id: "si12", productId: "p5", productName: "Toor Dal 1kg", sku: "DAL-TOR-1K", unit: "Pack", godownId: "g2", godownName: "North Hub — Delhi", quantity: 45, threshold: 50, basePrice: 160, lastDeductedDate: "2026-03-31" },
  { id: "si13", productId: "p7", productName: "Washing Powder 1kg", sku: "WSH-PWD-1K", unit: "Pack", godownId: "g2", godownName: "North Hub — Delhi", quantity: 500, threshold: 80, basePrice: 95, lastDeductedDate: "2026-03-30" },

  // West Depot — Ahmedabad
  { id: "si14", productId: "p2", productName: "Sunflower Oil 1L", sku: "OIL-SUN-1L", unit: "Bottle", godownId: "g3", godownName: "West Depot — Ahmedabad", quantity: 160, threshold: 80, basePrice: 180, lastDeductedDate: "2026-03-29" },
  { id: "si15", productId: "p4", productName: "Sugar 5kg", sku: "SUG-WHT-5K", unit: "Pack", godownId: "g3", godownName: "West Depot — Ahmedabad", quantity: 310, threshold: 60, basePrice: 240, lastDeductedDate: "2026-03-27" },
  { id: "si16", productId: "p6", productName: "Tea Powder 500g", sku: "TEA-PRM-500", unit: "Pack", godownId: "g3", godownName: "West Depot — Ahmedabad", quantity: 88, threshold: 30, basePrice: 320, lastDeductedDate: "2026-03-30" },
  { id: "si17", productId: "p8", productName: "Bath Soap 100g (Pack of 4)", sku: "SOP-BTH-4P", unit: "Pack", godownId: "g3", godownName: "West Depot — Ahmedabad", quantity: 25, threshold: 60, basePrice: 140, lastDeductedDate: "2026-03-28" },

  // Additional items for variety
  { id: "si18", productId: "p1", productName: "Premium Basmati Rice 5kg", sku: "RIC-BAS-5K", unit: "Pack", godownId: "g3", godownName: "West Depot — Ahmedabad", quantity: 0, threshold: 50, basePrice: 450, lastDeductedDate: "2026-03-25" },
];

export const stockDeductions: StockDeduction[] = [
  { id: "sd1", productId: "p1", godownId: "g1", orderId: "o1", orderNumber: "ORD-2026-001", distributorName: "Sharma Traders", quantityDeducted: 50, date: "2026-03-31" },
  { id: "sd2", productId: "p2", godownId: "g1", orderId: "o1", orderNumber: "ORD-2026-001", distributorName: "Sharma Traders", quantityDeducted: 100, date: "2026-03-31" },
  { id: "sd3", productId: "p3", godownId: "g2", orderId: "o2", orderNumber: "ORD-2026-002", distributorName: "Patel Distributors", quantityDeducted: 80, date: "2026-03-31" },
  { id: "sd4", productId: "p5", godownId: "g1", orderId: "o5", orderNumber: "ORD-2026-005", distributorName: "Singh Supply Co.", quantityDeducted: 80, date: "2026-03-29" },
  { id: "sd5", productId: "p7", godownId: "g1", orderId: "o4", orderNumber: "ORD-2026-004", distributorName: "Reddy Agencies", quantityDeducted: 300, date: "2026-03-29" },
  { id: "sd6", productId: "p8", godownId: "g1", orderId: "o4", orderNumber: "ORD-2026-004", distributorName: "Reddy Agencies", quantityDeducted: 200, date: "2026-03-29" },
  { id: "sd7", productId: "p1", godownId: "g2", orderId: "o5", orderNumber: "ORD-2026-005", distributorName: "Singh Supply Co.", quantityDeducted: 30, date: "2026-03-29" },
  { id: "sd8", productId: "p2", godownId: "g1", orderId: "o6", orderNumber: "ORD-2026-006", distributorName: "Sharma Traders", quantityDeducted: 150, date: "2026-03-28" },
  { id: "sd9", productId: "p4", godownId: "g1", orderId: "o6", orderNumber: "ORD-2026-006", distributorName: "Sharma Traders", quantityDeducted: 100, date: "2026-03-28" },
  { id: "sd10", productId: "p3", godownId: "g1", orderId: "o7", orderNumber: "ORD-2026-007", distributorName: "Nair Enterprises", quantityDeducted: 40, date: "2026-03-27" },
];

export const stockTransfers: StockTransfer[] = [
  { id: "st1", productId: "p1", productName: "Premium Basmati Rice 5kg", fromGodownId: "g1", fromGodownName: "Main Warehouse — Thrissur", toGodownId: "g2", toGodownName: "North Hub — Delhi", quantity: 100, date: "2026-03-25", remarks: "Restocking Delhi hub" },
  { id: "st2", productId: "p2", productName: "Sunflower Oil 1L", fromGodownId: "g1", fromGodownName: "Main Warehouse — Thrissur", toGodownId: "g3", toGodownName: "West Depot — Ahmedabad", quantity: 50, date: "2026-03-22", remarks: "" },
];

// Sparkline data (daily closing stock for last 30 days)
export function generateSparklineData(currentQty: number): number[] {
  const data: number[] = [];
  let qty = currentQty + Math.floor(Math.random() * 200) + 100;
  for (let i = 0; i < 30; i++) {
    const change = Math.floor(Math.random() * 40) - 15;
    qty = Math.max(0, qty + change);
    data.push(qty);
  }
  data[29] = currentQty;
  return data;
}

// Computed helpers
export function getGodownStats(godownId: string) {
  const items = stockItems.filter(si => si.godownId === godownId);
  const totalSKUs = items.length;
  const totalValue = items.reduce((sum, si) => sum + si.quantity * si.basePrice, 0);
  const lowStockCount = items.filter(si => getStockHealth(si.quantity, si.threshold) !== "healthy").length;
  return { totalSKUs, totalValue, lowStockCount };
}

export function getOverallStats() {
  const uniqueProducts = new Set(stockItems.map(si => si.productId)).size;
  const totalValue = stockItems.reduce((sum, si) => sum + si.quantity * si.basePrice, 0);
  const lowStockItems = stockItems.filter(si => getStockHealth(si.quantity, si.threshold) !== "healthy");
  const healthyCount = stockItems.filter(si => getStockHealth(si.quantity, si.threshold) === "healthy").length;
  const lowCount = stockItems.filter(si => getStockHealth(si.quantity, si.threshold) === "low").length;
  const criticalCount = stockItems.filter(si => getStockHealth(si.quantity, si.threshold) === "critical").length;
  return { uniqueProducts, totalValue, lowStockAlerts: lowStockItems.length, activeGodowns: godownLocations.filter(g => g.isActive).length, healthyCount, lowCount, criticalCount, total: stockItems.length };
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date("2026-04-01");
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
