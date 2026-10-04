import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { UserRound, Store, RotateCcw, Warehouse, FileText, LayoutDashboard, type LucideIcon } from "lucide-react";

/**
 * Hero picture: how one Ledge action moves through the business.
 * One rAF clock (9s loop, timeline designed with Fable 5.1). Dots are moved
 * via refs every frame; React state changes only when a story phase changes.
 */

type NodeId = "rep" | "dealer" | "ret" | "godown" | "gst" | "owner";
type Side = "L" | "R";
interface NodeDef { id: NodeId; side: Side; row: 0 | 1 | 2; icon: LucideIcon; name: string; idle: string }

const NODES: NodeDef[] = [
  { id: "rep", side: "L", row: 0, icon: UserRound, name: "Sales rep", idle: "In the field" },
  { id: "dealer", side: "L", row: 1, icon: Store, name: "Dealer", idle: "83 dealers" },
  { id: "ret", side: "L", row: 2, icon: RotateCcw, name: "Returns", idle: "Claims" },
  { id: "godown", side: "R", row: 0, icon: Warehouse, name: "Godown", idle: "Stock" },
  { id: "gst", side: "R", row: 1, icon: FileText, name: "GST bill", idle: "CGST + SGST" },
  { id: "owner", side: "R", row: 2, icon: LayoutDashboard, name: "Owner", idle: "Dashboard" },
];

interface Seg { from: NodeId | "hub"; to: NodeId | "hub"; start: number; end: number }
interface Story { start: number; end: number; hubAt: number; hub: string; status: Partial<Record<NodeId, string>>; segs: Seg[] }

const LOOP = 9;
const STORIES: Story[] = [
  {
    start: 0, end: 2.8, hubAt: 0.9, hub: "Order",
    status: { rep: "ORD-1042", godown: "−12 pcs", gst: "INV-508" },
    segs: [
      { from: "rep", to: "hub", start: 0, end: 0.9 },
      { from: "hub", to: "godown", start: 1.2, end: 2.1 },
      { from: "hub", to: "gst", start: 1.35, end: 2.25 },
    ],
  },
  {
    start: 3, end: 5.8, hubAt: 3.9, hub: "Payment",
    status: { dealer: "₹48,000", owner: "Dues −₹48K" },
    segs: [
      { from: "dealer", to: "hub", start: 3, end: 3.9 },
      { from: "hub", to: "owner", start: 4.2, end: 5.1 },
    ],
  },
  {
    start: 6, end: 8.8, hubAt: 6.9, hub: "Claim",
    status: { ret: "CLM-77", gst: "CN-21", godown: "+3 pcs" },
    segs: [
      { from: "ret", to: "hub", start: 6, end: 6.9 },
      { from: "hub", to: "gst", start: 7.2, end: 8.1 },
      { from: "hub", to: "godown", start: 7.35, end: 8.25 },
    ],
  },
];

// Every line in the picture: one per node, drawn node → hub (left) or hub → node (right).
const LINE_IDS: NodeId[] = ["rep", "dealer", "ret", "godown", "gst", "owner"];

interface Layout { w: number; h: number; cardW: number; cardH: number; hub: number; rows: number[]; compact: boolean }
const WIDE: Layout = { w: 560, h: 372, cardW: 158, cardH: 60, hub: 84, rows: [56, 176, 296], compact: false };
const NARROW: Layout = { w: 340, h: 330, cardW: 108, cardH: 52, hub: 60, rows: [50, 160, 270], compact: true };

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function linePath(L: Layout, id: NodeId) {
  const n = NODES.find((x) => x.id === id)!;
  const y = L.rows[n.row];
  const cy = L.rows[1];
  const hubL = L.w / 2 - L.hub / 2;
  const hubR = L.w / 2 + L.hub / 2;
  if (n.side === "L") {
    const x0 = L.cardW + 2, x1 = hubL - 4, mx = (x1 - x0) * 0.55;
    return `M ${x0} ${y} C ${x0 + mx} ${y}, ${x1 - mx} ${cy}, ${x1} ${cy}`;
  }
  const x0 = hubR + 4, x1 = L.w - L.cardW - 2, mx = (x1 - x0) * 0.55;
  return `M ${x0} ${cy} C ${x0 + mx} ${cy}, ${x1 - mx} ${y}, ${x1} ${y}`;
}

