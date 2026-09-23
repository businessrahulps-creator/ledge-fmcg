import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { OpsLayout } from "@/components/ops/OpsLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { opsApi } from "./ops-api";
import { StatTile, OpsCard, OpsTable, Th, Td, OpsEmpty, fmtDateTime } from "./ops-ui";

export default function OpsOverview() {
  const summary = useQuery({
    queryKey: ["ops", "summary"],
    queryFn: opsApi.summary,
    staleTime: 60_000,
  });

  const activity = useQuery({
    queryKey: ["ops", "activity", 15],
    queryFn: () => opsApi.activity(15),
    staleTime: 60_000,
  });

  const s = summary.data;

  return (
    <OpsLayout
      title="Overview"
      subtitle="Every business on Ledge, at a glance"
      actions={
        <Button size="compact" variant="outline" onClick={() => { summary.refetch(); activity.refetch(); }}>
          Refresh
        </Button>
      }
    >
      {summary.isLoading && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-md" />)}
        </div>
      )}

      {summary.isError && (
        <OpsCard><OpsEmpty>Couldn't load the platform figures. Try Refresh.</OpsEmpty></OpsCard>
      )}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Businesses" value={formatNumber(s.companies)} hint={`${s.companies_new_7d} new this week`} />
            <StatTile label="Registered users" value={formatNumber(s.users)} hint={`${s.users_new_7d} new this week`} />
            <StatTile label="Active (7 days)" value={formatNumber(s.active_companies_7d)} hint={`${s.active_companies_30d} in 30 days`} />
            <StatTile label="Trials ending" value={formatNumber(s.trials_ending_7d)} hint="within 7 days" />
            <StatTile label="Orders" value={formatNumber(s.orders)} hint={`${formatNumber(s.orders_7d)} this week`} />
            <StatTile label="Bills raised" value={formatNumber(s.invoices)} />
            <StatTile label="Billed value" value={formatCurrency(Number(s.billed_value))} />
            <StatTile label="Collected" value={formatCurrency(Number(s.collected_value))} />
          </div>

          {s.open_errors_24h > 0 && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formatNumber(s.open_errors_24h)} unresolved error{s.open_errors_24h === 1 ? "" : "s"} in the last 24 hours.{" "}
              <Link to="/ops/health" className="underline underline-offset-2">Open Health</Link>
            </div>
          )}
        </>
      )}

      <OpsCard title="Latest activity" className="mt-5">
        {activity.isLoading && <div className="p-3"><Skeleton className="h-40 w-full rounded-md" /></div>}
        {!activity.isLoading && (activity.data?.length ?? 0) === 0 && (
          <OpsEmpty>Nothing recorded yet.</OpsEmpty>
        )}
        {(activity.data?.length ?? 0) > 0 && (
          <OpsTable head={<tr><Th>When</Th><Th>Business</Th><Th>Person</Th><Th>What happened</Th></tr>}>
            {activity.data!.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(a.created_at)}</Td>
                <Td>{a.company_name || "—"}</Td>
                <Td>{a.user_name || "—"}</Td>
                <Td>{a.summary}</Td>
              </tr>
            ))}
          </OpsTable>
        )}
      </OpsCard>
    </OpsLayout>
  );
}
