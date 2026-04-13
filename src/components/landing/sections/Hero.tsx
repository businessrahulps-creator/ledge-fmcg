import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BrowserFrame, GradientStage } from "../DeviceFrames";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, damping: 26, stiffness: 200, delay },
});


/* -- Inline Dashboard Mockup -- */
function DashboardMockup() {
  const kpis = [
    { label: "Today's Revenue", value: "₹12,47,000", color: "text-[#0D9488]" },
    { label: "Orders Placed", value: "23", color: "text-[#1A1A1A]" },
    { label: "Pending Dispatch", value: "16", color: "text-amber-600" },
    { label: "Delivered", value: "53%", color: "text-[#0D9488]" },
  ];

  const orders = [
    { dealer: "Sharma Traders, Pune", amount: "₹12,400", status: "Dispatched", statusColor: "bg-amber-100 text-amber-700" },
    { dealer: "Gupta & Sons, Nagpur", amount: "₹8,750", status: "Delivered", statusColor: "bg-emerald-100 text-emerald-700" },
    { dealer: "Patel Agencies, Surat", amount: "₹21,300", status: "Pending", statusColor: "bg-blue-100 text-blue-700" },
  ];

  const barHeights = [40, 65, 50, 80, 70, 55, 90];

  return (
    <BrowserFrame url="app.ledge.in/dashboard">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-36 border-r border-[#E8E5E0] bg-[#FAFAF8] p-3 gap-1.5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-extrabold tracking-[-0.04em] text-[#1A1A1A]">Ledge</span>
          </div>
          {["Dashboard", "Orders", "Dealers", "Stock", "Reports"].map((item, i) => (
            <motion.div
              key={item}
              className={`text-[11px] px-2 py-1.5 rounded-md cursor-default ${i === 0 ? "bg-white font-medium text-[#1A1A1A] shadow-sm" : "text-[#71717A]"}`}
              whileHover={{ backgroundColor: i === 0 ? undefined : "#F4F4F2", x: 2 }}
              transition={{ duration: 0.15 }}
            >
              {item}
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                className="bg-white rounded-xl border border-[#E8E5E0] p-3 cursor-default"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.1, ease: "easeOut" }}
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderColor: "#D4D1CC" }}
              >
                <div className="text-[9px] text-[#71717A] mb-1">{kpi.label}</div>
                <div className={`text-xs font-semibold ${kpi.color}`}>{kpi.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="bg-white rounded-xl border border-[#E8E5E0] p-3 mb-4" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div className="text-[9px] text-[#71717A] mb-2">This Week</div>
            <div className="flex items-end gap-2 h-10">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t overflow-hidden cursor-default"
                  style={{ height: `${h}%` }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <motion.div
                    className="w-full h-full bg-[#0D9488] rounded-t"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    style={{ transformOrigin: "bottom" }}
                    transition={{ duration: 0.6, delay: 1.0 + i * 0.07, ease: "easeOut" }}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl border border-[#E8E5E0] p-3" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div className="text-[9px] text-[#71717A] mb-2">Recent Orders</div>
            <div className="space-y-1.5">
              {orders.map((o, i) => (
                <motion.div
                  key={o.dealer}
                  className="flex items-center justify-between rounded-md px-1 py-0.5 cursor-default"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.3 + i * 0.1 }}
                  whileHover={{ backgroundColor: "#FAFAF8" }}
                >
                  <span className="text-[10px] text-[#1A1A1A] truncate flex-1">{o.dealer}</span>
                  <span className="text-[10px] font-medium text-[#1A1A1A] mx-2">{o.amount}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${o.statusColor}`}>{o.status}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </BrowserFrame>
  );
}

export function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-16 px-6 bg-[#F8F7F5] py-24 md:py-32">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Text */}
        <div>
          <motion.h1
            className="font-heading font-extrabold text-[34px] md:text-[60px] text-[#1A1A1A] leading-[1.08] tracking-[-0.04em]"
            {...fadeUp(0)}
          >
            Every order your team placed today. Do you actually know about it?
          </motion.h1>

          <motion.p
            className="font-body text-[17px] md:text-[20px] text-[#52525B] leading-[1.75] max-w-xl mt-6"
            {...fadeUp(0.2)}
          >
            Ledge is a complete distribution management platform - order capture, inventory, payments, GST invoicing, dealer intelligence, and sales performance, all in one place. Your field team uses it on their phone. You run the whole business from your dashboard.
          </motion.p>

          <motion.div className="flex flex-wrap gap-4 mt-8" {...fadeUp(0.3)}>
            <Link
              to="/signup"
              className="font-body font-semibold text-sm text-white bg-[#0D9488] hover:bg-[#0F766E] px-7 py-3 rounded-2xl hover:scale-[1.01] transition-all duration-200"
            >
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="font-body font-medium text-sm text-[#1A1A1A] border border-[#D4D1CC] hover:border-[#A8A29E] px-7 py-3 rounded-2xl transition-all duration-200"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.p
            className="font-body text-sm text-[#71717A] mt-6"
            {...fadeUp(0.4)}
          >
            Used by FMCG distribution businesses across India to replace spreadsheets, WhatsApp threads, and ERPs their teams hated.
          </motion.p>

        </div>

        {/* Right - Dashboard Mockup */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 26, stiffness: 200, delay: 0.2 }}
          className="w-full max-w-lg mx-auto"
          style={{ transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)" }}
        >
          <GradientStage variant="indigo">
            <DashboardMockup />
          </GradientStage>
        </motion.div>
      </div>
    </section>
  );
}
