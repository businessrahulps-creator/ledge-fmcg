import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  House,
  IndianRupee,
  UserRound,
  Package,
  ChartNoAxesCombined,
  Settings,
  UserCheck,
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
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const overviewNav = [
  { title: "Dashboard", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: IndianRupee },
];

const manageNav = [
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Dealers", url: "/distributors", icon: UserRound },
  { title: "Sales Team", url: "/salespersons", icon: UserCheck },
];

const analyzeNav = [
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
];

const bottomNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { companyId } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("companies")
      .select("logo_url")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
      });

    const channel = supabase
      .channel("company-logo")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "companies", filter: `id=eq.${companyId}` },
        (payload) => {
          if (payload.new && typeof (payload.new as any).logo_url === "string") {
            setLogoUrl((payload.new as any).logo_url);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  const renderNavItem = (item: { title: string; url: string; icon: React.ElementType }) => {
    const isActive = location.pathname.startsWith(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive}>
          <NavLink
            to={item.url}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent" : ""}`}
            activeClassName="text-foreground"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-card">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Company logo" className="h-7 w-7 rounded-md object-cover shrink-0" />
          ) : (
            collapsed ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                L
              </span>
            ) : null
          )}
          {!collapsed && (
            <span className="font-heading font-extrabold text-xl tracking-[-0.04em] text-foreground">Ledge</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Overview section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">Overview</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Manage section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">Manage</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {manageNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analyze section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">Analyze</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyzeNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          {bottomNav.map((item) => {
            const isActive = location.pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent" : ""}`}
                    activeClassName="text-foreground"
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}