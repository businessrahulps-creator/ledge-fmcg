export interface Distributor {
  id: string;
  name: string;
  location: string;
  contact: string;
  email: string;
  address: string;
  gstin: string;
  pan: string;
  stateCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccount: string;
  bankIfsc: string;
  totalOrders: number;
  totalValue: number;
  creditLimit: number;
  outstandingAmount: number;
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  schemeType: 'percentage' | 'buy_x_get_y' | 'flat_discount';
  discountPercent: number;
  buyQty: number;
  freeQty: number;
  flatAmount: number;
  minOrderValue: number;
  minQty: number;
  productId: string | null;
  dealerId: string | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  basePrice: number;
  hsnCode: string;
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

export interface OrderScheme {
  schemeId: string | null;
  schemeName: string;
  schemeLabel: string;
  savings: number;
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
  deliveredAt?: string | null;
  dispatchRemarks: string;
  godownId?: string;
  schemeSavings: number;
  appliedSchemes: OrderScheme[];
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
