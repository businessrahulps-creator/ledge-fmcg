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
}

export const salespersons: Salesperson[] = [
  { id: "s1", name: "Rajesh Kumar", phone: "+91 98100 55555", email: "rajesh@ledge.in", region: "North", totalOrders: 89, totalValue: 1820000 },
  { id: "s2", name: "Amit Shah", phone: "+91 97120 66666", email: "amit@ledge.in", region: "West", totalOrders: 72, totalValue: 1450000 },
  { id: "s3", name: "Priya Verma", phone: "+91 94150 77777", email: "priya@ledge.in", region: "Central", totalOrders: 58, totalValue: 1120000 },
  { id: "s4", name: "Deepak Joshi", phone: "+91 99490 88888", email: "deepak@ledge.in", region: "South", totalOrders: 34, totalValue: 680000 },
];

export const distributors: Distributor[] = [
  { id: "d1", name: "Sharma Traders", location: "Delhi", contact: "+91 98100 12345", totalOrders: 142, totalValue: 2850000 },
  { id: "d2", name: "Patel Distributors", location: "Ahmedabad", contact: "+91 97120 67890", totalOrders: 98, totalValue: 1920000 },
  { id: "d3", name: "Gupta & Sons", location: "Lucknow", contact: "+91 94150 11223", totalOrders: 76, totalValue: 1540000 },
  { id: "d4", name: "Reddy Agencies", location: "Hyderabad", contact: "+91 99490 44556", totalOrders: 65, totalValue: 1280000 },
  { id: "d5", name: "Singh Supply Co.", location: "Chandigarh", contact: "+91 98760 77889", totalOrders: 54, totalValue: 980000 },
  { id: "d6", name: "Nair Enterprises", location: "Kochi", contact: "+91 94470 33445", totalOrders: 43, totalValue: 760000 },
  { id: "d7", name: "Das Trading", location: "Kolkata", contact: "+91 98300 55667", totalOrders: 37, totalValue: 620000 },
];

export const products: Product[] = [
  { id: "p1", name: "Premium Basmati Rice 5kg", sku: "RIC-BAS-5K", unit: "Pack", basePrice: 450, totalSold: 3200 },
  { id: "p2", name: "Sunflower Oil 1L", sku: "OIL-SUN-1L", unit: "Bottle", basePrice: 180, totalSold: 5600 },
  { id: "p3", name: "Wheat Flour 10kg", sku: "FLR-WHT-10", unit: "Bag", basePrice: 380, totalSold: 2800 },
  { id: "p4", name: "Sugar 5kg", sku: "SUG-WHT-5K", unit: "Pack", basePrice: 240, totalSold: 4100 },
  { id: "p5", name: "Toor Dal 1kg", sku: "DAL-TOR-1K", unit: "Pack", basePrice: 160, totalSold: 3800 },
  { id: "p6", name: "Tea Powder 500g", sku: "TEA-PRM-500", unit: "Pack", basePrice: 320, totalSold: 2100 },
  { id: "p7", name: "Washing Powder 1kg", sku: "WSH-PWD-1K", unit: "Pack", basePrice: 95, totalSold: 6200 },
  { id: "p8", name: "Bath Soap 100g (Pack of 4)", sku: "SOP-BTH-4P", unit: "Pack", basePrice: 140, totalSold: 4800 },
];

