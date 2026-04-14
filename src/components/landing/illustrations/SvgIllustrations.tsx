import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const C = "#0D9488";
const FILL_BG = "rgba(13,148,136,0.06)";
const FILL_ACCENT = "rgba(13,148,136,0.12)";
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

/* ─── 1. Hero Dashboard ─── */
export function DashboardSvg() {
  const { ref, inView } = useSvgInView();

  const kpiCards = [
    { x: 16, w: 88 },
    { x: 112, w: 88 },
    { x: 208, w: 88 },
    { x: 304, w: 88 },
  ];

  const bars = [
    { w: 260 },
    { w: 190 },
    { w: 310 },
    { w: 150 },
    { w: 220 },
    { w: 280 },
  ];

  const rows = [0, 1, 2];

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 408 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      {/* KPI cards */}
      {kpiCards.map((card, i) => (
        <motion.rect
          key={`kpi-${i}`}
          x={card.x}
          y={16}
          width={card.w}
          height={48}
          rx={6}
          fill={FILL_BG}
          stroke={C}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...fadeRect(inView, 0.1 + i * 0.1)}
        />
      ))}
      {/* KPI inner lines (value placeholder) */}
      {kpiCards.map((card, i) => (
        <motion.line
          key={`kpi-line-${i}`}
          x1={card.x + 12}
          y1={48}
          x2={card.x + 12 + 40}
          y2={48}
          stroke={C}
          strokeWidth={2}
          strokeLinecap="round"
          {...drawLine(inView, 0.3 + i * 0.1)}
        />
      ))}
      {/* Small label lines */}
      {kpiCards.map((card, i) => (
        <motion.line
          key={`kpi-label-${i}`}
          x1={card.x + 12}
          y1={34}
          x2={card.x + 12 + 28}
          y2={34}
          stroke={C}
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.4}
          {...drawLine(inView, 0.2 + i * 0.1)}
        />
      ))}

      {/* Bar chart area */}
      <motion.rect
        x={16}
        y={80}
        width={376}
        height={108}
        rx={6}
        fill={FILL_BG}
        stroke={C}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...fadeRect(inView, 0.3)}
      />
      {/* Bars */}
      {bars.map((bar, i) => (
        <motion.rect
          key={`bar-${i}`}
          x={32}
          y={96 + i * 14}
          width={bar.w}
          height={8}
          rx={4}
          fill={FILL_ACCENT}
          {...fadeRect(inView, 0.4 + i * 0.08)}
        />
      ))}

      {/* Order rows area */}
      <motion.rect
        x={16}
        y={200}
        width={376}
        height={68}
        rx={6}
        fill={FILL_BG}
        stroke={C}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...fadeRect(inView, 0.5)}
      />
      {/* Row lines */}
      {rows.map((_, i) => (
        <g key={`row-${i}`}>
          <motion.line
            x1={32}
            y1={218 + i * 16}
            x2={130}
            y2={218 + i * 16}
            stroke={C}
            strokeWidth={1}
            strokeLinecap="round"
            {...drawLine(inView, 0.6 + i * 0.1)}
          />
          <motion.line
            x1={160}
            y1={218 + i * 16}
            x2={220}
            y2={218 + i * 16}
            stroke={C}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.5}
            {...drawLine(inView, 0.65 + i * 0.1)}
          />
          <motion.rect
            x={340}
            y={213 + i * 16}
            width={36}
            height={10}
            rx={5}
            fill={FILL_ACCENT}
            {...fadeRect(inView, 0.7 + i * 0.1)}
          />
        </g>
      ))}
    </motion.svg>
  );
}

