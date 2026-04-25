import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
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
import { NavLink } from "@/components/NavLink";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ActivityLog } from "@/components/layout/ActivityLog";
import { PRETTY_VERSION, SHORT_VERSION } from "@/lib/app-version";

const overviewNav = [
  { title: "Dashboard", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Billing", url: "/billing", icon: FileText },
];

const manageNav = [
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Dealers", url: "/distributors", icon: UserRound },
  { title: "Sales Team", url: "/salespersons", icon: UserCheck },
  { title: "Schemes", url: "/schemes", icon: Gift },
  { title: "Targets", url: "/targets", icon: Target },
  { title: "Returns", url: "/claims", icon: RotateCcw },
  { title: "Company", url: "/company", icon: Landmark },
];

const analyzeNav = [
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
  { title: "Performance", url: "/performance", icon: TrendingUp },
];

const bottomNav = [
  { title: "Help", url: "/help", icon: BookOpen },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { companyIncomplete } = useOnboarding();
  const [activityOpen, setActivityOpen] = useState(false);

  const renderNavItem = (item: { title: string; url: string; icon: React.ElementType }) => {
    const isActive = location.pathname.startsWith(item.url);

    if (collapsed) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive}>
            <NavLink
              to={item.url}
              className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors"
              activeClassName="text-foreground"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-primary/10 text-primary" : "hover:bg-sidebar-accent/50"}`}>
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-medium leading-tight text-muted-foreground truncate max-w-[56px]">
                {item.title}
              </span>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive}>
          <NavLink
            to={item.url}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent ${isActive ? "bg-primary/[0.06] font-semibold text-primary" : "font-medium text-foreground/80"}`}
            activeClassName="text-primary"
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
            )}
            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            {companyIncomplete && item.url === "/company" && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            )}
            <span>{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-card">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          {collapsed ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
              L
            </span>
          ) : (
            <span className="brand-gradient-text font-heading font-extrabold text-xl tracking-[-0.04em]">Ledge</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Overview section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80 px-3 mb-1">Home</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Manage section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80 px-3 mb-1">Manage</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {manageNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Accounting section */}



        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80 px-3 mb-1">Analyze</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyzeNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          {/* Activity Log button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActivityOpen(true)}
              className={collapsed
                ? "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors"
                : "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-sidebar-accent transition-colors"
              }
            >
              {collapsed ? (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-sidebar-accent/50">
                    <History className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-muted-foreground truncate max-w-[56px]">
                    Activity
                  </span>
                </>
              ) : (
                <>
                  <History className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  <span>Activity</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>

          {bottomNav.map((item) => {
            const isActive = location.pathname.startsWith(item.url);
            if (collapsed) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors"
                      activeClassName="text-foreground"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-primary/10 text-primary" : "hover:bg-sidebar-accent/50"}`}>
                        <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                      </div>
                      <span className="text-[10px] font-medium leading-tight text-muted-foreground truncate max-w-[56px]">
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent ${isActive ? "bg-primary/[0.06] font-semibold text-primary" : "font-medium text-foreground/80"}`}
                    activeClassName="text-primary"
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
                    )}
                    <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <Link
          to="/settings"
          className="mt-3 block text-center font-mono text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          aria-label="App version — open Settings"
          title={PRETTY_VERSION}
        >
          {collapsed ? (
            <span className="text-[9px] tracking-tight">{SHORT_VERSION}</span>
          ) : (
            <span className="text-[10px]">{PRETTY_VERSION}</span>
          )}
        </Link>
      </SidebarFooter>

      <ActivityLog open={activityOpen} onOpenChange={setActivityOpen} />
    </Sidebar>
  );
}