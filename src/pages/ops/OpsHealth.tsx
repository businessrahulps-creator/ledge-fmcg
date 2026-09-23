import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { OpsLayout } from "@/components/ops/OpsLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { opsApi } from "./ops-api";
import { OpsCard, OpsTable, Th, Td, OpsEmpty, fmtDateTime } from "./ops-ui";

const TONE: Record<string, string> = {
  error: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-warning",
  info: "bg-muted text-muted-foreground",
};

export default function OpsHealth() {
  const [onlyOpen, setOnlyOpen] = useState(true);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ops", "errors", onlyOpen],
    queryFn: () => opsApi.errors(150, onlyOpen),
    staleTime: 30_000,
  });

  return (
    <OpsLayout
      title="Health"
      subtitle="Errors reported by every business, newest first"
      actions={
        <div className="flex gap-2">
          <Button size="compact" variant={onlyOpen ? "default" : "outline"} onClick={() => setOnlyOpen(true)}>Unresolved</Button>
          <Button size="compact" variant={onlyOpen ? "outline" : "default"} onClick={() => setOnlyOpen(false)}>All</Button>
          <Button size="compact" variant="outline" onClick={() => refetch()}>Refresh</Button>
        </div>
      }
    >
      <OpsCard>
        {isLoading && <div className="p-3"><Skeleton className="h-64 w-full rounded-md" /></div>}
        {isError && <OpsEmpty>Couldn't load the error log.</OpsEmpty>}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && (
          <OpsEmpty>Nothing to look at — no {onlyOpen ? "unresolved " : ""}errors reported.</OpsEmpty>
        )}
        {(data?.length ?? 0) > 0 && (
          <OpsTable head={<tr><Th>When</Th><Th>Severity</Th><Th>Business</Th><Th>Person</Th><Th>Where</Th><Th>Message</Th></tr>}>
            {data!.map((e) => (
              <tr key={e.id} className={cn(!e.resolved && "bg-destructive/[0.03]")}>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDateTime(e.created_at)}</Td>
                <Td>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", TONE[e.severity] ?? TONE.info)}>
                    {e.severity}
                  </span>
                </Td>
                <Td>
                  {e.company_id ? (
                    <Link to={`/ops/businesses/${e.company_id}`} className="text-primary underline-offset-2 hover:underline">
                      {e.company_name || "Unnamed"}
                    </Link>
                  ) : "—"}
                </Td>
                <Td className="text-muted-foreground">{e.user_email || "—"}</Td>
                <Td className="font-mono text-[11px]">{e.source}</Td>
                <Td className="max-w-[420px] break-words">{e.message}</Td>
              </tr>
            ))}
          </OpsTable>
        )}
      </OpsCard>
    </OpsLayout>
  );
}
