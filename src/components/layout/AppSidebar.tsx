import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollEdges } from "@/hooks/use-scroll-edges";
import {
  House,
  ClipboardList,
  UserRound,
  Package,
  ChartNoAxesCombined,
  TrendingUp,
  Settings,
  UserCheck,
  Gift,
  Target,
  RotateCcw,
  FileText,
  Landmark,
  BookOpen,
  History,
  AlertTriangle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NavLink } from "@/components/NavLink";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAuth } from "@/context/AuthContext";
import { ActivityLog } from "@/components/layout/ActivityLog";
import { PRETTY_VERSION, SHORT_VERSION } from "@/lib/app-version";
import ledgeLogo from "@/assets/ledge-logo.webp";
import ledgeMark from "@/assets/ledge-mark.webp";

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  onClick?: () => void;
};

const workNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Billing", url: "/billing", icon: FileText },
  { title: "Returns", url: "/claims", icon: RotateCcw },
];

const catalogNav: NavItem[] = [
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Schemes", url: "/schemes", icon: Gift },
  { title: "Targets", url: "/targets", icon: Target },
];

const relationshipsNav: NavItem[] = [
  { title: "Dealers", url: "/distributors", icon: UserRound },
  { title: "Sales Team", url: "/salespersons", icon: UserCheck },
  { title: "Company", url: "/company", icon: Landmark },
];

const footerNav: NavItem[] = [
  { title: "Help", url: "/help", icon: BookOpen },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { companyIncomplete } = useOnboarding();
  const { userRole } = useAuth();
  const [activityOpen, setActivityOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [markLoaded, setMarkLoaded] = useState(false);

  // Insights group — Activity is a button (opens drawer), the rest are routes.
  const insightsNav: NavItem[] = [
    { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
    { title: "Performance", url: "/performance", icon: TrendingUp },
    { title: "Activity", url: "/activity", icon: History, onClick: () => setActivityOpen(true) },
  ];

  const effectiveFooter: NavItem[] = userRole === "super_admin"
    ? [{ title: "Errors", url: "/admin/errors", icon: AlertTriangle }, ...footerNav]
    : footerNav;

  const renderItem = (item: NavItem) => {
    const isActive = item.onClick ? false : location.pathname.startsWith(item.url);
    const Icon = item.icon;

    if (collapsed) {
      const inner = (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
            isActive ? "bg-primary/10 text-primary" : "text-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground"
          }`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2 : 1.7} />
        </div>
      );
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild={!item.onClick} onClick={item.onClick}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                {item.onClick ? (
                  <button type="button" className="flex items-center justify-center py-1.5" aria-label={item.title}>
                    {inner}
                  </button>
                ) : (
                  <NavLink to={item.url} className="flex items-center justify-center py-1.5" activeClassName="">
                    {inner}
                  </NavLink>
                )}
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="text-xs">
                {item.title}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    const rowClass = `relative flex items-center gap-3 rounded-md px-3 h-9 text-sm transition-colors hover:bg-sidebar-accent/60 ${
      isActive ? "bg-primary/[0.06] font-semibold text-primary" : "font-medium text-foreground/75"
    }`;
    const iconEl = (
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-primary" : "text-foreground/55"}`}
        strokeWidth={isActive ? 2 : 1.7}
      />
    );
    const labelEl = <span className="tracking-[-0.005em]">{item.title}</span>;
    const activeBar = isActive ? (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-primary" />
    ) : null;
    const onboardingDot = companyIncomplete && item.url === "/company" ? (
      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" aria-hidden />
    ) : null;

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild={!item.onClick} isActive={isActive} onClick={item.onClick}>
          {item.onClick ? (
            <button type="button" className={rowClass}>
              {activeBar}
              {iconEl}
              {labelEl}
            </button>
          ) : (
            <NavLink to={item.url} className={rowClass} activeClassName="text-primary">
              {activeBar}
              {iconEl}
              {labelEl}
              {onboardingDot}
            </NavLink>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderGroup = (label: string, items: NavItem[], showDivider: boolean) => (
    <SidebarGroup className={showDivider ? "border-t border-border/40 mt-1 pt-1" : ""}>
      {!collapsed && (
        <SidebarGroupLabel className="px-3 mt-0.5 mb-0.5 text-[11px] font-medium tracking-normal normal-case text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  // Track scroll edges so we can render fade affordances ("there's more here").
  const { ref: scrollRef, showTopFade, showBottomFade } = useScrollEdges<HTMLDivElement>([collapsed, userRole]);

  // Auto-scroll the active row into view on route change so users never land
  // on a page whose nav item is hidden below the fold.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Defer one frame so the new active class has been applied.
    const id = requestAnimationFrame(() => {
      const active = el.querySelector<HTMLElement>('[data-active="true"]');
      if (active) active.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-card">
        <SidebarHeader className="p-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            {collapsed ? (
              <div className="relative h-7 w-7 shrink-0">
                {!markLoaded && (
                  <Skeleton className="absolute inset-0 rounded-md bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
                <img
                  src={ledgeMark}
                  alt="Ledge"
                  width={28}
                  height={28}
                  className={`h-7 w-7 object-contain transition-opacity duration-200 ${logoLoaded || markLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setMarkLoaded(true)}
                />
              </div>
            ) : (
              <div className="relative h-7 w-[96px]">
                {!logoLoaded && (
                  <Skeleton className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/20 to-accent/20" />
                )}
                <img
                  src={ledgeLogo}
                  alt="Ledge"
                  height={28}
                  className={`h-7 w-auto object-contain transition-opacity duration-200 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setLogoLoaded(true)}
                />
              </div>
            )}
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {renderGroup("Work", workNav, false)}
          {renderGroup("Catalog", catalogNav, true)}
          {renderGroup("Relationships", relationshipsNav, true)}
          {renderGroup("Insights", insightsNav, true)}
        </SidebarContent>

        <SidebarFooter className="px-2 pb-4 border-t border-border/40 pt-2">
          <SidebarMenu>{effectiveFooter.map(renderItem)}</SidebarMenu>

          <Link
            to="/settings"
            className="mt-3 block text-center text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            aria-label="App version — open Settings"
            title={PRETTY_VERSION}
          >
            {collapsed ? (
              <span className="text-[9px] tracking-tight num">{SHORT_VERSION}</span>
            ) : (
              <span className="text-[10px] num">{PRETTY_VERSION}</span>
            )}
          </Link>
        </SidebarFooter>

        <ActivityLog open={activityOpen} onOpenChange={setActivityOpen} />
      </Sidebar>
    </TooltipProvider>
  );
}
