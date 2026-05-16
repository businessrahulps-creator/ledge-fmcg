import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { NavLink } from "@/components/NavLink";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAuth } from "@/context/AuthContext";
import { ActivityLog } from "@/components/layout/ActivityLog";
import { PRETTY_VERSION, SHORT_VERSION } from "@/lib/app-version";
import ledgeLogo from "@/assets/ledge-logo.webp";
import ledgeMark from "@/assets/ledge-mark.webp";

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
  const { userRole } = useAuth();
  const [activityOpen, setActivityOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [markLoaded, setMarkLoaded] = useState(false);

  const effectiveBottomNav = userRole === "super_admin"
    ? [{ title: "Errors", url: "/admin/errors", icon: AlertTriangle }, ...bottomNav]
    : bottomNav;

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
            className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/70 ${isActive ? "font-semibold text-primary" : "font-medium text-foreground/75"}`}
            activeClassName="text-primary"
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-primary" />
            )}
            <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-primary" : "text-foreground/55"}`} strokeWidth={isActive ? 2 : 1.7} />
            {companyIncomplete && item.url === "/company" && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            )}
            <span className="tracking-[-0.005em]">{item.title}</span>
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
        {/* Overview section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55 px-3 mt-3 mb-1">Home</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Manage section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55 px-3 mt-3 mb-1">Manage</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {manageNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Accounting section */}



        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55 px-3 mt-3 mb-1">Analyze</SidebarGroupLabel>}
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

          {effectiveBottomNav.map((item) => {
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
                    className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/70 ${isActive ? "font-semibold text-primary" : "font-medium text-foreground/75"}`}
                    activeClassName="text-primary"
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-primary" />
                    )}
                    <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-primary" : "text-foreground/55"}`} strokeWidth={isActive ? 2 : 1.7} />
                    <span className="tracking-[-0.005em]">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

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
  );
}