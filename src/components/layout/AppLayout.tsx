import { ReactNode, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { House, IndianRupee, Package, ChartNoAxesCombined, Store, UsersRound, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";

const allMobileNav = [
  { title: "Home", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: IndianRupee },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
  { title: "Dealers", url: "/distributors", icon: Store },
  { title: "Team", url: "/salespersons", icon: UsersRound },
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
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-[72px] items-center overflow-x-hidden border-b border-border bg-card/80 px-3 backdrop-blur-sm md:h-16 md:px-6">
            <SidebarTrigger className="mr-4 hidden md:flex" />
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                <span className="text-xs font-bold text-background">O</span>
              </div>
              <span className="text-base font-bold tracking-tight">Ordra</span>
            </div>
            <div className="ml-auto">
              <NotificationCenter />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 pb-28 md:p-6 md:pb-6">
            <div className="mx-auto max-w-5xl min-w-0 animate-fade-in">
              {children}
            </div>
          </main>

          {/* Swipeable Bottom Nav — mobile only */}
          <nav
            className="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-2xl border border-white/30 bg-white/60 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-[1.8] dark:border-white/10 dark:bg-black/40 md:hidden"
            style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
          >
            <div
              ref={scrollRef}
              className="flex w-full min-w-0 flex-nowrap overflow-x-auto overscroll-x-contain scrollbar-hide"
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
                        className="absolute inset-1 rounded-xl bg-foreground/10 dark:bg-white/15 backdrop-blur-md shadow-[0_0_12px_rgba(0,0,0,0.06)]"
                        transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ willChange: "transform" }}
                      />
                    )}
                    <item.icon
                      className={`w-[18px] h-[18px] relative z-10 transition-all duration-200 ${isActive ? "text-foreground scale-105" : "text-muted-foreground/70"}`}
                      strokeWidth={isActive ? 1.8 : 1.5}
                    />
                    <span className={`text-[10px] relative z-10 transition-all duration-200 whitespace-nowrap ${isActive ? "text-foreground font-bold" : "text-muted-foreground/70 font-semibold"}`}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}

            </div>

            {/* Right fade hint */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/60 dark:from-black/40 to-transparent rounded-r-2xl" />
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}