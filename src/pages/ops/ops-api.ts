import { supabase } from "@/integrations/supabase/client";

/** Every Ops read goes through a SECURITY DEFINER RPC that re-checks staff
 *  membership in the database and writes an audit row. */

export interface OpsSummary {
  companies: number;
  companies_new_7d: number;
  companies_new_30d: number;
  users: number;
  users_new_7d: number;
  active_companies_7d: number;
  active_companies_30d: number;
  orders: number;
  orders_7d: number;
  invoices: number;
  billed_value: number;
  collected_value: number;
  trials_ending_7d: number;
  open_errors_24h: number;
}

export interface OpsCompanyRow {
  id: string;
  name: string;
  created_at: string;
  trial_ends_at: string | null;
  owner_name: string;
  owner_email: string;
  member_count: number;
  order_count: number;
  invoice_count: number;
  billed_value: number;
  outstanding: number;
  last_activity: string | null;
  total_count: number;
}

export interface OpsUserRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  company_id: string | null;
  company_name: string;
  created_at: string;
  updated_at: string | null;
  total_count: number;
}

export interface OpsErrorRow {
  id: string;
  created_at: string;
  severity: string;
  source: string;
  message: string;
  stack: string;
  resolved: boolean;
  company_id: string | null;
  company_name: string;
  user_email: string;
}

export interface OpsActivityRow {
  id: string;
  created_at: string;
  company_id: string;
  company_name: string;
  user_name: string;
  entity_type: string;
  action: string;
  summary: string;
}

export interface OpsCompanyDetail {
  company: {
    id: string;
    name: string;
    created_at: string;
    trial_ends_at: string | null;
    gstin: string;
    state_code: string;
    phone: string;
    email: string;
    order_prefix: string;
    invoice_prefix: string;
  } | null;
  team: Array<{
    full_name: string;
    email: string;
    phone: string;
    role: string;
    created_at: string;
    updated_at: string | null;
  }>;
  usage: {
    orders: number;
    orders_30d: number;
    invoices: number;
    billed_value: number;
    collected_value: number;
    dealers: number;
    products: number;
    outstanding: number;
  };
  daily: Array<{ day: string; orders: number }>;
  errors: Array<{
    id: string;
    created_at: string;
    severity: string;
    source: string;
    message: string;
    resolved: boolean;
  }>;
}

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (supabase.rpc as any)(name, args);
  if (error) throw error;
  return data as T;
}

export const opsApi = {
  summary: () => rpc<OpsSummary>("ops_platform_summary"),
  companies: (search: string, limit: number, offset: number) =>
    rpc<OpsCompanyRow[]>("ops_list_companies", {
      p_search: search,
      p_limit: limit,
      p_offset: offset,
    }),
  companyDetail: (id: string) =>
    rpc<OpsCompanyDetail>("ops_company_detail", { p_company_id: id }),
  users: (search: string, limit: number, offset: number) =>
    rpc<OpsUserRow[]>("ops_list_users", {
      p_search: search,
      p_limit: limit,
      p_offset: offset,
    }),
  errors: (limit: number, onlyOpen: boolean) =>
    rpc<OpsErrorRow[]>("ops_recent_errors", { p_limit: limit, p_only_open: onlyOpen }),
  activity: (limit: number) => rpc<OpsActivityRow[]>("ops_recent_activity", { p_limit: limit }),
};
