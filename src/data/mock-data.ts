export interface Distributor {
  id: string;
  name: string;
  location: string;
  contact: string;
  totalOrders: number;
  totalValue: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  basePrice: number;
  totalSold: number;
}

export interface Salesperson {
  id: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  totalOrders: number;
  totalValue: number;
}

export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  distributorId: string;
  distributorName: string;
  salespersonId: string;
  salesperson: string;
  lines: OrderLine[];
  total: number;
  paymentMode: "cash" | "bank_transfer" | "cheque" | "upi";
  paymentStatus: "paid" | "partial" | "pending";
  dispatchDate: string | null;
  vehicle: string;
  driverName: string;
  deliveryStatus: "pending" | "dispatched" | "delivered";
  dispatchRemarks: string;
  godownId?: string;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}