const BASE_COUNT = 1284;

export function LedgeFlowHub() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const L = width < 420 ? NARROW : WIDE;
  const scale = Math.min(1, width / L.w);

  const pathRefs = useRef<Partial<Record<NodeId, SVGPathElement | null>>>({});
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const hubRingRef = useRef<HTMLDivElement>(null);
  const lengths = useRef<Partial<Record<NodeId, number>>>({});

  const [storyIdx, setStoryIdx] = useState<number>(reduce ? 0 : -1);
  const [count, setCount] = useState(BASE_COUNT);
  const [active, setActive] = useState<Set<NodeId>>(new Set());

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    for (const id of LINE_IDS) {
      const p = pathRefs.current[id];
      if (p) lengths.current[id] = p.getTotalLength();
    }
  }, [L]);

  useEffect(() => {
    if (reduce) return;
    const el = wrapRef.current;
    let raf = 0;
    let visible = true;
    let inView = true;
    let clock = 0; // seconds of animation actually played
    let last = performance.now();
    let lastStory = -2;
    let lastActiveKey = "";
    let loops = 0;
    let pulsedFor = -1;

    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.05 });
    if (el) io.observe(el);
    const onVis = () => { visible = !document.hidden; last = performance.now(); };
    document.addEventListener("visibilitychange", onVis);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && inView) clock += dt;
      const t = clock % LOOP;
      const loop = Math.floor(clock / LOOP);

      // Phase → React state (only on change).
      const si = STORIES.findIndex((s) => t >= s.start && t < s.end);
      if (si !== lastStory) { lastStory = si; setStoryIdx(si); }

      // Hub pulse + counter at each story’s arrival.
      const key = loop * 10 + STORIES.findIndex((s) => t >= s.hubAt && t < s.end);
      const hubStory = STORIES.findIndex((s) => t >= s.hubAt && t < s.end);
      if (hubStory >= 0 && key !== pulsedFor) {
        pulsedFor = key;
        setCount((c) => c + 1);
      }
      if (loop !== loops) loops = loop;
      const ring = hubRingRef.current;
      if (ring) {
        const s = STORIES[hubStory];
        const p = s ? clamp01((t - s.hubAt) / 0.5) : 1;
        ring.style.opacity = String(s ? 0.55 * (1 - easeOut(p)) : 0);
        ring.style.transform = `scale(${1 + 0.18 * easeOut(p)})`;
      }

      // Dots + lines.
      const activeNow: NodeId[] = [];
      let di = 0;
      for (const s of STORIES) {
        for (const seg of s.segs) {
          const dot = dotRefs.current[di++];
          const lineId = (seg.from === "hub" ? seg.to : seg.from) as NodeId;
          const path = pathRefs.current[lineId];
          const len = lengths.current[lineId] ?? 0;
          const raw = (t - seg.start) / (seg.end - seg.start);
          const live = raw >= 0 && raw <= 1;
          const tail = t > seg.end && t < seg.end + 0.25;
          if (live || tail) activeNow.push(lineId, seg.from === "hub" ? (seg.to as NodeId) : (seg.from as NodeId));
          if (!dot || !path) continue;
          if (live) {
            const e = seg.from === "hub" ? easeOut(raw) : easeInOut(raw);
            const pt = path.getPointAtLength(e * len);
            dot.setAttribute("cx", pt.x.toFixed(2));
            dot.setAttribute("cy", pt.y.toFixed(2));
            const fade = Math.min(1, raw / 0.08, (1 - raw) / 0.08);
            dot.style.opacity = String(fade);
          } else {
            dot.style.opacity = "0";
          }
        }
      }
      // Nodes stay highlighted for their whole story.
      const s = STORIES[si];
      if (s) for (const k of Object.keys(s.status) as NodeId[]) activeNow.push(k);
      const set = Array.from(new Set(activeNow)).sort();
      const aKey = set.join(",");
      if (aKey !== lastActiveKey) { lastActiveKey = aKey; setActive(new Set(set)); }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce, L]);

  const story = storyIdx >= 0 ? STORIES[storyIdx] : null;
  const segCount = STORIES.reduce((n, s) => n + s.segs.length, 0);
  const cy = L.rows[1];

  return (
    <div
      ref={wrapRef}
      className="lpx-flow"
      role="img"
      aria-label="How Ledge works: a sales rep’s order, a dealer’s payment and a return all go into Ledge, which updates godown stock, the GST bill and the owner’s dashboard."
    >
      <div className="lpx-flow__stage" style={{ width: L.w, height: L.h, transform: `scale(${scale})`, marginBottom: (scale - 1) * L.h }}>
        <svg width={L.w} height={L.h} viewBox={`0 0 ${L.w} ${L.h}`} className="lpx-flow__svg" aria-hidden>
          {LINE_IDS.map((id) => (
            <path
              key={id}
              ref={(el) => { pathRefs.current[id] = el; }}
              d={linePath(L, id)}
              className={`lpx-flow__line ${active.has(id) ? "is-on" : ""}`}
            />
          ))}
          {/* Line end sockets */}
          {NODES.map((n) => {
            const x = n.side === "L" ? L.cardW + 2 : L.w - L.cardW - 2;
            return <circle key={n.id} cx={x} cy={L.rows[n.row]} r={3.5} className={`lpx-flow__socket ${active.has(n.id) ? "is-on" : ""}`} />;
          })}
          {Array.from({ length: segCount }).map((_, i) => (
            <circle key={i} ref={(el) => { dotRefs.current[i] = el; }} r={i % 3 === 0 ? 4 : 3.5} className="lpx-flow__dot" style={{ opacity: 0 }} cx={-10} cy={-10} />
          ))}
        </svg>

        {NODES.map((n) => {
          const on = active.has(n.id);
          const status = (story && story.status[n.id]) || n.idle;
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              className={`lpx-flow__node ${on ? "is-on" : ""} ${L.compact ? "is-compact" : ""}`}
              style={{
                width: L.cardW,
                height: L.cardH,
                top: L.rows[n.row] - L.cardH / 2,
                left: n.side === "L" ? 0 : L.w - L.cardW,
              }}
            >
              <Icon size={L.compact ? 15 : 18} strokeWidth={1.7} className="lpx-flow__icon" aria-hidden />
              <span className="min-w-0">
                <span className="lpx-flow__name">{n.name}</span>
                <span className="lpx-flow__status" key={status}>{status}</span>
              </span>
            </div>
          );
        })}

        <div className="lpx-flow__hubwrap" style={{ width: L.hub, height: L.hub, left: L.w / 2 - L.hub / 2, top: cy - L.hub / 2 }}>
          <div ref={hubRingRef} className="lpx-flow__ring" aria-hidden />
          <div className="lpx-flow__hub">
            <svg viewBox="0 0 24 24" width={L.compact ? 22 : 28} height={L.compact ? 22 : 28} aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1={3 + i * 4} y1={21} x2={9 + i * 4} y2={3} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
              ))}
            </svg>
          </div>
        </div>
        <div className="lpx-flow__hublabel" style={{ top: cy + L.hub / 2 + 12, width: 120, left: L.w / 2 - 60 }}>
          <span className="lpx-flow__name">Ledge</span>
          <span className="lpx-flow__status lpx-num" key={story?.hub ?? "idle"}>
            {story ? story.hub : `${count.toLocaleString("en-IN")} today`}
          </span>
        </div>
      </div>
    </div>
  );
}
