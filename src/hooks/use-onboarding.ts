import { useMemo, useState, useCallback } from "react";
import { useApi } from "@/services/api";
import { useCan } from "@/hooks/useCan";
import {
  Landmark,
  Image,
  UserRound,
  Package,
  UserCheck,
  ClipboardList,
} from "lucide-react";

const DISMISSED_KEY = "ledge_onboarding_dismissed";

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isComplete: boolean;
  path: string;
}

export function useOnboarding() {
  const api = useApi();
  const canPlaceOrders = useCan("place_orders");
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
  });

  const companyInfo = api.companyInfo;
  const dealers = api.dealers.list();
  const products = api.products.list();
  const salespersons = api.salespersons.list();
  const orders = api.orders.list();

  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: "company",
      label: "Add company details",
      description: "GSTIN, address & bank info",
      icon: Landmark,
      isComplete: !!(companyInfo?.gstin && companyInfo.gstin.length > 0),
      path: "/company",
    },
    {
      id: "logo",
      label: "Upload your logo",
      description: "Brand your invoices & orders",
      icon: Image,
      isComplete: !!(companyInfo?.logoUrl && companyInfo.logoUrl.length > 0),
      path: "/company",
    },
    {
      id: "dealer",
      label: "Add your first dealer",
      description: "Start managing your network",
      icon: UserRound,
      isComplete: (dealers?.length || 0) > 0,
      path: "/distributors",
    },
    {
      id: "product",
      label: "Add your first product",
      description: "Build your product catalogue",
      icon: Package,
      isComplete: (products?.length || 0) > 0,
      path: "/stock",
    },
    {
      id: "salesperson",
      label: "Add a salesperson",
      description: "Assign orders to your team",
      icon: UserCheck,
      isComplete: (salespersons?.length || 0) > 0,
      path: "/salespersons",
    },
    {
      id: "order",
      label: "Create your first order",
      description: "See Ledge in action",
      icon: ClipboardList,
      isComplete: (orders?.length || 0) > 0,
      path: "/orders/new",
    },
  ], [companyInfo, dealers, products, salespersons, orders]);

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalSteps = steps.length;
  const isComplete = completedCount === totalSteps;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  const isBrandNew = completedCount === 0;
  const companyIncomplete = !steps[0].isComplete || !steps[1].isComplete;

  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
    setDismissed(true);
  }, []);

  return {
    steps,
    completedCount,
    totalSteps,
    isComplete,
    percentage,
    isBrandNew,
    dismissed,
    dismiss,
    visible: !dismissed && !isComplete,
    companyIncomplete,
  };
}
