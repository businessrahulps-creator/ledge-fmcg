import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  /** Required. Renders as the page H1 in Playfair Display. */
  title: ReactNode;
  /** Optional supporting line in Inter. */
  subtitle?: ReactNode;
  /** Trailing actions (buttons, menus, badges) right-aligned on desktop. */
  actions?: ReactNode;
  /** Breadcrumb chain shown above the title — links if `to` is provided. */
  breadcrumbs?: Breadcrumb[];
  /** Optional ornament rendered after the title row (e.g. tabs, filters). */
  aside?: ReactNode;
  className?: string;
}

/**
 * The one-and-only page header. Use on every authenticated page so titles,
 * actions, and breadcrumbs stay consistent across the entire product.
 *
 * Composition rules:
 *   <PageHeader
 *     breadcrumbs={[{ label: "Dealers", to: "/distributors" }, { label: "Acme Traders" }]}
 *     title="Acme Traders"
 *     subtitle="₹ 2.4L outstanding · 18 active SKUs"
 *     actions={<Button>New Order</Button>}
 *   />
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  aside,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 md:mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex items-center gap-1 text-[12px] text-muted-foreground/85"
        >
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="rounded-sm px-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && "text-foreground/80")}>{crumb.label}</span>
                )}
                {!isLast && <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="h1-display text-[26px] leading-[1.15] tracking-[-0.01em] text-foreground sm:text-[30px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2 sm:justify-end">{actions}</div>
        )}
      </div>

      {aside && <div className="mt-4">{aside}</div>}
    </header>
  );
}
