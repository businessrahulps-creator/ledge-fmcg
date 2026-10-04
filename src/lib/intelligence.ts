/**
 * Today's work — plain, testable rules that turn Ledge data into a short
 * to-do list. No AI: every number here is simple maths on records the owner
 * can open. Keep these pure; the page only formats them.
 */
import type { Order, Distributor, Product } from "@/data/mock-data";
import type { StockItem } from "@/data/godown-data";
import type { ReceivableRow } from "@/lib/receivables";
import { addDaysToKey } from "@/utils/dateKey";

export interface IntelSettings {
  /** An order is "waiting too long" after this many days unsent. */
  lateDays: number;
  /** Warn when stock lasts fewer than this many days. */
  runwayDays: number;
  /** A dealer is "buying less" when the last 30 days drop by this % or more. */
  dropPct: number;
}
export const DEFAULT_INTEL_SETTINGS: IntelSettings = { lateDays: 3, runwayDays: 7, dropPct: 40 };

export function readIntelSettings(raw: unknown): IntelSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (k: keyof IntelSettings, min: number, max: number) => {
    const n = Number(r[k]);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : DEFAULT_INTEL_SETTINGS[k];
  };
  return { lateDays: pick("lateDays", 1, 60), runwayDays: pick("runwayDays", 1, 90), dropPct: pick("dropPct", 10, 90) };
}

export interface IntelAction {
  kind: string;
  subjectId: string;
  state: "done" | "snoozed" | "promised";
  untilDate: string | null;
  promisedAmount: number | null;
  createdAt: string; // ISO
}

export interface ReceiptLite { distributorId: string; amount: number; paidOn: string; status: string }

export type CardKind = "collect" | "order" | "dealer" | "stock" | "slow";

export interface IntelCard {
  kind: CardKind;
  /** Stable id used for Done / Remind me. */
  subjectId: string;
  dealerId?: string;
  title: string;
  salesperson?: string;
  fact: string;
  /** Rupees at stake — the one scale used to rank "Do these first". */
  score: number;
  why: string[];
  link: string;
  phone?: string;
  /** Extra values for the page (amounts for WhatsApp text, etc.). */
  meta?: Record<string, number | string | boolean>;
}

const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const isLive = (o: Order) => !o.cancelledAt;
/** Order value after offers, before GST — the same "sales" My Business uses. */
export const orderNet = (o: Order) => Math.max(0, (o.total || 0) - (o.schemeSavings || 0));

/** Latest salesperson who booked for each dealer. */
function salespersonByDealer(orders: Order[]) {
  const m = new Map<string, { date: string; name: string }>();
  for (const o of orders) {
    if (!isLive(o) || !o.salesperson) continue;
    const cur = m.get(o.distributorId);
    if (!cur || o.date > cur.date) m.set(o.distributorId, { date: o.date, name: o.salesperson });
  }
  return m;
}

