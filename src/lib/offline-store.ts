import { get, set, del, keys } from "idb-keyval";

// --- Data Cache ---

function cacheKey(companyId: string, entity: string) {
  return `cache:${companyId}:${entity}`;
}

const ENTITIES = [
  "orders", "distributors", "salespersons", "products",
  "locations", "stockItems", "orderPrefix", "orderSequence", "notifications",
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
  type: "insert" | "update" | "delete";
  table: string;
  payload: any;
}

const QUEUE_KEY = "queue:mutations";
const RETRY_STATUS_KEY = "queue:retryStatus";

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

export async function enqueueMutation(mutation: Omit<QueuedMutation, "id" | "timestamp">) {
  const queue = await getQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
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

// --- Replay single mutation ---

export async function replaySingleMutation(
  mutation: QueuedMutation
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await import("@/integrations/supabase/client");
  try {
    let res: any;
    if (mutation.type === "insert") {
      res = await supabase.from(mutation.table as any).insert(mutation.payload);
    } else if (mutation.type === "update") {
      const { id: rowId, ...rest } = mutation.payload;
      res = await supabase.from(mutation.table as any).update(rest).eq("id", rowId);
    } else if (mutation.type === "delete") {
      res = await supabase.from(mutation.table as any).delete().eq("id", mutation.payload.id);
    }
    if (res?.error) throw res.error;
    await removeFromQueue(mutation.id);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
