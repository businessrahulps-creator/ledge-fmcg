import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DistributorReport } from "@/components/reports/DistributorReport";
import { ProductReport } from "@/components/reports/ProductReport";
import { PaymentReport } from "@/components/reports/PaymentReport";
import { DispatchReport } from "@/components/reports/DispatchReport";

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze your business performance
          </p>
        </div>

        <Tabs defaultValue="distributors" className="space-y-6">
          <TabsList className="h-12 rounded-lg bg-muted/50 p-1">
            <TabsTrigger value="distributors" className="rounded-md px-4 py-2 text-sm">Distributors</TabsTrigger>
            <TabsTrigger value="products" className="rounded-md px-4 py-2 text-sm">Products</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-md px-4 py-2 text-sm">Payments</TabsTrigger>
            <TabsTrigger value="dispatch" className="rounded-md px-4 py-2 text-sm">Dispatch</TabsTrigger>
          </TabsList>

          <TabsContent value="distributors"><DistributorReport /></TabsContent>
          <TabsContent value="products"><ProductReport /></TabsContent>
          <TabsContent value="payments"><PaymentReport /></TabsContent>
          <TabsContent value="dispatch"><DispatchReport /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
