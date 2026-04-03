import { AnimateIn } from "../AnimateIn";

/* ── Step 1: Order Creation Phone Mockup ── */
function OrderMockup() {
  return (
    <div className="bg-white rounded-2xl border border-fog p-5 max-w-xs mx-auto" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div className="text-[11px] font-semibold text-midnight mb-3">New Order</div>
      <div className="space-y-2.5">
        <div>
          <div className="text-[9px] text-graphite mb-1">Dealer</div>
          <div className="h-7 bg-[#F4F4F5] rounded-md flex items-center px-2">
            <span className="text-[10px] text-midnight">Sharma Traders, Pune</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] text-graphite mb-1">Products</div>
          <div className="space-y-1">
            {[
              { name: "Premium Masala 500g", qty: "24", price: "₹4,800" },
              { name: "Gold Atta 10kg", qty: "12", price: "₹7,200" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between bg-[#F4F4F5] rounded-md px-2 py-1.5">
                <span className="text-[10px] text-midnight">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-graphite">x{p.qty}</span>
                  <span className="text-[10px] font-medium text-midnight">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-fog">
          <span className="text-[10px] text-graphite">Total</span>
          <span className="text-xs font-semibold text-midnight">₹12,000</span>
        </div>
        <div className="bg-ink text-white text-[10px] font-medium text-center py-2 rounded-lg">
          Place Order
        </div>
      </div>
    </div>
  );
}

/* ── Step 2: Dashboard KPI Mockup ── */
function DashboardMiniMockup() {
  const kpis = [
    { label: "Revenue", value: "₹1.84L", color: "text-emerald-600" },
    { label: "Orders", value: "47", color: "text-midnight" },
    { label: "Pending", value: "12", color: "text-amber-600" },
    { label: "Delivered", value: "35", color: "text-emerald-600" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-fog p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#FAFAFA] rounded-xl p-3 border border-fog">
            <div className="text-[9px] text-graphite">{k.label}</div>
            <div className={`text-sm font-semibold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#FAFAFA] rounded-xl border border-fog p-3">
        <div className="text-[9px] text-graphite mb-2">Weekly Trend</div>
        <div className="flex items-end gap-1.5 h-12">
          {[35, 55, 45, 72, 60, 48, 85].map((h, i) => (
            <div key={i} className="flex-1 bg-midnight rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="flex-1 text-center text-[7px] text-graphite">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Step 3: Stock Health Mockup ── */
function StockMockup() {
  const rows = [
    { product: "Premium Masala 500g", warehouse: "Pune", qty: "340", health: "Healthy", color: "bg-emerald-100 text-emerald-700" },
    { product: "Gold Atta 10kg", warehouse: "Surat", qty: "42", health: "Low", color: "bg-amber-100 text-amber-700" },
    { product: "Royal Ghee 1L", warehouse: "Nagpur", qty: "8", health: "Critical", color: "bg-red-100 text-red-700" },
    { product: "Classic Tea 250g", warehouse: "Indore", qty: "210", health: "Healthy", color: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-fog p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div className="text-[11px] font-semibold text-midnight mb-3">Stock Health</div>
      <div className="space-y-1.5">
        <div className="grid grid-cols-4 text-[8px] text-graphite uppercase tracking-wider pb-1 border-b border-fog">
          <span>Product</span>
          <span>Godown</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Status</span>
        </div>
        {rows.map((r) => (
          <div key={r.product} className="grid grid-cols-4 items-center py-1">
            <span className="text-[10px] text-midnight truncate pr-1">{r.product}</span>
            <span className="text-[10px] text-graphite">{r.godown}</span>
            <span className="text-[10px] text-midnight text-right">{r.qty}</span>
            <div className="text-right">
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${r.color}`}>{r.health}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const steps = [
  {
    badge: "Step 1",
    title: "Your salesperson places the order.",
    description:
      "They open Ordra on their phone. It works like an app, no Play Store needed. Select the dealer, tap the products, confirm pricing. Done in under a minute. Even if they're in a village with no signal, it saves locally and syncs the moment connectivity returns.",
    mockup: OrderMockup,
    reversed: false,
  },
  {
    badge: "Step 2",
    title: "You see everything, instantly.",
    description:
      "The order appears on your dashboard. Revenue updates. Pending count changes. That dealer's order history grows. No phone call. No WhatsApp message. No delay. You see what your team sold today the same way you check the weather. Just open the app.",
    mockup: DashboardMiniMockup,
    reversed: true,
  },
  {
    badge: "Step 3",
    title: "You spot what matters before it becomes a problem.",
    description:
      "Your Surat godown is at 12% stock on your best-selling SKU. Your newest salesperson hasn't logged an order in 3 days. A dealer's payment has been partial for 2 weeks. Ordra surfaces these things. You act on data, not hunches.",
    mockup: StockMockup,
    reversed: false,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            Three steps. Sixty seconds. Total clarity.
          </h2>
        </AnimateIn>

        <div className="space-y-24">
          {steps.map((step, i) => {
            const MockupComponent = step.mockup;
            return (
              <AnimateIn key={step.badge} delay={i * 0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={step.reversed ? "lg:order-2" : ""}>
                    <span className="bg-accent-wash text-accent-indigo text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                      {step.badge}
                    </span>
                    <h3 className="font-heading font-bold text-[24px] md:text-[28px] text-midnight">
                      {step.title}
                    </h3>
                    <p className="font-body text-[17px] text-graphite leading-[1.7] mt-4">
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
