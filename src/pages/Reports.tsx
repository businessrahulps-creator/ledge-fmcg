import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DistributorReport } from "@/components/reports/DistributorReport";
import { ProductReport } from "@/components/reports/ProductReport";
import { PaymentReport } from "@/components/reports/PaymentReport";
import { DispatchReport } from "@/components/reports/DispatchReport";
import { SalesTeamReport } from "@/components/reports/SalesTeamReport";

export default function Reports() {
  return (
    <AppLayout>
      <div className="w-full min-w-0 space-y-4 overflow-x-hidden md:space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-[28px] leading-tight">Reports</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Analyze your business performance
          </p>
        </div>

        <Tabs defaultValue="distributors" className="w-full min-w-0 space-y-4 md:space-y-6">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide">
            <TabsList className="inline-flex h-10 min-w-max justify-start rounded-lg bg-muted/50 p-1 md:h-12 md:w-auto">
              <TabsTrigger value="distributors" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Dealers</TabsTrigger>
              <TabsTrigger value="products" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Products</TabsTrigger>
              <TabsTrigger value="payments" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Payments</TabsTrigger>
              <TabsTrigger value="dispatch" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Dispatch</TabsTrigger>
              <TabsTrigger value="salesteam" className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Sales Team</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="distributors"><DistributorReport /></TabsContent>
          <TabsContent value="products"><ProductReport /></TabsContent>
          <TabsContent value="payments"><PaymentReport /></TabsContent>
          <TabsContent value="dispatch"><DispatchReport /></TabsContent>
          <TabsContent value="salesteam"><SalesTeamReport /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