/* ─── 2. Order Form (Phone) ─── */
export function OrderFormSvg() {
  const { ref, inView } = useSvgInView();

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 240 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      {/* Dropdown */}
      <motion.rect
        x={20} y={20} width={200} height={36} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.1)}
      />
      <motion.line x1={36} y1={38} x2={110} y2={38} stroke={C} strokeWidth={1.5} strokeLinecap="round" {...drawLine(inView, 0.2)} />
      {/* Chevron */}
      <motion.path d="M198 34 L204 40 L210 34" stroke={C} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" {...drawLine(inView, 0.25)} />

      {/* Divider */}
      <motion.line x1={20} y1={72} x2={220} y2={72} stroke={C} strokeWidth={0.5} opacity={0.3} {...drawLine(inView, 0.3)} />

      {/* Product lines */}
      {[0, 1, 2].map((i) => {
        const y = 88 + i * 44;
        return (
          <g key={`prod-${i}`}>
            <motion.rect x={20} y={y} width={200} height={34} rx={4} fill={FILL_BG} {...fadeRect(inView, 0.3 + i * 0.1)} />
            {/* Product name line */}
            <motion.line x1={32} y1={y + 17} x2={100} y2={y + 17} stroke={C} strokeWidth={1.5} strokeLinecap="round" {...drawLine(inView, 0.35 + i * 0.1)} />
            {/* Qty box */}
            <motion.rect x={140} y={y + 8} width={30} height={18} rx={4} fill={FILL_ACCENT} {...fadeRect(inView, 0.4 + i * 0.1)} />
            {/* Price line */}
            <motion.line x1={180} y1={y + 17} x2={210} y2={y + 17} stroke={C} strokeWidth={1} strokeLinecap="round" opacity={0.6} {...drawLine(inView, 0.4 + i * 0.1)} />
          </g>
        );
      })}

      {/* Divider */}
      <motion.line x1={20} y1={228} x2={220} y2={228} stroke={C} strokeWidth={0.5} opacity={0.3} {...drawLine(inView, 0.6)} />

      {/* Scheme tag pill */}
      <motion.rect x={20} y={244} width={80} height={24} rx={12} fill={FILL_ACCENT} stroke={C} strokeWidth={STROKE_W} strokeLinecap="round" {...fadeRect(inView, 0.65)} />
      <motion.line x1={36} y1={256} x2={84} y2={256} stroke={C} strokeWidth={1} strokeLinecap="round" {...drawLine(inView, 0.7)} />

      {/* Radio buttons */}
      {[0, 1, 2].map((i) => (
        <g key={`radio-${i}`}>
          <motion.circle
            cx={36 + i * 60}
            cy={296}
            r={7}
            stroke={C}
            strokeWidth={STROKE_W}
            fill={i === 0 ? FILL_ACCENT : "none"}
            {...fadeRect(inView, 0.7 + i * 0.05)}
          />
          {i === 0 && (
            <motion.circle cx={36} cy={296} r={3} fill={C} {...fadeRect(inView, 0.75)} />
          )}
          <motion.line
            x1={48 + i * 60}
            y1={296}
            x2={78 + i * 60}
            y2={296}
            stroke={C}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.5}
            {...drawLine(inView, 0.75 + i * 0.05)}
          />
        </g>
      ))}

      {/* Divider */}
      <motion.line x1={20} y1={324} x2={220} y2={324} stroke={C} strokeWidth={0.5} opacity={0.3} {...drawLine(inView, 0.8)} />

      {/* Submit button */}
      <motion.rect x={50} y={344} width={140} height={38} rx={6} fill={FILL_ACCENT} stroke={C} strokeWidth={STROKE_W} strokeLinecap="round" {...fadeRect(inView, 0.85)} />
      <motion.line x1={90} y1={363} x2={140} y2={363} stroke={C} strokeWidth={2} strokeLinecap="round" {...drawLine(inView, 0.9)} />
      {/* Arrow */}
      <motion.path d="M148 363 L155 363 L151 359 M155 363 L151 367" stroke={C} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" {...drawLine(inView, 0.95)} />
    </motion.svg>
  );
}

/* ─── 3. Dashboard Mini ─── */
export function DashboardMiniSvg() {
  const { ref, inView } = useSvgInView();

  const kpis = [
    { x: 16, w: 116 },
    { x: 140, w: 116 },
    { x: 264, w: 116 },
  ];

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 396 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      {/* 3 KPI cards */}
      {kpis.map((card, i) => (
        <g key={`kpi-${i}`}>
          <motion.rect
            x={card.x} y={16} width={card.w} height={52} rx={6}
            fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
            strokeLinecap="round" strokeLinejoin="round"
            {...fadeRect(inView, 0.1 + i * 0.1)}
          />
          <motion.line
            x1={card.x + 14} y1={38} x2={card.x + 14 + 32} y2={38}
            stroke={C} strokeWidth={1} strokeLinecap="round" opacity={0.4}
            {...drawLine(inView, 0.2 + i * 0.1)}
          />
          <motion.line
            x1={card.x + 14} y1={52} x2={card.x + 14 + 50} y2={52}
            stroke={C} strokeWidth={2} strokeLinecap="round"
            {...drawLine(inView, 0.25 + i * 0.1)}
          />
        </g>
      ))}

      {/* Orders list */}
      <motion.rect
        x={16} y={84} width={364} height={120} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.4)}
      />
      {/* Header line */}
      <motion.line x1={32} y1={104} x2={200} y2={104} stroke={C} strokeWidth={1.5} strokeLinecap="round" {...drawLine(inView, 0.45)} />
      <motion.line x1={240} y1={104} x2={310} y2={104} stroke={C} strokeWidth={1} strokeLinecap="round" opacity={0.4} {...drawLine(inView, 0.45)} />

      {/* Divider */}
      <motion.line x1={32} y1={114} x2={364} y2={114} stroke={C} strokeWidth={0.5} opacity={0.2} {...drawLine(inView, 0.5)} />

      {/* 4 rows */}
      {[0, 1, 2, 3].map((i) => {
        const y = 130 + i * 16;
        return (
          <g key={`r-${i}`}>
            <motion.line x1={32} y1={y} x2={120} y2={y} stroke={C} strokeWidth={1} strokeLinecap="round" {...drawLine(inView, 0.5 + i * 0.08)} />
            <motion.line x1={150} y1={y} x2={200} y2={y} stroke={C} strokeWidth={1} strokeLinecap="round" opacity={0.5} {...drawLine(inView, 0.55 + i * 0.08)} />
            <motion.rect x={320} y={y - 5} width={36} height={10} rx={5} fill={FILL_ACCENT} {...fadeRect(inView, 0.55 + i * 0.08)} />
          </g>
        );
      })}
    </motion.svg>
  );
}

