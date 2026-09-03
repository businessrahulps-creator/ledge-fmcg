import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// V3 brand: Electric / Ink / Lime / Mist — no warm tones.
const C = "#1B2130";              // Ink (foreground)
const C_MUTED = "#5C6479";        // Ink-tinted muted
const C_FAINT = "#A6AABB";        // Ink-tinted faint
const FILL_BG = "rgba(27,33,48,0.025)";
const FILL_ACCENT = "rgba(27,33,48,0.06)";
const ZEBRA = "#F3F3F8";          // Mist tint
const SURFACE = "#FFFFFF";        // card surface (kept literal — paper)
const HAIRLINE = "#E3E3EE";       // Mist hairline
const INDIGO = "#1B57F5";         // Electric accent
const INDIGO_SOFT = "rgba(27,87,245,0.08)";
const EMERALD = "#1B57F5";        // Electric (was Forest)
const EMERALD_SOFT = "#E7EDFE";
const EMERALD_BORDER = "#CBD9FC";
const AMBER = "#1B2130";          // Ink (was Amber)
const AMBER_SOFT = "#EFEFF6";
const AMBER_BORDER = "#DFDFEC";
const INDIGO_TEXT = "#1443C9";    // Deep Electric
const INDIGO_PILL_BG = "#E7EDFE";
const INDIGO_PILL_BORDER = "#CBD9FC";

const STROKE_W = 1;

function useSvgInView() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return { ref, inView };
}

const container = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, scale: 0.98 },
  animate: inView ? { opacity: 1, scale: 1 } : {},
  transition: { type: "spring" as const, damping: 30, stiffness: 180, delay },
});

const drawLine = (inView: boolean, delay: number) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: inView ? { pathLength: 1, opacity: 1 } : {},
  transition: { duration: 1.2, ease: "easeOut" as const, delay },
});

const fadeRect = (inView: boolean, delay: number) => ({
  initial: { opacity: 0 },
  animate: inView ? { opacity: 1 } : {},
  transition: { duration: 0.6, ease: "easeOut" as const, delay },
});

const fadeText = (inView: boolean, delay: number) => ({
  initial: { opacity: 0 },
  animate: inView ? { opacity: 1 } : {},
  transition: { duration: 0.5, ease: "easeOut" as const, delay: delay + 0.2 },
});

// Bar grow from baseline (scaleY origin = bottom)
const growBar = (inView: boolean, delay: number) => ({
  initial: { scaleY: 0, opacity: 0 },
  animate: inView ? { scaleY: 1, opacity: 1 } : {},
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
});

const textStyle = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  fill: C,
  letterSpacing: "0.01em",
};

// Status pill renderer — semantic color tokens
type StatusKind = "Delivered" | "Pending" | "Dispatched";
function statusPalette(s: StatusKind) {
  if (s === "Delivered") return { fill: EMERALD_SOFT, stroke: EMERALD_BORDER, text: EMERALD };
  if (s === "Pending") return { fill: AMBER_SOFT, stroke: AMBER_BORDER, text: AMBER };
  return { fill: INDIGO_PILL_BG, stroke: INDIGO_PILL_BORDER, text: INDIGO_TEXT };
}