// ── 1. Collect money ──────────────────────────────────────────────────────
export function collectQueue(input: {
  rows: ReceivableRow[];
  distributors: Distributor[];
  orders: Order[];
  receipts: ReceiptLite[];
  today: string;
  /** Advance money held per dealer (paid before a bill) — counts against what they owe. */
  advances?: Map<string, number>;
}): IntelCard[] {
  const { rows, distributors, orders, receipts, today, advances } = input;
  const dealers = new Map(distributors.map(d => [d.id, d]));
  const sp = salespersonByDealer(orders);
  const lastPaid = new Map<string, string>();
  for (const r of receipts) {
    if (r.status !== "posted") continue;
    const cur = lastPaid.get(r.distributorId);
    if (!cur || r.paidOn > cur) lastPaid.set(r.distributorId, r.paidOn);
  }
  const agg = new Map<string, { due: number; over30: number; oldest: number; bills: number }>();
  for (const r of rows) {
    if (r.due <= 0.5) continue;
    const a = agg.get(r.distributorId) || { due: 0, over30: 0, oldest: 0, bills: 0 };
    a.due += r.due;
    if (r.ageDays > 30) a.over30 += r.due;
    a.oldest = Math.max(a.oldest, r.ageDays);
    a.bills += 1;
    agg.set(r.distributorId, a);
  }
  // Advance money settles the oldest bills first.
  if (advances) for (const [id, a] of agg) {
    const adv = advances.get(id) || 0;
    if (adv <= 0) continue;
    a.due = Math.max(0, a.due - adv);
    a.over30 = Math.min(a.over30, a.due);
    if (a.due <= 0.5) agg.delete(id);
  }
  const cards: IntelCard[] = [];
  for (const [id, a] of agg) {
    const d = dealers.get(id);
    const paid = lastPaid.get(id);
    if (paid === today) continue; // they paid today — don't chase
    const sinceText = paid ? `last paid ${dayDiff(paid, today)} days ago` : "no payment recorded yet";
    const limitText = !d || d.creditMode === "unlimited" || !(d.creditLimit > 0)
      ? "No credit limit set"
      : d.creditMode === "cash_only" ? "Cash only dealer"
      : `${Math.round((a.due / d.creditLimit) * 100)}% of credit limit used`;
    cards.push({
      kind: "collect",
      subjectId: `collect:${id}`,
      dealerId: id,
      title: d?.name || rows.find(r => r.distributorId === id)?.distributorName || "Dealer",
      salesperson: sp.get(id)?.name,
      fact: `${inr(a.due)} unpaid · oldest bill ${a.oldest} days old`,
      score: a.over30 * (1 + a.oldest / 30),
      why: [
        `${a.bills} unpaid bill${a.bills === 1 ? "" : "s"} add up to ${inr(a.due)}.`,
        `${inr(a.over30)} of it is from bills older than 30 days.`,
        `Oldest unpaid bill: ${a.oldest} days. ${sinceText[0].toUpperCase()}${sinceText.slice(1)}.`,
        limitText + ".",
      ],
      link: `/distributors/${id}`,
      phone: d?.contact,
      meta: { due: Math.round(a.due), over30: Math.round(a.over30), oldest: a.oldest },
    });
  }
  return cards.sort((x, y) => y.score - x.score || (y.meta!.due as number) - (x.meta!.due as number));
}

// ── 2. Orders waiting to be sent ──────────────────────────────────────────
export function readyOrders(input: {
  orders: Order[];
  stockItems: StockItem[];
  settings: IntelSettings;
  today: string;
}): IntelCard[] {
  const { orders, stockItems, settings, today } = input;
  const stockAt = (productId: string, godownId?: string) =>
    stockItems
      .filter(s => s.productId === productId && (!godownId || s.godownId === godownId))
      .reduce((n, s) => n + Math.max(0, s.quantity), 0);
  const cards: IntelCard[] = [];
  for (const o of orders) {
    if (!isLive(o) || o.deliveryStatus !== "pending") continue;
    const age = dayDiff(o.date, today);
    if (age < settings.lateDays) continue;
    const need = new Map<string, number>();
    for (const l of o.lines) need.set(l.productId, (need.get(l.productId) || 0) + l.quantity);
    const nameOf = new Map(o.lines.map(l => [l.productId, l.productName] as const));
    const short = [...need]
      .filter(([pid, q]) => stockAt(pid, o.godownId) < q)
      .map(([productId, quantity]) => ({ productId, quantity, productName: nameOf.get(productId) || "" }));
    const ready = short.length === 0;
    cards.push({
      kind: "order",
      subjectId: `order:${o.id}`,
      dealerId: o.distributorId,
      title: `${o.orderNumber} · ${o.distributorName}`,
      salesperson: o.salesperson,
      fact: ready
        ? `Stock is ready, send now · waiting ${age} days`
        : `Stock is short for ${short.length} product${short.length === 1 ? "" : "s"} · waiting ${age} days`,
      score: ready ? orderNet(o) : 0,
      why: [
        `Booked on ${o.date}, not sent yet (${age} days). You asked to flag orders after ${settings.lateDays} days.`,
        ready
          ? "Every product on this order is in stock."
          : `Short: ${short.map(l => `${l.productName} (need ${l.quantity}, have ${stockAt(l.productId, o.godownId)})`).join(", ")}.`,
        `Order value ${inr(orderNet(o))} before GST.`,
      ],
      link: `/orders/${o.id}`,
      meta: { ready, age, value: Math.round(orderNet(o)) },
    });
  }
  return cards.sort((a, b) => Number(b.meta!.ready) - Number(a.meta!.ready) || b.score - a.score || (b.meta!.age as number) - (a.meta!.age as number));
}

