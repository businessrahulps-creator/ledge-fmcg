import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Building2, Users, HeartPulse, Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/ops", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/ops/businesses", label: "Businesses", icon: Building2, end: false },
  { to: "/ops/people", label: "People", icon: Users, end: false },
  { to: "/ops/health", label: "Health", icon: HeartPulse, end: false },
  { to: "/ops/activity", label: "Activity", icon: Activity, end: false },
];

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Deliberately plain internal shell. Visually distinct from the customer
 * app so an Ops screen is never mistaken for a customer screen, and never
 * linked from anywhere inside the product.
 */
export function OpsLayout({ title, subtitle, actions, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <span className="text-sm font-semibold tracking-tight">Ledge Ops</span>
          <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
            internal
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="compact"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => navigate("/dashboard")}
            >
              <LogOut className="h-4 w-4" />
              Back to app
            </Button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4">
          <ul className="flex items-center gap-1 pb-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
