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
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">Reports</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Analyze your business performance
          </p>
        </div>

        <Tabs defaultValue="distributors" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <TabsList className="h-10 w-max rounded-lg bg-muted/50 p-1 md:h-12 md:w-auto">
              <TabsTrigger value="distributors" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Dealers</TabsTrigger>
              <TabsTrigger value="products" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Products</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Payments</TabsTrigger>
              <TabsTrigger value="dispatch" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Dispatch</TabsTrigger>
              <TabsTrigger value="salesteam" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Sales Team</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="distributors"><DistributorReport /></TabsContent>
          <TabsContent value="products"><ProductReport /></TabsContent>
          <TabsContent value="payments"><PaymentReport /></TabsContent>
          <TabsContent value="dispatch"><DispatchReport /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