/* ─── 1. Hero Dashboard — alive, real product feel ─── */
export function DashboardSvg() {
  const { ref, inView } = useSvgInView();

  const kpiCards = [
    { x: 16, w: 96, label: "Revenue", value: "₹12.4L", delta: "+12%" },
    { x: 120, w: 96, label: "Orders", value: "347", delta: "+8%" },
    { x: 224, w: 96, label: "Dispatch", value: "289", delta: "+5%" },
    { x: 328, w: 96, label: "Delivery", value: "94%", delta: "+2%" },
  ];

  // Vertical bar chart — 7 weekdays, "Today" highlighted
  const days = [
    { label: "Mon", h: 38 },
    { label: "Tue", h: 26 },
    { label: "Wed", h: 54 },
    { label: "Thu", h: 22 },
    { label: "Fri", h: 44 },
    { label: "Sat", h: 60 },
    { label: "Sun", h: 32 },
  ];
  const todayIdx = 5;
  const chartTop = 108;
  const chartBaseline = 188;
  const chartLeft = 36;
  const barGap = 50;
  const barW = 26;

  const orders: { id: string; name: string; amount: string; status: StatusKind; selected?: boolean }[] = [
    { id: "#ORD-247", name: "Sharma Stores", amount: "₹48,200", status: "Delivered", selected: true },
    { id: "#ORD-246", name: "Gupta Trading", amount: "₹32,100", status: "Pending" },
    { id: "#ORD-245", name: "Patel Dist.",   amount: "₹19,800", status: "Dispatched" },
    { id: "#ORD-244", name: "Singh Retail",  amount: "₹56,400", status: "Delivered" },
  ];

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 440 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      <defs>
        <linearGradient id="ds-shimmer" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(160,82,45,0.10)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="ds-clip">
          <rect x="0" y="0" width="440" height="360" rx="8" />
        </clipPath>
      </defs>

      {/* KPI cards */}
      {kpiCards.map((card, i) => (
        <g key={`kpi-${i}`}>
          <motion.rect
            x={card.x} y={16} width={card.w} height={56} rx={6}
            fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
            {...fadeRect(inView, 0.1 + i * 0.1)}
          />
          <motion.text
            x={card.x + 12} y={32} fontSize={8} opacity={0.55}
            style={{ ...textStyle, fill: C_MUTED }}
            {...fadeText(inView, 0.1 + i * 0.1)}
          >
            {card.label}
          </motion.text>
          <motion.text
            x={card.x + 12} y={50} fontSize={13} fontWeight={700}
            style={textStyle}
            {...fadeText(inView, 0.15 + i * 0.1)}
          >
            {card.value}
          </motion.text>
          {/* delta chip */}
          <motion.text
            x={card.x + 12} y={64} fontSize={7} fontWeight={600}
            style={{ ...textStyle, fill: EMERALD }}
            {...fadeText(inView, 0.2 + i * 0.1)}
          >
            ↑ {card.delta}
          </motion.text>
        </g>
      ))}

      {/* Bar chart area */}
      <motion.rect
        x={16} y={88} width={408} height={120} rx={6}
        fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
        {...fadeRect(inView, 0.3)}
      />
      <motion.text
        x={28} y={104} fontSize={9} fontWeight={600}
        style={{ ...textStyle, fill: C_MUTED }}
        {...fadeText(inView, 0.3)}
      >
        This Week
      </motion.text>
      {/* baseline */}
      <line x1={chartLeft - 8} y1={chartBaseline + 0.5} x2={408} y2={chartBaseline + 0.5} stroke="#E8E1D4" strokeWidth={0.5} />

      {/* Vertical bars */}
      {days.map((d, i) => {
        const x = chartLeft + i * barGap;
        const isToday = i === todayIdx;
        return (
          <g key={`bar-${i}`}>
            <motion.rect
              x={x} y={chartBaseline - d.h} width={barW} height={d.h} rx={3}
              fill={isToday ? INDIGO : "#E8E1D4"}
              style={{ transformOrigin: `${x + barW / 2}px ${chartBaseline}px` }}
              {...growBar(inView, 0.4 + i * 0.06)}
            />
            <motion.text
              x={x + barW / 2} y={chartBaseline + 12}
              fontSize={7} textAnchor="middle"
              style={{ ...textStyle, fill: isToday ? INDIGO : C_FAINT }}
              fontWeight={isToday ? 600 : 400}
              {...fadeText(inView, 0.45 + i * 0.06)}
            >
              {d.label}
            </motion.text>
          </g>
        );
      })}

      {/* Order rows area */}
      <motion.rect
        x={16} y={224} width={408} height={124} rx={6}
        fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
        {...fadeRect(inView, 0.6)}
      />
      {/* Header */}
      <motion.text
        x={28} y={244} fontSize={9} fontWeight={600}
        style={{ ...textStyle, fill: C_MUTED }}
        {...fadeText(inView, 0.6)}
      >
        Recent Orders
      </motion.text>
      {/* Live indicator with heartbeat */}
      <motion.circle
        cx={108} cy={241} r={3}
        fill={EMERALD}
        style={{ transformOrigin: "108px 241px" }}
        {...fadeRect(inView, 0.65)}
        className="lp-live-dot-pulse"
      />
      <motion.text
        x={116} y={244} fontSize={7} fontWeight={600}
        style={{ ...textStyle, fill: EMERALD }}
        {...fadeText(inView, 0.65)}
      >
        Live
      </motion.text>

      <line x1={28} y1={250} x2={412} y2={250} stroke="#E8E1D4" strokeWidth={0.5} />

      {/* Rows */}
      {orders.map((order, i) => {
        const y = 268 + i * 18;
        const pal = statusPalette(order.status);
        return (
          <g key={`row-${i}`}>
            {/* Selected row background */}
            {order.selected && (
              <motion.rect
                x={20} y={y - 12} width={400} height={16} rx={3}
                fill={INDIGO_SOFT}
                {...fadeRect(inView, 0.66)}
              />
            )}
            {/* Selected row left bar */}
            {order.selected && (
              <motion.rect
                x={20} y={y - 12} width={2} height={16}
                fill={INDIGO}
                {...fadeRect(inView, 0.66)}
              />
            )}
            <motion.text
              x={28} y={y} fontSize={8} fontWeight={order.selected ? 600 : 500}
              style={textStyle}
              {...fadeText(inView, 0.68 + i * 0.08)}
            >
              {order.id}
            </motion.text>
            <motion.text
              x={92} y={y} fontSize={8}
              style={{ ...textStyle, fill: C_MUTED }}
              {...fadeText(inView, 0.7 + i * 0.08)}
            >
              {order.name}
            </motion.text>
            <motion.text
              x={250} y={y} fontSize={8} fontWeight={600}
              style={textStyle}
              {...fadeText(inView, 0.71 + i * 0.08)}
            >
              {order.amount}
            </motion.text>
            {/* Status pill */}
            <motion.rect
              x={336} y={y - 9} width={64} height={13} rx={6.5}
              fill={pal.fill} stroke={pal.stroke} strokeWidth={0.75}
              {...fadeRect(inView, 0.72 + i * 0.08)}
            />
            <motion.text
              x={368} y={y} fontSize={6.5} fontWeight={600} textAnchor="middle"
              style={{ ...textStyle, fill: pal.text }}
              {...fadeText(inView, 0.74 + i * 0.08)}
            >
              {order.status}
            </motion.text>
          </g>
        );
      })}

      {/* Scanline shimmer — one-shot sweep on view */}
      {inView && (
        <g clipPath="url(#ds-clip)">
          <motion.rect
            x={0} width={440} height={80}
            fill="url(#ds-shimmer)"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 360, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }}
          />
        </g>
      )}
    </motion.svg>
  );
}

