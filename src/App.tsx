import { lazy, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { SplashScreen } from "@/components/SplashScreen";
import { NoCompanyGuard } from "@/components/onboarding/NoCompanyGuard";
import { RequireCapability } from "@/components/auth/RequireCapability";
import { isPreviewEnv } from "@/lib/preview-env";
import { LedgeLoader } from "@/components/ui/ledge-loader";
import { RouteSkeleton } from "@/components/ui/route-skeleton";
import {
  DashboardSkeleton,
  ListPageSkeleton,
  TablePageSkeleton,
  DashboardPageSkeleton,
} from "@/components/ui/page-skeleton";
import { DelayedSuspense } from "@/components/ui/delayed-suspense";
import { routeImporters, prefetchLikelyNext } from "@/lib/route-prefetch";

// Eager: only the tiny 404. Everything else is lazy so the entry stays small.
import NotFound from "./pages/NotFound";

// Entry / auth — lazy. Logged-in users land on /dashboard and never need
// the landing-page bundle (which pulls in framer-motion + every section).
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Welcome = lazy(() => import("./pages/Welcome"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Invite = lazy(() => import("./pages/Invite"));

// Lazy: authenticated app pages — importers live in route-prefetch so
// the prefetcher and Suspense boundaries share the exact same chunks.
const Dashboard = lazy(routeImporters["/dashboard"] as any);
const Orders = lazy(routeImporters["/orders"] as any);
const NewOrder = lazy(routeImporters["/orders/new"] as any);
const OrderDetail = lazy(routeImporters["/orders/:id"] as any);
const Distributors = lazy(routeImporters["/distributors"] as any);
const DealerDetail = lazy(routeImporters["/distributors/:id"] as any);
const Salespersons = lazy(routeImporters["/salespersons"] as any);
const SalespersonDetail = lazy(routeImporters["/salespersons/:id"] as any);
const Stock = lazy(routeImporters["/stock"] as any);
const Schemes = lazy(routeImporters["/schemes"] as any);
const Targets = lazy(routeImporters["/targets"] as any);
const Command = lazy(routeImporters["/command"] as any);
const Settings = lazy(routeImporters["/settings"] as any);
const Billing = lazy(routeImporters["/billing"] as any);
const Help = lazy(routeImporters["/help"] as any);
const Company = lazy(routeImporters["/company"] as any);
const Claims = lazy(routeImporters["/claims"] as any);
const AdminErrors = lazy(() => import("./pages/AdminErrors"));

// Marketing/legal — lazy
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));

// Non-critical UI loaded after first paint — keeps the entry chunk lean
// and stops these from blocking interactive readiness.
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const InstallPrompt = lazy(() => import("@/components/InstallPrompt").then(m => ({ default: m.InstallPrompt })));
const UpdatePrompt = lazy(() => import("@/components/UpdatePrompt").then(m => ({ default: m.UpdatePrompt })));

const queryClient = new QueryClient();

function OnlineStatusWatcher() {
  useOnlineStatus();
  return null;
}

/**
 * Mounts non-critical UI (toasters, prompts) only after the browser is
 * idle, so they never block first paint or first interaction.
 */
function DeferredChrome() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const ric =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => window.setTimeout(cb, 200));
    const id = ric(() => setReady(true));
    return () => {
      const cancel =
        (window as any).cancelIdleCallback ||
        ((handle: number) => window.clearTimeout(handle));
      cancel(id);
    };
  }, []);
  if (!ready) return null;
  return (
    <DelayedSuspense delayMs={400} fallback={null}>
      <Sonner />
      <InstallPrompt />
      {!isPreviewEnv && <UpdatePrompt />}
    </DelayedSuspense>
  );
}

/**
 * Single, route-aware prefetcher. Mounted once at the app shell level
 * (not inside ProtectedRoute, which remounts on every nav). On every
 * route change it warms only the 1–2 most likely next destinations.
 */
