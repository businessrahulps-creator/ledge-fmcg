import { Skeleton } from "@/components/ui/skeleton";

function GlassSkeleton({ className = "" }: { className?: string }) {
  return <Skeleton className={`bg-muted ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <GlassSkeleton className="h-3 w-32 rounded" />
        <GlassSkeleton className="h-6 w-48 rounded mt-2" />
        <div className="flex gap-2.5 mt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-9 w-9 rounded-full" />
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <GlassSkeleton className="h-3 w-16 rounded mb-3" />
            <GlassSkeleton className="h-6 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Two columns */}
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

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <GlassSkeleton className="h-4 w-28 rounded" />
          <GlassSkeleton className="h-3 w-14 rounded" />
        </div>
        <div className="space-y-2.5 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <GlassSkeleton className="h-3.5 w-32 rounded" />
                <GlassSkeleton className="h-3.5 w-16 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <GlassSkeleton className="h-2.5 w-40 rounded" />
                <div className="flex gap-1.5">
                  <GlassSkeleton className="h-5 w-12 rounded-full" />
                  <GlassSkeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block glass-card overflow-hidden">
          <div className="px-6 py-3 border-b border-border">
            <GlassSkeleton className="h-3 w-full rounded" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-border/50 flex items-center gap-6">
              <GlassSkeleton className="h-3.5 w-24 rounded" />
              <GlassSkeleton className="h-3.5 w-28 rounded" />
              <GlassSkeleton className="h-3.5 w-20 rounded" />
              <GlassSkeleton className="h-3.5 w-16 rounded ml-auto" />
              <GlassSkeleton className="h-5 w-12 rounded-full" />
              <GlassSkeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
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
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <GlassSkeleton className="h-4 w-28 rounded" />
                <GlassSkeleton className="h-3 w-24 rounded" />
                <GlassSkeleton className="h-3 w-20 rounded" />
              </div>
              <div className="flex gap-1">
                <GlassSkeleton className="h-8 w-8 rounded" />
                <GlassSkeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <GlassSkeleton className="h-3 w-20 rounded" />
              <GlassSkeleton className="h-3 w-16 rounded" />
            </div>
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <GlassSkeleton className="h-11 flex-1 rounded-lg md:h-12" />
        <GlassSkeleton className="h-11 w-full rounded-lg sm:w-44 md:h-12" />
        <GlassSkeleton className="h-11 w-full rounded-lg sm:w-44 md:h-12" />
      </div>
      <div className="glass-card overflow-hidden">
        {/* Mobile */}
        <div className="md:hidden">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="border-b border-border/50 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <GlassSkeleton className="h-3 w-24 rounded" />
                <GlassSkeleton className="h-3 w-16 rounded" />
              </div>
              <GlassSkeleton className="h-2.5 w-40 rounded mt-1" />
              <div className="mt-1.5 flex gap-1.5">
                <GlassSkeleton className="h-5 w-12 rounded-full" />
                <GlassSkeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        {/* Desktop */}
        <div className="hidden md:block">
          <div className="px-6 py-3 border-b border-border">
            <div className="flex gap-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <GlassSkeleton key={i} className="h-3 w-20 rounded" />
              ))}
            </div>
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-border/50 flex items-center gap-6">
              <GlassSkeleton className="h-3.5 w-24 rounded" />
              <GlassSkeleton className="h-3.5 w-20 rounded" />
              <GlassSkeleton className="h-3.5 w-28 rounded" />
              <GlassSkeleton className="h-3.5 w-24 rounded" />
              <GlassSkeleton className="h-3.5 w-16 rounded ml-auto" />
              <GlassSkeleton className="h-5 w-12 rounded-full" />
              <GlassSkeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
