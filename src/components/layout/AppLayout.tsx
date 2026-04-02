import { ReactNode, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { House, Receipt, Package, ChartNoAxesCombined, UserRound, UserCheck, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";

const allMobileNav = [
  { title: "Home", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: Receipt },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
  { title: "Dealers", url: "/distributors", icon: UserRound },
  { title: "Sales", url: "/salespersons", icon: UserCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-12 items-center border-b border-border bg-card/80 px-3 backdrop-blur-sm md:h-14 md:px-6">
            <SidebarTrigger className="mr-4 hidden md:flex" />
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                <span className="text-xs font-bold text-background">O</span>
              </div>
              <span className="text-base font-bold tracking-tight">Ordra</span>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-3 py-4 pb-28 md:p-6 md:pb-6">
            <div className="mx-auto max-w-5xl animate-fade-in">
              {children}
            </div>
          </main>

          {/* Swipeable Bottom Nav — mobile only */}
          <nav
            className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-2xl backdrop-saturate-[1.8] border border-white/30 dark:border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] md:hidden overflow-hidden"
            style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
          >
            <div
              ref={scrollRef}
              className="flex flex-nowrap overflow-x-auto scrollbar-hide"
            >
              {allMobileNav.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    data-active={isActive}
                    className="flex flex-col items-center gap-0.5 py-3 px-3 relative flex-shrink-0 min-w-[60px]"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-1 rounded-xl bg-muted"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={`w-[18px] h-[18px] relative z-10 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                      strokeWidth={isActive ? 1.8 : 1.5}
                    />
                    <span className={`text-[10px] font-semibold relative z-10 transition-colors whitespace-nowrap ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}

              <Link
                to="/"
                className="flex flex-col items-center gap-0.5 py-3 px-3 relative flex-shrink-0 min-w-[60px]"
              >
                <LogOut
                  className="w-[18px] h-[18px] relative z-10 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-[10px] font-semibold relative z-10 text-muted-foreground whitespace-nowrap">
                  Logout
                </span>
              </Link>
            </div>

            {/* Right fade hint */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent rounded-r-2xl" />
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}