import { get, set, del, keys } from "idb-keyval";

// --- Data Cache ---

function cacheKey(companyId: string, entity: string) {
  return `cache:${companyId}:${entity}`;
}

const ENTITIES = [
  "orders", "distributors", "salespersons", "products",
  "locations", "stockItems", "orderPrefix", "orderSequence", "notifications", "schemes",
] as const;

export type CacheableEntity = (typeof ENTITIES)[number];

export async function cacheData(companyId: string, entity: CacheableEntity, data: any) {
  try {
    await set(cacheKey(companyId, entity), data);
  } catch (e) {
    console.warn("IDB cache write failed:", e);
  }
}

export async function getCachedData<T = any>(companyId: string, entity: CacheableEntity): Promise<T | undefined> {
  try {
    return await get<T>(cacheKey(companyId, entity));
  } catch (e) {
    console.warn("IDB cache read failed:", e);
    return undefined;
  }
}

export async function clearCache(companyId: string) {
  try {
    const allKeys = await keys();
    const prefix = `cache:${companyId}:`;
    for (const k of allKeys) {
      if (typeof k === "string" && k.startsWith(prefix)) {
        await del(k);
      }
    }
  } catch (e) {
    console.warn("IDB cache clear failed:", e);
  }
}

// --- Mutation Queue ---

export interface QueuedMutation {
  id: string;
  timestamp: number;
  type: "insert" | "update" | "delete" | "upsert" | "insert_order_atomic";
  table: string;
  payload: any;
  /** For offline-created rows: the client-side temp UUID so later mutations can be reconciled */
  clientTempId?: string;
  /** Track retry attempts */
  attempts: number;
  /** Last error message if replay failed */
  lastError?: string;
}

const QUEUE_KEY = "queue:mutations";
const RETRY_STATUS_KEY = "queue:retryStatus";
/** Tracks idempotency keys of mutations we've already successfully replayed */
const IDEMPOTENCY_KEY = "queue:idempotency";

export type RetryStatusMap = Record<string, "success" | "failed">;

export async function getRetryStatus(): Promise<RetryStatusMap> {
  try {
    return (await get<RetryStatusMap>(RETRY_STATUS_KEY)) || {};
  } catch {
    return {};
  }
}

export async function setRetryStatus(status: RetryStatusMap) {
  try {
    await set(RETRY_STATUS_KEY, status);
  } catch (e) {
    console.warn("IDB retry status write failed:", e);
  }
}

// --- Idempotency tracking ---

async function getIdempotencySet(): Promise<Set<string>> {
  try {
    const arr = await get<string[]>(IDEMPOTENCY_KEY);
    return new Set(arr || []);
  } catch {
    return new Set();
  }
}

async function markIdempotent(mutationId: string) {
  try {
    const s = await getIdempotencySet();
    s.add(mutationId);
    // Keep only last 500 entries to avoid unbounded growth
    const arr = [...s].slice(-500);
    await set(IDEMPOTENCY_KEY, arr);
  } catch (e) {
    console.warn("IDB idempotency write failed:", e);
  }
}

