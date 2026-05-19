import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { House, ClipboardList, Package, MoreHorizontal, Settings, WifiOff, RefreshCw, UserRound, UserCheck, Gift, ChartNoAxesCombined, Landmark, Wallet, LogOut, CircleDot } from "lucide-react";
import { useData } from "@/context/DataContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";
import { LiveClock } from "./LiveClock";
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
  { title: "My Business", url: "/command", icon: ChartNoAxesCombined },
];

type MoreTone = "warning" | "primary" | "success" | "accent" | "muted";

const TONE_STYLES: Record<MoreTone, { iconBg: string; iconFg: string; activeBg: string; activeFg: string }> = {
  warning: { iconBg: "bg-warning/10", iconFg: "text-warning", activeBg: "bg-warning/15", activeFg: "text-warning" },
  primary: { iconBg: "bg-primary/10", iconFg: "text-primary", activeBg: "bg-primary/15", activeFg: "text-primary" },
  success: { iconBg: "bg-success/10", iconFg: "text-success", activeBg: "bg-success/15", activeFg: "text-success" },
  accent:  { iconBg: "bg-accent/15",  iconFg: "text-accent-foreground", activeBg: "bg-accent/25", activeFg: "text-accent-foreground" },
  muted:   { iconBg: "bg-muted",      iconFg: "text-foreground/70", activeBg: "bg-primary/10",  activeFg: "text-primary" },
};

const moreGroups: Array<{ label: string; tone: MoreTone; items: Array<{ title: string; url: string; icon: typeof Wallet }> }> = [
  {
    label: "Work",
    tone: "warning",
    items: [
      { title: "Money to Collect", url: "/billing", icon: Wallet },
      { title: "Returns", url: "/claims", icon: RotateCcw },
    ],
  },
  {
    label: "Catalog",
    tone: "primary",
    items: [
      { title: "Schemes", url: "/schemes", icon: Gift },
      { title: "Targets", url: "/targets", icon: Target },
    ],
  },
  {
    label: "Relationships",
    tone: "success",
    items: [
      { title: "Dealers", url: "/distributors", icon: UserRound },
      { title: "Sales Team", url: "/salespersons", icon: UserCheck },
      { title: "Company", url: "/company", icon: Landmark },
    ],
  },
  {
    label: "Insights",
    tone: "accent",
    items: [
      { title: "My Business", url: "/command", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "Account",
    tone: "muted",
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
  const { userRole, profile, signOut } = useAuth();
  const { isRefreshing } = useData();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
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

  // Scroll-lock janitor — reset any leaked Radix Dialog/Sheet body styles on route change.
  // Radix can leave `pointer-events: none` / `overflow: hidden` on <body> if a modal is
  // unmounted before its exit animation completes. This prevents "page won't scroll" bugs.
  useEffect(() => {
    document.body.style.pointerEvents = "";
    if (document.body.style.overflow === "hidden") document.body.style.overflow = "";
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
      <div data-app-shell className="flex h-dvh w-full overflow-hidden bg-background">
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
              {/* PWA "Check for updates" + Activity log entry-points removed in Phase 1 polish.
                  PWA offline mode is paused (mem://features/offline-mode-paused);
                  Activity log route remains reachable directly via /activity. */}
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
                    ? "bg-primary/10 text-primary"
                    : "bg-warning/10 text-warning"
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
                      <span className="ml-1 inline-flex items-center rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold">
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
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 4 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{ willChange: "opacity, transform" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Bottom Nav — mobile only — edge-to-edge, flat, 5 slots */}
          <nav
            data-mobile-nav
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
                <SheetContent side="bottom" className="rounded-t-[24px] px-0 pt-2 pb-0 h-[92vh] flex flex-col bg-card border-t border-border/60">
                  {/* Drag handle */}
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-3 shrink-0" />

                  {/* Account header — Material-style identity block */}
                  <SheetHeader className="px-5 pb-3 shrink-0 text-left space-y-0">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-[15px] tracking-[-0.01em] shadow-depth-2">
                        {(profile?.full_name || profile?.email || "?").trim().charAt(0).toUpperCase()}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card ${online ? "bg-success" : "bg-muted-foreground/50"}`}
                          aria-hidden
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-foreground tracking-[-0.01em] truncate">
                          {profile?.full_name || "Welcome"}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate flex items-center gap-1.5">
                          {userRole && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.04em]">
                              {userRole}
                            </span>
                          )}
                          <span className="truncate">{profile?.email || "Not signed in"}</span>
                        </p>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* Search — Fluent-style command entry */}
                  <div className="px-5 pb-3 pt-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        setTimeout(() => window.dispatchEvent(new CustomEvent("ledge:open-command-palette")), 120);
                      }}
                      className="flex w-full items-center gap-2.5 h-11 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/50 active:bg-muted/60 transition-colors px-3.5 text-[13.5px] text-muted-foreground"
                    >
                      <Search className="h-4 w-4 opacity-70" />
                      <span className="flex-1 text-left">Search orders, dealers, products…</span>
                      <kbd className="hidden sm:inline-flex items-center rounded border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/80">⌘K</kbd>
                    </button>
                  </div>

                  {/* Scrollable sectioned list */}
                  <div className="relative flex-1 min-h-0">
                    <div className="absolute inset-0 overflow-y-auto px-5 pb-8">
                      {moreGroups.map((group, gIdx) => {
                        const tone = TONE_STYLES[group.tone];
                        return (
                        <div key={group.label} className={gIdx === 0 ? "" : "mt-5"}>
                          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-1.5 px-1">
                            {group.label}
                          </p>
                          <div className="rounded-xl border border-border/50 bg-background/60 overflow-hidden divide-y divide-border/40 shadow-depth-2">
                            {group.items.map((item) => {
                              const active = location.pathname.startsWith(item.url);
                              const rowCls = `group flex w-full items-center gap-3 px-3.5 h-[52px] text-left transition-colors ${active ? "bg-primary/[0.05]" : "hover:bg-muted/40 active:bg-muted/60"}`;
                              const Icon = item.icon;
                              const inner = (
                                <>
                                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${active ? tone.activeBg + " " + tone.activeFg : tone.iconBg + " " + tone.iconFg}`}>
                                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                                  </span>
                                  <span className={`flex-1 text-[15px] tracking-[-0.005em] ${active ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
                                    {item.title}
                                  </span>
                                  {active && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                                  )}
                                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 transition-transform group-active:translate-x-0.5" />
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
                        );
                      })}

                      {/* Sign out */}
                      {profile && (
                        <button
                          type="button"
                          onClick={async () => { setMoreOpen(false); await signOut(); }}
                          className="mt-5 flex w-full items-center justify-center gap-2 h-11 rounded-lg border border-border/60 bg-background text-[14px] font-medium text-foreground/80 hover:bg-muted/40 active:bg-muted/60 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      )}

                      {/* Footer status strip */}
                      <div className="mt-4 flex items-center justify-between px-1 text-[11px] text-muted-foreground/70">
                        <span className="inline-flex items-center gap-1.5">
                          <CircleDot className={`h-3 w-3 ${online ? "text-success" : "text-muted-foreground/50"}`} />
                          {online ? "Online" : "Offline"}
                        </span>
                        <span className="tracking-[-0.005em]">Ledge · v2</span>
                      </div>

                      <div style={{ height: "calc(env(safe-area-inset-bottom) + 1.5rem)" }} />
                    </div>
                    {/* Top fade */}
                    <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-card to-transparent" aria-hidden />
                    {/* Bottom fade */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent" aria-hidden />
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
