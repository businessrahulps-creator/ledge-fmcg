import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { OpsLayout } from "@/components/ops/OpsLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { formatNumber } from "@/utils/formatCurrency";
import { opsApi } from "./ops-api";
import { OpsCard, OpsTable, Th, Td, OpsEmpty, fmtDate, fmtDateTime } from "./ops-ui";

const PAGE = 30;

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Owner",
  sales_manager: "Sales manager",
  accountant: "Accountant",
  salesperson: "Salesperson",
  viewer: "Viewer",
};

export default function OpsPeople() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debounced = useDebounce(search, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ops", "users", debounced, page],
    queryFn: () => opsApi.users(debounced, PAGE, page * PAGE),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const total = data?.[0]?.total_count ? Number(data[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <OpsLayout title="People" subtitle={total ? `${formatNumber(total)} registered users` : "Everyone signed up to Ledge"}>
      <div className="mb-3 max-w-sm">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      <OpsCard>
        {isLoading && <div className="p-3"><Skeleton className="h-64 w-full rounded-md" /></div>}
        {isError && <OpsEmpty>Couldn't load people.</OpsEmpty>}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && <OpsEmpty>Nobody matches that search.</OpsEmpty>}
        {(data?.length ?? 0) > 0 && (
          <OpsTable head={<tr><Th>Name</Th><Th>Email</Th><Th>Business</Th><Th>Role</Th><Th>Signed up</Th><Th>Last seen</Th></tr>}>
            {data!.map((u) => (
              <tr key={u.user_id} className="hover:bg-muted/40">
                <Td>{u.full_name || "—"}</Td>
                <Td className="text-muted-foreground">{u.email || "—"}</Td>
                <Td>
                  {u.company_id ? (
                    <Link to={`/ops/businesses/${u.company_id}`} className="text-primary underline-offset-2 hover:underline">
                      {u.company_name || "Unnamed"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">No business yet</span>
                  )}
                </Td>
                <Td>{ROLE_LABEL[u.role] ?? (u.role || "—")}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(u.created_at)}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(u.updated_at)}</Td>
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
