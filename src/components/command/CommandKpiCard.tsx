import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { DeltaPill } from "./DeltaPill";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

interface Props {
  label: string;
  value: string;
  pct: number | null;
  inverse?: boolean;
  hint?: string;
  /** 7-bucket sparkline series. Optional. */
  spark?: number[];
  /** Pre-filtered deep link — owner clicks the card, lands at the fix. */
  href?: string;
  /** Stagger index (0..n). 80ms per item. */
  index?: number;
}

export function CommandKpiCard({ label, value, pct, inverse, hint, spark, href, index = 0 }: Props) {
  const sparkData = (spark && spark.length > 1 ? spark : []).map((v, i) => ({ i, v }));
  const sparkUp = sparkData.length > 1 && sparkData[sparkData.length - 1].v >= sparkData[0].v;
  const sparkColor = inverse
    ? sparkUp ? "hsl(var(--destructive))" : "hsl(var(--success))"
    : sparkUp ? "hsl(var(--success))" : "hsl(var(--destructive))";

  const inner = (
    <Card
      className={cn(
        "group relative h-full p-4 transition-all",
        href && "cursor-pointer hover:-translate-y-px hover:shadow-depth-8",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        {href && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
        )}
      </div>
      <p className="font-heading text-[26px] leading-tight num mt-1 text-foreground">{value}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <DeltaPill pct={pct} inverse={inverse} />
          {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        {sparkData.length > 1 && (
          <div className="h-8 w-20 shrink-0 opacity-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );

  const wrapped = href ? (
    <Link to={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
      {inner}
    </Link>
  ) : (
    inner
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: ease.decelerate, delay: index * 0.08 }}
      className="h-full"
    >
      {wrapped}
    </motion.div>
  );
}