// ── 3. Dealers buying less ────────────────────────────────────────────────
export function decliningDealers(input: {
  orders: Order[];
  distributors: Distributor[];
  settings: IntelSettings;
  today: string;
}): IntelCard[] {
  const { orders, distributors, settings, today } = input;
  const byDealer = new Map<string, Order[]>();
  for (const o of orders) {
    if (!isLive(o)) continue;
    const l = byDealer.get(o.distributorId) || [];
    l.push(o);
    byDealer.set(o.distributorId, l);
  }
  const names = new Map(distributors.map(d => [d.id, d]));
  const recentFrom = addDaysToKey(today, -30);
  const priorFrom = addDaysToKey(today, -120);
  const cards: IntelCard[] = [];
  for (const [id, list] of byDealer) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    if (list.length < 4 || dayDiff(list[0].date, today) < 60) continue; // not enough history
    const recent = list.filter(o => o.date > recentFrom).reduce((n, o) => n + orderNet(o), 0);
    const priorWindow = list.filter(o => o.date > priorFrom && o.date <= recentFrom);
    const priorDays = Math.min(90, dayDiff(list[0].date, recentFrom));
    if (priorDays < 30 || priorWindow.length === 0) continue;
    const priorMonthly = (priorWindow.reduce((n, o) => n + orderNet(o), 0) / priorDays) * 30;
    if (priorMonthly <= 0) continue;
    const drop = Math.round(((priorMonthly - recent) / priorMonthly) * 100);
    // Usual gap between orders
    const gaps: number[] = [];
    for (let i = 1; i < list.length; i++) gaps.push(dayDiff(list[i - 1].date, list[i].date));
    gaps.sort((a, b) => a - b);
    const usualGap = gaps[Math.floor(gaps.length / 2)] || 0;
    const sinceLast = dayDiff(list[list.length - 1].date, today);
    const lateReorder = usualGap > 0 && sinceLast >= 14 && sinceLast > usualGap * 2;
    if (drop < settings.dropPct && !lateReorder) continue;
    const d = names.get(id);
    cards.push({
      kind: "dealer",
      subjectId: `dealer:${id}`,
      dealerId: id,
      title: d?.name || list[0].distributorName,
      salesperson: list[list.length - 1].salesperson,
      fact: drop >= settings.dropPct
        ? `Bought ${drop}% less in the last 30 days`
        : `No order for ${sinceLast} days (usually every ${usualGap})`,
      score: Math.max(0, priorMonthly - recent),
      why: [
        `Last 30 days: ${inr(recent)}. Usual for 30 days: about ${inr(priorMonthly)} (from the 90 days before).`,
        `Last order ${sinceLast} days ago. Usually orders every ${usualGap} days.`,
        `Flagged when sales drop ${settings.dropPct}% or more, or the dealer is twice as late as usual.`,
      ],
      link: `/distributors/${id}`,
      phone: d?.contact,
      meta: { drop, sinceLast, usualGap },
    });
  }
  return cards.sort((a, b) => b.score - a.score);
}

