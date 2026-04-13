import { AppLayout } from "@/components/layout/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";

const Tip = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs border-l-2 border-primary/30 pl-3">
    <strong>Tip:</strong> {children}
  </p>
);

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

        <div className="glass-card rounded-xl border p-4 sm:p-6 space-y-4">
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            Welcome! Pick a topic below to learn how Ledge works. Each section has step-by-step instructions written in plain English.
          </p>
          <Accordion type="multiple" defaultValue={["getting-started"]} className="space-y-1">

            {/* 1 — Getting Started */}
            <AccordionItem value="getting-started">
              <AccordionTrigger className="text-base font-semibold">
                Getting Started — Your First 15 Minutes
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Follow this path to go from zero to your first order:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Set up your company</strong> — Go to <em>Company</em> in the sidebar. Add your business name, GSTIN, address, and logo. This information appears on all your invoices and billing documents.</li>
                  <li><strong>Add your products</strong> — Open <em>Stock → Products</em> and add your product catalogue with SKU, price, and HSN code. Start with your top 10–20 fast-moving items.</li>
                  <li><strong>Add your dealers</strong> — Go to <em>Dealers</em> and create entries for your distributors. Include their GSTIN and location so invoices are generated correctly.</li>
                  <li><strong>Add your sales team</strong> — Open <em>Sales Team</em> and add your salespeople with their regions. This lets you track who brought in each order.</li>
                  <li><strong>Create your first order</strong> — Hit the <em>+ New Order</em> button, select a dealer and salesperson, add products, and save. You'll see it instantly on the Dashboard.</li>
                </ol>
                <Tip>Set your Order Prefix (e.g., "ORD-" or "LDG-") in Company settings before creating orders. This keeps your order numbers consistent from day one.</Tip>
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
                  <li><strong>Check your Dashboard</strong> — Review today's order count, revenue, and pending payments at a glance. Look for any alerts.</li>
                  <li><strong>Capture orders</strong> — As your sales team calls in or visits dealers, create orders in real time. The order total and dealer outstanding update automatically.</li>
                  <li><strong>Dispatch orders</strong> — Open an order, update its delivery status to "Dispatched", and optionally record the vehicle and driver details.</li>
                  <li><strong>Collect payments</strong> — When a dealer pays, update the payment status on the order. Track partial payments and outstanding balances.</li>
                  <li><strong>End-of-day review</strong> — Check the Dashboard again. Review total orders, collections, and any pending dispatches for tomorrow.</li>
                </ol>
                <Tip>Update order and payment status the same day — it keeps your Dashboard accurate and your reports reliable.</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 3 — Orders */}
            <AccordionItem value="orders">
              <AccordionTrigger className="text-base font-semibold">
                Orders — Creating, Tracking & Managing
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Orders are the core of Ledge. Here's everything you need to know:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Creating an order</strong> — Click <em>+ New Order</em>, select a dealer, choose a salesperson, add line items (products + quantities), and save. Ledge auto-generates the order number using your prefix (e.g., ORD-001).</li>
                  <li><strong>Payment status</strong> — Each order has a payment status: <em>Pending</em>, <em>Partial</em>, or <em>Paid</em>. Update it as you receive payments. Choose the payment mode (Cash, Bank Transfer, Cheque, or UPI).</li>
                  <li><strong>Delivery status</strong> — Track fulfilment: <em>Pending → Dispatched → Delivered</em>. When dispatching, you can record vehicle number, driver name, and dispatch remarks.</li>
                  <li><strong>Order detail view</strong> — Click any order to see its full breakdown: line items, payment info, delivery info, and linked invoice. You can edit payment/delivery status from here.</li>
                  <li><strong>Linking to invoices</strong> — Once an order is created, you can generate a GST Invoice directly from the order detail page. The invoice pulls all order data automatically.</li>
                  <li><strong>Schemes on orders</strong> — If active schemes match the order's products or dealer, Ledge shows applicable savings and attaches them to the order.</li>
                </ul>
                <Tip>Set your Order Prefix and Invoice Prefix in Company settings before creating your first order. Changing them later will create inconsistent numbering.</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 4 — Dealers */}
            <AccordionItem value="dealers">
              <AccordionTrigger className="text-base font-semibold">
                Dealers — Profiles, Credit & Ledger
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Dealers (distributors) are your customers. Ledge tracks everything about them:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Adding a dealer</strong> — Go to <em>Dealers</em> → <em>+ Add Dealer</em>. Enter their name, contact number, email, location, and GSTIN. The GSTIN is important for correct GST invoice generation.</li>
                  <li><strong>Credit limits</strong> — Set a credit limit on each dealer's profile. Ledge tracks their outstanding balance (total unpaid orders). This helps you decide whether to accept new orders from a dealer who already owes you money.</li>
                  <li><strong>Outstanding tracking</strong> — The dealer's outstanding amount updates automatically as you create orders and record payments. You can see it on the dealer list and detail page.</li>
                  <li><strong>Dealer detail page</strong> — Click any dealer to see their full profile: contact info, GSTIN, bank details, order history, total orders, total value, and outstanding balance. It's a complete ledger view.</li>
                  <li><strong>Bank details</strong> — Optionally add the dealer's bank account, IFSC, and bank name. This is useful if you need to process refunds or track payment sources.</li>
                  <li><strong>State code</strong> — Adding the dealer's state code helps Ledge determine whether to apply CGST+SGST (same state) or IGST (inter-state) on invoices.</li>
                </ul>
                <Tip>Always add GSTIN and state code for your dealers — this ensures invoices are generated with the correct tax treatment (intra-state vs inter-state).</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 5 — Sales Team */}
            <AccordionItem value="sales-team">
              <AccordionTrigger className="text-base font-semibold">
                Sales Team — People, Regions & Performance
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Your sales team drives revenue. Here's how to manage them on Ledge:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Adding a salesperson</strong> — Go to <em>Sales Team</em> → <em>+ Add Salesperson</em>. Enter their name, phone, email, and region. The region helps you track geographical coverage.</li>
                  <li><strong>Linking to orders</strong> — Every order must have a salesperson assigned. This tracks who brought in the business and is used in performance reports.</li>
                  <li><strong>Salesperson detail page</strong> — Click any salesperson to see their profile, total orders, total value, and order history. Use this to review individual performance.</li>
                  <li><strong>Setting targets</strong> — Go to <em>Targets</em> to set monthly or quarterly revenue and order targets for each salesperson. Track progress on the <em>Performance</em> page.</li>
                  <li><strong>Sales Team Report</strong> — The <em>Reports</em> section includes a dedicated Sales Team report showing order count, revenue, and rankings across your team.</li>
                </ul>
                <Tip>Don't skip assigning a salesperson to orders — without it, you lose the ability to track who's driving your business.</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 6 — Stock & Warehouses */}
            <AccordionItem value="stock">
              <AccordionTrigger className="text-base font-semibold">
                Stock & Warehouses — Products, Inventory & Alerts
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Ledge helps you manage your product catalogue and warehouse inventory in one place:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Products tab</strong> — Under <em>Stock → Products</em>, add your product catalogue. Each product has a name, SKU, base price, HSN code, and unit (e.g., pcs, kg, box). The HSN code is required for GST invoices.</li>
                  <li><strong>Warehouses tab</strong> — Under <em>Stock → Warehouses</em>, create your warehouse/godown locations. Add an address and mark them active or inactive.</li>
                  <li><strong>Assigning stock</strong> — Once you have products and warehouses, assign quantities of each product to specific warehouses. This gives you a per-location inventory view.</li>
                  <li><strong>Low-stock thresholds</strong> — Set a threshold quantity for each product in a warehouse. When stock falls below the threshold, it's flagged visually so you know to reorder.</li>
                  <li><strong>Stock health badges</strong> — Stock items show colour-coded badges: <strong>Healthy</strong> (above threshold), <strong>Low</strong> (near threshold), and <strong>Critical</strong> (at or below zero). Use these to make quick restock decisions.</li>
                </ul>
                <Tip>Start by adding your top 10–20 products with correct HSN codes and prices. You can always add more later.</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 7 — Schemes & Discounts */}
            <AccordionItem value="schemes">
              <AccordionTrigger className="text-base font-semibold">
                Schemes & Discounts — Promotions That Calculate Themselves
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Run time-bound promotions that automatically apply to orders:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Three scheme types</strong>:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><em>Buy X Get Y Free</em> — e.g., Buy 10 units, get 2 free. Set the buy quantity and free quantity.</li>
                      <li><em>Percentage Discount</em> — e.g., 15% off on orders above ₹5,000. Set the discount percentage and minimum order value.</li>
                      <li><em>Flat Discount</em> — e.g., ₹500 off on orders above ₹10,000. Set the flat amount and minimum order value.</li>
                    </ul>
                  </li>
                  <li><strong>Time-bound validity</strong> — Each scheme has a start date and optional end date. Expired schemes are automatically marked inactive.</li>
                  <li><strong>Targeting</strong> — Schemes can be targeted to a specific product, a specific dealer, or left open for all. This lets you run focused promotions.</li>
                  <li><strong>Auto-calculation</strong> — When creating an order, Ledge checks for active schemes that match the order's products or dealer and shows the applicable savings.</li>
                </ul>
                <Tip>Always set an end date for promotional schemes — open-ended schemes are easy to forget and can erode margins if left running.</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 8 — Billing & Invoices */}
            <AccordionItem value="billing">
              <AccordionTrigger className="text-base font-semibold">
                Billing & Invoices — GST Documents Made Simple
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Ledge supports four types of billing documents, all with automatic GST calculation:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>GST Invoice (Tax Invoice)</strong> — The standard invoice for goods sold. Includes seller/buyer details, line items with HSN codes, and a full tax breakdown (CGST+SGST or IGST depending on whether the sale is intra-state or inter-state).</li>
                  <li><strong>Estimate / Quotation</strong> — A non-binding price quote you can send to a dealer before they confirm an order. Useful for negotiations.</li>
                  <li><strong>Proforma Invoice</strong> — A pre-shipment invoice that looks like a tax invoice but isn't final. Used to request advance payment or for customs purposes.</li>
                  <li><strong>Credit Note</strong> — Issued when goods are returned or a price adjustment is needed after the original invoice. Links back to the original invoice for audit trail.</li>
                </ul>
                <p className="font-medium text-foreground">How it works:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to <em>Billing</em> or generate an invoice from an order detail page.</li>
                  <li>Select the document type, buyer (dealer), and add line items.</li>
                  <li>Ledge auto-calculates the tax based on your company's state code vs. the buyer's state code.</li>
                  <li>Save as Draft (editable) or Finalize (locked, sequential invoice number assigned).</li>
                  <li>Export as PDF or share directly via WhatsApp — one click.</li>
                </ol>
                <Tip>Make sure both your company and your dealers have state codes set correctly. This determines whether CGST+SGST or IGST is applied — getting it wrong means incorrect invoices.</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 9 — Claims & Returns */}
            <AccordionItem value="claims">
              <AccordionTrigger className="text-base font-semibold">
                Claims & Returns — Handling Problems Cleanly
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>When goods are returned or a dealer raises a claim, Ledge tracks the entire resolution process:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Two claim types</strong>:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><em>Goods Returned</em> — The dealer is physically sending products back. You can choose to restore stock (add returned quantities back to your warehouse inventory).</li>
                      <li><em>Damaged / Claim Only</em> — No physical return, but the dealer is requesting a credit or adjustment for damaged or defective goods.</li>
                    </ul>
                  </li>
                  <li><strong>Creating a claim</strong> — Go to <em>Claims</em> → <em>+ New Claim</em>. Select the original order, choose the claim type, add the products being claimed with quantities, and describe the reason.</li>
                  <li><strong>Claim value</strong> — Ledge calculates the total claim value based on the products and quantities specified. This helps you track the financial impact.</li>
                  <li><strong>Resolution workflow</strong> — Each claim moves through statuses: <em>Open → Resolved</em> or <em>Open → Rejected</em>. Add resolution notes to document what was agreed.</li>
                  <li><strong>Stock restoration</strong> — For "Goods Returned" claims, you can toggle "Restore Stock" to add the returned quantities back to your warehouse. This keeps your inventory accurate.</li>
                  <li><strong>Audit trail</strong> — Every claim links back to the original order and dealer, making it easy to see a complete history of issues with any dealer or product.</li>
                </ul>
                <Tip>Always add a clear reason and resolution notes on claims — this protects you in disputes and helps identify patterns (e.g., a product that keeps getting returned).</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 10 — Reports & Performance */}
            <AccordionItem value="reports">
              <AccordionTrigger className="text-base font-semibold">
                Reports & Performance — What to Track and When
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm max-w-none text-muted-foreground space-y-3">
                <p>Data is only useful if you look at it regularly. Here's what's available and a recommended cadence:</p>
                <p className="font-medium text-foreground">Five report types:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Dealer Report</strong> — Who's ordering, who's gone quiet, and outstanding balances per dealer.</li>
                  <li><strong>Product Report</strong> — Top sellers, slow movers, and revenue breakdown by product.</li>
                  <li><strong>Payment Report</strong> — Outstanding amounts, payment modes, and collection trends.</li>
                  <li><strong>Dispatch Report</strong> — Pending shipments, dispatched orders, and delivery timelines.</li>
                  <li><strong>Sales Team Report</strong> — Order count, revenue, and rankings for each salesperson.</li>
                </ul>
                <p className="font-medium text-foreground">Recommended review cadence:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Daily</strong> — Dashboard for order count, revenue, and payment collection.</li>
                  <li><strong>Weekly</strong> — Dealer Report (ordering activity) and Dispatch Report (pending shipments).</li>
                  <li><strong>Monthly</strong> — Product Report (top sellers), Payment Report (outstanding amounts), and Sales Team Report (targets).</li>
                  <li><strong>Quarterly</strong> — <em>Performance</em> page for target vs. actual across your team. Identify top performers and those needing support.</li>
                </ul>
                <p className="font-medium text-foreground">Targets:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Set monthly or quarterly revenue and order targets for salespersons or dealers under <em>Targets</em>.</li>
                  <li>Track progress visually on the <em>Performance</em> page with progress bars and achievement percentages.</li>
                </ul>
                <Tip>Export reports as PDF and share them with your team on WhatsApp — Ledge makes this one-click easy.</Tip>
              </AccordionContent>
            </AccordionItem>

            {/* 11 — Tips & Best Practices */}
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
                    <li>Add GSTIN and state code for your company and dealers — this is required for correct GST invoices and proper tax treatment.</li>
                    <li>Use the data backup feature in Settings regularly — download a ZIP of all your data for safekeeping.</li>
                    <li>Update payment status the same day a dealer pays — it keeps your outstanding balances accurate.</li>
                    <li>Add resolution notes on every claim — this helps you track patterns and resolve disputes.</li>
                    <li>Set end dates on promotional schemes — open-ended schemes are easy to forget.</li>
                    <li>Review the Performance page monthly to keep your sales team accountable and supported.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">❌ Avoid:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Don't skip adding your company details — incomplete profiles lead to incomplete invoices.</li>
                    <li>Don't create orders without selecting a salesperson — you'll lose tracking of who brought in the business.</li>
                    <li>Don't ignore low-stock alerts — they're there to prevent missed sales opportunities.</li>
                    <li>Don't wait until month-end to update payments — real-time data is always more useful than catch-up data.</li>
                    <li>Don't leave claims unresolved — open claims create confusion for both you and the dealer.</li>
                    <li>Don't generate invoices without verifying GSTIN and state codes — incorrect tax breakdowns cause compliance issues.</li>
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
