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