/* ─── 2. Order Form (Phone) — real qty values, alive button ─── */
export function OrderFormSvg() {
  const { ref, inView } = useSvgInView();

  // Each product gets a real qty + a category dot color
  const products = [
    { name: "Maggi 2-Min 12pk", price: "₹168", qty: "12", dot: "#A0522D" },
    { name: "Surf Excel 1kg",   price: "₹245", qty: "6",  dot: "#0F1F3A" },
    { name: "Parle-G 800g",     price: "₹52",  qty: "24", dot: "#0E2A22" },
    { name: "Vim Bar 200g",     price: "₹30",  qty: "8",  dot: "#7A1F12" },
  ];

  const radios = [
    { label: "Cash", active: true },
    { label: "UPI", active: false },
    { label: "Cheque", active: false },
  ];

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 260 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      {/* Dropdown */}
      <motion.rect
        x={20} y={20} width={220} height={36} rx={6}
        fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
        {...fadeRect(inView, 0.1)}
      />
      <motion.text
        x={34} y={42} fontSize={9}
        style={{ ...textStyle, fill: C_MUTED }}
        {...fadeText(inView, 0.1)}
      >
        Select Dealer
      </motion.text>
      <motion.path d="M218 34 L224 40 L230 34" stroke={C_MUTED} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" {...drawLine(inView, 0.25)} />

      {/* Divider */}
      <motion.line x1={20} y1={72} x2={240} y2={72} stroke="#E8E1D4" strokeWidth={0.5} {...drawLine(inView, 0.3)} />

      {/* Product lines */}
      {products.map((prod, i) => {
        const y = 88 + i * 44;
        return (
          <g key={`prod-${i}`}>
            <motion.rect x={20} y={y} width={220} height={34} rx={4} fill={ZEBRA} {...fadeRect(inView, 0.3 + i * 0.12)} />
            {/* Category dot */}
            <motion.circle
              cx={30} cy={y + 17} r={2.5} fill={prod.dot}
              {...fadeRect(inView, 0.32 + i * 0.12)}
            />
            <motion.text
              x={40} y={y + 21} fontSize={8.5} fontWeight={500}
              style={textStyle}
              {...fadeText(inView, 0.3 + i * 0.12)}
            >
              {prod.name}
            </motion.text>
            {/* Qty box — real number */}
            <motion.rect
              x={155} y={y + 8} width={28} height={18} rx={4}
              fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={0.75}
              {...fadeRect(inView, 0.4 + i * 0.12)}
            />
            <motion.text
              x={169} y={y + 21} fontSize={9} fontWeight={600} textAnchor="middle"
              style={textStyle}
              {...fadeText(inView, 0.42 + i * 0.12)}
            >
              {prod.qty}
            </motion.text>
            {/* Price */}
            <motion.text
              x={195} y={y + 21} fontSize={8.5} fontWeight={600}
              style={{ ...textStyle, fill: C_MUTED }}
              {...fadeText(inView, 0.4 + i * 0.12)}
            >
              {prod.price}
            </motion.text>
          </g>
        );
      })}

      {/* Divider */}
      <motion.line x1={20} y1={270} x2={240} y2={270} stroke="#E8E1D4" strokeWidth={0.5} {...drawLine(inView, 0.6)} />

      {/* Subtotal */}
      <motion.text
        x={140} y={290} fontSize={8}
        style={{ ...textStyle, fill: C_MUTED }}
        {...fadeText(inView, 0.62)}
      >
        Subtotal
      </motion.text>
      <motion.text
        x={200} y={290} fontSize={10} fontWeight={700}
        style={textStyle}
        {...fadeText(inView, 0.64)}
      >
        ₹2,340
      </motion.text>

      {/* Scheme tag pill — terracotta accent */}
      <motion.rect
        x={20} y={300} width={90} height={22} rx={11}
        fill={INDIGO_PILL_BG} stroke={INDIGO_PILL_BORDER} strokeWidth={STROKE_W}
        {...fadeRect(inView, 0.65)}
      />
      <motion.text
        x={65} y={314} fontSize={7.5} fontWeight={600} textAnchor="middle"
        style={{ ...textStyle, fill: INDIGO_TEXT }}
        {...fadeText(inView, 0.65)}
      >
        Diwali 5+1
      </motion.text>

      {/* Radio buttons */}
      {radios.map((r, i) => (
        <g key={`radio-${i}`}>
          <motion.circle
            cx={36 + i * 72}
            cy={350}
            r={7}
            stroke={r.active ? INDIGO : C_FAINT}
            strokeWidth={STROKE_W}
            fill={"#FFFFFF"}
            {...fadeRect(inView, 0.7 + i * 0.06)}
          />
          {r.active && (
            <motion.circle cx={36} cy={350} r={3.5} fill={INDIGO} {...fadeRect(inView, 0.75)} />
          )}
          <motion.text
            x={48 + i * 72} y={354} fontSize={8} fontWeight={r.active ? 600 : 400}
            style={{ ...textStyle, fill: r.active ? C : C_MUTED }}
            {...fadeText(inView, 0.72 + i * 0.06)}
          >
            {r.label}
          </motion.text>
        </g>
      ))}

      {/* Divider */}
      <motion.line x1={20} y1={375} x2={240} y2={375} stroke="#E8E1D4" strokeWidth={0.5} {...drawLine(inView, 0.8)} />

      {/* Submit button — solid terracotta, breathes */}
      <motion.rect
        x={50} y={390} width={160} height={36} rx={8}
        fill={INDIGO}
        {...fadeRect(inView, 0.85)}
        className="lp-btn-breathe"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
      <motion.text
        x={113} y={412} fontSize={10.5} fontWeight={700} textAnchor="middle"
        style={{ ...textStyle, fill: "#FFFFFF" }}
        {...fadeText(inView, 0.87)}
      >
        Place Order
      </motion.text>
      <motion.path
        d="M158 408 L165 408 L161 404 M165 408 L161 412"
        stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        {...drawLine(inView, 0.9)}
      />
    </motion.svg>
  );
}

