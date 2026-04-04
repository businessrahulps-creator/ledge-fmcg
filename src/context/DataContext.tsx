import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  orders as initialOrders,
  distributors as initialDistributors,
  salespersons as initialSalespersons,
  products as initialProducts,
  type Order,
  type Distributor,
  type Salesperson,
  type Product,
} from "@/data/mock-data";
import {
  godownLocations as initialLocations,
  stockItems as initialStockItems,
  type GodownLocation,
  type StockItem,
} from "@/data/godown-data";

interface DataContextType {
  orders: Order[];
  distributors: Distributor[];
  salespersons: Salesperson[];
  products: Product[];
  locations: GodownLocation[];
  stockItems: StockItem[];

  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;

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

  nextOrderNumber: () => string;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [distributors, setDistributors] = useState<Distributor[]>(initialDistributors);
  const [salespersons, setSalespersons] = useState<Salesperson[]>(initialSalespersons);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [locations, setLocations] = useState<GodownLocation[]>(initialLocations);
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);

  const addOrder = useCallback((order: Order) => setOrders((prev) => [order, ...prev]), []);
  const updateOrder = useCallback((id: string, updates: Partial<Order>) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o))), []);

  const addDistributor = useCallback((d: Distributor) => setDistributors((prev) => [...prev, d]), []);
  const updateDistributor = useCallback((d: Distributor) =>
    setDistributors((prev) => prev.map((x) => (x.id === d.id ? d : x))), []);
  const deleteDistributor = useCallback((id: string) =>
    setDistributors((prev) => prev.filter((x) => x.id !== id)), []);

  const addSalesperson = useCallback((s: Salesperson) => setSalespersons((prev) => [...prev, s]), []);
  const updateSalesperson = useCallback((s: Salesperson) =>
    setSalespersons((prev) => prev.map((x) => (x.id === s.id ? s : x))), []);
  const deleteSalesperson = useCallback((id: string) =>
    setSalespersons((prev) => prev.filter((x) => x.id !== id)), []);

  const addProduct = useCallback((p: Product) => setProducts((prev) => [...prev, p]), []);
  const updateProduct = useCallback((p: Product) =>
    setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x))), []);
  const deleteProduct = useCallback((id: string) =>
    setProducts((prev) => prev.filter((x) => x.id !== id)), []);

  const addLocation = useCallback((l: GodownLocation) => setLocations((prev) => [...prev, l]), []);
  const updateLocation = useCallback((l: GodownLocation) =>
    setLocations((prev) => prev.map((x) => (x.id === l.id ? l : x))), []);
  const deleteLocation = useCallback((id: string) =>
    setLocations((prev) => prev.filter((x) => x.id !== id)), []);

  const addStockItem = useCallback((si: StockItem) => setStockItems((prev) => [...prev, si]), []);
  const updateStockItem = useCallback((si: StockItem) =>
    setStockItems((prev) => prev.map((x) => (x.id === si.id ? si : x))), []);
  const deleteStockItemFn = useCallback((id: string) =>
    setStockItems((prev) => prev.filter((x) => x.id !== id)), []);

  const nextOrderNumber = useCallback(() => {
    const maxNum = orders.reduce((max, o) => {
      const match = o.orderNumber.match(/ORD-\d{4}-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `ORD-2026-${String(maxNum + 1).padStart(3, "0")}`;
  }, [orders]);

  return (
    <DataContext.Provider
      value={{
        orders, distributors, salespersons, products, locations, stockItems,
        addOrder, updateOrder,
        addDistributor, updateDistributor, deleteDistributor,
        addSalesperson, updateSalesperson, deleteSalesperson,
        addProduct, updateProduct, deleteProduct,
        addLocation, updateLocation, deleteLocation,
        addStockItem, updateStockItem, deleteStockItem: deleteStockItemFn, setStockItems,
        nextOrderNumber,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
