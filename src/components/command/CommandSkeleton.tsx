import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return <Skeleton className="w-full rounded-md" style={{ height }} />;
}

export function ChartSkeleton() {
  return <Skeleton className="h-64 w-full rounded-md" />;
}

export function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-md" />
      ))}
    </div>
  );
}
