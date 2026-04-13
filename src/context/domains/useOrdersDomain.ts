import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderLine } from "@/data/mock-data";
import { cacheData, enqueueMutation } from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";
import { mapOrders } from "@/context/data-utils";
import type { DomainDeps, AddOrderResult } from "@/context/data-types";
import { fmtAmount, logActivity } from "@/utils/activityLog";
import { toast } from "sonner";

interface OrdersDeps extends DomainDeps {
  deductStockForOrder: (orderId: string, lines: OrderLine[], godownId: string, cId: string) => Promise<void>;
  safeRefetchStockItems: () => Promise<void>;
}

export function useOrdersDomain(deps: OrdersDeps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderPrefix, setOrderPrefixState] = useState("ORD");
  const [orderSequence, setOrderSequence] = useState(1);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeRefetch = useCallback(async () => {
    if (!deps.companyId) return;
    // Debounce rapid calls (e.g. realtime INSERT + UPDATE in quick succession)
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    return new Promise<void>((resolve) => {
      refetchTimer.current = setTimeout(async () => {
        refetchTimer.current = null;
        try {
      const { data: ordersData } = await supabase.from("orders").select("*").eq("company_id", deps.companyId).order("created_at", { ascending: false }).range(0, 9999);
      if (!ordersData) return;
      const orderIds = ordersData.map(o => o.id);
      let allLines: any[] = [];
      let allOrderSchemes: any[] = [];
      const CHUNK = 500;
      for (let i = 0; i < orderIds.length; i += CHUNK) {
        const chunk = orderIds.slice(i, i + CHUNK);
        const [linesRes, osRes] = await Promise.all([
          supabase.from("order_lines").select("*").in("order_id", chunk).range(0, 9999),
          supabase.from("order_schemes").select("*").in("order_id", chunk).range(0, 9999),
        ]);
        allLines.push(...(linesRes.data || []));
        allOrderSchemes.push(...(osRes.data || []));
      }
      const mapped = mapOrders(ordersData, allLines, allOrderSchemes);
      setOrders(mapped);
      if (deps.companyId) cacheData(deps.companyId, "orders", mapped);
    } catch { /* ignore */ }
  }, [deps.companyId]);

  const addOrder = useCallback(async (order: Order): Promise<AddOrderResult> => {
    if (!deps.companyId) return { success: false, error: "No company" };

    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const year = new Date().getFullYear();
      const offlineNumber = `${orderPrefix}-${year}-${String(orderSequence).padStart(4, "0")}`;
      const newOrder: Order = { ...order, id: tempId, orderNumber: offlineNumber };
      setOrders(prev => {
        const updated = [newOrder, ...prev];
        deps.persistEntityToCache("orders", updated);
        return updated;
      });
      setOrderSequence(prev => {
        const next = prev + 1;
        deps.persistEntityToCache("orderSequence", next);
        return next;
      });
      await enqueueMutation({
        type: "insert_order_atomic", table: "orders", clientTempId: tempId,
        payload: {
          companyId: deps.companyId, date: order.date, distributorId: order.distributorId,
          distributorName: order.distributorName, salespersonId: order.salespersonId,
          salesperson: order.salesperson, total: order.total, paymentMode: order.paymentMode,
          paymentStatus: order.paymentStatus, dispatchDate: order.dispatchDate || null,
          vehicle: order.vehicle, driverName: order.driverName, deliveryStatus: order.deliveryStatus,
          dispatchRemarks: order.dispatchRemarks, godownId: order.godownId || null, lines: order.lines,
        },
      });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return { success: true, orderNumber: offlineNumber };
    }

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("insert_order_atomic", {
        p_company_id: deps.companyId, p_date: order.date,
        p_distributor_id: order.distributorId, p_distributor_name: sanitizeInput(order.distributorName),
        p_salesperson_id: order.salespersonId, p_salesperson_name: sanitizeInput(order.salesperson),
        p_total: order.total, p_payment_mode: order.paymentMode, p_payment_status: order.paymentStatus,
        p_dispatch_date: order.dispatchDate || null, p_vehicle: sanitizeInput(order.vehicle),
        p_driver_name: sanitizeInput(order.driverName), p_delivery_status: order.deliveryStatus,
        p_dispatch_remarks: sanitizeInput(order.dispatchRemarks), p_godown_id: order.godownId || null,
        p_scheme_savings: order.schemeSavings || 0,
      });
      if (rpcError) throw rpcError;
      const inserted = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!inserted) throw new Error("Atomic insert returned no data");

      const orderNumber = inserted.order_number;
      setOrderSequence(inserted.seq + 1);

      if (order.lines.length > 0) {
        const { error: linesError } = await supabase.from("order_lines").insert(
          order.lines.map(l => ({
            order_id: inserted.id, product_id: l.productId, product_name: sanitizeInput(l.productName),
            quantity: l.quantity, unit_price: l.unitPrice, line_total: l.lineTotal,
          }))
        );
        if (linesError) throw linesError;
      }

      if (order.appliedSchemes && order.appliedSchemes.length > 0) {
        await supabase.from("order_schemes").insert(
          order.appliedSchemes.map(s => ({
            order_id: inserted.id, scheme_id: s.schemeId || null,
            scheme_name: s.schemeName, scheme_label: s.schemeLabel, savings: s.savings,
          }))
        );
      }

      if (order.godownId && (order.deliveryStatus === "dispatched" || order.deliveryStatus === "delivered")) {
        await deps.deductStockForOrder(inserted.id, order.lines, order.godownId, deps.companyId);
      }

      const newOrder: Order = { ...order, id: inserted.id, orderNumber };
      setOrders(prev => [newOrder, ...prev]);
      deps.log("order", inserted.id, "created", `Created order ${orderNumber} for ${order.distributorName} — ${fmtAmount(order.total)}`);
      return { success: true, orderNumber };
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      toast.error("Failed to create order", { description: msg });
      return { success: false, error: msg };
    }
  }, [deps.companyId, deps.deductStockForOrder, orderPrefix, orderSequence, deps.persistEntityToCache, deps.log]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const currentOrder = ordersRef.current.find(o => o.id === id);
    const previousDelivery = currentOrder?.deliveryStatus || "pending";
    const newDelivery = updates.deliveryStatus || previousDelivery;

    const dbUpdates: Record<string, any> = {};
    if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.deliveryStatus !== undefined) dbUpdates.delivery_status = updates.deliveryStatus;
    if (updates.dispatchDate !== undefined) dbUpdates.dispatch_date = updates.dispatchDate;
    if (updates.vehicle !== undefined) dbUpdates.vehicle = sanitizeInput(updates.vehicle);
    if (updates.driverName !== undefined) dbUpdates.driver_name = sanitizeInput(updates.driverName);
    if (updates.dispatchRemarks !== undefined) dbUpdates.dispatch_remarks = sanitizeInput(updates.dispatchRemarks);
    if (updates.godownId !== undefined) dbUpdates.godown_id = updates.godownId || null;
    if (updates.distributorId !== undefined) dbUpdates.distributor_id = updates.distributorId;
    if (updates.distributorName !== undefined) dbUpdates.distributor_name = updates.distributorName;
    if (updates.salespersonId !== undefined) dbUpdates.salesperson_id = updates.salespersonId;
    if (updates.salesperson !== undefined) dbUpdates.salesperson_name = updates.salesperson;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.schemeSavings !== undefined) dbUpdates.scheme_savings = updates.schemeSavings;

    const linesChanged = updates.lines !== undefined;

    if (!navigator.onLine) {
      setOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, ...updates } : o);
        deps.persistEntityToCache("orders", updated);
        return updated;
      });
      if (Object.keys(dbUpdates).length > 0) {
        await enqueueMutation({ type: "update", table: "orders", payload: { id, ...dbUpdates } });
      }
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from("orders").update(dbUpdates as any).eq("id", id);
      if (error) { toast.error("Failed to update order", { description: error.message }); return; }
    }

    if (linesChanged && updates.lines) {
      const { error: delErr } = await supabase.from("order_lines").delete().eq("order_id", id);
      if (delErr) { toast.error("Failed to update line items", { description: delErr.message }); return; }
      if (updates.lines.length > 0) {
        const lineRows = updates.lines.map(l => ({
          order_id: id, product_id: l.productId, product_name: l.productName,
          quantity: l.quantity, unit_price: l.unitPrice, line_total: l.lineTotal,
        }));
        const { error: insErr } = await supabase.from("order_lines").insert(lineRows);
        if (insErr) { toast.error("Failed to insert line items", { description: insErr.message }); return; }
      }
      await supabase.from("order_schemes").delete().eq("order_id", id);
      if (updates.appliedSchemes && updates.appliedSchemes.length > 0) {
        const schemeRows = updates.appliedSchemes.map(s => ({
          order_id: id, scheme_id: s.schemeId || null,
          scheme_name: s.schemeName, scheme_label: s.schemeLabel || "", savings: s.savings,
        }));
        await supabase.from("order_schemes").insert(schemeRows);
      }
    }

    const godownId = updates.godownId || currentOrder?.godownId;
    if (
      previousDelivery === "pending" &&
      (newDelivery === "dispatched" || newDelivery === "delivered") &&
      godownId && currentOrder && deps.companyId
    ) {
      const linesToUse = updates.lines || currentOrder.lines;
      await deps.deductStockForOrder(id, linesToUse, godownId, deps.companyId);
    }

    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

    const summaryParts: string[] = [];
    if (updates.paymentStatus) summaryParts.push(`payment ${currentOrder?.paymentStatus || "?"} → ${updates.paymentStatus}`);
    if (updates.deliveryStatus) summaryParts.push(`delivery ${currentOrder?.deliveryStatus || "?"} → ${updates.deliveryStatus}`);
    if (summaryParts.length === 0 && linesChanged) summaryParts.push("updated line items");
    if (summaryParts.length === 0) summaryParts.push("updated details");
    deps.log("order", id, "updated", `${currentOrder?.orderNumber || "Order"}: ${summaryParts.join(", ")}`, updates);
  }, [deps.companyId, deps.deductStockForOrder, deps.persistEntityToCache, deps.log]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    if (!navigator.onLine) {
      toast.error("Cannot delete orders while offline", { description: "Please reconnect to delete orders." });
      return false;
    }
    try {
      const { error: sdErr } = await supabase.from("stock_deductions").delete().eq("order_id", id);
      if (sdErr) throw sdErr;
      const { error: osErr } = await supabase.from("order_schemes").delete().eq("order_id", id);
      if (osErr) throw osErr;
      const { error: olErr } = await supabase.from("order_lines").delete().eq("order_id", id);
      if (olErr) throw olErr;
      const { data: deleted, error: oErr } = await supabase.from("orders").delete().eq("id", id).select("id");
      if (oErr) throw oErr;
      if (!deleted || deleted.length === 0) throw new Error("Order could not be deleted — you may not have permission.");
      const deletedOrder = ordersRef.current.find(o => o.id === id);
      setOrders(prev => prev.filter(o => o.id !== id));
      await deps.safeRefetchStockItems();
      deps.log("order", id, "deleted", `Deleted order ${deletedOrder?.orderNumber || id}`);
      return true;
    } catch (err: any) {
      toast.error("Failed to delete order", { description: err?.message || "Unknown error" });
      return false;
    }
  }, [deps.safeRefetchStockItems, deps.log]);

  const setOrderPrefix = useCallback(async (prefix: string) => {
    if (!deps.companyId) return;
    setOrderPrefixState(prefix);
    if (!navigator.onLine) {
      deps.persistEntityToCache("orderPrefix", prefix);
      await enqueueMutation({ type: "update", table: "companies", payload: { id: deps.companyId, order_prefix: prefix } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    await supabase.from("companies").update({ order_prefix: prefix }).eq("id", deps.companyId);
  }, [deps.companyId, deps.persistEntityToCache]);

  const previewOrderNumber = useCallback(() => {
    const year = new Date().getFullYear();
    return `${orderPrefix}-${year}-${String(orderSequence).padStart(4, "0")}`;
  }, [orderPrefix, orderSequence]);

  const nextOrderNumber = useCallback(() => {
    const year = new Date().getFullYear();
    return `${orderPrefix}-${year}-${String(orderSequence).padStart(4, "0")}`;
  }, [orderPrefix, orderSequence]);

  return {
    orders, setOrders, orderPrefix, setOrderPrefixState, orderSequence, setOrderSequence,
    addOrder, updateOrder, deleteOrder, setOrderPrefix,
    previewOrderNumber, nextOrderNumber, safeRefetch,
  };
}
