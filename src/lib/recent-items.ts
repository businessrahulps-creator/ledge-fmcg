/**
 * Lightweight "recent items" tracker for the command palette.
 * Persists last ~12 visited destinations to localStorage, ordered MRU.
 * Used to surface frequently-jumped-to pages and entities at the top of Cmd+K.
 */

export type RecentKind = "page" | "order" | "dealer" | "product";

export interface RecentItem {
  kind: RecentKind;
  label: string;
  to: string;
  /** Optional secondary line (e.g. dealer name on an order). */
  hint?: string;
  /** Last visit timestamp (ms). */
  at: number;
}

const KEY = "ledge:recent-items";
const MAX = 12;

function read(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.to === "string" && typeof x.label === "string");
  } catch {
    return [];
  }
}

function write(items: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // storage full / disabled — silently ignore
  }
}

export function recordRecent(item: Omit<RecentItem, "at">) {
  const items = read().filter((i) => i.to !== item.to);
  items.unshift({ ...item, at: Date.now() });
  write(items);
}

export function getRecent(): RecentItem[] {
  return read();
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
