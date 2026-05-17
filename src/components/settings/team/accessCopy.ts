import type { Database } from "@/integrations/supabase/types";
import { JOB_BY_ROLE, type AppRole } from "./jobs";

export type CapabilityKey = Database["public"]["Enums"]["capability_key"];

export interface ToggleableCap {
  key: CapabilityKey;
  label: string;
  sub?: string;
}

/** Order matters — this is the exact order shown in the drawer. */
export const TOGGLEABLE_CAPS: ToggleableCap[] = [
  { key: "place_orders", label: "Can place orders" },
  { key: "manage_stock", label: "Can manage stock and warehouses" },
  { key: "manage_schemes", label: "Can manage schemes and discounts" },
  {
    key: "see_money",
    label: "Can see money",
    sub: "Invoices, payments, outstanding",
  },
  {
    key: "see_all_dealers",
    label: "Can see all dealers",
    sub: "Not just their own",
  },
  { key: "override_credit_limit", label: "Can override credit limits" },
];

export interface OwnerOnlyCap {
  key: CapabilityKey;
  label: string;
}

export const OWNER_ONLY_CAPS: OwnerOnlyCap[] = [
  { key: "manage_team", label: "Manage the team" },
  { key: "manage_billing", label: "Manage billing and plan" },
  { key: "view_error_logs", label: "View system error logs" },
];

/** Short, summary-friendly phrasing — distinct from CAP_LABEL (which is "noun-y"). */
export const SHORT_CAP_LABEL: Record<CapabilityKey, string> = {
  place_orders: "place orders",
  manage_stock: "manage stock",
  manage_schemes: "run schemes",
  see_money: "see money",
  see_all_dealers: "see all dealers",
  override_credit_limit: "override credit",
  manage_team: "manage the team",
  manage_billing: "manage billing",
  view_error_logs: "view error logs",
  see_own_performance_only: "see only their own numbers",
};

function joinNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "They";
}

/**
 * Builds a plain-English summary sentence from active toggleable capabilities.
 * - ≤ 3 active   → "Priya can {list}, but nothing else."
 * -   4 active   → "Priya can do everything a {Job} can, except {missing}."
 * - all toggles on → "Arun has full access except credit overrides." style
 * - 0 active     → "Priya is read-only right now."
 */
export function buildAccessSummary(
  name: string,
  role: AppRole,
  activeCaps: Set<CapabilityKey>,
): string {
  const who = firstName(name);
  const job = JOB_BY_ROLE[role].label;
  const toggleableKeys = TOGGLEABLE_CAPS.map((c) => c.key);
  const activeToggleable = toggleableKeys.filter((k) => activeCaps.has(k));
  const missingToggleable = toggleableKeys.filter((k) => !activeCaps.has(k));

  if (activeToggleable.length === 0) {
    return `${who} is read-only right now — view only, no changes.`;
  }

  // 1 missing — phrase as exception ("full access except X")
  if (missingToggleable.length === 1) {
    return `${who} has full access as ${article(job)} ${job}, except ${SHORT_CAP_LABEL[missingToggleable[0]]}.`;
  }

  // ≤ 3 active — list what they CAN do
  if (activeToggleable.length <= 3) {
    const list = joinNatural(activeToggleable.map((k) => SHORT_CAP_LABEL[k]));
    return `${who} can ${list}, but nothing else — as ${article(job)} ${job}.`;
  }

  // ≥ 4 active — list what they CAN'T do (shorter)
  const missingList =
    missingToggleable.length <= 2
      ? joinNatural(missingToggleable.map((k) => SHORT_CAP_LABEL[k]))
      : `${joinNatural(missingToggleable.slice(0, 2).map((k) => SHORT_CAP_LABEL[k]))}, plus a few more`;
  return `${who} can do most of what ${article(job)} ${job} does, except ${missingList}.`;
}

function article(label: string): string {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}
