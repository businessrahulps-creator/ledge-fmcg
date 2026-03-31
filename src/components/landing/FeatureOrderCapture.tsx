import { ShoppingCart, Plus, CreditCard, Truck } from "lucide-react";
import { AnimateIn } from "./AnimateIn";

function OrderMockup() {
  return (
    <div className="rounded-xl border border-[#1E1E2C] bg-[#16161F] p-5 md:p-6 text-sm">
      <div className="text-base font-semibold text-[#F2F2F5] mb-5">New Order</div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#55556A] mb-1 block">Distributor</label>
          <div className="h-10 px-3 rounded-lg bg-[#0F0F18] border border-[#1E1E2C] flex items-center text-[#8888A0] text-sm">
            Kerala Traders — Thrissur
          </div>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#55556A] mb-1 block">Salesperson</label>
          <div className="h-10 px-3 rounded-lg bg-[#0F0F18] border border-[#1E1E2C] flex items-center text-[#8888A0] text-sm">
            Rajesh Kumar
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#55556A] mb-2 block">Products</label>
          <div className="rounded-lg border border-[#1E1E2C] overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-[#0F0F18] text-[10px] text-[#55556A] uppercase tracking-wider">
              <div>Product</div><div>Qty</div><div>Price</div><div>Total</div>
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs text-[#F2F2F5] border-b border-[#1E1E2C]">
              <div>Masala Mix</div><div>120</div><div>₹80</div><div>₹9,600</div>
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs text-[#F2F2F5]">
              <div>Rice Flour</div><div>40</div><div>₹70</div><div>₹2,800</div>
            </div>
          </div>
          <button className="mt-2 text-xs text-[#3D6FFF] flex items-center gap-1">
            <Plus size={14} /> Add product
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#1E1E2C]">
          <span className="text-[#8888A0]">Order Total</span>
          <span className="text-lg font-bold text-[#F2F2F5]">₹12,400</span>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#55556A] mb-2 block">Payment Mode</label>
          <div className="flex gap-1">
            {["Cash", "UPI", "Bank", "Cheque"].map((m, i) => (
              <div
                key={m}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${
                  i === 1 ? "bg-[#3D6FFF] text-white" : "bg-[#0F0F18] text-[#8888A0] border border-[#1E1E2C]"
                }`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#55556A] mb-2 block">Payment Status</label>
          <div className="flex gap-2">
            {[
              { label: "Paid", color: "#22C55E", active: true },
              { label: "Partial", color: "#F59E0B", active: false },
              { label: "Pending", color: "#EF4444", active: false },
            ].map((s) => (
              <span
                key={s.label}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: s.active ? s.color + "20" : "#0F0F18",
                  color: s.active ? s.color : "#55556A",
                  border: s.active ? "none" : "1px solid #1E1E2C",
                }}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <button className="w-full h-10 rounded-lg bg-[#3D6FFF] text-white text-sm font-medium hover:bg-[#5585FF] transition-colors">
          Save Order
        </button>
      </div>
    </div>
  );
}

export function FeatureOrderCapture() {
  const features = [
    { icon: ShoppingCart, text: "Select distributor from your master list" },
    { icon: Plus, text: "Add multiple products with quantity and price override" },
    { icon: CreditCard, text: "Capture payment mode — Cash, UPI, Cheque, Bank Transfer" },
    { icon: Truck, text: "Add dispatch details and delivery status" },
  ];

  return (
    <section id="features" className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <AnimateIn>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-[#55556A] font-semibold mb-4">
                01 / Order Capture
              </div>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#F2F2F5] leading-tight mb-4">
                Log every sale in seconds. Nothing slips through.
              </h2>
              <p className="text-base text-[#8888A0] leading-[1.7] mb-8">
                Your sales manager selects a distributor, adds products, sets quantities, and captures
                payment mode — all from their phone. Orders are saved instantly. No more WhatsApp messages.
                No more guessing.
              </p>
              <div className="space-y-4">
                {features.map((f) => (
                  <div key={f.text} className="flex items-start gap-3">
                    <f.icon size={20} className="text-[#3D6FFF] mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#8888A0]">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <OrderMockup />
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
