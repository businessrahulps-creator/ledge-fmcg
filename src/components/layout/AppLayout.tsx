import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation, Link } from "react-router-dom";
import { House, Receipt, Package, ChartNoAxesCombined, MoreHorizontal, UserRound, UserCheck, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

const mobileNav = [
  { title: "Home", url: "/dashboard", icon: House },
  { title: "Orders", url: "/orders", icon: Receipt },
  { title: "Stock", url: "/stock", icon: Package },
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
];

const moreLinks = [
  { title: "Dealers", url: "/distributors", icon: UserRound },
  { title: "Sales Team", url: "/salespersons", icon: UserCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreLinks.some((item) => location.pathname.startsWith(item.url));

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

          {/* Floating Pill Bottom Nav — mobile only */}
          <nav
            className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-2xl bg-card border border-border shadow-lg shadow-black/5 md:hidden"
            style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
          >
            {mobileNav.map((item) => {
              const isActive = location.pathname.startsWith(item.url);
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className="flex flex-col items-center gap-0.5 py-3 px-2 relative"
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
                  <span className={`text-[10px] font-semibold relative z-10 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.title}
                  </span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center gap-0.5 py-3 px-2 relative"
            >
              {isMoreActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-1 rounded-xl bg-muted"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <MoreHorizontal
                className={`w-[18px] h-[18px] relative z-10 transition-colors ${isMoreActive ? "text-foreground" : "text-muted-foreground"}`}
                strokeWidth={isMoreActive ? 1.8 : 1.5}
              />
              <span className={`text-[10px] font-semibold relative z-10 transition-colors ${isMoreActive ? "text-foreground" : "text-muted-foreground"}`}>
                More
              </span>
            </button>
          </nav>

          {/* More drawer */}
          <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>More</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 flex flex-col gap-1">
                {moreLinks.map((item) => {
                  const isActive = location.pathname.startsWith(item.url);
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={1.5} />
                      {item.title}
                    </Link>
                  );
                })}
                <Separator className="my-2" />
                <Link
                  to="/"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <LogOut className="w-5 h-5" strokeWidth={1.5} />
                  Log out
                </Link>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </SidebarProvider>
  );
}
