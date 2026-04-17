import { Skeleton } from "@/components/ui/skeleton";

function GlassSkeleton({ className = "" }: { className?: string }) {
  return <Skeleton className={`bg-muted ${className}`} />;
}

/* ---------- Per-section skeleton atoms ---------- */

export function KpiCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <GlassSkeleton className="h-3 w-16 rounded mb-3" />
      <GlassSkeleton className="h-6 w-24 rounded" />
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <GlassSkeleton className="h-3.5 w-32 rounded" />
        <GlassSkeleton className="h-3.5 w-16 rounded" />
      </div>
      <div className="flex items-center justify-between">
        <GlassSkeleton className="h-2.5 w-40 rounded" />
        <GlassSkeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="px-6 py-4 border-b border-border/50 flex items-center gap-6">
      <GlassSkeleton className="h-3.5 w-24 rounded" />
      <GlassSkeleton className="h-3.5 w-28 rounded" />
      <GlassSkeleton className="h-3.5 w-20 rounded" />
      <GlassSkeleton className="h-3.5 w-16 rounded ml-auto" />
      <GlassSkeleton className="h-5 w-12 rounded-full" />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="hidden md:block glass-card overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "h-48" }: { className?: string }) {
  return <GlassSkeleton className={`w-full rounded-lg ${className}`} />;
}

/* ---------- Legacy full-page skeletons (kept for backward compatibility) ---------- */

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      <div>
        <GlassSkeleton className="h-3 w-32 rounded" />
        <GlassSkeleton className="h-6 w-48 rounded mt-2" />
        <div className="flex gap-2.5 mt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-9 w-9 rounded-full" />
          ))}
        </div>
      </div>
      <KpiGridSkeleton />
      <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col}>
            <div className="flex items-center justify-between mb-3">
              <GlassSkeleton className="h-4 w-24 rounded" />
              <GlassSkeleton className="h-3 w-14 rounded" />
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <GlassSkeleton className="h-3.5 w-28 rounded" />
                    <GlassSkeleton className="h-3 w-16 rounded" />
                  </div>
                  <GlassSkeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <GlassSkeleton className="h-6 w-32 rounded" />
          <GlassSkeleton className="h-3 w-48 rounded mt-1.5" />
        </div>
        <GlassSkeleton className="h-10 w-32 rounded-lg" />
      </div>
      <GlassSkeleton className="h-11 w-full rounded-lg md:max-w-md md:h-12" />
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="glass-card p-4 md:p-6">
            <GlassSkeleton className="h-4 w-28 rounded mb-2" />
            <GlassSkeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <GlassSkeleton className="h-6 w-24 rounded" />
          <GlassSkeleton className="h-3 w-48 rounded mt-1.5" />
        </div>
        <GlassSkeleton className="h-10 w-32 rounded-lg" />
      </div>
      <TableRowsSkeleton rows={rows} />
    </div>
  );
}
