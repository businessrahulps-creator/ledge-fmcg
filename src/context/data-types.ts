import type { Order, Distributor, Salesperson, Product, Scheme } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";

export interface AddOrderResult {
  success: boolean;
  orderNumber?: string;
  error?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  gstin: string;
  logoUrl: string;
  phone: string;
  email: string;
  pan: string;
  stateCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccount: string;
  bankIfsc: string;
  invoicePrefix: string;
}

export interface InvoiceLine {
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxableValue: number;
}

export interface Invoice {
  id: string;
  docType: "gst_invoice" | "estimate" | "proforma" | "credit_note";
  invoiceNumber: string;
  invoiceDate: string;
  sourceOrderId?: string;
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerStateCode: string;
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerPan: string;
  sellerStateCode: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerBankName: string;
  sellerBankAccountName: string;
  sellerBankAccount: string;
  sellerBankIfsc: string;
  sellerLogoUrl: string;
  supplyType: "intra_state" | "inter_state";
  gstRate: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  roundOff: number;
  amountInWords: string;
  notes: string;
  status: "draft" | "final";
  vehicle: string;
  driverName: string;
  lines: InvoiceLine[];
  createdAt: string;
}

export interface SecondarySale {
  id: string;
  distributorId: string;
  productId: string;
  productName: string;
  retailerName: string;
  quantity: number;
  date: string;
  remarks: string;
}

export interface Target {
  id: string;
  entityType: "salesperson" | "dealer";
  entityId: string;
  entityName: string;
  periodType: "daily" | "weekly" | "monthly";
  periodStart: string;
  targetRevenue: number;
  targetOrders: number;
}

export interface ClaimLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Claim {
  id: string;
  orderId: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  claimType: "return" | "damage";
  status: "open" | "resolved" | "rejected";
  reason: string;
  resolutionNotes: string;
  restoreStock: boolean;
  totalClaimValue: number;
  lines: ClaimLine[];
  createdAt: string;
  resolvedAt: string | null;
}

export interface DataContextType {
  orders: Order[];
  distributors: Distributor[];
  salespersons: Salesperson[];
  products: Product[];
  locations: GodownLocation[];
  stockItems: StockItem[];
  schemes: Scheme[];
  secondarySales: SecondarySale[];
  loading: boolean;
  isOfflineData: boolean;
  companyInfo: CompanyInfo;
  updateCompanyInfo: (updates: Partial<CompanyInfo>) => void;

  orderPrefix: string;
  orderSequence: number;
  setOrderPrefix: (prefix: string) => void;

  addOrder: (order: Order) => Promise<AddOrderResult>;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => Promise<boolean>;

  addDistributor: (d: Distributor) => void;
  updateDistributor: (d: Distributor) => void;
  deleteDistributor: (id: string) => void;

  addSalesperson: (s: Salesperson) => void;
  updateSalesperson: (s: Salesperson) => void;
  deleteSalesperson: (id: string) => void;

  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  addLocation: (l: GodownLocation) => void;
  updateLocation: (l: GodownLocation) => void;
  deleteLocation: (id: string) => void;

  addStockItem: (si: StockItem) => void;
  updateStockItem: (si: StockItem) => void;
  deleteStockItem: (id: string) => void;
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;

  addScheme: (s: Scheme) => void;
  updateScheme: (s: Scheme) => void;
  deleteScheme: (id: string) => void;

  addSecondarySale: (s: SecondarySale) => void;
  deleteSecondarySale: (id: string) => void;

  targets: Target[];
  addTarget: (t: Target) => void;
  updateTarget: (t: Target) => void;
  deleteTarget: (id: string) => void;

  claims: Claim[];
  addClaim: (claim: Claim) => Promise<boolean>;
  updateClaim: (id: string, updates: Partial<Claim>) => Promise<void>;

  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => Promise<Invoice | null>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  nextOrderNumber: () => string;
  previewOrderNumber: () => string;
  refreshAll: () => Promise<void>;
}

/** Shared deps passed to domain hooks */
export interface DomainDeps {
  companyId: string | null;
  persistEntityToCache: (entity: import("@/lib/offline-store").CacheableEntity, data: any) => void;
  log: (entityType: string, entityId: string, action: string, summary: string, metadata?: Record<string, any>) => void;
}
