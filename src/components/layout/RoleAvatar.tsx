import { lazy, Suspense } from "react";
import { Crown, ChartNoAxesCombined, Wallet, ShoppingBag, Eye, type LucideIcon } from "lucide-react";

const OwnerBot = lazy(() => import("./OwnerBot"));

interface RoleStyle { label: string; tile: string; Icon: LucideIcon }

/** One home for how each access level looks (label, colour, tiny icon). */
export const ROLE_STYLES: Record<string, RoleStyle> = {
  super_admin: { label: "Owner (Super Admin)", tile: "bg-primary text-primary-foreground", Icon: Crown },
  sales_manager: { label: "Sales manager", tile: "bg-success text-success-foreground", Icon: ChartNoAxesCombined },
  accountant: { label: "Accountant", tile: "bg-warning text-warning-foreground", Icon: Wallet },
  salesperson: { label: "Salesperson", tile: "bg-muted-foreground text-primary-foreground", Icon: ShoppingBag },
  viewer: { label: "Viewer", tile: "bg-muted text-foreground border border-border", Icon: Eye },
};

export function roleStyle(role: string | null | undefined): RoleStyle {
  return (role && ROLE_STYLES[role]) || ROLE_STYLES.viewer;
}

export function RoleAvatar({ role, name, size = "sm" }: { role: string | null | undefined; name: string; size?: "sm" | "md" }) {
  if (role === "super_admin") {
    const px = size === "md" ? 44 : 32;
    return (
      <span className="inline-flex shrink-0 items-center justify-center" style={{ width: px, height: px }} aria-hidden>
        <Suspense fallback={<InitialAvatar role={role} name={name} size={size} />}>
          <OwnerBot size={px} />
        </Suspense>
      </span>
    );
  }
  return <InitialAvatar role={role} name={name} size={size} />;
}

function InitialAvatar({ role, name, size = "sm" }: { role: string | null | undefined; name: string; size?: "sm" | "md" }) {
  const s = roleStyle(role);
  const box = size === "md" ? "h-11 w-11 text-[15px]" : "h-8 w-8 text-[13px]";
  const badge = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const icon = size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${box} ${s.tile}`} aria-hidden>
      {initial}
      <span className={`absolute -bottom-0.5 -left-0.5 inline-flex items-center justify-center rounded-full bg-card text-foreground ring-2 ring-card ${badge}`}>
        <s.Icon className={icon} strokeWidth={2.2} />
      </span>
    </span>
  );
}