// ── 4. Stock running out / slow stock ─────────────────────────────────────
export function stockRunway(input: {
  orders: Order[];
  stockItems: StockItem[];
  products: Product[];
  settings: IntelSettings;
  today: string;
}): { low: IntelCard[]; slow: IntelCard[]; historyDays: number } {
  const { orders, stockItems, products, settings, today } = input;
  const from30 = addDaysToKey(today, -30);
  const sold30 = new Map<string, number>();
  const lastSold = new Map<string, string>();
  let firstOrder: string | null = null;
  for (const o of orders) {
    if (!isLive(o)) continue;
    if (!firstOrder || o.date < firstOrder) firstOrder = o.date;
    if (o.deliveryStatus === "pending" || !o.dispatchDate || o.dispatchDate > today) continue;
    for (const l of o.lines) {
      if (o.dispatchDate > from30) sold30.set(l.productId, (sold30.get(l.productId) || 0) + l.quantity);
      const cur = lastSold.get(l.productId);
      if (!cur || o.dispatchDate > cur) lastSold.set(l.productId, o.dispatchDate);
    }
  }
  const byProduct = new Map<string, StockItem[]>();
  for (const s of stockItems) {
    const l = byProduct.get(s.productId) || [];
    l.push(s);
    byProduct.set(s.productId, l);
  }
  const low: IntelCard[] = [];
  const slow: IntelCard[] = [];
  const historyDays = firstOrder ? dayDiff(firstOrder, today) : 0;
  for (const p of products) {
    const items = byProduct.get(p.id) || [];
    if (items.length === 0) continue;
    const qty = items.reduce((n, s) => n + Math.max(0, s.quantity), 0);
    const sold = sold30.get(p.id) || 0;
    const godowns = items.map(s => `${s.godownName}: ${s.quantity}`).join(", ");
    if (sold > 0) {
      const windowDays = Math.min(30, Math.max(1, historyDays));
      const perDay = sold / windowDays;
      const days = qty / perDay; // fractional; shown rounded down
      if (days < settings.runwayDays) {
        low.push({
          kind: "stock",
          subjectId: `stock:${p.id}`,
          title: p.name,
          fact: qty <= 0 ? "Out of stock" : days < 1 ? "Less than 1 day of stock left" : `About ${Math.floor(days)} day${Math.floor(days) === 1 ? "" : "s"} of stock left`,
          score: sold * (p.basePrice || 0),
          why: [
            `Sent ${sold} ${p.unit || "units"} in the last ${windowDays} days (about ${perDay.toFixed(1)} a day).`,
            `In stock now: ${qty} (${godowns}).`,
            `You asked to be warned under ${settings.runwayDays} days. This is an estimate based on the last ${windowDays} days.`,
          ],
          link: "/stock",
          meta: { qty, sold, days },
        });
      }
    } else if (qty > 0 && historyDays >= 60) {
      const last = lastSold.get(p.id);
      const since = last ? dayDiff(last, today) : null;
      if (since === null || since >= 60) {
        slow.push({
          kind: "slow",
          subjectId: `slow:${p.id}`,
          title: p.name,
          fact: since === null ? `${qty} in stock, never sent to a dealer` : `${qty} in stock, no sale for ${since} days`,
          score: 0,
          why: [
            since === null ? "No order with this product has been sent yet." : `Last sent to a dealer ${since} days ago.`,
            `In stock now: ${qty} (${godowns}).`,
          ],
          link: "/stock",
          meta: { qty, value: Math.round(qty * (p.basePrice || 0)) },
        });
      }
    }
  }
  low.sort((a, b) => (a.meta!.days as number) - (b.meta!.days as number) || b.score - a.score);
  slow.sort((a, b) => (b.meta!.value as number) - (a.meta!.value as number));
  return { low, slow, historyDays };
}

// ── Handled cards (Done / Remind me / Promised) ───────────────────────────
/**
 * A card stays hidden while its latest action applies:
 * - snoozed / promised: until the chosen date has passed
 * - done: until something new happens (lastEvent after the action day)
 */
export function isHidden(card: IntelCard, actions: IntelAction[], today: string, lastEvent?: string): boolean {
  const latest = actions
    .filter(a => a.subjectId === card.subjectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!latest) return false;
  if (latest.state === "snoozed" || latest.state === "promised") {
    return !!latest.untilDate && latest.untilDate >= today;
  }
  const actedOn = latest.createdAt.slice(0, 10);
  // Stock cards have no money events, so "Done" lasts 7 days, then the card can come back.
  if (!card.dealerId) return dayDiff(actedOn, today) < 7;
  return !(lastEvent && lastEvent > actedOn);
}

/** Top 3 across everything, at most one card per dealer. */
export function rankTop3(cards: IntelCard[]): IntelCard[] {
  const seen = new Set<string>();
  const out: IntelCard[] = [];
  for (const c of [...cards].filter(c => c.score > 0).sort((a, b) => b.score - a.score)) {
    if (c.dealerId) {
      if (seen.has(c.dealerId)) continue;
      seen.add(c.dealerId);
    }
    out.push(c);
    if (out.length === 3) break;
  }
  return out;
}

// ── Forecast for My Business ──────────────────────────────────────────────
export interface MonthForecast { soFar: number; expected: number; low: number; high: number; lastMonthSameDay: number; day: number; daysInMonth: number }

