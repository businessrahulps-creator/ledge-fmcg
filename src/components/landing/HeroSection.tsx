import { Link } from "react-router-dom";
import { AnimateIn } from "./AnimateIn";

function DashboardMockup() {
  const kpis = [
    { label: "Total Sales", value: "₹4,82,000", color: "#F2F2F5" },
    { label: "Orders This Month", value: "84", color: "#F2F2F5" },
    { label: "Pending Payments", value: "₹92,400", color: "#F59E0B" },
    { label: "Delivered", value: "71", color: "#22C55E" },
  ];

  const barData = [
    { month: "Oct", value: 56, amount: "₹2.8L" },
    { month: "Nov", value: 62, amount: "₹3.1L" },
    { month: "Dec", value: 80, amount: "₹4.0L" },
    { month: "Jan", value: 72, amount: "₹3.6L" },
    { month: "Feb", value: 84, amount: "₹4.2L" },
    { month: "Mar", value: 96, amount: "₹4.8L" },
  ];

  const orders = [
    { dist: "Kerala Traders", product: "Masala Mix", qty: 120, amount: "₹18,000", status: "Paid", statusColor: "#22C55E" },
    { dist: "Star Distributors", product: "Rice Flour", qty: 80, amount: "₹12,400", status: "Partial", statusColor: "#F59E0B" },
    { dist: "Prime Agencies", product: "Coconut Oil", qty: 200, amount: "₹42,000", status: "Pending", statusColor: "#EF4444" },
  ];

  const sidebarItems = ["Dashboard", "Orders", "Distributors", "Products", "Reports"];

  return (
    <div className="w-full max-w-[1100px] mx-auto rounded-xl border border-[#1E1E2C] bg-[#0F0F18] overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E1E2C] bg-[#08080D]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#EF4444]/60" />
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60" />
          <div className="w-3 h-3 rounded-full bg-[#22C55E]/60" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-[#16161F] text-[#55556A] text-xs">app.ledge.in/dashboard</div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-48 border-r border-[#1E1E2C] bg-[#08080D] p-4 gap-1">
          <div className="mb-6">
            <span className="font-extrabold text-sm tracking-[-0.04em] text-[#F2F2F5]">Ledge</span>
          </div>
          {sidebarItems.map((item, i) => (
            <div
              key={item}
              className={`px-3 py-2 rounded-lg text-sm ${
                i === 0 ? "bg-[#3D6FFF]/10 text-[#3D6FFF]" : "text-[#8888A0]"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 min-w-0">
          <div className="text-lg font-semibold text-[#F2F2F5] mb-4">Dashboard</div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {kpis.map((k) => (
              <div key={k.label} className="p-3 rounded-xl bg-[#16161F] border border-[#1E1E2C]">
                <div className="text-[11px] text-[#55556A] mb-1">{k.label}</div>
                <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Bar chart */}
            <div className="flex-1 p-4 rounded-xl bg-[#16161F] border border-[#1E1E2C]">
              <div className="text-sm font-medium text-[#F2F2F5] mb-4">Monthly Sales</div>
              <div className="flex items-end gap-3 h-32">
                {barData.map((b) => (
                  <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[9px] text-[#55556A]">{b.amount}</div>
                    <div
                      className="w-full rounded-t-md bg-[#3D6FFF]"
                      style={{ height: `${b.value}%` }}
                    />
                    <div className="text-[10px] text-[#55556A]">{b.month}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="flex-1 p-4 rounded-xl bg-[#16161F] border border-[#1E1E2C]">
              <div className="text-sm font-medium text-[#F2F2F5] mb-3">Recent Orders</div>
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.dist} className="flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="text-[#F2F2F5] truncate">{o.dist}</div>
                      <div className="text-[#55556A]">{o.product} × {o.qty}</div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-[#F2F2F5]">{o.amount}</div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: o.statusColor + "20", color: o.statusColor }}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6">
      <div className="max-w-[1200px] mx-auto text-center">
        <AnimateIn>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1E1E2C] bg-[#16161F] text-xs text-[#8888A0] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#3D6FFF] animate-pulse" />
            Trusted by FMCG teams across India
          </div>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-bold text-[#F2F2F5] tracking-[-0.03em] leading-[1.05] mb-6">
            Sales operations,
            <br />
            finally under control.
          </h1>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <p className="text-base md:text-xl text-[#8888A0] leading-[1.7] max-w-[480px] mx-auto mb-10">
            Ledge helps FMCG companies capture sales orders, manage distributors,
            and track payments — all in one clean, fast platform.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.3}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link
              to="/signup"
              className="h-12 px-8 rounded-xl bg-[#3D6FFF] text-white font-medium flex items-center hover:bg-[#5585FF] hover:scale-[1.02] transition-all duration-150"
            >
              Start free trial
            </Link>
            <a
              href="#features"
              className="h-12 px-8 rounded-xl border border-[#1E1E2C] text-[#F2F2F5] font-medium flex items-center hover:border-[#2E2E3E] transition-all duration-150"
            >
              See how it works
            </a>
          </div>
          <p className="text-sm text-[#55556A]">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </AnimateIn>

        <AnimateIn delay={0.5} className="mt-16">
          <DashboardMockup />
        </AnimateIn>
      </div>
    </section>
  );
}
