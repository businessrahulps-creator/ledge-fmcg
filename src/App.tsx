import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { SplashScreen } from "@/components/SplashScreen";
import { NoCompanyGuard } from "@/components/onboarding/NoCompanyGuard";
import { isPreviewEnv } from "@/lib/preview-env";
import { LedgeLoader } from "@/components/ui/ledge-loader";
import { routeImporters, prefetchAllRoutes } from "@/lib/route-prefetch";

// Eager: entry/auth routes (small + needed immediately)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

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
const Reports = lazy(routeImporters["/reports"] as any);
const Performance = lazy(routeImporters["/performance"] as any);
const Settings = lazy(routeImporters["/settings"] as any);
const Billing = lazy(routeImporters["/billing"] as any);
const Help = lazy(routeImporters["/help"] as any);
const Company = lazy(routeImporters["/company"] as any);
const Claims = lazy(routeImporters["/claims"] as any);
const AdminErrors = lazy(() => import("./pages/AdminErrors"));

// Marketing/legal pages — kept lazy but not prefetched
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));

const queryClient = new QueryClient();

function OnlineStatusWatcher() {
  useOnlineStatus();
  return null;
}

function RoutePrefetcher() {
  useEffect(() => {
    // Warm every authenticated route chunk on idle so subsequent navigations
    // are instant — the chunk is already in the browser cache.
    prefetchAllRoutes();
  }, []);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authReady } = useAuth();
  // Don't redirect until auth is fully restored
  if (loading || !authReady) {
    return <SplashScreen />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return (
    <NoCompanyGuard>
      <RoutePrefetcher />
      {children}
    </NoCompanyGuard>
  );
}

// Single shared fallback — branded, delayed, calm.
const Loader = <LedgeLoader />;

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <NotificationProvider>
              <Toaster />
              <Sonner />
              <InstallPrompt />
              {!isPreviewEnv && <UpdatePrompt />}
              <OnlineStatusWatcher />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/privacy-policy" element={<Suspense fallback={Loader}><PrivacyPolicy /></Suspense>} />
                  <Route path="/terms-of-service" element={<Suspense fallback={Loader}><TermsOfService /></Suspense>} />
                  <Route path="/refund-policy" element={<Suspense fallback={Loader}><RefundPolicy /></Suspense>} />
                  <Route path="/about-us" element={<Suspense fallback={Loader}><AboutUs /></Suspense>} />
                  <Route path="/contact" element={<Suspense fallback={Loader}><Contact /></Suspense>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Dashboard /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Orders /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders/new" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><NewOrder /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><OrderDetail /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/distributors/:id" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><DealerDetail /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/distributors" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Distributors /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/stock" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Stock /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/salespersons/:id" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><SalespersonDetail /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/salespersons" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Salespersons /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/schemes" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Schemes /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/targets" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Targets /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/claims" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Claims /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Billing /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/company" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Company /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Reports /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/performance" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Performance /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Settings /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><Help /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/admin/errors" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={Loader}><AdminErrors /></Suspense></PageErrorBoundary></ProtectedRoute>} />
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