/* ─── 3. Dashboard Mini ─── */
export function DashboardMiniSvg() {
  const { ref, inView } = useSvgInView();

  const kpis = [
    { x: 16, w: 124, label: "Revenue", value: "₹4.8L", delta: "+9%" },
    { x: 148, w: 124, label: "Orders", value: "230", delta: "+4%" },
    { x: 280, w: 124, label: "Pending", value: "₹57K", delta: "−6%", down: true },
  ];

  const orders: { id: string; name: string; amount: string; status: StatusKind }[] = [
    { id: "#247", name: "Sharma Stores",      amount: "₹48,200", status: "Delivered" },
    { id: "#246", name: "Gupta Trading",      amount: "₹32,100", status: "Pending" },
    { id: "#245", name: "Patel Distributors", amount: "₹19,800", status: "Dispatched" },
    { id: "#244", name: "Singh Retail",       amount: "₹56,400", status: "Delivered" },
    { id: "#243", name: "Jain Agency",        amount: "₹14,250", status: "Pending" },
  ];

  // Sparkline path — 8 points across the top
  const sparkPath = "M 24 64 L 60 50 L 96 56 L 132 38 L 168 44 L 204 28 L 240 34 L 276 18";

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      <defs>
        <linearGradient id="dm-spark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={INDIGO} stopOpacity="0.4" />
          <stop offset="100%" stopColor={INDIGO} stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* 3 KPI cards */}
      {kpis.map((card, i) => (
        <g key={`kpi-${i}`}>
          <motion.rect
            x={card.x} y={16} width={card.w} height={56} rx={6}
            fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
            {...fadeRect(inView, 0.1 + i * 0.12)}
          />
          <motion.text
            x={card.x + 14} y={34} fontSize={8}
            style={{ ...textStyle, fill: C_MUTED }}
            {...fadeText(inView, 0.1 + i * 0.12)}
          >
            {card.label}
          </motion.text>
          <motion.text
            x={card.x + 14} y={54} fontSize={14} fontWeight={700}
            style={textStyle}
            {...fadeText(inView, 0.15 + i * 0.12)}
          >
            {card.value}
          </motion.text>
          <motion.text
            x={card.x + 14} y={66} fontSize={7} fontWeight={600}
            style={{ ...textStyle, fill: card.down ? AMBER : EMERALD }}
            {...fadeText(inView, 0.2 + i * 0.12)}
          >
            {card.down ? "↓" : "↑"} {card.delta}
          </motion.text>
          {/* mini sparkline only on first card */}
          {i === 0 && (
            <motion.path
              d={sparkPath}
              stroke="url(#dm-spark)"
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              {...drawLine(inView, 0.3)}
              style={{ transform: `translate(${card.x - 24}px, 0px) scale(0.32, 0.4)`, transformOrigin: "0 0", opacity: 0.5 }}
            />
          )}
        </g>
      ))}

      {/* Orders list */}
      <motion.rect
        x={16} y={88} width={388} height={180} rx={6}
        fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
        {...fadeRect(inView, 0.4)}
      />
      {/* Header */}
      <motion.text
        x={28} y={110} fontSize={9} fontWeight={600}
        style={{ ...textStyle, fill: C_MUTED }}
        {...fadeText(inView, 0.4)}
      >
        Recent Orders
      </motion.text>
      {/* Live indicator with heartbeat */}
      <motion.circle
        cx={120} cy={107} r={3}
        fill={EMERALD}
        {...fadeRect(inView, 0.45)}
        className="lp-live-dot-pulse"
      />
      <motion.text
        x={128} y={110} fontSize={7} fontWeight={600}
        style={{ ...textStyle, fill: EMERALD }}
        {...fadeText(inView, 0.45)}
      >
        Live
      </motion.text>

      <line x1={28} y1={118} x2={388} y2={118} stroke="#E8E1D4" strokeWidth={0.5} />

      {/* Column headers */}
      {[{ x: 28, t: "Order" }, { x: 100, t: "Dealer" }, { x: 248, t: "Amount" }, { x: 336, t: "Status" }].map((col, i) => (
        <motion.text
          key={`colh-${i}`}
          x={col.x} y={134} fontSize={7} fontWeight={600}
          style={{ ...textStyle, fill: C_FAINT }}
          {...fadeText(inView, 0.5)}
        >
          {col.t}
        </motion.text>
      ))}

      <line x1={28} y1={140} x2={388} y2={140} stroke="#F1F5F9" strokeWidth={0.5} />

      {/* 5 rows */}
      {orders.map((order, i) => {
        const y = 158 + i * 22;
        const pal = statusPalette(order.status);
        return (
          <g key={`r-${i}`}>
            {/* zebra background */}
            {i % 2 === 1 && (
              <motion.rect
                x={20} y={y - 13} width={380} height={20}
                fill={ZEBRA}
                {...fadeRect(inView, 0.54 + i * 0.08)}
              />
            )}
            <motion.text
              x={28} y={y} fontSize={8} fontWeight={500}
              style={textStyle}
              {...fadeText(inView, 0.55 + i * 0.08)}
            >
              {order.id}
            </motion.text>
            <motion.text
              x={100} y={y} fontSize={8}
              style={{ ...textStyle, fill: C_MUTED }}
              {...fadeText(inView, 0.57 + i * 0.08)}
            >
              {order.name}
            </motion.text>
            <motion.text
              x={248} y={y} fontSize={8} fontWeight={600}
              style={textStyle}
              {...fadeText(inView, 0.58 + i * 0.08)}
            >
              {order.amount}
            </motion.text>
            {/* Status pill */}
            <motion.rect
              x={332} y={y - 9} width={62} height={13} rx={6.5}
              fill={pal.fill} stroke={pal.stroke} strokeWidth={0.75}
              {...fadeRect(inView, 0.6 + i * 0.08)}
            />
            <motion.text
              x={363} y={y} fontSize={6.5} fontWeight={600} textAnchor="middle"
              style={{ ...textStyle, fill: pal.text }}
              {...fadeText(inView, 0.62 + i * 0.08)}
            >
              {order.status}
            </motion.text>
          </g>
        );
      })}
    </motion.svg>
  );
}