export async function enqueueMutation(mutation: Omit<QueuedMutation, "id" | "timestamp" | "attempts">) {
  const queue = await getQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attempts: 0,
  });
  await set(QUEUE_KEY, queue);
}

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    return (await get<QueuedMutation[]>(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

export async function removeFromQueue(id: string) {
  const queue = await getQueue();
  await set(QUEUE_KEY, queue.filter(m => m.id !== id));
}

export async function clearQueue() {
  await set(QUEUE_KEY, []);
}

/** Update a mutation in-place (e.g. to bump attempts or record error) */
export async function updateMutationInQueue(id: string, patch: Partial<QueuedMutation>) {
  const queue = await getQueue();
  const idx = queue.findIndex(m => m.id === id);
  if (idx !== -1) {
    queue[idx] = { ...queue[idx], ...patch };
    await set(QUEUE_KEY, queue);
  }
}

/** Reconcile temp IDs: when an offline-created row gets a real server ID,
 *  rewrite all later queued mutations that reference the temp ID.
 *  Scans ALL string-valued payload fields, not just payload.id */
export async function reconcileTempId(tempId: string, realId: string) {
  const queue = await getQueue();
  let changed = false;
  for (const m of queue) {
    if (!m.payload || typeof m.payload !== "object") continue;
    for (const key of Object.keys(m.payload)) {
      if (m.payload[key] === tempId) {
        m.payload[key] = realId;
        changed = true;
      }
    }
  }
  if (changed) await set(QUEUE_KEY, queue);
}

// --- Replay single mutation ---

export async function replaySingleMutation(
  mutation: QueuedMutation
): Promise<{ ok: true; realId?: string } | { ok: false; error: string }> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { sanitizeInput } = await import("@/utils/sanitize");

  // Idempotency check: skip if we already successfully replayed this mutation
  const idempotencySet = await getIdempotencySet();
  if (idempotencySet.has(mutation.id)) {
    // Already replayed — just clean up the queue entry
    await removeFromQueue(mutation.id);
    return { ok: true };
  }

  try {
    if (mutation.type === "insert_order_atomic") {
      const p = mutation.payload;
      const { data: rpcData, error: rpcError } = await supabase.rpc("insert_order_atomic", {
        p_company_id: p.companyId,
        p_date: p.date,
        p_distributor_id: p.distributorId,
        p_distributor_name: sanitizeInput(p.distributorName),
        p_salesperson_id: p.salespersonId,
        p_salesperson_name: sanitizeInput(p.salesperson),
        p_total: p.total,
        p_payment_mode: p.paymentMode,
        p_payment_status: p.paymentStatus,
        p_dispatch_date: p.dispatchDate || null,
        p_vehicle: sanitizeInput(p.vehicle || ""),
        p_driver_name: sanitizeInput(p.driverName || ""),
        p_delivery_status: p.deliveryStatus,
        p_dispatch_remarks: sanitizeInput(p.dispatchRemarks || ""),
        p_godown_id: p.godownId || null,
      });
      if (rpcError) throw rpcError;
      const inserted = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!inserted) throw new Error("Atomic insert returned no data");

      // Insert order lines
      if (p.lines && p.lines.length > 0) {
        const { error: linesError } = await supabase.from("order_lines").insert(
          p.lines.map((l: any) => ({
            order_id: inserted.id,
            product_id: l.productId,
            product_name: sanitizeInput(l.productName),
            quantity: l.quantity,
            unit_price: l.unitPrice,
            line_total: l.lineTotal,
          }))
        );
        if (linesError) throw linesError;
      }

      // Stock deduction — wrapped in try-catch so partial failure doesn't lose the order
      if (p.godownId && (p.deliveryStatus === "dispatched" || p.deliveryStatus === "delivered")) {
        try {
          const today = new Date().toISOString().split("T")[0];
          // Check if deductions already exist for this order (idempotency for partial replays)
          const { data: existingDeductions } = await supabase
            .from("stock_deductions").select("product_id")
            .eq("order_id", inserted.id);
          const alreadyDeducted = new Set((existingDeductions || []).map((d: any) => d.product_id));

          for (const line of (p.lines || [])) {
            if (alreadyDeducted.has(line.productId)) continue; // skip already-deducted

            await supabase.from("stock_deductions").insert({
              company_id: p.companyId,
              order_id: inserted.id,
              product_id: line.productId,
              godown_id: p.godownId,
              quantity_deducted: line.quantity,
              date: today,
            });

            const { data: existing } = await supabase
              .from("stock_items").select("id, quantity")
              .eq("company_id", p.companyId)
              .eq("product_id", line.productId)
              .eq("godown_id", p.godownId)
              .maybeSingle();

            if (existing) {
              await supabase.from("stock_items").update({
                quantity: existing.quantity - line.quantity,
                last_deducted_date: today,
              }).eq("id", existing.id);
            } else {
              await supabase.from("stock_items").insert({
                company_id: p.companyId,
                product_id: line.productId,
                godown_id: p.godownId,
                quantity: -line.quantity,
                threshold: 0,
                last_deducted_date: today,
              });
            }
          }
        } catch (stockErr) {
          console.error("Stock deduction during replay partially failed:", stockErr);
          try {
            const { logError } = await import("@/utils/errorLog");
            logError({
              source: "sync:replay.stock_deduction",
              error: stockErr,
              severity: "warning",
              context: { orderId: inserted.id },
            });
          } catch { /* ignore */ }
          // Order + lines are already persisted — don't fail the whole mutation
        }
      }

      // Mark as successfully replayed BEFORE removing from queue (idempotency)
      await markIdempotent(mutation.id);
      await removeFromQueue(mutation.id);
      if (mutation.clientTempId) {
        await reconcileTempId(mutation.clientTempId, inserted.id);
      }
      return { ok: true, realId: inserted.id };
    }

    if (mutation.type === "upsert") {
      const { _onConflict, ...rest } = mutation.payload;
      const res = await supabase.from(mutation.table as any).upsert(rest, {
        onConflict: _onConflict || "company_id,product_id,godown_id",
      });
      if (res.error) throw res.error;
    } else if (mutation.type === "insert") {
      const res = await supabase.from(mutation.table as any).insert(mutation.payload);
      if (res.error) throw res.error;
    } else if (mutation.type === "update") {
      const { id: rowId, ...rest } = mutation.payload;
      const res = await supabase.from(mutation.table as any).update(rest).eq("id", rowId);
      if (res.error) throw res.error;
    } else if (mutation.type === "delete") {
      const res = await supabase.from(mutation.table as any).delete().eq("id", mutation.payload.id);
      if (res.error) throw res.error;
    }

    await markIdempotent(mutation.id);
    await removeFromQueue(mutation.id);
    return { ok: true };
  } catch (e: any) {
    const errMsg = e?.message || String(e);
    await updateMutationInQueue(mutation.id, {
      attempts: (mutation.attempts || 0) + 1,
      lastError: errMsg,
    });
    try {
      const { logError } = await import("@/utils/errorLog");
      logError({
        source: "sync:replaySingleMutation",
        error: e,
        severity: "warning",
        context: { table: mutation.table, type: mutation.type, attempts: (mutation.attempts || 0) + 1 },
      });
    } catch { /* ignore */ }
    return { ok: false, error: errMsg };
  }
}
