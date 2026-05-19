import { useState } from "react";
import { DistributorReport } from "@/components/reports/DistributorReport";
import { ProductReport } from "@/components/reports/ProductReport";
import { PaymentReport } from "@/components/reports/PaymentReport";
import { DispatchReport } from "@/components/reports/DispatchReport";
import { SalesTeamReport } from "@/components/reports/SalesTeamReport";
import { cn } from "@/lib/utils";

const REPORTS = [
  { id: "distributors", label: "Dealers", Component: DistributorReport },
  { id: "products", label: "Products", Component: ProductReport },
  { id: "payments", label: "Payments", Component: PaymentReport },
  { id: "dispatch", label: "Dispatch", Component: DispatchReport },
  { id: "salesteam", label: "Sales Team", Component: SalesTeamReport },
] as const;

type ReportId = typeof REPORTS[number]["id"];

interface Props {
  defaultReport?: ReportId;
  onReportChange?: (id: ReportId) => void;
}

export function DrillDownTab({ defaultReport = "distributors", onReportChange }: Props) {
  const [active, setActive] = useState<ReportId>(defaultReport);
  const Active = REPORTS.find((r) => r.id === active)!.Component;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-2">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => { setActive(r.id); onReportChange?.(r.id); }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active === r.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-foreground/70 hover:bg-muted",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div>
        <Active />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
        <p className="mr-auto text-[11px] text-muted-foreground">
          Each report includes its own export controls above. These shortcuts trigger the same actions.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const btn = document.querySelector<HTMLButtonElement>(
              'button[data-export="excel"], button[data-export="xlsx"], button[aria-label*="Excel" i]',
            );
            btn?.click();
          }}
        >
          Download Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const btn = document.querySelector<HTMLButtonElement>(
              'button[data-export="pdf"], button[aria-label*="PDF" i]',
            );
            btn?.click();
          }}
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
}

export type { ReportId };
