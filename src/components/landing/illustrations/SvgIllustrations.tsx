import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const C = "#27272A";
const FILL_BG = "rgba(39,39,42,0.04)";
const FILL_ACCENT = "rgba(39,39,42,0.10)";
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

const textStyle = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  fill: C,
  letterSpacing: "0.01em",
};

/* ─── 1. Hero Dashboard ─── */
export function DashboardSvg() {
  const { ref, inView } = useSvgInView();

  const kpiCards = [
    { x: 16, w: 96, label: "Revenue", value: "₹12.4L" },
    { x: 120, w: 96, label: "Orders", value: "347" },
    { x: 224, w: 96, label: "Dispatch", value: "289" },
    { x: 328, w: 96, label: "Delivery", value: "94%" },
  ];

  const sparklines = [
    "M0,12 L6,8 L12,10 L18,4 L24,6 L30,2 L36,5",
    "M0,10 L6,6 L12,8 L18,3 L24,7 L30,4 L36,2",
    "M0,8 L6,10 L12,5 L18,7 L24,3 L30,6 L36,1",
    "M0,6 L6,10 L12,4 L18,8 L24,2 L30,5 L36,3",
  ];

  const bars = [
    { w: 240, label: "Mon" },
    { w: 170, label: "Tue" },
    { w: 300, label: "Wed" },
    { w: 140, label: "Thu" },
    { w: 210, label: "Fri" },
    { w: 260, label: "Sat" },
    { w: 100, label: "Sun" },
    { w: 220, label: "Today" },
  ];

  const orders = [
    { id: "#ORD-247", name: "Sharma Stores", status: "Delivered" },
    { id: "#ORD-246", name: "Gupta Trading", status: "Pending" },
    { id: "#ORD-245", name: "Patel Dist.", status: "Dispatched" },
    { id: "#ORD-244", name: "Singh Retail", status: "Delivered" },
    { id: "#ORD-243", name: "Jain Agency", status: "Pending" },
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
      {/* KPI cards */}
      {kpiCards.map((card, i) => (
        <g key={`kpi-${i}`}>
          <motion.rect
            x={card.x} y={16} width={card.w} height={56} rx={6}
            fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
            strokeLinecap="round" strokeLinejoin="round"
            {...fadeRect(inView, 0.1 + i * 0.12)}
          />
          <motion.text
            x={card.x + 12} y={34} fontSize={8} opacity={0.5}
            style={textStyle}
            {...fadeText(inView, 0.1 + i * 0.12)}
          >
            {card.label}
          </motion.text>
          <motion.text
            x={card.x + 12} y={50} fontSize={13} fontWeight={600}
            style={textStyle} opacity={0.75}
            {...fadeText(inView, 0.15 + i * 0.12)}
          >
            {card.value}
          </motion.text>
          {/* Sparkline */}
          <motion.path
            d={sparklines[i]}
            stroke={C}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.25}
            transform={`translate(${card.x + card.w - 46}, ${28})`}
            {...drawLine(inView, 0.3 + i * 0.12)}
          />
        </g>
      ))}

      {/* Bar chart area */}
      <motion.rect
        x={16} y={88} width={408} height={140} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.3)}
      />
      <motion.text
        x={28} y={108} fontSize={9} fontWeight={600} opacity={0.5}
        style={textStyle}
        {...fadeText(inView, 0.3)}
      >
        This Week
      </motion.text>
      {/* Bars */}
      {bars.map((bar, i) => (
        <g key={`bar-${i}`}>
          <motion.text
            x={28} y={126 + i * 13} fontSize={7} opacity={0.35}
            style={textStyle}
            {...fadeText(inView, 0.4 + i * 0.06)}
          >
            {bar.label}
          </motion.text>
          <motion.rect
            x={60} y={120 + i * 13} width={bar.w} height={7} rx={3.5}
            fill={FILL_ACCENT}
            {...fadeRect(inView, 0.4 + i * 0.06)}
          />
        </g>
      ))}

      {/* Order rows area */}
      <motion.rect
        x={16} y={244} width={408} height={104} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.6)}
      />
      {/* Header */}
      <motion.text
        x={28} y={264} fontSize={9} fontWeight={600} opacity={0.5}
        style={textStyle}
        {...fadeText(inView, 0.6)}
      >
        Recent Orders
      </motion.text>
      <motion.line x1={28} y1={270} x2={408} y2={270} stroke={C} strokeWidth={0.5} opacity={0.15} {...drawLine(inView, 0.65)} />

      {/* Rows */}
      {orders.map((order, i) => {
        const y = 284 + i * 16;
        return (
          <g key={`row-${i}`}>
            <motion.text
              x={28} y={y} fontSize={8} opacity={0.6}
              style={textStyle}
              {...fadeText(inView, 0.65 + i * 0.08)}
            >
              {order.id}
            </motion.text>
            <motion.text
              x={90} y={y} fontSize={8} opacity={0.4}
              style={textStyle}
              {...fadeText(inView, 0.68 + i * 0.08)}
            >
              {order.name}
            </motion.text>
            <motion.rect
              x={340} y={y - 8} width={56} height={12} rx={6}
              fill={FILL_ACCENT}
              {...fadeRect(inView, 0.7 + i * 0.08)}
            />
            <motion.text
              x={348} y={y} fontSize={6.5} opacity={0.5}
              style={textStyle}
              {...fadeText(inView, 0.72 + i * 0.08)}
            >
              {order.status}
            </motion.text>
          </g>
        );
      })}
    </motion.svg>
  );
}

