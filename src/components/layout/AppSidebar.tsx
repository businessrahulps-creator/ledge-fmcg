import { useLocation, Link } from "react-router-dom";
import {
  House,
  Receipt,
  UserRound,
  Package,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  UserCheck,
  Box,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { stockItems, getStockHealth } from "@/data/godown-data";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: Receipt },
];

const godownSubNav = [
  { title: "Overview", url: "/godown" },
  { title: "Inventory", url: "/godown/inventory" },
  { title: "Alerts", url: "/godown/alerts" },
];

const mainNavAfter = [
  { title: "Distributors", url: "/distributors", icon: UserRound },
  { title: "Products", url: "/products", icon: Package },
  { title: "Salespersons", url: "/salespersons", icon: UserCheck },
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
];

const bottomNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isGodownActive = location.pathname.startsWith("/godown");
  const [godownOpen, setGodownOpen] = useState(isGodownActive);

  const alertCount = stockItems.filter(si => getStockHealth(si.quantity, si.threshold) !== "healthy").length;

  const renderNavItem = (item: { title: string; url: string; icon: React.ElementType }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
        <NavLink
          to={item.url}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
          activeClassName="bg-sidebar-accent text-primary font-medium"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-card">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-sm font-bold text-background">O</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Ordra</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(renderNavItem)}

              {/* Godown with sub-nav */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isGodownActive}
                  onClick={() => setGodownOpen(!godownOpen)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent w-full"
                >
                  <div className="relative">
                    <Box className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                    {alertCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning animate-pulse" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Godown</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${godownOpen ? "rotate-180" : ""}`} />
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {godownOpen && !collapsed && godownSubNav.map(sub => (
                <SidebarMenuItem key={sub.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === sub.url}>
                    <NavLink
                      to={sub.url}
                      className="flex items-center gap-3 rounded-lg py-2 pl-11 pr-3 text-sm transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <span>{sub.title}</span>
                      {sub.url === "/godown/alerts" && alertCount > 0 && (
                        <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning/20 px-1.5 text-[10px] font-bold text-warning">
                          {alertCount}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {mainNavAfter.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          {bottomNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-primary font-medium"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                to="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                {!collapsed && <span>Log out</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
