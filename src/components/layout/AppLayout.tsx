import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { House, ClipboardList, Package, MoreHorizontal, Settings, WifiOff, RefreshCw, TrendingUp, UserRound, UserCheck, Gift, ChartNoAxesCombined, FileText, Landmark, BookOpen, History, Wallet } from "lucide-react";
import { useData } from "@/context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";
import { RefreshAppButton } from "./RefreshAppButton";
import { LiveClock } from "./LiveClock";
import { ActivityLog } from "./ActivityLog";
import { useAuth } from "@/context/AuthContext";
import ledgeLogoAsset from "@/assets/ledge-logo.webp";
import { TopProgress } from "@/components/ui/top-progress";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";


import { RotateCcw, Target } from "lucide-react";
import { getQueue, OFFLINE_MODE_ENABLED } from "@/lib/offline-store";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ChevronRight } from "lucide-react";

const primaryMobileNav = [
  { title: "Home", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Insights", url: "/reports", icon: ChartNoAxesCombined },
];

const moreGroups = [
  {
    label: "Work",
    items: [
      { title: "Money to Collect", url: "/billing", icon: Wallet },
      { title: "Returns", url: "/claims", icon: RotateCcw },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Schemes", url: "/schemes", icon: Gift },
      { title: "Targets", url: "/targets", icon: Target },
    ],
  },
  {
    label: "Relationships",
    items: [
      { title: "Dealers", url: "/distributors", icon: UserRound },
      { title: "Sales Team", url: "/salespersons", icon: UserCheck },
      { title: "Company", url: "/company", icon: Landmark },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Performance", url: "/performance", icon: TrendingUp },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

const allMoreItems = moreGroups.flatMap((g) => g.items);

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders",
  "/billing": "Money to Collect",
  "/stock": "Stock",
  "/distributors": "Dealers",
  "/salespersons": "Sales Team",
  "/schemes": "Schemes",
  "/targets": "Targets",
  "/claims": "Returns",
  "/company": "Company",
  "/reports": "Reports",
  "/performance": "Performance",
  "/help": "Help",
  "/settings": "Settings",
};

function PageTitle() {
  const location = useLocation();
  const match = Object.keys(ROUTE_TITLES).find((p) => location.pathname.startsWith(p));
  if (!match) return null;
  return (
    <span className="inline-flex items-center text-sm font-medium text-foreground/85 tracking-[-0.005em] truncate">
      {ROUTE_TITLES[match]}
    </span>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const { isRefreshing } = useData();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 2);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Record route visits for the Cmd+K "Recent" section.
  useEffect(() => {
    const path = location.pathname;
    // Only record known top-level pages — skip detail screens (they'll be recorded by their own pages on demand later).
    const match = Object.keys(ROUTE_TITLES).find((p) => path === p || path.startsWith(p + "/"));
    if (!match || path !== match) return;
    import("@/lib/recent-items").then(({ recordRecent }) => {
      recordRecent({ kind: "page", label: ROUTE_TITLES[match], to: match });
    });
  }, [location.pathname]);
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
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <SidebarProvider>
      <TopProgress active={isRefreshing && online} />
      <CommandPalette />
      <KeyboardShortcuts />
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className={`sticky top-0 z-30 flex h-14 items-center overflow-x-hidden border-b border-border/40 bg-card/90 px-3 backdrop-blur-xl md:h-16 md:px-6 transition-shadow duration-200 ${scrolled ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "shadow-none"}`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <SidebarTrigger className="mr-3 hidden md:flex" />
            <div className="flex items-center mr-2 md:hidden">
              <img src={ledgeLogoAsset} alt="Ledge" className="h-6 w-auto" decoding="async" />
              <span className="mx-2 h-3.5 w-px bg-border/60" aria-hidden />
            </div>
            <PageTitle />
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("ledge:open-command-palette"))}
                aria-label="Search (Cmd+K)"
                className="hidden md:inline-flex items-center gap-2 h-8 rounded-md border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors px-2.5 text-xs text-muted-foreground min-w-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <Search className="h-3.5 w-3.5 opacity-70" />
                <span className="flex-1 text-left">Search orders, dealers, products…</span>
                <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-border/70 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/80 num">
                  ⌘K
                </kbd>
              </button>
              {/* Mobile: compact search icon replacing the desktop-only clock. */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("ledge:open-command-palette"))}
                aria-label="Search"
                className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </button>
              <div className="hidden sm:inline-flex">
                <LiveClock />
              </div>
              {userRole && (
                <>
                  <span className="hidden sm:inline-block h-3.5 w-px bg-border/70" aria-hidden />
                  <span className="hidden sm:inline-flex items-center text-[11px] font-medium capitalize text-muted-foreground/90">
                    {userRole.replace("_", " ")}
                  </span>
                </>
              )}
              <span className="hidden sm:inline-block h-3.5 w-px bg-border/70" aria-hidden />
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
              <RefreshAppButton />
              <button
                type="button"
                onClick={() => setActivityOpen(true)}
                aria-label="Recent activity"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <History className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </button>
              <NotificationCenter />
            </div>
          </header>

          <AnimatePresence>
            {OFFLINE_MODE_ENABLED && (!online || syncing) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 200 }}
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

          <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 pb-20 md:p-6 md:pb-6">
            <div className="mx-auto max-w-5xl min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ type: "spring", damping: 26, stiffness: 200 }}
                  style={{ willChange: "opacity, transform" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Bottom Nav — mobile only — edge-to-edge, flat, 5 slots */}
          <nav
            className="sticky bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl md:hidden"
            style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
            aria-label="Primary"
          >
            <div className="flex w-full items-stretch justify-around">
              {primaryMobileNav.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    aria-current={isActive ? "page" : undefined}
                    className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-transform active:scale-[0.97]"
                  >
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-primary" aria-hidden />
                    )}
                    <item.icon
                      className={`h-[22px] w-[22px] transition-colors ${isActive ? "text-primary" : "text-muted-foreground/70"}`}
                      strokeWidth={isActive ? 2 : 1.6}
                    />
                    <span className={`text-[10.5px] transition-colors whitespace-nowrap ${isActive ? "text-primary font-semibold" : "text-muted-foreground/80 font-medium"}`}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}

              {/* Menu drawer trigger */}
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-transform active:scale-[0.97]"
                aria-label="Open menu"
              >
                {isMoreActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-primary" aria-hidden />
                )}
                <MoreHorizontal
                  className={`h-[22px] w-[22px] transition-colors ${isMoreActive ? "text-primary" : "text-muted-foreground/70"}`}
                  strokeWidth={isMoreActive ? 2 : 1.6}
                />
                <span className={`text-[10.5px] transition-colors whitespace-nowrap ${isMoreActive ? "text-primary font-semibold" : "text-muted-foreground/80 font-medium"}`}>
                  Menu
                </span>
              </button>

              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent side="bottom" className="rounded-t-[20px] px-0 pt-2 pb-0 h-[88vh] flex flex-col">
                  {/* Drag handle */}
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/25 mx-auto mb-2 shrink-0" />
                  <SheetHeader className="px-5 pb-2 shrink-0">
                    <SheetTitle className="text-left text-lg font-semibold tracking-[-0.01em]">Menu</SheetTitle>
                  </SheetHeader>

                  {/* Search button — opens command palette */}
                  <div className="px-5 pb-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        // Small delay so sheet close animation doesn't fight focus.
                        setTimeout(() => window.dispatchEvent(new CustomEvent("ledge:open-command-palette")), 120);
                      }}
                      className="flex w-full items-center gap-2 h-10 rounded-md border border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors px-3 text-sm text-muted-foreground"
                    >
                      <Search className="h-4 w-4 opacity-70" />
                      <span className="flex-1 text-left">Search orders, dealers, products…</span>
                    </button>
                  </div>

                  {/* Scrollable sectioned list */}
                  <div className="relative flex-1 min-h-0">
                    <div className="absolute inset-0 overflow-y-auto px-5 pb-8">
                      {moreGroups.map((group, gIdx) => (
                        <div key={group.label} className={gIdx === 0 ? "" : "mt-5"}>
                          <p className="text-[11px] font-medium normal-case tracking-normal text-muted-foreground/70 mb-1 px-1">
                            {group.label}
                          </p>
                          <div className="rounded-lg border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
                            {group.items.map((item) => {
                              const active = location.pathname.startsWith(item.url);
                              const rowCls = `flex w-full items-center gap-3 px-3.5 h-12 text-left transition-colors ${active ? "bg-primary/[0.06]" : "active:bg-muted/60"}`;
                              const Icon = item.icon;
                              const inner = (
                                <>
                                  <span className={`flex h-8 w-8 items-center justify-center rounded-md ${active ? "bg-primary/10 text-primary" : "bg-muted/50 text-foreground/70"}`}>
                                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.7} />
                                  </span>
                                  <span className={`flex-1 text-[15px] tracking-[-0.005em] ${active ? "font-semibold text-primary" : "font-medium text-foreground/90"}`}>
                                    {item.title}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                </>
                              );
                              return item.url === "/activity" ? (
                                <button
                                  key={item.title}
                                  type="button"
                                  onClick={() => { setMoreOpen(false); setActivityOpen(true); }}
                                  className={rowCls}
                                >
                                  {inner}
                                </button>
                              ) : (
                                <Link
                                  key={item.title}
                                  to={item.url}
                                  onClick={() => setMoreOpen(false)}
                                  className={rowCls}
                                >
                                  {inner}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div className="h-6" style={{ height: "calc(env(safe-area-inset-bottom) + 1.5rem)" }} />
                    </div>
                    {/* Bottom fade — affordance that there is more below */}
                    {/* Top fade — content scrolled above */}
                    <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent" aria-hidden />
                    {/* Bottom fade — more content below */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" aria-hidden />
                  </div>
                </SheetContent>
              </Sheet>
              <ActivityLog open={activityOpen} onOpenChange={setActivityOpen} />
            </div>
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
}
