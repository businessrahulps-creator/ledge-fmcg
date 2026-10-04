import {
  House, ClipboardList, UserRound, Package, ChartNoAxesCombined, Settings, UserCheck,
  Gift, Target, RotateCcw, Landmark, Wallet, ListTodo, ShoppingBasket, Store, FileBarChart, History,
} from "lucide-react";
import type { CapabilityKey } from "@/hooks/useCan";

/**
 * The one menu definition used by the computer sidebar, the phone bottom bar
 * and the phone Menu sheet, so their order and names can never drift.
 */
export type NavItem = { title: string; url: string; icon: React.ElementType; cap?: CapabilityKey };
export type NavGroup = { label: string | null; items: NavItem[] };

export const NAV = {
  dashboard: { title: "Dashboard", url: "/dashboard", icon: House },
  today: { title: "Today's work", url: "/today", icon: ListTodo, cap: "see_money" },
  orders: { title: "Orders", url: "/orders", icon: ClipboardList },
  visits: { title: "Shop visits", url: "/visits", icon: Store },
  billing: { title: "Money to Collect", url: "/billing", icon: Wallet, cap: "see_money" },
  returns: { title: "Returns", url: "/claims", icon: RotateCcw, cap: "see_money" },
  buying: { title: "Buying", url: "/buying", icon: ShoppingBasket, cap: "manage_buying" },
  stock: { title: "Stock", url: "/stock", icon: Package },
  schemes: { title: "Offers & schemes", url: "/schemes", icon: Gift },
  targets: { title: "Targets", url: "/targets", icon: Target },
  dealers: { title: "Dealers", url: "/distributors", icon: UserRound },
  team: { title: "Sales Team", url: "/salespersons", icon: UserCheck },
  company: { title: "Company", url: "/company", icon: Landmark, cap: "manage_business" },
  business: { title: "My Business", url: "/command", icon: ChartNoAxesCombined, cap: "see_money" },
  activity: { title: "Activity", url: "/activity", icon: History, cap: "see_money" },
  reports: { title: "Reports", url: "/reports", icon: FileBarChart },
  settings: { title: "Settings", url: "/settings", icon: Settings, cap: "manage_team" },
} satisfies Record<string, NavItem>;

/** Main menu, top to bottom. Dashboard is always first, on its own. */
export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [NAV.dashboard] },
  { label: "Work", items: [NAV.today, NAV.orders, NAV.visits, NAV.billing, NAV.returns, NAV.buying] },
  { label: "Products", items: [NAV.stock, NAV.schemes, NAV.targets] },
  { label: "People", items: [NAV.dealers, NAV.team, NAV.company] },
  { label: "Insights", items: [NAV.business, NAV.activity, NAV.reports] },
];

// Settings lives in the top-bar account menu on computers (ProfileMenu); phone Menu lists it via its own groups.
export const NAV_FOOTER: NavItem[] = [];

/** Phone bottom bar (Menu button is added after these). Dashboard first. */
export const MOBILE_PRIMARY: NavItem[] = [NAV.dashboard, NAV.orders, NAV.stock, NAV.business];
/** Fills the 4th slot for people who can't open My Business. */
export const MOBILE_FALLBACK: NavItem = NAV.dealers;