/** Sales this month (after offers, before GST). Only from day 7 of the month. */
export function monthForecast(orders: Order[], today: string): MonthForecast | null {
  const [y, m, d] = today.split("-").map(Number);
  if (d < 7) return null;
  const daysInMonth = new Date(y, m, 0).getDate();
  const monthKey = today.slice(0, 7);
  const prev = new Date(y, m - 2, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const daily = new Array(d).fill(0);
  let lastMonthSameDay = 0;
  for (const o of orders) {
    if (!isLive(o)) continue;
    if (o.date.startsWith(monthKey)) {
      const day = Number(o.date.slice(8, 10));
      if (day <= d) daily[day - 1] += orderNet(o);
    } else if (o.date.startsWith(prevKey) && Number(o.date.slice(8, 10)) <= d) {
      lastMonthSameDay += orderNet(o);
    }
  }
  const soFar = daily.reduce((a, b) => a + b, 0);
  const mean = soFar / d;
  const sd = Math.sqrt(daily.reduce((n, v) => n + (v - mean) ** 2, 0) / d);
  const remaining = daysInMonth - d;
  const spread = sd * Math.sqrt(remaining);
  const expected = soFar + mean * remaining;
  return { soFar, expected, low: Math.max(soFar, expected - spread), high: expected + spread, lastMonthSameDay, day: d, daysInMonth };
}

// ── My Business charts ────────────────────────────────────────────────────
export interface WeekPoint { start: string; end: string; sales: number }

/** Sales per 7-day block, oldest first, ending yesterday (today is unfinished). */
export function weeklySales(orders: Order[], today: string, weeks = 26): WeekPoint[] {
  const end0 = addDaysToKey(today, -1);
  const pts: WeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = addDaysToKey(end0, -7 * i);
    pts.push({ start: addDaysToKey(end, -6), end, sales: 0 });
  }
  const first = pts[0].start;
  for (const o of orders) {
    if (!isLive(o) || o.date < first || o.date > end0) continue;
    const idx = weeks - 1 - Math.floor(dayDiff(o.date, end0) / 7);
    if (idx >= 0 && idx < weeks) pts[idx].sales += orderNet(o);
  }
  return pts;
}

export interface WeekForecast {
  ok: true;
  history: WeekPoint[];          // last 8 complete weeks
  next: { start: string; end: string; expected: number }[];
  total: number;
  /** Range from backtesting the same 4-week forecast on past data; null until 3 backtests exist. */
  range: { low: number; high: number; checks: number } | null;
  uncertain: boolean;
}
export interface ForecastNotReady { ok: false; reason: "no_sales" | "few_weeks" | "few_sale_weeks"; have: number; need: number }

const sumSales = (ws: WeekPoint[]) => ws.reduce((n, w) => n + w.sales, 0);

/**
 * Next 4 weeks = 4 × average of the last 8 weeks. The range comes from how wrong
 * this exact 4-week forecast was on earlier periods (backtest), never guessed.
 */
export function forecastNext4Weeks(orders: Order[], today: string): WeekForecast | ForecastNotReady {
  const all = weeklySales(orders, today, 52);
  const firstIdx = all.findIndex(w => w.sales > 0);
  if (firstIdx < 0) return { ok: false, reason: "no_sales", have: 0, need: 5 };
  const usable = all.slice(firstIdx);
  const saleWeeks = usable.filter(w => w.sales > 0).length;
  if (saleWeeks < 5) return { ok: false, reason: "few_sale_weeks", have: saleWeeks, need: 5 };
  if (usable.length < 6) return { ok: false, reason: "few_weeks", have: usable.length, need: 6 };
  const history = usable.slice(-8);
  const mean = sumSales(history) / history.length;
  if (mean <= 0) return { ok: false, reason: "few_sale_weeks", have: 0, need: 5 };
  const errs: number[] = [];
  for (let i = 8; i + 4 <= usable.length; i++) {
    const predicted = (sumSales(usable.slice(i - 8, i)) / 8) * 4;
    if (predicted > 0) errs.push(Math.abs(sumSales(usable.slice(i, i + 4)) - predicted) / predicted);
  }
  errs.sort((a, b) => a - b);
  const total = mean * 4;
  const range = errs.length >= 3
    ? (() => { const e = errs[Math.min(errs.length - 1, Math.ceil(errs.length * 0.8) - 1)]; return { low: Math.max(0, total * (1 - e)), high: total * (1 + e), checks: errs.length }; })()
    : null;
  const sd = Math.sqrt(history.reduce((n, w) => n + (w.sales - mean) ** 2, 0) / history.length);
  const last = history[history.length - 1].end;
  const next = [1, 2, 3, 4].map(k => {
    const end = addDaysToKey(last, 7 * k);
    return { start: addDaysToKey(end, -6), end, expected: mean };
  });
  return { ok: true, history, next, total, range, uncertain: sd / mean > 0.5 };
}

