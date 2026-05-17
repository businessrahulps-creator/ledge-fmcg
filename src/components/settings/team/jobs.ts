import { Crown, Briefcase, Calculator, UserRound, Eye } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface JobDef {
  role: AppRole;
  label: string;
  oneLiner: string;
  longDescription: string;
  icon: typeof Crown;
}

export const JOBS: JobDef[] = [
  {
    role: "super_admin",
    label: "Owner",
    oneLiner: "Runs everything. Money, team, billing, all data.",
    longDescription:
      "Full access. Manages the team, billing, and every page in Ledge. Best for founders and partners.",
    icon: Crown,
  },
  {
    role: "sales_manager",
    label: "Manager",
    oneLiner: "Runs the sales floor. Schemes, credit overrides, all dealers.",
    longDescription:
      "Sees all dealers, runs schemes, can override credit limits. Doesn't manage billing or the team.",
    icon: Briefcase,
  },
  {
    role: "accountant",
    label: "Accountant",
    oneLiner: "Keeps the books. Sees money and reports, can't touch stock.",
    longDescription:
      "Sees revenue, dues, and reports. Can't add stock or change schemes. Doesn't place orders. Perfect for your CA or finance lead.",
    icon: Calculator,
  },
  {
    role: "salesperson",
    label: "Sales Rep",
    oneLiner: "Takes orders. Sees their own dealers and performance only.",
    longDescription:
      "Books orders, sees their own dealers and their own numbers. Can't see money across the company.",
    icon: UserRound,
  },
  {
    role: "viewer",
    label: "Viewer",
    oneLiner: "Read-only. Can look, can't change anything.",
    longDescription:
      "Perfect for an investor, your CA, or anyone who needs visibility without the ability to touch your data.",
    icon: Eye,
  },
];

export const JOB_BY_ROLE: Record<AppRole, JobDef> = JOBS.reduce(
  (acc, j) => {
    acc[j.role] = j;
    return acc;
  },
  {} as Record<AppRole, JobDef>,
);

/** Plain-English label for a capability key — used in diff previews and remove summaries. */
export const CAP_LABEL: Record<string, string> = {
  manage_team: "team management",
  manage_billing: "billing",
  see_money: "money and revenue",
  manage_stock: "stock and products",
  manage_schemes: "schemes",
  see_all_dealers: "all dealers",
  override_credit_limit: "credit overrides",
  view_error_logs: "error logs",
  see_own_performance_only: "their own performance view",
  place_orders: "placing orders",
};

export function capLabels(caps: string[]): string {
  const labels = caps.map((c) => CAP_LABEL[c] ?? c);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
