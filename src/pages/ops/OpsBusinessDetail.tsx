import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { OpsLayout } from "@/components/ops/OpsLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { opsApi } from "./ops-api";
import { StatTile, OpsCard, OpsTable, Th, Td, OpsEmpty, fmtDate, fmtDateTime } from "./ops-ui";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Owner",
  sales_manager: "Sales manager",
  accountant: "Accountant",
  salesperson: "Salesperson",
  viewer: "Viewer",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OpsBusinessDetail() {
  const { id = "" } = useParams();
  const validId = UUID_RE.test(id);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ops", "company", id],
    queryFn: () => opsApi.companyDetail(id),
    enabled: validId,
    staleTime: 60_000,
    retry: false,
  });

  const c = data?.company ?? null;
  const u = data?.usage;


  return (
    <OpsLayout
      title={c?.name ?? (isLoading ? "Loading…" : "Business")}
      subtitle={c ? `Joined ${fmtDate(c.created_at)} · ${c.gstin || "no GST number"}` : undefined}
      actions={
        <Link to="/ops/businesses" className="text-xs text-muted-foreground underline underline-offset-2">
          All businesses
        </Link>
      }
    >
      {!validId && <OpsCard><OpsEmpty>That business link isn't valid.</OpsEmpty></OpsCard>}
      {validId && isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      )}
      {validId && isError && <OpsCard><OpsEmpty>Couldn't load this business.</OpsEmpty></OpsCard>}
      {validId && !isLoading && !isError && !c && <OpsCard><OpsEmpty>Business not found.</OpsEmpty></OpsCard>}

      {c && u && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Orders" value={formatNumber(Number(u.orders))} hint={`${formatNumber(Number(u.orders_30d))} in 30 days`} />
            <StatTile label="Bills raised" value={formatNumber(Number(u.invoices))} />
            <StatTile label="Billed value" value={formatCurrency(Number(u.billed_value))} />
            <StatTile label="Collected" value={formatCurrency(Number(u.collected_value))} />
            <StatTile label="Outstanding" value={formatCurrency(Number(u.outstanding))} />
            <StatTile label="Dealers" value={formatNumber(Number(u.dealers))} />
            <StatTile label="Products" value={formatNumber(Number(u.products))} />
            <StatTile label="Trial ends" value={c.trial_ends_at ? fmtDate(c.trial_ends_at) : "—"} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <OpsCard title="Team">
              {(data?.team.length ?? 0) === 0 && <OpsEmpty>No members.</OpsEmpty>}
              {(data?.team.length ?? 0) > 0 && (
                <OpsTable head={<tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Profile updated</Th></tr>}>
                  {data!.team.map((m) => (
                    <tr key={m.email + m.created_at}>
                      <Td>{m.full_name || "—"}</Td>
                      <Td className="text-muted-foreground">{m.email}</Td>
                      <Td>{ROLE_LABEL[m.role] ?? (m.role || "—")}</Td>
                      <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(m.updated_at)}</Td>
                    </tr>
                  ))}
                </OpsTable>
              )}
            </OpsCard>

            <OpsCard title="Orders — last 30 days">
              {(data?.daily.length ?? 0) === 0 && <OpsEmpty>No orders in the last 30 days.</OpsEmpty>}
              {(data?.daily.length ?? 0) > 0 && (
                <ul className="divide-y divide-border/60">
                  {data!.daily.map((d) => (
                    <li key={d.day} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                      <span className="w-24 shrink-0 text-muted-foreground">{fmtDate(d.day)}</span>
                      <span className="h-2 rounded-full bg-primary/70" style={{ width: `${Math.min(100, Number(d.orders) * 8)}%` }} />
                      <span className="ml-auto tabular-nums">{formatNumber(Number(d.orders))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </OpsCard>
          </div>

          <OpsCard title="Recent errors" className="mt-5">
            {(data?.errors.length ?? 0) === 0 && <OpsEmpty>No errors reported.</OpsEmpty>}
            {(data?.errors.length ?? 0) > 0 && (
              <OpsTable head={<tr><Th>When</Th><Th>Severity</Th><Th>Where</Th><Th>Message</Th></tr>}>
                {data!.errors.map((e) => (
                  <tr key={e.id}>
                    <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(e.created_at)}</Td>
                    <Td>{e.severity}</Td>
                    <Td className="font-mono text-[11px]">{e.source}</Td>
                    <Td className="max-w-[420px] break-words">{e.message}</Td>
                  </tr>
                ))}
              </OpsTable>
            )}
          </OpsCard>
        </>
      )}
    </OpsLayout>
  );
}