export interface BarItem { id: string; label: string; value: number; note?: string; link?: string }

/** Top dealers by unpaid amount, from the same bill-by-bill rows as the Unpaid tile. */
export function topUnpaidDealers(rows: ReceivableRow[], limit = 5): { items: BarItem[]; total: number; dealers: number } {
  const m = new Map<string, { name: string; due: number; bills: number }>();
  for (const r of rows) {
    if (r.due <= 0) continue;
    const cur = m.get(r.distributorId) || { name: r.distributorName, due: 0, bills: 0 };
    cur.due += r.due; cur.bills += 1;
    m.set(r.distributorId, cur);
  }
  const all = [...m.entries()].sort((a, b) => b[1].due - a[1].due);
  return {
    items: all.slice(0, limit).map(([id, v]) => ({
      id, label: v.name, value: Math.round(v.due * 100) / 100,
      note: `${v.bills} bill${v.bills === 1 ? "" : "s"}`, link: `/distributors/${id}`,
    })),
    total: Math.round(all.reduce((n, [, v]) => n + v.due, 0) * 100) / 100,
    dealers: all.length,
  };
}

export interface PairItem { id: string; label: string; before: number; now: number; link: string }

/** Dealers buying less: previous 30 days vs last 30 days, ranked by rupee drop. New dealers skipped. */
export function buyingLessPairs(orders: Order[], today: string, limit = 5): { items: PairItem[]; from: string; mid: string; to: string } {
  const y = addDaysToKey(today, -1);
  const recentFrom = addDaysToKey(y, -30);
  const priorFrom = addDaysToKey(y, -60);
  const m = new Map<string, { name: string; before: number; now: number; first: string }>();
  for (const o of orders) {
    if (!isLive(o) || o.date > y) continue;
    const cur = m.get(o.distributorId) || { name: o.distributorName, before: 0, now: 0, first: o.date };
    if (o.date < cur.first) cur.first = o.date;
    if (o.date > recentFrom) cur.now += orderNet(o);
    else if (o.date > priorFrom) cur.before += orderNet(o);
    m.set(o.distributorId, cur);
  }
  const items = [...m.entries()]
    .filter(([, v]) => v.first <= priorFrom && v.before > v.now)
    .sort((a, b) => (b[1].before - b[1].now) - (a[1].before - a[1].now))
    .slice(0, limit)
    .map(([id, v]) => ({ id, label: v.name, before: v.before, now: v.now, link: `/distributors/${id}` }));
  return { items, from: addDaysToKey(priorFrom, 1), mid: recentFrom, to: y };
}

export interface ClaimLite { status: string; createdAt: string; lines: { productId: string; productName: string; quantity: number }[] }

/** Products returned most (by quantity) in the last `days` days. Rejected returns don't count. */
export function topReturnedProducts(claims: ClaimLite[], today: string, days = 90, limit = 5): BarItem[] {
  const from = addDaysToKey(today, -days);
  const m = new Map<string, { name: string; qty: number }>();
  for (const c of claims) {
    const d = c.createdAt.slice(0, 10);
    if (c.status === "rejected" || d <= from || d > today) continue;
    for (const l of c.lines) {
      const cur = m.get(l.productId) || { name: l.productName, qty: 0 };
      cur.qty += l.quantity;
      m.set(l.productId, cur);
    }
  }
  return [...m.entries()].filter(([, v]) => v.qty > 0).sort((a, b) => b[1].qty - a[1].qty).slice(0, limit)
    .map(([id, v]) => ({ id, label: v.name, value: v.qty }));
}