/* ─── 4. Invoice / Stock ─── */
export function InvoiceStockSvg() {
  const { ref, inView } = useSvgInView();

  const headers = [
    { x: 32, label: "Item" },
    { x: 140, label: "Qty" },
    { x: 210, label: "Rate" },
    { x: 280, label: "GST" },
    { x: 340, label: "Amount" },
  ];

  const rows = [
    ["Maggi 2-Min", "24", "₹168", "18%", "₹4,032"],
    ["Surf Excel", "12", "₹245", "18%", "₹2,940"],
    ["Parle-G", "48", "₹52", "5%", "₹2,496"],
    ["Vim Bar", "36", "₹30", "18%", "₹1,080"],
    ["Clinic Plus", "20", "₹95", "18%", "₹1,900"],
  ];

  const gstRows = [
    { label: "CGST 9%", value: "₹1,120", accent: false },
    { label: "SGST 9%", value: "₹1,120", accent: false },
    { label: "Total", value: "₹14,688", accent: true },
  ];

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 420 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      <defs>
        <linearGradient id="is-btn-shimmer" x1="-100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="is-btn-clip">
          <rect x="130" y="300" width="160" height="28" rx="8" />
        </clipPath>
      </defs>

      {/* Auto-generated eyebrow */}
      <motion.circle cx={22} cy={20} r={2.5} fill={EMERALD} {...fadeRect(inView, 0.04)} />
      <motion.text
        x={28} y={22} fontSize={6.5} fontWeight={600}
        style={{ ...textStyle, fill: EMERALD, letterSpacing: "0.08em" }}
        {...fadeText(inView, 0.04)}
      >
        AUTO-GENERATED
      </motion.text>
      <motion.text
        x={104} y={22} fontSize={7} fontWeight={500}
        style={{ ...textStyle, fill: C_MUTED }}
        {...fadeText(inView, 0.06)}
      >
        INV-2026-0184
      </motion.text>

      {/* Table area */}
      <motion.rect
        x={16} y={30} width={388} height={170} rx={6}
        fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
        {...fadeRect(inView, 0.1)}
      />
      {/* Header band */}
      <motion.rect
        x={16} y={30} width={388} height={28} rx={6}
        fill={ZEBRA}
        {...fadeRect(inView, 0.12)}
      />
      {/* Table header text */}
      {headers.map((h, i) => (
        <motion.text
          key={`hdr-${i}`}
          x={h.x} y={50} fontSize={8} fontWeight={700}
          style={{ ...textStyle, fill: C_MUTED, letterSpacing: "0.04em" }}
          {...fadeText(inView, 0.15 + i * 0.03)}
        >
          {h.label}
        </motion.text>
      ))}
      <line x1={16} y1={58} x2={404} y2={58} stroke="#E8E1D4" strokeWidth={0.5} />

      {/* 5 data rows — zebra striped */}
      {rows.map((row, i) => {
        const y = 74 + i * 24;
        return (
          <g key={`row-${i}`}>
            {i % 2 === 1 && (
              <motion.rect
                x={16} y={y - 14} width={388} height={22}
                fill={ZEBRA}
                {...fadeRect(inView, 0.28 + i * 0.06)}
              />
            )}
            {row.map((cell, j) => (
              <motion.text
                key={`cell-${i}-${j}`}
                x={headers[j].x}
                y={y}
                fontSize={8}
                fontWeight={j === 0 ? 600 : j === 4 ? 600 : 500}
                style={{ ...textStyle, fill: j === 0 ? C : C_MUTED }}
                {...fadeText(inView, 0.28 + i * 0.08 + j * 0.02)}
              >
                {cell}
              </motion.text>
            ))}
          </g>
        );
      })}

      {/* Divider between table and GST */}
      <line x1={16} y1={206} x2={404} y2={206} stroke="#E8E1D4" strokeWidth={0.5} />

      {/* GST breakdown area */}
      <motion.rect
        x={16} y={214} width={388} height={72} rx={6}
        fill="#FFFFFF" stroke="#E8E1D4" strokeWidth={STROKE_W}
        {...fadeRect(inView, 0.6)}
      />
      {/* GST rows */}
      {gstRows.map((gst, i) => {
        const y = 236 + i * 18;
        return (
          <g key={`gst-${i}`}>
            {/* Total row gets soft terracotta highlight */}
            {gst.accent && (
              <>
                <motion.rect
                  x={20} y={y - 12} width={380} height={16} rx={3}
                  fill={INDIGO_SOFT}
                  {...fadeRect(inView, 0.66)}
                />
                <motion.rect
                  x={20} y={y - 12} width={2} height={16}
                  fill={INDIGO}
                  {...fadeRect(inView, 0.66)}
                />
              </>
            )}
            <motion.text
              x={220} y={y} fontSize={8.5} fontWeight={gst.accent ? 700 : 500}
              style={{ ...textStyle, fill: gst.accent ? C : C_MUTED }}
              {...fadeText(inView, 0.65 + i * 0.06)}
            >
              {gst.label}
            </motion.text>
            <motion.text
              x={388} y={y} fontSize={9} fontWeight={gst.accent ? 700 : 600}
              textAnchor="end"
              style={textStyle}
              {...fadeText(inView, 0.7 + i * 0.06)}
            >
              {gst.value}
            </motion.text>
          </g>
        );
      })}

      {/* Download PDF button — terracotta */}
      <motion.rect
        x={130} y={300} width={160} height={28} rx={8}
        fill={INDIGO}
        {...fadeRect(inView, 0.85)}
      />
      {/* Arrow down icon */}
      <motion.path
        d="M184 310 L184 318 M180 315 L184 319 L188 315"
        stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        {...drawLine(inView, 0.9)}
      />
      <motion.text
        x={196} y={319} fontSize={9.5} fontWeight={700}
        style={{ ...textStyle, fill: "#FFFFFF" }}
        {...fadeText(inView, 0.9)}
      >
        Download PDF
      </motion.text>
      {/* One-shot shimmer sweep */}
      {inView && (
        <g clipPath="url(#is-btn-clip)">
          <motion.rect
            y={300} width={80} height={28}
            fill="url(#is-btn-shimmer)"
            initial={{ x: 50 }}
            animate={{ x: 320 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 1.1 }}
          />
        </g>
      )}
    </motion.svg>
  );
}
