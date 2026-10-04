import type { Database } from "@/integrations/supabase/types";
import { IndianRupee, ShoppingCart, Package, Tag, Map, ShoppingBag, ShieldAlert, Building2, type LucideIcon } from "lucide-react";
import { JOB_BY_ROLE, type AppRole } from "./jobs";

export type CapabilityKey = Database["public"]["Enums"]["capability_key"];

export interface ToggleableCap {
  key: CapabilityKey;
  label: string;
  sub?: string;
  icon: LucideIcon;
}

/** The access "areas" an owner can switch on/off per person. Order = order shown. Server list: _access_toggleable(). */
export const TOGGLEABLE_CAPS: ToggleableCap[] = [
  { key: "see_money", label: "Money", sub: "Bills, collecting payments, returns, dues", icon: IndianRupee },
  { key: "manage_buying", label: "Buying", sub: "Suppliers, purchase bills, supplier payments", icon: ShoppingCart },
  { key: "manage_stock", label: "Stock & godowns", sub: "Add and adjust stock, godowns", icon: Package },
  { key: "manage_schemes", label: "Offers & schemes", sub: "Create and edit offers", icon: Tag },
  { key: "see_all_dealers", label: "All dealers", sub: "See every dealer, not just their own", icon: Map },
  { key: "place_orders", label: "Place orders", sub: "Make new orders", icon: ShoppingBag },
  { key: "override_credit_limit", label: "Approve credit limits", sub: "Let an order go past a dealer's limit", icon: ShieldAlert },
  { key: "manage_business", label: "Business settings", sub: "Company details, GST, bank, invoice settings", icon: Building2 },
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
  manage_buying: "buy from suppliers",
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
