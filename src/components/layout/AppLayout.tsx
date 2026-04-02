import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Users, Warehouse, BarChart3 } from "lucide-react";

const mobileNav = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Godown", url: "/godown", icon: Warehouse },
  { title: "Distributors", url: "/distributors", icon: Users },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center border-b border-border bg-background/80 px-3 backdrop-blur-sm md:h-14 md:px-6">
            <SidebarTrigger className="mr-4 hidden md:flex" />
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">O</span>
              </div>
              <span className="text-base font-bold tracking-tight">Ordra</span>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-3 py-4 pb-28 md:p-6 md:pb-6">
            <div className="mx-auto max-w-7xl animate-fade-in">
              {children}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            {mobileNav.map((item) => {
              const isActive = location.pathname.startsWith(item.url);
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[11px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-6 w-6" strokeWidth={1.5} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}
