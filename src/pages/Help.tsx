import { AppLayout } from "@/components/layout/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";

export default function Help() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-medium">Help & Best Practices</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Practical workflows and tips to get the most out of Ledge — written for busy business owners, not IT teams.
          </p>
        </div>

        <div className="glass-card rounded-xl border p-4 sm:p-6">
          <Accordion type="multiple" defaultValue={["getting-started"]} className="space-y-1">
            {/* 1 — Getting Started */}
            <AccordionItem value="getting-started">
              <AccordionTrigger className="text-base font-semibold">
                Getting Started — Your First 15 Minutes
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Follow this path to go from zero to your first order:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Set up your company</strong> — Go to <em>Company</em> in the sidebar. Add your business name, GSTIN, address, and logo. This information appears on all your invoices and billing documents.
                  </li>
                  <li>
                    <strong>Add your products</strong> — Open <em>Stock → Products</em> and add your product catalogue with SKU, price, and HSN code. Start with your top 10–20 fast-moving items.
                  </li>
                  <li>
                    <strong>Add your dealers</strong> — Go to <em>Dealers</em> and create entries for your distributors. Include their GSTIN and location so invoices are generated correctly.
                  </li>
                  <li>
                    <strong>Add your sales team</strong> — Open <em>Sales Team</em> and add your salespeople with their regions. This lets you track who brought in each order.
                  </li>
                  <li>
                    <strong>Create your first order</strong> — Hit the <em>+ New Order</em> button, select a dealer and salesperson, add products, and save. You'll see it instantly on the Dashboard.
                  </li>
                </ol>
                <p className="text-xs border-l-2 border-primary/30 pl-3">
                  <strong>Tip:</strong> Set your Order Prefix (e.g., "ORD-" or "LDG-") in Company settings before creating orders. This keeps your order numbers consistent from day one.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 2 — Daily Workflow */}
            <AccordionItem value="daily-workflow">
              <AccordionTrigger className="text-base font-semibold">
                Daily Workflow — From Morning to Close
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Here's how a typical day looks on Ledge:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Check your Dashboard</strong> — Review today's order count, revenue, and pending payments at a glance. Look for any alerts.
                  </li>
                  <li>
                    <strong>Capture orders</strong> — As your sales team calls in or visits dealers, create orders in real time. The order total and dealer outstanding update automatically.
                  </li>
                  <li>
                    <strong>Dispatch orders</strong> — Open an order, update its delivery status to "Dispatched", and optionally record the vehicle and driver details.
                  </li>
                  <li>
                    <strong>Collect payments</strong> — When a dealer pays, update the payment status on the order. Track partial payments and outstanding balances.
                  </li>
                  <li>
                    <strong>End-of-day review</strong> — Check the Dashboard again. Review total orders, collections, and any pending dispatches for tomorrow.
                  </li>
                </ol>
                <p className="text-xs border-l-2 border-primary/30 pl-3">
                  <strong>Best practice:</strong> Update order and payment status the same day — it keeps your Dashboard accurate and your reports reliable.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 3 — Managing Your Business */}
            <AccordionItem value="managing">
              <AccordionTrigger className="text-base font-semibold">
                Managing Your Business — Stock, Credit & Schemes
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Ledge connects your stock, dealers, schemes, and targets into one system. Here's how they work together:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Stock & Warehouses</strong> — Add warehouses under <em>Stock → Warehouses</em>, then assign product quantities to each. Set low-stock thresholds so you get visual alerts before you run out.
                  </li>
                  <li>
                    <strong>Dealer Credit Limits</strong> — Set a credit limit on each dealer's profile. Ledge tracks their outstanding balance so you can make informed decisions before accepting new orders.
                  </li>
                  <li>
                    <strong>Schemes & Discounts</strong> — Create time-bound schemes (buy X get Y free, percentage discount, flat discount) under <em>Schemes</em>. Apply them to specific products or dealers. Ledge calculates savings automatically on orders.
                  </li>
                  <li>
                    <strong>Targets</strong> — Set monthly or quarterly revenue and order targets for your salespeople or dealers. Track progress on the <em>Performance</em> page.
                  </li>
                  <li>
                    <strong>Returns & Claims</strong> — Log product returns or claims against specific orders. Track resolution status and optionally restore stock.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* 4 — Reports & Performance */}
            <AccordionItem value="reports">
              <AccordionTrigger className="text-base font-semibold">
                Reports & Performance — What to Track and When
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Data is only useful if you look at it regularly. Here's a simple review cadence:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Daily</strong> — Check the Dashboard for order count, revenue, and payment collection.
                  </li>
                  <li>
                    <strong>Weekly</strong> — Open <em>Reports</em> and review the Dealer Report (who's ordering, who's gone quiet) and the Dispatch Report (any pending shipments).
                  </li>
                  <li>
                    <strong>Monthly</strong> — Check the Product Report (top sellers, slow movers), Payment Report (outstanding amounts), and Sales Team Report (who's hitting targets).
                  </li>
                  <li>
                    <strong>Quarterly</strong> — Review the <em>Performance</em> page to see target vs. actual for your team. Identify top performers and those who need support.
                  </li>
                </ul>
                <p className="text-xs border-l-2 border-primary/30 pl-3">
                  <strong>Pro tip:</strong> Export reports as PDF and share them with your team on WhatsApp — Ledge makes this one-click easy.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* 5 — Tips & Common Mistakes */}
            <AccordionItem value="tips">
              <AccordionTrigger className="text-base font-semibold">
                Tips & Common Mistakes to Avoid
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">✅ Do:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Set your order and invoice prefix before creating orders — changing it later creates inconsistent numbering.</li>
                    <li>Keep stock quantities updated — accurate stock means better decisions.</li>
                    <li>Add GSTIN for your company and dealers — this is required for correct GST invoices.</li>
                    <li>Use the data backup feature in Settings regularly — download a ZIP of all your data for safekeeping.</li>
                    <li>Update payment status the same day a dealer pays — it keeps your outstanding balances accurate.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">❌ Avoid:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Don't skip adding your company details — incomplete profiles lead to incomplete invoices.</li>
                    <li>Don't create orders without selecting a salesperson — you'll lose tracking of who brought in the business.</li>
                    <li>Don't ignore low-stock alerts — they're there to prevent missed sales opportunities.</li>
                    <li>Don't wait until month-end to update payments — real-time data is always more useful than catch-up data.</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </AppLayout>
  );
}
