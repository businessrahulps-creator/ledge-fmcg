import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { House, IndianRupee, Package, ChartNoAxesCombined, MoreHorizontal, Store, UsersRound, Settings, WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";
import { LiveClock } from "./LiveClock";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getQueue } from "@/lib/offline-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryMobileNav = [
  { title: "Home", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: IndianRupee },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
];

const moreItems = [
  { title: "Dealers", url: "/distributors", icon: Store },
  { title: "Team", url: "/salespersons", icon: UsersRound },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const location = useLocation();
  const online = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const q = await getQueue();
    setPendingCount(q.length);
  }, []);

  // Poll pending count every 2s when offline
  useEffect(() => {
    refreshPendingCount();
    if (!online) {
      const id = setInterval(refreshPendingCount, 2000);
      return () => clearInterval(id);
    } else if (pendingCount > 0) {
      setSyncing(true);
      const timeout = setTimeout(() => {
        setSyncing(false);
        setPendingCount(0);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [online, refreshPendingCount]);

  const isMoreActive = moreItems.some((item) => location.pathname.startsWith(item.url));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center overflow-x-hidden border-b border-border/40 bg-card/90 px-3 backdrop-blur-xl md:h-16 md:px-6">
            <SidebarTrigger className="mr-4 hidden md:flex" />
            <div className="flex items-center md:hidden">
              <span className="font-heading font-extrabold text-lg tracking-[-0.04em] text-foreground">Ledge</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <LiveClock />
              {userRole && (
                <Badge variant="secondary" className="hidden text-[10px] capitalize sm:inline-flex">
                  {userRole.replace("_", " ")}
                </Badge>
              )}
              <NotificationCenter />
            </div>
          </header>

          <AnimatePresence>
            {(!online || syncing) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-center gap-1.5 py-1 text-center text-xs ${
                  syncing
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing changes…
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Offline — using cached data
                    {pendingCount > 0 && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold">
                        {pendingCount} pending
                      </span>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 pb-28 md:p-6 md:pb-6">
            <div className="mx-auto max-w-5xl min-w-0 animate-fade-in">
              {children}
            </div>
          </main>

          {/* Bottom Nav — mobile only — 5 items max */}
          <nav
            className="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-2xl border border-border/30 bg-background/60 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-[1.8] dark:border-border/20 dark:bg-background/40 md:hidden"
            style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex w-full items-center justify-around">
              {primaryMobileNav.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    aria-current={isActive ? "page" : undefined}
                    className="relative flex flex-col items-center gap-0.5 px-3 py-3 transition-transform active:scale-90"
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
                      className={`relative z-10 h-5 w-5 transition-all duration-200 ${isActive ? "text-foreground scale-105" : "text-muted-foreground/70"}`}
                      strokeWidth={isActive ? 1.8 : 1.5}
                    />
                    <span className={`relative z-10 text-[10px] transition-all duration-200 whitespace-nowrap ${isActive ? "text-foreground font-bold" : "text-muted-foreground/70 font-semibold"}`}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative flex flex-col items-center gap-0.5 px-3 py-3 transition-transform active:scale-90"
                    aria-label="More navigation options"
                  >
                    {isMoreActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-1 rounded-xl bg-foreground/10 dark:bg-white/15 backdrop-blur-md shadow-[0_0_12px_rgba(0,0,0,0.06)]"
                        transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ willChange: "transform" }}
                      />
                    )}
                    <MoreHorizontal
                      className={`relative z-10 h-5 w-5 transition-all duration-200 ${isMoreActive ? "text-foreground scale-105" : "text-muted-foreground/70"}`}
                      strokeWidth={isMoreActive ? 1.8 : 1.5}
                    />
                    <span className={`relative z-10 text-[10px] transition-all duration-200 whitespace-nowrap ${isMoreActive ? "text-foreground font-bold" : "text-muted-foreground/70 font-semibold"}`}>
                      More
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="mb-2 min-w-[160px]">
                  {moreItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link to={item.url} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4" strokeWidth={1.5} />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}