function RoutePrefetcher() {
  const location = useLocation();
  useEffect(() => {
    prefetchLikelyNext(location.pathname);
  }, [location.pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authReady } = useAuth();
  if (loading || !authReady) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <NoCompanyGuard>{children}</NoCompanyGuard>;
}

// Layout-preserving skeleton for authenticated routes; full splash for
// the very first paint (Index/Login) where there's no shell yet.
const RouteFallback = <RouteSkeleton />;
const ShellFallback = <LedgeLoader />;

// Per-route skeletons that mirror real layouts — feels continuous, no flash.
const DashboardFallback = <DashboardSkeleton />;
const OrdersFallback = <TablePageSkeleton rows={8} />;
const BillingFallback = <TablePageSkeleton rows={8} />;
const DealersFallback = <ListPageSkeleton cards={6} />;
const SalespersonsFallback = <ListPageSkeleton cards={6} />;
const StockFallback = <TablePageSkeleton rows={8} />;
const PerformanceFallback = <DashboardPageSkeleton />;
const ReportsFallback = <DashboardPageSkeleton />;

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <NotificationProvider>
              <DeferredChrome />
              <OnlineStatusWatcher />
              <BrowserRouter>
                <RoutePrefetcher />
                <Routes>
                  <Route path="/" element={<DelayedSuspense fallback={ShellFallback}><Index /></DelayedSuspense>} />
                  <Route path="/privacy-policy" element={<DelayedSuspense fallback={ShellFallback}><PrivacyPolicy /></DelayedSuspense>} />
                  <Route path="/terms-of-service" element={<DelayedSuspense fallback={ShellFallback}><TermsOfService /></DelayedSuspense>} />
                  <Route path="/refund-policy" element={<DelayedSuspense fallback={ShellFallback}><RefundPolicy /></DelayedSuspense>} />
                  <Route path="/about-us" element={<DelayedSuspense fallback={ShellFallback}><AboutUs /></DelayedSuspense>} />
                  <Route path="/contact" element={<DelayedSuspense fallback={ShellFallback}><Contact /></DelayedSuspense>} />
                  <Route path="/auth" element={<DelayedSuspense fallback={ShellFallback}><Auth /></DelayedSuspense>} />
                  <Route path="/login" element={<Navigate to="/auth?mode=signin" replace />} />
                  <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
                  <Route path="/welcome" element={<DelayedSuspense fallback={ShellFallback}><Welcome /></DelayedSuspense>} />
                  <Route path="/reset-password" element={<DelayedSuspense fallback={ShellFallback}><ResetPassword /></DelayedSuspense>} />
                  <Route path="/invite/:token" element={<DelayedSuspense fallback={ShellFallback}><Invite /></DelayedSuspense>} />
                  <Route path="/dashboard" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={DashboardFallback}><Dashboard /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={OrdersFallback}><Orders /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders/new" element={<ProtectedRoute><RequireCapability capability="place_orders" message="Placing orders isn't part of your role. If you think this is wrong, ask your Owner to update your access in Team Settings."><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><NewOrder /></DelayedSuspense></PageErrorBoundary></RequireCapability></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><OrderDetail /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/distributors/:id" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><DealerDetail /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/distributors" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={DealersFallback}><Distributors /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/stock" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={StockFallback}><Stock /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/salespersons/:id" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><SalespersonDetail /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/salespersons" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={SalespersonsFallback}><Salespersons /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/schemes" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><Schemes /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/targets" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><Targets /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/claims" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><Claims /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={BillingFallback}><Billing /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/company" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><Company /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/command" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={ReportsFallback}><Command /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/reports" element={<Navigate to="/command?tab=drill" replace />} />
                  <Route path="/performance" element={<Navigate to="/command?tab=overview" replace />} />
                  <Route path="/settings" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><Settings /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><Help /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/admin/errors" element={<ProtectedRoute><PageErrorBoundary><DelayedSuspense fallback={RouteFallback}><AdminErrors /></DelayedSuspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/products" element={<Navigate to="/stock" replace />} />
                  <Route path="/godown" element={<Navigate to="/stock?tab=warehouses" replace />} />
                  <Route path="/godown/*" element={<Navigate to="/stock?tab=warehouses" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
