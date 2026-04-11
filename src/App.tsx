import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useOnlineStatus } from "@/hooks/use-online-status";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import Distributors from "./pages/Distributors";
import Salespersons from "./pages/Salespersons";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Stock from "./pages/Stock";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

function OnlineStatusWatcher() {
  useOnlineStatus();
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authReady } = useAuth();
  // Don't redirect until auth is fully restored
  if (loading || !authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
              <OnlineStatusWatcher />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/dashboard" element={<ProtectedRoute><PageErrorBoundary><Dashboard /></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><PageErrorBoundary><Orders /></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/orders/new" element={<ProtectedRoute><PageErrorBoundary><NewOrder /></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/distributors" element={<ProtectedRoute><PageErrorBoundary><Distributors /></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/stock" element={<ProtectedRoute><PageErrorBoundary><Stock /></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/salespersons" element={<ProtectedRoute><PageErrorBoundary><Salespersons /></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><PageErrorBoundary><Reports /></PageErrorBoundary></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><PageErrorBoundary><Settings /></PageErrorBoundary></ProtectedRoute>} />
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
