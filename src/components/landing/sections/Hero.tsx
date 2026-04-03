import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});


/* ── Inline Dashboard Mockup ── */
function DashboardMockup() {
  const kpis = [
    { label: "Today's Revenue", value: "₹1,84,200", color: "text-emerald-600" },
    { label: "Orders Placed", value: "47", color: "text-midnight" },
    { label: "Pending Dispatch", value: "12", color: "text-amber-600" },
    { label: "Delivered", value: "35", color: "text-emerald-600" },
  ];

  const orders = [
    { dealer: "Sharma Traders, Pune", amount: "₹12,400", status: "Dispatched", statusColor: "bg-amber-100 text-amber-700" },
    { dealer: "Gupta & Sons, Nagpur", amount: "₹8,750", status: "Delivered", statusColor: "bg-emerald-100 text-emerald-700" },
    { dealer: "Patel Agencies, Surat", amount: "₹21,300", status: "Pending", statusColor: "bg-blue-100 text-blue-700" },
  ];

  const barHeights = [40, 65, 50, 80, 70, 55, 90];

  return (
    <motion.div
      className="bg-white rounded-2xl border border-fog overflow-hidden"
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}
      whileHover={{ boxShadow: "0 12px 50px rgba(0,0,0,0.10)", y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-fog bg-[#FAFAFA]">
        <div className="flex gap-1.5">
          {["#FECACA", "#FDE68A", "#BBF7D0"].map((c, i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "#E4E4E7" }}
              whileHover={{ backgroundColor: c, scale: 1.3 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
        <div className="flex-1 mx-8">
          <div className="h-5 bg-[#F4F4F5] rounded-md flex items-center justify-center">
            <span className="text-[10px] text-[#A1A1AA]">app.ledge.in/dashboard</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-36 border-r border-fog bg-[#FAFAFA] p-3 gap-1.5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-extrabold tracking-[-0.04em] text-midnight">Ledge</span>
          </div>
          {["Dashboard", "Orders", "Dealers", "Stock", "Reports"].map((item, i) => (
            <motion.div
              key={item}
              className={`text-[11px] px-2 py-1.5 rounded-md cursor-default ${i === 0 ? "bg-white font-medium text-midnight shadow-sm" : "text-graphite"}`}
              whileHover={{ backgroundColor: i === 0 ? undefined : "#F4F4F5", x: 2 }}
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
                className="bg-white rounded-xl border border-fog p-3 cursor-default"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.1, ease: "easeOut" }}
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderColor: "#D4D4D8" }}
              >
                <div className="text-[9px] text-graphite mb-1">{kpi.label}</div>
                <div className={`text-sm font-semibold ${kpi.color}`}>{kpi.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="bg-white rounded-xl border border-fog p-3 mb-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="text-[9px] text-graphite mb-2">This Week</div>
            <div className="flex items-end gap-1 h-10">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-midnight/10 rounded-sm overflow-hidden cursor-default"
                  style={{ height: `${h}%` }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <motion.div
                    className="w-full bg-midnight rounded-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(h + 10, 100)}%` }}
                    transition={{ duration: 0.6, delay: 1.0 + i * 0.07, ease: "easeOut" }}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl border border-fog p-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="text-[9px] text-graphite mb-2">Recent Orders</div>
            <div className="space-y-1.5">
              {orders.map((o, i) => (
                <motion.div
                  key={o.dealer}
                  className="flex items-center justify-between rounded-md px-1 py-0.5 cursor-default"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.3 + i * 0.1 }}
                  whileHover={{ backgroundColor: "#FAFAFA" }}
                >
                  <span className="text-[10px] text-midnight truncate flex-1">{o.dealer}</span>
                  <span className="text-[10px] font-medium text-midnight mx-2">{o.amount}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${o.statusColor}`}>{o.status}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="min-h-screen bg-white pt-36 py-20 md:py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <div>
          <motion.h1
            className="font-heading font-extrabold text-[34px] md:text-[60px] text-midnight leading-[1.08] tracking-[-0.03em]"
            {...fadeUp(0)}
          >
            Stop chasing your field team for today's numbers.
          </motion.h1>

          <motion.p
            className="font-body text-[17px] md:text-[20px] text-graphite leading-[1.6] max-w-xl mt-6"
            {...fadeUp(0.2)}
          >
            Your team captures orders on their phones. You track every dealer,
            dispatch, and payment live from your desk. Escape the chaos of
            scattered WhatsApp chats and fragile spreadsheets.
          </motion.p>

          <motion.div className="flex flex-wrap gap-4 mt-8" {...fadeUp(0.3)}>
            <Link
              to="/signup"
              className="font-body font-semibold text-white bg-ink hover:bg-ink-light px-8 py-3.5 rounded-full hover:scale-[1.02] transition-all duration-150"
            >
              Start Free Trial
            </Link>
            <a
              href="#features"
              className="font-body font-medium text-midnight border border-fog hover:border-midnight px-8 py-3.5 rounded-full transition-all duration-150"
            >
              Watch a 2-Minute Demo
            </a>
          </motion.div>

          <motion.p
            className="font-body text-sm text-lp-zinc mt-6"
            {...fadeUp(0.4)}
          >
            Powering over 10 crore monthly orders for 50+ growing FMCG businesses.
          </motion.p>

        </div>

        {/* Right — Dashboard Mockup */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-lg mx-auto"
          style={{ transform: "perspective(1200px) rotateY(-4deg)" }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
