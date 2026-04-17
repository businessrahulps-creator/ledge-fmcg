import { toast } from "sonner";
import { logError } from "@/utils/errorLog";

/**
 * Translate raw Supabase / Postgres errors into a single user-friendly toast,
 * and forward the full error to the error log for debugging.
 *
 * Use at every mutation call-site instead of surfacing `error.message` directly,
 * which often contains opaque Postgres text like
 * `duplicate key value violates unique constraint "..."`.
 *
 * @example
 *   const { error } = await supabase.from("orders").update(...).eq("id", id);
 *   if (error) return handleSupabaseError(error, { source: "crud:orders.update", title: "Failed to update order" });
 */
export interface HandleSupabaseErrorOptions {
  /** Stable identifier for where the error happened, e.g. "crud:orders.update" */
  source: string;
  /** Toast title shown to the user. Should be action-oriented and friendly. */
  title: string;
  /** Optional context for the error log (ids, attempt #). Keep small, no PII. */
  context?: Record<string, any>;
}

export function handleSupabaseError(error: unknown, opts: HandleSupabaseErrorOptions) {
  const friendly = toFriendlyMessage(error);
  toast.error(opts.title, { description: friendly });
  logError({ source: opts.source, error, context: opts.context });
}

/** Map common Supabase / Postgres error shapes to a one-line, user-friendly message. */
function toFriendlyMessage(error: unknown): string {
  // Network / fetch failures (offline mid-request, DNS, etc.)
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Please check your connection and try again.";
  }
  const err = error as any;
  const msg = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "");

  if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
    return "Couldn't reach the server. Please check your connection.";
  }
  if (code === "23505" || msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return "This entry already exists. Please use a different value.";
  }
  if (code === "23503" || msg.includes("foreign key")) {
    return "This item is linked to other records and can't be changed right now.";
  }
  if (code === "23502" || msg.includes("not-null") || msg.includes("null value")) {
    return "Some required information is missing. Please fill in all fields.";
  }
  if (code === "42501" || msg.includes("permission denied") || msg.includes("rls")) {
    return "You don't have permission to do this.";
  }
  if (msg.includes("jwt") || msg.includes("not authenticated") || code === "401") {
    return "Your session has expired. Please sign in again.";
  }
  // Fallback — short, generic, never the raw Postgres string
  return "Something went wrong. Please try again — we've logged the details.";
}
