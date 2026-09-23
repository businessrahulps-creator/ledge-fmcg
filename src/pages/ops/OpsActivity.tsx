import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { OpsLayout } from "@/components/ops/OpsLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { opsApi } from "./ops-api";
import { OpsCard, OpsTable, Th, Td, OpsEmpty, fmtDateTime } from "./ops-ui";

export default function OpsActivity() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ops", "activity", 150],
    queryFn: () => opsApi.activity(150),
    staleTime: 30_000,
  });

  return (
    <OpsLayout
      title="Activity"
      subtitle="What every business is doing on Ledge right now"
      actions={<Button size="compact" variant="outline" onClick={() => refetch()}>Refresh</Button>}
    >
      <OpsCard>
        {isLoading && <div className="p-3"><Skeleton className="h-64 w-full rounded-md" /></div>}
        {isError && <OpsEmpty>Couldn't load activity.</OpsEmpty>}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && <OpsEmpty>Nothing recorded yet.</OpsEmpty>}
        {(data?.length ?? 0) > 0 && (
          <OpsTable head={<tr><Th>When</Th><Th>Business</Th><Th>Person</Th><Th>Type</Th><Th>What happened</Th></tr>}>
            {data!.map((a) => (
              <tr key={a.id} className="hover:bg-muted/40">
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(a.created_at)}</Td>
                <Td>
                  {a.company_id ? (
                    <Link to={`/ops/businesses/${a.company_id}`} className="text-primary underline-offset-2 hover:underline">
                      {a.company_name || "Unnamed"}
                    </Link>
                  ) : "—"}
                </Td>
                <Td>{a.user_name || "—"}</Td>
                <Td className="text-muted-foreground">{a.entity_type}</Td>
                <Td>{a.summary}</Td>
              </tr>
            ))}
          </OpsTable>
        )}
      </OpsCard>
    </OpsLayout>
  );
}