export const orders: Order[] = [
  {
    id: "o1", orderNumber: "ORD-2026-001", date: "2026-03-31", distributorId: "d1", distributorName: "Sharma Traders",
    salespersonId: "s1", salesperson: "Rajesh Kumar",
    lines: [
      { productId: "p1", productName: "Premium Basmati Rice 5kg", quantity: 50, unitPrice: 450, lineTotal: 22500 },
      { productId: "p2", productName: "Sunflower Oil 1L", quantity: 100, unitPrice: 180, lineTotal: 18000 },
    ],
    total: 40500, paymentMode: "bank_transfer", paymentStatus: "paid",
    dispatchDate: "2026-03-31", vehicle: "MH-01-AB-1234", driverName: "Sunil",
    deliveryStatus: "delivered", dispatchRemarks: ""
  },
  {
    id: "o2", orderNumber: "ORD-2026-002", date: "2026-03-30", distributorId: "d2", distributorName: "Patel Distributors",
    salespersonId: "s2", salesperson: "Amit Shah",
    lines: [
      { productId: "p3", productName: "Wheat Flour 10kg", quantity: 80, unitPrice: 380, lineTotal: 30400 },
      { productId: "p4", productName: "Sugar 5kg", quantity: 60, unitPrice: 240, lineTotal: 14400 },
      { productId: "p5", productName: "Toor Dal 1kg", quantity: 120, unitPrice: 160, lineTotal: 19200 },
    ],
    total: 64000, paymentMode: "upi", paymentStatus: "partial",
    dispatchDate: "2026-03-31", vehicle: "GJ-05-CD-5678", driverName: "Mahesh",
    deliveryStatus: "dispatched", dispatchRemarks: "Partial delivery expected"
  },
  {
    id: "o3", orderNumber: "ORD-2026-003", date: "2026-03-29", distributorId: "d3", distributorName: "Gupta & Sons",
    salespersonId: "s3", salesperson: "Priya Verma",
    lines: [
      { productId: "p6", productName: "Tea Powder 500g", quantity: 200, unitPrice: 320, lineTotal: 64000 },
    ],
    total: 64000, paymentMode: "cheque", paymentStatus: "pending",
    dispatchDate: null, vehicle: "", driverName: "",
    deliveryStatus: "pending", dispatchRemarks: "Awaiting payment confirmation"
  },
  {
    id: "o4", orderNumber: "ORD-2026-004", date: "2026-03-28", distributorId: "d4", distributorName: "Reddy Agencies",
    salespersonId: "s1", salesperson: "Rajesh Kumar",
    lines: [
      { productId: "p7", productName: "Washing Powder 1kg", quantity: 300, unitPrice: 95, lineTotal: 28500 },
      { productId: "p8", productName: "Bath Soap 100g (Pack of 4)", quantity: 200, unitPrice: 140, lineTotal: 28000 },
    ],
    total: 56500, paymentMode: "cash", paymentStatus: "paid",
    dispatchDate: "2026-03-29", vehicle: "TS-08-EF-9012", driverName: "Ravi",
    deliveryStatus: "delivered", dispatchRemarks: ""
  },
  {
    id: "o5", orderNumber: "ORD-2026-005", date: "2026-03-28", distributorId: "d5", distributorName: "Singh Supply Co.",
    salespersonId: "s2", salesperson: "Amit Shah",
    lines: [
      { productId: "p1", productName: "Premium Basmati Rice 5kg", quantity: 30, unitPrice: 450, lineTotal: 13500 },
      { productId: "p5", productName: "Toor Dal 1kg", quantity: 80, unitPrice: 160, lineTotal: 12800 },
    ],
    total: 26300, paymentMode: "upi", paymentStatus: "paid",
    dispatchDate: "2026-03-29", vehicle: "PB-02-GH-3456", driverName: "Harpreet",
    deliveryStatus: "delivered", dispatchRemarks: ""
  },
  {
    id: "o6", orderNumber: "ORD-2026-006", date: "2026-03-27", distributorId: "d1", distributorName: "Sharma Traders",
    salespersonId: "s3", salesperson: "Priya Verma",
    lines: [
      { productId: "p2", productName: "Sunflower Oil 1L", quantity: 150, unitPrice: 180, lineTotal: 27000 },
      { productId: "p4", productName: "Sugar 5kg", quantity: 100, unitPrice: 240, lineTotal: 24000 },
    ],
    total: 51000, paymentMode: "bank_transfer", paymentStatus: "partial",
    dispatchDate: "2026-03-28", vehicle: "DL-03-IJ-7890", driverName: "Vikram",
    deliveryStatus: "dispatched", dispatchRemarks: "Second batch pending"
  },
  {
    id: "o7", orderNumber: "ORD-2026-007", date: "2026-03-27", distributorId: "d6", distributorName: "Nair Enterprises",
    salespersonId: "s1", salesperson: "Rajesh Kumar",
    lines: [
      { productId: "p3", productName: "Wheat Flour 10kg", quantity: 40, unitPrice: 380, lineTotal: 15200 },
    ],
    total: 15200, paymentMode: "cash", paymentStatus: "paid",
    dispatchDate: "2026-03-27", vehicle: "KL-07-KL-1234", driverName: "Anoop",
    deliveryStatus: "delivered", dispatchRemarks: ""
  },
  {
    id: "o8", orderNumber: "ORD-2026-008", date: "2026-03-26", distributorId: "d7", distributorName: "Das Trading",
    salespersonId: "s2", salesperson: "Amit Shah",
    lines: [
      { productId: "p6", productName: "Tea Powder 500g", quantity: 100, unitPrice: 320, lineTotal: 32000 },
      { productId: "p7", productName: "Washing Powder 1kg", quantity: 200, unitPrice: 95, lineTotal: 19000 },
    ],
    total: 51000, paymentMode: "cheque", paymentStatus: "pending",
    dispatchDate: null, vehicle: "", driverName: "",
    deliveryStatus: "pending", dispatchRemarks: "Payment pending"
  },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}
