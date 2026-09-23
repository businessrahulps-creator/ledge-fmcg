import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { OpsLayout } from "@/components/ops/OpsLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { opsApi } from "./ops-api";
import { OpsCard, OpsTable, Th, Td, OpsEmpty, fmtDate, fmtDateTime } from "./ops-ui";

const PAGE = 25;

export default function OpsBusinesses() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debounced = useDebounce(search, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ops", "companies", debounced, page],
    queryFn: () => opsApi.companies(debounced, PAGE, page * PAGE),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const total = data?.[0]?.total_count ? Number(data[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <OpsLayout title="Businesses" subtitle={total ? `${formatNumber(total)} registered` : "Every workspace on Ledge"}>
      <div className="mb-3 max-w-sm">
        <Input
          placeholder="Search by business name or owner email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      <OpsCard>
        {isLoading && <div className="p-3"><Skeleton className="h-64 w-full rounded-md" /></div>}
        {isError && <OpsEmpty>Couldn't load businesses.</OpsEmpty>}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && <OpsEmpty>No businesses match that search.</OpsEmpty>}
        {(data?.length ?? 0) > 0 && (
          <OpsTable
            head={
              <tr>
                <Th>Business</Th><Th>Owner</Th><Th>Joined</Th><Th right>People</Th>
                <Th right>Orders</Th><Th right>Bills</Th><Th right>Billed</Th>
                <Th right>Outstanding</Th><Th>Last order</Th>
              </tr>
            }
          >
            {data!.map((c) => (
              <tr key={c.id} className="hover:bg-muted/40">
                <Td>
                  <Link to={`/ops/businesses/${c.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    {c.name || "Unnamed"}
                  </Link>
                  {c.trial_ends_at && (
                    <span className="ml-2 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                      trial to {fmtDate(c.trial_ends_at)}
                    </span>
                  )}
                </Td>
                <Td>
                  <span className="block">{c.owner_name || "—"}</span>
                  <span className="block text-[11px] text-muted-foreground">{c.owner_email}</span>
                </Td>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(c.created_at)}</Td>
                <Td right>{formatNumber(Number(c.member_count))}</Td>
                <Td right>{formatNumber(Number(c.order_count))}</Td>
                <Td right>{formatNumber(Number(c.invoice_count))}</Td>
                <Td right>{formatCurrency(Number(c.billed_value))}</Td>
                <Td right>{formatCurrency(Number(c.outstanding))}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(c.last_activity)}</Td>
              </tr>
            ))}
          </OpsTable>
        )}
      </OpsCard>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <Button size="compact" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="compact" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </OpsLayout>
  );
}
