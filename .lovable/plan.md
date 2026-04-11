

# Add Revenue Target Line to Performance Chart

## What
Add a dashed horizontal reference line to the Revenue Trend chart representing a daily revenue target. Include a small inline input above the chart so users can set their own target value.

## Changes — `src/pages/Performance.tsx`

1. **Import `ReferenceLine`** from recharts (add to existing import on line 28-40).

2. **Add target state** near other state declarations (~line 54):
   - `const [dailyTarget, setDailyTarget] = useState<number>(30000)` — default ₹30K/day as a sensible FMCG default.

3. **Update chart header** (line 459-461): Add an inline editable target input next to the "Revenue Trend" title — a small `₹` prefixed number input styled to match the card aesthetic.

4. **Add `<ReferenceLine>`** inside the `<AreaChart>` (after the `<Area>` on line 500):
   ```tsx
   <ReferenceLine
     y={dailyTarget}
     stroke="hsl(var(--destructive))"
     strokeDasharray="6 4"
     strokeWidth={1.5}
     label={{ value: `Target: ${formatCompact(dailyTarget)}`, position: "right", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
   />
   ```

This is a small, self-contained change — ~15 lines added, no new files.

