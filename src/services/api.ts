import { useData } from "@/context/DataContext";
import type { Order, Distributor, Salesperson, Product } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";
import type { AddOrderResult } from "@/context/DataContext";

export function useApi() {
  const data = useData();

  return {
    loading: data.loading,
    companyInfo: data.companyInfo,
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
  };
}
