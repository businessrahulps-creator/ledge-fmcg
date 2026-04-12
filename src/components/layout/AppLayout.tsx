import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { House, ClipboardList, Package, BarChart3, MoreHorizontal, Store, UsersRound, Settings, WifiOff, RefreshCw, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";
import { LiveClock } from "./LiveClock";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

import { Receipt, RotateCcw, Target, Tags } from "lucide-react";
import { getQueue } from "@/lib/offline-store";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const primaryMobileNav = [
  { title: "Home", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Performance", url: "/performance", icon: TrendingUp },
];

const moreGroups = [
  {
    label: "Manage",
    items: [
      { title: "Dealers", url: "/distributors", icon: Store },
      { title: "Team", url: "/salespersons", icon: UsersRound },
      { title: "Schemes", url: "/schemes", icon: Tags },
      { title: "Targets", url: "/targets", icon: Target },
    ],
  },
  {
    label: "Analyze",
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Billing", url: "/billing", icon: Receipt },
      { title: "Claims", url: "/claims", icon: RotateCcw },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

const allMoreItems = moreGroups.flatMap((g) => g.items);

export function AppLayout({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const location = useLocation();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const { canInstall, isIOS, isStandalone, dismissed, permanentlyDismissed, triggerInstall, dismissForever } = useInstallPrompt();
  const showDesktopInstall = canInstall && !isStandalone && !dismissed && !permanentlyDismissed;
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

  const isMoreActive = allMoreItems.some((item) => location.pathname.startsWith(item.url));
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center overflow-x-hidden border-b border-border/40 bg-card/90 px-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl md:h-16 md:px-6">
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
              {/* Desktop Install App button */}
              {showDesktopInstall && (
                <div className="hidden md:block">
                  {isIOS ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" />
                          Install App
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-4" align="end">
                        <p className="text-sm font-semibold mb-2">Install Ledge App</p>
                        <p className="text-xs text-muted-foreground mb-3">Fast offline access to orders, stock, and reports — even in godowns.</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                              <Share className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span>Tap <strong className="text-foreground">Share</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                              <Plus className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span>Select <strong className="text-foreground">Add to Home Screen</strong></span>
                          </div>
                        </div>
                        <button onClick={dismissForever} className="mt-3 text-[11px] text-muted-foreground/60 hover:text-muted-foreground">
                          Don't show again
                        </button>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={triggerInstall}>
                      <Download className="h-3.5 w-3.5" />
                      Install App
                    </Button>
                  )}
                </div>
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
            <div className="mx-auto max-w-5xl min-w-0">
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
                      className={`relative z-10 h-[22px] w-[22px] transition-all duration-200 ${isActive ? "text-foreground scale-105" : "text-muted-foreground/70"}`}
                      strokeWidth={isActive ? 1.8 : 1.5}
                    />
                    <span className={`relative z-10 text-[11px] transition-all duration-200 whitespace-nowrap ${isActive ? "text-foreground font-bold" : "text-muted-foreground/70 font-semibold"}`}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}

              {/* More menu — Sheet drawer */}
              <button
                onClick={() => setMoreOpen(true)}
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
                  className={`relative z-10 h-[22px] w-[22px] transition-all duration-200 ${isMoreActive ? "text-foreground scale-105" : "text-muted-foreground/70"}`}
                  strokeWidth={isMoreActive ? 1.8 : 1.5}
                />
                <span className={`relative z-10 text-[11px] transition-all duration-200 whitespace-nowrap ${isMoreActive ? "text-foreground font-bold" : "text-muted-foreground/70 font-semibold"}`}>
                  More
                </span>
              </button>

              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent side="bottom" className="rounded-t-[20px] pb-10 px-5 max-h-[70vh]">
                  <SheetHeader className="pb-2">
                    <SheetTitle className="text-base">More</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-5">
                    {moreGroups.map((group) => (
                      <div key={group.label}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-1">
                          {group.label}
                        </p>
                        <div className="grid grid-cols-4 gap-1">
                          {group.items.map((item) => {
                            const active = location.pathname.startsWith(item.url);
                            return (
                              <Link
                                key={item.title}
                                to={item.url}
                                onClick={() => setMoreOpen(false)}
                                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition-colors active:scale-95 ${
                                  active
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50"
                                }`}
                              >
                                <item.icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                                <span className={`text-[11px] ${active ? "font-bold" : "font-medium"}`}>
                                  {item.title}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}