/* ─── 2. Order Form (Phone) ─── */
export function OrderFormSvg() {
  const { ref, inView } = useSvgInView();

  const products = [
    { name: "Maggi 2-Min 12pk", price: "₹168" },
    { name: "Surf Excel 1kg", price: "₹245" },
    { name: "Parle-G 800g", price: "₹52" },
    { name: "Vim Bar 200g", price: "₹30" },
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
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.1)}
      />
      <motion.text
        x={34} y={42} fontSize={9} opacity={0.5}
        style={textStyle}
        {...fadeText(inView, 0.1)}
      >
        Select Dealer
      </motion.text>
      <motion.path d="M218 34 L224 40 L230 34" stroke={C} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" {...drawLine(inView, 0.25)} />

      {/* Divider */}
      <motion.line x1={20} y1={72} x2={240} y2={72} stroke={C} strokeWidth={0.5} opacity={0.2} {...drawLine(inView, 0.3)} />

      {/* Product lines */}
      {products.map((prod, i) => {
        const y = 88 + i * 44;
        return (
          <g key={`prod-${i}`}>
            <motion.rect x={20} y={y} width={220} height={34} rx={4} fill={FILL_BG} {...fadeRect(inView, 0.3 + i * 0.12)} />
            <motion.text
              x={32} y={y + 15} fontSize={8} opacity={0.55}
              style={textStyle}
              {...fadeText(inView, 0.3 + i * 0.12)}
            >
              {prod.name}
            </motion.text>
            {/* Qty box */}
            <motion.rect x={155} y={y + 8} width={28} height={18} rx={4} fill={FILL_ACCENT} {...fadeRect(inView, 0.4 + i * 0.12)} />
            {/* Price */}
            <motion.text
              x={195} y={y + 21} fontSize={8} opacity={0.45}
              style={textStyle}
              {...fadeText(inView, 0.4 + i * 0.12)}
            >
              {prod.price}
            </motion.text>
          </g>
        );
      })}

      {/* Divider */}
      <motion.line x1={20} y1={270} x2={240} y2={270} stroke={C} strokeWidth={0.5} opacity={0.2} {...drawLine(inView, 0.6)} />

      {/* Subtotal */}
      <motion.text
        x={140} y={290} fontSize={8} opacity={0.4}
        style={textStyle}
        {...fadeText(inView, 0.62)}
      >
        Subtotal
      </motion.text>
      <motion.text
        x={200} y={290} fontSize={9} fontWeight={600} opacity={0.6}
        style={textStyle}
        {...fadeText(inView, 0.64)}
      >
        ₹2,340
      </motion.text>

      {/* Scheme tag pill */}
      <motion.rect x={20} y={300} width={90} height={22} rx={11} fill={FILL_ACCENT} stroke={C} strokeWidth={STROKE_W} strokeLinecap="round" {...fadeRect(inView, 0.65)} />
      <motion.text
        x={34} y={314} fontSize={7.5} opacity={0.55}
        style={textStyle}
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
            stroke={C}
            strokeWidth={STROKE_W}
            fill={r.active ? FILL_ACCENT : "none"}
            {...fadeRect(inView, 0.7 + i * 0.06)}
          />
          {r.active && (
            <motion.circle cx={36} cy={350} r={3} fill={C} {...fadeRect(inView, 0.75)} />
          )}
          <motion.text
            x={48 + i * 72} y={354} fontSize={8} opacity={0.45}
            style={textStyle}
            {...fadeText(inView, 0.72 + i * 0.06)}
          >
            {r.label}
          </motion.text>
        </g>
      ))}

      {/* Divider */}
      <motion.line x1={20} y1={375} x2={240} y2={375} stroke={C} strokeWidth={0.5} opacity={0.2} {...drawLine(inView, 0.8)} />

      {/* Submit button */}
      <motion.rect x={50} y={390} width={160} height={36} rx={6} fill={FILL_ACCENT} stroke={C} strokeWidth={STROKE_W} strokeLinecap="round" {...fadeRect(inView, 0.85)} />
      <motion.text
        x={90} y={412} fontSize={10} fontWeight={600} opacity={0.6}
        style={textStyle}
        {...fadeText(inView, 0.87)}
      >
        Place Order
      </motion.text>
      <motion.path d="M160 408 L167 408 L163 404 M167 408 L163 412" stroke={C} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" {...drawLine(inView, 0.9)} />
    </motion.svg>
  );
}

