import { supabase } from "@/integrations/supabase/client";
import { get, set } from "idb-keyval";

export type ErrorSeverity = "error" | "warning" | "info";

interface LogErrorParams {
  /** Stable identifier for where the error happened, e.g. "rpc:setup_new_company" or "crud:distributors.add" */
  source: string;
  /** The thrown error or any descriptive value */
  error: unknown;
  severity?: ErrorSeverity;
  /** Optional context sketch (route, ids, attempt). Keep small — no full payloads / PII. */
  context?: Record<string, any>;
}

interface QueuedErrorRow {
  company_id: string | null;
  user_id: string | null;
  severity: ErrorSeverity;
  source: string;
  message: string;
  stack: string;
  context: Record<string, any>;
}

const QUEUE_KEY = "errorlog:queue";
const RATE_LIMIT_MS = 30_000;
const recentSends = new Map<string, number>();

function extractMessage(err: unknown): { message: string; stack: string } {
  if (err instanceof Error) {
    return { message: err.message || err.name || "Unknown error", stack: err.stack || "" };
  }
  if (err && typeof err === "object" && "message" in (err as any)) {
    return { message: String((err as any).message || "Unknown error"), stack: "" };
  }
  return { message: typeof err === "string" ? err : "Unknown error", stack: "" };
}

async function enqueue(row: QueuedErrorRow) {
  try {
    const queue = (await get<QueuedErrorRow[]>(QUEUE_KEY)) || [];
    queue.push(row);
    // cap to prevent unbounded growth
    await set(QUEUE_KEY, queue.slice(-100));
  } catch {
    // best-effort
  }
}

async function flushQueue() {
  try {
    const queue = (await get<QueuedErrorRow[]>(QUEUE_KEY)) || [];
    if (queue.length === 0) return;
    const { error } = await supabase.from("error_log" as any).insert(queue);
    if (!error) await set(QUEUE_KEY, []);
  } catch {
    // best-effort
  }
}

// Replay queued errors when we come back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushQueue();
  });
  // Try once at startup as well
  setTimeout(flushQueue, 2000);
}

export async function logError(params: LogErrorParams): Promise<void> {
  const { source, error, severity = "error", context = {} } = params;
  const { message, stack } = extractMessage(error);

  // Always surface in dev tools
  // eslint-disable-next-line no-console
  console.error(`[${source}]`, message, error);

  // Rate limit identical errors
  const dedupeKey = `${source}::${message}`;
  const now = Date.now();
  const last = recentSends.get(dedupeKey);
  if (last && now - last < RATE_LIMIT_MS) return;
  recentSends.set(dedupeKey, now);

  // Build context sketch
  const route = typeof window !== "undefined" ? window.location.pathname : "";
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const fullContext = { route, online, userAgent, ...context };

  // Resolve current user + company (best-effort, never throw)
  let userId: string | null = null;
  let companyId: string | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: prof } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      companyId = prof?.company_id ?? null;
    }
  } catch {
    // ignore
  }

  const row: QueuedErrorRow = {
    company_id: companyId,
    user_id: userId,
    severity,
    source,
    message: message.slice(0, 2000),
    stack: stack.slice(0, 4000),
    context: fullContext,
  };

  if (!online) {
    await enqueue(row);
    return;
  }

  try {
    const { error: insertErr } = await supabase.from("error_log" as any).insert(row);
    if (insertErr) await enqueue(row);
  } catch {
    await enqueue(row);
  }
}
