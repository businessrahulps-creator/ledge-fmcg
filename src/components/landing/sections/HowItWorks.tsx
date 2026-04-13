import { AnimateIn } from "../AnimateIn";
import { BrowserFrame, PhoneFrame, GradientStage } from "../DeviceFrames";

/* -- Step 1: Order Creation Phone Mockup -- */
function OrderMockupContent() {
  return (
    <div className="p-5">
      <div className="text-[11px] font-semibold text-[#1A1A1A] mb-3">New Order</div>
      <div className="space-y-2.5">
        <div>
          <div className="text-[9px] text-[#71717A] mb-1">Dealer</div>
          <div className="h-7 bg-[#F8F7F5] rounded-md flex items-center px-2">
            <span className="text-[10px] text-[#1A1A1A]">Sharma Traders, Pune</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] text-[#71717A] mb-1">Products</div>
          <div className="space-y-1">
            {[
              { name: "Premium Masala 500g", qty: "24", price: "₹4,800" },
              { name: "Gold Atta 10kg", qty: "12", price: "₹7,200" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between bg-[#F8F7F5] rounded-md px-2 py-1.5">
                <span className="text-[10px] text-[#1A1A1A]">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#71717A]">x{p.qty}</span>
                  <span className="text-[10px] font-medium text-[#1A1A1A]">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#E8E5E0]">
          <span className="text-[10px] text-[#71717A]">Total</span>
          <span className="text-xs font-semibold text-[#1A1A1A]">₹12,000</span>
        </div>
        <div className="bg-[#0D9488] text-white text-[10px] font-medium text-center py-2 rounded-lg">
          Place Order
        </div>
      </div>
    </div>
  );
}

function OrderMockup() {
  return (
    <GradientStage variant="lavender">
      <PhoneFrame>
        <OrderMockupContent />
      </PhoneFrame>
    </GradientStage>
  );
}

/* -- Step 2: Dashboard KPI Mockup -- */
function DashboardMiniMockup() {
  const kpis = [
    { label: "Revenue", value: "₹1.84L", color: "text-[#0D9488]" },
    { label: "Orders", value: "47", color: "text-[#1A1A1A]" },
    { label: "Pending", value: "12", color: "text-amber-600" },
    { label: "Delivered", value: "35", color: "text-[#0D9488]" },
  ];

  return (
    <GradientStage variant="indigo">
      <BrowserFrame url="app.ledge.in/dashboard">
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {kpis.map((k) => (
              <div key={k.label} className="bg-[#F8F7F5] rounded-xl p-3 border border-[#E8E5E0]">
                <div className="text-[9px] text-[#71717A]">{k.label}</div>
                <div className={`text-sm font-semibold ${k.color}`}>{k.value}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#F8F7F5] rounded-xl border border-[#E8E5E0] p-3">
            <div className="text-[9px] text-[#71717A] mb-2">Weekly Trend</div>
          <div className="flex items-end gap-2 h-12">
              {[35, 55, 45, 72, 60, 48, 85].map((h, i) => (
                <div key={i} className="flex-1 bg-[#0D9488] rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="flex-1 text-center text-[7px] text-[#71717A]">{d}</span>
              ))}
            </div>
          </div>
        </div>
      </BrowserFrame>
    </GradientStage>
  );
}

/* -- Step 3: Stock Health Mockup -- */
function StockMockup() {
  const rows = [
    { product: "Premium Masala 500g", warehouse: "Pune", qty: "340", health: "Healthy", color: "bg-emerald-100 text-emerald-700" },
    { product: "Gold Atta 10kg", warehouse: "Surat", qty: "42", health: "Low", color: "bg-amber-100 text-amber-700" },
    { product: "Royal Ghee 1L", warehouse: "Nagpur", qty: "8", health: "Critical", color: "bg-red-100 text-red-700" },
    { product: "Classic Tea 250g", warehouse: "Indore", qty: "210", health: "Healthy", color: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <GradientStage variant="emerald">
      <BrowserFrame url="app.ledge.in/stock">
        <div className="p-5">
          <div className="text-[11px] font-semibold text-[#1A1A1A] mb-3">Stock Health</div>
          <div className="space-y-1.5">
            <div className="grid grid-cols-4 text-[8px] text-[#71717A] uppercase tracking-wider pb-1 border-b border-[#E8E5E0]">
              <span>Product</span>
              <span>Warehouse</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Status</span>
            </div>
            {rows.map((r) => (
              <div key={r.product} className="grid grid-cols-4 items-center py-1">
                <span className="text-[10px] text-[#1A1A1A] truncate pr-1">{r.product}</span>
                <span className="text-[10px] text-[#71717A]">{r.warehouse}</span>
                <span className="text-[10px] text-[#1A1A1A] text-right">{r.qty}</span>
                <div className="text-right">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${r.color}`}>{r.health}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BrowserFrame>
    </GradientStage>
  );
}

const steps = [
  {
    badge: "01",
    title: "Your field team places an order from their phone. In under a minute.",
    description:
      "They open Ledge - no app store, no download, just a link they installed to their home screen. They select the dealer, add the products, apply any active scheme, set the payment mode. Done. The order gets a sequential number the moment it's submitted. Nothing falls through.",
    mockup: OrderMockup,
    reversed: false,
  },
  {
    badge: "02",
    title: "You see it on your dashboard immediately.",
    description:
      "The order is live. Revenue updates. Pending dispatch count moves. You're not waiting for an evening summary - you're watching your business happen, the way you'd watch a bank balance. Every order, every salesperson, every dealer. Right there.",
    mockup: DashboardMiniMockup,
    reversed: true,
  },
  {
    badge: "03",
    title: "Your ops team dispatches, stocks adjust, invoices generate - automatically.",
    description:
      "When dispatch is marked, inventory deducts from the right godown. The invoice builds itself from the order - CGST, SGST, or IGST calculated based on state codes. Your accountant generates a GST-compliant PDF without touching a calculator. No double entry. No reconciliation ritual.",
    mockup: StockMockup,
    reversed: false,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-[#1A1A1A] text-center mb-16 tracking-[-0.04em]">
            Three things happen when your team uses Ledge. All of them in under sixty seconds.
          </h2>
        </AnimateIn>

        <div className="space-y-24">
          {steps.map((step, i) => {
            const MockupComponent = step.mockup;
            return (
              <AnimateIn key={step.badge} delay={i * 0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={step.reversed ? "lg:order-2" : ""}>
                    <span className="bg-[#F0FDFA] text-[#0D9488] text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                      {step.badge}
                    </span>
                    <h3 className="font-heading font-bold text-[24px] md:text-[28px] text-[#1A1A1A]">
                      {step.title}
                    </h3>
                    <p className="font-body text-[17px] text-[#52525B] leading-[1.75] mt-4">
                      {step.description}
                    </p>
                  </div>
                  <div className={step.reversed ? "lg:order-1" : ""}>
                    <MockupComponent />
                  </div>
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