/* ─── 3. Dashboard Mini ─── */
export function DashboardMiniSvg() {
  const { ref, inView } = useSvgInView();

  const kpis = [
    { x: 16, w: 124, label: "Revenue", value: "₹4.8L" },
    { x: 148, w: 124, label: "Orders", value: "230" },
    { x: 280, w: 124, label: "Pending", value: "₹57K" },
  ];

  const orders = [
    { id: "#247", name: "Sharma Stores", status: "Delivered" },
    { id: "#246", name: "Gupta Trading", status: "Pending" },
    { id: "#245", name: "Patel Distributors", status: "Dispatched" },
    { id: "#244", name: "Singh Retail", status: "Delivered" },
    { id: "#243", name: "Jain Agency", status: "Pending" },
  ];

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      {/* 3 KPI cards */}
      {kpis.map((card, i) => (
        <g key={`kpi-${i}`}>
          <motion.rect
            x={card.x} y={16} width={card.w} height={56} rx={6}
            fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
            strokeLinecap="round" strokeLinejoin="round"
            {...fadeRect(inView, 0.1 + i * 0.12)}
          />
          <motion.text
            x={card.x + 14} y={36} fontSize={8} opacity={0.45}
            style={textStyle}
            {...fadeText(inView, 0.1 + i * 0.12)}
          >
            {card.label}
          </motion.text>
          <motion.text
            x={card.x + 14} y={54} fontSize={14} fontWeight={600} opacity={0.7}
            style={textStyle}
            {...fadeText(inView, 0.15 + i * 0.12)}
          >
            {card.value}
          </motion.text>
        </g>
      ))}

      {/* Orders list */}
      <motion.rect
        x={16} y={88} width={388} height={180} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.4)}
      />
      {/* Header */}
      <motion.text
        x={28} y={110} fontSize={9} fontWeight={600} opacity={0.5}
        style={textStyle}
        {...fadeText(inView, 0.4)}
      >
        Recent Orders
      </motion.text>
      {/* Live indicator */}
      <motion.circle
        cx={120} cy={106} r={3}
        fill={C} opacity={0.3}
        {...fadeRect(inView, 0.45)}
      />
      <motion.text
        x={128} y={110} fontSize={7} opacity={0.3}
        style={textStyle}
        {...fadeText(inView, 0.45)}
      >
        Live
      </motion.text>

      <motion.line x1={28} y1={118} x2={388} y2={118} stroke={C} strokeWidth={0.5} opacity={0.15} {...drawLine(inView, 0.5)} />

      {/* Column headers */}
      {[{ x: 28, t: "Order" }, { x: 100, t: "Dealer" }, { x: 260, t: "Amount" }, { x: 330, t: "Status" }].map((col, i) => (
        <motion.text
          key={`colh-${i}`}
          x={col.x} y={134} fontSize={7} opacity={0.35} fontWeight={500}
          style={textStyle}
          {...fadeText(inView, 0.5)}
        >
          {col.t}
        </motion.text>
      ))}

      <motion.line x1={28} y1={140} x2={388} y2={140} stroke={C} strokeWidth={0.3} opacity={0.1} {...drawLine(inView, 0.52)} />

      {/* 5 rows */}
      {orders.map((order, i) => {
        const y = 158 + i * 22;
        return (
          <g key={`r-${i}`}>
            <motion.text
              x={28} y={y} fontSize={8} opacity={0.55}
              style={textStyle}
              {...fadeText(inView, 0.55 + i * 0.08)}
            >
              {order.id}
            </motion.text>
            <motion.text
              x={100} y={y} fontSize={8} opacity={0.4}
              style={textStyle}
              {...fadeText(inView, 0.57 + i * 0.08)}
            >
              {order.name}
            </motion.text>
            <motion.line
              x1={260} y1={y} x2={310} y2={y}
              stroke={C} strokeWidth={1} strokeLinecap="round" opacity={0.2}
              {...drawLine(inView, 0.58 + i * 0.08)}
            />
            <motion.rect
              x={330} y={y - 8} width={52} height={12} rx={6}
              fill={FILL_ACCENT}
              {...fadeRect(inView, 0.6 + i * 0.08)}
            />
            <motion.text
              x={338} y={y} fontSize={6.5} opacity={0.45}
              style={textStyle}
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
      {/* Invoice number */}
      <motion.text
        x={28} y={22} fontSize={7} opacity={0.35}
        style={textStyle}
        {...fadeText(inView, 0.05)}
      >
        INV-2026-0184
      </motion.text>

      {/* Table area */}
      <motion.rect
        x={16} y={30} width={388} height={170} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.1)}
      />
      {/* Table header text */}
      {headers.map((h, i) => (
        <motion.text
          key={`hdr-${i}`}
          x={h.x} y={50} fontSize={8} fontWeight={600} opacity={0.5}
          style={textStyle}
          {...fadeText(inView, 0.15 + i * 0.03)}
        >
          {h.label}
        </motion.text>
      ))}
      {/* Header divider */}
      <motion.line x1={28} y1={56} x2={392} y2={56} stroke={C} strokeWidth={0.5} opacity={0.2} {...drawLine(inView, 0.25)} />

      {/* 5 data rows */}
      {rows.map((row, i) => {
        const y = 74 + i * 24;
        return (
          <g key={`row-${i}`}>
            {row.map((cell, j) => (
              <motion.text
                key={`cell-${i}-${j}`}
                x={headers[j].x}
                y={y}
                fontSize={7.5}
                opacity={j === 0 ? 0.55 : 0.4}
                style={textStyle}
                {...fadeText(inView, 0.28 + i * 0.08 + j * 0.02)}
              >
                {cell}
              </motion.text>
            ))}
            {i < rows.length - 1 && (
              <motion.line
                x1={28} y1={y + 8} x2={392} y2={y + 8}
                stroke={C} strokeWidth={0.3} opacity={0.08}
                {...drawLine(inView, 0.3 + i * 0.08)}
              />
            )}
          </g>
        );
      })}

      {/* Divider between table and GST */}
      <motion.line x1={16} y1={206} x2={404} y2={206} stroke={C} strokeWidth={0.5} opacity={0.15} {...drawLine(inView, 0.6)} />

      {/* GST breakdown area */}
      <motion.rect
        x={16} y={214} width={388} height={72} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.6)}
      />
      {/* GST rows */}
      {gstRows.map((gst, i) => {
        const y = 236 + i * 18;
        return (
          <g key={`gst-${i}`}>
            <motion.text
              x={220} y={y} fontSize={8} opacity={0.45}
              style={textStyle}
              {...fadeText(inView, 0.65 + i * 0.06)}
            >
              {gst.label}
            </motion.text>
            <motion.rect
              x={300} y={y - 10} width={88} height={14} rx={4}
              fill={gst.accent ? FILL_ACCENT : FILL_BG}
              stroke={C} strokeWidth={gst.accent ? STROKE_W : 0.5}
              strokeLinecap="round"
              {...fadeRect(inView, 0.68 + i * 0.06)}
            />
            <motion.text
              x={310} y={y} fontSize={8} fontWeight={gst.accent ? 600 : 400} opacity={gst.accent ? 0.65 : 0.45}
              style={textStyle}
              {...fadeText(inView, 0.7 + i * 0.06)}
            >
              {gst.value}
            </motion.text>
          </g>
        );
      })}

      {/* Download PDF button */}
      <motion.rect
        x={130} y={300} width={160} height={28} rx={6}
        fill={FILL_ACCENT} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.85)}
      />
      {/* Arrow down icon */}
      <motion.path
        d="M184 310 L184 318 M180 315 L184 319 L188 315"
        stroke={C} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        {...drawLine(inView, 0.9)}
      />
      <motion.text
        x={196} y={318} fontSize={9} fontWeight={600} opacity={0.55}
        style={textStyle}
        {...fadeText(inView, 0.9)}
      >
        Download PDF
      </motion.text>
    </motion.svg>
  );
}
