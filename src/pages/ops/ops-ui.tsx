import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-card p-3 shadow-depth-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function OpsCard({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-border/70 bg-card shadow-depth-2", className)}>
      {title && (
        <div className="border-b border-border/60 px-3 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

export function OpsTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
          {head}
        </thead>
        <tbody className="divide-y divide-border/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th className={cn("px-3 py-2 font-medium", right ? "text-right" : "text-left")}>{children}</th>
  );
}

export function Td({ children, right, className }: { children: ReactNode; right?: boolean; className?: string }) {
  return (
    <td className={cn("px-3 py-2 align-top", right && "text-right tabular-nums", className)}>{children}</td>
  );
}

export function OpsEmpty({ children }: { children: ReactNode }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
