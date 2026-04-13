import { useData } from "@/context/DataContext";
import type { Order, Distributor, Salesperson, Product, Scheme } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";
import type { AddOrderResult, SecondarySale, Target, Claim, Invoice } from "@/context/DataContext";

export function useApi() {
  const data = useData();

  return {
    loading: data.loading,
    companyInfo: data.companyInfo,
    updateCompanyInfo: data.updateCompanyInfo,
    refreshAll: data.refreshAll,
    orders: {
      list: () => data.orders,
      create: (order: Order): Promise<AddOrderResult> => data.addOrder(order),
      update: (id: string, updates: Partial<Order>) => data.updateOrder(id, updates),
      delete: (id: string) => data.deleteOrder(id),
      updateStatus: (id: string, status: Partial<Pick<Order, "paymentStatus" | "deliveryStatus">>) =>
        data.updateOrder(id, status),
      nextNumber: () => data.nextOrderNumber(),
      prefix: () => data.orderPrefix,
      setPrefix: (p: string) => data.setOrderPrefix(p),
      previewNumber: () => data.previewOrderNumber(),
    },
    dealers: {
      list: () => data.distributors,
      create: (d: Distributor) => data.addDistributor(d),
      update: (d: Distributor) => data.updateDistributor(d),
      remove: (id: string) => data.deleteDistributor(id),
    },
    salespersons: {
      list: () => data.salespersons,
      create: (s: Salesperson) => data.addSalesperson(s),
      update: (s: Salesperson) => data.updateSalesperson(s),
      remove: (id: string) => data.deleteSalesperson(id),
    },
    products: {
      list: () => data.products,
      create: (p: Product) => data.addProduct(p),
      update: (p: Product) => data.updateProduct(p),
      remove: (id: string) => data.deleteProduct(id),
    },
    schemes: {
      list: () => data.schemes,
      create: (s: Scheme) => data.addScheme(s),
      update: (s: Scheme) => data.updateScheme(s),
      remove: (id: string) => data.deleteScheme(id),
    },
    stock: {
      items: {
        list: () => data.stockItems,
        create: (si: StockItem) => data.addStockItem(si),
        update: (si: StockItem) => data.updateStockItem(si),
        remove: (id: string) => data.deleteStockItem(id),
        setAll: data.setStockItems,
      },
      locations: {
        list: () => data.locations,
        create: (l: GodownLocation) => data.addLocation(l),
        update: (l: GodownLocation) => data.updateLocation(l),
        remove: (id: string) => data.deleteLocation(id),
      },
    },
    secondarySales: {
      list: () => data.secondarySales,
      create: (s: SecondarySale) => data.addSecondarySale(s),
      remove: (id: string) => data.deleteSecondarySale(id),
    },
    targets: {
      list: () => data.targets,
      create: (t: Target) => data.addTarget(t),
      update: (t: Target) => data.updateTarget(t),
      remove: (id: string) => data.deleteTarget(id),
    },
    claims: {
      list: () => data.claims,
      create: (c: Claim) => data.addClaim(c),
      update: (id: string, updates: Partial<Claim>) => data.updateClaim(id, updates),
    },
    invoices: {
      list: () => data.invoices,
      create: (inv: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => data.addInvoice(inv),
      update: (id: string, updates: Partial<Invoice>) => data.updateInvoice(id, updates),
      remove: (id: string) => data.deleteInvoice(id),
    },
  };
}
