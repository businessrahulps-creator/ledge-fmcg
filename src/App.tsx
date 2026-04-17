import { lazy, Suspense } from "react";
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
import { ListPageSkeleton, DashboardPageSkeleton } from "@/components/ui/page-skeleton";
import { SplashScreen } from "@/components/SplashScreen";
import { NoCompanyGuard } from "@/components/onboarding/NoCompanyGuard";
import { isPreviewEnv } from "@/lib/preview-env";

// Eager: entry/auth routes (small + needed immediately)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

// Lazy: authenticated app pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const NewOrder = lazy(() => import("./pages/NewOrder"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Distributors = lazy(() => import("./pages/Distributors"));
const DealerDetail = lazy(() => import("./pages/DealerDetail"));
const Salespersons = lazy(() => import("./pages/Salespersons"));
const SalespersonDetail = lazy(() => import("./pages/SalespersonDetail"));
const Stock = lazy(() => import("./pages/Stock"));
const Schemes = lazy(() => import("./pages/Schemes"));
const Targets = lazy(() => import("./pages/Targets"));
const Reports = lazy(() => import("./pages/Reports"));
const Performance = lazy(() => import("./pages/Performance"));
const Settings = lazy(() => import("./pages/Settings"));
const Billing = lazy(() => import("./pages/Billing"));
const Help = lazy(() => import("./pages/Help"));
const Company = lazy(() => import("./pages/Company"));
const Claims = lazy(() => import("./pages/Claims"));
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authReady } = useAuth();
  // Don't redirect until auth is fully restored
  if (loading || !authReady) {
    return <SplashScreen />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <NoCompanyGuard>{children}</NoCompanyGuard>;
}

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
                  <Route path="/privacy-policy" element={<Suspense fallback={<ListPageSkeleton />}><PrivacyPolicy /></Suspense>} />
                  <Route path="/terms-of-service" element={<Suspense fallback={<ListPageSkeleton />}><TermsOfService /></Suspense>} />
                  <Route path="/refund-policy" element={<Suspense fallback={<ListPageSkeleton />}><RefundPolicy /></Suspense>} />
                  <Route path="/about-us" element={<Suspense fallback={<ListPageSkeleton />}><AboutUs /></Suspense>} />
                  <Route path="/contact" element={<Suspense fallback={<ListPageSkeleton />}><Contact /></Suspense>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<DashboardPageSkeleton />}><Dashboard /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Orders /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders/new" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><NewOrder /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><OrderDetail /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/distributors/:id" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><DealerDetail /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/distributors" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Distributors /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/stock" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Stock /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/salespersons/:id" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><SalespersonDetail /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/salespersons" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Salespersons /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/schemes" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Schemes /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/targets" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Targets /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/claims" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Claims /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Billing /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/company" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Company /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<DashboardPageSkeleton />}><Reports /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/performance" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<DashboardPageSkeleton />}><Performance /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Settings /></Suspense></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute><PageErrorBoundary><Suspense fallback={<ListPageSkeleton />}><Help /></Suspense></PageErrorBoundary></ProtectedRoute>} />
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