/* ─── 4. Invoice / Stock ─── */
export function InvoiceStockSvg() {
  const { ref, inView } = useSvgInView();

  const cols = [32, 120, 200, 280, 340];

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 396 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      {...container(inView)}
    >
      {/* Table area */}
      <motion.rect
        x={16} y={16} width={364} height={140} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.1)}
      />
      {/* Table header lines */}
      {cols.map((x, i) => (
        <motion.line
          key={`hdr-${i}`}
          x1={x} y1={36} x2={x + 50} y2={36}
          stroke={C} strokeWidth={1.5} strokeLinecap="round"
          {...drawLine(inView, 0.15 + i * 0.04)}
        />
      ))}
      {/* Header divider */}
      <motion.line x1={32} y1={48} x2={364} y2={48} stroke={C} strokeWidth={0.5} opacity={0.3} {...drawLine(inView, 0.25)} />

      {/* 4 data rows */}
      {[0, 1, 2, 3].map((i) => {
        const y = 66 + i * 24;
        return (
          <g key={`row-${i}`}>
            {cols.map((x, j) => (
              <motion.line
                key={`cell-${i}-${j}`}
                x1={x} y1={y} x2={x + (j === 0 ? 60 : 40)} y2={y}
                stroke={C} strokeWidth={1} strokeLinecap="round"
                opacity={j === 0 ? 1 : 0.5}
                {...drawLine(inView, 0.3 + i * 0.08 + j * 0.02)}
              />
            ))}
          </g>
        );
      })}

      {/* GST breakdown area */}
      <motion.rect
        x={16} y={170} width={364} height={60} rx={6}
        fill={FILL_BG} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.6)}
      />
      {/* 3 GST rows */}
      {["CGST", "SGST", "Total"].map((_, i) => {
        const y = 188 + i * 16;
        return (
          <g key={`gst-${i}`}>
            <motion.line x1={200} y1={y} x2={260} y2={y} stroke={C} strokeWidth={1} strokeLinecap="round" opacity={0.5} {...drawLine(inView, 0.65 + i * 0.06)} />
            <motion.rect
              x={280} y={y - 5} width={80} height={10} rx={4}
              fill={i === 2 ? FILL_ACCENT : FILL_BG}
              stroke={C} strokeWidth={i === 2 ? STROKE_W : 0.5}
              strokeLinecap="round"
              {...fadeRect(inView, 0.7 + i * 0.06)}
            />
          </g>
        );
      })}

      {/* Download PDF button */}
      <motion.rect
        x={120} y={244} width={156} height={24} rx={6}
        fill={FILL_ACCENT} stroke={C} strokeWidth={STROKE_W}
        strokeLinecap="round" strokeLinejoin="round"
        {...fadeRect(inView, 0.85)}
      />
      {/* Arrow down icon */}
      <motion.path
        d="M180 252 L180 260 M176 257 L180 261 L184 257"
        stroke={C} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        {...drawLine(inView, 0.9)}
      />
      {/* Label line */}
      <motion.line x1={190} y1={256} x2={250} y2={256} stroke={C} strokeWidth={1.5} strokeLinecap="round" {...drawLine(inView, 0.92)} />
    </motion.svg>
  );
}
